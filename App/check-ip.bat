@echo off
echo Checking your public IP address...
echo.
curl -s ifconfig.me
echo.
echo.
echo Your website will be accessible at:
echo http://[IP_ABOVE]/
echo.
echo Also check your local IP:
ipconfig | findstr "IPv4"
echo.
pause
