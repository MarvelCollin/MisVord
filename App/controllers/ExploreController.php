<?php

require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/BaseController.php';

class ExploreController extends BaseController
{
    private $serverRepository;
    private $userServerMembershipRepository;

    public function __construct()
    {
        parent::__construct();
        $this->serverRepository = new ServerRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
    }
    
    public function getPublicServers()
    {
        try {
            $servers = $this->serverRepository->getPublicServersWithMemberCount();
            
            return array_map(function($server) {
                return is_array($server) ? $server : (array) $server;
            }, $servers);
        } catch (Exception $e) {
            log_error("Error fetching public servers", ['error' => $e->getMessage()]);
            return [];
        }
    }

    private function getFeaturedServers($limit = 3)
    {
        try {
            $featuredServers = $this->serverRepository->getFeaturedServersWithMemberCount($limit);
            
            return array_map(function($server) {
                return is_array($server) ? $server : (array) $server;
            }, $featuredServers);
        } catch (Exception $e) {
            log_error("Error fetching featured servers", ['error' => $e->getMessage()]);
            return [];
        }
    }

    private function getUserServerIds($userId)
    {
        try {
            return $this->userServerMembershipRepository->getServerIdsForUser($userId);
        } catch (Exception $e) {
            log_error("Error fetching user server IDs", ['error' => $e->getMessage()]);
            return [];
        }
    }

    public function prepareExploreData()
    {
        $currentUserId = $_SESSION['user_id'] ?? 0;

        $userServers = $this->serverRepository->getForUser($currentUserId);
        $userServers = array_map(function($server) {
            return is_array($server) ? $server : (array) $server;
        }, $userServers);
        
        $servers = $this->getPublicServers();
        $featuredServers = $this->getFeaturedServers(3);
        $userServerIds = $this->getUserServerIds($currentUserId);

        $categories = [
            'gaming' => 'Gaming',
            'music' => 'Music',
            'education' => 'Education',
            'science' => 'Science & Tech',
            'entertainment' => 'Entertainment',
            'community' => 'Community'
        ];

        return [
            'userServers' => $userServers,
            'servers' => $servers,
            'userServerIds' => $userServerIds,
            'featuredServers' => $featuredServers,
            'categories' => $categories,
            'currentUserId' => $currentUserId
        ];
    }


}
