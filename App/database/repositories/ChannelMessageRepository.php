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
            'created_at' => indonesiaTime(),
            'updated_at' => indonesiaTime()
        ]);
        
        return $channelMessage->save();
    }
    
    public function getMessagesByChannelId($channelId, $limit = 20, $offset = 0) {
        $query = new Query();
        $sql = "
            SELECT m.id as id, m.user_id, m.content, m.sent_at, m.edited_at, 
                   m.message_type, m.attachment_url, m.reply_message_id,
                   m.created_at, m.updated_at,
                   u.username, u.avatar_url,
                   cm.created_at as channel_message_created_at
            FROM channel_messages cm
            INNER JOIN messages m ON cm.message_id = m.id
            INNER JOIN users u ON m.user_id = u.id
            WHERE cm.channel_id = ?
            ORDER BY m.sent_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $results = $query->query($sql, [$channelId, $limit + 1, $offset]);
        
        foreach ($results as &$row) {
            $row['attachments'] = $this->parseAttachments($row['attachment_url']);
            unset($row['attachment_url']);
        }
        
        return array_reverse($results);
    }
    
    public function getMessagesByChannelIdWithPagination($channelId, $limit = 20, $offset = 0) {
        $messages = $this->getMessagesByChannelId($channelId, $limit, $offset);
        
        $hasMore = count($messages) > $limit;
        if ($hasMore) {
            array_pop($messages);
        }
        
        return [
            'messages' => $messages,
            'has_more' => $hasMore
        ];
    }
    
    private function parseAttachments($attachmentUrl) {
        if (!$attachmentUrl) return [];
        
        $decoded = json_decode($attachmentUrl, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }
        
        return [$attachmentUrl];
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