<?php

require_once __DIR__ . '/../database/repositories/MessageRepository.php';
require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
require_once __DIR__ . '/../database/repositories/ChannelMessageRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/models/MessageReaction.php';
require_once __DIR__ . '/../database/models/Message.php';
require_once __DIR__ . '/../database/query.php';
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../exceptions/ValidationException.php';


class MessageController extends BaseController
{
    private $messageRepository;
    private $channelRepository;
    private $channelMessageRepository;
    private $membershipRepository;

    public function __construct()
    {
        parent::__construct();
        $this->messageRepository = new MessageRepository();
        $this->channelRepository = new ChannelRepository();
        $this->channelMessageRepository = new ChannelMessageRepository();
        $this->membershipRepository = new UserServerMembershipRepository();
    }

    public function getMessages($channelId = null)
    {
        $this->requireAuth();

        // Get chatType and targetId from parameters or from the request body
        $input = $this->getInput();
        
        // Check if this is a direct call with specific chatType (e.g. from chat-api.js)
        $chatType = $_GET['chat_type'] ?? null;
        
        // If no chat_type, assume it's a channel request
        if (!$chatType) {
            $chatType = 'channel';
        }
        
        // Use provided channelId or get it from input
        $targetId = $channelId;
        if (!$targetId) {
            $targetId = $input['channel_id'] ?? $input['target_id'] ?? null;
        }

        // Check if we have a target ID
        if (!$targetId) {
            return $this->validationError(['target_id' => 'Target ID is required']);
        }
        
        try {
            // Set pagination parameters
            $limit = $_GET['limit'] ?? 50;
            $offset = $_GET['offset'] ?? 0;
            
            // Log the request for debugging
            error_log("MessageController::getMessages - chatType: $chatType, targetId: $targetId, limit: $limit, offset: $offset");
            
            if ($chatType === 'channel') {
                return $this->getChannelMessages($targetId, $limit, $offset);
            } else if ($chatType === 'dm' || $chatType === 'direct') {
                return $this->getDirectMessages($targetId, $limit, $offset);
            } else {
                return $this->validationError(['chat_type' => 'Invalid chat type']);
            }
        } catch (Exception $e) {
            error_log("Error in MessageController::getMessages: " . $e->getMessage());
            return $this->serverError('Failed to load messages: ' . $e->getMessage());
        }
    }
    
    private function getChannelMessages($channelId, $limit = 50, $offset = 0)
    {
        $userId = $this->getCurrentUserId();
        
        try {
            // Verify channel exists
            $channel = $this->channelRepository->find($channelId);
            if (!$channel) {
                return $this->notFound('Channel not found');
            }
            
            // Check if user has access to this channel
            if ($channel->server_id != 0) {
                if (!$this->membershipRepository->isMember($userId, $channel->server_id)) {
                    return $this->forbidden('You do not have access to this channel');
                }
            }
            
            // Retrieve messages
            $messages = $this->channelMessageRepository->getMessagesByChannelId($channelId, $limit, $offset);
            
            // Log activity
            $this->logActivity('channel_messages_viewed', [
                'channel_id' => $channelId,
                'message_count' => count($messages)
            ]);
            
            // Return successful response
            return $this->success([
                'messages' => $messages,
                'channel_id' => $channelId,
                'total' => count($messages),
                'has_more' => count($messages) >= $limit
            ]);
        } catch (Exception $e) {
            error_log("Error in MessageController::getChannelMessages: " . $e->getMessage());
            return $this->serverError('Failed to load channel messages');
        }
    }
    
    private function getDirectMessages($roomId, $limit = 50, $offset = 0)
    {
        $userId = $this->getCurrentUserId();
        
        try {
            // Check if user is part of this chat room
            require_once __DIR__ . '/../database/repositories/ChatRoomRepository.php';
            $chatRoomRepository = new ChatRoomRepository();
            
            if (!$chatRoomRepository->isParticipant($roomId, $userId)) {
                return $this->forbidden('You are not a participant in this chat');
            }
            
            // Retrieve messages
            require_once __DIR__ . '/../database/repositories/ChatRoomMessageRepository.php';
            $chatRoomMessageRepository = new ChatRoomMessageRepository();
            $messages = $chatRoomMessageRepository->getMessagesByRoomId($roomId, $limit, $offset);
            
            // Return successful response
            return $this->success([
                'messages' => $messages,
                'room_id' => $roomId,
                'total' => count($messages),
                'has_more' => count($messages) >= $limit
            ]);
        } catch (Exception $e) {
            error_log("Error in MessageController::getDirectMessages: " . $e->getMessage());
            return $this->serverError('Failed to load direct messages');
        }
    }

