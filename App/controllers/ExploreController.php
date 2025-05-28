<?php

require_once __DIR__ . '/../database/query.php';

class ExploreController {
    
    public function __construct() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    public function getPublicServers() {
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $servers = [];
        $userServerId = [];
        
        try {
            $query = new Query();
            
            // Get all public servers with member count
            $servers = $query->table('servers s')
                ->select('s.*, COUNT(usm.id) as member_count')
                ->leftJoin('user_server_memberships usm', 's.id', '=', 'usm.server_id')
                ->where('s.is_public', 1)
                ->groupBy('s.id')
                ->orderBy('member_count', 'DESC')
                ->get();
                
            // Get user's server memberships
            $userServers = $query->table('user_server_memberships')
                ->select('server_id')
                ->where('user_id', $currentUserId)
                ->get();
                
            foreach ($userServers as $server) {
                $userServerId[] = $server['server_id'];
            }
            
        } catch (Exception $e) {
            error_log("Error fetching public servers: " . $e->getMessage());
            $servers = [];
            $userServerId = [];
        }
        
        return [
            'servers' => $servers,
            'userServerIds' => $userServerId
        ];
    }
    
    public function getFeaturedServers($limit = 3) {
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $featuredServers = [];
        $userServerId = [];
        
        try {
            $query = new Query();
            
            // Get top public servers as featured
            $featuredServers = $query->table('servers s')
                ->select('s.*, COUNT(usm.id) as member_count')
                ->leftJoin('user_server_memberships usm', 's.id', '=', 'usm.server_id')
                ->where('s.is_public', 1)
                ->groupBy('s.id')
                ->orderBy('member_count', 'DESC')
                ->limit($limit)
                ->get();
                
            // Get user's server memberships
            $userServers = $query->table('user_server_memberships')
                ->select('server_id')
                ->where('user_id', $currentUserId)
                ->get();
                
            foreach ($userServers as $server) {
                $userServerId[] = $server['server_id'];
            }
            
        } catch (Exception $e) {
            error_log("Error fetching featured servers: " . $e->getMessage());
            $featuredServers = [];
            $userServerId = [];
        }
        
        return [
            'featuredServers' => $featuredServers,
            'userServerIds' => $userServerId
        ];
    }
    
    public function getServersByCategory($category) {
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $servers = [];
        $userServerId = [];
        
        try {
            $query = new Query();
            
            // Get servers by category
            $servers = $query->table('servers s')
                ->select('s.*, COUNT(usm.id) as member_count')
                ->leftJoin('user_server_memberships usm', 's.id', '=', 'usm.server_id')
                ->where('s.is_public', 1)
                ->where('s.category', $category)
                ->groupBy('s.id')
                ->orderBy('member_count', 'DESC')
                ->get();
                
            // Get user's server memberships
            $userServers = $query->table('user_server_memberships')
                ->select('server_id')
                ->where('user_id', $currentUserId)
                ->get();
                
            foreach ($userServers as $server) {
                $userServerId[] = $server['server_id'];
            }
            
        } catch (Exception $e) {
            error_log("Error fetching servers by category: " . $e->getMessage());
            $servers = [];
            $userServerId = [];
        }
        
        return [
            'servers' => $servers,
            'userServerIds' => $userServerId
        ];
    }
} 