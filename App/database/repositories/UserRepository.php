<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../query.php';

class UserRepository extends Repository {
    public function __construct() {
        parent::__construct(User::class);
    }
    
    public function findByEmail($email) {
        return User::findByEmail($email);
    }
    
    public function findByUsername($username) {
        return User::findByUsername($username);
    }
    
    public function findByGoogleId($googleId) {
        return User::findByGoogleId($googleId);
    }
      public function createWithHashedPassword($data) {
        if (isset($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        return $this->create($data);
    }
    
    public function updatePassword($userId, $newPassword) {
        $user = $this->find($userId);
        if ($user) {
            $user->setPassword($newPassword);
            return $user->save();
        }
        return false;
    }
    
    public function getUserServers($userId) {
        $user = $this->find($userId);
        return $user ? $user->servers() : [];
    }
      public function getUserFriends($userId) {
        $user = $this->find($userId);
        return $user ? $user->friends() : [];
    }
    
    public function searchByUsername($query, $excludeUserId = null, $limit = 20) {
        $queryBuilder = new Query();
        $sql = $queryBuilder->table('users')
            ->where('username', 'LIKE', "%{$query}%");
            
        if ($excludeUserId) {
            $sql->where('id', '!=', $excludeUserId);
        }
        
        $results = $sql->limit($limit)->get();
        
        $users = [];
        foreach ($results as $result) {
            $users[] = [
                'id' => $result['id'],
                'username' => $result['username'],
                'avatar_url' => $result['avatar_url'] ?? null
            ];
        }
        
        return $users;
    }
    
    public function createTable() {
        return User::createTable();
    }
    
    public function initialize() {
        return User::initialize();
    }
}
