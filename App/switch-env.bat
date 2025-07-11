@echo off
REM Environment Switcher Script for MisVord (Windows)
REM Usage: switch-env.bat [development|production]

set ENV_TYPE=%1
if "%ENV_TYPE%"=="" set ENV_TYPE=development

if /i "%ENV_TYPE%"=="development" goto :dev
if /i "%ENV_TYPE%"=="dev" goto :dev
if /i "%ENV_TYPE%"=="production" goto :prod
if /i "%ENV_TYPE%"=="prod" goto :prod
goto :invalid

:dev
echo 🔧 Switching to DEVELOPMENT environment...
if exist ".env.example" (
    copy ".env.example" ".env" >nul
    echo ✅ Development .env file ready
    echo 📝 Edit .env file with your local development values
) else (
    echo ❌ .env.example file not found!
    goto :end
)
goto :show_settings

:prod
echo 🚀 Switching to PRODUCTION environment...
if exist ".env.production" (
    copy ".env.production" ".env" >nul
    echo ✅ Production .env file applied
    echo ⚠️  Make sure to update DOMAIN in .env with your actual domain!
) else (
    echo ❌ .env.production file not found!
    goto :end
)
goto :show_settings

:invalid
echo ❌ Invalid environment type: %ENV_TYPE%
echo Usage: switch-env.bat [development^|production]
goto :end

:show_settings
echo.
echo 📋 Current environment settings:
findstr "DOMAIN=" .env 2>nul
findstr "APP_URL=" .env 2>nul
findstr "USE_HTTPS=" .env 2>nul
findstr "IS_VPS=" .env 2>nul
echo.
echo 🔄 Restart your containers for changes to take effect:
echo    docker-compose down ^&^& docker-compose up -d

:end
pause
