# 模板自述（预设合集）

这里是预设合集的**源目录**：把 `root/` 打包成一个 zip 就是"预设集合存档"——
8 个预设 + 2 份工作区引用（模型 / ComfyUI），互相用 `requires` 串成一条栈。

| 目录 | 说明 |
| --- | --- |
| `root/` | 存档解开的目录树，导入内容都从这里来（**真正要维护的就是它**） |
| `build.bat` | 打包命令：`tar -a -c -f "default.zip" "root"`（zip 是产物，不入库） |
| `workspace/默认交互.html` | `ui_default` 的**离线预览页**，不启动应用也能调界面 |
| `workspace/弹幕.html` | `bullet` 的离线预览页（塞了一段造好的假数据） |

文件格式（`meta.json`、`$file$`、条目字段）见 [../archive/](../archive/readme.md)；
本篇只讲"**这里都有什么、能学到什么**"。

> 一个 zip 就是一个"预设集合"：可以塞任意多个预设，每个预设还可以带自己的封面
> （本包没带封面，写法见 [01 §3.4](../archive/01-存档结构.md)）。导入时勾选要哪些，依赖不会自动补。

> 统计：172 个条目（世界书 136 / 宏 18 / 工具 8 / 脚本 6 / 样式 4），以及 `model/`、`comfyui/` 两个工作区文件。

---

## 1. 依赖关系

```
settings（默认设置）                ui_default（默认交互）
        └──────────┬──────────────────────┘
          preset_tiandao（预设天道）        bullet（弹幕）←── 直接依赖这两个
                   └── app_simulation（模拟经营）
                           ├── fkssj（疯狂水世界）
                           └── story_terminal（终末）

agent_mind（思维分析Agent）← 不挂依赖，被 settings 的「思维分析」工具按 id 引用
```

| 目录 | id | 版本 | 标签 | 依赖 | 条目 |
| --- | --- | --- | --- | --- | --- |
| `默认设置` | `settings` | 1.1.3 | settings, preset | — | 14 |
| `默认交互` | `ui_default` | 1.1.0 | theme | — | 6 |
| `预设天道` | `preset_tiandao` | 1.2.1 | preset | settings, ui_default | 11 |
| `模拟经营` | `app_simulation` | 1.2.0 | preset | preset_tiandao | 3 |
| `疯狂水世界` | `fkssj` | 1.0.1 | story | app_simulation | 36 |
| `终末` | `story_terminal` | （空） | — | app_simulation | 98 |
| `思维分析Agent` | `agent_mind` | 1.0.0 | agent | — | 1 |
| `弹幕` | `bullet` | 1.0.0 | ui | settings, ui_default | 3 |

**为什么依赖这么多层**：`ui_default` 提供 iframe 里的渲染库（`window.sUtils` / `window.sComponents`），
`settings` 提供工具与工具开关，`预设天道` 是提示词骨架，`模拟经营` 定义变量结构 + 面板，
最上层的两个才是"世界内容"。安装时**要按依赖顺序全装**（导入不会自动补依赖，见 [02](../archive/02-手写存档指南.md)）；
`弹幕` 已经把这两条写进 `requires`，可以当"依赖声明"的范例看。

---

## 2. 逐个预设：能学到什么

### 2.1 `默认设置`（settings）—— 工具栈底座，**先看这个**

14 个条目：世界书 2、宏 5、工具 7。没有脚本/样式/正则，也没有 `variables`/`opening`。

