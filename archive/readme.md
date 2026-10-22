# 存档结构文档

这套文档回答两个问题：**一个存档 zip 里到底有什么**（数据结构）、**怎么用编辑器 + 打包命令手搓出来**（操作步骤）。
运行时行为（条目如何进入上下文、脚本如何注入 iframe）不在范围内，见 `../learn/`。

## 先读哪篇

> 🎓 **想按教程学**：手把手系列在 [`../zh/archive/`](../zh/archive/readme.md)（从"第一个预设"到 8 个模板预设逐个复刻）。
> 下面的 archive 系列是**参考手册**，适合查字段、查规则、查排错。

| 你是 | 读 |
| --- | --- |
| **第一次做预设，想被讲明白** | 教程 [01-制作你的第一个预设](../zh/archive/01-制作你的第一个预设.md)（引言/目的/理论/实践） |
| 只想赶快抄一遍    | [00-快速通道](./00-快速上手.md)（最小动作清单，60 行） |
| 想查某个字段 / 某个文件干什么 | [01-存档结构](./01-存档结构.md)（手册，700 行，按需跳读） |
| 动手做集合、要完整示例和排错 | [02-手写存档指南](./02-手写存档指南.md) |
| 只想抄 JSON | [03-JSON-骨架速查](./03-JSON-骨架速查.md) |
| 想做开关、求和、循环这类玩法 | [04-进阶-宏联动](./04-进阶-宏联动.md) |
| 想看真实预设怎么写、能学什么 | [`../templates/readme.md`](../templates/readme.md) |

| 文档 | 一句话 |
| --- | --- |
| [00-快速通道](./00-快速上手.md) | 最小动作清单：目录、五个文件、打包、三条铁律、失败速查 |
| [01-存档结构](./01-存档结构.md) | 目录树、每类文件的职责、字段表、`$file$` 机制、导入/导出差异、规则变更记录（§11） |
| [02-手写存档指南](./02-手写存档指南.md) | 完整流程、打包命令、自检清单、结构层与语义层的排错 |
| [03-JSON-骨架速查](./03-JSON-骨架速查.md) | 各类 `meta.json` 的可复制骨架 + 默认值总表 |
| [04-进阶-宏联动](./04-进阶-宏联动.md) | 宏当开关（控制世界书/工具）、总开关+分项、Eta 求和与循环 |

---

## 三句话结论

1. **存档 = 一个 zip**，里面所有文件都挂在 `root/` 前缀下，`root/` 的第一层是若干预设目录（外加可选的 `model/`、`comfyui/`）。
2. **预设 = `meta.json`**，**条目 = 某个 `plural` 目录下的一个 `*.meta.json`**；内容既可以内联，也可以用 `"$file$文件名"` 指向同目录的独立文件——预设级的 `variables` / `opening` 也是这套规则，封面则是 `cover` 里直接写文件名。
3. **导入比导出宽松**：目录名、条目文件名、扩展名都随你，只要 `meta.json` 合法、`plural` 目录名正确、`$file$` 对得上真实文件名。

## 三条最容易踩的坑

| 坑 | 后果 | 规避 |
| --- | --- | --- |
| 打包后 zip 里多套了一层目录，或用反斜杠 `\` 分隔 | 全部被丢弃，导入列表为空，无报错 | 用 `tar -a -c -f x.zip root`（见 02 文档），打包后自己看一眼条目名 |
| 存档内的文件/目录名用了中文 | 名字字节编码与读取端的 UTF-8 不一致，`$file$` 命中失败，内容静默丢失 | **文件名一律 ASCII**，中文只出现在文件内容里 |
| `meta.json` 里没有 `$file$` 引用（或引用名与真实文件名不一致） | 开场白 / 变量 / 封面静默变空——**光把文件放进目录是没用的** | `"opening": "$file$opening.txt"`、`"variables": "$file$variables.json"`、`"cover": "cover.png"` 都要写在 meta 里 |

## 源码索引

| 主题 | 文件 |
| --- | --- |
| zip ↔ 树、`$file$` 读写 | `src/utils/archive.ts` |
| 预设层导入导出（meta/variables/opening/cover） | `src/presets/server/storage.ts` |
| 条目层通用扫描与命名 | `src/presets/server/factory.ts` |
| 导入/导出接口 | `src/presets/server/api.ts` |
| 各条目归档钩子 | `src/presets/{lorebooks,macros,scripts,styles,regexes}/server/storage.ts`、`src/tools/server/storage.ts`、`src/tools/*/server/index.ts` |
| 数据模型 | `src/presets/index.ts`、`src/presets/*/index.ts`、`src/tools/index.ts`、`src/presets/server/schema.ts` |
| 工作区（模型 / ComfyUI） | `src/models/server/storage.ts`、`src/comfyui/server/storage.ts` |

## 真实样例

- `docs/templates/root/`：8 个真实预设的目录树（含纯手写的 `弹幕`）。zip 是产物、不入库，用 `templates/build.bat` 现场生成；
  每个预设"是什么、该学哪一处"的逐条说明见 [`docs/templates/readme.md`](../templates/readme.md)。
- `other/archive/`：另一个手写草稿（`特殊`），演示"只提供一段文本 + 一个宏 key"的插件式预设。
