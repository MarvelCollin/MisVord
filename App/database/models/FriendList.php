<?php

require_once __DIR__ . '/Model.php';

class FriendList extends Model {
    protected static $table = 'friend_list';
    protected $fillable = ['id', 'user_id', 'user_id2', 'status', 'created_at', 'updated_at'];
      public static function findRelationship($userId1, $userId2) {
        $query = new Query();
        
        $sql = "SELECT * FROM " . static::$table . " 
                WHERE (user_id = ? AND user_id2 = ?) 
                   OR (user_id = ? AND user_id2 = ?) 
                LIMIT 1";
        
        $result = $query->raw($sql, [$userId1, $userId2, $userId2, $userId1]);
        
        if ($result && count($result) > 0) {
            return new static($result[0]);
        }
        
        return null;
    }
      public static function getUserFriends($userId) {
        $query = new Query();
        $results = $query->table(static::$table . ' fl')
            ->join('users u', 'fl.user_id2', '=', 'u.id')
            ->where('fl.user_id', $userId)
            ->where('fl.status', 'accepted')
            ->where('u.status', '!=', 'bot')
            ->select('u.*, fl.id as friendship_id')
            ->get();
            
        $query2 = new Query();
        $results2 = $query2->table(static::$table . ' fl')
            ->join('users u', 'fl.user_id', '=', 'u.id')
            ->where('fl.user_id2', $userId)
            ->where('fl.status', 'accepted')
            ->where('u.status', '!=', 'bot')
            ->select('u.*, fl.id as friendship_id')
            ->get();
            
        return array_merge($results, $results2);
    }
    
    public static function getPendingRequests($userId) {
        $query = new Query();
        $results = $query->table(static::$table . ' fl')
            ->join('users u', 'fl.user_id', '=', 'u.id')
            ->where('fl.user_id2', $userId)
            ->where('fl.status', 'pending')
            ->where('u.status', '!=', 'bot')
            ->select('u.*, fl.id as friendship_id, fl.created_at as requested_at')
            ->get();
            
        return $results;
    }
    
    public static function getSentRequests($userId) {
        $query = new Query();
        $results = $query->table(static::$table . ' fl')
            ->join('users u', 'fl.user_id2', '=', 'u.id')
            ->where('fl.user_id', $userId)
            ->where('fl.status', 'pending')
            ->where('u.status', '!=', 'bot')
            ->select('u.*, fl.id as friendship_id, fl.created_at as requested_at')
            ->get();
            
        return $results;
    }
    
    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('friend_list');

            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS friend_list (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        user_id2 INT NOT NULL,
                        status ENUM('pending', 'accepted', 'blocked') NOT NULL DEFAULT 'pending',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_user_id (user_id),
                        INDEX idx_user_id2 (user_id2),
                        INDEX idx_status (status),
                        INDEX idx_user_pair (user_id, user_id2),
                        INDEX idx_user_status (user_id, status),
                        INDEX idx_user2_status (user_id2, status),
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (user_id2) REFERENCES users(id) ON DELETE CASCADE,
                        UNIQUE KEY unique_friendship (user_id, user_id2)
                    )
                ");

                $tableExists = $query->tableExists('friend_list');
            } else {
                $query->raw("
                    ALTER TABLE friend_list 
                    ADD INDEX IF NOT EXISTS idx_user_id (user_id),
                    ADD INDEX IF NOT EXISTS idx_user_id2 (user_id2),
                    ADD INDEX IF NOT EXISTS idx_status (status),
                    ADD INDEX IF NOT EXISTS idx_user_pair (user_id, user_id2),
                    ADD INDEX IF NOT EXISTS idx_user_status (user_id, status),
                    ADD INDEX IF NOT EXISTS idx_user2_status (user_id2, status)
                ");
            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating friend_list table: " . $e->getMessage());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }
} 


