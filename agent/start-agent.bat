@echo off
title PrintX Shop Printer Agent - Live Hardware Bridge
color 0B
cls
cd /d "%~dp0"

:loop
echo ======================================================================
echo             PRINTX AUTOMATED PRINTER CONNECTOR AGENT
echo               Zero Setup - Pure Native Windows
echo ======================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0agent.ps1"

echo.
echo [AGENT NOTICE] Agent process stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop
