<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "PHP Version: " . phpversion() . "\n";
echo "Checking file_exists(/.dockerenv): " . (file_exists('/.dockerenv') ? 'true' : 'false') . "\n";
echo "Environment variables:\n";
echo "DB_HOST: " . getenv('DB_HOST') . "\n";
echo "DB_PORT: " . getenv('DB_PORT') . "\n";
echo "DB_NAME: " . getenv('DB_NAME') . "\n";
echo "DB_USER: " . getenv('DB_USER') . "\n";
echo "IS_DOCKER: " . getenv('IS_DOCKER') . "\n";

// Try different host options
$hosts = ['db', 'misvord_db', 'localhost', '127.0.0.1'];
$port = getenv('DB_PORT') ?: '1003';
$dbname = getenv('DB_NAME') ?: 'misvord';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASS') ?: 'kolin123';

foreach ($hosts as $host) {
    echo "\n------------------------------\n";
    echo "Trying to connect to MySQL with host: $host\n";
    
    try {
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 3, // 3 second timeout
        ];
        
        echo "DSN: $dsn\n";
        
        $pdo = new PDO($dsn, $username, $password, $options);
        echo "✅ Connection successful with host '$host'!\n";
        
        $stmt = $pdo->query('SELECT NOW() as now');
        $result = $stmt->fetch();
        echo "Current MySQL time: " . $result['now'] . "\n";
        
    } catch (PDOException $e) {
        echo "❌ Connection failed with host '$host': " . $e->getMessage() . "\n";
    }
}

// Now try using the Database class
echo "\n------------------------------\n";
echo "Testing using Database class:\n";

try {
    require_once '../config/db.php';
    $db = Database::getInstance();
    echo "✅ Database class connection successful!\n";
    
    $pdo = $db->getConnection();
    $stmt = $pdo->query('SELECT NOW() as now');
    $result = $stmt->fetch();
    echo "Current MySQL time: " . $result['now'] . "\n";
} catch (Exception $e) {
    echo "❌ Database class connection failed: " . $e->getMessage() . "\n";
} 