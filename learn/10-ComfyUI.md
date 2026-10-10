# 10 · ComfyUI 图像生成

ComfyUI 模块负责「把工作流参数化，然后调用外部 ComfyUI 服务出图」。
它同时提供 UI 入口与 LLM 工具入口。

> 📌 本篇已按 `1.3.5.0` 复核。主要变化：
> **Civitai 下载的命令注入面已修复**（`execSync` 拼字符串 → `execFileSync` 传数组）；
> 模型下载改为**后台任务**（`task_provider` + `tasks.manager`）；
> `model_select` 的默认 `type` **已改为 `diffusion_model`**；
> 确认 ComfyUI **不是** model-processer。

---

## 1. 数据模型

三张表（`src/comfyui/server/schema.ts`）：

### `comfyui_model` —— 模型文件登记

| 列             | 说明                                                               |
| -------------- | ------------------------------------------------------------------ |
| `id`           | PK                                                                 |
| `code`         | 编码（Civitai 导入时用 `fileName` 作为逻辑主键）                   |
| `name`         | 显示名                                                             |
| `type`         | `vae` / `diffusion_model` / `lora` / `text_encoder` / `checkpoint` |
| `cover`        | 封面图                                                             |
| `path`         | 相对路径                                                           |
| `url` / `html` | 来源信息                                                           |
| `model`        | 基础模型（如 `SDXL 1.0`）                                          |
| `download`     | 下载地址                                                           |
| `importer`     | 导入器 id（如 `civitai`）                                          |
| `properties`   | json                                                               |

索引：`code` / `name` / `type` 三个。

### `comfyui_workflow` —— 工作流

| 列                     | 说明                           |
| ---------------------- | ------------------------------ |
| `id`                   | PK                             |
| `name` / `description` | 名称与描述                     |
| `content`              | **ComfyUI API 格式 JSON 文本** |
| `properties`           | json                           |

工作流的输入类型：

```ts
export interface ComfyUIWorkflowInput {
  [nodeId: string]: {
    inputs: Record<string, any>;
    class_type: string;
    _meta: { title: string };
  };
}
```

### `comfyui_param` —— 参数（复合主键）

| 列         | 说明                               |
| ---------- | ---------------------------------- |
| `masterId` | → `comfyui_workflow.id`（cascade） |
| `sequence` | 序号                               |
| `type`     | 配置器 id                          |
| `name`     | 参数名                             |
| `config`   | json                               |

主键为 `(masterId, sequence)`。

---

## 2. 参数配置器（Configurator）

这是模块的核心抽象 —— 把「工作流节点」翻译成「用户/LLM 可填的参数」。

```ts
// src/comfyui/client/configurator.ts
export interface ComfyUIParamConfigurator<T = any> extends Registerable {
  configureObject?: (data: FormData, param: ComfyUIParam<T>) => Promise<void>;
  configureInput?: (
    data: FormData,
    param: ComfyUIParam<T>,
    input: ComfyUIWorkflowInput,
  ) => Promise<void>;
  configureSchema?: (
    param: ComfyUIParam<T>,
    paint: AutoPaintConfig,
    schema: JsonSchema,
  ) => Promise<void>;
  generateCalling?: (
    param: ComfyUIParam<T>,
    paint: AutoPaintConfig,
    input: ComfyUIWorkflowInput,
    args: any,
  ) => Promise<void>;
}
```

四个钩子对应四个场景：

| 钩子              | 从哪 → 到哪                                     |
| ----------------- | ----------------------------------------------- |
| `configureObject` | 参数编辑表单 → `param.config`                   |
| `configureInput`  | **生图对话框表单** → workflow input（直接改写） |
| `configureSchema` | 参数 → **工具 JSON Schema**（暴露给 LLM）       |
| `generateCalling` | **LLM 工具实参** → workflow input               |

注册表名 `comfyui-param-configurator`，注册了 7 个配置器：

`callbacks`、`select`、`model_select`、`power_lora_select`、`text`、`agent_text`、`number`。

---

## 3. 参数自动发现

`POST /api/comfyuis/workflows/{id}/params/generate` 扫描工作流 JSON，
按节点特征自动生成参数：

| 识别特征                                       | 生成的参数                                                   |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `inputs['unet_name']`                          | `model_select`（`type: 'diffusion_model'`，key `unet_name`） |
| `_meta.title` 以 `positive` 开头且有 `text`    | `llm_text_editor`（提示词编辑）                              |
| `class_type === 'Power Lora Loader (rgthree)'` | `power_lora_select`（扫描 `lora_1..lora_10`）                |
| `class_type === 'Form Post Request Node'`      | `image_callback`（图片回传）                                 |

