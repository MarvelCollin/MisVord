<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';

class ServerSidebarController extends BaseController
{
    private $serverRepository;
    private $userServerMembershipRepository;

    public function __construct()
    {
        parent::__construct();
        $this->serverRepository = new ServerRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
    }

    public function getUserServers()
    {
        $currentUserId = $this->getCurrentUserId();
        $servers = $this->serverRepository->getForUser($currentUserId);
        
        return [
            'servers' => $servers,
            'currentUserId' => $currentUserId
        ];
    }

    public function initSidebar()
    {
        $data = $this->getUserServers();
        $GLOBALS['userServers'] = $data['servers'];
        
        return $data;
    }
} 