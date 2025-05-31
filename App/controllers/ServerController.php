<?php

require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/models/ServerInvite.php';
require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/../database/models/Channel.php';
require_once __DIR__ . '/../database/models/Category.php';
require_once __DIR__ . '/../database/query.php';
require_once __DIR__ . '/BaseController.php';

class ServerController extends BaseController {

    public function __construct() {
        parent::__construct();
    }

    public function getServer($id) {
        if (!isset($_SESSION['user_id'])) {
            return null;
        }

        $server = Server::find($id);
        if (!$server) {
            error_log("Server not found with ID: $id");
            return null;
        }

        error_log("Successfully found server: " . $server->name);
        return $server;
    }

    public function show($id) {
        $server = $this->getServer($id);
        
        if (!$server) {
            if ($this->isAjaxRequest()) {
                return $this->notFound('Server not found');
            }
            
            http_response_code(404);
            require_once dirname(__DIR__) . '/views/pages/404.php';
            return;
        }
        
        // Get data for the server view
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $userServers = Server::getFormattedServersForUser($currentUserId);
        $serverMembers = UserServerMembership::getServerMembers($server->id);
        $serverRoles = UserServerMembership::getServerRoles($server->id);
        $serverChannels = Channel::getServerChannels($server->id);
        
        // Get active channel and its messages
        $activeChannelId = $_GET['channel'] ?? null;
        $channelMessages = [];
        
        if (empty($activeChannelId) && !empty($serverChannels)) {
            // Find first text channel
            foreach ($serverChannels as $channel) {
                if ($channel['type_name'] === 'text') {
                    $activeChannelId = $channel['id'];
                    break;
                }
            }
        }
        
        if ($activeChannelId) {
            $channelMessages = Channel::getChannelMessages($activeChannelId);
        }
        
        // For AJAX requests, return server data as JSON
        if ($this->isAjaxRequest()) {
            return $this->successResponse([
                'server' => [
                    'id' => $server->id,
                    'name' => $server->name,
                    'description' => $server->description,
                    'image_url' => $server->image_url,
                    'is_public' => (bool)$server->is_public
                ],
                'userServers' => $userServers,
                'serverMembers' => $serverMembers,
                'serverRoles' => $serverRoles,
                'serverChannels' => $serverChannels,
                'activeChannelId' => $activeChannelId,
                'channelMessages' => $channelMessages
            ]);
        }
        
        // For regular requests, set global variables and render the page
        $GLOBALS['currentServer'] = $server;
        $GLOBALS['userServers'] = $userServers;
        $GLOBALS['serverMembers'] = $serverMembers;
        $GLOBALS['serverRoles'] = $serverRoles;
        $GLOBALS['serverChannels'] = $serverChannels;
        $GLOBALS['activeChannelId'] = $activeChannelId;
        $GLOBALS['channelMessages'] = $channelMessages;
        
        require_once dirname(__DIR__) . '/views/pages/server-page.php';
    }

