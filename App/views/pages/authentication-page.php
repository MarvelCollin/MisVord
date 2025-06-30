<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';

if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}

$redirectUrl = isset($_GET['redirect']) ? $_GET['redirect'] : null;
if ($redirectUrl) {
    $_SESSION['login_redirect'] = $redirectUrl;
}

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
header('Pragma: no-cache');
header('Expires: 0');

$mode = 'login'; 
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($path === '/register') {        
    $mode = 'register';
} elseif ($path === '/forgot-password' || $path === '/security-verify') {
    $mode = 'forgot-password';
} elseif ($path === '/reset-password') {
    $mode = 'reset-password';
} elseif ($path === '/set-security-question') {
    $mode = 'security-question';
} elseif (isset($_SESSION['google_auth_completed']) && $_SESSION['google_auth_completed'] === true && !isset($_SESSION['security_question_set'])) {
    $mode = 'security-question';
}

$errors = $_SESSION['errors'] ?? [];
$oldInput = $_SESSION['old_input'] ?? [];
$success = $_SESSION['success'] ?? null;
$securityQuestion = $_SESSION['security_question'] ?? null;
$email = $_SESSION['reset_email'] ?? '';
$token = $_SESSION['reset_token'] ?? '';
$registerFailedStep = $_SESSION['register_failed_step'] ?? 1;

$_SESSION['errors'] = [];
$_SESSION['old_input'] = [];
$_SESSION['success'] = null;
unset($_SESSION['register_failed_step']);

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');

$page_title = 'misvord - Login or Register';
$body_class = 'bg-discord-dark text-white';
$page_css = 'authentication-page';
$page_js = 'pages/authentication-page';
$additional_js = ['components/common/validation', 'components/common/captcha'];
$head_scripts = ['logger-init'];

$data_page = 'auth';

require_once dirname(dirname(__DIR__)) . '/database/repositories/UserRepository.php';
try {
    $userRepo = new UserRepository();
    $userRepo->initialize();
} catch (Exception $e) {
    error_log("Error initializing database: " . $e->getMessage());
}
?>

<?php ob_start(); ?>

