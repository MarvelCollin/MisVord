<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/Nitro.php';
require_once __DIR__ . '/../query.php';

class NitroRepository extends Repository {
    protected function getModelClass() {
        return Nitro::class;
    }
    
    public function findByCode($code) {
        return Nitro::findByCode($code);
    }
    
    public function findByUserId($userId) {
        return Nitro::findByUserId($userId);
    }
    
    public function findUnusedByCode($code) {
        return Nitro::findUnusedByCode($code);
    }
    
    public function generateCode($userId = null) {
        $code = Nitro::generateUniqueCode();
        
        $nitro = new Nitro();
        $nitro->user_id = $userId;
        $nitro->code = $code;
        
        if ($nitro->save()) {
            return $nitro;
        }
        
        return null;
    }
    
    public function markCodeAsUsed($code, $userId) {
        $nitro = $this->findByCode($code);
        
        if ($nitro) {
            return $nitro->markAsUsed($userId);
        }
        
        return false;
    }
    
    public function getActiveCodes() {
        $query = new Query();
        $results = $query->table(Nitro::getTable())
            ->whereNull('user_id')
            ->orderBy('created_at', 'DESC')
            ->get();
            
        $nitros = [];
        foreach ($results as $result) {
            $nitros[] = new Nitro($result);
        }
        
        return $nitros;
    }
    
    public function countActiveCodes() {
        $query = new Query();
        return $query->table(Nitro::getTable())
            ->whereNull('user_id')
            ->count();
    }
    
    public function countTotalCodes() {
        $query = new Query();
        return $query->table(Nitro::getTable())->count();
    }
    
    public function deleteExpiredCodes($days = 30) {
        $query = new Query();
        $date = date('Y-m-d H:i:s', strtotime("-$days days"));
        
        return $query->table(Nitro::getTable())
            ->where('created_at', '<', $date)
            ->whereNull('user_id')
            ->delete();
    }
    
    public function createTable() {
        return Nitro::createTable();
    }
    
    public function initialize() {
        return Nitro::initialize();
    }
    
    public function getUserNitroStatus($userId) {
        $query = new Query();
        $count = $query->table(Nitro::getTable())
            ->where('user_id', $userId)
            ->count();
            
        return $count > 0;
    }
}
