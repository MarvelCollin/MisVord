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

    private function getFeaturedServers($limit = 3)
    {
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $featuredServers = [];
        $userServerId = [];        
        
        try {
            $featuredServers = $this->serverRepository->getFeaturedServersWithMemberCount($limit);
            
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
    }

    public function prepareExploreData()
    {

        $currentUserId = $_SESSION['user_id'] ?? 0;

        $userServers = $this->serverRepository->getForUser($currentUserId);
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

    public function getExploreLayout()
    {
        $this->requireAuth();

        try {
            if (!$this->isAjaxRequest()) {
                header('HTTP/1.1 400 Bad Request');
                exit('AJAX request required');
            }

            $exploreData = $this->prepareExploreData();
            
            $userServers = $exploreData['userServers'];
            $servers = $exploreData['servers'];
            $userServerId = $exploreData['userServerIds'];
            $featuredServers = $exploreData['featuredServers'];
            $categories = $exploreData['categories'];

            $GLOBALS['servers'] = $servers;
            $GLOBALS['userServerIds'] = $userServerId;
            $GLOBALS['featuredServers'] = $featuredServers;
            $GLOBALS['categories'] = $categories;
            $GLOBALS['contentType'] = 'explore';

            ob_start();
            ?>
            <div class="flex flex-1 overflow-hidden">
                <div class="flex flex-col flex-1" id="main-content">
                    <?php include __DIR__ . '/../views/components/app-sections/explore-main-content.php'; ?>
                </div>
            </div>
            <?php
            $html = ob_get_clean();
            echo $html;
            exit;

        } catch (Exception $e) {
            header('HTTP/1.1 500 Internal Server Error');
            echo 'Failed to load explore layout: ' . $e->getMessage();
            exit;
        }
    }
}
