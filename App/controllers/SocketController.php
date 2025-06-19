<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../utils/WebSocketClient.php';
require_once __DIR__ . '/../config/ajax.php';

class SocketController extends BaseController {
    private $socketClient;
    private $socketConfig;
    
    public function __construct() {
        parent::__construct();
        $this->socketConfig = $this->ajaxConfig['socket'] ?? [
            'host' => 'localhost',
            'port' => 1002,
            'path' => '/socket.io'
        ];
        
        $this->initSocketClient();
    }
    
    private function initSocketClient() {
        try {
            $this->socketClient = new WebSocketClient(
                $this->socketConfig['host'],
                $this->socketConfig['port'],
                $this->socketConfig['path']
            );
        } catch (Exception $e) {
            if (function_exists('logger')) {
                logger()->error("Failed to initialize socket client", [
                    'error' => $e->getMessage()
                ]);
            }
        }
    }
    
    public function notifyUser($userId, $event, $data) {
        if (!$this->isSocketEnabled()) {
            return false;
        }
        
        try {
            $result = $this->socketClient->notifyUser($userId, $event, $data);
            $this->logSocketEvent('notify-user', [
                'userId' => $userId,
                'event' => $event,
                'success' => $result
            ]);
            return $result;
        } catch (Exception $e) {
            $this->logSocketError('notify-user', $e, [
                'userId' => $userId,
                'event' => $event
            ]);
            return false;
        }
    }
    
    public function broadcast($event, $data) {
        if (!$this->isSocketEnabled()) {
            return false;
        }
        
        try {
            $result = $this->socketClient->broadcast($event, $data);
            $this->logSocketEvent('broadcast', [
                'event' => $event,
                'success' => $result
            ]);
            return $result;
        } catch (Exception $e) {
            $this->logSocketError('broadcast', $e, [
                'event' => $event
            ]);
            return false;
        }
    }
    
    public function broadcastToRoom($room, $event, $data) {
        if (!$this->isSocketEnabled()) {
            return false;
        }
        
        try {
            $result = $this->socketClient->broadcastToRoom($room, $event, $data);
            $this->logSocketEvent('broadcast-to-room', [
                'room' => $room,
                'event' => $event,
                'success' => $result
            ]);
            return $result;
        } catch (Exception $e) {
            $this->logSocketError('broadcast-to-room', $e, [
                'room' => $room,
                'event' => $event
            ]);
            return false;
        }
    }
    
    public function broadcastToServer($serverId, $event, $data) {
        return $this->broadcastToRoom('server-' . $serverId, $event, $data);
    }
    
    public function broadcastToChannel($channelId, $event, $data) {
        return $this->broadcastToRoom('channel-' . $channelId, $event, $data);
    }
      public function updateUserStatus($userId, $status, $activityDetails = null) {
        if (!$this->isSocketEnabled()) {
            return false;
        }

        try {
            $result = $this->socketClient->updateUserPresence($userId, $status, $activityDetails);
            $this->logSocketEvent('update-user-status', [
                'userId' => $userId,
                'status' => $status,
                'success' => $result
            ]);
            return $result;
        } catch (Exception $e) {
            $this->logSocketError('update-user-status', $e, [
                'userId' => $userId,
                'status' => $status
            ]);
            return false;
        }
    }

    public function getOnlineUsers() {
        if (!$this->isSocketEnabled()) {
            return [];
        }

        try {
            $result = $this->socketClient->getOnlineUsers();
            $this->logSocketEvent('get-online-users', [
                'success' => $result !== false
            ]);
            return $result ? $result['users'] : [];        } catch (Exception $e) {
            $this->logSocketError('get-online-users', $e, []);
            return [];
        }
    }

    public function getUserPresence($userId) {
        if (!$this->isSocketEnabled()) {
            return null;
        }

        try {
            $result = $this->socketClient->getUserPresence($userId);
            $this->logSocketEvent('get-user-presence', [
                'userId' => $userId,
                'success' => $result !== false
            ]);
            return $result;
        } catch (Exception $e) {
            $this->logSocketError('get-user-presence', $e, [
                'userId' => $userId
            ]);
            return null;
        }
    }
    
    public function notifyFriendRequest($recipientId, $senderId, $senderName) {
        $currentTime = new DateTime();
        $timestamp = $currentTime->format('Y-m-d H:i:s');
        
        return $this->notifyUser($recipientId, 'friend-request-received', [
            'sender_id' => $senderId,
            'sender_name' => $senderName,
            'timestamp' => $timestamp
        ]);
    }
    
    public function notifyFriendRequestAccepted($senderId, $recipientId, $recipientName) {
        $currentTime = new DateTime();
        $timestamp = $currentTime->format('Y-m-d H:i:s');
        
        return $this->notifyUser($senderId, 'friend-request-accepted', [
            'recipient_id' => $recipientId,
            'recipient_name' => $recipientName,
            'timestamp' => $timestamp
        ]);
    }
    
    public function notifyNewMessage($channelId, $message) {
        return $this->broadcastToChannel($channelId, 'message-received', $message);
    }
    
    public function notifyTyping($channelId, $userId, $username, $isTyping = true) {
        $event = $isTyping ? 'typing-start' : 'typing-stop';
        
        return $this->broadcastToChannel($channelId, $event, [
            'user_id' => $userId,
            'username' => $username,
            'channel_id' => $channelId,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    
    public function notifyReaction($channelId, $messageId, $userId, $username, $reaction) {
        return $this->broadcastToChannel($channelId, 'reaction-added', [
            'message_id' => $messageId,
            'user_id' => $userId,
            'username' => $username,
            'reaction' => $reaction,
            'channel_id' => $channelId,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    
    public function notifyServerUpdate($serverId, $updateType, $data) {
        return $this->broadcastToServer($serverId, 'server-' . $updateType, $data);
    }
    
    public function notifyRoleChange($serverId, $roleData, $action = 'updated') {
        return $this->broadcastToServer($serverId, 'role-' . $action, [
            'server_id' => $serverId,
            'role' => $roleData,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    
    public function emitCustomEvent($event, $data) {
        if (!$this->isSocketEnabled()) {
            return false;
        }
        
        try {
            $result = $this->socketClient->emit($event, $data);
            $this->logSocketEvent('custom-event', [
                'event' => $event,
                'success' => $result
            ]);
            return $result;
        } catch (Exception $e) {
            $this->logSocketError('custom-event', $e, [
                'event' => $event
            ]);
            return false;
        }
    }
    
    private function isSocketEnabled() {
        return $this->socketConfig['enabled'] ?? true;
    }
    
    private function logSocketEvent($type, $data) {
        if (function_exists('logger')) {
            logger()->debug("Socket event: {$type}", $data);
        }
    }
    
    private function logSocketError($type, $exception, $data) {
        if (function_exists('logger')) {
            logger()->error("Socket error: {$type}", [
                'error' => $exception->getMessage(),
                'data' => $data
            ]);
        }
    }
    
    public function handleSocketRequest() {
        $this->requireAuth();
        
        $input = $this->getInput();
        
        if (!isset($input['event'])) {
            return $this->error('Event is required', 400);
        }
        
        $event = $input['event'];
        $data = $input['data'] ?? [];
        $room = $input['room'] ?? null;
        
        $result = false;
        
        if ($room) {
            $result = $this->broadcastToRoom($room, $event, $data);
        } else {
            $result = $this->broadcast($event, $data);
        }
        
        if ($result) {
            return $this->success(['event' => $event], 'Socket event sent successfully');
        } else {
            return $this->error('Failed to send socket event', 500);
        }
    }
}
