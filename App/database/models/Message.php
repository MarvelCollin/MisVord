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
        
        try {
            // Ensure table exists
            if (!$query->tableExists(static::$table)) {
                error_log("Message::save - Table does not exist: " . static::$table);
                return self::createTable() && $this->save();
            }
            
            // Set required timestamps
            if (!isset($this->attributes['sent_at'])) {
                $this->attributes['sent_at'] = date('Y-m-d H:i:s');
            }
            
            if (!isset($this->attributes['created_at'])) {
                $this->attributes['created_at'] = date('Y-m-d H:i:s');
            }
            
            if (!isset($this->attributes['updated_at'])) {
                $this->attributes['updated_at'] = date('Y-m-d H:i:s');
            }
            
            // Check if this is an update or insert
            if (isset($this->attributes['id'])) {
                $id = $this->attributes['id'];
                $updateData = $this->attributes;
                unset($updateData['id']);
                $updateData['updated_at'] = date('Y-m-d H:i:s');
                
                $result = $query->table(static::$table)
                        ->where('id', $id)
                        ->update($updateData);
                
                return $result > 0;
            } else {
                // Insert new message
                error_log("Message::save - Inserting: " . json_encode($this->attributes));
                
                $this->attributes['id'] = $query->table(static::$table)
                        ->insert($this->attributes);
                
                if (!$this->attributes['id'] || $this->attributes['id'] <= 0) {
                    error_log("Message::save - Failed to insert message");
                    return false;
                }
                
                error_log("Message::save - Successfully inserted with id: " . $this->attributes['id']);
                return true;
            }
        } catch (Exception $e) {
            error_log("Message::save - Error: " . $e->getMessage());
            return false;
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
        
        // Ensure channel_messages table exists
        if (!$query->tableExists('channel_messages')) {
            self::createChannelMessagesTable();
        }
        
        return $query->table('messages m')
                ->select('m.*, u.username, u.avatar_url, m.sent_at as timestamp') // Use sent_at as timestamp
                ->join('channel_messages cm', 'm.id', '=', 'cm.message_id')
                ->join('users u', 'm.user_id', '=', 'u.id')
                ->where('cm.channel_id', $channelId)
                ->orderBy('m.sent_at', 'ASC') // Changed to ASC for chronological order
                ->limit($limit)
                ->offset($offset)
                ->get();
    }
    
    public function associateWithChannel($channelId) {
        if (!$this->id) {
            return false;
        }
        
        $query = new Query();
        
        // Ensure table exists
        if (!$query->tableExists('channel_messages')) {
            self::createChannelMessagesTable();
        }
        
        try {
            $result = $query->table('channel_messages')
                    ->insert([
                        'channel_id' => $channelId,
                        'message_id' => $this->id,
                        'created_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s')
                    ]);
            
            return $result > 0;
        } catch (Exception $e) {
            // Handle duplicate entries gracefully
            if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                error_log("Message already associated with channel - ignoring duplicate");
                return true;
            }
            error_log("Error associating message with channel: " . $e->getMessage());
            return false;
        }
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
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
            if (!$query->tableExists(static::$table)) {
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
            }
            
            return $query->tableExists(static::$table);
        } catch (PDOException $e) {
            error_log("Error creating messages table: " . $e->getMessage());
            return false;
        }
    }
    
    public static function initialize() {
        try {
            $created = self::createTable();
            if ($created) {
                $channelMessagesCreated = self::createChannelMessagesTable();
                return $channelMessagesCreated;
            }
            return $created;
        } catch (Exception $e) {
            error_log("Message::initialize - Error: " . $e->getMessage());
            return false;
        }
    }
}

