<?php

require_once __DIR__ . '/../database/repositories/MessageRepository.php';
require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
require_once __DIR__ . '/../database/repositories/ChannelMessageRepository.php';
require_once __DIR__ . '/../database/repositories/ChatRoomRepository.php';
require_once __DIR__ . '/../database/repositories/ChatRoomMessageRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/../database/repositories/FriendListRepository.php';
require_once __DIR__ . '/../database/models/Message.php';
require_once __DIR__ . '/../database/models/User.php';
require_once __DIR__ . '/../database/query.php';
require_once __DIR__ . '/BaseController.php';


class ChatController extends BaseController
{
    private $messageRepository;
    private $channelRepository;
    private $channelMessageRepository;
    private $chatRoomRepository;
    private $chatRoomMessageRepository;
    private $userServerMembershipRepository;
    private $userRepository;
    private $friendListRepository;

    public function __construct()
    {
        parent::__construct();
        $this->messageRepository = new MessageRepository();
        $this->channelRepository = new ChannelRepository();
        $this->channelMessageRepository = new ChannelMessageRepository();
        $this->chatRoomRepository = new ChatRoomRepository();
        $this->chatRoomMessageRepository = new ChatRoomMessageRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
        $this->userRepository = new UserRepository();
        $this->friendListRepository = new FriendListRepository();
    }

