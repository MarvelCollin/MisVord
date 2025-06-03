<?php

require_once __DIR__ . '/../query.php';

class Channel {
    public static $table = 'channels';

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

    public static function find($id) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('id', $id)
            ->first();

        if (!$result) {
            return null;
        }

        return new static($result);
    }

    public static function getByServerId($serverId) {
        $query = new Query();

        try {
            $channels = $query->table(static::$table)
                ->where('server_id', $serverId)
                ->orderBy('position', 'ASC')
                ->orderBy('id', 'ASC')
                ->get();

            foreach ($channels as &$channel) {

                if (isset($channel['type'])) {
                    $type = $channel['type'];

                    if (!isset($channel['type_name'])) {
                        if ($type === 'voice' || $type == 2) {
                            $channel['type_name'] = 'voice';
                        } elseif ($type === 'text' || $type == 1) {
                            $channel['type_name'] = 'text';
                        } elseif ($type === 'category' || $type == 3) {
                            $channel['type_name'] = 'category';
                        } elseif ($type === 'announcement' || $type == 4) {
                            $channel['type_name'] = 'announcement';
                        } elseif ($type === 'forum' || $type == 5) {
                            $channel['type_name'] = 'forum';
                        } else {

                            $channel['type_name'] = 'text';
                        }
                    }
                } else {

                    $channel['type'] = 1;
                    $channel['type_name'] = 'text';
                }
            }

            return $channels;
        } catch (Exception $e) {
            error_log("Channel::getByServerId error: " . $e->getMessage());
            return [];
        }
    }

    public static function findByNameAndServer($name, $serverId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('name', $name)
            ->where('server_id', $serverId)
            ->first();

        if (!$result) {
            return null;
        }

        return new static($result);
    }

    public static function getForServer($serverId) {
        $query = new Query();
        return $query->table(static::$table)
                ->where('server_id', $serverId)
                ->orderBy('position')
                ->get();
    }

    public static function getForCategory($categoryId) {
        $query = new Query();
        return $query->table(static::$table)
                ->where('category_id', $categoryId)
                ->orderBy('position')
                ->get();
    }

    public function save() {
        $query = new Query();

        try {
            error_log("Channel save() called with attributes: " . json_encode($this->attributes));

            if (isset($this->attributes['type']) && !is_numeric($this->attributes['type'])) {
                $typeValue = strtolower($this->attributes['type']);

                $this->attributes['type'] = $typeValue;

                error_log("Using string type value: {$typeValue}");
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

            if (!isset($this->attributes['created_at'])) {
                $this->attributes['created_at'] = date('Y-m-d H:i:s');
            }

            $this->attributes['updated_at'] = date('Y-m-d H:i:s');

            if (isset($this->attributes['id'])) {
                $id = $this->attributes['id'];
                unset($this->attributes['id']);

                error_log("Updating channel with ID: $id and attributes: " . json_encode($this->attributes));

                try {
                    $result = $query->table(static::$table)
                            ->where('id', $id)
                            ->update($this->attributes);

                    $this->attributes['id'] = $id;

                    error_log("Update result: $result rows affected");

                    return $result >= 0; 
                } catch (PDOException $e) {
                    error_log("PDO Exception in Channel::save() update: " . $e->getMessage());
                    error_log("SQL State: " . $e->getCode());
                    throw $e; 
                }
            } else {

                error_log("Inserting new channel with attributes: " . json_encode($this->attributes));

                try {
                    $this->attributes['id'] = $query->table(static::$table)
                            ->insert($this->attributes);

                    error_log("Insert result: New ID = {$this->attributes['id']}");

                    if (!$this->attributes['id']) {
                        error_log("Insert failed - no ID returned");
                        return false;
                    }

                    return $this->attributes['id'] > 0;
                } catch (PDOException $e) {
                    error_log("PDO Exception in Channel::save() insert: " . $e->getMessage());
                    error_log("SQL State: " . $e->getCode());
                    throw $e; 
                }
            }
        } catch (Exception $e) {
            error_log("Error in Channel::save(): " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());

            if ($e instanceof PDOException) {
                error_log("PDO Error Code: " . $e->getCode());
                error_log("SQL State: " . $e->errorInfo[0] ?? 'N/A');
                error_log("Driver Error Code: " . $e->errorInfo[1] ?? 'N/A');
                error_log("Driver Error Message: " . $e->errorInfo[2] ?? 'N/A');
            }

            throw $e; 
        }
    }

    public function delete() {
        $query = new Query();
        return $query->table(static::$table)
                ->where('id', $this->id)
                ->delete() > 0;
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
        error_log("Fetching channels for server ID: $serverId");

        try {

            $channel_types_exists = $query->tableExists('channel_types');

            if ($channel_types_exists) {

                $channels = $query->table('channels c')
                    ->select('c.*, t.name as type_name')
                    ->join('channel_types t', 'c.type', '=', 't.id')
                    ->where('c.server_id', $serverId)
                    ->get();
            } else {

                $channels = $query->table('channels c')
                    ->select('c.*, c.type as type_name')
                    ->where('c.server_id', $serverId)
                    ->orderBy('c.position')
                    ->get();

                error_log("Using direct type field instead of channel_types join");
            }

            foreach ($channels as &$channel) {
                if (isset($channel['type'])) {

                    $channel['type'] = intval($channel['type']);
                }
            }

            error_log("Found " . count($channels) . " channels for server ID: $serverId");
            return $channels;
        } catch (Exception $e) {
            error_log("Error fetching channels: " . $e->getMessage());
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
            error_log("Error getting minimal channels for server: " . $e->getMessage());
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