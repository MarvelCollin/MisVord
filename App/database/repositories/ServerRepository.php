<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/Server.php';
require_once __DIR__ . '/../query.php';

class ServerRepository extends Repository {
    public function __construct() {
        parent::__construct(Server::class);
    }
    
    public function findByInviteLink($inviteLink) {
        return Server::findByInviteLink($inviteLink);
    }
      public function findByName($name) {
        return $this->findBy('name', $name);
    }
    
    public function getForUser($userId) {
        $query = new Query();
        $results = $query->table('servers s')
            ->join('user_server_memberships usm', 's.id', '=', 'usm.server_id')
            ->where('usm.user_id', $userId)
            ->select('s.*')
            ->get();
        
        return array_map(function($data) { return new Server($data); }, $results);
    }
    
    public function getFormattedServersForUser($userId) {
        return $this->getForUser($userId);
    }
      public function createWithOwner($data, $ownerId) {
        $server = $this->create($data);
        
        if ($server && $server->id) {
            $this->addMemberWithRole($server->id, $ownerId, 'owner');
            return $server;
        }
        
        return null;
    }
      public function addMember($serverId, $userId, $role = 'member') {
        return $this->addMemberWithRole($serverId, $userId, $role);
    }
    
    public function addMemberWithRole($serverId, $userId, $role = 'member') {
        $query = new Query();
        return $query->table('user_server_memberships')->insert([
            'user_id' => $userId,
            'server_id' => $serverId,
            'role' => $role,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    public function removeMember($serverId, $userId) {
        $query = new Query();
        return $query->table('user_server_memberships')
            ->where('user_id', $userId)
            ->where('server_id', $serverId)
            ->delete();
    }
    
    public function isMember($serverId, $userId) {
        $server = $this->find($serverId);
        return $server ? $server->isMember($userId) : false;
    }
    
    public function generateInviteLink($serverId) {
        $server = $this->find($serverId);
        return $server ? $server->generateInviteLink() : false;
    }
    
    public function getPublicServersWithMemberCount() {
        $query = new Query();
        return $query->table('servers s')
            ->select('s.*, COUNT(usm.id) as member_count')
            ->leftJoin('user_server_memberships usm', 's.id', '=', 'usm.server_id')
            ->where('s.is_public', 1)
            ->groupBy('s.id')
            ->orderBy('member_count', 'DESC')
            ->get();
    }
    
    public function getFeaturedServersWithMemberCount($limit = 3) {
        $query = new Query();
        return $query->table('servers s')
            ->select('s.*, COUNT(usm.id) as member_count')
            ->leftJoin('user_server_memberships usm', 's.id', '=', 'usm.server_id')
            ->where('s.is_public', 1)
            ->groupBy('s.id')
            ->orderBy('member_count', 'DESC')
            ->limit($limit)
            ->get();
    }
    
    public function getServersByCategoryWithMemberCount($category) {
        $query = new Query();
        return $query->table('servers s')
            ->select('s.*, COUNT(usm.id) as member_count')
            ->leftJoin('user_server_memberships usm', 's.id', '=', 'usm.server_id')
            ->where('s.is_public', 1)
            ->where('s.category', $category)
            ->groupBy('s.id')
            ->orderBy('member_count', 'DESC')
            ->get();
    }
}
