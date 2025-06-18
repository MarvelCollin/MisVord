<?php

require_once __DIR__ . '/Model.php';

class UserPresence extends Model {
    protected static $table = 'user_presence';
    protected $fillable = ['user_id', 'status', 'activity_details', 'last_seen'];
    
    public static function findByUserId($userId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('user_id', $userId)
            ->first();
        return $result ? new static($result) : null;
    }
    
    public function user() {
        require_once __DIR__ . '/User.php';
        return User::find($this->user_id);
    }
    
    public function isOnline() {
        return $this->status === 'online';
    }
    
    public function isAway() {
        return $this->status === 'away';
    }
    
    public function isDnd() {
        return $this->status === 'dnd';
    }
    
    public function isOffline() {
        return $this->status === 'offline';
    }
    
    public function getLastActivityTime() {
        return $this->last_seen ? strtotime($this->last_seen) : 0;
    }
    
    public function getFormattedLastSeen() {
        if (!$this->last_seen) {
            return 'Never';
        }
        
        $lastSeen = new DateTime($this->last_seen);
        $now = new DateTime();
        $diff = $now->diff($lastSeen);
        
        if ($diff->d > 0) {
            return $diff->d . ' day' . ($diff->d > 1 ? 's' : '') . ' ago';
        }
        
        if ($diff->h > 0) {
            return $diff->h . ' hour' . ($diff->h > 1 ? 's' : '') . ' ago';
        }
        
        if ($diff->i > 0) {
            return $diff->i . ' minute' . ($diff->i > 1 ? 's' : '') . ' ago';
        }
        
        return 'Just now';
    }
    
    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('user_presence');

            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS user_presence (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        status VARCHAR(20) DEFAULT 'offline',
                        activity_details VARCHAR(255) NULL,
                        last_seen TIMESTAMP NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        UNIQUE KEY unique_user_presence (user_id)
                    )
                ");

                $tableExists = $query->tableExists('user_presence');
            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating user_presence table: " . $e->getMessage());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }
} 