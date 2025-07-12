<?php
require_once dirname(__DIR__) . '/config/env.php';

header('Content-Type: text/plain');

echo "=== Environment Debug ===\n\n";

echo "Environment Variable Sources:\n";
echo "getenv('IS_DOCKER'): " . var_export(getenv('IS_DOCKER'), true) . "\n";
echo "getenv('CONTAINER'): " . var_export(getenv('CONTAINER'), true) . "\n";
echo "\$_SERVER['IS_DOCKER']: " . var_export($_SERVER['IS_DOCKER'] ?? 'NOT_SET', true) . "\n";
echo "\$_SERVER['CONTAINER']: " . var_export($_SERVER['CONTAINER'] ?? 'NOT_SET', true) . "\n";
echo "\$_SERVER['DB_HOST']: " . var_export($_SERVER['DB_HOST'] ?? 'NOT_SET', true) . "\n";
echo "file_exists('/.dockerenv'): " . var_export(file_exists('/.dockerenv'), true) . "\n";

echo "\n=== Docker Detection Logic ===\n";
$isDocker = (
    getenv('IS_DOCKER') === 'true' || 
    isset($_SERVER['IS_DOCKER']) || 
    getenv('CONTAINER') !== false ||
    isset($_SERVER['CONTAINER']) ||
    file_exists('/.dockerenv') ||
    (isset($_SERVER['DB_HOST']) && $_SERVER['DB_HOST'] === 'db')
);

echo "Overall Docker Detection: " . var_export($isDocker, true) . "\n";

echo "\n=== Condition Breakdown ===\n";
echo "getenv('IS_DOCKER') === 'true': " . var_export(getenv('IS_DOCKER') === 'true', true) . "\n";
echo "isset(\$_SERVER['IS_DOCKER']): " . var_export(isset($_SERVER['IS_DOCKER']), true) . "\n";
echo "getenv('CONTAINER') !== false: " . var_export(getenv('CONTAINER') !== false, true) . "\n";
echo "isset(\$_SERVER['CONTAINER']): " . var_export(isset($_SERVER['CONTAINER']), true) . "\n";
echo "file_exists('/.dockerenv'): " . var_export(file_exists('/.dockerenv'), true) . "\n";
echo "DB_HOST check: " . var_export((isset($_SERVER['DB_HOST']) && $_SERVER['DB_HOST'] === 'db'), true) . "\n";

echo "\n=== EnvLoader Results ===\n";
echo "EnvLoader::get('IS_DOCKER'): " . var_export(EnvLoader::get('IS_DOCKER'), true) . "\n";
echo "EnvLoader::get('DB_HOST'): " . var_export(EnvLoader::get('DB_HOST'), true) . "\n";
echo "EnvLoader::get('SOCKET_HOST'): " . var_export(EnvLoader::get('SOCKET_HOST'), true) . "\n";
echo "EnvLoader::get('SOCKET_PORT'): " . var_export(EnvLoader::get('SOCKET_PORT'), true) . "\n";

echo "\n=== All \$_SERVER keys containing 'DOCKER' or 'CONTAINER' ===\n";
foreach ($_SERVER as $key => $value) {
    if (stripos($key, 'DOCKER') !== false || stripos($key, 'CONTAINER') !== false) {
        echo "$key: " . var_export($value, true) . "\n";
    }
}
