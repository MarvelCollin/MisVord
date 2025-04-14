<?php
// Debug API file to provide real-time debug information to the debug panel

// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

// Get database status
$dbStatus = [];
try {
    require_once __DIR__ . '/database/query.php';
    $query = new Query();
    $dbStatus = [
        'connected' => true,
        'error' => null,
        'tables' => []
    ];
    
    // Get list of tables
    $tables = $query->raw("SHOW TABLES");
    if ($tables && is_array($tables)) {
        foreach ($tables as $table) {
            if (is_array($table) && !empty($table)) {
                $tableName = reset($table); // Get first value from the array
                $count = 0;
                try {
                    $countResult = $query->raw("SELECT COUNT(*) as count FROM `$tableName`");
                    if ($countResult && isset($countResult[0]['count'])) {
                        $count = $countResult[0]['count'];
                    }
                } catch (Exception $e) {
                    // Ignore count errors
                }
                
                $dbStatus['tables'][] = [
                    'name' => $tableName,
                    'count' => $count
                ];
            }
        }
    }
} catch (Exception $e) {
    $dbStatus = [
        'connected' => false,
        'error' => $e->getMessage()
    ];
}

// Get PHP errors
$phpErrors = [];
$errorLogPath = ini_get('error_log');
if (file_exists($errorLogPath) && is_readable($errorLogPath)) {
    $errors = file($errorLogPath);
    $phpErrors = array_slice($errors, -10); // Get last 10 errors
}

// Check WebSocket server status
$socketStatus = [
    'server_url' => $_ENV['SOCKET_SERVER'] ?? 'http://localhost:3000',
    'status' => 'unknown'
];

// Try to ping the socket server
$socketCheck = @file_get_contents($socketStatus['server_url'] . '/status');
if ($socketCheck !== false) {
    $socketStatus['status'] = 'online';
    $socketStatus['response'] = json_decode($socketCheck, true);
} else {
    $socketStatus['status'] = 'offline';
    $socketStatus['error'] = 'Could not connect to WebSocket server';
}

// Return debug information
echo json_encode([
    'timestamp' => date('Y-m-d H:i:s'),
    'session' => $_SESSION,
    'request' => [
        'uri' => $_SERVER['REQUEST_URI'],
        'method' => $_SERVER['REQUEST_METHOD'],
        'get' => $_GET,
        'post' => $_POST
    ],
    'database' => $dbStatus,
    'php_errors' => $phpErrors,
    'websocket' => $socketStatus,
    'server_info' => [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'],
        'memory_usage' => memory_get_usage(true) / 1024 / 1024 . ' MB'
    ]
]);
