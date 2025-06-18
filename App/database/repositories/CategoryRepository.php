<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/Category.php';

class CategoryRepository extends Repository {
    public function __construct() {
        parent::__construct(Category::class);
    }
    
    public function getForServer($serverId) {
        return $this->getAllBy('server_id', $serverId);
    }
    
    public function getMaxPositionForServer($serverId) {
        return Category::getMaxPositionForServer($serverId);
    }
    
    public function createWithPosition($data) {
        if (!isset($data['position'])) {
            $data['position'] = $this->getMaxPositionForServer($data['server_id']) + 1;
        }
        return $this->create($data);
    }
}