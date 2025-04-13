<?php

require_once __DIR__ . '/../query.php';

class UserServerMembership {
    // Define the table name
    protected static $table = 'user_server_memberships';
    
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
     * Find membership by user ID and server ID
     * 
     * @param int $userId
     * @param int $serverId
     * @return UserServerMembership|null
     */
    public static function findByUserAndServer($userId, $serverId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->first();
            
        if (!$result) {
            return null;
        }
        
        return new static($result);
    }
    
    /**
     * Get all members of a server
     * 
     * @param int $serverId
     * @return array
     */
    public static function getServerMembers($serverId) {
        $query = new Query();
        $results = $query->table('users u')
            ->select('u.*, usm.role')
            ->join('user_server_memberships usm', 'u.id', '=', 'usm.user_id')
            ->where('usm.server_id', $serverId)
            ->get();
            
        return $results;
    }
    
    /**
     * Get count of members in a server
     * 
     * @param int $serverId
     * @return int
     */
    public static function getMemberCount($serverId) {
        $query = new Query();
        return $query->table(static::$table)
            ->where('server_id', $serverId)
            ->count();
    }
    
    /**
     * Create a new membership
     * 
     * @param int $userId
     * @param int $serverId
     * @param string $role
     * @return UserServerMembership
     */
    public static function create($userId, $serverId, $role = 'member') {
        $membership = new static([
            'user_id' => $userId,
            'server_id' => $serverId,
            'role' => $role,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        $membership->save();
        return $membership;
    }
    
    /**
     * Add owner to a server (special helper method)
     * 
     * @param int $userId
     * @param int $serverId
     * @return UserServerMembership
     */
    public static function addOwner($userId, $serverId) {
        return self::create($userId, $serverId, 'owner');
    }
    
    /**
     * Save the membership to the database
     * 
     * @return bool
     */
    public function save() {
        $query = new Query();
        
        // Set timestamps if not already set
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
     * Create the user_server_memberships table if it doesn't exist
     * 
     * @return bool Whether the table exists after creation attempt
     */
    public static function createTable() {
        $query = new Query();
        
        try {
            // Check if table exists first
            $tableExists = $query->tableExists('user_server_memberships');
            
            if (!$tableExists) {
                // Execute table creation query using the raw method
                $query->raw("
                    CREATE TABLE IF NOT EXISTS user_server_memberships (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        server_id INT NOT NULL,
                        role VARCHAR(255) DEFAULT 'member',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
                        UNIQUE KEY unique_user_server (user_id, server_id)
                    )
                ");
                
                // Check again if table exists after creation attempt
                $tableExists = $query->tableExists('user_server_memberships');
            }
            
            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating user_server_memberships table: " . $e->getMessage());
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
     * Delete a membership
     * 
     * @param int $userId
     * @param int $serverId
     * @return bool
     */
    public static function delete($userId, $serverId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->delete();
            
        return $result > 0;
    }
    
    /**
     * Check if a user is a member of a server
     * 
     * @param int $userId
     * @param int $serverId
     * @return bool
     */
    public static function isMember($userId, $serverId) {
        $query = new Query();
        return $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->exists();
    }
    
    /**
     * Update a user's role in a server
     * 
     * @param int $userId
     * @param int $serverId
     * @param string $role
     * @return bool
     */
    public static function updateRole($userId, $serverId, $role) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->update(['role' => $role]);
            
        return $result > 0;
    }
    
    /**
     * Check if a user is an owner of a server
     * 
     * @param int $userId
     * @param int $serverId
     * @return bool
     */
    public static function isOwner($userId, $serverId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->where('role', 'owner')
            ->exists();
            
        return $result;
    }
}