    public function getMessages($targetType, $targetId)
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        try {
            if ($targetType === 'channel') {
                return $this->getChannelMessages($targetId, $userId);
            } elseif ($targetType === 'dm') {
                return $this->getDirectMessages($targetId, $userId);
            } else {
                return $this->validationError(['target_type' => 'Invalid target type. Must be "channel" or "dm"']);
            }
        } catch (Exception $e) {
            error_log("Error in getMessages: " . $e->getMessage());
            return $this->serverError('An error occurred while fetching messages: ' . $e->getMessage());
        }
    }

    private function getChannelMessages($channelId, $userId)
    {
        try {
            $channel = $this->channelRepository->find($channelId);
            if (!$channel) {
                return $this->notFound('Channel not found');
            }

            if ($channel->server_id != 0) {
                $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $channel->server_id);
                if (!$membership) {
                    return $this->forbidden('You are not a member of this server');
                }
            }

            $limit = isset($_GET['limit']) && is_numeric($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $offset = isset($_GET['offset']) && is_numeric($_GET['offset']) ? (int)$_GET['offset'] : 0;

            $messages = $this->channelMessageRepository->getMessagesByChannelId($channelId, $limit, $offset);
            $formattedMessages = array_map([$this, 'formatMessage'], $messages);

            // Debug: Check if any messages have reply data
            $replyCount = 0;
            foreach ($formattedMessages as $msg) {
                if (isset($msg['reply_data'])) {
                    $replyCount++;
                }
            }
            error_log("DEBUG: getChannelMessages - Found $replyCount messages with reply_data out of " . count($formattedMessages) . " total messages");

            error_log("Returning " . count($formattedMessages) . " messages for channel $channelId");
            
            return $this->respondMessages('channel', $channelId, $formattedMessages, count($messages) >= $limit);
        } catch (Exception $e) {
            error_log("Error getting channel messages: " . $e->getMessage());
            return $this->serverError('Failed to load channel messages: ' . $e->getMessage());
        }
    }
    
    private function respondMessages($type, $targetId, $messages, $hasMore = false)
    {
        return $this->success([
            'data' => [
                'type' => $type,
                'target_id' => $targetId,
                'messages' => $messages,
                'has_more' => $hasMore
            ],
            'timestamp' => date('Y-m-d H:i:s'),
            'message' => 'Messages retrieved successfully'
        ]);
    }

    private function getDirectMessages($chatRoomId, $userId)
    {
        try {
            $chatRoom = $this->chatRoomRepository->find($chatRoomId);
            if (!$chatRoom) {
                return $this->notFound('Chat room not found');
            }

            if (!$this->chatRoomRepository->isParticipant($chatRoomId, $userId)) {
                return $this->forbidden('You are not a participant in this chat');
            }

            $limit = isset($_GET['limit']) && is_numeric($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $offset = isset($_GET['offset']) && is_numeric($_GET['offset']) ? (int)$_GET['offset'] : 0;

            $messages = $this->chatRoomMessageRepository->getMessagesByRoomId($chatRoomId, $limit, $offset);
            $formattedMessages = array_map([$this, 'formatMessage'], $messages);

            // Debug: Check if any messages have reply data
            $replyCount = 0;
            foreach ($formattedMessages as $msg) {
                if (isset($msg['reply_data'])) {
                    $replyCount++;
                }
            }
            error_log("DEBUG: getDirectMessages - Found $replyCount messages with reply_data out of " . count($formattedMessages) . " total messages");

            error_log("Returning " . count($formattedMessages) . " messages for DM room $chatRoomId");

            return $this->respondMessages('dm', $chatRoomId, $formattedMessages, count($messages) >= $limit);
        } catch (Exception $e) {
            error_log("Error getting DM messages: " . $e->getMessage());
            return $this->serverError('Failed to load direct messages: ' . $e->getMessage());
        }
    }

    public function sendMessage()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, [
            'target_type' => 'required',
            'target_id' => 'required'
        ]);

        $targetType = $input['target_type'];
        $targetId = $input['target_id'];
        $content = trim($input['content'] ?? '');
        $messageType = $input['message_type'] ?? 'text';
        $attachments = $input['attachments'] ?? $input['attachment_url'] ?? null;
        $mentions = $input['mentions'] ?? [];
        $replyMessageId = $input['reply_message_id'] ?? null;

        if (is_string($attachments) && !empty($attachments)) {
            $attachments = [$attachments];
        } elseif (!is_array($attachments)) {
            $attachments = [];
        }

        if (empty($content) && empty($attachments)) {
            return $this->validationError(['content' => 'Message must have content or an attachment']);
        }

        if ($targetType === 'channel') {
            return $this->sendChannelMessage($targetId, $content, $userId, $messageType, $attachments, $mentions, $replyMessageId);
        } elseif ($targetType === 'dm') {
            return $this->sendDirectMessage($targetId, $content, $userId, $messageType, $attachments, $mentions, $replyMessageId);
        } else {
            return $this->validationError(['target_type' => 'Invalid target type. Must be "channel" or "dm"']);
        }
    }

    private function sendChannelMessage($channelId, $content, $userId, $messageType = 'text', $attachments = [], $mentions = [], $replyMessageId = null)
    {
        $channel = $this->channelRepository->find($channelId);
        if (!$channel) {
            return $this->notFound('Channel not found');
        }
        if ($channel->server_id != 0) {
            $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $channel->server_id);
            if (!$membership) {
                return $this->forbidden('You are not a member of this server');
            }
        }

        $query = new Query();
        try {
            $query->beginTransaction();
            
            $messageData = [
                'content' => $content,
                'user_id' => $userId,
                'message_type' => $messageType,
                'attachment_url' => !empty($attachments) ? json_encode(array_values($attachments)) : null,
                'sent_at' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            if ($replyMessageId) {
                $repliedMessage = $this->messageRepository->find($replyMessageId);
                if ($repliedMessage) {
                    $messageData['reply_message_id'] = $replyMessageId;
                }
            }

            $message = $this->messageRepository->create($messageData);

            if ($message && isset($message->id)) {
                $this->channelMessageRepository->addMessageToChannel($channelId, $message->id);
                
                $formattedMessage = $this->formatMessage($message);
                
                
                if ($message->reply_message_id) {
                    $repliedMessage = $this->messageRepository->find($message->reply_message_id);
                    if ($repliedMessage) {
                        $repliedUser = $this->userRepository->find($repliedMessage->user_id);
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
                    'data' => [
                        'message' => $formattedMessage,
                        'channel_id' => $channelId
                    ]
                ], 'Message sent successfully');
            } else {
                $query->rollback();
                throw new Exception('Failed to save message');
            }
        } catch (Exception $e) {
            $query->rollback();
            return $this->serverError('Failed to send message');
        }
    }

    private function sendDirectMessage($chatRoomId, $content, $userId, $messageType = 'text', $attachments = [], $mentions = [], $replyMessageId = null)
    {
        $chatRoom = $this->chatRoomRepository->find($chatRoomId);
        if (!$chatRoom) {
            return $this->notFound('Chat room not found');
        }
        if (!$this->chatRoomRepository->isParticipant($chatRoomId, $userId)) {
            return $this->forbidden('You are not a participant in this chat');
        }

        $query = new Query();
        try {
            $query->beginTransaction();
            
            $messageData = [
                'content' => $content,
                'user_id' => $userId,
                'message_type' => $messageType,
                'attachment_url' => !empty($attachments) ? json_encode(array_values($attachments)) : null,
                'sent_at' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            if ($replyMessageId) {
                $repliedMessage = $this->messageRepository->find($replyMessageId);
                if ($repliedMessage) {
                    $messageData['reply_message_id'] = $replyMessageId;
                }
            }

            $message = $this->messageRepository->create($messageData);

            if ($message && isset($message->id)) {
                $this->chatRoomMessageRepository->addMessageToRoom($chatRoomId, $message->id);

                error_log("DEBUG: Message created successfully with ID: " . $message->id);
                error_log("DEBUG: Message object: " . json_encode($message));
                
                $formattedMessage = $this->formatMessage($message);

                
                if ($message->reply_message_id) {
                    $repliedMessage = $this->messageRepository->find($message->reply_message_id);
                    if ($repliedMessage) {
                        $repliedUser = $this->userRepository->find($repliedMessage->user_id);
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
                
                $participants = $this->chatRoomRepository->getParticipants($chatRoomId);
                $senderUsername = $_SESSION['username'] ?? 'Unknown';
                $targetUsername = 'Unknown';
                
                foreach ($participants as $participant) {
                    if ($participant['user_id'] != $userId) {
                        $targetUsername = $participant['username'] ?? 'Unknown';
                        break;
                    }
                }
                
                error_log("$senderUsername direct message to $targetUsername : $content");

                $query->commit();

                error_log("DEBUG: Sending DM response with message ID: " . $formattedMessage['id']);
                error_log("DEBUG: Formatted message data: " . json_encode($formattedMessage));
                
                $response = $this->success([
                    'data' => [
                        'message' => $formattedMessage,
                        'room_id' => $chatRoomId
                    ]
                ], 'Message sent successfully');
                
                error_log("DEBUG: Final response structure: " . json_encode($response));
                
                return $response;
            } else {
                $query->rollback();
                throw new Exception('Failed to save message');
            }
        } catch (Exception $e) {
            $query->rollback();
            return $this->serverError('Failed to send message');
        }
    }

    public function createDirectMessage()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, ['friend_id' => 'required']);

        $friendId = $input['friend_id'];

        if ($friendId == $userId) {
            return $this->validationError(['friend_id' => 'Cannot create chat with yourself']);
        }

        $friendship = $this->friendListRepository->findFriendshipBetweenUsers($userId, $friendId);
        if (!$friendship || $friendship->status !== 'accepted') {
            return $this->forbidden('You can only message friends');
        }

        try {
            $existingRoom = $this->chatRoomRepository->findDirectMessageRoom($userId, $friendId);
            if ($existingRoom) {
                $chatRoomData = [
                    'id' => $existingRoom->id,
                    'type' => $existingRoom->type,
                    'name' => $existingRoom->name,
                    'image_url' => $existingRoom->image_url,
                    'created_at' => $existingRoom->created_at,
                    'updated_at' => $existingRoom->updated_at
                ];
                return $this->success([
                    'data' => [
                        'chat_room' => $chatRoomData,
                        'room_id' => $existingRoom->id
                    ]
                ]);
            }

            $friend = $this->userRepository->find($friendId);
            if (!$friend) {
                return $this->notFound('Friend not found');
            }
            $chatRoom = $this->chatRoomRepository->createDirectMessageRoom($userId, $friendId);


            if (!$chatRoom || !$chatRoom->id) {
                return $this->serverError('Failed to create chat room');
            }


            $chatRoomData = [
                'id' => $chatRoom->id,
                'type' => $chatRoom->type,
                'name' => $chatRoom->name,
                'image_url' => $chatRoom->image_url,
                'created_at' => $chatRoom->created_at,
                'updated_at' => $chatRoom->updated_at
            ];
            return $this->success([
                'data' => [
                    'chat_room' => $chatRoomData,
                    'room_id' => $chatRoom->id
                ]
            ], 'Direct message created');
        } catch (Exception $e) {
            error_log('CreateDirectMessage Error: ' . $e->getMessage());
            return $this->serverError('Failed to create direct message: ' . $e->getMessage());
        }
    }

    public function create()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, ['user_id' => 'required']);

        $friendId = $input['user_id'];

        if ($friendId == $userId) {
            return $this->validationError(['user_id' => 'Cannot create chat with yourself']);
        }

        $friendship = $this->friendListRepository->findFriendshipBetweenUsers($userId, $friendId);
        if (!$friendship || $friendship->status !== 'accepted') {
            return $this->forbidden('You can only message friends');
        }

        try {
            $existingRoom = $this->chatRoomRepository->findDirectMessageRoom($userId, $friendId);
            if ($existingRoom) {
                return $this->success([
                    'data' => [
                        'channel_id' => $existingRoom->id,
                        'room_id' => $existingRoom->id
                    ]
                ]);
            }

            $friend = $this->userRepository->find($friendId);
            if (!$friend) {
                return $this->notFound('Friend not found');
            }
            
            $chatRoom = $this->chatRoomRepository->createDirectMessageRoom($userId, $friendId);
            if (!$chatRoom || !$chatRoom->id) {
                return $this->serverError('Failed to create chat room');
            }

            return $this->success([
                'data' => [
                    'channel_id' => $chatRoom->id,
                    'room_id' => $chatRoom->id
                ]
            ], 'Direct message created');
        } catch (Exception $e) {
            error_log('Create Chat Error: ' . $e->getMessage());
            return $this->serverError('Failed to create direct message: ' . $e->getMessage());
        }
    }

    public function getDirectMessageRooms()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        try {
            $rooms = $this->chatRoomRepository->getUserDirectRooms($userId);
            return $this->success(['rooms' => $rooms]);
        } catch (Exception $e) {
            return $this->serverError('Failed to get direct message rooms');
        }
    }

    public function getDirectMessageRoomByFriendId()
    {
        if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
            return $this->unauthorized('You must be logged in to access this resource');
        }

        $userId = $_SESSION['user_id'];

        $friendId = $_GET['friend_id'] ?? null;

        if (!$friendId) {
            return $this->validationError(['friend_id' => 'Friend ID is required']);
        }

        try {
            $friendship = $this->friendListRepository->findFriendshipBetweenUsers($userId, $friendId);
            if (!$friendship || $friendship->status !== 'accepted') {
                return $this->forbidden('You can only message friends');
            }

            $chatRoom = $this->chatRoomRepository->findDirectMessageRoom($userId, $friendId);

            if ($chatRoom) {
                $friend = $this->userRepository->find($friendId);
                $roomData = [
                    'id' => $chatRoom->id,
                    'type' => $chatRoom->type,
                    'friend_id' => $friendId,
                    'friend_username' => $friend->username,
                    'friend_avatar' => $friend->avatar_url
                ];
                return $this->success(['chat_room' => $roomData]);
            } else {

                $newChatRoom = $this->chatRoomRepository->createDirectMessageRoom($userId, $friendId);
                if ($newChatRoom) {
                    $friend = $this->userRepository->find($friendId);
                    $roomData = [
                        'id' => $newChatRoom->id,
                        'type' => $newChatRoom->type,
                        'friend_id' => $friendId,
                        'friend_username' => $friend->username,
                        'friend_avatar' => $friend->avatar_url
                    ];
                    return $this->success(['chat_room' => $roomData]);
                } else {
                    return $this->serverError('Failed to create direct message room');
                }
            }
        } catch (Exception $e) {
            return $this->serverError('Failed to get direct message room: ' . $e->getMessage());
        }
    }

    public function getDirectMessageRoom($roomId)
    {
        if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
            return $this->unauthorized('You must be logged in to access this resource');
        }

        $userId = $_SESSION['user_id'];

        try {

            if (!$this->chatRoomRepository->isParticipant($roomId, $userId)) {
                return $this->forbidden('You are not a participant in this chat room');
            }

            $chatRoom = $this->chatRoomRepository->find($roomId);
            if (!$chatRoom) {
                return $this->notFound('Chat room not found');
            }


            if ($chatRoom->type === 'direct') {
                $participants = $this->chatRoomRepository->getParticipants($roomId);
                $friend = null;

                foreach ($participants as $participant) {
                    if ($participant['user_id'] != $userId) {
                        $friend = [
                            'id' => $participant['user_id'],
                            'username' => $participant['username'],
                            'avatar_url' => $participant['avatar_url']
                        ];
                        break;
                    }
                }

                $roomData = [
                    'id' => $chatRoom->id,
                    'type' => $chatRoom->type,
                    'friend' => $friend
                ];

                return $this->success($roomData);
            } else {
                $roomData = [
                    'id' => $chatRoom->id,
                    'type' => $chatRoom->type,
                    'name' => $chatRoom->name,
                    'image_url' => $chatRoom->image_url
                ];

                return $this->success($roomData);
            }
        } catch (Exception $e) {
            return $this->serverError('Failed to get direct message room: ' . $e->getMessage());
        }
    }



    private function formatMessage($message)
    {
        $userId = is_array($message) ? $message['user_id'] : $message->user_id;
        $user = $this->userRepository->find($userId);

        $username = $user ? $user->username : 'Unknown User';
        $avatarUrl = $user && $user->avatar_url ? $user->avatar_url :
            getUserAvatar('', $username);

        $formatted = [
            'id' => is_array($message) ? $message['id'] : $message->id,
            'content' => is_array($message) ? $message['content'] : $message->content,
            'user_id' => $userId,
            'username' => $username,
            'avatar_url' => $avatarUrl,
            'sent_at' => is_array($message) ? ($message['sent_at'] ?? $message['created_at']) : ($message->sent_at ?? $message->created_at),
            'edited_at' => is_array($message) ? ($message['edited_at'] ?? null) : ($message->edited_at ?? null),
            'type' => is_array($message) ? ($message['message_type'] ?? 'text') : ($message->message_type ?? 'text'),
            'message_type' => is_array($message) ? ($message['message_type'] ?? 'text') : ($message->message_type ?? 'text'),
            'attachments' => is_array($message) ? ($message['attachments'] ?? []) : $this->parseAttachments($message->attachment_url ?? null),
            // Default to false for has_reactions
            'has_reactions' => false,
            'reaction_count' => 0
        ];
        
        
        $replyMessageId = is_array($message) ? ($message['reply_message_id'] ?? null) : ($message->reply_message_id ?? null);
        
        if ($replyMessageId) {
            $formatted['reply_message_id'] = $replyMessageId;
            
            $repliedMessage = $this->messageRepository->find($replyMessageId);
            if ($repliedMessage) {
                $repliedUserId = $repliedMessage->user_id;
                $repliedUser = $this->userRepository->find($repliedUserId);
                
                $formatted['reply_data'] = [
                    'message_id' => $replyMessageId,
                    'content' => $repliedMessage->content,
                    'user_id' => $repliedUserId,
                    'username' => $repliedUser ? $repliedUser->username : 'Unknown User',
                    'avatar_url' => $repliedUser && $repliedUser->avatar_url ? $repliedUser->avatar_url : '/public/assets/common/default-profile-picture.png'
                ];
            }
        }
        
        // Check and include reactions for the message
        try {
            require_once __DIR__ . '/../database/models/MessageReaction.php';
            
            $messageId = is_array($message) ? $message['id'] : $message->id;
            
            // First, do a quick count check without fetching all data
            $reactionsCount = MessageReaction::countForMessage($messageId);
            $formatted['reaction_count'] = $reactionsCount;
            $formatted['has_reactions'] = ($reactionsCount > 0);
            
            if ($reactionsCount > 0) {
                // Only if there are reactions, fetch all the details
                $reactions = MessageReaction::getForMessage($messageId);
                
                if (!empty($reactions)) {
                    $formatted['reactions'] = [];
                    
                    foreach ($reactions as $reaction) {
                        $reactionUser = $this->userRepository->find($reaction->user_id);
                        $formatted['reactions'][] = [
                            'emoji' => $reaction->emoji,
                            'user_id' => $reaction->user_id,
                            'username' => $reactionUser ? $reactionUser->username : 'Unknown User'
                        ];
                    }
                }
            }
        } catch (Exception $e) {
            // Log the error but don't interrupt the flow
            error_log('Error loading reactions for message ' . $messageId . ': ' . $e->getMessage());
        }
        
        return $formatted;
    }
    
    private function parseAttachments($attachmentUrl) {
        if (!$attachmentUrl) return [];
        
        $decoded = json_decode($attachmentUrl, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }
        
        return [$attachmentUrl];
    }

    public function renderChatSection($chatType, $chatId)
    {
        $this->requireAuth();
        $currentUserId = $this->getCurrentUserId();

        try {
            if ($chatType === 'dm' || $chatType === 'direct') {

                $chatRoom = $this->chatRoomRepository->find($chatId);
                if (!$chatRoom) {
                    http_response_code(404);
                    echo "Chat room not found";
                    return;
                }


                if (!$this->chatRoomRepository->isParticipant($chatId, $currentUserId)) {
                    http_response_code(403);
                    echo "Access denied";
                    return;
                }


                $participants = $this->chatRoomRepository->getParticipants($chatId);
                $friend = null;

                foreach ($participants as $participant) {
                    if ($participant['user_id'] != $currentUserId) {
                        $friend = [
                            'id' => $participant['user_id'],
                            'username' => $participant['username'],
                            'avatar_url' => $participant['avatar_url']
                        ];
                        break;
                    }
                }


                try {
                    $limit = 20;
                    $offset = 0;
                    $rawMessages = $this->chatRoomMessageRepository->getMessagesByRoomId($chatId, $limit, $offset);
                    $messages = array_map([$this, 'formatMessage'], $rawMessages);
                } catch (Exception $e) {
                    $messages = [];
                }


                $chatData = [
                    'friend_username' => $friend['username'] ?? 'Unknown User',
                    'friend_id' => $friend['id'] ?? null,
                    'friend_avatar_url' => $friend['avatar_url'] ?? null
                ];


                $GLOBALS['chatType'] = 'direct';
                $GLOBALS['targetId'] = $chatId;
                $GLOBALS['chatData'] = $chatData;
                $GLOBALS['messages'] = $messages;
            } elseif ($chatType === 'channel') {

                $channel = $this->channelRepository->find($chatId);
                if (!$channel) {
                    http_response_code(404);
                    echo "Channel not found";
                    return;
                }


                $membership = $this->userServerMembershipRepository->findByUserAndServer($currentUserId, $channel->server_id);
                if (!$membership) {
                    http_response_code(403);
                    echo "Access denied";
                    return;
                }
                try {
                    $limit = 20;
                    $offset = 0;
                    $rawMessages = $this->channelMessageRepository->getMessagesByChannelId($chatId, $limit, $offset);
                    $messages = array_map([$this, 'formatMessage'], $rawMessages);
                } catch (Exception $e) {
                    $messages = [];
                }


                $channelData = [
                    'id' => $channel->id,
                    'name' => $channel->name,
                    'topic' => $channel->topic ?? '',
                    'server_id' => $channel->server_id
                ];


                $GLOBALS['chatType'] = 'channel';
                $GLOBALS['targetId'] = $chatId;
                $GLOBALS['chatData'] = $channelData;
                $GLOBALS['messages'] = $messages;
            } else {
                http_response_code(400);
                echo "Invalid chat type";
                return;
            }
            header('Content-Type: text/html; charset=utf-8');


            require_once __DIR__ . '/../views/components/app-sections/chat-section.php';
        } catch (Exception $e) {
            if (function_exists('logger')) {
                logger()->error("Chat section render error", [
                    'error' => $e->getMessage(),
                    'chat_type' => $chatType,
                    'chat_id' => $chatId,
                    'user_id' => $currentUserId
                ]);
            }

            http_response_code(500);
            echo "Error rendering chat section";
        }
    }

    public function updateMessage($messageId)
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        $message = $this->messageRepository->find($messageId);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        if ($message->user_id != $userId) {
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
                require_once __DIR__ . '/../database/models/ChannelMessage.php';
                require_once __DIR__ . '/../database/models/ChatRoomMessage.php';
                
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
                
                $formattedMessage = $this->formatMessage($message);
                
                return $this->success([
                'data' => [
                        'message' => $formattedMessage,
                        'target_type' => $targetType,
                        'target_id' => $targetId
                    ]
            ], 'Message updated successfully');
            } else {
                throw new Exception('Failed to update message');
            }
        } catch (Exception $e) {
            return $this->serverError('Failed to update message');
        }
    }

    public function deleteMessage($messageId)
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        $message = $this->messageRepository->find($messageId);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        if ($message->user_id != $userId) {
            return $this->forbidden('You can only delete your own messages');
        }

        try {
            require_once __DIR__ . '/../database/models/ChannelMessage.php';
            require_once __DIR__ . '/../database/models/ChatRoomMessage.php';
            
            $targetId = null;
            $targetType = 'channel';
            
            $channelMessage = ChannelMessage::findByMessageId($messageId);
            if ($channelMessage) {
                $targetId = $channelMessage->channel_id;
                $targetType = 'channel';
                ChannelMessage::deleteByMessageId($messageId);
            } else {
                $query = new Query();
                $chatRoomMessage = $query->table('chat_room_messages')
                    ->where('message_id', $messageId)
                    ->first();
                if ($chatRoomMessage) {
                    $targetId = $chatRoomMessage['room_id'];
                    $targetType = 'dm';
                    $query->table('chat_room_messages')
                        ->where('message_id', $messageId)
                        ->delete();
                }
            }
            
            if ($this->messageRepository->delete($messageId)) {
                return $this->success([
                    'data' => [
                        'message_id' => $messageId,
                        'target_type' => $targetType,
                        'target_id' => $targetId
                    ]
                ], 'Message deleted successfully');
            } else {
                throw new Exception('Failed to delete message');
            }
        } catch (Exception $e) {
            return $this->serverError('Failed to delete message');
        }
    }

    public function getMessage($messageId)
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        $message = $this->messageRepository->find($messageId);
        if (!$message) {
            return $this->notFound('Message not found');
        }

        require_once __DIR__ . '/../database/models/ChannelMessage.php';
        
        $channelMessage = ChannelMessage::findByMessageId($messageId);
        if ($channelMessage) {
            $channel = $this->channelRepository->find($channelMessage->channel_id);
            if ($channel && $channel->server_id != 0) {
                $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $channel->server_id);
                if (!$membership) {
                    return $this->forbidden('You are not a member of this server');
                }
            }
        } else {
            $query = new Query();
            $chatRoomMessage = $query->table('chat_room_messages')
                ->where('message_id', $messageId)
                ->first();
            if ($chatRoomMessage) {
                if (!$this->chatRoomRepository->isParticipant($chatRoomMessage['room_id'], $userId)) {
                    return $this->forbidden('You are not a participant in this chat');
                }
            }
        }

        try {
            $formattedMessage = $this->formatMessage($message);
            return $this->success(['message' => $formattedMessage]);
        } catch (Exception $e) {
            return $this->serverError('Failed to retrieve message');
        }
    }

    public function searchMessages($channelId)
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        $channel = $this->channelRepository->find($channelId);
        if (!$channel) {
            return $this->notFound('Channel not found');
        }

        if ($channel->server_id != 0) {
            $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $channel->server_id);
            if (!$membership) {
                return $this->forbidden('You are not a member of this server');
            }
        }

        $searchQuery = $_GET['q'] ?? '';
        if (empty($searchQuery)) {
            return $this->validationError(['q' => 'Search query is required']);
        }

        try {
            $messages = $this->messageRepository->searchInChannel($channelId, $searchQuery, 50);
            $formattedMessages = array_map([$this, 'formatMessage'], $messages);

            return $this->success([
                'channel_id' => $channelId,
                'query' => $searchQuery,
                'messages' => $formattedMessages
            ]);
        } catch (Exception $e) {
            return $this->serverError('Failed to search messages');
        }
    }

    public function getMessageReactions($messageId) {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        
        $message = $this->messageRepository->find($messageId);
        if (!$message) {
            return $this->notFound('Message not found');
        }
        
        try {
            require_once __DIR__ . '/../database/models/MessageReaction.php';
            
            $reactions = MessageReaction::getForMessage($messageId);
            $formattedReactions = [];
            
            foreach ($reactions as $reaction) {
                $user = $this->userRepository->find($reaction->user_id);
                $formattedReactions[] = [
                    'id' => $reaction->id,
                    'message_id' => $reaction->message_id,
                    'user_id' => $reaction->user_id,
                    'emoji' => $reaction->emoji,
                    'username' => $user ? $user->username : 'Unknown User',
                    'created_at' => $reaction->created_at
                ];
            }
            
            return $this->success(['reactions' => $formattedReactions]);
        } catch (Exception $e) {
            return $this->serverError('Failed to get message reactions: ' . $e->getMessage());
        }
    }
    

}
