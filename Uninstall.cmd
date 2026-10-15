@echo off
chcp 65001 >nul
node "%~dp0install.mjs" --uninstall %*
pause
