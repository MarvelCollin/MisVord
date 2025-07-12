<?php
require_once 'config/env.php';
require_once 'config/helpers.php';

echo "Testing Asset URL Generation:\n";
echo "=============================\n";

// Simulate VPS environment
$_SERVER['HTTP_HOST'] = 'marvelcollin.my.id';
$_SERVER['HTTPS'] = 'on';

echo "Host: " . $_SERVER['HTTP_HOST'] . "\n";
echo "HTTPS: " . $_SERVER['HTTPS'] . "\n";

echo "\nTesting asset() function:\n";
echo "asset('/icons/logo.png'): " . asset('/icons/logo.png') . "\n";
echo "asset('/css/global.css'): " . asset('/css/global.css') . "\n";
echo "asset('/js/main.js'): " . asset('/js/main.js') . "\n";

echo "\nTesting css() function:\n";
echo "css('global'): " . css('global') . "\n";
echo "css('main'): " . css('main') . "\n";

echo "\nTesting js() function:\n";
echo "js('main'): " . js('main') . "\n";
echo "js('core/socket/global-socket-manager'): " . js('core/socket/global-socket-manager') . "\n";

echo "\nTesting getBaseUrl() function:\n";
echo "getBaseUrl(): " . getBaseUrl() . "\n";

echo "\nExpected Results (should NOT contain /misvord and should use HTTPS):\n";
echo "All URLs should start with: https://marvelcollin.my.id/public/\n";
