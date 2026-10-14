# 正则

正则放在`<预设目录>/regexes/`，只有元数据一个文件，查找替换的两段内容都写在`meta.json`里：

```
regexes/
└── clean-0.meta.json
```

## meta.json 字段

```json
{
  "name": "clean",
  "disabled": false,
  "target": "output",
  "pattern": "\\[\\[.*?\\]\\]",
  "replacement": ""
}
```

* `name`：显示名，同时也是文件名前缀（正则用`name`而不是`code`），还是应用顺序的排序键。
* `pattern`：匹配串。直接交给`String.prototype.replace`，**不是**正则字面量。

  * 不要写成`/.../g`：项目不解析字面量与标志位，`/`会被当成普通字符
  * 要写转义时按 JSON 字符串来，`\\`表示一个反斜杠，例如`"\\d+"`
* `replacement`：替换文本，支持`$1`、`$&`这类 JS 替换模式。
* `target`：作用范围，取值`input` `output` `both`，缺省`input`。

  * `input`：发送给模型前替换
  * `output`：渲染到页面前替换
  * `both`：两边都替换
* `disabled`：可选，缺省即启用。
* `entryId`：数据库主键，导入时重新编号，可省略。

## 注意

* 正则在所有条目里**不去重**，多预设叠加时会全部依次执行，顺序按`name`字符串升序。
  所以多个正则之间要避让时，用`name`控制先后，不要依赖列表顺序。
* 工具调用的内容（`role`为`tool`）不参与替换。
* 宏的求值排在正则之后，也就是先替换、再把结果交给宏。
* 一条`meta.json`里没有`code`字段，运行时也不需要一个——正则不按`code`去重。
