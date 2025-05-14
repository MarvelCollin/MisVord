<?php

require_once __DIR__ . '/../query.php';

class UserServerMembership {
    protected static $table = 'user_server_memberships';
    
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
    
    public static function getServerMembers($serverId) {
        $query = new Query();
        $results = $query->table('users u')
            ->select('u.*, usm.role')
            ->join('user_server_memberships usm', 'u.id', '=', 'usm.user_id')
            ->where('usm.server_id', $serverId)
            ->get();
            
        return $results;
    }
    
    public static function getMemberCount($serverId) {
        $query = new Query();
        return $query->table(static::$table)
            ->where('server_id', $serverId)
            ->count();
    }
    
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
    
    public static function addOwner($userId, $serverId) {
        return self::create($userId, $serverId, 'owner');
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
    
    public static function createTable() {
        $query = new Query();
        
        try {
            $tableExists = $query->tableExists('user_server_memberships');
            
            if (!$tableExists) {
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
                
                $tableExists = $query->tableExists('user_server_memberships');
            }
            
            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating user_server_memberships table: " . $e->getMessage());
            return false;
        }
    }
    
    public static function initialize() {
        return self::createTable();
    }
    
    public static function delete($userId, $serverId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->delete();
            
        return $result > 0;
    }
    
    public static function isMember($userId, $serverId) {
        $query = new Query();
        return $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->exists();
    }
    
    public static function updateRole($userId, $serverId, $role) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->update(['role' => $role]);
            
        return $result > 0;
    }
    
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

