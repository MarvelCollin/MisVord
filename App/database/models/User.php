<?php

require_once __DIR__ . '/Model.php';

class User extends Model {
    protected static $table = 'users';
    protected $fillable = ['username', 'email', 'password_hash', 'avatar_url', 'status', 'display_name', 'bio', 'google_id', 'google_avatar_url'];
    
    public static function findByEmail($email) {
        $query = new Query();
        $result = $query->table(static::$table)->where('email', $email)->first();
        return $result ? new static($result) : null;
    }

    public static function findByUsername($username) {
        $query = new Query();
        $result = $query->table(static::$table)->where('username', $username)->first();
        return $result ? new static($result) : null;
    }

    public static function findByGoogleId($googleId) {
        $query = new Query();
        $result = $query->table(static::$table)->where('google_id', $googleId)->first();
        return $result ? new static($result) : null;
    }

    public function verifyPassword($password) {
        return password_verify($password, $this->password_hash);
    }

    public function setPassword($password) {
        $this->password_hash = password_hash($password, PASSWORD_DEFAULT);
    }

    public function servers() {
        $query = new Query();
        return $query->table('servers s')
            ->join('user_server_memberships usm', 's.id', '=', 'usm.server_id')
            ->where('usm.user_id', $this->id)
            ->select('s.*')
            ->get();
    }

    public function roles() {
        $query = new Query();
        return $query->table('roles r')
            ->join('user_roles ur', 'r.id', '=', 'ur.role_id')
            ->where('ur.user_id', $this->id)
            ->select('r.*')
            ->get();
    }

    public function friends() {
        $query = new Query();
        
        $friends1 = $query->table('users u')
            ->join('friend_list fl', 'u.id', '=', 'fl.user_id2')
            ->where('fl.user_id', $this->id)
            ->where('fl.status', 'accepted')
            ->select('u.*')
            ->get();

        $query2 = new Query();
        $friends2 = $query2->table('users u')
            ->join('friend_list fl', 'u.id', '=', 'fl.user_id')
            ->where('fl.user_id2', $this->id)
            ->where('fl.status', 'accepted')
            ->select('u.*')
            ->get();

        return array_merge($friends1, $friends2);
    }

    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('users');

            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        username VARCHAR(255) UNIQUE NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password_hash VARCHAR(255),
                        avatar_url VARCHAR(500),
                        status ENUM('online', 'away', 'busy', 'offline') DEFAULT 'offline',
                        display_name VARCHAR(255),
                        bio TEXT,
                        google_id VARCHAR(255) UNIQUE NULL,
                        google_avatar_url VARCHAR(500) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX username_idx (username),
                        INDEX email_idx (email),
                        INDEX google_id_idx (google_id)
                    )
                ");

                $tableExists = $query->tableExists('users');
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
}