| 学到什么 | 在哪 |
| --- | --- |
| **工具三件套**：宏（开关+说明书）+ 工具（`macro` 绑定）+ 常驻世界书（`<%~ it.tools %>`） | `macros/tool-*.meta.json`、`tools/*.meta.json`、`lorebooks/rules.content.md` |
| **七种工具类型的写法**：`lorebook` / `variable` / `memory` / `elicit` / `script`（随机数）/ `agent`（思维分析）/ `comfyui`（绘图示例） | `tools/` 下 7 个文件 |
| **无配置工具**只需 `{"name","type","macro"}` 三行 | `tools/世界书.meta.json`、`tools/变量工具.meta.json`、`tools/记忆工具.meta.json`、`tools/提问用户.meta.json` |
| **工具脚本最小形态**：函数体 + JSON Schema，`return` 一个值 | `tools/随机数工具.script.js` + `.schema.json` |
| **agent 工具**：引用模型 + 引用另一个预设当 prompt（导出时会一起打包） | `tools/思维分析.meta.json` |
| **comfyui 工具**：引用工作流 id，对应 `root/comfyui/` 那两个文件 | `tools/绘图示例.meta.json` |
| **宏 ↔ 世界书联动（活例子）**：变量格式说明只在"变量"宏勾上时注入 | `lorebooks/variable.meta.json` 的 `expression.macro: "variable"` |
| **同 key 跨预设累加**：`it.variable` 由本预设和模拟经营各贡献一段 | `macros/variable-related_dates.meta.json` |

> 注意这里有两套同名概念，**别混淆**：宏的 **`code`** 是开关名（`variable`），宏的 **`key`** 是插入变量名（`tools` / `variable`）。
> 这个预设里恰好有：工具开关的 code 叫 `variable`、变量说明组的 key 也叫 `variable`，
> 而开关只认 `code`、拼文本只认 `key`。

### 2.2 `默认交互`（ui_default）—— iframe 渲染层

6 个条目：世界书 1、脚本 3、样式 2。

| 学到什么 | 在哪 |
| --- | --- |
| **注入顺序**：`importmap`(priority 0) → 组件库(0) → 主渲染器(100)，样式同理 | `scripts/preact.meta.json`、`components.meta.json`、`script.meta.json` |
| **importmap 条目怎么写**：`type: "importmap"`，内容是 `{"imports":{...}}` | `scripts/preact.script.json` |
| **用 preact 手写渲染层**：`useMessageData()` 订阅 `window.__messageData`，`renderComponent(App,'app')` 挂载 | `scripts/script.script.js` |
| **给下游预设提供公共库**：`window.sUtils`（`get` / `useMessageData` / `appendItemInput` / `renderComponent` / `weightRandom`）与 `window.sComponents`（`SFloating` / `STab` / `SRadarChart` / `SExpand` / `SVariableImage`） | `scripts/components.script.js` 末尾 |
| **`type: ""` 的样式也生效**（等价 `text/css`，只要不是 `link`） | `styles/ui.meta.json` |
| **让模型输出 HTML**：约定"特殊格式用 html 标签，但别句句包标签" | `lorebooks/rules.content.md` |

`workspace/默认交互.html` 是这层的离线调试页：手塞一段 `window.__messageData`，按运行时顺序引样式与脚本，
起个本地 http 服务就能看效果（`python -m http.server 8080` → 打开该页面）。

### 2.3 `预设天道`（preset_tiandao）—— 提示词骨架 + 宏插槽

11 个条目：世界书 2、宏 9。这是"只写提示词"的最佳参考。

| 学到什么 | 在哪 |
| --- | --- |
| **常驻系统提示的骨架**：身份 → 工作流（agent_run 四步）→ 用词/文风/人称/长度 | `lorebooks/identity.content.md`、`rules.content.md` |
| **「宏插槽」写法**：提示词里留 `<%~ it.user %>` / `<%~ it.perspective %>` / `<%~ it.text_length %>` / `<%~ it.write_styles %>`，由宏填内容 | `rules.content.md` |
| **单选组**（人称、长度）：同 `key` 多个 `code`，面板里是单选框，只生效一个 | `macros/perspective-*.meta.json`、`text_length-*.meta.json` |
| **复选组**（文风）：同 `key` 多条可叠加，勾几个拼几个 | `macros/write_style-*.meta.json` |
| **隐藏宏当"设置项"**：`hidden: true` 的 `it.user`（主角名），面板里不显示，改预设即可 | `macros/setting-user.meta.json` |
| **`layer` 分层**：身份 99 / 规则 100，插在消息前后 | 两道世界书的 `layer` |

