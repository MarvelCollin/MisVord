<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/GroupServer.php';
require_once __DIR__ . '/../query.php';

class GroupServerRepository extends Repository {
    protected function getModelClass() {
        return GroupServer::class;
    }
    
    public function getForUser($userId) {
        return GroupServer::findByUserId($userId);
    }
    
    public function getWithServersCount($userId) {
        $query = new Query();
        return $query->table('group_servers gs')
            ->select('gs.*, COUNT(s.id) as server_count')
            ->leftJoin('servers s', 'gs.id', '=', 's.group_server_id')
            ->where('gs.user_id', $userId)
            ->groupBy('gs.id')
            ->get();
    }
    
    public function createForUser($userId, $groupName) {
        return $this->create([
            'user_id' => $userId,
            'group_name' => $groupName
        ]);
    }
    
    public function updateName($groupId, $newName) {
        return $this->update($groupId, ['group_name' => $newName]);
    }
    
    public function deleteWithServers($groupId) {
        $query = new Query();
        
        return $query->transaction(function($q) use ($groupId) {
            $q->table('servers')->where('group_server_id', $groupId)->delete();
            $q->table('group_servers')->where('id', $groupId)->delete();
            return true;
        });
    }
} 
