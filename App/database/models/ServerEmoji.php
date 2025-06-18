<?php

require_once __DIR__ . '/Model.php';

class ServerEmoji extends Model {
    protected static $table = 'server_emojis';
    protected $fillable = ['id', 'server_id', 'name', 'image_url', 'is_animated', 'created_by_user_id', 'created_at', 'updated_at'];
    
    public static function getForServer($serverId) {
        $query = new Query();
        $results = $query->table(static::$table)
            ->where('server_id', $serverId)
            ->orderBy('name')
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
    
    public static function findByName($serverId, $name) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('server_id', $serverId)
            ->where('name', $name)
            ->first();
        return $result ? new static($result) : null;
    }
    
    public function server() {
        require_once __DIR__ . '/Server.php';
        return Server::find($this->server_id);
    }
    
    public function creator() {
        require_once __DIR__ . '/User.php';
        return User::find($this->created_by_user_id);
    }
    
    public function usageCount() {
        $query = new Query();
        $result = $query->table('emoji_usage')
            ->where('server_emoji_id', $this->id)
            ->sum('count');
        return $result ? $result : 0;
    }
    
    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('server_emojis');

            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS server_emojis (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        server_id INT NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        image_url VARCHAR(255) NOT NULL,
                        is_animated BOOLEAN DEFAULT FALSE,
                        created_by_user_id INT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
                        FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
                        UNIQUE KEY unique_server_emoji (server_id, name)
                    )
                ");

                $tableExists = $query->tableExists('server_emojis');
            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating server_emojis table: " . $e->getMessage());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }
} 