<?php
header('Content-Type: text/plain');

echo "=== RECENT DEBUG MESSAGES ===\n\n";

// Try to read PHP error log
$errorLog = ini_get('error_log');
if ($errorLog && file_exists($errorLog)) {
    $lines = file($errorLog);
    $recentLines = array_slice($lines, -100); // Last 100 lines
    
    $found = false;
    foreach ($recentLines as $line) {
        if (strpos($line, 'DEBUG:') !== false) {
            echo $line;
            $found = true;
        }
    }
    
    if (!$found) {
        echo "No DEBUG messages found in recent log entries.\n";
    }
} else {
    echo "Error log not accessible.\n";
    echo "Try checking your server's error logs manually.\n";
}
?> 