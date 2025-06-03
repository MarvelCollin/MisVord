<?php

require_once __DIR__ . '/../query.php';

class Category {
    protected static $table = 'categories';

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

    public static function getForServer($serverId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('server_id', $serverId)
            ->orderBy('position')
            ->get();

        return $result;
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