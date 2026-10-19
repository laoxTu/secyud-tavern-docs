# 改预设踩过的坑

这篇不讲格式，讲「按格式写对了、但还是不生效」的那类问题，都是对着默认设置和源码核对过的。
其中前几项纠正了旧版说明里与代码相反的说法。

## 旧说明里的三处错

* **`expression.macro`的方向写反了。** 旧说明写「该宏被勾选时这条世界书不再注入」，
  实际是**勾选时注入、取消勾选时不注入**（`fixed()`里判的是`!checkItems[macro]`，
  而`checkItems[code] === true`表示这条宏被禁用）。所以`变量格式`是跟着`variable`
  这个复选框走的：勾上才在，取消就整条消失。
* **变量名是`related_dates`，不是`relatedDates`。** `event`匹配器读的是
  `variables.related_dates`，写错这个名字`event`条目永远不触发，也不报错。
* **没有`it.args`。** 子 agent 的工具入参是摊平到顶层的：schema 里有`character`
  就写`it.character`。写`it.args.character`只会得到空。

## 缺 key 会渲染成 `undefined`

Eta 拿到`undefined`不会报错，`<%~ it.xxx %>`直接输出字面量`undefined`。
默认设置的规则正文里有两处引用：`<%~ it.tools %>`（自己提供）和
`<%~ it.write_styles %>`（由预设天道提供）。只装默认设置、不装天道，
系统提示词里就会多出一个`undefined`。加宏之前先确认这个`key`由谁提供。

## 工具绑定的宏 code 要真存在

`tool.macro`填的是宏的`code`。填了一个没人为它提供宏的`code`，工具仍然按
`disabled`兜底生效，但它在选择器里的开关是死的——勾选只是往一个没人读的键里写值。

默认设置里就有两处对不上：

| 工具 | 填的`macro` | 实际提供的宏`code` |
| --- | --- | --- |
| 提问用户 | `elicit` | `ask_user` |
| 记忆工具 | `memory` | `set_memory` |

结果是这两个工具的说明文字在`it.tools`里，但开关并不联动。想把它们连起来，
把`macro`改成`ask_user`、`set_memory`即可。改完记得工具名不变，只影响勾选。

## 单选宏的 `disabled` 不生效

单选宏（`multiple: false`）的取值只看`selections[key] === code`，
`disabled`字段根本没被读。没保存过选择时，同组里的第一条会被自动选中，
而这个顺序由`sorter`（`key + multiple + hidden`）决定，同`sorter`时并不稳定——
所以「默认不选某一条」在单选里做不到，只能改用复选。
复选宏的`disabled`才是有效的初始状态（`false`＝默认勾上）。

## 同一个 `code` 会共享状态

同`code`不同`key`共享一个勾选状态（源码注释里的规则 1）。默认设置里
`变量工具集`（`key: tools`）和`变量-相关日期`（`key: variable`）都写`code: variable`，
于是选择器里是两个复选框、背后一个值，点哪个都会一起变。
所以**不要把两个不相干的宏写成同一个`code`**；反之想联动就故意写成同一个。

世界书没有这个问题：运行时键是`<预设 id>-<code>`，跨预设撞`code`既不覆盖也不共享禁用，
可以放心同名。真正按名字共享的是**工具**——按工具名进同一张表，后面的直接盖掉前面的。

## 前缀与文件

* 前缀只负责配对，`Object.keys`里第一个`startsWith`命中的就是内容文件。
  所以同目录里不要出现两个前缀互相包含的条目（如`a`与`a-1`）。
* 前缀里不要带`.`，分组按第一个`.`之前的部分做。
* 正文文件后缀不参与匹配：`type: plaintext`配`.content.xml`照样能读。
  导出时才会按`type`重新起名，所以别指望改后缀来换类型。
* 正文为空的条目不写进包，等于这条不存在。

## 没人读的字段

`desc`（世界书）、`config.hidden`（脚本工具）、agent 的`config.maxLength`
现在的代码都不读（`maxLength`已从`AgentConfig`里删掉）。默认设置里还留着它们，
改的时候顺手删掉即可，不影响行为。

## 顺序

* 条目顺序由`meta.json`里算出的`sorter`决定，与文件名、目录排列无关。
  宏的`sorter`是`key + multiple + hidden`，工具的`sorter`是`type + name`。
  所以`it.tools`里几段`<tool>`的先后不要依赖文件名下标。
* 世界书的注入顺序是`layer * 10000 + priority`，默认设置里`变量格式`（45）在`规则`（50）前。
* 正则按`name`字符串升序执行，多预设叠加时全部依次跑，不去重。

## 记忆与向量

* 嵌入模型上限 512 token，超了静默截断，正文尾部等于没进向量库。
  中文大致一字一 token，正文控制在 500 字以内就稳。
* 向量检索只能由 AI 主动调`get_lorebook`触发，命中结果**下一轮**才进上下文。
* `get_lorebook`返回的是条目的`name`，注入靠条目 id，两者别混。
* RAG 设置禁用时不建向量库，所有向量条目失效，工具只返回提示。

## 导入导出

* 同`id`的预设、模型、工作流都是**先删再建**，重装等于覆盖，条目`entryId`全部换新。
* 一个包里出现多个预设目录是正常的：`requires`、`agent`的`presets`与`model`、
  `comfyui`的`workflow`引用到的都会被一起打包。
* 压缩包里必须有`root/`这一层，否则一条都读不到。
* `docs`是 git 子模块，`git status`要在`docs`目录里看，父仓库只显示指针变化。

## 改完自检

* 条目总数对不对，有没有漏掉夹在中间的条目。
* `code`有没有意外撞车（尤其`variable`这种通用名）。
* 正文里引用的每个`it.<key>`都有人提供。
* 工具的`macro`能在选择器里找到对应复选框。
