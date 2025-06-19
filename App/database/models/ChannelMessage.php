<?php

require_once __DIR__ . '/Model.php';

class ChannelMessage extends Model {
    protected static $table = 'channel_messages';
    protected $fillable = ['channel_id', 'message_id', 'created_at', 'updated_at'];
    
    public static function findByChannelId($channelId, $limit = null, $offset = null) {
        $query = new Query();
        $query->table(static::$table)->where('channel_id', $channelId);
        
        if ($limit !== null) {
            $query->limit($limit);
        }
        
        if ($offset !== null) {
            $query->offset($offset);
        }
        
        $results = $query->get();
        return array_map(function($data) { return new static($data); }, $results);
    }

    public static function findByMessageId($messageId) {
        $query = new Query();
        $result = $query->table(static::$table)->where('message_id', $messageId)->first();
        return $result ? new static($result) : null;
    }

    public static function getChannelMessages($channelId, $limit = 50, $offset = 0) {
        $query = new Query();
        return $query->table('channel_messages cm')
            ->join('messages m', 'cm.message_id', '=', 'm.id')
            ->join('users u', 'm.user_id', '=', 'u.id')
            ->where('cm.channel_id', $channelId)
            ->select('m.*, u.username, u.avatar_url, u.display_name')
            ->orderBy('m.created_at', 'DESC')
            ->limit($limit)
            ->offset($offset)
            ->get();
    }

    public static function getLatestMessages($channelId, $limit = 10) {
        return static::getChannelMessages($channelId, $limit, 0);
    }

    public static function countChannelMessages($channelId) {
        $query = new Query();
        return $query->table(static::$table)->where('channel_id', $channelId)->count();
    }

    public static function deleteByChannelId($channelId) {
        $query = new Query();
        return $query->table(static::$table)->where('channel_id', $channelId)->delete();
    }

    public static function deleteByMessageId($messageId) {
        $query = new Query();
        return $query->table(static::$table)->where('message_id', $messageId)->delete();
    }

    public function channel() {
        $query = new Query();
        $result = $query->table('channels')->where('id', $this->channel_id)->first();
        return $result;
    }

    public function message() {
        $query = new Query();
        $result = $query->table('messages')->where('id', $this->message_id)->first();
        return $result;
    }

    public static function exists($channelId, $messageId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('channel_id', $channelId)
            ->where('message_id', $messageId)
            ->first();
        return $result !== false;
    }

    public static function getMessagesByDateRange($channelId, $startDate, $endDate) {
        $query = new Query();
        return $query->table('channel_messages cm')
            ->join('messages m', 'cm.message_id', '=', 'm.id')
            ->where('cm.channel_id', $channelId)
            ->whereBetween('m.created_at', [$startDate, $endDate])
            ->select('m.*')
            ->orderBy('m.created_at', 'ASC')
            ->get();
    }

    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('channel_messages');

            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS channel_messages (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        channel_id INT NOT NULL,
                        message_id INT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY unique_channel_message (channel_id, message_id),
                        INDEX channel_id_idx (channel_id),
                        INDEX message_id_idx (message_id)
                    )
                ");

                $tableExists = $query->tableExists('channel_messages');
            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating channel_messages table: " . $e->getMessage());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }
}


