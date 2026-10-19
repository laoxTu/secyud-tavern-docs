# 预设本体

一个预设就是`root/`下的一个目录，目录名即预设`id`。目录里放`meta.json`与各类条目目录，
结构见[总览](readme.md)。

## meta.json

默认设置的真实文件：

```json
{
  "cover": null,
  "description": null,
  "id": "settings",
  "name": "基础设置",
  "properties": {},
  "requires": [],
  "tags": ["settings", "preset"],
  "version": "1.1.3"
}
```

* `id`：预设唯一标识，同时是归档目录名、`requires`引用的值。建议用`[A-Za-z0-9_]+`。
* `name`：显示名。
* `version`：用户自填的字符串。预设下拉、`requires`的`name`里显示成`name-version`。
  默认设置的`requires`写的是`"基础设置-1.1.2"`，而本体已经`1.1.3`——`name`只用于显示，
  对不上不影响加载，真正决定加载的是`value`。
* `cover`：封面文件 id。没有封面写`null`或`""`。
* `coverType`：导出时自动补上的 MIME（如`image/png`），决定封面存成`cover.<ext>`。
  没有封面时这个字段根本不出现，手写不要写。
* `description`：描述，没有就写`null`或`""`。
* `tags`：字符串数组，筛选是`LIKE '%tag%'`的子串匹配，不做枚举校验。
  代码认可的一套是`theme` `story` `preset` `agent` `app` `component` `setting` `tool`，
  而默认设置写的是`settings`——按`setting`筛照样能命中，反之亦然；
  拼成两个毫无关系的词（如`setting`对`theme`）才会筛不出来。
* `requires`：依赖，形如`[{ "name": "基础设置-1.1.2", "value": "settings" }]`，只认`value`。
  依赖会随本预设一起打进包，加载时排在引用者之前（BFS 后整体反转）。
* `properties`：预留对象，写`{}`。

`entries`、`variables`、`opening`虽然属于预设，但不写在`meta.json`里，
导出时也会被显式剔除，分别落到下面几个独立文件。

导入是两段式的：先把包解析成候选列表，再按用户勾选的`id`逐个落库。
**同`id`的预设会先删掉再重建**，所以重装等于覆盖，条目的`entryId`会全部换新。

## variables.json

预设的初始变量，内容是一个 JSON 对象的文本：

```json
{ "money": 0, "day": 1 }
```

* 多个预设叠加时深度合并，按加载顺序叠加（依赖在前、使用者在后）。
* 读出来直接交给 JSON 解析，不合法就等于没有变量，不报错。
* 不需要初始变量就别建这个文件（默认设置没有）。
* 运行时在模板里通过`it.variables`访问当前历史变量；变量条目的结构另见[宏](macro.md)里
  `variable`那组。

## opening.txt

开场白，每个预设可以出一段，多段按预设顺序合成开场消息。
它和用户输入走同一套转化（正则 → 宏），所以里面可以写宏模板。

`docs/templates/root/疯狂水世界/opening.txt`只有一行：

```
<%~ it.opening %>
```

正文其实来自`key`为`opening`的宏。不建文件或留空，表示这个预设不出开场白（默认设置没有）。

## 模板上下文

Eta 建实例时没开`useWith`，所有变量都要走`it`：

* `it.<宏的 key>`：宏的值，见[宏](macro.md)
* 子 agent 调用时，工具入参**摊平**到顶层：schema 里有`character`就写`it.character`，
  没有`it.args`这一层
* `it.variables`：当前历史变量
* `it.space`：当前轮的空间属性

合并顺序是「宏值 → 子 agent 入参 → `space`/`variables`」，后面的盖前面的，
所以宏的 key 不要取`space`、`variables`，子 agent 的入参名也会盖掉同名宏。

`<%~ %>`输出原文，`<%= %>`输出转义后的结果，提示词里用前者。
**key 不存在时渲染成字面量`undefined`**，不报错也不会变空——默认设置的
`<%~ it.write_styles %>`就是靠预设天道补上这个 key 的。

## 封面

`cover.png`/`cover.jpg`等，扩展名由`coverType`反查：

* `image/png`→`png`，`image/jpeg`→`jpg`，`image/gif`→`gif`，`image/webp`→`webp`
* `image/svg+xml`→`svg`，`image/bmp`→`bmp`，`image/x-icon`与`image/vnd.microsoft.icon`→`ico`
* `image/tiff`→`tiff`，`image/avif`→`avif`，`image/heic`→`heic`，`image/heif`→`heif`，`image/apng`→`apng`

只认`coverType`对应那一个文件名。封面用 STORE 存，不压缩。
