<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../query.php';

class ChannelMessage extends Model {
    protected static $table = 'channel_messages';
    protected $fillable = ['channel_id', 'message_id', 'created_at', 'updated_at'];
    
    public static function findByMessageId($messageId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('message_id', $messageId)
            ->first();
        return $result ? new static($result) : null;
    }
    
    public static function findByChannelId($channelId) {
        $query = new Query();
        $results = $query->table(static::$table)
            ->where('channel_id', $channelId)
            ->orderBy('created_at', 'DESC')
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
    
    public static function deleteByMessageId($messageId) {
        $query = new Query();
        return $query->table(static::$table)
            ->where('message_id', $messageId)
            ->delete();
    }
    
    public static function deleteByChannelId($channelId) {
        $query = new Query();
        return $query->table(static::$table)
            ->where('channel_id', $channelId)
            ->delete();
    }
    
    public static function getMessageCountForChannel($channelId) {
        $query = new Query();
        return $query->table(static::$table)
            ->where('channel_id', $channelId)
            ->count();
    }
} 