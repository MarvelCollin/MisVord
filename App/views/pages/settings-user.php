<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';
require_once dirname(dirname(__DIR__)) . '/controllers/AuthenticationController.php';
require_once dirname(dirname(__DIR__)) . '/database/repositories/UserRepository.php';
require_once dirname(dirname(__DIR__)) . '/database/repositories/UserBadgeRepository.php';

if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

if (!isset($_SESSION['user_id'])) {
    header('Location: /login');
    exit;
}

$page_title = 'User Settings - misvord';
$body_class = 'bg-discord-dark text-white settings-page';
$page_css = 'settings-user';
$page_js = 'components/auth/settings-user';
$head_scripts = ['logger-init'];
$data_page = 'settings-user';
$additional_js = ['components/common/image-cutter'];
$user_id = $_SESSION['user_id'];

$userRepository = new UserRepository();
$user = $userRepository->find($user_id);

if (!$user) {
    // Handle the case where the user is not found
    $page_title = 'Error - misvord';
    $content = '<div class="flex items-center justify-center h-screen bg-discord-dark text-white"><p>Could not load user data. Please try again later.</p></div>';
    include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
    exit;
}

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
<meta name="user-avatar" content="<?php echo htmlspecialchars($user->avatar_url ?? '/public/assets/main-logo.png'); ?>">

