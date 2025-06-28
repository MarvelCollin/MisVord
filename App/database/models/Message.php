<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../query.php';

class Message extends Model {
    protected static $table = 'messages';
    protected $fillable = ['id', 'user_id', 'reply_message_id', 'content', 'sent_at', 'edited_at', 'message_type', 'attachment_url', 'created_at', 'updated_at'];
    
    public function save() {
        if (!isset($this->attributes['sent_at'])) {
            $this->attributes['sent_at'] = date('Y-m-d H:i:s');
        }
        
        return parent::save();
    }

    
    public function getMessageLocation() {
        require_once __DIR__ . '/ChannelMessage.php';
        $channelMessage = ChannelMessage::findByMessageId($this->id);
        if ($channelMessage) {
            return [
                'type' => 'channel',
                'id' => $channelMessage->channel_id
            ];
        }
        
        $query = new Query();
        $chatRoomMessage = $query->table('chat_room_messages')
            ->where('message_id', $this->id)
            ->first();
        if ($chatRoomMessage) {
            return [
                'type' => 'chat_room',
                'id' => $chatRoomMessage['room_id']
            ];
        }
        
        return null;
    }
    
    public function user() {
        if (!$this->user_id) {
            return null;
        }
        
        require_once __DIR__ . '/User.php';
        return User::find($this->user_id);
    }
      public function replyTo() {
        if (!$this->reply_message_id) {
            return null;
        }
        
        return static::find($this->reply_message_id);
    }
    
    public function markAsEdited() {
        $this->edited_at = date('Y-m-d H:i:s');
        return $this->save();
    }
    
    public function getAttachmentsAttribute() {
        $raw = $this->attributes['attachment_url'] ?? null;
        if (!$raw) return [];
        
        $decoded = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }
        
        return [$raw];
    }
    
    public function setAttachmentsAttribute(array $urls) {
        $this->attributes['attachment_url'] = json_encode(array_values($urls));
    }
    
    public function formattedTime() {
        if (empty($this->sent_at)) {
            return 'Just now';
        }
        
        $sentAt = new DateTime($this->sent_at);
        $now = new DateTime();
        
        $diff = $now->diff($sentAt);
        
        if ($diff->days == 0) {
            return 'Today at ' . $sentAt->format('g:i A');
        } elseif ($diff->days == 1) {
            return 'Yesterday at ' . $sentAt->format('g:i A');
        } elseif ($diff->days < 7) {
            return $sentAt->format('l') . ' at ' . $sentAt->format('g:i A');
        } else {
            return $sentAt->format('M j, Y') . ' at ' . $sentAt->format('g:i A');
        }
    }
    
    public static function createTable() {
        $query = new Query();
        
        try {
            $tableExists = $query->tableExists(static::$table);
            
            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS " . static::$table . " (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT,
                        content TEXT NOT NULL,
                        sent_at DATETIME NOT NULL,
                        edited_at DATETIME NULL,
                        message_type VARCHAR(50) NOT NULL DEFAULT 'text',
                        attachment_url VARCHAR(512) NULL,
                        reply_message_id INT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX user_id_idx (user_id),
                        INDEX sent_at_idx (sent_at),
                        INDEX reply_message_id_idx (reply_message_id)
                    )
                ");
                
                $tableExists = $query->tableExists(static::$table);
            }
            
            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating messages table: " . $e->getMessage());
            return false;
        }
    }
    
    public static function initialize() {
        return self::createTable();
    }
}



