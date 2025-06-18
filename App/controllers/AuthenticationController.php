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
        if ($this->isAuthenticated()) {
            $redirect = $_GET['redirect'] ?? '/app';            if ($this->isApiRoute() || $this->isAjaxRequest()) {
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
        $input = $this->getInput();
        $input = $this->sanitize($input);

        $this->validate($input, [
            'email' => 'required',
            'password' => 'required'
        ]);
        $email = $input['email'];
        $password = $input['password'];        $user = $this->userRepository->findByEmail($email);
        
        if ($user) {
            error_log("DEBUG: User found - ID: " . $user->id . ", Email: " . $user->email);
            error_log("DEBUG: User password field: " . ($user->password ? 'NOT EMPTY' : 'EMPTY'));
            error_log("DEBUG: User password hash: " . substr($user->password ?? 'NULL', 0, 20) . "...");
            error_log("DEBUG: Password verification result: " . ($user->verifyPassword($password) ? 'TRUE' : 'FALSE'));
        } else {
            error_log("DEBUG: No user found with email: " . $email);
        }
        
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
        }

        $_SESSION['user_id'] = $user->id;
        $_SESSION['username'] = $user->username;
        $_SESSION['avatar_url'] = $user->avatar_url;

        $user->status = 'online';
        $user->save();

        $this->logActivity('login_success', ['user_id' => $user->id]);

        $redirect = $this->getRedirectUrl();        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success([
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'avatar_url' => $user->avatar_url
                ],
                'redirect' => $redirect
            ], 'Login successful');
        }

        if (!headers_sent()) {
            header('Location: ' . $redirect);
        }
        exit;
    }

    public function showRegister()
    {
        // Redirect if already authenticated
        if ($this->isAuthenticated()) {            if ($this->isApiRoute() || $this->isAjaxRequest()) {
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
            }            $_SESSION['errors'] = $errors;
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
            $user->status = 'online';

            $this->logActivity('registration_attempt', ['username' => $username, 'email' => $email]);

            if ($user->save()) {
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
                        'redirect' => $redirect                    ], 'Registration successful');
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
            }            $_SESSION['errors'] = ['general' => $errorMessage];
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
        if ($userId) {
            try {
                $user = $this->userRepository->find($userId);
                if ($user) {
                    $user->status = 'offline';
                    $user->save();
                }
            } catch (Exception $e) {
                $this->logActivity('logout_error', ['error' => $e->getMessage()]);
            }
        }

        $this->logActivity('logout', ['user_id' => $userId]);

        session_destroy();        if ($this->isApiRoute() || $this->isAjaxRequest()) {
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
            }            $_SESSION['errors'] = ['email' => 'Invalid email format'];
            if (!headers_sent()) {
                header('Location: /forgot-password');
            }
            exit;
        }

        $message = 'If an account with that email exists, you will receive password reset instructions.';

        if ($this->isApiRoute() || $this->isAjaxRequest()) {
            return $this->success(['redirect' => '/login'], $message);
        }        $_SESSION['success'] = $message;
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

            if (!$email || !$googleId) {                if ($this->isApiRoute() || $this->isAjaxRequest()) {
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
                $user->google_id = $googleId;
                $user->status = 'online';
                $user->save();

                $this->logActivity('google_registration', ['user_id' => $user->id, 'email' => $email]);
            } else {
                $user->google_id = $googleId;
                $user->status = 'online';
                $user->save();

                $this->logActivity('google_login', ['user_id' => $user->id]);
            }

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
                ], 'Google authentication successful');            }

            if (!headers_sent()) {
                header('Location: ' . $redirect);
            }
            exit;
        } catch (Exception $e) {
            $this->logActivity('google_auth_error', ['error' => $e->getMessage()]);

            if ($this->isApiRoute() || $this->isAjaxRequest()) {
                return $this->serverError('Google authentication failed');
            }            $_SESSION['errors'] = ['auth' => 'Google authentication failed'];
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
