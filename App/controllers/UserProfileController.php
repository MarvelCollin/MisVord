<?php

require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/query.php';
require_once __DIR__ . '/BaseController.php';

class UserProfileController extends BaseController {

    public function __construct() {
        parent::__construct();
    }

    public function updatePerServerProfile() {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['server_id'])) {
            return $this->validationError(['message' => 'Invalid request']);
        }

        $serverId = $data['server_id'];
        $userId = $_SESSION['user_id'];
        $nickname = trim($data['nickname'] ?? '');

        $membership = UserServerMembership::findByUserAndServer($userId, $serverId);
        if (!$membership) {
            return $this->forbidden('You are not a member of this server');
        }

        $query = new Query();
        $result = $query->table('user_server_memberships')
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->update(['nickname' => $nickname]);

        if ($result) {
            return $this->successResponse([
                'nickname' => $nickname
            ], 'Server profile updated successfully');
        } else {
            return $this->serverError('Failed to update server profile');
        }
    }

    public function getPerServerProfile($serverId) {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $userId = $_SESSION['user_id'];

        $membership = UserServerMembership::findByUserAndServer($userId, $serverId);
        if (!$membership) {
            return $this->forbidden('You are not a member of this server');
        }

        return $this->successResponse([
            'profile' => [
                'nickname' => $membership->nickname,
                'role' => $membership->role
            ]
        ]);
    }
}