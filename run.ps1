# EchoChat - PowerShell launcher (Windows)
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host ""
Write-Host " ========================================" -ForegroundColor Green
Write-Host "  EchoChat - One-Click Launcher" -ForegroundColor Green
Write-Host " ========================================" -ForegroundColor Green
Write-Host ""

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Using $pythonVersion"
} catch {
    Write-Host "[ERROR] Python is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Install Python 3.10+ from https://www.python.org/downloads/"
    exit 1
}

# Uploads folder
$uploadsDir = Join-Path $ProjectRoot "uploads"
if (-not (Test-Path $uploadsDir)) {
    New-Item -ItemType Directory -Path $uploadsDir | Out-Null
}

# Virtual environment
$venvPath = Join-Path $ProjectRoot "backend\venv"
$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"

if (-not (Test-Path $venvPath)) {
    Write-Host "[1/3] Creating virtual environment..."
    python -m venv $venvPath
} else {
    Write-Host "[1/3] Virtual environment found."
}

Write-Host "[2/3] Installing / updating dependencies..."
& $activateScript
python -m pip install --upgrade pip -q
python -m pip install -r (Join-Path $ProjectRoot "backend\requirements.txt") -q

Write-Host "[3/3] Starting EchoChat server..."
Write-Host ""
Write-Host " Local:   http://localhost:8085"
Write-Host " Press Ctrl+C to stop the server."
Write-Host " ========================================"
Write-Host ""

Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:8085"
} | Out-Null

Set-Location (Join-Path $ProjectRoot "backend")
python server.py
