<?php

require_once __DIR__ . '/Model.php';

class ChatRoom extends Model {
    protected static $table = 'chat_rooms';
    protected $fillable = ['id', 'name', 'type', 'image_url', 'created_at', 'updated_at'];
    
    public static function findByType($type) {
        $query = new Query();
        $results = $query->table(static::$table)
            ->where('type', $type)
            ->orderBy('created_at', 'DESC')
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
    
    public function getParticipants() {
        $query = new Query();
        $results = $query->table('chat_participants cp')
            ->join('users u', 'cp.user_id', '=', 'u.id')
            ->where('cp.chat_room_id', $this->id)
            ->select('u.*')
            ->get();
        return array_map(function($data) { return new User($data); }, $results);
    }
}


