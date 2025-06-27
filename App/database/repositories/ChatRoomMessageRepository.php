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
        
        $results = $query->query($sql, [$roomId, $limit, $offset]);
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
} 