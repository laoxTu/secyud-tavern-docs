# 脚本 (Script)

JavaScript 代码，注入到游玩界面 iframe 中执行。使用 Monaco 编辑器编写。

![脚本列表](../../images/script-list.jpeg)

## 条目字段

| 字段 | 说明 |
|---|---|
| **Code** | 唯一标识符 |
| **Name** | 显示名称 |
| **Content** | 代码内容 |
| **Priority** | 执行优先级（数值越小越先注入） |
| **Type** | 脚本类型：`module` / `importmap` / `js` |
| **Disabled** | 是否禁用 |

## 脚本类型

### importmap（导入映射）

优先级设为 `0`（最先注入），Content 为 JSON 格式的导入映射：

```json
{
    "imports": {
        "preact": "https://esm.sh/preact@10.23.1",
        "preact/": "https://esm.sh/preact@10.23.1/",
        "htm/preact": "https://esm.sh/htm@3.1.1/preact?external=preact"
    }
}
```

Type 设为 `importmap`。浏览器解析后，后续的 module 脚本可以直接 `import { render } from 'preact'`，无需完整 URL。

### module（ES 模块）

Type 设为 `module`。使用标准 ES import 语法引用 importmap 中定义的库：

```js
import { render } from 'preact';
import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';

function App() {
    const [data, setData] = useState(window.__messageData?.content ?? {});
    // ...
}

render(html`<${App} />`, document.getElementById('app'));
```

### js（普通脚本）

Type 留空或设为 `js`，直接执行的普通 JavaScript。

## 注入顺序

按 Priority 升序注入：`importmap`（priority=0）→ 普通脚本 → `module`（priority=100+）。importmap 必须先于 module 注入。

## iframe 消息 API

脚本通过 `window.addEventListener('message', handler)` 接收消息。消息格式为 `{ type: string, data: {...} }`。

### 初始数据

页面加载时，`window.__messageData` 包含初始渲染数据，与 `renderContent` 消息结构相同。

### 消息类型

| 类型 | 触发时机 | `data` 字段 |
|---|---|---|
| `streamContent` | AI 流式输出时 | `{ output, reasoningContent?: string  }` |
| `renderContent` | 翻页 / 初始加载 | `{ inputs: string[], output: string, reasoningContent?: string }` |
| `variables` | 变量更新时 | 变量键值表 |
| `slot` | Slot 初始化时 | 完整运行时数据 |

### 思考内容渲染

DeepSeek 等模型启用 Thinking 后，推理过程在 `reasoningContent` 字段中。`streamContent` 不包含思考内容，`renderContent` 完整返回。

典型渲染模式：展示用户输入 → 折叠的思考过程（可展开）→ AI 正文输出。

```js
function handleMessage(e) {
    setData(d => ({ ...d, ...e.data.data }));
}
window.addEventListener('message', handleMessage);
```
