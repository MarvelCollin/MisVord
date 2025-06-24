<?php

require_once __DIR__ . '/../database/repositories/UserRepository.php';
require_once __DIR__ . '/BaseController.php';

class AuthenticationController extends BaseController
{

    private $userRepository;

    public function __construct()
    {
        parent::__construct();
        $this->userRepository = new UserRepository();
    }
    public function showLogin()
    {
        if (function_exists('logger')) {
            logger()->debug("showLogin called", [
                'session_status' => session_status(),
                'is_authenticated' => $this->isAuthenticated(),
                'user_id' => $_SESSION['user_id'] ?? 'not_set',
                'request_uri' => $_SERVER['REQUEST_URI'] ?? ''
            ]);
        }
        
        // Clear all session data for fresh logins or normal access without authentication
        if ((isset($_GET['fresh']) && $_GET['fresh'] == '1') || !$this->isAuthenticated()) {
            // Save redirect URL if present
            $redirectUrl = $_GET['redirect'] ?? null;
            
            $this->clearAuthSession();
            session_start();
            
            // Restore redirect URL after session clear
            if ($redirectUrl) {
                $_SESSION['login_redirect'] = $redirectUrl;
            }
            
            if (function_exists('logger')) {
                logger()->debug("Session cleared for login page", [
                    'session_id' => session_id(),
                    'redirect_saved' => $redirectUrl ? 'yes' : 'no'
                ]);
            }
        }

        if ($this->isAuthenticated()) {
            $redirect = $_GET['redirect'] ?? '/home';

            if (function_exists('logger')) {
                logger()->debug("User already authenticated, redirecting", [
                    'redirect_to' => $redirect,
                    'user_id' => $_SESSION['user_id'] ?? 'not_set'
                ]);
            }

            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success(['redirect' => $redirect], 'Already authenticated');
            }

            $this->setSecurityHeaders();
            header('Location: ' . $redirect);
            exit;
        }

