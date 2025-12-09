# Find Python 3.11 installation
Write-Host "Searching for Python 3.11..." -ForegroundColor Cyan

$locations = @(
    "C:\Python311",
    "C:\Python3111", 
    "C:\Program Files\Python311",
    "C:\Program Files (x86)\Python311",
    "$env:LOCALAPPDATA\Programs\Python\Python311",
    "$env:APPDATA\Python\Python311",
    "$env:USERPROFILE\AppData\Local\Programs\Python\Python311"
)

foreach ($loc in $locations) {
    $pythonExe = Join-Path $loc "python.exe"
    if (Test-Path $pythonExe) {
        $version = & $pythonExe --version 2>&1
        Write-Host "FOUND: $pythonExe" -ForegroundColor Green
        Write-Host "Version: $version" -ForegroundColor Green
        Write-Host "`nUse this path to create venv:" -ForegroundColor Yellow
        Write-Host "& '$pythonExe' -m venv .venv" -ForegroundColor White
        exit 0
    }
}

Write-Host "Python 3.11 not found in common locations." -ForegroundColor Red
Write-Host "`nPlease install Python 3.11.11 from:" -ForegroundColor Yellow
Write-Host "https://www.python.org/downloads/release/python-31111/" -ForegroundColor Cyan
Write-Host "`nMake sure to CHECK 'Add Python to PATH' during installation!" -ForegroundColor Yellow


