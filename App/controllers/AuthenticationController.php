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
        // Debug session state
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
            if (!headers_sent()) {
                header('Location: /login');
            }
            exit;
        }        // Set session variables after successful authentication
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

        // Debug session after setting
        if (function_exists('logger')) {
            logger()->debug("Session variables set after login", [
                'user_id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'session_id' => session_id(),
                'is_authenticated' => isset($_SESSION['user_id']) && !empty($_SESSION['user_id'])
            ]);
        }
        
        // Ensure session is written to storage
        session_write_close();
        
        // Start session again to verify data was saved
        session_start();
        
        // Debug session after write_close and restart
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
                    'avatar_url' => $user->avatar_url
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

        $errors = [];
        if (strlen($username) < 3) {
            $errors['username'] = 'Username must be at least 3 characters';
        } elseif ($this->userRepository->findByUsername($username)) {
            $errors['username'] = 'Username already exists';
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Invalid email format';
        } elseif ($this->userRepository->findByEmail($email)) {
            $errors['email'] = 'Email already registered';
        }

        if (strlen($password) < 6) {
            $errors['password'] = 'Password must be at least 6 characters';
        }

        if ($password !== $passwordConfirm) {
            $errors['password_confirm'] = 'Passwords do not match';
        }

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
            if (!headers_sent()) {
                header('Location: /register');
            }
            exit;
        }

        try {
            $user = new User();
            $user->username = $username;
            $user->email = $email;
            $user->setPassword($password);
            $user->discriminator = User::generateDiscriminator();

            $this->logActivity('registration_attempt', ['username' => $username, 'email' => $email]);

            if ($user->save()) {
                $_SESSION['user_id'] = $user->id;
                $_SESSION['username'] = $user->username;
                $_SESSION['discriminator'] = $user->discriminator;
                $_SESSION['avatar_url'] = $user->avatar_url;

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
                'email' => $email
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
}
