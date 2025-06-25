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
            
            if (!isset($input['username']) || empty($input['username'])) {
                $errors['username'] = 'Bot username is required';
            }
            
            if (!isset($input['email']) || empty($input['email'])) {
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
            
            $existingUser = $this->userRepository->findByUsername($username);
            if ($existingUser) {
                return $this->error('Username already exists', 400);
            }
            
            $existingEmail = $this->userRepository->findByEmail($email);
            if ($existingEmail) {
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

    public function joinServer($botId, $serverId)
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
            
            $result = $this->userServerMembershipRepository->addMembership($botId, $serverId, 'member');
            
            if ($result) {
                $this->logActivity('bot_joined_server', [
                    'bot_id' => $botId,
                    'server_id' => $serverId,
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
            
            $result = $this->joinServer($botId, $serverId);
            
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
}
