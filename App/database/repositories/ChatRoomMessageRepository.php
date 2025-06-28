<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/ChatRoomMessage.php';

class ChatRoomMessageRepository extends Repository {
    protected $model = 'ChatRoomMessage';
    
    protected function getModelClass() {
        return ChatRoomMessage::class;
    }
    
    public function addMessageToRoom($roomId, $messageId) {
        $chatRoomMessage = new ChatRoomMessage([
            'room_id' => $roomId,
            'message_id' => $messageId,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        return $chatRoomMessage->save();
    }
    
    public function getMessagesByRoomId($roomId, $limit = 50, $offset = 0) {
        $query = new Query();
        $sql = "
            SELECT m.id as id, m.user_id, m.content, m.sent_at, m.edited_at,
                   m.message_type, m.attachment_url, m.reply_message_id,
                   m.created_at, m.updated_at,
                   u.username, u.avatar_url,
                   crm.created_at as chat_room_message_created_at
            FROM chat_room_messages crm
            INNER JOIN messages m ON crm.message_id = m.id
            INNER JOIN users u ON m.user_id = u.id
            WHERE crm.room_id = ?
            ORDER BY m.sent_at DESC
            LIMIT ? OFFSET ?
        ";
        
        error_log("DEBUG: Executing getMessagesByRoomId query with roomId=$roomId, limit=$limit, offset=$offset");
        $start_time = microtime(true);
        $results = $query->query($sql, [$roomId, $limit, $offset]);
        $end_time = microtime(true);
        $execution_time = ($end_time - $start_time) * 1000; // in milliseconds
        
        error_log("DEBUG: Query completed in {$execution_time}ms, found " . count($results) . " messages");
        if (count($results) === 0) {
            // Check if room exists
            $room_exists = $query->table('chat_rooms')->where('id', $roomId)->first();
            error_log("DEBUG: Room exists check: " . ($room_exists ? "YES" : "NO"));
            
            // Check if there are any chat_room_messages entries
            $message_count = $query->table('chat_room_messages')->where('room_id', $roomId)->count();
            error_log("DEBUG: Room has $message_count message associations");
        }
        
        foreach ($results as &$row) {
            $row['attachments'] = $this->parseAttachments($row['attachment_url']);
            unset($row['attachment_url']);
        }
        
        return array_reverse($results);
    }
    
    public function findByMessageId($messageId) {
        return ChatRoomMessage::findByMessageId($messageId);
    }
    
    public function findByRoomId($roomId) {
        return ChatRoomMessage::findByRoomId($roomId);
    }
    
    public function removeMessageFromRoom($messageId) {
        $query = new Query();
        return $query->table('chat_room_messages')
            ->where('message_id', $messageId)
            ->delete();
    }
    
    private function parseAttachments($attachmentUrl) {
        if (!$attachmentUrl) return [];
        
        $decoded = json_decode($attachmentUrl, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }
        
        return [$attachmentUrl];
    }
} 