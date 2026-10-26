# 10 · 思维分析Agent：造一个子智能体

> **对应预设**：`docs/templates/root/思维分析Agent/`（id `agent_mind`，1 个条目）｜**前置**：[02](./02-默认设置-工具与开关.md)｜**难度**：★★
> **你将得到**：一个"子智能体"——主模型调用它，它用自己的预设与模型跑一次小对话，只返回一段文本。

---

## 一、引言

主模型一次要干太多事：推进剧情、守设定、调工具、还要"站在角色立场想问题"。
把这些混在一个提示词里，结果通常是每件都做一半。

**子智能体**是另一种切法：把"某一件需要独立视角的事"交给一次**独立的生成**——
它有自己的一套预设（提示词）、自己的模型、自己的入参，只把结论交回主模型。
`思维分析Agent` 是这个模式的最小实现：**整个预设只有一条 prompt**。

---

## 二、教学目的

- [ ] 会配一个 `agent` 型工具（`code` / `schema` / `model` / `presets`）
- [ ] 会写"子预设"：一条 `last: true` + `role: user` 的 prompt
- [ ] 知道入参怎么传进去（摊平成 `it.<参数>`）
- [ ] 理解 `disablePreset` / `disableTags` 与"子 agent 不能再开 agent"的限制
- [ ] 知道导出时子预设与模型会被一起打包

---

## 三、理论

### 3.1 子 agent 就是"一次完整的生成"

```
主模型 → 调用工具 <config.code>（带参数）
      → 用 config.presets + config.model 组一个临时 realm
      → 跑一次 models.processers.generate（和正常回合一样的管线）
      → 把 output.content 作为工具结果返回给主模型
```

所以子 agent 会**完整地**经历：宏渲染、世界书注入、工具（它自己可用的）、模型调用。
它不是一个"函数调用"，是"另一个小回合"。

### 3.2 `agent` 工具的配置

> 📦 **备注 · `AgentConfig` 字段**
>
> | 字段            | 说明                                                          |
> | --------------- | ------------------------------------------------------------- |
> | `code`          | 工具名（模型看到的名字）                                      |
> | `description`   | 工具说明（模型决定要不要调它）                                |
> | `schema`        | JSON Schema **文本**，定义入参                                |
> | `model`         | `{ name, value }`，子 agent 用哪个模型；`null` 表示沿用主模型 |
> | `presets`       | 子 agent 用的预设列表 `[{ name, value(id) }]`                 |
> | `disablePreset` | `true` = **不继承**主故事的预设，只用 `presets` 里列的        |
> | `disableTags`   | 继承来的预设里，凡带这些 tag 的都被剔除（比如 `theme`）       |
>
> 工具条目本身还是 `{ type: "agent", macro?, config, disabled, name }`；
> `macro` 可选（模板里写成 `false`，等于不绑开关）。

### 3.3 子预设：一条 prompt 就够

`agent_mind` 的全部内容：

```json
{
  "code": "rules",
  "content": "$file$prompt.content.md",
  "disabled": false,
  "expression": { "last": true, "macro": false },
  "layer": 100,
  "match": "always",
  "name": "prompt",
  "priority": 0,
  "role": "user",
  "type": "plaintext"
}
```

三个刻意的设计：

| 选择           | 为什么                                                       |
| -------------- | ------------------------------------------------------------ |
| `last: true`   | 让它在**最后**注入——离"该怎么输出"最近，不容易被别的规则冲淡 |
| `role: "user"` | 子 agent 的本质是"一次任务"，用 user 语气指令性更强          |
| `priority: 0`  | 只有这一条，无所谓顺序；保留 0 是为了让它在同层里排最前      |

prompt 里靠 `it.character` 接收参数（来自工具 schema 的入参，**摊平在顶层**，没有 `it.args`）：

```markdown
现在你需要切换到<%~ it.character %>视角……
想法包含 情绪，观察，分析，动机，行动五个方面……
根据以上规则，输出你当前所想，不要包含其他内容。
```

父侧工具（`默认设置/tools/思维分析.meta.json`）的 `schema` 就定义了 `character` 这个字段。

### 3.4 几个运行时细节

| 细节     | 行为                                                                                                                       |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| 历史复制 | 子 agent 拿到主故事的历史副本，且最后一条输出的 `outputs` 被切掉最后一个——所以它"能看见当前局面，但不覆盖正在生成的这一轮" |
| 禁递归   | 子 realm 的 `properties.agent = 1`，`agent` 工具在子 agent 里**不会注册**（防止无限套娃）                                  |
| 标签过滤 | `disableTags` 是"继承父预设时"的过滤器；只列在 `presets` 里的预设不受影响                                                  |
| 参数     | 工具的 `args` 摊平成宏上下文，`it.character` 就来自这里                                                                    |

### 3.5 导出时的连带

`agent` 工具的归档钩子会把 `config.presets` 里的预设**追加进导出集合**，并把 `config.model` 引用的
`model/<id>.model.json` 一起打包。所以别人导入你的工具时，子预设与模型会跟着来——前提是**你导出的是父预设**。
（导入不会自动补依赖，这一点和 `requires` 一样。）

