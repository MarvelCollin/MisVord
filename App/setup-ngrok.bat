@echo off
echo ========================================
echo       NGROK SETUP UNTUK MISVORD
echo ========================================
echo.
echo LANGKAH 1: Download Ngrok
echo 1. Buka: https://ngrok.com/download
echo 2. Download Windows version
echo 3. Extract ke folder ini
echo.
echo LANGKAH 2: Setup Ngrok
echo 1. Daftar free account di ngrok.com
echo 2. Copy authtoken dari dashboard
echo 3. Run: ngrok config add-authtoken YOUR_TOKEN
echo.
echo LANGKAH 3: Expose MisVord
echo 1. Run: ngrok http 1001
echo 2. Copy URL (https://xxx.ngrok.io)
echo 3. Update DNS marvelcollin.my.id CNAME ke xxx.ngrok.io
echo.
echo LANGKAH 4: Test
echo 1. Akses: https://marvelcollin.my.id
echo 2. Should work from anywhere!
echo.
echo ========================================
echo BENEFIT NGROK vs ROUTER:
echo ✅ No router configuration needed
echo ✅ Works from any location (cafe, office)
echo ✅ HTTPS included
echo ✅ Bypass firewalls
echo ✅ Professional subdomain
echo ========================================
echo.
pause
