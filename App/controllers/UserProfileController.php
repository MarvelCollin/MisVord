<?php

require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/BaseController.php';

class UserProfileController extends BaseController
{

    private $userServerMembershipRepository;
    private $serverRepository;

    public function __construct()
    {
        parent::__construct();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
        $this->serverRepository = new ServerRepository();
    }

    public function updatePerServerProfile()
    {
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

        $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $serverId);
        if (!$membership) {
            return $this->forbidden('You are not a member of this server');
        }

        $result = $this->userServerMembershipRepository->update($membership->id, ['nickname' => $nickname]);

        if ($result) {
            return $this->successResponse([
                'nickname' => $nickname
            ], 'Server profile updated successfully');
        } else {
            return $this->serverError('Failed to update server profile');
        }
    }

    public function getPerServerProfile($serverId)
    {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }
        $userId = $_SESSION['user_id'];

        $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $serverId);
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
