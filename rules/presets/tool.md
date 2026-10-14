# 工具

工具放在`<预设目录>/tools/`，是暴露给模型调用的函数。`type`决定由哪个 provider 解释，
不同`type`的`config`差别很大，元数据的文件名前缀用的是条目的`name`（不是`code`）。

## 通用字段

```json
{
  "type": "script",
  "name": "随机数",
  "disabled": false,
  "macro": false,
  "config": {}
}
```

* `type`：provider 名。取值`variable` `lorebook` `memory` `elicit` `fetcher` `script` `agent` `mcp` `comfyui`。
* `name`：显示名，同时是文件名前缀与「是否启用」的键（未绑定宏时按工具名记录勾选状态）。
* `macro`：填一个宏的`code`，绑定后启用状态跟该宏的勾选状态同步；不绑定写`false`或省略。

  绑定的宏应当是`multiple: true`的宏，否则状态不在同一张表里，等于没绑。
* `disabled`：默认启用状态，可选，缺省即启用。
* `config`：随`type`变化，见下。

多预设叠加时工具按**工具名**放进同一张表，后注册的同名工具会覆盖前一个。
所以`config.code`（或固定工具名）重复时只有最后一个生效。

## 额外文件

`config`里体积大的字段会拆成独立文件，前缀与`meta.json`一致：

| type | 工具名 | 额外文件 |
| --- | --- | --- |
| `variable` | `get_variable`、`set_variable`、`del_variable` | 无 |
| `lorebook` | `get_lorebook` | 无 |
| `memory` | `get_memory`、`set_memory` | 无 |
| `elicit` | `ask_user` | 无 |
| `fetcher` | `url_fetch` | 无 |
| `script` | `config.code` | `<前缀>.script.js`、`<前缀>.schema.json`、`<前缀>.desc.txt` |
| `agent` | `config.code` | `<前缀>.schema.json`、`<前缀>.desc.txt` |
| `mcp` | `config.code_<远端工具名>` | 无 |
| `comfyui` | `config.code`、`comfyui_model_fetcher` | `<前缀>.desc.txt` |

`schema.json`写 JSON Schema，`desc.txt`写给模型看的工具说明。两者写在`config`里无效，
导入时会被文件内容覆盖。

## variable

```json
{ "type": "variable", "name": "变量工具", "macro": "variable", "disabled": false }
```

没有`config`。提供三个工具：`get_variable`按路径读、`set_variable`按 JSON Pointer 写、
`del_variable`按 JSON Pointer 删。路径用`/`分隔。
写入的变更记在本轮输出上，输出保存时统一应用。

## lorebook

```json
{ "type": "lorebook", "name": "世界书", "macro": "lorebook", "disabled": false }
```

没有`config`。提供`get_lorebook`，按语义检索世界书标题。
RAG 设置被禁用时不建向量库，工具返回提示而不是报错。

## memory

```json
{ "type": "memory", "name": "记忆工具", "macro": "memory", "disabled": false }
```

没有`config`。提供`get_memory`与`set_memory`，同样依赖 RAG 设置。
记忆的`type`取值`event` `relation` `knowledge` `other`；标签按存储时的英文词存，非 ASCII 标签永远匹配不到。

## elicit

```json
{ "type": "elicit", "name": "提问用户", "macro": "elicit", "disabled": false }
```

没有`config`。提供`ask_user`，向玩家抛一个问题并等待回答，超过 15 分钟没有回答则失败。

## fetcher

```json
{
  "type": "fetcher",
  "name": "网页抓取",
  "disabled": false,
  "config": { "maxResults": 3, "timeout": 10, "maxLength": 8000 }
}
```

* `maxResults`：一次最多抓几个 URL，界面上限 5，默认 3。
* `timeout`：单个请求超时，单位秒，默认 10。
* `maxLength`：返回正文的长度上限，默认 8000。

工具名固定为`url_fetch`。HTML 与 XML 会先用 Readability 抽出正文再返回。

## script

```json
{
  "type": "script",
  "name": "随机数",
  "disabled": false,
  "config": {
    "code": "random",
    "enableDoc": false,
    "enableVariable": false
  }
}
```