> `it.user` / `it.write_styles` 这些 key 都由**本预设自己的宏**提供，所以它本身是可以独立工作的提示词预设。
> 但下游预设（模拟经营 / 疯狂水世界 / 终末）若漏装它，提示词就会缺段——Eta 找不到 key 不报错，
> 会原样输出字面量 `undefined`，这是拼预设栈时最常见的事故。

### 2.4 `模拟经营`（app_simulation）—— 变量 schema + 小手机面板

3 个条目：宏 1、脚本 1、样式 1。

| 学到什么 | 在哪 |
| --- | --- |
| **用长 prompt 定义变量结构**：`/user`、`/charas`、`/buildings`、`/items` 的 TS 类型 + 更新规则 | `macros/variable-sim.value.md` |
| **变量描述走宏**：这段 schema 属 `key: "variable"`，与 settings 的 `related_dates` 拼成 `it.variable` | `macros/variable-sim.meta.json` |
| **用 preact 画"状态栏/小手机"**：读变量、分 tab、自定义组件 | `scripts/panel.script.js`（16KB，最值得读的 UI 代码） |
| **配套样式** | `styles/panel.style.css` |

### 2.5 `疯狂水世界`（fkssj）—— 工具 × 前端脚本 × 关键词知识库

36 个条目：世界书 32、宏 2、脚本 1、工具 1。

| 学到什么 | 在哪 |
| --- | --- |
| **工具调用前端脚本里的数据**：`enableDoc: true` 拿到 `context.window`，读 `window._fkssj` 的权重池 | `tools/抽奖-0.script.js`、`scripts/jc-0.script.js` |
| **加权随机**：`window.sUtils.weightRandom`（来自 ui_default） | 同上 |
| **关键词知识库**：30 条奖池按 `match: "normal"` + 分类名做关键词命中，抽到哪类就注入哪段 | `lorebooks/lottery_{dj,zj,gj}_*.meta.json` |
| **后置强提示（callback）**：`last: true` + `layer: 200` + `role: user`，每轮最后再提醒一次"该用抽奖工具了" | `lorebooks/callback_cj-0.meta.json` |
| **工具使用说明单独成条**：`layer: 5` + `role: system`，说明放在最前 | `lorebooks/tool_lottery-1.meta.json` |
| **多套开场白**：`opening.txt` 只写 `<%~ it.opening %>`，真正的文本在同 `key: "opening"` 的单选宏里 | `opening.txt` + `macros/opening-*.meta.json` |
| **单选宏的坑**：单选组不读 `disabled`，默认选谁取决于排序 | 同上 |

> `rules`（常驻规则）+ `callback`（末尾强提示）就是这套玩法的核心搭配：
> 规则放"长期约定"——一般在一轮缓存里不改，除非总结后新建缓存；callback 可以随便换，
> 它只占很少 token，专门用来做"这一轮别忘的事"。

### 2.6 `终末`（story_terminal）—— 大规模世界书与目录体系

98 个条目：世界书 97、宏 1。全部 `match: "vector"`（RAG 检索）。

| 学到什么 | 在哪 |
| --- | --- |
| **按区域 / 类别 / 分期分目录**：`帝都`、`江南`、`蜀中`、`物品与知识`、`跨区`；每个区域下再分 `人物`/`势力`/`事件/<时期>` | `lorebooks/` 目录树 |
| **命名约定**：`world_` / `role_` / `org_` / `item_` / `rel_` / `event_` + 缩写 + 序号（`event_0y3m_50` = 0 年 3 月第 50 条） | 97 个文件名 |
| **内容里用 `[实体]` 标注**，同一实体跨条目指认；注意检索向量用的是整段 `content`（这些条目 `expression` 是空的） | 各条 `content` |
| **大世界只记"大略"**，细节拆到条目里：`world_bj_0` 写全球背景与纪元，每个区域再一条 `world_*` 只写该区域格局 | `lorebooks/world_bj_0.meta.json`、`江南/world_jn_2.meta.json`、`蜀中/world_sz_1.meta.json` |
| **关系条目单独一层**（人物之间的关系放 `跨区/rel_*`） | `lorebooks/跨区/` |

