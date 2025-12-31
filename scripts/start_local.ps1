# Script pour lancer l'API et le frontend en local
Write-Host ""
Write-Host "Demarrage de l'environnement local OrbitalAstro"
Write-Host "================================================"
Write-Host ""

# Options
$forceRestart = $args -contains "--restart" -or $args -contains "-r"

# Arreter les processus sur un port
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        $owningPids = $connections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ }
        foreach ($owningPid in $owningPids) {
            Stop-Process -Id $owningPid -Force -ErrorAction SilentlyContinue

            # Uvicorn --reload peut laisser un processus enfant actif (multiprocessing spawn)
            # meme si le PID "parent" n'existe plus. On tue donc aussi les enfants de ce PID.
            $children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$owningPid" -ErrorAction SilentlyContinue
            foreach ($child in $children) {
                Stop-Process -Id $child.ProcessId -Force -ErrorAction SilentlyContinue
            }

            # Et en dernier recours, on tue les python spawn_main qui pointent vers parent_pid=<owningPid>
            $spawnChildren = Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
                Where-Object { $_.CommandLine -and $_.CommandLine -match "parent_pid=$owningPid" }
            foreach ($child in $spawnChildren) {
                Stop-Process -Id $child.ProcessId -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        # Ignorer
    }
}

if ($forceRestart) {
    Write-Host "Redemarrage force..." -ForegroundColor Yellow
    Stop-ProcessOnPort -Port 8000
    Stop-ProcessOnPort -Port 3000
    Start-Sleep -Seconds 2

    if (Test-Path "web\\.next") {
        Remove-Item -Recurse -Force "web\\.next" -ErrorAction SilentlyContinue
    }
}

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

# S'assurer que le frontend pointe vers l'API en IPv4 (evite les soucis localhost -> ::1)
$envPath = "web\\.env.local"
$desiredApiUrlLine = "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000"
if (-not (Test-Path $envPath)) {
    Set-Content -Path $envPath -Encoding ascii -Value $desiredApiUrlLine
} else {
    $raw = Get-Content -Path $envPath -Raw -ErrorAction SilentlyContinue
    $lines = @()
    if ($raw) {
        $lines = $raw -split "(`r`n|`n|`r)"
    }

    # Remove any existing NEXT_PUBLIC_API_URL lines, keep other vars intact.
    $filtered = $lines | Where-Object { $_ -and ($_ -notmatch '^\s*NEXT_PUBLIC_API_URL\s*=') }
    $final = @($desiredApiUrlLine) + $filtered

    Set-Content -Path $envPath -Encoding ascii -Value $final
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
    $apiCmd = @"
cd '$currentDir'
Write-Host '=== BACKEND ORBITALASTRO ===' -ForegroundColor Cyan
Write-Host 'Port: http://localhost:8000' -ForegroundColor Green
Write-Host ''
if (Test-Path '.\.venv\Scripts\Activate.ps1') {
    & .\.venv\Scripts\Activate.ps1
    Write-Host 'Virtualenv active' -ForegroundColor Gray
}
    python -m uvicorn main:app --host 127.0.0.1 --port 8000
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $apiCmd
    Start-Sleep -Seconds 5
    Write-Host "API demarree" -ForegroundColor Green
    Write-Host "   Attendez 5-10 secondes que le backend soit pret..." -ForegroundColor Yellow
}

# Vérifier le port 3000 (Frontend)
if (Test-Port -Port 3000) {
    Write-Host "OK: Frontend deja en cours sur http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "Demarrage du frontend sur http://localhost:3000..." -ForegroundColor Yellow
    $currentDir = Get-Location
    $webPath = Join-Path $currentDir "web"
    $frontendCmd = @"
cd '$webPath'
Write-Host '=== FRONTEND ORBITALASTRO ===' -ForegroundColor Cyan
Write-Host 'Port: http://localhost:3000' -ForegroundColor Green
Write-Host ''
npm run dev -- -p 3000
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
    Start-Sleep -Seconds 5
    Write-Host "Frontend demarre" -ForegroundColor Green
    Write-Host "   Attendez 10-15 secondes que le frontend soit pret..." -ForegroundColor Yellow
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
Write-Host "Configuration terminee!"
Write-Host ""
