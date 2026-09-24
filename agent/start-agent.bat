@echo off
title PrintX Shop Printer Agent - Live Hardware Bridge
color 0B
cls
cd /d "%~dp0"

echo ======================================================================
echo             PRINTX AUTOMATED PRINTER CONNECTOR AGENT
echo                   Zero Setup - Auto Hardware Bridge
echo ======================================================================
echo.

:: Clean up any duplicate background PowerShell agent processes for this script
for /f "tokens=2" %%i in ('wmic process where "name='powershell.exe' and commandline like '%%agent.ps1%%'" get ProcessId 2^>nul ^| findstr /r "[0-9]"') do (
    taskkill /PID %%i /F >nul 2>nul
)

:loop
echo [LAUNCH] Starting native Windows printer hardware bridge...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0agent.ps1"

:restart_prompt
echo.
echo [AGENT NOTICE] Agent process stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
cls
goto loop
