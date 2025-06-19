<?php

require_once __DIR__ . '/Model.php';

class UserRole extends Model {
    protected static $table = 'user_roles';
    protected $fillable = ['user_id', 'role_id', 'created_at', 'updated_at'];
    
    public static function findByUserAndRole($userId, $roleId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('role_id', $roleId)
            ->first();
        return $result ? new static($result) : null;
    }
    
    public static function getForUser($userId) {
        $query = new Query();
        $results = $query->table(static::$table)
            ->where('user_id', $userId)
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
    
    public static function getForRole($roleId) {
        $query = new Query();
        $results = $query->table(static::$table)
            ->where('role_id', $roleId)
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
}


