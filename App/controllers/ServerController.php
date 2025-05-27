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

        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }

        $name = $_POST['name'] ?? '';
        $description = $_POST['description'] ?? '';

        if (empty($name)) {
            $this->jsonResponse(['success' => false, 'message' => 'Server name is required'], 400);
            return;
        }

        if (Server::findByName($name)) {
            $this->jsonResponse(['success' => false, 'message' => 'Server with this name already exists'], 400);
            return;
        }

        $server = new Server();
        $server->name = $name;
        $server->description = $description;

        $imageUrl = null;
        if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
            $imageUrl = $this->uploadServerImage($_FILES['image_file']);
            if ($imageUrl === false) {
                $this->jsonResponse(['success' => false, 'message' => 'Failed to upload server image'], 500);
                return;
            }
            $server->image_url = $imageUrl;
        }

        if (!$server->save()) {
            $this->jsonResponse(['success' => false, 'message' => 'Failed to create server'], 500);
            return;
        }

        try {
            UserServerMembership::addOwner($_SESSION['user_id'], $server->id);

            error_log("User {$_SESSION['user_id']} ({$_SESSION['username']}) set as owner of server {$server->id} ({$server->name})");
        } catch (Exception $e) {
            error_log("Failed to set owner for server: " . $e->getMessage());

        }

        $this->createDefaultChannels($server->id);

        $server->generateInviteLink();

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
        $query = new Query();

        try {

            $textCategoryId = $query->table('channels')->insert([
                'server_id' => $serverId,
                'name' => 'TEXT CHANNELS',
                'type' => 'category',
                'position' => 0
            ]);

            $query->table('channels')->insert([
                'server_id' => $serverId,
                'name' => 'general',
                'type' => 'text',
                'description' => 'General discussion',
                'position' => 1
            ]);

            $voiceCategoryId = $query->table('channels')->insert([
                'server_id' => $serverId,
                'name' => 'VOICE CHANNELS',
                'type' => 'category',
                'position' => 2
            ]);

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
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
    }
}