<style>
    select#security_question, select#google_security_question {
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        padding-right: 2.5rem;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        appearance: none;
    }
    
    select#security_question option, select#google_security_question option {
        background-color: #202225;
    }

    #register-step-1 {
        display: <?php echo $registerFailedStep === 1 ? 'block' : 'none'; ?>;
    }

    #register-step-2 {
        display: <?php echo $registerFailedStep === 2 ? 'block' : 'none'; ?>;
    }
    
    <?php if ($registerFailedStep === 2): ?>
    .step-line { width: 100% !important; }
    .step-indicator.active { background-color: #5865f2; color: white; }
    <?php endif; ?>
</style>

<body data-page="auth">
<div class="authentication-page w-full min-h-screen bg-[#202225]">

    <div class="w-full max-w-md mx-auto rounded-xl shadow-2xl relative z-10 glass-hero transform transition-all duration-700 ease-out bg-[#2f3136]/80 backdrop-filter backdrop-blur-md border border-white/10 p-6 sm:p-8" id="authContainer">

        <div class="flex justify-center mb-6 sm:mb-8 relative">
            <img src="<?php echo asset('/common/main-logo.png'); ?>" alt="misvord Logo" class="h-8 sm:h-10 md:h-12 transition-all" id="logo">
            <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-discord-blue to-discord-pink w-0" id="logoUnderline"></div>
        </div>

        <h1 class="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 text-white" id="authTitle">
            <?php if ($mode === 'login'): ?>
                <span>Welcome back!</span>
            <?php elseif ($mode === 'register'): ?>
                <span>Create an account</span>
            <?php elseif ($mode === 'forgot-password'): ?>
                <span>Account Recovery</span>
            <?php elseif ($mode === 'security-question'): ?>
                <span>Set Security Question</span>
            <?php elseif ($mode === 'reset-password'): ?>
                <span>Create New Password</span>
            <?php else: ?>
                <span>misvord</span>
            <?php endif; ?>
        </h1>

        <?php if (isset($success)): ?>
            <div class="bg-green-500 text-white p-3 rounded-md mb-6 text-center animate-pulse">
                <?php echo $success; ?>
            </div>
        <?php endif; ?>

        <div id="formsContainer" class="relative transition-all duration-300 ease-out" style="min-height: 200px;">

            <form action="/login" method="POST" class="space-y-4 sm:space-y-5 <?php echo $mode === 'login' ? 'block' : 'hidden'; ?>" id="loginForm">
                <?php if (isset($errors['auth'])): ?>
                    <div class="bg-red-500 text-white p-3 rounded-md mb-4 text-center animate-pulse" id="form-error-message">
                        <?php echo $errors['auth']; ?>
                    </div>
                <?php endif; ?>

                <div class="form-group">
                    <label for="email" class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input 
                        id="email" 
                        name="email" 
                        class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 sm:p-3 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all text-sm sm:text-base" 
                        value="<?php echo $oldInput['email'] ?? ''; ?>" 
                    >
                    <?php if (isset($errors['email'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['email']; ?></p>
                    <?php endif; ?>
                </div>

                <div class="form-group">
                    <label for="password" class="block text-sm font-medium text-gray-300 mb-1">Password</label>
                    <div class="relative">
                        <input 
                            id="password" 
                            name="password" 
                            type="password"
                            class="password-field w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 sm:p-3 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all text-sm sm:text-base" 
                        >
                        <button type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors password-toggle">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <?php if (isset($errors['password'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['password']; ?></p>
                    <?php endif; ?>
                </div>

                <div class="text-right">
                    <a href="#" class="text-sm text-discord-blue hover:underline form-toggle" data-form="forgot">Forgot your password?</a>
                </div>

                <div class="form-group">
                    <label class="block text-sm font-medium text-gray-300 mb-1">Verification</label>
                    <div id="login-captcha-container" class="mb-2"></div>
                    <input 
                        id="login_captcha" 
                        name="captcha" 
                        class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 sm:p-3 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all text-sm sm:text-base" 
                        placeholder="Enter the code above" 
                    >
                </div>

                <button type="submit" class="w-full py-2.5 sm:py-3 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all text-sm sm:text-base">
                    Log In
                </button>

                <div class="flex items-center my-4 sm:my-5">
                    <div class="flex-1 h-px bg-gray-600/50"></div>
                    <div class="mx-4 text-xs sm:text-sm text-gray-400">OR</div>
                    <div class="flex-1 h-px bg-gray-600/50"></div>
                </div>

                <a href="/auth/google" class="w-full py-2.5 sm:py-3 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-md flex items-center justify-center transition-all text-sm sm:text-base">
                    <i class="fab fa-google w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#4285F4]"></i>
                    Sign in with Google
                </a>

                <div class="text-center mt-4 sm:mt-6">
                    <p class="text-gray-400 text-xs sm:text-sm">
                        Need an account? 
                        <a href="#" class="text-discord-blue hover:underline form-toggle" data-form="register">Register</a>
                    </p>
                </div>
            </form>

            <form action="/register" method="POST" class="space-y-4 sm:space-y-5 <?php echo $mode === 'register' ? 'block' : 'hidden'; ?>" id="registerForm">
                <?php if (isset($errors['general'])): ?>
                    <div class="bg-red-500 text-white p-3 rounded-md mb-4 text-center animate-pulse" id="form-error-message">
                        <?php echo $errors['general']; ?>
                    </div>
                <?php endif; ?>
                <div class="flex items-center justify-center mb-4">
                    <div class="flex items-center">
                        <div class="step-indicator active" id="step-1-indicator">
                            <span>1</span>
                        </div>
                        <div class="step-line <?php echo $registerFailedStep === 2 ? 'active' : ''; ?>" id="step-line"></div>
                        <div class="step-indicator <?php echo $registerFailedStep === 2 ? 'active' : ''; ?>" id="step-2-indicator">
                            <span>2</span>
                        </div>
                    </div>
                </div>

                <div id="register-step-1" class="register-step active">
                    <?php if (isset($errors['username']) || isset($errors['email']) || isset($errors['password']) || isset($errors['password_confirm'])): ?>
                        <div class="bg-red-500 text-white p-3 rounded-md mb-4 text-center animate-pulse">
                            Please correct the errors below.
                        </div>
                    <?php endif; ?>
                    <div class="form-group">
                        <label for="username" class="block text-sm font-medium text-gray-300 mb-1">Username</label>
                        <input 
                            id="username" 
                            name="username" 
                            class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 sm:p-3 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all text-sm sm:text-base" 
                            value="<?php echo $oldInput['username'] ?? ''; ?>" 
                        >
                        <?php if (isset($errors['username'])): ?>
                            <p class="text-red-500 text-sm mt-1"><?php echo $errors['username']; ?></p>
                        <?php endif; ?>
                    </div>

                    <div class="form-group">
                        <label for="reg_email" class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                        <input 
                            id="reg_email" 
                            name="email" 
                            class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                            value="<?php echo $oldInput['email'] ?? ''; ?>" 
                        >
                        <?php if (isset($errors['email'])): ?>
                            <p class="text-red-500 text-sm mt-1"><?php echo $errors['email']; ?></p>
                        <?php endif; ?>
                    </div>

                    <div class="form-group">
                        <label for="reg_password" class="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <div class="relative">
                            <input 
                                id="reg_password" 
                                name="password" 
                                type="password"
                                class="password-field w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                            >
                            <button type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors password-toggle">
                                <i class="fa-solid fa-eye"></i>
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
                                id="password_confirm" 
                                name="password_confirm" 
                                type="password"
                                class="password-field w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                            >
                            <button type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors password-toggle">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>
                        <?php if (isset($errors['password_confirm'])): ?>
                            <p class="text-red-500 text-sm mt-1"><?php echo $errors['password_confirm']; ?></p>
                        <?php endif; ?>
                        <div class="text-green-500 text-xs mt-1 hidden" id="passwordsMatch">Passwords match <i class="fa-solid fa-check"></i></div>
                    </div>

                    <button type="button" id="next-step-btn" class="w-full py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all">
                        Next Step
                    </button>
                </div>

                <div id="register-step-2" class="register-step hidden">
                    <?php if (isset($errors['security_question']) || isset($errors['security_answer']) || isset($errors['captcha'])): ?>
                        <div class="bg-red-500 text-white p-3 rounded-md mb-4 text-center animate-pulse">
                            Please correct the errors below.
                        </div>
                    <?php endif; ?>
                    <div class="form-group">
                        <label for="security_question" class="block text-sm font-medium text-gray-300 mb-1">Security Question</label>
                        <select 
                            id="security_question" 
                            name="security_question" 
                            class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all"
                        >
                            <option value="">Select a security question</option>
                            <option value="What was the name of your first pet?" <?php echo (isset($oldInput['security_question']) && $oldInput['security_question'] === 'What was the name of your first pet?') ? 'selected' : ''; ?>>What was the name of your first pet?</option>
                            <option value="In what city were you born?" <?php echo (isset($oldInput['security_question']) && $oldInput['security_question'] === 'In what city were you born?') ? 'selected' : ''; ?>>In what city were you born?</option>
                            <option value="What was the name of your first school?" <?php echo (isset($oldInput['security_question']) && $oldInput['security_question'] === 'What was the name of your first school?') ? 'selected' : ''; ?>>What was the name of your first school?</option>
                            <option value="What is your mother's maiden name?" <?php echo (isset($oldInput['security_question']) && $oldInput['security_question'] === 'What is your mother\'s maiden name?') ? 'selected' : ''; ?>>What is your mother's maiden name?</option>
                            <option value="What was your childhood nickname?" <?php echo (isset($oldInput['security_question']) && $oldInput['security_question'] === 'What was your childhood nickname?') ? 'selected' : ''; ?>>What was your childhood nickname?</option>
                        </select>
                        <p class="text-gray-400 text-xs mt-1">Used for account recovery if you forget your password</p>
                        <?php if (isset($errors['security_question'])): ?>
                            <p class="text-red-500 text-sm mt-1"><?php echo $errors['security_question']; ?></p>
                        <?php endif; ?>
                    </div>

                    <div class="form-group">
                        <label for="security_answer" class="block text-sm font-medium text-gray-300 mb-1">Security Answer</label>
                        <input 
                            id="security_answer" 
                            name="security_answer" 
                            class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                            placeholder="Answer to your security question"
                            value="<?php echo $oldInput['security_answer'] ?? ''; ?>"
                        >
                        <?php if (isset($errors['security_answer'])): ?>
                            <p class="text-red-500 text-sm mt-1"><?php echo $errors['security_answer']; ?></p>
                        <?php endif; ?>
                    </div>

                    <div class="form-group">
                        <label class="block text-sm font-medium text-gray-300 mb-1">Verification</label>
                        <div id="register-captcha-container" class="mb-2"></div>
                        <input 
                            id="register_captcha" 
                            name="captcha" 
                            class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                            placeholder="Enter the code above" 
                        >
                    </div>

                    <div class="flex gap-3 mt-6 items-center">
                        <button type="button" id="prev-step-btn" class="flex-1 h-11 sm:h-12 py-2.5 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-all text-sm sm:text-base flex items-center justify-center">
                            <i class="fa-solid fa-arrow-left mr-2"></i>Back
                        </button>
                        <button type="submit" class="flex-1 h-11 sm:h-12 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all text-sm sm:text-base flex items-center justify-center">
                            Register<i class="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                </div>

                <div class="flex items-center my-5">
                    <div class="flex-1 h-px bg-gray-600/50"></div>
                    <div class="mx-4 text-sm text-gray-400">OR</div>
                    <div class="flex-1 h-px bg-gray-600/50"></div>
                </div>

                <a href="/auth/google" class="w-full py-2.5 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-md flex items-center justify-center transition-all">
                    <i class="fab fa-google w-5 h-5 mr-2 text-[#4285F4]"></i>
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
                    <?php if (isset($_SESSION['security_question'])): ?>
                    Please answer your security question to reset your password.
                    <?php else: ?>
                    Enter your email to recover your account using your security question.
                    <?php endif; ?>
                </p>

                <?php if (!isset($_SESSION['security_question'])): ?>
                <div class="form-group">
                    <label for="forgot_email" class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input 
                        id="forgot_email" 
                        name="email" 
                        class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                        value="<?php echo $oldInput['email'] ?? ''; ?>" 
                    >
                    <?php if (isset($errors['email'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['email']; ?></p>
                    <?php endif; ?>
                </div>
                
                <input type="hidden" name="step" value="get_question">
                <?php else: ?>
                <div class="form-group">
                    <label class="block text-sm font-medium text-gray-300 mb-1">Security Question</label>
                    <div class="bg-[#2f3136] p-3 rounded-md text-gray-200 mb-2"><?php echo $_SESSION['security_question']; ?></div>
                    
                    <label for="security_answer" class="block text-sm font-medium text-gray-300 mb-1">Your Answer</label>
                    <input 
                        id="security_answer" 
                        name="security_answer" 
                        class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                    >
                    <?php if (isset($errors['security_answer'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['security_answer']; ?></p>
                    <?php endif; ?>
                </div>
                
                <input type="hidden" name="step" value="verify_answer">
                <input type="hidden" name="email" value="<?php echo $_SESSION['reset_email'] ?? ''; ?>">
                <?php endif; ?>

                <button type="submit" class="w-full py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all">
                    <?php echo isset($_SESSION['security_question']) ? 'Verify Answer' : 'Continue'; ?>
                </button>

                <div class="text-center mt-6">
                    <a href="#" class="text-discord-blue hover:underline text-sm form-toggle" data-form="login">Back to Login</a>
                </div>
            </form>
            

            
            <form action="/reset-password" method="POST" class="space-y-5 <?php echo $mode === 'reset-password' ? 'block' : 'hidden'; ?>" id="resetPasswordForm">
                <p class="text-gray-300 text-sm mb-6">
                    Create a new password for your account.
                </p>

                <input type="hidden" name="token" value="<?php echo $_SESSION['reset_token'] ?? ''; ?>">
                <input type="hidden" name="email" value="<?php echo $_SESSION['reset_email'] ?? ''; ?>">

                <div class="form-group">
                    <label for="new_password" class="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                    <div class="relative">
                        <input 
                            id="new_password" 
                            name="password" 
                            class="password-field w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                        >
                        <button type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors password-toggle">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <?php if (isset($errors['password'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['password']; ?></p>
                    <?php endif; ?>
                    <div class="mt-1 h-1 bg-gray-700 rounded hidden" id="resetPasswordStrength">
                        <div class="h-full bg-discord-blue rounded" style="width: 0%"></div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="confirm_new_password" class="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
                    <div class="relative">
                        <input 
                            id="confirm_new_password" 
                            name="password_confirm" 
                            class="password-field w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                        >
                        <button type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors password-toggle">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                    <?php if (isset($errors['password_confirm'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['password_confirm']; ?></p>
                    <?php endif; ?>
                    <div class="text-green-500 text-xs mt-1 hidden" id="resetPasswordsMatch">Passwords match <i class="fa-solid fa-check"></i></div>
                </div>

                <button type="submit" class="w-full py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all">
                    Reset Password
                </button>
            </form>

            <form action="/set-security-question" method="POST" class="space-y-4 sm:space-y-5 <?php echo $mode === 'security-question' ? 'block' : 'hidden'; ?>" id="securityQuestionForm">
                <p class="text-gray-300 text-sm mb-4">
                    Please set a security question and answer to protect your account.
                </p>

                <input type="hidden" name="user_id" value="<?php echo $_SESSION['user_id'] ?? ''; ?>">

                <div class="form-group">
                    <label for="google_security_question" class="block text-sm font-medium text-gray-300 mb-1">Security Question</label>
                    <select 
                        id="google_security_question" 
                        name="security_question" 
                        class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all"
                        required
                    >
                        <option value="">Select a security question</option>
                        <option value="What was the name of your first pet?" <?php echo (isset($oldInput['security_question']) && $oldInput['security_question'] === 'What was the name of your first pet?') ? 'selected' : ''; ?>>What was the name of your first pet?</option>
                        <option value="In what city were you born?" <?php echo (isset($oldInput['security_question']) && $oldInput['security_question'] === 'In what city were you born?') ? 'selected' : ''; ?>>In what city were you born?</option>
                        <option value="What was the name of your first school?" <?php echo (isset($oldInput['security_question']) && $oldInput['security_question'] === 'What was the name of your first school?') ? 'selected' : ''; ?>>What was the name of your first school?</option>
                        <option value="What is your mother's maiden name?" <?php echo (isset($oldInput['security_question']) && $oldInput['security_question'] === 'What is your mother\'s maiden name?') ? 'selected' : ''; ?>>What is your mother's maiden name?</option>
                        <option value="What was your childhood nickname?" <?php echo (isset($oldInput['security_question']) && $oldInput['security_question'] === 'What was your childhood nickname?') ? 'selected' : ''; ?>>What was your childhood nickname?</option>
                    </select>
                    <?php if (isset($errors['security_question'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['security_question']; ?></p>
                    <?php endif; ?>
                </div>

                <div class="form-group">
                    <label for="google_security_answer" class="block text-sm font-medium text-gray-300 mb-1">Security Answer</label>
                    <input 
                        id="google_security_answer" 
                        name="security_answer" 
                        class="w-full bg-[#202225] text-white border border-[#40444b] rounded-md p-2.5 focus:ring-2 focus:ring-discord-blue focus:border-transparent transition-all" 
                        placeholder="Answer to your security question"
                        required
                    >
                    <?php if (isset($errors['security_answer'])): ?>
                        <p class="text-red-500 text-sm mt-1"><?php echo $errors['security_answer']; ?></p>
                    <?php endif; ?>
                </div>

                <button type="submit" class="w-full py-2.5 bg-discord-blue hover:bg-discord-blue/90 text-white font-medium rounded-md transition-all">
                    Save Security Question
                </button>
            </form>
        </div>
    </div>
</div>


    <?php if ($registerFailedStep === 2): ?>
    <script>
        window.initialRegisterStep = 2;
    </script>
    <?php endif; ?>
</body>
<?php 
$content = ob_get_clean(); 
require_once __DIR__ . '/../layout/app.php';
?>