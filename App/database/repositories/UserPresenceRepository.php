<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/UserPresence.php';
require_once __DIR__ . '/../query.php';

class UserPresenceRepository extends Repository {
    public function __construct() {
        parent::__construct(UserPresence::class);
    }
    
    public function findByUserId($userId) {
        return UserPresence::findByUserId($userId);
    }
    
    public function updateStatus($userId, $status) {
        $presence = $this->findByUserId($userId);
        
        $currentTime = new DateTime();
        
        if ($presence) {
            return $this->update($presence->id, [
                'status' => $status,
                'last_seen' => $currentTime
            ]);
        } else {
            return $this->create([
                'user_id' => $userId,
                'status' => $status,
                'last_seen' => $currentTime
            ]);
        }
    }
    
    public function updateActivity($userId, $activityDetails) {
        $presence = $this->findByUserId($userId);
        
        $currentTime = new DateTime();
        
        if ($presence) {
            return $this->update($presence->id, [
                'activity_details' => $activityDetails,
                'last_seen' => $currentTime
            ]);
        } else {
            return $this->create([
                'user_id' => $userId,
                'activity_details' => $activityDetails,
                'status' => 'online',
                'last_seen' => $currentTime
            ]);
        }
    }
    
    public function updatePresence($userId, $status, $activityDetails = null) {
        $presence = $this->findByUserId($userId);
        
        $currentTime = new DateTime();
        
        $data = [
            'status' => $status,
            'last_seen' => $currentTime
        ];
        
        if ($activityDetails !== null) {
            $data['activity_details'] = $activityDetails;
        }
        
        if ($presence) {
            return $this->update($presence->id, $data);
        } else {
            return $this->create(array_merge([
                'user_id' => $userId
            ], $data));
        }
    }
    
    public function getOnlineUsers() {
        $query = new Query();
        return $query->table('user_presence up')
            ->join('users u', 'up.user_id', '=', 'u.id')
            ->where('up.status', '!=', 'offline')
            ->select('u.*, up.status, up.activity_details, up.last_seen')
            ->get();
    }
    
    public function getOnlineFriends($userId) {
        $query = new Query();
        return $query->table('user_presence up')
            ->join('users u', 'up.user_id', '=', 'u.id')
            ->join('friend_list fl', function($join) use ($userId) {
                $join->on('u.id', '=', 'fl.user_id')
                    ->where('fl.user_id2', '=', $userId)
                    ->where('fl.status', '=', 'accepted');
            })
            ->orJoin('friend_list fl2', function($join) use ($userId) {
                $join->on('u.id', '=', 'fl2.user_id2')
                    ->where('fl2.user_id', '=', $userId)
                    ->where('fl2.status', '=', 'accepted');
            })
            ->where('up.status', '!=', 'offline')
            ->select('u.*, up.status, up.activity_details, up.last_seen')
            ->distinct()
            ->get();
    }
    
    public function markOffline($userId) {
        $presence = $this->findByUserId($userId);
        
        $currentTime = new DateTime();
        
        if ($presence) {
            return $this->update($presence->id, [
                'status' => 'offline',
                'activity_details' => null,
                'last_seen' => $currentTime
            ]);
        }
        
        return false;
    }
} 