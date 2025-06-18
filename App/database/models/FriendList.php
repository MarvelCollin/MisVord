<?php

require_once __DIR__ . '/Model.php';

class FriendList extends Model {
    protected static $table = 'friend_list';
    protected $fillable = ['user_id', 'user_id2', 'status'];
    
    public static function findRelationship($userId1, $userId2) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where(function($q) use ($userId1, $userId2) {
                $q->where('user_id', $userId1)->where('user_id2', $userId2);
            })
            ->orWhere(function($q) use ($userId1, $userId2) {
                $q->where('user_id', $userId2)->where('user_id2', $userId1);
            })
            ->first();
            
        return $result ? new static($result) : null;
    }
      public static function getUserFriends($userId) {
        $query = new Query();
        $results = $query->table(static::$table . ' fl')
            ->join('users u', 'fl.user_id2', '=', 'u.id')
            ->where('fl.user_id', $userId)
            ->where('fl.status', 'accepted')
            ->select('u.*, fl.id as friendship_id')
            ->get();
            
        $query2 = new Query();
        $results2 = $query2->table(static::$table . ' fl')
            ->join('users u', 'fl.user_id', '=', 'u.id')
            ->where('fl.user_id2', $userId)
            ->where('fl.status', 'accepted')
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
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (user_id2) REFERENCES users(id) ON DELETE CASCADE,
                        UNIQUE KEY unique_friendship (user_id, user_id2)
                    )
                ");

                $tableExists = $query->tableExists('friend_list');
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