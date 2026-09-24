@echo off
title PrintX Shop Printer Agent - Live Hardware Bridge
color 0B
cls
echo ======================================================================
echo             PRINTX AUTOMATED PRINTER CONNECTOR AGENT
echo ======================================================================
echo.
cd /d %~dp0

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on this computer.
    echo Please download and install Node.js from: https://nodejs.org
    echo Once installed, double-click this file again.
    echo.
    pause
    exit /b
)

echo Starting Live Printer Spooler...
echo Connect any USB or Wi-Fi printer to this PC - it will auto-detect!
echo.
node agent.js
pause

