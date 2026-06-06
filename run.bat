@echo off
setlocal EnableExtensions

title EchoChat - Starting...

REM Always run from the folder that contains this file
cd /d "%~dp0"

echo.
echo  ========================================
echo   EchoChat - One-Click Launcher
echo  ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo         Install Python 3.10+ from https://www.python.org/downloads/
    echo         Make sure to check "Add Python to PATH" during install.
    pause
    exit /b 1
)

REM Create uploads folder for file attachments
if not exist "uploads" mkdir "uploads"

REM Setup virtual environment
if not exist "backend\venv" (
    echo [1/3] Creating virtual environment...
    python -m venv backend\venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Virtual environment found.
)

REM Activate venv and install dependencies
echo [2/3] Installing / updating dependencies...
call backend\venv\Scripts\activate.bat
python -m pip install --upgrade pip -q
python -m pip install -r backend\requirements.txt -q
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

REM Open browser after a short delay (server starts below)
echo [3/3] Starting EchoChat server...
echo.
echo  Local:   http://localhost:8085
echo  Network: share the LAN URL printed by the server
echo.
echo  Press Ctrl+C to stop the server.
echo  ========================================
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8085"

cd backend
python server.py

echo.
echo Server stopped.
pause
