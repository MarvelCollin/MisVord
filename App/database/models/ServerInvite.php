<?php

require_once __DIR__ . '/Model.php';

class ServerInvite extends Model {
    protected static $table = 'server_invites';
    protected $fillable = ['server_id', 'inviter_user_id', 'target_user_id', 'invite_link', 'created_at', 'updated_at'];

    public static function findByCode($code) {
        $result = static::where('invite_code', $code)->first();
        return $result ? new static($result) : null;
    }

    public static function findActiveByCode($code) {
        $query = static::where('invite_code', $code);
        
        $query->where(function($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', date('Y-m-d H:i:s'));
        });
        
        $query->where(function($q) {
            $q->whereNull('max_uses')
              ->orWhereRaw('uses < max_uses');
        });
        
        $result = $query->first();
        return $result ? new static($result) : null;
    }

    public function isValid() {
        if ($this->expires_at && strtotime($this->expires_at) < time()) {
            return false;
        }
        
        if ($this->max_uses && $this->uses >= $this->max_uses) {
            return false;
        }
        
        return true;
    }

    public function incrementUses() {
        $this->uses = ($this->uses ?? 0) + 1;
        return $this->save();
    }

    public static function generateCode() {
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        $charactersLength = strlen($characters);
        $randomString = '';
        
        for ($i = 0; $i < 8; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        
        return $randomString;
    }

    public static function createTable() {
        $query = new Query();

        try {
            $tableExists = $query->tableExists('server_invites');

            if (!$tableExists) {
                $query->raw("
                    CREATE TABLE IF NOT EXISTS server_invites (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        server_id INT NOT NULL,
                        created_by INT NOT NULL,
                        invite_code VARCHAR(255) UNIQUE NOT NULL,
                        expires_at TIMESTAMP NULL,
                        max_uses INT NULL,
                        uses INT DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX server_idx (server_id),
                        INDEX code_idx (invite_code),
                        INDEX creator_idx (created_by),
                        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
                        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
                    )
                ");

                $tableExists = $query->tableExists('server_invites');
            }

            return $tableExists;
        } catch (PDOException $e) {
            error_log("Error creating server_invites table: " . $e->getMessage());
            return false;
        }
    }

    public static function initialize() {
        return self::createTable();
    }
}


