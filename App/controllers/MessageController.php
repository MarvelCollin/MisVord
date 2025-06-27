<?php

require_once __DIR__ . '/../database/repositories/MessageRepository.php';
require_once __DIR__ . '/../database/models/MessageReaction.php';
require_once __DIR__ . '/../database/models/Message.php';
require_once __DIR__ . '/../database/query.php';
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../utils/SocketBroadcaster.php';

class MessageController extends BaseController
{
    private $messageRepository;

    public function __construct()
    {
        parent::__construct();
        $this->messageRepository = new MessageRepository();
    }

    public function addReaction($messageId)
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        $username = $_SESSION['username'] ?? 'Unknown User';

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, ['emoji' => 'required']);

        $emoji = $input['emoji'];
        $message = $this->messageRepository->find($messageId);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        try {
            // Find target info first
            require_once __DIR__ . '/../database/models/ChannelMessage.php';
            
            $targetId = null;
            $targetType = 'channel';
            
            $channelMessage = ChannelMessage::findByMessageId($messageId);
            if ($channelMessage) {
                $targetId = $channelMessage->channel_id;
                $targetType = 'channel';
            } else {
                $query = new Query();
                $chatRoomMessage = $query->table('chat_room_messages')
                    ->where('message_id', $messageId)
                    ->first();
                if ($chatRoomMessage) {
                    $targetId = $chatRoomMessage['room_id'];
                    $targetType = 'dm';
                }
            }

            if (!$targetId) {
                return $this->serverError('Could not determine message target');
            }

            // Check if reaction already exists (toggle behavior)
            $existingReaction = MessageReaction::findByMessageAndUser($messageId, $userId, $emoji);
            if ($existingReaction) {
                if ($existingReaction->delete()) {
                    $socketData = [
                        'message_id' => $messageId,
                        'user_id' => $userId,
                        'username' => $username,
                        'emoji' => $emoji,
                        'target_type' => $targetType,
                        'target_id' => $targetId,
                        'action' => 'removed',
                        'source' => 'server-originated'
                    ];
                    
                    SocketBroadcaster::broadcastMessage($targetType, $targetId, 'reaction-removed', $socketData);
                    
                    return $this->success([
                        'message_id' => $messageId,
                        'emoji' => $emoji,
                        'user_id' => $userId,
                        'username' => $username,
                        'target_type' => $targetType,
                        'target_id' => $targetId,
                        'action' => 'removed',
                        'socket_event' => 'reaction-removed',
                        'socket_data' => $socketData,
                        'client_should_emit_socket' => false
                    ], 'Reaction removed successfully');
                } else {
                    return $this->serverError('Failed to remove reaction');
                }
            }

            // Add new reaction
            $reaction = new MessageReaction([
                'message_id' => $messageId,
                'user_id' => $userId,
                'emoji' => $emoji
            ]);

            if ($reaction->save()) {
                // Broadcast reaction to socket server
                $socketData = [
                    'message_id' => $messageId,
                    'user_id' => $userId,
                    'username' => $username,
                    'emoji' => $emoji,
                    'target_type' => $targetType,
                    'target_id' => $targetId,
                    'action' => 'added',
                    'source' => 'server-originated'
                ];
                
                SocketBroadcaster::broadcastMessage($targetType, $targetId, 'reaction-added', $socketData);
                
                return $this->success([
                    'message_id' => $messageId,
                    'emoji' => $emoji,
                    'user_id' => $userId,
                    'username' => $username,
                    'target_type' => $targetType,
                    'target_id' => $targetId,
                    'action' => 'added',
                    'socket_event' => 'reaction-added',
                    'socket_data' => $socketData,
                    'client_should_emit_socket' => false
                ], 'Reaction added successfully');
            } else {
                throw new Exception('Failed to save reaction');
            }
        } catch (Exception $e) {
            return $this->serverError('Failed to add reaction: ' . $e->getMessage());
        }
    }

    public function removeReaction($messageId)
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        $username = $_SESSION['username'] ?? 'Unknown User';

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, ['emoji' => 'required']);

        $emoji = $input['emoji'];

        $message = $this->messageRepository->find($messageId);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        try {
            $reaction = MessageReaction::findByMessageAndUser($messageId, $userId, $emoji);
            
            if (!$reaction) {
                return $this->notFound('Reaction not found');
            }

            require_once __DIR__ . '/../database/models/ChannelMessage.php';
            
            $targetId = null;
            $targetType = 'channel';
            
            $channelMessage = ChannelMessage::findByMessageId($messageId);
            if ($channelMessage) {
                $targetId = $channelMessage->channel_id;
                $targetType = 'channel';
            } else {
                $query = new Query();
                $chatRoomMessage = $query->table('chat_room_messages')
                    ->where('message_id', $messageId)
                    ->first();
                if ($chatRoomMessage) {
                    $targetId = $chatRoomMessage['room_id'];
                    $targetType = 'dm';
                }
            }

            if ($reaction->delete()) {
            return $this->success([
                'message_id' => $messageId,
                'emoji' => $emoji,
                'user_id' => $userId,
                'username' => $username,
                'target_type' => $targetType,
                'target_id' => $targetId,
                'action' => 'removed',
                'socket_event' => 'reaction-removed',
                'socket_data' => [
                    'message_id' => $messageId,
                    'user_id' => $userId,
                    'username' => $username,
                    'emoji' => $emoji,
                    'target_type' => $targetType,
                    'target_id' => $targetId,
                    'action' => 'removed'
                ],
                'client_should_emit_socket' => true
            ], 'Reaction removed successfully');
            } else {
                throw new Exception('Failed to remove reaction');
            }
        } catch (Exception $e) {
            return $this->serverError('Failed to remove reaction: ' . $e->getMessage());
        }
    }

    public function getReactions($messageId)
    {
        $this->requireAuth();

        $message = $this->messageRepository->find($messageId);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        try {
            $reactions = MessageReaction::getForMessage($messageId);
            
            $formattedReactions = [];
            foreach ($reactions as $reaction) {
                $user = $this->getUserRepository()->find($reaction->user_id);
                $formattedReactions[] = [
                    'emoji' => $reaction->emoji,
                    'user_id' => $reaction->user_id,
                    'username' => $user ? $user->username : 'Unknown User'
                ];
            }
            
            return $this->success([
                'message_id' => $messageId,
                'reactions' => $formattedReactions
            ]);
        } catch (Exception $e) {
            return $this->serverError('Failed to get reactions: ' . $e->getMessage());
        }
    }

    public function pinMessage($messageId)
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        $username = $_SESSION['username'] ?? 'Unknown User';

        $message = $this->messageRepository->find($messageId);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        try {
            // Find target info
            require_once __DIR__ . '/../database/models/ChannelMessage.php';
            require_once __DIR__ . '/../database/models/PinnedMessage.php';
            
            $targetId = null;
            $targetType = 'channel';
            
            $channelMessage = ChannelMessage::findByMessageId($messageId);
            if ($channelMessage) {
                $targetId = $channelMessage->channel_id;
                $targetType = 'channel';
            } else {
                $query = new Query();
                $chatRoomMessage = $query->table('chat_room_messages')
                    ->where('message_id', $messageId)
                    ->first();
                if ($chatRoomMessage) {
                    $targetId = $chatRoomMessage['room_id'];
                    $targetType = 'dm';
                }
            }

            if (!$targetId) {
                return $this->serverError('Could not determine message target');
            }

            // Check if message is already pinned
            $query = new Query();
            $existingPin = $query->table('pinned_messages')
                ->where('message_id', $messageId)
                ->first();

            if ($existingPin) {
                // Unpin message
                $query->table('pinned_messages')
                    ->where('message_id', $messageId)
                    ->delete();

                // Broadcast unpin to socket server
                $socketData = [
                    'message_id' => $messageId,
                    'user_id' => $userId,
                    'username' => $username,
                    'target_type' => $targetType,
                    'target_id' => $targetId,
                    'action' => 'unpinned',
                    'source' => 'server-originated'
                ];
                
                SocketBroadcaster::broadcastMessage($targetType, $targetId, 'message-unpinned', $socketData);

                return $this->success([
                    'message_id' => $messageId,
                    'action' => 'unpinned',
                    'target_type' => $targetType,
                    'target_id' => $targetId,
                    'socket_event' => 'message-unpinned',
                    'socket_data' => $socketData,
                    'client_should_emit_socket' => false
                ], 'Message unpinned successfully');
            } else {
                // Pin message
                $pinId = $query->table('pinned_messages')->insert([
                    'message_id' => $messageId,
                    'pinned_by' => $userId,
                    'pinned_at' => date('Y-m-d H:i:s'),
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);

                if ($pinId) {
                    // Broadcast pin to socket server
                    $socketData = [
                        'message_id' => $messageId,
                        'user_id' => $userId,
                        'username' => $username,
                        'target_type' => $targetType,
                        'target_id' => $targetId,
                        'action' => 'pinned',
                        'message' => $this->formatMessageForPin($message),
                        'source' => 'server-originated'
                    ];
                    
                    SocketBroadcaster::broadcastMessage($targetType, $targetId, 'message-pinned', $socketData);
                    
                    return $this->success([
                        'message_id' => $messageId,
                        'action' => 'pinned',
                        'target_type' => $targetType,
                        'target_id' => $targetId,
                        'socket_event' => 'message-pinned',
                        'socket_data' => $socketData,
                        'client_should_emit_socket' => false
                    ], 'Message pinned successfully');
                } else {
                    return $this->serverError('Failed to save pin');
                }
            }
        } catch (Exception $e) {
            return $this->serverError('Failed to pin message: ' . $e->getMessage());
        }
    }

    private function formatMessageForPin($message)
    {
        $user = $this->getUserRepository()->find($message->user_id);
        return [
            'id' => $message->id,
            'content' => $message->content,
            'user_id' => $message->user_id,
            'username' => $user ? $user->username : 'Unknown User',
            'avatar_url' => $user && $user->avatar_url ? $user->avatar_url : '/public/assets/common/main-logo.png',
            'sent_at' => $message->sent_at,
            'message_type' => $message->message_type ?? 'text'
        ];
    }

    public function debugMessageStorage()
    {
        if (EnvLoader::get('APP_ENV') === 'production') {
            return $this->forbidden('Debug methods not allowed in production');
        }

        $this->requireAuth();
        try {
            $recentMessages = $this->messageRepository->getRecentMessages(10);

            return $this->success([
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
            return $this->serverError('Failed to retrieve debug information');
        }
    }

    private function getUserRepository() {
        require_once __DIR__ . '/../database/repositories/UserRepository.php';
        return new UserRepository();
    }
}
