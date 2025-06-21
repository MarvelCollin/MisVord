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
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $servers = [];
        $userServerId = [];        try {
            $servers = $this->serverRepository->getPublicServersWithMemberCount();
            
            // Ensure servers are arrays, not objects
            $servers = array_map(function($server) {
                if (!is_array($server)) {
                    return (array) $server;
                }
                return $server;
            }, $servers);
            
            $userServerId = $this->userServerMembershipRepository->getServerIdsForUser($currentUserId);
        } catch (Exception $e) {
            log_error("Error fetching public servers", ['error' => $e->getMessage()]);
            $servers = [];
            $userServerId = [];
        }

        return [
            'servers' => $servers,
            'userServerIds' => $userServerId
        ];
    }
    public function getFeaturedServers($limit = 3)
    {
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $featuredServers = [];
        $userServerId = [];        try {
            $featuredServers = $this->serverRepository->getFeaturedServersWithMemberCount($limit);
            
            // Ensure servers are arrays, not objects
            $featuredServers = array_map(function($server) {
                return is_array($server) ? $server : (array) $server;
            }, $featuredServers);
            
            $userServerId = $this->userServerMembershipRepository->getServerIdsForUser($currentUserId);
        } catch (Exception $e) {
            log_error("Error fetching featured servers", ['error' => $e->getMessage()]);
            $featuredServers = [];
            $userServerId = [];
        }

        return [
            'featuredServers' => $featuredServers,
            'userServerIds' => $userServerId
        ];
    }    public function getServersByCategory($category)
    {
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $servers = [];
        $userServerId = [];

        try {
            $servers = $this->serverRepository->getServersByCategoryWithMemberCount($category);
            
            // Ensure servers are arrays, not objects
            $servers = array_map(function($server) {
                return is_array($server) ? $server : (array) $server;
            }, $servers);
            
            $userServerId = $this->userServerMembershipRepository->getServerIdsForUser($currentUserId);
        } catch (Exception $e) {
            log_error("Error fetching servers by category", ['error' => $e->getMessage()]);
            $servers = [];
            $userServerId = [];
        }

        return [
            'servers' => $servers,
            'userServerIds' => $userServerId
        ];
    }    public function prepareExploreData()
    {
        // Temporarily disable auth requirement for testing
        // $this->requireAuth();

        // Use a default user ID for testing, or 0 if no session
        $currentUserId = $_SESSION['user_id'] ?? 0;

        $userServers = $this->serverRepository->getForUser($currentUserId);
        // Convert Server objects to arrays
        $userServers = array_map(function($server) {
            return is_array($server) ? $server : (array) $server;
        }, $userServers);
        
        $GLOBALS['userServers'] = $userServers;        
        $allServersData = $this->getPublicServers();
        $featuredServersData = $this->getFeaturedServers(3);

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
            'servers' => $allServersData['servers'],
            'userServerIds' => $allServersData['userServerIds'],
            'featuredServers' => $featuredServersData['featuredServers'],
            'categories' => $categories,
            'currentUserId' => $currentUserId
        ];
    }
}
