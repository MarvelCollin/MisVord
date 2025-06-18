<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/ServerInvite.php';
require_once __DIR__ . '/../query.php';

class ServerInviteRepository extends Repository {
    public function __construct() {
        parent::__construct(ServerInvite::class);
    }
    
    public function findByCode($code) {
        return ServerInvite::findByCode($code);
    }
    
    public function findActiveByCode($code) {
        return ServerInvite::findActiveByCode($code);
    }
    
    public function createInvite($serverId, $createdBy, $expiresAt = null, $maxUses = null) {
        $code = ServerInvite::generateCode();
        
        while ($this->findByCode($code)) {
            $code = ServerInvite::generateCode();
        }
        
        return $this->create([
            'server_id' => $serverId,
            'created_by' => $createdBy,
            'invite_code' => $code,
            'expires_at' => $expiresAt,
            'max_uses' => $maxUses,
            'uses' => 0
        ]);
    }
    
    public function useInvite($code) {
        $invite = $this->findActiveByCode($code);
        if ($invite && $invite->isValid()) {
            $invite->incrementUses();
            return $invite;
        }
        return null;
    }
      public function getServerInvites($serverId) {
        return $this->getAllBy('server_id', $serverId);
    }
    
    public function deleteOldInvites($serverId) {
        $query = new Query();
        return $query->table('server_invites')
            ->where('server_id', $serverId)
            ->delete();
    }
}
