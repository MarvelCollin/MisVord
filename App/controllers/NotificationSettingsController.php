<?php

require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/query.php';
require_once __DIR__ . '/BaseController.php';

class NotificationSettingsController extends BaseController {

    public function __construct() {
        parent::__construct();
    }

    public function updateServerNotificationSettings() {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['server_id'])) {
            return $this->validationError(['message' => 'Invalid request']);
        }

        $serverId = $data['server_id'];
        $userId = $_SESSION['user_id'];

        $membership = UserServerMembership::findByUserAndServer($userId, $serverId);
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

        $query = new Query();

        try {
            $result = $query->table('user_server_memberships')
                ->where('user_id', $userId)
                ->where('server_id', $serverId)
                ->update(['notification_settings' => json_encode($notificationSettings)]);

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

    public function getServerNotificationSettings($serverId) {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $userId = $_SESSION['user_id'];

        $membership = UserServerMembership::findByUserAndServer($userId, $serverId);
        if (!$membership) {
            return $this->forbidden('You are not a member of this server');
        }

        try {
            $query = new Query();
            $result = $query->table('user_server_memberships')
                ->select('notification_settings')
                ->where('user_id', $userId)
                ->where('server_id', $serverId)
                ->first();

            if ($result && !empty($result['notification_settings'])) {
                $settings = json_decode($result['notification_settings'], true);
                return $this->successResponse([
                    'notification_settings' => $settings
                ]);
            } else {

                $defaultSettings = [
                    'all_messages' => false,
                    'mentions_only' => true,
                    'muted' => false,
                    'suppress_everyone' => false,
                    'suppress_roles' => false
                ];

                return $this->successResponse([
                    'notification_settings' => $defaultSettings
                ]);
            }
        } catch (Exception $e) {
            return $this->serverError('Error retrieving notification settings: ' . $e->getMessage());
        }
    }
}