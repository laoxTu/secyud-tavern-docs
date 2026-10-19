# 工作区

`root/`下和预设目录并列的还有两个目录：`model/`与`comfyui/`。它们不属于任何预设，
是整个存档共用的工作区，**只在被引用时才打包**：

* `agent`工具的`config.model`引用了哪个模型，就把那个模型写进`model/`
* `comfyui`工具的`config.workflow`引用了哪个工作流，就把那两个文件写进`comfyui/`

预设本身靠`requires`打包，这两个靠工具打包。也正因为如此，导入时外层那个
「遍历`root/`下每个目录交给预设存储」的循环会跳过它们（它们没有`meta.json`），
模型与工作流是由`agent`、`comfyui`两个 provider 在自己的`saveArchive`里顺手取出来的。

## model/

文件名是`<模型 id>.model.json`，内容就是一条模型记录。默认设置引用的那条：

```json
{
  "builder": "default",
  "engine": "deepseek",
  "id": "721d5c7d-352e-43eb-be54-7ab3332fa487",
  "iterations": 20,
  "name": "default",
  "properties": {
    "config": {},
    "option": {
      "logprobs": false,
      "max_tokens": 0,
      "model": "deepseek-flash",
      "reasoning_effort": "",
      "temperature": 1,
      "thinking": { "type": "disabled" },
      "top_logprobs": 0,
      "top_p": 1
    },
    "retry": { "interval": 3, "max": 3 }
  },
  "stream": true
}
```

* `id`：模型唯一标识，也是文件名，`agent`工具的`config.model.value`引用的就是它。
* `name`：显示名，`config.model.name`用它。
* `engine`：`deepseek` `openai` `anthropic`。
* `builder`：上下文构造方式，`default`或`layered`。`layered`是模型这一侧的分层构造，
  和世界书的`layer`不是同一件事。
* `stream`：是否流式。
* `iterations`：单轮最多调用模型几次，带工具时会多轮，这个值是上限。
* `properties.config`：引擎接入配置。

  * deepseek：`{ "token": 100000 }`
  * openai：`{ "extras": "{}", "token": 100000, "format": "chat", "url": "https://api.openai.com/v1" }`，
    `format`取`chat`或`responses`，`extras`是一段 JSON 文本，会并进请求体
  * anthropic：`{ "extras": "{}", "url": "https://api.anthropic.com/v1" }`
* `properties.option`：采样参数。

  * deepseek：`model` `thinking.type`（`enabled`/`disabled`）`reasoning_effort` `temperature`
    `top_p` `max_tokens` `logprobs` `top_logprobs`
  * openai：`model` `temperature` `top_p` `presence_penalty` `frequency_penalty` `max_output_tokens`
  * anthropic：`model` `max_tokens` `temperature` `top_p`
* `properties.retry`：`interval`是流式返回超过多少秒就重试，`max`是单次请求最多重试几次。
* `key`与`iv`：api key 与它的加密向量。导出时原样写进文件，换台实例解不开，
  对外分享前删掉这两个字段。

导入时同`id`的模型**先删再建**，也就是覆盖。

## comfyui/

每个工作流两个文件，缺一不可：

* `<工作流 id>.workflow.json`：工作流正文，ComfyUI 导出的 api 格式 JSON，存成纯文本。
* `<工作流 id>.comfyui.json`：元数据与参数表。

`94bb6ad1-….comfyui.json`的结构：

```json
{
  "params": [
    {
      "config": { "node": "71", "value": [] },
      "masterId": "94bb6ad1-9104-48e7-b0ca-4e4fb69e5354",
      "name": "power_lora_71",
      "sequence": 0,
      "type": "power_lora_select"
    },
    {
      "config": { "key": "value", "node": "82", "title": "83", "value": "image" },
      "masterId": "94bb6ad1-9104-48e7-b0ca-4e4fb69e5354",
      "name": "callback_82",
      "sequence": 1,
      "type": "image_callback"
    }
  ],
  "workflow": {
    "description": "",
    "id": "94bb6ad1-9104-48e7-b0ca-4e4fb69e5354",
    "name": "krea2_example",
    "properties": {}
  }
}
```

* `workflow`：`id` `name` `properties`，`description`可省略。正文不写在这里，它在`workflow.json`里。
* `params`：工作流的可调参数。

  * `masterId`：所属工作流 id
  * `sequence`：参数序号，也是绘图工具`config.params[].id`引用的值
  * `name`：显示名，生图框里的标题
  * `type`：决定怎么呈现、怎么往工作流里写值，现注册的有`text` `prompt` `agent_text`
    `number` `select` `model_select` `power_lora_select` `image_callback`
  * `config`：随类型不同，一般至少有`node`（工作流节点号的字符串）与`value`
* 导入时同`id`的工作流先删再建，参数按`sequence`重建。

要改工作流本身，直接在 ComfyUI 里改图、再导出 api 格式的 JSON 覆盖`workflow.json`更省事；
只有补参数、改描述这类小改动才值得手改。
工作流里引用的 lora 与大模型只是本地文件名，不随包走，导入方要自己登记。
