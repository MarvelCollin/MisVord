@echo off
echo Opening Windows Firewall for IIS...
netsh advfirewall firewall add rule name="IIS HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="IIS HTTPS" dir=in action=allow protocol=TCP localport=443
echo Done! Firewall rules added for port 80 and 443.
pause
