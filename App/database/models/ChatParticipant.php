<?php

require_once __DIR__ . '/Model.php';

class ChatParticipant extends Model {
    protected static $table = 'chat_participants';
    protected $fillable = ['id', 'chat_room_id', 'user_id', 'created_at', 'updated_at'];
    
    public static function findByRoomAndUser($roomId, $userId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('chat_room_id', $roomId)
            ->where('user_id', $userId)
            ->first();
        return $result ? new static($result) : null;
    }
    
    public static function getForRoom($roomId) {
        $query = new Query();
        $results = $query->table(static::$table)
            ->where('chat_room_id', $roomId)
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
}
