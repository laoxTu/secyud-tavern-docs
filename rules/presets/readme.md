# 预设文件格式规则

这套规则用于手写或修改`docs/templates/root`里的预设文件，
只讲各个配置字段的含义与格式，不讲代码实现。按主题拆成几篇，改哪一部分就看哪一篇。

* [预设本体](preset.md)：预设目录、`meta.json`、`variables.json`、`opening.txt`、封面
* [世界书](lorebook.md)：`lorebooks/`
* [宏](macro.md)：`macros/`
* [正则](regex.md)：`regexes/`
* [脚本](script.md)：`scripts/`
* [样式](style.md)：`styles/`
* [工具](tool.md)：`tools/`
* [工作区](workspace.md)：`model/`、`comfyui/`
* [踩过的坑](pitfalls.md)：向量条目、`event`匹配、`role`取舍、归档等容易改错的地方

## 归档长什么样

`docs/templates/example.zip`是`docs/templates/root`的压缩包，也是一个完整存档。
导入时只认第一段路径为`root`的条目，所以压缩包里必须有一层`root`：

```
root/
├── <预设 id>/
│   ├── meta.json
│   ├── variables.json
│   ├── opening.txt
│   ├── cover.png
│   └── lorebooks/  macros/  regexes/  scripts/  styles/  tools/
├── model/<模型 id>.model.json
└── comfyui/
    ├── <工作流 id>.comfyui.json
    └── <工作流 id>.workflow.json
```

一个包可以放多个预设目录。`meta.json`的`requires`里引用到的预设会沿依赖闭包一起被打包，
所以「某个预设包里有好几个目录」是正常现象。

## 条目文件的命名

每种条目都是「元数据 + 内容」，两者靠**前缀**配对：

| 条目 | 目录 | 元数据 | 内容 |
| --- | --- | --- | --- |
| 世界书 | `lorebooks/` | `<前缀>.meta.json` | `<前缀>.content.<ext>` |
| 宏 | `macros/` | `<前缀>.meta.json` | `<前缀>.value.txt`或`.value.json` |
| 正则 | `regexes/` | `<前缀>.meta.json` | 无，全部写在元数据里 |
| 脚本 | `scripts/` | `<前缀>.meta.json` | `<前缀>.script.js`或`.json`/`.txt` |
| 样式 | `styles/` | `<前缀>.meta.json` | `<前缀>.style.css`或`.txt` |
| 工具 | `tools/` | `<前缀>.meta.json` | 视`type`而定，见[工具](tool.md) |

现行代码导出时前缀这样拼：

* 世界书、脚本、样式：`<code>-<下标>`
* 宏：`<code>-<key>-<下标>`
* 正则、工具：`<name>-<下标>`（用显示名，不是`code`）

但前缀只负责文件配对，真正生效的值全部来自`meta.json`，
所以历史模板里的`char_count1-1.meta.json`、`随机数工具.meta.json`（没有下标）照样能用。

只有三条硬要求：

* 同一条目的元数据与内容文件前缀必须完全一致。
* 同一目录内前缀不能重复，重复就会互相覆盖。
* 前缀里不要出现`.`，分组是按文件名的第一个`.`之前的字符串做的。

## 条目的通用字段

六种条目都共用下面几个字段：

* `name`：显示名，界面上看到的就是它。工具与正则还用`name`做文件名前缀。
* `disabled`：可选，缺省即启用。
* `entryId`：数据库主键，导入时会重新编号，手写时可以不写，留着也不会出错。
* `id`：运行时用的键（如世界书的`<预设 id>-<code>`），导出时一般不出现，手写不要加。

其余字段各自不同，见各篇。

## 几条容易踩的约定

* `meta.json`是唯一权威。内容文件按前缀模糊读取，取`Object.keys`里第一个命中的，前缀有歧义就会静默读错文件。
* 内容为空时不落盘。把`value`/`content`写在`meta.json`里是无效的：导入时会被内容文件的读取结果覆盖成空。
* 条目顺序由`meta.json`字段算出的`sorter`决定，与文件名、目录里的排列顺序无关。
* 空目录不会写进包，清空某类条目后可以整目录删掉。
* `desc`（世界书）与`config.hidden`（脚本工具）是历史遗留字段，现在的代码不读，删掉即可。
* 世界书正文、开场白、用户输入、AI 输出会依次过正则与宏，在这些文本里引用宏要带`it.`前缀，
  写`<%= it.day %>`而不是`<%= day %>`；而宏自己的`value`不是模板，见[宏](macro.md)。

> 仓库里的`docs/learn/11-预设系统.md`讲的是同一批格式的来龙去脉，
> 想看「为什么这么设计」可以对照着读。
