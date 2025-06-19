<?php

require_once __DIR__ . '/Model.php';

class Badge extends Model {
    protected static $table = 'badges';
    protected $fillable = ['name', 'description', 'icon_url', 'badge_type', 'is_rare', 'created_at', 'updated_at'];
    
    public static function findByType($type) {
        $query = new Query();
        $results = $query->table(static::$table)
            ->where('badge_type', $type)
            ->orderBy('name')
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
    
    public static function getRareBadges() {
        $query = new Query();
        $results = $query->table(static::$table)
            ->where('is_rare', true)
            ->orderBy('name')
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
}


