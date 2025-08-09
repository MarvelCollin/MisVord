<?php
if (getenv('IS_DOCKER') === 'true') {
    define('APP_ROOT', '/var/www/html');
} else {
    define('APP_ROOT', dirname(__DIR__));
}

require_once __DIR__ . '/../database/repositories/ChannelMessageRepository.php';
require_once __DIR__ . '/../config/db.php';

$repo = new ChannelMessageRepository();

echo "Testing emoji reactions loading...\n";

try {
    $messages = $repo->getMessagesByChannelId(1, 5, 0);
    
    echo "Found " . count($messages) . " messages\n";
    
    foreach ($messages as $message) {
        echo "Message ID: " . $message['id'] . "\n";
        echo "Content: " . substr($message['content'], 0, 50) . "...\n";
        echo "Reactions count: " . count($message['reactions']) . "\n";
        
        if (!empty($message['reactions'])) {
            echo "Reactions:\n";
            foreach ($message['reactions'] as $reaction) {
                echo "  - " . $reaction['emoji'] . " by " . $reaction['username'] . "\n";
            }
        }
        echo "---\n";
    }
    
    echo "Test completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
