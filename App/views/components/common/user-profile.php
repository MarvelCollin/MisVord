<?php
require_once dirname(dirname(dirname(__DIR__))) . '/controllers/FriendController.php';

if (!isset($currentUser) || empty($currentUser)) {
    $friendController = new FriendController();
    $friendData = $friendController->getUserFriends();
    $currentUser = $friendData['currentUser'];
}

$tooltipPath = dirname(__DIR__) . '/common/tooltip.php';
$hasTooltip = file_exists($tooltipPath);
if ($hasTooltip) {
    require_once $tooltipPath;
}
?>

<div class="p-2 bg-discord-darker flex items-center mt-auto user-profile-section">
    <div class="relative">        
        <?php if ($hasTooltip): ?>
            <?php
                $userAvatar = ($currentUser && isset($currentUser->avatar_url) && $currentUser->avatar_url) ? $currentUser->avatar_url : asset('/common/default-profile-picture.png');
                $userName = ($currentUser && isset($currentUser->username)) ? $currentUser->username : ($_SESSION['username'] ?? 'User');
                $userDiscriminator = ($currentUser && isset($currentUser->discriminator)) ? $currentUser->discriminator : ($_SESSION['discriminator'] ?? '0000');
                
                $userAvatarContent = '<div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-2 user-profile-trigger transition-transform hover:scale-105" data-user-id="' . htmlspecialchars($_SESSION['user_id'] ?? '') . '">
                    <img src="' . htmlspecialchars($userAvatar) . '" 
                         alt="Avatar" class="w-full h-full object-cover">
                </div>';
                
                echo tooltip($userAvatarContent, htmlspecialchars($userName) . '#' . htmlspecialchars($userDiscriminator), 'top');
            ?>        <?php else: ?>
            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-2 user-profile-trigger transition-transform hover:scale-105" data-user-id="<?php echo htmlspecialchars($_SESSION['user_id'] ?? ''); ?>">
                    <img src="<?php echo ($currentUser && isset($currentUser->avatar_url) && $currentUser->avatar_url) ? htmlspecialchars($currentUser->avatar_url) : asset('/common/default-profile-picture.png'); ?>"
         alt="Avatar" class="w-full h-full object-cover user-avatar">
            </div>
        <?php endif; ?>
          <?php 
        $statusColor = 'bg-gray-500';
        if ($currentUser && isset($currentUser->status)) {
            switch ($currentUser->status) {
                case 'appear':
                    $statusColor = 'bg-discord-green';
                    break;
                case 'invisible':
                    $statusColor = 'bg-gray-500';
                    break;
                case 'do_not_disturb':
                    $statusColor = 'bg-discord-red';
                    break;
                case 'offline':
                    $statusColor = 'bg-[#747f8d]';
                    break;
                case 'banned':
                    $statusColor = 'bg-black';
                    break;
                default:
                    $statusColor = 'bg-discord-green';
            }
        } else {
            $statusColor = 'bg-discord-green';
        }
        ?>
        <span class="absolute bottom-0 right-0.5 w-3 h-3 rounded-full border-2 border-discord-darker <?php echo $statusColor; ?> transition-colors"></span>
    </div>
    
    <div class="flex-1 min-w-0">
        <div class="text-sm text-white font-medium truncate" id="current-user-name" data-user-id="<?php echo htmlspecialchars($_SESSION['user_id'] ?? ''); ?>"><?php echo htmlspecialchars(($currentUser && isset($currentUser->display_name) && $currentUser->display_name) ? $currentUser->display_name : (($currentUser && isset($currentUser->username)) ? $currentUser->username : ($_SESSION['username'] ?? 'User'))); ?></div>
        <?php if ($hasTooltip): ?>
            <?php
                $usernameDiscriminator = htmlspecialchars(($currentUser && isset($currentUser->username)) ? $currentUser->username : ($_SESSION['username'] ?? 'User')) . '#' . htmlspecialchars($_SESSION['discriminator'] ?? rand(1000, 9999));
                $usernameContent = '<div class="text-xs text-discord-lighter truncate cursor-help">' . $usernameDiscriminator . '</div>';
                echo tooltip($usernameContent, $usernameDiscriminator, 'top');
            ?>
        <?php else: ?>
            <div class="text-xs text-discord-lighter truncate"><?php echo htmlspecialchars(($currentUser && isset($currentUser->username)) ? $currentUser->username : ($_SESSION['username'] ?? 'User')); ?>#<?php echo htmlspecialchars($_SESSION['discriminator'] ?? rand(1000, 9999)); ?></div>
        <?php endif; ?>
    </div>
    
    <div class="flex items-center space-x-2 ml-auto">
        <?php if ($hasTooltip): ?>
            <?php
                $micContent = '<button class="mic-btn text-discord-lighter hover:text-white transition-colors duration-150">
                    <i class="fas fa-microphone text-lg"></i>
                </button>';
                echo tooltip($micContent, 'Mute', 'top');
                
                $headphonesContent = '<button class="deafen-btn text-discord-lighter hover:text-white transition-colors duration-150">
                    <i class="fas fa-headphones text-lg"></i>
                </button>';
                echo tooltip($headphonesContent, 'Deafen', 'top');
                
                $settingsContent = '<a href="/settings/user" class="text-discord-lighter hover:text-white transition-colors duration-150 p-1 rounded hover:bg-discord-background-modifier-hover">
                    <i class="fas fa-cog text-lg"></i>
                </a>';
                echo tooltip($settingsContent, 'User Settings', 'top');
            ?>
        <?php else: ?>
            <button class="mic-btn text-discord-lighter hover:text-white transition-colors duration-150" title="Mute">
                <i class="fas fa-microphone text-lg"></i>
            </button>
            <button class="deafen-btn text-discord-lighter hover:text-white transition-colors duration-150" title="Deafen">
                <i class="fas fa-headphones text-lg"></i>
            </button>
            <a href="/settings/user" class="text-discord-lighter hover:text-white transition-colors duration-150 p-1 rounded hover:bg-discord-background-modifier-hover" title="User Settings">
                <i class="fas fa-cog text-lg"></i>
            </a>
        <?php endif; ?>
    </div>
