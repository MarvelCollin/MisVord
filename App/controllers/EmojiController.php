<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/ServerEmojiRepository.php';
require_once __DIR__ . '/../database/repositories/EmojiUsageRepository.php';
require_once __DIR__ . '/../database/repositories/ServerRepository.php';
require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
require_once __DIR__ . '/../utils/AppLogger.php';

class EmojiController extends BaseController {
    private $serverEmojiRepository;
    private $emojiUsageRepository;
    private $serverRepository;
    private $userServerMembershipRepository;
    
    public function __construct() {
        parent::__construct();
        $this->serverEmojiRepository = new ServerEmojiRepository();
        $this->emojiUsageRepository = new EmojiUsageRepository();
        $this->serverRepository = new ServerRepository();
        $this->userServerMembershipRepository = new UserServerMembershipRepository();
    }
    
    public function getServerEmojis($serverId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            if (!$this->userServerMembershipRepository->isMember($userId, $serverId)) {
                return $this->forbidden('You are not a member of this server');
            }
            
            $emojis = $this->serverEmojiRepository->getForServer($serverId);
            return $this->success($emojis, 'Server emojis retrieved successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving server emojis: ' . $e->getMessage());
        }
    }
    
    public function getTopServerEmojis($serverId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            if (!$this->userServerMembershipRepository->isMember($userId, $serverId)) {
                return $this->forbidden('You are not a member of this server');
            }
            
            $topEmojis = $this->serverEmojiRepository->getTopEmojis($serverId);
            return $this->success($topEmojis, 'Top server emojis retrieved successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving top server emojis: ' . $e->getMessage());
        }
    }
    
    public function createEmoji($serverId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            $serverMembership = $this->userServerMembershipRepository->findByUserAndServer($userId, $serverId);
            
            if (!$serverMembership || ($serverMembership->role !== 'owner' && $serverMembership->role !== 'admin')) {
                return $this->forbidden('Only server owners and admins can create emojis');
            }
            
            $this->validate($input, [
                'name' => 'required',
                'image_url' => 'required'
            ]);
            
            $name = $input['name'];
            $imageUrl = $input['image_url'];
            $isAnimated = isset($input['is_animated']) ? (bool)$input['is_animated'] : false;
            
            $emoji = $this->serverEmojiRepository->createEmoji($serverId, $name, $imageUrl, $userId, $isAnimated);
            
            if (!$emoji) {
                return $this->serverError('Failed to create emoji');
            }
            
            $this->broadcastViaSocket('emoji-created', [
                'emoji' => $emoji->toArray(),
                'server_id' => $serverId
            ], 'server-' . $serverId);
            
            $this->logActivity('emoji_created', [
                'emoji_id' => $emoji->id,
                'emoji_name' => $emoji->name,
                'server_id' => $serverId
            ]);
            
            return $this->success($emoji->toArray(), 'Emoji created successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while creating the emoji: ' . $e->getMessage());
        }
    }
    
    public function updateEmoji($emojiId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            $emoji = $this->serverEmojiRepository->find($emojiId);
            
            if (!$emoji) {
                return $this->notFound('Emoji not found');
            }
            
            $serverMembership = $this->userServerMembershipRepository->findByUserAndServer($userId, $emoji->server_id);
            
            if (!$serverMembership || ($serverMembership->role !== 'owner' && $serverMembership->role !== 'admin')) {
                return $this->forbidden('Only server owners and admins can update emojis');
            }
            
            $this->validate($input, [
                'name' => 'required'
            ]);
            
            $name = $input['name'];
            $imageUrl = isset($input['image_url']) ? $input['image_url'] : null;
            
            $updated = $this->serverEmojiRepository->updateEmoji($emojiId, $name, $imageUrl);
            
            if (!$updated) {
                return $this->serverError('Failed to update emoji');
            }
            
            $this->broadcastViaSocket('emoji-updated', [
                'emoji' => $updated->toArray(),
                'server_id' => $emoji->server_id
            ], 'server-' . $emoji->server_id);
            
            $this->logActivity('emoji_updated', [
                'emoji_id' => $emojiId,
                'emoji_name' => $name,
                'server_id' => $emoji->server_id
            ]);
            
            return $this->success($updated->toArray(), 'Emoji updated successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while updating the emoji: ' . $e->getMessage());
        }
    }
    
    public function deleteEmoji($emojiId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $emoji = $this->serverEmojiRepository->find($emojiId);
            
            if (!$emoji) {
                return $this->notFound('Emoji not found');
            }
            
            $serverMembership = $this->userServerMembershipRepository->findByUserAndServer($userId, $emoji->server_id);
            
            if (!$serverMembership || ($serverMembership->role !== 'owner' && $serverMembership->role !== 'admin')) {
                return $this->forbidden('Only server owners and admins can delete emojis');
            }
            
            $emojiData = $emoji->toArray();
            $serverId = $emoji->server_id;
            
            $deleted = $this->serverEmojiRepository->delete($emojiId);
            
            if (!$deleted) {
                return $this->serverError('Failed to delete emoji');
            }
            
            $this->broadcastViaSocket('emoji-deleted', [
                'emoji_id' => $emojiId,
                'server_id' => $serverId,
                'emoji_data' => $emojiData
            ], 'server-' . $serverId);
            
            $this->logActivity('emoji_deleted', [
                'emoji_id' => $emojiId,
                'emoji_name' => $emoji->name,
                'server_id' => $serverId
            ]);
            
            return $this->success(null, 'Emoji deleted successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while deleting the emoji: ' . $e->getMessage());
        }
    }
    
    public function addEmojiReaction($messageId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            if (!isset($input['emoji_id']) && !isset($input['unicode_emoji'])) {
                return $this->error('Either emoji_id or unicode_emoji is required', 400);
            }
            
            $result = null;
            $emojiData = null;
            $channelId = null;
            
            if (isset($input['emoji_id'])) {
                $emojiId = $input['emoji_id'];
                $emoji = $this->serverEmojiRepository->find($emojiId);
                
                if (!$emoji) {
                    return $this->notFound('Emoji not found');
                }
                
                if (!$this->userServerMembershipRepository->isMember($userId, $emoji->server_id)) {
                    return $this->forbidden('You are not a member of this emoji\'s server');
                }
                
                $emojiData = $emoji->toArray();
                $result = $this->serverEmojiRepository->recordEmojiUsage($emojiId, $userId, $messageId);
                
                if (isset($input['channel_id'])) {
                    $channelId = $input['channel_id'];
                }
            } else {
                $unicodeEmoji = $input['unicode_emoji'];
                $emojiData = ['unicode_emoji' => $unicodeEmoji];
                $result = $this->serverEmojiRepository->recordUnicodeEmojiUsage($unicodeEmoji, $userId, $messageId);
                
                if (isset($input['channel_id'])) {
                    $channelId = $input['channel_id'];
                }
            }
            
            if (!$result) {
                return $this->serverError('Failed to add emoji reaction');
            }
            
            if ($channelId) {
                $this->broadcastViaSocket('reaction-added', [
                    'message_id' => $messageId,
                    'user_id' => $userId,
                    'emoji_data' => $emojiData,
                    'channel_id' => $channelId
                ], 'channel-' . $channelId);
            }
            
            $this->logActivity('emoji_reaction_added', [
                'message_id' => $messageId,
                'emoji_data' => $emojiData
            ]);
            
            return $this->success(['result' => $result], 'Emoji reaction added successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while adding the emoji reaction: ' . $e->getMessage());
        }
    }
    
    public function removeEmojiReaction($messageId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            if (!isset($input['emoji_id']) && !isset($input['unicode_emoji'])) {
                return $this->error('Either emoji_id or unicode_emoji is required', 400);
            }
            
            $usage = null;
            $emojiData = null;
            $channelId = null;
            
            if (isset($input['emoji_id'])) {
                $emojiId = $input['emoji_id'];
                $usage = $this->emojiUsageRepository->findByEmojiAndMessage($emojiId, $messageId);
                
                if (!$usage) {
                    return $this->notFound('Emoji reaction not found');
                }
                
                $emoji = $this->serverEmojiRepository->find($emojiId);
                $emojiData = $emoji ? $emoji->toArray() : ['id' => $emojiId];
                
                if (isset($input['channel_id'])) {
                    $channelId = $input['channel_id'];
                }
            } else {
                $unicodeEmoji = $input['unicode_emoji'];
                $usage = $this->emojiUsageRepository->findByUnicodeAndMessage($unicodeEmoji, $messageId);
                
                if (!$usage) {
                    return $this->notFound('Emoji reaction not found');
                }
                
                $emojiData = ['unicode_emoji' => $unicodeEmoji];
                
                if (isset($input['channel_id'])) {
                    $channelId = $input['channel_id'];
                }
            }
            
            $deleted = $this->emojiUsageRepository->decrementUsage($usage->id);
            
            if (!$deleted) {
                return $this->serverError('Failed to remove emoji reaction');
            }
            
            if ($channelId) {
                $this->broadcastViaSocket('reaction-removed', [
                    'message_id' => $messageId,
                    'user_id' => $userId,
                    'emoji_data' => $emojiData,
                    'channel_id' => $channelId
                ], 'channel-' . $channelId);
            }
            
            $this->logActivity('emoji_reaction_removed', [
                'message_id' => $messageId,
                'emoji_data' => $emojiData
            ]);
            
            return $this->success(null, 'Emoji reaction removed successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while removing the emoji reaction: ' . $e->getMessage());
        }
    }
    
    public function getMessageReactions($messageId) {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $reactions = $this->emojiUsageRepository->getEmojiReactionsForMessage($messageId);
            return $this->success($reactions, 'Message reactions retrieved successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving message reactions: ' . $e->getMessage());
        }
    }
    
    public function getUserTopEmojis($userId = null) {
        $this->requireAuth();
        
        $currentUserId = $this->getCurrentUserId();
        $targetUserId = $userId ?? $currentUserId;
        
        try {
            $topEmojis = $this->emojiUsageRepository->getUserTopEmojis($targetUserId);
            return $this->success($topEmojis, 'User top emojis retrieved successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving user top emojis: ' . $e->getMessage());
        }
    }
} 