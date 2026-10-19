# 宏

宏放在`<预设目录>/macros/`，一条`meta.json`配一个`value`文件。默认设置 5 条，分成两组：

| 文件 | code | key | name | multiple | disabled |
| --- | --- | --- | --- | --- | --- |
| `tool-ask_user` | `ask_user` | `tools` | 提问用户工具 | `true` | `false` |
| `tool-get_lorebook` | `lorebook` | `tools` | 世界书工具 | `true` | `false` |
| `tool-memory` | `set_memory` | `tools` | 记忆设置规则 | `true` | `false` |
| `tool-variable` | `variable` | `tools` | 变量工具集 | `true` | `false` |
| `variable-related_dates` | `variable` | `variable` | 变量-相关日期 | `true` | `false` |

四条`tools`的正文都是给模型看的`<tool>`说明片段，拼成`it.tools`塞进规则；
`variable`那条是变量定义，拼成`it.variable`塞进`变量格式`世界书。

注意最后一行和前一行`code`都是`variable`：**同`code`不同`key`共用一个勾选状态**，
所以在选择器里「变量工具集」和「变量-相关日期」是两个复选框，实际上却联动。

## 字段

```json
{
  "code": "lorebook",
  "disabled": false,
  "hidden": false,
  "json": false,
  "key": "tools",
  "multiple": true,
  "name": "世界书工具"
}
```

* `code`：去重键，也是勾选状态的键，还是工具的`macro`、世界书`expression.macro`要填的值。
  建议`[A-Za-z0-9_]+`。
* `key`：变量名，模板里写`it.<key>`取值。同一个`key`下的多条宏构成一组。
* `name`：显示名，选择器里看到的就是它。
* `value`：值写在`value`文件里，`json`决定后缀`.value.json`还是`.value.txt`。
  写在`meta.json`里无效，导入时会被文件内容覆盖成空。
* `json`：值是否按 JSON 解析，缺省`false`。
* `multiple`：`true`是复选框，`false`是单选。
* `hidden`：在选择器里是否隐藏。同一`key`组里只要有一条不隐藏，整组都显示。
* `disabled`：初始状态。**注意它是"初始不参与"的意思**，`false`＝默认勾上。
  默认设置 5 条全是`false`，所以装好之后它们都是开着的。

## 勾选状态怎么存

存在 realm 的`checkItems`里，键是`code`，值语义是**是否禁用**（源码注释就是"这是 disabled"）：

```
checkItems[code] === true    → 这条宏不参与
checkItems[code] === undefined → 回落到 meta 里的 disabled
```

于是同一个`code`被世界书`expression.macro`或工具`macro`引用时，三处一起联动：

* 勾选 → 宏参与拼接、绑定的世界书注入、绑定的工具可用
* 取消 → 宏不参与、绑定的世界书不注入、绑定的工具停用

单选宏（`multiple: false`）走另一张表`selections[key]`，同`key`只生效一个`code`：
有保存的选择就用它，没有就取同组条目顺序里的第一条（而这个顺序由`sorter`决定，
同`sorter`时并不保证稳定）。单选宏的`disabled`字段其实不参与判断——取值只看
`selections[key] === code`，所以「默认不选某一条」在单选里做不到，只能改用复选。
默认设置 5 条全是复选，没这个隐患；预设天道的`段落长度`组是单选，`disabled: true`那条照样可能被自动选中。

## 取值规则

同`key`下所有参与计算的宏合并成一个值：

* `json: true`的值深合并成一个对象，合并完再挂一个`toString()`返回那段文本。
  于是`it.day.字段`取字段，`it.day`取文本。
* `json: false`的值按顺序拼成一段文本，**不带分隔符**，空串会被丢掉。
* 全是文本时，最终值就是那段字符串。
* 单选时被选中的那条排在最前面参与合并。

拼接顺序由条目的`sorter`（`key + multiple + hidden`）决定，**和文件名里的下标无关**；
`sorter`完全相同时顺序不保证，所以别让顺序承重。

多预设叠加时源码里写了三条规则：

```
1，相同的code，不同的key共享一个禁用
2，不同的code，相同的key是正常情况
3，相同的code，相同的key，会追加且共享
```

## 值是原文

`value`是纯文本（`json: true`时是一段 JSON），取值时只做收集与拼接，
**不会把值本身再丢回模板引擎**，也没有递归展开：

* 值里写`<%~ it.user %>`不会被替换，会原样跟着值走下去。
* 值之间不能互相引用，不存在宏调用宏。

模板引擎作用在**用宏的那些文本**上，它们和用户输入、AI 输出走同一条链（正则 → 宏）：

* 世界书正文
* `opening.txt`
* 用户输入
* AI 输出

```
lorebooks/goal.content.md   今天的目标是 <%~ it.goal %>。
macros/goal.value.txt       找到淡水
```

`goal.value.txt`里即使写了`<%~ it.user %>`，也只是当成普通字符抄进上下文。
替换只做一遍，替换出来的内容不会跑第二轮。

**`key`不存在时渲染成字面量`undefined`**。`it.tools`、`it.variable`都由默认设置自己提供，
`it.write_styles`则由预设天道提供——单独装默认设置，规则正文末尾就会多出一个`undefined`。

## 常见搭配

* 复选宏做「可叠加的素材」：同`key`、不同`code`、`multiple: true`，内容依次拼接。
  默认设置的`tools`组就是这么做的。
* 单选宏做「文风」「人称」这类只能选一个的开关：同`key`、不同`code`、`multiple: false`。
* 想让工具或世界书跟着宏开关走，`macro`/`expression.macro`填宏的`code`；
  填了一个没人提供的`code`，开关就是死的，见[踩过的坑](pitfalls.md)。
