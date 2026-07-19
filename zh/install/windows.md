# Windows 安装指南

## 通过 Git 安装

1. 安装 NodeJS（推荐使用最新的 LTS 版本）
2. 安装 Git for Windows
3. 打开 Windows 资源管理器（Win+E）
4. 浏览或创建一个不受 Windows 控制或监视的文件夹（例如：C:\MySpecialFolder\）
5. 通过点击顶部的"地址栏"，输入 cmd 并按回车键，在该文件夹中打开命令提示符。
6. 当黑色框（命令提示符）弹出后，输入以下命令并按回车：
    * `git clone https://github.com/laoxTu/secyud-tavern`
7. 克隆完成后，双击 `start.bat` 让 NodeJS 安装所需的依赖。
8. 服务随后将启动，你可以从浏览器访问`http://127.0.0.1:12804`使用

### 更新

1. 进入安装文件夹
2. 通过点击顶部的"地址栏"，输入 cmd 并按回车键，在该文件夹中打开命令提示符。
3. 使用以下命令拉取最新代码：
   * `git pull`
4. 双击 `start.bat`