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
                } catch (PDOException $e) {
                    // If we get an error related to the category_id foreign key
                    if (stripos($e->getMessage(), 'category_id') !== false) {
                        error_log("Creating channels table without category_id foreign key constraint");
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
                                FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
                            )
                        ");
                    } else {
                        // Re-throw if it's not a category_id issue
                        throw $e;
                    }
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
        $channels = $query->table('channels c')
            ->select('c.*, t.name as type_name')
            ->join('channel_types t', 'c.type', '=', 't.id')
            ->where('c.server_id', $serverId)
            ->get();
            
        return $channels;
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
}

