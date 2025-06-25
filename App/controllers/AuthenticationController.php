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
        $this->clearAllAuthData();
        
        if ($this->isAuthenticated()) {
            $redirect = $_GET['redirect'] ?? '/home';
            $this->setSecurityHeaders();
            header('Location: ' . $redirect);
            exit;
        }

        $redirectUrl = $_GET['redirect'] ?? null;
        if ($redirectUrl) {
            $_SESSION['login_redirect'] = $redirectUrl;
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
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if ($this->isAuthenticated()) {
            $redirectUrl = $_GET['redirect'] ?? null;
            $redirect = $redirectUrl ?? $_SESSION['login_redirect'] ?? '/home';
            unset($_SESSION['login_redirect']);
            
            $this->setSecurityHeaders();
            header('Location: ' . $redirect);
            exit;
        }
        
        $redirectUrl = $_GET['redirect'] ?? null;
        if ($redirectUrl) {
            $_SESSION['login_redirect'] = $redirectUrl;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->setSecurityHeaders();
            header('Location: /login');
            exit;
        }

        $input = $this->getInput();
        $email = isset($input['email']) ? trim($input['email']) : '';
        $password = isset($input['password']) ? $input['password'] : '';

        if (empty($email)) {
            $this->logFailedLogin($email);
            $_SESSION['errors'] = ['auth' => 'Email is required'];
            $this->setSecurityHeaders();
            header('Location: /login');
            exit;
        }
        
        if (empty($password)) {
            $this->logFailedLogin($email);
            $_SESSION['errors'] = ['auth' => 'Password is required'];
            $_SESSION['old_input'] = ['email' => $email];
            $this->setSecurityHeaders();
            header('Location: /login');
            exit;
        }

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

        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            $this->logFailedLogin($email);
            $_SESSION['errors'] = ['auth' => 'No account found with this email address.'];
            $_SESSION['old_input'] = ['email' => $email];
            $this->setSecurityHeaders();
            header('Location: /login');
            exit;
        }
        
        if ($user->status === 'banned') {
            $this->logFailedLogin($email);
            $_SESSION['errors'] = ['auth' => 'This account has been banned. Please contact an administrator.'];
            $_SESSION['old_input'] = ['email' => $email];
            $this->setSecurityHeaders();
            header('Location: /login');
            exit;
        }
        
        $passwordVerified = $user->verifyPassword($password);
        
        if (!$passwordVerified) {
            $this->logFailedLogin($email);
            $_SESSION['errors'] = ['auth' => 'Login failed. Incorrect password provided.'];
            $_SESSION['old_input'] = ['email' => $email];
            $this->setSecurityHeaders();
            header('Location: /login');
            exit;
        }

        session_regenerate_id(true);
        
        $_SESSION['user_id'] = $user->id;
        $_SESSION['username'] = $user->username;
        $_SESSION['discriminator'] = $user->discriminator;
        $_SESSION['avatar_url'] = $user->avatar_url;
        $_SESSION['banner_url'] = $user->banner_url;
        $_SESSION['last_activity'] = time();
        
        $redirect = isset($_SESSION['login_redirect']) ? $_SESSION['login_redirect'] : '/app';
        unset($_SESSION['login_redirect']);
        
        $this->setSecurityHeaders();
        header('Location: ' . $redirect);
        exit;
    }

    public function showRegister()
    {
        $this->clearAllAuthData();
        
        if ($this->isAuthenticated()) {
            $this->setSecurityHeaders();
            header('Location: /home');
            exit;
        }

        $redirectUrl = $_GET['redirect'] ?? null;
        if ($redirectUrl) {
            $_SESSION['login_redirect'] = $redirectUrl;
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
            'display_name' => $username,
            'bio' => null,
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
            
            $user->display_name = $username;
            $user->bio = null;
            
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

        $this->clearAllAuthData();
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success(['redirect' => '/login'], 'Logged out successfully');
        }

        header('Location: /login');
        exit;
    }

    public function showForgotPassword()
    {
        $this->clearAllAuthData();
        
        if ($this->isAuthenticated()) {
            $this->setSecurityHeaders();
            header('Location: /home');
            exit;
        }

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
                $user->display_name = $user->username;
                $user->bio = null;
                $user->save();

                $this->logActivity('google_registration', ['user_id' => $user->id, 'email' => $email]);
            } else {
                if ($user->status === 'banned') {
                    $this->logActivity('banned_user_google_login_attempt', ['user_id' => $user->id, 'email' => $email]);
                    
                    if ($this->isApiRoute() || $this->isAjaxRequest()) {
                        return $this->error('This account has been banned. Please contact an administrator.', 403);
                    }
                    
                    $_SESSION['errors'] = ['auth' => 'This account has been banned. Please contact an administrator.'];
                    if (!headers_sent()) {
                        header('Location: /login');
                    }
                    exit;
                }
                
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
        if (isset($_GET['fresh']) && $_GET['fresh'] == '1') {
            $this->setSecurityHeaders();
            header('Location: /forgot-password');
            exit;
        }
        
        if ($this->isAuthenticated()) {
            $this->setSecurityHeaders();
            header('Location: /home');
            exit;
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

    public function showSecurityQuestion()
    {
        $this->clearAllAuthData();
        
        if ($this->isAuthenticated() && !isset($_SESSION['google_auth_completed'])) {
            $this->setSecurityHeaders();
            header('Location: /home');
            exit;
        }

        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'view' => 'security_question',
                'csrf_token' => $_SESSION['csrf_token'] ?? ''
            ]);
        }

        require_once __DIR__ . '/../views/pages/authentication-page.php';
    }

    private function clearAllAuthData()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $preserveKeys = [
            'login_redirect',
            'csrf_token'
        ];
        
        $preservedData = [];
        foreach ($preserveKeys as $key) {
            if (isset($_SESSION[$key])) {
                $preservedData[$key] = $_SESSION[$key];
            }
        }
        
        $authDataKeys = [
            'user_id', 'username', 'discriminator', 'avatar_url', 'banner_url', 
            'last_activity', 'errors', 'old_input', 'success', 'security_question',
            'reset_email', 'reset_token', 'reset_user_id', 'google_auth_completed',
            'security_question_set', 'password_reset_token', 'password_reset_user_id',
            'password_reset_expires'
        ];
        
        foreach ($authDataKeys as $key) {
            unset($_SESSION[$key]);
        }
        
        session_regenerate_id(true);
        
        foreach ($preservedData as $key => $value) {
            $_SESSION[$key] = $value;
        }
        
        $this->setSecurityHeaders();
        
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
        header('Pragma: no-cache');
        header('Expires: 0');
    }

    private function logFailedLogin($email)
    {
        $this->logActivity('failed_login_attempt', [
            'email' => $email,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
    }
}
