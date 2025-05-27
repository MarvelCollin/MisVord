<?php

require_once __DIR__ . '/../query.php';

class Server {
    protected static $table = 'servers';
    
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
    
    public function members() {
        $query = new Query();
        return $query->table('users u')
                ->select('u.*, usm.role')
                ->join('user_server_memberships usm', 'u.id', '=', 'usm.user_id')
                ->where('usm.server_id', $this->id)
                ->get();
    }
    
    public function isMember($userId) {
        $query = new Query();
        $result = $query->table('user_server_memberships')
            ->where('user_id', $userId)
            ->where('server_id', $this->id)
            ->first();
            
        return $result !== null;
    }
    
    public function channels() {
        $query = new Query();
        return $query->table('channels')
                ->where('server_id', $this->id)
                ->orderBy('type')
                ->orderBy('position')
                ->get();
    }
    
    public function categories() {
        $query = new Query();
        return $query->table('categories')
            ->where('server_id', $this->id)
            ->orderBy('position')
            ->get();
    }
    
    public function generateInviteLink() {
        // Generate random string for invite link - using alphanumeric characters only
        // This avoids integer conversion issues
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $uniqueString = '';
        for ($i = 0; $i < 10; $i++) {
            $uniqueString .= $characters[rand(0, strlen($characters) - 1)];
        }
        
        // Make sure it's stored and treated as a string
        $this->invite_link = (string)$uniqueString;
        $this->save();
        
        return $this->invite_link;
    }
    
    public function save() {
        $query = new Query();
        
        if (!isset($this->attributes['created_at'])) {
            $this->attributes['created_at'] = date('Y-m-d H:i:s');
        }
        $this->attributes['updated_at'] = date('Y-m-d H:i:s');
        
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
    
    public function addMember($userId, $role = 'member') {
        $query = new Query();
        
        $exists = $query->table('user_server_memberships')
                ->where('user_id', $userId)
                ->where('server_id', $this->id)
                ->exists();
        
        if ($exists) {
            return true; 
        }
        
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
    
    public function removeMember($userId) {
        $query = new Query();
        
        $result = $query->table('user_server_memberships')
                ->where('user_id', $userId)
                ->where('server_id', $this->id)
                ->delete();
        
        return $result > 0;
    }
    
    public static function createTable() {
        $query = new Query();
        
        try {
            $tableExists = $query->tableExists('servers');
            
            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS servers (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        image_url VARCHAR(255) NULL,
                        description TEXT NULL,
                        invite_link VARCHAR(255) NULL,
                        is_public BOOLEAN DEFAULT 0,
                        banner_url VARCHAR(255) NULL,
                        category VARCHAR(255) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ");
                
                $membershipTableExists = $query->tableExists('user_server_memberships');
                
                if (!$membershipTableExists) {
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
                
                $channelsTableExists = $query->tableExists('channels');
                
                if (!$channelsTableExists) {
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
                
                $tableExists = $query->tableExists('servers');
            }
            
            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating servers table: " . $e->getMessage());
            return false;
        }
    }
    
    public static function initialize() {
        return self::createTable();
    }
    
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

