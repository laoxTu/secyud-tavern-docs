# 样式 (Style)

CSS 样式，注入到游玩界面 iframe 中。使用 Monaco 编辑器编写。

![样式列表](../../images/style-list.jpeg)

| 字段 | 说明 |
|---|---|
| **Code** | 唯一标识符 |
| **Name** | 显示名称 |
| **Content** | CSS 代码 |
| **Priority** | 应用优先级（越大越后加载，覆盖前面的样式） |
| **Disabled** | 是否禁用 |

样式只作用于 iframe 内部，多个预设的样式按优先级合并。
