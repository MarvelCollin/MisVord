<?php

require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/models/Channel.php';
require_once __DIR__ . '/../database/models/Message.php';
require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../utils/AppLogger.php';

class ServerController extends BaseController {

    public function show($id) {
        if (!isset($_SESSION['user_id'])) {
            $this->redirectToLogin();
            return;
        }

        $server = Server::find($id);
        if (!$server) {
            $this->redirect('/404');
            return;
        }

        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $id);
        if (!$membership) {
            $this->redirect('/404');
            return;
        }

        $channels = Channel::getByServerId($id);
        $GLOBALS['serverChannels'] = $channels;

        $activeChannelId = $_GET['channel'] ?? null;
        if ($activeChannelId) {
            $activeChannel = Channel::find($activeChannelId);
            if ($activeChannel && $activeChannel->server_id == $id) {
                $GLOBALS['activeChannelId'] = $activeChannelId;

                try {
                    $messages = Message::getForChannel($activeChannelId, 50, 0);
                    $GLOBALS['channelMessages'] = $messages;
                    log_debug("ServerController: Loaded messages for channel", [
                        'channel_id' => $activeChannelId,
                        'message_count' => count($messages)
                    ]);
                } catch (Exception $e) {
                    log_error("ServerController: Error loading messages", [
                        'error' => $e->getMessage(),
                        'channel_id' => $activeChannelId
                    ]);
                    $GLOBALS['channelMessages'] = [];
                }
            }
        } else if (!empty($channels)) {
            $firstChannel = $channels[0];
            $this->redirect("/server/$id?channel={$firstChannel['id']}");
            return;
        }

        $GLOBALS['currentServer'] = $server;

