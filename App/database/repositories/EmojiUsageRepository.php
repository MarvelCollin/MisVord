<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/EmojiUsage.php';
require_once __DIR__ . '/../query.php';

class EmojiUsageRepository extends Repository {
    protected function getModelClass() {
        return EmojiUsage::class;
    }
    
    public function findByEmojiAndMessage($emojiId, $messageId) {
        return EmojiUsage::findByEmojiAndMessage($emojiId, $messageId);
    }
    
    public function findByUnicodeAndMessage($unicodeEmoji, $messageId) {
        return EmojiUsage::findByUnicodeAndMessage($unicodeEmoji, $messageId);
    }
    
    public function incrementUsage($id) {
        $usage = $this->find($id);
        if ($usage) {
            $usage->count++;
            return $usage->save();
        }
        return false;
    }
    
    public function decrementUsage($id) {
        $usage = $this->find($id);
        if ($usage) {
            $usage->count--;
            if ($usage->count <= 0) {
                return $usage->delete();
            }
            return $usage->save();
        }
        return false;
    }
    
    public function getEmojiReactionsForMessage($messageId) {
        $query = new Query();
        $serverEmojis = $query->table('emoji_usage eu')
            ->select('eu.*, se.name, se.image_url, se.is_animated, u.username, u.avatar_url')
            ->join('server_emojis se', 'eu.server_emoji_id', '=', 'se.id')
            ->join('users u', 'eu.user_id', '=', 'u.id')
            ->where('eu.message_id', $messageId)
            ->whereNotNull('eu.server_emoji_id')
            ->get();
            
        $unicodeEmojis = $query->table('emoji_usage eu')
            ->select('eu.*, u.username, u.avatar_url')
            ->join('users u', 'eu.user_id', '=', 'u.id')
            ->where('eu.message_id', $messageId)
            ->whereNotNull('eu.unicode_emoji')
            ->get();
            
        return [
            'server_emojis' => $serverEmojis,
            'unicode_emojis' => $unicodeEmojis
        ];
    }
    
    public function getUserTopEmojis($userId, $limit = 10) {
        $query = new Query();
        
        $serverEmojis = $query->table('emoji_usage eu')
            ->select('eu.server_emoji_id, SUM(eu.count) as total_usage, se.name, se.image_url, se.is_animated')
            ->join('server_emojis se', 'eu.server_emoji_id', '=', 'se.id')
            ->where('eu.user_id', $userId)
            ->whereNotNull('eu.server_emoji_id')
            ->groupBy('eu.server_emoji_id')
            ->orderBy('total_usage', 'DESC')
            ->limit($limit)
            ->get();
            
        $unicodeEmojis = $query->table('emoji_usage eu')
            ->select('eu.unicode_emoji, SUM(eu.count) as total_usage')
            ->where('eu.user_id', $userId)
            ->whereNotNull('eu.unicode_emoji')
            ->groupBy('eu.unicode_emoji')
            ->orderBy('total_usage', 'DESC')
            ->limit($limit)
            ->get();
            
        return [
            'server_emojis' => $serverEmojis,
            'unicode_emojis' => $unicodeEmojis
        ];
    }
} 
