<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../query.php';

class UserRepository extends Repository {
    protected function getModelClass() {
        return User::class;
    }
    
    public function findByEmail($email) {
        return User::findByEmail($email);
    }    public function findByUsername($username) {
        return User::findByUsername($username);
    }
      public function findByDisplayName($displayName) {
        return User::findByDisplayName($displayName);
    }
    
    public function findByUsernameAndDiscriminator($username, $discriminator) {
        return User::findByUsernameAndDiscriminator($username, $discriminator);
    }
    
    public function findByGoogleId($googleId) {
        return User::findByGoogleId($googleId);
    }
      public function createWithHashedPassword($data) {
        $password = null;
        if (isset($data['password'])) {
            $password = $data['password'];
            unset($data['password']); // Remove from data so it doesn't get hashed twice
        }
        
        $user = new User($data);
        
        if ($password) {
            $user->setPassword($password);
        }
        
        return $user->save() ? $user : null;
    }
    
    public function updatePassword($userId, $newPassword) {
        $user = $this->find($userId);
        if ($user) {
            $user->setPassword($newPassword);
            return $user->save();
        }
        return false;
    }
    
    public function setSecurityQuestion($userId, $question, $answer) {
        $user = $this->find($userId);
        if ($user) {
            $user->security_question = $question;
            $user->security_answer = password_hash($answer, PASSWORD_DEFAULT);
            return $user->save();
        }
        return false;
    }
    
    public function verifySecurityAnswer($userId, $answer) {
        $user = $this->find($userId);
        if ($user && isset($user->security_answer) && !empty($user->security_answer)) {
            return password_verify($answer, $user->security_answer);
        }
        return false;
    }
    
    public function hasSecurityQuestion($userId) {
        $user = $this->find($userId);
        return $user && isset($user->security_question) && !empty($user->security_question);
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
