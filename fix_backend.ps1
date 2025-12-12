# OrbitalAstro Backend Environment Repair - One-Shot Script
# Run this entire script in PowerShell: .\fix_backend.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ORBITALASTRO BACKEND REPAIR SCRIPT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Kill Python processes
Write-Host "[1/8] Killing existing Python processes..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Step 2: Remove old .venv
Write-Host "[2/8] Removing old virtual environment..." -ForegroundColor Yellow
if (Test-Path .venv) {
    try {
        Remove-Item -Path .venv -Recurse -Force -ErrorAction Stop
    } catch {
        Write-Host "  Using cmd.exe fallback for locked files..." -ForegroundColor Gray
        cmd /c rmdir /s /q .venv 2>$null
    }
    Start-Sleep -Seconds 1
}

# Step 3: Create new virtual environment
Write-Host "[3/8] Creating fresh virtual environment..." -ForegroundColor Yellow
python -m venv .venv
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create virtual environment. Check Python installation." -ForegroundColor Red
    exit 1
}

# Step 4: Activate and upgrade pip
Write-Host "[4/8] Activating venv and upgrading pip..." -ForegroundColor Yellow
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to upgrade pip." -ForegroundColor Red
    exit 1
}

# Step 5: Install dependencies
Write-Host "[5/8] Installing dependencies from requirements.txt..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies." -ForegroundColor Red
    exit 1
}

# Step 6: Verify packages
Write-Host "[6/8] Verifying critical packages..." -ForegroundColor Yellow
python -c "import uvicorn, fastapi, pydantic, swisseph; print('  All packages imported successfully')" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Package verification failed." -ForegroundColor Red
    exit 1
}

# Step 7: Start server in background
Write-Host "[7/8] Starting backend server on 127.0.0.1:8000..." -ForegroundColor Yellow
Write-Host "  Server will run in a new PowerShell window." -ForegroundColor Gray
$serverScript = @"
cd '$PWD'
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $serverScript

# Step 8: Wait and test
Write-Host "[8/8] Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "`nTesting endpoints..." -ForegroundColor Cyan

# Test GET /
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ GET / returns 200 OK" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ GET / failed (server may still be starting)" -ForegroundColor Yellow
}

# Test POST /natal
$testBody = '{"birth_date":"1967-07-05","birth_time":"12:00","latitude":45.88,"longitude":-72.50,"timezone":"America/New_York","birth_city":"Drummondville"}'
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/natal" -Method POST -Body $testBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ POST /natal returns 200 OK (404 fixed!)" -ForegroundColor Green
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "  ✗ POST /natal still returns 404 - check server window" -ForegroundColor Red
    } else {
        Write-Host "  ⚠ POST /natal test skipped (server may still be starting)" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green
Write-Host "Backend server: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Frontend API: http://127.0.0.1:8000 (already configured)" -ForegroundColor Cyan
Write-Host "`nServer is running in a separate PowerShell window." -ForegroundColor Yellow
Write-Host "To stop: Close that window or press Ctrl+C in it.`n" -ForegroundColor Yellow
