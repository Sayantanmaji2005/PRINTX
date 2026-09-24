@echo off
title PrintX Shop Printer Agent - Live Hardware Bridge
color 0B
cls
cd /d "%~dp0"

echo ======================================================================
echo             PRINTX AUTOMATED PRINTER CONNECTOR AGENT
echo               Zero Setup Required - Pure Native Windows
echo ======================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0agent.ps1"
if %errorlevel% neq 0 (
    echo.
    echo Press any key to retry or exit...
    pause
)


