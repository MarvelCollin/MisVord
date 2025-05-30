<?php

require_once __DIR__ . '/../database/models/Channel.php';
require_once __DIR__ . '/../database/models/Category.php';
require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/../database/query.php';
require_once __DIR__ . '/BaseController.php';

class ChannelController extends BaseController {

    public function __construct() {
        parent::__construct();
    }

    public function show($id) {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $channel = Channel::find($id);
        if (!$channel) {
            return $this->notFound('Channel not found');
        }

        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
        if (!$membership) {
            return $this->forbidden('You are not a member of this server');
        }

        $messages = $channel->messages();

        return $this->successResponse([
            'channel' => $this->formatChannel($channel),
            'messages' => $messages
        ]);
    }

    public function create() {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $serverId = $_POST['server_id'] ?? null;
        $categoryId = $_POST['category_id'] ?? null;
        $name = $_POST['name'] ?? '';
        $type = $_POST['type'] ?? 'text';
        $isPrivate = isset($_POST['is_private']);

        if (!$serverId) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }

        if (empty($name)) {
            return $this->validationError(['name' => 'Channel name is required']);
        }

        if (!preg_match('/^[a-z0-9\-_]+$/', $name)) {
            return $this->validationError([
                'name' => 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores'
            ]);
        }

        $server = Server::find($serverId);
        if (!$server) {
            return $this->notFound('Server not found');
        }

        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $serverId);
        if (!$membership || ($membership->role !== 'admin' && $membership->role !== 'owner')) {
            return $this->forbidden('You do not have permission to create channels in this server');
        }

        if ($categoryId) {
            $category = Category::find($categoryId);
            if (!$category || $category->server_id != $serverId) {
                return $this->notFound('Category not found in this server');
            }
        }

        $existingChannel = Channel::findByNameAndServer($name, $serverId);
        if ($existingChannel) {
            return $this->validationError(['name' => 'Channel name already exists in this server']);
        }

        try {
            $channel = new Channel();
            $channel->server_id = $serverId;
            $channel->category_id = $categoryId ? $categoryId : null;
            $channel->name = $name;
            $channel->type = in_array($type, ['text', 'voice']) ? $type : 'text';
            $channel->is_private = $isPrivate;

            if ($channel->save()) {
                return $this->successResponse([
                    'channel' => $this->formatChannel($channel)
                ], 'Channel created successfully');
            } else {
                return $this->serverError('Failed to create channel');
            }
        } catch (Exception $e) {
            error_log("Error creating channel: " . $e->getMessage());
            return $this->serverError('Server error: ' . $e->getMessage());
        }
    }

    public function createCategory() {
        // Set error handling to prevent PHP errors from breaking JSON response
        $oldErrorReporting = error_reporting(E_ALL);
        ini_set('display_errors', 0);
        
        try {
            if (!isset($_SESSION['user_id'])) {
                return $this->unauthorized();
            }

            $name = $_POST['name'] ?? '';
            $serverId = $_POST['server_id'] ?? 0;

            if (empty($name) || empty($serverId)) {
                return $this->validationError(['message' => 'Missing required fields']);
            }

            $server = Server::find($serverId);
            if (!$server || !$server->isMember($_SESSION['user_id'])) {
                return $this->forbidden('Permission denied');
            }

            require_once __DIR__ . '/../database/models/Category.php';
            $category = new Category();
            $category->name = strtoupper($name); 
            $category->server_id = $serverId;
            $category->position = $this->getNextCategoryPosition($serverId);

            if ($category->save()) {
                return $this->successResponse([
                    'category' => [
                        'id' => $category->id,
                        'name' => $category->name
                    ]
                ], 'Category created successfully');
            } else {
                return $this->serverError('Failed to create category');
            }
        } catch (Exception $e) {
            error_log("Error creating category: " . $e->getMessage());
            return $this->serverError('An error occurred: ' . $e->getMessage());
        } finally {
            // Restore error reporting settings
            error_reporting($oldErrorReporting);
        }
    }

    private function getNextCategoryPosition($serverId) {
        require_once __DIR__ . '/../database/models/Category.php';
        $maxPosition = Category::getMaxPositionForServer($serverId);
        return $maxPosition + 1;
    }

    public function update($id) {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $channel = Channel::find($id);
        if (!$channel) {
            return $this->notFound('Channel not found');
        }

        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
        if (!$membership || ($membership->role !== 'admin' && $membership->role !== 'owner')) {
            return $this->forbidden('You do not have permission to update this channel');
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (isset($data['name'])) {
            if (!preg_match('/^[a-z0-9\-_]+$/', $data['name'])) {
                return $this->validationError([
                    'name' => 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores'
                ]);
            }

            $existingChannel = Channel::findByNameAndServer($data['name'], $channel->server_id);
            if ($existingChannel && $existingChannel->id != $channel->id) {
                return $this->validationError([
                    'name' => 'Channel name already exists in this server'
                ]);
            }

            $channel->name = $data['name'];
        }

        if (isset($data['category_id'])) {
            if ($data['category_id']) {
                $category = Category::find($data['category_id']);
                if (!$category || $category->server_id != $channel->server_id) {
                    return $this->notFound('Category not found in this server');
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
                return $this->successResponse([
                    'channel' => $this->formatChannel($channel)
                ], 'Channel updated successfully');
            } else {
                return $this->serverError('Failed to update channel');
            }
        } catch (Exception $e) {
            error_log("Error updating channel: " . $e->getMessage());
            return $this->serverError('Server error: ' . $e->getMessage());
        }
    }

    public function delete($id) {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $channel = Channel::find($id);
        if (!$channel) {
            return $this->notFound('Channel not found');
        }

        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
        if (!$membership || ($membership->role !== 'admin' && $membership->role !== 'owner')) {
            return $this->forbidden('You do not have permission to delete this channel');
        }

        try {
            if ($channel->delete()) {
                return $this->successResponse([], 'Channel deleted successfully');
            } else {
                return $this->serverError('Failed to delete channel');
            }
        } catch (Exception $e) {
            error_log("Error deleting channel: " . $e->getMessage());
            return $this->serverError('Server error: ' . $e->getMessage());
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
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }
        
        $messages = [];
        
        try {
            $channel = Channel::find($channelId);
            if (!$channel) {
                return $this->notFound('Channel not found');
            }
            
            $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
            if (!$membership && $channel->server_id != 0) {
                return $this->forbidden('You are not a member of this server');
            }
            
            $query = new Query();
            $messages = $query->table('channel_messages cm')
                ->select('cm.*, m.content, m.timestamp, u.username, u.avatar')
                ->join('messages m', 'cm.message_id', '=', 'm.id')
                ->join('users u', 'm.user_id', '=', 'u.id')
                ->where('cm.channel_id', $channelId)
                ->orderBy('m.timestamp', 'ASC')
                ->get();
                
            return $this->successResponse(['messages' => $messages]);
            
        } catch (Exception $e) {
            error_log("Error fetching channel messages: " . $e->getMessage());
            return $this->serverError('Failed to fetch channel messages');
        }
    }
}