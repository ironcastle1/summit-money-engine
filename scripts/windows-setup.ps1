$ErrorActionPreference = "Stop"
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
Write-Host "Installing MERLIN dependencies..."
npm install
Write-Host "Creating/validating MERLIN database..."
npm run seed
Write-Host "Checking JavaScript syntax..."
npm run check
Write-Host "MERLIN setup complete. Run: npm start"
