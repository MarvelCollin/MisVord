<?php
// Start the session at the beginning of the file
session_start();

// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

// Initialize variables
$mode = 'login'; // Default mode
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Determine current mode based on URL
if ($path === '/register') {
    $mode = 'register';
} elseif ($path === '/forgot-password') {
    $mode = 'forgot-password';
}

// Get errors and old input from session
$errors = $_SESSION['errors'] ?? [];
$oldInput = $_SESSION['old_input'] ?? [];

// Clear session data after using it
unset($_SESSION['errors'], $_SESSION['old_input']);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo ucfirst($mode); ?> - MiscVord</title>
    
    <!-- Tailwind CSS via CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <style>
        :root {
            --discord-primary: #36393f;
            --discord-secondary: #2f3136;
            --discord-tertiary: #202225;
            --discord-accent: #5865f2;
        }
        
        body {
            background-color: var(--discord-tertiary);
            color: #fff;
            font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        
        .auth-container {
            background-color: var(--discord-secondary);
            border-radius: 5px;
            box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.2);
        }
        
        .input-field {
            background-color: var(--discord-tertiary);
            color: #fff;
            border: 1px solid #202225;
            border-radius: 3px;
            transition: border-color 0.2s;
            padding: 10px;
        }
        
        .input-field:focus {
            border-color: var(--discord-accent);
            outline: none;
        }
        
        .btn-primary {
            background-color: var(--discord-accent);
            transition: background-color 0.2s;
        }
        
        .btn-primary:hover {
            background-color: #4752c4;
        }
        
        .error-text {
            color: #ed4245;
            font-size: 12px;
            margin-top: 4px;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        .form-label {
            display: block;
            margin-bottom: 8px;
            font-size: 12px;
            font-weight: 600;
            color: #b9bbbe;
            text-transform: uppercase;
        }
        
        .auth-switch {
            color: var(--discord-accent);
            cursor: pointer;
            text-decoration: none;
        }
        
        .auth-switch:hover {
            text-decoration: underline;
        }
        
        .icon-google {
            width: 18px;
            height: 18px;
            margin-right: 8px;
        }
        
        .btn-google {
            background-color: #fff;
            color: #333;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
        }
        
        .btn-google:hover {
            background-color: #f5f5f5;
        }
        
        .divider {
            display: flex;
            align-items: center;
            margin: 20px 0;
        }
        
        .divider-line {
            flex-grow: 1;
            height: 1px;
            background-color: #4f545c;
        }
        
        .divider-text {
            margin: 0 10px;
            color: #b9bbbe;
            font-size: 14px;
        }
        
        .success-message {
            background-color: #43b581;
            color: white;
            padding: 10px;
            border-radius: 3px;
            margin-bottom: 16px;
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
    <div class="auth-container w-full max-w-md p-6">
        <!-- Logo -->
        <div class="flex justify-center mb-6">
            <img src="<?php echo asset('/landing-page/main-logo.svg'); ?>" alt="MiscVord Logo" class="h-12">
        </div>
        
        <!-- Page Title -->
        <h1 class="text-2xl font-bold text-center mb-6">
            <?php if ($mode === 'login'): ?>
                Welcome back!
            <?php elseif ($mode === 'register'): ?>
                Create an account
            <?php else: ?>
                Reset Password
            <?php endif; ?>
        </h1>
        
        <!-- Success Message (if any) -->
        <?php if (isset($_SESSION['success'])): ?>
            <div class="success-message">
                <?php echo $_SESSION['success']; unset($_SESSION['success']); ?>
            </div>
        <?php endif; ?>
        
        <!-- General Auth Error -->
        <?php if (isset($errors['auth'])): ?>
            <div class="error-text text-center mb-4">
                <?php echo $errors['auth']; ?>
            </div>
        <?php endif; ?>
        
        <!-- LOGIN FORM -->
        <?php if ($mode === 'login'): ?>
            <form action="/login" method="POST" class="space-y-4">
                <!-- Email Field -->
                <div class="form-group">
                    <label for="email" class="form-label">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        class="input-field w-full" 
                        value="<?php echo $oldInput['email'] ?? ''; ?>" 
                        required
                    >
                    <?php if (isset($errors['email'])): ?>
                        <p class="error-text"><?php echo $errors['email']; ?></p>
                    <?php endif; ?>
                </div>
                
                <!-- Password Field -->
                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        class="input-field w-full" 
                        required
                    >
                    <?php if (isset($errors['password'])): ?>
                        <p class="error-text"><?php echo $errors['password']; ?></p>
                    <?php endif; ?>
                </div>
                
                <!-- Forgot Password Link -->
                <div class="text-right">
                    <a href="/forgot-password" class="auth-switch text-sm">Forgot your password?</a>
                </div>
                
                <!-- Submit Button -->
                <button type="submit" class="btn-primary w-full py-2 rounded font-medium">
                    Log In
                </button>
                
                <!-- OAuth Divider -->
                <div class="divider">
                    <div class="divider-line"></div>
                    <div class="divider-text">OR</div>
                    <div class="divider-line"></div>
                </div>
                
                <!-- Google Login Button -->
                <a href="/auth/google" class="btn-google w-full py-2 rounded font-medium flex justify-center">
                    <svg class="icon-google" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,15.64 16.96,17.27 14.36,17.27C11.16,17.27 8.53,14.71 8.53,11.53C8.53,8.36 11.16,5.79 14.36,5.79C16.0, 5.79 17.34,6.47 18.27,7.29L20.37,5.23C18.88,3.86 16.83,3 14.36,3C9.92,3 6.27,6.61 6.27,11.53C6.27,16.45 9.92,20.06 14.36,20.06C18.69,20.06 22.25,17.06 22.25,11.78C22.25,11.45 22.24,11.29 22.21,11.1H21.35Z" />
                    </svg>
                    Continue with Google
                </a>
                
                <!-- Register Link -->
                <div class="text-center mt-4">
                    <p class="text-gray-400 text-sm">
                        Need an account? 
                        <a href="/register" class="auth-switch">Register</a>
                    </p>
                </div>
            </form>
        
        <!-- REGISTRATION FORM -->
        <?php elseif ($mode === 'register'): ?>
            <form action="/register" method="POST" class="space-y-4">
                <!-- Username Field -->
                <div class="form-group">
                    <label for="username" class="form-label">Username</label>
                    <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        class="input-field w-full" 
                        value="<?php echo $oldInput['username'] ?? ''; ?>" 
                        required
                    >
                    <?php if (isset($errors['username'])): ?>
                        <p class="error-text"><?php echo $errors['username']; ?></p>
                    <?php endif; ?>
                </div>
                
                <!-- Email Field -->
                <div class="form-group">
                    <label for="email" class="form-label">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        class="input-field w-full" 
                        value="<?php echo $oldInput['email'] ?? ''; ?>" 
                        required
                    >
                    <?php if (isset($errors['email'])): ?>
                        <p class="error-text"><?php echo $errors['email']; ?></p>
                    <?php endif; ?>
                </div>
                
                <!-- Password Field -->
                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        class="input-field w-full" 
                        required
                    >
                    <?php if (isset($errors['password'])): ?>
                        <p class="error-text"><?php echo $errors['password']; ?></p>
                    <?php endif; ?>
                </div>
                
                <!-- Confirm Password Field -->
                <div class="form-group">
                    <label for="password_confirm" class="form-label">Confirm Password</label>
                    <input 
                        type="password" 
                        id="password_confirm" 
                        name="password_confirm" 
                        class="input-field w-full" 
                        required
                    >
                    <?php if (isset($errors['password_confirm'])): ?>
                        <p class="error-text"><?php echo $errors['password_confirm']; ?></p>
                    <?php endif; ?>
                </div>
                
                <!-- Submit Button -->
                <button type="submit" class="btn-primary w-full py-2 rounded font-medium">
                    Register
                </button>
                
                <!-- OAuth Divider -->
                <div class="divider">
                    <div class="divider-line"></div>
                    <div class="divider-text">OR</div>
                    <div class="divider-line"></div>
                </div>
                
                <!-- Google Registration Button -->
                <a href="/auth/google" class="btn-google w-full py-2 rounded font-medium flex justify-center">
                    <svg class="icon-google" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,15.64 16.96,17.27 14.36,17.27C11.16,17.27 8.53,14.71 8.53,11.53C8.53,8.36 11.16,5.79 14.36,5.79C16.0, 5.79 17.34,6.47 18.27,7.29L20.37,5.23C18.88,3.86 16.83,3 14.36,3C9.92,3 6.27,6.61 6.27,11.53C6.27,16.45 9.92,20.06 14.36,20.06C18.69,20.06 22.25,17.06 22.25,11.78C22.25,11.45 22.24,11.29 22.21,11.1H21.35Z" />
                    </svg>
                    Sign up with Google
                </a>
                
                <!-- Login Link -->
                <div class="text-center mt-4">
                    <p class="text-gray-400 text-sm">
                        Already have an account? 
                        <a href="/login" class="auth-switch">Log In</a>
                    </p>
                </div>
            </form>
            
        <!-- FORGOT PASSWORD FORM -->
        <?php else: ?>
            <form action="/forgot-password" method="POST" class="space-y-4">
                <p class="text-gray-300 text-sm mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
                
                <!-- Email Field -->
                <div class="form-group">
                    <label for="email" class="form-label">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        class="input-field w-full" 
                        value="<?php echo $oldInput['email'] ?? ''; ?>" 
                        required
                    >
                    <?php if (isset($errors['email'])): ?>
                        <p class="error-text"><?php echo $errors['email']; ?></p>
                    <?php endif; ?>
                </div>
                
                <!-- Submit Button -->
                <button type="submit" class="btn-primary w-full py-2 rounded font-medium">
                    Send Reset Link
                </button>
                
                <!-- Back to Login Link -->
                <div class="text-center mt-4">
                    <a href="/login" class="auth-switch text-sm">Back to Login</a>
                </div>
            </form>
        <?php endif; ?>
        
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Focus the first input field when page loads
            const firstInput = document.querySelector('form input:first-of-type');
            if (firstInput) {
                firstInput.focus();
            }
            
            // Add password visibility toggle functionality
            const passwordFields = document.querySelectorAll('input[type="password"]');
            passwordFields.forEach(field => {
                const wrapper = document.createElement('div');
                wrapper.className = 'relative';
                
                const toggle = document.createElement('button');
                toggle.type = 'button';
                toggle.innerHTML = '👁️';
                toggle.className = 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400';
                toggle.style.cursor = 'pointer';
                
                field.parentNode.insertBefore(wrapper, field);
                wrapper.appendChild(field);
                wrapper.appendChild(toggle);
                
                toggle.addEventListener('click', function() {
                    if (field.type === 'password') {
                        field.type = 'text';
                        toggle.innerHTML = '🔒';
                    } else {
                        field.type = 'password';
                        toggle.innerHTML = '👁️';
                    }
                });
            });
        });
    </script>
</body>
</html>
