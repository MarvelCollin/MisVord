<?php

require_once __DIR__ . '/Model.php';

class EmojiUsage extends Model {
    protected static $table = 'emoji_usage';
    protected $fillable = ['server_emoji_id', 'unicode_emoji', 'user_id', 'message_id', 'count', 'created_at', 'updated_at'];
    
    public static function findByEmojiAndMessage($emojiId, $messageId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('server_emoji_id', $emojiId)
            ->where('message_id', $messageId)
            ->first();
        return $result ? new static($result) : null;
    }
    
    public static function findByUnicodeAndMessage($unicodeEmoji, $messageId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('unicode_emoji', $unicodeEmoji)
            ->where('message_id', $messageId)
            ->first();
        return $result ? new static($result) : null;
    }
    
    public function serverEmoji() {
        if (!$this->server_emoji_id) {
            return null;
        }
        require_once __DIR__ . '/ServerEmoji.php';
        return ServerEmoji::find($this->server_emoji_id);
    }
    
    public function user() {
        require_once __DIR__ . '/User.php';
        return User::find($this->user_id);
    }
    
    public function message() {
        require_once __DIR__ . '/Message.php';
        return Message::find($this->message_id);
    }
    
    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('emoji_usage');

            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS emoji_usage (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        server_emoji_id INT NULL,
                        unicode_emoji VARCHAR(255) NULL,
                        user_id INT NOT NULL,
                        message_id INT NOT NULL,
                        count INT NOT NULL DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (server_emoji_id) REFERENCES server_emojis(id) ON DELETE SET NULL,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
                        INDEX emoji_message_idx (server_emoji_id, message_id),
                        INDEX unicode_message_idx (unicode_emoji(191), message_id),
                        INDEX user_idx (user_id)
                    )
                ");

                $tableExists = $query->tableExists('emoji_usage');
            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating emoji_usage table: " . $e->getMessage());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }
} 


