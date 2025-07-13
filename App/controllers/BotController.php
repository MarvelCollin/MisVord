<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';

class BotController extends BaseController
{
    private $userRepository;
    private $userServerMembershipRepository;

    public function __construct()
    {
        parent::__construct();
        $this->userRepository = new UserRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
    }

    public function create()
    {
        $this->requireAuth();

        $input = $this->getInput();

        try {
            $errors = [];

            if (empty($input['username'])) {
                $errors['username'] = 'Bot username is required';
            }

            if (empty($input['email'])) {
                $errors['email'] = 'Bot email is required';
            }

            if (!empty($errors)) {
                return $this->error('Validation failed', 400, $errors);
            }

            $username = trim($input['username']);
            $email = trim($input['email']);
            $serverId = $input['server_id'] ?? null;

            if (strlen($username) < 3 || strlen($username) > 32) {
                return $this->error('Bot username must be between 3 and 32 characters', 400);
            }

            if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
                return $this->error('Bot username can only contain letters, numbers, and underscores', 400);
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->error('Invalid email format', 400);
            }

            if ($this->userRepository->findByUsername($username)) {
                return $this->error('Username already exists', 400);
            }

            if ($this->userRepository->findByEmail($email)) {
                return $this->error('Email already exists', 400);
            }

            $botData = [
                'username' => $username,
                'email' => $email,
                'discriminator' => '0000',
                'display_name' => $username,
                'bio' => 'Bot user'
            ];

            $bot = $this->userRepository->createBot($botData);

            if (!$bot) {
                return $this->serverError('Failed to create bot');
            }

            $this->logActivity('bot_created', [
                'bot_id' => $bot->id,
                'bot_username' => $username,
                'created_by' => $this->getCurrentUserId()
            ]);

            $responseData = [
                'bot' => [
                    'id' => $bot->id,
                    'username' => $bot->username,
                    'email' => $bot->email,
                    'discriminator' => $bot->discriminator,
                    'status' => $bot->status,
                    'created_at' => $bot->created_at
                ]
            ];

            if ($serverId) {
                $joinResult = $this->joinServer($bot->id, $serverId);
                if ($joinResult['success']) {
                    $responseData['server_joined'] = true;
                    $responseData['server_id'] = $serverId;
                } else {
                    $responseData['server_join_error'] = $joinResult['message'];
                }
            }

            return $this->success($responseData, 'Bot created successfully');

        } catch (Exception $e) {
            $this->logActivity('bot_creation_error', [
                'error' => $e->getMessage(),
                'created_by' => $this->getCurrentUserId()
            ]);

            return $this->serverError('An error occurred while creating bot: ' . $e->getMessage());
        }
    }

    public function createTitibot()
    {
        $this->requireAuth();

        $username = 'titibot';
        $email = 'titibot@misvord.com';

        $existingUser = $this->userRepository->findByUsername($username);
        if ($existingUser) {
            return $this->error('Bot "titibot" already exists.', 409);
        }

        if ($this->userRepository->findByEmail($email)) {
            $email = 'titibot.' . uniqid() . '@misvord.com';
        }

        $botData = [
            'username' => $username,
            'email' => $email,
            'discriminator' => '0000',
            'display_name' => $username,
            'bio' => 'The one and only Titibot, created by a special shortcut.'
        ];

        $bot = $this->userRepository->createBot($botData);

        if (!$bot) {
            return $this->serverError('Failed to create the Titibot.');
        }

        $this->logActivity('bot_created_shortcut', [
            'bot_id' => $bot->id,
            'bot_username' => $username,
            'created_by' => $this->getCurrentUserId()
        ]);

        return $this->success(['bot' => $bot], 'Bot "titibot" created successfully.');
    }

    public function check($username)
    {
        $this->requireAuth();

        if (!$username) {
            return $this->error('Username is required', 400);
        }

        try {
            $user = $this->userRepository->findByUsername($username);

            if (!$user) {
                return $this->success([
                    'exists' => false,
                    'message' => 'Bot does not exist'
                ]);
            }

            $isBot = $user->status === 'bot';

            if (!$isBot) {
                return $this->success([
                    'exists' => true,
                    'is_bot' => false,
                    'message' => 'User exists but is not a bot'
                ]);
            }

            return $this->success([
                'exists' => true,
                'is_bot' => true,
                'bot' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'discriminator' => $user->discriminator,
                    'status' => $user->status,
                    'display_name' => $user->display_name,
                    'created_at' => $user->created_at
                ]
            ]);

        } catch (Exception $e) {
            return $this->serverError('An error occurred while checking bot: ' . $e->getMessage());
        }
    }

    public function list()
    {
        $this->requireAuth();

        try {
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
            $bots = $this->userRepository->getBots($limit);

            $formattedBots = array_map(function($bot) {
                return [
                    'id' => $bot->id,
                    'username' => $bot->username,
                    'email' => $bot->email,
                    'discriminator' => $bot->discriminator,
                    'display_name' => $bot->display_name,
                    'avatar_url' => $bot->avatar_url,
                    'status' => $bot->status,
                    'created_at' => $bot->created_at
                ];
            }, $bots);

            return $this->success([
                'bots' => $formattedBots,
                'total' => count($formattedBots)
            ]);

        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving bots: ' . $e->getMessage());
        }
    }

    public function joinServer($botId, $serverId, $role = 'member')
    {
        try {
            $bot = $this->userRepository->find($botId);
            if (!$bot || $bot->status !== 'bot') {
                return ['success' => false, 'message' => 'Bot not found or invalid'];
            }

            $membership = $this->userServerMembershipRepository->findByUserAndServer($botId, $serverId);
            if ($membership) {
                return ['success' => false, 'message' => 'Bot is already a member of this server'];
            }

            $result = $this->userServerMembershipRepository->addMembership($botId, $serverId, $role);

            if ($result) {
                $this->logActivity('bot_joined_server', [
                    'bot_id' => $botId,
                    'server_id' => $serverId,
                    'role' => $role,
                    'initiated_by' => $this->getCurrentUserId()
                ]);

                return ['success' => true, 'message' => 'Bot joined server successfully'];
            } else {
                return ['success' => false, 'message' => 'Failed to join server'];
            }

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error joining server: ' . $e->getMessage()];
        }
    }

    public function addToServer()
    {
        $this->requireAuth();

        $input = $this->getInput();

        try {
            if (!isset($input['bot_id']) || !isset($input['server_id'])) {
                return $this->error('Bot ID and Server ID are required', 400);
            }

            $botId = $input['bot_id'];
            $serverId = $input['server_id'];
            $role = isset($input['role']) ? $input['role'] : 'member';

            $result = $this->joinServer($botId, $serverId, $role);

            if ($result['success']) {
                return $this->success([], $result['message']);
            } else {
                return $this->error($result['message'], 400);
            }

        } catch (Exception $e) {
            return $this->serverError('An error occurred while adding bot to server: ' . $e->getMessage());
        }
    }

    public function removeFromServer()
    {
        $this->requireAuth();

        $input = $this->getInput();

        try {
            if (!isset($input['bot_id']) || !isset($input['server_id'])) {
                return $this->error('Bot ID and Server ID are required', 400);
            }

            $botId = $input['bot_id'];
            $serverId = $input['server_id'];

            $bot = $this->userRepository->find($botId);
            if (!$bot || $bot->status !== 'bot') {
                return $this->error('Bot not found or invalid', 404);
            }

            $result = $this->userServerMembershipRepository->removeMembership($botId, $serverId);

            if ($result) {
                $this->logActivity('bot_removed_from_server', [
                    'bot_id' => $botId,
                    'server_id' => $serverId,
                    'initiated_by' => $this->getCurrentUserId()
                ]);

                return $this->success([], 'Bot removed from server successfully');
            } else {
                return $this->error('Failed to remove bot from server', 400);
            }

        } catch (Exception $e) {
            return $this->serverError('An error occurred while removing bot from server: ' . $e->getMessage());
        }
    }

    public function delete($botId)
    {
        $this->requireAuth();

        try {
            $bot = $this->userRepository->find($botId);
            if (!$bot || $bot->status !== 'bot') {
                return $this->error('Bot not found or invalid', 404);
            }

            $result = $this->userRepository->delete($botId);

            if ($result) {
                $this->logActivity('bot_deleted', [
                    'bot_id' => $botId,
                    'bot_username' => $bot->username,
                    'deleted_by' => $this->getCurrentUserId()
                ]);

                return $this->success([], 'Bot deleted successfully');
            } else {
                return $this->serverError('Failed to delete bot');
            }

        } catch (Exception $e) {
            return $this->serverError('An error occurred while deleting bot: ' . $e->getMessage());
        }
    }

    public function sendChannelMessage()
    {
        $input = $this->getInput();
        error_log('[BOT DEBUG] sendChannelMessage input: ' . json_encode($input));


        if (!isset($input['user_id']) || !isset($input['channel_id']) || !isset($input['content'])) {
            $errorMsg = 'Bot user_id, channel_id, and content are required';
            error_log('[BOT ERROR] ' . $errorMsg . ': ' . json_encode($input));

            return $this->error($errorMsg, 400);
        }

        $input['content'] = $this->sanitize($input['content']);

        try {
            $bot = $this->userRepository->find($input['user_id']);
            if (!$bot) {
                $errorMsg = 'Bot user not found: ' . $input['user_id'];
                error_log('[BOT ERROR] ' . $errorMsg);
                return $this->error($errorMsg, 404);
            }
            if ($bot->status !== 'bot') {
                $errorMsg = 'User is not a bot: ' . $input['user_id'];
                error_log('[BOT ERROR] ' . $errorMsg);
                return $this->error($errorMsg, 400);
            }

            require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
            require_once __DIR__ . '/../database/repositories/MessageRepository.php';
            require_once __DIR__ . '/../database/repositories/ChannelMessageRepository.php';
            require_once __DIR__ . '/../database/query.php';

            $channelRepository = new ChannelRepository();
            $messageRepository = new MessageRepository();
            $channelMessageRepository = new ChannelMessageRepository();


            $channel = $channelRepository->find($input['channel_id']);
            if (!$channel) {
                $errorMsg = 'Channel not found: ' . $input['channel_id'];
                error_log('[BOT ERROR] ' . $errorMsg);
                return $this->error($errorMsg, 404);
            }


            if ($channel->server_id != 0) {
                $membership = $this->userServerMembershipRepository->findByUserAndServer($input['user_id'], $channel->server_id);
                if (!$membership) {
                    $added = $this->userServerMembershipRepository->addMembership($input['user_id'], $channel->server_id, 'member');
                    if (!$added) {
                        $errorMsg = 'Failed to add bot to server: ' . $channel->server_id;
                        error_log('[BOT ERROR] ' . $errorMsg);
                        return $this->error($errorMsg, 500);
                    }
                }
            }

            $query = new Query();
            $query->beginTransaction();


            $messageData = [
                'content' => $input['content'],
                'user_id' => $input['user_id'],
                'message_type' => $input['message_type'] ?? 'text',
                'attachment_url' => $input['attachment_url'] ?? null,
                'sent_at' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];


            if (isset($input['reply_message_id'])) {
                $repliedMessage = $messageRepository->find($input['reply_message_id']);
                if ($repliedMessage) {
                    $messageData['reply_message_id'] = $input['reply_message_id'];
                } else {
                    $errorMsg = 'reply_message_id not found: ' . $input['reply_message_id'];
                    error_log('[BOT ERROR] ' . $errorMsg);
                    return $this->error($errorMsg, 404);
                }
            }


            $message = $messageRepository->create($messageData);

            if ($message && isset($message->id)) {
                $channelMessageRepository->addMessageToChannel($input['channel_id'], $message->id);

                $formattedMessage = [
                    'id' => $message->id,
                    'content' => $message->content,
                    'user_id' => $message->user_id,
                    'username' => $bot->username,
                    'avatar_url' => $bot->avatar_url ?: '/assets/common/default-profile-picture.png',
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
                    $repliedMessage = $messageRepository->find($message->reply_message_id);
                    if ($repliedMessage) {
                        $repliedUser = $this->userRepository->find($repliedMessage->user_id);
                        $formattedMessage['reply_message_id'] = $message->reply_message_id;
                        $formattedMessage['reply_data'] = [
                            'message_id' => $message->reply_message_id,
                            'content' => $repliedMessage->content,
                            'user_id' => $repliedMessage->user_id,
                            'username' => $repliedUser ? $repliedUser->username : 'Unknown',
                            'avatar_url' => $repliedUser && $repliedUser->avatar_url ? $repliedUser->avatar_url : '/assets/common/default-profile-picture.png'
                        ];
                    }
                }

                $query->commit();
                error_log('[BOT DEBUG] Bot message sent successfully: ' . $message->id);
                return $this->success([
                    'data' => [
                        'message' => $formattedMessage,
                        'channel_id' => $input['channel_id']
                    ]
                ], 'Bot message sent successfully');
            } else {
                $query->rollback();
                $errorMsg = 'Failed to save bot message (DB insert failed)';
                error_log('[BOT ERROR] ' . $errorMsg);
                return $this->error($errorMsg, 500);
            }
        } catch (Exception $e) {
            if (isset($query)) {
                $query->rollback();
            }
            $errorMsg = 'Exception: ' . $e->getMessage();
            error_log('[BOT ERROR] ' . $errorMsg);

            return $this->error('Failed to send bot message: ' . $e->getMessage(), 500);
        }
    }

    public function getBotByUsername($username)
    {
        $this->requireAuth();

        if (empty($username)) {
            return $this->error('Bot username is required', 400);
        }

        try {
            $bot = $this->userRepository->findByUsername($username);

            if (!$bot || $bot->status !== 'bot') {
                return $this->error('Bot not found', 404);
            }

            return $this->success(['bot' => $bot]);
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving the bot: ' . $e->getMessage());
        }
    }
    
    
    public function ensureBotInServer($botId, $serverId)
    {
        try {
            require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
            $membershipRepo = new UserServerMembershipRepository();
            

            if ($membershipRepo->isMember($botId, $serverId)) {
                return true;
            }
            
            return false; 
        } catch (Exception $e) {
            error_log("Failed to ensure bot in server: " . $e->getMessage());
            return false;
        }
    }
    
    
    public function ensureBotInChatRoom($botId, $roomId)
    {
        try {
            require_once __DIR__ . '/../database/repositories/ChatRoomRepository.php';
            $chatRoomRepo = new ChatRoomRepository();
            

            if ($chatRoomRepo->isParticipant($roomId, $botId)) {
                return true;
            }
            
            return false; 
        } catch (Exception $e) {
            error_log("Failed to ensure bot in chat room: " . $e->getMessage());
            return false;
        }
    }
}
