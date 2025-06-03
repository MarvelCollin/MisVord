<?php

require_once __DIR__ . '/../query.php';

class UserServerMembership {
    protected static $table = 'user_server_memberships';

    protected $attributes = [];

    public function __construct($attributes = []) {
        $this->fill($attributes);
    }

    public function fill($attributes) {
        foreach ($attributes as $key => $value) {
            $this->attributes[$key] = $value;
        }

        return $this;
    }

    public function __get($key) {
        return $this->attributes[$key] ?? null;
    }

    public function __set($key, $value) {
        $this->attributes[$key] = $value;
    }

    public static function findByUserAndServer($userId, $serverId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->first();

        if (!$result) {
            return null;
        }

        return new static($result);
    }

    public static function getServerMembers($serverId) {
        $query = new Query();
        $results = $query->table('users u')
            ->select('u.*, usm.role')
            ->join('user_server_memberships usm', 'u.id', '=', 'usm.user_id')
            ->where('usm.server_id', $serverId)
            ->orderBy('u.status = "online"', 'DESC')
            ->orderBy('u.status = "away"', 'DESC')
            ->orderBy('u.status = "dnd"', 'DESC')
            ->orderBy('u.username', 'ASC')
            ->get();

        return $results;
    }

    public static function getServerRoles($serverId) {
        $query = new Query();

        if ($query->tableExists('server_roles')) {
            $roles = $query->table('server_roles')
                ->where('server_id', $serverId)
                ->orderBy('position', 'DESC')
                ->get();

            return $roles;
        } else {

            error_log("Warning: server_roles table doesn't exist, returning empty array");
            return [];
        }
    }

    public static function getMemberCount($serverId) {
        $query = new Query();
        return $query->table(static::$table)
            ->where('server_id', $serverId)
            ->count();
    }

    public static function create($userId, $serverId, $role = 'member') {
        $membership = new static([
            'user_id' => $userId,
            'server_id' => $serverId,
            'role' => $role
        ]);

        $membership->save();
        return $membership;
    }

    public static function addOwner($userId, $serverId) {
        error_log("ADDING OWNER - UserID: $userId, ServerID: $serverId");
        try {
            $query = new Query();

            $existingMembership = $query->table('user_server_memberships')
                ->where('user_id', $userId)
                ->where('server_id', $serverId)
                ->first();

            if ($existingMembership) {
                error_log("User $userId is already a member of server $serverId, updating role to owner");

                $result = $query->table('user_server_memberships')
                    ->where('id', $existingMembership['id'])
                    ->update([
                        'role' => 'owner'
                    ]);

                error_log("Role update result: " . ($result ? 'Success' : 'Failed'));
                return true;
            }

            error_log("Creating new owner membership");
            $membershipId = $query->table('user_server_memberships')
                ->insert([
                    'user_id' => $userId,
                    'server_id' => $serverId,
                    'role' => 'owner'
                ]);

            if ($membershipId) {
                error_log("Owner membership created successfully with ID: $membershipId");
                return true;
            } else {
                error_log("Failed to create owner membership through Query, trying direct PDO");

                try {
                    $pdo = $query->getPdo();
                    $stmt = $pdo->prepare("
                        INSERT INTO user_server_memberships 
                        (user_id, server_id, role) 
                        VALUES (?, ?, 'owner')
                    ");
                    $success = $stmt->execute([$userId, $serverId]);
                    error_log("Direct PDO insert result: " . ($success ? 'Success' : 'Failed'));
                    return $success;
                } catch (Exception $e) {
                    error_log("Direct PDO insert also failed: " . $e->getMessage());
                    return false;
                }
            }
        } catch (Exception $e) {
            error_log("Error adding owner: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());

            try {
                error_log("Final attempt to add owner using raw SQL");
                $query = new Query();
                $pdo = $query->getPdo();

                $stmt = $pdo->prepare("SELECT id FROM user_server_memberships WHERE user_id = ? AND server_id = ?");
                $stmt->execute([$userId, $serverId]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($existing) {

                    $stmt = $pdo->prepare("UPDATE user_server_memberships SET role = 'owner' WHERE id = ?");
                    $stmt->execute([$existing['id']]);
                } else {

                    $stmt = $pdo->prepare("
                        INSERT INTO user_server_memberships 
                        (user_id, server_id, role) 
                        VALUES (?, ?, 'owner')
                    ");
                    $stmt->execute([$userId, $serverId]);
                }
                error_log("Final attempt completed");
                return true;
            } catch (Exception $e2) {
                error_log("All attempts failed: " . $e2->getMessage());
                throw $e; 
            }
        }
    }

    public function save() {
        $query = new Query();

        if (isset($this->attributes['id'])) {
            $id = $this->attributes['id'];
            unset($this->attributes['id']);

            if (isset($this->attributes['created_at'])) {
                unset($this->attributes['created_at']);
            }
            if (isset($this->attributes['updated_at'])) {
                unset($this->attributes['updated_at']);
            }

            $result = $query->table(static::$table)
                    ->where('id', $id)
                    ->update($this->attributes);

            $this->attributes['id'] = $id;

            return $result > 0;
        } else {
            if (isset($this->attributes['created_at'])) {
                unset($this->attributes['created_at']);
            }
            if (isset($this->attributes['updated_at'])) {
                unset($this->attributes['updated_at']);
            }

            $this->attributes['id'] = $query->table(static::$table)
                    ->insert($this->attributes);

            return $this->attributes['id'] > 0;
        }
    }

    public static function createTable() {
        $query = new Query();

        try {            
            $tableExists = $query->tableExists('user_server_memberships');

            if (!$tableExists) {

                $usersExists = $query->tableExists('users');
                $serversExists = $query->tableExists('servers');

                if (!$usersExists) {

                    require_once __DIR__ . '/User.php';
                    User::createTable();
                }

                if (!$serversExists) {

                    require_once __DIR__ . '/Server.php';
                    Server::createTable();
                }

                try {
                    $query->raw("
                        CREATE TABLE IF NOT EXISTS user_server_memberships (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            server_id INT NOT NULL,
                            role VARCHAR(255) DEFAULT 'member',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
                            UNIQUE KEY unique_user_server (user_id, server_id)
                        )
                    ");                } catch (PDOException $e) {

                    if (strpos($e->getMessage(), 'foreign key constraint') !== false) {

                        $query->raw("
                            CREATE TABLE IF NOT EXISTS user_server_memberships (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                user_id INT NOT NULL,
                                server_id INT NOT NULL,
                                role VARCHAR(255) DEFAULT 'member',
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                UNIQUE KEY unique_user_server (user_id, server_id)
                            )
                        ");
                    } else {
                        throw $e; 
                    }
                }

                $tableExists = $query->tableExists('user_server_memberships');

            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating user_server_memberships table: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }

    public static function delete($userId, $serverId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->delete();

        return $result > 0;
    }

    public static function isMember($userId, $serverId) {
        $query = new Query();
        return $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->exists();
    }

    public static function updateRole($userId, $serverId, $role) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->update(['role' => $role]);

        return $result > 0;
    }

    public static function isOwner($userId, $serverId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->where('role', 'owner')
            ->exists();

        return $result;
    }
}