    public function sendMessage($channelId = null)
    {
        $this->requireAuth();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        if ($channelId) {
            $input['channel_id'] = $channelId;
        }

        $this->validate($input, [
            'channel_id' => 'required',
            'content' => 'required'
        ]);

        $targetId = $input['channel_id'];
        $content = trim($input['content']);
        $userId = $this->getCurrentUserId();
        $messageType = $input['message_type'] ?? 'text';
        $attachmentUrl = $input['attachment_url'] ?? null;
        $mentions = $input['mentions'] ?? [];
        $replyMessageId = $input['reply_message_id'] ?? null;

        try {
            $channel = $this->channelRepository->find($targetId);
            if (!$channel) {
                return $this->notFound('Channel not found');
            }

            if ($channel->server_id != 0) {
                $membership = $this->membershipRepository->findByUserAndServer($userId, $channel->server_id);
                if (!$membership) {
                    return $this->forbidden('You are not a member of this server');
                }
            }

            $query = new Query();
            $query->beginTransaction();
            
            $messageData = [
                'content' => $content,
                'user_id' => $userId,
                'message_type' => $messageType,
                'attachment_url' => $attachmentUrl,
                'sent_at' => indonesiaTime(),
                'created_at' => indonesiaTime(),
                'updated_at' => indonesiaTime()
            ];
            
            if ($replyMessageId) {
                $repliedMessage = $this->messageRepository->find($replyMessageId);
                if ($repliedMessage) {
                    $messageData['reply_message_id'] = $replyMessageId;
                }
            }

            $message = $this->messageRepository->create($messageData);

            if ($message && isset($message->id)) {
                $this->channelMessageRepository->addMessageToChannel($targetId, $message->id);
                
                require_once __DIR__ . '/../database/repositories/UserRepository.php';
                $userRepository = new UserRepository();
                $user = $userRepository->find($userId);
                
                $formattedMessage = [
                    'id' => $message->id,
                    'content' => $message->content,
                    'user_id' => $message->user_id,
                    'username' => $user ? $user->username : ($_SESSION['username'] ?? 'Unknown'),
                    'avatar_url' => $user && $user->avatar_url ? $user->avatar_url : '/public/assets/common/default-profile-picture.png',
                    'sent_at' => $message->sent_at,
                    'edited_at' => $message->edited_at,
                    'type' => $message->message_type ?? 'text',
                    'message_type' => $message->message_type ?? 'text',
                    'attachment_url' => $message->attachment_url,
                    'has_reactions' => false,
                    'reaction_count' => 0,
                    'reactions' => []
                ];
                
                if ($message->reply_message_id) {
                    $repliedMessage = $this->messageRepository->find($message->reply_message_id);
                    if ($repliedMessage) {
                        $repliedUser = $userRepository->find($repliedMessage->user_id);
                        $formattedMessage['reply_message_id'] = $message->reply_message_id;
                        $formattedMessage['reply_data'] = [
                            'message_id' => $message->reply_message_id,
                            'content' => $repliedMessage->content,
                            'user_id' => $repliedMessage->user_id,
                            'username' => $repliedUser ? $repliedUser->username : 'Unknown',
                            'avatar_url' => $repliedUser && $repliedUser->avatar_url ? $repliedUser->avatar_url : '/public/assets/common/default-profile-picture.png'
                        ];
                    }
                }

                if (!empty($mentions)) {
                    $formattedMessage['mentions'] = $mentions;
                }

                $query->commit();
                
                return $this->success([
                    'success' => true,
                    'data' => [
                        'message' => $formattedMessage,
                        'channel_id' => $targetId
                    ]
                ], 'Message sent successfully');
            } else {
                $query->rollback();
                throw new Exception('Failed to save message');
            }
        } catch (Exception $e) {
            if (isset($query)) {
                $query->rollback();
            }
            error_log('Channel message send error: ' . $e->getMessage());
            return $this->serverError('Failed to send message');
        }
    }

