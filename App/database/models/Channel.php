<?php

require_once __DIR__ . '/../query.php';

class Channel {
    protected static $table = 'channels';
    
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
    
    public static function getForServer($serverId) {
        $query = new Query();
        return $query->table(static::$table)
                ->where('server_id', $serverId)
                ->orderBy('position')
                ->get();
    }
    
    public static function getForCategory($categoryId) {
        $query = new Query();
        return $query->table(static::$table)
                ->where('category_id', $categoryId)
                ->orderBy('position')
                ->get();
    }
    
    public function save() {
        $query = new Query();
        
        // Handle type field conversion if it's a string value
        if (isset($this->attributes['type']) && !is_numeric($this->attributes['type'])) {
            $typeValue = strtolower($this->attributes['type']);
            
            // Default mapping if we can't query the database
            $typeMap = [
                'text' => 1,
                'voice' => 2,
                'category' => 3,
                'announcement' => 4
            ];
            
            // Try to get actual type IDs from database
            try {
                $types = $query->table('channel_types')->get();
                if (!empty($types)) {
                    foreach ($types as $type) {
                        $typeMap[$type['name']] = $type['id'];
                    }
                }
            } catch (Exception $e) {
                error_log("Error fetching channel types: " . $e->getMessage());
            }
            
            // Set the correct type ID
            if (isset($typeMap[$typeValue])) {
                $this->attributes['type'] = $typeMap[$typeValue];
            } else {
                $this->attributes['type'] = 1; // Default to text (ID 1)
            }
        }
        
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
    
    public static function createTable() {
        $query = new Query();
        
        try {
            // First check if the channel_types table exists and create it if needed
            $channelTypesExists = $query->tableExists('channel_types');
            if (!$channelTypesExists) {
                error_log("channel_types table doesn't exist, creating it");
                $query->raw("
                    CREATE TABLE IF NOT EXISTS channel_types (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(50) NOT NULL,
                        description TEXT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ");
                
                // Insert basic channel types
                $types = [
                    ['name' => 'text', 'description' => 'Text channel for messages'],
                    ['name' => 'voice', 'description' => 'Voice chat channel'],
                    ['name' => 'category', 'description' => 'Category to group channels'],
                    ['name' => 'announcement', 'description' => 'Announcements channel']
                ];
                
                foreach ($types as $type) {
                    $query->table('channel_types')->insert($type);
                    error_log("Added channel type: " . $type['name']);
                }
                
                error_log("channel_types table created and populated");
            }
            
            $tableExists = $query->tableExists(static::$table);
            
            if (!$tableExists) {
                // First, check if the categories table exists
                $categoriesExists = $query->tableExists('categories');
                
                if (!$categoriesExists) {
                    // Create a basic categories table if it doesn't exist
                    error_log("Categories table doesn't exist, creating it first");
                    $query->raw("
                        CREATE TABLE IF NOT EXISTS categories (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            server_id INT NOT NULL,
                            position INT NOT NULL DEFAULT 0,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
                        )
                    ");
                }
                
                // Create channels table but handle the case where we need to disable foreign keys
                try {
                    $query->raw("
                        CREATE TABLE IF NOT EXISTS " . static::$table . " (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            type INT NOT NULL DEFAULT 1,
                            description TEXT NULL,
                            server_id INT NOT NULL,
                            category_id INT NULL,
                            parent_id INT NULL,
                            position INT NOT NULL DEFAULT 0,
                            is_private TINYINT(1) NOT NULL DEFAULT 0,
                            slug VARCHAR(255) NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
                            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                            FOREIGN KEY (parent_id) REFERENCES channels(id) ON DELETE SET NULL,
                            FOREIGN KEY (type) REFERENCES channel_types(id) ON DELETE RESTRICT
                        )
                    ");
                } catch (PDOException $e) {
                    // If we get an error related to foreign key constraints, try with less constraints
                    error_log("Error creating channels table with all constraints: " . $e->getMessage());
                    error_log("Creating channels table with minimal constraints");
                    $query->raw("
                        CREATE TABLE IF NOT EXISTS " . static::$table . " (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            type INT NOT NULL DEFAULT 1,
                            description TEXT NULL,
                            server_id INT NOT NULL,
                            category_id INT NULL,
                            parent_id INT NULL,
                            position INT NOT NULL DEFAULT 0,
                            is_private TINYINT(1) NOT NULL DEFAULT 0,
                            slug VARCHAR(255) NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
                        )
                    ");
                }
                
                $tableExists = $query->tableExists(static::$table);
            }
            
            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating channels table: " . $e->getMessage());
            return false;
        }
    }
    
    public static function initialize() {
        return self::createTable();
    }
    
    public static function all() {
        $query = new Query();
        return $query->table(static::$table)->get();
    }
    
    /**
     * Get channels for a server
     */
    public static function getServerChannels($serverId) {
        $query = new Query();
        error_log("Fetching channels for server ID: $serverId");
        
        try {
            // First check if the channel_types table exists
            $channel_types_exists = $query->tableExists('channel_types');
            
            if ($channel_types_exists) {
                // Use the join with channel_types if it exists
                $channels = $query->table('channels c')
                    ->select('c.*, t.name as type_name')
                    ->join('channel_types t', 'c.type', '=', 't.id')
                    ->where('c.server_id', $serverId)
                    ->get();
            } else {
                // If channel_types doesn't exist, use the type field directly
                $channels = $query->table('channels c')
                    ->select('c.*, c.type as type_name')
                    ->where('c.server_id', $serverId)
                    ->orderBy('c.position')
                    ->get();
                    
                error_log("Using direct type field instead of channel_types join");
            }
            
            // Process the channels to ensure type is always an integer
            foreach ($channels as &$channel) {
                if (isset($channel['type'])) {
                    // Force type to be an integer
                    $channel['type'] = intval($channel['type']);
                }
            }
            
            error_log("Found " . count($channels) . " channels for server ID: $serverId");
            return $channels;
        } catch (Exception $e) {
            error_log("Error fetching channels: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get messages for a channel
     */
    public static function getChannelMessages($channelId, $limit = 50) {
        $query = new Query();
        $messages = $query->table('messages m')
            ->select('m.*, u.username, u.avatar, u.status')
            ->join('users u', 'm.user_id', '=', 'u.id')
            ->where('m.channel_id', $channelId)
            ->orderBy('m.timestamp', 'DESC')
            ->limit($limit)
            ->get();
            
        return array_reverse($messages); // Return in chronological order
    }
    
    /**
     * Get minimal channel data for a server (faster, with less data)
     * 
     * @param int $serverId The server ID
     * @return array Array of minimal channel data
     */
    public static function getServerChannelsMinimal($serverId) {
        $query = new Query();
        try {
            // Only select essential fields for channel listing
            return $query->table(self::$table)
                ->select('id, name, type, category_id, is_private, server_id')
                ->where('server_id', $serverId)
                ->orderBy('name', 'ASC')
                ->get();
        } catch (Exception $e) {
            error_log("Error getting minimal channels for server: " . $e->getMessage());
            return [];
        }
    }
}

