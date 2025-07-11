@echo off
echo EMERGENCY FIX - Run as Administrator
echo.
echo 1. Open Command Prompt as Administrator
echo 2. Run: iisreset
echo 3. Or go to IIS Manager:
echo    - Application Pools
echo    - Right-click your pool
echo    - Recycle
echo.
echo 4. Test this URL:
echo    http://10.20.176.105/public/test-iis.php
echo.
echo If still error, try:
echo    http://10.20.176.105/public/index.php
echo.
pause
