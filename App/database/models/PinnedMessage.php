<?php

require_once __DIR__ . '/Model.php';

class PinnedMessage extends Model {
    protected static $table = 'pinned_messages';
    protected $fillable = ['message_id', 'pinned_by_user_id', 'pinned_at', 'created_at', 'updated_at'];
    
    public static function findByMessageId($messageId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('message_id', $messageId)
            ->first();
        return $result ? new static($result) : null;
    }
    
    public static function getForChannel($channelId) {
        $query = new Query();
        $results = $query->table(static::$table . ' pm')
            ->join('channel_messages cm', 'pm.message_id', '=', 'cm.message_id')
            ->where('cm.channel_id', $channelId)
            ->select('pm.*')
            ->orderBy('pm.pinned_at', 'DESC')
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
}


