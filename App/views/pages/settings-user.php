<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';
require_once dirname(dirname(__DIR__)) . '/controllers/AuthenticationController.php';
require_once dirname(dirname(__DIR__)) . '/controllers/UserController.php';

if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}

// Redirect if not logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: /login');
    exit;
}

$page_title = 'User Settings - misvord';
$body_class = 'bg-discord-dark text-white overflow-hidden';
$page_css = 'settings-user';
$page_js = 'components/auth/settings-user';
$data_page = 'settings-user';
$user_id = $_SESSION['user_id'];

// Get user data
$userController = new UserController();
$user = $userController->getUserData($user_id);
?>

<?php ob_start(); ?>

<div class="settings-page flex h-screen">
    <!-- Settings Sidebar -->
    <div class="settings-sidebar w-64 bg-discord-dark overflow-y-auto">
        <div class="p-4">
            <input type="text" placeholder="Search" class="w-full bg-discord-darker text-white border-none rounded p-2 focus:outline-none focus:ring-2 focus:ring-discord-blue" />
        </div>
        
        <!-- User Settings Section -->
        <div class="settings-section mb-4">
            <div class="text-xs font-semibold text-discord-lightest px-4 py-2 uppercase">User Settings</div>
            
            <a href="/settings/user" class="settings-item flex items-center px-4 py-2 text-discord-lighter hover:bg-discord-darkest bg-discord-selected">
                <span>My Account</span>
            </a>
            
            <a href="/settings/profiles" class="settings-item flex items-center px-4 py-2 text-discord-lighter hover:bg-discord-darkest">
                <span>Profiles</span>
            </a>
            
            <a href="/settings/privacy" class="settings-item flex items-center px-4 py-2 text-discord-lighter hover:bg-discord-darkest">
                <span>Data & Privacy</span>
            </a>
            
            <a href="/settings/connections" class="settings-item flex items-center px-4 py-2 text-discord-lighter hover:bg-discord-darkest">
                <span>Connections</span>
            </a>
        </div>
        
        <!-- Billing Settings Section -->
        <div class="settings-section mb-4">
            <div class="text-xs font-semibold text-discord-lightest px-4 py-2 uppercase">Billing Settings</div>
            
            <a href="/settings/nitro" class="settings-item flex items-center px-4 py-2 text-discord-lighter hover:bg-discord-darkest">
                <span>Nitro</span>
                <span class="ml-auto bg-[#5865f2] text-white text-xs px-1.5 py-0.5 rounded-md">NEW</span>
            </a>
            
            <a href="/settings/subscriptions" class="settings-item flex items-center px-4 py-2 text-discord-lighter hover:bg-discord-darkest">
                <span>Subscriptions</span>
            </a>
        </div>
        
        <!-- App Settings Section -->
        <div class="settings-section mb-4">
            <div class="text-xs font-semibold text-discord-lightest px-4 py-2 uppercase">App Settings</div>
            
            <a href="/settings/appearance" class="settings-item flex items-center px-4 py-2 text-discord-lighter hover:bg-discord-darkest">
                <span>Appearance</span>
                <span class="ml-auto bg-[#5865f2] text-white text-xs px-1.5 py-0.5 rounded-md">NEW</span>
            </a>
            
            <a href="/settings/accessibility" class="settings-item flex items-center px-4 py-2 text-discord-lighter hover:bg-discord-darkest">
                <span>Accessibility</span>
            </a>
            
            <a href="/settings/voice" class="settings-item flex items-center px-4 py-2 text-discord-lighter hover:bg-discord-darkest">
                <span>Voice & Video</span>
            </a>
            
            <a href="/settings/notifications" class="settings-item flex items-center px-4 py-2 text-discord-lighter hover:bg-discord-darkest">
                <span>Notifications</span>
            </a>
        </div>
    </div>
    
    <!-- Settings Content -->
    <div class="settings-content flex-1 bg-discord-darker overflow-y-auto relative">
        <!-- Close Button -->
        <button class="absolute top-4 right-4 text-discord-lighter hover:text-white bg-discord-dark hover:bg-discord-darkest rounded-full w-8 h-8 flex items-center justify-center" onclick="window.history.back()">
            <i class="fas fa-times"></i>
            <span class="sr-only">ESC</span>
        </button>
        
        <div class="p-10 max-w-3xl">
            <!-- Page Header -->
            <h1 class="text-2xl font-bold mb-6">My Account</h1>
            
            <!-- Tabs -->
            <div class="border-b border-discord-dark mb-6">
                <div class="flex">
                    <button class="text-discord-blue border-b-2 border-discord-blue py-2 px-4 font-medium">
                        Security
                    </button>
                    <button class="text-discord-lighter hover:text-white py-2 px-4 font-medium">
                        Standing
                    </button>
                </div>
            </div>
            
            <!-- User Profile Card -->
            <div class="bg-discord-darkest rounded-lg overflow-hidden mb-8">
                <!-- Banner -->
                <div class="h-32 bg-discord-purple relative">
                    <?php if (isset($user->banner_url) && $user->banner_url): ?>
                        <img src="<?php echo htmlspecialchars($user->banner_url); ?>" alt="Banner" class="w-full h-full object-cover">
                    <?php endif; ?>
                    
                    <!-- Avatar -->
                    <div class="absolute -bottom-8 left-4">
                        <div class="w-16 h-16 rounded-full bg-discord-darkest p-1">
                            <div class="w-full h-full rounded-full bg-discord-darker overflow-hidden">
                                <img src="<?php echo htmlspecialchars($user->avatar_url ?? asset('/default-avatar.svg')); ?>" alt="Avatar" class="w-full h-full object-cover">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Edit Button -->
                    <div class="absolute bottom-4 right-4">
                        <button class="bg-discord-blue hover:bg-discord-blue-dark text-white rounded px-4 py-1.5 text-sm font-medium">
                            Edit User Profile
                        </button>
                    </div>
                </div>
                
                <!-- User Info Section -->
                <div class="pt-10 pb-4 px-4">
                    <!-- Name with status indicators -->
                    <div class="flex items-center mb-4">
                        <h2 class="text-xl font-semibold mr-2">
                            <?php echo htmlspecialchars($user->username ?? $_SESSION['username']); ?>
                        </h2>
                        
                        <!-- Status Indicators -->
                        <div class="flex space-x-1">
                            <span class="w-5 h-5 rounded-full bg-discord-red flex items-center justify-center">
                                <i class="fas fa-minus text-xs"></i>
                            </span>
                            <span class="w-5 h-5 rounded-full bg-discord-green flex items-center justify-center">
                                <i class="fas fa-check text-xs"></i>
                            </span>
                            <span class="w-5 h-5 rounded-full bg-[#00aff4] flex items-center justify-center">
                                <i class="fas fa-link text-xs"></i>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- User Details -->
            <div class="space-y-6">
                <!-- Display Name -->
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-medium">Display Name</h3>
                        <p class="text-discord-lighter"><?php echo htmlspecialchars($user->display_name ?? $user->username ?? $_SESSION['username']); ?></p>
                    </div>
                    <button class="bg-discord-dark hover:bg-discord-darkest text-white rounded px-4 py-1.5 text-sm font-medium">
                        Edit
                    </button>
                </div>
                
                <!-- Username -->
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-medium">Username</h3>
                        <p class="text-discord-lighter"><?php echo htmlspecialchars(strtolower($user->username ?? $_SESSION['username'])); ?></p>
                    </div>
                    <button class="bg-discord-dark hover:bg-discord-darkest text-white rounded px-4 py-1.5 text-sm font-medium">
                        Edit
                    </button>
                </div>
                
                <!-- Email -->
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-medium">Email</h3>
                        <?php
                        $email = $user->email ?? $_SESSION['email'] ?? '';
                        $hiddenEmail = substr($email, 0, 2) . str_repeat('*', strlen($email) - 5) . substr($email, -3);
                        ?>
                        <div class="flex items-center">
                            <p class="text-discord-lighter"><?php echo $hiddenEmail; ?>@gmail.com</p>
                            <button class="ml-2 text-blue-500 hover:underline text-xs">Reveal</button>
                        </div>
                    </div>
                    <button class="bg-discord-dark hover:bg-discord-darkest text-white rounded px-4 py-1.5 text-sm font-medium">
                        Edit
                    </button>
                </div>
                
                <!-- Phone Number -->
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-medium">Phone Number</h3>
                        <p class="text-discord-lighter">You haven't added a phone number yet.</p>
                    </div>
                    <button class="bg-discord-dark hover:bg-discord-darkest text-white rounded px-4 py-1.5 text-sm font-medium">
                        Add
                    </button>
                </div>
            </div>
            
            <!-- Password and Authentication Section -->
            <div class="mt-10">
                <h2 class="text-xl font-bold mb-6">Password and Authentication</h2>
                
                <button class="bg-discord-blue hover:bg-discord-blue-dark text-white rounded px-4 py-2 text-sm font-medium">
                    Change Password
                </button>
                
                <!-- 2FA Section -->
                <div class="mt-8">
                    <h3 class="font-medium mb-2">Authenticator App</h3>
                    <p class="text-discord-lighter mb-4">
                        Protect your misvord account with an extra layer of security. Once configured,
                        you'll be required to enter your password and complete one additional step in
                        order to sign in.
                    </p>
                    
                    <button class="bg-discord-blue hover:bg-discord-blue-dark text-white rounded px-4 py-2 text-sm font-medium">
                        Enable Authenticator App
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<?php 
$content = ob_get_clean();
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php'; 
?>
