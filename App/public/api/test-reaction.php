<?php
session_start();

// Simple test to add a reaction to message 137
require_once __DIR__ . '/../../database/query.php';
require_once __DIR__ . '/../../database/models/MessageReaction.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

try {
    // First check if message 137 exists
    $query = new Query();
    $message = $query->table('messages')->where('id', 137)->first();
    
    if (!$message) {
        echo json_encode(['error' => 'Message 137 not found']);
        exit;
    }
    
    echo json_encode(['message_exists' => true, 'message' => $message]);
    
    // Check if reactions table exists and has data
    $reactionsCount = $query->table('message_reactions')->count();
    echo json_encode(['reactions_table_count' => $reactionsCount]);
    
    // Try to add a test reaction
    $userId = $_SESSION['user_id'];
    $emoji = '👍';
    
    // Check if reaction already exists
    $existing = $query->table('message_reactions')
        ->where('message_id', 137)
        ->where('user_id', $userId)
        ->where('emoji', $emoji)
        ->first();
    
    if ($existing) {
        echo json_encode(['existing_reaction' => $existing]);
    } else {
        // Add new reaction
        $insertId = $query->table('message_reactions')->insert([
            'message_id' => 137,
            'user_id' => $userId,
            'emoji' => $emoji,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        echo json_encode(['reaction_added' => true, 'insert_id' => $insertId]);
    }
    
    // Now get all reactions for message 137
    $reactions = $query->table('message_reactions')
        ->where('message_id', 137)
        ->get();
    
    echo json_encode(['all_reactions_for_137' => $reactions]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
} 