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
    
    public function verifyCurrentPassword($userId, $password) {
        $user = $this->find($userId);
        if ($user && isset($user->password) && !empty($user->password)) {
            return password_verify($password, $user->password);
        }
        return false;
    }
    
    public function isSameAsCurrentPassword($userId, $newPassword) {
        $user = $this->find($userId);
        if ($user && isset($user->password) && !empty($user->password)) {
            return password_verify($newPassword, $user->password);
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
    
    
    public function countByStatus($status) {
        $query = new Query();
        $result = $query->table(User::getTable())
            ->where('status', $status)
            ->count();
            
        return $result;
    }
    
    
    public function countRecentUsers($days) {
        $query = new Query();
        $date = date('Y-m-d H:i:s', strtotime("-$days days"));
        
        $result = $query->table(User::getTable())
            ->where('created_at', '>=', $date)
            ->where('status', '!=', 'bot')
            ->count();
            
        return $result;
    }
    
    
    public function paginate($page = 1, $limit = 10, $status = 'all') {
        $offset = ($page - 1) * $limit;
        
        $query = new Query();
        $queryBuilder = $query->table(User::getTable())
            ->where('status', '!=', 'bot')
            ->where('email', '!=', 'admin@admin.com');
            
        if ($status !== 'all') {
            $queryBuilder->where('status', $status);
        }
        
        $results = $queryBuilder
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
    
    
    public function search($query, $page = 1, $limit = 10, $status = 'all') {
        $offset = ($page - 1) * $limit;
        
        $queryBuilder = new Query();
        $builder = $queryBuilder->table(User::getTable())
            ->select('id, username, discriminator, email, display_name, avatar_url, status, created_at')
            ->where(function($q) use ($query) {
                $q->whereLike('username', "%$query%")
                  ->orWhereLike('email', "%$query%")
                  ->orWhereLike('display_name', "%$query%");
            })
            ->where('status', '!=', 'bot')
            ->where('email', '!=', 'admin@admin.com');
            
        if ($status !== 'all') {
            $builder->where('status', $status);
        }
        
        $results = $builder
            ->orderBy('username', 'ASC')
            ->limit($limit)
            ->offset($offset)
            ->get();
            
        $users = [];
        foreach ($results as $result) {
            $users[] = new User($result);
        }
        
        return $users;
    }
    
    
    public function countSearch($query, $status = 'all') {
        $queryBuilder = new Query();
        $builder = $queryBuilder->table(User::getTable())
            ->where(function($q) use ($query) {
                $q->whereLike('username', "%$query%")
                  ->orWhereLike('email', "%$query%")
                  ->orWhereLike('display_name', "%$query%");
            })
            ->where('status', '!=', 'bot')
            ->where('email', '!=', 'admin@admin.com');
            
        if ($status !== 'all') {
            $builder->where('status', $status);
        }
        
        return $builder->count();
    }
    
    
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
    
    
    public function countActiveUsers($hours = 24) {
        $query = new Query();
        $date = date('Y-m-d H:i:s', strtotime("-$hours hours"));
        
        $result = $query->table(User::getTable())
            ->where('updated_at', '>=', $date)
            ->where('status', '!=', 'bot')
            ->count();
            
        return $result;
    }
    
    
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
    
    
    public function countBots() {
        $query = new Query();
        return $query->table(User::getTable())
            ->where('status', 'bot')
            ->count();
    }
    
    
    public function countRegularUsers($status = 'all') {
        $query = new Query();
        $builder = $query->table(User::getTable())
            ->where('status', '!=', 'bot')
            ->where('email', '!=', 'admin@admin.com');
            
        if ($status !== 'all') {
            $builder->where('status', $status);
        }
        
        return $builder->count();
    }
    
    
    public function createBot($data) {
        return User::createBot($data);
    }

    
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

    public function getMutualServers($userId1, $userId2)
    {        
        $query1 = new Query();
        $servers1 = $query1->table('user_server_memberships')
            ->where('user_id', $userId1)
            ->get();
        
        $serverIds1 = [];
        foreach ($servers1 as $server) {
            $serverIds1[] = $server['server_id'];
        }
        
        $query2 = new Query();
        $servers2 = $query2->table('user_server_memberships')
            ->where('user_id', $userId2)
            ->get();
        
        $serverIds2 = [];
        foreach ($servers2 as $server) {
            $serverIds2[] = $server['server_id'];
        }
        
        
        $mutualServerIds = array_intersect($serverIds1, $serverIds2);
        
        if (empty($mutualServerIds)) {
            return [];
        }
        
        
        $query3 = new Query();
        $servers = $query3->table('servers')
            ->whereIn('id', $mutualServerIds)
            ->get();
            
        
        $result = [];
        foreach ($servers as $server) {
            $serverObj = new \stdClass();
            $serverObj->id = $server['id'];
            $serverObj->name = $server['name'];
            $serverObj->icon_url = isset($server['icon_url']) && $server['icon_url'] !== null ? $server['icon_url'] : ($server['image_url'] ?? null);
            $serverObj->image_url = $server['image_url'] ?? $serverObj->icon_url;
            
            
            $query4 = new Query();
            $memberCount = $query4->table('user_server_memberships')
                ->where('server_id', $server['id'])
                ->count();
                
            $serverObj->member_count = $memberCount;
            
            $result[] = $serverObj;
        }
        
        return $result;
    }

    public function paginateWithNitroStatus($page = 1, $limit = 10, $status = 'all') {
        $offset = ($page - 1) * $limit;
        
        $query = new Query();
        $queryBuilder = $query->table(User::getTable() . ' u')
            ->select('u.id, u.username, u.discriminator, u.email, u.display_name, u.avatar_url, u.banner_url, u.bio, u.status, u.created_at, u.updated_at, CASE WHEN n.user_id IS NOT NULL THEN 1 ELSE 0 END as has_nitro, n.code as nitro_code')
            ->leftJoin('nitro n', 'u.id', '=', 'n.user_id')
            ->where('u.status', '!=', 'bot')
            ->where('u.email', '!=', 'admin@admin.com');
            
        if ($status !== 'all') {
            $queryBuilder->where('u.status', $status);
        }
        
        $results = $queryBuilder
            ->orderBy('u.created_at', 'DESC')
            ->limit($limit)
            ->offset($offset)
            ->get();
            
        $users = [];
        foreach ($results as $result) {
            $users[] = new User($result);
        }
        
        return $users;
    }

    public function searchWithNitroStatus($query, $page = 1, $limit = 10, $status = 'all') {
        $offset = ($page - 1) * $limit;
        
        $queryBuilder = new Query();
        $builder = $queryBuilder->table(User::getTable() . ' u')
            ->select('u.id, u.username, u.discriminator, u.email, u.display_name, u.avatar_url, u.status, u.created_at, u.updated_at, CASE WHEN n.user_id IS NOT NULL THEN 1 ELSE 0 END as has_nitro, n.code as nitro_code')
            ->leftJoin('nitro n', 'u.id', '=', 'n.user_id')
            ->where(function($q) use ($query) {
                $q->whereLike('u.username', "%$query%")
                  ->orWhereLike('u.email', "%$query%")
                  ->orWhereLike('u.display_name', "%$query%");
            })
            ->where('u.status', '!=', 'bot')
            ->where('u.email', '!=', 'admin@admin.com');
            
        if ($status !== 'all') {
            $builder->where('u.status', $status);
        }
        
        $results = $builder
            ->orderBy('u.username', 'ASC')
            ->limit($limit)
            ->offset($offset)
            ->get();
            
        $users = [];
        foreach ($results as $result) {
            $users[] = new User($result);
        }
        
        return $users;
    }

    public function searchWithNitroStatusRaw($query, $page = 1, $limit = 10, $status = 'all') {
        $offset = ($page - 1) * $limit;
        
        $queryBuilder = new Query();
        $builder = $queryBuilder->table(User::getTable() . ' u')
            ->select('u.id, u.username, u.discriminator, u.email, u.display_name, u.avatar_url, u.status, u.created_at, u.updated_at, CASE WHEN n.user_id IS NOT NULL THEN 1 ELSE 0 END as has_nitro, n.code as nitro_code')
            ->leftJoin('nitro n', 'u.id', '=', 'n.user_id')
            ->where(function($q) use ($query) {
                $q->whereLike('u.username', "%$query%")
                  ->orWhereLike('u.email', "%$query%")
                  ->orWhereLike('u.display_name', "%$query%");
            })
            ->where('u.status', '!=', 'bot')
            ->where('u.email', '!=', 'admin@admin.com');
            
        if ($status !== 'all') {
            $builder->where('u.status', $status);
        }
        
        return $builder
            ->orderBy('has_nitro', 'ASC')
            ->orderBy('u.username', 'ASC')
            ->limit($limit)
            ->offset($offset)
            ->get();
    }

    public function paginateWithNitroStatusRaw($page = 1, $limit = 10, $status = 'all') {
        $offset = ($page - 1) * $limit;
        
        $query = new Query();
        $queryBuilder = $query->table(User::getTable() . ' u')
            ->select('u.id, u.username, u.discriminator, u.email, u.display_name, u.avatar_url, u.banner_url, u.bio, u.status, u.created_at, u.updated_at, CASE WHEN n.user_id IS NOT NULL THEN 1 ELSE 0 END as has_nitro, n.code as nitro_code')
            ->leftJoin('nitro n', 'u.id', '=', 'n.user_id')
            ->where('u.status', '!=', 'bot')
            ->where('u.email', '!=', 'admin@admin.com');
            
        if ($status !== 'all') {
            $queryBuilder->where('u.status', $status);
        }
        
        return $queryBuilder
            ->orderBy('has_nitro', 'ASC')
            ->orderBy('u.username', 'ASC')
            ->limit($limit)
            ->offset($offset)
            ->get();
    }

    public function deleteUser($userId)
    {
        try {
            $query = new Query();
            
            $user = $this->find($userId);
            if (!$user) {
                error_log("DeleteUser failed: User $userId not found");
                return false;
            }
            
            error_log("Starting user deletion for user $userId - relying on foreign key constraints");
            $query->beginTransaction();
            
            error_log("Deleting user record for user $userId");
            $result = $query->table(User::getTable())->where('id', $userId)->delete();
            error_log("User table deletion result: $result rows affected");
            
            if ($result > 0) {
                $query->commit();
                error_log("User deletion transaction committed successfully for user $userId");
                
                if (!empty($user->avatar_url) && strpos($user->avatar_url, '/public/storage/') === 0) {
                    $avatarPath = dirname(__DIR__, 2) . $user->avatar_url;
                    if (file_exists($avatarPath) && is_file($avatarPath)) {
                        unlink($avatarPath);
                        error_log("Deleted avatar file: $avatarPath");
                    }
                }
                
                if (!empty($user->banner_url) && strpos($user->banner_url, '/public/storage/') === 0) {
                    $bannerPath = dirname(__DIR__, 2) . $user->banner_url;
                    if (file_exists($bannerPath) && is_file($bannerPath)) {
                        unlink($bannerPath);
                        error_log("Deleted banner file: $bannerPath");
                    }
                }
                
                return true;
            } else {
                $query->rollback();
                error_log("User deletion failed: No rows affected when deleting user $userId");
                return false;
            }
            
        } catch (Exception $e) {
            if (isset($query)) {
                $query->rollback();
            }
            error_log("UserRepository deleteUser error for user $userId: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            return false;
        }
    }
}
