<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../utils/AppLogger.php';

class Channel extends Model {
    protected static $table = 'channels';
    protected $fillable = ['id', 'name', 'type', 'description', 'server_id', 'category_id', 'parent_id', 'position', 'is_private', 'slug', 'created_at', 'updated_at'];
    
    public static function getByServerId($serverId) {
        try {
            $channels = static::where('server_id', $serverId)
                ->orderBy('position', 'ASC')
                ->orderBy('id', 'ASC')
                ->get();

            foreach ($channels as &$channel) {
                $channel['type'] = $channel['type'] ?? 'text';
                $channel['type_name'] = $channel['type'];
            }

            return $channels;
        } catch (Exception $e) {
            log_error("Channel::getByServerId error", ['message' => $e->getMessage()]);
            return [];
        }
    }

    public static function findByNameAndServer($name, $serverId) {
        $result = static::where('name', $name)
            ->where('server_id', $serverId)
            ->first();
        return $result ? new static($result) : null;
    }

    public static function getForServer($serverId) {
        return static::where('server_id', $serverId)->orderBy('position')->get();
    }

    public static function getForCategory($categoryId) {
        return static::where('category_id', $categoryId)->orderBy('position')->get();
    }

    public function save() {
        try {
            if (isset($this->attributes['type'])) {
                $type = $this->attributes['type'];
                if (is_string($type)) {
                    $this->attributes['type'] = match(strtolower($type)) {
                        'text' => 1,
                        'voice' => 2,
                        'category' => 3,
                        'announcement' => 4,
                        'forum' => 5,
                        default => 1
                    };
                } else {
                    $this->attributes['type'] = (int)$type;
                }
            }

            foreach (['position', 'category_id', 'parent_id'] as $field) {
                if (isset($this->attributes[$field])) {
                    if ($this->attributes[$field] === '' || $this->attributes[$field] === null) {
                        $this->attributes[$field] = null;
                    } else if (is_numeric($this->attributes[$field])) {
                        $this->attributes[$field] = intval($this->attributes[$field]);
                    }
                }
            }

            if (isset($this->attributes['is_private'])) {
                $this->attributes['is_private'] = $this->attributes['is_private'] ? 1 : 0;
            }

            return parent::save();
        } catch (Exception $e) {
            log_error("Error in Channel::save()", ['message' => $e->getMessage()]);
            return false;
        }
    }

    public function messages($limit = 50, $offset = 0) {
        $query = new Query();
        return $query->table('messages m')
                ->select('m.*, u.username, u.avatar_url')
                ->join('channel_messages cm', 'm.id', '=', 'cm.message_id')
                ->join('users u', 'm.user_id', '=', 'u.id')
                ->where('cm.channel_id', $this->id)
                ->orderBy('m.sent_at', 'DESC')
                ->limit($limit)
                ->offset($offset)
                ->get();
    }

