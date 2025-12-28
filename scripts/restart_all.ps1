# Script pour redémarrer l'API et le frontend
Write-Host ""
Write-Host "Redemarrage des services OrbitalAstro" -ForegroundColor Cyan
Write-Host "====================================="
Write-Host ""

# Arrêter les processus existants
Write-Host "Arret des processus existants..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "python" -and $_.Path -like "*orbitalastro*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.MainWindowTitle -like "*npm*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Démarrer l'API
Write-Host "Demarrage de l'API sur http://localhost:8000..." -ForegroundColor Yellow
$apiCmd = "cd '$PWD'; Write-Host '=== API ORBITALASTRO ===' -ForegroundColor Cyan; Write-Host 'Port: http://localhost:8000' -ForegroundColor Green; .\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $apiCmd
Start-Sleep -Seconds 3

# Démarrer le frontend
Write-Host "Demarrage du frontend sur http://localhost:3000..." -ForegroundColor Yellow
$webPath = Join-Path $PWD "web"
$frontendCmd = "cd '$webPath'; Write-Host '=== FRONTEND ORBITALASTRO ===' -ForegroundColor Cyan; Write-Host 'Port: http://localhost:3000' -ForegroundColor Green; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Services demarres!" -ForegroundColor Green
Write-Host "  API:      http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Dashboard: http://localhost:3000/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Attente de 5 secondes pour verification..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Vérifier l'API
Write-Host ""
Write-Host "Verification de l'API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  OK: API repond (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR: API ne repond pas encore" -ForegroundColor Red
}

# Vérifier le frontend
Write-Host "Verification du frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  OK: Frontend repond (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR: Frontend ne repond pas encore" -ForegroundColor Red
}

Write-Host ""
Write-Host "Termine!" -ForegroundColor Green
Write-Host ""


