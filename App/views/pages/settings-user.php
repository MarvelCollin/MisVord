<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';
require_once dirname(dirname(__DIR__)) . '/controllers/AuthenticationController.php';
require_once dirname(dirname(__DIR__)) . '/controllers/UserController.php';
require_once dirname(dirname(__DIR__)) . '/database/repositories/UserBadgeRepository.php';

if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}

// Redirect if not logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: /login');
    exit;
}

$page_title = 'User Settings - misvord';
$body_class = 'bg-discord-dark text-white';
$page_css = 'settings-user';
$page_js = 'components/auth/settings-user';
$head_scripts = ['logger-init'];
$data_page = 'settings-user';
$user_id = $_SESSION['user_id'];

// Get user data
$userController = new UserController();
$user = $userController->getUserData($user_id);

// Get user badges if they exist
$userBadges = [];
if (class_exists('UserBadgeRepository')) {
    $badgeRepository = new UserBadgeRepository();
    $userBadges = $badgeRepository->getForUser($user_id);
}

// Get section from query params
$section = $_GET['section'] ?? 'my-account';
?>

<?php ob_start(); ?>

<div class="flex min-h-screen max-w-[1480px] mx-auto">
    <!-- Meta tags for JavaScript access -->
    <meta name="user-status" content="<?php echo htmlspecialchars($user->status ?? 'offline'); ?>">
    <meta name="user-id" content="<?php echo htmlspecialchars($user->id ?? ''); ?>">
    <meta name="user-avatar" content="<?php echo htmlspecialchars($user->avatar_url ?? '/public/assets/common/main-logo.png'); ?>">

    <!-- Left Sidebar with Settings Categories -->
    <div class="w-72 bg-discord-light border-r border-discord-dark pl-8 pr-4 overflow-y-auto" style="height: 100vh;">
                        <div class="p-4">
            <input placeholder="Search" class="w-full bg-discord-darker text-white border-none rounded p-2 focus:outline-none focus:ring-2 focus:ring-discord-blue" />
        </div>
        
        <nav class="mt-6">
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
                    <a href="?section=connections" class="sidebar-item <?php echo $section === 'connections' ? 'active bg-discord-selected' : ''; ?>">
                        Connections
                    </a>
                </li>
                
                <!-- App Settings Categories -->
                <li>
                    <div class="sidebar-category mt-6">
                        <span>APP SETTINGS</span>
                    </div>
                </li>
                <li>
                    <a href="?section=nitro" class="sidebar-item <?php echo $section === 'nitro' ? 'active bg-discord-selected' : ''; ?>">
                        Nitro
                        <span class="sidebar-item-badge">NEW</span>
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
            </ul>
        </nav>
        
        <!-- Log Out Button -->
        <div class="p-4 mt-6">
            <a href="/login" class="sidebar-item text-red-500 hover:text-red-400 flex items-center" onclick="event.preventDefault(); logoutUser();">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log Out
            </a>
        </div>
        
        <script>
            function logoutUser() {
                // Clear any user data from localStorage
                localStorage.removeItem('user_token');
                localStorage.removeItem('connect_socket_on_login');
                
                // Redirect to login page
                window.location.href = '/login';
            }
        </script>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 bg-discord-dark overflow-y-auto px-10" style="height: 100vh;">
        <?php if ($section === 'my-account'): ?>
            <!-- Page Header -->
            <div class="py-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-2">My Account</h1>
                
                <!-- Tabs -->
                <div class="border-b border-gray-700 mb-6">
                    <div class="flex">
                        <button class="text-[#5865f2] border-b-2 border-[#5865f2] py-2 px-4 font-medium">
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
                    <div class="h-32 bg-[#5865f2] relative">
                        <?php if (isset($user->banner_url) && $user->banner_url): ?>
                            <img src="<?php echo htmlspecialchars($user->banner_url); ?>" alt="Banner" class="w-full h-full object-cover">
                        <?php endif; ?>
                        
                        <!-- Avatar -->
                        <div class="absolute -bottom-8 left-4">
                            <div class="w-20 h-20 rounded-full bg-discord-darkest p-1 relative">
                                <div class="w-full h-full rounded-full bg-discord-darker overflow-hidden">
                                    <img src="<?php echo htmlspecialchars($user->avatar_url ?? '/public/assets/common/main-logo.png'); ?>" alt="Avatar" class="w-full h-full object-cover">
                                </div>
                                
                                <!-- Status indicator -->
                                <?php 
                                $statusClass = 'bg-discord-green';
                                if ($user->status === 'invisible') $statusClass = 'bg-gray-500';
                                else if ($user->status === 'do_not_disturb') $statusClass = 'bg-discord-red';
                                else if ($user->status === 'offline') $statusClass = 'bg-[#747f8d]';
                                ?>
                                <div class="absolute bottom-0 right-0.5 w-3 h-3 rounded-full border-2 border-discord-darker <?php echo $statusClass; ?>"></div>
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
                    <div class="pt-12 pb-4 px-4">
                        <!-- Name with status indicators -->
                        <div class="flex items-center mb-4">
                            <h2 class="text-xl font-semibold mr-2">
                                <?php echo htmlspecialchars($user->username ?? ''); ?>
                            </h2>
                            
                            <!-- Status Indicators - based on actual user flags -->
                            <div class="flex space-x-1">
                                <?php if ($user->status === 'do_not_disturb'): ?>
                                <span class="w-5 h-5 rounded-full bg-discord-red flex items-center justify-center">
                                    <i class="fas fa-minus text-xs"></i>
                                </span>
                                <?php endif; ?>
                                
                                <?php if ($user->status === 'appear'): ?>
                                <span class="w-5 h-5 rounded-full bg-discord-green flex items-center justify-center">
                                    <i class="fas fa-check text-xs"></i>
                                </span>
                                <?php endif; ?>
                                
                                <?php if (isset($user->verified) && $user->verified): ?>
                                <span class="w-5 h-5 rounded-full bg-[#00aff4] flex items-center justify-center">
                                    <i class="fas fa-link text-xs"></i>
                                </span>
                                <?php endif; ?>
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
                            <p class="text-discord-lighter"><?php echo htmlspecialchars($user->display_name ?? $user->username ?? ''); ?></p>
                        </div>
                        <button class="bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded px-4 py-1.5 text-sm font-medium">
                            Edit
                        </button>
                    </div>
                    
                    <!-- Username -->
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-medium">Username</h3>
                            <p class="text-discord-lighter"><?php echo htmlspecialchars(strtolower($user->username ?? '')); ?></p>
                        </div>
                        <button class="bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded px-4 py-1.5 text-sm font-medium">
                            Edit
                        </button>
                    </div>
                    
                    <!-- Email -->
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-medium">Email</h3>
                            <div class="flex items-center">
                                <?php
                                $email = $user->email ?? '';
                                $hiddenEmail = '';
                                
                                if (!empty($email)) {
                                    $parts = explode('@', $email);
                                    if (count($parts) > 1) {
                                        $username = $parts[0];
                                        $domain = $parts[1];
                                        $maskedUsername = substr($username, 0, 2) . str_repeat('*', strlen($username) - 2);
                                        $hiddenEmail = $maskedUsername . '@' . $domain;
                                    } else {
                                        $hiddenEmail = substr($email, 0, 2) . str_repeat('*', strlen($email) - 5) . substr($email, -3);
                                    }
                                }
                                ?>
                                <p class="text-discord-lighter" id="user-email-display"><?php echo htmlspecialchars($hiddenEmail); ?></p>
                                <button class="ml-2 text-blue-500 hover:underline text-xs" id="reveal-email-btn" data-email="<?php echo htmlspecialchars($email); ?>">Reveal</button>
                            </div>
                        </div>
                        <button class="bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded px-4 py-1.5 text-sm font-medium">
                            Edit
                        </button>
                    </div>
                    
                    <!-- Phone Number -->
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-medium">Phone Number</h3>
                            <p class="text-discord-lighter"><?php echo !empty($user->phone) ? htmlspecialchars($user->phone) : "You haven't added a phone number yet."; ?></p>
                        </div>
                        <button class="bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded px-4 py-1.5 text-sm font-medium">
                            <?php echo !empty($user->phone) ? 'Edit' : 'Add'; ?>
                        </button>
                    </div>
                </div>
                
                <!-- Password and Authentication Section -->
                <div class="mt-10 border-t border-gray-700 pt-8">
                    <h2 class="text-xl font-bold mb-6">Password and Authentication</h2>
                    
                    <button class="bg-[#5865f2] hover:bg-[#4752c4] text-white rounded px-4 py-2 text-sm font-medium">
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
                        
                        <button class="bg-[#5865f2] hover:bg-[#4752c4] text-white rounded px-4 py-2 text-sm font-medium">
                            Enable Authenticator App
                        </button>
                    </div>
                </div>
            </div>
        <?php else: ?>
            <div class="py-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-6"><?php echo ucfirst(str_replace('-', ' ', $section)); ?></h1>
                <p class="text-discord-lighter">This section is under development.</p>
            </div>
        <?php endif; ?>
    </div>
    
    <!-- User Preview Panel -->
    <div class="w-80 bg-discord-dark border-l border-discord-light p-6 pr-10 overflow-y-auto" style="height: 100vh;">
        <div class="user-preview-card bg-[#1e1f22] rounded-lg overflow-hidden">
            <!-- User Banner Preview -->
            <div class="user-banner h-40 bg-gradient-to-b from-[#5865f2] to-[#4752c4] relative">
                <?php if (isset($user->banner_url) && $user->banner_url): ?>
                    <img src="<?php echo htmlspecialchars($user->banner_url); ?>" alt="Banner" class="w-full h-full object-cover">
                <?php endif; ?>
                
                <!-- User Avatar Preview -->
                <div class="user-avatar-preview absolute -bottom-8 left-4 w-16 h-16 bg-discord-dark rounded-full border-4 border-[#1e1f22] overflow-hidden relative">
                    <img src="<?php echo htmlspecialchars($user->avatar_url ?? '/public/assets/common/main-logo.png'); ?>" alt="Avatar" class="w-full h-full object-cover">
                    
                    <!-- Status indicator in preview -->
                    <?php 
                    $statusClass = 'bg-discord-green';
                    if ($user->status === 'invisible') $statusClass = 'bg-gray-500';
                    else if ($user->status === 'do_not_disturb') $statusClass = 'bg-discord-red';
                    else if ($user->status === 'offline') $statusClass = 'bg-[#747f8d]';
                    ?>
                    <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1e1f22] <?php echo $statusClass; ?>"></div>
                </div>
            </div>
            
            <!-- User Info Preview -->
            <div class="user-info pt-10 px-4 pb-4">
                <h3 class="user-name text-white font-bold"><?php echo htmlspecialchars($user->username ?? ''); ?></h3>
                <div class="user-tag text-xs text-discord-lighter mt-1">
                    #<?php echo htmlspecialchars($user->discriminator ?? '0000'); ?>
                </div>
                
                <!-- Status Selector -->
                <div class="status-selector mt-4">
                    <div class="status-option flex items-center p-2 hover:bg-discord-dark rounded cursor-pointer <?php echo $user->status === 'appear' ? 'bg-discord-background-modifier-selected' : ''; ?>" data-status="appear">
                        <span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        <span class="text-sm text-white">Appear</span>
                    </div>
                    <div class="status-option flex items-center p-2 hover:bg-discord-dark rounded cursor-pointer <?php echo $user->status === 'invisible' ? 'bg-discord-background-modifier-selected' : ''; ?>" data-status="invisible">
                        <span class="w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
                        <span class="text-sm text-white">Invisible</span>
                    </div>
                    <div class="status-option flex items-center p-2 hover:bg-discord-dark rounded cursor-pointer <?php echo $user->status === 'do_not_disturb' ? 'bg-discord-background-modifier-selected' : ''; ?>" data-status="do_not_disturb">
                        <span class="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                        <span class="text-sm text-white">Do Not Disturb</span>
                    </div>
                    <div class="status-option flex items-center p-2 hover:bg-discord-dark rounded cursor-pointer <?php echo $user->status === 'offline' ? 'bg-discord-background-modifier-selected' : ''; ?>" data-status="offline">
                        <span class="w-3 h-3 bg-[#747f8d] rounded-full mr-2"></span>
                        <span class="text-sm text-white">Offline</span>
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
                <?php if (!empty($userBadges)): ?>
                    <?php foreach ($userBadges as $badge): ?>
                    <div class="w-8 h-8 bg-discord-darkest rounded-md flex items-center justify-center" title="<?php echo htmlspecialchars($badge->name); ?>">
                        <?php if (!empty($badge->icon_url)): ?>
                            <img src="<?php echo htmlspecialchars($badge->icon_url); ?>" alt="<?php echo htmlspecialchars($badge->name); ?>" class="w-5 h-5">
                        <?php else: ?>
                            <?php 
                            // Default icons based on badge type
                            $iconClass = 'fas fa-shield-alt text-[#5865f2]';
                            if ($badge->badge_type === 'nitro') $iconClass = 'fas fa-rocket text-[#5865f2]';
                            elseif ($badge->badge_type === 'boost') $iconClass = 'fas fa-bolt text-[#ff73fa]';
                            ?>
                            <i class="<?php echo $iconClass; ?>"></i>
                        <?php endif; ?>
                    </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <!-- Default badges for display if none from database -->
                    <div class="w-8 h-8 bg-discord-darkest rounded-md flex items-center justify-center" title="Discord Staff">
                        <i class="fas fa-shield-alt text-[#5865f2]"></i>
                    </div>
                    <div class="w-8 h-8 bg-discord-darkest rounded-md flex items-center justify-center" title="Nitro Subscriber">
                        <i class="fas fa-rocket text-[#5865f2]"></i>
                    </div>
                    <div class="w-8 h-8 bg-discord-darkest rounded-md flex items-center justify-center" title="Server Booster">
                        <i class="fas fa-bolt text-[#ff73fa]"></i>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <!-- Close button to return to previous page -->
    <div class="absolute top-6 right-6 flex items-center">
        <a href="javascript:history.back()" class="close-button flex items-center justify-center py-2">
            <div class="close-button-icon bg-[#4e5058] hover:bg-[#6d6f78] w-9 h-9 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
            <span class="close-button-text ml-2 text-xs">ESC</span>
        </a>
    </div>
</div>

<?php 
$content = ob_get_clean();
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php'; 
?>
