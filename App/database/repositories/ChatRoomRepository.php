<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/ChatRoom.php';
require_once __DIR__ . '/../models/ChatParticipant.php';
require_once __DIR__ . '/../models/ChatRoomMessage.php';
require_once __DIR__ . '/../query.php';

class ChatRoomRepository extends Repository {
    protected function getModelClass() {
        return ChatRoom::class;
    }
    
    public function findDirectMessageRoom($userId1, $userId2) {
        $query = new Query();
        
        $result = $query->table('chat_rooms cr')
            ->join('chat_participants cp1', 'cr.id', '=', 'cp1.chat_room_id')
            ->join('chat_participants cp2', 'cr.id', '=', 'cp2.chat_room_id')
            ->where('cr.type', 'direct')
            ->where('cp1.user_id', $userId1)
            ->where('cp2.user_id', $userId2)
            ->whereRaw('cp1.user_id != cp2.user_id')
            ->select('cr.*')
            ->first();
            
        return $result ? new ChatRoom($result) : null;
    }
    
    public function createDirectMessageRoom($userId1, $userId2) {
        $existing = $this->findDirectMessageRoom($userId1, $userId2);
        if ($existing) {
            return $existing;
        }
        
        $query = new Query();
        
        try {
            $query->beginTransaction();
            
            $roomId = $query->table('chat_rooms')->insert([
                'name' => null,
                'type' => 'direct',
                'image_url' => null,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            
            if ($roomId) {
                $query->table('chat_participants')->insert([
                    'chat_room_id' => $roomId,
                    'user_id' => $userId1,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
                
                $query->table('chat_participants')->insert([
                    'chat_room_id' => $roomId,
                    'user_id' => $userId2,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
                
                $query->commit();
                return $this->find($roomId);
            } else {
                $query->rollback();
                return null;
            }
        } catch (Exception $e) {
            $query->rollback();
            error_log('Error creating direct message room: ' . $e->getMessage());
            return null;
        }
    }
    
    public function getUserDirectRooms($userId) {
        $query = new Query();
        
        $results = $query->table('chat_rooms cr')
            ->join('chat_participants cp', 'cr.id', '=', 'cp.chat_room_id')
            ->join('chat_participants cp2', 'cr.id', '=', 'cp2.chat_room_id')
            ->join('users u', 'cp2.user_id', '=', 'u.id')
            ->where('cr.type', 'direct')
            ->where('cp.user_id', $userId)
            ->where('cp2.user_id', '!=', $userId)
            ->select('cr.*, u.username as other_username, u.avatar_url as other_avatar, u.id as other_user_id')
            ->orderBy('cr.updated_at', 'DESC')
            ->get();
            
        return $results;
    }
      public function getRoomMessages($roomId, $limit = 50, $offset = 0) {
        $query = new Query();
        
        error_log("Getting messages for DM room $roomId with limit $limit and offset $offset");
        
        $results = $query->table('messages m')
            ->join('chat_room_messages crm', 'm.id', '=', 'crm.message_id')
            ->join('users u', 'm.user_id', '=', 'u.id')
            ->where('crm.room_id', $roomId)
            ->select('m.*, u.username, u.avatar_url')
            ->orderBy('m.sent_at', 'DESC')
            ->limit($limit)
            ->offset($offset)
            ->get();
        
        error_log("Found " . count($results) . " messages for DM room $roomId");
        
        return array_reverse($results);
    }
    
    public function addMessageToRoom($roomId, $messageId) {
        $query = new Query();
        
        $result = $query->table('chat_room_messages')->insert([
            'room_id' => $roomId,
            'message_id' => $messageId,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        if ($result) {
            $query->table('chat_rooms')
                ->where('id', $roomId)
                ->update(['updated_at' => date('Y-m-d H:i:s')]);
        }
        
        return $result;
    }
    
    public function isParticipant($roomId, $userId) {
        $query = new Query();
        
        $result = $query->table('chat_participants')
            ->where('chat_room_id', $roomId)
            ->where('user_id', $userId)
            ->first();
            
        return $result !== null;
    }

    public function getMessages($roomId, $limit = 50, $offset = 0) {
        return $this->getRoomMessages($roomId, $limit, $offset);
    }

    public function getParticipants($roomId) {
        $query = new Query();
        
        return $query->table('chat_participants cp')
            ->join('users u', 'cp.user_id', '=', 'u.id')
            ->where('cp.chat_room_id', $roomId)
            ->select('cp.*, u.username, u.avatar_url')
            ->get();
    }

    public function getUserDirectMessages($userId) {
        return $this->getUserDirectRooms($userId);
    }
}
