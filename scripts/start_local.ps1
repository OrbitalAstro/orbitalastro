# Script pour lancer l'API et le frontend en local
Write-Host ""
Write-Host "Demarrage de l'environnement local OrbitalAstro"
Write-Host "================================================"
Write-Host ""

# Vérifier que le venv existe
if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
    Write-Host "ERREUR: .venv introuvable. Creez-le d'abord avec: py -m venv .venv" -ForegroundColor Red
    exit 1
}

# Vérifier que les dépendances sont installées
if (-not (Test-Path "web\node_modules")) {
    Write-Host "ATTENTION: node_modules introuvable dans web/. Installation..." -ForegroundColor Yellow
    Set-Location web
    npm install
    Set-Location ..
}

Write-Host "Verification des services..."
Write-Host ""

# Fonction pour vérifier si un port est utilisé
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    } catch {
        return $false
    }
}

# Vérifier le port 8000 (API)
if (Test-Port -Port 8000) {
    Write-Host "OK: API deja en cours sur http://localhost:8000" -ForegroundColor Green
} else {
    Write-Host "Demarrage de l'API sur http://localhost:8000..." -ForegroundColor Yellow
    $currentDir = Get-Location
    $apiCmd = "cd '$currentDir'; .\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $apiCmd
    Start-Sleep -Seconds 3
    Write-Host "API demarree" -ForegroundColor Green
}

# Vérifier le port 3000 (Frontend)
if (Test-Port -Port 3000) {
    Write-Host "OK: Frontend deja en cours sur http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "Demarrage du frontend sur http://localhost:3000..." -ForegroundColor Yellow
    $currentDir = Get-Location
    $webPath = Join-Path $currentDir "web"
    $frontendCmd = "cd '$webPath'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
    Start-Sleep -Seconds 5
    Write-Host "Frontend demarre" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================"
Write-Host "Services demarres!"
Write-Host ""
Write-Host "API:      http://localhost:8000"
Write-Host "Frontend: http://localhost:3000"
Write-Host "Dashboard: http://localhost:3000/dashboard"
Write-Host ""
Write-Host "Pour tester:"
Write-Host "  1. Ouvrez http://localhost:3000/dashboard dans votre navigateur"
Write-Host "  2. Entrez les donnees de naissance"
Write-Host "  3. Cliquez sur 'Calculate Chart'"
Write-Host ""
Write-Host "Appuyez sur une touche pour tester l'API..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Test de l'API
Write-Host ""
Write-Host "Test de l'API..."
Write-Host ""
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "OK: API repond: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Contenu: $($response.Content)"
} catch {
    Write-Host "ERREUR: API ne repond pas encore. Attendez quelques secondes..." -ForegroundColor Red
    Write-Host "   Erreur: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Configuration terminee!"
Write-Host ""
