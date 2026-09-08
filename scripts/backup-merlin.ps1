$ErrorActionPreference='Stop'
$Root=Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root
$BackupDir=Join-Path $Root 'backups'
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$zip=Join-Path $BackupDir "MERLIN-DATA-$stamp.zip"
if(-not (Test-Path 'data')){throw 'No MERLIN data directory found.'}
Compress-Archive -Path 'data\*' -DestinationPath $zip -CompressionLevel Optimal
Write-Host "Backup created: $zip" -ForegroundColor Green
Read-Host 'Press Enter to close'