<div class="flex min-h-screen">
    <aside class="w-60">
        <div class="p-4">
            <div class="text-sm"><?php echo htmlspecialchars($user->username ?? ''); ?></div>
            <div class="text-xs">User Settings</div>
        </div>
        
        <nav>
            <div class="sidebar-category">
                <span>USER SETTINGS</span>
            </div>
            <a href="?section=my-account" class="sidebar-item <?php echo $section === 'my-account' ? 'active' : ''; ?>">
                My Account
            </a>
            <a href="?section=profiles" class="sidebar-item <?php echo $section === 'profiles' ? 'active' : ''; ?>">
                Profiles
            </a>
            <a href="?section=connections" class="sidebar-item <?php echo $section === 'connections' ? 'active' : ''; ?>">
                Connections
            </a>
            
            <div class="sidebar-category">
                <span>APP SETTINGS</span>
            </div>
            <a href="?section=nitro" class="sidebar-item <?php echo $section === 'nitro' ? 'active' : ''; ?>">
                Nitro
                <span class="sidebar-item-badge">NEW</span>
            </a>
            <a href="?section=voice" class="sidebar-item <?php echo $section === 'voice' ? 'active' : ''; ?>">
                Voice & Video
            </a>
            <a href="?section=text" class="sidebar-item <?php echo $section === 'text' ? 'active' : ''; ?>">
                Text & Images
            </a>
            <a href="?section=notifications" class="sidebar-item <?php echo $section === 'notifications' ? 'active' : ''; ?>">
                Notifications
            </a>
            
            <button id="logout-btn" class="sidebar-item text-red-500 hover:text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log Out
            </button>
        </nav>
    </aside>

    <main class="flex-1 bg-discord-dark">
        <?php if ($section === 'my-account'): ?>
            <div class="p-10">
                <div class="max-w-[740px]">
                    <div class="mb-8">
                        <h1>My Account</h1>
                        <p>Manage your account information and settings</p>
                    </div>

                    <form id="user-profile-form" class="space-y-8">
                        <section class="bg-discord-darker rounded-lg p-6 space-y-6">
                            <div class="form-group">
                                <label class="block text-sm font-medium text-white mb-2">Profile Picture</label>
                                <p class="text-discord-lighter text-xs mb-3">We recommend an image of at least 512×512.</p>
                                
                                <div class="flex items-center space-x-4">
                                    <div id="server-icon-container" class="relative">
                                        <?php if ($user->avatar_url): ?>
                                            <img id="server-icon-preview" src="<?php echo htmlspecialchars($user->avatar_url); ?>" alt="User Avatar">
                                        <?php else: ?>
                                            <div id="server-icon-placeholder">
                                                <img src="<?php echo asset('/common/main-logo.png'); ?>" alt="Default Avatar">
                                            </div>
                                        <?php endif; ?>
                                        
                                        <?php 
                                        $statusClass = 'bg-green-500';
                                        if ($user->status === 'invisible') $statusClass = 'bg-gray-500';
                                        else if ($user->status === 'do_not_disturb') $statusClass = 'bg-red-500';
                                        else if ($user->status === 'offline') $statusClass = 'bg-[#747f8d]';
                                        ?>
                                        <div class="absolute bottom-0 right-0 status-indicator <?php echo $statusClass; ?>"></div>
                                    </div>
                                    
                                    <div>
                                        <?php if ($user->avatar_url): ?>
                                            <button type="button" id="remove-avatar-btn" class="text-[#ed4245]">
                                                Remove
                                            </button>
                                        <?php else: ?>
                                            <button type="button" id="remove-avatar-btn" class="text-[#ed4245] hidden">
                                                Remove
                                            </button>
                                        <?php endif; ?>
                                    </div>
                                    
                                    <input type="file" id="avatar-input" name="avatar" class="hidden" accept="image/*">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="block text-sm font-medium text-white mb-2">Profile Banner</label>
                                <p class="text-discord-lighter text-xs mb-3">Express yourself with a banner image. Recommended size: 960×240.</p>
                                
                                <div class="space-y-4">
                                    <div id="banner-container">
                                        <?php if ($user->banner_url): ?>
                                            <img id="banner-preview" src="<?php echo htmlspecialchars($user->banner_url); ?>" alt="User Banner">
                                        <?php else: ?>
                                            <div id="banner-placeholder">
                                                <span>Click to add a banner</span>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                    
                                    <div>
                                        <?php if ($user->banner_url): ?>
                                            <button type="button" id="remove-banner-btn" class="text-[#ed4245]">
                                                Remove Banner
                                            </button>
                                        <?php else: ?>
                                            <button type="button" id="remove-banner-btn" class="text-[#ed4245] hidden">
                                                Remove Banner
                                            </button>
                                        <?php endif; ?>
                                    </div>
                                    
                                    <input type="file" id="banner-input" name="banner" class="hidden" accept="image/*">
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
                        </section>
                        
                        <section class="bg-discord-darker rounded-lg p-6 space-y-6">
                            <h3 class="text-lg font-medium mb-4">Contact Information</h3>
                            
                            <div class="form-group">
                                <label for="email" class="block text-sm font-medium text-white mb-2">Email</label>
                                <div class="flex items-center">
                                    <p id="user-email-display" class="text-discord-lighter">
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
                                        echo htmlspecialchars($hiddenEmail);
                                        ?>
                                    </p>
                                    <button type="button" id="reveal-email-btn" data-email="<?php echo htmlspecialchars($email); ?>" class="ml-2 text-blue-500 text-xs">
                                        Reveal
                                    </button>
                                    <button type="button" id="edit-email-btn" class="ml-auto bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded px-4 py-1.5 text-sm">
                                        Edit
                                    </button>
                                </div>
                            </div>
                        </section>
                        
                        <section class="bg-discord-darker rounded-lg p-6 space-y-6">
                            <h3 class="text-lg font-medium mb-4">Password and Authentication</h3>
                            
                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="font-medium text-white">Password</h4>
                                    <p class="text-discord-lighter text-sm">●●●●●●●●●●●●●●</p>
                                </div>
                                <button type="button" id="change-password-btn" class="bg-[#5865f2] hover:bg-[#4752c4] text-white rounded px-4 py-1.5 text-sm">
                                    Change Password
                                </button>
                            </div>
                            
                            <div class="mt-8">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h4 class="font-medium text-white">Authenticator App</h4>
                                        <p class="text-discord-lighter text-sm">
                                            Protect your Discord account with an extra layer of security. Once configured, you'll be required to enter your password and complete one additional step in order to sign in.
                                        </p>
                                    </div>
                                    <button type="button" id="enable-2fa-btn" class="bg-[#5865f2] hover:bg-[#4752c4] text-white rounded px-4 py-1.5 text-sm">
                                        Enable Authenticator App
                                    </button>
                                </div>
                            </div>
                        </section>
                        
                        <div class="flex justify-end pt-4">
                            <button type="submit" id="save-changes-btn">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        <?php elseif ($section === 'profiles'): ?>
            <div class="p-10">
                <div class="max-w-[740px]">
                    <div class="mb-8">
                        <h1>Profiles</h1>
                        <p>Customize how others see you across different servers.</p>
                    </div>
                    
                    <div class="bg-discord-darker rounded-lg p-6">
                        <p class="text-center text-discord-lighter">This section is under development.</p>
                    </div>
                </div>
            </div>
        <?php else: ?>
            <div class="p-10">
                <div class="max-w-[740px]">
                    <div class="mb-8">
                        <h1><?php echo ucfirst(str_replace('-', ' ', $section)); ?></h1>
                        <p>This section is under development.</p>
                    </div>
                    
                    <div class="bg-discord-darker rounded-lg p-6">
                        <p class="text-center text-discord-lighter">Coming soon!</p>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </main>
    
    <aside class="w-80">
        <div class="p-6">
            <div class="sticky top-6">
                <h3 class="text-sm font-semibold text-discord-lighter uppercase mb-4">Preview</h3>
                
                <div class="server-preview-card">
                    <?php
                    $bannerStyle = 'background-color: #2b2d31;';
                    if ($user->banner_url) {
                        $bannerStyle .= 'background-image: url(\'' . htmlspecialchars($user->banner_url) . '\'); background-size: cover; background-position: center;';
                    } else {
                        $bannerStyle .= 'background-image: url(\'' . asset('/common/main-logo.png') . '\'); background-size: contain; background-repeat: no-repeat; background-position: center;';
                    }
                    ?>
                    <div class="server-banner" style="<?php echo $bannerStyle; ?>">
                        <div class="server-icon-preview">
                            <img src="<?php echo $user->avatar_url ? htmlspecialchars($user->avatar_url) : asset('/common/main-logo.png'); ?>" alt="User Avatar">
                            
                            <?php 
                            $statusClass = 'bg-green-500';
                            if ($user->status === 'invisible') $statusClass = 'bg-gray-500';
                            else if ($user->status === 'do_not_disturb') $statusClass = 'bg-red-500';
                            else if ($user->status === 'offline') $statusClass = 'bg-[#747f8d]';
                            ?>
                            <div class="absolute bottom-0 right-0 status-indicator <?php echo $statusClass; ?>"></div>
                        </div>
                    </div>
                    
                    <div class="server-info">
                        <h3 class="server-name"><?php echo htmlspecialchars($user->username ?? ''); ?></h3>
                        <div class="server-meta">
                            <span>#<?php echo htmlspecialchars($user->discriminator ?? '0000'); ?></span>
                        </div>
                        
                        <div class="status-selector">
                            <div class="status-option <?php echo $user->status === 'appear' ? 'bg-discord-background-modifier-selected' : ''; ?>" data-status="appear">
                                <span class="bg-green-500"></span>
                                <span>Online</span>
                            </div>
                            <div class="status-option <?php echo $user->status === 'invisible' ? 'bg-discord-background-modifier-selected' : ''; ?>" data-status="invisible">
                                <span class="bg-gray-500"></span>
                                <span>Invisible</span>
                            </div>
                            <div class="status-option <?php echo $user->status === 'do_not_disturb' ? 'bg-discord-background-modifier-selected' : ''; ?>" data-status="do_not_disturb">
                                <span class="bg-red-500"></span>
                                <span>Do Not Disturb</span>
                            </div>
                            <div class="status-option <?php echo $user->status === 'offline' ? 'bg-discord-background-modifier-selected' : ''; ?>" data-status="offline">
                                <span class="bg-[#747f8d]"></span>
                                <span>Invisible</span>
                            </div>
                        </div>
                        
                        <div class="custom-status">
                            <span>Set a custom status</span>
                            <i class="fas fa-pencil-alt"></i>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6">
                    <h4 class="text-sm font-semibold text-discord-lighter uppercase mb-4">Account Badges</h4>
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
                
                <div class="mt-4 text-xs text-discord-lighter">
                    <p class="mb-2">This is how others will see you.</p>
                    <p>Changes will be applied after saving.</p>
                </div>
            </div>
        </div>
    </aside>
