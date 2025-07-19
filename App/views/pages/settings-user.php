<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';
require_once dirname(dirname(__DIR__)) . '/controllers/AuthenticationController.php';
require_once dirname(dirname(__DIR__)) . '/database/repositories/UserRepository.php';

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

$page_title = 'User Settings - MisVord';
$body_class = 'bg-discord-dark text-white settings-page';
$page_css = 'settings-user';
$page_js = 'components/auth/settings-user';
$head_scripts = ['logger-init'];
$data_page = 'settings-user';
$additional_js = ['components/common/image-cutter', 'components/settings/mic-video-check'];
$user_id = $_SESSION['user_id'];

$userRepository = new UserRepository();
$user = $userRepository->find($user_id);

if (!$user) {
    $page_title = 'Error - MisVord';
    $content = '<div class="flex items-center justify-center h-screen bg-discord-dark text-white"><p>Could not load user data. Please try again later.</p></div>';
    include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
    exit;
}

$section = $_GET['section'] ?? 'my-account';

ob_start();
?>

<meta name="user-status" content="<?php echo htmlspecialchars($user->status ?? 'offline'); ?>">
<meta name="user-id" content="<?php echo htmlspecialchars($user->id ?? ''); ?>">
<meta name="user-avatar" content="<?php echo htmlspecialchars($user->avatar_url ?? '/public/assets/common/default-profile-picture.png'); ?>">
<meta name="username" content="<?php echo htmlspecialchars($user->username ?? ''); ?>">
<meta name="display-name" content="<?php echo htmlspecialchars($user->display_name ?? $user->username ?? ''); ?>">
<meta name="user-bio" content="<?php echo htmlspecialchars($user->bio ?? ''); ?>">

