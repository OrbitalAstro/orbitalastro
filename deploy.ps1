# Script de déploiement sur Vercel
# Exécutez ce script après avoir redémarré votre terminal PowerShell

Write-Host "=== Déploiement OrbitalAstro API sur Vercel ===" -ForegroundColor Cyan

# Vérifier que Node.js et npm sont installés
Write-Host "`nVérification de Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✓ Node.js $nodeVersion installé" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js non trouvé. Veuillez redémarrer le terminal après l'installation." -ForegroundColor Red
    exit 1
}

# Vérifier npm
Write-Host "`nVérification de npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-Host "✓ npm $npmVersion installé" -ForegroundColor Green
} else {
    Write-Host "✗ npm non trouvé. Veuillez redémarrer le terminal." -ForegroundColor Red
    exit 1
}

# Installer Vercel CLI si nécessaire
Write-Host "`nInstallation/ mise à jour de Vercel CLI..." -ForegroundColor Yellow
npm install -g vercel

# Vérifier que Vercel CLI est installé
$vercelVersion = vercel --version 2>$null
if ($vercelVersion) {
    Write-Host "✓ Vercel CLI $vercelVersion installé" -ForegroundColor Green
} else {
    Write-Host "✗ Échec de l'installation de Vercel CLI" -ForegroundColor Red
    exit 1
}

# Se connecter à Vercel
Write-Host "`nConnexion à Vercel..." -ForegroundColor Yellow
Write-Host "Ouvrez votre navigateur si une fenêtre s'ouvre pour l'authentification." -ForegroundColor Cyan
vercel login

# Déployer
Write-Host "`n=== Déploiement en cours ===" -ForegroundColor Cyan
Write-Host "Répondez aux questions suivantes :" -ForegroundColor Yellow
Write-Host "- Set up and deploy? : Y" -ForegroundColor White
Write-Host "- Which scope? : [Votre compte]" -ForegroundColor White
Write-Host "- Link to existing project? : N (pour un nouveau projet)" -ForegroundColor White
Write-Host "- What's your project's name? : orbitalastro-api (ou le nom de votre choix)" -ForegroundColor White
Write-Host "- In which directory is your code located? : ./" -ForegroundColor White
Write-Host ""
vercel

# Option pour déployer en production
Write-Host "`n=== Déploiement terminé ===" -ForegroundColor Green
Write-Host "Pour déployer en production, exécutez : vercel --prod" -ForegroundColor Cyan



