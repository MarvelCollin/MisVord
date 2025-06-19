<?php

require_once __DIR__ . '/Model.php';

class Server extends Model {
    protected static $table = 'servers';
    protected $fillable = ['name', 'image_url', 'description', 'invite_link', 'group_server_id', 'is_public', 'banner_url', 'category', 'created_at', 'updated_at'];
    
    public static function findByInviteLink($inviteLink) {
        $query = new Query();
        $result = $query->table(static::$table)->where('invite_link', $inviteLink)->first();
        return $result ? new static($result) : null;
    }

    public static function findPublicServers() {
        $query = new Query();
        $results = $query->table(static::$table)->where('is_public', true)->get();
        return array_map(function($data) { return new static($data); }, $results);
    }

    public static function findByCategory($category) {
        $query = new Query();
        $results = $query->table(static::$table)->where('category', $category)->get();
        return array_map(function($data) { return new static($data); }, $results);
    }

    public function members() {
        $query = new Query();
        return $query->table('users u')
            ->join('user_server_memberships usm', 'u.id', '=', 'usm.user_id')
            ->where('usm.server_id', $this->id)
            ->select('u.*')
            ->get();
    }

    public function channels() {
        $query = new Query();
        return $query->table('channels')->where('server_id', $this->id)->get();
    }

    public function categories() {
        $query = new Query();
        return $query->table('categories')->where('server_id', $this->id)->get();
    }

    public function invites() {
        $query = new Query();
        return $query->table('server_invites')->where('server_id', $this->id)->get();
    }

    public function isMember($userId) {
        $query = new Query();
        $result = $query->table('user_server_memberships')
            ->where('user_id', $userId)
            ->where('server_id', $this->id)
            ->first();
        return $result !== false;
    }

    public function addMember($userId) {
        $query = new Query();
        return $query->table('user_server_memberships')->insert([
            'user_id' => $userId,
            'server_id' => $this->id,
            'created_at' => date('Y-m-d H:i:s')
        ]);
    }

    public function removeMember($userId) {
        $query = new Query();
        return $query->table('user_server_memberships')
            ->where('user_id', $userId)
            ->where('server_id', $this->id)
            ->delete();
    }

    public function getMemberCount() {
        $query = new Query();
        return $query->table('user_server_memberships')->where('server_id', $this->id)->count();
    }

    public function generateInviteLink() {
        $inviteCode = bin2hex(random_bytes(8));
        $this->invite_link = $inviteCode;
        return $inviteCode;
    }

    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('servers');

            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS servers (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        image_url VARCHAR(255),
                        description TEXT,
                        invite_link VARCHAR(255),
                        group_server_id INT,
                        is_public BOOLEAN DEFAULT FALSE,
                        banner_url VARCHAR(255),
                        category VARCHAR(255),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX name_idx (name),
                        INDEX invite_link_idx (invite_link),
                        INDEX is_public_idx (is_public),
                        INDEX category_idx (category)
                    )
                ");

                $tableExists = $query->tableExists('servers');
            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating servers table: " . $e->getMessage());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }

    public function getOwner() {
        $query = new Query();
        $result = $query->table('users u')
            ->join('user_server_memberships usm', 'u.id', '=', 'usm.user_id')
            ->where('usm.server_id', $this->id)
            ->where('usm.role', 'owner')
            ->select('u.*')
            ->first();
        return $result ? new User($result) : null;
    }

    public function getOwnerId() {
        $query = new Query();
        $result = $query->table('user_server_memberships')
            ->where('server_id', $this->id)
            ->where('role', 'owner')
            ->select('user_id')
            ->first();
        return $result ? $result['user_id'] : null;
    }

    public function isOwner($userId) {
        $query = new Query();
        $result = $query->table('user_server_memberships')
            ->where('server_id', $this->id)
            ->where('user_id', $userId)
            ->where('role', 'owner')
            ->first();
        return $result !== null;
    }

    public function setOwner($userId) {
        $query = new Query();
        return $query->table('user_server_memberships')
            ->where('server_id', $this->id)
            ->where('user_id', $userId)
            ->update(['role' => 'owner']);
    }
}


