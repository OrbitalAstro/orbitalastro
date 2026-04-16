# OrbitalAstro local launcher (Windows / PowerShell).
# Wrapper around `scripts/start_local.ps1`.
# Keep this file ASCII-only to avoid encoding issues in Windows PowerShell 5.1.

$ErrorActionPreference = "Stop"

$projectPath = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$scriptPath = Join-Path $projectPath "scripts\\start_local.ps1"

if (-not (Test-Path -LiteralPath $scriptPath)) {
    Write-Host "ERROR: Missing launcher script: $scriptPath" -ForegroundColor Red
    exit 1
}

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $scriptPath @args

