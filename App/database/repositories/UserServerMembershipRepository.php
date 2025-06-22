<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/UserServerMembership.php';
require_once __DIR__ . '/../query.php';

class UserServerMembershipRepository extends Repository {
    protected function getModelClass() {
        return UserServerMembership::class;
    }
    
    public function findByUserAndServer($userId, $serverId) {
        return UserServerMembership::findByUserAndServer($userId, $serverId);
    }
    
    public function getUsersForServer($serverId) {
        return UserServerMembership::getUsersForServer($serverId);
    }
    
    public function getServersForUser($userId) {
        return UserServerMembership::getServersForUser($userId);
    }
    
    public function isMember($userId, $serverId) {
        return UserServerMembership::isMember($userId, $serverId);
    }
    
    public function addMembership($userId, $serverId, $role = 'member') {
        return UserServerMembership::addMembership($userId, $serverId, $role);
    }
    
    public function removeMembership($userId, $serverId) {
        return UserServerMembership::removeMembership($userId, $serverId);
    }
    
    public function updateRole($userId, $serverId, $role) {
        $membership = $this->findByUserAndServer($userId, $serverId);
        if ($membership) {
            $membership->role = $role;
            return $membership->save();
        }
        return false;
    }
    
    public function getMemberCount($serverId) {
        return count($this->getAllBy('server_id', $serverId));
    }
      public function getServerCount($userId) {
        return count($this->getAllBy('user_id', $userId));
    }    public function isOwner($userId, $serverId) {
        $membership = $this->findByUserAndServer($userId, $serverId);
        return $membership && $membership->role === 'owner';
    }
    
    public function getServerMembers($serverId)
    {
        $query = "SELECT u.id, u.username, u.discriminator, u.avatar_url, u.status, usm.created_at as joined_at
                  FROM users u
                  JOIN user_server_memberships usm ON u.id = usm.user_id
                  WHERE usm.server_id = :server_id
                  ORDER BY usm.created_at ASC";
        
        $params = [':server_id' => $serverId];
        
        return $this->db->fetchAll($query, $params);
    }
    
    public function getUserServerMembership($userId, $serverId)
    {
        $query = "SELECT * FROM user_server_memberships
                  WHERE user_id = :user_id AND server_id = :server_id
                  LIMIT 1";
        
        $params = [
            ':user_id' => $userId,
            ':server_id' => $serverId
        ];
        
        return $this->db->fetchOne($query, $params);
    }
    
    public function updateNotificationSettings($userId, $serverId, $settings) {
        $query = new Query();
        return $query->table('user_server_memberships')
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->update(['notification_settings' => json_encode($settings)]);
    }
    
    public function getNotificationSettings($userId, $serverId) {
        $query = new Query();
        $result = $query->table('user_server_memberships')
            ->select('notification_settings')
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->first();
        
        if ($result && !empty($result['notification_settings'])) {
            return json_decode($result['notification_settings'], true);
        }
        
        return [
            'all_messages' => false,
            'mentions_only' => true,
            'muted' => false,
            'suppress_everyone' => false,
            'suppress_roles' => false
        ];
    }
    
    public function getServerIdsForUser($userId) {
        return UserServerMembership::getServerIdsForUser($userId);
    }
}
