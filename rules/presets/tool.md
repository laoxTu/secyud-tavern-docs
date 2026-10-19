# 工具

工具放在`<预设目录>/tools/`，是暴露给模型调用的函数。`type`决定由哪个 provider 解释，
`config`随`type`变化。默认设置 7 条，正好把常用的 7 个 provider 各用了一遍：

| 文件（前缀＝`name`） | type | macro | disabled | 额外文件 | 产出的工具名 |
| --- | --- | --- | --- | --- | --- |
| `世界书` | `lorebook` | `lorebook` | `false` | — | `get_lorebook` |
| `变量工具` | `variable` | `variable` | `false` | — | `get_variable` `set_variable` `del_variable` |
| `记忆工具` | `memory` | `memory` | `false` | — | `get_memory` `set_memory` |
| `提问用户` | `elicit` | `elicit` | `false` | — | `ask_user` |
| `思维分析` | `agent` | `false` | `true` | `.desc.txt` `.schema.json` | `agent_mind_analyze` |
| `绘图示例` | `comfyui` | `false` | `false` | `.desc.txt` | `painter_comfyui_krea2` |
| `随机数工具` | `script` | — | `false` | `.desc.txt` `.schema.json` `.script.js` | `random` |

## 通用字段

```json
{
  "disabled": false,
  "macro": "variable",
  "name": "变量工具",
  "type": "variable"
}
```

* `type`：provider 名，取值`variable` `lorebook` `memory` `elicit` `fetcher` `script` `agent` `mcp` `comfyui`。
  没注册过的`type`会被跳过并打一条告警，不会让整个故事加载失败。
* `name`：显示名，同时是文件名前缀，也是没绑宏时「是否启用」的键。
* `macro`：填一个宏的`code`，启用状态跟那个复选框同步；不绑定写`false`或省略。
* `disabled`：默认状态，缺省即启用。
* `config`：随`type`变化。体积大的字段拆成额外文件，写在`config`里会被文件内容覆盖。

工具按**工具名**放进同一张表，后注册的同名工具覆盖前一个。所以`config.code`重复时只有最后一个生效，
`comfyui_model_fetcher`这种固定名字的工具也是后面的盖前面的。

## 七个条目

### 世界书 / `lorebook`

没有`config`。提供`get_lorebook`，语义检索世界书条目的标题，命中的正文下一轮才注入。
RAG 设置禁用时不建向量库，工具返回提示而不是报错。
绑的宏`lorebook`同时是`世界书工具`那条宏和`规则`里`<%~ it.tools %>`的一部分。

### 变量工具 / `variable`

没有`config`。三个工具都按`/`分隔的 JSON Pointer 路径读写：

* `get_variable`：读一个已声明的变量
* `set_variable`：按`op: replace`写，整个值被覆盖
* `del_variable`：按`op: remove`删，删不存在的变量是空操作

写入不会立刻改历史变量，而是记进本轮输出的`operations`，输出保存时统一应用；
本轮还没有输出时直接返回`error: no output to operate.`。

它绑的`variable`和`变量-相关日期`是同`code`，所以勾一个等于勾两个。

### 记忆工具 / `memory`

没有`config`。提供`get_memory`与`set_memory`，同样依赖 RAG。
记忆的`type`是`event` `relation` `knowledge` `other`；标签按英文词存，非 ASCII 标签永远匹配不到。

### 提问用户 / `elicit`

没有`config`。提供`ask_user`，向玩家抛一个问题并等回答，15 分钟没有回答算超时失败。

### 思维分析 / `agent`

子 agent 用一套独立上下文再问一次模型，把结果当工具结果返回。

```json
{
  "config": {
    "code": "agent_mind_analyze",
    "disablePreset": true,
    "disableTags": [],
    "maxLength": 5,
    "model": { "name": "default", "value": "721d5c7d-352e-43eb-be54-7ab3332fa487" },
    "presets": [{ "name": "心理分析Agent-1.0.0", "value": "agent_mind" }]
  },
  "disabled": true,
  "macro": false,
  "name": "思维分析",
  "type": "agent"
}
```

* `code`：工具名。`desc.txt`与`schema.json`写说明与入参。
* `disablePreset`：`true`时子 agent 不继承父级预设，只用`presets`里列的。
  默认设置写了`true`，所以它只带`agent_mind`。
* `presets`：子 agent 额外加载的预设，这些预设会被一起打进包。
* `disableTags`：按标签把父级预设筛掉，标签命中任意一个就排除。
* `model`：子 agent 用的模型，写`null`则用父级的；引用的模型会被一起打进`model/`。
* `maxLength`：**已经没有代码读它了**，默认设置里的`5`是历史残留，删掉不影响行为。

子 agent 内部不能再调用 agent 工具；它的工具入参会摊平到模板的`it`上，见[预设本体](preset.md)。

### 绘图示例 / `comfyui`

```json
{"macro":false,"type":"comfyui","config":{
  "code":"painter_comfyui_krea2",
  "workflow":{"name":"krea2_example-94bb6ad1-9104-48e7-b0ca-4e4fb69e5354","value":"94bb6ad1-9104-48e7-b0ca-4e4fb69e5354"},
  "params":[
    {"id":0,"code":"lora","description":"绘图所需lora，列表可以通过comfyui_model_fetcher获得。type为lora。","disabled":false},
    {"id":1,"code":"title","description":"绘制图像的标题","disabled":false},
    {"id":2,"code":"prompt","description":"绘制图像的提示词，只包含主体描写，不需要画风，画质等。","disabled":false}
  ]},
  "disabled":false,"name":"绘图示例"}
```

* `code`：工具名。`desc.txt`写给模型看。
* `workflow`：引用的工作流，`value`是工作流 id，导入导出时带上`comfyui/`里那两个文件。
* `params[].id`：对应工作流参数的`sequence`，**不是**数组下标也不是名字。
* `params[].code`：暴露给模型的参数名；`disabled: true`的参数不暴露。
* 每个 comfyui 工具还会额外注册`comfyui_model_fetcher`，用来查本地模型（lora、大模型）列表。

工作流里引用的 lora 等模型只是本地文件名，不随包走，导入方要自己登记。

### 随机数工具 / `script`

```json
{
  "config": { "hidden": false, "enableDoc": false, "enableVariable": false, "code": "random" },
  "disabled": false,
  "name": "随机数",
  "type": "script"
}
```

* `code`：工具名，模型看到的就是它。`config.hidden`没人读，可以删。
* `description`写在`.desc.txt`，`schema`写在`.schema.json`，`script`写在`.script.js`。
* `.script.js`里写的是**函数体**，等价于`function (input, context) { … }`
  （内部是`new Function('input', 'context', 正文)`），`input`是模型给的参数对象。
  返回字符串直接作为结果，返回别的值会被 JSON 序列化。默认设置里就三行：

```js
const min = Math.ceil(input.min);
const max = Math.floor(input.max);
return Math.floor(Math.random() * (max - min + 1)) + min;
```

* `enableDoc`：把 iframe 的`document`、`window`挂到`context`上。
* `enableVariable`：把当前历史变量挂到`context.variables`上。

## 另外两个 provider

`fetcher`（固定工具名`url_fetch`，配置`maxResults` `timeout` `maxLength`）和
`mcp`（Streamable HTTP，工具名`<code>_<远端工具名>`）默认设置都没用。
字段见`docs/learn/09-工具与记忆.md`。