<script>
document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('settings-page');
});
</script>

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
                <i class="fas fa-user-circle"></i>
                My Account
            </a>
            
            <div class="sidebar-category">
                <span>APP SETTINGS</span>
            </div>
            <a href="/nitro" class="sidebar-item">
                <i class="fas fa-crown text-purple-400"></i>
                Nitro
                <span class="sidebar-item-badge">Premium</span>
            </a>
            <a href="?section=voice" class="sidebar-item <?php echo $section === 'voice' ? 'active' : ''; ?>">
                <i class="fas fa-headset"></i>
                Voice & Video
            </a>
            
            <div class="sidebar-category">
                <span>USER ACTIONS</span>
            </div>
            <a href="?section=delete-account" class="sidebar-item text-red-500 hover:text-red-400 <?php echo $section === 'delete-account' ? 'active' : ''; ?>">
                <i class="fas fa-trash-alt mr-2"></i>
                Delete Account
            </a>
            <a href="#" id="logout-btn" class="sidebar-item text-red-500 hover:text-red-400">
                <i class="fas fa-sign-out-alt mr-2"></i>
                Log Out
            </a>
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
                                    <div id="user-avatar-container" class="relative">
                                        <?php if ($user->avatar_url): ?>
                                            <img id="user-avatar-preview" src="<?php echo htmlspecialchars($user->avatar_url); ?>" alt="<?php echo htmlspecialchars($user->username ?? 'User'); ?>">
                                        <?php else: ?>
                                            <div id="user-avatar-placeholder">
                                                <img src="<?php echo asset('/common/default-profile-picture.png'); ?>" alt="<?php echo htmlspecialchars($user->username ?? 'User'); ?>">
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
                                    <div id="user-banner-container">
                                        <?php if ($user->banner_url): ?>
                                            <img id="user-banner-preview" src="<?php echo htmlspecialchars($user->banner_url); ?>" alt="User Banner">
                                        <?php else: ?>
                                            <div id="user-banner-placeholder">
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
                                    
                                    <input type="file" id="user-banner-input" name="banner" class="hidden" accept="image/*">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="username" class="block text-sm font-medium text-white mb-2">Username</label>
                                <div class="flex">
                                    <input type="text" id="username" name="username" class="form-input flex-grow" value="<?php echo htmlspecialchars($user->username ?? ''); ?>" data-original-value="<?php echo htmlspecialchars($user->username ?? ''); ?>">
                                    <span class="bg-discord-darker flex items-center px-3 rounded-r-md border-l border-gray-700">
                                        #<?php echo htmlspecialchars($user->discriminator ?? '0000'); ?>
                                    </span>
                                    <button type="button" id="approve-username" class="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-md hidden">
                                        <i class="fas fa-check"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="display_name" class="block text-sm font-medium text-white mb-2">Display Name</label>
                                <div class="flex">
                                    <input type="text" id="display_name" name="display_name" class="form-input flex-grow" value="<?php echo htmlspecialchars($user->display_name ?? $user->username ?? ''); ?>" placeholder="Enter display name (optional)" data-original-value="<?php echo htmlspecialchars($user->display_name ?? $user->username ?? ''); ?>">
                                    <button type="button" id="approve-display-name" class="ml-2 bg-green-600 hover:bg-green-700 text-white px-3 rounded-md hidden">
                                        <i class="fas fa-check"></i>
                                    </button>
                                </div>
                                <p class="text-discord-lighter text-xs mt-1">This is how others see you. You can use any name you'd like.</p>
                            </div>
                            
                            <div class="form-group">
                                <label for="bio" class="block text-sm font-medium text-white mb-2">About Me</label>
                                <div class="flex flex-col">
                                    <textarea id="bio" name="bio" class="form-input resize-none" rows="3" maxlength="1000" placeholder="Tell us about yourself..." data-original-value="<?php echo htmlspecialchars($user->bio ?? ''); ?>"><?php echo htmlspecialchars($user->bio ?? ''); ?></textarea>
                                    <div class="flex justify-between items-center mt-1">
                                        <p class="text-discord-lighter text-xs">You can use up to 1000 characters.</p>
                                        <div class="flex items-center space-x-2">
                                            <span id="bio-counter" class="text-discord-lighter text-xs">0/1000</span>
                                            <button type="button" id="approve-bio" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm hidden">
                                                <i class="fas fa-check"></i>
                                            </button>
                                        </div>
                                    </div>
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
                        </section>
                        
                    </form>
                </div>
            </div>

        <?php elseif ($section === 'voice'): ?>
            <div class="p-10">
                <div class="max-w-[740px]">
                    <div class="mb-8">
                        <h1 class="text-3xl font-bold text-white mb-3">Voice & Video</h1>
                        <p class="text-gray-400">Configure your audio and video settings for the best communication experience</p>
                    </div>

                    <div class="voice-video-tabs mb-8">
                        <div class="tab-buttons">
                            <button class="voice-tab active" data-tab="voice">
                                <div class="tab-icon">
                                    <i class="fas fa-microphone"></i>
                                </div>
                                <span>Voice</span>
                            </button>
                            <button class="voice-tab" data-tab="video">
                                <div class="tab-icon">
                                    <i class="fas fa-video"></i>
                                </div>
                                <span>Video</span>
                            </button>
                        </div>
                    </div>

                    <div id="voice-content" class="tab-content">
                        <div class="voice-section-grid">
                            <div class="device-card input-device">
                                <div class="device-header">
                                    <div class="device-icon input">
                                        <i class="fas fa-microphone"></i>
                                    </div>
                                    <h3>Input Device</h3>
                                </div>
                                <div class="device-selector">
                                    <select id="input-device-select" class="device-dropdown">
                                        <option value="">Detecting devices...</option>
                                    </select>
                                    <div class="device-status">
                                        <div id="input-status-dot" class="status-dot"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="device-card output-device">
                                <div class="device-header">
                                    <div class="device-icon output">
                                        <i class="fas fa-headphones"></i>
                                    </div>
                                    <h3>Output Device</h3>
                                </div>
                                <div class="device-selector">
                                    <select id="output-device-select" class="device-dropdown">
                                        <option value="">Detecting devices...</option>
                                    </select>
                                    <div class="device-status">
                                        <div id="output-status-dot" class="status-dot"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="volume-card input-volume">
                                <div class="volume-header">
                                    <h3>Input Volume</h3>
                                    <span class="volume-value">50%</span>
                                </div>
                                <div class="volume-control">
                                    <input type="range" id="input-volume" class="volume-slider" min="0" max="100" value="50">
                                    <div class="volume-track">
                                        <div class="volume-fill"></div>
                                        <div class="volume-thumb"></div>
                                    </div>
                                </div>
                                <div class="volume-level-indicator">
                                    <div id="input-level" class="level-bar"></div>
                                </div>
                            </div>

                            <div class="volume-card output-volume">
                                <div class="volume-header">
                                    <h3>Output Volume</h3>
                                    <span class="volume-value">75%</span>
                                </div>
                                <div class="volume-control">
                                    <input type="range" id="output-volume" class="volume-slider" min="0" max="100" value="75">
                                    <div class="volume-track">
                                        <div class="volume-fill"></div>
                                        <div class="volume-thumb"></div>
                                    </div>
                                </div>
                                <div class="volume-level-indicator">
                                    <div id="output-level" class="level-bar"></div>
                                </div>
                            </div>

                            <div class="mic-test-card">
                                <div class="test-header">
                                    <h3>Microphone Test</h3>
                                    <p>Test your microphone to ensure it's working properly</p>
                                </div>
                                <div class="test-controls">
                                    <button id="mic-test-btn" class="test-button mic-test">
                                        <div class="button-content">
                                            <i class="fas fa-play"></i>
                                            <span>Start Test</span>
                                        </div>
                                    </button>
                                    <div class="mic-visualizer-container">
                                        <div class="mic-visualizer">
                                            <div class="visualizer-bar"></div>
                                            <div class="visualizer-bar"></div>
                                            <div class="visualizer-bar"></div>
                                            <div class="visualizer-bar"></div>
                                            <div class="visualizer-bar"></div>
                                            <div class="visualizer-bar"></div>
                                            <div class="visualizer-bar"></div>
                                            <div class="visualizer-bar"></div>
                                            <div class="visualizer-bar"></div>
                                            <div class="visualizer-bar"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="bluetooth-warning" class="warning-banner hidden">
                            <div class="warning-content">
                                <i class="fas fa-exclamation-triangle"></i>
                                <span>Using the same Bluetooth device for both input and output may affect audio quality</span>
                            </div>
                        </div>
                    </div>

                    <div id="video-content" class="tab-content hidden">
                        <div class="video-section">
                            <div class="video-device-card">
                                <div class="device-header">
                                    <div class="device-icon video">
                                        <i class="fas fa-video"></i>
                                    </div>
                                    <h3>Camera Device</h3>
                                </div>
                                <div class="device-selector">
                                    <select id="video-device-select" class="device-dropdown">
                                        <option value="">Detecting cameras...</option>
                                    </select>
                                    <div class="device-status">
                                        <div id="video-status-dot" class="status-dot"></div>
                                    </div>
                                </div>
                            </div>
                            </div>

                            <div class="video-preview-card">
                                <div class="preview-header">
                                    <h3>Camera Preview</h3>
                                    <button id="video-test-btn" class="test-button video-test">
                                        <div class="button-content">
                                            <i class="fas fa-play"></i>
                                            <span>Test Camera</span>
                                        </div>
                                    </button>
                                </div>
                                <div class="video-preview-container">
                                    <div id="video-preview" class="video-preview">
                                        <video id="video-preview-element" class="video-element" autoplay playsinline muted></video>
                                        <div class="video-placeholder">
                                            <div class="placeholder-icon">
                                                <i class="fas fa-video"></i>
                                            </div>
                                            <span>Click "Test Camera" to preview your video</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        <?php elseif ($section === 'delete-account'): ?>
            <div class="p-10">
                <div class="max-w-[740px]">
                    <div class="mb-8">
                        <h1 class="text-red-400">Delete Account</h1>
                        <p>Permanently delete your account and all associated data</p>
                    </div>
                    
                    <div class="bg-red-900/20 border border-red-600/50 rounded-lg p-6 mb-6">
                        <div class="flex items-start">
                            <i class="fas fa-exclamation-triangle text-red-400 text-xl mr-4 mt-1"></i>
                            <div>
                                <h3 class="text-red-300 font-semibold mb-2">Warning: This action cannot be undone</h3>
                                <p class="text-red-200 text-sm mb-3">Deleting your account will permanently remove:</p>
                                <ul class="text-red-200 text-sm space-y-1 list-disc list-inside ml-4">
                                    <li>Your profile, username, and personal information</li>
                                    <li>All your messages and chat history</li>
                                    <li>Your server memberships and roles</li>
                                    <li>Friend connections and direct messages</li>
                                    <li>Any uploaded files or media</li>
                                    <li>Nitro subscription and benefits</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-discord-darker rounded-lg p-6">
                        <h3 class="text-lg font-medium mb-4">Delete My Account</h3>
                        <p class="text-discord-lighter mb-6">
                            If you're sure you want to delete your account, click the button below. 
                            You'll be asked to confirm your username before the deletion process begins.
                        </p>
                        
                        <button type="button" id="delete-account-btn" class="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-md transition-colors">
                            <i class="fas fa-trash-alt mr-2"></i>
                            Delete My Account
                        </button>
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
</div>


