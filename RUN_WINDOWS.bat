@echo off
setlocal
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js is not installed. Install Node.js LTS from https://nodejs.org then run this again.
  pause
  exit /b 1
)
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
  echo npm install failed.
  pause
  exit /b 1
)
echo Starting Summit Money Engine...
call npm start
pause
