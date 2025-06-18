<?php

require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/BaseController.php';

class NotificationSettingsController extends BaseController
{

    private $userServerMembershipRepository;
    private $serverRepository;

    public function __construct()
    {
        parent::__construct();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
        $this->serverRepository = new ServerRepository();
    }

    public function updateServerNotificationSettings()
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

        $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $serverId);
        if (!$membership) {
            return $this->forbidden('You are not a member of this server');
        }

        $allMessages = isset($data['all_messages']) ? (bool)$data['all_messages'] : false;
        $mentionsOnly = isset($data['mentions_only']) ? (bool)$data['mentions_only'] : true;
        $muted = isset($data['muted']) ? (bool)$data['muted'] : false;
        $suppressEveryone = isset($data['suppress_everyone']) ? (bool)$data['suppress_everyone'] : false;
        $suppressRoles = isset($data['suppress_roles']) ? (bool)$data['suppress_roles'] : false;

        $notificationSettings = [
            'all_messages' => $allMessages,
            'mentions_only' => $mentionsOnly,
            'muted' => $muted,
            'suppress_everyone' => $suppressEveryone,
            'suppress_roles' => $suppressRoles
        ];
        try {
            $result = $this->userServerMembershipRepository->updateNotificationSettings($userId, $serverId, $notificationSettings);

            if ($result) {
                return $this->successResponse([
                    'notification_settings' => $notificationSettings
                ], 'Notification settings updated successfully');
            } else {
                return $this->serverError('Failed to update notification settings');
            }
        } catch (Exception $e) {
            return $this->serverError('Error updating notification settings: ' . $e->getMessage());
        }
    }

    public function getServerNotificationSettings($serverId)
    {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $userId = $_SESSION['user_id'];

        $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $serverId);
        if (!$membership) {
            return $this->forbidden('You are not a member of this server');
        }

        try {
            $settings = $this->userServerMembershipRepository->getNotificationSettings($userId, $serverId);

            return $this->successResponse([
                'notification_settings' => $settings
            ]);
        } catch (Exception $e) {
            return $this->serverError('Error retrieving notification settings: ' . $e->getMessage());
        }
    }
}
