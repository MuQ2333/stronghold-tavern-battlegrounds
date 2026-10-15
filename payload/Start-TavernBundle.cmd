@echo off
cd /d "%~dp0"
set HOST=127.0.0.1
set PORT=3013
node server/index.js
pause