    public static function createTable() {
        $query = new Query();

        try {

            $channelTypesExists = $query->tableExists('channel_types');
            if (!$channelTypesExists) {
                error_log("channel_types table doesn't exist, creating it");
                $query->raw("
                    CREATE TABLE IF NOT EXISTS channel_types (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(50) NOT NULL,
                        description TEXT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ");

                $types = [
                    ['name' => 'text', 'description' => 'Text channel for messages'],
                    ['name' => 'voice', 'description' => 'Voice chat channel'],
                    ['name' => 'category', 'description' => 'Category to group channels'],
                    ['name' => 'announcement', 'description' => 'Announcements channel']
                ];

                foreach ($types as $type) {
                    $query->table('channel_types')->insert($type);
                    error_log("Added channel type: " . $type['name']);
                }

                error_log("channel_types table created and populated");
            }

            $tableExists = $query->tableExists(static::$table);

            if (!$tableExists) {

                $categoriesExists = $query->tableExists('categories');

                if (!$categoriesExists) {

                    error_log("Categories table doesn't exist, creating it first");
                    $query->raw("
                        CREATE TABLE IF NOT EXISTS categories (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            server_id INT NOT NULL,
                            position INT NOT NULL DEFAULT 0,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
                        )
                    ");
                }

                try {
                    $query->raw("
                        CREATE TABLE IF NOT EXISTS " . static::$table . " (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            type INT NOT NULL DEFAULT 1,
                            description TEXT NULL,
                            server_id INT NOT NULL,
                            category_id INT NULL,
                            parent_id INT NULL,
                            position INT NOT NULL DEFAULT 0,
                            is_private TINYINT(1) NOT NULL DEFAULT 0,
                            slug VARCHAR(255) NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
                            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                            FOREIGN KEY (parent_id) REFERENCES channels(id) ON DELETE SET NULL,
                            FOREIGN KEY (type) REFERENCES channel_types(id) ON DELETE RESTRICT
                        )
                    ");
                } catch (PDOException $e) {

                    error_log("Error creating channels table with all constraints: " . $e->getMessage());
                    error_log("Creating channels table with minimal constraints");
                    $query->raw("
                        CREATE TABLE IF NOT EXISTS " . static::$table . " (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            type INT NOT NULL DEFAULT 1,
                            description TEXT NULL,
                            server_id INT NOT NULL,
                            category_id INT NULL,
                            parent_id INT NULL,
                            position INT NOT NULL DEFAULT 0,
                            is_private TINYINT(1) NOT NULL DEFAULT 0,
                            slug VARCHAR(255) NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
                        )
                    ");
                }

                $tableExists = $query->tableExists(static::$table);
            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating channels table: " . $e->getMessage());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }

    public static function all() {
        $query = new Query();
        return $query->table(static::$table)->get();
    }

    public static function getServerChannels($serverId) {
        $query = new Query();
        try {
            $channels = $query->table('channels c')
                ->select('c.*')
                ->where('c.server_id', $serverId)
                ->orderBy('c.position')
                ->get();

            foreach ($channels as &$channel) {
                $type = $channel['type'] ?? 1;
                $channel['type_name'] = match($type) {
                    2 => 'voice',
                    3 => 'category',
                    4 => 'announcement',
                    5 => 'forum',
                    default => 'text'
                };
                $channel['type'] = $channel['type_name'];
            }

            return $channels;
        } catch (Exception $e) {
            log_error("Error fetching channels: " . $e->getMessage());
            return [];
        }
    }

    public static function getChannelMessages($channelId, $limit = 50) {
        $query = new Query();
        $messages = $query->table('messages m')
            ->select('m.*, u.username, u.avatar, u.status')
            ->join('users u', 'm.user_id', '=', 'u.id')
            ->where('m.channel_id', $channelId)
            ->orderBy('m.timestamp', 'DESC')
            ->limit($limit)
            ->get();

        return array_reverse($messages);
    }

    public static function getServerChannelsMinimal($serverId) {
        $query = new Query();
        try {
            return $query->table(self::$table)
                ->select('id, name, type, category_id, is_private, server_id')
                ->where('server_id', $serverId)
                ->orderBy('name', 'ASC')
                ->get();
        } catch (Exception $e) {
            log_error("Error getting minimal channels for server: " . $e->getMessage());
            return [];
        }
    }

    public function participants() {

        try {
            $query = new Query();
            $serverId = $this->server_id;
            $members = [];
            $roles = [];

            if ($query->tableExists('server_members')) {
                $members = $query->table('server_members sm')
                    ->select('sm.*, u.username, u.avatar, u.status')
                    ->join('users u', 'sm.user_id', '=', 'u.id')
                    ->where('sm.server_id', $serverId)
                    ->get();
            } else {
                error_log("Warning: server_members table doesn't exist, using fallback");

                $members = $query->table('user_server_memberships usm')
                    ->select('usm.*, u.username, u.avatar, u.status')
                    ->join('users u', 'usm.user_id', '=', 'u.id')
                    ->where('usm.server_id', $serverId)
                    ->get();
            }

            if ($query->tableExists('server_roles')) {
                $roles = $query->table('server_roles')
                    ->where('server_id', $serverId)
                    ->get();
            } else {
                error_log("Warning: server_roles table doesn't exist, returning empty roles array");
                $roles = [];
            }

            return [
                'members' => $members,
                'roles' => $roles
            ];
        } catch (Exception $e) {
            error_log("Error getting channel participants: " . $e->getMessage());
            return [
                'members' => [],
                'roles' => []
            ];
        }
    }
}


