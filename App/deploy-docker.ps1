# MisVord Docker Deployment Script for Windows
# This script ensures only Docker containers are used for the application

Write-Host "🚀 Starting MisVord Docker containers..." -ForegroundColor Green

# Stop any local processes that might conflict
Write-Host "🛑 Stopping any conflicting local processes..." -ForegroundColor Yellow

# Check for local Node.js processes
Write-Host "⚠️  Checking for local Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server.js*" -and $_.CommandLine -notlike "*docker*" }
if ($nodeProcesses) {
    Write-Host "🔴 Found local Node.js processes: $($nodeProcesses.Id -join ', ')" -ForegroundColor Red
    Write-Host "❌ DO NOT KILL - User requested no taskkill for Docker processes" -ForegroundColor Red
    Write-Host "⚠️  Please manually stop local Node.js processes if needed" -ForegroundColor Yellow
} else {
    Write-Host "✅ No conflicting local Node.js processes found" -ForegroundColor Green
}

# Check for local PHP servers
Write-Host "⚠️  Checking for local PHP servers..." -ForegroundColor Yellow
$phpProcesses = Get-Process -Name "php" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*-S*" }
if ($phpProcesses) {
    Write-Host "🔴 Found local PHP servers: $($phpProcesses.Id -join ', ')" -ForegroundColor Red
    Write-Host "⚠️  Please manually stop local PHP servers if needed" -ForegroundColor Yellow
} else {
    Write-Host "✅ No conflicting local PHP servers found" -ForegroundColor Green
}

# Start Docker containers
Write-Host "🐳 Starting Docker containers..." -ForegroundColor Cyan

# Stop existing containers if running
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Build and start containers
Write-Host "Building and starting containers..." -ForegroundColor Cyan
docker-compose up -d --build

# Wait for containers to be ready
Write-Host "⏳ Waiting for containers to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check container status
Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker-compose ps

# Test connectivity
Write-Host "🔍 Testing container connectivity..." -ForegroundColor Cyan

# Test PHP app
Write-Host "Testing PHP app..." -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost:1001/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PHP app is running (HTTP $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "❌ PHP app responded with HTTP $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ PHP app is not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Socket server
Write-Host "Testing Socket server..." -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost:1002/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Socket server is running (HTTP $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "❌ Socket server responded with HTTP $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Socket server is not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Database
Write-Host "Testing Database..." -ForegroundColor White
try {
    $dbTest = docker-compose exec -T db mysqladmin ping -h localhost -P 1003 -u root -pkolin123 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Database is not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Database test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Docker-only deployment complete!" -ForegroundColor Green
Write-Host "📱 Application: http://localhost:1001" -ForegroundColor Cyan
Write-Host "🔌 Socket Test: http://localhost:1001/socket-test.html" -ForegroundColor Cyan
Write-Host "💾 Database Admin: http://localhost:1004 (phpMyAdmin)" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Configuration:" -ForegroundColor Yellow
Write-Host "   - Socket transport: WebSocket only (no polling fallback)" -ForegroundColor White
Write-Host "   - Socket host: Docker container 'socket'" -ForegroundColor White
Write-Host "   - Socket port: 1002" -ForegroundColor White
Write-Host "   - Database: Docker container 'db' on port 1003" -ForegroundColor White
Write-Host ""
Write-Host "📝 To check logs:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f app" -ForegroundColor White
Write-Host "   docker-compose logs -f socket" -ForegroundColor White
Write-Host "   docker-compose logs -f db" -ForegroundColor White
