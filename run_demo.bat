@echo off
title POSHANLOOP - Master Prototype Launcher
color 0A

echo =========================================================================
echo       POSHANLOOP - Maternal & Early-Childhood Nutrition System
echo       India @ 71/100 Challenge Prototype
echo =========================================================================
echo.
echo [1/3] Checking environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b 1
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    pause
    exit /b 1
)

echo [OK] Python and Node.js detected.
echo.
echo [2/3] Launching Backend API on http://localhost:8000 ...
start "POSHANLOOP Backend API (FastAPI)" cmd /k "cd /d %~dp0 && set PYTHONPATH=backend && python backend/run.py"

echo [3/3] Launching Frontend UI on http://localhost:5173 ...
start "POSHANLOOP Frontend UI (Vite + React)" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo =========================================================================
echo Both services are starting in separate windows:
echo   - Backend OpenAPI Docs: http://localhost:8000/docs
echo   - Frontend Application: http://localhost:5173
echo.
echo When ready, open http://localhost:5173 in your browser.
echo =========================================================================
pause

