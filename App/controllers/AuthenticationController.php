<?php

require_once __DIR__ . '/../database/models/User.php';
require_once __DIR__ . '/BaseController.php';

class AuthenticationController extends BaseController {
    public function __construct() {
        parent::__construct();
        User::initialize();
    }

    public function showLogin() {
        if (isset($_SESSION['user_id'])) {

            if (!$this->isAjaxRequest()) {

                $redirect = $_GET['redirect'] ?? '/app';
                header('Location: ' . $redirect);
                exit;
            }

            return $this->redirectResponse('/app');
        }

        if (isset($_GET['redirect'])) {
            $_SESSION['login_redirect'] = $_GET['redirect'];
        }

        if (!$this->isAjaxRequest()) {
            require_once __DIR__ . '/../views/pages/authentication-page.php';
            return;
        }

        return $this->successResponse([
            'view' => 'login',
            'csrf_token' => $_SESSION['csrf_token'] ?? ''
        ]);
    }

    public function login() {
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        $errors = [];

        if (empty($email)) {
            $errors['email'] = 'Email is required';
        }

        if (empty($password)) {
            $errors['password'] = 'Password is required';
        }

        if (!empty($errors)) {
            if ($this->isAjaxRequest()) {
                return $this->validationError($errors);
            }

            $_SESSION['errors'] = $errors;
            $_SESSION['old_input'] = ['email' => $email];
            header('Location: /login');
            exit;
        }

        $user = User::findByEmail($email);

        if (!$user || !$user->verifyPassword($password)) {
            $loginError = ['auth' => 'Invalid email or password'];

            if ($this->isAjaxRequest()) {
                return $this->validationError($loginError);
            }

            $_SESSION['errors'] = $loginError;
            $_SESSION['old_input'] = ['email' => $email];
            header('Location: /login');
            exit;
        }

        $_SESSION['user_id'] = $user->id;
        $_SESSION['username'] = $user->username;
        $_SESSION['avatar_url'] = $user->avatar_url;

        $user->status = 'online';
        $user->save();

        $redirect = '/app';

        if (isset($_SESSION['pending_invite'])) {

            $redirect = '/join/' . $_SESSION['pending_invite'];
            unset($_SESSION['pending_invite']);
        } elseif (isset($_SESSION['login_redirect'])) {

            $redirect = $_SESSION['login_redirect'];
            unset($_SESSION['login_redirect']);
        }

        if ($this->isAjaxRequest()) {
            return $this->successResponse([
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

    public function showRegister() {
        if (isset($_SESSION['user_id'])) {
            if (!$this->isAjaxRequest()) {
                header('Location: /');
                exit;
            }

            return $this->redirectResponse('/app');
        }

        if (isset($_GET['redirect'])) {
            $_SESSION['login_redirect'] = $_GET['redirect'];
        }

        if (!$this->isAjaxRequest()) {
            require_once __DIR__ . '/../views/pages/authentication-page.php';
            return;
        }

        return $this->successResponse([
            'view' => 'register',
            'csrf_token' => $_SESSION['csrf_token'] ?? ''
        ]);
    }

    public function register() {
        $username = $_POST['username'] ?? '';
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        $password_confirm = $_POST['password_confirm'] ?? '';
        $errors = [];

        if (empty($username)) {
            $errors['username'] = 'Username is required';
        } elseif (strlen($username) < 3) {
            $errors['username'] = 'Username must be at least 3 characters';
        } elseif (User::findByUsername($username)) {
            $errors['username'] = 'Username already exists';
        }

        if (empty($email)) {
            $errors['email'] = 'Email is required';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Invalid email format';
        } elseif (User::findByEmail($email)) {
            $errors['email'] = 'Email already registered';
        }

        if (empty($password)) {
            $errors['password'] = 'Password is required';
        } elseif (strlen($password) < 6) {
            $errors['password'] = 'Password must be at least 6 characters';
        }

        if ($password !== $password_confirm) {
            $errors['password_confirm'] = 'Passwords do not match';
        }

        if (!empty($errors)) {
            if ($this->isAjaxRequest()) {
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

        try {
            $user = new User();
            $user->username = $username;
            $user->email = $email;
            $user->setPassword($password);
            $user->status = 'online';

            error_log("Attempting to save user: " . json_encode([
                'username' => $username,
                'email' => $email,
                'status' => 'online'
            ]));

            if (!$user->save()) {
                error_log("Failed to save user - Save method returned false");
                throw new Exception("Failed to save user to database");
            }

            error_log("User successfully registered: ID={$user->id}, Username={$user->username}");
            $_SESSION['success'] = "Registration successful! Welcome to misvord, {$user->username}!";
            $_SESSION['user_id'] = $user->id;
            $_SESSION['username'] = $user->username;

            $redirect = '/app';

            if (isset($_SESSION['pending_invite'])) {

                $redirect = '/join/' . $_SESSION['pending_invite'];
                unset($_SESSION['pending_invite']);
            } elseif (isset($_SESSION['login_redirect'])) {

                $redirect = $_SESSION['login_redirect'];
                unset($_SESSION['login_redirect']);
            }

            if ($this->isAjaxRequest()) {
                return $this->successResponse([
                    'user' => [
                        'id' => $user->id,
                        'username' => $user->username
                    ],
                    'redirect' => $redirect
                ], 'Registration successful');
            }

            header('Location: ' . $redirect);
            exit;
        } catch (Exception $e) {
            error_log('Registration error: ' . $e->getMessage());
            error_log('Error details: ' . $e->getTraceAsString());

            $errorMessage = 'Registration failed: ' . $e->getMessage();

            if ($this->isAjaxRequest()) {
                return $this->serverError($errorMessage);
            }

            $_SESSION['errors'] = [
                'auth' => $errorMessage,
                'debug_info' => 'See server logs for more details'
            ];
            $_SESSION['old_input'] = [
                'username' => $username,
                'email' => $email
            ];
            header('Location: /register');
            exit;
        }
    }

    public function logout() {
        if (isset($_SESSION['user_id'])) {
            $user = User::find($_SESSION['user_id']);
            if ($user) {
                $user->status = 'offline';
                $user->save();
            }
        }

        session_unset();
        session_destroy();

        if ($this->isAjaxRequest()) {
            return $this->successResponse(['redirect' => '/'], 'Logged out successfully');
        }

        header('Location: /');
        exit;
    }

    public function showForgotPassword() {
        if (isset($_SESSION['user_id'])) {
            if (!$this->isAjaxRequest()) {
                header('Location: /');
                exit;
            }

            return $this->redirectResponse('/app');
        }

        if (!$this->isAjaxRequest()) {
            require_once __DIR__ . '/../views/pages/authentication-page.php';
            return;
        }

        return $this->successResponse([
            'view' => 'forgot-password',
            'csrf_token' => $_SESSION['csrf_token'] ?? ''
        ]);
    }

    public function forgotPassword() {
        $email = $_POST['email'] ?? '';
        $errors = [];

        if (empty($email)) {
            $errors['email'] = 'Email is required';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Invalid email format';
        } elseif (!User::findByEmail($email)) {
            $errors['email'] = 'No account found with this email';
        }

        if (!empty($errors)) {
            if ($this->isAjaxRequest()) {
                return $this->validationError($errors);
            }

            $_SESSION['errors'] = $errors;
            $_SESSION['old_input'] = ['email' => $email];
            header('Location: /forgot-password');
            exit;
        }

        $message = 'If an account exists with that email, you will receive password reset instructions.';

        if ($this->isAjaxRequest()) {
            return $this->successResponse(['redirect' => '/login'], $message);
        }

        $_SESSION['success'] = $message;
        header('Location: /login');
        exit;
    }

    public function googleAuth($googleData) {
        $googleId = $googleData['id'] ?? null;
        $email = $googleData['email'] ?? null;
        $name = $googleData['name'] ?? null;
        $avatar = $googleData['picture'] ?? null;

        if (!$googleId || !$email) {
            $errorMessage = 'Unable to authenticate with Google';

            if ($this->isAjaxRequest()) {
                return $this->validationError(['auth' => $errorMessage]);
            }

            $_SESSION['errors'] = ['auth' => $errorMessage];
            header('Location: /login');
            exit;
        }

        $user = User::findByGoogleId($googleId);

        if (!$user) {
            $user = User::findByEmail($email);

            if ($user) {
                $user->google_id = $googleId;
                $user->avatar_url = $avatar;
                $user->save();
            } else {
                $user = new User();
                $user->username = $name;
                $user->email = $email;
                $user->google_id = $googleId;
                $user->avatar_url = $avatar;
                $user->status = 'online';
                $user->save();
            }
        } else {
            if ($user->avatar_url != $avatar) {
                $user->avatar_url = $avatar;
                $user->save();
            }
        }

        $_SESSION['user_id'] = $user->id;
        $_SESSION['username'] = $user->username;
        $_SESSION['avatar_url'] = $user->avatar_url;

        $user->status = 'online';
        $user->save();

        if ($this->isAjaxRequest()) {
            return $this->successResponse([
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'avatar_url' => $user->avatar_url
                ],
                'redirect' => '/app'
            ], 'Google authentication successful');
        }

        header('Location: /app');
        exit;
    }

    protected function isAjaxRequest() {
        return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
    }
}