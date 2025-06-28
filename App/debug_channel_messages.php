<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== DEBUGGING CHANNEL MESSAGES API ===\n";

require_once 'config/db.php';
require_once 'controllers/ChatController.php';

$channelId = 13;
$userId = 1;

echo "Testing channel $channelId for user $userId\n\n";

try {
    $db = require 'config/db.php';
    
    echo "1. Checking if channel exists...\n";
    $stmt = $db->prepare('SELECT * FROM channels WHERE id = ?');
    $stmt->execute([$channelId]);
    $channel = $stmt->fetch();
    
    if ($channel) {
        echo "   ✓ Channel found: " . $channel['name'] . "\n";
        echo "   Server ID: " . $channel['server_id'] . "\n";
    } else {
        echo "   ✗ Channel not found!\n";
        exit;
    }
    
    echo "\n2. Checking user membership...\n";
    $stmt = $db->prepare('SELECT * FROM user_server_memberships WHERE user_id = ? AND server_id = ?');
    $stmt->execute([$userId, $channel['server_id']]);
    $membership = $stmt->fetch();
    
    if ($membership) {
        echo "   ✓ User is member of server\n";
    } else {
        echo "   ✗ User is NOT member of server!\n";
        exit;
    }
    
    echo "\n3. Checking messages in channel...\n";
    $stmt = $db->prepare('SELECT COUNT(*) as count FROM channel_messages WHERE channel_id = ?');
    $stmt->execute([$channelId]);
    $result = $stmt->fetch();
    echo "   Messages count: " . $result['count'] . "\n";
    
    if ($result['count'] > 0) {
        echo "\n4. Getting sample messages...\n";
        $stmt = $db->prepare('
            SELECT m.id, m.content, m.user_id, u.username, m.sent_at
            FROM channel_messages cm
            JOIN messages m ON cm.message_id = m.id
            JOIN users u ON m.user_id = u.id
            WHERE cm.channel_id = ?
            ORDER BY m.sent_at DESC
            LIMIT 3
        ');
        $stmt->execute([$channelId]);
        $messages = $stmt->fetchAll();
        
        foreach ($messages as $msg) {
            echo "   - Message {$msg['id']}: '{$msg['content']}' by {$msg['username']}\n";
        }
    }
    
    echo "\n5. Testing ChatController API...\n";
    $_SESSION['user_id'] = $userId;
    
    $controller = new ChatController();
    $response = $controller->getMessages('channel', $channelId);
    
    echo "   Response: " . json_encode($response, JSON_PRETTY_PRINT) . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== DEBUG COMPLETE ===\n";
?> 