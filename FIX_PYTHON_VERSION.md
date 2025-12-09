# Fix: Python 3.13.1 Compatibility Issue

## Problem
Python 3.13.1 is too new - `swisseph` and other packages don't support it yet, causing all `python -m` commands to hang/crash.

## Solution: Install Python 3.11 or 3.12

### Option 1: Install Python 3.11 (Recommended - matches Dockerfile)

1. **Download Python 3.11:**
   - Go to: https://www.python.org/downloads/release/python-31111/
   - Download: "Windows installer (64-bit)" for Python 3.11.11

2. **Install Python 3.11:**
   - Run the installer
   - ✅ **CHECK**: "Add Python 3.11 to PATH"
   - ✅ **CHECK**: "Install for all users" (if you have admin rights)
   - Click "Install Now"

3. **Verify installation:**
   ```powershell
   py -3.11 --version
   ```
   Should show: `Python 3.11.11`

4. **Use Python 3.11 for this project:**
   ```powershell
   # Kill any hanging Python processes first
   Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
   
   # Remove corrupted .venv
   if (Test-Path .venv) { cmd /c rmdir /s /q .venv }
   
   # Create venv with Python 3.11
   py -3.11 -m venv .venv
   
   # Activate and install
   .\.venv\Scripts\Activate.ps1
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   
   # Start server
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

### Option 2: Install Python 3.12 (Alternative)

1. **Download Python 3.12:**
   - Go to: https://www.python.org/downloads/release/python-31210/
   - Download: "Windows installer (64-bit)" for Python 3.12.10

2. **Follow same steps as Option 1, but use `py -3.12` instead**

### Option 3: Use pyenv-win (Advanced)

If you want to manage multiple Python versions:

```powershell
# Install pyenv-win
git clone https://github.com/pyenv-win/pyenv-win.git $HOME\.pyenv

# Add to PATH (PowerShell profile)
[System.Environment]::SetEnvironmentVariable('PYENV',$env:USERPROFILE + "\.pyenv\pyenv-win\","User")
[System.Environment]::SetEnvironmentVariable('PYENV_ROOT',$env:USERPROFILE + "\.pyenv\pyenv-win\","User")
[System.Environment]::SetEnvironmentVariable('PYENV_HOME',$env:USERPROFILE + "\.pyenv\pyenv-win\","User")

# Install Python 3.11
pyenv install 3.11.11
pyenv local 3.11.11
```

## Quick Fix Commands (After Installing Python 3.11)

Copy and paste this entire block:

```powershell
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
if (Test-Path .venv) { cmd /c rmdir /s /q .venv }
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip --quiet
pip install -r requirements.txt
python -c "import uvicorn, fastapi, pydantic, swisseph; print('All packages OK')"
Write-Host "`nStarting server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\.venv\Scripts\Activate.ps1; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
```

## Why This Happens

- Python 3.13 was released in October 2024 (very recent)
- `swisseph` (pyswisseph) is a C extension that needs to be compiled
- Many packages haven't released Python 3.13 wheels yet
- When Python tries to import incompatible modules, it can hang or crash

## Verify Your Python Version

After installing Python 3.11, check:
```powershell
py -3.11 --version
python --version  # Should show 3.11.x if it's the default
```

