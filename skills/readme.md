# skills

存放可复用的写作与编码约定，供人和 AI 使用。

## 目录

* [secyud-tavern-style](secyud-tavern-style/SKILL.md)

## 说明

每个 skill 是一个文件夹，入口固定为`SKILL.md`，开头用 YAML frontmatter 声明：

```yaml
---
name: <skill 名称，与文件夹同名>
description: <什么时候该用它，写清触发场景>
---
```

正文写可执行的约定，尽量给出量化依据与真实文件路径，避免空泛的原则。
如果在仓库里发现了反例，以仓库现状为准，回来更新 skill。
