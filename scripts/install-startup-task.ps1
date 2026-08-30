$ErrorActionPreference='Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Script = Join-Path $Root 'scripts\background-merlin.ps1'
$Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$Script`""
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName 'MERLIN CNC Background' -Action $Action -Trigger $Trigger -Settings $Settings -Description 'Starts the private MERLIN CNC backend and local AI when this Windows user logs in.' -Force | Out-Null
Write-Host 'MERLIN will now start in the background at Windows login.' -ForegroundColor Green
Read-Host 'Press Enter to close'
