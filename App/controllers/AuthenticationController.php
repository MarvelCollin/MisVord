<?php

require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/BaseController.php';

class AuthenticationController extends BaseController {
    
    private $userRepository;
    
    public function __construct() {
        parent::__construct();
        $this->userRepository = new UserRepository();
    }

    /**
     * Show login page or return login view data
     */
    public function showLogin() {
        // Redirect if already authenticated
        if ($this->isAuthenticated()) {
            $redirect = $_GET['redirect'] ?? '/app';
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success(['redirect' => $redirect], 'Already authenticated');
            }
            
            header('Location: ' . $redirect);
            exit;
        }

        // Store redirect URL for after login
        if (isset($_GET['redirect'])) {
            $_SESSION['login_redirect'] = $_GET['redirect'];
        }

        // Return view for AJAX/API requests
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'view' => 'login',
                'csrf_token' => $_SESSION['csrf_token'] ?? ''
            ]);
        }

        // Render login page
        require_once __DIR__ . '/../views/pages/authentication-page.php';
    }

    /**
     * Handle user login
     */
    public function login() {
        $input = $this->getInput();
        $input = $this->sanitize($input);
        
        // Validate input
        $this->validate($input, [
            'email' => 'required',
            'password' => 'required'
        ]);        $email = $input['email'];
        $password = $input['password'];

        $user = $this->userRepository->findByEmail($email);
        if (!$user || !$user->verifyPassword($password)) {
            $this->logActivity('login_failed', ['email' => $email]);
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->error('Invalid email or password', 401);
            }
            
            $_SESSION['errors'] = ['auth' => 'Invalid email or password'];
            $_SESSION['old_input'] = ['email' => $email];
            header('Location: /login');
            exit;
        }

        // Set session data
        $_SESSION['user_id'] = $user->id;
        $_SESSION['username'] = $user->username;
        $_SESSION['avatar_url'] = $user->avatar_url;

        // Update user status
        $user->status = 'online';
        $user->save();

        $this->logActivity('login_success', ['user_id' => $user->id]);

        // Determine redirect URL
        $redirect = $this->getRedirectUrl();

        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'avatar_url' => $user->avatar_url
                ],
                'redirect' => $redirect
            ], 'Login successful');
        }

        header('Location: ' . $redirect);
        exit;
    }

    /**
     * Show registration page or return registration view data
     */
    public function showRegister() {
        // Redirect if already authenticated
        if ($this->isAuthenticated()) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->redirectResponse('/app');
            }
            
            header('Location: /');
            exit;
        }

        // Store redirect URL for after registration
        if (isset($_GET['redirect'])) {
            $_SESSION['login_redirect'] = $_GET['redirect'];
        }

        // Return view for AJAX/API requests
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'view' => 'register',
                'csrf_token' => $_SESSION['csrf_token'] ?? ''
            ]);
        }

        // Render registration page
        require_once __DIR__ . '/../views/pages/authentication-page.php';
    }

    /**
     * Handle user registration
     */    public function register() {
        $input = $this->getInput();
        $input = $this->sanitize($input);
        
        // Validate input
        $this->validate($input, [
            'username' => 'required',
            'email' => 'required',
            'password' => 'required',
            'password_confirm' => 'required'
        ]);

        $username = $input['username'];
        $email = $input['email'];
        $password = $input['password'];
        $passwordConfirm = $input['password_confirm'];
        
        $errors = [];        // Validate username
        if (strlen($username) < 3) {
            $errors['username'] = 'Username must be at least 3 characters';
        } elseif ($this->userRepository->findByUsername($username)) {
            $errors['username'] = 'Username already exists';
        }

        // Validate email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Invalid email format';
        } elseif ($this->userRepository->findByEmail($email)) {
            $errors['email'] = 'Email already registered';
        }

        // Validate password
        if (strlen($password) < 6) {
            $errors['password'] = 'Password must be at least 6 characters';
        }

        if ($password !== $passwordConfirm) {
            $errors['password_confirm'] = 'Passwords do not match';
        }

        // Handle validation errors
        if (!empty($errors)) {
            $this->logActivity('registration_failed', ['email' => $email, 'errors' => array_keys($errors)]);
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->validationError($errors);
            }

            $_SESSION['errors'] = $errors;
            $_SESSION['old_input'] = [
                'username' => $username,
                'email' => $email
            ];
            header('Location: /register');
            exit;
        }

        // Create new user
        try {
            $user = new User();
            $user->username = $username;
            $user->email = $email;
            $user->setPassword($password);
            $user->status = 'online';
            
            $this->logActivity('registration_attempt', ['username' => $username, 'email' => $email]);
            
            if ($user->save()) {
                // Set session data
                $_SESSION['user_id'] = $user->id;
                $_SESSION['username'] = $user->username;
                $_SESSION['avatar_url'] = $user->avatar_url;
                
                $this->logActivity('registration_success', ['user_id' => $user->id]);
                
                $redirect = $this->getRedirectUrl();
                
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->success([
                        'user' => [
                            'id' => $user->id,
                            'username' => $user->username,
                            'avatar_url' => $user->avatar_url
                        ],
                        'redirect' => $redirect
                    ], 'Registration successful');
                }
                
                header('Location: ' . $redirect);
                exit;
            } else {
                throw new Exception('Failed to save user');
            }
        } catch (Exception $e) {
            $this->logActivity('registration_error', [
                'email' => $email,
                'error' => $e->getMessage()
            ]);
            
            $errorMessage = 'Registration failed. Please try again.';
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->serverError($errorMessage);
            }
            
            $_SESSION['errors'] = ['general' => $errorMessage];
            $_SESSION['old_input'] = [
                'username' => $username,
                'email' => $email
            ];
            header('Location: /register');
            exit;
        }
    }

    /**
     * Handle user logout
     */
    public function logout() {
        $userId = $this->getCurrentUserId();
          // Update user status if logged in
        if ($userId) {
            try {
                $user = $this->userRepository->find($userId);
                if ($user) {
                    $user->status = 'offline';
                    $user->save();
                }
            } catch (Exception $e) {
                // Log error but don't prevent logout
                $this->logActivity('logout_error', ['error' => $e->getMessage()]);
            }
        }
        
        $this->logActivity('logout', ['user_id' => $userId]);
        
        // Clear session
        session_destroy();
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success(['redirect' => '/'], 'Logged out successfully');
        }
        
        header('Location: /');
        exit;
    }

    /**
     * Show forgot password page
     */
    public function showForgotPassword() {
        if ($this->isAuthenticated()) {
            return $this->redirectResponse('/app');
        }

        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'view' => 'forgot_password',
                'csrf_token' => $_SESSION['csrf_token'] ?? ''
            ]);
        }

        require_once __DIR__ . '/../views/pages/authentication-page.php';
    }

    /**
     * Handle forgot password request
     */
    public function forgotPassword() {
        $input = $this->getInput();
        $input = $this->sanitize($input);
        
        $this->validate($input, ['email' => 'required']);
        
        $email = $input['email'];
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->validationError(['email' => 'Invalid email format']);
            }
            
            $_SESSION['errors'] = ['email' => 'Invalid email format'];
            header('Location: /forgot-password');
            exit;
        }

        // Always return success for security (don't reveal if email exists)
        $message = 'If an account with that email exists, you will receive password reset instructions.';
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success(['redirect' => '/login'], $message);
        }
        
        $_SESSION['success'] = $message;
        header('Location: /login');
        exit;
    }

    /**
     * Handle Google OAuth authentication
     */
    public function googleAuth($googleData) {
        try {
            $email = $googleData['email'] ?? null;
            $name = $googleData['name'] ?? null;
            $googleId = $googleData['id'] ?? null;
            
            if (!$email || !$googleId) {
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->validationError(['auth' => 'Invalid Google authentication data']);
                }
                  $_SESSION['errors'] = ['auth' => 'Google authentication failed'];
                header('Location: /login');
                exit;
            }
            
            $user = $this->userRepository->findByEmail($email);
            
            if (!$user) {
                // Create new user from Google data
                $user = new User();
                $user->email = $email;
                $user->username = $this->generateUniqueUsername($name ?? $email);
                $user->google_id = $googleId;
                $user->status = 'online';
                $user->save();
                
                $this->logActivity('google_registration', ['user_id' => $user->id, 'email' => $email]);
            } else {
                // Update existing user
                $user->google_id = $googleId;
                $user->status = 'online';
                $user->save();
                
                $this->logActivity('google_login', ['user_id' => $user->id]);
            }
            
            // Set session
            $_SESSION['user_id'] = $user->id;
            $_SESSION['username'] = $user->username;
            $_SESSION['avatar_url'] = $user->avatar_url;
            
            $redirect = $this->getRedirectUrl();
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'user' => [
                        'id' => $user->id,
                        'username' => $user->username,
                        'avatar_url' => $user->avatar_url
                    ],
                    'redirect' => $redirect
                ], 'Google authentication successful');
            }
            
            header('Location: ' . $redirect);
            exit;
            
        } catch (Exception $e) {
            $this->logActivity('google_auth_error', ['error' => $e->getMessage()]);
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->serverError('Google authentication failed');
            }
            
            $_SESSION['errors'] = ['auth' => 'Google authentication failed'];
            header('Location: /login');
            exit;
        }
    }

    /**
     * Generate unique username from name or email
     */
    private function generateUniqueUsername($name) {
        $username = strtolower(trim($name));
        $username = preg_replace('/[^a-z0-9_]/', '', $username);
        
        if (empty($username)) {
            $username = 'user';
        }
        
        $originalUsername = $username;
        $counter = 1;
        
        while ($this->userRepository->findByUsername($username)) {
            $username = $originalUsername . $counter;
            $counter++;
        }
        
        return $username;
    }
}