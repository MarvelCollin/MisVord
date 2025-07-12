<?php
require_once 'config/env.php';

// Simulate the exact same logic as head.php
$socketHost = EnvLoader::get('SOCKET_HOST', 'localhost');
$socketPort = EnvLoader::get('SOCKET_PORT', '1002');
$socketSecure = EnvLoader::get('SOCKET_SECURE', 'false');
$socketBasePath = EnvLoader::get('SOCKET_BASE_PATH', '/socket.io');
$isDocker = EnvLoader::get('IS_DOCKER', 'false') === 'true';

$currentHost = $_SERVER['HTTP_HOST'] ?? 'localhost';

$isVPS = EnvLoader::get('IS_VPS', 'false') === 'true';
$useHttps = EnvLoader::get('USE_HTTPS', 'false') === 'true';
$vpsHost = EnvLoader::get('DOMAIN', 'localhost');

echo "=== Debug Socket Configuration ===\n";
echo "Raw Values:\n";
echo "SOCKET_HOST: " . $socketHost . "\n";
echo "SOCKET_PORT: " . $socketPort . "\n";
echo "SOCKET_SECURE: " . $socketSecure . "\n";
echo "IS_VPS: " . ($isVPS ? 'true' : 'false') . "\n";
echo "USE_HTTPS: " . ($useHttps ? 'true' : 'false') . "\n";
echo "DOMAIN: " . $vpsHost . "\n";
echo "\n";

if ($isVPS && $vpsHost !== 'localhost') {
    $frontendSocketHost = $vpsHost;
    $frontendSocketPort = '';
    $frontendSocketSecure = ($socketSecure === 'true' || $useHttps) ? 'true' : 'false';
} elseif ($isDocker) {
    $frontendSocketHost = 'localhost';
    $frontendSocketPort = $socketPort;
    $frontendSocketSecure = $socketSecure;
} else {
    $frontendSocketHost = 'localhost';
    $frontendSocketPort = $socketPort;
    $frontendSocketSecure = $socketSecure;
}

echo "Frontend Configuration:\n";
echo "Frontend Socket Host: " . $frontendSocketHost . "\n";
echo "Frontend Socket Port: " . $frontendSocketPort . "\n";
echo "Frontend Socket Secure: " . $frontendSocketSecure . "\n";

$protocol = $frontendSocketSecure === 'true' ? 'https' : 'http';
$wsProtocol = $frontendSocketSecure === 'true' ? 'wss' : 'ws';
$url = $frontendSocketPort ? "{$protocol}://{$frontendSocketHost}:{$frontendSocketPort}" : "{$protocol}://{$frontendSocketHost}";
$wsUrl = $frontendSocketPort ? "{$wsProtocol}://{$frontendSocketHost}:{$frontendSocketPort}" : "{$wsProtocol}://{$frontendSocketHost}";

echo "\nExpected URLs:\n";
echo "Socket.IO HTTP URL: " . $url . "\n";
echo "WebSocket URL: " . $wsUrl . "\n";

echo "\nMeta tags that will be generated:\n";
echo '<meta name="socket-host" content="' . htmlspecialchars($frontendSocketHost) . '">' . "\n";
echo '<meta name="socket-port" content="' . htmlspecialchars($frontendSocketPort) . '">' . "\n";
echo '<meta name="socket-secure" content="' . htmlspecialchars($frontendSocketSecure) . '">' . "\n";
?>
