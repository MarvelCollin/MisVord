<?php

require_once __DIR__ . '/Model.php';

class User extends Model {
    protected static $table = 'users';
    protected $fillable = ['id', 'username', 'discriminator', 'email', 'password', 'google_id', 'avatar_url', 'banner_url', 'status', 'display_name', 'bio', 'security_question', 'security_answer', 'created_at', 'updated_at', 'has_nitro', 'nitro_code', 'nitro_active', 'nitro_status'];
    
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
        
        if (!isset($this->attributes['password']) || empty($this->attributes['password'])) {
            error_log('Password verification failed: No password hash found for user');
            return false;
        }
        
        if (empty($password)) {
            error_log('Password verification failed: Empty password provided');
            return false;
        }
        
        
        $password = trim($password);
        
        
        $storedHash = $this->attributes['password'];
        
        
        $passwordVerified = password_verify($password, $storedHash);
        
        
        if (!$passwordVerified) {
            error_log('Password verification failed for user ID ' . ($this->id ?? 'unknown'));
            
            
            $hashInfo = password_get_info($storedHash);
            error_log('Hash info: ' . json_encode($hashInfo));
            
            
        }
        
        return $passwordVerified;
    }

    public function setPassword($password) {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $this->password = $hashedPassword;
        $this->attributes['password'] = $hashedPassword;
    }

    public function servers() {
        $query = new Query();
        return $query->table('servers s')
            ->join('user_server_memberships usm', 's.id', '=', 'usm.server_id')
            ->where('usm.user_id', $this->id)
            ->select('s.*')
            ->get();
    }



    public function friends() {
        $query = new Query();
        
        $friends1 = $query->table('users u')
            ->join('friend_list fl', 'u.id', '=', 'fl.user_id2')
            ->where('fl.user_id', $this->id)
            ->where('fl.status', 'accepted')
            ->where('u.status', '!=', 'bot')
            ->select('u.*')
            ->get();

        $query2 = new Query();
        $friends2 = $query2->table('users u')
            ->join('friend_list fl', 'u.id', '=', 'fl.user_id')
            ->where('fl.user_id2', $this->id)
            ->where('fl.status', 'accepted')
            ->where('u.status', '!=', 'bot')
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

    
    public function isBot() {
        return $this->status === 'bot';
    }
    
    
    public static function createBot($data) {
        $data['status'] = 'bot';
        
        if (!isset($data['discriminator'])) {
            $data['discriminator'] = self::generateDiscriminator();
        }
        
        if (!isset($data['display_name']) && isset($data['username'])) {
            $data['display_name'] = $data['username'];
        }
        
        $bot = new self($data);
        return $bot->save() ? $bot : null;
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
                        status VARCHAR(50) NULL DEFAULT 'active',
                        display_name VARCHAR(255),
                        bio TEXT,
                        google_id VARCHAR(255) UNIQUE NULL,
                        google_avatar_url VARCHAR(500) NULL,
                        security_question VARCHAR(255) NULL,
                        security_answer VARCHAR(255) NULL,
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


