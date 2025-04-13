<?php

require_once __DIR__ . '/../query.php';

class ChannelMessage {
    // Define the table name
    protected static $table = 'channel_messages';
    
    // Store attributes
    protected $attributes = [];
    
    /**
     * Constructor - initialize model with attributes
     * 
     * @param array $attributes Initial attribute values
     */
    public function __construct($attributes = []) {
        $this->fill($attributes);
    }
    
    /**
     * Fill model with an array of attributes
     * 
     * @param array $attributes
     * @return $this
     */
    public function fill($attributes) {
        foreach ($attributes as $key => $value) {
            $this->attributes[$key] = $value;
        }
        
        return $this;
    }
    
    /**
     * Magic method for getting attributes
     * 
     * @param string $key
     * @return mixed
     */
    public function __get($key) {
        return $this->attributes[$key] ?? null;
    }
    
    /**
     * Magic method for setting attributes
     * 
     * @param string $key
     * @param mixed $value
     */
    public function __set($key, $value) {
        $this->attributes[$key] = $value;
    }
    
    /**
     * Find by channel_id and message_id combination
     * 
     * @param int $channelId
     * @param int $messageId
     * @return ChannelMessage|null
     */
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
    
    /**
     * Save the channel message association to the database
     * 
     * @return bool
     */
    public function save() {
        $query = new Query();
        
        // If has ID, update; otherwise insert
        if (isset($this->attributes['id'])) {
            $id = $this->attributes['id'];
            unset($this->attributes['id']);
            
            // Update
            $result = $query->table(static::$table)
                    ->where('id', $id)
                    ->update($this->attributes);
            
            // Restore the ID after update
            $this->attributes['id'] = $id;
            
            return $result > 0;
        } else {
            // Insert
            $this->attributes['id'] = $query->table(static::$table)
                    ->insert($this->attributes);
            
            return $this->attributes['id'] > 0;
        }
    }
    
    /**
     * Delete the channel message association
     * 
     * @return bool
     */
    public function delete() {
        $query = new Query();
        return $query->table(static::$table)
                ->where('id', $this->id)
                ->delete() > 0;
    }
    
    /**
     * Create a channel message association
     * 
     * @param int $channelId
     * @param int $messageId
     * @return bool
     */
    public static function create($channelId, $messageId) {
        $channelMessage = new static([
            'channel_id' => $channelId,
            'message_id' => $messageId
        ]);
        
        return $channelMessage->save();
    }
    
    /**
     * Get all messages for a specific channel
     * 
     * @param int $channelId
     * @return array
     */
    public static function getMessagesForChannel($channelId) {
        $query = new Query();
        return $query->table(static::$table)
            ->where('channel_id', $channelId)
            ->get();
    }
    
    /**
     * Ensure the table exists before any operations
     */
    public static function initialize() {
        return self::createTable();
    }
    
    /**
     * Create the channel_messages table if it doesn't exist
     * 
     * @return bool Whether the table exists after creation attempt
     */
    public static function createTable() {
        $query = new Query();
        return $query->tableExists(static::$table);
    }
}
