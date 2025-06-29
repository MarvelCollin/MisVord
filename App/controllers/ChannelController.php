<?php

require_once __DIR__ . '/../database/repositories/ChannelRepository.php';
require_once __DIR__ . '/../database/repositories/MessageRepository.php';
require_once __DIR__ . '/../database/repositories/ChannelMessageRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../database/repositories/CategoryRepository.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/../database/query.php';
require_once __DIR__ . '/BaseController.php';

class ChannelController extends BaseController
{

    private $channelRepository;
    private $messageRepository;
    private $membershipRepository;
    private $categoryRepository;

    public function __construct()
    {
        parent::__construct();
        $this->channelRepository = new ChannelRepository();
        $this->messageRepository = new MessageRepository();
        $this->channelMessageRepository = new ChannelMessageRepository();
        $this->membershipRepository = new UserServerMembershipRepository();
        $this->categoryRepository = new CategoryRepository();
    }

    private function validateServerAccess($serverId, $requireOwner = false)
    {
        $userId = $this->getCurrentUserId();
        
        if ($requireOwner) {
            if (!$this->membershipRepository->isOwner($userId, $serverId)) {
                return $this->forbidden('You do not have permission to perform this action');
            }
        } else {
            if (!$this->membershipRepository->isMember($userId, $serverId)) {
                return $this->forbidden('You do not have access to this server');
            }
        }
        
        return null;
    }

    private function validateChannelAccess($channelId, $requireOwner = false)
    {
        $channel = $this->channelRepository->find($channelId);
        if (!$channel) {
            return [null, $this->notFound('Channel not found')];
        }

        $accessCheck = $this->validateServerAccess($channel->server_id, $requireOwner);
        if ($accessCheck) {
            return [null, $accessCheck];
        }

        return [$channel, null];
    }

    public function index()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $serverId = $input['server_id'] ?? null;

        if (!$serverId) {
            return $this->validationError(['server_id' => 'Server ID is required']);
        }
        
