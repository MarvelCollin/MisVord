Write-Host "Testing environment validation fix..."

# Check current environment
$envContent = Get-Content ".env"
$isVps = ($envContent | Where-Object { $_ -match "^IS_VPS=" }) -replace "IS_VPS=", ""
$socketPort = ($envContent | Where-Object { $_ -match "^SOCKET_PORT=" }) -replace "SOCKET_PORT=", ""

Write-Host "Current IS_VPS: '$isVps'"
Write-Host "Current SOCKET_PORT: '$socketPort'"

if ($isVps -eq "true") {
    Write-Host "✅ VPS mode detected - SOCKET_PORT should be optional"
    if ($socketPort -eq "") {
        Write-Host "✅ SOCKET_PORT is empty (correct for VPS)"
    } else {
        Write-Host "⚠️ SOCKET_PORT has value: '$socketPort'"
    }
} else {
    Write-Host "Development mode detected - SOCKET_PORT should be required"
    if ($socketPort -eq "") {
        Write-Host "❌ SOCKET_PORT is empty (should have value for development)"
    } else {
        Write-Host "✅ SOCKET_PORT has value: '$socketPort'"
    }
}
