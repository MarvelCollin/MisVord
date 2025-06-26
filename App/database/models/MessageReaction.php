<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../query.php';

class MessageReaction extends Model {
    protected static $table = 'message_reactions';
    protected $fillable = ['message_id', 'user_id', 'emoji', 'created_at', 'updated_at'];
    
    public static function findByMessageAndUser($messageId, $userId, $emoji) {
        $query = new Query();
        $result = $query->table(static::$table)
            ->where('message_id', $messageId)
            ->where('user_id', $userId)
            ->where('emoji', $emoji)
            ->first();
        return $result ? new static($result) : null;
    }
    
    public static function getForMessage($messageId) {
        $query = new Query();
        $results = $query->table(static::$table)
            ->where('message_id', $messageId)
            ->orderBy('created_at', 'ASC')
            ->get();
        return array_map(function($data) { return new static($data); }, $results);
    }
    
    public static function countForMessage($messageId) {
        $query = new Query();
        return $query->table(static::$table)
            ->where('message_id', $messageId)
            ->count();
    }
    
    public static function testConnection() {
        try {
            $query = new Query();
            $result = $query->table(static::$table)->limit(1)->get();
            return [
                'success' => true,
                'data' => $result,
                'table_exists' => !empty($result) || $query->tableExists(static::$table),
                'connection' => 'success'
            ];
        } catch (Exception $e) {
            return [
                'success' => false, 
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ];
        }
    }
    
    public static function getTableSchema() {
        try {
            $query = new Query();
            $db = $query->getConnection();
            $stmt = $db->prepare("DESCRIBE " . static::$table);
            $stmt->execute();
            return [
                'success' => true,
                'schema' => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}


