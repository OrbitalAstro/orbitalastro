# Script pour démarrer le backend API
# Ce script doit être lancé dans un terminal séparé et laissé ouvert

Write-Host "🚀 Démarrage du backend API..." -ForegroundColor Green
Write-Host ""

# Activer l'environnement virtuel
Write-Host "📦 Activation de l'environnement virtuel..." -ForegroundColor Yellow
.venv\Scripts\Activate.ps1

# Démarrer le serveur
Write-Host "🌐 Démarrage du serveur sur http://localhost:8000..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT: Laissez ce terminal ouvert pendant toute la génération!" -ForegroundColor Cyan
Write-Host "   Vous pouvez minimiser cette fenêtre, mais ne la fermez pas." -ForegroundColor Cyan
Write-Host ""

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload




