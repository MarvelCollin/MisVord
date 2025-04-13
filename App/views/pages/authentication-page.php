<?php
// Start the session only if it hasn't been started already
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

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

// Get success messages
$success = $_SESSION['success'] ?? null;

// Clear session data after using it
unset($_SESSION['errors'], $_SESSION['old_input'], $_SESSION['success']);

// Set variables for the main layout
$page_title = ucfirst($mode) . ' - MiscVord';
$body_class = 'bg-[#202225] authentication-page overflow-hidden flex items-center justify-center min-h-screen';
$additional_head = '<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">';

// Link CSS and JS files
$page_css = 'authentication-page';
$page_js = 'authentication-page';

// Database connection and table initialization - capture output in debug info for "kowlin"
ob_start();
try {
    // Load database query class
    require_once dirname(dirname(__DIR__)) . '/database/query.php';
    
    // Load environment configuration
    require_once dirname(dirname(__DIR__)) . '/config/env.php';
    
    // Test database connection
    $env = EnvLoader::getEnv();
    $dsn = "mysql:host=" . EnvLoader::get('DB_HOST', 'localhost') . 
           ";dbname=" . EnvLoader::get('DB_NAME', 'misvord');
    
    // Display database connection parameters (for debugging only)
    echo '<div class="bg-blue-500 text-white p-3 rounded-md mb-6 text-left overflow-auto max-h-36">';
    echo '<strong>Database Connection Settings:</strong><br>';
    echo 'Host: ' . EnvLoader::get('DB_HOST', 'localhost') . '<br>';
    echo 'Database: ' . EnvLoader::get('DB_NAME', 'misvord') . '<br>'; 
    echo 'User: ' . EnvLoader::get('DB_USER', 'root') . '<br>';
    echo '</div>';
    
    // Try to connect using functions that properly handle cursors
    $pdo = EnvLoader::getPDOConnection();
    
    // Use a simple direct query to test connection
    $stmt = $pdo->query("SELECT 1 AS test_connection");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt->closeCursor(); // Important: close the cursor
    
    echo '<div class="bg-green-500 text-white p-3 rounded-md mb-6 text-center">
        Database connection successful! Server: ' . $pdo->getAttribute(PDO::ATTR_SERVER_VERSION) . '
    </div>';
    
    // Include User model and test table setup
    require_once dirname(dirname(__DIR__)) . '/database/models/User.php';
    $tableExists = User::createTable();
    
    echo '<div class="bg-green-500 text-white p-3 rounded-md mb-6 text-center">
        User table ' . ($tableExists ? 'exists' : 'creation attempted') . '!
    </div>';
    
} catch (PDOException $e) {
    echo '<div class="bg-red-500 text-white p-3 rounded-md mb-6 text-left overflow-auto max-h-64">';
    echo '<strong>Database Error:</strong><br>';
    echo 'Error Code: ' . $e->getCode() . '<br>';
    echo 'Message: ' . $e->getMessage() . '<br>';
    
    // Additional helpful hints based on common error codes
    switch ($e->getCode()) {
        case 1049:
            echo '<br><strong>Hint:</strong> Database "' . EnvLoader::get('DB_NAME', 'misvord') . '" does not exist. Create it using:<br>';
            echo '<code>CREATE DATABASE ' . EnvLoader::get('DB_NAME', 'misvord') . ';</code>';
            break;
        case 1045:
            echo '<br><strong>Hint:</strong> Access denied. Check username and password.';
            break;
        case 2002:
            echo '<br><strong>Hint:</strong> Cannot connect to MySQL server. Is it running?';
            break;
    }
    
    echo '</div>';
} catch (Exception $e) {
    echo '<div class="bg-red-500 text-white p-3 rounded-md mb-6 text-left overflow-auto max-h-64">';
    echo '<strong>General Error:</strong><br>';
    echo 'Type: ' . get_class($e) . '<br>';
    echo 'Message: ' . $e->getMessage() . '<br>';
    echo 'File: ' . $e->getFile() . ' (Line ' . $e->getLine() . ')<br>';
    echo '</div>';
}
// Store debug info instead of displaying it
$debugInfo = ob_get_clean();

// Store debug info in GLOBALS for access in the main-app.php template
// This will be shown only when "kowlin" keyword is typed
$GLOBALS['debugInfo'] = $debugInfo;

// Now actually initialize the database silently without output
try {
    // Just ensure database is initialized properly
    require_once dirname(dirname(__DIR__)) . '/database/query.php';
    require_once dirname(dirname(__DIR__)) . '/database/models/User.php';
    User::initialize();
} catch (Exception $e) {
    // Silent failure - we'll catch issues in the controller anyway
    error_log("Error initializing database: " . $e->getMessage());
}
?>

<!-- Define the content for the main layout -->
<?php ob_start(); ?>

<!-- Full-height container with proper centering -->
<div class="w-full p-4 min-h-screen flex items-center justify-center bg-[#202225]">
    <!-- Auth Container with Glass Effect -->
    <div class="w-full max-w-md p-8 mx-auto rounded-xl shadow-2xl relative z-10 glass-hero transform transition-all duration-700 ease-out bg-[#2f3136]/80 backdrop-filter backdrop-blur-md border border-white/10" id="authContainer">
        <!-- Logo with modern animation -->
        <div class="flex justify-center mb-8 relative">
            <img src="<?php echo asset('/landing-page/main-logo.png'); ?>" alt="MiscVord Logo" class="h-12 transition-all" id="logo">
            <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-discord-blue to-discord-pink w-0" id="logoUnderline"></div>
        </div>
        
        <!-- Page Title with modern transition -->
        <h1 class="text-2xl font-bold text-center mb-8 text-white" id="authTitle">
            <?php if ($mode === 'login'): ?>
                <span>Welcome back!</span>
            <?php elseif ($mode === 'register'): ?>
                <span>Create an account</span>
            <?php else: ?>
                <span>Reset Password</span>
            <?php endif; ?>
        </h1>
        
        <!-- Success Message (if any) -->
        <?php if (isset($success)): ?>
            <div class="bg-green-500 text-white p-3 rounded-md mb-6 text-center animate-pulse">
                <?php echo $success; ?>
            </div>
        <?php endif; ?>
        
        <!-- General Auth Error -->
        <?php if (isset($errors['auth'])): ?>
            <div class="bg-red-500 text-white p-3 rounded-md mb-6 text-center animate-pulse">
                <?php echo $errors['auth']; ?>
            </div>
        <?php endif; ?>
        
        <!-- Form Container with modern transitions -->
        <div id="formsContainer" class="relative transition-all duration-300 ease-out" style="min-height: 250px;">
            <!-- LOGIN FORM -->
            <form action="/login" method="POST" class="space-y-5 <?php echo $mode === 'login' ? 'block' : 'hidden'; ?>" id="loginForm">
                <!-- Email Field -->
                <div class="form-group">
                    <label for="email" class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                        value="<?php echo $oldInput['email'] ?? ''; ?>" 
                        required
                    >
                    <?php if (isset($errors['email'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['email']; ?></p>
                    <?php endif; ?>
                </div>
                
                <!-- Password Field -->
                <div class="form-group">
                    <label for="password" class="block text-sm font-medium text-gray-300 mb-1">Password</label>
                    <div class="relative">
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                            required
                        >
                        <button type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors password-toggle">
                            👁️
                        </button>
                    </div>
                    <?php if (isset($errors['password'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['password']; ?></p>
                    <?php endif; ?>
                </div>
                
                <!-- Forgot Password Link - Update to use data-form attribute -->
                <div class="text-right">
                    <a href="#" class="text-sm text-discord-blue hover:underline form-toggle" data-form="forgot">Forgot your password?</a>
                </div>
                
                <!-- Submit Button -->
                <button type="submit" class="w-full py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all">
                    Log In
                </button>
                
                <!-- OAuth Divider -->
                <div class="flex items-center my-5">
                    <div class="flex-1 h-px bg-gray-600/50"></div>
                    <div class="mx-4 text-sm text-gray-400">OR</div>
                    <div class="flex-1 h-px bg-gray-600/50"></div>
                </div>
                
                <!-- Google Login Button -->
                <a href="/auth/google" class="w-full py-2.5 bg-white text-gray-800 font-medium rounded-md flex items-center justify-center hover:bg-gray-100 transition-all">
                    <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,15.64 16.96,17.27 14.36,17.27C11.16,17.27 8.53,14.71 8.53,11.53C8.53,8.36 11.16,5.79 14.36,5.79C16.0, 5.79 17.34,6.47 18.27,7.29L20.37,5.23C18.88,3.86 16.83,3 14.36,3C9.92,3 6.27,6.61 6.27,11.53C6.27,16.45 9.92,20.06 14.36,20.06C18.69,20.06 22.25,17.06 22.25,11.78C22.25,11.45 22.24,11.29 22.21,11.1H21.35Z" />
                    </svg>
                    Continue with Google
                </a>
                
                <!-- Register Link - Changed to use data-form attribute instead of href -->
                <div class="text-center mt-6">
                    <p class="text-gray-400 text-sm">
                        Need an account? 
                        <a href="#" class="text-discord-blue hover:underline form-toggle" data-form="register">Register</a>
                    </p>
                </div>
            </form>
        
            <!-- REGISTRATION FORM -->
            <form action="/register" method="POST" class="space-y-5 <?php echo $mode === 'register' ? 'block' : 'hidden'; ?>" id="registerForm">
                <!-- Username Field -->
                <div class="form-group">
                    <label for="username" class="block text-sm font-medium text-gray-300 mb-1">Username</label>
                    <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                        value="<?php echo $oldInput['username'] ?? ''; ?>" 
                        required
                    >
                    <?php if (isset($errors['username'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['username']; ?></p>
                    <?php endif; ?>
                </div>
                
                <!-- Email Field -->
                <div class="form-group">
                    <label for="reg_email" class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input 
                        type="email" 
                        id="reg_email" 
                        name="email" 
                        class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                        value="<?php echo $oldInput['email'] ?? ''; ?>" 
                        required
                    >
                    <?php if (isset($errors['email'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['email']; ?></p>
                    <?php endif; ?>
                </div>
                
                <!-- Password Field -->
                <div class="form-group">
                    <label for="reg_password" class="block text-sm font-medium text-gray-300 mb-1">Password</label>
                    <div class="relative">
                        <input 
                            type="password" 
                            id="reg_password" 
                            name="password" 
                            class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                            required
                        >
                        <button type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors password-toggle">
                            👁️
                        </button>
                    </div>
                    <?php if (isset($errors['password'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['password']; ?></p>
                    <?php endif; ?>
                    <div class="mt-1 h-1 bg-gray-700 rounded hidden" id="passwordStrength">
                        <div class="h-full bg-discord-blue rounded" style="width: 0%"></div>
                    </div>
                </div>
                
                <!-- Confirm Password Field -->
                <div class="form-group">
                    <label for="password_confirm" class="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                    <div class="relative">
                        <input 
                            type="password" 
                            id="password_confirm" 
                            name="password_confirm" 
                            class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                            required
                        >
                        <button type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors password-toggle">
                            👁️
                        </button>
                    </div>
                    <?php if (isset($errors['password_confirm'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['password_confirm']; ?></p>
                    <?php endif; ?>
                    <div class="text-green-500 text-xs mt-1 hidden" id="passwordsMatch">Passwords match ✓</div>
                </div>
                
                <!-- Submit Button -->
                <button type="submit" class="w-full py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all">
                    Register
                </button>
                
                <!-- OAuth Divider -->
                <div class="flex items-center my-5">
                    <div class="flex-1 h-px bg-gray-600/50"></div>
                    <div class="mx-4 text-sm text-gray-400">OR</div>
                    <div class="flex-1 h-px bg-gray-600/50"></div>
                </div>
                
                <!-- Google Registration Button -->
                <a href="/auth/google" class="w-full py-2.5 bg-white text-gray-800 font-medium rounded-md flex items-center justify-center hover:bg-gray-100 transition-all">
                    <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,15.64 16.96,17.27 14.36,17.27C11.16,17.27 8.53,14.71 8.53,11.53C8.53,8.36 11.16,5.79 14.36,5.79C16.0, 5.79 17.34,6.47 18.27,7.29L20.37,5.23C18.88,3.86 16.83,3 14.36,3C9.92,3 6.27,6.61 6.27,11.53C6.27,16.45 9.92,20.06 14.36,20.06C18.69,20.06 22.25,17.06 22.25,11.78C22.25,11.45 22.24,11.29 22.21,11.1H21.35Z" />
                    </svg>
                    Sign up with Google
                </a>
                
                <!-- Login Link - Changed to use data-form attribute instead of href -->
                <div class="text-center mt-6">
                    <p class="text-gray-400 text-sm">
                        Already have an account? 
                        <a href="#" class="text-discord-blue hover:underline form-toggle" data-form="login">Log In</a>
                    </p>
                </div>
            </form>
                
            <!-- FORGOT PASSWORD FORM -->
            <form action="/forgot-password" method="POST" class="space-y-5 <?php echo $mode === 'forgot-password' ? 'block' : 'hidden'; ?>" id="forgotForm">
                <p class="text-gray-300 text-sm mb-6">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
                
                <!-- Email Field -->
                <div class="form-group">
                    <label for="forgot_email" class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input 
                        type="email" 
                        id="forgot_email" 
                        name="email" 
                        class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                        value="<?php echo $oldInput['email'] ?? ''; ?>" 
                        required
                    >
                    <?php if (isset($errors['email'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['email']; ?></p>
                    <?php endif; ?>
                </div>
                
                <!-- Submit Button -->
                <button type="submit" class="w-full py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all">
                    Send Reset Link
                </button>
                
                <!-- Back to Login Link - Changed to use data-form attribute instead of href -->
                <div class="text-center mt-6">
                    <a href="#" class="text-discord-blue hover:underline text-sm form-toggle" data-form="login">Back to Login</a>
                </div>
            </form>
        </div>
    </div>
</div>

<?php 
// Get the content and clean the buffer
$content = ob_get_clean(); 

// Include the main layout with our content
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>
