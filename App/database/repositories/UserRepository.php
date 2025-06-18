<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/User.php';

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
            $data['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
            unset($data['password']);
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
}
