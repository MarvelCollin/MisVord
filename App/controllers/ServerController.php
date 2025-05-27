<?php

require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/../database/models/Channel.php';

class ServerController {

    public function __construct() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
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

        if ($server) {
            $GLOBALS['currentServer'] = $server;
            require_once dirname(__DIR__) . '/views/pages/server-page.php';
        } else {

            http_response_code(404);
            require_once dirname(__DIR__) . '/views/pages/404.php';
        }
    }

    public function create() {
        // Set error handling to prevent PHP errors from breaking JSON response
        $oldErrorReporting = error_reporting(E_ALL);
        ini_set('display_errors', 0);
        
        try {
            error_log("Starting server creation process");
            
            if (!isset($_SESSION['user_id'])) {
                error_log("Server creation failed: User not authenticated");
                $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
                return;
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
                $this->jsonResponse(['success' => false, 'message' => 'Server name is required'], 400);
                return;
            }

            // Check for duplicate server name
            error_log("Checking for duplicate server name");
            $existingServer = Server::findByName($name);
            if ($existingServer) {
                error_log("Server creation failed: Name already exists");
                $this->jsonResponse(['success' => false, 'message' => 'Server with this name already exists'], 400);
                return;
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
                    $this->jsonResponse(['success' => false, 'message' => 'Failed to upload server image'], 500);
                    return;
                }
                error_log("Image uploaded successfully: $imageUrl");
                $server->image_url = $imageUrl;
            }

            error_log("Saving server to database");
            if (!$server->save()) {
                error_log("Server creation failed: Could not save server");
                $this->jsonResponse(['success' => false, 'message' => 'Failed to create server'], 500);
                return;
            }
            error_log("Server saved with ID: " . $server->id);

            try {
                error_log("Adding user as server owner");
                UserServerMembership::addOwner($_SESSION['user_id'], $server->id);
                error_log("User {$_SESSION['user_id']} ({$_SESSION['username']}) set as owner of server {$server->id} ({$server->name})");
            } catch (Exception $e) {
                error_log("Failed to set owner for server: " . $e->getMessage());
                // Continue anyway, we'll create the server without explicit owner
            }

            error_log("Creating default channels for server: " . $server->id);
            $channelsCreated = $this->createDefaultChannels($server->id);
            error_log("Default channels created: " . ($channelsCreated ? 'Yes' : 'No'));

            // Always generate an invite link for the server
            error_log("Generating invite link");
            $inviteLink = $server->generateInviteLink();
            error_log("Invite link generated: $inviteLink");

            error_log("Server creation completed successfully");
            $this->jsonResponse([
                'success' => true, 
                'message' => 'Server created successfully',
                'server' => [
                    'id' => $server->id,
                    'name' => $server->name,
                    'image_url' => $server->image_url,
                    'description' => $server->description,
                    'invite_link' => $inviteLink,
                    'is_public' => $server->is_public
                ]
            ], 201);
            
        } catch (Exception $e) {
            error_log("Server creation critical error: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            $this->jsonResponse(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()], 500);
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
            
            // Using a simplified approach without needing separate categories table
            error_log("Creating channels without relying on categories table");
            
            // First, check if the channels table has a category_id column
            error_log("Checking channels table structure");
            $hasParentId = false;
            
            try {
                $columns = $query->getRawResults("SHOW COLUMNS FROM channels");
                foreach ($columns as $column) {
                    if ($column['Field'] === 'category_id' || $column['Field'] === 'parent_id') {
                        $hasParentId = true;
                        error_log("Found parent relationship column: " . $column['Field']);
                        break;
                    }
                }
            } catch (Exception $e) {
                error_log("Error checking channels table structure: " . $e->getMessage());
                // Continue anyway, we'll create channels without parent relationships
            }
            
            // Create the text category channel
            error_log("Creating TEXT CHANNELS category");
            $textCategoryId = $query->table('channels')->insert([
                'server_id' => $serverId,
                'name' => 'TEXT CHANNELS',
                'type' => 'category',
                'position' => 0
            ]);
            error_log("Text category created with ID: $textCategoryId");
            
            // Create general text channel (with or without parent relationship)
            $generalChannelData = [
                'server_id' => $serverId,
                'name' => 'general',
                'type' => 'text',
                'description' => 'General discussion',
                'position' => 1
            ];
            
            // Add parent relationship only if the column exists
            if ($hasParentId) {
                if ($query->columnExists('channels', 'category_id')) {
                    $generalChannelData['category_id'] = $textCategoryId;
                } else if ($query->columnExists('channels', 'parent_id')) {
                    $generalChannelData['parent_id'] = $textCategoryId;
                }
            }
            
            error_log("Creating general text channel");
            $generalChannelId = $query->table('channels')->insert($generalChannelData);
            error_log("General text channel created with ID: $generalChannelId");
            
            // Create voice category channel
            error_log("Creating VOICE CHANNELS category");
            $voiceCategoryId = $query->table('channels')->insert([
                'server_id' => $serverId,
                'name' => 'VOICE CHANNELS',
                'type' => 'category',
                'position' => 2
            ]);
            error_log("Voice category created with ID: $voiceCategoryId");
            
            // Create general voice channel (with or without parent relationship)
            $voiceChannelData = [
                'server_id' => $serverId,
                'name' => 'General Voice',
                'type' => 'voice',
                'position' => 3
            ];
            
            // Add parent relationship only if the column exists
            if ($hasParentId) {
                if ($query->columnExists('channels', 'category_id')) {
                    $voiceChannelData['category_id'] = $voiceCategoryId;
                } else if ($query->columnExists('channels', 'parent_id')) {
                    $voiceChannelData['parent_id'] = $voiceCategoryId;
                }
            }
            
            error_log("Creating general voice channel");
            $voiceChannelId = $query->table('channels')->insert($voiceChannelData);
            error_log("General voice channel created with ID: $voiceChannelId");

            error_log("All default channels created successfully");
            return true;
        } catch (Exception $e) {
            error_log("Error creating default channels: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            return false;
        }
    }

    public function join($inviteCode) {

        if (!isset($_SESSION['user_id'])) {
            header('Location: /login');
            exit;
        }

        if (empty($inviteCode)) {
            $_SESSION['error'] = 'Invalid invite link';
            header('Location: /app');
            exit;
        }

        $server = Server::findByInviteLink($inviteCode);

        if (!$server) {
            $_SESSION['error'] = 'Invalid or expired invite link';
            header('Location: /app');
            exit;
        }

        if (UserServerMembership::isMember($_SESSION['user_id'], $server->id)) {
            header('Location: /server/' . $server->id);
            exit;
        }

        UserServerMembership::create($_SESSION['user_id'], $server->id, 'member');

        header('Location: /server/' . $server->id);
        exit;
    }

    public function leave($serverId) {

        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }

        $server = Server::find($serverId);

        if (!$server) {
            $this->jsonResponse(['success' => false, 'message' => 'Server not found'], 404);
            return;
        }

        if (UserServerMembership::isOwner($_SESSION['user_id'], $server->id)) {
            $this->jsonResponse(['success' => false, 'message' => 'Server owners cannot leave. Transfer ownership first.'], 400);
            return;
        }

        if (UserServerMembership::delete($_SESSION['user_id'], $server->id)) {
            $this->jsonResponse(['success' => true, 'message' => 'Left server successfully']);
        } else {
            $this->jsonResponse(['success' => false, 'message' => 'Failed to leave server'], 500);
        }
    }

    public function showChannel($serverId, $channelId) {

        if (!isset($_SESSION['user_id'])) {
            header('Location: /login');
            exit;
        }

        $server = Server::find($serverId);
        if (!$server) {
            header('Location: /app');
            exit;
        }

        if (!$server->isMember($_SESSION['user_id'])) {
            header('Location: /app');
            exit;
        }

        require_once __DIR__ . '/../database/models/Channel.php';
        $channel = Channel::find($channelId);

        if (!$channel || $channel->server_id != $serverId) {

            header("Location: /server/{$serverId}");
            exit;
        }

        $GLOBALS['currentServer'] = $server;
        $GLOBALS['currentChannel'] = $channel;

        require_once __DIR__ . '/../views/pages/server-page.php';
    }

    private function jsonResponse($data, $statusCode = 200) {
        // Ensure we haven't sent any output already
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json');
        }
        
        // Sanitize data to ensure proper JSON encoding
        $sanitizedData = $this->sanitizeDataForJson($data);
        
        // Ensure we're sending valid JSON
        try {
            // Use a safer approach with all handling options enabled
            echo json_encode($sanitizedData, JSON_THROW_ON_ERROR | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);
        } catch (Exception $e) {
            error_log("Error encoding JSON response: " . $e->getMessage());
            
            // Make a last attempt with a much simpler response
            try {
                echo json_encode([
                    'success' => false, 
                    'message' => 'Server error: Invalid response format',
                    'error_type' => 'json_encoding_failure'
                ], JSON_THROW_ON_ERROR);
            } catch (Exception $e2) {
                // If all else fails, send a plain text error
                header('Content-Type: text/plain');
                echo 'Server error: JSON encoding failed';
            }
        }
        
        // End execution to prevent any additional output
        exit;
    }
    
    /**
     * Recursively sanitize data to ensure it can be JSON encoded
     */
    private function sanitizeDataForJson($data) {
        if (is_array($data)) {
            $sanitized = [];
            foreach ($data as $key => $value) {
                $sanitized[$key] = $this->sanitizeDataForJson($value);
            }
            return $sanitized;
        } elseif (is_object($data)) {
            if (method_exists($data, 'toArray')) {
                return $this->sanitizeDataForJson($data->toArray());
            } else {
                $sanitized = [];
                foreach (get_object_vars($data) as $key => $value) {
                    $sanitized[$key] = $this->sanitizeDataForJson($value);
                }
                return $sanitized;
            }
        } elseif (is_null($data)) {
            return null;
        } elseif (is_scalar($data)) {
            return $data;
        } else {
            // For resources, callbacks, etc.
            return (string)$data;
        }
    }
}