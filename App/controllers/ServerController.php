<?php

require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/../database/models/Channel.php';

class ServerController {
    /**
     * Constructor - ensure session is started
     */
    public function __construct() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    /**
     * Get server by ID
     * 
     * @param int $id Server ID
     * @return Server|null The server object or null if not found
     */
    public function getServer($id) {
        // Check if user is authenticated
        if (!isset($_SESSION['user_id'])) {
            return null;
        }
        
        // Find server by ID
        $server = Server::find($id);
        
        // For debugging
        if (!$server) {
            error_log("Server not found with ID: $id");
            return null;
        }
        
        // Successfully found server
        error_log("Successfully found server: " . $server->name);
        return $server;
    }
    
    /**
     * Display the server page with the specified server
     * 
     * @param int $id Server ID
     */
    public function show($id) {
        $server = $this->getServer($id);
        
        // If server exists, set it in the global variable
        if ($server) {
            $GLOBALS['currentServer'] = $server;
            require_once dirname(__DIR__) . '/views/pages/server-page.php';
        } else {
            // Server not found - show 404 page
            http_response_code(404);
            require_once dirname(__DIR__) . '/views/pages/404.php';
        }
    }
    
    /**
     * Create a new server
     */
    public function create() {
        // Check if user is logged in
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }
        
        // Validate required fields
        $name = $_POST['name'] ?? '';
        $description = $_POST['description'] ?? '';
        
        if (empty($name)) {
            $this->jsonResponse(['success' => false, 'message' => 'Server name is required'], 400);
            return;
        }
        
        // Check if server with same name already exists
        if (Server::findByName($name)) {
            $this->jsonResponse(['success' => false, 'message' => 'Server with this name already exists'], 400);
            return;
        }
        
        // Create new server instance
        $server = new Server();
        $server->name = $name;
        $server->description = $description;
        
        // Handle image upload
        $imageUrl = null;
        if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
            $imageUrl = $this->uploadServerImage($_FILES['image_file']);
            if ($imageUrl === false) {
                $this->jsonResponse(['success' => false, 'message' => 'Failed to upload server image'], 500);
                return;
            }
            $server->image_url = $imageUrl;
        }
        
        // Save server
        if (!$server->save()) {
            $this->jsonResponse(['success' => false, 'message' => 'Failed to create server'], 500);
            return;
        }
        
        // Add creator as owner member
        try {
            UserServerMembership::addOwner($_SESSION['user_id'], $server->id);
            
            // Log successful owner assignment
            error_log("User {$_SESSION['user_id']} ({$_SESSION['username']}) set as owner of server {$server->id} ({$server->name})");
        } catch (Exception $e) {
            error_log("Failed to set owner for server: " . $e->getMessage());
            // Don't return an error here as the server was created successfully
        }
        
        // Create default channels
        $this->createDefaultChannels($server->id);
        
        // Generate invite link
        $server->generateInviteLink();
        
        // Return success response with server details
        $this->jsonResponse([
            'success' => true, 
            'message' => 'Server created successfully',
            'server' => [
                'id' => $server->id,
                'name' => $server->name,
                'image_url' => $server->image_url,
                'description' => $server->description,
                'invite_link' => $server->invite_link
            ]
        ], 201);
    }
    
    /**
     * Upload server image
     * 
     * @param array $file The uploaded file
     * @return string|false The image URL on success, false on failure
     */
    private function uploadServerImage($file) {
        // Check if file is an image
        $fileType = exif_imagetype($file['tmp_name']);
        if (!$fileType || !in_array($fileType, [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP])) {
            return false;
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'server_' . time() . '_' . bin2hex(random_bytes(8)) . '.' . $extension;
        
        // Ensure uploads directory exists
        $uploadDir = __DIR__ . '/../public/assets/uploads/servers/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $filepath = $uploadDir . $filename;
        
        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            // Return the web-accessible URL
            return '/public/assets/uploads/servers/' . $filename;
        }
        
        return false;
    }
    
    /**
     * Create default channels for a new server
     * 
     * @param int $serverId
     * @return bool
     */
    private function createDefaultChannels($serverId) {
        $query = new Query();
        
        try {
            // Create text category
            $textCategoryId = $query->table('channels')->insert([
                'server_id' => $serverId,
                'name' => 'TEXT CHANNELS',
                'type' => 'category',
                'position' => 0
            ]);
            
            // Create general text channel
            $query->table('channels')->insert([
                'server_id' => $serverId,
                'name' => 'general',
                'type' => 'text',
                'description' => 'General discussion',
                'position' => 1
            ]);
            
            // Create voice category
            $voiceCategoryId = $query->table('channels')->insert([
                'server_id' => $serverId,
                'name' => 'VOICE CHANNELS',
                'type' => 'category',
                'position' => 2
            ]);
            
            // Create general voice channel
            $query->table('channels')->insert([
                'server_id' => $serverId,
                'name' => 'General Voice',
                'type' => 'voice',
                'position' => 3
            ]);
            
            return true;
        } catch (Exception $e) {
            error_log('Error creating default channels: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Join a server using an invite link
     * 
     * @param string $inviteCode The invite code from URL
     */
    public function join($inviteCode) {
        // Check if user is logged in
        if (!isset($_SESSION['user_id'])) {
            header('Location: /login');
            exit;
        }
        
        if (empty($inviteCode)) {
            $_SESSION['error'] = 'Invalid invite link';
            header('Location: /app');
            exit;
        }
        
        // Find server by invite link
        $server = Server::findByInviteLink($inviteCode);
        
        if (!$server) {
            $_SESSION['error'] = 'Invalid or expired invite link';
            header('Location: /app');
            exit;
        }
        
        // Check if user is already a member
        if (UserServerMembership::isMember($_SESSION['user_id'], $server->id)) {
            header('Location: /server/' . $server->id);
            exit;
        }
        
        // Add user to server
        UserServerMembership::create($_SESSION['user_id'], $server->id, 'member');
        
        // Redirect to the server
        header('Location: /server/' . $server->id);
        exit;
    }
    
    /**
     * Leave a server
     * 
     * @param int $serverId
     */
    public function leave($serverId) {
        // Check if user is logged in
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }
        
        // Find the server
        $server = Server::find($serverId);
        
        if (!$server) {
            $this->jsonResponse(['success' => false, 'message' => 'Server not found'], 404);
            return;
        }
        
        // Check if user is the owner - owners can't leave, must transfer ownership first
        if (UserServerMembership::isOwner($_SESSION['user_id'], $server->id)) {
            $this->jsonResponse(['success' => false, 'message' => 'Server owners cannot leave. Transfer ownership first.'], 400);
            return;
        }
        
        // Remove user from server
        if (UserServerMembership::delete($_SESSION['user_id'], $server->id)) {
            $this->jsonResponse(['success' => true, 'message' => 'Left server successfully']);
        } else {
            $this->jsonResponse(['success' => false, 'message' => 'Failed to leave server'], 500);
        }
    }
    
    /**
     * Helper method to send JSON responses
     * 
     * @param mixed $data The data to send
     * @param int $statusCode HTTP status code
     */
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
    }
}
