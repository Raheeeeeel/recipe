@echo off
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js is required. Install Node.js, then run this file again.
    pause
    exit /b 1
)

start "Recipe server" cmd /k "cd /d ""%~dp0"" && node server.js"
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"
