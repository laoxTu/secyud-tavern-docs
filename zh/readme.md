# Secyud Tavern 中文文档

## 什么是 Secyud Tavern

Secyud Tavern是一个高度自定义的AI角色交互平台，它允许你搭建自己的AI互动流程。

## 安装

请根据您的平台选择相应的安装指南：

- [Windows](install/windows.md)
- [Linux](install/linux.md)

## 快速开始

预设的源码在 `docs/templates/root/`（8 个可玩预设 + 模型/ComfyUI 工作区）。在 `docs/templates/` 下执行
`tar -a -c -f default.zip root`（或直接跑 `build.bat`）得到存档 zip，然后在**预设 → 导入**里选中它、
勾选需要的预设、确认，最后用"从预设开始"进入游玩。

> 打包出来的 `*.zip` 不进版本库；导入时依赖不会自动补，带 `requires` 的预设要一起勾。

## 预设教程

从零做出自己的预设，然后逐个复刻模板里的 8 个预设：

- [教程总览与地图](archive/readme.md)
- [01 制作你的第一个预设](archive/01-制作你的第一个预设.md)

## 项目指南

### [使用指南](guide/readme.md)

### [开发指南](develop/readme.md)