        try {
            $accessCheck = $this->validateServerAccess($serverId);
            if ($accessCheck) return $accessCheck;

            $channels = $this->channelRepository->getByServerId($serverId);

            $this->logActivity('channels_viewed', ['server_id' => $serverId]);

            return $this->success([
                'channels' => $channels,
                'server_id' => $serverId
            ]);
        } catch (Exception $e) {
            $this->logActivity('channels_view_error', [
                'server_id' => $serverId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load channels');
        }
    }
        public function show($channelId = null)
    {
        $this->requireAuth();

        if (!$channelId) {
            $input = $this->getInput();
            $channelId = $input['channel_id'] ?? null;
        }

        if (!$channelId) {
            return $this->validationError(['channel_id' => 'Channel ID is required']);
        }

        try {
            [$channel, $error] = $this->validateChannelAccess($channelId);
            if ($error) return $error;

            $this->logActivity('channel_viewed', ['channel_id' => $channelId]);

            return $this->success(['channel' => $channel]);
        } catch (Exception $e) {
            $this->logActivity('channel_view_error', [
                'channel_id' => $channelId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load channel');
        }
    }

    public function create()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, [
            'name' => 'required',
            'server_id' => 'required',
            'type' => 'required'
        ]);
        
        try {
            $accessCheck = $this->validateServerAccess($input['server_id'], true);
            if ($accessCheck) return $accessCheck;

            $channelData = [
                'name' => $input['name'],
                'server_id' => $input['server_id'],
                'type' => $input['type'],
                'description' => $input['description'] ?? null,
                'category_id' => $input['category_id'] ?? null,
                'created_by' => $this->getCurrentUserId(),
                'created_at' => date('Y-m-d H:i:s')
            ];

            $channel = $this->channelRepository->create($channelData);

            if ($channel) {
                $this->logActivity('channel_created', [
                    'channel_id' => $channel->id,
                    'server_id' => $input['server_id'],
                    'name' => $input['name']
                ]);

                return $this->success([
                    'message' => 'Channel created successfully',
                    'channel_id' => $channel->id
                ], 201);
            } else {
                return $this->serverError('Failed to create channel');
            }
        } catch (Exception $e) {
            $this->logActivity('channel_create_error', [
                'server_id' => $input['server_id'],
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to create channel');
        }
    }

    public function update()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, [
            'channel_id' => 'required'
        ]);

        $channelId = $input['channel_id'];
        try {
            [$channel, $error] = $this->validateChannelAccess($channelId, true);
            if ($error) return $error;
            
            $updated = false;
            if (isset($input['name'])) {
                $channel->name = $input['name'];
                $updated = true;
            }
            if (isset($input['description'])) {
                $channel->description = $input['description'];
                $updated = true;
            }
            if (isset($input['category_id'])) {
                $channel->category_id = $input['category_id'];
                $updated = true;
            }

            if ($updated) {
                $channel->updated_at = date('Y-m-d H:i:s');
                if ($this->channelRepository->update($channel->id, (array)$channel)) {
                    $this->logActivity('channel_updated', [
                        'channel_id' => $channelId,
                        'updates' => array_keys(array_filter([
                            'name' => isset($input['name']),
                            'description' => isset($input['description']),
                            'category_id' => isset($input['category_id'])
                        ]))
                    ]);

                    return $this->success(['message' => 'Channel updated successfully']);
                } else {
                    return $this->serverError('Failed to update channel');
                }
            }

            return $this->success(['message' => 'No changes to update']);
        } catch (Exception $e) {
            $this->logActivity('channel_update_error', [
                'channel_id' => $channelId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to update channel');
        }
    }

    public function delete()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $channelId = $input['channel_id'] ?? null;

        if (!$channelId) {
            return $this->validationError(['channel_id' => 'Channel ID is required']);
        }
        
        try {
            [$channel, $error] = $this->validateChannelAccess($channelId, true);
            if ($error) return $error;

            if ($this->channelRepository->delete($channelId)) {
                $this->logActivity('channel_deleted', [
                    'channel_id' => $channelId,
                    'server_id' => $channel->server_id
                ]);

                return $this->success(['message' => 'Channel deleted successfully']);
            } else {
                return $this->serverError('Failed to delete channel');
            }
        } catch (Exception $e) {
            $this->logActivity('channel_delete_error', [
                'channel_id' => $channelId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to delete channel');
        }
    }

    public function getMessages($channelId = null)
    {
        $this->requireAuth();

        if (!$channelId) {
            $input = $this->getInput();
            $channelId = $input['channel_id'] ?? null;
        }

        if (!$channelId) {
            return $this->validationError(['channel_id' => 'Channel ID is required']);
        }
        
        try {
            [$channel, $error] = $this->validateChannelAccess($channelId);
            if ($error) return $error;

            $limit = $_GET['limit'] ?? 50;
            $offset = $_GET['offset'] ?? 0;
            $messages = $this->channelMessageRepository->getMessagesByChannelId($channelId, $limit, $offset);

            $this->logActivity('channel_messages_viewed', [
                'channel_id' => $channelId,
                'message_count' => count($messages)
            ]);

            return $this->success([
                'messages' => $messages,
                'channel_id' => $channelId,
                'total' => count($messages),
                'has_more' => count($messages) >= $limit
            ]);
        } catch (Exception $e) {
            $this->logActivity('channel_messages_error', [
                'channel_id' => $channelId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load channel messages');
        }
    }

    public function sendMessage($channelId = null)
    {
        $this->requireAuth();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        if ($channelId) {
            $input['channel_id'] = $channelId;
        }

        $this->validate($input, [
            'channel_id' => 'required',
            'content' => 'required'
        ]);

        $targetId = $input['channel_id'];
        $content = trim($input['content']);
        $userId = $this->getCurrentUserId();
        $messageType = $input['message_type'] ?? 'text';
        $attachmentUrl = $input['attachment_url'] ?? null;
        $mentions = $input['mentions'] ?? [];
        $replyMessageId = $input['reply_message_id'] ?? null;

        try {
            $channel = $this->channelRepository->find($targetId);
            if (!$channel) {
                return $this->notFound('Channel not found');
            }

            if ($channel->server_id != 0) {
                $membership = $this->membershipRepository->findByUserAndServer($userId, $channel->server_id);
                if (!$membership) {
                    return $this->forbidden('You are not a member of this server');
                }
            }

            $query = new Query();
            $query->beginTransaction();
            
            $messageData = [
                'content' => $content,
                'user_id' => $userId,
                'message_type' => $messageType,
                'attachment_url' => $attachmentUrl,
                'sent_at' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            if ($replyMessageId) {
                $repliedMessage = $this->messageRepository->find($replyMessageId);
                if ($repliedMessage) {
                    $messageData['reply_message_id'] = $replyMessageId;
                }
            }

            $message = $this->messageRepository->create($messageData);

            if ($message && isset($message->id)) {
                $this->channelMessageRepository->addMessageToChannel($targetId, $message->id);
                
                require_once __DIR__ . '/../database/repositories/UserRepository.php';
                $userRepository = new UserRepository();
                $user = $userRepository->find($userId);
                
                $formattedMessage = [
                    'id' => $message->id,
                    'content' => $message->content,
                    'user_id' => $message->user_id,
                    'username' => $user ? $user->username : ($_SESSION['username'] ?? 'Unknown'),
                    'avatar_url' => $user && $user->avatar_url ? $user->avatar_url : '/public/assets/common/default-profile-picture.png',
                    'sent_at' => $message->sent_at,
                    'edited_at' => $message->edited_at,
                    'type' => $message->message_type ?? 'text',
                    'message_type' => $message->message_type ?? 'text',
                    'attachment_url' => $message->attachment_url,
                    'has_reactions' => false,
                    'reaction_count' => 0,
                    'reactions' => []
                ];
                
                if ($message->reply_message_id) {
                    $repliedMessage = $this->messageRepository->find($message->reply_message_id);
                    if ($repliedMessage) {
                        $repliedUser = $userRepository->find($repliedMessage->user_id);
                        $formattedMessage['reply_message_id'] = $message->reply_message_id;
                        $formattedMessage['reply_data'] = [
                            'message_id' => $message->reply_message_id,
                            'content' => $repliedMessage->content,
                            'user_id' => $repliedMessage->user_id,
                            'username' => $repliedUser ? $repliedUser->username : 'Unknown',
                            'avatar_url' => $repliedUser && $repliedUser->avatar_url ? $repliedUser->avatar_url : '/public/assets/common/default-profile-picture.png'
                        ];
                    }
                }

                if (!empty($mentions)) {
                    $formattedMessage['mentions'] = $mentions;
                }

                $query->commit();
                
                return $this->success([
                    'success' => true,
                    'data' => [
                        'message' => $formattedMessage,
                        'channel_id' => $targetId
                    ]
                ], 'Message sent successfully');
            } else {
                $query->rollback();
                throw new Exception('Failed to save message');
            }
        } catch (Exception $e) {
            if (isset($query)) {
                $query->rollback();
            }
            error_log('Channel message send error: ' . $e->getMessage());
            return $this->serverError('Failed to send message');
        }
    }

    public function createCategory()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, [
            'name' => 'required',
            'server_id' => 'required'
        ]);
        
        try {
            $accessCheck = $this->validateServerAccess($input['server_id'], true);
            if ($accessCheck) return $accessCheck;

            $categoryData = [
                'name' => $input['name'],
                'server_id' => $input['server_id'],
                'type' => 'category',
                'description' => $input['description'] ?? null,
                'created_by' => $this->getCurrentUserId(),
                'created_at' => date('Y-m-d H:i:s')
            ];
            $category = $this->channelRepository->create($categoryData);

            if ($category) {
                $this->logActivity('category_created', [
                    'category_id' => $category->id,
                    'server_id' => $input['server_id'],
                    'name' => $input['name']
                ]);

                return $this->success([
                    'message' => 'Category created successfully',
                    'category_id' => $category->id
                ], 201);
            } else {
                return $this->serverError('Failed to create category');
            }
        } catch (Exception $e) {
            $this->logActivity('category_create_error', [
                'server_id' => $input['server_id'],
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to create category');
        }
    }

    public function batchUpdatePositions()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, [
            'server_id' => 'required',
            'updates' => 'required'
        ]);
        
        try {
            $accessCheck = $this->validateServerAccess($input['server_id'], true);
            if ($accessCheck) return $accessCheck;

            $updates = $input['updates'];
            $successCount = 0;

            foreach ($updates as $update) {
                if (isset($update['id']) && isset($update['position'])) {
                    $channel = $this->channelRepository->find($update['id']);
                    if ($channel && $channel->server_id == $input['server_id']) {
                        $channel->position = $update['position'];
                        if ($channel->save()) {
                            $successCount++;
                        }
                    }
                }
            }

            $this->logActivity('positions_batch_updated', [
                'server_id' => $input['server_id'],
                'success_count' => $successCount,
                'total_updates' => count($updates)
            ]);

            return $this->success([
                'message' => 'Positions updated successfully',
                'updated_count' => $successCount
            ]);
        } catch (Exception $e) {
            $this->logActivity('positions_batch_update_error', [
                'server_id' => $input['server_id'],
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to update positions');
        }
    }

    public function updateChannelPosition()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, [
            'channel_id' => 'required',
            'position' => 'required'
        ]);
        try {
            $channel = $this->channelRepository->find($input['channel_id']);
            if (!$channel) {
                return $this->notFound('Channel not found');
            }

            if (!$this->membershipRepository->isOwner($this->getCurrentUserId(), $channel->server_id)) {
                return $this->forbidden('You do not have permission to update channel position');
            }

            $channel->position = $input['position'];
            if ($channel->save()) {
                $this->logActivity('channel_position_updated', [
                    'channel_id' => $input['channel_id'],
                    'new_position' => $input['position']
                ]);

                return $this->success(['message' => 'Channel position updated successfully']);
            } else {
                return $this->serverError('Failed to update channel position');
            }
        } catch (Exception $e) {
            $this->logActivity('channel_position_update_error', [
                'channel_id' => $input['channel_id'],
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to update channel position');
        }
    }

    public function updateCategoryPosition()
    {
        $this->requireAuth();

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, [
            'category_id' => 'required',
            'position' => 'required'
        ]);
        try {
            $category = $this->channelRepository->find($input['category_id']);
            if (!$category || $category->type !== 'category') {
                return $this->notFound('Category not found');
            }

            if (!$this->membershipRepository->isOwner($this->getCurrentUserId(), $category->server_id)) {
                return $this->forbidden('You do not have permission to update category position');
            }

            $category->position = $input['position'];
            if ($category->save()) {
                $this->logActivity('category_position_updated', [
                    'category_id' => $input['category_id'],
                    'new_position' => $input['position']
                ]);

                return $this->success(['message' => 'Category position updated successfully']);
            } else {
                return $this->serverError('Failed to update category position');
            }
        } catch (Exception $e) {
            $this->logActivity('category_position_update_error', [
                'category_id' => $input['category_id'],
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to update category position');
        }
    }

    public function getChannelParticipants($channelId = null)
    {
        $this->requireAuth();

        if (!$channelId) {
            $input = $this->getInput();
            $channelId = $input['channel_id'] ?? null;
        }

        if (!$channelId) {
            return $this->validationError(['channel_id' => 'Channel ID is required']);
        }
        try {
            $channel = $this->channelRepository->find($channelId);
            if (!$channel) {
                return $this->notFound('Channel not found');
            }

            if (!$this->membershipRepository->isMember($this->getCurrentUserId(), $channel->server_id)) {
                return $this->forbidden('You do not have access to this channel');
            }

            $participants = $this->membershipRepository->getServerMembers($channel->server_id);

            $this->logActivity('channel_participants_viewed', [
                'channel_id' => $channelId,
                'participant_count' => count($participants)
            ]);

            return $this->success([
                'participants' => $participants,
                'channel_id' => $channelId,
                'total' => count($participants)
            ]);
        } catch (Exception $e) {
            $this->logActivity('channel_participants_error', [
                'channel_id' => $channelId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load channel participants');
        }
    }

    public function getServerChannels($serverId)
    {
        $this->requireAuth();
        
        $currentUserId = $this->getCurrentUserId();
        
        try {
            if (!$this->membershipRepository->isMember($currentUserId, $serverId)) {
                if (function_exists('logger')) {
                    logger()->warning("User attempted to access server channels without membership", [
                        'user_id' => $currentUserId,
                        'server_id' => $serverId
                    ]);
                }
                return [
                    'activeChannelId' => null,
                    'channels' => [],
                    'categories' => []
                ];
            }

            $channels = $this->channelRepository->getByServerId($serverId);
            $categories = $this->categoryRepository->getForServer($serverId);
            
            $activeChannelId = $_GET['channel'] ?? null;
            
            if (!$activeChannelId && !empty($channels)) {
                $activeChannelId = $channels[0]['id'] ?? null;
            }
            
            $GLOBALS['serverChannels'] = $channels;
            $GLOBALS['serverCategories'] = $categories;
            $GLOBALS['activeChannelId'] = $activeChannelId;
            
            if (function_exists('logger')) {
                logger()->debug("Server channels loaded", [
                    'server_id' => $serverId,
                    'user_id' => $currentUserId,
                    'channel_count' => count($channels),
                    'category_count' => count($categories),
                    'active_channel_id' => $activeChannelId
                ]);
            }
            
            return [
                'activeChannelId' => $activeChannelId,
                'channels' => $channels,
                'categories' => $categories
            ];
            
        } catch (Exception $e) {
            if (function_exists('logger')) {
                logger()->error("Failed to get server channels", [
                    'server_id' => $serverId,
                    'user_id' => $currentUserId,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
            
            return [
                'activeChannelId' => null,
                'channels' => [],
                'categories' => []
            ];
        }
    }

    public function getChannelContent()
    {
        $this->requireAuth();
        
        $serverId = $_GET['server_id'] ?? null;
        $channelId = $_GET['channel_id'] ?? null;
        $type = $_GET['type'] ?? 'text';
        
        if (!$serverId || !$channelId) {
            return $this->validationError(['server_id' => 'Server ID required', 'channel_id' => 'Channel ID required']);
        }
        
        try {
            $currentUserId = $this->getCurrentUserId();
            
            if (!$this->membershipRepository->isMember($currentUserId, $serverId)) {
                return $this->forbidden('Access denied to server');
            }
            
            require_once __DIR__ . '/../database/repositories/ServerRepository.php';
            require_once __DIR__ . '/../database/repositories/CategoryRepository.php';
            require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
            
            $serverRepository = new ServerRepository();
            $categoryRepository = new CategoryRepository();
            $userServerMembershipRepository = new UserServerMembershipRepository();
            
            $server = $serverRepository->find($serverId);
            if (!$server) {
                return $this->notFound('Server not found');
            }
            
            $channel = $this->channelRepository->find($channelId);
            if (!$channel) {
                return $this->notFound('Channel not found');
            }
            
            if ($channel->server_id != $serverId) {
                return $this->forbidden('Channel not in specified server');
            }
            
            $channels = $this->channelRepository->getByServerId($serverId);
            $categories = $categoryRepository->getForServer($serverId);
            $serverMembers = $userServerMembershipRepository->getServerMembers($serverId);
            $channelMessages = [];
            
            if ($type === 'text') {
                try {
                    $channelMessages = $this->messageRepository->getForChannel($channelId, 50, 0);
                } catch (Exception $e) {
                    $channelMessages = [];
                }
            }
            
            $GLOBALS['server'] = $server;
            $GLOBALS['currentServer'] = $server;
            $GLOBALS['serverChannels'] = $channels;
            $GLOBALS['serverCategories'] = $categories;
            $GLOBALS['activeChannelId'] = $channelId;
            $GLOBALS['activeChannel'] = $channel;
            $GLOBALS['channelMessages'] = $channelMessages;
            $GLOBALS['serverMembers'] = $serverMembers;
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                if (isset($_GET['render_html']) && $_GET['render_html'] === 'true') {
                    ob_start();
                    
                    if ($type === 'voice') {
                        require_once __DIR__ . '/../views/components/app-sections/voice-section.php';
                    } else {
                        require_once __DIR__ . '/../views/components/app-sections/chat-section.php';
                    }
                    
                    $html = ob_get_clean();
                    
                    return $this->success([
                        'html' => $html,
                        'server' => [
                            'id' => $server->id,
                            'name' => $server->name
                        ],
                        'channel' => [
                            'id' => $channel->id,
                            'name' => $channel->name,
                            'type' => $channel->type
                        ],
                        'channels' => $channels,
                        'categories' => $categories,
                        'messages' => $channelMessages,
                        'members' => $serverMembers,
                        'activeChannelId' => $channelId,
                        'type' => $type
                    ]);
                }
                
                return $this->success([
                'channel' => [
                    'id' => $channel->id,
                    'name' => $channel->name,
                    'type' => $channel->type,
                    'description' => $channel->description,
                    'server_id' => $channel->server_id
                ],
                    'server' => [
                        'id' => $server->id,
                        'name' => $server->name
                    ],
                    'channels' => $channels,
                    'categories' => $categories,
                    'messages' => $channelMessages,
                    'members' => $serverMembers,
                    'activeChannelId' => $channelId,
                'server_id' => $serverId,
                    'channel_type' => $type,
                    'meeting_id' => $type === 'voice' ? 'voice_channel_' . $channelId : null,
                    'username' => $_SESSION['username'] ?? 'Anonymous'
                ]);
            }
            
            $this->logActivity('channel_content_api_accessed', [
                'channel_id' => $channelId,
                'server_id' => $serverId,
                'type' => $type
            ]);
            
            if ($type === 'voice') {
                require_once __DIR__ . '/../views/components/app-sections/voice-section.php';
            } else {
                require_once __DIR__ . '/../views/components/app-sections/chat-section.php';
            }
            
        } catch (Exception $e) {
            $this->logActivity('channel_content_api_error', [
                'channel_id' => $channelId,
                'server_id' => $serverId,
                'error' => $e->getMessage()
            ]);
            return $this->serverError('Failed to load channel content');
        }
    }
}