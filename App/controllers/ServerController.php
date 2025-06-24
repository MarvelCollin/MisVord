<?php

require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
require_once __DIR__ . '/../database/repositories/CategoryRepository.php';
require_once __DIR__ . '/../database/repositories/MessageRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/repositories/ServerInviteRepository.php';
require_once __DIR__ . '/../database/repositories/RoleRepository.php';
require_once __DIR__ . '/BaseController.php';

class ServerController extends BaseController
{
    private $serverRepository;
    private $channelRepository;
    private $categoryRepository;
    private $messageRepository;
    private $userServerMembershipRepository;
    private $inviteRepository;
    private $roleRepository;

    public function __construct()
    {
        parent::__construct();
        $this->serverRepository = new ServerRepository();
        $this->channelRepository = new ChannelRepository();
        $this->categoryRepository = new CategoryRepository();
        $this->messageRepository = new MessageRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
        $this->inviteRepository = new ServerInviteRepository();
        $this->roleRepository = new RoleRepository();
    }

    public function show($id)
    {
        try {
            if (function_exists('logger')) {
                logger()->debug("ServerController::show called", [
                    'server_id' => $id,
                    'user_id' => $_SESSION['user_id'] ?? 'not_set',
                    'session_id' => session_id(),
                    'request_uri' => $_SERVER['REQUEST_URI'] ?? ''
                ]);
            }

            $this->requireAuth();

            if (function_exists('logger')) {
                logger()->debug("Authentication passed", [
                    'server_id' => $id,
                    'user_id' => $_SESSION['user_id']
                ]);
            }

            $server = $this->serverRepository->find($id);
            if (!$server) {
                return $this->notFound('Server not found');
            }

            $membership = $this->userServerMembershipRepository->findByUserAndServer($this->getCurrentUserId(), $id);
            if (!$membership) {
                return $this->forbidden('You are not a member of this server');
            }
            try {
                $channels = $this->channelRepository->getByServerId($id);
                $categories = $this->categoryRepository->getForServer($id);

                $serverMembers = $this->userServerMembershipRepository->getServerMembers($id);
                
                $serverRoles = $this->roleRepository->getForServer($id);

                if (function_exists('logger')) {
                    logger()->debug("Loaded server data", [
                        'server_id' => $id,
                        'channels_count' => count($channels),
                        'categories_count' => count($categories),
                        'members_count' => count($serverMembers),
                        'roles_count' => count($serverRoles)
                    ]);
                }

                $activeChannelId = $_GET['channel'] ?? null;
                $activeChannel = null;
                $channelMessages = [];
                if (!$activeChannelId && !empty($channels)) {
                    $defaultChannelId = null;
                    foreach ($channels as $channel) {
                        if ($channel['type'] === 'text' || $channel['type'] === 0 || $channel['type_name'] === 'text') {
                            $defaultChannelId = $channel['id'];
                            break;
                        }
                    }
                    if ($defaultChannelId) {
                        $this->redirect("/server/{$id}?channel={$defaultChannelId}");
                        return;
                    }
                }

                if ($activeChannelId) {
                    $activeChannel = $this->channelRepository->find($activeChannelId);
                    if ($activeChannel && $activeChannel->server_id == $id) {
                        try {
                            $channelMessages = $this->messageRepository->getForChannel($activeChannelId, 50, 0);
                            $this->logActivity('channel_messages_loaded', [
                                'channel_id' => $activeChannelId,
                                'message_count' => count($channelMessages)
                            ]);
                        } catch (Exception $e) {
                            $this->logActivity('channel_messages_error', [
                                'channel_id' => $activeChannelId,
                                'error' => $e->getMessage()
                            ]);
                        }
                    }
                }

                if ($this->isApiRoute() || ($this->isAjaxRequest() && !isset($_GET['render_html']))) {
                    return $this->success([
                        'server' => $this->formatServer($server),
                        'channels' => array_map([$this, 'formatChannel'], $channels),
                        'categories' => $categories,
                        'active_channel' => $activeChannel ? $this->formatChannel($activeChannel) : null,
                        'messages' => $channelMessages,
                        'members' => $serverMembers,
                        'roles' => $serverRoles
                    ]);
                }
                
                $GLOBALS['server'] = $server;
                $GLOBALS['currentServer'] = $server;
                $GLOBALS['serverChannels'] = $channels;
                $GLOBALS['serverCategories'] = $categories;
                $GLOBALS['activeChannelId'] = $activeChannelId;
                $GLOBALS['channelMessages'] = $channelMessages;
                $GLOBALS['serverMembers'] = $serverMembers;
                $GLOBALS['serverRoles'] = $serverRoles;

                $this->logActivity('server_view', ['server_id' => $id]);

                require_once __DIR__ . '/../views/pages/server-page.php';
            } catch (Exception $e) {
                $this->logActivity('server_view_error', [
                    'server_id' => $id,
                    'error' => $e->getMessage()
                ]);

                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->serverError('Failed to load server');
                }

                $this->redirect('/404');
            }
        } catch (Exception $e) {
            if (function_exists('logger')) {
                logger()->error("Unexpected error in ServerController::show", [
                    'server_id' => $id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
            return $this->serverError('An unexpected error occurred');
        }
    }

    public function create()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, [
            'name' => 'required',
            'description' => 'required',
            'category' => 'required'
        ]);

        $name = $input['name'];
        $description = $input['description'] ?? '';
        
        try {
            require_once __DIR__ . '/../database/models/Server.php';
            require_once __DIR__ . '/../database/models/UserServerMembership.php';
            require_once __DIR__ . '/../database/models/Channel.php';
            
            $server = new Server();
            $server->name = $name;
            $server->description = $description;
            $server->is_public = isset($input['is_public']) ? (bool)$input['is_public'] : false;
            $server->category = $input['category'] ?? null;

            if (isset($_FILES['server_icon']) && $_FILES['server_icon']['error'] === UPLOAD_ERR_OK) {
                $imageUrl = $this->uploadImage($_FILES['server_icon'], 'servers');
                if ($imageUrl !== false) {
                    $server->image_url = $imageUrl;
                }
            }
            if (isset($_FILES['server_banner']) && $_FILES['server_banner']['error'] === UPLOAD_ERR_OK) {
                $bannerUrl = $this->uploadImage($_FILES['server_banner'], 'banners');
                if ($bannerUrl !== false) {
                    $server->banner_url = $bannerUrl;
                }
            }

            if ($server->save()) {
                $membership = new UserServerMembership();
                $membership->user_id = $this->getCurrentUserId();
                $membership->server_id = $server->id;
                $membership->role = 'owner';
                $membership->save();
                
                $generalChannel = new Channel();
                $generalChannel->name = 'general';
                $generalChannel->type = 'text';
                $generalChannel->server_id = $server->id;
                if (!$generalChannel->save()) {
                    throw new Exception('Failed to create default channel');
                }

                $this->logActivity('server_created', [
                    'server_id' => $server->id,
                    'server_name' => $name
                ]);

                return $this->success([
                    'server' => $this->formatServer($server),
                    'redirect' => "/server/{$server->id}"
                ], 'Server created successfully');
            } else {
                throw new Exception('Failed to save server');
            }
        } catch (Exception $e) {
            $this->logActivity('server_create_error', [
                'server_name' => $name,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to create server: ' . $e->getMessage());
        }
    }

    public function update($id)
    {
        $this->requireAuth();

        $server = $this->serverRepository->find($id);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        if (!$this->canManageServer($server)) {
            return $this->forbidden('You do not have permission to edit this server');
        }

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $errors = [];

        if (isset($input['name'])) {
            if (empty($input['name'])) {
                $errors['name'] = 'Server name is required';
            } else {
                $server->name = $input['name'];
            }
        }

        if (isset($input['description'])) {
            $server->description = $input['description'];
        }
        
        if (isset($input['is_public'])) {
            $server->is_public = (bool)$input['is_public'];
        }
        
        if (isset($input['category'])) {
            $server->category = $input['category'];
        }

        if (isset($_FILES['server_icon']) && $_FILES['server_icon']['error'] === UPLOAD_ERR_OK) {
            $imageUrl = $this->uploadImage($_FILES['server_icon'], 'servers');
            if ($imageUrl !== false) {
                $server->image_url = $imageUrl;
            }
        }
        
        if (isset($_FILES['server_banner']) && $_FILES['server_banner']['error'] === UPLOAD_ERR_OK) {
            $bannerUrl = $this->uploadImage($_FILES['server_banner'], 'banners');
            if ($bannerUrl !== false) {
                $server->banner_url = $bannerUrl;
            }
        }

        if (!empty($errors)) {
            return $this->validationError($errors);
        }

        try {
            if ($server->save()) {
                $this->logActivity('server_updated', [
                    'server_id' => $id,
                    'changes' => array_keys($input)
                ]);

                return $this->success([
                    'server' => $this->formatServer($server)
                ], 'Server updated successfully');
            } else {
                throw new Exception('Failed to save server');
            }
        } catch (Exception $e) {
            $this->logActivity('server_update_error', [
                'server_id' => $id,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to update server');
        }
    }

    public function delete()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $id = $input['server_id'] ?? null;

        if (!$id) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }

        $server = $this->serverRepository->find($id);
        if (!$server) {
            return $this->notFound('Server not found');
        }
        if (!$server->isOwner($this->getCurrentUserId())) {
            return $this->forbidden('Only the server owner can delete this server');
        }

        try {
            $deleted = $this->serverRepository->delete($id);

            if ($deleted) {
                $this->logActivity('server_deleted', [
                    'server_id' => $id,
                    'server_name' => $server->name
                ]);

                return $this->success(['redirect' => '/home'], 'Server deleted successfully');
            } else {
                throw new Exception('Failed to delete server');
            }
        } catch (Exception $e) {
            $this->logActivity('server_delete_error', [
                'server_id' => $id,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to delete server');
        }
    }

    public function join($inviteCode = null)
    {
        if (function_exists('logger')) {
            logger()->debug("Join method called", [
                'invite_code' => $inviteCode,
                'session_status' => session_status(),
                'session_id' => session_id(),
                'user_id' => $_SESSION['user_id'] ?? 'not_set',
                'is_authenticated' => isset($_SESSION['user_id']),
                'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN',
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'UNKNOWN',
                'session_data' => $_SESSION
            ]);
        }
        
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['user_id'])) {
            $redirectUrl = '/login?redirect=/join/' . urlencode($inviteCode);
            
            if (function_exists('logger')) {
                logger()->warning("User not authenticated for join", [
                    'redirect_to' => $redirectUrl,
                    'session_id' => session_id(),
                    'session_data' => $_SESSION
                ]);
            }
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->unauthorized('Authentication required to join a server');
            } else {
                header('Location: ' . $redirectUrl);
                exit;
            }
        }

        if (!$inviteCode) {
            $input = $this->getInput();
            $inviteCode = $input['code'] ?? null;
        }

        if (!$inviteCode) {
            return $this->validationError(['code' => 'Invite code is required']);
        }

        try {
            $invite = $this->inviteRepository->findByCode($inviteCode);
            
            if (!$invite) {
                return $this->notFound('Invite not found or expired');
            }
            
            if (!$invite->isValid()) {
                return $this->notFound('Invite has expired');
            }
            
            $server = $this->serverRepository->find($invite->server_id);
            if (!$server) {
                return $this->notFound('Server not found');
            }
            
            if ($this->userServerMembershipRepository->isMember($this->getCurrentUserId(), $server->id)) {
                $redirectUrl = "/server/{$server->id}";
                
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->success([
                        'message' => 'You are already a member of this server',
                        'redirect' => $redirectUrl
                    ]);
                } else {
                    header('Location: ' . $redirectUrl);
                    exit;
                }
            }
            
            $result = $this->userServerMembershipRepository->create([
                'user_id' => $this->getCurrentUserId(),
                'server_id' => $server->id,
                'role' => 'member',
                'joined_at' => date('Y-m-d H:i:s')
            ]);
            
            if (!$result) {
                return $this->serverError('Failed to join server');
            }
            
            $this->inviteRepository->useInvite($inviteCode);

            $this->logActivity('server_joined', [
                'server_id' => $server->id,
                'invite_code' => $inviteCode
            ]);
                
            $redirectUrl = "/server/{$server->id}";
            
            if (function_exists('logger')) {
                logger()->info("User successfully joined server", [
                    'user_id' => $this->getCurrentUserId(),
                    'server_id' => $server->id,
                    'redirect_to' => $redirectUrl
                ]);
            }
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'message' => 'Successfully joined server',
                    'redirect' => $redirectUrl
                ]);
            } else {
                header('Location: ' . $redirectUrl);
                exit;
            }
            
        } catch (Exception $e) {
            if (function_exists('logger')) {
                logger()->error("Error joining server", [
                    'invite_code' => $inviteCode,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
            
            $this->logActivity('server_join_error', [
                'invite_code' => $inviteCode,
                'error' => $e->getMessage()
            ]);
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->serverError('Failed to join server: ' . $e->getMessage());
            } else {
                $GLOBALS['inviteError'] = 'Failed to join server: ' . $e->getMessage();
                $this->showInvite($inviteCode);
                exit;
            }
        }
    }

    public function leave($id)
    {
        $this->requireAuth();

        $server = $this->serverRepository->find($id);
        if (!$server) {
            return $this->notFound('Server not found');
        }
        $membership = $this->userServerMembershipRepository->findByUserAndServer($this->getCurrentUserId(), $id);
        if (!$membership) {
            return $this->notFound('You are not a member of this server');
        }
        if ($server->isOwner($this->getCurrentUserId())) {
            return $this->validationError(['server' => 'Server owner cannot leave. Transfer ownership first.']);
        }

        try {

            if ($this->userServerMembershipRepository->removeMembership($this->getCurrentUserId(), $id)) {
                $this->logActivity('server_left', [
                    'server_id' => $id,
                    'server_name' => $server->name
                ]);

                return $this->success(['redirect' => '/home'], 'Left server successfully');
            } else {
                throw new Exception('Failed to leave server');
            }
        } catch (Exception $e) {
            $this->logActivity('server_leave_error', [
                'server_id' => $id,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to leave server');
        }
    }
    public function getUserServers()
    {
        $this->requireAuth();

        $currentUserId = $this->getCurrentUserId();

        try {
            $userServers = $this->serverRepository->getForUser($currentUserId);
            $memberships = $this->userServerMembershipRepository->getServersForUser($currentUserId);

            if (function_exists('logger')) {
                logger()->debug("User servers loaded for sidebar", [
                    'user_id' => $currentUserId,
                    'server_count' => count($userServers),
                    'membership_count' => count($memberships)
                ]);
            }

            $GLOBALS['userServers'] = $userServers;

            return [
                'userServers' => $userServers,
                'memberships' => $memberships,
                'currentUserId' => $currentUserId
            ];
        } catch (Exception $e) {
            if (function_exists('logger')) {
                logger()->error("Failed to get user servers", [
                    'user_id' => $currentUserId,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

            $GLOBALS['userServers'] = [];

            return [
                'userServers' => [],
                'memberships' => [],
                'currentUserId' => $currentUserId
            ];
        }
    }

    public function initSidebar()
    {
        return $this->getUserServers();
    }

    public function showInvite($code = null)
    {
        if (!$code) {
            $input = $this->getInput();
            $code = $input['code'] ?? null;
        }

        if (!$code) {
            return $this->notFound('Invalid invite code');
        }
        
        try {
            $invite = $this->inviteRepository->findByCode($code);
            if (!$invite) {
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->notFound('Invite not found or expired');
                } else {
                    $GLOBALS['inviteError'] = 'Invite not found or expired';
                    require_once __DIR__ . '/../views/pages/accept-invite.php';
                    exit;
                }
            }

            if (!$invite->isValid()) {
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->notFound('Invite has expired');
                } else {
                    $GLOBALS['inviteError'] = 'Invite has expired';
                    require_once __DIR__ . '/../views/pages/accept-invite.php';
                    exit;
                }
            }

            $server = $this->serverRepository->find($invite->server_id);
            if (!$server) {
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->notFound('Server not found');
                } else {
                    $GLOBALS['inviteError'] = 'Server not found';
                    require_once __DIR__ . '/../views/pages/accept-invite.php';
                    exit;
                }
            }

            if (isset($_SESSION['user_id'])) {
                if ($this->userServerMembershipRepository->isMember($this->getCurrentUserId(), $server->id)) {
                    $redirectUrl = "/server/{$server->id}";
                    
                    if ($this->isApiRoute() || $this->isAjaxRequest()) {
                        return $this->success([
                            'already_member' => true,
                            'message' => 'You are already a member of this server',
                            'redirect' => $redirectUrl
                        ]);
                    } else {                
                        $_SESSION['flash_message'] = [
                            'type' => 'info',
                            'message' => 'You are already a member of this server'
                        ];
                        header("Location: {$redirectUrl}");
                        exit;
                    }
                }
            }

            $this->logActivity('invite_viewed', [
                'invite_code' => $code,
                'server_id' => $server->id
            ]);

            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'invite' => $invite,
                    'server' => $this->formatServer($server)
                ]);
            } else {
                $GLOBALS['invite'] = $invite;
                $GLOBALS['inviteServer'] = $server;
                $GLOBALS['inviteCode'] = $code;
                require_once __DIR__ . '/../views/pages/accept-invite.php';
            }
        } catch (Exception $e) {
            $this->logActivity('invite_view_error', [
                'invite_code' => $code,
                'error' => $e->getMessage()
            ]);
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->serverError('Failed to load invite details: ' . $e->getMessage());
            } else {
                $GLOBALS['inviteError'] = 'Failed to load invite details: ' . $e->getMessage();
                require_once __DIR__ . '/../views/pages/accept-invite.php';
                exit;
            }
        }
    }

    public function getServerChannels($serverId = null)
    {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized('Authentication required');
        }


        if (!$serverId) {
            $input = $this->getInput();
            $serverId = $input['server_id'] ?? null;
        }

        if (!$serverId) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }
        try {
            if (!isset($_SESSION['csrf_token'])) {
                $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            }

            if (!$this->userServerMembershipRepository->isMember($this->getCurrentUserId(), $serverId)) {
                return $this->forbidden('You do not have access to this server');
            }

            $channels = $this->channelRepository->getByServerId($serverId);
            $categories = $this->categoryRepository->getForServer($serverId);

            $responseData = [
                'channels' => $channels,
                'categories' => $categories,
                'server_id' => $serverId
            ];

            $categoryStructured = [];
            foreach ($categories as $category) {
                $categoryChannels = array_filter($channels, function ($ch) use ($category) {
                    return isset($ch['category_id']) && $ch['category_id'] == $category['id'];
                });

                $categoryStructured[] = [
                    'id' => $category['id'],
                    'name' => $category['name'],
                    'channels' => array_values($categoryChannels)
                ];
            }

            $uncategorizedChannels = array_filter($channels, function ($ch) {
                return !isset($ch['category_id']) || empty($ch['category_id']);
            });

            if (!empty($uncategorizedChannels)) {
                $responseData['uncategorized'] = array_values($uncategorizedChannels);
            }

            $responseData['categoryStructure'] = $categoryStructured;

            $this->logActivity('server_channels_viewed', ['server_id' => $serverId]);

            return $this->success($responseData);
        } catch (Exception $e) {
            $this->logActivity('server_channels_error', [
                'server_id' => $serverId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load server channels');
        }
    }
    public function getServerDetails($serverId = null)
    {
        $this->requireAuth();

        if (!$serverId) {
            $input = $this->getInput();
            $serverId = $input['server_id'] ?? null;
        }

        if (!$serverId) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }

        try {
            $server = $this->serverRepository->find($serverId);
            if (!$server) {
                return $this->notFound('Server not found');
            }
            if (!$this->userServerMembershipRepository->isMember($this->getCurrentUserId(), $serverId)) {
                return $this->forbidden('You do not have access to this server');
            }

            $this->logActivity('server_details_viewed', ['server_id' => $serverId]);

            return $this->success(['server' => $server]);
        } catch (Exception $e) {
            $this->logActivity('server_details_error', [
                'server_id' => $serverId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load server details');
        }
    }

    public function generateInviteLink($serverId = null)
    {
        $this->requireAuth();

        if (!$serverId) {
            $input = $this->getInput();
            $serverId = $input['server_id'] ?? null;
        }

        if (!$serverId) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }
        try {
            $server = $this->serverRepository->find($serverId);
            if (!$server) {
                return $this->notFound('Server not found');
            }

            
            $membership = $this->userServerMembershipRepository->findByUserAndServer($this->getCurrentUserId(), $serverId);
            if (!$membership || (!$this->userServerMembershipRepository->isOwner($this->getCurrentUserId(), $serverId) && 
                $membership->role !== 'admin' && $membership->role !== 'moderator')) {
                return $this->forbidden('You do not have permission to generate invite links');
            }
            
            $input = $this->getInput();
            $expiresAt = null;
            
            if (isset($input['expires_in'])) {
                $hours = (int)$input['expires_in'];
                if ($hours > 0) {
                    $expiresAt = date('Y-m-d H:i:s', strtotime("+{$hours} hours"));
                }
            } else if (isset($input['expires_at'])) {               
                $expiresAt = date('Y-m-d H:i:s', strtotime($input['expires_at']));
            }
            
            
            $invite = $this->inviteRepository->createInvite(
                $serverId, 
                $this->getCurrentUserId(),
                $expiresAt
            );

            if (!$invite) {
                return $this->serverError('Failed to create invite');
            }
            
            
                $this->logActivity('invite_generated', [
                    'server_id' => $serverId,
                'invite_code' => $invite->invite_link,
                    'expires_at' => $expiresAt
                ]);


                return $this->success([
                'invite_code' => $invite->invite_link,
                'invite_url' => $this->getBaseUrl() . '/join/' . $invite->invite_link,
                    'expires_at' => $expiresAt
                ]);
        } catch (Exception $e) {
            $this->logActivity('invite_generation_error', [
                'server_id' => $serverId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to generate invite link: ' . $e->getMessage());
        }
    }

    public function updateServerSettings($id)
    {
        $this->requireAuth();

        $server = $this->serverRepository->find($id);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        if (!$this->canManageServer($server)) {
            return $this->forbidden('You do not have permission to edit this server');
        }

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $errors = [];

        if (isset($input['name'])) {
            if (empty($input['name'])) {
                $errors['name'] = 'Server name is required';
            } else {
                $server->name = $input['name'];
            }
        }

        if (isset($input['description'])) {
            $server->description = $input['description'];
        }
        
        if (isset($input['is_public'])) {
            $server->is_public = (bool)$input['is_public'];
        }
        
        if (isset($input['category'])) {
            $server->category = $input['category'];
        }

        if (isset($_FILES['server_icon']) && $_FILES['server_icon']['error'] === UPLOAD_ERR_OK) {
            $imageUrl = $this->uploadImage($_FILES['server_icon'], 'servers');
            if ($imageUrl !== false) {
                $server->image_url = $imageUrl;
            }
        }

        if (!empty($errors)) {
            return $this->validationError($errors);
        }

        try {
            if ($server->save()) {
                $this->logActivity('server_settings_updated', [
                    'server_id' => $id,
                    'changes' => array_keys($input)
                ]);

                return $this->success([
                    'server' => $this->formatServer($server)
                ], 'Server settings updated successfully');
            } else {
                throw new Exception('Failed to save server settings');
            }
        } catch (Exception $e) {
            $this->logActivity('server_settings_update_error', [
                'server_id' => $id,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to update server settings');
        }
    }

    public function getServerMembers($serverId)
    {
        $this->requireAuth();

        if (!$serverId) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }

        try {
            $server = $this->serverRepository->find($serverId);
            if (!$server) {
                return $this->notFound('Server not found');
            }

            if (!$this->userServerMembershipRepository->isMember($this->getCurrentUserId(), $serverId)) {
                return $this->forbidden('You do not have access to this server');
            }

            $members = $this->userServerMembershipRepository->getServerMembers($serverId);
            $ownerId = $server->getOwnerId();

            $formattedMembers = array_map(function($member) use ($ownerId) {
                $isOwner = $member['id'] == $ownerId;
                
                return [
                    'id' => $member['id'],
                    'username' => $member['username'],
                    'discriminator' => $member['discriminator'] ?? '0000',
                    'display_name' => $member['display_name'] ?? $member['username'],
                    'avatar_url' => $member['avatar_url'],
                    'role' => $isOwner ? 'owner' : ($member['role'] ?? 'member'),
                    'is_owner' => $isOwner,
                    'status' => $member['status'] ?? 'offline',
                    'joined_at' => $member['joined_at'] ?? date('Y-m-d H:i:s')
                ];
            }, $members);

            usort($formattedMembers, function($a, $b) {
                if ($a['is_owner'] && !$b['is_owner']) return -1;
                if (!$a['is_owner'] && $b['is_owner']) return 1;
                
                if ($a['role'] !== $b['role']) {
                    $roleOrder = ['owner' => 0, 'admin' => 1, 'moderator' => 2, 'member' => 3];
                    return $roleOrder[$a['role']] <=> $roleOrder[$b['role']];
                }
                
                return strcasecmp($a['username'], $b['username']);
            });

            $this->logActivity('server_members_viewed', ['server_id' => $serverId]);

            return $this->success([
                'members' => $formattedMembers,
                'total' => count($formattedMembers)
            ]);
        } catch (Exception $e) {
            $this->logActivity('server_members_error', [
                'server_id' => $serverId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load server members: ' . $e->getMessage());
        }
    }

    public function checkInviteValidity($code = null)
    {
        if (!$code) {
            $input = $this->getInput();
            $code = $input['code'] ?? null;
        }

        if (!$code) {
            if (!$this->isApiRoute() && !$this->isAjaxRequest()) {
                header('Location: /app');
                exit;
            }
            return $this->notFound('Invalid invite code');
        }
        
        try {
            $invite = $this->inviteRepository->findByCode($code);
            if (!$invite) {
                if (!$this->isApiRoute() && !$this->isAjaxRequest()) {
                    $GLOBALS['inviteError'] = 'Invite not found or expired';
                    require_once __DIR__ . '/../views/pages/accept-invite.php';
                    exit;
                }
                return $this->notFound('Invite not found or expired');
            }

            if (!$invite->isValid()) {
                if (!$this->isApiRoute() && !$this->isAjaxRequest()) {
                    $GLOBALS['inviteError'] = 'Invite has expired';
                    require_once __DIR__ . '/../views/pages/accept-invite.php';
                    exit;
                }
                return $this->notFound('Invite has expired');
            }

            $server = $this->serverRepository->find($invite->server_id);
            if (!$server) {
                if (!$this->isApiRoute() && !$this->isAjaxRequest()) {
                    $GLOBALS['inviteError'] = 'Server not found';
                    require_once __DIR__ . '/../views/pages/accept-invite.php';
                    exit;
                }
                return $this->notFound('Server not found');
            }

            $this->logActivity('invite_checked', [
                'invite_code' => $code,
                'server_id' => $server->id,
                'valid' => true
            ]);

            if (!$this->isApiRoute() && !$this->isAjaxRequest()) {
                header('Location: /join/' . $code);
                exit;
            }

            return $this->success([
                'valid' => true,
                'server' => $this->formatServer($server),
                'invite' => $invite
            ]);
        } catch (Exception $e) {
            $this->logActivity('invite_check_error', [
                'invite_code' => $code,
                'error' => $e->getMessage()
            ]);
            
            if (!$this->isApiRoute() && !$this->isAjaxRequest()) {
                $GLOBALS['inviteError'] = 'Failed to validate invite: ' . $e->getMessage();
                require_once __DIR__ . '/../views/pages/accept-invite.php';
                exit;
            }
            
            return $this->notFound('Failed to validate invite: ' . $e->getMessage());
        }
    }

    private function formatServer($server)
    {
        return [
            'id' => $server->id,
            'name' => $server->name,
            'description' => $server->description,
            'image_url' => $server->image_url ?? null,
            'banner_url' => $server->banner_url ?? null,
            'is_public' => $server->is_public ?? false,
            'category' => $server->category ?? null,
            'member_count' => $server->getMemberCount(),
            'created_at' => $server->created_at,
            'updated_at' => $server->updated_at,
            'owner' => $server->getOwner() ? [
                'id' => $server->getOwner()->id,
                'username' => $server->getOwner()->username,
                'display_name' => $server->getOwner()->display_name
            ] : null
        ];
    }

    private function formatChannel($channel)
    {
        return [
            'id' => $channel->id,
            'name' => $channel->name,
            'type' => $channel->type,
            'server_id' => $channel->server_id,
            'category_id' => $channel->category_id,
            'created_at' => $channel->created_at
        ];
    }
    private function canManageServer($server)
    {

        if ($server->isOwner($this->getCurrentUserId())) {
            return true;
        }

        return false;
    }

    private function getBaseUrl() {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        return $protocol . $host;
    }
}
