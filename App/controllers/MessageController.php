<?php

require_once __DIR__ . '/../database/models/Message.php';
require_once __DIR__ . '/../database/models/Channel.php';
require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/../database/models/User.php';
require_once __DIR__ . '/../utils/WebSocketClient.php';
require_once __DIR__ . '/BaseController.php';

class MessageController extends BaseController {
    public function __construct() {
        parent::__construct();
        Message::initialize();
    }

    public function getMessages($channelId) {
        error_log("MessageController::getMessages called with channelId=$channelId");

        if (!isset($_SESSION['user_id'])) {
            error_log("MessageController: Unauthorized - no user_id in session");
            return $this->unauthorized();
        }

        error_log("MessageController: User authenticated with ID=" . $_SESSION['user_id']);

        $channel = Channel::find($channelId);
        if (!$channel) {
            error_log("MessageController: Channel not found with ID=$channelId");
            return $this->notFound('Channel not found');
        }

        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
        if (!$membership && $channel->server_id != 0) {
            error_log("MessageController: User " . $_SESSION['user_id'] . " is not a member of server " . $channel->server_id);
            return $this->forbidden('You are not a member of this server');
        }

        $limit = $_GET['limit'] ?? 50;
        $offset = $_GET['offset'] ?? 0;

        try {
            $messages = Message::getForChannel($channelId, $limit, $offset);

            $formattedMessages = [];
            foreach ($messages as $message) {
                $formattedMessages[] = $this->formatMessage($message);
            }

            return $this->successResponse([
                'channel_id' => $channelId,
                'messages' => $formattedMessages
            ]);
        } catch (Exception $e) {
            error_log("MessageController: Error fetching messages: " . $e->getMessage());
            return $this->serverError('Error fetching messages: ' . $e->getMessage());
        }
    }

    public function updateMessage($id) {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $message = Message::find($id);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        if ($message->user_id != $_SESSION['user_id']) {
            return $this->forbidden('You can only edit your own messages');
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            return $this->validationError(['content' => 'Invalid request data']);
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

                    return $this->successResponse([
                        'message' => $formattedMessage
                    ], 'Message updated successfully');
                } else {
                    return $this->serverError('Failed to update message');
                }
            } else {
                return $this->validationError(['content' => 'No content provided for update']);
            }
        } catch (Exception $e) {
            return $this->serverError('Server error: ' . $e->getMessage());
        }
    }

    public function deleteMessage($id) {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $message = Message::find($id);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        if ($message->user_id != $_SESSION['user_id'] && !isset($_SESSION['is_admin'])) {
            return $this->forbidden('You can only delete your own messages');
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

                return $this->successResponse([], 'Message deleted successfully');
            } else {
                return $this->serverError('Failed to delete message');
            }
        } catch (Exception $e) {
            return $this->serverError('Server error: ' . $e->getMessage());
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

    public function debugMessageStorage() {
        error_log("MessageController::debugMessageStorage called");

        try {
            $results = [];

            $query = new Query();
            $dbConnected = $query->testConnection();
            $results['db_connection'] = $dbConnected ? 'successful' : 'failed';

            if ($dbConnected) {

                $messagesTableExists = $query->tableExists('messages');
                $channelMessagesTableExists = $query->tableExists('channel_messages');

                $results['tables'] = [
                    'messages_table' => $messagesTableExists ? 'exists' : 'missing',
                    'channel_messages_table' => $channelMessagesTableExists ? 'exists' : 'missing'
                ];

                if ($messagesTableExists) {
                    $recentMessages = $query->table('messages')
                        ->orderBy('id', 'DESC')
                        ->limit(5)
                        ->get();

                    $results['recent_messages'] = $recentMessages;
                    $results['total_messages'] = $query->table('messages')->count();
                }

                try {
                    $wsClient = new WebSocketClient();
                    $wsTestResult = $wsClient->testConnection();
                    $results['websocket_connection'] = $wsTestResult ? 'successful' : 'failed';
                } catch (Exception $e) {
                    $results['websocket_connection'] = 'failed: ' . $e->getMessage();
                }

                if ($messagesTableExists && $channelMessagesTableExists) {
                    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 1;
                    $channelId = isset($_GET['channel_id']) ? $_GET['channel_id'] : 11;

                    $message = new Message();
                    $message->user_id = $userId;
                    $message->content = "Debug test message at " . date('Y-m-d H:i:s');
                    $message->sent_at = date('Y-m-d H:i:s');
                    $message->message_type = 'text';

                    $saveResult = $message->save();
                    $results['test_message_save'] = $saveResult ? 'successful' : 'failed';

                    if ($saveResult) {

                        $associateResult = $message->associateWithChannel($channelId);
                        $results['test_associate_channel'] = $associateResult ? 'successful' : 'failed';
                        $results['test_message_id'] = $message->id;

                        try {
                            $wsClient = new WebSocketClient();
                            $broadcastResult = $wsClient->sendMessage($channelId, $message->content, [
                                'userId' => $userId,
                                'username' => 'Debug User'
                            ]);
                            $results['test_websocket_broadcast'] = $broadcastResult ? 'successful' : 'failed';
                        } catch (Exception $e) {
                            $results['test_websocket_broadcast'] = 'failed: ' . $e->getMessage();
                        }
                    }
                }
            }

            return $this->successResponse($results);
        } catch (Exception $e) {
            error_log("Error in debugMessageStorage: " . $e->getMessage());
            return $this->serverError('Server error: ' . $e->getMessage());
        }
    }
}