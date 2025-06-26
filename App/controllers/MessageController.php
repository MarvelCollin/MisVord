<?php

require_once __DIR__ . '/../database/repositories/MessageRepository.php';
require_once __DIR__ . '/../database/models/MessageReaction.php';
require_once __DIR__ . '/../database/models/Message.php';
require_once __DIR__ . '/../database/query.php';
require_once __DIR__ . '/BaseController.php';

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
            $existingReaction = MessageReaction::findByMessageAndUser($messageId, $userId, $emoji);
            if ($existingReaction) {
                return $this->success(['message' => 'Reaction already exists']);
            }

            $reaction = new MessageReaction([
                'message_id' => $messageId,
                'user_id' => $userId,
                'emoji' => $emoji
            ]);

            if ($reaction->save()) {
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

                return $this->success([
                    'message_id' => $messageId,
                    'emoji' => $emoji,
                    'user_id' => $userId,
                    'username' => $username,
                'socket_event' => 'reaction-added',
                'socket_data' => [
                    'message_id' => $messageId,
                    'user_id' => $userId,
                        'username' => $username,
                        'emoji' => $emoji,
                        'target_type' => $targetType,
                        'target_id' => $targetId
                ],
                'client_should_emit_socket' => true
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
                'socket_event' => 'reaction-removed',
                'socket_data' => [
                    'message_id' => $messageId,
                    'user_id' => $userId,
                        'username' => $username,
                        'emoji' => $emoji,
                        'target_type' => $targetType,
                        'target_id' => $targetId
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

        $message = $this->messageRepository->find($messageId);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        try {
            return $this->success([
                'message_id' => $messageId,
                'socket_event' => 'message-pinned',
                'socket_data' => [
                'message_id' => $messageId,
                'user_id' => $userId
                ],
                'client_should_emit_socket' => true
            ], 'Message pinned successfully');
        } catch (Exception $e) {
            return $this->serverError('Failed to pin message');
        }
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