</div>

<script>
class UserProfileVoiceControls {
    constructor() {
        this.micBtn = null;
        this.deafenBtn = null;
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 50;
        this.eventListenersAttached = false;
        
        console.log('[USER-PROFILE] 🎯 UserProfileVoiceControls constructor called');
        this.init();
    }
    
    async init() {
        console.log('[USER-PROFILE] 🚀 Starting initialization...');
        
        try {
            await this.waitForDependencies();
            await this.setupElements();
            this.setupEventListeners();
            this.updateControls();
            this.initialized = true;
            console.log('✅ [USER-PROFILE] Voice controls fully initialized');
        } catch (error) {
            console.error('❌ [USER-PROFILE] Initialization failed:', error);
        }
    }
    
    async waitForDependencies() {
        console.log('[USER-PROFILE] ⏳ Waiting for dependencies...');
        
        return new Promise((resolve, reject) => {
            const checkDependencies = () => {
                const hasLocalStorage = !!window.localStorageManager;
                const hasMusicLoader = !!window.MusicLoaderStatic;
                
                console.log('[USER-PROFILE] 🔍 Dependency check:', {
                    localStorageManager: hasLocalStorage,
                    MusicLoaderStatic: hasMusicLoader,
                    retryCount: this.retryCount,
                    maxRetries: this.maxRetries
                });
                
                if (hasLocalStorage && hasMusicLoader) {
                    console.log('✅ [USER-PROFILE] All dependencies ready');
                    resolve();
                } else if (this.retryCount >= this.maxRetries) {
                    const missingDeps = [];
                    if (!hasLocalStorage) missingDeps.push('localStorageManager');
                    if (!hasMusicLoader) missingDeps.push('MusicLoaderStatic');
                    
                    console.error('❌ [USER-PROFILE] CRITICAL: Missing dependencies after max retries:', missingDeps);
                    console.error('❌ [USER-PROFILE] Available window objects:', Object.keys(window).filter(key => key.includes('local') || key.includes('Music') || key.includes('voice')));
                    
                    reject(new Error(`Missing dependencies: ${missingDeps.join(', ')}`));
                } else {
                    this.retryCount++;
                    setTimeout(checkDependencies, 100);
                }
            };
            checkDependencies();
        });
    }
    
