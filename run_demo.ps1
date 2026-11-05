# POSHANLOOP - PowerShell Prototype Launcher
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "      POSHANLOOP - Maternal & Early-Childhood Nutrition System" -ForegroundColor Green
Write-Host "      India @ 71/100 Challenge Master Prototype" -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot

Write-Host "[1/3] Checking environment..." -ForegroundColor White
try {
    $pyVer = python --version
    Write-Host "  Detected: $pyVer" -ForegroundColor Gray
} catch {
    Write-Error "Python is not found in PATH."
    exit 1
}

try {
    $nodeVer = node --version
    Write-Host "  Detected Node: $nodeVer" -ForegroundColor Gray
} catch {
    Write-Error "Node.js is not found in PATH."
    exit 1
}

Write-Host ""
Write-Host "[2/3] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; `$env:PYTHONPATH='backend'; python backend/run.py"

Write-Host "[3/3] Starting Vite React Frontend on http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root/frontend'; npm run dev"

Write-Host ""
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host " Services launched in dedicated windows:" -ForegroundColor White
Write-Host "   Frontend Application: http://localhost:5173" -ForegroundColor Yellow
Write-Host "   Backend API Docs:     http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Green

