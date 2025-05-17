<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}


$mode = 'login'; 
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);


if ($path === '/register') {
    $mode = 'register';
} elseif ($path === '/forgot-password') {
    $mode = 'forgot-password';
}


$errors = $_SESSION['errors'] ?? [];
$oldInput = $_SESSION['old_input'] ?? [];


$success = $_SESSION['success'] ?? null;


unset($_SESSION['errors'], $_SESSION['old_input'], $_SESSION['success']);


$page_title = ucfirst($mode) . ' - MiscVord';
$body_class = 'bg-[#202225] authentication-page overflow-hidden flex items-center justify-center min-h-screen';
$additional_head = '<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">';


$page_css = 'authentication-page';
$page_js = 'authentication-page';


ob_start();
try {
    
    require_once dirname(dirname(__DIR__)) . '/database/query.php';
    
    
    require_once dirname(dirname(__DIR__)) . '/config/env.php';
    
    
    $env = EnvLoader::getEnv();
    $dbHost = EnvLoader::get('DB_HOST', 'db');
    $dsn = "mysql:host=" . $dbHost . 
           ";dbname=" . EnvLoader::get('DB_NAME', 'misvord');
    
    
    echo '<div class="bg-blue-500 text-white p-3 rounded-md mb-6 text-left overflow-auto max-h-36">';
    echo '<strong>Database Connection Settings:</strong><br>';
    echo 'Host: ' . $dbHost . '<br>';
    echo 'Database: ' . EnvLoader::get('DB_NAME', 'misvord') . '<br>'; 
    echo 'User: ' . EnvLoader::get('DB_USER', 'root') . '<br>';
    echo '</div>';
    
    
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO(
        $dsn, 
        EnvLoader::get('DB_USER', 'root'), 
        EnvLoader::get('DB_PASS', 'MiscVord_secure_2023'),
        $options
    );
    
    
    $stmt = $pdo->query("SELECT 1 AS test_connection");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt->closeCursor(); 
    
    echo '<div class="bg-green-500 text-white p-3 rounded-md mb-6 text-center">
        Database connection successful! Server: ' . $pdo->getAttribute(PDO::ATTR_SERVER_VERSION) . '
    </div>';
    
    
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

$debugInfo = ob_get_clean();



$GLOBALS['debugInfo'] = $debugInfo;


try {
    
    require_once dirname(dirname(__DIR__)) . '/database/query.php';
    require_once dirname(dirname(__DIR__)) . '/database/models/User.php';
    User::initialize();
} catch (Exception $e) {
    
    error_log("Error initializing database: " . $e->getMessage());
}
?>


<?php ob_start(); ?>

<div class="w-full p-4 min-h-screen flex items-center justify-center bg-[#202225]">
    
    <div class="w-full max-w-md p-8 mx-auto rounded-xl shadow-2xl relative z-10 glass-hero transform transition-all duration-700 ease-out bg-[#2f3136]/80 backdrop-filter backdrop-blur-md border border-white/10" id="authContainer">
        
        <div class="flex justify-center mb-8 relative">
            <img src="<?php echo asset('/landing-page/main-logo.png'); ?>" alt="MiscVord Logo" class="h-12 transition-all" id="logo">
            <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-discord-blue to-discord-pink w-0" id="logoUnderline"></div>
        </div>
        
        
        <h1 class="text-2xl font-bold text-center mb-8 text-white" id="authTitle">
            <?php if ($mode === 'login'): ?>
                <span>Welcome back!</span>
            <?php elseif ($mode === 'register'): ?>
                <span>Create an account</span>
            <?php else: ?>
                <span>Reset Password</span>
            <?php endif; ?>
        </h1>
        
        
        <?php if (isset($success)): ?>
            <div class="bg-green-500 text-white p-3 rounded-md mb-6 text-center animate-pulse">
                <?php echo $success; ?>
            </div>
        <?php endif; ?>
        
        
        <?php if (isset($errors['auth'])): ?>
            <div class="bg-red-500 text-white p-3 rounded-md mb-6 text-center animate-pulse">
                <?php echo $errors['auth']; ?>
            </div>
        <?php endif; ?>
        
        
        <div id="formsContainer" class="relative transition-all duration-300 ease-out" style="min-height: 250px;">
            
            <form action="/login" method="POST" class="space-y-5 <?php echo $mode === 'login' ? 'block' : 'hidden'; ?>" id="loginForm">
                
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
                
                
                <div class="text-right">
                    <a href="#" class="text-sm text-discord-blue hover:underline form-toggle" data-form="forgot">Forgot your password?</a>
                </div>
                
                
                <button type="submit" class="w-full py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all">
                    Log In
                </button>
                
                
                <div class="flex items-center my-5">
                    <div class="flex-1 h-px bg-gray-600/50"></div>
                    <div class="mx-4 text-sm text-gray-400">OR</div>
                    <div class="flex-1 h-px bg-gray-600/50"></div>
                </div>
                
                
                <a href="/auth/google" class="w-full py-2.5 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-md flex items-center justify-center transition-all">
                    <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                    Sign in with Google
                </a>
                
                
                <div class="text-center mt-6">
                    <p class="text-gray-400 text-sm">
                        Need an account? 
                        <a href="#" class="text-discord-blue hover:underline form-toggle" data-form="register">Register</a>
                    </p>
                </div>
            </form>
        
            
            <form action="/register" method="POST" class="space-y-5 <?php echo $mode === 'register' ? 'block' : 'hidden'; ?>" id="registerForm">
                
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
                
                
                <button type="submit" class="w-full py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all">
                    Register
                </button>
                
                
                <div class="flex items-center my-5">
                    <div class="flex-1 h-px bg-gray-600/50"></div>
                    <div class="mx-4 text-sm text-gray-400">OR</div>
                    <div class="flex-1 h-px bg-gray-600/50"></div>
                </div>
                
                
                <a href="/auth/google" class="w-full py-2.5 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-md flex items-center justify-center transition-all">
                    <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                    Sign up with Google
                </a>
                
                
                <div class="text-center mt-6">
                    <p class="text-gray-400 text-sm">
                        Already have an account? 
                        <a href="#" class="text-discord-blue hover:underline form-toggle" data-form="login">Log In</a>
                    </p>
                </div>
            </form>
                
            
            <form action="/forgot-password" method="POST" class="space-y-5 <?php echo $mode === 'forgot-password' ? 'block' : 'hidden'; ?>" id="forgotForm">
                <p class="text-gray-300 text-sm mb-6">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
                
                
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
                
                
                <button type="submit" class="w-full py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all">
                    Send Reset Link
                </button>
                
                
                <div class="text-center mt-6">
                    <a href="#" class="text-discord-blue hover:underline text-sm form-toggle" data-form="login">Back to Login</a>
                </div>
            </form>
        </div>
    </div>
</div>

<?php 

$content = ob_get_clean(); 

include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>