* `code`：工具名，`[A-Za-z0-9_]+`，模型看到的就是它。
* `description`：给模型看的说明，写在`<前缀>.desc.txt`。
* `schema`：入参的 JSON Schema，写在`<前缀>.schema.json`。建议至少写
  `{"type":"object","additionalProperties":false}`。
* `script`：函数体，写在`<前缀>.script.js`。签名是`(input, context) => any`，
  `input`是模型给的参数对象；返回字符串就直接作为结果，返回其它值会被 JSON 序列化。
* `enableDoc`：为`true`时把 iframe 的`document`与`window`挂到`context`上。
* `enableVariable`：为`true`时把当前历史变量挂到`context.variables`上。

> 旧的`config.hidden`字段现在的代码不读，删掉即可。

## agent

```json
{
  "type": "agent",
  "name": "思维分析",
  "disabled": true,
  "config": {
    "code": "agent_mind_analyze",
    "disablePreset": true,
    "disableTags": [],
    "maxLength": 5,
    "model": { "name": "default", "value": "721d5c7d-352e-43eb-be54-7ab3332fa487" },
    "presets": [{ "name": "心理分析Agent-1.0.0", "value": "agent_mind" }]
  }
}
```

子 agent 用一套独立上下文再问一次模型，把结果作为工具结果返回。

* `code`：工具名。
* `description`与`schema`：写在`<前缀>.desc.txt`与`<前缀>.schema.json`。
* `maxLength`：只把最近多少条历史给子 agent。默认值`0`等价于**全部**历史，
  因为截取用的是`slice(-maxLength)`，而`-0`就是`0`。
* `disablePreset`：为`true`时子 agent 不继承父级预设，只用`presets`里显式列出的。
* `presets`：子 agent 额外加载的预设，`NameValue[]`。这里引用到的预设会被一起打进包。
* `disableTags`：按标签过滤父级预设，标签命中任意一个就被排除。
* `model`：子 agent 用的模型，`NameValue`；写`null`则用父级的模型。
  引用到的模型会被一起打进`model/`目录。

子 agent 内部不能再调用 agent 工具。

## mcp

```json
{
  "type": "mcp",
  "name": "远端工具",
  "disabled": false,
  "config": {
    "code": "kb",
    "url": "https://example.com/mcp",
    "headers": { "Authorization": "Bearer xxx" },
    "timeout": 30,
    "maxLength": 8000,
    "includes": []
  }
}
```

* `code`：工具名前缀，最终工具名是`<code>_<远端工具名>`；留空则直接用远端名字。
* `url`：Streamable HTTP 端点。只支持这一种传输方式，起子进程的 stdio 接不进来。
* `headers`：额外请求头，如鉴权。
* `timeout`：单次请求超时，单位秒，默认 30。
* `maxLength`：返回内容的长度上限，默认 8000。
* `includes`：只暴露这些工具，留空表示全部。

远端连不上时这个条目不产生任何工具，也不会让整个故事加载失败。

## comfyui

```json
{
  "type": "comfyui",
  "name": "绘图示例",
  "disabled": false,
  "config": {
    "code": "painter_comfyui_krea2",
    "workflow": {
      "name": "krea2_example-94bb6ad1-9104-48e7-b0ca-4e4fb69e5354",
      "value": "94bb6ad1-9104-48e7-b0ca-4e4fb69e5354"
    },
    "params": [
      { "id": 0, "code": "lora", "description": "绘图所需lora", "disabled": false },
      { "id": 1, "code": "title", "description": "绘制图像的标题", "disabled": false }
    ]
  }
}
```

* `code`：工具名。
* `description`：写在`<前缀>.desc.txt`。
* `workflow`：引用的工作流，`value`是工作流 id。导出时会带上`comfyui/`里对应的两个文件，
  见[工作区](workspace.md)。
* `params`：工作流参数到工具入参的映射。

  * `id`：对应工作流参数的`sequence`
  * `code`：暴露给模型的参数名
  * `description`：给模型看的说明
  * `disabled`：为`true`时这个参数不暴露
* 每个 comfyui 工具还会额外提供`comfyui_model_fetcher`，用来查可用的模型。
  多个 comfyui 条目会重复注册这个名字，后面的覆盖前面的。

工作流引用的 lora 等模型只是本地文件名，不会随包走，导入方需要自己登记模型。
