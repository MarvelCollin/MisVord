<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/ServerInvite.php';
require_once __DIR__ . '/../query.php';

class ServerInviteRepository extends Repository {
    protected function getModelClass() {
        return ServerInvite::class;
    }
    
    public function findByCode($code) {
        return ServerInvite::findByCode($code);
    }
    
    public function findActiveByCode($code) {
        return ServerInvite::findActiveByCode($code);
    }
    
    public function createInvite($serverId, $createdBy, $expiresAt = null, $specificCode = null) {
        $code = $specificCode ?: ServerInvite::generateCode();
        
        // If a specific code wasn't provided or the provided code is already in use, generate a new one
        if (!$specificCode || $this->findByCode($code)) {
            $code = ServerInvite::generateCode();
            
            while ($this->findByCode($code)) {
                $code = ServerInvite::generateCode();
            }
        }
        
        $data = [
            'server_id' => $serverId,
            'inviter_user_id' => $createdBy,
            'invite_link' => $code
        ];
        
        if ($expiresAt) {
            $data['expires_at'] = $expiresAt;
        }
        
        return $this->create($data);
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
