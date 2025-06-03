<?php

require_once __DIR__ . '/../query.php';

class User {
    protected static $table = 'users';

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

    public static function findByEmail($email) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('email', $email)
            ->first();

        if (!$result) {
            return null;
        }

        return new static($result);
    }

    public static function findByUsername($username) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('username', $username)
            ->first();

        if (!$result) {
            return null;
        }

        return new static($result);
    }

    public static function findByGoogleId($googleId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('google_id', $googleId)
            ->first();

        if (!$result) {
            return null;
        }

        return new static($result);
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

    public function verifyPassword($password) {
        return password_verify($password, $this->password);
    }

    public function setPassword($password) {
        $this->attributes['password'] = password_hash($password, PASSWORD_DEFAULT);
    }

    public function servers() {
        $query = new Query();
        return $query->table('servers s')
                ->select('s.*')
                ->join('user_server_memberships usm', 's.id', '=', 'usm.server_id')
                ->where('usm.user_id', $this->id)
                ->get();
    }

    public function roles() {
        $query = new Query();
        return $query->table('roles r')
                ->select('r.*')
                ->join('user_roles ur', 'r.id', '=', 'ur.role_id')
                ->where('ur.user_id', $this->id)
                ->get();
    }

    public function friends() {
        $query = new Query();

        $result = $query->table('users u')
                ->select('u.*')
                ->join('friend_list fl', 'u.id', '=', 'fl.user_id2')
                ->where('fl.user_id', $this->id)
                ->where('fl.status', 'accepted')
                ->get();

        $query2 = new Query();
        $result2 = $query2->table('users u')
                ->select('u.*')
                ->join('friend_list fl', 'u.id', '=', 'fl.user_id')
                ->where('fl.user_id2', $this->id)
                ->where('fl.status', 'accepted')
                ->get();

        return array_merge($result, $result2);
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

    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('users');

            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        username VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL UNIQUE,
                        password VARCHAR(255),
                        google_id VARCHAR(255) NULL,
                        avatar_url VARCHAR(255) NULL,
                        status ENUM('online', 'away', 'offline', 'dnd') DEFAULT 'offline',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ");

                $tableExists = $query->tableExists('users');
            } else {
                $columnsExist = $query->raw("SHOW COLUMNS FROM `users` LIKE 'google_id'");
                if (empty($columnsExist)) {
                    $query->raw("ALTER TABLE `users` ADD COLUMN `google_id` VARCHAR(255) NULL AFTER `password`");
                }

                $columnsExist = $query->raw("SHOW COLUMNS FROM `users` LIKE 'avatar_url'");
                if (empty($columnsExist)) {
                    $query->raw("ALTER TABLE `users` ADD COLUMN `avatar_url` VARCHAR(255) NULL AFTER `google_id`");
                }
            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating users table: " . $e->getMessage());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }

    public static function all() {
        $query = new Query();
        $results = $query->table(static::$table)->get();

        $users = [];
        foreach ($results as $result) {
            $users[] = new static($result);
        }

        return $users;
    }
}