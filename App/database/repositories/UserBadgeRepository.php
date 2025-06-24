<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/UserBadge.php';
require_once __DIR__ . '/../models/Badge.php';
require_once __DIR__ . '/../query.php';

class UserBadgeRepository extends Repository {
    protected function getModelClass() {
        return UserBadge::class;
    }
    
    public function findByUserAndBadge($userId, $badgeId) {
        return UserBadge::findByUserAndBadge($userId, $badgeId);
    }
    
    public function getForUser($userId) {
        $query = new Query();
        $results = $query->table('user_badges ub')
            ->join('badges b', 'ub.badge_id', '=', 'b.id')
            ->where('ub.user_id', $userId)
            ->select('b.id, b.name, b.description, b.icon_url, b.badge_type, b.is_rare, ub.acquired_at')
            ->orderBy('ub.acquired_at', 'DESC')
            ->get();
            
        return $results;
    }
    
    public function addBadgeToUser($userId, $badgeId) {
        
        $existingBadge = $this->findByUserAndBadge($userId, $badgeId);
        
        if ($existingBadge) {
            
            return false;
        }
        
        
        return $this->create([
            'user_id' => $userId,
            'badge_id' => $badgeId,
            'acquired_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    public function removeBadgeFromUser($userId, $badgeId) {
        $userBadge = $this->findByUserAndBadge($userId, $badgeId);
        
        if (!$userBadge) {
            
            return false;
        }
        
        return $userBadge->delete();
    }
} 