<?php

require_once __DIR__ . '/../database/models/Channel.php';
require_once __DIR__ . '/../database/models/Category.php';
require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/models/UserServerMembership.php';

class ChannelController {
    /**
     * Constructor - ensure session is started
     */
    public function __construct() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    /**
     * Get channel by ID
     * 
     * @param int $id
     * @return void
     */
    public function show($id) {
        // Check if user is authenticated
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }
        
        // Find channel
        $channel = Channel::find($id);
        if (!$channel) {
            $this->jsonResponse(['success' => false, 'message' => 'Channel not found'], 404);
            return;
        }
        
        // Check if user is a member of the server
        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
        if (!$membership) {
            $this->jsonResponse(['success' => false, 'message' => 'You are not a member of this server'], 403);
            return;
        }
        
        // Get messages for this channel
        $messages = $channel->messages();
        
        // Return success response with channel and messages
        $this->jsonResponse([
            'success' => true,
            'channel' => $this->formatChannel($channel),
            'messages' => $messages
        ]);
    }
    
    /**
     * Create a new channel
     * 
     * @return void
     */
    public function create() {
        // Check if user is authenticated
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }
        
        // Validate input
        $serverId = $_POST['server_id'] ?? null;
        $categoryId = $_POST['category_id'] ?? null;
        $name = $_POST['name'] ?? '';
        $type = $_POST['type'] ?? 'text';
        $isPrivate = isset($_POST['is_private']);
        
        // Validate required fields
        if (!$serverId) {
            $this->jsonResponse(['success' => false, 'message' => 'Server ID is required'], 400);
            return;
        }
        
        if (empty($name)) {
            $this->jsonResponse(['success' => false, 'message' => 'Channel name is required'], 400);
            return;
        }
        
        // Validate channel name format (only lowercase letters, numbers, and hyphens)
        if (!preg_match('/^[a-z0-9\-_]+$/', $name)) {
            $this->jsonResponse([
                'success' => false, 
                'message' => 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores'
            ], 400);
            return;
        }
        
        // Check if server exists
        $server = Server::find($serverId);
        if (!$server) {
            $this->jsonResponse(['success' => false, 'message' => 'Server not found'], 404);
            return;
        }
        
        // Check if user is admin or owner of the server
        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $serverId);
        if (!$membership || ($membership->role !== 'admin' && $membership->role !== 'owner')) {
            $this->jsonResponse([
                'success' => false, 
                'message' => 'You do not have permission to create channels in this server'
            ], 403);
            return;
        }
        
        // Check if category exists if provided
        if ($categoryId) {
            $category = Category::find($categoryId);
            if (!$category || $category->server_id != $serverId) {
                $this->jsonResponse(['success' => false, 'message' => 'Category not found in this server'], 404);
                return;
            }
        }
        
        // Check if channel name already exists in this server
        $existingChannel = Channel::findByNameAndServer($name, $serverId);
        if ($existingChannel) {
            $this->jsonResponse(['success' => false, 'message' => 'Channel name already exists in this server'], 400);
            return;
        }
        
        try {
            // Create new channel
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
    
    /**
     * Create a new category
     * 
     * @return void
     */
    public function createCategory() {
        // Check if user is authenticated
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }
        
        // Validate input
        $serverId = $_POST['server_id'] ?? null;
        $name = $_POST['name'] ?? '';
        
        // Validate required fields
        if (!$serverId) {
            $this->jsonResponse(['success' => false, 'message' => 'Server ID is required'], 400);
            return;
        }
        
        if (empty($name)) {
            $this->jsonResponse(['success' => false, 'message' => 'Category name is required'], 400);
            return;
        }
        
        // Check if server exists
        $server = Server::find($serverId);
        if (!$server) {
            $this->jsonResponse(['success' => false, 'message' => 'Server not found'], 404);
            return;
        }
        
        // Check if user is admin or owner of the server
        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $serverId);
        if (!$membership || ($membership->role !== 'admin' && $membership->role !== 'owner')) {
            $this->jsonResponse([
                'success' => false, 
                'message' => 'You do not have permission to create categories in this server'
            ], 403);
            return;
        }
        
        // Check if category name already exists in this server
        $existingCategory = Category::findByNameAndServer($name, $serverId);
        if ($existingCategory) {
            $this->jsonResponse(['success' => false, 'message' => 'Category name already exists in this server'], 400);
            return;
        }
        
        try {
            // Create new category
            $category = new Category();
            $category->server_id = $serverId;
            $category->name = $name;
            
            if ($category->save()) {
                $this->jsonResponse([
                    'success' => true, 
                    'message' => 'Category created successfully',
                    'category' => [
                        'id' => $category->id,
                        'name' => $category->name,
                        'server_id' => $category->server_id,
                        'created_at' => $category->created_at
                    ]
                ]);
            } else {
                $this->jsonResponse(['success' => false, 'message' => 'Failed to create category'], 500);
            }
        } catch (Exception $e) {
            error_log("Error creating category: " . $e->getMessage());
            $this->jsonResponse(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Update channel by ID
     * 
     * @param int $id
     * @return void
     */
    public function update($id) {
        // Check if user is authenticated
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }
        
        // Find channel
        $channel = Channel::find($id);
        if (!$channel) {
            $this->jsonResponse(['success' => false, 'message' => 'Channel not found'], 404);
            return;
        }
        
        // Check if user is admin or owner of the server
        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
        if (!$membership || ($membership->role !== 'admin' && $membership->role !== 'owner')) {
            $this->jsonResponse([
                'success' => false, 
                'message' => 'You do not have permission to update this channel'
            ], 403);
            return;
        }
        
        // Get request body
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Update fields
        if (isset($data['name'])) {
            // Validate channel name format
            if (!preg_match('/^[a-z0-9\-_]+$/', $data['name'])) {
                $this->jsonResponse([
                    'success' => false, 
                    'message' => 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores'
                ], 400);
                return;
            }
            
            // Check if name already exists in this server (excluding current channel)
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
            // Check if category exists
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
    
    /**
     * Delete a channel
     * 
     * @param int $id
     * @return void
     */
    public function delete($id) {
        // Check if user is authenticated
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
            return;
        }
        
        // Find channel
        $channel = Channel::find($id);
        if (!$channel) {
            $this->jsonResponse(['success' => false, 'message' => 'Channel not found'], 404);
            return;
        }
        
        // Check if user is admin or owner of the server
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
    
    /**
     * Format channel data for API response
     * 
     * @param Channel $channel
     * @return array
     */
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
    
    /**
     * Send JSON response
     * 
     * @param array $data
     * @param int $status
     * @return void
     */
    private function jsonResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
