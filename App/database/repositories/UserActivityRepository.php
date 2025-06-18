<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../query.php';

class UserActivityRepository extends Repository {
    public function __construct() {
        parent::__construct('user_activities');
    }
    
    public function getActiveUsers($currentUserId) {
        $query = new Query();
        $sql = "
            SELECT DISTINCT u.id, u.username, u.avatar, u.status, a.type, a.name, a.image_url, a.start_time
            FROM users u
            JOIN user_activities a ON u.id = a.user_id
            JOIN friend_list fl ON (u.id = fl.user_id2 AND fl.user_id = {$currentUserId}) 
                                OR (u.id = fl.user_id AND fl.user_id2 = {$currentUserId})
            WHERE fl.status = 'accepted'
            AND u.id != {$currentUserId}
            AND u.status = 'online'
            GROUP BY u.id, u.username, u.avatar, u.status, a.type, a.name, a.image_url, a.start_time
            ORDER BY a.start_time DESC
            LIMIT 5
        ";

        return $query->rawQuery($sql);
    }
}
