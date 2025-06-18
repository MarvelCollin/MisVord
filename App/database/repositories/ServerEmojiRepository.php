<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/ServerEmoji.php';
require_once __DIR__ . '/../query.php';

class ServerEmojiRepository extends Repository {
    public function __construct() {
        parent::__construct(ServerEmoji::class);
    }
    
    public function getForServer($serverId) {
        return ServerEmoji::getForServer($serverId);
    }
    
    public function findByName($serverId, $name) {
        return ServerEmoji::findByName($serverId, $name);
    }
    
    public function createEmoji($serverId, $name, $imageUrl, $createdByUserId, $isAnimated = false) {
        return $this->create([
            'server_id' => $serverId,
            'name' => $name,
            'image_url' => $imageUrl,
            'is_animated' => $isAnimated ? 1 : 0,
            'created_by_user_id' => $createdByUserId
        ]);
    }
    
    public function updateEmoji($emojiId, $name, $imageUrl = null) {
        $data = ['name' => $name];
        
        if ($imageUrl !== null) {
            $data['image_url'] = $imageUrl;
        }
        
        return $this->update($emojiId, $data);
    }
    
    public function getTopEmojis($serverId, $limit = 10) {
        $query = new Query();
        return $query->table('server_emojis se')
            ->select('se.*, SUM(eu.count) as usage_count')
            ->leftJoin('emoji_usage eu', 'se.id', '=', 'eu.server_emoji_id')
            ->where('se.server_id', $serverId)
            ->groupBy('se.id')
            ->orderBy('usage_count', 'DESC')
            ->limit($limit)
            ->get();
    }
    
    public function recordEmojiUsage($emojiId, $userId, $messageId) {
        $query = new Query();
        
        $existing = $query->table('emoji_usage')
            ->where('server_emoji_id', $emojiId)
            ->where('user_id', $userId)
            ->where('message_id', $messageId)
            ->first();
            
        if ($existing) {
            return $query->table('emoji_usage')
                ->where('id', $existing['id'])
                ->update(['count' => $existing['count'] + 1]);
        }
        
        return $query->table('emoji_usage')->insert([
            'server_emoji_id' => $emojiId,
            'user_id' => $userId,
            'message_id' => $messageId,
            'count' => 1,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    public function recordUnicodeEmojiUsage($emoji, $userId, $messageId) {
        $query = new Query();
        
        $existing = $query->table('emoji_usage')
            ->where('unicode_emoji', $emoji)
            ->where('user_id', $userId)
            ->where('message_id', $messageId)
            ->first();
            
        if ($existing) {
            return $query->table('emoji_usage')
                ->where('id', $existing['id'])
                ->update(['count' => $existing['count'] + 1]);
        }
        
        return $query->table('emoji_usage')->insert([
            'unicode_emoji' => $emoji,
            'server_emoji_id' => null,
            'user_id' => $userId,
            'message_id' => $messageId,
            'count' => 1,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }
} 