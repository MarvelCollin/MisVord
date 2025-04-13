<?php

require_once __DIR__ . '/../query.php';

class User {
    // Define the table name
    protected static $table = 'users';
    
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
     * Find user by email
     * 
     * @param string $email
     * @return User|null
     */
    public static function findByEmail($email) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('email', $email)
            ->first();
            
        if (!$result) {
            return null;
        }
        
        return new static($result);
    }
      /**
     * Find user by username
     * 
     * @param string $username
     * @return User|null
     */
    public static function findByUsername($username) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('username', $username)
            ->first();
            
        if (!$result) {
            return null;
        }
        
        return new static($result);
    }
    
    /**
     * Find user by Google ID
     * 
     * @param string $googleId
     * @return User|null
     */
    public static function findByGoogleId($googleId) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('google_id', $googleId)
            ->first();
            
        if (!$result) {
            return null;
        }
        
        return new static($result);
    }
    
    /**
     * Find user by ID
     * 
     * @param int $id
     * @return User|null
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
     * Verify password
     * 
     * @param string $password
     * @return bool
     */
    public function verifyPassword($password) {
        return password_verify($password, $this->password);
    }
    
    /**
     * Set password with hashing
     * 
     * @param string $password
     */
    public function setPassword($password) {
        $this->attributes['password'] = password_hash($password, PASSWORD_DEFAULT);
    }
    
    /**
     * Get user's servers
     * 
     * @return array
     */
    public function servers() {
        $query = new Query();
        return $query->table('servers s')
                ->select('s.*')
                ->join('user_server_memberships usm', 's.id', '=', 'usm.server_id')
                ->where('usm.user_id', $this->id)
                ->get();
    }
      /**
     * Get user's roles
     * 
     * @return array
     */
    public function roles() {
        $query = new Query();
        return $query->table('roles r')
                ->select('r.*')
                ->join('user_roles ur', 'r.id', '=', 'ur.role_id')
                ->where('ur.user_id', $this->id)
                ->get();
    }
    
    /**
     * Get user's friends
     * 
     * @return array
     */
    public function friends() {
        $query = new Query();
        
        // First get the base query with the user table
        $result = $query->table('users u')
                ->select('u.*')
                ->join('friend_list fl', 'u.id', '=', 'fl.user_id2')
                ->where('fl.user_id', $this->id)
                ->where('fl.status', 'accepted')
                ->get();
                
        // Get the second set of friends (where user_id2 contains the current user's id)
        $query2 = new Query();
        $result2 = $query2->table('users u')
                ->select('u.*')
                ->join('friend_list fl', 'u.id', '=', 'fl.user_id')
                ->where('fl.user_id2', $this->id)
                ->where('fl.status', 'accepted')
                ->get();
                
        // Combine the results
        return array_merge($result, $result2);
    }
    
    /**
     * Save the user to the database
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
     * Create the users table if it doesn't exist
     * 
     * @return bool Whether the table exists after creation attempt
     */
    public static function createTable() {
        $query = new Query();
        
        try {
            // Use the Query class methods instead of direct PDO access
            // Check if table exists first
            $tableExists = $query->tableExists('users');
            
            if (!$tableExists) {
                // Execute table creation query using the raw method
                $query->raw("
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        username VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL UNIQUE,
                        password VARCHAR(255),
                        google_id VARCHAR(255) NULL,
                        avatar_url VARCHAR(255) NULL,
                        status ENUM('online', 'away', 'offline', 'dnd') DEFAULT 'offline',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ");
                
                // Check again if table exists after creation attempt
                $tableExists = $query->tableExists('users');
            }
            
            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating users table: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Ensure the table exists before any operations
     */
    public static function initialize() {
        return self::createTable();
    }
    
    /**
     * Get all users
     * 
     * @return array
     */
    public static function all() {
        $query = new Query();
        $results = $query->table(static::$table)->get();
        
        $users = [];
        foreach ($results as $result) {
            $users[] = new static($result);
        }
        
        return $users;
    }
}
