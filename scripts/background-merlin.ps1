$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root
try { Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2 | Out-Null }
catch { Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Hidden; Start-Sleep -Seconds 3 }
$port=3000
try { Invoke-RestMethod "http://127.0.0.1:$port/api/health" -TimeoutSec 2 | Out-Null; exit 0 } catch {}
Start-Process -FilePath 'node' -ArgumentList 'server.js' -WorkingDirectory $Root -WindowStyle Hidden
