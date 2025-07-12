<?php
require_once 'config/env.php';
require_once 'config/helpers.php';

echo "Environment Variables Debug:\n";
echo "============================\n";

echo "SOCKET_HOST: " . EnvLoader::get('SOCKET_HOST', 'NOT_SET') . "\n";
echo "SOCKET_PORT: " . EnvLoader::get('SOCKET_PORT', 'NOT_SET') . "\n";
echo "SOCKET_SECURE: " . EnvLoader::get('SOCKET_SECURE', 'NOT_SET') . "\n";
echo "SOCKET_BASE_PATH: " . EnvLoader::get('SOCKET_BASE_PATH', 'NOT_SET') . "\n";
echo "IS_VPS: " . EnvLoader::get('IS_VPS', 'NOT_SET') . "\n";
echo "USE_HTTPS: " . EnvLoader::get('USE_HTTPS', 'NOT_SET') . "\n";
echo "DOMAIN: " . EnvLoader::get('DOMAIN', 'NOT_SET') . "\n";

echo "\nSocket Configuration Logic:\n";
echo "===========================\n";

$socketHost = EnvLoader::get('SOCKET_HOST', 'localhost');
$socketPort = EnvLoader::get('SOCKET_PORT', '1002');
$socketSecure = EnvLoader::get('SOCKET_SECURE', 'false');
$socketBasePath = EnvLoader::get('SOCKET_BASE_PATH', '/socket.io');

$currentHost = $_SERVER['HTTP_HOST'] ?? 'localhost';
$frontendSocketHost = $currentHost;

$isVPS = EnvLoader::get('IS_VPS', 'false') === 'true';
$useHttps = EnvLoader::get('USE_HTTPS', 'false') === 'true';

echo "Current Host: " . $currentHost . "\n";
echo "Is VPS: " . ($isVPS ? 'true' : 'false') . "\n";
echo "Use HTTPS: " . ($useHttps ? 'true' : 'false') . "\n";

if ($isVPS || strpos($currentHost, 'marvelcollin.my.id') !== false) {
    $frontendSocketHost = $currentHost;
    $socketPort = '';
    $socketSecure = 'true';
    echo "VPS Mode Activated\n";
}

echo "\nFinal Socket Configuration:\n";
echo "===========================\n";
echo "Frontend Socket Host: " . $frontendSocketHost . "\n";
echo "Socket Port: " . ($socketPort ?: 'EMPTY (for VPS)') . "\n";
echo "Socket Secure: " . $socketSecure . "\n";
echo "Socket Base Path: " . $socketBasePath . "\n";

echo "\nMeta Tags Output:\n";
echo "=================\n";
echo '<meta name="socket-host" content="' . htmlspecialchars($frontendSocketHost) . '">' . "\n";
echo '<meta name="socket-port" content="' . htmlspecialchars($socketPort) . '">' . "\n";
echo '<meta name="socket-secure" content="' . htmlspecialchars($socketSecure) . '">' . "\n";
echo '<meta name="socket-base-path" content="' . htmlspecialchars($socketBasePath) . '">' . "\n";

echo "\nExpected JS Socket URL:\n";
echo "=======================\n";
if ($socketPort) {
    $expectedUrl = ($socketSecure === 'true' ? 'https' : 'http') . '://' . $frontendSocketHost . ':' . $socketPort;
} else {
    $expectedUrl = ($socketSecure === 'true' ? 'https' : 'http') . '://' . $frontendSocketHost;
}
echo "Socket URL: " . $expectedUrl . "\n";
