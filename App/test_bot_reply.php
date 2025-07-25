<?php
define('APP_ROOT', __DIR__);
require_once 'database/query.php';

echo 'Testing bot message reply data...' . PHP_EOL;

$query = new Query();

// Get recent bot messages
$botMessages = $query->query('
    SELECT m.id, m.user_id, m.content, m.reply_message_id, u.username, u.status 
    FROM messages m 
    JOIN users u ON m.user_id = u.id 
    WHERE u.status = "bot" 
    ORDER BY m.sent_at DESC 
    LIMIT 5
');

echo 'Recent bot messages:' . PHP_EOL;
foreach ($botMessages as $msg) {
    echo sprintf('ID: %s, User: %s (%s), Reply ID: %s, Content: %s' . PHP_EOL, 
        $msg['id'], $msg['username'], $msg['status'], 
        $msg['reply_message_id'] ?: 'NULL', 
        substr($msg['content'], 0, 50)
    );
}

// Test formatMessage for one of these
if (!empty($botMessages)) {
    echo PHP_EOL . 'Testing formatMessage for first bot message...' . PHP_EOL;
    
    require_once 'controllers/ChatController.php';
    $controller = new ChatController();
    
    $reflection = new ReflectionClass($controller);
    $formatMethod = $reflection->getMethod('formatMessage');
    $formatMethod->setAccessible(true);
    
    $formatted = $formatMethod->invoke($controller, $botMessages[0]);
    
    echo 'Formatted result:' . PHP_EOL;
    echo 'Has reply_message_id: ' . (isset($formatted['reply_message_id']) ? 'YES' : 'NO') . PHP_EOL;
    echo 'Has reply_data: ' . (isset($formatted['reply_data']) ? 'YES' : 'NO') . PHP_EOL;
    
    if (isset($formatted['reply_data'])) {
        echo 'Reply data: ' . json_encode($formatted['reply_data'], JSON_PRETTY_PRINT) . PHP_EOL;
    }
}
?>
