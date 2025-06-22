<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';
require_once dirname(dirname(__DIR__)) . '/controllers/AuthenticationController.php';
require_once dirname(dirname(__DIR__)) . '/controllers/UserController.php';
require_once dirname(dirname(__DIR__)) . '/database/repositories/UserBadgeRepository.php';

if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
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
$additional_js = ['components/common/image-cutter'];
$user_id = $_SESSION['user_id'];

$userController = new UserController();
$user = $userController->getUserData($user_id);

$userBadges = [];
if (class_exists('UserBadgeRepository')) {
    $badgeRepository = new UserBadgeRepository();
    $userBadges = $badgeRepository->getForUser($user_id);
}

$section = $_GET['section'] ?? 'my-account';

ob_start();
?>

<meta name="user-status" content="<?php echo htmlspecialchars($user->status ?? 'offline'); ?>">
<meta name="user-id" content="<?php echo htmlspecialchars($user->id ?? ''); ?>">
<meta name="user-avatar" content="<?php echo htmlspecialchars($user->avatar_url ?? '/public/assets/common/main-logo.png'); ?>">

<div class="flex min-h-screen max-w-[1480px] mx-auto">
    <div class="w-60 bg-discord-light border-r border-discord-dark">
        <div class="p-4">
            <div class="text-sm font-semibold text-white"><?php echo htmlspecialchars($user->username ?? ''); ?></div>
            <div class="text-xs text-discord-lighter mt-1">User Settings</div>
        </div>
        
        <nav class="mt-2">
            <ul>
                <li>
                    <div class="sidebar-category">
                        <span>USER SETTINGS</span>
                    </div>
                </li>
                <li>
                    <a href="?section=my-account" class="sidebar-item <?php echo $section === 'my-account' ? 'active' : ''; ?>">
                        My Account
                    </a>
                </li>
                <li>
                    <a href="?section=profiles" class="sidebar-item <?php echo $section === 'profiles' ? 'active' : ''; ?>">
                        Profiles
                    </a>
                </li>
                <li>
                    <a href="?section=connections" class="sidebar-item <?php echo $section === 'connections' ? 'active' : ''; ?>">
                        Connections
                    </a>
                </li>
                
                <li class="mt-6">
                    <div class="sidebar-category">
                        <span>APP SETTINGS</span>
                    </div>
                </li>
                <li>
                    <a href="?section=nitro" class="sidebar-item <?php echo $section === 'nitro' ? 'active' : ''; ?>">
                        Nitro
                        <span class="sidebar-item-badge">NEW</span>
                    </a>
                </li>
                <li>
                    <a href="?section=voice" class="sidebar-item <?php echo $section === 'voice' ? 'active' : ''; ?>">
                        Voice & Video
                    </a>
                </li>
                <li>
                    <a href="?section=text" class="sidebar-item <?php echo $section === 'text' ? 'active' : ''; ?>">
                        Text & Images
                    </a>
                </li>
                <li>
                    <a href="?section=notifications" class="sidebar-item <?php echo $section === 'notifications' ? 'active' : ''; ?>">
                        Notifications
                    </a>
                </li>
            </ul>
        </nav>
        
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
                localStorage.removeItem('user_token');
                localStorage.removeItem('connect_socket_on_login');
                
                window.location.href = '/login';
            }
        </script>
    </div>

    <div class="flex-1 bg-discord-dark overflow-y-auto">
        <?php if ($section === 'my-account'): ?>
            <div class="p-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-2">My Account</h1>

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
                
                <form id="user-profile-form" class="space-y-8">
                    <div class="form-group">
                        <label class="block text-sm font-medium text-white mb-2">Profile Picture</label>
                        <p class="text-discord-lighter text-sm mb-2">We recommend an image of at least 512x512.</p>
                        
                        <div class="flex items-center space-x-4">
                            <div id="server-icon-container" class="relative w-24 h-24 bg-discord-dark-input rounded-full overflow-hidden border border-gray-700">
                                <?php if ($user->avatar_url): ?>
                                    <img id="server-icon-preview" src="<?php echo htmlspecialchars($user->avatar_url); ?>" alt="User Avatar" class="w-full h-full object-cover">
                                <?php else: ?>
                                    <img id="server-icon-preview" src="/public/assets/common/main-logo.png" alt="Default Avatar" class="w-full h-full object-cover">
                                <?php endif; ?>
                                
                                <?php 
                                $statusClass = 'bg-discord-green';
                                if ($user->status === 'invisible') $statusClass = 'bg-gray-500';
                                else if ($user->status === 'do_not_disturb') $statusClass = 'bg-discord-red';
                                else if ($user->status === 'offline') $statusClass = 'bg-[#747f8d]';
                                ?>
                                <div class="absolute bottom-0 right-0.5 w-3 h-3 rounded-full border-2 border-discord-darker <?php echo $statusClass; ?>"></div>
                            </div>
                            
                            <button type="button" id="edit-profile-btn" class="bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2 px-4 rounded-md">
                                Change Avatar
                            </button>
                            
                            <?php if ($user->avatar_url): ?>
                                <button type="button" id="remove-avatar-btn" class="text-[#ed4245] hover:underline font-medium py-2 px-4">
                                    Remove
                                </button>
                            <?php endif; ?>
                            
                            <input type="file" id="avatar-input" name="avatar" class="hidden" accept="image/*">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="username" class="block text-sm font-medium text-white mb-2">Username</label>
                        <div class="flex">
                            <input type="text" id="username" name="username" class="form-input flex-grow" value="<?php echo htmlspecialchars($user->username ?? ''); ?>">
                            <span class="bg-discord-darker flex items-center px-3 rounded-r-md border-l border-gray-700">
                                #<?php echo htmlspecialchars($user->discriminator ?? '0000'); ?>
                            </span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="email" class="block text-sm font-medium text-white mb-2">Email</label>
                        <div class="flex items-center">
                            <p id="user-email-display" class="text-discord-lighter"><?php 
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
                                echo htmlspecialchars($hiddenEmail);
                            ?></p>
                            <button type="button" id="reveal-email-btn" data-email="<?php echo htmlspecialchars($email); ?>" class="ml-2 text-blue-500 hover:underline text-xs">
                                Reveal
                            </button>
                            <button type="button" id="edit-email-btn" class="ml-auto bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded px-4 py-1.5 text-sm font-medium">
                                Edit
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="phone" class="block text-sm font-medium text-white mb-2">Phone Number</label>
                        <div class="flex items-center">
                            <p class="text-discord-lighter"><?php echo !empty($user->phone) ? htmlspecialchars($user->phone) : "You haven't added a phone number yet."; ?></p>
                            <button type="button" id="edit-phone-btn" class="ml-auto bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded px-4 py-1.5 text-sm font-medium">
                                <?php echo !empty($user->phone) ? 'Edit' : 'Add'; ?>
                            </button>
                        </div>
                    </div>
                    
                    <div class="border-t border-gray-700 pt-8 mt-8">
                        <h2 class="text-xl font-bold mb-6">Password and Authentication</h2>
                        
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-medium">Password</h3>
                                <p class="text-discord-lighter text-sm">●●●●●●●●●●●●●●</p>
                            </div>
                            <button type="button" id="change-password-btn" class="bg-[#5865f2] hover:bg-[#4752c4] text-white rounded px-4 py-1.5 text-sm font-medium">
                                Change Password
                            </button>
                        </div>
                        
                        <div class="mt-8">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="font-medium">Two-Factor Authentication</h3>
                                    <p class="text-discord-lighter text-sm">
                                        Add an extra layer of security to your account
                                    </p>
                                </div>
                                <button type="button" id="enable-2fa-btn" class="bg-[#5865f2] hover:bg-[#4752c4] text-white rounded px-4 py-1.5 text-sm font-medium">
                                    Enable 2FA
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        <?php elseif ($section === 'profiles'): ?>
            <div class="p-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-6">Profiles</h1>
                <p class="text-discord-lighter">Customize how others see you across different servers.</p>
                
                <div class="mt-8 bg-[#2b2d31] p-6 rounded-lg">
                    <p class="text-center text-discord-lighter">This section is under development.</p>
                </div>
            </div>
        <?php else: ?>
            <div class="p-10 max-w-[740px]">
                <h1 class="text-2xl font-bold mb-6"><?php echo ucfirst(str_replace('-', ' ', $section)); ?></h1>
                <p class="text-discord-lighter">This section is under development.</p>
            </div>
        <?php endif; ?>
    </div>
    
    <div class="w-80 bg-discord-dark border-l border-discord-light p-6">
        <div class="server-preview-card bg-[#1e1f22] rounded-lg overflow-hidden">
            <div class="server-banner h-40 <?php echo $user->banner_url ? '' : 'bg-gradient-to-b from-[#5865f2] to-[#4752c4]'; ?>" 
                 <?php echo $user->banner_url ? 'style="background-image: url(\'' . htmlspecialchars($user->banner_url) . '\'); background-size: cover; background-position: center;"' : ''; ?>>
                
                <div class="server-icon-preview absolute -bottom-8 left-4 w-16 h-16 bg-discord-dark rounded-full border-4 border-[#1e1f22] overflow-hidden relative">
                    <?php if ($user->avatar_url): ?>
                        <img src="<?php echo htmlspecialchars($user->avatar_url); ?>" alt="User Avatar" class="w-full h-full object-cover">
                    <?php else: ?>
                        <img src="/public/assets/common/main-logo.png" alt="Default Avatar" class="w-full h-full object-cover">
                    <?php endif; ?>
                    
                    <?php 
                    $statusClass = 'bg-discord-green';
                    if ($user->status === 'invisible') $statusClass = 'bg-gray-500';
                    else if ($user->status === 'do_not_disturb') $statusClass = 'bg-discord-red';
                    else if ($user->status === 'offline') $statusClass = 'bg-[#747f8d]';
                    ?>
                    <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1e1f22] <?php echo $statusClass; ?>"></div>
                </div>
            </div>
            
            <div class="server-info pt-10 px-4 pb-4">
                <h3 class="server-name text-white font-bold"><?php echo htmlspecialchars($user->username ?? ''); ?></h3>
                <div class="server-meta flex items-center text-xs text-discord-lighter mt-1">
                    <span class="mx-1">#<?php echo htmlspecialchars($user->discriminator ?? '0000'); ?></span>
                </div>
                
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
                
                <div class="custom-status mt-4 p-2 hover:bg-discord-dark rounded cursor-pointer">
                    <div class="flex items-center">
                        <span class="text-sm text-discord-lighter">Set a custom status</span>
                        <i class="fas fa-pencil-alt ml-auto text-discord-lighter"></i>
                    </div>
                </div>
            </div>
        </div>
        
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
                            $iconClass = 'fas fa-shield-alt text-[#5865f2]';
                            if ($badge->badge_type === 'nitro') $iconClass = 'fas fa-rocket text-[#5865f2]';
                            elseif ($badge->badge_type === 'boost') $iconClass = 'fas fa-bolt text-[#ff73fa]';
                            ?>
                            <i class="<?php echo $iconClass; ?>"></i>
                        <?php endif; ?>
                    </div>
                    <?php endforeach; ?>
                <?php else: ?>
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
