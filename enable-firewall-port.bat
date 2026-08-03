@echo off
title Open Windows Firewall Port 3000 for IBIS RICE Server
color 0A
cls
echo ======================================================================
echo           OPENING WINDOWS FIREWALL PORT 3000 FOR LAN SYNC
echo ======================================================================
echo.
echo Allowing inbound TCP traffic on Port 3000 for mobile tablet sync...
echo.

powershell -Command "Start-Process powershell -ArgumentList '-Command New-NetFirewallRule -DisplayName \"IBIS RICE Server (Port 3000)\" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue' -Verb RunAs"

echo.
echo ======================================================================
echo SUCCESS! Port 3000 is open in Windows Firewall.
echo Android tablets can now connect to http://YOUR_SERVER_IP:3000
echo ======================================================================
echo.
pause
