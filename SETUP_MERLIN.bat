@echo off
cd /d "%~dp0"
echo Setting up MERLIN V5...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows-setup.ps1"
pause
