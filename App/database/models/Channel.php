<?php

require_once __DIR__ . '/../query.php';

class Channel {
    // Define the table name
    protected static $table = 'channels';
    
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
     * Find channel by ID
     * 
     * @param int $id
     * @return Channel|null
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
     * Find channel by name and server ID
     * 
     * @param string $name The channel name to search for
     * @param int $serverId The server ID to filter by
     * @return Channel|null The channel or null if not found
     */
    public static function findByNameAndServer($name, $serverId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('name', $name)
            ->where('server_id', $serverId)
            ->first();
            
        if (!$result) {
            return null;
        }
        
        return new static($result);
    }
    
    /**
     * Get channels for a specific server
     * 
     * @param int $serverId Server ID
     * @return array
     */
    public static function getForServer($serverId) {
        $query = new Query();
        return $query->table(static::$table)
                ->where('server_id', $serverId)
                ->orderBy('position')
                ->get();
    }
    
    /**
     * Get channels for a specific category
     * 
     * @param int $categoryId Category ID
     * @return array
     */
    public static function getForCategory($categoryId) {
        $query = new Query();
        return $query->table(static::$table)
                ->where('category_id', $categoryId)
                ->orderBy('position')
                ->get();
    }
    
    /**
     * Save the channel to the database
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
     * Delete the channel
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
     * Get messages for this channel
     * 
     * @param int $limit Maximum number of messages to return
     * @param int $offset Offset for pagination
     * @return array
     */
    public function messages($limit = 50, $offset = 0) {
        $query = new Query();
        return $query->table('messages m')
                ->select('m.*, u.username, u.avatar_url')
                ->join('channel_messages cm', 'm.id', '=', 'cm.message_id')
                ->join('users u', 'm.user_id', '=', 'u.id')
                ->where('cm.channel_id', $this->id)
                ->orderBy('m.sent_at', 'DESC')
                ->limit($limit)
                ->offset($offset)
                ->get();
    }
    
    /**
     * Create the channels table if it doesn't exist
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
                        name VARCHAR(255) NOT NULL,
                        type VARCHAR(20) NOT NULL DEFAULT 'text',
                        description TEXT NULL,
                        server_id INT NOT NULL,
                        category_id INT NULL,
                        position INT NOT NULL DEFAULT 0,
                        is_private TINYINT(1) NOT NULL DEFAULT 0,
                        slug VARCHAR(255) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
                        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
                    )
                ");
                
                // Check again if table exists after creation attempt
                $tableExists = $query->tableExists(static::$table);
            }
            
            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating channels table: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Ensure the table exists before any operations
     */
    public static function initialize() {
        return self::createTable();
    }
    
    /**
     * Get all channels
     * 
     * @return array
     */
    public static function all() {
        $query = new Query();
        return $query->table(static::$table)->get();
    }
}