        $this->view('pages/server-page', [
            'title' => htmlspecialchars($server->name),
            'currentServer' => $server,
            'activeChannelId' => $activeChannelId ?? null,
            'channels' => $channels,
            'messages' => $GLOBALS['channelMessages'] ?? []        ]);
    }

    public function create() {
        try {
            logger()->info("Starting server creation process");

            if (!isset($_SESSION['user_id'])) {
                logger()->warning("Server creation failed: User not authenticated");
                return $this->unauthorized();
            }

            logger()->debug("Authenticated user", ['user_id' => $_SESSION['user_id']]);

            $postData = $_POST;
            logger()->debug("Server creation POST data received", $postData);

            if (isset($_FILES['image_file'])) {
                logger()->debug("Image file received", [
                    'filename' => $_FILES['image_file']['name'],
                    'size' => $_FILES['image_file']['size']
                ]);
            } else {
                logger()->debug("No image file received");
            }

            $name = $_POST['name'] ?? '';
            $description = $_POST['description'] ?? '';
            $isPublic = isset($_POST['is_public']) ? (bool)$_POST['is_public'] : true;  

            logger()->debug("Server creation details", [
                'name' => $name,
                'description_length' => strlen($description),
                'is_public' => $isPublic
            ]);

            if (empty($name)) {
                logger()->warning("Server creation failed: Empty name");
                return $this->validationError(['name' => 'Server name is required']);
            }

            logger()->debug("Checking for duplicate server name", ['name' => $name]);
            $existingServer = Server::findByName($name);
            if ($existingServer) {
                log_error("Server creation failed: Name already exists", [
                    'server_name' => $_POST['server_name']
                ]);                return $this->validationError(['name' => 'Server with this name already exists']);
            }
            
            log_debug("Creating new Server object", [
                'server_name' => $name,
                'user_id' => $_SESSION['user_id']
            ]);
            $server = new Server();
            $server->name = $name;
            $server->description = $description;
            $server->is_public = $isPublic;

            $imageUrl = null;
            if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
                log_debug("Attempting to upload server image");
                $imageUrl = $this->uploadImage($_FILES['image_file'], 'servers');
                if ($imageUrl === false) {
                    log_error("Server creation failed: Image upload failed");
                    return $this->serverError('Failed to upload server image');
                }
                log_info("Image uploaded successfully", ['image_url' => $imageUrl]);
                $server->image_url = $imageUrl;
            }

            $query = new Query();
            $pdo = $query->getPdo();

            $server->invite_link = $this->generateUniqueInviteCode();

            $transactionActive = false;

            try {

                if ($pdo->inTransaction()) {
                    log_debug("Transaction already active - using existing transaction");
                } else {
                    log_debug("Starting new transaction");
                    $pdo->beginTransaction();
                    $transactionActive = true;
                }

                log_debug("Saving server to database within transaction");
                if (!$server->save()) {                    log_error("Server creation failed: Could not save server");
                    if ($transactionActive) {
                        log_debug("Rolling back transaction");
                        $pdo->rollBack();
                        $transactionActive = false;
                    }
                    return $this->serverError('Failed to create server');
                }
                log_info("Server saved with ID", ['server_id' => $server->id]);

                log_debug("Adding user as server owner", [
                    'user_id' => $_SESSION['user_id'],
                    'server_id' => $server->id
                ]);

                try {

                    $stmt = $pdo->prepare("
                        INSERT INTO user_server_memberships 
                        (user_id, server_id, role) 
                        VALUES (?, ?, 'owner')
                    ");
                    $membershipInserted = $stmt->execute([$_SESSION['user_id'], $server->id]);

                    if (!$membershipInserted) {
                        throw new Exception("Direct server membership insertion failed");
                    }

                    log_debug("Membership created with PDO directly");
                } catch (Exception $e) {
                    log_error("Error creating membership with PDO directly", [
                        'error' => $e->getMessage()
                    ]);

                    $membershipInserted = $query->table('user_server_memberships')
                        ->insert([
                            'user_id' => $_SESSION['user_id'],
                            'server_id' => $server->id,
                            'role' => 'owner'

                        ]);

                    log_debug("Membership created with query builder", [
                        'success' => $membershipInserted
                    ]);
                }                if (!$membershipInserted) {
                    log_error("Failed to create membership record, rolling back transaction");
                    if ($transactionActive) {
                        log_debug("Rolling back transaction");
                        $pdo->rollBack();
                        $transactionActive = false;
                    }
                    return $this->serverError('Failed to assign server ownership');
                }

                log_debug("Creating default channels for server", ['server_id' => $server->id]);
                $channelsCreated = $this->createDefaultChannels($server->id);
                log_debug("Default channels created", ['success' => $channelsCreated]);

                if (!$channelsCreated) {
                    log_error("Failed to create default channels, rolling back transaction");
                    if ($transactionActive) {
                        log_debug("Rolling back transaction");
                        $pdo->rollBack();
                        $transactionActive = false;
                    }
                    return $this->serverError('Failed to create default channels');
                }

                if ($transactionActive) {
                    log_debug("Committing transaction");
                    $pdo->commit();
                    $transactionActive = false;
                }

                $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $server->id);
                if (!$membership) {
                    log_error("ERROR: Membership not found after successful transaction - this should never happen");
                } else {
                    log_info("SUCCESS: User membership verified", ['role' => $membership->role]);
                }

                log_info("Server creation completed successfully");
                return $this->successResponse([
                    'success' => true,
                    'server_id' => (string)$server->id,
                    'server' => [
                        'id' => (string)$server->id,
                        'name' => $server->name,
                        'description' => $server->description,
                        'image_url' => $server->image_url,
                        'is_public' => $server->is_public ? true : false,
                        'invite_link' => $server->invite_link
                    ]
                ], 'Server created successfully');

            } catch (Exception $e) {

                if ($transactionActive) {
                    log_debug("Rolling back transaction due to exception");
                    try {
                        $pdo->rollBack();
                    } catch (Exception $rollbackEx) {
                        log_error("Error during rollback", ['error' => $rollbackEx->getMessage()]);                    }
                    $transactionActive = false;
                }                log_error("Server creation error", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                return $this->serverError('Server creation failed: ' . $e->getMessage());
            }
        } catch (Exception $generalException) {
            log_error("Unexpected error during server creation", [
                'error' => $generalException->getMessage(),
                'trace' => $generalException->getTraceAsString()
            ]);
            return $this->serverError('An unexpected error occurred');
        }
    }

    private function createDefaultChannels($serverId) {
        log_debug("Starting createDefaultChannels for server", ['server_id' => $serverId]);

        if (empty($serverId) || !is_numeric($serverId)) {
            log_error("Invalid serverId", ['server_id' => $serverId]);
            return false;
        }

        try {
            log_debug("Attempting to create a Query object");
            $query = new Query();
            log_debug("Query object created successfully");

            $generalChannelData = [
                'server_id' => $serverId,
                'name' => 'general',
                'type' => 'text',
                'description' => 'General discussion',
                'position' => 0
            ];

            log_debug("Creating general text channel");
            $generalChannelId = $query->table('channels')->insert($generalChannelData);
            log_debug("General text channel created", ['channel_id' => $generalChannelId]);

            log_info("Default general channel created successfully");
            return true;
        } catch (Exception $e) {            log_error("Error creating default channels", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    private function generateUniqueInviteCode() {
        return bin2hex(random_bytes(8)); 
    }

    public function showInvite($inviteCode) {
        log_debug("showInvite called", ['invite_code' => $inviteCode]);

        $server = Server::findByInviteLink($inviteCode);

        if (!$server) {
            log_warning("Invalid invite link", ['invite_code' => $inviteCode]);

            $GLOBALS['inviteServer'] = null;
            $GLOBALS['inviteCode'] = $inviteCode;
            require_once __DIR__ . '/../views/pages/accept-invite.php';
            return;
        }

        log_debug("Found server for invite", ['server_name' => $server->name]);

        if (isset($_SESSION['user_id'])) {

            if (UserServerMembership::isMember($_SESSION['user_id'], $server->id)) {
                header("Location: /server/{$server->id}");
                exit;
            }
        }

        $GLOBALS['inviteServer'] = $server;
        $GLOBALS['inviteCode'] = $inviteCode;
        require_once __DIR__ . '/../views/pages/accept-invite.php';
    }

    public function join($inviteCode) {        log_debug("join method called", ['invite_code' => $inviteCode]);
        log_debug("Session data", [
            'user_id' => $_SESSION['user_id'] ?? 'not set',
            'pending_invite' => $_SESSION['pending_invite'] ?? 'not set',
            'login_redirect' => $_SESSION['login_redirect'] ?? 'not set'
        ]);

        if (!isset($_SESSION['user_id'])) {
            log_info("User not logged in - redirecting to login with return URL");

            $_SESSION['pending_invite'] = $inviteCode;

            if ($this->isAjaxRequest()) {
                return $this->unauthorized('Please log in to accept this invitation');
            }

            header('Location: /login?redirect=/join/' . urlencode($inviteCode));
            exit;
        }

        log_debug("User is logged in, processing invite", [
            'invite_code' => $inviteCode,
            'user_id' => $_SESSION['user_id']
        ]);

        if (empty($inviteCode)) {
            log_warning("Empty invite code provided");
            $errorMessage = 'Invalid invite link';

            if ($this->isAjaxRequest()) {
                return $this->validationError(['invite' => $errorMessage]);
            }

            $_SESSION['error'] = $errorMessage;
            header('Location: /app');
            exit;
        }

        $server = Server::findByInviteLink($inviteCode);

        if (!$server) {
            log_warning("Server not found for invite code", ['invite_code' => $inviteCode]);
            $errorMessage = 'Invalid or expired invite link';

            if ($this->isAjaxRequest()) {
                return $this->validationError(['invite' => $errorMessage]);
            }

            $_SESSION['error'] = $errorMessage;
            header('Location: /app');
            exit;        }
        
        log_debug("Found server for invite", [
            'server_id' => $server->id,
            'server_name' => $server->name
        ]);

        if (UserServerMembership::isMember($_SESSION['user_id'], $server->id)) {
            log_debug("User is already a member of this server");
            if ($this->isAjaxRequest()) {
                return $this->successResponse([
                    'server' => [
                        'id' => $server->id,
                        'name' => $server->name
                    ],
                    'redirect' => "/server/{$server->id}"
                ], 'Already a member of this server');
            }

            header('Location: /server/' . $server->id);
            exit;
        }

        log_debug("Attempting to join server", [
            'server_id' => $server->id,
            'user_id' => $_SESSION['user_id']
        ]);
        $joined = UserServerMembership::create($_SESSION['user_id'], $server->id, 'member');

        if (!$joined) {
            log_error("Failed to join server", [
                'user_id' => $_SESSION['user_id'],
                'server_id' => $server->id
            ]);

            if ($this->isAjaxRequest()) {
                return $this->serverError('Failed to join the server. Please try again.');
            }

            $_SESSION['error'] = 'Failed to join server. Please try again.';
            header('Location: /app');
            exit;
        }

        log_info("Successfully joined server", ['server_id' => $server->id]);

        if (isset($_SESSION['pending_invite'])) {
            log_debug("Clearing pending_invite from session");
            unset($_SESSION['pending_invite']);
        }

        if ($this->isAjaxRequest()) {
            return $this->successResponse([
                'server' => [
                    'id' => $server->id,
                    'name' => $server->name
                ],
                'redirect' => "/server/{$server->id}"
            ], 'Successfully joined server');
        }

        $_SESSION['success'] = "You've successfully joined " . $server->name;
        log_debug("Redirecting to server page", ['url' => "/server/{$server->id}"]);
        header('Location: /server/' . $server->id);
        exit;
    }

    public function leave($serverId) {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $server = Server::find($serverId);

        if (!$server) {
            return $this->notFound('Server not found');
        }

        if (!UserServerMembership::isMember($_SESSION['user_id'], $serverId)) {
            return $this->validationError(['server' => 'You are not a member of this server']);
        }

        if (UserServerMembership::isOwner($_SESSION['user_id'], $serverId)) {
            return $this->validationError(['server' => 'Server owners cannot leave their server. Transfer ownership first or delete the server.']);
        }

        if (UserServerMembership::delete($_SESSION['user_id'], $serverId)) {
            return $this->successResponse([], 'You have left the server');
        } else {
            return $this->serverError('Failed to leave the server');
        }
    }

    public function showChannel($serverId, $channelId) {
        if (!isset($_SESSION['user_id'])) {
            if ($this->isAjaxRequest()) {
                return $this->unauthorized();
            }

            header('Location: /login');
            exit;
        }

        $server = Server::find($serverId);
        if (!$server) {
            if ($this->isAjaxRequest()) {
                return $this->notFound('Server not found');
            }

            header('Location: /app');
            exit;
        }

        if (!$server->isMember($_SESSION['user_id'])) {
            if ($this->isAjaxRequest()) {
                return $this->forbidden('You are not a member of this server');
            }

            header('Location: /app');
            exit;
        }

        require_once __DIR__ . '/../database/models/Channel.php';
        $channel = Channel::find($channelId);

        if (!$channel || $channel->server_id != $serverId) {
            if ($this->isAjaxRequest()) {
                return $this->notFound('Channel not found in this server');
            }

            header("Location: /server/{$serverId}");
            exit;
        }

        if ($this->isAjaxRequest()) {
            $messages = $channel->messages();
            return $this->successResponse([
                'server' => [
                    'id' => $server->id,
                    'name' => $server->name
                ],
                'channel' => [
                    'id' => $channel->id,
                    'name' => $channel->name,
                    'type' => $channel->type
                ],
                'messages' => $messages
            ]);
        }

        $GLOBALS['currentServer'] = $server;
        $GLOBALS['currentChannel'] = $channel;

        require_once __DIR__ . '/../views/pages/server-page.php';
    }

    public function listServers() {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        try {

            $servers = Server::getForUser($_SESSION['user_id']);

            $formattedServers = [];
            foreach ($servers as $server) {
                $formattedServers[] = [
                    'id' => (string)$server->id,
                    'name' => $server->name,
                    'image_url' => $server->image_url,
                    'description' => $server->description,
                    'invite_link' => $server->invite_link,
                    'is_public' => $server->is_public
                ];
            }

            return $this->successResponse(['servers' => $formattedServers]);
        } catch (Exception $e) {
            log_error("Error getting server list", ['message' => $e->getMessage()]);
            return $this->serverError('An error occurred while fetching servers');
        }
    }

    public function getServerDetails($id) {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $server = Server::find($id);

        if (!$server) {
            return $this->notFound('Server not found');
        }

        if (!UserServerMembership::isMember($_SESSION['user_id'], $server->id)) {
            return $this->forbidden('You are not a member of this server');
        }

        $categories = Category::getForServer($server->id);

        $inviteLink = $server->invite_link;

        log_debug("Server invite link", [
            'server_id' => $server->id,
            'invite_link' => $inviteLink ?? 'null'
        ]);

        return $this->successResponse([
            'server' => [
                'id' => (string)$server->id,
                'name' => $server->name,
                'description' => $server->description,
                'image_url' => $server->image_url,
                'is_public' => (bool)$server->is_public,
                'invite_link' => $inviteLink
            ],
            'categories' => $categories
        ]);
    }

    public function getServerChannels($id) {
        log_debug("getServerChannels called", ['server_id' => $id]);

        if (!isset($_SESSION['user_id'])) {
            if ($this->isAjaxRequest()) {
                return $this->unauthorized();
            }

            header('Location: /login');
            exit;
        }

        $serverId = is_numeric($id) ? intval($id) : 0;
        if (!$serverId) {
            log_error("Invalid server ID provided", ['server_id' => $id]);
            return $this->validationError(['server' => 'Invalid server ID']);
        }

        $server = Server::find($serverId);
        if (!$server) {
            log_error("Server not found", ['server_id' => $id]);
            return $this->notFound('Server not found');
        }

        if (!UserServerMembership::isMember($_SESSION['user_id'], $serverId)) {
            log_error("User is not a member of server", [
                'user_id' => $_SESSION['user_id'], 
                'server_id' => $id
            ]);
            return $this->forbidden('You are not a member of this server');
        }

        try {
            $query = new Query();

            $channels = $query->table('channels')
                ->where('server_id', $serverId)
                ->orderBy('position')
                ->get();

            $categories = $query->table('categories')
                ->where('server_id', $serverId)
                ->orderBy('position')
                ->get();

            if (!empty($channels)) {
                foreach ($channels as $key => $channel) {

                    foreach ($channel as $field => $value) {
                        if (is_numeric($value)) {
                            $channels[$key][$field] = (string)$value;
                        }
                    }

                    if (isset($channel['is_private'])) {

                        $channels[$key]['is_private'] = (bool)$channel['is_private'];
                    } else {

                        $channels[$key]['is_private'] = false;
                    }

                    if (!isset($channel['type_name'])) {
                        $type = $channel['type'] ?? '1';
                        if ($type === '1' || $type === 1) {
                            $channels[$key]['type_name'] = 'text';
                        } else if ($type === '2' || $type === 2) {
                            $channels[$key]['type_name'] = 'voice';
                        } else {
                            $channels[$key]['type_name'] = 'text';
                        }
                    }
                }
            }

            if ($this->isAjaxRequest()) {
                $responseData = [
                    'categories' => $categories,
                    'uncategorizedChannels' => array_filter($channels, function($channel) {
                        return !isset($channel['category_id']) || empty($channel['category_id']);
                    })
                ];

                foreach ($categories as $key => $category) {
                    $categoryId = $category['id'];
                    $categoryChannels = array_filter($channels, function($channel) use ($categoryId) {
                        return isset($channel['category_id']) && $channel['category_id'] == $categoryId;
                    });

                    $responseData['categories'][$key]['channels'] = array_values($categoryChannels);
                }

                return $this->successResponse($responseData);
            } else {
                return [
                    'channels' => $channels,
                    'categories' => $categories
                ];
            }
        } catch (Exception $e) {
            log_error("Error fetching channels for server", [
                'server_id' => $id, 
                'message' => $e->getMessage()
            ]);

            if ($this->isAjaxRequest()) {
                return $this->serverError('Failed to load channels');
            } else {
                return [
                    'channels' => [],
                    'categories' => []
                ];
            }
        }
    }

    public function generateInviteLink($serverId) {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $server = Server::find($serverId);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $serverId);
        if (!$membership || !in_array($membership->role, ['admin', 'moderator', 'owner'])) {
            return $this->forbidden('You do not have permission to create invite links');
        }        try {
            $inviteCode = $server->generateInviteLink();

            return $this->successResponse([
                'invite_code' => $inviteCode,
                'invite_url' => $_SERVER['HTTP_HOST'] . "/join/$inviteCode",
                'expires_at' => null 
            ]);

        } catch (Exception $e) {
            log_error("Error generating invite link", ['message' => $e->getMessage()]);
            return $this->serverError('Failed to generate invite link');
        }
    }
}