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

        if ($this->isAuthenticated()) {
            $redirect = $_GET['redirect'] ?? '/app';

            if (function_exists('logger')) {
                logger()->debug("User already authenticated, redirecting", [
                    'redirect_to' => $redirect,
                    'user_id' => $_SESSION['user_id'] ?? 'not_set'
                ]);
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
        if (function_exists('logger')) {
            logger()->debug("login method called", [
                'session_status' => session_status(),
                'is_authenticated' => $this->isAuthenticated(),
                'user_id' => $_SESSION['user_id'] ?? 'not_set',
                'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
            ]);
        }

        if ($this->isAuthenticated()) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->redirectResponse('/app');
            }

            exit;
        }

        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, [
            'email' => 'required',
            'password' => 'required'
        ]);

        $email = $input['email'];
        $password = $input['password'];

        $user = $this->userRepository->findByEmail($email);

        if (!$user || !$user->verifyPassword($password)) {
            $this->logActivity('login_failed', ['email' => $email]);

            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->error('Invalid email or password', 401);
            }

            $_SESSION['errors'] = ['auth' => 'Invalid email or password'];
            $_SESSION['old_input'] = ['email' => $email];
            
            // Make sure session is written before redirect
            session_write_close();
            session_start();
            
            if (!headers_sent()) {
                header('Location: /login');
                header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            }
            exit;
        }
        if (function_exists('logger')) {
            logger()->debug("User object before setting session", [
                'user_id' => $user->id,
                'user_username' => $user->username,
                'user_discriminator' => $user->discriminator,
                'user_avatar_url' => $user->avatar_url,
                'user_class' => get_class($user),
                'user_reflection' => (function ($obj) {
                    try {
                        $reflection = new ReflectionClass($obj);
                        $properties = [];
                        foreach ($reflection->getProperties() as $prop) {
                            $prop->setAccessible(true);
                            $properties[$prop->getName()] = $prop->getValue($obj);
                        }
                        return $properties;
                    } catch (Exception $e) {
                        return 'Error: ' . $e->getMessage();
                    }
                })($user)
            ]);
        }

        $_SESSION['user_id'] = $user->id;
        $_SESSION['username'] = $user->username;
        $_SESSION['discriminator'] = $user->discriminator;
        $_SESSION['avatar_url'] = $user->avatar_url;
        $_SESSION['banner_url'] = $user->banner_url;

        if (function_exists('logger')) {
            logger()->debug("Session variables set after login", [
                'user_id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'session_id' => session_id(),
                'is_authenticated' => isset($_SESSION['user_id']) && !empty($_SESSION['user_id'])
            ]);
        }
        
        session_write_close();
        
        session_start();
        
        if (function_exists('logger')) {
            logger()->debug("Session after write_close and restart", [
                'user_id' => $_SESSION['user_id'] ?? 'not_set',
                'is_authenticated' => isset($_SESSION['user_id']) && !empty($_SESSION['user_id']),
                'session_status' => session_status()
            ]);
        }

        $this->logActivity('login_success', ['user_id' => $user->id]);

        $redirect = $this->getRedirectUrl();
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'discriminator' => $user->discriminator,
                    'avatar_url' => $user->avatar_url,
                    'banner_url' => $user->banner_url
                ],
                'redirect' => $redirect
            ], 'Login successful');
        }

        if (!headers_sent()) {
            header('Location: ' . $redirect);
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            header('Cache-Control: post-check=0, pre-check=0', false);
            header('Pragma: no-cache');
        }
        exit;
    }

    public function showRegister()
    {
        if ($this->isAuthenticated()) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->redirectResponse('/app');
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
        
        // Debug incoming data
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
            'password' => password_hash($password, PASSWORD_DEFAULT),
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

                $redirect = $this->getRedirectUrl();

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

        session_destroy();
        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success(['redirect' => '/'], 'Logged out successfully');
        }

        if (!headers_sent()) {
            header('Location: /');
        }
        exit;
    }

    public function showForgotPassword()
    {
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

    public function forgotPassword()
    {
        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, ['email' => 'required']);

        $email = $input['email'];

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->validationError(['email' => 'Invalid email format']);
            }
            $_SESSION['errors'] = ['email' => 'Invalid email format'];
            if (!headers_sent()) {
                header('Location: /forgot-password');
            }
            exit;
        }

        $message = 'If an account with that email exists, you will receive password reset instructions.';

        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success(['redirect' => '/login'], $message);
        }
        $_SESSION['success'] = $message;
        if (!headers_sent()) {
            header('Location: /login');
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

            $redirect = $this->getRedirectUrl();
            
            // If no security question is set, redirect to security question page
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
                
                $redirect = $this->getRedirectUrl();
                
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