        if (isset($_GET['redirect'])) {
            $_SESSION['login_redirect'] = $_GET['redirect'];
        }

        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'view' => 'login',
                'csrf_token' => $_SESSION['csrf_token'] ?? ''
            ]);
        }

        require_once __DIR__ . '/../views/pages/authentication-page.php';
    }
    public function login()
    {
        // Clear previous errors
        $_SESSION['errors'] = [];
        $_SESSION['old_input'] = [];
        
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if ($this->isAuthenticated()) {
            $redirect = $_SESSION['login_redirect'] ?? $_GET['redirect'] ?? '/home';
            unset($_SESSION['login_redirect']);
            
            if (function_exists('logger')) {
                logger()->debug("User already authenticated, redirecting", [
                    'user_id' => $_SESSION['user_id'],
                    'redirect_to' => $redirect
                ]);
            }
            
            $this->setSecurityHeaders();
            header('Location: ' . $redirect);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            if (isset($_GET['redirect'])) {
                $_SESSION['login_redirect'] = $_GET['redirect'];
                
                if (function_exists('logger')) {
                    logger()->debug("Stored redirect URL in session", [
                        'redirect' => $_GET['redirect']
                    ]);
                }
            }
            
            $this->setSecurityHeaders();
            header('Location: /login');
            exit;
        }

        $input = $this->getInput();
        $email = isset($input['email']) ? trim($input['email']) : '';
        $password = isset($input['password']) ? $input['password'] : '';

        // Input validation
        if (empty($email)) {
            $this->logFailedLogin($email, 'empty_email');
            $_SESSION['errors'] = ['auth' => 'Email is required'];
            
            $this->setSecurityHeaders();
            header('Location: /login');
            exit;
        }
        
        if (empty($password)) {
            $this->logFailedLogin($email, 'empty_password');
            $_SESSION['errors'] = ['auth' => 'Password is required'];
            $_SESSION['old_input'] = ['email' => $email];
            
            $this->setSecurityHeaders();
            header('Location: /login');
            exit;
        }

        // Admin hardcoded login - ensure exact match
        if ($email === 'admin@admin.com' && $password === 'admin123') {
            session_regenerate_id(true);
            $_SESSION = array();
            $_SESSION['user_id'] = 1;
            $_SESSION['username'] = 'Admin';
            $_SESSION['discriminator'] = '0000';
            $_SESSION['avatar_url'] = '';
            $_SESSION['banner_url'] = '';
            $_SESSION['last_activity'] = time();
            
            $this->setSecurityHeaders();
            header('Location: /admin');
            exit;
        }

        // Find user by email
        $user = $this->userRepository->findByEmail($email);

        // User not found
        if (!$user) {
            $this->logFailedLogin($email, 'user_not_found');
            $_SESSION['errors'] = ['auth' => 'No account found with this email address.'];
            $_SESSION['old_input'] = ['email' => $email];
            
            $this->setSecurityHeaders();
            header('Location: /login');
            exit;
        }
        
        $passwordVerified = $user->verifyPassword($password);
        
        if (!$passwordVerified) {
            $this->logFailedLogin($email, 'password_verification_failed');
            $_SESSION['errors'] = ['auth' => 'Login failed. Incorrect password provided.'];
            $_SESSION['old_input'] = ['email' => $email];
            
            error_log('Password verification failed for user: ' . $email);
            
            if (function_exists('logger')) {
                logger()->warning("Failed login attempt", [
                    'email' => $email,
                    'reason' => 'password_verification_failed',
                    'user_id' => $user->id
                ]);
            }
            
            $this->setSecurityHeaders();
            session_write_close(); // Make sure the session is saved before redirect
            header('Location: /login');
            exit;
        }

        // Password is correct - proceed with login
        session_regenerate_id(true);
        $_SESSION = array();
        $_SESSION['user_id'] = $user->id;
        $_SESSION['username'] = $user->username;
        $_SESSION['discriminator'] = $user->discriminator;
        $_SESSION['avatar_url'] = $user->avatar_url;
        $_SESSION['banner_url'] = $user->banner_url;
        $_SESSION['last_activity'] = time();
        
        $redirect = isset($_SESSION['login_redirect']) ? $_SESSION['login_redirect'] : '/app';
        unset($_SESSION['login_redirect']);
        
        if (function_exists('logger')) {
            logger()->info("User logged in successfully", [
                'user_id' => $user->id,
                'username' => $user->username,
                'redirect_to' => $redirect
            ]);
        }

        $this->setSecurityHeaders();
        header('Location: ' . $redirect);
        exit;
    }

    public function showRegister()
    {
        // Clear session for fresh registrations
        if ((isset($_GET['fresh']) && $_GET['fresh'] == '1') || !$this->isAuthenticated()) {
            // Save redirect URL if present
            $redirectUrl = $_GET['redirect'] ?? null;
            
            $this->clearAuthSession();
            session_start();
            
            // Restore redirect URL after session clear
            if ($redirectUrl) {
                $_SESSION['login_redirect'] = $redirectUrl;
            }
        }
        
        if ($this->isAuthenticated()) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->redirectResponse('/home');
            }

            $this->setSecurityHeaders();
            header('Location: /');
            exit;
        }

        if (isset($_GET['redirect'])) {
            $_SESSION['login_redirect'] = $_GET['redirect'];
        }

        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'view' => 'register',
                'csrf_token' => $_SESSION['csrf_token'] ?? ''
            ]);
        }

        require_once __DIR__ . '/../views/pages/authentication-page.php';
    }

    public function register()
    {
        $input = $this->getInput();
        $input = $this->sanitize($input);
        
        error_log('Registration data: ' . json_encode([
            'has_security_question' => isset($input['security_question']),
            'security_question' => isset($input['security_question']) ? substr($input['security_question'], 0, 10) . '...' : null,
            'has_security_answer' => isset($input['security_answer']),
            'all_keys' => array_keys($input)
        ]));

        $this->validate($input, [
            'username' => 'required',
            'email' => 'required',
            'password' => 'required',
            'password_confirm' => 'required',
            'captcha' => 'required'
        ]);

        $username = $input['username'];
        $email = $input['email'];
        $password = $input['password'];
        $passwordConfirm = $input['password_confirm'];
        $captcha = $input['captcha'] ?? '';

        $errors = [];
        
        if (empty($username)) {
            $errors['username'] = 'Username is required';
        } elseif (strlen($username) < 3 || strlen($username) > 32) {
            $errors['username'] = 'Username must be between 3 and 32 characters';
        } elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
            $errors['username'] = 'Username can only contain letters, numbers, and underscores';
        } elseif ($this->userRepository->findByUsername($username)) {
            $errors['username'] = 'Username already exists';
        }

        if (empty($email)) {
            $errors['email'] = 'Email is required';
        } elseif (!preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email)) {
            $errors['email'] = 'Invalid email format';
        } elseif ($this->userRepository->findByEmail($email)) {
            $errors['email'] = 'Email already registered';
        }

        if (empty($password)) {
            $errors['password'] = 'Password is required';
        } elseif (strlen($password) < 8) {
            $errors['password'] = 'Password must be at least 8 characters';
        } elseif (!preg_match('/[A-Z]/', $password)) {
            $errors['password'] = 'Password must contain at least one uppercase letter';
        } elseif (!preg_match('/[0-9]/', $password)) {
            $errors['password'] = 'Password must contain at least one number';
        }

        if ($password !== $passwordConfirm) {
            $errors['password_confirm'] = 'Passwords do not match';
        }
        
        $securityQuestion = $input['security_question'] ?? '';
        $securityAnswer = $input['security_answer'] ?? '';
        
        if (empty($securityQuestion)) {
            $errors['security_question'] = 'Security question is required';
        }
        
        if (empty($securityAnswer)) {
            $errors['security_answer'] = 'Security answer is required';
        } elseif (strlen($securityAnswer) < 3) {
            $errors['security_answer'] = 'Security answer must be at least 3 characters';
        }

        if (!empty($errors)) {
            $this->logActivity('registration_failed', ['email' => $email, 'errors' => array_keys($errors)]);

            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->validationError($errors);
            }
            $_SESSION['errors'] = $errors;
            $_SESSION['old_input'] = [
                'username' => $username,
                'email' => $email,
                'security_question' => $securityQuestion
            ];
            if (!headers_sent()) {
                header('Location: /register');
            }
            exit;
        }

        $discriminator = User::generateDiscriminator();
        $userData = [
            'username' => $username,
            'discriminator' => $discriminator,
            'email' => $email,
            'status' => 'online',
            'security_question' => $securityQuestion,
            'security_answer' => password_hash($securityAnswer, PASSWORD_DEFAULT)
        ];
        
        $this->logActivity('registration_data', [
            'has_security_question' => !empty($securityQuestion),
            'has_security_answer' => !empty($securityAnswer),
            'security_question_length' => strlen($securityQuestion),
            'security_answer_length' => strlen($securityAnswer)
        ]);

        if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
            $avatarUrl = $this->uploadImage($_FILES['avatar'], 'avatars');
            if ($avatarUrl !== false) {
                $userData['avatar_url'] = $avatarUrl;
            }
        }
        
        if (isset($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
            $bannerUrl = $this->uploadImage($_FILES['banner'], 'banners');
            if ($bannerUrl !== false) {
                $userData['banner_url'] = $bannerUrl;
            }
        }

        try {
            $user = new User();
            $user->username = $username;
            $user->email = $email;
            $user->setPassword($password);
            $user->discriminator = $discriminator;
            $user->status = 'online';
            
            if (empty($securityQuestion) || empty($securityAnswer)) {
                throw new Exception('Security question and answer are required');
            }
            
            $user->security_question = $securityQuestion;
            $user->security_answer = password_hash($securityAnswer, PASSWORD_DEFAULT);
            
            if (isset($userData['avatar_url'])) {
                $user->avatar_url = $userData['avatar_url'];
            }
            
            if (isset($userData['banner_url'])) {
                $user->banner_url = $userData['banner_url'];
            }

            $this->logActivity('registration_attempt', ['username' => $username, 'email' => $email]);

            if ($user->save()) {
                $_SESSION['user_id'] = $user->id;
                $_SESSION['username'] = $user->username;
                $_SESSION['discriminator'] = $user->discriminator;
                $_SESSION['avatar_url'] = $user->avatar_url;
                $_SESSION['banner_url'] = $user->banner_url;

                $this->logActivity('registration_success', ['user_id' => $user->id]);

                $redirect = '/home';

                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->success([
                        'user' => [
                            'id' => $user->id,
                            'username' => $user->username,
                            'discriminator' => $user->discriminator,
                            'avatar_url' => $user->avatar_url
                        ],
                        'redirect' => $redirect
                    ], 'Registration successful');
                }

                if (!headers_sent()) {
                    header('Location: ' . $redirect);
                }
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
                'email' => $email,
                'security_question' => $securityQuestion
            ];
            if (!headers_sent()) {
                header('Location: /register');
            }
            exit;
        }
    }

    public function logout()
    {
        $userId = $this->getCurrentUserId();
        $this->logActivity('logout', ['user_id' => $userId]);

        $this->clearAuthSession();
        
        session_start();
        $_SESSION['fresh_login'] = true;
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            $this->setSecurityHeaders();
            return $this->success(['redirect' => '/login?fresh=1'], 'Logged out successfully');
        }

        $this->setSecurityHeaders();
        header('Location: /login?fresh=1');
        exit;
    }

    public function showForgotPassword()
    {
        // Clear session for fresh password reset requests
        if ((isset($_GET['fresh']) && $_GET['fresh'] == '1') || !$this->isAuthenticated()) {
            $this->clearAuthSession();
            session_start();
        }
        
        if ($this->isAuthenticated()) {
            return $this->redirectResponse('/home');
        }

        // Clear any existing password reset data
        unset($_SESSION['security_question']);
        unset($_SESSION['reset_email']);
        unset($_SESSION['old_input']);
        unset($_SESSION['reset_token']);
        unset($_SESSION['reset_user_id']);

        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'view' => 'forgot_password',
                'csrf_token' => $_SESSION['csrf_token'] ?? ''
            ]);
        }

        require_once __DIR__ . '/../views/pages/authentication-page.php';
    }

    public function forgotPassword()
    {
        $input = $this->getInput();
        $input = $this->sanitize($input);
        
        if (empty($input)) {
            unset($_SESSION['security_question']);
            unset($_SESSION['reset_email']);
            unset($_SESSION['old_input']);
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success(['view' => 'forgot_password']);
            }
            
            if (!headers_sent()) {
                header('Location: /forgot-password');
            }
            exit;
        }
        
        $step = $input['step'] ?? 'get_question';
        $email = $input['email'] ?? '';
        
        if ($step === 'get_question') {
            unset($_SESSION['security_question']);
            unset($_SESSION['reset_email']);
            
            if (empty($email)) {
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->validationError(['email' => 'Email is required']);
                }
                $_SESSION['errors'] = ['email' => 'Email is required'];
                if (!headers_sent()) {
                    header('Location: /forgot-password');
                }
                exit;
            }
            
            $user = $this->userRepository->findByEmail($email);
            
            if (!$user) {
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->validationError(['email' => 'No account found with this email']);
                }
                $_SESSION['errors'] = ['email' => 'No account found with this email'];
                if (!headers_sent()) {
                    header('Location: /forgot-password');
                }
                exit;
            }
            
            if (!$user->security_question || empty($user->security_question)) {
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->validationError(['email' => 'This account does not have a security question set']);
                }
                $_SESSION['errors'] = ['email' => 'This account does not have a security question set'];
                if (!headers_sent()) {
                    header('Location: /forgot-password');
                }
                exit;
            }
            
            $_SESSION['security_question'] = $user->security_question;
            $_SESSION['reset_email'] = $email;
            
            session_write_close();
            session_start();
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'view' => 'security_verify',
                    'security_question' => $user->security_question
                ]);
            }
            
            require_once __DIR__ . '/../views/pages/authentication-page.php';
            exit;
        } 
        else if ($step === 'verify_answer') {
            $securityAnswer = $input['security_answer'] ?? '';
            $email = $input['email'] ?? $_SESSION['reset_email'] ?? '';
            
            if (empty($securityAnswer)) {
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->validationError(['security_answer' => 'Security answer is required']);
                }
                $_SESSION['errors'] = ['security_answer' => 'Security answer is required'];
                if (!headers_sent()) {
                    header('Location: /forgot-password');
                }
                exit;
            }
            
            $user = $this->userRepository->findByEmail($email);
            
            if (!$user) {
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->validationError(['email' => 'Invalid account information']);
                }
                $_SESSION['errors'] = ['email' => 'Invalid account information'];
                if (!headers_sent()) {
                    header('Location: /forgot-password');
                }
                exit;
            }
            
            if (!$this->userRepository->verifySecurityAnswer($user->id, $securityAnswer)) {
                $this->logActivity('security_answer_incorrect', ['user_id' => $user->id]);
                
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->validationError(['security_answer' => 'Incorrect security answer']);
                }
                $_SESSION['errors'] = ['security_answer' => 'Incorrect security answer'];
                if (!headers_sent()) {
                    header('Location: /forgot-password');
                }
                exit;
            }
            
            $_SESSION['reset_token'] = md5(uniqid(rand(), true));
            $_SESSION['reset_user_id'] = $user->id;
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'redirect' => '/reset-password'
                ]);
            }
            
            if (!headers_sent()) {
                header('Location: /reset-password');
            }
            exit;
        }
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->validationError(['error' => 'Invalid request']);
        }
        
        $_SESSION['errors'] = ['error' => 'Invalid request'];
        if (!headers_sent()) {
            header('Location: /forgot-password');
        }
        exit;
    }

    public function googleAuth($googleData)
    {
        try {
            $email = $googleData['email'] ?? null;
            $name = $googleData['name'] ?? null;
            $googleId = $googleData['id'] ?? null;

            if (!$email || !$googleId) {
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->validationError(['auth' => 'Invalid Google authentication data']);
                }
                $_SESSION['errors'] = ['auth' => 'Google authentication failed'];
                if (!headers_sent()) {
                    header('Location: /login');
                }
                exit;
            }

            $user = $this->userRepository->findByEmail($email);

            if (!$user) {
                $user = new User();
                $user->email = $email;
                $user->username = $this->generateUniqueUsername($name ?? $email);
                $user->discriminator = User::generateDiscriminator();
                $user->google_id = $googleId;
                $user->save();

                $this->logActivity('google_registration', ['user_id' => $user->id, 'email' => $email]);
            } else {
                $user->google_id = $googleId;
                $user->save();

                $this->logActivity('google_login', ['user_id' => $user->id]);
            }

            $_SESSION['user_id'] = $user->id;
            $_SESSION['username'] = $user->username;
            $_SESSION['discriminator'] = $user->discriminator;
            $_SESSION['avatar_url'] = $user->avatar_url;
            $_SESSION['banner_url'] = $user->banner_url;
            $_SESSION['google_auth_completed'] = true;

            $redirect = '/home';
            
            if (!$user->security_question) {
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->success([
                        'redirect' => '/set-security-question'
                    ], 'Please set a security question');
                }
                
                if (!headers_sent()) {
                    header('Location: /set-security-question');
                }
                exit;
            }

            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'user' => [
                        'id' => $user->id,
                        'username' => $user->username,
                        'discriminator' => $user->discriminator,
                        'avatar_url' => $user->avatar_url
                    ],
                    'redirect' => $redirect
                ], 'Google authentication successful');
            }

            if (!headers_sent()) {
                header('Location: ' . $redirect);
            }
            exit;
        } catch (Exception $e) {
            $this->logActivity('google_auth_error', ['error' => $e->getMessage()]);

            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->serverError('Google authentication failed');
            }
            $_SESSION['errors'] = ['auth' => 'Google authentication failed'];
            if (!headers_sent()) {
                header('Location: /login');
            }
            exit;
        }
    }

    private function generateUniqueUsername($name)
    {
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

    public function setSecurityQuestion()
    {
        $input = $this->getInput();
        $input = $this->sanitize($input);

        $userId = $_SESSION['user_id'] ?? null;
        if (!$userId) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->error('Not authenticated', 401);
            }
            if (!headers_sent()) {
                header('Location: /login');
            }
            exit;
        }

        $this->validate($input, [
            'security_question' => 'required',
            'security_answer' => 'required'
        ]);

        $securityQuestion = $input['security_question'];
        $securityAnswer = $input['security_answer'];

        $errors = [];
        
        if (empty($securityQuestion)) {
            $errors['security_question'] = 'Security question is required';
        }
        
        if (empty($securityAnswer)) {
            $errors['security_answer'] = 'Security answer is required';
        } elseif (strlen($securityAnswer) < 3) {
            $errors['security_answer'] = 'Security answer must be at least 3 characters';
        }

        if (!empty($errors)) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->validationError($errors);
            }
            $_SESSION['errors'] = $errors;
            $_SESSION['old_input'] = [
                'security_question' => $securityQuestion
            ];
            if (!headers_sent()) {
                header('Location: /set-security-question');
            }
            exit;
        }

        try {
            $user = $this->userRepository->find($userId);
            if (!$user) {
                throw new Exception('User not found');
            }
            
            $user->security_question = $securityQuestion;
            $user->security_answer = password_hash($securityAnswer, PASSWORD_DEFAULT);
            
            if ($user->save()) {
                $_SESSION['security_question_set'] = true;
                
                $this->logActivity('security_question_set', ['user_id' => $userId]);
                
                $redirect = '/home';
                
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->success([
                        'redirect' => $redirect
                    ], 'Security question set successfully');
                }
                
                if (!headers_sent()) {
                    header('Location: ' . $redirect);
                }
                exit;
            } else {
                throw new Exception('Failed to save security question');
            }
        } catch (Exception $e) {
            $this->logActivity('security_question_error', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            
            $errorMessage = 'Failed to set security question. Please try again.';
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->serverError($errorMessage);
            }
            $_SESSION['errors'] = ['general' => $errorMessage];
            if (!headers_sent()) {
                header('Location: /set-security-question');
            }
            exit;
        }
    }

    public function showSecurityVerify()
    {
        unset($_SESSION['security_question']);
        unset($_SESSION['reset_email']);
        unset($_SESSION['reset_token']);
        unset($_SESSION['reset_user_id']);
        
        session_write_close();
        session_start();
                            
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->redirectResponse('/forgot-password');
        }
        
        if (!headers_sent()) {
            header('Location: /forgot-password');
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            header('Pragma: no-cache');
        }
        exit;
    }
    
    public function verifySecurityQuestion()
    {
        $input = $this->getInput();
        $input = $this->sanitize($input);
        
        $step = $input['step'] ?? 'get_question';
        $email = $input['email'] ?? '';
        
        if (empty($email)) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->validationError(['email' => 'Email is required']);
            }
            $_SESSION['errors'] = ['email' => 'Email is required'];
            if (!headers_sent()) {
                header('Location: /forgot-password');
            }
            exit;
        }
        
        $user = $this->userRepository->findByEmail($email);
        
        if (!$user) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->validationError(['email' => 'No account found with this email']);
            }
            $_SESSION['errors'] = ['email' => 'No account found with this email'];
            if (!headers_sent()) {
                header('Location: /forgot-password');
            }
            exit;
        }
        
        if ($step === 'get_question') {
            if (!$user->security_question || empty($user->security_question)) {
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->validationError(['email' => 'This account does not have a security question set']);
                }
                $_SESSION['errors'] = ['email' => 'This account does not have a security question set'];
                if (!headers_sent()) {
                    header('Location: /forgot-password');
                }
                exit;
            }
            
            $_SESSION['security_question'] = $user->security_question;
            $_SESSION['reset_email'] = $email;
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'view' => 'security_verify',
                    'security_question' => $user->security_question
                ]);
            }
            
            $_SESSION['old_input'] = ['email' => $email];
            if (!headers_sent()) {
                header('Location: /forgot-password');
            }
            exit;
        } else {
            $securityAnswer = $input['security_answer'] ?? '';
            
            if (empty($securityAnswer)) {
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->validationError(['security_answer' => 'Security answer is required']);
                }
                $_SESSION['errors'] = ['security_answer' => 'Security answer is required'];
                if (!headers_sent()) {
                    header('Location: /forgot-password');
                }
                exit;
            }
            
            if (!$this->userRepository->verifySecurityAnswer($user->id, $securityAnswer)) {
                $this->logActivity('security_answer_incorrect', ['user_id' => $user->id]);
                
                if ($this->isApiRoute() || $this->isAjaxRequest()) {
                    return $this->validationError(['security_answer' => 'Incorrect security answer']);
                }
                $_SESSION['errors'] = ['security_answer' => 'Incorrect security answer'];
                if (!headers_sent()) {
                    header('Location: /forgot-password');
                }
                exit;
            }
            
            $_SESSION['reset_token'] = md5(uniqid(rand(), true));
            $_SESSION['reset_user_id'] = $user->id;
            
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success([
                    'redirect' => '/reset-password'
                ]);
            }
            
            if (!headers_sent()) {
                header('Location: /reset-password');
            }
            exit;
        }
    }
    
    public function showResetPassword()
    {
        // Don't clear session on reset password page as we need the tokens
        if (isset($_GET['fresh']) && $_GET['fresh'] == '1') {
            // In case of fresh=1, redirect to forgot password instead
            $this->setSecurityHeaders();
            header('Location: /forgot-password');
            exit;
        }
        
        if ($this->isAuthenticated()) {
            return $this->redirectResponse('/home');
        }
        
        if (!isset($_SESSION['reset_token']) || !isset($_SESSION['reset_user_id'])) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->error('Invalid or expired reset token', 400);
            }
            
            $this->setSecurityHeaders();
            header('Location: /forgot-password');
            exit;
        }
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'view' => 'reset_password',
                'csrf_token' => $_SESSION['csrf_token'] ?? ''
            ]);
        }
        
        require_once __DIR__ . '/../views/pages/authentication-page.php';
    }
    
    public function resetPassword()
    {
        $input = $this->getInput();
        
        if (empty($input)) {
            return $this->redirectResponse('/login');
        }
        
        $token = $input['token'] ?? '';
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        $passwordConfirm = $input['password_confirm'] ?? '';
        
        if (empty($token) || empty($email) || empty($password) || empty($passwordConfirm)) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->validationError([
                    'password' => 'All fields are required'
                ]);
            }
            
            $_SESSION['errors'] = ['password' => 'All fields are required'];
            header('Location: /reset-password');
            exit;
        }
        
        if (!isset($_SESSION['reset_token']) || $token !== $_SESSION['reset_token'] || !isset($_SESSION['reset_user_id'])) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->validationError([
                    'password' => 'Invalid or expired reset token'
                ]);
            }
            
            $_SESSION['errors'] = ['password' => 'Invalid or expired reset token'];
            header('Location: /forgot-password');
            exit;
        }
        
        if ($password !== $passwordConfirm) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->validationError([
                    'password_confirm' => 'Passwords do not match'
                ]);
            }
            
            $_SESSION['errors'] = ['password_confirm' => 'Passwords do not match'];
            header('Location: /reset-password');
            exit;
        }
        
        // Password strength validation
        if (strlen($password) < 8) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->validationError([
                    'password' => 'Password must be at least 8 characters long'
                ]);
            }
            
            $_SESSION['errors'] = ['password' => 'Password must be at least 8 characters long'];
            header('Location: /reset-password');
            exit;
        }
        
        $userId = $_SESSION['reset_user_id'];
        if (!$this->userRepository->updatePassword($userId, $password)) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->error('Failed to update password');
            }
            
            $_SESSION['errors'] = ['password' => 'Failed to update password'];
            header('Location: /reset-password');
            exit;
        }
        
        // Clear reset token and user ID
        unset($_SESSION['reset_token']);
        unset($_SESSION['reset_user_id']);
        unset($_SESSION['reset_email']);
        unset($_SESSION['security_question']);
        
        $this->logActivity('password_reset', ['user_id' => $userId]);
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'redirect' => '/login'
            ], 'Password reset successfully');
        }
        
        $_SESSION['success'] = 'Password has been reset successfully. Please log in with your new password.';
        $this->setSecurityHeaders();
        header('Location: /login');
        exit;
    }

    protected function getInput()
    {
        $input = [];
        
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            
            if (strpos($contentType, 'application/json') !== false) {
                $jsonData = file_get_contents('php://input');
                $input = json_decode($jsonData, true) ?? [];
            } else {
                $input = $_POST;
            }
        } else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $input = $_GET;
        }
        
        return $input;
    }

    private function setSecurityHeaders()
    {
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
    }

    private function logFailedLogin($email)
    {
        if (function_exists('logger')) {
            logger()->warning("Failed login attempt", [
                'email' => $email,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }
        
        $this->logActivity('failed_login_attempt', [
            'email' => $email,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
    }
}
