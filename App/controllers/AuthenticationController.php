<?php

require_once __DIR__ . '/../database/models/User.php';

class AuthenticationController {
    /**
     * Constructor - ensure session is started and database is initialized
     */
    public function __construct() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        // Initialize database tables
        User::initialize();
    }
    
    /**
     * Display login page
     */
    public function showLogin() {
        // Check if user is already logged in
        if (isset($_SESSION['user_id'])) {
            header('Location: /');
            exit;
        }
        
        require_once __DIR__ . '/../views/pages/authentication-page.php';
    }
    
    /**
     * Process login
     */
    public function login() {
        // Validate input
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        $errors = [];
        
        if (empty($email)) {
            $errors['email'] = 'Email is required';
        }
        
        if (empty($password)) {
            $errors['password'] = 'Password is required';
        }
        
        // If validation fails, return to login with errors
        if (!empty($errors)) {
            $_SESSION['errors'] = $errors;
            $_SESSION['old_input'] = ['email' => $email];
            header('Location: /login');
            exit;
        }
        
        // Find user by email
        $user = User::findByEmail($email);
        
        // If user not found or password doesn't match
        if (!$user || !$user->verifyPassword($password)) {
            $_SESSION['errors'] = ['auth' => 'Invalid email or password'];
            $_SESSION['old_input'] = ['email' => $email];
            header('Location: /login');
            exit;
        }
        
        // Authentication successful
        $_SESSION['user_id'] = $user->id;
        $_SESSION['username'] = $user->username;
        $_SESSION['avatar_url'] = $user->avatar_url;
        
        // Update user status to online
        $user->status = 'online';
        $user->save();
        
        // Redirect to app/server page
        header('Location: /app');
        exit;
    }
    
    /**
     * Display registration page
     */
    public function showRegister() {
        // Check if user is already logged in
        if (isset($_SESSION['user_id'])) {
            header('Location: /');
            exit;
        }
        
        require_once __DIR__ . '/../views/pages/authentication-page.php';
    }
    
    /**
     * Process registration
     */
    public function register() {
        // Validate input
        $username = $_POST['username'] ?? '';
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        $password_confirm = $_POST['password_confirm'] ?? '';
        $errors = [];
        
        // Validation rules
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
        
        // If validation fails, return to registration with errors
        if (!empty($errors)) {
            $_SESSION['errors'] = $errors;
            $_SESSION['old_input'] = [
                'username' => $username,
                'email' => $email
            ];
            header('Location: /register');
            exit;
        }
        
        try {
            // Create new user
            $user = new User();
            $user->username = $username;
            $user->email = $email;
            $user->setPassword($password);
            $user->status = 'online';
            
            // Debug information - log the data being saved
            error_log("Attempting to save user: " . json_encode([
                'username' => $username,
                'email' => $email,
                'status' => 'online'
            ]));
            
            // Save with error handling
            if (!$user->save()) {
                error_log("Failed to save user - Save method returned false");
                throw new Exception("Failed to save user to database");
            }
            
            // Log successful registration
            error_log("User successfully registered: ID={$user->id}, Username={$user->username}");
            
            // Set success message
            $_SESSION['success'] = "Registration successful! Welcome to MiscVord, {$user->username}!";
            
            // Log in the user
            $_SESSION['user_id'] = $user->id;
            $_SESSION['username'] = $user->username;
            
            // Redirect to app/server page
            header('Location: /app');
            exit;
        } catch (Exception $e) {
            // Log the error with details
            error_log('Registration error: ' . $e->getMessage());
            error_log('Error details: ' . $e->getTraceAsString());
            
            // Set error message and return to registration
            $_SESSION['errors'] = [
                'auth' => 'Registration failed: ' . $e->getMessage(),
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
    
    /**
     * Process logout
     */
    public function logout() {
        // Update user status to offline
        if (isset($_SESSION['user_id'])) {
            $user = User::find($_SESSION['user_id']);
            if ($user) {
                $user->status = 'offline';
                $user->save();
            }
        }
        
        // Clear session and redirect
        session_unset();
        session_destroy();
        header('Location: /');
        exit;
    }
    
    /**
     * Display forgot password page
     */
    public function showForgotPassword() {
        // Check if user is already logged in
        if (isset($_SESSION['user_id'])) {
            header('Location: /');
            exit;
        }
        
        require_once __DIR__ . '/../views/pages/authentication-page.php';
    }
    
    /**
     * Process forgot password request
     */
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
            $_SESSION['errors'] = $errors;
            $_SESSION['old_input'] = ['email' => $email];
            header('Location: /forgot-password');
            exit;
        }
        
        // In a real app, we would send a password reset email here
        // For now, just show a success message
        
        $_SESSION['success'] = 'If an account exists with that email, you will receive password reset instructions.';
        header('Location: /login');
        exit;
    }
    
    /**
     * Process Google OAuth login/register
     * This is a simplified version of how OAuth might be implemented
     */
    public function googleAuth($googleData) {
        $googleId = $googleData['id'] ?? null;
        $email = $googleData['email'] ?? null;
        $name = $googleData['name'] ?? null;
        $avatar = $googleData['picture'] ?? null;
        
        if (!$googleId || !$email) {
            $_SESSION['errors'] = ['auth' => 'Unable to authenticate with Google'];
            header('Location: /login');
            exit;
        }
        
        // Check if user exists by Google ID
        $user = User::findByGoogleId($googleId);
        
        // If not found by Google ID, check by email
        if (!$user) {
            $user = User::findByEmail($email);
            
            // If user exists by email, update Google ID
            if ($user) {
                $user->google_id = $googleId;
                $user->avatar_url = $avatar;
                $user->save();
            } else {
                // Create new user
                $user = new User();
                $user->username = $name;
                $user->email = $email;
                $user->google_id = $googleId;
                $user->avatar_url = $avatar;
                $user->status = 'online';
                $user->save();
            }
        } else {
            // Update existing user's avatar if needed
            if ($user->avatar_url != $avatar) {
                $user->avatar_url = $avatar;
                $user->save();
            }
        }
        
        // Login user
        $_SESSION['user_id'] = $user->id;
        $_SESSION['username'] = $user->username;
        $_SESSION['avatar_url'] = $user->avatar_url;
        
        // Update user status to online
        $user->status = 'online';
        $user->save();
        
        // Redirect to app
        header('Location: /app');
        exit;
    }
}
