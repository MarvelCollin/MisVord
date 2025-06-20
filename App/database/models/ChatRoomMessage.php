<?php

require_once __DIR__ . '/Model.php';

class ChatRoomMessage extends Model {
    protected static $table = 'chat_room_messages';
    protected $fillable = ['id', 'room_id', 'message_id', 'created_at', 'updated_at'];
    
    public static function findByRoomId($roomId, $limit = null, $offset = null) {
        $query = new Query();
        $query->table(static::$table)->where('room_id', $roomId);
        
        if ($limit !== null) {
            $query->limit($limit);
        }
        
        if ($offset !== null) {
            $query->offset($offset);
        }
        
        $results = $query->orderBy('created_at', 'DESC')->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
    
    public function getMessage() {
        $query = new Query();
        $result = $query->table('messages')
            ->where('id', $this->message_id)
            ->first();
        return $result ? new Message($result) : null;
    }
}


