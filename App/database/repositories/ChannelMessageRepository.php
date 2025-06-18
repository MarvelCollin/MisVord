<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/ChannelMessage.php';
require_once __DIR__ . '/../query.php';

class ChannelMessageRepository extends Repository {
    public function __construct() {
        parent::__construct(ChannelMessage::class);
    }
      public function findByChannelAndMessage($channelId, $messageId) {
        $query = new Query();
        $result = $query->table(ChannelMessage::getTable())
            ->where('channel_id', $channelId)
            ->where('message_id', $messageId)
            ->first();
        return $result ? new ChannelMessage($result) : null;
    }
    
    public function getMessagesForChannel($channelId, $limit = 50, $offset = 0) {
        return ChannelMessage::getChannelMessages($channelId, $limit, $offset);
    }
    
    public function addMessageToChannel($channelId, $messageId) {
        return $this->create([
            'channel_id' => $channelId,
            'message_id' => $messageId
        ]);
    }
    
    public function removeMessageFromChannel($channelId, $messageId) {
        $channelMessage = $this->findByChannelAndMessage($channelId, $messageId);
        return $channelMessage ? $channelMessage->delete() : false;
    }
}
