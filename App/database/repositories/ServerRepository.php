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
    
    
    public function paginate($page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;
        
        $query = new Query();
        $sql = "
            SELECT s.*, 
                   COUNT(usm.id) as member_count,
                   (SELECT user_id FROM user_server_memberships WHERE server_id = s.id AND role = 'owner' LIMIT 1) as owner_id
            FROM servers s
            LEFT JOIN user_server_memberships usm ON s.id = usm.server_id
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $results = $query->query($sql, [$limit, $offset]);
        
        $servers = [];
        foreach ($results as $result) {
            $servers[] = new Server($result);
        }
        
        return $servers;
    }
    
    
    public function search($searchQuery, $page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;
        
        $query = new Query();
        $sql = "
            SELECT s.*, 
                   COUNT(usm.id) as member_count,
                   (SELECT user_id FROM user_server_memberships WHERE server_id = s.id AND role = 'owner' LIMIT 1) as owner_id
            FROM servers s
            LEFT JOIN user_server_memberships usm ON s.id = usm.server_id
            WHERE s.name LIKE ? OR s.description LIKE ?
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $searchTerm = "%{$searchQuery}%";
        $results = $query->query($sql, [$searchTerm, $searchTerm, $limit, $offset]);
        
        $servers = [];
        foreach ($results as $result) {
            $servers[] = new Server($result);
        }
        
        return $servers;
    }
    
    
    public function countSearch($searchQuery) {
        $query = new Query();
        $sql = "
            SELECT COUNT(DISTINCT s.id) as count 
            FROM servers s 
            WHERE s.name LIKE ? OR s.description LIKE ?
        ";
        
        $searchTerm = "%{$searchQuery}%";
        $result = $query->query($sql, [$searchTerm, $searchTerm]);
        
        return isset($result[0]['count']) ? (int)$result[0]['count'] : 0;
    }
    

    public function getCreationStatsByDay($days = 7) {
        $stats = [];
        $query = new Query();
        
        
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $stats[$date] = 0;
        }
        
        
        $startDate = date('Y-m-d', strtotime("-" . ($days - 1) . " days"));
        $results = $query->query(
            "SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM servers 
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
    
    
    public function getCreationStatsByWeek($weeks = 4) {
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
             FROM servers 
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
    
    
    public function countActiveServers($hours = 24) {
        $query = new Query();
        $date = date('Y-m-d H:i:s', strtotime("-$hours hours"));
        
        
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
    
            
    public function countTotalMembers() {
        $query = new Query();
        $result = $query->table('user_server_memberships')
            ->count();
            
        return $result;
    }
    
    public function countPublicServers() {
        $query = new Query();
        return $query->table('servers')
            ->where('is_public', 1)
            ->count();
    }
}
