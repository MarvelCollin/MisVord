<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/Message.php';
require_once __DIR__ . '/../query.php';

class MessageRepository extends Repository {
    public function __construct() {
        parent::__construct(Message::class);
    }
    
    public function getForChannel($channelId, $limit = 50, $offset = 0) {
        return Message::getForChannel($channelId, $limit, $offset);
    }
    
    public function createWithSentAt($data) {
        if (!isset($data['sent_at'])) {
            $data['sent_at'] = date('Y-m-d H:i:s');
        }
        return $this->create($data);
    }
    
    public function getRecentMessages($limit = 50) {
        $query = new Query();
        return $query->table('messages')
            ->orderBy('sent_at', 'DESC')
            ->limit($limit)
            ->get();
    }
    
    public function markAsEdited($messageId) {
        return $this->update($messageId, ['edited_at' => date('Y-m-d H:i:s')]);
    }    public function getReplies($messageId) {
        return $this->getAllBy('reply_message_id', $messageId);
    }
      public function searchInChannel($channelId, $searchQuery, $limit = 50) {
        $query = new Query();
        $results = $query->table('messages m')
            ->join('channel_messages cm', 'm.id', '=', 'cm.message_id')
            ->where('cm.channel_id', $channelId)
            ->where('m.content', 'LIKE', "%{$searchQuery}%")
            ->select('m.*')
            ->orderBy('m.created_at', 'DESC')
            ->limit($limit)
            ->get();
        
        $messages = [];
        foreach ($results as $result) {
            $messages[] = new Message($result);
        }
        
        return $messages;
    }
}
