<?php
/**
 * Debug Logs API Endpoint
 * Provides access to recent logs for debugging purposes
 */

// Load the logger
require_once __DIR__ . '/../../utils/AppLogger.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $action = $_GET['action'] ?? 'recent';
    $logger = AppLogger::getInstance();
    
    switch ($action) {
        case 'recent':
            $lines = (int)($_GET['lines'] ?? 100);
            $logs = $logger->getRecentLogs($lines);
            
            echo json_encode([
                'success' => true,
                'logs' => $logs,
                'count' => count($logs),
                'lines_requested' => $lines
            ]);
            break;
            
        case 'clear':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $logger->clearLogs();
                echo json_encode([
                    'success' => true,
                    'message' => 'Logs cleared successfully'
                ]);
            } else {
                http_response_code(405);
                echo json_encode([
                    'success' => false,
                    'error' => 'Method not allowed. Use POST to clear logs.'
                ]);
            }
            break;
            
        case 'test':
            // Test different log levels
            $logger->debug('Test debug message', ['test' => true]);
            $logger->info('Test info message', ['test' => true]);
            $logger->warning('Test warning message', ['test' => true]);
            $logger->error('Test error message', ['test' => true]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Test logs generated successfully'
            ]);
            break;
            
        case 'stats':
            $logDir = APP_ROOT . '/logs';
            $files = glob($logDir . '/app_*.log*');
            
            $stats = [
                'log_directory' => $logDir,
                'log_files_count' => count($files),
                'total_size' => 0,
                'files' => []
            ];
            
            foreach ($files as $file) {
                $size = filesize($file);
                $stats['total_size'] += $size;
                $stats['files'][] = [
                    'name' => basename($file),
                    'size' => $size,
                    'modified' => date('Y-m-d H:i:s', filemtime($file))
                ];
            }
            
            echo json_encode([
                'success' => true,
                'stats' => $stats
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid action. Supported actions: recent, clear, test, stats'
            ]);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
