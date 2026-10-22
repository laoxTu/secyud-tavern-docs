# JSON / 目录骨架速查

> 复制粘贴用。字段语义见 [01-存档结构](./01-存档结构.md)，操作步骤见 [02-手写存档指南](./02-手写存档指南.md)。

## 目录速查

```
root/
├── <预设>/meta.json                    必需：id + name
├── <预设>/variables.json               可选：被 meta.variables 引用（名字随你）
├── <预设>/opening.txt                  可选：被 meta.opening 引用（名字随你）
├── <预设>/cover.png                    可选：被 meta.cover 引用（写文件名）
├── <预设>/lorebooks/<任意>.meta.json
├── <预设>/macros/<任意>.meta.json
├── <预设>/regexes/<任意>.meta.json
├── <预设>/scripts/<任意>.meta.json
├── <预设>/styles/<任意>.meta.json
├── <预设>/tools/<任意>.meta.json
├── model/<id>.model.json               可选：agent 工具引用
└── comfyui/<id>.comfyui.json
     comfyui/<id>.workflow.json
```

- `<预设>` 目录名任意；条目目录名**必须**精确。
- 条目目录内可再嵌子目录。
- 内容外置写法：字段值 = `"$file$<与该 meta 同目录的文件名>"`。
- 预设级的 `variables` / `opening` 也走 `$file$`；`cover` 例外，直接写文件名。
- **文件本身不会自动生效**：`variables.json` / `opening.txt` / `cover.png` 都必须被 meta 里的字段引用。

---

## 预设

### 最小

```json
{ "id": "my_preset", "name": "我的预设" }
```

### 全量

```json
{
  "id": "my_preset",
  "name": "我的预设",
  "version": "1.0.0",
  "description": "一句话说明",
  "tags": ["story", "setting"],
  "requires": [{ "name": "示例核心-1.0.0", "value": "demo_core" }],
  "properties": {},
  "cover": "cover.png",
  "variables": "$file$variables.json",
  "opening": "$file$opening.txt"
}
```

> `cover` 写**文件名**；`variables` / `opening` 写 `$file$文件名` 或内联文本；**不要写 `coverType`**（已废弃）。

### `variables`

meta 里：`"variables": "$file$variables.json"`（或 `"variables": "{\"hp\":100}"` 内联）

```json
{ "hp": 100, "day": 1, "flags": { "intro": true }, "related_dates": [] }
```

### `opening`

meta 里：`"opening": "$file$opening.txt"`（或直接内联一段文本）

```text
你在荒岛的浅滩上醒来，潮水正在退去。
```

### `cover`

meta 里：`"cover": "cover.png"`（值 = 图片在包内的文件名，扩展名不参与判断，MIME 由内容嗅探）

---

## 世界书 `lorebooks/`

### `always`

```json
{
  "name": "基础规则",
  "code": "rules",
  "type": "markdown",
  "match": "always",
  "expression": { "last": false, "macro": "" },
  "content": "$file$rules.md",
  "priority": 100,
  "layer": 99,
  "role": "system",
  "disabled": false
}
```

- `last: true` → 常驻后置（每轮最后注入）；`macro: "开关宏code"` → 由同名宏控制开关。

### `normal`

```json
{
  "name": "荒岛物产",
  "code": "island_items",
  "type": "plaintext",
  "match": "normal",
  "expression": {
    "keywords": [["椰子", "椰树"], ["淡水", "溪流"]],
    "keywordsLength": 2,
    "fitCount": 1
  },
  "content": "岛上有椰子与淡水溪流。",
  "priority": 100,
  "layer": 100,
  "role": "knowledge",
  "disabled": false
}
```

- 每个子数组是一组，组内**任一**关键词命中算命中 1 组；命中组数 ≥ `fitCount` 即注入。

### `event`

```json
{
  "name": "第 3 天的事件",
  "code": "event_day3",
  "type": "markdown",
  "match": "event",
  "expression": {
    "keywords": [["第三天", "第三日"]],
    "keywordsLength": 1,
    "fitCount": 1,
    "minDate": { "year": 0, "month": 1, "day": 3 },
    "maxDate": { "year": 0, "month": 1, "day": 3 }
  },
  "content": "第三天，潮水带来了一个木箱。",
  "priority": 100,
  "layer": 100,
  "role": "knowledge",
  "disabled": false
}
```

### `variable`

```json
{
  "name": "濒死",
  "code": "near_death",
  "type": "plaintext",
  "match": "variable",
  "expression": { "path": "hp", "value": "0" },
  "content": "你已濒临死亡，视野开始发黑。",
  "priority": 100,
  "layer": 100,
  "role": "system",
  "disabled": false
}
```

### `vector`

```json
{
  "name": "航海日志",
  "code": "sailing_log",
  "type": "plaintext",
  "match": "vector",
  "expression": { "keywords": "帆船、潮汐、航海" },
  "content": "……大段知识内容……",
  "priority": 100,
  "layer": 100,
  "role": "knowledge",
  "disabled": false
}
```

---

## 宏 `macros/`

```json
{
  "name": "文风：克制",
  "code": "tone_plain",
  "key": "tone",
  "value": "$file$tone.md",
  "json": false,
  "multiple": false,
  "hidden": false,
  "disabled": false
}
```

