# Install Python 3.11.11 - Step by Step

## Step 1: Download Python 3.11.11

**Direct download link:**
https://www.python.org/ftp/python/3.11.11/python-3.11.11-amd64.exe

Or visit: https://www.python.org/downloads/release/python-31111/
- Click "Windows installer (64-bit)"

## Step 2: Run the Installer

1. **Double-click** the downloaded `python-3.11.11-amd64.exe` file
2. **IMPORTANT:** Check ✅ **"Add Python 3.11 to PATH"** at the bottom
3. Click **"Install Now"** (or "Customize installation" if you want to choose options)
4. Wait for installation to complete
5. Click **"Close"** when done

## Step 3: Verify Installation

**Close and reopen PowerShell** (important for PATH to update), then run:

```powershell
py -3.11 --version
```

Should show: `Python 3.11.11`

## Step 4: Setup Project (After Installation)

Once Python 3.11 is installed, run these commands:

```powershell
# Navigate to project (if not already there)
cd C:\Users\patri\Projects\orbitalastro

# Kill any hanging Python processes
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Remove broken .venv
if (Test-Path .venv) { cmd /c rmdir /s /q .venv }

# Create fresh venv with Python 3.11
py -3.11 -m venv .venv

# Activate venv
.\.venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip --quiet

# Install all dependencies
pip install -r requirements.txt

# Verify packages work
python -c "import uvicorn, fastapi, pydantic, swisseph; print('✅ All packages OK')"

# Start server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

## Troubleshooting

**If `py -3.11` doesn't work after installation:**
1. Make sure you checked "Add Python to PATH" during installation
2. Close ALL PowerShell/terminal windows
3. Open a NEW PowerShell window
4. Try again: `py -3.11 --version`

**If still not working:**
- Reinstall Python 3.11 and make absolutely sure "Add to PATH" is checked
- Or manually add Python 3.11 to PATH in System Environment Variables

## What This Fixes

- ✅ Python 3.13.1 compatibility issues (swisseph doesn't support it)
- ✅ Hanging `python -m` commands
- ✅ Module import failures
- ✅ Backend server will work properly