> ⚠️ `vector` 条目**不会自己冒出来**：它靠「世界书工具」（`get_lorebook`）做向量检索，
> 命中哪些就把哪些按 `role: knowledge` 注进上下文。所以要同时满足两件事：
> ① 装 `settings` 并勾上"世界书工具"宏；② 在故事里开启 RAG。
> 否则这 97 条一条都不会命中（工具会返回 `warn: RAG is not enabled`）。

### 2.7 `思维分析Agent`（agent_mind）—— 最小子 agent

1 个条目，就是一个"子智能体"的全部内容。

| 学到什么 | 在哪 |
| --- | --- |
| **子 agent 预设可以极简**：一条 `last: true`、`role: user` 的 prompt，靠 `it.character` 收参数 | `lorebooks/prompt.meta.json` + `.content.md` |
| **单一职责**：只做"心理分析"，输出格式写死，不掺世界观 | `prompt.content.md` |
| **与父预设配合**：父预设的 `agent` 工具用 `config.presets[].value = "agent_mind"` 引用它 | `root/默认设置/tools/思维分析.meta.json` |
| **`expression.macro: false`** 等价于"不绑开关" | `prompt.meta.json` |

### 2.8 `弹幕`（bullet）—— 工具/变量与"常驻效果"的联动 ★

3 个条目：世界书 1、脚本 1、样式 1。这是**纯手写**的最小 UI 预设，也是全库最干净的
"模型写数据 → 界面重放"范例。**它的重点不是弹幕，而是一次性效果该怎么落到变量上。**

| 学到什么 | 在哪 |
| --- | --- |
| **一次性效果必须由变量承载**：工具/`set_temp` 只在生成那一刻调用一次，翻回旧章节就没了 | 见下面的机制 |
| **数据闭环**：世界书下指令 → `set_temp` 写 `/bullets` → `postMessage('variables')` → preact 渲染 → CSS 滚动 | `lorebooks/bullet.content.md`、`scripts/panel.script.js`、`styles/panel.style.css` |
| **"写数据"写成硬指令**：给路径、给层级、给 TS 类型示例、给质量下限（每组 ≥5 条） | `bullet.content.md` |
| **伪随机配色与错位**：昵称/内容的码点取模，决定颜色与左偏移，像真弹幕 | `panel.script.js` 的 `style()` |
| **动画周期随数量自适应**：`总条数 × 1.8s`（最少 10s）塞进 CSS 变量 `--cycle` | `panel.script.js` 的 `estimateCycle()` |
| **不挡正文**：只占顶部 `33.33vh`、`pointer-events: none` | `panel.style.css` |
| **`requires` 的写法**：显式写 `ui_default` + `settings`，不靠使用者自觉 | `弹幕/meta.json` |

**核心机制：事件 ≠ 状态。**

工具调用是"事件"，只发生一次；用户随时会往回翻到某一章，那时工具早已调用完。
所以一次性效果（显示、声音、闪光）不能只在工具里播一次，而要**写进该章的变量/属性**，
界面每次渲染这一章时读快照、重新播放。代码上成立的原因：

| 事实 | 位置 |
| --- | --- |
| 每条 history 自带 `variables` 快照；每个 output 自带 `properties`（`set_temp` 写的就是它） | `stories/realms/client/page.tsx`（建 history 时 `variables: realms.variables(last)`） |
| 推给 iframe 的是"当前查看的那一章"的变量：`{...variables(history), space: space(history).properties}` | `stories/realms/client/index.ts` 的 `message.variables()` |
| 翻页 / 翻消息会重渲染：`setIndex → setOutput → prepare` → 重新 `renderers.content({realm, history})` | `stories/realms/client/state.ts`、`page.tsx` 的 `PageControl` |
| 每次推送都是新对象 → `useMessageData` 重新 setState → 组件 `useEffect` 又能跑 | `默认交互/scripts/components.script.js` |

于是链路是：**工具/变量写入状态 → 该章渲染时重放状态 → 效果重新出现**（而不是"当初播过的残留"）。

**把效果写成数据**（`N 种效果 = 1 个工具 + N 份数据`，不用为每种效果造工具、改 schema）：

