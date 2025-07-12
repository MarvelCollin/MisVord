<?php
require_once 'config/env.php';

echo "=== Socket Configuration Test ===\n";
echo "Current Environment:\n";
echo "IS_VPS: " . EnvLoader::get('IS_VPS', 'false') . "\n";
echo "USE_HTTPS: " . EnvLoader::get('USE_HTTPS', 'false') . "\n";
echo "DOMAIN: " . EnvLoader::get('DOMAIN', 'localhost') . "\n";
echo "SOCKET_HOST: " . EnvLoader::get('SOCKET_HOST', 'localhost') . "\n";
echo "SOCKET_PORT: " . EnvLoader::get('SOCKET_PORT', '1002') . "\n";
echo "SOCKET_SECURE: " . EnvLoader::get('SOCKET_SECURE', 'false') . "\n";

$_SERVER['HTTP_HOST'] = EnvLoader::get('DOMAIN', 'localhost');

$socketHost = EnvLoader::get('SOCKET_HOST', 'localhost');
$socketPort = EnvLoader::get('SOCKET_PORT', '1002');
$socketSecure = EnvLoader::get('SOCKET_SECURE', 'false');
$isDocker = EnvLoader::get('IS_DOCKER', 'false') === 'true';
$isVPS = EnvLoader::get('IS_VPS', 'false') === 'true';
$useHttps = EnvLoader::get('USE_HTTPS', 'false') === 'true';
$vpsHost = EnvLoader::get('DOMAIN', 'localhost');

if ($isVPS && $vpsHost !== 'localhost') {
    $frontendSocketHost = $vpsHost;
    $frontendSocketPort = '';
    $frontendSocketSecure = $useHttps ? 'true' : 'false';
} elseif ($isDocker) {
    $frontendSocketHost = 'localhost';
    $frontendSocketPort = $socketPort;
    $frontendSocketSecure = $socketSecure;
} else {
    $frontendSocketHost = 'localhost';
    $frontendSocketPort = $socketPort;
    $frontendSocketSecure = $socketSecure;
}

echo "\n=== Frontend Socket Configuration ===\n";
echo "Frontend Socket Host: " . $frontendSocketHost . "\n";
echo "Frontend Socket Port: " . $frontendSocketPort . "\n";
echo "Frontend Socket Secure: " . $frontendSocketSecure . "\n";

$protocol = $frontendSocketSecure === 'true' ? 'wss' : 'ws';
$url = $frontendSocketPort ? "{$protocol}://{$frontendSocketHost}:{$frontendSocketPort}" : "{$protocol}://{$frontendSocketHost}";

echo "Expected WebSocket URL: " . $url . "\n";

if ($isVPS && $frontendSocketHost !== 'localhost') {
    echo "✅ VPS Configuration: Correct - using domain\n";
} elseif (!$isVPS && $frontendSocketHost === 'localhost') {
    echo "✅ Local Configuration: Correct - using localhost\n";
} else {
    echo "❌ Configuration Issue: Check IS_VPS and DOMAIN settings\n";
}
?>
