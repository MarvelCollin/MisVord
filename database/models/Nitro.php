<?php

require_once __DIR__ . '/Model.php';

class Nitro extends Model {
    protected static $table = 'nitro';
    protected $fillable = ['id', 'user_id', 'code', 'created_at', 'updated_at'];
    
    public static function findByCode($code) {
        $query = new Query();
        $result = $query->table(static::$table)->where('code', $code)->first();
        return $result ? new static($result) : null;
    }
    
    public static function findByUserId($userId) {
        $query = new Query();
        $results = $query->table(static::$table)->where('user_id', $userId)->get();
        
        $nitros = [];
        foreach ($results as $result) {
            $nitros[] = new static($result);
        }
        
        return $nitros;
    }
    
    public static function findUnusedByCode($code) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('code', $code)
            ->whereNull('user_id')
            ->first();
        return $result ? new static($result) : null;
    }
    
    public function markAsUsed($userId) {
        $this->user_id = $userId;
        return $this->save();
    }
    
    public static function generateUniqueCode($length = 16) {
        $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $code = '';
        
        do {
            $code = '';
            for ($i = 0; $i < $length; $i++) {
                $code .= $characters[rand(0, $charactersLength - 1)];
            }
            
            $exists = self::findByCode($code);
        } while ($exists);
        
        return $code;
    }
    
    public static function createTable() {
        $query = new Query();
        
        try {
            $tableExists = $query->tableExists('nitro');
            
            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS nitro (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NULL,
                        code VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY unique_code (code),
                        INDEX user_idx (user_id),
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                    )
                ");
                
                $tableExists = $query->tableExists('nitro');
            }
            
            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating nitro table: " . $e->getMessage());
            return false;
        }
    }
    
    public static function initialize() {
        return self::createTable();
    }
}
