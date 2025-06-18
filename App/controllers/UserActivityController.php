<?php

require_once __DIR__ . '/../database/repositories/UserActivityRepository.php';
require_once __DIR__ . '/BaseController.php';

class UserActivityController extends BaseController
{

    private $userActivityRepository;

    public function __construct()
    {
        parent::__construct();
        $this->userActivityRepository = new UserActivityRepository();
    }

    public function getActiveUsers()
    {
        $currentUserId = $_SESSION['user_id'] ?? 0;

        try {
            $activeUsers = $this->userActivityRepository->getActiveUsers($currentUserId);
        } catch (Exception $e) {
            error_log("Error fetching active users: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            $activeUsers = [];
        }

        return $activeUsers;
    }
}