`push()` 按 `(name, type)` 幂等，避免重复生成。

---

## 4. 两条执行路径

### 路径 A：UI 生图对话框

`src/comfyui/client/feature.tsx` 的 `Generator`（`id: 'comfyui'`, `sequence: 10`）：

```ts
1. 解析 workflow.content 得到 input 对象
2. 对每个 param：configurators.registry.record(param.type).configureInput?.(data, param, input)
3. comfyuis.proxy.generate(input)
```

`proxy.generate` **不经过本应用的任何业务 API 路由**：

```ts
// src/comfyui/client/proxy.ts
globals.proxy.fetch({
  method: 'POST',
  url: `${setting.url}/prompt`, // ← 直连 ComfyUI
  body: JSON.stringify({ client_id: setting.client, prompt }),
});
```

它通过 `/api/proxy` 做服务端转发以绕过 CORS。

### 路径 B：LLM 工具

`src/comfyui/client/tool.tsx` 把生图封装成一个工具：

```ts
painter(config) {
  // 1. 对未禁用的 param 依序调用 configureSchema，拼出工具 JSON Schema
  // 2. invoke(args) 时重新拉取 workflow/params
  // 3. 逐个调用 generateCalling(param, paintParam, input, args) 填充 input
  // 4. proxy.generate(input)
  // 5. 返回 JSON.stringify(response)（异常也序列化为字符串）
}
```

同时暴露辅助工具 `comfyui_model_fetcher` 供 LLM 查询可用模型。

---

## 5. 图片回传故事图集

这是两条路径共用的机制。

`src/comfyui/callback/client/index.tsx` 在 `configureInput` 与 `generateCalling` 中
向工作流节点注入回调地址：

```ts
inputs['target_url'] = `${getBaseUrl()}/api/stories/${realm.id}/image`;
```

即：**ComfyUI 生成完成后，由工作流的 `Form Post Request Node`
把图片 POST 回本应用的 `/api/stories/{id}/image`**，
自动落库为故事图片条目。

所以「故事图片 ≠ ComfyUI 生成的图片」：后者通过回调变成前者，
二者是生产者/消费者关系。

---

## 6. 模型导入与下载

### Civitai 导入（客户端）

`src/comfyui/civitai/client/index.tsx`：

1. 输入 `model_id` 或 `model_version_id`；
2. 请求 `https://civitai.com/api/v1/models/{id}` 或 `/api/v1/model-versions/{id}`
   （**前端直连，未经代理**）；
3. `_extract()` 把每个版本的每个 file 展开为一条 `ComfyUIModel`：

```ts
{
  code: fileName,                                  // 逻辑主键
  type: civitais.type.map[...],                    // Checkpoint/Diffusion Model/LORA/TextEncoder/VAE
  download: meta.downloadUrl,
  cover: images[0].url,
  model: meta.baseModel,
  importer: 'civitai',
}
```

4. `proxy.model.import(items)` 打到后端的去重导入端点（存在则 update）。

### 下载（服务端）

`POST /api/comfyuis/models/[id]/download` **不再直接下载**，而是起一个后台任务：

```ts
// src/comfyui/server/api-models.ts
download: {
  POST: route(async (_, records) => {
    const { id } = await records.params;
    const { model } = await getDownloadParams(id);      // ⭐ 先校验参数
    await tasks.manager.create<ModelDownloadArgs>(
      `download ${model.code}`,                          // 任务展示名
      { provider: importers.tasks.id, id },              // args: { provider, id }
    );
    return response.null();                              // 立即返回，不阻塞
  }),
},
```

参数校验（`getDownloadParams`）在**入队前**就做完，并按类型映射目录：

| type              | 目录               |
| ----------------- | ------------------ |
| `vae`             | `vae`              |
| `diffusion_model` | `diffusion_models` |
| `lora`            | `loras`            |
| `text_encoder`    | `text_encoders`    |
| `checkpoint`      | `checkpoints`      |
| 未知              | `loras`（回退）    |

真正的执行者是注册在 `task_provider` 上的 `importers.tasks`：

