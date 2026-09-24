@echo off
title PrintX Shop Printer Agent - Live Hardware Bridge
color 0B
cls
cd /d "%~dp0"

:loop
echo ======================================================================
echo             PRINTX AUTOMATED PRINTER CONNECTOR AGENT
echo                   Zero Setup - Auto Hardware Bridge
echo ======================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    if exist "%~dp0agent.js" (
        echo [LAUNCH] Node.js runtime detected. Starting high-speed engine...
        node "%~dp0agent.js"
        goto restart_prompt
    )
)

echo [LAUNCH] Starting native Windows printer connector...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0agent.ps1"

:restart_prompt
echo.
echo [AGENT NOTICE] Agent process stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
cls
goto loop
