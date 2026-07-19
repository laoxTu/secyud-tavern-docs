# Linux 安装指南

## 手动 Git 安装

对于 MacOS / Linux，所有这些操作都将在终端（Terminal）中完成。

1. 安装 git 和 nodeJS（具体方法将根据您的操作系统而异）
2. 克隆仓库
    * `git clone https://github.com/laoxTu/secyud-tavern`
3. 使用 `cd secyud-tavern` 进入安装文件夹。
4. 使用以下任一命令运行 start.sh 脚本：
    * `./start.sh`
    * `bash start.sh`
5. 服务随后将启动，你可以从浏览器访问`http://127.0.0.1:12804`使用

### 更新

1. 进入安装文件夹
2. 使用以下命令拉取最新代码：
   * `git pull`
3. 使用以下任一命令运行 start.sh 脚本：
   * `./start.sh`
   * `bash start.sh`