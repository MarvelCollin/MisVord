<?php

require_once __DIR__ . '/Model.php';

class MessageReaction extends Model {
    protected static $table = 'message_reactions';
    protected $fillable = ['message_id', 'user_id', 'emoji', 'created_at', 'updated_at'];
    
    public static function findByMessageAndUser($messageId, $userId, $emoji) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('message_id', $messageId)
            ->where('user_id', $userId)
            ->where('emoji', $emoji)
            ->first();
        return $result ? new static($result) : null;
    }
    
    public static function getForMessage($messageId) {
        $query = new Query();
        $results = $query->table(static::$table)
            ->where('message_id', $messageId)
            ->orderBy('created_at', 'ASC')
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
}


