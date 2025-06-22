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
$head_scripts = ['logger-init'];
$data_page = 'settings-user';
$user_id = $_SESSION['user_id'];

// Get user data
$userController = new UserController();
$user = $userController->getUserData($user_id);

// Get section from query params
$section = $_GET['section'] ?? 'my-account';
?>

<?php ob_start(); ?>

<div class="flex min-h-screen max-w-[1480px] mx-auto">
    <!-- Left Sidebar with Settings Categories -->
    <div class="w-60 bg-discord-light border-r border-discord-dark">
        <div class="p-4">
            <input type="text" placeholder="Search" class="w-full bg-discord-darker text-white border-none rounded p-2 focus:outline-none focus:ring-2 focus:ring-discord-blue" />
        </div>
        
        <nav class="mt-2">
            <ul>
                <!-- User Settings Categories -->
                <li>
                    <div class="sidebar-category">
                        <span>USER SETTINGS</span>
                    </div>
                </li>
                <li>
                    <a href="?section=my-account" class="sidebar-item <?php echo $section === 'my-account' ? 'active bg-discord-selected' : ''; ?>">
                        My Account
                    </a>
                </li>
                <li>
                    <a href="?section=profiles" class="sidebar-item <?php echo $section === 'profiles' ? 'active bg-discord-selected' : ''; ?>">
                        Profiles
                    </a>
                </li>
                <li>
                    <a href="?section=privacy" class="sidebar-item <?php echo $section === 'privacy' ? 'active bg-discord-selected' : ''; ?>">
                        Privacy & Safety
                    </a>
                </li>
                <li>
                    <a href="?section=connections" class="sidebar-item <?php echo $section === 'connections' ? 'active bg-discord-selected' : ''; ?>">
                        Connections
                    </a>
                </li>
                <li>
                    <a href="?section=family-center" class="sidebar-item <?php echo $section === 'family-center' ? 'active bg-discord-selected' : ''; ?>">
                        Family Center
                    </a>
                </li>
                
                <!-- Billing Settings Categories -->
                <li>
                    <div class="sidebar-category mt-6">
                        <span>BILLING SETTINGS</span>
                    </div>
                </li>
                <li>
                    <a href="?section=nitro" class="sidebar-item <?php echo $section === 'nitro' ? 'active bg-discord-selected' : ''; ?>">
                        Nitro
                        <span class="sidebar-item-badge">NEW</span>
                    </a>
                </li>
                <li>
                    <a href="?section=server-boost" class="sidebar-item <?php echo $section === 'server-boost' ? 'active bg-discord-selected' : ''; ?>">
                        Server Boost
                    </a>
                </li>
                <li>
                    <a href="?section=subscriptions" class="sidebar-item <?php echo $section === 'subscriptions' ? 'active bg-discord-selected' : ''; ?>">
                        Subscriptions
                    </a>
                </li>
                <li>
                    <a href="?section=inventory" class="sidebar-item <?php echo $section === 'inventory' ? 'active bg-discord-selected' : ''; ?>">
                        Gift Inventory
                    </a>
                </li>
                <li>
                    <a href="?section=billing" class="sidebar-item <?php echo $section === 'billing' ? 'active bg-discord-selected' : ''; ?>">
                        Billing
                    </a>
                </li>
                
                <!-- App Settings Categories -->
                <li>
                    <div class="sidebar-category mt-6">
                        <span>APP SETTINGS</span>
                    </div>
                </li>
                <li>
                    <a href="?section=appearance" class="sidebar-item <?php echo $section === 'appearance' ? 'active bg-discord-selected' : ''; ?>">
                        Appearance
                        <span class="sidebar-item-badge">NEW</span>
                    </a>
                </li>
                <li>
                    <a href="?section=accessibility" class="sidebar-item <?php echo $section === 'accessibility' ? 'active bg-discord-selected' : ''; ?>">
                        Accessibility
                    </a>
                </li>
                <li>
                    <a href="?section=voice" class="sidebar-item <?php echo $section === 'voice' ? 'active bg-discord-selected' : ''; ?>">
                        Voice & Video
                    </a>
                </li>
                <li>
                    <a href="?section=text" class="sidebar-item <?php echo $section === 'text' ? 'active bg-discord-selected' : ''; ?>">
                        Text & Images
                    </a>
                </li>
                <li>
                    <a href="?section=notifications" class="sidebar-item <?php echo $section === 'notifications' ? 'active bg-discord-selected' : ''; ?>">
                        Notifications
                    </a>
                </li>
                <li>
                    <a href="?section=keybinds" class="sidebar-item <?php echo $section === 'keybinds' ? 'active bg-discord-selected' : ''; ?>">
                        Keybinds
                    </a>
                </li>
                <li>
                    <a href="?section=language" class="sidebar-item <?php echo $section === 'language' ? 'active bg-discord-selected' : ''; ?>">
                        Language
                    </a>
                </li>
                <li>
                    <a href="?section=windows" class="sidebar-item <?php echo $section === 'windows' ? 'active bg-discord-selected' : ''; ?>">
                        Windows Settings
                    </a>
                </li>
                <li>
                    <a href="?section=streamer" class="sidebar-item <?php echo $section === 'streamer' ? 'active bg-discord-selected' : ''; ?>">
                        Streamer Mode
                    </a>
                </li>
                <li>
                    <a href="?section=advanced" class="sidebar-item <?php echo $section === 'advanced' ? 'active bg-discord-selected' : ''; ?>">
                        Advanced
                    </a>
                </li>
                
                <!-- Activity Category -->
                <li>
                    <div class="sidebar-category mt-6">
                        <span>ACTIVITY SETTINGS</span>
                    </div>
                </li>
                <li>
                    <a href="?section=activity-privacy" class="sidebar-item <?php echo $section === 'activity-privacy' ? 'active bg-discord-selected' : ''; ?>">
                        Activity Privacy
                    </a>
                </li>
                <li>
                    <a href="?section=registered-games" class="sidebar-item <?php echo $section === 'registered-games' ? 'active bg-discord-selected' : ''; ?>">
                        Registered Games
                    </a>
                </li>
            </ul>
        </nav>
        
        <!-- Log Out Button -->
        <div class="p-4 mt-6">
            <a href="/logout" class="sidebar-item text-red-500 hover:text-red-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log Out
            </a>
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 bg-discord-dark overflow-y-auto">
        <?php if ($section === 'my-account'): ?>
            <!-- Page Header -->
            <div class="p-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-2">My Account</h1>
                
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
                            <button id="edit-profile-btn" class="bg-discord-blue hover:bg-discord-blue-dark text-white rounded px-4 py-1.5 text-sm font-medium">
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
        <?php else: ?>
            <div class="p-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-6"><?php echo ucfirst(str_replace('-', ' ', $section)); ?></h1>
                <p class="text-discord-lighter">This section is under development.</p>
            </div>
        <?php endif; ?>
    </div>
    
    <!-- User Preview Panel -->
    <div class="w-80 bg-discord-dark border-l border-discord-light p-6">
        <div class="user-preview-card bg-[#1e1f22] rounded-lg overflow-hidden">
            <!-- User Banner Preview -->
            <div class="user-banner h-40 bg-gradient-to-b from-[#5865f2] to-[#4752c4] relative">
                <?php if (isset($user->banner_url) && $user->banner_url): ?>
                    <img src="<?php echo htmlspecialchars($user->banner_url); ?>" alt="Banner" class="w-full h-full object-cover">
                <?php endif; ?>
                
                <!-- User Avatar Preview -->
                <div class="user-avatar-preview absolute -bottom-8 left-4 w-16 h-16 bg-discord-dark rounded-full border-4 border-[#1e1f22] overflow-hidden">
                    <img src="<?php echo htmlspecialchars($user->avatar_url ?? asset('/default-avatar.svg')); ?>" alt="Avatar" class="w-full h-full object-cover">
                </div>
            </div>
            
            <!-- User Info Preview -->
            <div class="user-info pt-10 px-4 pb-4">
                <h3 class="user-name text-white font-bold"><?php echo htmlspecialchars($user->username ?? $_SESSION['username']); ?></h3>
                <div class="user-tag text-xs text-discord-lighter mt-1">
                    #<?php echo htmlspecialchars($user->discriminator ?? $_SESSION['discriminator'] ?? '0000'); ?>
                </div>
                
                <!-- Status Selector -->
                <div class="status-selector mt-4">
                    <div class="status-option flex items-center p-2 hover:bg-discord-dark rounded cursor-pointer">
                        <span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        <span class="text-sm text-white">Online</span>
                    </div>
                    <div class="status-option flex items-center p-2 hover:bg-discord-dark rounded cursor-pointer">
                        <span class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                        <span class="text-sm text-white">Idle</span>
                    </div>
                    <div class="status-option flex items-center p-2 hover:bg-discord-dark rounded cursor-pointer">
                        <span class="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                        <span class="text-sm text-white">Do Not Disturb</span>
                    </div>
                    <div class="status-option flex items-center p-2 hover:bg-discord-dark rounded cursor-pointer">
                        <span class="w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
                        <span class="text-sm text-white">Invisible</span>
                    </div>
                </div>
                
                <!-- Custom Status -->
                <div class="custom-status mt-4 p-2 hover:bg-discord-dark rounded cursor-pointer">
                    <div class="flex items-center">
                        <span class="text-sm text-discord-lighter">Set a custom status</span>
                        <i class="fas fa-pencil-alt ml-auto text-discord-lighter"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Account Badges -->
        <div class="mt-6">
            <h4 class="text-sm font-medium text-discord-lighter mb-2">ACCOUNT BADGES</h4>
            <div class="flex flex-wrap gap-2">
                <div class="w-8 h-8 bg-discord-darkest rounded-md flex items-center justify-center" title="Discord Staff">
                    <i class="fas fa-shield-alt text-[#5865f2]"></i>
                </div>
                <div class="w-8 h-8 bg-discord-darkest rounded-md flex items-center justify-center" title="Nitro Subscriber">
                    <i class="fas fa-rocket text-[#5865f2]"></i>
                </div>
                <div class="w-8 h-8 bg-discord-darkest rounded-md flex items-center justify-center" title="Server Booster">
                    <i class="fas fa-bolt text-[#ff73fa]"></i>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Close button to return to previous page -->
    <div class="absolute top-0 right-0 flex items-center">
        <a href="javascript:history.back()" class="close-button flex items-center justify-center py-2 px-4">
            <div class="close-button-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
            <span class="close-button-text">ESC</span>
        </a>
    </div>
</div>

<?php 
$content = ob_get_clean();
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php'; 
?>
