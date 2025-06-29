<?php

require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
require_once __DIR__ . '/../database/repositories/CategoryRepository.php';
require_once __DIR__ . '/../database/repositories/MessageRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/repositories/ServerInviteRepository.php';
require_once __DIR__ . '/../database/models/Channel.php';
require_once __DIR__ . '/BaseController.php';

class ServerController extends BaseController
{
    private $serverRepository;
    private $channelRepository;
    private $categoryRepository;
    private $messageRepository;
    private $userServerMembershipRepository;
    private $inviteRepository;
    private $membershipRepository;

    public function __construct()
    {
        parent::__construct();
        $this->serverRepository = new ServerRepository();
        $this->channelRepository = new ChannelRepository();
        $this->categoryRepository = new CategoryRepository();
        $this->messageRepository = new MessageRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
        $this->inviteRepository = new ServerInviteRepository();
        $this->membershipRepository = $this->userServerMembershipRepository;
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

                if (function_exists('logger')) {
                    logger()->debug("Loaded server data", [
                        'server_id' => $id,
                        'channels_count' => count($channels),
                        'categories_count' => count($categories),
                        'members_count' => count($serverMembers)
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
                        'members' => $serverMembers
                    ]);
                }
                
                $GLOBALS['server'] = $server;
                $GLOBALS['currentServer'] = $server;
                $GLOBALS['serverChannels'] = $channels;
                $GLOBALS['serverCategories'] = $categories;
                $GLOBALS['activeChannelId'] = $activeChannelId;
                $GLOBALS['channelMessages'] = $channelMessages;
                $GLOBALS['serverMembers'] = $serverMembers;

                $this->logActivity('server_view', ['server_id' => $id]);

                if ($this->isAjaxRequest() && isset($_GET['render_html']) && $_GET['render_html'] === '1') {
                    if (!headers_sent()) {
                        header('Access-Control-Allow-Origin: *');
                        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
                        header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
                        header('Access-Control-Allow-Credentials: true');
                        header('Content-Type: text/html; charset=utf-8');
                    }
                    
                    ob_start();
                    require_once __DIR__ . '/../views/pages/server-page.php';
                    $html = ob_get_clean();
                    
                    echo $html;
                    exit;
                }

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
        try {
            $this->requireAuth();

            $input = $this->getInput();
            $input = $this->sanitize($input);

            $this->validate($input, [
                'name' => 'required',
                'description' => 'required',
                'category' => 'required'
            ]);

            $serverData = [
                'name' => $input['name'],
                'description' => $input['description'],
                'is_public' => isset($input['is_public']) ? (bool)$input['is_public'] : false,
                'category' => $input['category']
            ];

            if (isset($_FILES['server_icon']) && $_FILES['server_icon']['error'] === UPLOAD_ERR_OK) {
                try {
                    $this->validateUploadedFile($_FILES['server_icon']);
                    $imageUrl = $this->uploadImage($_FILES['server_icon'], 'icon');
                    if ($imageUrl !== false) {
                        $serverData['image_url'] = $imageUrl;
                    }
                } catch (Exception $e) {
                    if (function_exists('logger')) {
                        logger()->warning("Failed to upload server icon", [
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }

            if (isset($_FILES['server_banner']) && $_FILES['server_banner']['error'] === UPLOAD_ERR_OK) {
                try {
                    $this->validateUploadedFile($_FILES['server_banner']);
                    $bannerUrl = $this->uploadImage($_FILES['server_banner'], 'banner');
                    if ($bannerUrl !== false) {
                        $serverData['banner_url'] = $bannerUrl;
                    }
                } catch (Exception $e) {
                    if (function_exists('logger')) {
                        logger()->warning("Failed to upload server banner", [
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }

            $server = $this->serverRepository->createWithOwner($serverData, $this->getCurrentUserId());
            
            if (!$server) {
                throw new Exception('Failed to create server');
            }

            try {
                $query = $this->query();
                $channelData = [
                    'name' => 'general',
                    'type' => 'text',
                    'server_id' => $server->id,
                    'position' => 0,
                    'is_private' => 0,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];
                
                $channelId = $query->table('channels')->insertGetId($channelData);
                if (!$channelId) {
                    throw new Exception('Failed to create default channel');
                }
            } catch (Exception $channelError) {
                if (function_exists('logger')) {
                    logger()->warning("Failed to create default channel", [
                        'server_id' => $server->id,
                        'error' => $channelError->getMessage()
                    ]);
                }
            }

            $this->logActivity('server_created', [
                'server_id' => $server->id,
                'server_name' => $serverData['name']
            ]);

            return $this->success([
                'server' => $this->formatServer($server),
                'redirect' => "/server/{$server->id}"
            ], 'Server created successfully');

        } catch (Exception $e) {
            $serverName = isset($serverData) && isset($serverData['name']) ? $serverData['name'] : 'unknown';
            $this->logActivity('server_create_error', [
                'server_name' => $serverName,
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
            try {
                $this->validateUploadedFile($_FILES['server_icon']);
                $imageUrl = $this->uploadImage($_FILES['server_icon'], 'icon');
                if ($imageUrl !== false) {
                    $server->image_url = $imageUrl;
                }
            } catch (Exception $e) {
                if (function_exists('logger')) {
                    logger()->warning("Failed to upload server icon", [
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }
        
        if (isset($_FILES['server_banner']) && $_FILES['server_banner']['error'] === UPLOAD_ERR_OK) {
            try {
                $this->validateUploadedFile($_FILES['server_banner']);
                $bannerUrl = $this->uploadImage($_FILES['server_banner'], 'banner');
                if ($bannerUrl !== false) {
                    $server->banner_url = $bannerUrl;
                }
            } catch (Exception $e) {
                if (function_exists('logger')) {
                    logger()->warning("Failed to upload server banner", [
                        'error' => $e->getMessage()
                    ]);
                }
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

    public function getUserServersData()
    {
        $this->requireAuth();
        
        try {
            $userServers = $this->serverRepository->getForUser($this->getCurrentUserId());
            
            $formattedServers = [];
            foreach ($userServers as $server) {
                $formattedServers[] = [
                    'id' => $server['id'] ?? $server->id,
                    'name' => $server['name'] ?? $server->name,
                    'image_url' => $server['image_url'] ?? $server->image_url ?? null,
                    'banner_url' => $server['banner_url'] ?? $server->banner_url ?? null,
                    'description' => $server['description'] ?? $server->description ?? '',
                    'is_public' => $server['is_public'] ?? $server->is_public ?? false,
                    'category' => $server['category'] ?? $server->category ?? null
                ];
            }
            
            return $this->success([
                'servers' => $formattedServers
            ]);
        } catch (Exception $e) {
            return $this->serverError('Failed to load user servers: ' . $e->getMessage());
        }
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
            try {
                $this->validateUploadedFile($_FILES['server_icon']);
                $imageUrl = $this->uploadImage($_FILES['server_icon'], 'icon');
                if ($imageUrl !== false) {
                    $server->image_url = $imageUrl;
                }
            } catch (Exception $e) {
                if (function_exists('logger')) {
                    logger()->warning("Failed to upload server icon", [
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        if (isset($_FILES['server_banner']) && $_FILES['server_banner']['error'] === UPLOAD_ERR_OK) {
            try {
                $this->validateUploadedFile($_FILES['server_banner']);
                $bannerUrl = $this->uploadImage($_FILES['server_banner'], 'banner');
                if ($bannerUrl !== false) {
                    $server->banner_url = $bannerUrl;
                }
            } catch (Exception $e) {
                if (function_exists('logger')) {
                    logger()->warning("Failed to upload server banner", [
                        'error' => $e->getMessage()
                    ]);
                }
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

    public function updateServerField($serverId)
    {
        $this->requireAuth();

        $server = $this->serverRepository->find($serverId);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        if (!$this->canManageServer($server)) {
            return $this->forbidden('You do not have permission to edit this server');
        }

        $input = $this->getInput();
        $input = $this->sanitize($input);

        try {
            $updated = false;
            $changes = [];

            if (isset($input['name'])) {
                if (empty($input['name'])) {
                    return $this->validationError(['name' => 'Server name is required']);
                }
                $server->name = $input['name'];
                $changes['name'] = $input['name'];
                $updated = true;
            }

            if (isset($input['description'])) {
                $server->description = $input['description'];
                $changes['description'] = $input['description'];
                $updated = true;
            }
            
            if (isset($input['is_public'])) {
                $server->is_public = (bool)$input['is_public'];
                $changes['is_public'] = (bool)$input['is_public'];
                $updated = true;
            }
            
            if (isset($input['category'])) {
                $server->category = $input['category'];
                $changes['category'] = $input['category'];
                $updated = true;
            }

            if (!$updated) {
                return $this->validationError(['field' => 'No valid field provided to update']);
            }

            if ($server->save()) {
                $this->logActivity('server_field_updated', [
                    'server_id' => $serverId,
                    'changes' => $changes
                ]);

                return $this->success([
                    'server' => $this->formatServer($server),
                    'updated_fields' => $changes
                ], 'Server updated successfully');
            } else {
                throw new Exception('Failed to save server');
            }
        } catch (Exception $e) {
            $this->logActivity('server_field_update_error', [
                'server_id' => $serverId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to update server: ' . $e->getMessage());
        }
    }

    public function updateServerName($serverId)
    {
        $this->requireAuth();

        $server = $this->serverRepository->find($serverId);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        if (!$this->canManageServer($server)) {
            return $this->forbidden('You do not have permission to edit this server');
        }

        $input = $this->getInput();
        $input = $this->sanitize($input);

        if (!isset($input['name']) || empty($input['name'])) {
            return $this->validationError(['name' => 'Server name is required']);
        }
        
        if (strlen($input['name']) < 2 || strlen($input['name']) > 50) {
            return $this->validationError(['name' => 'Server name must be between 2 and 50 characters']);
        }

        try {
            $oldName = $server->name;
            $server->name = $input['name'];

            if ($server->save()) {
                $this->logActivity('server_name_updated', [
                    'server_id' => $serverId,
                    'old_name' => $oldName,
                    'new_name' => $input['name']
                ]);

                return $this->success([
                    'field' => 'name',
                    'old_value' => $oldName,
                    'new_value' => $input['name'],
                    'server' => $this->formatServer($server)
                ], 'Server name updated successfully');
            } else {
                throw new Exception('Failed to save server name');
            }
        } catch (Exception $e) {
            $this->logActivity('server_name_update_error', [
                'server_id' => $serverId,
                'error' => $e->getMessage()
            ]);
            
            return $this->serverError('Failed to update server name: ' . $e->getMessage());
        }
    }

    public function updateServerDescription($serverId)
    {
        $this->requireAuth();

        $server = $this->serverRepository->find($serverId);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        if (!$this->canManageServer($server)) {
            return $this->forbidden('You do not have permission to edit this server');
        }

        $input = $this->getInput();
        $input = $this->sanitize($input);

        try {
            $oldDescription = $server->description;
            $server->description = $input['description'] ?? '';

            if ($server->save()) {
                $this->logActivity('server_description_updated', [
                    'server_id' => $serverId,
                    'old_description' => $oldDescription,
                    'new_description' => $server->description
                ]);

                return $this->success([
                    'field' => 'description',
                    'old_value' => $oldDescription,
                    'new_value' => $server->description,
                    'server' => $this->formatServer($server)
                ], 'Server description updated successfully');
            } else {
                throw new Exception('Failed to save server description');
            }
        } catch (Exception $e) {
            $this->logActivity('server_description_update_error', [
                'server_id' => $serverId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to update server description: ' . $e->getMessage());
        }
    }

    public function updateServerPublic($serverId)
    {
        $this->requireAuth();

        $server = $this->serverRepository->find($serverId);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        if (!$this->canManageServer($server)) {
            return $this->forbidden('You do not have permission to edit this server');
        }

        $input = $this->getInput();
        $input = $this->sanitize($input);

        try {
            $oldPublic = $server->is_public;
            $server->is_public = isset($input['is_public']) ? (bool)$input['is_public'] : false;

            if ($server->save()) {
                $this->logActivity('server_public_updated', [
                    'server_id' => $serverId,
                    'old_public' => $oldPublic,
                    'new_public' => $server->is_public
                ]);

                return $this->success([
                    'field' => 'is_public',
                    'old_value' => $oldPublic,
                    'new_value' => $server->is_public,
                    'server' => $this->formatServer($server)
                ], 'Server visibility updated successfully');
            } else {
                throw new Exception('Failed to save server visibility');
            }
        } catch (Exception $e) {
            $this->logActivity('server_public_update_error', [
                'server_id' => $serverId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to update server visibility: ' . $e->getMessage());
        }
    }

    public function updateServerCategory($serverId)
    {
        $this->requireAuth();

        $server = $this->serverRepository->find($serverId);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        if (!$this->canManageServer($server)) {
            return $this->forbidden('You do not have permission to edit this server');
        }

        $input = $this->getInput();
        $input = $this->sanitize($input);

        try {
            $oldCategory = $server->category;
            $server->category = $input['category'] ?? null;

            if ($server->save()) {
                $this->logActivity('server_category_updated', [
                    'server_id' => $serverId,
                    'old_category' => $oldCategory,
                    'new_category' => $server->category
                ]);

                return $this->success([
                    'field' => 'category',
                    'old_value' => $oldCategory,
                    'new_value' => $server->category,
                    'server' => $this->formatServer($server)
                ], 'Server category updated successfully');
            } else {
                throw new Exception('Failed to save server category');
            }
        } catch (Exception $e) {
            $this->logActivity('server_category_update_error', [
                'server_id' => $serverId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to update server category: ' . $e->getMessage());
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
                    'display_name' => $member['nickname'] ?? $member['display_name'] ?? $member['username'],
                    'nickname' => $member['nickname'] ?? null,
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

    public function promoteMember($serverId, $userId)
    {
        $this->requireAuth();
        $currentUserId = $this->getCurrentUserId();

        try {
            $server = $this->serverRepository->find($serverId);
            if (!$server) {
                return $this->notFound('Server not found');
            }

            if (!$this->userServerMembershipRepository->isOwner($currentUserId, $serverId)) {
                return $this->forbidden('Only server owners can promote members');
            }

            if ($userId == $currentUserId) {
                return $this->validationError(['user' => 'You cannot promote yourself']);
            }

            $targetMembership = $this->userServerMembershipRepository->findByUserAndServer($userId, $serverId);
            if (!$targetMembership) {
                return $this->notFound('User is not a member of this server');
            }

            $currentRole = $targetMembership->role;
            $newRole = null;

            switch ($currentRole) {
                case 'member':
                    $newRole = 'admin';
                    break;
                case 'admin':
                    return $this->validationError(['role' => 'User is already at the highest promotable role']);
                default:
                    return $this->validationError(['role' => 'Cannot promote this user']);
            }

            if ($this->userServerMembershipRepository->updateRole($userId, $serverId, $newRole)) {
                $this->logActivity('member_promoted', [
                    'server_id' => $serverId,
                    'user_id' => $userId,
                    'old_role' => $currentRole,
                    'new_role' => $newRole
                ]);

                return $this->success([
                    'user_id' => $userId,
                    'old_role' => $currentRole,
                    'new_role' => $newRole
                ], 'Member promoted successfully');
            } else {
                throw new Exception('Failed to update member role');
            }
        } catch (Exception $e) {
            $this->logActivity('member_promotion_error', [
                'server_id' => $serverId,
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to promote member: ' . $e->getMessage());
        }
    }

    public function demoteMember($serverId, $userId)
    {
        $this->requireAuth();
        $currentUserId = $this->getCurrentUserId();

        try {
            $server = $this->serverRepository->find($serverId);
            if (!$server) {
                return $this->notFound('Server not found');
            }

            if (!$this->userServerMembershipRepository->isOwner($currentUserId, $serverId)) {
                return $this->forbidden('Only server owners can demote members');
            }

            if ($userId == $currentUserId) {
                return $this->validationError(['user' => 'You cannot demote yourself']);
            }

            $targetMembership = $this->userServerMembershipRepository->findByUserAndServer($userId, $serverId);
            if (!$targetMembership) {
                return $this->notFound('User is not a member of this server');
            }

            $currentRole = $targetMembership->role;
            $newRole = null;

            switch ($currentRole) {
                case 'admin':
                    $newRole = 'member';
                    break;
                case 'member':
                    return $this->validationError(['role' => 'User is already at the lowest role']);
                case 'owner':
                    return $this->validationError(['role' => 'Cannot demote server owner']);
                default:
                    return $this->validationError(['role' => 'Cannot demote this user']);
            }

            if ($this->userServerMembershipRepository->updateRole($userId, $serverId, $newRole)) {
                $this->logActivity('member_demoted', [
                    'server_id' => $serverId,
                    'user_id' => $userId,
                    'old_role' => $currentRole,
                    'new_role' => $newRole
                ]);

                return $this->success([
                    'user_id' => $userId,
                    'old_role' => $currentRole,
                    'new_role' => $newRole
                ], 'Member demoted successfully');
            } else {
                throw new Exception('Failed to update member role');
            }
        } catch (Exception $e) {
            $this->logActivity('member_demotion_error', [
                'server_id' => $serverId,
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to demote member: ' . $e->getMessage());
        }
    }

    public function kickMember($serverId, $userId)
    {
        $this->requireAuth();
        $currentUserId = $this->getCurrentUserId();

        try {
            $server = $this->serverRepository->find($serverId);
            if (!$server) {
                return $this->notFound('Server not found');
            }

            $currentUserMembership = $this->userServerMembershipRepository->findByUserAndServer($currentUserId, $serverId);
            if (!$currentUserMembership || ($currentUserMembership->role !== 'owner' && $currentUserMembership->role !== 'admin')) {
                return $this->forbidden('Only server owners and admins can kick members');
            }

            if ($userId == $currentUserId) {
                return $this->validationError(['user' => 'You cannot kick yourself']);
            }

            $targetMembership = $this->userServerMembershipRepository->findByUserAndServer($userId, $serverId);
            if (!$targetMembership) {
                return $this->notFound('User is not a member of this server');
            }

            if ($targetMembership->role === 'owner') {
                return $this->validationError(['role' => 'Cannot kick server owner']);
            }

            if ($currentUserMembership->role === 'admin' && $targetMembership->role === 'admin') {
                return $this->forbidden('Admins cannot kick other admins');
            }

            if ($this->userServerMembershipRepository->removeMembership($userId, $serverId)) {
                $this->logActivity('member_kicked', [
                    'server_id' => $serverId,
                    'user_id' => $userId,
                    'kicked_by' => $currentUserId
                ]);

                return $this->success([
                    'user_id' => $userId,
                    'action' => 'kicked'
                ], 'Member kicked successfully');
            } else {
                throw new Exception('Failed to remove member from server');
            }
        } catch (Exception $e) {
            $this->logActivity('member_kick_error', [
                'server_id' => $serverId,
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to kick member: ' . $e->getMessage());
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

    private function validateUploadedFile($file)
    {
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $maxSize = 100 * 1024 * 1024;

        if (!in_array($file['type'], $allowedTypes)) {
            throw new Exception('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
        }

        if ($file['size'] > $maxSize) {
            throw new Exception('File size too large. Maximum size is 100MB.');
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $allowedTypes)) {
            throw new Exception('Invalid file content. File does not match its extension.');
        }
    }

    private function acceptInvite() {
        $inviteCode = trim($_GET['code'] ?? '');
        
        if (empty($inviteCode)) {
            $this->redirect('/explore-servers?error=' . urlencode('Invite code is required.'));
            return;
        }
        
        $inviteRepo = new ServerInviteRepository();
        $invite = $inviteRepo->getByCode($inviteCode);
        
        if (!$invite) {
            $this->redirect('/accept-invite/' . urlencode($inviteCode) . '?error=' . urlencode('Invite not found or expired.'));
            return;
        }
        
        $now = date('Y-m-d H:i:s');
        if ($invite['expires_at'] && $invite['expires_at'] <= $now) {
            $this->redirect('/accept-invite/' . urlencode($inviteCode) . '?error=' . urlencode('This invite has expired.'));
            return;
        }
        
        $serverId = $invite['server_id'];
        $membershipRepo = new UserServerMembershipRepository();
        
        if ($this->session->isLoggedIn()) {
            $userId = $this->session->getUserId();
            $existingMembership = $membershipRepo->getUserServerMembership($userId, $serverId);
            
            if ($existingMembership) {
                $this->redirect('/server/' . $serverId . '?message=' . urlencode('You are already a member of this server.'));
                return;
            }
            
            $this->db->beginTransaction();
            try {
                $membershipRepo->createMembership($userId, $serverId);
                $this->db->commit();
                
                $this->redirect('/server/' . $serverId . '?message=' . urlencode('Welcome to the server!'));
                return;
            } catch (Exception $e) {
                $this->db->rollback();
                error_log("Error joining server: " . $e->getMessage());
                $this->redirect('/accept-invite/' . urlencode($inviteCode) . '?error=' . urlencode('Failed to join server. Please try again.'));
                return;
            }
        } else {
            $this->redirect('/auth?redirect=' . urlencode('/accept-invite/' . $inviteCode));
        }
    }

    public function generateInvite() {
        header('Content-Type: application/json');
        
        if (!$this->isAjax()) {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            return;
        }
        
        try {
            $serverId = $_POST['server_id'] ?? null;
            $expiresIn = $_POST['expires_in'] ?? null;
            $expiresAt = $_POST['expires_at'] ?? null;
            
            if (!$serverId) {
                throw new ValidationException('Server ID is required');
            }
            
            if (!$this->session->isLoggedIn()) {
                throw new AuthenticationException('Please log in to create invites');
            }
            
            $userId = $this->session->getUserId();
            $membershipRepo = new UserServerMembershipRepository();
            $membership = $membershipRepo->getUserServerMembership($userId, $serverId);
            
            if (!$membership) {
                throw new AuthenticationException('You are not a member of this server');
            }
            
            $expirationDate = null;
            if ($expiresIn) {
                $hours = (int)$expiresIn;
                $expirationDate = date('Y-m-d H:i:s', strtotime("+{$hours} hours"));
            } elseif ($expiresAt) {
                $expirationDate = $expiresAt;
            }
            
            $inviteRepo = new ServerInviteRepository();
            $inviteCode = $inviteRepo->generateUniqueCode();
            
            $result = $inviteRepo->createInvite([
                'code' => $inviteCode,
                'server_id' => $serverId,
                'created_by' => $userId,
                'expires_at' => $expirationDate,
                'max_uses' => null,
                'uses' => 0
            ]);
            
            AppLogger::info("Invite created", [
                'code' => $inviteCode,
                'server_id' => $serverId,
                'created_by' => $userId,
                'expires_at' => $expirationDate
            ]);
            
            echo json_encode([
                'success' => true,
                'invite' => [
                    'code' => $inviteCode,
                    'url' => $this->getBaseUrl() . '/accept-invite/' . $inviteCode,
                    'expires_at' => $expirationDate
                ]
            ]);
            
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function acceptInviteAction() {
        $inviteCode = $_GET['code'] ?? null;
        
        if (!$inviteCode) {
            $this->redirect('/explore-servers');
            return;
        }
        
        if ($this->isAjax()) {
            $this->handleAjaxInviteAccept($inviteCode);
            return;
        }
        
        $inviteRepo = new ServerInviteRepository();
        $invite = $inviteRepo->getByCode($inviteCode);
        
        if (!$invite) {
            $error = 'Invite not found or expired.';
            include 'views/pages/accept-invite.php';
            return;
        }
        
        $now = date('Y-m-d H:i:s');
        if ($invite['expires_at'] && $invite['expires_at'] <= $now) {
            $error = 'This invite has expired.';
            include 'views/pages/accept-invite.php';
            return;
        }
        
        if (!$this->session->isLoggedIn()) {
            $error = 'Please log in to accept this invite.';
            include 'views/pages/accept-invite.php';
            return;
        }
        
        $this->redirect('/accept-invite/' . $inviteCode);
    }

    private function handleAjaxInviteAccept($inviteCode) {
        header('Content-Type: application/json');
        
        try {
            if (!$this->session->isLoggedIn()) {
                throw new AuthenticationException('Please log in to accept invites');
            }
            
            $inviteRepo = new ServerInviteRepository();
            $invite = $inviteRepo->getByCode($inviteCode);
            
            if (!$invite) {
                throw new NotFoundException('Invite not found or expired');
            }
            
            $now = date('Y-m-d H:i:s');
            if ($invite['expires_at'] && $invite['expires_at'] <= $now) {
                throw new ValidationException('This invite has expired');
            }
            
            $serverId = $invite['server_id'];
            $userId = $this->session->getUserId();
            $membershipRepo = new UserServerMembershipRepository();
            $existingMembership = $membershipRepo->getUserServerMembership($userId, $serverId);
            
            if ($existingMembership) {
                echo json_encode([
                    'success' => true,
                    'message' => 'You are already a member of this server',
                    'redirect' => '/server/' . $serverId
                ]);
                return;
            }
            
            $this->db->beginTransaction();
            try {
                $membershipRepo->createMembership($userId, $serverId);
                $this->db->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Successfully joined the server!',
                    'redirect' => '/server/' . $serverId
                ]);
                return;
            } catch (Exception $e) {
                $this->db->rollback();
                throw $e;
            }
            
        } catch (Exception $e) {
            http_response_code($e instanceof AuthenticationException ? 401 : 
                            ($e instanceof NotFoundException ? 404 : 400));
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function getServerBundle($serverId) {
        try {
            $this->requireAuth();
            
            $server = $this->serverRepository->find($serverId);
            if (!$server) {
                return $this->notFound('Server not found');
            }

            $membership = $this->userServerMembershipRepository->findByUserAndServer($this->getCurrentUserId(), $serverId);
            if (!$membership) {
                return $this->forbidden('You are not a member of this server');
            }

            $channels = $this->channelRepository->getByServerId($serverId);
            $categories = $this->categoryRepository->getForServer($serverId);
            $serverMembers = $this->userServerMembershipRepository->getServerMembers($serverId);

            $defaultChannelId = null;
            foreach ($channels as $channel) {
                if ($channel['type'] === 'text' || $channel['type'] === 0 || $channel['type_name'] === 'text') {
                    $defaultChannelId = $channel['id'];
                    break;
                }
            }

            return $this->success([
                'server' => $this->formatServer($server),
                'channels' => array_map([$this, 'formatChannel'], $channels),
                'categories' => $categories,
                'members' => $serverMembers,
                'default_channel_id' => $defaultChannelId
            ]);

        } catch (Exception $e) {
            return $this->serverError('Failed to load server data: ' . $e->getMessage());
        }
    }

    public function getChannelSection($serverId) {
        $this->requireAuth();

        try {
            error_log("[Channel Section] Starting getChannelSection for server: " . $serverId);
            
            $server = $this->serverRepository->find($serverId);
            if (!$server) {
                error_log("[Channel Section] Server not found: " . $serverId);
                return $this->notFound('Server not found');
            }

            if (!$this->membershipRepository->isMember($this->getCurrentUserId(), $serverId)) {
                error_log("[Channel Section] User not a member of server: " . $serverId);
                return $this->forbidden('You do not have access to this server');
            }
        
            $input = $this->getInput();
            error_log("[Channel Section] Input data: " . json_encode($input));
            
            $channels = $input['channels'] ?? null;
            $categories = $input['categories'] ?? null;
            $activeChannelId = $input['activeChannelId'] ?? null;

            
            if (!$channels) {
                error_log("[Channel Section] Fetching channels from database");
                $channels = $this->channelRepository->getByServerId($serverId);
                error_log("[Channel Section] Found " . count($channels) . " channels in database");
            }
            if (!$categories) {
                error_log("[Channel Section] Fetching categories from database");
                $categories = $this->categoryRepository->getForServer($serverId);
                error_log("[Channel Section] Found " . count($categories) . " categories in database");
                    }
        
            if (is_array($server)) {
                $serverObj = (object) [
                    'id' => $server['id'],
                    'name' => $server['name'],
                    'description' => $server['description'] ?? '',
                    'owner_id' => $server['owner_id'],
                    'created_at' => $server['created_at'],
                    'updated_at' => $server['updated_at']
                ];
            } else {
                $serverObj = $server;
                    }
        
            $currentServer = $serverObj;
            $GLOBALS['serverChannels'] = $channels;
            $GLOBALS['serverCategories'] = $categories;
            $GLOBALS['activeChannelId'] = $activeChannelId;

            error_log("[Channel Section] Set globals - Server: " . json_encode($serverObj) . 
                     ", Channels: " . count($GLOBALS['serverChannels']) . 
                     ", Categories: " . count($GLOBALS['serverCategories']) . 
                     ", Active Channel: " . ($GLOBALS['activeChannelId'] ?? 'none'));

            
            ob_start();
            include __DIR__ . '/../views/components/app-sections/channel-section.php';
            $html = ob_get_clean();

            error_log("[Channel Section] Generated HTML length: " . strlen($html));
            error_log("[Channel Section] HTML preview: " . substr($html, 0, 200));

            if ($this->isAjaxRequest()) {
                error_log("[Channel Section] Sending Ajax response");
                echo $html;
                exit;
            }

            return $html;
        } catch (Exception $e) {
            error_log("[Channel Section] Error: " . $e->getMessage());
            if ($this->isAjaxRequest()) {
                return $this->serverError('Failed to load channel section');
            }
            throw $e;
        }
    }

    public function getServerLayout($serverId) {
        $this->requireAuth();

        try {
            error_log("[Server Layout] Starting getServerLayout for server: " . $serverId);
            
            $server = $this->serverRepository->find($serverId);
            if (!$server) {
                error_log("[Server Layout] Server not found: " . $serverId);
                return $this->notFound('Server not found');
            }
            error_log("[Server Layout] Server found: " . $server->name);

            $membership = $this->userServerMembershipRepository->findByUserAndServer($this->getCurrentUserId(), $serverId);
            if (!$membership) {
                error_log("[Server Layout] User not member of server: " . $serverId);
                return $this->forbidden('You are not a member of this server');
            }
            error_log("[Server Layout] User is member of server");

            $channels = $this->channelRepository->getByServerId($serverId);
            $categories = $this->categoryRepository->getForServer($serverId);
            $serverMembers = $this->userServerMembershipRepository->getServerMembers($serverId);
            
            error_log("[Server Layout] Data fetched - Channels: " . count($channels) . ", Categories: " . count($categories) . ", Members: " . count($serverMembers));

            $activeChannelId = $_GET['channel'] ?? null;
            $activeChannel = null;
            $channelMessages = [];

            if (!$activeChannelId && !empty($channels)) {
                foreach ($channels as $channel) {
                    if ($channel['type'] === 'text' || $channel['type'] === 0 || $channel['type_name'] === 'text') {
                        $activeChannelId = $channel['id'];
                        break;
                    }
                }
            }

            if ($activeChannelId) {
                $activeChannel = $this->channelRepository->find($activeChannelId);
                if ($activeChannel && $activeChannel->server_id == $serverId) {
                    try {
                        $channelMessages = $this->messageRepository->getForChannel($activeChannelId, 50, 0);
                    } catch (Exception $e) {
                        $this->logActivity('channel_messages_error', [
                            'channel_id' => $activeChannelId,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }

            $GLOBALS['server'] = $server;
            $GLOBALS['currentServer'] = $server;
            $GLOBALS['serverChannels'] = $channels;
            $GLOBALS['serverCategories'] = $categories;
            $GLOBALS['activeChannelId'] = $activeChannelId;
            $GLOBALS['channelMessages'] = $channelMessages;
            $GLOBALS['serverMembers'] = $serverMembers;
            $GLOBALS['contentType'] = 'server';
            
            error_log("[Server Layout] GLOBALS set - serverChannels: " . count($GLOBALS['serverChannels']) . 
                     ", activeChannelId: " . ($activeChannelId ?? 'none') . 
                     ", channelMessages: " . count($channelMessages));

            ob_start();
            ?>
            <div class="flex flex-1 overflow-hidden">
                <div class="flex flex-col flex-1" id="main-content">
                    <div class="main-content-area flex-1">
                        <?php
                        $activeChannel = null;
                        $channelType = isset($_GET['type']) ? $_GET['type'] : 'text';

                        foreach ($channels as $channel) {
                            if ($channel['id'] == $activeChannelId) {
                                $activeChannel = $channel;
                                if (isset($channel['type_name']) && $channel['type_name'] === 'voice') {
                                    $channelType = 'voice';
                                } elseif (isset($channel['type']) && ($channel['type'] === 'voice' || $channel['type'] === 2)) {
                                    $channelType = 'voice';
                                }
                                $GLOBALS['activeChannel'] = $activeChannel;
                                break;
                            }
                        }
                        ?>
                        
                        <div class="chat-section <?php echo $channelType === 'text' ? '' : 'hidden'; ?>" data-channel-id="<?php echo $activeChannelId; ?>">
                            <?php include __DIR__ . '/../views/components/app-sections/chat-section.php'; ?>
                        </div>
                        <div class="voice-section <?php echo $channelType === 'voice' ? '' : 'hidden'; ?>" data-channel-id="<?php echo $activeChannelId; ?>">
                            <?php include __DIR__ . '/../views/components/app-sections/voice-section.php'; ?>
                        </div>
                    </div>
                </div>

                <?php include __DIR__ . '/../views/components/app-sections/participant-section.php'; ?>
            </div>
            <?php
            $html = ob_get_clean();
            
            error_log("[Server Layout] HTML generated - Length: " . strlen($html) . 
                     ", Contains channel-wrapper: " . (strpos($html, 'channel-wrapper') !== false ? 'YES' : 'NO') . 
                     ", Contains channel-item: " . (strpos($html, 'channel-item') !== false ? 'YES' : 'NO'));

            if ($this->isAjaxRequest()) {
                error_log("[Server Layout] Sending AJAX response");
                echo $html;
                exit;
            }

            return $html;
        } catch (Exception $e) {
            if ($this->isAjaxRequest()) {
                return $this->serverError('Failed to load server layout');
            }
            throw $e;
        }
    }

    public function getPerServerProfile($serverId)
    {
        header('Content-Type: application/json');
        
        try {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Authentication required',
                    'code' => 401,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                exit;
            }
            
            $userId = $_SESSION['user_id'];

            $server = $this->serverRepository->find($serverId);
            if (!$server) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Server not found',
                    'code' => 404,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                exit;
            }

            if (!$this->membershipRepository->isMember($userId, $serverId)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You are not a member of this server',
                    'code' => 403,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                exit;
            }

            $profile = $this->membershipRepository->getPerServerProfile($userId, $serverId);
            if (!$profile) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'User profile not found in this server',
                    'code' => 404,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                exit;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'profile' => $profile
                ],
                'code' => 200,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            exit;

        } catch (Exception $e) {
            error_log("Error in getPerServerProfile: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Internal server error: ' . $e->getMessage(),
                'code' => 500,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            exit;
        }
    }
    
    public function updatePerServerProfile($serverId)
    {
        header('Content-Type: application/json');
        
        try {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Authentication required',
                    'code' => 401,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                exit;
            }
            
            $userId = $_SESSION['user_id'];
            
            $server = $this->serverRepository->find($serverId);
            if (!$server) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Server not found',
                    'code' => 404,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                exit;
            }

            if (!$this->membershipRepository->isMember($userId, $serverId)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'You are not a member of this server',
                    'code' => 403,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                exit;
            }

            $input = $this->getInput();
            $nickname = isset($input['nickname']) ? $input['nickname'] : null;
            
            if ($nickname !== null && strlen($nickname) > 32) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Nickname cannot exceed 32 characters',
                    'errors' => ['nickname' => 'Nickname cannot exceed 32 characters'],
                    'code' => 400,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                exit;
            }

            $result = $this->membershipRepository->updateUserNickname($userId, $serverId, $nickname);

            if ($result) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Per-server profile updated successfully',
                    'data' => [
                        'profile' => [
                            'nickname' => $nickname
                        ]
                    ],
                    'code' => 200,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update per-server profile',
                    'code' => 500,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            }
            
            exit;

        } catch (Exception $e) {
            error_log("Error in updatePerServerProfile: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Internal server error: ' . $e->getMessage(),
                'code' => 500,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            exit;
        }
    }
}