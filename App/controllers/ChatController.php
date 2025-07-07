<?php

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../database/repositories/MessageRepository.php';
require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
require_once __DIR__ . '/../database/repositories/ChannelMessageRepository.php';
require_once __DIR__ . '/../database/repositories/ChatRoomRepository.php';
require_once __DIR__ . '/../database/repositories/ChatRoomMessageRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/../database/repositories/FriendListRepository.php';
require_once __DIR__ . '/../database/repositories/ServerRepository.php';
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
    private $serverRepository;

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
        $this->serverRepository = new ServerRepository();
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
            return $this->serverError('An error occurred while fetching messages: ' . $e->getMessage());
        }
    }

    private function getChannelMessages($channelId, $userId)
    {
        try {
            error_log("[BOT-DEBUG] API call: getChannelMessages for channel $channelId by user $userId");

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
            $timestamp = $_GET['timestamp'] ?? null;
            $cacheBust = $_GET['_cache_bust'] ?? null;

            error_log("[BOT-DEBUG] Loading channel $channelId messages with limit: $limit, offset: $offset");

            if ($timestamp || $cacheBust) {
                $offset = 0;
            }

            $paginationResult = $this->channelMessageRepository->getMessagesByChannelIdWithPagination($channelId, $limit, $offset);
            $messages = $paginationResult['messages'];
            $hasMore = $paginationResult['has_more'];

            error_log("[BOT-DEBUG] Raw messages from repository: " . count($messages) . " messages");

            $formattedMessages = array_map([$this, 'formatMessage'], $messages);

            $replyCount = 0;
            $botCount = 0;
            $userCount = 0;
            foreach ($formattedMessages as $msg) {
                if (isset($msg['reply_data'])) {
                    $replyCount++;
                }
                if (isset($msg['user_status']) && $msg['user_status'] === 'bot') {
                    $botCount++;
                } else {
                    $userCount++;
                }
            }

            error_log("[BOT-DEBUG] Formatted messages: $botCount bot messages, $userCount user messages, $replyCount replies");
            error_log("[BOT-DEBUG] Sending API response for channel $channelId with " . count($formattedMessages) . " messages");

            return $this->respondMessages('channel', $channelId, $formattedMessages, $hasMore);
        } catch (Exception $e) {
            error_log("[BOT-DEBUG] Error in getChannelMessages: " . $e->getMessage());
            return $this->serverError('Failed to load channel messages: ' . $e->getMessage());
        }
    }

    private function getChannelMessagesInternal($channelId, $userId)
    {
        try {
            $channel = $this->channelRepository->find($channelId);
            if (!$channel) {
                return $this->internalNotFound('Channel not found');
            }

            if ($channel->server_id != 0) {
                $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $channel->server_id);
                if (!$membership) {
                    return $this->internalForbidden('You are not a member of this server');
                }
            }

            $limit = isset($_GET['limit']) && is_numeric($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $offset = isset($_GET['offset']) && is_numeric($_GET['offset']) ? (int)$_GET['offset'] : 0;
            $timestamp = $_GET['timestamp'] ?? null;
            $cacheBust = $_GET['_cache_bust'] ?? null;

            if ($timestamp || $cacheBust) {
                $offset = 0;
            }

            $paginationResult = $this->channelMessageRepository->getMessagesByChannelIdWithPagination($channelId, $limit, $offset);
            $messages = $paginationResult['messages'];
            $hasMore = $paginationResult['has_more'];

            $formattedMessages = array_map([$this, 'formatMessage'], $messages);

            $replyCount = 0;
            foreach ($formattedMessages as $msg) {
                if (isset($msg['reply_data'])) {
                    $replyCount++;
                }
            }

            return $this->internalSuccess([
                'type' => 'channel',
                'target_id' => $channelId,
                'messages' => $formattedMessages,
                'has_more' => $hasMore
            ], 'Messages retrieved successfully');
        } catch (Exception $e) {
            return $this->internalServerError('Failed to load channel messages: ' . $e->getMessage());
        }
    }

    private function respondMessages($type, $targetId, $messages, $hasMore = false)
    {
        error_log("[BOT-DEBUG] respondMessages called for $type $targetId with " . count($messages) . " messages, hasMore: " . ($hasMore ? 'true' : 'false'));

        return $this->success([
            'type' => $type,
            'target_id' => $targetId,
            'messages' => $messages,
            'has_more' => $hasMore
        ], 'Messages retrieved successfully');
    }

    private function getDirectMessages($chatRoomId, $userId)
    {
        try {
            error_log("[BOT-DEBUG] API call: getDirectMessages for room $chatRoomId by user $userId");

            $chatRoom = $this->chatRoomRepository->find($chatRoomId);
            if (!$chatRoom) {
                return $this->notFound('Chat room not found');
            }

            if (!$this->chatRoomRepository->isParticipant($chatRoomId, $userId)) {
                return $this->forbidden('You are not a participant in this chat');
            }

            $limit = isset($_GET['limit']) && is_numeric($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $offset = isset($_GET['offset']) && is_numeric($_GET['offset']) ? (int)$_GET['offset'] : 0;
            $timestamp = $_GET['timestamp'] ?? null;
            $cacheBust = $_GET['_cache_bust'] ?? null;

            error_log("[BOT-DEBUG] Loading DM room $chatRoomId messages with limit: $limit, offset: $offset");

            if ($timestamp || $cacheBust) {
                $offset = 0;
            }

            $paginationResult = $this->chatRoomMessageRepository->getMessagesByRoomIdWithPagination($chatRoomId, $limit, $offset);
            $messages = $paginationResult['messages'];
            $hasMore = $paginationResult['has_more'];

            error_log("[BOT-DEBUG] Raw DM messages from repository: " . count($messages) . " messages");

            $formattedMessages = array_map([$this, 'formatMessage'], $messages);

            $replyCount = 0;
            $botCount = 0;
            $userCount = 0;
            foreach ($formattedMessages as $msg) {
                if (isset($msg['reply_data'])) {
                    $replyCount++;
                }
                if (isset($msg['user_status']) && $msg['user_status'] === 'bot') {
                    $botCount++;
                } else {
                    $userCount++;
                }
            }

            error_log("[BOT-DEBUG] Formatted DM messages: $botCount bot messages, $userCount user messages, $replyCount replies");

            return $this->respondMessages('dm', $chatRoomId, $formattedMessages, $hasMore);
        } catch (Exception $e) {
            error_log("[BOT-DEBUG] Error in getDirectMessages: " . $e->getMessage());
            return $this->serverError('Failed to load direct messages: ' . $e->getMessage());
        }
    }

    private function getDirectMessagesInternal($chatRoomId, $userId)
    {
        try {
            $chatRoom = $this->chatRoomRepository->find($chatRoomId);
            if (!$chatRoom) {
                return $this->internalNotFound('Chat room not found');
            }

            if (!$this->chatRoomRepository->isParticipant($chatRoomId, $userId)) {
                return $this->internalForbidden('You are not a participant in this chat');
            }

            $limit = isset($_GET['limit']) && is_numeric($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $offset = isset($_GET['offset']) && is_numeric($_GET['offset']) ? (int)$_GET['offset'] : 0;
            $timestamp = $_GET['timestamp'] ?? null;
            $cacheBust = $_GET['_cache_bust'] ?? null;

            if ($timestamp || $cacheBust) {
                $offset = 0;
            }

            $paginationResult = $this->chatRoomMessageRepository->getMessagesByRoomIdWithPagination($chatRoomId, $limit, $offset);
            $messages = $paginationResult['messages'];
            $hasMore = $paginationResult['has_more'];

            $formattedMessages = array_map([$this, 'formatMessage'], $messages);

            $replyCount = 0;
            foreach ($formattedMessages as $msg) {
                if (isset($msg['reply_data'])) {
                    $replyCount++;
                }
            }

            return $this->internalSuccess([
                'type' => 'dm',
                'target_id' => $chatRoomId,
                'messages' => $formattedMessages,
                'has_more' => $hasMore
            ], 'Messages retrieved successfully');
        } catch (Exception $e) {
            return $this->internalServerError('Failed to load direct messages: ' . $e->getMessage());
        }
    }

    public function sendMessage()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $validationErrors = [];
        if (empty($input['target_type'])) {
            $validationErrors['target_type'] = 'Target type is required (channel or dm)';
        } elseif (!in_array($input['target_type'], ['channel', 'dm'])) {
            $validationErrors['target_type'] = 'Invalid target type. Must be "channel" or "dm"';
        }

        if (empty($input['target_id'])) {
            $validationErrors['target_id'] = 'Target ID is required';
        }

        $content = trim($input['content'] ?? '');
        $messageType = $input['message_type'] ?? 'text';
        $attachments = $input['attachments'] ?? [];
        $mentions = $input['mentions'] ?? [];
        $replyMessageId = $input['reply_message_id'] ?? null;

        if (is_array($attachments)) {
            $attachments = array_filter($attachments, function ($attachment) {
                return is_string($attachment) && !empty($attachment);
            });
        } else {
            $attachments = [];
        }

        if (empty($content) && empty($attachments)) {
            $validationErrors['content'] = 'Message must have either content or an attachment';
        }

        if (!empty($validationErrors)) {
            return $this->validationError($validationErrors);
        }

        try {
            if ($input['target_type'] === 'channel') {
                $result = $this->sendChannelMessage($input['target_id'], $content, $userId, $messageType, $attachments, $mentions, $replyMessageId);
            } else {
                $result = $this->sendDirectMessage($input['target_id'], $content, $userId, $messageType, $attachments, $mentions, $replyMessageId);
            }

            if ($result['success']) {
                $message = $result['data']['message'];
                return $this->success([
                    'message_id' => $message['id'],
                    'user_id' => $message['user_id'],
                    'username' => $message['username'],
                    'target_type' => $input['target_type'],
                    'target_id' => $input['target_id'],
                    'content' => $message['content'],
                    'message_type' => $message['message_type'],
                    'attachments' => $message['attachments'],
                    'mentions' => $message['mentions'],
                    'reply_message_id' => $message['reply_message_id'],
                    'reply_data' => $message['reply_data'],
                    'timestamp' => $message['timestamp']
                ], 'Message sent successfully');
            } else {
                return $result;
            }
        } catch (Exception $e) {
            return $this->serverError('Failed to send message: ' . $e->getMessage());
        }
    }

    private function sendChannelMessage($channelId, $content, $userId, $messageType = 'text', $attachments = [], $mentions = [], $replyMessageId = null, $returnArrayOnly = false)
    {
        $channel = $this->channelRepository->find($channelId);
        if (!$channel) {
            return $this->internalNotFound('Channel not found');
        }
        if ($channel->server_id != 0) {
            $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $channel->server_id);
            if (!$membership) {
                return $this->internalForbidden('You are not a member of this server');
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
                'sent_at' => indonesiaTime(),
                'created_at' => indonesiaTime(),
                'updated_at' => indonesiaTime(),
                'reply_message_id' => $replyMessageId
            ];

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

                $responsePayload = [
                    'success' => true,
                    'message' => 'Message sent successfully',
                    'data' => [
                        'message' => $formattedMessage,
                        'channel_id' => $channelId
                    ],
                    'timestamp' => date('Y-m-d H:i:s')
                ];

                if ($returnArrayOnly) {
                    return $responsePayload;
                }

                return $this->internalSuccess([
                    'data' => [
                        'message' => $formattedMessage,
                        'channel_id' => $channelId
                    ]
                ], 'Message sent successfully');
            } else {
                $query->rollback();
                $errorPayload = $this->internalServerError('Failed to save message');
                if ($returnArrayOnly) {
                    return $errorPayload;
                }
                return $errorPayload;
            }
        } catch (Exception $e) {
            $query->rollback();
            $errorPayload = $this->internalServerError('Failed to send message: ' . $e->getMessage());
            if ($returnArrayOnly) {
                return $errorPayload;
            }
            return $errorPayload;
        }
    }

    private function sendDirectMessage($chatRoomId, $content, $userId, $messageType = 'text', $attachments = [], $mentions = [], $replyMessageId = null, $returnArrayOnly = false)
    {
        $chatRoom = $this->chatRoomRepository->find($chatRoomId);
        if (!$chatRoom) {
            return $this->internalNotFound('Chat room not found');
        }
        if (!$this->chatRoomRepository->isParticipant($chatRoomId, $userId)) {
            return $this->internalForbidden('You are not a participant in this chat');
        }

        $query = new Query();
        try {
            $query->beginTransaction();

            $messageData = [
                'content' => $content,
                'user_id' => $userId,
                'message_type' => $messageType,
                'attachment_url' => !empty($attachments) ? json_encode(array_values($attachments)) : null,
                'sent_at' => indonesiaTime(),
                'created_at' => indonesiaTime(),
                'updated_at' => indonesiaTime(),
                'reply_message_id' => $replyMessageId
            ];

            $message = $this->messageRepository->create($messageData);

            if ($message && isset($message->id)) {
                $this->chatRoomMessageRepository->addMessageToRoom($chatRoomId, $message->id);

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

                $query->commit();

                $responsePayload = [
                    'success' => true,
                    'message' => 'Message sent successfully',
                    'data' => [
                        'message' => $formattedMessage,
                        'room_id' => $chatRoomId
                    ],
                    'timestamp' => date('Y-m-d H:i:s')
                ];

                if ($returnArrayOnly) {
                    return $responsePayload;
                }

                return $this->internalSuccess([
                    'data' => [
                        'message' => $formattedMessage,
                        'room_id' => $chatRoomId
                    ]
                ], 'Message sent successfully');
            } else {
                $query->rollback();
                $errorPayload = $this->internalServerError('Failed to save message');
                if ($returnArrayOnly) {
                    return $errorPayload;
                }
                return $errorPayload;
            }
        } catch (Exception $e) {
            $query->rollback();
            $errorPayload = $this->internalServerError('Failed to send message: ' . $e->getMessage());
            if ($returnArrayOnly) {
                return $errorPayload;
            }
            return $errorPayload;
        }
    }

    public function create()
    {
        try {
            $this->requireAuth();
            $userId = $this->getCurrentUserId();

            $input = $this->getInput();
            $input = $this->sanitize($input);

            error_log("ChatController::create - Input received: " . json_encode($input));
            error_log("ChatController::create - Current user ID: " . $userId);

            if (isset($input['user_id'])) {
                $this->validate($input, ['user_id' => 'required']);
                $friendId = $input['user_id'];

                if ($friendId == $userId) {
                    return $this->validationError(['user_id' => 'Cannot create chat with yourself']);
                }

                $friend = $this->userRepository->find($friendId);

                if (!$friend) {
                    return $this->notFound('User not found');
                }

                if ($friend->status === 'banned' || $friend->status === 'deleted' || $friend->status === 'bot') {
                    return $this->forbidden('Cannot message this user');
                }

                try {
                    $existingRoom = $this->chatRoomRepository->findDirectMessageRoom($userId, $friendId);
                    if ($existingRoom) {
                        return $this->success([
                            'room_id' => $existingRoom->id,
                            'channel_id' => $existingRoom->id,
                            'type' => 'direct',
                            'message' => 'Conversation already exists'
                        ], 'Direct message room found');
                    }

                    $chatRoom = $this->chatRoomRepository->createDirectMessageRoom($userId, $friendId);
                    if (!$chatRoom || !$chatRoom->id) {
                        return $this->serverError('Failed to create chat room');
                    }

                    return $this->success([
                        'channel_id' => $chatRoom->id,
                        'room_id' => $chatRoom->id,
                        'type' => 'direct'
                    ], 'Direct message created');
                } catch (Exception $e) {
                    return $this->serverError('Failed to create direct message: ' . $e->getMessage());
                }
            }

            if (isset($input['user_ids']) && is_array($input['user_ids'])) {
                $userIds = array_filter($input['user_ids'], function ($id) {
                    return is_numeric($id) && $id > 0;
                });

                error_log("ChatController::create - Filtered user IDs: " . json_encode($userIds));

                if (empty($userIds)) {
                    return $this->validationError(['user_ids' => 'At least one user is required']);
                }

                if (in_array($userId, $userIds)) {
                    return $this->validationError(['user_ids' => 'Cannot add yourself to the group']);
                }

                foreach ($userIds as $targetUserId) {
                    $targetUser = $this->userRepository->find($targetUserId);
                    if (!$targetUser) {
                        return $this->notFound("User with ID $targetUserId not found");
                    }
                    if ($targetUser->status === 'banned' || $targetUser->status === 'deleted' || $targetUser->status === 'bot') {
                        return $this->forbidden("Cannot add user {$targetUser->username} to chat");
                    }
                }

                if (count($userIds) === 1) {
                    $existingRoom = $this->chatRoomRepository->findDirectMessageRoom($userId, $userIds[0]);
                    if ($existingRoom) {
                        return $this->success([
                            'room_id' => $existingRoom->id,
                            'channel_id' => $existingRoom->id,
                            'type' => 'direct',
                            'message' => 'Conversation already exists'
                        ], 'Direct message room found');
                    }
                }

                try {
                    if (count($userIds) === 1) {
                        $chatRoom = $this->chatRoomRepository->createDirectMessageRoom($userId, $userIds[0]);
                        $type = 'direct';
                        $message = 'Direct message created';
                    } else {
                        $groupName = $input['group_name'] ?? null;
                        $groupImage = $input['group_image'] ?? null;

                        if (empty($groupName)) {
                            return $this->validationError(['group_name' => 'Group name is required for group chats']);
                        }

                        $processedGroupImage = null;
                        if ($groupImage) {
                            try {
                                $processedGroupImage = $this->processGroupImage($groupImage);
                            } catch (Exception $e) {
                                return $this->validationError(['group_image' => 'Failed to process group image: ' . $e->getMessage()]);
                            }
                        }

                        $allParticipants = array_merge([$userId], $userIds);

                        $chatRoom = $this->chatRoomRepository->createGroupChatRoom($allParticipants, $groupName, $processedGroupImage);
                        $type = 'group';
                        $message = 'Group chat created';
                    }

                    if (!$chatRoom || !$chatRoom->id) {
                        return $this->serverError('Failed to create chat room');
                    }

                    return $this->success([
                        'channel_id' => $chatRoom->id,
                        'room_id' => $chatRoom->id,
                        'type' => $type
                    ], $message);
                } catch (Exception $e) {
                    return $this->serverError('Failed to create chat: ' . $e->getMessage());
                }
            }

            return $this->validationError(['input' => 'Either user_id or user_ids array is required']);
        } catch (Exception $e) {
            return $this->serverError('An unexpected error occurred: ' . $e->getMessage());
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

        $friend = $this->userRepository->find($friendId);
        if (!$friend) {
            return $this->notFound('User not found');
        }

        if ($friend->status === 'banned' || $friend->status === 'deleted') {
            return $this->forbidden('Cannot message this user');
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
            $friend = $this->userRepository->find($friendId);
            if (!$friend) {
                return $this->notFound('User not found');
            }

            if ($friend->status === 'banned' || $friend->status === 'deleted') {
                return $this->forbidden('Cannot message this user');
            }

            $chatRoom = $this->chatRoomRepository->findDirectMessageRoom($userId, $friendId);

            if ($chatRoom) {
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
                            'display_name' => $participant['display_name'] ?? $participant['username'],
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
        $messageId = is_array($message) ? $message['id'] : $message->id;
        $userStatus = is_array($message) ? ($message['user_status'] ?? null) : null;

        if ($userStatus === 'bot') {
            error_log("[BOT-DEBUG] formatMessage processing bot message: ID $messageId, user_id: $userId");
        }

        $user = $this->userRepository->find($userId);

        if ($userStatus === 'bot') {
            if ($user) {
                error_log("[BOT-DEBUG] formatMessage found bot user: {$user->username} (status: {$user->status})");
            } else {
                error_log("[BOT-DEBUG] formatMessage ERROR: Bot user $userId not found in userRepository->find()");
            }
        }

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
            'has_reactions' => false,
            'reaction_count' => 0
        ];

        if ($userStatus === 'bot') {
            $formatted['user_status'] = 'bot';
            error_log("[BOT-DEBUG] formatMessage successfully formatted bot message: ID $messageId, username: $username");
        }


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

        try {
            require_once __DIR__ . '/../database/models/MessageReaction.php';

            $messageId = is_array($message) ? $message['id'] : $message->id;

            $reactionsCount = MessageReaction::countForMessage($messageId);
            $formatted['reaction_count'] = $reactionsCount;
            $formatted['has_reactions'] = ($reactionsCount > 0);

            if ($reactionsCount > 0) {
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
        }

        return $formatted;
    }

    private function parseAttachments($attachmentUrl)
    {
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

        try {

            $userId = $this->getCurrentUserId();

            if ($chatType === 'channel') {
                $messages = $this->getChannelMessagesInternal($chatId, $userId);

                $channel = $this->channelRepository->find($chatId);
                if (!$channel) {
                    return $this->notFound('Channel not found');
                }

                $channelData = [
                    'id' => $channel->id,
                    'name' => $channel->name,
                    'type' => $channel->type,
                    'description' => $channel->description,
                    'server_id' => $channel->server_id
                ];

                return $this->success([
                    'data' => [
                        'type' => 'channel',
                        'target_id' => $chatId,
                        'messages' => $messages['data']['messages'],
                        'channel' => $channelData
                    ]
                ]);
            } else {
                $messages = $this->getDirectMessagesInternal($chatId, $userId);

                return $this->success([
                    'data' => [
                        'type' => 'direct',
                        'target_id' => $chatId,
                        'messages' => $messages['data']['messages']
                    ]
                ]);
            }
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function renderVoiceSection($channelId)
    {
        $this->requireAuth();

        try {

            $userId = $this->getCurrentUserId();

            $channelRepo = new ChannelRepository();
            $channel = $channelRepo->find($channelId);

            if (!$channel || $channel['type'] !== 'voice') {
                return $this->notFound('Voice channel not found');
            }

            $GLOBALS['channelId'] = $channelId;
            $GLOBALS['channel'] = $channel;



            return $channel;
        } catch (Exception $e) {


            throw $e;
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
            $message->edited_at = indonesiaTime();

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

        error_log("[CHAT-CONTROLLER] Delete attempt - Message ID: $messageId, User ID: $userId");

        $message = $this->messageRepository->find($messageId);
        if (!$message) {
            error_log("[CHAT-CONTROLLER] Message not found for deletion - ID: $messageId");
            return $this->notFound('Message not found or may have been already deleted');
        }

        if ($message->user_id != $userId) {
            error_log("[CHAT-CONTROLLER] Unauthorized delete attempt - Message owner: {$message->user_id}, Requester: $userId");
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
                error_log("[CHAT-CONTROLLER] Deleted channel message - Channel ID: $targetId");
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
                    error_log("[CHAT-CONTROLLER] Deleted DM message - Room ID: $targetId");
                }
            }

            if ($this->messageRepository->delete($messageId)) {
                error_log("[CHAT-CONTROLLER] Message deleted successfully - ID: $messageId");
                return $this->success([
                    'data' => [
                        'message_id' => $messageId,
                        'target_type' => $targetType,
                        'target_id' => $targetId
                    ]
                ], 'Message deleted successfully');
            } else {
                error_log("[CHAT-CONTROLLER] Failed to delete message from repository - ID: $messageId");
                throw new Exception('Failed to delete message from database');
            }
        } catch (Exception $e) {
            error_log("[CHAT-CONTROLLER] Exception during delete - Message ID: $messageId, Error: " . $e->getMessage());
            return $this->serverError('Failed to delete message: ' . $e->getMessage());
        }
    }

    public function getMessage($messageId)
    {
        $socketUserId = $_SERVER['HTTP_X_SOCKET_USER_ID'] ?? null;
        $socketUsername = $_SERVER['HTTP_X_SOCKET_USERNAME'] ?? null;

        if ($socketUserId && $socketUsername) {
            $userId = $socketUserId;

            $user = $this->userRepository->find($userId);
            if (!$user) {
                return $this->unauthorized('Invalid user');
            }

            error_log("Socket get message: User $userId authenticated via headers");
        } else {
            $this->requireAuth();
            $userId = $this->getCurrentUserId();

            error_log("Web get message: User $userId authenticated via session");
        }

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

    /**
     * Send a message to a specific target (channel or DM)
     * This method handles the direct endpoint /api/chat/{type}/{id}/messages
     */
    public function sendMessageToTarget($targetType, $targetId)
    {
        try {
            error_log("[ChatController] Starting sendMessageToTarget - Type: $targetType, ID: $targetId");

            if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
                error_log("[ChatController] Authentication failed - No user_id in session");
                return $this->unauthorized('You must be logged in to send messages');
            }

            $userId = $_SESSION['user_id'];
            error_log("[ChatController] User authenticated - User ID: $userId");

            $input = $this->getInput();
            if (empty($input)) {
                error_log("[ChatController] No input data received");
                return $this->validationError(['content' => 'No input data provided']);
            }

            $input = $this->sanitize($input);
            error_log("[ChatController] Received input for direct target message: " . json_encode($input));

            $content = trim($input['content'] ?? '');
            $messageType = $input['message_type'] ?? 'text';
            $attachments = $input['attachments'] ?? $input['attachment_url'] ?? null;
            $mentions = $input['mentions'] ?? [];
            $replyMessageId = $input['reply_message_id'] ?? null;
            $tempMessageId = $input['temp_message_id'] ?? null;

            if (is_string($attachments) && !empty($attachments)) {
                $attachments = [$attachments];
            } elseif (!is_array($attachments)) {
                $attachments = [];
            }

            if (empty($content) && empty($attachments)) {
                error_log("[ChatController] Validation failed - No content or attachments");
                return $this->validationError(['content' => 'Message must have either content or an attachment']);
            }

            error_log("[ChatController] Sending message to $targetType:$targetId - Content: " . substr($content, 0, 50) . (strlen($content) > 50 ? '...' : ''));

            if ($targetType === 'channel') {
                $channel = $this->channelRepository->find($targetId);
                if (!$channel) {
                    error_log("[ChatController] Channel not found - ID: $targetId");
                    return $this->notFound('Channel not found');
                }

                if ($channel->server_id != 0) {
                    $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $channel->server_id);
                    if (!$membership) {
                        error_log("[ChatController] User not a member of server - User: $userId, Server: {$channel->server_id}");
                        return $this->forbidden('You are not a member of this server');
                    }
                }

                $result = $this->sendChannelMessage($targetId, $content, $userId, $messageType, $attachments, $mentions, $replyMessageId, true);
            } else {
                $chatRoom = $this->chatRoomRepository->find($targetId);
                if (!$chatRoom) {
                    error_log("[ChatController] Chat room not found - ID: $targetId");
                    return $this->notFound('Chat room not found');
                }

                if (!$this->chatRoomRepository->isParticipant($targetId, $userId)) {
                    error_log("[ChatController] User not a participant in chat - User: $userId, Room: $targetId");
                    return $this->forbidden('You are not a participant in this chat');
                }

                $result = $this->sendDirectMessage($targetId, $content, $userId, $messageType, $attachments, $mentions, $replyMessageId, true);
            }

            error_log("[ChatController] Send message to target result: " . json_encode($result));

            if ($result['success']) {
                $message = $result['data']['message'];
                return $this->success([
                    'message_id' => $message['id'],
                    'user_id' => $message['user_id'],
                    'username' => $message['username'],
                    'target_type' => $targetType,
                    'target_id' => $targetId,
                    'content' => $message['content'],
                    'message_type' => $message['message_type'],
                    'attachments' => $message['attachments'],
                    'mentions' => $message['mentions'],
                    'reply_message_id' => $message['reply_message_id'],
                    'reply_data' => $message['reply_data'],
                    'timestamp' => $message['timestamp'],
                    'temp_message_id' => $tempMessageId
                ], 'Message sent successfully');
            } else {
                error_log("[ChatController] Failed to send message to target: " . json_encode($result));
                return $result;
            }
        } catch (Exception $e) {
            error_log("[ChatController] Error sending message to target: " . $e->getMessage());
            error_log("[ChatController] Stack trace: " . $e->getTraceAsString());
            return $this->serverError('Failed to send message: ' . $e->getMessage());
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

    public function searchServerMessages($serverId)
    {
        try {
            $this->requireAuth();
            $userId = $this->getCurrentUserId();

            if (!$serverId || !is_numeric($serverId)) {
                return $this->validationError(['server_id' => 'Invalid server ID']);
            }

            $server = $this->serverRepository->find($serverId);
            if (!$server) {
                return $this->notFound('Server not found');
            }

            $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $serverId);
            if (!$membership) {
                return $this->forbidden('You are not a member of this server');
            }

            $searchQuery = $_GET['q'] ?? '';
            if (empty($searchQuery) || strlen(trim($searchQuery)) < 1) {
                return $this->validationError(['q' => 'Search query is required and must be at least 1 character']);
            }

            $searchQuery = trim($searchQuery);
            if (strlen($searchQuery) > 255) {
                return $this->validationError(['q' => 'Search query is too long']);
            }

            $messages = $this->messageRepository->searchInServer($serverId, $searchQuery, 30);

            $formattedMessages = [];
            foreach ($messages as $message) {
                $formattedMessages[] = [
                    'id' => $message['id'] ?? '',
                    'content' => $message['content'] ?? '',
                    'user_id' => $message['user_id'] ?? '',
                    'username' => $message['username'] ?? 'Unknown User',
                    'avatar_url' => (!empty($message['avatar_url']))
                        ? $message['avatar_url']
                        : '/public/assets/common/default-profile-picture.png',
                    'sent_at' => $message['sent_at'] ?? '',
                    'channel_id' => $message['channel_id'] ?? '',
                    'channel_name' => $message['channel_name'] ?? 'Unknown Channel',
                    'message_type' => $message['message_type'] ?? 'text'
                ];
            }

            return $this->success([
                'server_id' => (int)$serverId,
                'query' => $searchQuery,
                'messages' => $formattedMessages,
                'total' => count($formattedMessages)
            ]);
        } catch (Exception $e) {
            return $this->serverError('Failed to search server messages');
        }
    }

    public function getMessageReactions($messageId)
    {
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

    public function saveMessageFromSocket()
    {
        header('Content-Type: application/json');

        error_log("Socket message save - all headers: " . json_encode([
            'HTTP_X_SOCKET_USER_ID' => $_SERVER['HTTP_X_SOCKET_USER_ID'] ?? 'NOT_SET',
            'HTTP_X_SOCKET_USERNAME' => $_SERVER['HTTP_X_SOCKET_USERNAME'] ?? 'NOT_SET',
            'HTTP_X_SOCKET_SESSION_ID' => $_SERVER['HTTP_X_SOCKET_SESSION_ID'] ?? 'NOT_SET',
            'HTTP_X_SOCKET_AVATAR_URL' => $_SERVER['HTTP_X_SOCKET_AVATAR_URL'] ?? 'NOT_SET',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN',
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'UNKNOWN',
            'raw_input' => substr(file_get_contents('php://input'), 0, 200)
        ]));

        $socketUserId = $_SERVER['HTTP_X_SOCKET_USER_ID'] ?? null;
        $socketUsername = $_SERVER['HTTP_X_SOCKET_USERNAME'] ?? null;
        $socketSessionId = $_SERVER['HTTP_X_SOCKET_SESSION_ID'] ?? null;
        $socketAvatarUrl = $_SERVER['HTTP_X_SOCKET_AVATAR_URL'] ?? null;

        if ($socketUserId && $socketUsername) {
            $userId = $socketUserId;
            $username = $socketUsername;

            $user = $this->userRepository->find($userId);
            if (!$user) {
                error_log("Socket message save failed: User not found in database - ID: $userId");
                return $this->unauthorized('Invalid user');
            }

            error_log("Socket authentication successful: User $userId ($username) authenticated via headers");
        } else {
            error_log("Socket headers not found, trying session authentication");

            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }

            if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
                error_log("Socket message save failed: No authentication via headers or session");
                return $this->unauthorized('User must be authenticated');
            }

            $userId = $_SESSION['user_id'];
            $username = $_SESSION['username'] ?? null;

            $user = $this->userRepository->find($userId);
            if (!$user) {
                error_log("Socket message save failed: User not found - ID: $userId");
                return $this->unauthorized('Invalid user');
            }

            if (!$username) {
                $username = $user->username;
            }

            error_log("Session authentication successful: User $userId ($username) authenticated via session");
        }

        $input = $this->getInput();
        $input = $this->sanitize($input);

        error_log("Socket message save request from user $userId ($username): " . json_encode($input));

        $validationErrors = [];
        if (empty($input['target_type'])) {
            $validationErrors['target_type'] = 'Target type is required (channel or dm)';
        } elseif (!in_array($input['target_type'], ['channel', 'dm'])) {
            $validationErrors['target_type'] = 'Invalid target type. Must be "channel" or "dm"';
        }

        if (empty($input['target_id'])) {
            $validationErrors['target_id'] = 'Target ID is required';
        }

        $content = trim($input['content'] ?? '');
        $messageType = $input['message_type'] ?? 'text';
        $attachments = $input['attachments'] ?? [];
        $mentions = $input['mentions'] ?? [];
        $replyMessageId = $input['reply_message_id'] ?? null;

        // Sanitize reply_message_id: ignore non-numeric (temporary) IDs coming from socket
        if ($replyMessageId !== null && !ctype_digit((string)$replyMessageId)) {
            $replyMessageId = null;
        } elseif ($replyMessageId !== null) {
            $replyMessageId = intval($replyMessageId);
        }

        if (empty($content) && empty($attachments)) {
            $validationErrors['content'] = 'Message must have either content or an attachment';
        }

        if (!empty($validationErrors)) {
            error_log("Socket message validation failed: " . json_encode($validationErrors));
            return $this->validationError($validationErrors);
        }

        try {
            if ($input['target_type'] === 'channel') {
                $result = $this->sendChannelMessage($input['target_id'], $content, $userId, $messageType, $attachments, $mentions, $replyMessageId, true);
            } else {
                $result = $this->sendDirectMessage($input['target_id'], $content, $userId, $messageType, $attachments, $mentions, $replyMessageId, true);
            }

            error_log("Socket message save result: " . json_encode($result));

            if ($result['success']) {
                $messageData = null;
                if (isset($result['data']['data']['message'])) {
                    $messageData = $result['data']['data']['message'];
                } else if (isset($result['data']['message'])) {
                    $messageData = $result['data']['message'];
                }

                if (!$messageData) {
                    error_log("No message data found in result: " . json_encode($result));
                    return $this->serverError('Message data not found in response');
                }

                return $this->success([
                    'message_id' => $messageData['id'],
                    'data' => [
                        'message' => $messageData
                    ],
                    'temp_message_id' => $tempMessageId
                ], 'Message saved successfully');
            } else {
                error_log("Failed to save socket message: " . json_encode($result));
                return $result;
            }
        } catch (Exception $e) {
            error_log("Error saving socket message: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            return $this->serverError('Failed to save message: ' . $e->getMessage());
        }
    }

    public function saveBotMessageFromSocket()
    {
        header('Content-Type: application/json');

        $input = $this->getInput();
        if (!$input) {
            return $this->error('No input provided or failed to decode JSON', 400);
        }

        $input = $this->sanitize($input);

        $userId = $input['user_id'] ?? null;
        if (!$userId) {
            return $this->error('User ID is required', 400);
        }

        $query = new Query();
        $botUser = $query->table('users')
            ->where('id', $userId)
            ->where('status', 'bot')
            ->first();

        if (!$botUser) {
            return $this->unauthorized('Invalid bot user');
        }

        $validationErrors = [];
        if (empty($input['target_type'])) {
            $validationErrors['target_type'] = 'Target type is required (channel or dm)';
        } elseif (!in_array($input['target_type'], ['channel', 'dm'])) {
            $validationErrors['target_type'] = 'Invalid target type. Must be "channel" or "dm"';
        }

        if (empty($input['target_id'])) {
            $validationErrors['target_id'] = 'Target ID is required';
        }

        $content = trim($input['content'] ?? '');
        $messageType = $input['message_type'] ?? 'text';
        $attachments = $input['attachments'] ?? [];
        $mentions = $input['mentions'] ?? [];
        $replyMessageId = $input['reply_message_id'] ?? null;
        $tempMessageId = $input['temp_message_id'] ?? null;

        if (is_array($attachments)) {
            $attachments = array_filter($attachments, function ($attachment) {
                return is_string($attachment) && !empty($attachment);
            });
        } else {
            $attachments = [];
        }

        if (empty($content) && empty($attachments)) {
            $validationErrors['content'] = 'Message must have either content or an attachment';
        }

        if (!empty($validationErrors)) {
            return $this->validationError($validationErrors);
        }

        $targetType = $input['target_type'];
        $targetId = $input['target_id'];

        try {
            if ($targetType === 'channel') {
                $channel = $this->channelRepository->find($targetId);
                if (!$channel) {
                    return $this->notFound("Channel not found with ID $targetId");
                }

                if ($channel->server_id != 0) {
                    $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $channel->server_id);
                    if (!$membership) {
                        return $this->forbidden('Bot is not a member of this server');
                    }
                }

                $result = $this->sendChannelMessage($targetId, $content, $userId, $messageType, $attachments, $mentions, $replyMessageId, true);
            } else {
                $chatRoom = $this->chatRoomRepository->find($targetId);
                if (!$chatRoom) {
                    return $this->notFound("Chat room not found with ID $targetId");
                }

                if (!$this->chatRoomRepository->isParticipant($targetId, $userId)) {
                    return $this->forbidden('Bot is not a participant in this chat');
                }

                $result = $this->sendDirectMessage($targetId, $content, $userId, $messageType, $attachments, $mentions, $replyMessageId, true);
            }

            if ($result['success']) {
                $messageData = $result['data']['message'];

                if (isset($input['nonce'])) {
                    $messageData['nonce'] = $input['nonce'];
                }

                return $this->success([
                    'message_id' => $messageData['id'],
                    'data' => [
                        'message' => $messageData
                    ],
                    'temp_message_id' => $tempMessageId
                ], 'Message saved successfully');
            } else {
                return $result;
            }
        } catch (Exception $e) {
            error_log("Error saving bot message: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            return $this->serverError('Failed to save bot message: ' . $e->getMessage());
        }
    }

    public function getDMParticipants($roomId = null)
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        if (!$roomId) {
            $input = $this->getInput();
            $roomId = $input['room_id'] ?? null;
        }

        if (!$roomId) {
            return $this->validationError(['room_id' => 'Room ID is required']);
        }

        try {
            $chatRoom = $this->chatRoomRepository->find($roomId);
            if (!$chatRoom) {
                return $this->notFound('Chat room not found');
            }

            if (!$this->chatRoomRepository->isParticipant($roomId, $userId)) {
                return $this->forbidden('You are not a participant in this chat');
            }

            $participants = $this->chatRoomRepository->getParticipants($roomId);

            $formattedParticipants = array_map(function ($participant) {
                $user = $this->userRepository->find($participant['user_id']);
                $status = $user ? ($user->status ?? 'offline') : 'offline';

                return [
                    'user_id' => $participant['user_id'],
                    'username' => $participant['username'],
                    'display_name' => $participant['display_name'] ?? $participant['username'],
                    'avatar_url' => $participant['avatar_url'] ?? '/public/assets/common/default-profile-picture.png',
                    'status' => $status
                ];
            }, $participants);

            return $this->success([
                'data' => $formattedParticipants,
                'participants' => $participants, // Keep for backward compatibility
                'room_id' => $roomId,
                'total' => count($participants)
            ]);
        } catch (Exception $e) {
            error_log("Error getting DM participants: " . $e->getMessage());
            return $this->serverError('Failed to get chat participants');
        }
    }

    private function processGroupImage($imageData)
    {
        if (strpos($imageData, ';base64,') === false) {
            throw new Exception("Invalid image data format. Expected base64 string.");
        }

        list($type, $data) = explode(';', $imageData);
        list(, $data)      = explode(',', $data);
        $data = base64_decode($data);

        $finfo = finfo_open();
        $mime_type = finfo_buffer($finfo, $data, FILEINFO_MIME_TYPE);
        finfo_close($finfo);

        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($mime_type, $allowedMimes)) {
            throw new Exception("Invalid image type. Allowed types: " . implode(', ', $allowedMimes));
        }

        $ext = str_replace('image/', '', $mime_type);
        $filename = uniqid('group_img_') . '.' . $ext;
        $uploadDir = dirname(__DIR__) . '/public/storage/group_images/';

        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filePath = $uploadDir . $filename;
        if (file_put_contents($filePath, $data)) {
            return '/public/storage/group_images/' . $filename;
        } else {
            throw new Exception("Failed to save image to disk.");
        }
    }

    private function internalSuccess($data = [], $message = 'Success', $code = 200)
    {
        return [
            'success' => true,
            'message' => $message,
            'data' => $data,
            'code' => $code,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }

    private function internalError($message, $code = 400)
    {
        return [
            'success' => false,
            'message' => $message,
            'code' => $code,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }

    private function internalNotFound($message = 'Resource not found')
    {
        return $this->internalError($message, 404);
    }

    private function internalForbidden($message = 'Access forbidden')
    {
        return $this->internalError($message, 403);
    }

    private function internalServerError($message = 'Internal server error', $code = 500)
    {
        return $this->internalError($message, $code);
    }
}
