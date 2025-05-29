<?php

require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/models/ServerInvite.php';
require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/../database/query.php';
require_once __DIR__ . '/../config/env.php';

class ServerSettingsController {

    public function __construct() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function updateServerSettings() {
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['server_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Invalid request'], 400);
            return;
        }

        $serverId = $data['server_id'];
        $server = Server::find($serverId);
        
        if (!$server) {
            $this->jsonResponse(['success' => false, 'message' => 'Server not found'], 404);
            return;
        }
        
        // Check if user has permission to update server settings
        if (!UserServerMembership::isOwner($_SESSION['user_id'], $serverId)) {
            $this->jsonResponse(['success' => false, 'message' => 'You do not have permission to update server settings'], 403);
            return;
        }
        
        // Update server properties
        if (isset($data['name']) && !empty($data['name'])) {
            $server->name = $data['name'];
        }
        
        if (isset($data['description'])) {
            $server->description = $data['description'];
        }
        
        if (isset($data['is_public'])) {
            $server->is_public = (bool)$data['is_public'];
        }
        
        // Handle server image update if provided
        if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
            $imageUrl = $this->uploadServerImage($_FILES['image_file']);
            if ($imageUrl !== false) {
                $server->image_url = $imageUrl;
            }
        }
        
        if ($server->save()) {
            $this->jsonResponse(['success' => true, 'message' => 'Server settings updated successfully', 'server' => [
                'id' => $server->id,
                'name' => $server->name,
                'description' => $server->description,
                'image_url' => $server->image_url,
                'is_public' => $server->is_public
            ]]);
        } else {
            $this->jsonResponse(['success' => false, 'message' => 'Failed to update server settings'], 500);
        }
    }

    public function generateInviteLink() {
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }

        // Extract server ID from URL path instead of JSON body
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        preg_match('/\/api\/servers\/(\d+)\/invite/', $path, $matches);
        
        if (!isset($matches[1])) {
            $this->jsonResponse(['success' => false, 'message' => 'Server ID not found in URL'], 400);
            return;
        }

        $serverId = $matches[1];
        $server = Server::find($serverId);
        
        if (!$server) {
            $this->jsonResponse(['success' => false, 'message' => 'Server not found'], 404);
            return;
        }
        
        // Check if user has permission to generate invite link
        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $serverId);
        if (!$membership || ($membership->role !== 'admin' && $membership->role !== 'owner')) {
            $this->jsonResponse(['success' => false, 'message' => 'You do not have permission to generate invite links'], 403);
            return;
        }        try {
            // Generate unique invite code
            $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $inviteCode = '';
            for ($i = 0; $i < 10; $i++) {
                $inviteCode .= $characters[rand(0, strlen($characters) - 1)];
            }
            
            // Delete old invites for this server (optional - keep only latest)
            ServerInvite::deleteOldInvites($serverId);
            
            // Create new invite
            $invite = ServerInvite::create([
                'server_id' => $serverId,
                'inviter_user_id' => $_SESSION['user_id'],
                'invite_link' => $inviteCode
            ]);
            
            if ($invite) {
                $this->jsonResponse([
                    'success' => true, 
                    'message' => 'Invite link generated successfully',
                    'invite_code' => $inviteCode
                ]);
            } else {
                error_log("Failed to create server invite for server ID: $serverId");
                $this->jsonResponse(['success' => false, 'message' => 'Failed to generate invite link'], 500);
            }
        } catch (Exception $e) {
            error_log("Error generating invite link: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            $this->jsonResponse(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
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
    
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
} 