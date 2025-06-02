<?php
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/database/query.php';
require_once __DIR__ . '/utils/WebSocketClient.php';

header('Content-Type: application/json');

try {
    $results = [];
    
    // Test main database connection
    $query = new Query();
    $pdo = $query->getPdo();
    
    // Get current database
    $stmt = $pdo->query('SELECT DATABASE() as current_db');
    $dbResult = $stmt->fetch();
    $results['current_database'] = $dbResult['current_db'];
    
    // List all tables
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $results['tables'] = $tables;
    
    // Check specific tables
    $requiredTables = ['users', 'messages', 'channels', 'channel_messages'];
    foreach ($requiredTables as $table) {
        $exists = in_array($table, $tables);
        $results['table_status'][$table] = $exists ? 'exists' : 'missing';
        
        if ($exists) {
            // Get table structure
            $stmt = $pdo->query("DESCRIBE $table");
            $columns = $stmt->fetchAll();
            $results['table_structure'][$table] = array_column($columns, 'Field');
            
            // Get row count
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $count = $stmt->fetch();
            $results['table_counts'][$table] = $count['count'];
        }
    }
    
    // Test WebSocket connectivity
    try {
        $wsClient = new WebSocketClient();
        $wsTest = $wsClient->testConnection();
        $results['websocket_test'] = $wsTest ? 'successful' : 'failed';
    } catch (Exception $e) {
        $results['websocket_test'] = 'failed: ' . $e->getMessage();
    }
    
    echo json_encode($results, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
