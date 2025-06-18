<?php

require_once __DIR__ . '/Model.php';

class Category extends Model {
    protected static $table = 'categories';
    protected $fillable = ['name', 'server_id', 'position'];    
    public static function getForServer($serverId) {
        return static::where('server_id', $serverId)->orderBy('position')->get();
    }

    public static function getMaxPositionForServer($serverId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->select('MAX(position) as max_position')
            ->where('server_id', $serverId)
            ->first();

        return $result ? (int)$result['max_position'] : 0;
    }

    public function channels() {
        require_once __DIR__ . '/Channel.php';
        return Channel::getForCategory($this->id);
    }

    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('categories');

            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS categories (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        server_id INT NOT NULL,
                        position INT NOT NULL DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX server_idx (server_id),
                        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
                    )
                ");

                $tableExists = $query->tableExists('categories');
            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating categories table: " . $e->getMessage());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }
}