```json
{
  "effects": [
    { "id": "c12-door-slam", "kind": "sound", "src": "slam", "volume": 0.6 },
    { "id": "c12-flash", "kind": "flash", "color": "#ff4444", "duration": 300 }
  ]
}
```

```js
const [data] = useMessageData('variables');
const effects = data?.space?.effects ?? [];
const played = useRef(new Set());

useEffect(() => {
  for (const fx of effects) {
    if (played.current.has(fx.id)) continue; // 同一章内不重复播
    played.current.add(fx.id);
    if (fx.kind === 'sound') playSound(fx.src, fx.volume);
    if (fx.kind === 'flash') flash(fx.color, fx.duration);
  }
}, [data]);
```

三个坑：

1. **每条效果带稳定 `id`**：翻页/生成/重连会连续推好几次消息，没 id 会同一章播三四遍。
2. **"已播"集合只在当前章有效**：离开再回来要重播（这才是想要的）；想"整场只播一次"就用 `sessionStorage` 记 `id`。
3. **音效受浏览器自动播放策略限制**：iframe 里 `new Audio().play()` 在用户首次交互前会被拦。

> 反例：在工具脚本里直接 `document.body.appendChild(...)`、直接 `playSound()`、直接改 DOM ——
> 只在生成时生效一次，翻回这一章什么都没有（工具没有被"重放"的入口）。

**选哪个通道**：`set_temp` 写的是**本章**的 `space.properties`（翻回这章还在，翻到别的章就没有）；
`set_variable` 写的是**故事变量**（会继承到后面每章）。一次性效果用前者，持续状态（血量/好感）用后者。

离线看效果：`workspace/弹幕.html`（塞了一段造好的 `__messageData`，起本地 http 服务打开即可）。

---

## 3. 学习路线

| 你想做什么 | 按这个顺序读 |
| --- | --- |
| **完全没概念** | 教程 [01-制作你的第一个预设](../zh/archive/01-制作你的第一个预设.md)（有理论有实践），或速查 [00-快速通道](../archive/00-快速上手.md) |
| 想跟着教程把 8 个预设逐个做一遍 | [`../zh/archive/`](../zh/archive/readme.md) 的教程集 |
| 只写提示词（纯文本玩法） | `预设天道/lorebooks/*` → `预设天道/macros/*` → `思维分析Agent/` |
| 想加工具 | `默认设置/lorebooks/rules.content.md` → `默认设置/macros/tool-*.meta.json` → `默认设置/tools/*` → [04 配方 A](../archive/04-进阶-宏联动.md) |
| 想做界面（状态栏/手机） | **从 `弹幕/` 开始**（最小可跑：3 个条目）→ `默认交互/scripts/*` → `workspace/弹幕.html`（离线调试）→ `模拟经营/scripts/panel.script.js` |
| 想做一次性效果（音效/闪光/动画） | `弹幕/` 全部 → §2.8 的 `effects` 写法 → 回到 §2.8 的"重放"四点依据 |
| 想做工具 + 前端联动 | `疯狂水世界/scripts/jc-0.script.js` + `tools/抽奖-0.*` → 再回头看 `sUtils.weightRandom` |
| 想做大型世界观 | `终末/lorebooks/` 整个目录树（看命名与分层，不看每一条内容） |
| 想搭多预设栈 | 本文件第 1、2.1 节 → `默认设置` → `弹幕/meta.json` 的 `requires` → `预设天道` |

---

## 4. 技巧 → 出处 速查

