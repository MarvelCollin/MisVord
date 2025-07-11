@echo off
echo 🌐 MISVORD GLOBAL ACCESS TEST
echo ===============================
echo.

echo 📋 TESTING LOCAL ACCESS:
echo 1. Testing localhost:1001...
curl -s -o nul -w "HTTP Status: %%{http_code}" http://localhost:1001/health
echo.

echo 2. Testing network access 10.20.176.105:1001...
curl -s -o nul -w "HTTP Status: %%{http_code}" http://10.20.176.105:1001/health
echo.

echo 🌍 TESTING PUBLIC IP ACCESS:
echo 3. Testing public IP 202.58.166.121:1001...
curl -s -o nul -w "HTTP Status: %%{http_code}" --connect-timeout 5 http://202.58.166.121:1001/health 2>nul || echo TIMEOUT - Router port forwarding not configured yet
echo.

echo 🌐 TESTING DOMAIN ACCESS:
echo 4. Testing marvelcollin.my.id...
curl -s -o nul -w "HTTP Status: %%{http_code}" --connect-timeout 5 http://marvelcollin.my.id/health 2>nul || echo TIMEOUT - DNS or router not ready
echo.

echo 📊 DNS STATUS:
echo Current DNS resolution:
nslookup marvelcollin.my.id
echo.

echo ⏭️ NEXT STEPS:
echo ✅ DNS Record configured correctly (202.58.166.121)
echo ⏳ Waiting for DNS propagation (5-15 minutes)
echo ❗ URGENT: Configure router port forwarding
echo 🎯 Target: http://marvelcollin.my.id accessible globally
