# 工作区

`root/`下和预设目录并列的还有两个目录：`model/`与`comfyui/`。
它们不属于任何预设，是整个存档共用的工作区，只在被引用时才被打包。

## model/

文件名是`<模型 id>.model.json`，内容就是一条模型记录：

```json
{
  "id": "721d5c7d-352e-43eb-be54-7ab3332fa487",
  "name": "default",
  "engine": "deepseek",
  "builder": "default",
  "stream": true,
  "iterations": 20,
  "properties": {
    "config": {},
    "option": {
      "model": "deepseek-flash",
      "thinking": { "type": "disabled" },
      "reasoning_effort": "",
      "temperature": 1,
      "top_p": 1,
      "max_tokens": 0,
      "logprobs": false,
      "top_logprobs": 0
    },
    "retry": { "interval": 3, "max": 3 }
  }
}
```

* `id`：模型唯一标识，agent 工具的`config.model.value`引用的就是它，也是文件名。
* `name`：显示名。
* `engine`：接入方式，取值`deepseek` `openai` `anthropic`。
* `builder`：上下文构造方式，`default`或`layered`。

  `layered`会让世界书按`layer`分层塞进历史消息之间，而不是集中在用户输入前后。
* `stream`：是否流式。
* `iterations`：单轮最多调用模型几次。带工具时会多轮，这个值就是上限。
* `key`与`iv`：api key 与它的加密向量。导出时原样写进文件，换一台实例解不开，
  对外分享前建议把这两个字段删掉。
* `properties.config`：引擎的接入配置。

  * deepseek：`{ "token": 100000 }`
  * openai：`{ "extras": "{}", "token": 100000, "format": "chat", "url": "https://api.openai.com/v1" }`，
    `format`取`chat`或`responses`，`extras`是一段 JSON 文本，会并进请求体
  * anthropic：`{ "extras": "{}", "url": "https://api.anthropic.com/v1" }`
* `properties.option`：采样参数，字段名贴近各家接口。

  * deepseek：`model` `thinking.type`（`enabled`/`disabled`）`reasoning_effort` `temperature` `top_p` `max_tokens` `logprobs` `top_logprobs`
  * openai：`model` `temperature` `top_p` `presence_penalty` `frequency_penalty` `max_output_tokens`
  * anthropic：`model` `max_tokens` `temperature` `top_p`
* `properties.retry`：`{ interval, max }`。`interval`是流式返回超过多少秒就重试，`max`是单次请求最多重试几次。

导入时同`id`的模型会被删掉再重建，也就是覆盖。
agent 工具的`config.model`引用了哪个模型，那个模型就会被打进包。

## comfyui/

每个工作流两个文件，缺一不可：

* `<工作流 id>.workflow.json`：工作流正文，ComfyUI 导出的 api 格式 JSON，存成纯文本。
* `<工作流 id>.comfyui.json`：工作流的元数据与参数表。

```json
{
  "workflow": {
    "id": "94bb6ad1-9104-48e7-b0ca-4e4fb69e5354",
    "name": "krea2_example",
    "description": "",
    "properties": {}
  },
  "params": [
    {
      "masterId": "94bb6ad1-9104-48e7-b0ca-4e4fb69e5354",
      "sequence": 0,
      "name": "power_lora_71",
      "type": "power_lora_select",
      "config": { "node": "71", "value": [] }
    }
  ]
}
```

* `workflow`：`id` `name` `properties`，`description`可选。`content`不写在这里，它就在`workflow.json`里。
* `params`：工作流的可调参数。

  * `masterId`：所属工作流 id，与文件同名
  * `sequence`：参数序号，也是绘图工具`config.params[].id`引用的值
  * `name`：参数显示名，生图框里的标题
  * `type`：参数类型，决定怎么呈现、怎么往工作流里写值
  * `config`：随类型不同，一般至少有一个`node`（工作流节点号的字符串）与一个`value`
* `type`现在注册了这几种：`text` `prompt` `agent_text` `number` `select` `model_select`
  `power_lora_select` `image_callback`。

绘图工具的`config.workflow.value`指向工作流 id 时，这两个文件会一起打进包。

> 这两个文件通常是导出时生成的。要改工作流本身，直接在 ComfyUI 里改图、
> 再导出 api 格式的 JSON 覆盖`workflow.json`更省事，手写意义不大。
> 只有补一个参数、改描述这类小改动才值得手改。
> 另外工作流里引用的 lora 与大模型只是本地文件名，不会随包走，导入方要自己登记。
