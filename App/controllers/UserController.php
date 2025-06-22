<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/../database/repositories/FriendListRepository.php';

class UserController extends BaseController
{
    private $userRepository;
    private $friendListRepository;

    public function __construct()
    {
        parent::__construct();
        $this->userRepository = new UserRepository();
        $this->friendListRepository = new FriendListRepository();
    }

    public function getUserData($userId = null)
    {
        $this->requireAuth();
        
        if (!$userId) {
            $userId = $this->getCurrentUserId();
        }
        
        try {
            $user = $this->userRepository->find($userId);
            
            if (!$user) {
                return null;
            }
            
            $this->logActivity('user_data_retrieved', [
                'user_id' => $userId
            ]);
            
            return $user;
        } catch (Exception $e) {
            $this->logActivity('user_data_error', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            
            return null;
        }
    }
    
    public function updateUserProfile()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            $updateData = [];
            
            if (isset($input['username'])) {
                $updateData['username'] = $input['username'];
            }
            
            if (isset($input['display_name'])) {
                $updateData['display_name'] = $input['display_name'];
            }
            
            if (isset($input['email'])) {
                $updateData['email'] = $input['email'];
            }
            
            if (isset($input['status'])) {
                $updateData['status'] = $input['status'];
            }
            
            if (empty($updateData)) {
                return $this->error('No update data provided', 400);
            }
            
            $result = $this->userRepository->update($userId, $updateData);
            
            if (!$result) {
                return $this->serverError('Failed to update user profile');
            }
            
            $this->logActivity('user_profile_updated', [
                'user_id' => $userId,
                'updated_fields' => array_keys($updateData)
            ]);
            
            // Update session data if relevant fields were updated
            if (isset($updateData['username'])) {
                $_SESSION['username'] = $updateData['username'];
            }
            
            $user = $this->userRepository->find($userId);
            
            return $this->success([
                'user' => $user
            ], 'Profile updated successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while updating profile: ' . $e->getMessage());
        }
    }
    
    public function updateAvatar()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        
        try {
            if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
                return $this->error('No avatar file provided or upload error', 400);
            }
            
            $uploadDir = dirname(__DIR__) . '/storage/uploads/avatars/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            $fileExtension = pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION);
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            
            if (!in_array(strtolower($fileExtension), $allowedExtensions)) {
                return $this->error('Invalid file format. Allowed: jpg, jpeg, png, gif, webp', 400);
            }
            
            $filename = uniqid($userId . '_') . '_avatar.' . $fileExtension;
            $filePath = $uploadDir . $filename;
            
            if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $filePath)) {
                return $this->serverError('Failed to save avatar file');
            }
            
            $avatarUrl = '/storage/uploads/avatars/' . $filename;
            
            $result = $this->userRepository->update($userId, [
                'avatar_url' => $avatarUrl
            ]);
            
            if (!$result) {
                return $this->serverError('Failed to update avatar URL in database');
            }
            
            $_SESSION['avatar_url'] = $avatarUrl;
            
            $this->logActivity('user_avatar_updated', [
                'user_id' => $userId
            ]);
            
            return $this->success([
                'avatar_url' => $avatarUrl
            ], 'Avatar updated successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while updating avatar: ' . $e->getMessage());
        }
    }
    
    public function updateBanner()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        
        try {
            if (!isset($_FILES['banner']) || $_FILES['banner']['error'] !== UPLOAD_ERR_OK) {
                return $this->error('No banner file provided or upload error', 400);
            }
            
            $uploadDir = dirname(__DIR__) . '/storage/uploads/banners/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            $fileExtension = pathinfo($_FILES['banner']['name'], PATHINFO_EXTENSION);
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            
            if (!in_array(strtolower($fileExtension), $allowedExtensions)) {
                return $this->error('Invalid file format. Allowed: jpg, jpeg, png, gif, webp', 400);
            }
            
            $filename = uniqid($userId . '_') . '_banner.' . $fileExtension;
            $filePath = $uploadDir . $filename;
            
            if (!move_uploaded_file($_FILES['banner']['tmp_name'], $filePath)) {
                return $this->serverError('Failed to save banner file');
            }
            
            $bannerUrl = '/storage/uploads/banners/' . $filename;
            
            $result = $this->userRepository->update($userId, [
                'banner_url' => $bannerUrl
            ]);
            
            if (!$result) {
                return $this->serverError('Failed to update banner URL in database');
            }
            
            $_SESSION['banner_url'] = $bannerUrl;
            
            $this->logActivity('user_banner_updated', [
                'user_id' => $userId
            ]);
            
            return $this->success([
                'banner_url' => $bannerUrl
            ], 'Banner updated successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while updating banner: ' . $e->getMessage());
        }
    }
    
    public function changePassword()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            if (!isset($input['current_password']) || !isset($input['new_password']) || !isset($input['confirm_password'])) {
                return $this->error('Missing required fields', 400);
            }
            
            $currentPassword = $input['current_password'];
            $newPassword = $input['new_password'];
            $confirmPassword = $input['confirm_password'];
            
            if ($newPassword !== $confirmPassword) {
                return $this->error('New passwords do not match', 400);
            }
            
            if (strlen($newPassword) < 6) {
                return $this->error('Password must be at least 6 characters long', 400);
            }
            
            $user = $this->userRepository->find($userId);
            
            if (!$user || !password_verify($currentPassword, $user->password)) {
                return $this->error('Current password is incorrect', 400);
            }
            
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            
            $result = $this->userRepository->update($userId, [
                'password' => $hashedPassword
            ]);
            
            if (!$result) {
                return $this->serverError('Failed to update password');
            }
            
            $this->logActivity('user_password_changed', [
                'user_id' => $userId
            ]);
            
            return $this->success(null, 'Password changed successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while changing password: ' . $e->getMessage());
        }
    }
} 