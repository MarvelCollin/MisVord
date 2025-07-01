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
    private $serverRepository;

    public function __construct()
    {
        parent::__construct();
        $this->channelRepository = new ChannelRepository();
        $this->messageRepository = new MessageRepository();
        $this->channelMessageRepository = new ChannelMessageRepository();
        $this->membershipRepository = new UserServerMembershipRepository();
        $this->categoryRepository = new CategoryRepository();
        $this->serverRepository = new ServerRepository();
    }

    private function validateServerAccess($serverId, $requireOwner = false)
    {
        $userId = $this->getCurrentUserId();
        
        if ($requireOwner) {
            $membership = $this->membershipRepository->findByUserAndServer($userId, $serverId);
            if (!$membership || ($membership->role !== 'owner' && $membership->role !== 'admin')) {
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
            return $this->success(['channels' => $channels, 'server_id' => $serverId]);
        } catch (Exception $e) {
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

            return $this->success(['channel' => $channel]);
        } catch (Exception $e) {
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

            $channel = $this->channelRepository->createWithPosition($channelData);

            if ($channel) {
                return $this->success(['message' => 'Channel created successfully', 'channel_id' => $channel->id], 201);
            } else {
                return $this->serverError('Failed to create channel');
            }
        } catch (Exception $e) {
            return $this->serverError('Failed to create channel');
        }
    }

    public function update()
    {
        $this->requireAuth();
        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, ['channel_id' => 'required']);
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
                    return $this->success(['message' => 'Channel updated successfully']);
                } else {
                    return $this->serverError('Failed to update channel');
                }
            }

            return $this->success(['message' => 'No changes to update']);
        } catch (Exception $e) {
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
                return $this->success(['message' => 'Channel deleted successfully']);
            } else {
                return $this->serverError('Failed to delete channel');
            }
        } catch (Exception $e) {
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

            return $this->success([
                'messages' => $messages,
                'channel_id' => $channelId,
                'total' => count($messages),
                'has_more' => count($messages) >= $limit
            ]);
        } catch (Exception $e) {
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

            require_once __DIR__ . '/../database/repositories/CategoryRepository.php';
            $categoryRepository = new CategoryRepository();

            $categoryData = [
                'name' => $input['name'],
                'server_id' => $input['server_id'],
                'created_at' => date('Y-m-d H:i:s')
            ];

            $category = $categoryRepository->createWithPosition($categoryData);

            if ($category) {
                return $this->success([
                    'message' => 'Category created successfully',
                    'category_id' => $category->id
                ], 201);
            } else {
                return $this->serverError('Failed to create category');
            }
        } catch (Exception $e) {
            return $this->serverError('Failed to create category');
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

            $formattedParticipants = array_map(function($participant) {
                return [
                    'user_id' => $participant['id'],
                    'username' => $participant['username'],
                    'avatar_url' => $participant['avatar_url'] ?? '/public/assets/common/default-profile-picture.png',
                    'display_name' => $participant['display_name'] ?? $participant['username'],
                    'role' => $participant['role'] ?? 'member'
                ];
            }, $participants);

            return $this->success([
                'data' => $formattedParticipants,
                'participants' => $participants,
                'channel_id' => $channelId,
                'total' => count($participants)
            ]);
        } catch (Exception $e) {
            return $this->serverError('Failed to load channel participants');
        }
    }

    public function getMembers($channelId = null)
    {
        return $this->getChannelParticipants($channelId);
    }

    public function getServerChannels($serverId)
    {
        $this->requireAuth();
        $currentUserId = $this->getCurrentUserId();
        
        try {
            if (!$this->membershipRepository->isMember($currentUserId, $serverId)) {
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
            
            return [
                'activeChannelId' => $activeChannelId,
                'channels' => $channels,
                'categories' => $categories
            ];
            
        } catch (Exception $e) {
            return [
                'activeChannelId' => null,
                'channels' => [],
                'categories' => []
            ];
        }
    }

    public function switchToChannel()
    {
        $this->requireAuth();
        
        $input = $this->getInput();
        $channelId = $input['channel_id'] ?? null;
        $forceFresh = $input['force_fresh'] ?? false;
        $timestamp = $input['timestamp'] ?? null;
        
        if (!$channelId) {
            return $this->validationError(['channel_id' => 'Channel ID is required']);
        }

        try {
            [$channel, $error] = $this->validateChannelAccess($channelId);
            if ($error) return $error;

            $serverId = $channel->server_id;
            $server = $this->serverRepository->find($serverId);
            
            $limit = $input['limit'] ?? 50;
            $offset = $input['offset'] ?? 0;
            $before = $input['before'] ?? null;
            
            if ($forceFresh || $timestamp) {
                $offset = 0;
                $before = null;
            }
            
            $messages = $this->messageRepository->getForChannel($channelId, $limit, $offset, $before);
            
            foreach ($messages as &$message) {
                $message = $this->formatMessage($message);
            }
            
            return $this->success([
                'channel' => [
                    'id' => $channel->id,
                    'name' => $channel->name,
                    'type' => $channel->type,
                    'description' => $channel->description,
                    'server_id' => $channel->server_id,
                    'category_id' => $channel->category_id,
                    'is_private' => $channel->is_private
                ],
                'server' => $server ? [
                    'id' => $server->id,
                    'name' => $server->name
                ] : null,
                'messages' => $messages,
                'message_count' => count($messages),
                'has_more' => count($messages) >= $limit,
                'timestamp' => time()
            ]);
        } catch (Exception $e) {
            return $this->serverError('Failed to switch to channel: ' . $e->getMessage());
        }
    }
}