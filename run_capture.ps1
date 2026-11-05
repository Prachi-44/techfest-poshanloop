$ErrorActionPreference = "Continue"

Write-Host "Cleaning up old background processes..."
Stop-Process -Name "node", "python" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Host "1. Starting Backend..."
$env:PYTHONPATH = "backend"
$backend = Start-Process python -ArgumentList "backend/run.py" -WorkingDirectory "d:\techfest_poshanloop" -PassThru -NoNewWindow

Write-Host "2. Starting Frontend dev server..."
$frontend = Start-Process "cmd.exe" -ArgumentList "/c cd /d d:\techfest_poshanloop\frontend && npx vite --port 5173" -PassThru -NoNewWindow

Write-Host "3. Waiting 6 seconds for servers to be ready..."
Start-Sleep -Seconds 6

Write-Host "4. Running Puppeteer Screenshot Capture..."
cd d:\techfest_poshanloop\frontend
node take_screenshots.js

Write-Host "5. Stopping background test servers..."
Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Name "node", "python" -Force -ErrorAction SilentlyContinue
Write-Host "Screenshot capture script complete!"
