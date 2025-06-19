<?php

require_once __DIR__ . '/Model.php';

class RolePermission extends Model {
    protected static $table = 'role_permissions';
    protected $fillable = ['role_id', 'channel_id', 'can_delete', 'can_manage', 'can_write', 'can_read', 'created_at', 'updated_at'];
    
    public static function getForRole($roleId) {
        $query = new Query();
        $results = $query->table(static::$table)
            ->where('role_id', $roleId)
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
    
    public static function getForChannel($channelId) {
        $query = new Query();
        $results = $query->table(static::$table)
            ->where('channel_id', $channelId)
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
    
    public function role() {
        require_once __DIR__ . '/Role.php';
        return Role::find($this->role_id);
    }
    
    public function channel() {
        require_once __DIR__ . '/Channel.php';
        return Channel::find($this->channel_id);
    }
    
    public function hasPermission($permission) {
        return isset($this->attributes[$permission]) && $this->attributes[$permission];
    }
    
    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('role_permissions');

            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS role_permissions (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        role_id INT NOT NULL,
                        channel_id INT NOT NULL,
                        can_read BOOLEAN DEFAULT false,
                        can_write BOOLEAN DEFAULT false,
                        can_manage BOOLEAN DEFAULT false,
                        can_delete BOOLEAN DEFAULT false,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
                    )
                ");

                $tableExists = $query->tableExists('role_permissions');
            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating role_permissions table: " . $e->getMessage());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }
} 


