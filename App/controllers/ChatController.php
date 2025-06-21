<?php

require_once __DIR__ . '/../database/repositories/MessageRepository.php';
require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
require_once __DIR__ . '/../database/repositories/ChatRoomRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/../database/repositories/FriendListRepository.php';
require_once __DIR__ . '/../database/models/Message.php';
require_once __DIR__ . '/../database/models/User.php';
require_once __DIR__ . '/../utils/WebSocketClient.php';
require_once __DIR__ . '/BaseController.php';

class ChatController extends BaseController
{
    private $messageRepository;
    private $channelRepository;
    private $chatRoomRepository;
    private $userServerMembershipRepository;
    private $userRepository;
    private $friendListRepository;

    public function __construct()
    {
        parent::__construct();
        $this->messageRepository = new MessageRepository();
        $this->channelRepository = new ChannelRepository();
        $this->chatRoomRepository = new ChatRoomRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
        $this->userRepository = new UserRepository();
        $this->friendListRepository = new FriendListRepository();
    }

    public function getMessages($targetType, $targetId)
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        if ($targetType === 'channel') {
            return $this->getChannelMessages($targetId, $userId);
        } elseif ($targetType === 'dm') {
            return $this->getDirectMessages($targetId, $userId);
        } else {
            return $this->validationError(['type' => 'Invalid target type']);
        }
    }

    private function getChannelMessages($channelId, $userId)
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

        $limit = $_GET['limit'] ?? 20;
        $offset = $_GET['offset'] ?? 0;

        try {
            $messages = $this->messageRepository->getForChannel($channelId, $limit, $offset);
            $formattedMessages = array_map([$this, 'formatMessage'], $messages);

            return $this->success([
                'type' => 'channel',
                'target_id' => $channelId,
                'messages' => $formattedMessages,
                'has_more' => count($messages) == $limit
            ]);
        } catch (Exception $e) {
            return $this->serverError('Failed to load channel messages');
        }
    }

    private function getDirectMessages($chatRoomId, $userId)
    {
        $chatRoom = $this->chatRoomRepository->find($chatRoomId);
        if (!$chatRoom) {
            return $this->notFound('Chat room not found');
        }

        if (!$this->chatRoomRepository->isParticipant($chatRoomId, $userId)) {
            return $this->forbidden('You are not a participant in this chat');
        }

        $limit = $_GET['limit'] ?? 20;
        $offset = $_GET['offset'] ?? 0;

        try {
            $messages = $this->chatRoomRepository->getMessages($chatRoomId, $limit, $offset);
            $formattedMessages = array_map([$this, 'formatMessage'], $messages);

            return $this->success([
                'type' => 'dm',
                'target_id' => $chatRoomId,
                'messages' => $formattedMessages,
                'has_more' => count($messages) == $limit
            ]);
        } catch (Exception $e) {
            return $this->serverError('Failed to load direct messages');
        }
    }    public function sendMessage()
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
        $attachmentUrl = $input['attachment_url'] ?? null;
        $mentions = $input['mentions'] ?? [];


        if (empty($content) && empty($attachmentUrl)) {
            return $this->validationError(['content' => 'Message must have content or an attachment']);
        }

        if ($targetType === 'channel') {
            return $this->sendChannelMessage($targetId, $content, $userId, $messageType, $attachmentUrl, $mentions);
        } elseif ($targetType === 'dm' || $targetType === 'direct') {
            return $this->sendDirectMessage($targetId, $content, $userId, $messageType, $attachmentUrl, $mentions);
        } else {
            return $this->validationError(['target_type' => 'Invalid target type']);
        }
    }

    private function sendChannelMessage($channelId, $content, $userId, $messageType = 'text', $attachmentUrl = null, $mentions = [])
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

        try {
            $message = new Message();
            $message->content = $content;
            $message->channel_id = $channelId;
            $message->user_id = $userId;
            $message->message_type = $messageType;
            $message->attachment_url = $attachmentUrl;

            if ($message->save()) {
                $formattedMessage = $this->formatMessage($message);


                if (!empty($mentions)) {
                    $formattedMessage['mentions'] = $mentions;
                }                $this->sendWebSocketNotification('channel-message', [
                    'channelId' => $channelId,
                    'content' => $content,
                    'messageType' => $messageType,
                    'timestamp' => time()
                ]);

                return $this->success(['message' => $formattedMessage], 'Message sent successfully');
            } else {
                throw new Exception('Failed to save message');
            }
        } catch (Exception $e) {
            return $this->serverError('Failed to send message');
        }
    }

    private function sendDirectMessage($chatRoomId, $content, $userId, $messageType = 'text', $attachmentUrl = null, $mentions = [])
    {
        $chatRoom = $this->chatRoomRepository->find($chatRoomId);
        if (!$chatRoom) {
            return $this->notFound('Chat room not found');
        }
        if (!$this->chatRoomRepository->isParticipant($chatRoomId, $userId)) {
            return $this->forbidden('You are not a participant in this chat');
        }

        try {
            $message = new Message();
            $message->content = $content;
            $message->user_id = $userId;
            $message->message_type = $messageType;
            $message->attachment_url = $attachmentUrl;

            if ($message->save()) {
                $this->chatRoomRepository->addMessageToRoom($chatRoomId, $message->id);

                $formattedMessage = $this->formatMessage($message);


                if (!empty($mentions)) {
                    $formattedMessage['mentions'] = $mentions;
                }                $participants = $this->chatRoomRepository->getParticipants($chatRoomId);
                foreach ($participants as $participant) {
                    if ($participant['user_id'] != $userId) {
                        $this->sendWebSocketNotification('direct-message', [
                            'roomId' => $chatRoomId,
                            'content' => $content,
                            'messageType' => $messageType,
                            'timestamp' => time()
                        ], $participant['user_id']);
                    }
                }

                return $this->success(['message' => $formattedMessage], 'Message sent successfully');
            } else {
                throw new Exception('Failed to save message');
            }
        } catch (Exception $e) {
            return $this->serverError('Failed to send direct message');
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
                return $this->success(['chat_room' => $chatRoomData]);
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
            return $this->success(['chat_room' => $chatRoomData], 'Direct message created');
        } catch (Exception $e) {
            error_log('CreateDirectMessage Error: ' . $e->getMessage());
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

    public function getDirectMessageRoomMessages($roomId)
    {
        if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
            return $this->unauthorized('You must be logged in to access this resource');
        }

        $userId = $_SESSION['user_id'];

        try {

            if (!$this->chatRoomRepository->isParticipant($roomId, $userId)) {
                return $this->forbidden('You are not a participant in this chat room');
            }
            $limit = $_GET['limit'] ?? 20;
            $offset = $_GET['offset'] ?? 0;

            $messages = $this->chatRoomRepository->getMessages($roomId, $limit, $offset);
            $formattedMessages = array_map([$this, 'formatMessage'], $messages);

            return $this->success([
                'messages' => $formattedMessages,
                'has_more' => count($messages) == $limit
            ]);
        } catch (Exception $e) {
            return $this->serverError('Failed to get messages: ' . $e->getMessage());
        }
    }
    private function formatMessage($message)
    {

        $userId = is_array($message) ? $message['user_id'] : $message->user_id;
        $user = $this->userRepository->find($userId);

        $username = $user ? $user->username : 'Unknown User';
        $avatarUrl = $user && $user->avatar_url ? $user->avatar_url :
            getUserAvatar('', $username);

        return [
            'id' => is_array($message) ? $message['id'] : $message->id,
            'content' => is_array($message) ? $message['content'] : $message->content,
            'user_id' => $userId,
            'username' => $username,
            'avatar_url' => $avatarUrl,
            'sent_at' => is_array($message) ? ($message['sent_at'] ?? $message['created_at']) : $message->created_at,
            'edited_at' => is_array($message) ? ($message['edited_at'] ?? null) : ($message->edited_at ?? null),
            'type' => is_array($message) ? ($message['message_type'] ?? 'text') : ($message->type ?? 'text')
        ];
    }    private function sendWebSocketNotification($event, $data, $targetUserId = null)
    {
        try {
            $wsClient = new WebSocketClient();
            if ($targetUserId) {
                $wsClient->notifyUser($targetUserId, $event, $data);
            } else {
                $wsClient->broadcast($event, $data);
            }
        } catch (Exception $e) {
            error_log('WebSocket notification failed: ' . $e->getMessage());
        }
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
                    $rawMessages = $this->chatRoomRepository->getMessages($chatId, $limit, $offset);
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
                    $rawMessages = $this->messageRepository->getForChannel($chatId, $limit, $offset);
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
                $formattedMessage = $this->formatMessage($message);                $this->sendWebSocketNotification('message_updated', [
                    'target_type' => 'channel',
                    'target_id' => $message->channel_id ?? null,
                    'message' => $formattedMessage
                ]);

                return $this->success([
                    'message' => $formattedMessage
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
            $message->content = '[deleted]';
            $message->deleted_at = date('Y-m-d H:i:s');

            if ($message->save()) {                $this->sendWebSocketNotification('message_deleted', [
                    'target_type' => 'channel',
                    'target_id' => $message->channel_id ?? null,
                    'message_id' => $messageId
                ]);

                return $this->success(null, 'Message deleted successfully');
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

        if ($message->channel_id) {
            $channel = $this->channelRepository->find($message->channel_id);
            if ($channel && $channel->server_id != 0) {
                $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $channel->server_id);
                if (!$membership) {
                    return $this->forbidden('You are not a member of this server');
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
}
