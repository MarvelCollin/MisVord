<?php

require_once __DIR__ . '/../database/models/Channel.php';
require_once __DIR__ . '/../database/models/Category.php';
require_once __DIR__ . '/../database/models/Server.php';
require_once __DIR__ . '/../database/models/UserServerMembership.php';
require_once __DIR__ . '/../database/query.php';
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../utils/AppLogger.php';

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

        $oldErrorReporting = error_reporting(E_ALL);
        ini_set('display_errors', 0);

        register_shutdown_function(function() {
            $error = error_get_last();
            if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {

                while (ob_get_level()) {
                    ob_end_clean();
                }

                header('Content-Type: application/json');
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Fatal server error occurred',
                    'error' => $error['message'],
                    'debug_info' => [
                        'file' => $error['file'],
                        'line' => $error['line']
                    ]
                ]);
                exit;
            }
        });

        ob_start();

        try {

            $memoryLimit = ini_get('memory_limit');
            $memoryUsed = memory_get_usage(true);

            if ($memoryUsed / 1024 / 1024 > intval($memoryLimit) * 0.9) {

                log_warning("High memory usage detected", [
                    'memory_used' => $memoryUsed,
                    'memory_limit' => $memoryLimit
                ]);
            }

            if (!isset($_SESSION['user_id'])) {
                return $this->unauthorized();
            }

            log_debug("Raw POST data", ['post_data' => $_POST]);

            $serverId = $_POST['server_id'] ?? null;
            $name = $_POST['name'] ?? '';
            $type = $_POST['type'] ?? 'text';
            $isPrivate = isset($_POST['is_private']);
            $isFallback = isset($_POST['ajax_fallback']) && $_POST['ajax_fallback'] === 'true';

            $categoryIdExists = array_key_exists('category_id', $_POST);
            log_debug("Category ID exists in POST", ['exists' => $categoryIdExists]);

            $categoryId = $categoryIdExists ? ($_POST['category_id'] !== '' ? $_POST['category_id'] : null) : null;
            $position = isset($_POST['position']) && $_POST['position'] !== '' ? intval($_POST['position']) : null;            log_debug("EXPLICIT DEBUG", ['categoryId' => $categoryId]);
            log_debug("Creating channel with values", [
                'serverId' => $serverId,
                'name' => $name,
                'type' => $type,
                'categoryId' => $categoryId ?? 'null',
                'position' => $position ?? 'null'
            ]);

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

            if ($categoryIdExists && $categoryId !== null && $categoryId !== '') {
                log_debug("Validating category", [
                    'category_id' => $categoryId,
                    'server_id' => $serverId
                ]);

                try {
                    $category = Category::find($categoryId);

                    if (!$category) {
                        log_error("Category validation failed: Category not found", ['category_id' => $categoryId]);
                        return $this->notFound('Category not found');
                    }

                    if ($category->server_id != $serverId) {
                        log_error("Category validation failed: Category belongs to wrong server", [
                            'category_id' => $categoryId,
                            'category_server_id' => $category->server_id,
                            'expected_server_id' => $serverId
                        ]);
                        return $this->notFound('Category not found in this server');
                    }

                    log_debug("Category validation passed", [
                        'category_id' => $categoryId,
                        'server_id' => $serverId
                    ]);
                } catch (Exception $e) {
                    log_error("Exception during category validation", ['message' => $e->getMessage()]);
                    return $this->serverError('Error validating category: ' . $e->getMessage());
                }
            } else {
                log_debug("Skipping category validation - no valid category ID provided");
            }

            $existingChannel = Channel::findByNameAndServer($name, $serverId);
            if ($existingChannel) {
                return $this->validationError(['name' => 'Channel name already exists in this server']);
            }

            try {
                $query = new Query();

                try {
                    $connectionTest = $query->getPdo()->query('SELECT 1');
                    if (!$connectionTest) {
                        throw new Exception("Failed to verify database connection");
                    }
                } catch (Exception $dbException) {
                    log_error("Database connection error", ['message' => $dbException->getMessage()]);
                    return $this->serverError('Database connection error: ' . $dbException->getMessage());
                }

                $result = $query->transaction(function($query) use ($serverId, $categoryId, $name, $type, $isPrivate, $position, $isFallback) {
                    $channel = new Channel();
                    $channel->server_id = $serverId;

                    $channel->category_id = ($categoryId !== null && $categoryId !== '') ? $categoryId : null;
                    log_debug("Setting channel category_id", ['category_id' => $channel->category_id]);

                    $channel->name = $name;

                    $channel->type = $type; 

                    $channel->is_private = $isPrivate;

                    if ($position !== null) {

                        $query->table('channels')
                              ->where('category_id', $categoryId)
                              ->where('position', '>=', $position)
                              ->update(['position' => $query->raw('position + 1')]);

                        $channel->position = $position;
                    } else {

                        $maxPosition = $query->table('channels')
                                            ->where('category_id', $categoryId)
                                            ->max('position');
                        $channel->position = ($maxPosition !== null) ? $maxPosition + 1 : 0;
                    }                    if ($channel->save()) {
                        if ($isFallback) {
                            header("Location: /server/{$serverId}");
                            exit;
                        }

                        return $this->successResponse([
                            'channel' => $this->formatChannel($channel),
                            'redirect' => "/server/{$serverId}" 
                        ], 'Channel created successfully');
                    } else {
                        return $this->serverError('Failed to create channel');
                    }
                });

                ob_end_clean();

                return $result;
            } catch (Exception $e) {

                ob_end_clean();

                log_error("Error creating channel", ['message' => $e->getMessage()]);
                return $this->serverError('Server error: ' . $e->getMessage());
            }
        } catch (Exception $e) {

            ob_end_clean();

            log_error("Critical error creating channel", ['message' => $e->getMessage()]);

            if (isset($_POST['ajax_fallback']) && $_POST['ajax_fallback'] === 'true') {
                $serverId = $_POST['server_id'] ?? null;
                if ($serverId) {
                    header("Location: /server/{$serverId}?error=true");
                    exit;
                } else {
                    header("Location: /app");
                    exit;
                }
            }

            return $this->serverError('An error occurred: ' . $e->getMessage());
        } finally {

            while (ob_get_level()) {
                ob_end_clean();
            }

            error_reporting($oldErrorReporting);
        }
    }

    public function createCategory() {

        $oldErrorReporting = error_reporting(E_ALL);
        ini_set('display_errors', 0);

        register_shutdown_function(function() {
            $error = error_get_last();
            if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {

                while (ob_get_level()) {
                    ob_end_clean();
                }

                header('Content-Type: application/json');
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Fatal server error occurred',
                    'error' => $error['message'],
                    'debug_info' => [
                        'file' => $error['file'],
                        'line' => $error['line']
                    ]
                ]);
                exit;
            }
        });

        ob_start();

        try {
            if (!isset($_SESSION['user_id'])) {
                return $this->unauthorized();
            }

            $name = $_POST['name'] ?? '';
            $serverId = $_POST['server_id'] ?? 0;
            $isFallback = isset($_POST['ajax_fallback']) && $_POST['ajax_fallback'] === 'true';

            $position = isset($_POST['position']) && $_POST['position'] !== '' ? intval($_POST['position']) : null;

            log_debug("Creating category with values", [
                'serverId' => $serverId,
                'name' => $name,
                'position' => $position ?? 'null'
            ]);

            if (empty($name) || empty($serverId)) {
                return $this->validationError(['message' => 'Missing required fields']);
            }

            $server = Server::find($serverId);
            if (!$server || !$server->isMember($_SESSION['user_id'])) {
                return $this->forbidden('Permission denied');
            }

            require_once __DIR__ . '/../database/models/Category.php';
            $query = new Query();

            try {
                $connectionTest = $query->getPdo()->query('SELECT 1');
                if (!$connectionTest) {
                    throw new Exception("Failed to verify database connection");
                }
            } catch (Exception $dbException) {
                log_error("Database connection error", ['message' => $dbException->getMessage()]);
                return $this->serverError('Database connection error: ' . $dbException->getMessage());
            }

            $result = $query->transaction(function($query) use ($name, $serverId, $position, $isFallback) {
                $category = new Category();
                $category->name = strtoupper($name); 
                $category->server_id = $serverId;

                if ($position !== null) {

                    $query->table('categories')
                          ->where('server_id', $serverId)
                          ->where('position', '>=', $position)
                          ->update(['position' => $query->raw('position + 1')]);

                    $category->position = $position;
                } else {                    $category->position = $this->getNextCategoryPosition($serverId);
                }
                
                if ($category->save()) {
                    if ($isFallback) {
                        header("Location: /server/{$serverId}");
                        exit;
                    }

                    return $this->successResponse([
                        'category' => [
                            'id' => $category->id,
                            'name' => $category->name,
                            'position' => $category->position
                        ],
                        'redirect' => "/server/{$serverId}" 
                    ], 'Category created successfully');
                } else {
                    return $this->serverError('Failed to create category');
                }
            });

            ob_end_clean();

            return $result;
        } catch (Exception $e) {

            ob_end_clean();

            log_error("Error creating category", ['message' => $e->getMessage()]);

            if (isset($_POST['ajax_fallback']) && $_POST['ajax_fallback'] === 'true') {
                $serverId = $_POST['server_id'] ?? null;
                if ($serverId) {
                    header("Location: /server/{$serverId}?error=true");
                    exit;
                } else {
                    header("Location: /app");
                    exit;
                }
            }

            return $this->serverError('An error occurred: ' . $e->getMessage());
        } finally {

            while (ob_get_level()) {
                ob_end_clean();
            }

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
            log_error("Error updating channel", ['message' => $e->getMessage()]);
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
            log_error("Error deleting channel", ['message' => $e->getMessage()]);
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
            log_debug("Getting channels for server", ['server_id' => $serverId]);

            $channels = Channel::getServerChannels($serverId);
            log_debug("Retrieved channels from model", ['count' => count($channels)]);

            foreach ($channels as $key => $channel) {

                if (isset($channel['type_name']) && $channel['type_name'] === 'category') {
                    $categories[] = $channel;
                    unset($channels[$key]); 
                }

                if (isset($channel['type']) && $channel['type'] === 'category') {
                    $categories[] = $channel;
                    unset($channels[$key]); 
                }
            }

            $channels = array_values($channels);

            log_debug("Processed channels and categories", [
                'channels_count' => count($channels),
                'categories_count' => count($categories)
            ]);

        } catch (Exception $e) {
            log_error("Error fetching server channels", ['message' => $e->getMessage()]);
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

            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
            $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

            $limit = min(max($limit, 10), 100); 

            $query = new Query();
            $messages = $query->table('channel_messages cm')
                ->select('cm.*, m.content, m.timestamp, u.username, u.avatar, m.user_id')
                ->join('messages m', 'cm.message_id', '=', 'm.id')
                ->join('users u', 'm.user_id', '=', 'u.id')
                ->where('cm.channel_id', $channelId)
                ->orderBy('m.timestamp', 'DESC')
                ->limit($limit)
                ->offset($offset)
                ->get();

            $messages = array_reverse($messages);

            $totalCount = $query->table('channel_messages')
                ->where('channel_id', $channelId)
                ->count();

            return $this->successResponse([
                'messages' => $messages,
                'channel' => $this->formatChannel($channel),
                'pagination' => [
                    'total' => $totalCount,
                    'limit' => $limit,
                    'offset' => $offset,
                    'hasMore' => ($offset + $limit) < $totalCount
                ]
            ]);

        } catch (Exception $e) {
            log_error("Error fetching channel messages", ['message' => $e->getMessage()]);
            return $this->serverError('Failed to fetch channel messages');
        }
    }

    public function getChannelParticipants($channelId) {
        if (!isset($_SESSION['user_id'])) {
            return $this->unauthorized();
        }

        $channel = Channel::find($channelId);
        if (!$channel) {
            return $this->notFound('Channel not found');
        }

        $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
        if (!$membership) {
            return $this->forbidden('You are not a member of this server');
        }

        try {
            $participants = $channel->participants();
            return $this->successResponse([
                'participants' => $participants
            ]);
        } catch (Exception $e) {
            log_error("Error getting channel participants", ['message' => $e->getMessage()]);
            return $this->serverError('Server error: ' . $e->getMessage());
        }
    }

    public function updateChannelPosition() {
        try {
            if (!isset($_SESSION['user_id'])) {
                return $this->unauthorized();
            }

            $data = json_decode(file_get_contents('php://input'), true);

            log_debug("Channel position update request", ['data' => $data]);

            if (!isset($data['channel_id']) || !isset($data['position'])) {
                return $this->validationError(['message' => 'Channel ID and position are required']);
            }

            $channelId = $data['channel_id'];
            $newPosition = $data['position'];
            $newCategoryId = $data['category_id'] ?? null;

            log_debug("Finding channel with ID", ['channel_id' => $channelId]);

            $channel = Channel::find($channelId);
            if (!$channel) {
                log_error("Channel not found", ['channel_id' => $channelId]);
                return $this->notFound('Channel not found');
            }

            log_debug("Channel found", ['channel' => $channel]);

            $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $channel->server_id);
            if (!$membership || ($membership->role !== 'admin' && $membership->role !== 'owner' && $membership->role !== 'moderator')) {
                return $this->forbidden('You do not have permission to update this channel');
            }            $query = new Query();
            return $query->transaction(function($query) use ($channel, $newPosition, $newCategoryId, $channelId) {
                $oldPosition = (int)$channel->position;
                $oldCategoryId = $channel->category_id;

                if ($newCategoryId !== null && $newCategoryId != $oldCategoryId) {
                    log_debug("Moving channel between categories", [
                        'from_category' => $oldCategoryId,
                        'to_category' => $newCategoryId
                    ]);

                    $query->table('channels')
                          ->where('category_id', $oldCategoryId)
                          ->where('position', '>', $oldPosition)
                          ->update(['position' => $query->raw('position - 1')]);

                    $query->table('channels')
                          ->where('category_id', $newCategoryId)
                          ->where('position', '>=', $newPosition)
                          ->update(['position' => $query->raw('position + 1')]);

                    $channel->position = $newPosition;
                    $channel->category_id = $newCategoryId;
                } 

                else {
                    log_debug("Moving channel within same category", [
                        'from_position' => $oldPosition,
                        'to_position' => $newPosition
                    ]);

                    if ($newPosition > $oldPosition) {

                        $query->table('channels')
                              ->where('category_id', $oldCategoryId)
                              ->where('position', '>', $oldPosition)
                              ->where('position', '<=', $newPosition)
                              ->update(['position' => $query->raw('position - 1')]);
                    } else if ($newPosition < $oldPosition) {

                        $query->table('channels')
                              ->where('category_id', $oldCategoryId)
                              ->where('position', '>=', $newPosition)
                              ->where('position', '<', $oldPosition)
                              ->update(['position' => $query->raw('position + 1')]);
                    } else {                        log_debug("No position change needed", [
                            'old_position' => $oldPosition,
                            'new_position' => $newPosition
                        ]);
                        return $this->successResponse([
                            'success' => true,
                            'channel' => $this->formatChannel($channel)
                        ], 'Channel position unchanged');
                    }
                    
                    $channel->position = $newPosition;
                }
                
                try {
                    $saved = $channel->save();
                    
                    if ($saved) {
                        return $this->successResponse([
                            'success' => true,
                            'channel' => $this->formatChannel($channel)
                        ], 'Channel position updated successfully');
                    } else {
                        log_error("Failed to update channel position", ['channel_id' => $channelId]);
                        return $this->serverError('Failed to update channel position');
                    }
                } catch (Exception $saveException) {
                    log_error("Exception saving channel", ['message' => $saveException->getMessage()]);
                    return $this->serverError('Failed to update channel position');
                }
            });
        } catch (Exception $e) {            log_error("Exception in updateChannelPosition", [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->serverError('Server error: ' . $e->getMessage());
        }
    }

    public function updateCategoryPosition() {
        try {
            if (!isset($_SESSION['user_id'])) {
                return $this->unauthorized();
            }

            $data = json_decode(file_get_contents('php://input'), true);

            log_debug("Category position update request", ['data' => $data]);

                if (!isset($data['category_id']) || !isset($data['position'])) {
                    return $this->validationError(['message' => 'Category ID and position are required']);
            }

            $categoryId = $data['category_id'];
            $newPosition = $data['position'];

            log_debug("Finding category with ID", ['category_id' => $categoryId]);

            $category = Category::find($categoryId);
            if (!$category) {
                log_error("Category not found", ['category_id' => $categoryId]);
                return $this->notFound('Category not found');
            }

            log_debug("Category found", ['category' => $category]);

            $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $category->server_id);
            if (!$membership || ($membership->role !== 'admin' && $membership->role !== 'owner' && $membership->role !== 'moderator')) {
                return $this->forbidden('You do not have permission to update this category');
            }

            $query = new Query();
            return $query->transaction(function($query) use ($category, $categoryId, $newPosition) {
                $oldPosition = (int)$category->position;
                $serverId = $category->server_id;

                if ($oldPosition === $newPosition) {
                    log_debug("No position change needed for category", [
                        'old_position' => $oldPosition, 
                        'new_position' => $newPosition
                    ]);
                    return $this->successResponse([
                        'success' => true,
                        'category' => [
                            'id' => $category->id,
                            'name' => $category->name,
                            'position' => $category->position
                        ]
                    ], 'Category position unchanged');
                }

                log_debug("Moving category position", [
                    'from_position' => $oldPosition, 
                    'to_position' => $newPosition
                ]);

                if ($newPosition > $oldPosition) {

                    $query->table('categories')
                          ->where('server_id', $serverId)
                          ->where('position', '>', $oldPosition)
                          ->where('position', '<=', $newPosition)
                          ->update(['position' => $query->raw('position - 1')]);
                } else {

                    $query->table('categories')
                          ->where('server_id', $serverId)
                          ->where('position', '>=', $newPosition)
                          ->where('position', '<', $oldPosition)
                          ->update(['position' => $query->raw('position + 1')]);
                }

                $category->position = $newPosition;

                log_debug("Saving category with new position", ['new_position' => $newPosition]);

                $saved = $category->save();
                log_debug("Category save result", ['saved' => $saved ? 'success' : 'failed']);

                if ($saved) {
                    return $this->successResponse([
                        'success' => true,
                        'category' => [
                            'id' => $category->id,
                            'name' => $category->name,
                            'position' => $category->position
                        ]
                    ], 'Category position updated successfully');
                } else {
                    log_error("Failed to update category position", ['category_id' => $categoryId]);
                    return $this->serverError('Failed to update category position');
                }
            });
        } catch (Exception $e) {            log_error("Exception in updateCategoryPosition", [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->serverError('Server error: ' . $e->getMessage());
        }
    }

    public function batchUpdatePositions() {
        try {
            if (!isset($_SESSION['user_id'])) {
                return $this->unauthorized();
            }

            $data = json_decode(file_get_contents('php://input'), true);

            log_debug("Batch position update request", ['data' => $data]);

            if (!isset($data['updates']) || !is_array($data['updates'])) {
                return $this->validationError(['message' => 'Updates array is required']);
            }

            $updates = $data['updates'];
            $serverId = $data['server_id'] ?? null;

            if (!$serverId) {
                return $this->validationError(['message' => 'Server ID is required']);
            }

            $membership = UserServerMembership::findByUserAndServer($_SESSION['user_id'], $serverId);
            if (!$membership || ($membership->role !== 'admin' && $membership->role !== 'owner' && $membership->role !== 'moderator')) {
                return $this->forbidden('You do not have permission to update positions in this server');
            }

            $query = new Query();
            return $query->transaction(function($query) use ($updates, $serverId) {
                $success = true;
                $errors = [];
                $updated = [
                    'channels' => 0,
                    'categories' => 0
                ];

                foreach ($updates as $update) {
                    if (!isset($update['id']) || !isset($update['position'])) {
                        $errors[] = "Missing id or position for an item";
                        continue;
                    }

                    $id = $update['id'];
                    $position = $update['position'];
                    $type = $update['type'] ?? 'channel';
                    $categoryId = $update['category_id'] ?? null;

                    try {
                        if ($type === 'channel') {
                            $channel = Channel::find($id);
                            if (!$channel) {
                                $errors[] = "Channel with ID $id not found";
                                continue;
                            }

                            if ($channel->server_id != $serverId) {
                                $errors[] = "Channel with ID $id does not belong to this server";
                                continue;
                            }

                            if ($categoryId !== null) {
                                $channel->category_id = $categoryId;
                            }

                            $channel->position = $position;
                            if ($channel->save()) {
                                $updated['channels']++;
                            } else {
                                $errors[] = "Failed to update channel with ID $id";
                            }
                        } else if ($type === 'category') {
                            $category = Category::find($id);
                            if (!$category) {
                                $errors[] = "Category with ID $id not found";
                                continue;
                            }

                            if ($category->server_id != $serverId) {
                                $errors[] = "Category with ID $id does not belong to this server";
                                continue;
                            }

                            $category->position = $position;
                            if ($category->save()) {
                                $updated['categories']++;
                            } else {
                                $errors[] = "Failed to update category with ID $id";
                            }
                        } else {
                            $errors[] = "Invalid type: $type";
                        }
                    } catch (Exception $e) {
                        $errors[] = "Error updating item with ID $id: " . $e->getMessage();
                        log_error("Error in batch update", ['message' => $e->getMessage()]);
                        $success = false;
                    }
                }

                if ($success) {
                    return $this->successResponse([
                        'success' => true,
                        'updated' => $updated,
                        'warnings' => count($errors) > 0 ? $errors : null
                    ], 'Positions updated successfully');
                } else {
                    return $this->partialContent([
                        'success' => false,
                        'updated' => $updated,
                        'errors' => $errors
                    ], 'Some updates failed');
                }
            });
        } catch (Exception $e) {            log_error("Exception in batchUpdatePositions", [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->serverError('Server error: ' . $e->getMessage());
        }
    }

}