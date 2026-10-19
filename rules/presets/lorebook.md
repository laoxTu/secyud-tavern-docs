# 世界书

默认设置只有两条，都在`lorebooks/`里，一条`meta.json`配一个正文文件：

| 文件 | code | name | role | layer | priority | expression |
| --- | --- | --- | --- | --- | --- | --- |
| `rules.*` | `rules` | 规则 | `system` | 50 | 100 | `{ "last": false }` |
| `variable.*` | `variable` | 变量格式 | `system` | 45 | 100 | `{ "last": false, "macro": "variable" }` |

`rules.meta.json`的原文：

```json
{
  "code": "rules",
  "desc": "描述规则，需要稳定常驻的类型",
  "disabled": false,
  "expression": { "last": false },
  "layer": 50,
  "match": "always",
  "name": "规则",
  "priority": 100,
  "role": "system",
  "type": "plaintext"
}
```

正文放在`rules.content.xml`里，`type`却是`plaintext`——正文文件的后缀不参与匹配，
只按前缀`rules.content.`去找，见[总览](readme.md)。正文长这样：

```xml
<tool name='get_knowledge'>
<invoke policy="user-only"/>
<when_not>...</when_not>
<desc>...</desc>
</tool>

<%~ it.tools %>

<%~ it.write_styles %>
```

也就是说这条常驻规则的正文本身是模板，真正内容来自`key`为`tools`与`write_styles`的宏。

## 字段

* `code`：去重键，建议`[A-Za-z0-9_]+`（可以为空串）。运行时键是`<预设 id>-<code>`，
  所以跨预设撞`code`既不会互相覆盖、也不共享禁用状态，同名条目可以共存。
  真正的共享只发生在宏的`checkItems`上，见[宏](macro.md)。
* `name`：显示名。
* `type`：正文的类型，只影响编辑器高亮与导出时的后缀。
  `json`→`.json`、`plaintext`→`.txt`、`markdown`→`.md`、`yaml`→`.yaml`、`xml`→`.xml`，
  其它一律按`.txt`。`json`的正文在注入前会被压成一行。
* `match`：`always` `normal` `event` `variable` `vector`，默认设置只用`always`。
* `expression`：随`match`变化，见下。
* `priority`：同层内的先后，越小越靠前，缺省`0`。
* `layer`：插入位置，缺省`100`。排序键是`layer * 10000 + priority`，
  所以默认设置里`variable`（45）排在`rules`（50）前面。
* `role`：`knowledge` `system` `user` `assistant`，缺省`knowledge`。
* `disabled`：可省略，缺省即启用；禁用后连正文都不读。
* `desc`：历史遗留，代码不读（默认设置还留着）。
* `entryId`：导入时重新编号，可省略。

## 排序与插入

构造器目前只注册了`default`，取不到名字就退回它。它的行为：

1. `layer < 100`的条目在用户输入**之前**注入，`layer >= 100`的在之后。
2. 同一次上下文构造内按`layer * 10000 + priority`升序排列。
3. 相邻且`role`相同的条目合并成一段，段与段之间空一行。
4. 同一次请求里同一条只注入一次（跑过就记进`visited`），下一轮请求重新算。

`role`决定落到哪：

* `system`：并进系统提示词，占真实消息位。默认设置两条都是`system`。
* `knowledge`：伪装成一次`get_knowledge`工具调用的结果，不占消息位。
* `user`：当作用户输入。
* `assistant`：当作 AI 输出。

## expression

### always

常驻，默认设置用的就是它。

* `last`：`true`放在最后一条消息之后，`false`放在最前面。
* `macro`：填一个宏的`code`，把它当作这条世界书的开关。

  **宏勾选（启用）时世界书正常注入；宏取消勾选时这条世界书不注入。**
  默认设置里`变量格式`绑了`variable`，所以它和变量工具、
  `变量-相关日期`是同一个开关（这三者用的是同一个`code`）。
  绑定的宏应当在选择器里可见，否则这个开关点不到。
  `macro`只在`always`上生效。

### 其它匹配方式

| match | 参数 | 行为 |
| --- | --- | --- |
| `normal` | `keywords`（二维数组）、`keywordsLength`、`fitCount` | 当前消息文本 + 本轮工具结果里做字符串包含，命中的组数够`fitCount`才注入 |
| `event` | 在`normal`之上加`minDate`/`maxDate`（`{year,month,day}`） | 先看历史变量`related_dates`里有没有落在区间的日期，再走关键词 |
| `variable` | `path`、`value` | 变量值转成字符串后与`value`全等 |
| `vector` | `{}` | 语义检索，必须由 AI 主动调`get_lorebook`触发，且 RAG 不能禁用 |

`event`依赖`related_dates`这个变量，而它只由宏`variable`那组写出来；
没有那套东西时`event`永远不会触发，也不报错。

## 正文会被当作模板

正文和开场白、用户输入、AI 输出走同一条转化链：**正则 → 宏**。所以：

* 引用宏要带`it.`前缀，写`<%~ it.tools %>`，写成`<%= tools %>`会在渲染时报未定义。
* 宏只替换一遍，替换出来的内容里再有模板不会被二次求值。
* 正文里写`<memory_rules/>`这类记号只会原样输出。
* 正文为空的条目导出时文件根本不写进包，等于不存在。