    public function create() {
        // Set error handling to prevent PHP errors from breaking JSON response
        $oldErrorReporting = error_reporting(E_ALL);
        ini_set('display_errors', 0);
        
        try {
            error_log("Starting server creation process");
            
            if (!isset($_SESSION['user_id'])) {
                error_log("Server creation failed: User not authenticated");
                return $this->unauthorized();
            }
            
            error_log("Authenticated user ID: {$_SESSION['user_id']}");
            
            // Dump POST data for debugging (excluding file contents)
            $postData = $_POST;
            error_log("POST data: " . json_encode($postData));
            
            // Check if files are being received
            if (isset($_FILES['image_file'])) {
                error_log("Image file received: " . $_FILES['image_file']['name'] . ", size: " . $_FILES['image_file']['size'] . " bytes");
            } else {
                error_log("No image file received");
            }

            $name = $_POST['name'] ?? '';
            $description = $_POST['description'] ?? '';
            $isPublic = isset($_POST['is_public']) ? (bool)$_POST['is_public'] : true;  // Default to public
            
            error_log("Server details - Name: $name, Description length: " . strlen($description) . ", Public: " . ($isPublic ? 'true' : 'false'));

            if (empty($name)) {
                error_log("Server creation failed: Empty name");
                return $this->validationError(['name' => 'Server name is required']);
            }

            // Check for duplicate server name
            error_log("Checking for duplicate server name");
            $existingServer = Server::findByName($name);
            if ($existingServer) {
                error_log("Server creation failed: Name already exists");
                return $this->validationError(['name' => 'Server with this name already exists']);
            }
            
            error_log("Creating new Server object");
            $server = new Server();
            $server->name = $name;
            $server->description = $description;
            $server->is_public = $isPublic;

            $imageUrl = null;
            if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
                error_log("Attempting to upload server image");
                $imageUrl = $this->uploadServerImage($_FILES['image_file']);
                if ($imageUrl === false) {
                    error_log("Server creation failed: Image upload failed");
                    return $this->serverError('Failed to upload server image');
                }
                error_log("Image uploaded successfully: $imageUrl");
                $server->image_url = $imageUrl;
            }

            $query = new Query();
            $pdo = $query->getPdo();
            
            // Generate an invite link
            $server->invite_link = $this->generateUniqueInviteCode();
            
            // Transaction management
            $transactionActive = false;
            
            try {
                // Check if there's already a transaction active
                if ($pdo->inTransaction()) {
                    error_log("Transaction already active - using existing transaction");
                } else {
                    error_log("Starting new transaction");
                    $pdo->beginTransaction();
                    $transactionActive = true;
                }
                
                error_log("Saving server to database within transaction");
                if (!$server->save()) {
                    error_log("Server creation failed: Could not save server");
                    if ($transactionActive) {
                        error_log("Rolling back transaction");
                        $pdo->rollBack();
                        $transactionActive = false;
                    }
                    return $this->serverError('Failed to create server');
                }
                error_log("Server saved with ID: " . $server->id);
                
                // Add user as server owner using direct query within the same transaction
                error_log("Adding user as server owner (UserId: {$_SESSION['user_id']}, ServerId: {$server->id})");
                
                try {
                    // Use direct PDO instead of query builder to ensure transaction consistency
                    $stmt = $pdo->prepare("
                        INSERT INTO user_server_memberships 
                        (user_id, server_id, role) 
                        VALUES (?, ?, 'owner')
                    ");
                    $membershipInserted = $stmt->execute([$_SESSION['user_id'], $server->id]);
                    
                    if (!$membershipInserted) {
                        throw new Exception("Direct server membership insertion failed");
                    }
                    
                    error_log("Membership created with PDO directly - Success");
                } catch (Exception $e) {
                    error_log("Error creating membership with PDO directly: " . $e->getMessage());
                    
                    // Try with the query builder as fallback
                    $membershipInserted = $query->table('user_server_memberships')
                        ->insert([
                            'user_id' => $_SESSION['user_id'],
                            'server_id' => $server->id,
                            'role' => 'owner'
                            // Let database handle timestamps with defaults
                        ]);
                        
                    error_log("Membership created with query builder - Success: " . ($membershipInserted ? 'Yes' : 'No'));
                }
                
                if (!$membershipInserted) {
                    error_log("Failed to create membership record, rolling back transaction");
                    if ($transactionActive) {
                        error_log("Rolling back transaction");
                        $pdo->rollBack();
                        $transactionActive = false;
                    }
                    return $this->serverError('Failed to assign server ownership');
                }
                
                error_log("Creating default channels for server: " . $server->id);
                $channelsCreated = $this->createDefaultChannels($server->id);
                error_log("Default channels created: " . ($channelsCreated ? 'Yes' : 'No'));
                
                if (!$channelsCreated) {
                    error_log("Failed to create default channels, rolling back transaction");
                    if ($transactionActive) {
                        error_log("Rolling back transaction");
                        $pdo->rollBack();
                        $transactionActive = false;
                    }
                    return $this->serverError('Failed to create default channels');
                }
                
                // Commit the transaction if everything was successful
                if ($transactionActive) {
                    error_log("Committing transaction");
                    $pdo->commit();
                    $transactionActive = false;
                }
                
                // Verify the membership was created after the transaction
                $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $server->id);
                if (!$membership) {
                    error_log("ERROR: Membership not found after successful transaction - this should never happen");
                } else {
                    error_log("SUCCESS: User membership verified with role: " . $membership->role);
                }
                
                error_log("Server creation completed successfully");
                return $this->successResponse([
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
                // Rollback transaction on any error
                if ($transactionActive) {
                    error_log("Rolling back transaction due to exception");
                    try {
                        $pdo->rollBack();
                    } catch (Exception $rollbackEx) {
                        error_log("Error during rollback: " . $rollbackEx->getMessage());
                    }
                    $transactionActive = false;
                }
                error_log("Server creation error: " . $e->getMessage());
                error_log("Error trace: " . $e->getTraceAsString());
                return $this->serverError('Server creation failed: ' . $e->getMessage());
            }
            
        } catch (Exception $e) {
            error_log("Unexpected error during server creation: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            return $this->serverError('An unexpected error occurred');
        } finally {
            // Restore error reporting settings
            error_reporting($oldErrorReporting);
        }
    }

    private function uploadServerImage($file) {
        $fileType = exif_imagetype($file['tmp_name']);
        if (!$fileType || !in_array($fileType, [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP])) {
            return false;
        }

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'server_' . time() . '_' . bin2hex(random_bytes(8)) . '.' . $extension;

        $uploadDir = __DIR__ . '/../public/assets/uploads/servers/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filepath = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            return '/public/assets/uploads/servers/' . $filename;
        }

        return false;
    }

    private function createDefaultChannels($serverId) {
        error_log("Starting createDefaultChannels for server: $serverId");
        
        // Check if serverId is valid
        if (empty($serverId) || !is_numeric($serverId)) {
            error_log("Invalid serverId: $serverId");
            return false;
        }
        
        try {
            error_log("Attempting to create a Query object");
            $query = new Query();
            error_log("Query object created successfully");
            
            // Create only a single general text channel
            $generalChannelData = [
                'server_id' => $serverId,
                'name' => 'general',
                'type' => 'text',
                'description' => 'General discussion',
                'position' => 0
            ];
            
            error_log("Creating general text channel");
            $generalChannelId = $query->table('channels')->insert($generalChannelData);
            error_log("General text channel created with ID: $generalChannelId");

            error_log("Default general channel created successfully");
            return true;
        } catch (Exception $e) {
            error_log("Error creating default channels: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            return false;
        }
    }

    private function generateUniqueInviteCode() {
        return bin2hex(random_bytes(8)); // 16 character hex string
    }

    public function join($inviteCode) {
        if (!isset($_SESSION['user_id'])) {
            if ($this->isAjaxRequest()) {
                return $this->unauthorized();
            }
            
            header('Location: /login');
            exit;
        }

        if (empty($inviteCode)) {
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
            $errorMessage = 'Invalid or expired invite link';
            
            if ($this->isAjaxRequest()) {
                return $this->validationError(['invite' => $errorMessage]);
            }
            
            $_SESSION['error'] = $errorMessage;
            header('Location: /app');
            exit;
        }

        if (UserServerMembership::isMember($_SESSION['user_id'], $server->id)) {
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

        UserServerMembership::create($_SESSION['user_id'], $server->id, 'member');

        if ($this->isAjaxRequest()) {
            return $this->successResponse([
                'server' => [
                    'id' => $server->id,
                    'name' => $server->name
                ],
                'redirect' => "/server/{$server->id}"
            ], 'Successfully joined server');
        }
        
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
            // Get the user's servers
            $servers = Server::getForUser($_SESSION['user_id']);
            
            // Format the response
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
            error_log("Error getting server list: " . $e->getMessage());
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
        
        // Check if user is a member of this server
        if (!UserServerMembership::isMember($_SESSION['user_id'], $server->id)) {
            return $this->forbidden('You are not a member of this server');
        }
        
        // Get server categories for channel creation
        $categories = Category::getForServer($server->id);
        
        // Get active invite link for the server
        $activeInvite = ServerInvite::findActiveByServer($server->id);
        $inviteLink = $activeInvite ? $activeInvite->invite_link : null;
        
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
        error_log("getServerChannels called for server ID: $id");
        
        if (!isset($_SESSION['user_id'])) {
            if ($this->isAjaxRequest()) {
                return $this->unauthorized();
            }
            
            header('Location: /login');
            exit;
        }
        
        $serverId = is_numeric($id) ? intval($id) : 0;
        if (!$serverId) {
            error_log("Invalid server ID provided: $id");
            return $this->validationError(['server' => 'Invalid server ID']);
        }
        
        $server = Server::find($serverId);
        if (!$server) {
            error_log("Server not found with ID: $id");
            return $this->notFound('Server not found');
        }
        
        if (!UserServerMembership::isMember($_SESSION['user_id'], $serverId)) {
            error_log("User ID {$_SESSION['user_id']} is not a member of server ID: $id");
            return $this->forbidden('You are not a member of this server');
        }
        
        // Get all channels for this server
        try {
            $query = new Query();
            
            // Get channels
            $channels = $query->table('channels')
                ->where('server_id', $serverId)
                ->orderBy('position')
                ->get();
            
            // Get categories
            $categories = $query->table('categories')
                ->where('server_id', $serverId)
                ->orderBy('position')
                ->get();
            
            // Ensure channels have full data
            if (!empty($channels)) {
                foreach ($channels as $key => $channel) {
                    // Convert all numeric values to strings to avoid type issues
                    foreach ($channel as $field => $value) {
                        if (is_numeric($value)) {
                            $channels[$key][$field] = (string)$value;
                        }
                    }
                    
                    // Make sure is_private is properly set (convert to boolean for display)
                    if (isset($channel['is_private'])) {
                        // Convert to boolean for display purposes
                        $channels[$key]['is_private'] = (bool)$channel['is_private'];
                    } else {
                        // Default to false if not set
                        $channels[$key]['is_private'] = false;
                    }
                    
                    // Set type_name if missing
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
            
            // Format response based on request
            if ($this->isAjaxRequest()) {
                $responseData = [
                    'categories' => $categories,
                    'uncategorizedChannels' => array_filter($channels, function($channel) {
                        return !isset($channel['category_id']) || empty($channel['category_id']);
                    })
                ];
                
                // Include categorized channels
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
            error_log("Error fetching channels for server ID $id: " . $e->getMessage());
            
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

    /**
     * Check if the current request is an AJAX request
     */
    private function isAjaxRequest() {
        return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
    }
}