---

## 四、实践

做一个 `critic` 子 agent：让它在每次大段落之后"挑刺"。

### 步骤 1：子预设（1 个文件）

```powershell
mkdir D:\demo\root\critic_agent\lorebooks
```

`critic_agent/meta.json`：

```json
{
  "description": "给刚写的段落挑毛病",
  "id": "critic_agent",
  "name": "评审Agent",
  "requires": [],
  "tags": ["agent"],
  "version": "1.0.0"
}
```

`critic_agent/lorebooks/prompt.meta.json`：

```json
{
  "code": "rules",
  "content": "$file$prompt.md",
  "disabled": false,
  "expression": { "last": true, "macro": false },
  "layer": 100,
  "match": "always",
  "name": "评审提示",
  "priority": 0,
  "role": "user",
  "type": "markdown"
}
```

`critic_agent/lorebooks/prompt.md`：

```markdown
你是这部作品的严格评审，不是作者。

针对<%~ it.scene %>这个场景，只回答三件事，每件一行，不超过 40 字：

1. 哪里读起来别扭；
2. 哪个细节与设定冲突；
3. 一条最小的修改建议。

不要复述原文，不要夸，不要写正文。
```

### 步骤 2：父预设里的工具

在某个人类可玩的预设（例如 [03](./03-预设作家-提示词骨架.md) 造的 `narrator`）里加一个工具：

```powershell
mkdir D:\demo\root\narrator\tools
```

`narrator/tools/critic.meta.json`：

```json
{
  "config": {
    "code": "critic",
    "description": "对当前场景做严格评审，返回三条问题与建议",
    "disablePreset": true,
    "disableTags": [],
    "model": null,
    "presets": [{ "name": "评审Agent-1.0.0", "value": "critic_agent" }],
    "schema": "$file$critic.schema.json"
  },
  "disabled": false,
  "name": "评审",
  "type": "agent"
}
```

`narrator/tools/critic.schema.json`：

```json
{
  "additionalProperties": false,
  "properties": {
    "scene": { "description": "要评审的场景名或一句话摘要", "type": "string" }
  },
  "required": ["scene"],
  "type": "object"
}
```

要点：

- `disablePreset: true` → 子 agent **只用** `critic_agent` 的 prompt，不继承主故事的规则（干净、可控）；
- `model: null` → 沿用主故事的模型；想用便宜的小模型就填 `{ "name": "...", "value": "<model id>" }`；
- `schema` 与 prompt 里的 `it.scene` **必须对应**。

> 工具默认是常开的。想让它可开关，给条目加 `"macro": "critic_switch"` 并配一条 `multiple: true` 的宏
> （见 [02](./02-默认设置-工具与开关.md)）。注意 `agent` 型工具在 `loadArchive` 时会把 `config.presets`
> 追加进导出集合，所以导出父预设时会自动带上子预设。

### 步骤 3：验收

```powershell
cd D:\demo
tar -a -c -f demo.zip root
```

导入时**两个都勾**（`narrator` + `评审Agent`），进故事：

1. 说"写完这一段了，帮我评审一下"；
2. 模型应调用 `critic`，参数里带 `scene`；
3. 返回三条短句（别扭处 / 冲突 / 建议），**没有正文**。

✅ 如果返回值很长、还带正文 → 子预设没生效：检查 `presets[].value` 是否是子预设的 **id**（`critic_agent`）、
`disablePreset` 是否 `true`、子预设是否真的被导入了。

### 步骤 4：换模型对比（可选）

把 `model` 换成一个便宜模型（先准备好 `root/model/<id>.model.json`），再跑一次：
子任务用便宜模型、主剧情用好模型，是这套机制最实际的用法。

---

## 五、自检与下一步

| 现象                              | 原因                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| 工具不出现在工具列表              | `type` 写错（没注册 provider）；或 `agent` 的 `create` 在**子 agent 内**被跳过（递归保护） |
| 调用后返回 `error: empty content` | 子预设没有产出（prompt 太弱 / 没装子预设 / 模型报错）                                      |
| 子 agent 说的话和主模型一样       | 忘了 `disablePreset: true`，它继承了主故事的整套预设                                       |
| `it.character` 是 `undefined`     | schema 里的字段名与 prompt 里的 `it.<名字>` 不一致                                         |
| 导入后子预设丢了                  | 导出时只导了父预设且工具 `config.presets` 没写对；导入不会自动补依赖                       |

**学到这里你已经覆盖了整套机制**：存档与条目（01）、工具与开关（02）、提示词与宏（03–04）、
渲染层（05–07）、工具×数据（08）、检索（09）、子智能体（10）。

想继续深入：

- 字段细节与导入导出规则：[`../../archive/01-存档结构.md`](../../archive/01-存档结构.md)
- 宏当开关的完整配方：[`../../archive/04-进阶-宏联动.md`](../../archive/04-进阶-宏联动.md)
- 8 个模板预设"能学什么"的索引：[`../../templates/readme.md`](../../templates/readme.md)
