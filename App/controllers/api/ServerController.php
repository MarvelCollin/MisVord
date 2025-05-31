<?php

// Disable error display for clean JSON output
ini_set('display_errors', 0);
error_reporting(0);

// Start session at the beginning to avoid any session-related errors
if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}

require_once dirname(dirname(__DIR__)) . '/database/models/Server.php';
require_once dirname(dirname(__DIR__)) . '/database/query.php';

class ServerController {
    
    public function create() {
        // Start output buffering to catch any unwanted output
        if (!ob_get_level()) {
            ob_start();
        }
        
        try {
            // Clear any previous output and set JSON header
            if (ob_get_level()) {
                ob_clean();
            }
            header('Content-Type: application/json');
            
            // Check if user is authenticated
            if (!isset($_SESSION['user_id'])) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                return;
            }
            
            $userId = $_SESSION['user_id'];
            
            // Validate required fields
            if (empty($_POST['name'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Server name is required']);
                return;
            }
            
            $serverName = trim($_POST['name']);
            $description = trim($_POST['description'] ?? '');
            $isPublic = isset($_POST['is_public']) ? 1 : 0;
            
            // Check if server name already exists for this user
            $existingServer = Server::findByName($serverName);
            if ($existingServer) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'A server with this name already exists']);
                return;
            }
            
            // Handle image upload
            $imageUrl = null;
            if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = dirname(dirname(__DIR__)) . '/storage/server-images/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }
                
                $fileName = uniqid() . '_' . $_FILES['image_file']['name'];
                $uploadPath = $uploadDir . $fileName;
                
                if (move_uploaded_file($_FILES['image_file']['tmp_name'], $uploadPath)) {
                    $imageUrl = '/storage/server-images/' . $fileName;
                }
            }
              // Create server
            $query = new Query();
            $serverId = $query->table('servers')->insert([
                'name' => $serverName,
                'description' => $description,
                'image_url' => $imageUrl,
                'is_public' => $isPublic,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            
            if (!$serverId) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create server']);
                return;
            }
            
            // Add creator as admin member
            $query->table('user_server_memberships')->insert([
                'user_id' => $userId,
                'server_id' => $serverId,
                'role' => 'admin',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            
            // Create default general channel
            $channelId = $query->table('channels')->insert([
                'name' => 'general',
                'server_id' => $serverId,
                'type' => 'text',
                'position' => 0,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Server created successfully!',
                'data' => [
                    'server_id' => $serverId,
                    'server' => [
                        'id' => $serverId,
                        'name' => $serverName,
                        'description' => $description,
                        'image_url' => $imageUrl,
                        'is_public' => $isPublic
                    ]
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("Server creation error: " . $e->getMessage());
            if (ob_get_level()) {
                ob_clean();
            }
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Internal server error']);
        } catch (Error $e) {
            error_log("Server creation error: " . $e->getMessage());
            if (ob_get_level()) {
                ob_clean();
            }
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Internal server error']);
        } finally {
            // Ensure output buffer is handled properly
            if (ob_get_level()) {
                ob_end_flush();
            }
        }
    }
}
