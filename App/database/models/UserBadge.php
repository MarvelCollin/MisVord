<?php

require_once __DIR__ . '/Model.php';

class UserBadge extends Model {
    protected static $table = 'user_badges';
    protected $fillable = ['user_id', 'badge_id', 'acquired_at', 'created_at', 'updated_at'];
    
    public static function findByUserAndBadge($userId, $badgeId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('badge_id', $badgeId)
            ->first();
        return $result ? new static($result) : null;
    }
    
    public static function getForUser($userId) {
        $query = new Query();
        $results = $query->table(static::$table . ' ub')
            ->join('badges b', 'ub.badge_id', '=', 'b.id')
            ->where('ub.user_id', $userId)
            ->select('ub.*, b.name, b.description, b.icon_url, b.badge_type, b.is_rare')
            ->orderBy('ub.acquired_at', 'DESC')
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
}


