# Script PowerShell pour lancer la génération de dialogues
# Utilise le fichier CSV dans Downloads

# Activer l'environnement virtuel
.venv\Scripts\Activate.ps1

# Chemin du fichier CSV
$csvFile = "C:\Users\isabe\Downloads\Finances - Vision - Mission - Actions - PDF.csv"

# Répertoire de sortie
$outputDir = "dialogues_pdf"

# Vérifier que le fichier existe
if (-not (Test-Path $csvFile)) {
    Write-Host "❌ Fichier introuvable: $csvFile" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Fichier CSV: $csvFile" -ForegroundColor Green
Write-Host "📁 Répertoire de sortie: $outputDir" -ForegroundColor Green
Write-Host ""

# Lancer le script Python
python scripts/batch_generate_dialogues.py $csvFile --output-dir $outputDir

Write-Host ""
Write-Host "✅ Terminé! Les PDFs sont dans: $outputDir" -ForegroundColor Green




