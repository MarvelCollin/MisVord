@echo off
echo Enabling FastCGI and CGI features...
echo This requires Administrator privileges
echo.

dism /online /enable-feature /featurename:IIS-CGI /all
dism /online /enable-feature /featurename:IIS-ASPNET45 /all

echo.
echo Please restart your computer after this completes
echo Then check IIS Manager for FastCgiModule
echo.
pause
