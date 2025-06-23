<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/Server.php';
require_once __DIR__ . '/../query.php';

class ServerRepository extends Repository {
    protected function getModelClass() {
        return Server::class;
    }
    
    public function findByInviteLink($inviteLink) {
        return Server::findByInviteLink($inviteLink);
    }
      public function findByName($name) {
        return $this->findBy('name', $name);
    }
    
    public function getForUser($userId) {
        $query = new Query();
        $results = $query->table('servers s')
            ->join('user_server_memberships usm', 's.id', '=', 'usm.server_id')
            ->where('usm.user_id', $userId)
            ->select('s.*')
            ->get();
        
        return $results;
    }
    
    public function getFormattedServersForUser($userId) {
        return $this->getForUser($userId);
    }
      public function createWithOwner($data, $ownerId) {
        $server = $this->create($data);
        
        if ($server && $server->id) {
            $this->addMemberWithRole($server->id, $ownerId, 'owner');
            return $server;
        }
        
        return null;
    }
      public function addMember($serverId, $userId, $role = 'member') {
        return $this->addMemberWithRole($serverId, $userId, $role);
    }
    
    public function addMemberWithRole($serverId, $userId, $role = 'member') {
        $query = new Query();
        return $query->table('user_server_memberships')->insert([
            'user_id' => $userId,
            'server_id' => $serverId,
            'role' => $role,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    public function removeMember($serverId, $userId) {
        $query = new Query();
        return $query->table('user_server_memberships')
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->delete();
    }
    
    public function isMember($serverId, $userId) {
        $server = $this->find($serverId);
        return $server ? $server->isMember($userId) : false;
    }
    
    public function generateInviteLink($serverId) {
        $server = $this->find($serverId);
        return $server ? $server->generateInviteLink() : false;
    }
      public function getPublicServersWithMemberCount() {
        $query = new Query();
        $results = $query->table('servers s')
            ->select('s.*, COUNT(usm.id) as member_count')
            ->leftJoin('user_server_memberships usm', 's.id', '=', 'usm.server_id')
            ->where('s.is_public', 1)
            ->groupBy('s.id')
            ->orderBy('member_count', 'DESC')
            ->get();
        
        return array_map(function($row) {
            return is_array($row) ? $row : (array) $row;
        }, $results);
    }
      public function getFeaturedServersWithMemberCount($limit = 3) {
        $query = new Query();
        $results = $query->table('servers s')
            ->select('s.*, COUNT(usm.id) as member_count')
            ->leftJoin('user_server_memberships usm', 's.id', '=', 'usm.server_id')
            ->where('s.is_public', 1)
            ->groupBy('s.id')
            ->orderBy('member_count', 'DESC')
            ->limit($limit)
            ->get();
            
        return array_map(function($row) {
            return is_array($row) ? $row : (array) $row;
        }, $results);
    }
      public function getServersByCategoryWithMemberCount($category) {
        $query = new Query();
        $results = $query->table('servers s')
            ->select('s.*, COUNT(usm.id) as member_count')
            ->leftJoin('user_server_memberships usm', 's.id', '=', 'usm.server_id')
            ->where('s.is_public', 1)
            ->where('s.category', $category)
            ->groupBy('s.id')
            ->orderBy('member_count', 'DESC')
            ->get();
            
        return array_map(function($row) {
            return is_array($row) ? $row : (array) $row;
        }, $results);
    }
    
    public function searchServers($searchQuery) {
        $query = new Query();
        $results = $query->table('servers s')
            ->select('s.*, COUNT(usm.id) as member_count')
            ->leftJoin('user_server_memberships usm', 's.id', '=', 'usm.server_id')
            ->where('s.is_public', 1)
            ->where(function($q) use ($searchQuery) {
                $q->whereLike('s.name', "%$searchQuery%")
                  ->orWhereLike('s.description', "%$searchQuery%");
            })
            ->groupBy('s.id')
            ->orderBy('member_count', 'DESC')
            ->get();
        
        return array_map(function($row) {
            return is_array($row) ? $row : (array) $row;
        }, $results);
    }
    
    /**
     * Get paginated list of servers for admin panel
     *
     * @param int $page Page number
     * @param int $limit Items per page
     * @return array List of servers
     */
    public function paginate($page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;
        
        $query = new Query();
        $results = $query->table('servers')
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->offset($offset)
            ->get();
            
        $servers = [];
        foreach ($results as $result) {
            $servers[] = new Server($result);
        }
        
        return $servers;
    }
    
    /**
     * Search servers by name or description for admin panel
     *
     * @param string $query Search query
     * @param int $page Page number
     * @param int $limit Items per page
     * @return array List of matching servers
     */
    public function search($query, $page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;
        
        $queryBuilder = new Query();
        $results = $queryBuilder->table('servers')
            ->where(function($q) use ($query) {
                $q->whereLike('name', "%$query%")
                  ->orWhereLike('description', "%$query%");
            })
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->offset($offset)
            ->get();
            
        $servers = [];
        foreach ($results as $result) {
            $servers[] = new Server($result);
        }
        
        return $servers;
    }
    
    /**
     * Count servers matching a search query
     *
     * @param string $query Search query
     * @return int Number of matching servers
     */
    public function countSearch($query) {
        $queryBuilder = new Query();
        return $queryBuilder->table('servers')
            ->where(function($q) use ($query) {
                $q->whereLike('name', "%$query%")
                  ->orWhereLike('description', "%$query%");
            })
            ->count();
    }
    
    /**
     * Get server creation statistics by day for the last n days
     *
     * @param int $days Number of days to look back
     * @return array Daily server creation stats
     */
    public function getCreationStatsByDay($days = 7) {
        $stats = [];
        $query = new Query();
        
        // Initialize the array with zeros for all days
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $stats[$date] = 0;
        }
        
        // Get the actual counts from the database
        $startDate = date('Y-m-d', strtotime("-" . ($days - 1) . " days"));
        $results = $query->query(
            "SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM servers 
             WHERE DATE(created_at) >= ? 
             GROUP BY DATE(created_at)
             ORDER BY date ASC",
            [$startDate]
        );
        
        // Fill in the actual counts
        foreach ($results as $row) {
            if (isset($stats[$row['date']])) {
                $stats[$row['date']] = (int)$row['count'];
            }
        }
        
        return $stats;
    }
    
    /**
     * Get server creation statistics by week for the last n weeks
     *
     * @param int $weeks Number of weeks to look back
     * @return array Weekly server creation stats
     */
    public function getCreationStatsByWeek($weeks = 4) {
        $stats = [];
        $query = new Query();
        
        // Initialize the array with zeros for all weeks
        for ($i = $weeks - 1; $i >= 0; $i--) {
            $weekStart = date('Y-m-d', strtotime("-$i weeks", strtotime('monday this week')));
            $weekEnd = date('Y-m-d', strtotime("+6 days", strtotime($weekStart)));
            $weekLabel = $weekStart . ' to ' . $weekEnd;
            $stats[$weekLabel] = 0;
        }
        
        // Get the actual counts from the database
        $startDate = date('Y-m-d', strtotime("-" . ($weeks - 1) . " weeks", strtotime('monday this week')));
        $results = $query->query(
            "SELECT 
                CONCAT(
                    DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY)),
                    ' to ',
                    DATE(DATE_ADD(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY), INTERVAL 6 DAY))
                ) as week_range,
                COUNT(*) as count 
             FROM servers 
             WHERE DATE(created_at) >= ? 
             GROUP BY week_range
             ORDER BY MIN(created_at) ASC",
            [$startDate]
        );
        
        // Fill in the actual counts
        foreach ($results as $row) {
            if (isset($stats[$row['week_range']])) {
                $stats[$row['week_range']] = (int)$row['count'];
            }
        }
        
        return $stats;
    }
    
    /**
     * Count servers that have had activity in the last n hours
     *
     * @param int $hours Number of hours to look back
     * @return int Number of active servers
     */
    public function countActiveServers($hours = 24) {
        $query = new Query();
        $date = date('Y-m-d H:i:s', strtotime("-$hours hours"));
        
        // Count servers that have had messages in the last n hours
        $result = $query->query(
            "SELECT COUNT(DISTINCT s.id) as count
             FROM servers s
             JOIN channels c ON c.server_id = s.id
             JOIN channel_messages cm ON cm.channel_id = c.id
             WHERE cm.created_at >= ?",
            [$date]
        );
        
        return isset($result[0]['count']) ? (int)$result[0]['count'] : 0;
    }
    
    /**
     * Count total members across all servers
     *
     * @return int Total member count
     */
    public function countTotalMembers() {
        $query = new Query();
        $result = $query->table('user_server_memberships')
            ->count();
            
        return $result;
    }
}
