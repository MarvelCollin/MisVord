<?php
require_once __DIR__ . '/config/env.php';

echo "🔍 PHP Environment Variables Verification:\n";
echo "==========================================\n";

$requiredVars = [
    'SOCKET_HOST',
    'SOCKET_PORT', 
    'SOCKET_BIND_HOST',
    'SOCKET_BASE_PATH',
    'SOCKET_SECURE',
    'CORS_ALLOWED_ORIGINS',
    'SOCKET_SERVER_LOCAL',
    'APP_URL'
];

$allValid = true;

foreach ($requiredVars as $varName) {
    $value = EnvLoader::get($varName);
    $status = $value ? '✅' : '❌';
    
    if (!$value) {
        $allValid = false;
    }
    
    echo "$status $varName: " . ($value ?: 'MISSING') . "\n";
}

echo "==========================================\n";

if ($allValid) {
    echo "✅ All required environment variables are loaded!\n";
    
    $socketSecure = EnvLoader::get('SOCKET_SECURE') === 'true';
    $socketHost = EnvLoader::get('SOCKET_HOST');
    $socketPort = EnvLoader::get('SOCKET_PORT');
    
    $socketUrl = ($socketSecure ? 'https' : 'http') . "://$socketHost:$socketPort";
    echo "🔗 Socket URL: $socketUrl\n";
    echo "📁 Base Path: " . EnvLoader::get('SOCKET_BASE_PATH') . "\n";
    echo "🌐 CORS Origins: " . EnvLoader::get('CORS_ALLOWED_ORIGINS') . "\n";
    echo "🏠 App URL: " . EnvLoader::get('APP_URL') . "\n";
    
    echo "\n🧪 Testing meta tag generation:\n";
    echo "--------------------------------\n";
    echo "socket-host: " . htmlspecialchars($_SERVER['HTTP_HOST'] ?? 'localhost') . "\n";
    echo "socket-port: " . htmlspecialchars($socketPort) . "\n";
    echo "socket-secure: " . htmlspecialchars(EnvLoader::get('SOCKET_SECURE')) . "\n";
    echo "socket-base-path: " . htmlspecialchars(EnvLoader::get('SOCKET_BASE_PATH')) . "\n";
} else {
    echo "❌ Some environment variables are missing!\n";
    echo "Please check your .env file.\n";
    exit(1);
}
?>
