<?php

require_once __DIR__ . '/../database/query.php';
require_once __DIR__ . '/BaseController.php';

class UserActivityController extends BaseController {

    public function __construct() {
        parent::__construct();
    }

    public function getActiveUsers() {
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $activeUsers = [];

        try {
            $query = new Query();

            $sql = "
                SELECT DISTINCT u.id, u.username, u.avatar, u.status, a.type, a.name, a.image_url, a.start_time
                FROM users u
                JOIN user_activities a ON u.id = a.user_id
                JOIN friend_list fl ON (u.id = fl.user_id2 AND fl.user_id = ?) 
                                    OR (u.id = fl.user_id AND fl.user_id2 = ?)
                WHERE fl.status = 'accepted'
                AND u.id != ?
                AND u.status = 'online'
                GROUP BY u.id, u.username, u.avatar, u.status, a.type, a.name, a.image_url, a.start_time
                ORDER BY a.start_time DESC
                LIMIT 5
            ";

            $activeUsers = $query->rawQuery($sql, [
                $currentUserId,
                $currentUserId,
                $currentUserId
            ]);

        } catch (Exception $e) {
            error_log("Error fetching active users: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            $activeUsers = [];
        }

        return $activeUsers;
    }
}