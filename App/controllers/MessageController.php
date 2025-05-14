<?php

require_once __DIR__ . '/../database/models/Message.php';
require_once __DIR__ . '/../database/models/Channel.php';
require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/../database/models/User.php';
require_once __DIR__ . '/../utils/WebSocketClient.php';

class MessageController {
    public function __construct() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        Message::initialize();
    }
    
    public function getMessages($channelId) {
        error_log("MessageController::getMessages called with channelId=$channelId");
        
        if (!isset($_SESSION['user_id'])) {
            error_log("MessageController: Unauthorized - no user_id in session");
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }
        
        error_log("MessageController: User authenticated with ID=" . $_SESSION['user_id']);
        
        $channel = Channel::find($channelId);
        if (!$channel) {
            error_log("MessageController: Channel not found with ID=$channelId");
            $this->jsonResponse(['success' => false, 'message' => 'Channel not found'], 404);
            return;
        }
        
        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
        if (!$membership && $channel->server_id != 0) {
            error_log("MessageController: User " . $_SESSION['user_id'] . " is not a member of server " . $channel->server_id);
            $this->jsonResponse(['success' => false, 'message' => 'You are not a member of this server'], 403);
            return;
        }
        
        $limit = $_GET['limit'] ?? 50;
        $offset = $_GET['offset'] ?? 0;
        
        try {
            $messages = Message::getForChannel($channelId, $limit, $offset);
            
            $formattedMessages = [];
            foreach ($messages as $message) {
                $formattedMessages[] = $this->formatMessage($message);
            }
            
            $this->jsonResponse([
                'success' => true,
                'channel_id' => $channelId,
                'messages' => $formattedMessages
            ]);
        } catch (Exception $e) {
            error_log("MessageController: Error fetching messages: " . $e->getMessage());
            $this->jsonResponse([
                'success' => false, 
                'message' => 'Error fetching messages: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function createMessage($channelId) {
        error_log("MessageController::createMessage called with channelId=$channelId");
        
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }
        
        $channel = Channel::find($channelId);
        if (!$channel) {
            error_log("MessageController: Channel not found with ID=$channelId");
            $this->jsonResponse(['success' => false, 'message' => 'Channel not found'], 404);
            return;
        }
        
        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
        if (!$membership && $channel->server_id != 0) {
            $this->jsonResponse(['success' => false, 'message' => 'You are not a member of this server'], 403);
            return;
        }
        
        $rawInput = file_get_contents('php://input');
        $data = null;
        
        if (!empty($rawInput)) {
            try {
                $data = json_decode($rawInput, true, 512, JSON_THROW_ON_ERROR);
            } catch (Exception $e) {
                error_log("JSON parse error: " . $e->getMessage() . " - Raw input: " . substr($rawInput, 0, 100));
                $this->jsonResponse(['success' => false, 'message' => 'Invalid JSON data'], 400);
                return;
            }
        }
        
        if ($data === null) {
            $data = $_POST;
        }
        
        error_log("MessageController: Received data: " . json_encode($data));
        
        if (empty($data['content'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Message content is required'], 400);
            return;
        }
        
        try {
            Message::initialize();
            
            $message = new Message();
            $message->user_id = $_SESSION['user_id'];
            $message->content = $data['content'];
            $message->sent_at = date('Y-m-d H:i:s');
            $message->message_type = 'text';
            $message->attachment_url = $data['attachment_url'] ?? null;
            $message->reply_message_id = $data['reply_message_id'] ?? null;
            
            if (!$message->save()) {
                error_log("MessageController: Failed to save message");
                $this->jsonResponse(['success' => false, 'message' => 'Failed to create message'], 500);
                return;
            }
            
            error_log("MessageController: Message saved with ID=" . $message->id);
            
            if (!$message->associateWithChannel($channelId)) {
                error_log("MessageController: Failed to associate message with channel");
                $message->delete();
                $this->jsonResponse(['success' => false, 'message' => 'Failed to associate message with channel'], 500);
                return;
            }
            
            $user = User::find($_SESSION['user_id']);
            if ($user) {
                $message->username = $user->username;
                $message->avatar_url = $user->avatar_url;
            }
            
            $formattedMessage = $this->formatMessage($message);
            
            try {
                $this->broadcastToWebSocket('message', [
                    'id' => $message->id,
                    'channelId' => $channelId,
                    'content' => $message->content,
                    'sent_at' => $message->sent_at,
                    'formatted_time' => $formattedMessage['formatted_time'],
                    'user' => [
                        'userId' => $message->user_id,
                        'username' => $formattedMessage['user']['username'],
                        'avatar_url' => $formattedMessage['user']['avatar_url']
                    ]
                ]);
            } catch (Exception $e) {
                error_log("Failed to broadcast to WebSocket server: " . $e->getMessage());
            }
            
            $this->jsonResponse([
                'success' => true, 
                'message' => 'Message sent successfully',
                'data' => $formattedMessage
            ]);
        } catch (Exception $e) {
            error_log("Error creating message: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            $this->jsonResponse(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }
    
    public function updateMessage($id) {
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }
        
        $message = Message::find($id);
        if (!$message) {
            $this->jsonResponse(['success' => false, 'message' => 'Message not found'], 404);
            return;
        }
        
        if ($message->user_id != $_SESSION['user_id']) {
            $this->jsonResponse(['success' => false, 'message' => 'You can only edit your own messages'], 403);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            $this->jsonResponse(['success' => false, 'message' => 'Invalid request data'], 400);
            return;
        }
        
        try {
            if (isset($data['content'])) {
                $message->content = $data['content'];
                $message->edited_at = date('Y-m-d H:i:s');
                
                if ($message->save()) {
                    $formattedMessage = $this->formatMessage($message);
                    
                    try {
                        $this->broadcastToWebSocket('message_updated', [
                            'id' => $message->id,
                            'content' => $message->content,
                            'edited_at' => $message->edited_at,
                            'user' => [
                                'userId' => $message->user_id,
                                'username' => $formattedMessage['user']['username']
                            ]
                        ]);
                    } catch (Exception $e) {
                        error_log("Failed to broadcast message update to WebSocket: " . $e->getMessage());
                    }
                    
                    $this->jsonResponse([
                        'success' => true, 
                        'message' => 'Message updated successfully',
                        'data' => $formattedMessage
                    ]);
                } else {
                    $this->jsonResponse(['success' => false, 'message' => 'Failed to update message'], 500);
                }
            } else {
                $this->jsonResponse(['success' => false, 'message' => 'No content provided for update'], 400);
            }
        } catch (Exception $e) {
            $this->jsonResponse(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }
    
    public function deleteMessage($id) {
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }
        
        $message = Message::find($id);
        if (!$message) {
            $this->jsonResponse(['success' => false, 'message' => 'Message not found'], 404);
            return;
        }
        
        if ($message->user_id != $_SESSION['user_id'] && !isset($_SESSION['is_admin'])) {
            $this->jsonResponse(['success' => false, 'message' => 'You can only delete your own messages'], 403);
            return;
        }
        
        try {
            if ($message->delete()) {
                try {
                    $this->broadcastToWebSocket('message_deleted', [
                        'id' => $id,
                        'deleted_by' => $_SESSION['user_id']
                    ]);
                } catch (Exception $e) {
                    error_log("Failed to broadcast message deletion to WebSocket: " . $e->getMessage());
                }
                
                $this->jsonResponse([
                    'success' => true, 
                    'message' => 'Message deleted successfully'
                ]);
            } else {
                $this->jsonResponse(['success' => false, 'message' => 'Failed to delete message'], 500);
            }
        } catch (Exception $e) {
            $this->jsonResponse(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }
    
    private function broadcastToWebSocket($event, $data) {
        try {
            $client = new WebSocketClient();
            return $client->broadcast($event, $data);
        } catch (Exception $e) {
            error_log("WebSocket broadcast error: " . $e->getMessage());
            return false;
        }
    }
    
    private function formatMessage($message) {
        if (is_array($message)) {
            $formattedMessage = [
                'id' => $message['id'],
                'content' => $message['content'],
                'sent_at' => $message['sent_at'],
                'edited_at' => $message['edited_at'] ?? null,
                'message_type' => $message['message_type'] ?? 'text',
                'attachment_url' => $message['attachment_url'] ?? null,
                'reply_message_id' => $message['reply_message_id'] ?? null,
                'formatted_time' => $this->formatTime($message['sent_at']),
                'user' => [
                    'id' => $message['user_id'],
                    'username' => $message['username'] ?? 'Unknown',
                    'avatar_url' => $message['avatar_url'] ?? null
                ]
            ];
            
            return $formattedMessage;
        }
        
        $user = null;
        if (!isset($message->username)) {
            $user = $message->user();
        }
        
        return [
            'id' => $message->id,
            'content' => $message->content,
            'sent_at' => $message->sent_at,
            'formatted_time' => $message->formattedTime(),
            'edited_at' => $message->edited_at,
            'message_type' => $message->message_type ?? 'text',
            'attachment_url' => $message->attachment_url,
            'reply_message_id' => $message->reply_message_id,
            'user' => [
                'id' => $message->user_id,
                'username' => $message->username ?? ($user ? $user->username : 'Unknown'),
                'avatar_url' => $message->avatar_url ?? ($user ? $user->avatar_url : null)
            ]
        ];
    }
    
    private function formatTime($time) {
        if (empty($time)) {
            return 'Just now';
        }
        
        $sentAt = new DateTime($time);
        $now = new DateTime();
        
        $diff = $now->diff($sentAt);
        
        if ($diff->days == 0) {
            return 'Today at ' . $sentAt->format('g:i A');
        } elseif ($diff->days == 1) {
            return 'Yesterday at ' . $sentAt->format('g:i A');
        } elseif ($diff->days < 7) {
            return $sentAt->format('l') . ' at ' . $sentAt->format('g:i A');
        } else {
            return $sentAt->format('M j, Y') . ' at ' . $sentAt->format('g:i A');
        }
    }
    
    private function jsonResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
