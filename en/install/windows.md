# Windows Installation Guide

## Install via Git

1. Install NodeJS (the latest LTS version is recommended)
2. Install Git for Windows
3. Open Windows Explorer (Win+E)
4. Browse to or create a folder not controlled or monitored by Windows (e.g., C:\MySpecialFolder\)
5. Open a command prompt in that folder by clicking the address bar at the top, typing `cmd`, and pressing Enter
6. Once the black box (Command Prompt) appears, enter the following command and press Enter:
    * `git clone https://github.com/laoxTu/secyud-tavern`
7. After cloning is complete, double-click `start.bat` to let NodeJS install the required dependencies
8. The server will then start, and you can access it from your browser at `http://127.0.0.1:12804`

### Updating

1. Navigate to the installation folder
2. Open a command prompt in that folder by clicking the address bar at the top, typing `cmd`, and pressing Enter
3. Pull the latest code with the following command:
   * `git pull`
4. Double-click `start.bat`
