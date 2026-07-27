@echo off
cd /d "%~dp0"
echo Installing dependencies...
call npm install --package-lock=false --no-audit --no-fund
echo Starting Summit Money Engine...
call npm start
pause
