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
            'created_at' => indonesiaTime(),
            'updated_at' => indonesiaTime()
        ]);
        
        return $chatRoomMessage->save();
    }
    
    public function getMessagesByRoomId($roomId, $limit = 20, $offset = 0) {
        $query = new Query();
        
        error_log("[BOT-DEBUG] Loading DM messages for room $roomId with limit $limit, offset $offset");
        
        $sql = "
            SELECT m.id as id, m.user_id, m.content, m.sent_at, m.edited_at,
                   m.message_type, m.attachment_url, m.reply_message_id,
                   m.created_at, m.updated_at,
                   u.username, u.avatar_url, u.status as user_status,
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
        $execution_time = ($end_time - $start_time) * 1000;
        
        error_log("DEBUG: Query completed in {$execution_time}ms, found " . count($results) . " messages");
        error_log("[BOT-DEBUG] DM room $roomId raw query returned " . count($results) . " messages");
        
        $botMessageCount = 0;
        $userMessageCount = 0;
        
        if (count($results) === 0) {        
            $room_exists = $query->table('chat_rooms')->where('id', $roomId)->first();
            error_log("DEBUG: Room exists check: " . ($room_exists ? "YES" : "NO"));
            
            $message_count = $query->table('chat_room_messages')->where('room_id', $roomId)->count();
            error_log("DEBUG: Room has $message_count message associations");
            error_log("[BOT-DEBUG] Room $roomId has $message_count total message associations");
        }
        
        foreach ($results as &$row) {
            if (isset($row['user_status']) && $row['user_status'] === 'bot') {
                $botMessageCount++;
                error_log("[BOT-DEBUG] Found bot message in DM: ID {$row['id']} from user {$row['username']} (user_id: {$row['user_id']})");
            } else {
                $userMessageCount++;
            }
            $row['attachments'] = $this->parseAttachments($row['attachment_url']);
            unset($row['attachment_url']);
            
            $row['reactions'] = $this->getMessageReactions($row['id']);
        }
        
        error_log("[BOT-DEBUG] DM room $roomId message breakdown: $botMessageCount bot messages, $userMessageCount user messages");
        
        if ($botMessageCount === 0) {
            $botCheckSql = "
                SELECT COUNT(*) as bot_count 
                FROM chat_room_messages crm
                INNER JOIN messages m ON crm.message_id = m.id
                INNER JOIN users u ON m.user_id = u.id
                WHERE crm.room_id = ? AND u.status = 'bot'
            ";
            $botCheck = $query->query($botCheckSql, [$roomId]);
            $totalBotMessages = $botCheck[0]['bot_count'] ?? 0;
            error_log("[BOT-DEBUG] Total bot messages in DM room $roomId: $totalBotMessages");
            
            if ($totalBotMessages > 0) {
                error_log("[BOT-DEBUG] WARNING: DM room $roomId has $totalBotMessages bot messages but none returned in current query (offset: $offset)");
            }
        }
        
        return array_reverse($results);
    }
    
    public function getMessagesByRoomIdWithPagination($roomId, $limit = 20, $offset = 0) {
        $messages = $this->getMessagesByRoomId($roomId, $limit, $offset);
        
        error_log("[BOT-DEBUG] getMessagesByRoomIdWithPagination for room $roomId: " . count($messages) . " messages retrieved");
        
        $hasMore = false;
        if (count($messages) === $limit) {
            $nextMessages = $this->getMessagesByRoomId($roomId, 1, $offset + $limit);
            $hasMore = !empty($nextMessages);
        }
        
        error_log("[BOT-DEBUG] Final DM pagination result: " . count($messages) . " messages, hasMore: " . ($hasMore ? 'true' : 'false'));
        
        return [
            'messages' => $messages,
            'has_more' => $hasMore
        ];
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
    
    private function getMessageReactions($messageId) {
        $query = new Query();
        
        $sql = "
            SELECT mr.emoji, mr.user_id, u.username, u.avatar_url
            FROM message_reactions mr
            INNER JOIN users u ON mr.user_id = u.id
            WHERE mr.message_id = ?
            ORDER BY mr.created_at ASC
        ";
        
        $reactions = $query->query($sql, [$messageId]);
        
        return array_map(function($reaction) {
            return [
                'emoji' => $reaction['emoji'],
                'user_id' => $reaction['user_id'],
                'username' => $reaction['username'],
                'avatar_url' => $reaction['avatar_url'] ?: '/public/assets/common/default-profile-picture.png'
            ];
        }, $reactions);
    }
} 