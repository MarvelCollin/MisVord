<?php

require_once __DIR__ . '/../query.php';

class Message {
    protected static $table = 'messages';
    
    protected $attributes = [];
    
    public function __construct($attributes = []) {
        $this->fill($attributes);
    }
    
    public function fill($attributes) {
        foreach ($attributes as $key => $value) {
            $this->attributes[$key] = $value;
        }
        
        return $this;
    }
    
    public function __get($key) {
        return $this->attributes[$key] ?? null;
    }
    
    public function __set($key, $value) {
        $this->attributes[$key] = $value;
    }
    
    public static function find($id) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('id', $id)
            ->first();
            
        if (!$result) {
            return null;
        }
        
        return new static($result);
    }
    
    public function save() {
        $query = new Query();
        
        if (isset($this->attributes['id'])) {
            $id = $this->attributes['id'];
            unset($this->attributes['id']);
            
            $result = $query->table(static::$table)
                    ->where('id', $id)
                    ->update($this->attributes);
            
            $this->attributes['id'] = $id;
            
            return $result > 0;
        } else {
            $this->attributes['id'] = $query->table(static::$table)
                    ->insert($this->attributes);
            
            return $this->attributes['id'] > 0;
        }
    }
    
    public function delete() {
        $query = new Query();
        return $query->table(static::$table)
                ->where('id', $this->id)
                ->delete() > 0;
    }
    
    public static function getForChannel($channelId, $limit = 50, $offset = 0) {
        $query = new Query();
        
        $tableExists = $query->tableExists('channel_messages');
        if (!$tableExists) {
            self::createChannelMessagesTable();
        }
        
        $tableExists = $query->tableExists('channel_messages');
        if (!$tableExists) {
            error_log("Failed to create channel_messages table");
            return [];
        }
        
        return $query->table('messages m')
                ->select('m.*, u.username, u.avatar_url')
                ->join('channel_messages cm', 'm.id', '=', 'cm.message_id')
                ->join('users u', 'm.user_id', '=', 'u.id')
                ->where('cm.channel_id', $channelId)
                ->orderBy('m.sent_at', 'DESC')
                ->limit($limit)
                ->offset($offset)
                ->get();
    }
    
    public function associateWithChannel($channelId) {
        if (!$this->id) {
            return false;
        }
        
        $query = new Query();
        
        $tableExists = $query->tableExists('channel_messages');
        if (!$tableExists) {
            self::createChannelMessagesTable();
            
            $tableExists = $query->tableExists('channel_messages');
            if (!$tableExists) {
                error_log("Failed to create channel_messages table");
                return false;
            }
        }
        
        $result = $query->table('channel_messages')
                ->insert([
                    'channel_id' => $channelId,
                    'message_id' => $this->id
                ]);
        
        return $result > 0;
    }
    
    public static function createChannelMessagesTable() {
        $query = new Query();
        
        try {
            $query->raw("
                CREATE TABLE IF NOT EXISTS channel_messages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    channel_id INT NOT NULL,
                    message_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_channel_message (channel_id, message_id),
                    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
                    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
                )
            ");
            
            return $query->tableExists('channel_messages');
        } catch (PDOException $e) {
            error_log("Error creating channel_messages table: " . $e->getMessage());
            return false;
        }
    }
    
    public function user() {
        if (!$this->user_id) {
            return null;
        }
        
        require_once __DIR__ . '/User.php';
        return User::find($this->user_id);
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
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                        FOREIGN KEY (reply_message_id) REFERENCES messages(id) ON DELETE SET NULL
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
        $created = self::createTable();
        
        if ($created) {
            return self::createChannelMessagesTable();
        }
        
        return $created;
    }
    
    public static function all() {
        $query = new Query();
        return $query->table(static::$table)->get();
    }
}

