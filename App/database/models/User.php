<?php

require_once __DIR__ . '/Model.php';

class User extends Model {
    protected static $table = 'users';
    protected $fillable = ['id', 'username', 'discriminator', 'email', 'password', 'google_id', 'avatar_url', 'banner_url', 'status', 'created_at', 'updated_at'];
    
    public static function findByEmail($email) {
        $query = new Query();
        $result = $query->table(static::$table)->where('email', $email)->first();
        return $result ? new static($result) : null;
    }

    public static function findByUsername($username) {
        $query = new Query();
        $result = $query->table(static::$table)->where('username', $username)->first();
        return $result ? new static($result) : null;
    }    public static function findByGoogleId($googleId) {
        $query = new Query();
        $result = $query->table(static::$table)->where('google_id', $googleId)->first();
        return $result ? new static($result) : null;
    }

    public static function findByUsernameAndDiscriminator($username, $discriminator) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('username', $username)
            ->where('discriminator', $discriminator)
            ->first();
        return $result ? new static($result) : null;
    }

    public static function findByDisplayName($displayName) {
        if (strpos($displayName, '#') === false) {
            return static::findByUsername($displayName);
        }
        
        $parts = explode('#', $displayName, 2);
        if (count($parts) !== 2) {
            return null;
        }
        
        $username = trim($parts[0]);
        $discriminator = trim($parts[1]);
        
        if (!preg_match('/^\d{4}$/', $discriminator)) {
            return null;
        }
        
        return static::findByUsernameAndDiscriminator($username, $discriminator);
    }

    public function verifyPassword($password) {
        if (function_exists('logger')) {
            logger()->debug("verifyPassword called", [
                'has_password_in_db' => isset($this->attributes['password']) && !empty($this->attributes['password']),
                'password_hash_from_db' => isset($this->attributes['password']) ? substr($this->attributes['password'], 0, 20) . '...' : 'null',
                'input_password' => $password
            ]);
        }
        
        if (!isset($this->attributes['password']) || $this->attributes['password'] === null || $this->attributes['password'] === '') {
            if (function_exists('logger')) {
                logger()->warning("No password set in database for user");
            }
            return false;
        }
        
        $result = password_verify($password, $this->attributes['password']);
        
        if (function_exists('logger')) {
            logger()->debug("Password verification result", [
                'result' => $result ? 'success' : 'failed'
            ]);
        }
        
        return $result;
    }public function setPassword($password) {
        $this->password = password_hash($password, PASSWORD_DEFAULT);
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
    
    public function getDisplayName() {
        return $this->username . '#' . $this->discriminator;
    }
    
    public static function generateDiscriminator() {
        return str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('users');

            if (!$tableExists) {                $query->raw("
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        username VARCHAR(255) NOT NULL,
                        discriminator VARCHAR(4) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password VARCHAR(255),
                        avatar_url VARCHAR(500),
                        banner_url VARCHAR(500),
                        status ENUM('appear', 'invisible', 'do_not_disturb', 'offline', 'banned') DEFAULT 'offline',
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


