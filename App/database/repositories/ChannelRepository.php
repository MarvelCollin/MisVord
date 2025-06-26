<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/Channel.php';
require_once __DIR__ . '/../query.php';

class ChannelRepository extends Repository {
    protected function getModelClass() {
        return Channel::class;
    }
    
    public function getByServerId($serverId) {
        return Channel::getByServerId($serverId);
    }
    
    public function findByNameAndServer($name, $serverId) {
        return Channel::findByNameAndServer($name, $serverId);
    }
    
    public function getForServer($serverId) {
        return $this->getAllBy('server_id', $serverId);
    }
    
    public function getForCategory($categoryId) {
        return $this->getAllBy('category_id', $categoryId);
    }
    
    public function createWithPosition($data) {
        if (!isset($data['position'])) {
            $maxPosition = $this->getMaxPositionForServer($data['server_id']);
            $data['position'] = $maxPosition + 1;
        }
        return $this->create($data);
    }
    
    private function getMaxPositionForServer($serverId) {
        $query = new Query();
        $result = $query->table('channels')
            ->select('MAX(position) as max_position')
            ->where('server_id', $serverId)
            ->first();
        return $result ? (int)$result['max_position'] : 0;
    }
    
    public function countByType($type) {
        return $this->countBy('type', $type);
    }
    
    public function countTextChannels() {
        return $this->countByType('text');
    }
    
    public function countVoiceChannels() {
        return $this->countByType('voice');
    }
}
