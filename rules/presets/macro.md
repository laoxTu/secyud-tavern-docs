# 宏

宏放在`<预设目录>/macros/`，按前缀配对：

```
macros/
├── user.meta.json
├── user.value.txt
├── memory_rules.meta.json
└── memory_rules.value.txt
```

`meta.json`写字段，值写在`value`文件里：`json`为`true`时用`.value.json`，否则用`.value.txt`。

## meta.json 字段

```json
{
  "code": "user",
  "key": "user",
  "name": "user",
  "disabled": false,
  "json": false,
  "multiple": false,
  "hidden": true
}
```

* `code`：去重键，同时是复选状态（`checkItems`）的键，也是工具`macro`字段要填的值。
  建议用`[A-Za-z0-9_]+`。
* `key`：变量名。模板里用`<%= it.day %>`这种形式取值（`day`就是宏的`key`），前缀`it.`不能省。
  同一个`key`下的多条宏构成一组。
* `name`：显示名，宏选择器里看到的就是它。
* `value`：宏的值，写在`value`文件里，扩展名由`json`决定。
  写在`meta.json`里无效：导入时会被`value`文件的读取结果覆盖成空。
* `json`：值是否按 JSON 解析，缺省`false`。

  * `true`时值可以当对象用，多个 JSON 宏会深合并
  * `false`时值就是一段文本
* `multiple`：是否复选，缺省`false`。

  * `true`：同`key`下多条可以同时勾选，内容按顺序拼接
  * `false`：同`key`下只生效一个`code`（第一个未禁用的，或已保存的那个选择）
* `hidden`：宏选择器里是否隐藏。同一`key`的组里只要有一条不隐藏，整组就会显示。
* `disabled`：初始状态。复选宏表示这条`code`是否勾选，单选宏表示是否被选中。

## 取值规则

同一个`key`下参与计算的所有宏，按下面的规则合并成一个值：

* 所有`json: true`的值深度合并成一个对象。
* 所有`json: false`的值按顺序拼接成一段文本。
* 如果合并出了对象，最终值是「这个对象 + 一个`toString()`返回那段文本」。
  于是`<%= it.day.字段 %>`取字段，`<%= it.day %>`取文本。
* 如果全是文本，最终值就是那段拼接出来的字符串。

单选时，被选中的那条会被放到最前面参与合并。

多预设叠加时宏的行为比较绕，源码里的注释是：

```
1，相同的code，不同的key共享一个禁用
2，不同的code，相同的key是正常情况
3，相同的code，相同的key，会追加且共享
```

## 值是原文，不是模板

`value`只是纯文本（`json`为`true`时是一段 JSON）。取值时只做收集与拼接，
**不会再把值本身丢回模板引擎**，也没有递归展开。所以：

* 值里写`<%= it.other %>`不会被替换，那串字符会原样跟着值走下去。
* 值之间不能互相引用，不存在宏调用宏。

模板引擎作用在**使用宏的那些文本**上，它们走同一条转化链（正则 → 宏）：

* 世界书正文
* 预设的开场白`opening.txt`
* 用户输入
* AI 输出

只有在这些文本里写`<%= it.<宏的 key> %>`才会被求值，而且替换只做一遍，
不会对替换出来的内容再跑一轮：

```
lorebooks/goal.content.md   今天的目标是 <%~ it.goal %>。
macros/goal.value.txt       找到淡水
```

`macros/goal.value.txt`里即使写了`<%~ it.user %>`，也只是当成普通字符抄进上下文。

## 写模板时的注意点

项目建 Eta 时没有开`useWith`，**所有变量都必须通过`it`访问**，
直接写宏的`key`名字会在渲染时报未定义：

```
当前是第 <%= it.day %> 天，主角是 <%~ it.user %>。
```

`<%= %>`输出转义后的结果，`<%~ %>`输出原文，提示词里一般用后者。可访问的上下文：

* `it.<宏的 key>`：所有宏的值
* `it.args`：子 agent 调用时传入的参数
* `it.variables`：当前历史变量

> `args`与`variables`是系统注入的，宏的`key`不要取这两个名字，会被覆盖掉。

`hidden`只影响宏选择器是否显示，不影响取值：宏的值只有在别处写了`<%= it.day %>`时才会进上下文。

## 常见搭配

* 单选宏做「文风」「人称」这类只能选一个的开关：同`key`、不同`code`、`multiple: false`。
* 复选宏做「追加素材」：同`key`、不同`code`、`multiple: true`，内容会依次拼起来。
* 世界书的`expression.macro`与工具的`macro`都填宏的`code`，用来把它们的启用状态挂到宏选择器上。
