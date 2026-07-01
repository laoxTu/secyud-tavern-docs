# Provider（服务商）

选择模型服务商并配置 API 参数。切换 Provider 下拉框时，下方的配置表单会实时切换。


---

## DeepSeek


| 字段 | 说明 |
|---|---|
| **API Key** | DeepSeek API 密钥，加密存储，导出不含密钥 |
| **Model** | `deepseek-v4-flash`（快速）/ `deepseek-v4-pro`（高性能） |
| **Thinking** | 启用推理模式（DeepSeek 思考链）。开启后 Temperature / Top P 隐藏，Reasoning Effort 显示 |
| **Stream** | 是否启用流式输出（逐 token 推送） |
| **Max Tokens** | 单次回复最大 token 数，0 表示不限制 |
| **Logprobs** | 是否返回 token 概率（当前禁用） |
| **Top Logprobs** | 返回概率最高的 N 个 token（当前禁用） |
| **Reasoning Effort** | 推理深度：`high` / `max`（仅 Thinking 开启时可见） |
| **Temperature** | 生成随机性（0-2，越高越随机，Thinking 开启时隐藏） |
| **Top P** | 核采样阈值（0-1，Thinking 开启时隐藏） |

---

## OpenAI 兼容

| 字段 | 说明 |
|---|---|
| **Base URL** | 自定义 API 地址，可接入任何 OpenAI 兼容服务（如 Ollama、LocalAI） |
| **Model** | 模型名称，自由填写（如 `gpt-4o`、`qwen-plus`） |
| **API Key** | API 密钥，加密存储，导出不含密钥 |
| **Stream** | 是否启用流式输出 |
| **Temperature** | 生成随机性（0-2） |
| **Top P** | 核采样阈值（0-1） |
| **Presence Penalty** | 话题新颖度惩罚（-2 到 2，正值鼓励谈论新话题） |
| **Frequency Penalty** | 重复惩罚（-2 到 2，正值减少逐字重复） |
| **Max Tokens** | 单次回复最大 token 数 |
| **Extras** | 额外参数，JSON 格式。用于传入 OpenAI 标准参数之外的扩展字段 |