JSON 型宏（`value` 是 JSON 文本）：

```json
{
  "name": "初始属性",
  "code": "stats_default",
  "key": "stats",
  "value": "$file$stats.json",
  "json": true,
  "multiple": false,
  "hidden": false,
  "disabled": false
}
```

> 模板里的引用写法：`<%~ it.tone %>` / `<%~ it.stats.hp %>`（Eta 的数据名是 `it`）。
> 同 `key` 的多个 `code`，`multiple:false` 时只生效一个，`multiple:true` 时全部拼接。

---

## 脚本 `scripts/` / 样式 `styles/`

```json
{
  "name": "面板",
  "code": "panel",
  "content": "$file$panel.js",
  "priority": 100,
  "type": "module",
  "disabled": false
}
```

```json
{
  "name": "面板样式",
  "code": "panel",
  "content": "$file$panel.css",
  "priority": 100,
  "type": "text/css",
  "disabled": false
}
```

`type` 取值：脚本 `application/javascript` | `module` | `link` | `importmap`；样式 `text/css` | `link`。

---

## 正则 `regexes/`

```json
{
  "name": "清理方括号",
  "pattern": "\\[\\[",
  "replacement": "",
  "target": "both",
  "disabled": false
}
```

- 纯内联，无内容文件；`target`：`input` | `output` | `both`；`pattern` 是字符串（无 flags）。

---

## 工具 `tools/`

### `variable` / `lorebook` / `memory` / `elicit`（无配置）

```json
{ "name": "变量工具", "type": "variable", "macro": "variable", "disabled": false }
```

```json
{ "name": "世界书", "type": "lorebook", "macro": "lorebook", "disabled": false }
```

```json
{ "name": "记忆工具", "type": "memory", "macro": "memory", "disabled": false }
```

```json
{ "name": "提问用户", "type": "elicit", "macro": "elicit", "disabled": false }
```

### `script`

```json
{
  "name": "随机数",
  "type": "script",
  "disabled": false,
  "config": {
    "code": "roll",
    "description": "返回 [min, max] 之间的随机整数",
    "schema": "$file$random.schema.json",
    "script": "$file$random.script.js",
    "enableDoc": false,
    "enableVariable": false
  }
}
```

### `agent`

```json
{
  "name": "思维分析",
  "type": "agent",
  "disabled": false,
  "config": {
    "code": "agent_mind",
    "description": "分析角色心理",
    "schema": "$file$mind.schema.json",
    "model": { "name": "default", "value": "<model id>" },
    "presets": [{ "name": "心理分析Agent-1.0.0", "value": "agent_mind" }],
    "disablePreset": true,
    "disableTags": []
  }
}
```

### `comfyui`

```json
{
  "name": "绘图",
  "type": "comfyui",
  "disabled": false,
  "config": {
    "code": "painter",
    "description": "需要绘图时调用",
    "workflow": { "name": "krea2_example", "value": "<workflow id>" }
  }
}
```

### `fetcher`

```json
{ "name": "网页抓取", "type": "fetcher", "disabled": false, "config": { "maxResults": 5, "timeout": 30, "maxLength": 8000 } }
```

### `mcp`

```json
{
  "name": "远端 MCP",
  "type": "mcp",
  "disabled": false,
  "config": {
    "code": "mcp_demo",
    "url": "https://example.com/mcp",
    "headers": { "Authorization": "Bearer xxx" },
    "timeout": 30,
    "maxLength": 8000,
    "includes": []
  }
}
```

---

## 工作区

### `model/<id>.model.json`

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
    "option": { "model": "deepseek-flash", "temperature": 1, "max_tokens": 0 },
    "retry": { "interval": 3, "max": 3 }
  }
}
```

### `comfyui/<id>.comfyui.json`

```json
{
  "workflow": { "id": "<id>", "name": "my_workflow", "description": "", "properties": {} },
  "params": [
    { "name": "prompt", "type": "text", "sequence": 0, "config": { "node": "85", "key": "string_b", "prompt": "1girl" } }
  ]
}
```

### `comfyui/<id>.workflow.json`

工作流原始 JSON（API 格式，`{"<节点id>":{"class_type":"...","inputs":{...}}}`）。

---

## 字段默认值总表

| 类别 | 字段 | 默认值 |
| --- | --- | --- |
| 预设 | `version` | `"1.0.0"` |
| 预设 | `tags` | `[]` |
| 预设 | `requires` | `[]` |
| 预设 | `properties` | `{}` |
| 预设 | `cover` / `variables` / `opening` | 无（省略即没有；`coverType` 已废弃） |
| 条目通用 | `disabled` | `false` |
| 世界书 | `type` / `match` / `priority` / `layer` / `role` | `plaintext` / `always` / `0` / `100` / `knowledge` |
| 宏 | `json` / `multiple` / `hidden` | `false` / `false` / `false` |
| 脚本 | `priority` / `type` | `100` / `application/javascript` |
| 样式 | `priority` / `type` | `100` / `text/css` |
| 正则 | `target` | `input` |
| 工具 | `macro` | 无（不绑定） |
