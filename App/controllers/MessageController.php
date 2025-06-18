<?php

require_once __DIR__ . '/../database/repositories/MessageRepository.php';
require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/../utils/WebSocketClient.php';
require_once __DIR__ . '/BaseController.php';

class MessageController extends BaseController {
    
    private $messageRepository;
    private $channelRepository;
    private $userServerMembershipRepository;
    private $userRepository;
    
    public function __construct() {
        parent::__construct();
        $this->messageRepository = new MessageRepository();
        $this->channelRepository = new ChannelRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
        $this->userRepository = new UserRepository();
    }

    /**
     * Get messages for a channel
     */    public function getMessages($channelId) {
        $this->requireAuth();

        $channel = $this->channelRepository->find($channelId);
        if (!$channel) {
            return $this->notFound('Channel not found');
        }        // Check if user has access to this channel
        if ($channel->server_id != 0) {
            $membership = $this->userServerMembershipRepository->findByUserAndServer($this->getCurrentUserId(), $channel->server_id);
            if (!$membership) {
                return $this->forbidden('You are not a member of this server');
            }
        }

        $limit = $_GET['limit'] ?? 50;
        $offset = $_GET['offset'] ?? 0;

        try {
            $messages = $this->messageRepository->getForChannel($channelId, $limit, $offset);
            $formattedMessages = array_map([$this, 'formatMessage'], $messages);

            $this->logActivity('messages_loaded', [
                'channel_id' => $channelId,
                'message_count' => count($messages)
            ]);

            return $this->success([
                'channel_id' => $channelId,
                'messages' => $formattedMessages,
                'has_more' => count($messages) == $limit
            ]);
        } catch (Exception $e) {
            $this->logActivity('messages_load_error', [
                'channel_id' => $channelId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load messages');
        }
    }

    /**
     * Send a new message
     */
    public function send() {
        $this->requireAuth();
        
        $input = $this->getInput();
        $input = $this->sanitize($input);
        
        // Validate input
        $this->validate($input, [
            'channel_id' => 'required',
            'content' => 'required'
        ]);

        $channelId = $input['channel_id'];
        $content = trim($input['content']);

        if (empty($content)) {
            return $this->validationError(['content' => 'Message content cannot be empty']);
        }        // Check if channel exists and user has access
        $channel = $this->channelRepository->find($channelId);
        if (!$channel) {
            return $this->notFound('Channel not found');        }

        if ($channel->server_id != 0) {
            $membership = $this->userServerMembershipRepository->findByUserAndServer($this->getCurrentUserId(), $channel->server_id);
            if (!$membership) {
                return $this->forbidden('You are not a member of this server');
            }
        }

        try {
            $message = new Message();
            $message->content = $content;
            $message->channel_id = $channelId;
            $message->user_id = $this->getCurrentUserId();
            $message->type = 'text';
            
            if ($message->save()) {
                $formattedMessage = $this->formatMessage($message);
                
                // Send real-time notification via WebSocket
                $this->sendWebSocketNotification([
                    'type' => 'new_message',
                    'channel_id' => $channelId,
                    'message' => $formattedMessage
                ]);
                
                $this->logActivity('message_sent', [
                    'message_id' => $message->id,
                    'channel_id' => $channelId
                ]);

                return $this->success([
                    'message' => $formattedMessage
                ], 'Message sent successfully');
            } else {
                throw new Exception('Failed to save message');
            }
        } catch (Exception $e) {
            $this->logActivity('message_send_error', [
                'channel_id' => $channelId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to send message');
        }
    }

    /**
     * Update a message
     */    public function update($id) {
        $this->requireAuth();
        
        $message = $this->messageRepository->find($id);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        // Check if user owns the message
        if ($message->user_id != $this->getCurrentUserId()) {
            return $this->forbidden('You can only edit your own messages');
        }

        $input = $this->getInput();
        $input = $this->sanitize($input);
        
        $this->validate($input, ['content' => 'required']);
        
        $content = trim($input['content']);
        if (empty($content)) {
            return $this->validationError(['content' => 'Message content cannot be empty']);
        }

        try {
            $message->content = $content;
            $message->edited_at = date('Y-m-d H:i:s');
            
            if ($message->save()) {
                $formattedMessage = $this->formatMessage($message);
                
                // Send real-time notification via WebSocket
                $this->sendWebSocketNotification([
                    'type' => 'message_updated',
                    'channel_id' => $message->channel_id,
                    'message' => $formattedMessage
                ]);
                
                $this->logActivity('message_updated', [
                    'message_id' => $id
                ]);

                return $this->success([
                    'message' => $formattedMessage
                ], 'Message updated successfully');
            } else {
                throw new Exception('Failed to update message');
            }
        } catch (Exception $e) {
            $this->logActivity('message_update_error', [
                'message_id' => $id,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to update message');
        }
    }

    /**
     * Delete a message
     */
    public function delete($id) {        $this->requireAuth();
        
        $message = $this->messageRepository->find($id);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        // Check if user owns the message or has admin permissions
        if ($message->user_id != $this->getCurrentUserId() && !$this->canDeleteMessage($message)) {
            return $this->forbidden('You can only delete your own messages');
        }

        try {
            // For now, mark as deleted instead of hard delete to preserve conversation flow
            $message->content = '[deleted]';
            $message->deleted_at = date('Y-m-d H:i:s');
            
            if ($message->save()) {
                // Send real-time notification via WebSocket
                $this->sendWebSocketNotification([
                    'type' => 'message_deleted',
                    'channel_id' => $message->channel_id,
                    'message_id' => $id
                ]);
                
                $this->logActivity('message_deleted', [
                    'message_id' => $id
                ]);

                return $this->success(null, 'Message deleted successfully');
            } else {
                throw new Exception('Failed to delete message');
            }
        } catch (Exception $e) {
            $this->logActivity('message_delete_error', [
                'message_id' => $id,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to delete message');
        }
    }

    /**
     * Search messages in a channel
     */
    public function search($channelId) {        $this->requireAuth();
        
        $channel = $this->channelRepository->find($channelId);
        if (!$channel) {
            return $this->notFound('Channel not found');
        }

        // Check access
        if ($channel->server_id != 0) {
            $membership = $this->userServerMembershipRepository->findByUserAndServer($this->getCurrentUserId(), $channel->server_id);
            if (!$membership) {
                return $this->forbidden('You are not a member of this server');
            }
        }$searchQuery = $_GET['q'] ?? '';
        if (empty($searchQuery)) {
            return $this->validationError(['q' => 'Search query is required']);
        }        try {
            $messages = $this->messageRepository->searchInChannel($channelId, $searchQuery, 50);
            
            $formattedMessages = array_map([$this, 'formatMessage'], $messages);

            $this->logActivity('messages_searched', [
                'channel_id' => $channelId,
                'query' => $searchQuery,
                'result_count' => count($messages)
            ]);

            return $this->success([
                'channel_id' => $channelId,
                'query' => $searchQuery,
                'messages' => $formattedMessages
            ]);
        } catch (Exception $e) {
            $this->logActivity('message_search_error', [
                'channel_id' => $channelId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to search messages');
        }
    }

    /**
     * Format message data for API response
     */
    private function formatMessage($message) {
        // Get user information
        $user = $this->userRepository->find($message->user_id);
        
        return [
            'id' => $message->id,
            'content' => $message->content,
            'channel_id' => $message->channel_id,
            'user_id' => $message->user_id,
            'user' => $user ? [
                'id' => $user->id,
                'username' => $user->username,
                'avatar_url' => $user->avatar_url
            ] : null,
            'type' => $message->type ?? 'text',
            'created_at' => $message->created_at,
            'updated_at' => $message->updated_at,
            'edited_at' => $message->edited_at ?? null,
            'deleted_at' => $message->deleted_at ?? null
        ];
    }    /**
     * Send WebSocket notification
     */
    private function sendWebSocketNotification($data) {
        try {
            $wsClient = new WebSocketClient();
            // TODO: Implement proper send method in WebSocketClient
            // For now, just log the notification
            $this->logActivity('websocket_notification', $data);
        } catch (Exception $e) {
            // Log but don't fail the request
            $this->logActivity('websocket_error', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
        }
    }

    /**
     * Check if user can delete a message (admin permissions)
     */
    private function canDeleteMessage($message) {
        // TODO: Implement role-based permissions
        // For now, only message owner can delete
        return false;
    }

    /**
     * Debug message storage (development only)
     */
    public function debugMessageStorage() {
        // Only allow in development
        if (EnvLoader::get('APP_ENV') === 'production') {
            return $this->forbidden('Debug methods not allowed in production');
        }

        $this->requireAuth();        try {
            $recentMessages = $this->messageRepository->getRecentMessages(10);
            
            $this->logActivity('debug_message_storage_accessed');            return $this->success([
                'stats' => [
                    'total_messages' => 'N/A',
                    'channel_messages' => 'N/A', 
                    'recent_messages' => count($recentMessages),
                    'user_message_count' => 'N/A'
                ],
                'recent_messages' => $recentMessages,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            $this->logActivity('debug_message_storage_error', [
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to retrieve debug information');
        }
    }
}