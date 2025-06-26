<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../query.php';

class UserRepository extends Repository {
    protected function getModelClass() {
        return User::class;
    }
    
    public function findByEmail($email) {
        return User::findByEmail($email);
    }    public function findByUsername($username) {
        return User::findByUsername($username);
    }
      public function findByDisplayName($displayName) {
        return User::findByDisplayName($displayName);
    }
    
    public function findByUsernameAndDiscriminator($username, $discriminator) {
        return User::findByUsernameAndDiscriminator($username, $discriminator);
    }
    
    public function findByGoogleId($googleId) {
        return User::findByGoogleId($googleId);
    }
      public function createWithHashedPassword($data) {
        $password = null;
        if (isset($data['password'])) {
            $password = $data['password'];
            unset($data['password']); 
        }
        
        $user = new User($data);
        
        if ($password) {
            $user->setPassword($password);
        }
        
        return $user->save() ? $user : null;
    }
    
    public function updatePassword($userId, $newPassword) {
        $user = $this->find($userId);
        if ($user) {
            $user->setPassword($newPassword);
            return $user->save();
        }
        return false;
    }
    
    public function setSecurityQuestion($userId, $question, $answer) {
        $user = $this->find($userId);
        if ($user) {
            $user->security_question = $question;
            $user->security_answer = password_hash($answer, PASSWORD_DEFAULT);
            return $user->save();
        }
        return false;
    }
    
    public function verifySecurityAnswer($userId, $answer) {
        $user = $this->find($userId);
        if ($user && isset($user->security_answer) && !empty($user->security_answer)) {
            return password_verify($answer, $user->security_answer);
        }
        return false;
    }
    
    public function hasSecurityQuestion($userId) {
        $user = $this->find($userId);
        return $user && isset($user->security_question) && !empty($user->security_question);
    }
    
    public function getUserServers($userId) {
        $user = $this->find($userId);
        return $user ? $user->servers() : [];
    }
      public function getUserFriends($userId) {
        $user = $this->find($userId);
        return $user ? $user->friends() : [];
    }
    
    public function searchByUsername($query, $excludeUserId = null, $limit = 20) {
        $queryBuilder = new Query();
        $sql = $queryBuilder->table('users')
            ->where('username', 'LIKE', "%{$query}%")
            ->where('status', '!=', 'bot');
            
        if ($excludeUserId) {
            $sql->where('id', '!=', $excludeUserId);
        }
        
        $results = $sql->limit($limit)->get();
        
        $users = [];
        foreach ($results as $result) {
            $users[] = [
                'id' => $result['id'],
                'username' => $result['username'],
                'avatar_url' => $result['avatar_url'] ?? null
            ];
        }
        
        return $users;
    }
    
    public function createTable() {
        try {
            return User::createTable();
        } catch (Exception $e) {
            error_log("Error creating users table: " . $e->getMessage());
            return false;
        }
    }
    
    public function initialize() {
        try {
            return $this->createTable();
        } catch (Exception $e) {
            error_log("Error initializing user table: " . $e->getMessage());
            return false;
        }
    }
    
    public function getAllUserIds($limit = 10) {
        $query = new Query();
        $results = $query->table(User::getTable())
            ->select('id')
            ->limit($limit)
            ->get();
            
        return array_column($results, 'id');
    }
    
    /**
     * Count users by status
     * 
     * @param string $status The status to count (online, idle, etc.)
     * @return int Number of users with the given status
     */
    public function countByStatus($status) {
        $query = new Query();
        $result = $query->table(User::getTable())
            ->where('status', $status)
            ->count();
            
        return $result;
    }
    
    /**
     * Count users created in the last N days
     * 
     * @param int $days Number of days to look back
     * @return int Number of users created in that time period
     */
    public function countRecentUsers($days) {
        $query = new Query();
        $date = date('Y-m-d H:i:s', strtotime("-$days days"));
        
        $result = $query->table(User::getTable())
            ->where('created_at', '>=', $date)
            ->where('status', '!=', 'bot')
            ->count();
            
        return $result;
    }
    
    /**
     * Get paginated list of users for admin panel
     *
     * @param int $page Page number
     * @param int $limit Items per page
     * @return array List of users
     */
    public function paginate($page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;
        
        $query = new Query();
        $results = $query->table(User::getTable())
            ->where('status', '!=', 'bot')
            ->where('email', '!=', 'admin@admin.com')
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->offset($offset)
            ->get();
            
        $users = [];
        foreach ($results as $result) {
            $users[] = new User($result);
        }
        
        return $users;
    }
    
    /**
     * Search users by username or email for admin panel
     *
     * @param string $query Search query
     * @param int $page Page number
     * @param int $limit Items per page
     * @return array List of matching users
     */
    public function search($query, $page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;
        
        $queryBuilder = new Query();
        $results = $queryBuilder->table(User::getTable())
            ->where(function($q) use ($query) {
                $q->whereLike('username', "%$query%")
                  ->orWhereLike('email', "%$query%")
                  ->orWhereLike('display_name', "%$query%");
            })
            ->where('status', '!=', 'bot')
            ->where('email', '!=', 'admin@admin.com')
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->offset($offset)
            ->get();
            
        $users = [];
        foreach ($results as $result) {
            $users[] = new User($result);
        }
        
        return $users;
    }
    
