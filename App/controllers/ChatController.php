<?php

require_once __DIR__ . '/../database/repositories/MessageRepository.php';
require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
require_once __DIR__ . '/../database/repositories/ChatRoomRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/../database/repositories/FriendListRepository.php';
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

        $limit = $_GET['limit'] ?? 50;
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

        $limit = $_GET['limit'] ?? 50;
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
    }

    public function sendMessage()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, [
            'target_type' => 'required',
            'target_id' => 'required',
            'content' => 'required'
        ]);

        $targetType = $input['target_type'];
        $targetId = $input['target_id'];
        $content = trim($input['content']);

        if (empty($content)) {
            return $this->validationError(['content' => 'Message content cannot be empty']);
        }

        if ($targetType === 'channel') {
            return $this->sendChannelMessage($targetId, $content, $userId);
        } elseif ($targetType === 'dm') {
            return $this->sendDirectMessage($targetId, $content, $userId);
        } else {
            return $this->validationError(['target_type' => 'Invalid target type']);
        }
    }

    private function sendChannelMessage($channelId, $content, $userId)
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
            $message->type = 'text';

            if ($message->save()) {
                $formattedMessage = $this->formatMessage($message);

                $this->sendWebSocketNotification([
                    'type' => 'new_message',
                    'target_type' => 'channel',
                    'target_id' => $channelId,
                    'message' => $formattedMessage
                ]);

                return $this->success(['message' => $formattedMessage], 'Message sent successfully');
            } else {
                throw new Exception('Failed to save message');
            }
        } catch (Exception $e) {
            return $this->serverError('Failed to send message');
        }
    }

    private function sendDirectMessage($chatRoomId, $content, $userId)
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
            $message->type = 'text';

            if ($message->save()) {
                $this->chatRoomRepository->addMessageToRoom($chatRoomId, $message->id);
                
                $formattedMessage = $this->formatMessage($message);

                $participants = $this->chatRoomRepository->getParticipants($chatRoomId);
                foreach ($participants as $participant) {
                    if ($participant['user_id'] != $userId) {
                        $this->sendWebSocketNotification([
                            'type' => 'new_message',
                            'target_type' => 'dm',
                            'target_id' => $chatRoomId,
                            'message' => $formattedMessage
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
                return $this->success(['chat_room' => $existingRoom]);
            }

            $friend = $this->userRepository->find($friendId);
            if (!$friend) {
                return $this->notFound('Friend not found');
            }

            $chatRoom = $this->chatRoomRepository->createDirectMessageRoom($userId, $friendId);
            
            return $this->success(['chat_room' => $chatRoom], 'Direct message created');
        } catch (Exception $e) {
            return $this->serverError('Failed to create direct message');
        }
    }

    public function getDirectMessageRooms()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();

        try {
            $rooms = $this->chatRoomRepository->getUserDirectMessages($userId);
            return $this->success(['rooms' => $rooms]);
        } catch (Exception $e) {
            return $this->serverError('Failed to load direct messages');
        }
    }

    private function formatMessage($message)
    {
        $user = $this->userRepository->find($message->user_id);
        
        return [
            'id' => $message->id,
            'content' => $message->content,
            'user_id' => $message->user_id,
            'username' => $user ? $user->username : 'Unknown User',
            'avatar_url' => $user ? $user->avatar_url : null,
            'sent_at' => $message->created_at,
            'edited_at' => $message->edited_at ?? null,
            'type' => $message->type ?? 'text'
        ];
    }    private function sendWebSocketNotification($data, $targetUserId = null)
    {
        try {
            $wsClient = new WebSocketClient();
            if ($targetUserId) {
                $wsClient->notifyUser($targetUserId, 'message', $data);
            } else {
                $wsClient->broadcast('message', $data);
            }
        } catch (Exception $e) {
            error_log('WebSocket notification failed: ' . $e->getMessage());
        }
    }
}
