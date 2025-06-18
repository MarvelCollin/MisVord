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
        $data['owner_id'] = $ownerId;
        $server = $this->create($data);
        
        if ($server && $server->id) {
            $this->addMember($server->id, $ownerId);
            return $server;
        }
        
        return null;
    }
    
    public function addMember($serverId, $userId) {
        $query = new Query();
        return $query->table('user_server_memberships')->insert([
            'user_id' => $userId,
            'server_id' => $serverId,
            'joined_at' => date('Y-m-d H:i:s')
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
}
