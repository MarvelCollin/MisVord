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
                return $this->error('User not found', 404);
            }
            
            $this->logActivity('user_data_retrieved', [
                'user_id' => $userId
            ]);
            
            $currentUserId = $this->getCurrentUserId();
            $user->is_self = ($userId == $currentUserId);
            
            if (empty($user->display_name)) {
                $user->display_name = $user->username;
            }
            
            return $this->success([
                'user' => $user
            ]);
        } catch (Exception $e) {
            $this->logActivity('user_data_error', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            
            return $this->serverError('Failed to retrieve user data: ' . $e->getMessage());
        }
    }
    
    public function updateUserProfile()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            $updateData = [];
            $errors = [];
            
            if (isset($input['username'])) {
                $username = trim($input['username']);
                
                if (empty($username)) {
                    $errors['username'] = 'Username cannot be empty';
                } else if (strlen($username) < 3 || strlen($username) > 32) {
                    $errors['username'] = 'Username must be between 3 and 32 characters';
                } else if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
                    $errors['username'] = 'Username can only contain letters, numbers, and underscores';
                } else {
                    $updateData['username'] = $username;
                    $updateData['display_name'] = $username;
                }
            }
            
            if (isset($input['display_name'])) {
                $displayName = trim($input['display_name']);
                
                if (!empty($displayName)) {
                    if (strlen($displayName) > 32) {
                        $errors['display_name'] = 'Display name must be no more than 32 characters';
                    } else {
                        $updateData['display_name'] = $displayName;
                    }
                }
            }
            
            if (isset($input['bio'])) {
                $bio = trim($input['bio']);
                
                if (strlen($bio) > 1000) {
                    $errors['bio'] = 'Bio must be no more than 1000 characters';
                } else {
                    $updateData['bio'] = $bio;
                }
            }
            
            if (isset($input['email'])) {
                $email = trim($input['email']);
                
                if (empty($email)) {
                    $errors['email'] = 'Email cannot be empty';
                } else if (!preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email)) {
                    $errors['email'] = 'Please enter a valid email address';
                } else {
                    $updateData['email'] = $email;
                }
            }
            
            if (isset($input['phone'])) {
                $phone = preg_replace('/\D/', '', $input['phone']);
                
                if (!empty($phone)) {
                    if (strlen($phone) < 10 || strlen($phone) > 15) {
                        $errors['phone'] = 'Phone number must be between 10 and 15 digits';
                    } else {
                        $updateData['phone'] = $phone;
                    }
                } else {
                    $updateData['phone'] = '';
                }
            }
            
            if (isset($input['security_question']) && isset($input['security_answer'])) {
                if (empty($input['security_question'])) {
                    $errors['security_question'] = 'Security question cannot be empty';
                }
                
                if (empty($input['security_answer'])) {
                    $errors['security_answer'] = 'Security answer cannot be empty';
                } else if (strlen($input['security_answer']) < 3) {
                    $errors['security_answer'] = 'Security answer must be at least 3 characters long';
                }
            }
            
            if (!empty($errors)) {
                return $this->error('Validation failed', 400, $errors);
            }
            
            if (empty($updateData)) {
                return $this->error('No update data provided', 400);
            }
            
            $result = $this->userRepository->update($userId, $updateData);
            
            if (!$result) {
                return $this->serverError('Failed to update user profile');
            }
            
            if (isset($input['security_question']) && isset($input['security_answer'])) {
                $this->userRepository->setSecurityQuestion($userId, $input['security_question'], $input['security_answer']);
            }
            
            $this->logActivity('user_profile_updated', [
                'user_id' => $userId,
                'updated_fields' => array_keys($updateData)
            ]);
            
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
            
            $uploadDir = dirname(__DIR__) . '/public/storage/';
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
            
            $avatarUrl = '/storage/' . $filename;
            
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
    
    public function removeAvatar()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        
        try {
            $user = $this->userRepository->find($userId);
            
            if (!$user) {
                return $this->error('User not found', 404);
            }
            
            if (!empty($user->avatar_url)) {
                $avatarPath = dirname(__DIR__) . $user->avatar_url;
                if (file_exists($avatarPath) && is_file($avatarPath)) {
                    unlink($avatarPath);
                }
            }
            
            $result = $this->userRepository->update($userId, [
                'avatar_url' => null
            ]);
            
            if (!$result) {
                return $this->serverError('Failed to update user record');
            }
            
            $_SESSION['avatar_url'] = null;
            
            $this->logActivity('user_avatar_removed', [
                'user_id' => $userId
            ]);
            
            return $this->success(null, 'Profile picture removed successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while removing avatar: ' . $e->getMessage());
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
            
            $uploadDir = dirname(__DIR__) . '/public/storage/';
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
            
            $bannerUrl = '/storage/' . $filename;
            
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
    
    public function removeBanner()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        
        try {
            $user = $this->userRepository->find($userId);
            
            if (!$user) {
                return $this->error('User not found', 404);
            }
            
            if (!empty($user->banner_url)) {
                $bannerPath = dirname(__DIR__) . $user->banner_url;
                if (file_exists($bannerPath) && is_file($bannerPath)) {
                    unlink($bannerPath);
                }
            }
            
            $result = $this->userRepository->update($userId, [
                'banner_url' => null
            ]);
            
            if (!$result) {
                return $this->serverError('Failed to update user record');
            }
            
            $_SESSION['banner_url'] = null;
            
            $this->logActivity('user_banner_removed', [
                'user_id' => $userId
            ]);
            
            return $this->success(null, 'Banner removed successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while removing banner: ' . $e->getMessage());
        }
    }
    
    public function updateStatus()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            // Check if the user is a bot - bots should not be able to update their status via this method
            $user = $this->userRepository->find($userId);
            if ($user && $user->status === 'bot') {
                return $this->error('Bot users cannot update their status through this endpoint', 403);
            }
            
            if (!isset($input['status'])) {
                return $this->error('Status is required', 400);
            }
            
            $status = $input['status'];
            $allowedStatuses = ['appear', 'invisible', 'do_not_disturb', 'offline'];
            
            if (!in_array($status, $allowedStatuses)) {
                return $this->error('Invalid status. Allowed values: ' . implode(', ', $allowedStatuses), 400);
            }
            
            $result = $this->userRepository->update($userId, [
                'status' => $status
            ]);
            
            if (!$result) {
                return $this->serverError('Failed to update user status');
            }
            
            $_SESSION['user_status'] = $status;
            
            $this->logActivity('user_status_updated', [
                'user_id' => $userId,
                'status' => $status
            ]);
            
            return $this->success([
                'status' => $status
            ], 'Status updated successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while updating status: ' . $e->getMessage());
        }
    }
    
    public function changePassword()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            $errors = [];
            
            if (!isset($input['current_password']) || empty($input['current_password'])) {
                $errors['current_password'] = 'Current password is required';
            }
            
            if (!isset($input['new_password']) || empty($input['new_password'])) {
                $errors['new_password'] = 'New password is required';
            }
            
            if (!isset($input['confirm_password']) || empty($input['confirm_password'])) {
                $errors['confirm_password'] = 'Confirm password is required';
            }
            
            if (!empty($errors)) {
                return $this->error('Missing required fields', 400, $errors);
            }
            
            $currentPassword = $input['current_password'];
            $newPassword = $input['new_password'];
            $confirmPassword = $input['confirm_password'];
            
            if ($newPassword !== $confirmPassword) {
                $errors['confirm_password'] = 'New passwords do not match';
            }
            
            if (strlen($newPassword) < 8) {
                $errors['new_password'] = 'Password must be at least 8 characters long';
            }
            
            if (!preg_match('/[A-Z]/', $newPassword)) {
                $errors['new_password'] = 'Password must contain at least one uppercase letter';
            }
            
            if (!preg_match('/[0-9]/', $newPassword)) {
                $errors['new_password'] = 'Password must contain at least one number';
            }
            
            if (!empty($errors)) {
                return $this->error('Password validation failed', 400, $errors);
            }
            
            $user = $this->userRepository->find($userId);
            
            if (!$user || !$user->verifyPassword($currentPassword)) {
                return $this->error('Current password is incorrect', 400);
            }
            
            $result = $this->userRepository->updatePassword($userId, $newPassword);
            
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

    public function getBlockedUsers()
    {
        $this->requireAuth();
        
        $userId = $this->getCurrentUserId();
        
        try {
            $blockedUsers = $this->friendListRepository->getBlockedUsers($userId);
              $this->logActivity('blocked_users_viewed');
            
            $this->jsonResponse($blockedUsers);
            return;
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving blocked users: ' . $e->getMessage());
        }
    }
    
    public function getUserProfile($userId = null)
    {
        $this->requireAuth();
        
        if (!$userId) {
            return $this->error('User ID is required', 400);
        }
        
        
        require_once __DIR__ . '/../database/query.php';
        $query = new Query();
        $validUserIds = $query->table('users')
            ->select('id')
            ->limit(10)
            ->get();
        $validUserIds = array_column($validUserIds, 'id');
        
        if (!in_array($userId, $validUserIds)) {
            error_log("Warning: Requested user ID {$userId} is not in the database. Valid IDs: " . implode(', ', $validUserIds));
            return $this->error("User ID {$userId} not found. Valid user IDs are: " . implode(', ', $validUserIds), 404);
        }
        
        $currentUserId = $this->getCurrentUserId();
        $serverId = isset($_GET['server_id']) ? $_GET['server_id'] : null;
        
        try {
            $user = $this->userRepository->find($userId);
            
            if (!$user) {
                return $this->error('User not found', 404);
            }
            
            // Prevent viewing bot profiles (except for self)
            if ($user->status === 'bot' && $userId != $currentUserId) {
                return $this->error('User not found', 404);
            }
            
            $userData = $user->toArray();
            
            
            $userData['id'] = $user->id;
            $userData['username'] = $user->username ?? 'Unknown User';
            $userData['discriminator'] = $user->discriminator ?? '0000';
            $userData['display_name'] = $user->display_name ?? $user->username ?? 'Unknown User';
            $userData['avatar_url'] = $user->avatar_url ?? null;
            $userData['banner_url'] = $user->banner_url ?? null;
            $userData['status'] = $user->status ?? 'offline';
            $userData['bio'] = $user->bio ?? '';
            $userData['created_at'] = $user->created_at ?? null;
            
            
            $userData['is_self'] = ($userId == $currentUserId);
            
            $friendStatus = $this->friendListRepository->getFriendshipStatus($currentUserId, $userId);
            $userData['is_friend'] = ($friendStatus === 'friends');
            $userData['friend_request_sent'] = ($friendStatus === 'pending_sent');
            $userData['friend_request_received'] = ($friendStatus === 'pending_received');
            
            $responseData = [
                'user' => $userData
            ];
            
            if ($serverId) {
                require_once __DIR__ . '/../database/repositories/RoleRepository.php';
                $roleRepository = new RoleRepository();
                
                try {
                    $roles = $roleRepository->getUserRolesInServer($userId, $serverId);
                    $responseData['roles'] = $roles;
                } catch (Exception $roleError) {
                    error_log("Error loading roles: " . $roleError->getMessage());
                    $responseData['roles'] = [];
                }
                
                require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
                $membershipRepository = new UserServerMembershipRepository();
                
                try {
                    $membership = $membershipRepository->getUserServerMembership($userId, $serverId);
                    if ($membership) {
                        $responseData['server_join_date'] = $membership['created_at'];
                    }
                } catch (Exception $membershipError) {
                    error_log("Error loading membership: " . $membershipError->getMessage());
                }
            }
            
            $this->logActivity('user_profile_viewed', [
                'viewed_user_id' => $userId,
                'server_context' => $serverId
            ]);
            
            return $this->success($responseData);
        } catch (Exception $e) {
            $this->logActivity('user_profile_error', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            error_log("Error in getUserProfile: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            
            return $this->serverError('Failed to retrieve user profile: ' . $e->getMessage());
        }
    }
    
    public function findUsers()
    {
    }

    public function setSecurityQuestion()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            $errors = [];
            
            if (!isset($input['security_question']) || empty($input['security_question'])) {
                $errors['security_question'] = 'Security question is required';
            }
            
            if (!isset($input['security_answer']) || empty($input['security_answer'])) {
                $errors['security_answer'] = 'Security answer is required';
            }
            
            if (!empty($errors)) {
                return $this->error('Missing required fields', 400, $errors);
            }
            
            $question = $input['security_question'];
            $answer = $input['security_answer'];
            
            if (strlen($answer) < 3) {
                return $this->error('Security answer must be at least 3 characters long', 400);
            }
            
            $result = $this->userRepository->setSecurityQuestion($userId, $question, $answer);
            
            if (!$result) {
                return $this->serverError('Failed to set security question');
            }
            
            $this->logActivity('user_security_question_set', [
                'user_id' => $userId
            ]);
            
            return $this->success(null, 'Security question set successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while setting security question: ' . $e->getMessage());
        }
    }
    
    public function verifySecurityAnswer()
    {
        $input = $this->getInput();
        
        try {
            $errors = [];
            
            if (!isset($input['email']) || empty($input['email'])) {
                $errors['email'] = 'Email is required';
            }
            
            if (!isset($input['security_answer']) || empty($input['security_answer'])) {
                $errors['security_answer'] = 'Security answer is required';
            }
            
            if (!empty($errors)) {
                return $this->error('Missing required fields', 400, $errors);
            }
            
            $user = $this->userRepository->findByEmail($input['email']);
            
            if (!$user) {
                return $this->error('User not found', 404);
            }
            
            if (!isset($user->security_question) || empty($user->security_question)) {
                return $this->error('No security question set for this account', 400);
            }
            
            $verified = $this->userRepository->verifySecurityAnswer($user->id, $input['security_answer']);
            
            if (!$verified) {
                $this->logActivity('security_answer_failed', [
                    'user_id' => $user->id,
                    'email' => $input['email']
                ]);
                return $this->error('Incorrect security answer', 401);
            }
            
            $this->logActivity('security_answer_verified', [
                'user_id' => $user->id
            ]);
            
            $resetToken = bin2hex(random_bytes(32));
            $_SESSION['password_reset_token'] = $resetToken;
            $_SESSION['password_reset_user_id'] = $user->id;
            $_SESSION['password_reset_expires'] = time() + 3600;
            
            return $this->success([
                'reset_token' => $resetToken,
                'user_id' => $user->id
            ], 'Security answer verified successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while verifying security answer: ' . $e->getMessage());
        }
    }
    
    public function getSecurityQuestion()
    {
        $input = $this->getInput();
        
        try {
            if (!isset($input['email']) || empty($input['email'])) {
                return $this->error('Email is required', 400);
            }
            
            $user = $this->userRepository->findByEmail($input['email']);
            
            if (!$user) {
                return $this->error('User not found', 404);
            }
            
            if (!isset($user->security_question) || empty($user->security_question)) {
                return $this->error('No security question set for this account', 400);
            }
            
            $this->logActivity('security_question_requested', [
                'user_id' => $user->id,
                'email' => $input['email']
            ]);
            
            return $this->success([
                'security_question' => $user->security_question
            ]);
        } catch (Exception $e) {
            return $this->serverError('An error occurred while retrieving security question: ' . $e->getMessage());
        }
    }
    
    public function resetPasswordWithSecurityAnswer()
    {
        $input = $this->getInput();
        
        try {
            $errors = [];
            
            if (!isset($input['email']) || empty($input['email'])) {
                $errors['email'] = 'Email is required';
            }
            
            if (!isset($input['security_answer']) || empty($input['security_answer'])) {
                $errors['security_answer'] = 'Security answer is required';
            }
            
            if (!isset($input['new_password']) || empty($input['new_password'])) {
                $errors['new_password'] = 'New password is required';
            }
            
            if (!isset($input['confirm_password']) || empty($input['confirm_password'])) {
                $errors['confirm_password'] = 'Confirm password is required';
            }
            
            if (!empty($errors)) {
                return $this->error('Missing required fields', 400, $errors);
            }
            
            $user = $this->userRepository->findByEmail($input['email']);
            
            if (!$user) {
                return $this->error('User not found', 404);
            }
            
            if (!isset($user->security_question) || empty($user->security_question)) {
                return $this->error('No security question set for this account', 400);
            }
            
            $newPassword = $input['new_password'];
            $confirmPassword = $input['confirm_password'];
            
            if ($newPassword !== $confirmPassword) {
                return $this->error('Passwords do not match', 400);
            }
            
            if (strlen($newPassword) < 8) {
                return $this->error('Password must be at least 8 characters long', 400);
            }
            
            if (!preg_match('/[A-Z]/', $newPassword)) {
                return $this->error('Password must contain at least one uppercase letter', 400);
            }
            
            if (!preg_match('/[0-9]/', $newPassword)) {
                return $this->error('Password must contain at least one number', 400);
            }
            
            $verified = $this->userRepository->verifySecurityAnswer($user->id, $input['security_answer']);
            
            if (!$verified) {
                $this->logActivity('password_reset_failed_security_answer', [
                    'user_id' => $user->id,
                    'email' => $input['email']
                ]);
                return $this->error('Incorrect security answer', 401);
            }
            
            $result = $this->userRepository->updatePassword($user->id, $newPassword);
            
            if (!$result) {
                return $this->serverError('Failed to update password');
            }
            
            $this->logActivity('password_reset_with_security_answer', [
                'user_id' => $user->id
            ]);
            
            return $this->success(null, 'Password reset successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while resetting password: ' . $e->getMessage());
        }
    }

    public function getMutualRelations($userId)
    {
        $this->requireAuth();
        
        if (!$userId) {
            return $this->error('User ID is required', 400);
        }
        
        $currentUserId = $this->getCurrentUserId();
        
        if ($currentUserId == $userId) {
            return $this->error('Cannot get mutual relations with yourself', 400);
        }
        
        try {
            
            $mutualFriends = [];
            try {
                $currentUserFriends = $this->friendListRepository->getUserFriends($currentUserId) ?: [];
                $otherUserFriends = $this->friendListRepository->getUserFriends($userId) ?: [];
                
                $currentUserFriendIds = array_column($currentUserFriends, 'id');
                
                foreach ($otherUserFriends as $friend) {
                    if (isset($friend['id']) && in_array($friend['id'], $currentUserFriendIds)) {
                        // Skip bots from mutual friends
                        if (isset($friend['status']) && $friend['status'] === 'bot') {
                            continue;
                        }
                        
                        $mutualFriends[] = [
                            'id' => $friend['id'],
                            'username' => $friend['username'] ?? 'Unknown User',
                            'avatar_url' => $friend['avatar_url'] ?? null
                        ];
                    }
                }
            } catch (Exception $friendError) {
                error_log("Error getting mutual friends: " . $friendError->getMessage());
                $mutualFriends = [];
            }
            
            
            $mutualServers = [];
            try {
                require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
                $membershipRepository = new UserServerMembershipRepository();
                
                $currentUserServers = $membershipRepository->getServersForUser($currentUserId) ?: [];
                $otherUserServers = $membershipRepository->getServersForUser($userId) ?: [];
                
                $currentUserServerIds = array_column($currentUserServers, 'id');
                
                foreach ($otherUserServers as $server) {
                    if (isset($server['id']) && in_array($server['id'], $currentUserServerIds)) {
                        
                        $mutualServers[] = [
                            'id' => $server['id'],
                            'name' => $server['name'] ?? 'Unknown Server',
                            'image_url' => $server['image_url'] ?? null
                        ];
                    }
                }
            } catch (Exception $serverError) {
                error_log("Error getting mutual servers: " . $serverError->getMessage());
                $mutualServers = [];
            }
            
            return $this->success([
                'mutual_friends' => $mutualFriends,
                'mutual_friend_count' => count($mutualFriends),
                'mutual_servers' => $mutualServers,
                'mutual_server_count' => count($mutualServers)
            ]);
        } catch (Exception $e) {
            $this->logActivity('mutual_relations_error', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            
            error_log("Error in getMutualRelations: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            
            return $this->serverError('Failed to retrieve mutual relations: ' . $e->getMessage());
        }
    }
    
    public function settings()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        
        return require_once dirname(__DIR__) . '/views/pages/settings-user.php';
    }

    public function getCurrentUserSecurityQuestion()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        
        error_log("🔐 Getting security question for user ID: " . $userId);
        error_log("🔍 Session data: " . json_encode($_SESSION));
        
        if (!$userId) {
            error_log("❌ No user ID found in session");
            return $this->error('No user ID in session', 401);
        }
        
        try {
            $user = $this->userRepository->find($userId);
            
            if (!$user) {
                error_log("❌ User not found for ID: " . $userId);
                
                // Try direct query to see if user exists at all
                require_once __DIR__ . '/../database/query.php';
                $query = new Query();
                $directResult = $query->table('users')->where('id', $userId)->first();
                
                if ($directResult) {
                    error_log("⚠️ User exists in database but repository->find failed");
                    error_log("🔍 Direct query result: " . json_encode($directResult));
                } else {
                    error_log("❌ User does not exist in database");
                }
                
                return $this->error('User not found', 404);
            }
            
            error_log("👤 User found: " . $user->username . " (ID: " . $user->id . ")");
            error_log("🔍 User attributes: " . json_encode($user->toArray()));
            error_log("🔍 Security question value: " . ($user->security_question ?? 'NULL'));
            error_log("🔍 Security question isset: " . (isset($user->security_question) ? 'YES' : 'NO'));
            error_log("🔍 Security question empty check: " . (empty($user->security_question) ? 'YES' : 'NO'));
            
            if (!isset($user->security_question) || empty($user->security_question)) {
                error_log("⚠️ No security question set for user: " . $userId);
                
                // Check if the field exists in the database at all
                require_once __DIR__ . '/../database/query.php';
                $query = new Query();
                $directResult = $query->table('users')->where('id', $userId)->first();
                
                if ($directResult && isset($directResult['security_question'])) {
                    error_log("🔍 Direct query shows security_question: " . ($directResult['security_question'] ?? 'NULL'));
                }
                
                return $this->error('No security question set for this account. Please set one first in your account registration or contact support.', 400);
            }
            
            $this->logActivity('security_question_requested_current_user', [
                'user_id' => $userId
            ]);
            
            error_log("✅ Returning security question: " . $user->security_question);
            
            $response = $this->success([
                'security_question' => $user->security_question
            ]);
            
            error_log("📤 Final response: " . json_encode($response));
            return $response;
            
        } catch (Exception $e) {
            error_log("💥 Exception in getCurrentUserSecurityQuestion: " . $e->getMessage());
            error_log("💥 Exception trace: " . $e->getTraceAsString());
            return $this->serverError('An error occurred while retrieving security question: ' . $e->getMessage());
        }
    }

    public function verifyCurrentUserSecurityAnswer()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            if (!isset($input['security_answer']) || empty($input['security_answer'])) {
                return $this->error('Security answer is required', 400);
            }
            
            $user = $this->userRepository->find($userId);
            
            if (!$user) {
                return $this->error('User not found', 404);
            }
            
            if (!isset($user->security_question) || empty($user->security_question)) {
                return $this->error('No security question set for this account', 400);
            }
            
            $verified = $this->userRepository->verifySecurityAnswer($user->id, $input['security_answer']);
            
            if (!$verified) {
                $this->logActivity('security_answer_failed_current_user', [
                    'user_id' => $user->id
                ]);
                return $this->error('Incorrect security answer', 401);
            }
            
            $this->logActivity('security_answer_verified_current_user', [
                'user_id' => $user->id
            ]);
            
            // Store verification in session for password change
            $_SESSION['security_verified_for_password_change'] = true;
            $_SESSION['security_verified_time'] = time();
            
            return $this->success(null, 'Security answer verified successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while verifying security answer: ' . $e->getMessage());
        }
    }

    public function changePasswordWithSecurityAnswer()
    {
        $this->requireAuth();
        $userId = $this->getCurrentUserId();
        $input = $this->getInput();
        
        try {
            $errors = [];
            
            if (!isset($input['security_answer']) || empty($input['security_answer'])) {
                $errors['security_answer'] = 'Security answer is required';
            }
            
            if (!isset($input['new_password']) || empty($input['new_password'])) {
                $errors['new_password'] = 'New password is required';
            }
            
            if (!isset($input['confirm_password']) || empty($input['confirm_password'])) {
                $errors['confirm_password'] = 'Confirm password is required';
            }
            
            if (!empty($errors)) {
                return $this->error('Missing required fields', 400, $errors);
            }
            
            $user = $this->userRepository->find($userId);
            
            if (!$user) {
                return $this->error('User not found', 404);
            }
            
            if (!isset($user->security_question) || empty($user->security_question)) {
                return $this->error('No security question set for this account', 400);
            }
            
            $newPassword = $input['new_password'];
            $confirmPassword = $input['confirm_password'];
            
            if ($newPassword !== $confirmPassword) {
                return $this->error('Passwords do not match', 400);
            }
            
            if (strlen($newPassword) < 8) {
                return $this->error('Password must be at least 8 characters long', 400);
            }
            
            if (!preg_match('/[A-Z]/', $newPassword)) {
                return $this->error('Password must contain at least one uppercase letter', 400);
            }
            
            if (!preg_match('/[0-9]/', $newPassword)) {
                return $this->error('Password must contain at least one number', 400);
            }
            
            // Verify security answer
            $verified = $this->userRepository->verifySecurityAnswer($user->id, $input['security_answer']);
            
            if (!$verified) {
                $this->logActivity('password_change_failed_security_answer', [
                    'user_id' => $user->id
                ]);
                return $this->error('Incorrect security answer', 401);
            }
            
            $result = $this->userRepository->updatePassword($user->id, $newPassword);
            
            if (!$result) {
                return $this->serverError('Failed to update password');
            }
            
            // Clear security verification session
            unset($_SESSION['security_verified_for_password_change']);
            unset($_SESSION['security_verified_time']);
            
            $this->logActivity('password_changed_with_security_answer', [
                'user_id' => $user->id
            ]);
            
            return $this->success(null, 'Password changed successfully');
        } catch (Exception $e) {
            return $this->serverError('An error occurred while changing password: ' . $e->getMessage());
        }
    }
} 