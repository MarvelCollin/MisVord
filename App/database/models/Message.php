<?php

require_once __DIR__ . '/../query.php';

class Message {
    // Define the table name
    protected static $table = 'messages';
    
    // Store attributes
    protected $attributes = [];
    
    /**
     * Constructor - initialize model with attributes
     * 
     * @param array $attributes Initial attribute values
     */
    public function __construct($attributes = []) {
        $this->fill($attributes);
    }
    
    /**
     * Fill model with an array of attributes
     * 
     * @param array $attributes
     * @return $this
     */
    public function fill($attributes) {
        foreach ($attributes as $key => $value) {
            $this->attributes[$key] = $value;
        }
        
        return $this;
    }
    
    /**
     * Magic method for getting attributes
     * 
     * @param string $key
     * @return mixed
     */
    public function __get($key) {
        return $this->attributes[$key] ?? null;
    }
    
    /**
     * Magic method for setting attributes
     * 
     * @param string $key
     * @param mixed $value
     */
    public function __set($key, $value) {
        $this->attributes[$key] = $value;
    }
    
    /**
     * Find message by ID
     * 
     * @param int $id
     * @return Message|null
     */
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
    
    /**
     * Save the message to the database
     * 
     * @return bool
     */
    public function save() {
        $query = new Query();
        
        // If has ID, update; otherwise insert
        if (isset($this->attributes['id'])) {
            $id = $this->attributes['id'];
            unset($this->attributes['id']);
            
            // Update
            $result = $query->table(static::$table)
                    ->where('id', $id)
                    ->update($this->attributes);
            
            // Restore the ID after update
            $this->attributes['id'] = $id;
            
            return $result > 0;
        } else {
            // Insert
            $this->attributes['id'] = $query->table(static::$table)
                    ->insert($this->attributes);
            
            return $this->attributes['id'] > 0;
        }
    }
    
    /**
     * Delete the message
     * 
     * @return bool
     */
    public function delete() {
        $query = new Query();
        return $query->table(static::$table)
                ->where('id', $this->id)
                ->delete() > 0;
    }
    
    /**
     * Get messages for a specific channel
     * 
     * @param int $channelId Channel ID
     * @param int $limit Maximum number of messages to return
     * @param int $offset Offset for pagination
     * @return array
     */
    public static function getForChannel($channelId, $limit = 50, $offset = 0) {
        $query = new Query();
        
        // First check if channel_messages table exists
        $tableExists = $query->tableExists('channel_messages');
        if (!$tableExists) {
            // Create the channel_messages table
            self::createChannelMessagesTable();
        }
        
        // Check again if table creation was successful
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
    
    /**
     * Associate this message with a channel
     * 
     * @param int $channelId Channel ID
     * @return bool
     */
    public function associateWithChannel($channelId) {
        if (!$this->id) {
            return false;
        }
        
        $query = new Query();
        
        // First check if channel_messages table exists
        $tableExists = $query->tableExists('channel_messages');
        if (!$tableExists) {
            // Create the channel_messages table
            self::createChannelMessagesTable();
            
            // Check if creation succeeded
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
    
    /**
     * Create the channel_messages table if it doesn't exist
     * 
     * @return bool
     */
    public static function createChannelMessagesTable() {
        $query = new Query();
        
        try {
            // Execute table creation query
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
    
    /**
     * Get the user who sent this message
     * 
     * @return User|null
     */
    public function user() {
        if (!$this->user_id) {
            return null;
        }
        
        require_once __DIR__ . '/User.php';
        return User::find($this->user_id);
    }

    /**
     * Format the message time to a human-readable string
     * 
     * @return string
     */
    public function formattedTime() {
        if (empty($this->sent_at)) {
            return 'Just now';
        }
        
        $sentAt = new DateTime($this->sent_at);
        $now = new DateTime();
        
        $diff = $now->diff($sentAt);
        
        if ($diff->days == 0) {
            // Today
            return 'Today at ' . $sentAt->format('g:i A');
        } elseif ($diff->days == 1) {
            // Yesterday
            return 'Yesterday at ' . $sentAt->format('g:i A');
        } elseif ($diff->days < 7) {
            // This week
            return $sentAt->format('l') . ' at ' . $sentAt->format('g:i A');
        } else {
            // More than a week ago
            return $sentAt->format('M j, Y') . ' at ' . $sentAt->format('g:i A');
        }
    }
    
    /**
     * Create the messages table if it doesn't exist
     * 
     * @return bool Whether the table exists after creation attempt
     */
    public static function createTable() {
        $query = new Query();
        
        try {
            // Check if table exists first
            $tableExists = $query->tableExists(static::$table);
            
            if (!$tableExists) {
                // Execute table creation query
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
                
                // Check again if table exists after creation attempt
                $tableExists = $query->tableExists(static::$table);
            }
            
            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating messages table: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Ensure the table exists before any operations
     */
    public static function initialize() {
        $created = self::createTable();
        
        // Also ensure channel_messages table exists
        if ($created) {
            return self::createChannelMessagesTable();
        }
        
        return $created;
    }
    
    /**
     * Get all messages
     * 
     * @return array
     */
    public static function all() {
        $query = new Query();
        return $query->table(static::$table)->get();
    }
}