| 技巧 | 出处 |
| --- | --- |
| **工具/变量 → 界面重放**（一次性效果的正确姿势） | `弹幕/` 全部 + 本文件 §2.8 |
| **一次性效果数据化**（`effects[]` + 稳定 id） | 本文件 §2.8 |
| 工具开关（宏 + `tool.macro` + 容器世界书） | `默认设置`（`tool-variable` 等） |
| 世界书跟着宏开关走 | `默认设置/lorebooks/variable.meta.json` |
| 同 `key` 跨预设拼文本（`it.variable`） | `默认设置/macros/variable-related_dates` + `模拟经营/macros/variable-sim` |
| 单选组 / 复选组 / 隐藏宏 | `预设天道/macros/*` |
| 多套开场白 | `疯狂水世界`、`终末`（`opening.txt` = `<%~ it.opening %>`） |
| 后置强提示（callback） | `疯狂水世界/lorebooks/callback_cj-0.meta.json` |
| 提示词分层（layer 5 / 80 / 85 / 89 / 99 / 100 / 200） | 见各预设世界书的 `layer` |
| iframe 里用 preact 渲染 | `弹幕/scripts/panel.script.js`（最短）或 `默认交互/scripts/script.script.js` |
| 公共 UI 库 | `默认交互/scripts/components.script.js` |
| importmap 引外部 ESM | `默认交互/scripts/preact.*` |
| 工具读前端状态 | `疯狂水世界/tools/抽奖-0.script.js` |
| 关键词知识库 | `疯狂水世界/lorebooks/lottery_*.meta.json` |
| 向量知识库（RAG） | `终末/lorebooks/**` |
| 子 agent | `思维分析Agent` + `默认设置/tools/思维分析.meta.json` |
| ComfyUI 绘图工具 | `默认设置/tools/绘图示例.meta.json` + `root/comfyui/` |
| 模型随包走 | `root/model/*.model.json` |

---

## 5. 已知问题（都是历史遗留，不影响"学习"，但会影响"直接用"）

1. **这批模板是按旧规则导出的**：`cover: null`、`opening`/`variables` 没有写进 `meta.json`。
   按新规则导入时，`终末/opening.txt`、`疯狂水世界/opening.txt` 这类**文件在、meta 里没引用**的开场白会被忽略。
   修法：在对应 `meta.json` 里补 `"opening": "$file$opening.txt"`（规则见 [01 §11](../archive/01-存档结构.md)）。
2. **`默认设置/tools/思维分析.meta.json` 里多一个 `maxLength: 5`**，当前 `AgentConfig` 没有这个字段，不会被读。
3. **`entryId` 字段**散落在不少条目里（`entryId: 2201` 之类），导入时会被忽略并重新分配，不用管。
4. **两个离线预览页都引了 `styles/component.style.css`**（少个 `s`，实际是 `components.style.css`），
   打开预览时那个样式会 404——`workspace/默认交互.html`、`workspace/弹幕.html` 各一处。
5. **中文文件名在 zip 里的编码问题**：`抽奖-0.schema.json`、`世界书.meta.json` 这类中文名文件，
   打进 zip 后读端按 UTF-8 解码会变成乱码，导致 `$file$抽奖-0.schema.json` 命中不到。
   想彻底干净，把这些内容文件改成 ASCII 名（如 `lottery.schema.json`）并同步改 `$file$` 引用
   （打包见 [02 §6](../archive/02-手写存档指南.md)）。
6. **`默认设置/lorebooks/rules.content.md` 里提到的 `get_knowledge` 不是可调用的工具**：
   它是**系统把 `role: knowledge` 世界书塞进上下文时伪造的工具调用名**
   （`src/models/client/engine.ts` 的 `engines.knowledge.info.name`，由 `builder.ts` 注入）。
   模型真正能调的是 `get_lorebook`（世界书检索）和 `get_memory`（记忆检索）。文案容易误读，留意一下。

> 已经修掉的旧问题（留档）：`模拟经营/scripts/panel.meta.json` 曾断链到 `.css`；
> `tool-ask_user` 宏的 `code` 曾是 `ask_user`，与工具的 `macro: "elicit"` 对不上。

---

## 6. 改完之后怎么重新打包

```powershell
cd docs/templates
tar -a -c -f default.zip root
tar -tf default.zip | Select-Object -First 5   # 确认是 root/... 形式
```

打出来的包可以直接在应用里「预设 → 导入」。`*.zip` 被 `docs/.gitignore` 忽略，**不入库**，
所以仓库里看不到 `default.zip` 是正常的，用 `build.bat` 现场生成即可。

新增预设时记住三件事：目录名随意、`meta.json` 的 `id` 唯一、六个条目目录名必须精确。
