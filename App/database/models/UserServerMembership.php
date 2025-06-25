<?php

require_once __DIR__ . '/Model.php';

class UserServerMembership extends Model {
    protected static $table = 'user_server_memberships';
    protected $fillable = ['user_id', 'server_id', 'role', 'nickname', 'notification_settings', 'created_at', 'updated_at'];

    public static function findByUserAndServer($userId, $serverId) {
        $result = static::where('user_id', $userId)
            ->where('server_id', $serverId)
            ->first();
        return $result ? new static($result) : null;
    }

    public static function getUsersForServer($serverId, $includeBots = true) {
        $query = new Query();
        $queryBuilder = $query->table('user_server_memberships usm')
            ->join('users u', 'usm.user_id', '=', 'u.id')
            ->where('usm.server_id', $serverId);
        
        if (!$includeBots) {
            $queryBuilder->where('u.status', '!=', 'bot');
        }
        
        return $queryBuilder
            ->select('u.*, usm.created_at, usm.role')
            ->get();
    }

    public static function getServersForUser($userId) {
        $query = new Query();
        return $query->table('user_server_memberships usm')
            ->join('servers s', 'usm.server_id', '=', 's.id')
            ->where('usm.user_id', $userId)
            ->select('s.*, usm.created_at, usm.role')
            ->get();
    }

    public static function isMember($userId, $serverId) {
        $membership = static::findByUserAndServer($userId, $serverId);
        return $membership !== null;
    }

    public static function addMembership($userId, $serverId, $role = 'member') {
        $existingMembership = static::findByUserAndServer($userId, $serverId);
        if ($existingMembership) {
            return $existingMembership;
        }

        $membership = new static([
            'user_id' => $userId,
            'server_id' => $serverId,
            'role' => $role,
            'created_at' => date('Y-m-d H:i:s')
        ]);

        return $membership->save() ? $membership : null;
    }

    public static function removeMembership($userId, $serverId) {
        $membership = static::findByUserAndServer($userId, $serverId);
        return $membership ? $membership->delete() : false;
    }

    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('user_server_memberships');

            if (!$tableExists) {                $query->raw("
                    CREATE TABLE IF NOT EXISTS user_server_memberships (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        server_id INT NOT NULL,
                        role VARCHAR(50) DEFAULT 'member',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY unique_membership (user_id, server_id),
                        INDEX user_idx (user_id),
                        INDEX server_idx (server_id),
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
                    )
                ");

                $tableExists = $query->tableExists('user_server_memberships');
            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating user_server_memberships table: " . $e->getMessage());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }

    public static function getServerIdsForUser($userId) {
        $query = new Query();
        $results = $query->table('user_server_memberships')
            ->where('user_id', $userId)
            ->select('server_id')
            ->get();
        
        return array_column($results, 'server_id');
    }
}


