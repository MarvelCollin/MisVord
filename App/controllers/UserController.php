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
            
            $avatarUrl = '/public/storage/' . $filename;
            
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
            
            $bannerUrl = '/public/storage/' . $filename;
            
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


    
    public function getUserProfile($userId)
    {
        $this->requireAuth();
        
        try {
            $user = $this->userRepository->find($userId);
            
            if (!$user) {
                return $this->error('User not found', 404);
            }
            
            $currentUserId = $this->getCurrentUserId();
            
            $userData = [
                'id' => $user->id,
                'username' => $user->username,
                'discriminator' => $user->discriminator,
                'display_name' => $user->display_name ?? $user->username,
                'avatar_url' => $user->avatar_url,
                'banner_url' => $user->banner_url,
                'status' => $user->status,
                'bio' => $user->bio,
                'created_at' => $user->created_at,
                'is_self' => ($userId == $currentUserId),
                'is_friend' => $this->friendListRepository->areFriends($currentUserId, $userId),
                'friend_request_sent' => $this->friendListRepository->hasPendingRequest($currentUserId, $userId)
            ];
            
            return $this->success([
                'user' => $userData
            ]);
            
        } catch (Exception $e) {
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
        
        try {
            $currentUserId = $this->getCurrentUserId();
            
            if ($userId == $currentUserId) {
                return $this->error('Cannot get mutual relations with self', 400);
            }
            
            $user = $this->userRepository->find($userId);
            if (!$user) {
                return $this->error('User not found', 404);
            }
            
            $mutualFriends = $this->friendListRepository->getMutualFriends($currentUserId, $userId);
            $mutualServers = $this->userRepository->getMutualServers($currentUserId, $userId);
            
            return $this->success([
                'mutual_friend_count' => count($mutualFriends),
                'mutual_server_count' => count($mutualServers),
                'mutual_friends' => array_map(function($friend) {
                    return [
                        'id' => $friend->id,
                        'username' => $friend->username,
                        'display_name' => $friend->display_name ?? $friend->username,
                        'avatar_url' => $friend->avatar_url,
                        'status' => $friend->status
                    ];
                }, $mutualFriends),
                'mutual_servers' => array_map(function($server) {
                    return [
                        'id' => $server->id,
                        'name' => $server->name,
                        'icon_url' => $server->icon_url
                    ];
                }, $mutualServers)
            ]);
            
        } catch (Exception $e) {
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

    public function getProfile($userId) {
        try {
            $user = $this->userRepository->findById($userId);
            if (!$user) {
                return $this->json(['success' => false, 'message' => 'User not found'], 404);
            }

            $profile = [
                'id' => $user->id,
                'username' => $user->username,
                'discriminator' => $user->discriminator,
                'avatar_url' => $user->avatar_url,
                'banner_url' => $user->banner_url,
                'bio' => $user->bio,
                'status' => $user->status,
                'created_at' => $user->created_at,
                'relationship' => $this->getFriendshipStatus($userId)
            ];

            if (isset($_GET['server_id'])) {
                $membership = $this->userServerMembershipRepository->findByUserAndServer($userId, $_GET['server_id']);
                if ($membership) {
                    $profile['server_join_date'] = $membership->created_at;
                    $profile['server_roles'] = $membership->roles;
                }
            }

            return $this->json(['success' => true, 'data' => $profile]);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function getMutualInfo($userId) {
        try {
            $currentUserId = $this->getCurrentUserId();
            if (!$currentUserId) {
                return $this->json(['success' => false, 'message' => 'Not authenticated'], 401);
            }

            $mutualServers = $this->userServerMembershipRepository->getMutualServers($currentUserId, $userId);
            $mutualFriends = $this->friendListRepository->getMutualFriends($currentUserId, $userId);

            return $this->json([
                'success' => true,
                'data' => [
                    'server_count' => count($mutualServers),
                    'friend_count' => count($mutualFriends),
                    'servers' => $mutualServers,
                    'friends' => $mutualFriends
                ]
            ]);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateProfile() {
        try {
            $userId = $this->getCurrentUserId();
            if (!$userId) {
                return $this->json(['success' => false, 'message' => 'Not authenticated'], 401);
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $updateData = [];

            if (isset($data['bio'])) {
                $updateData['bio'] = strip_tags($data['bio']);
            }

            if (!empty($updateData)) {
                $this->userRepository->update($userId, $updateData);
            }

            return $this->json(['success' => true]);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function uploadAvatar() {
        try {
            $userId = $this->getCurrentUserId();
            if (!$userId) {
                return $this->json(['success' => false, 'message' => 'Not authenticated'], 401);
            }

            if (!isset($_FILES['avatar'])) {
                return $this->json(['success' => false, 'message' => 'No file uploaded'], 400);
            }

            $file = $_FILES['avatar'];
            $avatarUrl = $this->handleImageUpload($file, 'avatars');

            $this->userRepository->update($userId, ['avatar_url' => $avatarUrl]);

            return $this->json(['success' => true, 'data' => ['avatar_url' => $avatarUrl]]);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function uploadBanner() {
        try {
            $userId = $this->getCurrentUserId();
            if (!$userId) {
                return $this->json(['success' => false, 'message' => 'Not authenticated'], 401);
            }

            if (!isset($_FILES['banner'])) {
                return $this->json(['success' => false, 'message' => 'No file uploaded'], 400);
            }

            $file = $_FILES['banner'];
            $bannerUrl = $this->handleImageUpload($file, 'banners');

            $this->userRepository->update($userId, ['banner_url' => $bannerUrl]);

            return $this->json(['success' => true, 'data' => ['banner_url' => $bannerUrl]]);
        } catch (Exception $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    private function handleImageUpload($file, $directory) {
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!in_array($file['type'], $allowedTypes)) {
            throw new Exception('Invalid file type. Only JPEG, PNG and GIF are allowed.');
        }

        $maxSize = 5 * 1024 * 1024; // 5MB
        if ($file['size'] > $maxSize) {
            throw new Exception('File too large. Maximum size is 5MB.');
        }

        $uploadDir = __DIR__ . "/../public/storage/$directory/";
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $filename = uniqid() . '_' . basename($file['name']);
        $targetPath = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            throw new Exception('Failed to upload file.');
        }

        return "/storage/$directory/$filename";
    }

    private function getFriendshipStatus($userId) {
        $currentUserId = $this->getCurrentUserId();
        if (!$currentUserId || $currentUserId == $userId) {
            return 'self';
        }

        $friendship = $this->friendListRepository->getFriendship($currentUserId, $userId);
        if (!$friendship) {
            return 'none';
        }

        if ($friendship->status === 'accepted') {
            return 'friend';
        }

        if ($friendship->status === 'pending') {
            return $friendship->user_id == $currentUserId ? 'pending_outgoing' : 'pending_incoming';
        }

        if ($friendship->status === 'blocked') {
            return 'blocked';
        }

        return 'none';
    }

    private function emitUserStatusUpdate($userId, $status) {
        $socket = $this->getSocketConnection();
        if ($socket) {
            $socket->emit('user_status_update', [
                'user_id' => $userId,
                'status' => $status
            ]);
        }
    }
} 