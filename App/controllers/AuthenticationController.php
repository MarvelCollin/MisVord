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
        
        if (isset($_GET['fresh']) && $_GET['fresh'] == '1') {
            $_SESSION = array();
            
            if (function_exists('logger')) {
                logger()->debug("Fresh login requested, cleared session", [
                    'session_id' => session_id()
                ]);
            }
        }

        if ($this->isAuthenticated()) {
            $redirect = $_GET['redirect'] ?? '/home';

            if (function_exists('logger')) {
                // logger()->debug("User already authenticated, redirecting", [
                //     'redirect_to' => $redirect,
                //     'user_id' => $_SESSION['user_id'] ?? 'not_set'
                // ]);
            }

            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->success(['redirect' => $redirect], 'Already authenticated');
            }

            if (!headers_sent()) {
                header('Location: ' . $redirect);
            }
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
        if ($this->isAuthenticated()) {
            header('Location: /home');
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: /login');
            exit;
        }

        $input = $this->getInput();
        $email = isset($input['email']) ? trim($input['email']) : '';
        $password = isset($input['password']) ? $input['password'] : '';

        if (empty($email) || empty($password)) {
            $_SESSION['errors'] = ['auth' => 'Email and password are required'];
            $_SESSION['old_input'] = ['email' => $email];
            header('Location: /login');
            exit;
        }

        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            $_SESSION['errors'] = ['auth' => 'Invalid email or password'];
            $_SESSION['old_input'] = ['email' => $email];
            header('Location: /login');
            exit;
        }
        
        if (!$user->verifyPassword($password)) {
            $_SESSION['errors'] = ['auth' => 'Invalid email or password'];
            $_SESSION['old_input'] = ['email' => $email];
            header('Location: /login');
            exit;
        }

        $_SESSION = array();
        $_SESSION['user_id'] = $user->id;
        $_SESSION['username'] = $user->username;
        $_SESSION['discriminator'] = $user->discriminator;
        $_SESSION['avatar_url'] = $user->avatar_url;
        $_SESSION['banner_url'] = $user->banner_url;

        header('Location: /home');
        exit;
    }

    public function showRegister()
    {
        if ($this->isAuthenticated()) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->redirectResponse('/home');
            }

            if (!headers_sent()) {
                header('Location: /');
            }
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

        $_SESSION = array();
        
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        
        session_destroy();
        
        session_start();
        $_SESSION['fresh_login'] = true;
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            header('Pragma: no-cache');
            header('Expires: 0');
            return $this->success(['redirect' => '/login?fresh=1'], 'Logged out successfully');
        }

        if (!headers_sent()) {
            header('Location: /login?fresh=1');
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            header('Pragma: no-cache');
            header('Expires: 0');
        }
        exit;
    }

    public function showForgotPassword()
    {
        if ($this->isAuthenticated()) {
            return $this->redirectResponse('/home');
        }

        unset($_SESSION['security_question']);
        unset($_SESSION['reset_email']);
        unset($_SESSION['old_input']);
        unset($_SESSION['reset_token']);
        unset($_SESSION['reset_user_id']);
        
        session_write_close();
        session_start();

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
        if (!isset($_SESSION['reset_token']) || !isset($_SESSION['reset_email']) && !isset($_SESSION['reset_user_id'])) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->error('Invalid reset token', 400);
            }
            
            $_SESSION['errors'] = ['auth' => 'Invalid reset token'];
            if (!headers_sent()) {
                header('Location: /forgot-password');
            }
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
        $input = $this->sanitize($input);
        
        $password = $input['password'] ?? '';
        $passwordConfirm = $input['password_confirm'] ?? '';
        $token = $input['token'] ?? $_SESSION['reset_token'] ?? '';
        
        if (!isset($_SESSION['reset_token']) || $_SESSION['reset_token'] !== $token) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->error('Invalid reset token', 400);
            }
            
            $_SESSION['errors'] = ['auth' => 'Invalid reset token'];
            if (!headers_sent()) {
                header('Location: /forgot-password');
            }
            exit;
        }
        
        $errors = [];
        
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
        
        if (!empty($errors)) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->validationError($errors);
            }
            
            $_SESSION['errors'] = $errors;
            if (!headers_sent()) {
                header('Location: /reset-password');
            }
            exit;
        }
        
        $userId = $_SESSION['reset_user_id'] ?? null;
        $email = $_SESSION['reset_email'] ?? null;
        
        if ($userId) {
            $user = $this->userRepository->find($userId);
        } elseif ($email) {
            $user = $this->userRepository->findByEmail($email);
        } else {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->error('Invalid user identification', 400);
            }
            
            $_SESSION['errors'] = ['auth' => 'Invalid user identification'];
            if (!headers_sent()) {
                header('Location: /forgot-password');
            }
            exit;
        }
        
        if (!$user) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->error('User not found', 404);
            }
            
            $_SESSION['errors'] = ['auth' => 'User not found'];
            if (!headers_sent()) {
                header('Location: /forgot-password');
            }
            exit;
        }
        
        $this->userRepository->updatePassword($user->id, $password);
        
        unset($_SESSION['reset_token'], $_SESSION['reset_email'], $_SESSION['reset_user_id'], $_SESSION['security_question']);
        
        $_SESSION['success'] = 'Your password has been reset successfully. You can now log in with your new password.';
        
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success(['redirect' => '/login']);
        }
        
        if (!headers_sent()) {
            header('Location: /login');
        }
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
}
