<?php

require_once __DIR__ . '/Model.php';

class Role extends Model {
    protected static $table = 'roles';
    protected $fillable = ['server_id', 'role_name', 'role_color', 'created_at', 'updated_at'];
    
    public static function getForServer($serverId) {
        $query = new Query();
        $results = $query->table(static::$table)
            ->where('server_id', $serverId)
            ->orderBy('role_name')
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
    
    public function users() {
        require_once __DIR__ . '/User.php';
        $query = new Query();
        $results = $query->table('users u')
            ->join('user_roles ur', 'u.id', '=', 'ur.user_id')
            ->where('ur.role_id', $this->id)
            ->select('u.*')
            ->get();
        return array_map(function($data) { return new User($data); }, $results);
    }
    
    public function permissions() {
        require_once __DIR__ . '/RolePermission.php';
        $query = new Query();
        $results = $query->table('role_permissions')
            ->where('role_id', $this->id)
            ->get();
        return array_map(function($data) { return new RolePermission($data); }, $results);
    }
    
    public function server() {
        require_once __DIR__ . '/Server.php';
        return Server::find($this->server_id);
    }
    
    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('roles');

            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS roles (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        server_id INT NOT NULL,
                        role_name VARCHAR(255) NOT NULL,
                        role_color VARCHAR(255) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
                    )
                ");

                $tableExists = $query->tableExists('roles');
            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating roles table: " . $e->getMessage());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }
} 


