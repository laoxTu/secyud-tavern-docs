# 预设本体

一个预设就是`root/`下的一个目录，目录名即预设`id`。
目录里放`meta.json`与各类条目目录，见[总览](readme.md)。

## meta.json

```json
{
  "id": "settings",
  "name": "基础设置",
  "version": "1.1.2",
  "cover": null,
  "description": null,
  "tags": ["settings", "preset"],
  "requires": [],
  "properties": {}
}
```

* `id`：预设唯一标识，同时是归档目录名、`requires`引用的值。建议用`[A-Za-z0-9_]+`。
* `name`：显示名。
* `version`：版本，用户自填。预设下拉里显示成`name-version`。
* `cover`：封面文件 id。没有封面写`null`或`""`；有封面时这里是一个 uuid。
  手写时保持`null`，除非你真的放了封面图并写了`coverType`，
  否则导入后`cover`会指向一个不存在的文件。
* `coverType`：导出时自动补的 MIME（如`image/png`），用来决定封面存成`cover.<ext>`。
  手写可以省略，保存时若取不到对应文件，就当没有封面。
* `description`：描述。
* `tags`：字符串数组，用于筛选。匹配方式是`LIKE '%tag%'`，不做枚举校验，
  所以`setting`与`settings`这类不一致不会报错，只是筛不出来。
  代码里给出的一套标签是`theme` `story` `preset` `agent` `app` `component` `setting` `tool`。
* `requires`：依赖的其他预设，形如`[{ "name": "模拟经营-1.2.0", "value": "app_simulation" }]`。
  只认`value`（被依赖预设的`id`），`name`仅供显示。
  依赖会随本预设一起被打进包，加载时排在引用者之前。
* `properties`：预留对象，写`{}`。

`entries`、`variables`、`opening`这三个字段虽然也属于预设，但不写在`meta.json`里，
分别落到下面几个独立文件。

## variables.json

预设的初始变量，内容是一个 JSON 对象的文本：

```json
{ "money": 0, "day": 1 }
```

* 多个预设叠加时做深度合并，按加载顺序叠加（依赖在前、使用者在后）。
* 读取后交给 JSON 解析，不是合法 JSON 就等于没有变量，不会报错。
* 不需要初始变量时就不要这个文件。

## opening.txt

开场白。每个预设可以出一段，多段按预设顺序合成开场消息。
内容与用户输入走同一套转化（宏、正则），所以里面可以写宏模板。

`docs/templates/root/疯狂水世界/opening.txt`里只有一行：

```
<%~ it.opening %>
```

`<%~ %>`是 Eta 的原文输出，`<%= %>`是转义输出。Eta 没有开`useWith`，
所以上下文都要带`it.`前缀：`it.<宏的 key>`、`it.args`（子 agent 传入的参数）、
`it.variables`（当前历史变量）。
在上面的例子里，开场白正文其实来自`key`为`opening`的宏，也就是`it.opening`。

留空或不建文件，表示这个预设不出开场白。

## 封面

`cover.png` / `cover.jpg`等，扩展名由`coverType`反查：

* `image/png`→`png`，`image/jpeg`→`jpg`，`image/gif`→`gif`
* `image/webp`→`webp`，`image/svg+xml`→`svg`，`image/bmp`→`bmp`
* `image/x-icon`与`image/vnd.microsoft.icon`→`ico`
* `image/tiff`→`tiff`，`image/avif`→`avif`，`image/heic`→`heic`，`image/heif`→`heif`，`image/apng`→`apng`

封面用 STORE 存，不参与压缩。只有`coverType`对应的那一个文件名会被读取，
文件名对不上就当作没有封面。
