# 预设规则

这组规则是照着 `docs/templates/root/默认设置`（`id` 为 `settings`，基础设置 `1.1.3`）逐条拆出来的，
示例用的都是它的真实文件。和别的说明冲突时以这里为准——旧版说明里有几处和代码实际行为相反，
见[踩过的坑](pitfalls.md)。

默认设置是整个预设栈的底座，上面的预设靠`requires`挂上来：

```
settings（默认设置）      ui_default（默认交互）
        └────────┬────────┘
           preset_tiandao（预设天道）
                   └── app_simulation（模拟经营）
                           ├── story_terminal（终末）
                           └── fkssj（疯狂水世界）
```

所以要改某个宏、某条世界书之前，先确认它是**谁**提供的：`it.write_styles` 在默认设置里没有，
由预设天道提供，单独装默认设置就会渲染成字面量`undefined`。

## 默认设置长这样

```
默认设置/
├── meta.json
├── lorebooks/
│   ├── rules.meta.json     rules.content.xml
│   └── variable.meta.json  variable.content.xml
├── macros/
│   ├── tool-ask_user.meta.json
│   ├── tool-get_lorebook.meta.json
│   ├── tool-memory.meta.json
│   ├── tool-variable.meta.json
│   └── variable-related_dates.meta.json
│   （每条宏另配一个 .value.xml）
└── tools/
    ├── 世界书.meta.json
    ├── 变量工具.meta.json
    ├── 记忆工具.meta.json
    ├── 提问用户.meta.json
    ├── 思维分析.meta.json      .desc.txt  .schema.json
    ├── 绘图示例.meta.json      .desc.txt
    └── 随机数工具.meta.json    .desc.txt  .schema.json  .script.js
```

一共 14 个条目（28 个文件）：2 条世界书、5 条宏、7 个工具。没有`variables.json`、`opening.txt`、封面，
也没有正则、脚本、样式——这三类条目默认设置一个都没用，格式收在[其它条目](extra.md)。

## 一套存档的结构

```
root/
├── <预设 id>/
│   ├── meta.json                 必需
│   ├── variables.json            可选
│   ├── opening.txt               可选
│   ├── cover.<ext>               可选，扩展名由 coverType 反查
│   └── lorebooks/  macros/  tools/  regexes/  scripts/  styles/
├── model/<模型 id>.model.json    工作区，被引用才打包
└── comfyui/<工作流 id>.comfyui.json
        <工作流 id>.workflow.json
```

导入时只认第一段路径为`root`的条目，所以压缩包里必须有一层`root/`。
一个包可以放多个预设目录：`requires`引用的预设会沿依赖闭包一起打包，
`agent`工具引用的预设、模型，`comfyui`工具引用的工作流同理，见[工作区](workspace.md)。

## 条目都是「元数据 + 内容」

两者靠**文件名前缀**配对，前缀就是去掉后缀的部分：

| 条目 | 目录 | 元数据 | 内容 |
| --- | --- | --- | --- |
| 世界书 | `lorebooks/` | `<前缀>.meta.json` | `<前缀>.content.<任意>` |
| 宏 | `macros/` | `<前缀>.meta.json` | `<前缀>.value.<任意>` |
| 工具 | `tools/` | `<前缀>.meta.json` | `<前缀>.desc.txt`、`.schema.json`、`.script.js` |
| 正则 | `regexes/` | `<前缀>.meta.json` | 无，全在元数据里 |
| 脚本 | `scripts/` | `<前缀>.meta.json` | `<前缀>.script.js`或`.json`/`.txt` |
| 样式 | `styles/` | `<前缀>.meta.json` | `<前缀>.style.css`或`.txt` |

导出时前缀这样拼：世界书、脚本、样式用`<code>-<下标>`；宏用`<code>-<key>-<下标>`；
工具与正则用`<name>-<下标>`。默认设置里就混着两种：宏是`tool-memory`（手写名），
工具是`随机数工具`（中文显示名）。

**前缀只负责配对，真正生效的值全在`meta.json`**，所以前缀怎么起都行，但有四条硬要求：

* 同一条目的元数据与内容文件前缀必须完全一致。
* 同一目录内前缀不能重复，重复会互相覆盖。
* 前缀里不要出现`.`，分组按文件名第一个`.`之前的字符串做。
* 内容文件的后缀**不参与匹配**：读者只按前缀做`startsWith`，取`Object.keys`里第一个命中的。
  默认设置把`type`/`json`写成`plaintext`/`false`，内容文件却叫`.content.xml`、`.value.xml`，
  照样能读——后缀纯粹是给人看的（导出时才会按`type`重新起名）。

## 写元数据时的约定

* `code`用`[A-Za-z0-9_]+`。它是去重键，跨条目、跨预设都靠它对齐。
* `name`是显示名，工具与正则还拿它当文件名前缀。
* `disabled`可省略，缺省即启用。
* `entryId`是数据库主键，导入时重新编号，手写可以不写。
* `id`是运行时的键（如世界书的`<预设 id>-<code>`），导出时不出现，手写不要加。
* `meta.json`里不要写`value`/`content`：导入时会被内容文件的读取结果覆盖成空。
  正文为空时文件根本不写进包，所以空内容等于没有。
* `desc`是历史遗留字段，现在的代码不读它（默认设置里还留着，无害）；`config.hidden`同理。

## 各篇

* [预设本体](preset.md)：`meta.json`、`variables.json`、`opening.txt`、封面
* [世界书](lorebook.md)：`lorebooks/`
* [宏](macro.md)：`macros/`
* [工具](tool.md)：`tools/`
* [工作区](workspace.md)：`model/`、`comfyui/`
* [其它条目](extra.md)：正则、脚本、样式（默认设置没用，仓库里别的预设用到）
* [踩过的坑](pitfalls.md)：改预设时实际会踩到的东西

想看「为什么这么设计」，对照`docs/learn/11-预设系统.md`；模板本身在`docs/templates/root`。
