<?php

require_once __DIR__ . '/../query.php';

class Category {
    // Define the table name
    protected static $table = 'categories';
    
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
     * Find category by ID
     * 
     * @param int $id
     * @return Category|null
     */
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
    
    /**
     * Get categories for a server
     * 
     * @param int $serverId
     * @return array
     */
    public static function getForServer($serverId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('server_id', $serverId)
            ->orderBy('position')
            ->get();
            
        return $result;
    }
    
    /**
     * Get max position for a server
     * 
     * @param int $serverId
     * @return int
     */
    public static function getMaxPositionForServer($serverId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->select('MAX(position) as max_position')
            ->where('server_id', $serverId)
            ->first();
            
        return $result ? (int)$result['max_position'] : 0;
    }
    
    /**
     * Get channels in this category
     * 
     * @return array
     */
    public function channels() {
        require_once __DIR__ . '/Channel.php';
        return Channel::getForCategory($this->id);
    }
    
    /**
     * Save the category to the database
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
     * Delete the category
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
     * Create the categories table if it doesn't exist
     * 
     * @return bool Whether the table exists after creation attempt
     */
    public static function createTable() {
        $query = new Query();
        
        try {
            // Check if table exists first
            $tableExists = $query->tableExists('categories');
            
            if (!$tableExists) {
                // Execute table creation query
                $query->raw("
                    CREATE TABLE IF NOT EXISTS categories (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        server_id INT NOT NULL,
                        position INT NOT NULL DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX server_idx (server_id),
                        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
                    )
                ");
                
                // Check again if table exists after creation attempt
                $tableExists = $query->tableExists('categories');
            }
            
            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating categories table: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Ensure the table exists before any operations
     */
    public static function initialize() {
        return self::createTable();
    }
}