<div id="change-password-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="w-full max-w-md mx-4">
        <div class="bg-discord-darker rounded-lg shadow-xl overflow-hidden border border-gray-700">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-semibold text-white">Change Password</h2>
                    <button id="close-password-modal" class="text-gray-400 hover:text-white transition-colors">
                        <i class="fas fa-times text-lg"></i>
                    </button>
                </div>
                
                
                <div id="security-question-step" class="space-y-4">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 mx-auto mb-4 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center">
                            <i class="fas fa-shield-alt text-yellow-400 text-2xl"></i>
                        </div>
                        <h3 class="text-lg font-medium text-white mb-2">Security Verification Required</h3>
                        <p class="text-gray-400 text-sm">Please answer your security question to continue</p>
                    </div>
                    
                    <div class="space-y-3">
                        <label class="block text-sm font-medium text-gray-300">Security Question</label>
                        <div id="security-question-text" class="bg-discord-dark border border-gray-600 rounded-md px-4 py-3 text-white text-sm">
                            Loading...
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <label class="block text-sm font-medium text-gray-300">Your Answer</label>
                        <input type="text" id="security-answer-input" 
                               class="w-full bg-discord-dark border border-gray-600 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                               placeholder="Enter your security answer">
                        <div id="security-answer-error" class="text-red-400 text-sm mt-1 hidden"></div>
                    </div>
                    
                    <div class="pt-4 flex space-x-3">
                        <button type="button" id="cancel-password-change" 
                                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-md transition-colors">
                            Cancel
                        </button>
                        <button type="button" id="verify-security-answer" 
                                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors">
                            Verify
                        </button>
                    </div>
                </div>
                
                <div id="set-security-step" class="space-y-4 hidden">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 mx-auto mb-4 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
                            <i class="fas fa-cog text-blue-400 text-2xl"></i>
                        </div>
                        <h3 class="text-lg font-medium text-white mb-2">Set Security Question</h3>
                        <p class="text-gray-400 text-sm">Please set a security question to secure your account</p>
                    </div>
                    
                    <div class="space-y-3">
                        <label class="block text-sm font-medium text-gray-300">Security Question</label>
                        <select id="set-question-select" 
                                class="w-full bg-discord-dark border border-gray-600 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                            <option value="">Select a security question</option>
                            <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                            <option value="In what city were you born?">In what city were you born?</option>
                            <option value="What was the name of your first school?">What was the name of your first school?</option>
                            <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                            <option value="What was your favorite food as a child?">What was your favorite food as a child?</option>
                            <option value="What is the name of the street where you grew up?">What is the name of the street where you grew up?</option>
                        </select>
                    </div>
                    
                    <div class="space-y-3">
                        <label class="block text-sm font-medium text-gray-300">Your Answer</label>
                        <input type="text" id="set-answer-input" 
                               class="w-full bg-discord-dark border border-gray-600 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                               placeholder="Enter your security answer">
                        <div class="text-xs text-gray-400 mt-1">Make sure you remember this answer - you'll need it to change your password</div>
                        <div id="set-security-error" class="text-red-400 text-sm mt-1 hidden"></div>
                    </div>
                    
                    <div class="pt-4 flex space-x-3">
                        <button type="button" id="cancel-password-change" 
                                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-md transition-colors">
                            Cancel
                        </button>
                        <button type="button" id="set-security-question-btn" 
                                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors">
                            Set Security Question
                        </button>
                    </div>
                </div>
                
                <div id="new-password-step" class="space-y-4 hidden">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 mx-auto mb-4 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center">
                            <i class="fas fa-key text-green-400 text-2xl"></i>
                        </div>
                        <h3 class="text-lg font-medium text-white mb-2">Set New Password</h3>
                        <p class="text-gray-400 text-sm">Enter your new password below</p>
                    </div>
                    
                    <div class="space-y-3">
                        <label class="block text-sm font-medium text-gray-300">New Password</label>
                        <input type="password" id="new-password-input" 
                               class="w-full bg-discord-dark border border-gray-600 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                               placeholder="Enter new password">
                        <div class="text-xs text-gray-400 mt-1">
                            • At least 8 characters • One uppercase letter • One number<br>
                            • Must be different from your current password
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <label class="block text-sm font-medium text-gray-300">Confirm New Password</label>
                        <input type="password" id="confirm-password-input" 
                               class="w-full bg-discord-dark border border-gray-600 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                               placeholder="Confirm new password">
                        <div id="password-error" class="text-red-400 text-sm mt-1 hidden"></div>
                    </div>
                    
                    <div class="pt-4 flex space-x-3">
                        <button type="button" id="back-to-security" 
                                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-md transition-colors">
                            Back
                        </button>
                        <button type="button" id="confirm-password-change" 
                                class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition-colors">
                            Change Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>