```ts
// src/comfyui/server/importers.ts
const tasks: TaskProvider<ModelDownloadArgs> = {
  id: 'comfyui-model-download',
  async execute(args) {
    try {
      const { model, filename } = await getDownloadParams(args.id);
      if (await fileUtils.exists(filename)) {
        throw new BusinessError('file is exists.', 'comfyui.file_exists');
      }
      const importer = registry.record(model.importer);
      if (importer) await importer.download(model, filename);
      else await fileUtils.download(model.download!, filename);

      signals.toast({ type: 'success', message: 'message.comfyui.download.success', data: { path: model.path } });
    } catch (error) {
      signals.toast({ type: 'error', message: 'error.comfyui.download_failed', data: { message: ... } });
      throw error;      // ⭐ 再抛，让任务状态变成 failed 并留下 result
    }
  },
};
```

三个由此产生的行为：

- **重复下载不再靠单点检查**：文件存在时抛 `comfyui.file_exists`，
  这次任务标记为 `failed`。也就是说「重复点击下载」会产生一条失败记录，
  而不是静默跳过。
- **成功/失败通过 SSE `toast` 推给所有已连接的前端**
  （`signals.toast` → `sse-manager` → 客户端 `toast` 回调）。
- **任务状态落库**（见 [17-任务与调度](./17-任务与调度.md)），
  所以下载历史的失败原因可以在「任务」菜单里回看。

导入器注册表名 `comfyui-model-importer`（客户端与服务端各一个半边：
客户端负责**配置 UI 与元数据映射**，服务端负责**真正下载文件**），
无 importer 时回退 `fileUtils.download`。

### ✅ Civitai 下载的命令注入面（已修复）

`1.3.2.8` 时的写法是：

```ts
// 旧
const command = `curl -L -o "${filename}" "${model.download}${token ? `?token=${token}` : ''}"`;
execSync(command);   // ⚠️ 路径与 URL 均未转义，直接进 shell
```

现在是：

```ts
// src/comfyui/civitai/server/index.ts
export const importer: ModelImporter = {
  id: main.name,
  async download(model, filename): Promise<void> {
    await fileUtils.mkdir(path.dirname(filename));
    const urlStr = checker.notNullOrWhitespace('download', model.download, 'civitai');
    const url = new URL(urlStr);            // ⭐ 先解析，非法 URL 直接抛
    try {
      const token = process.env.CIVITAI_TOKEN;
      const isOfficial =
        url.hostname === 'civitai.com' || url.hostname.endsWith('.civitai.com');
      if (token && isOfficial) url.searchParams.set('token', token);

      const command = `curl -L -o "${filename}" "${url}"`;   // 仅用于日志
      console.info(`[command] ${command}`);
      execFileSync('curl', ['-L', '-o', filename, url.toString()]);   // ⭐ 无 shell
    } catch (err) { /* … */ }
  },
};
```

修复要点有四个，都值得学：

1. **`execSync(cmd)` → `execFileSync('curl', [args])`**：
   不再经过 shell，参数数组天然免疫引号/分号注入。
2. **`new URL()` 先规范化再使用**：URL 里的恶意字符会被转义或解析失败。
3. **token 只在官方域名上附加**（`isOfficial` 判断），
   避免把 `CIVITAI_TOKEN` 泄露给任意第三方域名 —— 这是旧版没有的一层。
4. `checker.notNullOrWhitespace('download', ...)` 让空 URL 明确报错。

> 📌 旧笔记把这条列为「值得修的注入面」，作者也确实修了，
> 而且不只是「换个 API」——顺带补上了 token 的域名白名单。
> 这是本轮复核里**质量最高的一处修复**。

> ⚠️ 留在原地的部分：`filename` 仍然来自
> `setting.directory + 类型目录 + model.path`，而 `model.path` 是
> 可从导入数据（Civitai API 响应）来的字符串。
> 由于不再过 shell，这已经不是「命令注入」，但仍是**路径穿越**
> （`../../` 之类）的潜在面，取决于 `model.path` 的来源可信度。

---

## 7. 工作流导入导出

ZIP 包，内含两个文件：

- `workflow.json` —— 工作流内容
- `meta.json` —— `PortModel { workflow: ComfyUIWorkflow; params: ComfyUIParam[] }`

```ts
// exportProcess：把 content 写入独立文件，meta 中置 undefined 并清空 id
// importProcess：用 archive.get.fuzzy(nodes, 'workflow.') 回填
```

导入端点接收 `multipart/form-data` 的 `file`，
创建 workflow 后用 `param.make(id, model.params)` 批量写入参数。

---

