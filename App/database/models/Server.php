<?php

require_once __DIR__ . '/../query.php';

class Server {
    // Define the table name
    protected static $table = 'servers';
    
    // Store attributes
    protected $attributes = [];
    
    /**
     */
    public function __construct($attributes = []) {
        $this->fill($attributes);
    }
    
    /**
     */
    public function fill($attributes) {
        foreach ($attributes as $key => $value) {
            $this->attributes[$key] = $value;
        }
        
        return $this;
    }
    
    /**
     */
    public function __get($key) {
        return $this->attributes[$key] ?? null;
    }
    
    /**
     */
    public function __set($key, $value) {
        $this->attributes[$key] = $value;
    }
    
    /**
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
     * Find a server by its invite link
     * 
     * @param string $inviteLink The invite link to search for
     * @return Server|null The server or null if not found
     */
    public static function findByInviteLink($inviteLink) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('invite_link', $inviteLink)
            ->first();
            
        if (!$result) {
            return null;
        }
        
        return new static($result);
    }
    
    /**
     * Find a server by its name
     * 
     * @param string $name The server name to search for
     * @return Server|null The server or null if not found
     */
    public static function findByName($name) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('name', $name)
            ->first();
            
        if (!$result) {
            return null;
        }
        
        return new static($result);
    }
    
    /**
     * Find server by name and server ID
     * 
     * @param string $name The server name to search for
     * @param int $serverId The server ID to filter by
     * @return Server|null The server or null if not found
     */
    public static function findByNameAndServer($name, $serverId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('name', $name)
            ->where('id', $serverId)
            ->first();
            
        if (!$result) {
            return null;
        }
        
        return new static($result);
    }
    
    /**
     */
    public static function getForUser($userId) {
        $query = new Query();
        $results = $query->table('servers s')
            ->select('s.*')
            ->join('user_server_memberships usm', 's.id', '=', 'usm.server_id')
            ->where('usm.user_id', $userId)
            ->get();
        
        $servers = [];
        foreach ($results as $result) {
            $servers[] = new static($result);
        }
        
        return $servers;
    }
    
    /**
     */
    public function members() {
        // Implementation
    }
    
    /**
     * Check if a user is a member of this server
     * 
     * @param int $userId The user ID to check
     * @return bool True if the user is a member, false otherwise
     */
    public function isMember($userId) {
        $query = new Query();
        $result = $query->table('user_server_memberships')
            ->where('user_id', $userId)
            ->where('server_id', $this->id)
            ->first();
            
        return $result !== null;
    }
    
    /**
     */
    public function channels() {
        $query = new Query();
        return $query->table('channels')
                ->where('server_id', $this->id)
                ->orderBy('type')
                ->orderBy('position')
                ->get();
    }
    
    /**
     * Get all categories for this server
     * 
     * @return array Array of category data
     */
    public function categories() {
        $query = new Query();
        return $query->table('categories')
            ->where('server_id', $this->id)
            ->orderBy('position')
            ->get();
    }
    
    /**
     */
    public function generateInviteLink() {
        // Generate a unique string for the invite link
        $uniqueString = bin2hex(random_bytes(5)); // 10 characters
        $this->invite_link = $uniqueString;
        $this->save();
        
        return $this->invite_link;
    }
    
    /**
     */
    public function save() {
        $query = new Query();
        
        // Set timestamps
        if (!isset($this->attributes['created_at'])) {
            $this->attributes['created_at'] = date('Y-m-d H:i:s');
        }
        $this->attributes['updated_at'] = date('Y-m-d H:i:s');
        
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
     */
    public function addMember($userId, $role = 'member') {
        $query = new Query();
        
        // Check if user is already a member
        $exists = $query->table('user_server_memberships')
                ->where('user_id', $userId)
                ->where('server_id', $this->id)
                ->exists();
        
        if ($exists) {
            return true; // User is already a member
        }
        
        // Add the user as a member
        $result = $query->table('user_server_memberships')
                ->insert([
                    'user_id' => $userId,
                    'server_id' => $this->id,
                    'role' => $role,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
        
        return $result > 0;
    }
    
    /**
     */
    public function removeMember($userId) {
        $query = new Query();
        
        $result = $query->table('user_server_memberships')
                ->where('user_id', $userId)
                ->where('server_id', $this->id)
                ->delete();
        
        return $result > 0;
    }
    
    /**
     */
    public static function createTable() {
        $query = new Query();
        
        try {
            // Check if table exists first
            $tableExists = $query->tableExists('servers');
            
            if (!$tableExists) {
                // Execute table creation query using the raw method
                $query->raw("
                    CREATE TABLE IF NOT EXISTS servers (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        image_url VARCHAR(255) NULL,
                        description TEXT NULL,
                        invite_link VARCHAR(255) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ");
                
                // Check if user_server_memberships table exists
                $membershipTableExists = $query->tableExists('user_server_memberships');
                
                if (!$membershipTableExists) {
                    // Create user_server_memberships table
                    $query->raw("
                        CREATE TABLE IF NOT EXISTS user_server_memberships (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            server_id INT NOT NULL,
                            role VARCHAR(50) NOT NULL DEFAULT 'member',
                            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            UNIQUE KEY `unique_membership` (`user_id`, `server_id`),
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
                        )
                    ");
                }
                
                // Check if channels table exists
                $channelsTableExists = $query->tableExists('channels');
                
                if (!$channelsTableExists) {
                    // Create channels table
                    $query->raw("
                        CREATE TABLE IF NOT EXISTS channels (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            server_id INT NOT NULL,
                            name VARCHAR(255) NOT NULL,
                            type ENUM('text', 'voice', 'category') NOT NULL DEFAULT 'text',
                            description TEXT NULL,
                            position INT NOT NULL DEFAULT 0,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
                        )
                    ");
                }
                
                // Check again if table exists after creation attempt
                $tableExists = $query->tableExists('servers');
            }
            
            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating servers table: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     */
    public static function initialize() {
        return self::createTable();
    }
    
    /**
     */
    public static function all() {
        $query = new Query();
        $results = $query->table(static::$table)->get();
        
        $servers = [];
        foreach ($results as $result) {
            $servers[] = new static($result);
        }
        
        return $servers;
    }
}