<div id="delete-account-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="w-full max-w-md mx-auto relative px-2 sm:px-0">
        <div class="bg-discord-darker rounded-lg shadow-xl overflow-hidden border border-red-600 w-full">
            <div class="p-8">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-semibold text-red-400">Delete Account</h2>
                    <button id="close-delete-modal" class="text-gray-400 hover:text-white transition-colors">
                        <i class="fas fa-times text-lg"></i>
                    </button>
                </div>
                
                <div class="text-center mb-8">
                    <div class="w-20 h-20 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-white text-4xl"></i>
                    </div>
                    <h3 class="text-xl font-medium text-white mb-2">Are you sure you want to delete your account?</h3>
                    <p class="text-gray-400 text-sm">This action cannot be undone.</p>
                </div>
                
                <div id="owned-servers-section" class="mb-8 bg-discord-bg-tertiary/50 rounded-md p-6">
                    <div class="text-center py-4">
                        <i class="fas fa-spinner fa-spin text-discord-blurple"></i> Checking for owned servers...
                    </div>
                </div>
                
                <div class="mb-6">
                    <label for="username-confirmation-input" class="block text-gray-300 text-sm font-medium mb-2">
                        To confirm, enter your username (<span class="text-white font-semibold"><?php echo htmlspecialchars($user->username ?? ''); ?></span>)
                    </label>
                    <input type="text" id="username-confirmation-input" 
                        class="w-full bg-discord-bg-tertiary border border-gray-700 rounded-md px-4 py-3 text-white 
                        placeholder-discord-interactive-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple focus:border-transparent"
                        placeholder="Enter username">
                    <div id="delete-account-error" class="text-red-500 text-sm mt-2 hidden"></div>
                </div>
                
                <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
                    <button id="cancel-delete-account" class="w-full sm:w-auto px-4 py-2 rounded-md bg-discord-bg-tertiary hover:bg-discord-bg-hover text-white font-medium">
                        Cancel
                    </button>
                    <button id="confirm-delete-account" class="w-full sm:w-auto px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium opacity-50 cursor-not-allowed" disabled>
                        <i class="fas fa-trash-alt mr-2"></i>Delete Account
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<button class="close-button">
    <div class="close-button-icon">
        <i class="fas fa-times"></i>
    </div>
    <span class="close-button-text">ESC</span>
</button>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>
