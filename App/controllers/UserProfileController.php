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
    }    public function updatePerServerProfile()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        if (!$input || !isset($input['server_id'])) {
            return $this->validationError(['message' => 'Invalid request']);
        }

        $serverId = $input['server_id'];
        $userId = $this->getCurrentUserId();
        $nickname = trim($input['nickname'] ?? '');

        $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $serverId);
        if (!$membership) {
            return $this->forbidden('You are not a member of this server');
        }

        $result = $this->userServerMembershipRepository->update($membership->id, ['nickname' => $nickname]);        if ($result) {
            return $this->success([
                'nickname' => $nickname
            ], 'Server profile updated successfully');
        } else {
            return $this->serverError('Failed to update server profile');
        }
    }    public function getPerServerProfile($serverId)
    {
        $this->requireAuth();

        $userId = $this->getCurrentUserId();

        $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $serverId);
        if (!$membership) {
            return $this->forbidden('You are not a member of this server');
        }        return $this->success([
            'profile' => [
                'nickname' => $membership->nickname,
                'role' => $membership->role
            ]
        ]);
    }
}
