<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/ChannelMessage.php';

class ChannelMessageRepository extends Repository {
    protected $model = 'ChannelMessage';
    
    protected function getModelClass() {
        return ChannelMessage::class;
    }
    
    public function addMessageToChannel($channelId, $messageId) {
        $channelMessage = new ChannelMessage([
            'channel_id' => $channelId,
            'message_id' => $messageId,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        return $channelMessage->save();
    }
    
    public function getMessagesByChannelId($channelId, $limit = 50, $offset = 0) {
        $query = new Query();
        $sql = "
            SELECT m.*, u.username, u.avatar_url,
                   cm.created_at as channel_message_created_at
            FROM channel_messages cm
            INNER JOIN messages m ON cm.message_id = m.id
            INNER JOIN users u ON m.user_id = u.id
            WHERE cm.channel_id = ?
            ORDER BY m.sent_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $results = $query->raw($sql, [$channelId, $limit, $offset]);
        return array_reverse($results);
    }
    
    public function findByMessageId($messageId) {
        return ChannelMessage::findByMessageId($messageId);
    }
    
    public function findByChannelId($channelId) {
        return ChannelMessage::findByChannelId($channelId);
    }
    
    public function removeMessageFromChannel($messageId) {
        $query = new Query();
        return $query->table('channel_messages')
            ->where('message_id', $messageId)
            ->delete();
    }
} 