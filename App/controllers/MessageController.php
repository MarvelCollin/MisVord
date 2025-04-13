<?php

require_once __DIR__ . '/../database/models/Message.php';
require_once __DIR__ . '/../database/models/Channel.php';
require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/../database/models/User.php';

class MessageController {
    /**
     * Constructor - ensure session is started
     */
    public function __construct() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        // Initialize database tables if needed
        Message::initialize();
    }
    
    /**
     * Get messages for a channel
     * 
     * @param int $channelId Channel ID
     * @return void
     */
    public function getMessages($channelId) {
        // Debug output at the beginning
        error_log("MessageController::getMessages called with channelId=$channelId");
        
        // Check if user is authenticated
        if (!isset($_SESSION['user_id'])) {
            error_log("MessageController: Unauthorized - no user_id in session");
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }
        
        error_log("MessageController: User authenticated with ID=" . $_SESSION['user_id']);
        
        // Find channel
        $channel = Channel::find($channelId);
        if (!$channel) {
            error_log("MessageController: Channel not found with ID=$channelId");
            $this->jsonResponse(['success' => false, 'message' => 'Channel not found'], 404);
            return;
        }
        
        // Check if user is a member of the server
        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
        if (!$membership && $channel->server_id != 0) { // Allow access to server_id 0 (DMs/global channels)
            error_log("MessageController: User " . $_SESSION['user_id'] . " is not a member of server " . $channel->server_id);
            $this->jsonResponse(['success' => false, 'message' => 'You are not a member of this server'], 403);
            return;
        }
        
        // Get messages for this channel with pagination
        $limit = $_GET['limit'] ?? 50;
        $offset = $_GET['offset'] ?? 0;
        
        try {
            $messages = Message::getForChannel($channelId, $limit, $offset);
            
            // Format messages
            $formattedMessages = [];
            foreach ($messages as $message) {
                $formattedMessages[] = $this->formatMessage($message);
            }
            
            // Return success response with messages
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
    
    /**
     * Create a new message in a channel
     * 
     * @param int $channelId Channel ID
     * @return void
     */
    public function createMessage($channelId) {
        error_log("MessageController::createMessage called with channelId=$channelId");
        
        // Check if user is authenticated
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }
        
        // Find channel
        $channel = Channel::find($channelId);
        if (!$channel) {
            error_log("MessageController: Channel not found with ID=$channelId");
            $this->jsonResponse(['success' => false, 'message' => 'Channel not found'], 404);
            return;
        }
        
        // Check if user is a member of the server
        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
        if (!$membership && $channel->server_id != 0) { // Allow access to server_id 0 (DMs/global channels)
            $this->jsonResponse(['success' => false, 'message' => 'You are not a member of this server'], 403);
            return;
        }
        
        // Get request data - improved error handling for JSON parsing
        $rawInput = file_get_contents('php://input');
        $data = null;
        
        // Only try to decode if we have input
        if (!empty($rawInput)) {
            try {
                $data = json_decode($rawInput, true, 512, JSON_THROW_ON_ERROR);
            } catch (Exception $e) {
                error_log("JSON parse error: " . $e->getMessage() . " - Raw input: " . substr($rawInput, 0, 100));
                $this->jsonResponse(['success' => false, 'message' => 'Invalid JSON data'], 400);
                return;
            }
        }
        
        // If JSON parsing failed or no input was provided
        if ($data === null) {
            // Try to get data from POST instead
            $data = $_POST;
        }
        
        error_log("MessageController: Received data: " . json_encode($data));
        
        // Validate required fields
        if (empty($data['content'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Message content is required'], 400);
            return;
        }
        
        // Create the message
        try {
            // Ensure the messages table exists
            Message::initialize();
            
            $message = new Message();
            $message->user_id = $_SESSION['user_id'];
            $message->content = $data['content'];
            $message->sent_at = date('Y-m-d H:i:s');
            $message->message_type = 'text';
            $message->attachment_url = $data['attachment_url'] ?? null;
            $message->reply_message_id = $data['reply_message_id'] ?? null;
            
            // Save message
            if (!$message->save()) {
                error_log("MessageController: Failed to save message");
                $this->jsonResponse(['success' => false, 'message' => 'Failed to create message'], 500);
                return;
            }
            
            error_log("MessageController: Message saved with ID=" . $message->id);
            
            // Associate message with channel
            if (!$message->associateWithChannel($channelId)) {
                // If association fails, delete the message
                error_log("MessageController: Failed to associate message with channel");
                $message->delete();
                $this->jsonResponse(['success' => false, 'message' => 'Failed to associate message with channel'], 500);
                return;
            }
            
            // Get the user for the response
            $user = User::find($_SESSION['user_id']);
            if ($user) {
                $message->username = $user->username;
                $message->avatar_url = $user->avatar_url;
            }
            
            // Return success response with created message
            $this->jsonResponse([
                'success' => true, 
                'message' => 'Message sent successfully',
                'data' => $this->formatMessage($message)
            ]);
        } catch (Exception $e) {
            error_log("Error creating message: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            $this->jsonResponse(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Format message data for API response
     * 
     * @param Message|array $message
     * @return array
     */
    private function formatMessage($message) {
        // Handle if message is already an array
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
        
        // Get associated user if needed
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
    
    /**
     * Format time to human readable
     * 
     * @param string $time
     * @return string
     */
    private function formatTime($time) {
        if (empty($time)) {
            return 'Just now';
        }
        
        $sentAt = new DateTime($time);
        $now = new DateTime();
        
        $diff = $now->diff($sentAt);
        
        if ($diff->days == 0) {
            // Today
            return 'Today at ' . $sentAt->format('g:i A');
        } elseif ($diff->days == 1) {
            // Yesterday
            return 'Yesterday at ' . $sentAt->format('g:i A');
        } elseif ($diff->days < 7) {
            // This week
            return $sentAt->format('l') . ' at ' . $sentAt->format('g:i A');
        } else {
            // More than a week ago
            return $sentAt->format('M j, Y') . ' at ' . $sentAt->format('g:i A');
        }
    }
    
    /**
     * Send JSON response
     * 
     * @param array $data
     * @param int $status
     * @return void
     */
    private function jsonResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
