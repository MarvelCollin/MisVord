<?php

require_once __DIR__ . '/Model.php';

class ServerBadge extends Model {
    protected static $table = 'server_badges';
    protected $fillable = ['id', 'server_id', 'badge_id', 'acquired_at', 'created_at', 'updated_at'];
    
    public static function findByServerAndBadge($serverId, $badgeId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('server_id', $serverId)
            ->where('badge_id', $badgeId)
            ->first();
        return $result ? new static($result) : null;
    }
    
    public static function getForServer($serverId) {
        $query = new Query();
        $results = $query->table(static::$table . ' sb')
            ->join('badges b', 'sb.badge_id', '=', 'b.id')
            ->where('sb.server_id', $serverId)
            ->select('sb.*, b.name, b.description, b.icon_url, b.badge_type, b.is_rare')
            ->orderBy('sb.acquired_at', 'DESC')
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
}
