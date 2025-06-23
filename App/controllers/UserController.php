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
                
                if (empty($displayName)) {
                    $errors['display_name'] = 'Display name cannot be empty';
                } else if (strlen($displayName) > 32) {
                    $errors['display_name'] = 'Display name cannot exceed 32 characters';
                } else {
                    $updateData['display_name'] = $displayName;
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
        
        $currentUserId = $this->getCurrentUserId();
        $serverId = isset($_GET['server_id']) ? $_GET['server_id'] : null;
        
        try {
            $user = $this->userRepository->find($userId);
            
            if (!$user) {
                return $this->error('User not found', 404);
            }
            
            $user->is_self = ($userId == $currentUserId);
            
            $friendStatus = $this->friendListRepository->getFriendshipStatus($currentUserId, $userId);
            $user->is_friend = ($friendStatus === 'friends');
            $user->friend_request_sent = ($friendStatus === 'pending_sent');
            $user->friend_request_received = ($friendStatus === 'pending_received');
            
            $responseData = [
                'user' => $user
            ];
            
            if ($serverId) {
                require_once __DIR__ . '/../database/repositories/RoleRepository.php';
                $roleRepository = new RoleRepository();
                $roles = $roleRepository->getUserRolesInServer($userId, $serverId);
                $responseData['roles'] = $roles;
                
                require_once __DIR__ . '/../database/repositories/UserServerMembershipRepository.php';
                $membershipRepository = new UserServerMembershipRepository();
                $membership = $membershipRepository->getUserServerMembership($userId, $serverId);
                if ($membership) {
                    $responseData['server_join_date'] = $membership->created_at;
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
                'error' => $e->getMessage()
            ]);
            
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
            
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            
            $result = $this->userRepository->update($user->id, [
                'password' => $hashedPassword
            ]);
            
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
} 