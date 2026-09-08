@echo off
cd /d "%~dp0"
echo Setting up MERLIN V7...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows-setup.ps1"
pause
