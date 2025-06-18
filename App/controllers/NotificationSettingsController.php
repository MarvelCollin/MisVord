<?php

require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/BaseController.php';

class NotificationSettingsController extends BaseController
{

    private $userServerMembershipRepository;     private $serverRepository;    public function __construct()
    {
        parent::__construct();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
        $this->serverRepository = new ServerRepository();
    }

    public function updateServerNotificationSettings()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $input = $this->sanitize($input);        if (!$input || !isset($input['server_id'])) {
            return $this->validationError(['message' => 'Invalid request']);
        }
        $serverId = $input['server_id'];
        $userId = $this->getCurrentUserId();

        $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $serverId);
        if (!$membership) {
            return $this->forbidden('You are not a member of this server');
        }

        $allMessages = isset($input['all_messages']) ? (bool)$input['all_messages'] : false;
        $mentionsOnly = isset($input['mentions_only']) ? (bool)$input['mentions_only'] : true;
        $muted = isset($input['muted']) ? (bool)$input['muted'] : false;        $suppressEveryone = isset($input['suppress_everyone']) ? (bool)$input['suppress_everyone'] : false;
        $suppressRoles = isset($input['suppress_roles']) ? (bool)$input['suppress_roles'] : false;

        $notificationSettings = [
            'all_messages' => $allMessages,
            'mentions_only' => $mentionsOnly,
            'muted' => $muted,
            'suppress_everyone' => $suppressEveryone,
            'suppress_roles' => $suppressRoles
        ];
        
        try {
            $result = $this->userServerMembershipRepository->updateNotificationSettings($userId, $serverId, $notificationSettings);

            if ($result !== false) {
                return $this->success([
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
        $this->requireAuth();

        $userId = $this->getCurrentUserId();

        $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $serverId);        if (!$membership) {
            return $this->forbidden('You are not a member of this server');
        }

        try {
            $settings = $this->userServerMembershipRepository->getNotificationSettings($userId, $serverId);

            return $this->success([
                'notification_settings' => $settings
            ]);
        } catch (Exception $e) {
            return $this->serverError('Error retrieving notification settings: ' . $e->getMessage());
        }
    }
}