    /**
     * Count users matching a search query
     *
     * @param string $query Search query
     * @return int Number of matching users
     */
    public function countSearch($query) {
        $queryBuilder = new Query();
        return $queryBuilder->table(User::getTable())
            ->where(function($q) use ($query) {
                $q->whereLike('username', "%$query%")
                  ->orWhereLike('email', "%$query%")
                  ->orWhereLike('display_name', "%$query%");
            })
            ->where('status', '!=', 'bot')
            ->where('email', '!=', 'admin@admin.com')
            ->count();
    }
    
    /**
     * Get user registration statistics by day for the last n days
     *
     * @param int $days Number of days to look back
     * @return array Daily user registration stats
     */
    public function getRegistrationStatsByDay($days = 7) {
        $stats = [];
        $query = new Query();
        
        
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $stats[$date] = 0;
        }
        
        
        $startDate = date('Y-m-d', strtotime("-" . ($days - 1) . " days"));
        $results = $query->query(
            "SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM users 
             WHERE DATE(created_at) >= ? 
             GROUP BY DATE(created_at)
             ORDER BY date ASC",
            [$startDate]
        );
        
        
        foreach ($results as $row) {
            if (isset($stats[$row['date']])) {
                $stats[$row['date']] = (int)$row['count'];
            }
        }
        
        return $stats;
    }
    
    /**
     * Get user registration statistics by week for the last n weeks
     *
     * @param int $weeks Number of weeks to look back
     * @return array Weekly user registration stats
     */
    public function getRegistrationStatsByWeek($weeks = 4) {
        $stats = [];
        $query = new Query();
        
        
        for ($i = $weeks - 1; $i >= 0; $i--) {
            $weekStart = date('Y-m-d', strtotime("-$i weeks", strtotime('monday this week')));
            $weekEnd = date('Y-m-d', strtotime("+6 days", strtotime($weekStart)));
            $weekLabel = $weekStart . ' to ' . $weekEnd;
            $stats[$weekLabel] = 0;
        }
        
        
        $startDate = date('Y-m-d', strtotime("-" . ($weeks - 1) . " weeks", strtotime('monday this week')));
        $results = $query->query(
            "SELECT 
                CONCAT(
                    DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY)),
                    ' to ',
                    DATE(DATE_ADD(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY), INTERVAL 6 DAY))
                ) as week_range,
                COUNT(*) as count 
             FROM users 
             WHERE DATE(created_at) >= ? 
             GROUP BY week_range
             ORDER BY MIN(created_at) ASC",
            [$startDate]
        );
        
        
        foreach ($results as $row) {
            if (isset($stats[$row['week_range']])) {
                $stats[$row['week_range']] = (int)$row['count'];
            }
        }
        
        return $stats;
    }
    
    /**
     * Count users who have been active in the last n hours
     *
     * @param int $hours Number of hours to look back
     * @return int Number of active users
     */
    public function countActiveUsers($hours = 24) {
        $query = new Query();
        $date = date('Y-m-d H:i:s', strtotime("-$hours hours"));
        
        $result = $query->table(User::getTable())
            ->where('updated_at', '>=', $date)
            ->where('status', '!=', 'bot')
            ->count();
            
        return $result;
    }
    
    /**
     * Get all bots
     *
     * @param int $limit Maximum number of bots to return
     * @return array List of bot users
     */
    public function getBots($limit = 50) {
        $query = new Query();
        $results = $query->table(User::getTable())
            ->where('status', 'bot')
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->get();
            
        $bots = [];
        foreach ($results as $result) {
            $bots[] = new User($result);
        }
        
        return $bots;
    }
    
    /**
     * Count total number of bots
     *
     * @return int Number of bots
     */
    public function countBots() {
        $query = new Query();
        return $query->table(User::getTable())
            ->where('status', 'bot')
            ->count();
    }
    
    /**
     * Count total regular users (excluding bots)
     *
     * @return int Number of regular users
     */
    public function countRegularUsers() {
        $query = new Query();
        return $query->table(User::getTable())
            ->where('status', '!=', 'bot')
            ->where('email', '!=', 'admin@admin.com')
            ->count();
    }
    
    /**
     * Create a new bot user
     *
     * @param array $data Bot user data (username, email, etc.)
     * @return User|null Created bot user or null on failure
     */
    public function createBot($data) {
        return User::createBot($data);
    }

    /**
     * Update a user record
     *
     * @param int $id User ID
     * @param array $data Data to update
     * @return bool Success status
     */
    public function update($id, $data) {
        try {
            $query = new Query();
            $result = $query->table(User::getTable())
                ->where('id', $id)
                ->update($data);
            
            return $result > 0;
        } catch (Exception $e) {
            error_log("UserRepository update error: " . $e->getMessage());
            return false;
        }
    }
}
