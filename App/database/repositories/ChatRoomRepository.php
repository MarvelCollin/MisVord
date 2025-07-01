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
            ->select('cr.*, u.username as other_username, u.display_name as other_display_name, u.avatar_url as other_avatar, u.id as other_user_id')
            ->orderBy('cr.updated_at', 'DESC')
            ->get();
            
        return $results;
    }

    public function getUserChatRooms($userId) {
        $directRooms = [];
        $groupRooms = [];
        
        $query1 = new Query();
        $directRooms = $query1->table('chat_rooms cr')
            ->join('chat_participants cp', 'cr.id', '=', 'cp.chat_room_id')
            ->join('chat_participants cp2', 'cr.id', '=', 'cp2.chat_room_id')
            ->join('users u', 'cp2.user_id', '=', 'u.id')
            ->where('cr.type', 'direct')
            ->where('cp.user_id', $userId)
            ->where('cp2.user_id', '!=', $userId)
            ->select('cr.id, cr.name, cr.type, cr.image_url, cr.created_at, cr.updated_at, u.username as other_username, u.display_name as other_display_name, u.avatar_url as other_avatar, u.id as other_user_id')
            ->get();

        $query2 = new Query();
        $groupRooms = $query2->table('chat_rooms cr')
            ->join('chat_participants cp', 'cr.id', '=', 'cp.chat_room_id')
            ->where('cr.type', 'group')
            ->where('cp.user_id', $userId)
            ->select('cr.id, cr.name, cr.type, cr.image_url, cr.created_at, cr.updated_at')
            ->get();

        foreach ($groupRooms as &$room) {
            $participants = $this->getParticipants($room['id']);
            $room['participants'] = $participants;
            $room['participant_count'] = count($participants);
        }

        $allRooms = array_merge($directRooms, $groupRooms);
        
        usort($allRooms, function($a, $b) {
            return strtotime($b['updated_at']) - strtotime($a['updated_at']);
        });

        return $allRooms;
    }
      
      public function getRoomMessages($roomId, $limit = 50, $offset = 0) {
        $query = new Query();
        
        $results = $query->table('messages m')
            ->join('chat_room_messages crm', 'm.id', '=', 'crm.message_id')
            ->join('users u', 'm.user_id', '=', 'u.id')
            ->where('crm.room_id', $roomId)
            ->select('m.*, u.username, u.avatar_url')
            ->orderBy('m.sent_at', 'DESC')
            ->limit($limit)
            ->offset($offset)
            ->get();
        
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
            ->select('cp.*, u.username, u.display_name, u.avatar_url')
            ->get();
    }

    public function getUserDirectMessages($userId) {
        return $this->getUserDirectRooms($userId);
    }

    public function createGroupChatRoom($participantIds, $groupName, $groupImage = null) {
        if (count($participantIds) < 2) {
            throw new Exception('Group chat requires at least 2 participants');
        }

        $query = new Query();
        
        try {
            $query->beginTransaction();
            
            $roomId = $query->table('chat_rooms')->insert([
                'name' => $groupName,
                'type' => 'group',
                'image_url' => $groupImage,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            
            if ($roomId) {
                foreach ($participantIds as $userId) {
                    $user = $query->table('users')->where('id', $userId)->first();
                    if (!$user) {
                        throw new Exception("User with ID $userId not found");
                    }
                    
                    if ($user['status'] === 'banned' || $user['status'] === 'deleted') {
                        throw new Exception("Cannot add user {$user['username']} to group");
                    }
                    
                    $query->table('chat_participants')->insert([
                        'chat_room_id' => $roomId,
                        'user_id' => $userId,
                        'created_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s')
                    ]);
                }
                
                $query->commit();
                return $this->find($roomId);
            } else {
                $query->rollback();
                return null;
            }
        } catch (Exception $e) {
            $query->rollback();
            throw $e;
        }
    }
}
