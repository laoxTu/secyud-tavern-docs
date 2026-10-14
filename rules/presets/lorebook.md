# 世界书

世界书放在`<预设目录>/lorebooks/`，按前缀配对：

```
lorebooks/
├── rules.meta.json
├── rules.content.txt
├── variables.meta.json
└── variables.content.md
```

`meta.json`写字段，正文写在`content`文件里。正文文件的扩展名由`type`决定。

## meta.json 字段

```json
{
  "code": "rules",
  "name": "规则",
  "disabled": false,
  "type": "markdown",
  "match": "always",
  "expression": { "last": false },
  "priority": 100,
  "layer": 10,
  "role": "system"
}
```

* `code`：去重键。同一预设内`code`相同即同一条；运行时键是`<预设 id>-<code>`，
  所以不同预设的同名条目不会互相覆盖。建议用`[A-Za-z0-9_]+`，可以为空串。
* `name`：显示名。
* `type`：正文字段的类型，决定正文文件扩展名与编辑器的语法高亮：

  * `json`→`.json`，`plaintext`→`.txt`，`markdown`→`.md`，`yaml`→`.yaml`，`xml`→`.xml`
  * 其它值一律按`.txt`处理；缺省值`plaintext`
  * `type`为`json`时，正文注入前会被压成一行
* `match`：匹配方式，取值`always` `normal` `event` `variable` `vector`，决定`expression`怎么写。
* `expression`：匹配参数，见下一节。
* `priority`：同层内的顺序，值越小越靠前。缺省`0`。
* `layer`：插入位置。缺省`100`。

  排序键是`layer * 10000 + priority`。默认的`builder`下，`layer`小于 100 的条目放在用户输入之前，
  大于等于 100 的放在用户输入之后。用`layered`的`builder`时，世界书会按`layer`分层塞进历史消息之间。
* `role`：注入时用的角色，取值`knowledge` `system` `user` `assistant`，缺省`knowledge`。

  * `knowledge`：伪装成一次知识查询的结果注入，不占真实消息位
  * `system`：系统设定
  * `user`：用户输入
  * `assistant`：AI 输出
  * 连续的同`role`条目会被合并成一段，段与段之间空一行
* `disabled`：可选，缺省即启用。
* `entryId`：数据库主键，导入时重新编号，可省略。

> `desc`字段是历史遗留，现在的代码不读，删掉即可。

## expression

### always

常驻。默认注入到第一条用户消息前后。

```json
{ "last": false }
```

* `last`：`true`时放在最后一条消息之后，`false`放在第一条消息之前。
* `macro`：可选，填一个宏的`code`。该宏被勾选时这条世界书不再注入，用来做总开关。

  注意绑定的判定走的是宏的`code`，所以被绑的宏应该是`multiple: true`的宏，否则勾选状态不在同一张表里。

### normal

关键词匹配。

```json
{
  "keywords": [["岛屿", "海岛"]],
  "keywordsLength": 1,
  "fitCount": 1
}
```

* `keywords`：字符串数组的数组，「组」是最小单位，组内任意一个词出现即该组命中。
* `keywordsLength`：词组数量，与`keywords.length`对应，界面上最多 4 组。
* `fitCount`：至少命中多少组才算通过，上限是组数。

关键词在「当前消息文本 + 已执行工具的结果」里查找，匹配是纯字符串包含。

### event

在`normal`的基础上加一段日期区间。

```json
{
  "keywords": [["冬祭"]],
  "keywordsLength": 1,
  "fitCount": 1,
  "minDate": { "year": 1, "month": 1, "day": 1 },
  "maxDate": { "year": 2, "month": 12, "day": 31 }
}
```

* 除`keywords`三项外，多出`minDate`与`maxDate`，每项是`{ year, month, day }`。
* 先看当前历史变量`relatedDates`里是否存在落在区间内的日期，通过后再做关键词匹配。
* 这个类型依赖有别的世界书把日期写进`relatedDates`，单独用不会生效。

### variable

```json
{ "path": "day", "value": "2" }
```

* `path`：变量路径。
* `value`：用来比较的值，字符串，做全等比较（内部会把变量值转成字符串）。

### vector

语义匹配。

```json
{}
```

不需要参数，写空对象即可。这个类型不是自动触发的：必须给 AI 启用世界书工具，
由 AI 主动查询，命中的条目才会注入。而且 RAG 设置不能被禁用，
禁用后不建向量库，工具只会返回提示。

## 模板里的用法约定

模板`readme.md`里提过一对搭配，值得沿用：

* `rules`：常驻的系统提示词，`match`用`always`、`last`为`false`、`role`用`system`，`layer`取小值。
  一轮对话里基本不变，一般只在总结后重建缓存时才动。
* `callback`：强提示，`match`用`always`、`last`为`true`、`role`用`user`，
  正文由宏拼出来。这类条目消耗的 token 很少。

## 正文的其它注意点

* 正文会经过宏与正则，和用户输入、AI 输出走同一条转化链。
  引用宏时要写`<%~ it.<宏的 key> %>`这种带`it.`前缀的形式，见[宏](macro.md)。
* 同一条世界书在多轮对话里只会注入一次。
* 把正文写在`meta.json`里无效，导入时会被`content`文件的读取结果覆盖成空。
