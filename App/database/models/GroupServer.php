<?php

require_once __DIR__ . '/Model.php';

class GroupServer extends Model {
    protected static $table = 'group_servers';
    protected $fillable = ['id', 'user_id', 'group_name', 'created_at', 'updated_at'];
    
    public static function findByUserId($userId) {
        $query = new Query();
        $results = $query->table(static::$table)
            ->where('user_id', $userId)
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
    
    public function owner() {
        require_once __DIR__ . '/User.php';
        return User::find($this->user_id);
    }
    
    public function servers() {
        require_once __DIR__ . '/Server.php';
        $query = new Query();
        $results = $query->table('servers')
            ->where('group_server_id', $this->id)
            ->get();
        return array_map(function($data) { return new Server($data); }, $results);
    }
    
    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('group_servers');

            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS group_servers (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        group_name VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )
                ");

                $tableExists = $query->tableExists('group_servers');
            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating group_servers table: " . $e->getMessage());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }
} 