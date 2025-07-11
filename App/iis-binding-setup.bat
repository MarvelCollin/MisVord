@echo off
echo IIS BINDING SETUP CHECKLIST:
echo.
echo 1. Open IIS Manager
echo 2. Click "Site Bindings"
echo 3. Make sure you have these bindings:
echo.
echo    Binding 1:
echo    - Type: http
echo    - IP Address: All Unassigned (*)
echo    - Port: 80
echo    - Host name: www.marvelcollin.my.id
echo.
echo    Binding 2:
echo    - Type: http
echo    - IP Address: All Unassigned (*)  
echo    - Port: 80
echo    - Host name: marvelcollin.my.id
echo.
echo    Binding 3 (for direct IP access):
echo    - Type: http
echo    - IP Address: 10.20.176.105
echo    - Port: 80
echo    - Host name: (empty)
echo.
echo 4. Restart Application Pool
echo 5. Test all URLs
echo.
pause
