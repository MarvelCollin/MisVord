<?php

require_once __DIR__ . '/Model.php';

class Message extends Model {
    protected static $table = 'messages';
    protected $fillable = ['id', 'user_id', 'reply_message_id', 'content', 'sent_at', 'edited_at', 'message_type', 'attachment_url', 'created_at', 'updated_at'];
    
    public function save() {
        if (!isset($this->attributes['sent_at'])) {
            $this->attributes['sent_at'] = date('Y-m-d H:i:s');
        }
        
        return parent::save();
    }
      public static function getForChannel($channelId, $limit = 50, $offset = 0) {
        $query = new Query();
        $results = $query->table('messages m')
                ->select('m.*, u.username, u.avatar_url, m.sent_at as timestamp') 
                ->join('channel_messages cm', 'm.id', '=', 'cm.message_id')
                ->join('users u', 'm.user_id', '=', 'u.id')
                ->where('cm.channel_id', $channelId)
                ->orderBy('m.sent_at', 'ASC')
                ->limit($limit)
                ->offset($offset)
                ->get();
        
        return $results;
    }
      public static function getRecentForChannel($channelId, $limit = 10) {
        $query = new Query();
        return $query->table('messages m')
                ->join('channel_messages cm', 'm.id', '=', 'cm.message_id')
                ->join('users u', 'm.user_id', '=', 'u.id')
                ->where('cm.channel_id', $channelId)
                ->select('m.*, u.username, u.avatar_url')
                ->orderBy('m.sent_at', 'DESC')
                ->limit($limit)
                ->get();
    }
    
    public function associateWithChannel($channelId) {
        if (!$this->id) {
            return false;
        }
        
        $query = new Query();
        return $query->table('channel_messages')->insert([
            'channel_id' => $channelId,
            'message_id' => $this->id
        ]);
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
                        attachment_url VARCHAR(255) NULL,
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



