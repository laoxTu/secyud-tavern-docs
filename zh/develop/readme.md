# 开发

## [插件开发](plugin.md)

本项目使用编译期插件，它可以为你带来原生nextjs项目的调试和开发体验。

## 一些约定

* 一个模块就是一个业务域，`client/`和`server/`是它在两侧的实现，所以接口名在两侧是相同的。比如`model-engine`、`tool-provider`都会各有一个。
* 注册器靠`id`去重，`sequence`粗排，`requires`声明依赖。顺序有问题时先查`requires`。
* 类型、工厂、hook直接导出；工具函数和常量用对象导出，如`presets`、`jsonUtils`。
* 新增模块或改了`manifest.json`之后，都要重新执行`pnpm prepare`并重启。

> 更细的分层、数据流与踩坑清单见仓库的`docs/learn`，代码内注释写得比较全。
