@echo off
echo Setting up IIS binding for your IP...
echo.
echo Your main IP: 10.20.176.105
echo.
echo MANUAL SETUP in IIS Manager:
echo 1. Open IIS Manager
echo 2. Click "Site Bindings"
echo 3. Add new binding:
echo    - Type: http
echo    - IP Address: 10.20.176.105
echo    - Port: 80
echo    - Host name: (leave empty for IP access)
echo.
echo 4. Add another binding for domain:
echo    - Type: http  
echo    - IP Address: All Unassigned
echo    - Port: 80
echo    - Host name: marvelcollin.my.id
echo.
echo 5. Test access:
echo    http://10.20.176.105/test-iis.php
echo    http://marvelcollin.my.id/test-iis.php
echo.
pause
