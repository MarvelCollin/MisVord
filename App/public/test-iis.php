<?php
echo "<h1>MisVord IIS Hosting Test</h1>";
echo "<p>Time: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>PHP: " . phpversion() . "</p>";
echo "<p>Server: " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
echo "<p>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
echo "<p>Request URI: " . $_SERVER['REQUEST_URI'] . "</p>";

if (file_exists('../.env')) {
    echo "<p style='color: green;'>✅ .env file found</p>";
} else {
    echo "<p style='color: red;'>❌ .env file NOT found</p>";
}

try {
    require_once '../config/env.php';
    $dbHost = EnvLoader::get('DB_HOST', 'not found');
    echo "<p style='color: green;'>✅ Environment loaded - DB Host: $dbHost</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Environment error: " . $e->getMessage() . "</p>";
}

try {
    require_once '../config/db.php';
    $db = Database::getInstance();
    echo "<p style='color: green;'>✅ Database connection successful</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Database error: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<h3>Test Links:</h3>";
echo "<p><a href='/health'>Health Check</a></p>";
echo "<p><a href='/'>Home Page</a></p>";
echo "<p><a href='/api/auth/check'>API Test</a></p>";
?>