    async setupElements() {
        console.log('[USER-PROFILE] 🔍 Setting up DOM elements...');
        
        return new Promise((resolve) => {
            const findElements = () => {
                this.micBtn = document.querySelector('.user-profile-section .mic-btn');
                this.deafenBtn = document.querySelector('.user-profile-section .deafen-btn');
                
                console.log('[USER-PROFILE] 🎯 Element search results:', {
                    micBtn: !!this.micBtn,
                    deafenBtn: !!this.deafenBtn,
                    micBtnElement: this.micBtn,
                    deafenBtnElement: this.deafenBtn
                });
                
                if (this.micBtn && this.deafenBtn) {
                    console.log('✅ [USER-PROFILE] All voice control buttons found');
                    resolve();
                } else {
                    const userProfileSection = document.querySelector('.user-profile-section');
                    const allMicBtns = document.querySelectorAll('.mic-btn');
                    const allDeafenBtns = document.querySelectorAll('.deafen-btn');
                    
                    console.error('❌ [USER-PROFILE] CRITICAL: Voice control buttons not found!');
                    console.error('❌ [USER-PROFILE] Debug info:', {
                        userProfileSection: !!userProfileSection,
                        userProfileSectionHTML: userProfileSection?.outerHTML.substring(0, 200) + '...',
                        allMicBtnsCount: allMicBtns.length,
                        allDeafenBtnsCount: allDeafenBtns.length,
                        micBtns: Array.from(allMicBtns).map(btn => btn.outerHTML.substring(0, 100)),
                        deafenBtns: Array.from(allDeafenBtns).map(btn => btn.outerHTML.substring(0, 100))
                    });
                    
                    setTimeout(findElements, 200);
                }
            };
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', findElements);
            } else {
                findElements();
            }
        });
    }
    
    setupEventListeners() {
        if (this.eventListenersAttached) {
            console.log('[USER-PROFILE] ⚠️ Event listeners already attached, skipping');
            return;
        }
        
        console.log('[USER-PROFILE] 🎧 Setting up event listeners...');
        
        if (this.micBtn) {
            this.micBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[USER-PROFILE] 🎤 Mic button clicked');
                this.handleMicClick();
            });
            console.log('✅ [USER-PROFILE] Mic button event listener attached');
        } else {
            console.error('❌ [USER-PROFILE] Cannot attach mic button listener - button not found');
        }
        
        if (this.deafenBtn) {
            this.deafenBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[USER-PROFILE] 🔇 Deafen button clicked');
                this.handleDeafenClick();
            });
            console.log('✅ [USER-PROFILE] Deafen button event listener attached');
        } else {
            console.error('❌ [USER-PROFILE] Cannot attach deafen button listener - button not found');
        }
        
        window.addEventListener('voiceStateChanged', () => {
            console.log('[USER-PROFILE] 🔄 Voice state changed event received');
            this.updateControls();
        });
        
        if (window.localStorageManager) {
            window.localStorageManager.addVoiceStateListener(() => {
                console.log('[USER-PROFILE] 🔄 LocalStorage voice state listener triggered');
                this.updateControls();
            });
        }
        
        if (window.unifiedVoiceStateManager) {
            window.unifiedVoiceStateManager.storageManager.addVoiceStateListener(() => {
                console.log('[USER-PROFILE] 🔄 Unified voice state listener triggered');
                this.updateControls();
            });
        }
        
        this.eventListenersAttached = true;
        console.log('✅ [USER-PROFILE] All event listeners attached');
    }
    
    updateControls() {
        if (!window.localStorageManager) {
            console.error('❌ [USER-PROFILE] Cannot update controls - localStorageManager not available');
            return;
        }
        
        try {
            const state = window.localStorageManager.getVoiceState();
            console.log('[USER-PROFILE] 🔄 Updating controls with state:', state);
            
            this.updateMicButton(state);
            this.updateDeafenButton(state);
            
            console.log('✅ [USER-PROFILE] Controls updated successfully');
        } catch (error) {
            console.error('❌ [USER-PROFILE] Error updating controls:', error);
        }
    }
    
    updateMicButton(state) {
        if (!this.micBtn) {
            console.error('❌ [USER-PROFILE] Cannot update mic button - element not found');
            return;
        }
        
        const micIcon = this.micBtn.querySelector('i');
        if (!micIcon) {
            console.error('❌ [USER-PROFILE] Cannot update mic button - icon not found');
            return;
        }
        
        if (state.isMuted || state.isDeafened) {
            micIcon.className = 'fas fa-microphone-slash text-lg';
            this.micBtn.classList.add('text-[#ed4245]');
            this.micBtn.classList.remove('text-discord-lighter');
            console.log('[USER-PROFILE] 🎤 Mic button set to MUTED state');
        } else {
            micIcon.className = 'fas fa-microphone text-lg';
            this.micBtn.classList.remove('text-[#ed4245]');
            this.micBtn.classList.add('text-discord-lighter');
            console.log('[USER-PROFILE] 🎤 Mic button set to UNMUTED state');
        }
    }
    
    updateDeafenButton(state) {
        if (!this.deafenBtn) {
            console.error('❌ [USER-PROFILE] Cannot update deafen button - element not found');
            return;
        }
        
        const deafenIcon = this.deafenBtn.querySelector('i');
        if (!deafenIcon) {
            console.error('❌ [USER-PROFILE] Cannot update deafen button - icon not found');
            return;
        }
        
        if (state.isDeafened) {
            deafenIcon.className = 'fas fa-volume-xmark text-lg';
            this.deafenBtn.classList.add('text-[#ed4245]');
            this.deafenBtn.classList.remove('text-discord-lighter');
            console.log('[USER-PROFILE] 🔇 Deafen button set to DEAFENED state');
        } else {
            deafenIcon.className = 'fas fa-headphones text-lg';
            this.deafenBtn.classList.remove('text-[#ed4245]');
            this.deafenBtn.classList.add('text-discord-lighter');
            console.log('[USER-PROFILE] 🔇 Deafen button set to NORMAL state');
        }
    }
    
    handleMicClick() {
        console.log('[USER-PROFILE] 🎤 Processing mic click...');
        
        if (!window.localStorageManager) {
            console.error('❌ [USER-PROFILE] CRITICAL: LocalStorageManager not available for mic toggle');
            return;
        }
        
        try {
            const wasToggled = window.localStorageManager.toggleVoiceMute();
            console.log('[USER-PROFILE] 🎤 Mic toggle result:', wasToggled ? 'MUTED' : 'UNMUTED');
            
            if (window.MusicLoaderStatic) {
                if (wasToggled) {
                    window.MusicLoaderStatic.playDiscordMuteSound();
                    console.log('[USER-PROFILE] 🔊 Playing mute sound');
                } else {
                    window.MusicLoaderStatic.playDiscordUnmuteSound();
                    console.log('[USER-PROFILE] 🔊 Playing unmute sound');
                }
            } else {
                console.error('❌ [USER-PROFILE] MusicLoaderStatic not available - no sound feedback');
            }
            
            setTimeout(() => this.updateControls(), 50);
        } catch (error) {
            console.error('❌ [USER-PROFILE] Error in mic click handler:', error);
        }
    }
    
    handleDeafenClick() {
        console.log('[USER-PROFILE] 🔇 Processing deafen click...');
        
        if (!window.localStorageManager) {
            console.error('❌ [USER-PROFILE] CRITICAL: LocalStorageManager not available for deafen toggle');
            return;
        }
        
        try {
            window.localStorageManager.toggleVoiceDeafen();
            console.log('[USER-PROFILE] 🔇 Deafen toggle completed');
            
            setTimeout(() => this.updateControls(), 50);
        } catch (error) {
            console.error('❌ [USER-PROFILE] Error in deafen click handler:', error);
        }
    }
    
    reinitialize() {
        console.log('[USER-PROFILE] 🔄 Reinitializing user profile voice controls...');
        this.initialized = false;
        this.eventListenersAttached = false;
        this.retryCount = 0;
        this.init();
    }
}

function initializeUserProfileVoiceControls() {
    console.log('[USER-PROFILE] 🚀 Initializing user profile voice controls...');
    
    if (window.userProfileVoiceControls && window.userProfileVoiceControls.initialized) {
        console.log('[USER-PROFILE] ✅ Voice controls already initialized');
        return window.userProfileVoiceControls;
    }
    
    try {
        window.userProfileVoiceControls = new UserProfileVoiceControls();
        return window.userProfileVoiceControls;
    } catch (error) {
        console.error('❌ [USER-PROFILE] Failed to initialize voice controls:', error);
        return null;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUserProfileVoiceControls);
} else {
    initializeUserProfileVoiceControls();
}

window.addEventListener('pageLoaded', () => {
    console.log('[USER-PROFILE] 📄 Page loaded event - reinitializing voice controls');
    setTimeout(initializeUserProfileVoiceControls, 100);
});

window.addEventListener('layoutChanged', () => {
    console.log('[USER-PROFILE] 🔄 Layout changed event - reinitializing voice controls');
    setTimeout(initializeUserProfileVoiceControls, 200);
});

window.initializeUserProfileVoiceControls = initializeUserProfileVoiceControls;
</script> 