@echo off
chcp 65001 >nul
where node >nul 2>nul
if errorlevel 1 (
 echo 请先安装 Node.js 22 或更高版本，再运行本脚本。
 pause
 exit /b 1
)
node "%~dp0install.mjs" %*
pause
