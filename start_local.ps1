# Script pour démarrer le projet OrbitalAstro en local
# Démarre le backend (port 8000) et le frontend (port 3000)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 Démarrage d'OrbitalAstro" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vérifier Python
Write-Host "🐍 Vérification de Python..." -ForegroundColor Cyan
try {
    $pythonVersion = python --version 2>&1
    Write-Host "   $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Vérifier Node.js
Write-Host "📦 Vérification de Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>&1
    Write-Host "   Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Vérifier si le venv existe
if (-not (Test-Path ".venv")) {
    Write-Host "📦 Création du virtualenv..." -ForegroundColor Yellow
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de la création du virtualenv" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Virtualenv créé" -ForegroundColor Green
}

# Activer le virtualenv
Write-Host "📦 Activation du virtualenv..." -ForegroundColor Cyan
& .\.venv\Scripts\Activate.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'activation du virtualenv" -ForegroundColor Red
    exit 1
}

# Vérifier les dépendances Python
Write-Host "🔍 Vérification des dépendances Python..." -ForegroundColor Cyan
$fastapiInstalled = pip show fastapi 2>&1 | Select-String -Pattern "Name: fastapi" -Quiet
if (-not $fastapiInstalled) {
    Write-Host "📥 Installation des dépendances Python..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances Python" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dépendances Python installées" -ForegroundColor Green
} else {
    Write-Host "✅ Dépendances Python déjà installées" -ForegroundColor Green
}

# Vérifier les dépendances Node.js
Write-Host "🔍 Vérification des dépendances Node.js..." -ForegroundColor Cyan
if (-not (Test-Path "web\node_modules")) {
    Write-Host "📥 Installation des dépendances Node.js..." -ForegroundColor Yellow
    Push-Location web
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances Node.js" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "✅ Dépendances Node.js installées" -ForegroundColor Green
} else {
    Write-Host "✅ Dépendances Node.js déjà installées" -ForegroundColor Green
}

# Créer .env.local si nécessaire
if (-not (Test-Path "web\.env.local")) {
    Write-Host "📝 Création du fichier .env.local..." -ForegroundColor Yellow
    try {
        "NEXT_PUBLIC_API_URL=http://localhost:8000" | Out-File -FilePath "web\.env.local" -Encoding utf8 -NoNewline
        Write-Host "✅ Fichier .env.local créé" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Impossible de créer .env.local automatiquement" -ForegroundColor Yellow
        Write-Host "   Créez-le manuellement avec: NEXT_PUBLIC_API_URL=http://localhost:8000" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Fichier .env.local existe déjà" -ForegroundColor Green
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Démarrage des serveurs..." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 URLs:" -ForegroundColor Yellow
Write-Host "   Backend API:  http://localhost:8000" -ForegroundColor Green
Write-Host "   Frontend Web: http://localhost:3000" -ForegroundColor Green
Write-Host "   API Docs:     http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Les serveurs vont s'ouvrir dans des fenêtres séparées" -ForegroundColor Yellow
Write-Host "   Appuyez sur Ctrl+C dans chaque fenêtre pour arrêter" -ForegroundColor Yellow
Write-Host ""

# Obtenir le chemin absolu
$projectPath = (Get-Location).Path
$webPath = Join-Path $projectPath "web"

# Démarrer le backend dans un nouveau terminal
Write-Host "🔧 Démarrage du backend (port 8000)..." -ForegroundColor Cyan
$backendScript = @"
Set-Location -LiteralPath '$projectPath'
if (Test-Path '.\.venv\Scripts\Activate.ps1') {
    & .\.venv\Scripts\Activate.ps1
} else {
    Write-Host 'Virtualenv non trouve, utilisation de Python global' -ForegroundColor Yellow
}
Write-Host 'Backend API demarre sur http://localhost:8000' -ForegroundColor Green
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"@
$backendScript | Out-File -FilePath "$env:TEMP\start_backend.ps1" -Encoding UTF8
Start-Process powershell -ArgumentList "-NoExit", "-File", "$env:TEMP\start_backend.ps1"

# Attendre un peu pour que le backend démarre
Start-Sleep -Seconds 3

# Démarrer le frontend dans un nouveau terminal
Write-Host "🌐 Démarrage du frontend (port 3000)..." -ForegroundColor Cyan
$frontendScript = @"
Set-Location -LiteralPath '$webPath'
Write-Host 'Frontend demarre sur http://localhost:3000' -ForegroundColor Green
npm run dev
"@
$frontendScript | Out-File -FilePath "$env:TEMP\start_frontend.ps1" -Encoding UTF8
Start-Process powershell -ArgumentList "-NoExit", "-File", "$env:TEMP\start_frontend.ps1"

Write-Host ""
Write-Host "✅ Les serveurs sont en cours de démarrage!" -ForegroundColor Green
Write-Host "   Ouvrez http://localhost:3000 dans votre navigateur" -ForegroundColor Yellow
Write-Host ""

