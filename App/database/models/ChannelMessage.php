<?php

require_once __DIR__ . '/../query.php';

class ChannelMessage {
    protected static $table = 'channel_messages';

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

    public static function findByChannelAndMessage($channelId, $messageId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('channel_id', $channelId)
            ->where('message_id', $messageId)
            ->first();

        if (!$result) {
            return null;
        }

        return new static($result);
    }

    public function save() {
        $query = new Query();

        if (isset($this->attributes['id'])) {
            $id = $this->attributes['id'];
            unset($this->attributes['id']);

            $result = $query->table(static::$table)
                    ->where('id', $id)
                    ->update($this->attributes);

            $this->attributes['id'] = $id;

            return $result > 0;
        } else {
            $this->attributes['id'] = $query->table(static::$table)
                    ->insert($this->attributes);

            return $this->attributes['id'] > 0;
        }
    }

    public function delete() {
        $query = new Query();
        return $query->table(static::$table)
                ->where('id', $this->id)
                ->delete() > 0;
    }

    public static function create($channelId, $messageId) {
        $channelMessage = new static([
            'channel_id' => $channelId,
            'message_id' => $messageId
        ]);

        return $channelMessage->save();
    }

    public static function getMessagesForChannel($channelId) {
        $query = new Query();
        return $query->table(static::$table)
            ->where('channel_id', $channelId)
            ->get();
    }

    public static function initialize() {
        return self::createTable();
    }

    public static function createTable() {
        $query = new Query();
        return $query->tableExists(static::$table);
    }
}