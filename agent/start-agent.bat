@echo off
title PrintX Shop Printer Agent
color 0A
cls
echo ========================================================
echo        STARTING PRINTX SHOP PRINTER AGENT
echo ========================================================
echo.
cd /d %~dp0
node agent.js
pause
