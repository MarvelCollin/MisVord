<?php

class HomeController extends BaseController
{    public function index()
    {
        // Check authentication
        if (!isset($_SESSION['user_id'])) {
            header('Location: /login');
            exit;
        }

        $currentUserId = $_SESSION['user_id'];
        log_debug("HOME - Loading servers for user", ['user_id' => $currentUserId]);

        // Get fresh server data
        require_once dirname(__DIR__) . '/database/models/Server.php';
        $userServers = Server::getFormattedServersForUser($currentUserId);
        log_debug("HOME - Loaded servers for sidebar", ['count' => count($userServers)]);

        // Direct database check for debugging
        $query = new Query();
        $memberships = $query->table('user_server_memberships')->where('user_id', $currentUserId)->get();
        log_debug("HOME - Direct query found memberships", ['count' => count($memberships)]);

        // Get friend data
        require_once dirname(__DIR__) . '/controllers/FriendController.php';
        $friendController = new FriendController();
        $friendData = $friendController->getUserFriends();

        // Set data for the view components
        $GLOBALS['userServers'] = $userServers;
        $GLOBALS['currentUser'] = $friendData['currentUser'];
        $GLOBALS['friends'] = $friendData['friends'];
        $GLOBALS['onlineFriends'] = $friendData['onlineFriends'];

        return [
            'userServers' => $userServers,
            'memberships' => $memberships,
            'currentUserId' => $currentUserId,
            'friendData' => $friendData
        ];
    }
}
