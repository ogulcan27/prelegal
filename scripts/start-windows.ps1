# Build the prelegal image and start a fresh container at http://localhost:8000
Set-Location (Join-Path $PSScriptRoot "..")
docker build -t prelegal .
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker rm -f prelegal 2>$null | Out-Null
$envFile = @()
if (Test-Path .env) { $envFile = @("--env-file", ".env") }
docker run -d --name prelegal -p 8000:8000 @envFile prelegal
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "prelegal running at http://localhost:8000"