## 8. API 端点

| 方法               | 路径                                                   |
| ------------------ | ------------------------------------------------------ |
| GET / POST         | `/api/comfyuis/models`                                 |
| POST               | `/api/comfyuis/models/import`                          |
| GET / PUT / DELETE | `/api/comfyuis/models/{id}`                            |
| POST               | `/api/comfyuis/models/{id}/download`                   |
| GET / POST         | `/api/comfyuis/workflows`                              |
| POST               | `/api/comfyuis/workflows/import`                       |
| GET / PUT / DELETE | `/api/comfyuis/workflows/{id}`                         |
| POST               | `/api/comfyuis/workflows/{id}/clone`                   |
| GET                | `/api/comfyuis/workflows/{id}/export`                  |
| POST               | `/api/comfyuis/workflows/{id}/params/generate`         |
| GET / POST         | `/api/comfyuis/workflows/{id}/params`                  |
| GET / PUT / DELETE | `/api/comfyuis/workflows/{id}/params/{sequence}`       |
| POST               | `/api/comfyuis/workflows/{id}/params/{sequence}/clone` |

---

## 9. 客户端状态

```ts
useComfyUIModelSettingState; // persist → dbStorage，key 'comfyuis.model.setting'
// 默认 { directory: '/home/user/comfyui/models', client: 'secyud-tavern', url: 'http://localhost:8188' }
useComfyUIState; // persist → ⚠️ localStorage，仅 page
useComfyUIModelState / useComfyUIWorkflowState / useComfyUIParamState;
// 基于 states.createFetch
```

---

## 10. 已知问题（`1.3.5.0` 复核）

1. **持久化介质不统一**：模型设置用 `dbStorage`（后端 settings 表），
   而 `useComfyUIState` 用 localStorage。
2. **`proxy.generate` 响应未做错误处理**：ComfyUI 返回错误对象时，
   `feature.tsx` 直接解构 `prompt_id` 会得到 undefined。
3. ~~`model_select` 的默认 `type` 是 `'unet'`~~ → ✅ **已改为 `'diffusion_model'`**
   （`src/comfyui/select/index.ts` 的 `defaultModelSelectConfig.type`）。
   自动发现路径也传 `'diffusion_model'`，两处现在一致。
4. **`power_lora_select` 整体替换节点 inputs**，
   只保留 `model` / `PowerLoraLoaderHeaderWidget` / `'➕ Add Lora'`，
   节点上的其他输入会被丢弃。
5. **`configureInput` 写入的是 `name`（路径）而非 `value`（id）** —— 测试用例
   `tests/comfyui/select.test.ts` 明确记录了这一语义，并验证未使用的 `lora_i`
   必须 `delete`（避免上次残留）。
   > laotu：这点确实可能令人困惑，主要我这个程序的主键是uuid，但是confyui识别的是本地模型路径
6. ~~Civitai 下载的 shell 命令注入面~~ → ✅ **已修复**（见 §6）。
7. **Civitai 客户端直连**：`src/comfyui/civitai/client/index.tsx` 直接请求
   `https://civitai.com/api/v1/...`，未经 `/api/proxy`，可能受 CORS 影响。
8. **下载任务的重复点击会产生失败记录**：文件已存在时抛
   `comfyui.file_exists`，任务状态记为 `failed`。功能上安全，
   但任务列表里会堆积「失败」条目，容易被误读成真故障。
9. **`model.path` 仍是路径拼接的输入**：命令注入已消除，
   但 `../` 之类的路径穿越未做校验（见 §6 末尾）。

> laotu：未细察，但是我做过提成测试，流程方面应该没问题

---

## 11. 本章速查

- 工作流存在哪？`comfyui_workflow.content`，是 ComfyUI 的 API 格式 JSON。
- 参数怎么来？自动发现（按节点特征）或手工添加，每个参数绑定一个配置器。
- 怎么出图？两条路：UI 对话框（`configureInput`）或 LLM 工具（`generateCalling`）。
- 图片存哪？ComfyUI 回调 `/api/stories/{id}/image`，成为故事图片条目。
- 想加新参数类型？写一个 configurator 并注册，实现那四个钩子里需要的部分。
- 模型怎么下载？`POST .../download` 只入队，真正的活在
  `task_provider` 的 `comfyui-model-download` 里干（见 [17 篇](./17-任务与调度.md)）。
- 下载进度怎么看？任务菜单；成功/失败另有 SSE `toast` 即时提示。
