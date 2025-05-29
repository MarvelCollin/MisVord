<?php

require_once __DIR__ . '/../database/models/Channel.php';
require_once __DIR__ . '/../database/models/Category.php';
require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/../database/query.php';

class ChannelController {

    public function __construct() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function show($id) {

        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }

        $channel = Channel::find($id);
        if (!$channel) {
            $this->jsonResponse(['success' => false, 'message' => 'Channel not found'], 404);
            return;
        }

        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
        if (!$membership) {
            $this->jsonResponse(['success' => false, 'message' => 'You are not a member of this server'], 403);
            return;
        }

        $messages = $channel->messages();

        $this->jsonResponse([
            'success' => true,
            'channel' => $this->formatChannel($channel),
            'messages' => $messages
        ]);
    }

    public function create() {

        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }

        $serverId = $_POST['server_id'] ?? null;
        $categoryId = $_POST['category_id'] ?? null;
        $name = $_POST['name'] ?? '';
        $type = $_POST['type'] ?? 'text';
        $isPrivate = isset($_POST['is_private']);

        if (!$serverId) {
            $this->jsonResponse(['success' => false, 'message' => 'Server ID is required'], 400);
            return;
        }

        if (empty($name)) {
            $this->jsonResponse(['success' => false, 'message' => 'Channel name is required'], 400);
            return;
        }

        if (!preg_match('/^[a-z0-9\-_]+$/', $name)) {
            $this->jsonResponse([
                'success' => false, 
                'message' => 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores'
            ], 400);
            return;
        }

        $server = Server::find($serverId);
        if (!$server) {
            $this->jsonResponse(['success' => false, 'message' => 'Server not found'], 404);
            return;
        }

        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $serverId);
        if (!$membership || ($membership->role !== 'admin' && $membership->role !== 'owner')) {
            $this->jsonResponse([
                'success' => false, 
                'message' => 'You do not have permission to create channels in this server'
            ], 403);
            return;
        }

        if ($categoryId) {
            $category = Category::find($categoryId);
            if (!$category || $category->server_id != $serverId) {
                $this->jsonResponse(['success' => false, 'message' => 'Category not found in this server'], 404);
                return;
            }
        }

        $existingChannel = Channel::findByNameAndServer($name, $serverId);
        if ($existingChannel) {
            $this->jsonResponse(['success' => false, 'message' => 'Channel name already exists in this server'], 400);
            return;
        }

        try {

            $channel = new Channel();
            $channel->server_id = $serverId;
            $channel->category_id = $categoryId ? $categoryId : null;
            $channel->name = $name;
            $channel->type = in_array($type, ['text', 'voice']) ? $type : 'text';
            $channel->is_private = $isPrivate;

            if ($channel->save()) {
                $this->jsonResponse([
                    'success' => true, 
                    'message' => 'Channel created successfully',
                    'channel' => $this->formatChannel($channel)
                ]);
            } else {
                $this->jsonResponse(['success' => false, 'message' => 'Failed to create channel'], 500);
            }
        } catch (Exception $e) {
            error_log("Error creating channel: " . $e->getMessage());
            $this->jsonResponse(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    public function createCategory() {

        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }

        $name = $_POST['name'] ?? '';
        $serverId = $_POST['server_id'] ?? 0;

        if (empty($name) || empty($serverId)) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            exit;
        }

        $server = Server::find($serverId);
        if (!$server || !$server->isMember($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Permission denied']);
            exit;
        }

        try {

            require_once __DIR__ . '/../database/models/Category.php';
            $category = new Category();
            $category->name = strtoupper($name); 
            $category->server_id = $serverId;
            $category->position = $this->getNextCategoryPosition($serverId);

            if ($category->save()) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'Category created successfully', 
                    'category' => [
                        'id' => $category->id,
                        'name' => $category->name
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create category']);
            }
        } catch (Exception $e) {
            error_log("Error creating category: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'An error occurred']);
        }

        exit;
    }

    private function getNextCategoryPosition($serverId) {
        require_once __DIR__ . '/../database/models/Category.php';
        $maxPosition = Category::getMaxPositionForServer($serverId);
        return $maxPosition + 1;
    }

    public function update($id) {

        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }

        $channel = Channel::find($id);
        if (!$channel) {
            $this->jsonResponse(['success' => false, 'message' => 'Channel not found'], 404);
            return;
        }

        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
        if (!$membership || ($membership->role !== 'admin' && $membership->role !== 'owner')) {
            $this->jsonResponse([
                'success' => false, 
                'message' => 'You do not have permission to update this channel'
            ], 403);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (isset($data['name'])) {

            if (!preg_match('/^[a-z0-9\-_]+$/', $data['name'])) {
                $this->jsonResponse([
                    'success' => false, 
                    'message' => 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores'
                ], 400);
                return;
            }

            $existingChannel = Channel::findByNameAndServer($data['name'], $channel->server_id);
            if ($existingChannel && $existingChannel->id != $channel->id) {
                $this->jsonResponse([
                    'success' => false, 
                    'message' => 'Channel name already exists in this server'
                ], 400);
                return;
            }

            $channel->name = $data['name'];
        }

        if (isset($data['category_id'])) {

            if ($data['category_id']) {
                $category = Category::find($data['category_id']);
                if (!$category || $category->server_id != $channel->server_id) {
                    $this->jsonResponse([
                        'success' => false, 
                        'message' => 'Category not found in this server'
                    ], 404);
                    return;
                }
                $channel->category_id = $data['category_id'];
            } else {
                $channel->category_id = null;
            }
        }

        if (isset($data['is_private'])) {
            $channel->is_private = (bool)$data['is_private'];
        }

        if (isset($data['type']) && in_array($data['type'], ['text', 'voice'])) {
            $channel->type = $data['type'];
        }

        try {
            if ($channel->save()) {
                $this->jsonResponse([
                    'success' => true, 
                    'message' => 'Channel updated successfully',
                    'channel' => $this->formatChannel($channel)
                ]);
            } else {
                $this->jsonResponse(['success' => false, 'message' => 'Failed to update channel'], 500);
            }
        } catch (Exception $e) {
            error_log("Error updating channel: " . $e->getMessage());
            $this->jsonResponse(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    public function delete($id) {

        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }

        $channel = Channel::find($id);
        if (!$channel) {
            $this->jsonResponse(['success' => false, 'message' => 'Channel not found'], 404);
            return;
        }

        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
        if (!$membership || ($membership->role !== 'admin' && $membership->role !== 'owner')) {
            $this->jsonResponse([
                'success' => false, 
                'message' => 'You do not have permission to delete this channel'
            ], 403);
            return;
        }

        try {
            if ($channel->delete()) {
                $this->jsonResponse(['success' => true, 'message' => 'Channel deleted successfully']);
            } else {
                $this->jsonResponse(['success' => false, 'message' => 'Failed to delete channel'], 500);
            }
        } catch (Exception $e) {
            error_log("Error deleting channel: " . $e->getMessage());
            $this->jsonResponse(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    private function formatChannel($channel) {
        return [
            'id' => $channel->id,
            'server_id' => $channel->server_id,
            'category_id' => $channel->category_id,
            'name' => $channel->name,
            'is_private' => (bool)$channel->is_private,
            'type' => $channel->type,
            'created_at' => $channel->created_at,
            'updated_at' => $channel->updated_at
        ];
    }

    private function jsonResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    public function getServerChannels($serverId) {
        $channels = [];
        $categories = [];
        
        try {
            error_log("ChannelController: Getting channels for server ID $serverId");
            
            // Get channels using the Channel model
            $channels = Channel::getServerChannels($serverId);
            error_log("Retrieved " . count($channels) . " channels from model");
            
            // Categorize channels
            foreach ($channels as $key => $channel) {
                // If the channel has a type of 'category', add it to categories
                if (isset($channel['type_name']) && $channel['type_name'] === 'category') {
                    $categories[] = $channel;
                    unset($channels[$key]); // Remove from channels array
                }
                
                // Also check the direct type field for backwards compatibility
                if (isset($channel['type']) && $channel['type'] === 'category') {
                    $categories[] = $channel;
                    unset($channels[$key]); // Remove from channels array
                }
            }
            
            // Reset array keys
            $channels = array_values($channels);
            
            error_log("Processed channels: " . count($channels) . ", categories: " . count($categories));
            
        } catch (Exception $e) {
            error_log("Error fetching server channels: " . $e->getMessage());
            $channels = [];
            $categories = [];
        }
        
        return [
            'channels' => $channels,
            'categories' => $categories
        ];
    }
    
    public function getChannelMessages($channelId) {
        $messages = [];
        
        try {
            $query = new Query();
            $messages = $query->table('channel_messages cm')
                ->select('cm.*, m.content, m.timestamp, u.username, u.avatar')
                ->join('messages m', 'cm.message_id', '=', 'm.id')
                ->join('users u', 'm.user_id', '=', 'u.id')
                ->where('cm.channel_id', $channelId)
                ->orderBy('m.timestamp', 'ASC')
                ->get();
                
        } catch (Exception $e) {
            error_log("Error fetching channel messages: " . $e->getMessage());
            $messages = [];
        }
        
        return $messages;
    }
}