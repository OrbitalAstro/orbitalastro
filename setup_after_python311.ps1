# Run this AFTER installing Python 3.11.11
# Make sure to close and reopen PowerShell first!

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ORBITALASTRO BACKEND SETUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check Python 3.11 is available
Write-Host "[1/7] Checking Python 3.11..." -ForegroundColor Yellow
try {
    $version = py -3.11 --version 2>&1
    Write-Host "  $version" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Python 3.11 not found!" -ForegroundColor Red
    Write-Host "  Make sure you:" -ForegroundColor Yellow
    Write-Host "  1. Installed Python 3.11.11" -ForegroundColor Yellow
    Write-Host "  2. Checked 'Add to PATH' during installation" -ForegroundColor Yellow
    Write-Host "  3. Closed and reopened PowerShell" -ForegroundColor Yellow
    exit 1
}

# Kill Python processes
Write-Host "[2/7] Killing existing Python processes..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Remove old .venv
Write-Host "[3/7] Removing old virtual environment..." -ForegroundColor Yellow
if (Test-Path .venv) {
    cmd /c rmdir /s /q .venv 2>$null
    Start-Sleep -Seconds 1
    Write-Host "  Removed" -ForegroundColor Green
} else {
    Write-Host "  No old .venv found" -ForegroundColor Gray
}

# Create new venv
Write-Host "[4/7] Creating virtual environment with Python 3.11..." -ForegroundColor Yellow
py -3.11 -m venv .venv
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Failed to create venv" -ForegroundColor Red
    exit 1
}
Write-Host "  Created" -ForegroundColor Green

# Activate and upgrade pip
Write-Host "[5/7] Activating venv and upgrading pip..." -ForegroundColor Yellow
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Failed to upgrade pip" -ForegroundColor Red
    exit 1
}
Write-Host "  Upgraded" -ForegroundColor Green

# Install dependencies
Write-Host "[6/7] Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "  Installed" -ForegroundColor Green

# Verify packages
Write-Host "[7/7] Verifying packages..." -ForegroundColor Yellow
python -c "import uvicorn, fastapi, pydantic, swisseph; print('  ✅ All packages OK')" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  WARNING: Some packages may have issues" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Start the server with:" -ForegroundColor Yellow
Write-Host "  python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload" -ForegroundColor White
Write-Host "`nOr run:" -ForegroundColor Yellow
Write-Host "  .\start_backend.ps1" -ForegroundColor White
Write-Host ""

