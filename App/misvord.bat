@echo off
setlocal enabledelayedexpansion

REM MisVord CLI Runner Script for Windows
REM Runs commands from the mv file (PHP CLI tool)

echo 🚀 MisVord CLI Tool Runner
echo ==========================

REM Check if Docker is available
docker info >nul 2>&1
if %errorlevel% equ 0 (
    set DOCKER_AVAILABLE=true
    echo 🐳 Docker detected
) else (
    set DOCKER_AVAILABLE=false
    echo 💻 Local PHP mode
)

REM Check if command provided
if "%1"=="" (
    echo.
    echo Usage: %0 ^<command^> [arguments]
    echo.
    echo 📋 Available commands:
    echo   serve [host:port]       - Start development server
    echo   migrate                 - Run database migrations
    echo   migrate:fresh          - Drop all tables and re-run migrations
    echo   migrate:rollback       - Roll back last migration batch
    echo   migrate:status         - Show migration status
    echo   make:migration ^<name^>  - Create new migration file
    echo   db:check              - Test database connection
    echo.
    echo 🔧 Special commands:
    echo   docker-setup          - Setup and start Docker containers
    echo   docker-logs           - Show Docker container logs
    echo   docker-restart        - Restart Docker containers
    echo.
    exit /b 1
)

set COMMAND=%1
shift

REM Function to run command in Docker
:run_docker_command
set cmd=%~1
echo 🐳 Running in Docker container: %cmd%
docker-compose exec app php mv %cmd%
goto :eof

REM Function to run command locally
:run_local_command
set cmd=%~1
echo 💻 Running locally: %cmd%
php mv %cmd%
goto :eof

REM Function to run command (auto-detect environment)
:run_command
set cmd=%~1
if "%DOCKER_AVAILABLE%"=="true" (
    docker-compose ps | findstr "misvord_php.*Up" >nul
    if !errorlevel! equ 0 (
        call :run_docker_command "%cmd%"
    ) else (
        call :run_local_command "%cmd%"
    )
) else (
    call :run_local_command "%cmd%"
)
goto :eof

REM Handle commands
if "%COMMAND%"=="serve" (
    if "%2"=="" (
        set HOST_PORT=localhost:8000
    ) else (
        set HOST_PORT=%2
    )
    echo 🌐 Starting development server on !HOST_PORT!
    call :run_command "serve !HOST_PORT!"
    
) else if "%COMMAND%"=="migrate" (
    echo 📊 Running database migrations...
    call :run_command "migrate"
    
) else if "%COMMAND%"=="migrate:fresh" (
    echo ⚠️  Warning: This will drop all tables!
    set /p confirm="Are you sure? (y/N): "
    if /i "!confirm!"=="y" (
        echo 🔄 Dropping all tables and re-running migrations...
        call :run_command "migrate:fresh"
    ) else (
        echo ❌ Cancelled
        exit /b 0
    )
    
) else if "%COMMAND%"=="migrate:rollback" (
    echo ⏪ Rolling back last migration batch...
    call :run_command "migrate:rollback"
    
) else if "%COMMAND%"=="migrate:status" (
    echo 📋 Checking migration status...
    call :run_command "migrate:status"
    
) else if "%COMMAND%"=="make:migration" (
    if "%2"=="" (
        echo ❌ Error: Migration name required
        echo Usage: %0 make:migration ^<migration_name^>
        exit /b 1
    )
    echo 📝 Creating migration: %2
    call :run_command "make:migration %2"
    
) else if "%COMMAND%"=="db:check" (
    echo 🔍 Testing database connection...
    call :run_command "db:check"
    
) else if "%COMMAND%"=="docker-setup" (
    echo 🐳 Setting up Docker environment...
    if not exist ".env" (
        echo 📄 Creating .env from .env.example...
        copy .env.example .env
        echo ⚠️  Please edit .env file with your configuration
    )
    
    echo 🚀 Starting Docker containers...
    docker-compose up -d
    
    echo ⏳ Waiting for database to be ready...
    timeout /t 10 /nobreak >nul
    
    echo 📊 Running initial migrations...
    call :run_command "migrate"
    
    echo ✅ Docker setup complete!
    echo 🌐 Access your app at: http://localhost:1001
    echo 🔌 Socket server at: http://localhost:1002
    
) else if "%COMMAND%"=="docker-logs" (
    if "%2"=="" (
        echo 📋 All container logs:
        docker-compose logs --tail=50 -f
    ) else (
        echo 📋 Logs for service: %2
        docker-compose logs --tail=50 -f %2
    )
    
) else if "%COMMAND%"=="docker-restart" (
    echo 🔄 Restarting Docker containers...
    docker-compose restart
    echo ✅ Containers restarted
    
) else if "%COMMAND%"=="help" (
    echo.
    echo 📚 MisVord CLI Tool Help
    echo =======================
    echo.
    echo 🔧 Database Commands:
    echo   migrate                 - Run pending migrations
    echo   migrate:fresh          - Drop all tables and re-run migrations
    echo   migrate:rollback       - Roll back last migration batch
    echo   migrate:status         - Show migration status
    echo   make:migration ^<name^>  - Create new migration file
    echo   db:check              - Test database connection
    echo.
    echo 🌐 Server Commands:
    echo   serve [host:port]      - Start development server (default: localhost:8000)
    echo.
    echo 🐳 Docker Commands:
    echo   docker-setup          - Complete Docker environment setup
    echo   docker-logs [service] - Show container logs (app, socket, db)
    echo   docker-restart        - Restart all containers
    echo.
    echo 📝 Examples:
    echo   %0 serve localhost:3000     # Start server on port 3000
    echo   %0 make:migration users     # Create migration for users table
    echo   %0 docker-logs app         # Show PHP app logs
    echo.
    
) else (
    echo ❌ Unknown command: %COMMAND%
    echo Run '%0 help' for available commands
    exit /b 1
)

echo ✅ Command completed successfully!
pause
