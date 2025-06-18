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
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        if (!$this->userServerMembershipRepository->isMember($userId, $serverId)) {
            return $this->json(['error' => 'You are not a member of this server'], 403);
        }
        
        $emojis = $this->serverEmojiRepository->getForServer($serverId);
        return $this->json(['emojis' => $emojis]);
    }
    
    public function getTopServerEmojis($serverId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        if (!$this->userServerMembershipRepository->isMember($userId, $serverId)) {
            return $this->json(['error' => 'You are not a member of this server'], 403);
        }
        
        $topEmojis = $this->serverEmojiRepository->getTopEmojis($serverId);
        return $this->json(['top_emojis' => $topEmojis]);
    }
    
    public function createEmoji($serverId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $serverMembership = $this->userServerMembershipRepository->findByUserAndServer($userId, $serverId);
        
        if (!$serverMembership || ($serverMembership->role !== 'owner' && $serverMembership->role !== 'admin')) {
            return $this->json(['error' => 'Only server owners and admins can create emojis'], 403);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['name']) || empty($data['name'])) {
            return $this->json(['error' => 'Emoji name is required'], 400);
        }
        
        if (!isset($data['image_url']) || empty($data['image_url'])) {
            return $this->json(['error' => 'Emoji image URL is required'], 400);
        }
        
        $name = $data['name'];
        $imageUrl = $data['image_url'];
        $isAnimated = isset($data['is_animated']) ? (bool)$data['is_animated'] : false;
        
        $emoji = $this->serverEmojiRepository->createEmoji($serverId, $name, $imageUrl, $userId, $isAnimated);
        
        if (!$emoji) {
            return $this->json(['error' => 'Failed to create emoji'], 500);
        }
        
        return $this->json([
            'message' => 'Emoji created successfully',
            'emoji' => $emoji->toArray()
        ]);
    }
    
    public function updateEmoji($emojiId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $emoji = $this->serverEmojiRepository->find($emojiId);
        
        if (!$emoji) {
            return $this->json(['error' => 'Emoji not found'], 404);
        }
        
        $serverMembership = $this->userServerMembershipRepository->findByUserAndServer($userId, $emoji->server_id);
        
        if (!$serverMembership || ($serverMembership->role !== 'owner' && $serverMembership->role !== 'admin')) {
            return $this->json(['error' => 'Only server owners and admins can update emojis'], 403);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['name']) || empty($data['name'])) {
            return $this->json(['error' => 'Emoji name is required'], 400);
        }
        
        $name = $data['name'];
        $imageUrl = isset($data['image_url']) ? $data['image_url'] : null;
        
        $updated = $this->serverEmojiRepository->updateEmoji($emojiId, $name, $imageUrl);
        
        if (!$updated) {
            return $this->json(['error' => 'Failed to update emoji'], 500);
        }
        
        return $this->json([
            'message' => 'Emoji updated successfully',
            'emoji' => $updated->toArray()
        ]);
    }
    
    public function deleteEmoji($emojiId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $emoji = $this->serverEmojiRepository->find($emojiId);
        
        if (!$emoji) {
            return $this->json(['error' => 'Emoji not found'], 404);
        }
        
        $serverMembership = $this->userServerMembershipRepository->findByUserAndServer($userId, $emoji->server_id);
        
        if (!$serverMembership || ($serverMembership->role !== 'owner' && $serverMembership->role !== 'admin')) {
            return $this->json(['error' => 'Only server owners and admins can delete emojis'], 403);
        }
        
        $deleted = $this->serverEmojiRepository->delete($emojiId);
        
        if (!$deleted) {
            return $this->json(['error' => 'Failed to delete emoji'], 500);
        }
        
        return $this->json(['message' => 'Emoji deleted successfully']);
    }
    
    public function addEmojiReaction($messageId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['emoji_id']) && !isset($data['unicode_emoji'])) {
            return $this->json(['error' => 'Either emoji_id or unicode_emoji is required'], 400);
        }
        
        if (isset($data['emoji_id'])) {
            $emojiId = $data['emoji_id'];
            $emoji = $this->serverEmojiRepository->find($emojiId);
            
            if (!$emoji) {
                return $this->json(['error' => 'Emoji not found'], 404);
            }
            
            if (!$this->userServerMembershipRepository->isMember($userId, $emoji->server_id)) {
                return $this->json(['error' => 'You are not a member of this emoji\'s server'], 403);
            }
            
            $result = $this->serverEmojiRepository->recordEmojiUsage($emojiId, $userId, $messageId);
        } else {
            $unicodeEmoji = $data['unicode_emoji'];
            $result = $this->serverEmojiRepository->recordUnicodeEmojiUsage($unicodeEmoji, $userId, $messageId);
        }
        
        if (!$result) {
            return $this->json(['error' => 'Failed to add emoji reaction'], 500);
        }
        
        return $this->json(['message' => 'Emoji reaction added successfully']);
    }
    
    public function removeEmojiReaction($messageId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $data = $this->getRequestBody();
        
        if (!isset($data['emoji_id']) && !isset($data['unicode_emoji'])) {
            return $this->json(['error' => 'Either emoji_id or unicode_emoji is required'], 400);
        }
        
        if (isset($data['emoji_id'])) {
            $emojiId = $data['emoji_id'];
            $usage = $this->emojiUsageRepository->findByEmojiAndMessage($emojiId, $messageId);
            
            if (!$usage) {
                return $this->json(['error' => 'Emoji reaction not found'], 404);
            }
            
            $deleted = $this->emojiUsageRepository->decrementUsage($usage->id);
        } else {
            $unicodeEmoji = $data['unicode_emoji'];
            $usage = $this->emojiUsageRepository->findByUnicodeAndMessage($unicodeEmoji, $messageId);
            
            if (!$usage) {
                return $this->json(['error' => 'Emoji reaction not found'], 404);
            }
            
            $deleted = $this->emojiUsageRepository->decrementUsage($usage->id);
        }
        
        if (!$deleted) {
            return $this->json(['error' => 'Failed to remove emoji reaction'], 500);
        }
        
        return $this->json(['message' => 'Emoji reaction removed successfully']);
    }
    
    public function getMessageReactions($messageId) {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $reactions = $this->emojiUsageRepository->getEmojiReactionsForMessage($messageId);
        return $this->json(['reactions' => $reactions]);
    }
    
    public function getUserTopEmojis($userId = null) {
        $currentUserId = $this->getCurrentUserId();
        
        if (!$currentUserId) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }
        
        $targetUserId = $userId ?? $currentUserId;
        
        $topEmojis = $this->emojiUsageRepository->getUserTopEmojis($targetUserId);
        return $this->json(['top_emojis' => $topEmojis]);
    }
} 