    public function addReaction($messageId)
    {
        $socketUserId = $_SERVER['HTTP_X_SOCKET_USER_ID'] ?? null;
        $socketUsername = $_SERVER['HTTP_X_SOCKET_USERNAME'] ?? null;
        
        if ($socketUserId && $socketUsername) {
            $userId = $socketUserId;
            $username = $socketUsername;
            
            $user = $this->getUserRepository()->find($userId);
            if (!$user) {
                return $this->unauthorized('Invalid user');
            }
            
            error_log("Socket reaction: User $userId ($username) authenticated via headers");
        } else {
            $this->requireAuth();
            $userId = $this->getCurrentUserId();
            $username = $_SESSION['username'] ?? 'Unknown User';
            
            error_log("Web reaction: User $userId ($username) authenticated via session");
        }

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
                    return $this->success([
                        'data' => [
                        'message_id' => $messageId,
                        'emoji' => $emoji,
                        'user_id' => $userId,
                        'username' => $username,
                        'target_type' => $targetType,
                        'target_id' => $targetId,
                            'action' => 'removed'
                        ]
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
                return $this->success([
                    'data' => [
                        'message_id' => $messageId,
                        'emoji' => $emoji,
                        'user_id' => $userId,
                        'username' => $username,
                        'target_type' => $targetType,
                        'target_id' => $targetId,
                        'action' => 'added'
                    ]
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
        $socketUserId = $_SERVER['HTTP_X_SOCKET_USER_ID'] ?? null;
        $socketUsername = $_SERVER['HTTP_X_SOCKET_USERNAME'] ?? null;
        
        if ($socketUserId && $socketUsername) {
            $userId = $socketUserId;
            $username = $socketUsername;
            
            $user = $this->getUserRepository()->find($userId);
            if (!$user) {
                return $this->unauthorized('Invalid user');
            }
            
            error_log("Socket reaction removal: User $userId ($username) authenticated via headers");
        } else {
            $this->requireAuth();
            $userId = $this->getCurrentUserId();
            $username = $_SESSION['username'] ?? 'Unknown User';
            
            error_log("Web reaction removal: User $userId ($username) authenticated via session");
        }

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
                    'data' => [
                        'message_id' => $messageId,
                        'emoji' => $emoji,
                        'user_id' => $userId,
                        'username' => $username,
                        'target_type' => $targetType,
                        'target_id' => $targetId,
                        'action' => 'removed'
                    ]
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
        $socketUserId = $_SERVER['HTTP_X_SOCKET_USER_ID'] ?? null;
        $socketUsername = $_SERVER['HTTP_X_SOCKET_USERNAME'] ?? null;
        
        if ($socketUserId && $socketUsername) {
            $user = $this->getUserRepository()->find($socketUserId);
            if (!$user) {
                return $this->unauthorized('Invalid user');
            }
            error_log("Socket get reactions: User $socketUserId authenticated via headers");
        } else {
            $this->requireAuth();
            error_log("Web get reactions: User authenticated via session");
        }

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
                    'username' => $user ? $user->username : 'Unknown User',
                    'avatar_url' => $user && $user->avatar_url ? $user->avatar_url : '/public/assets/common/default-profile-picture.png'
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

            $query = new Query();
            $existingPin = $query->table('pinned_messages')
                ->where('message_id', $messageId)
                ->first();

            if ($existingPin) {
                $query->table('pinned_messages')
                    ->where('message_id', $messageId)
                    ->delete();

                return $this->success([
                    'data' => [
                    'message_id' => $messageId,
                    'action' => 'unpinned',
                    'target_type' => $targetType,
                        'target_id' => $targetId
                    ]
                ], 'Message unpinned successfully');
            } else {
                // Pin message
                $pinId = $query->table('pinned_messages')->insert([
                    'message_id' => $messageId,
                    'pinned_by' => $userId,
                    'pinned_at' => indonesiaTime(),
                    'created_at' => indonesiaTime(),
                    'updated_at' => indonesiaTime()
                ]);

                if ($pinId) {
                    return $this->success([
                        'data' => [
                        'message_id' => $messageId,
                        'action' => 'pinned',
                        'target_type' => $targetType,
                        'target_id' => $targetId,
                            'message' => $this->formatMessageForPin($message)
                        ]
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
            'avatar_url' => $user && $user->avatar_url ? $user->avatar_url : '/public/assets/common/default-profile-picture.png',
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
                'timestamp' => indonesiaTime()
            ]);
        } catch (Exception $e) {
            return $this->serverError('Failed to retrieve debug information');
        }
    }

    public function renderBubbleMessage()
    {
        try {
            $input = $this->getInput();
            $messageData = $input['message_data'] ?? null;
            
            if (!$messageData) {
                throw new ValidationException('Message data is required');
            }
            
            if (!is_array($messageData)) {
                $messageData = json_decode($messageData, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new ValidationException('Invalid JSON in message data');
                }
            }
            
            if (!$messageData || !isset($messageData['id'])) {
                throw new ValidationException('Invalid message data structure');
            }
            
            $currentUserId = $_SESSION['user_id'] ?? 0;
            
            ob_start();
            $GLOBALS['messageData'] = $messageData;
            $GLOBALS['currentUserId'] = $currentUserId;
            require_once __DIR__ . '/../views/components/messaging/bubble-chat.php';
            $html = ob_get_clean();
            
            if (empty($html)) {
                throw new Exception('Failed to generate HTML content');
            }
            
            return $this->success([
                'html' => $html,
                'message_id' => $messageData['id']
            ], 'Bubble message rendered successfully');
            
        } catch (Exception $e) {
            error_log("Error rendering bubble message: " . $e->getMessage());
            return $this->serverError('Failed to render bubble message: ' . $e->getMessage());
        }
    }

    private function getUserRepository() {
        require_once __DIR__ . '/../database/repositories/UserRepository.php';
        return new UserRepository();
    }
}