</div>

<button class="close-button">
    <div class="close-button-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    </div>
    <span class="close-button-text">ESC</span>
</button>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>

<script>
document.addEventListener('DOMContentLoaded', function() {
    function removeLeaveServerModals() {
        const modalTexts = ['Leave Server', 'Are you sure', 'rejoin', 'Cancel'];
        
        const allOverlays = document.querySelectorAll('.backdrop, .overlay, .modal-overlay, .modal-backdrop');
        allOverlays.forEach(overlay => {
            overlay.style.display = 'none';
            overlay.style.visibility = 'hidden';
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
        });
        
        const allModals = document.querySelectorAll('div[role="dialog"], .modal, [class*="modal"], .modal-content');
        allModals.forEach(modal => {
            if (!modal || !modal.textContent) return;
            
            let foundKeywords = 0;
            modalTexts.forEach(text => {
                if (modal.textContent.indexOf(text) >= 0) {
                    foundKeywords++;
                }
            });
            
            if (foundKeywords >= 2) {
                modal.remove();
            }
        });
        
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
    }
    
    removeLeaveServerModals();
    setTimeout(removeLeaveServerModals, 100);
    setTimeout(removeLeaveServerModals, 500);
    setTimeout(removeLeaveServerModals, 1000);
    setTimeout(removeLeaveServerModals, 2000);
});
</script>
