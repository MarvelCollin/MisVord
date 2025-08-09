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

<div class="p-1 sm:p-2 bg-discord-darker flex items-center mt-auto user-profile-section">
    <div class="relative">        
        <?php if ($hasTooltip): ?>
            <?php
                $userAvatar = ($currentUser && isset($currentUser->avatar_url) && $currentUser->avatar_url) ? $currentUser->avatar_url : asset('/common/default-profile-picture.png');
                $userName = ($currentUser && isset($currentUser->username)) ? $currentUser->username : ($_SESSION['username'] ?? 'User');
                $userDiscriminator = ($currentUser && isset($currentUser->discriminator)) ? $currentUser->discriminator : ($_SESSION['discriminator'] ?? '0000');
                
                $userAvatarContent = '<div class="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-1 sm:mr-2 user-profile-trigger transition-transform hover:scale-105" data-user-id="' . htmlspecialchars($_SESSION['user_id'] ?? '') . '">
                    <img src="' . htmlspecialchars($userAvatar) . '" 
                         alt="Avatar" class="w-full h-full object-cover">
                </div>';
                
                echo tooltip($userAvatarContent, htmlspecialchars($userName) . '#' . htmlspecialchars($userDiscriminator), 'top');
            ?>        <?php else: ?>
            <div class="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-1 sm:mr-2 user-profile-trigger transition-transform hover:scale-105" data-user-id="<?php echo htmlspecialchars($_SESSION['user_id'] ?? ''); ?>">
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
        <span class="absolute bottom-0 right-0.5 w-2 sm:w-3 h-2 sm:h-3 rounded-full border-1 sm:border-2 border-discord-darker <?php echo $statusColor; ?> transition-colors z-30"></span>
    </div>
    
    <div class="flex-1 min-w-0">
        <div class="text-xs sm:text-sm text-white font-medium truncate" id="current-user-name" data-user-id="<?php echo htmlspecialchars($_SESSION['user_id'] ?? ''); ?>"><?php echo htmlspecialchars(($currentUser && isset($currentUser->display_name) && $currentUser->display_name) ? $currentUser->display_name : (($currentUser && isset($currentUser->username)) ? $currentUser->username : ($_SESSION['username'] ?? 'User'))); ?></div>
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
    
    <div class="flex items-center space-x-1 sm:space-x-2 ml-auto">
        <?php if ($hasTooltip): ?>
            <?php
                $micContent = '<button class="mic-btn text-discord-lighter hover:text-white transition-all duration-150 p-1 rounded" data-muted="false">
                    <i class="fas fa-microphone text-sm sm:text-lg"></i>
                </button>';
                echo tooltip($micContent, 'Mute', 'top');
                
                $headphonesContent = '<button class="deafen-btn text-discord-lighter hover:text-white transition-all duration-150 p-1 rounded" data-deafened="false">
                    <i class="fas fa-headphones text-sm sm:text-lg"></i>
                </button>';
                echo tooltip($headphonesContent, 'Deafen', 'top');
                
                $settingsContent = '<a href="/settings/user" class="text-discord-lighter hover:text-white transition-colors duration-150 p-1 rounded hover:bg-discord-background-modifier-hover">
                    <i class="fas fa-cog text-sm sm:text-lg"></i>
                </a>';
                echo tooltip($settingsContent, 'User Settings', 'top');
            ?>
        <?php else: ?>
            <button class="mic-btn text-discord-lighter hover:text-white transition-all duration-150 p-1 rounded" title="Mute" data-muted="false">
                <i class="fas fa-microphone text-sm sm:text-lg"></i>
            </button>
            <button class="deafen-btn text-discord-lighter hover:text-white transition-all duration-150 p-1 rounded" title="Deafen" data-deafened="false">
                <i class="fas fa-headphones text-sm sm:text-lg"></i>
            </button>
            <a href="/settings/user" class="text-discord-lighter hover:text-white transition-colors duration-150 p-1 rounded hover:bg-discord-background-modifier-hover" title="User Settings">
                <i class="fas fa-cog text-sm sm:text-lg"></i>
            </a>
        <?php endif; ?>
    </div>
</div>

<style>
.mic-btn, .deafen-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
}

.mic-btn[data-muted="true"] {
    color: #ed4245 !important;
}

.mic-btn[data-muted="true"] i::before {
    content: "\f131";
}

.deafen-btn[data-deafened="true"] {
    color: #ed4245 !important;
}

.deafen-btn[data-deafened="true"] i::before {
    content: "\f2a4";
}

.mic-btn:hover, .deafen-btn:hover {
    transform: scale(1.1);
}
</style>

<script>
class UserProfileVoiceControls {
    constructor() {
        this.micBtn = null;
        this.deafenBtn = null;
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 50;
        this.eventListenersAttached = false;
        
        this.init();
    }
    
    async init() {
        try {
            await this.waitForDependencies();
            await this.setupElements();
            this.setupEventListeners();
            this.updateControls();
            this.initialized = true;
        } catch (error) {
            console.error('[UserProfileVoiceControls] Failed to initialize:', error);
        }
    }
    
    async waitForDependencies() {
        return new Promise((resolve, reject) => {
            const checkDependencies = () => {
                const hasLocalStorage = !!window.localStorageManager;
                const hasMusicLoader = !!window.MusicLoaderStatic;
                
                if (hasLocalStorage && hasMusicLoader) {
                    resolve();
                } else if (this.retryCount >= this.maxRetries) {
                    reject(new Error('Dependencies not found'));
                } else {
                    this.retryCount++;
                    setTimeout(checkDependencies, 100);
                }
            };
            checkDependencies();
        });
    }
    
    async setupElements() {
        return new Promise((resolve) => {
            const findElements = () => {
                this.micBtn = document.querySelector('.user-profile-section .mic-btn');
                this.deafenBtn = document.querySelector('.user-profile-section .deafen-btn');
                
                if (this.micBtn && this.deafenBtn) {
                    resolve();
                } else {
                    setTimeout(findElements, 100);
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
        if (this.eventListenersAttached || !this.micBtn || !this.deafenBtn) {
            return;
        }
        
        this.micBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMic();
        });
        
        this.deafenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleDeafen();
        });
        
        window.addEventListener('voiceStateChanged', () => {
            this.updateControls();
        });
        
        window.addEventListener('localVoiceStateChanged', () => {
            this.updateControls();
        });
        
        if (window.localStorageManager) {
            window.localStorageManager.addVoiceStateListener(() => {
                this.updateControls();
            });
        }
        
        this.eventListenersAttached = true;
    }
    
    toggleMic() {
        const currentMuted = this.micBtn.getAttribute('data-muted') === 'true';
        const newMuted = !currentMuted;
        
        this.micBtn.setAttribute('data-muted', newMuted.toString());
        
        if (window.voiceManager) {
            if (newMuted) {
                window.voiceManager._micOn = false;
            } else {
                window.voiceManager._micOn = true;
            }
        }
        
        if (window.localStorageManager) {
            const currentState = window.localStorageManager.getUnifiedVoiceState() || {};
            window.localStorageManager.setUnifiedVoiceState({
                ...currentState,
                isMuted: newMuted
            });
        }
        
        if (window.MusicLoaderStatic) {
            if (newMuted) {
                window.MusicLoaderStatic.playDiscordMuteSound();
            } else {
                window.MusicLoaderStatic.playDiscordUnmuteSound();
            }
        }
        
        this.updateMicButton();
        
        window.dispatchEvent(new CustomEvent('userProfileMicToggled', {
            detail: { isMuted: newMuted }
        }));
    }
    
    toggleDeafen() {
        const currentDeafened = this.deafenBtn.getAttribute('data-deafened') === 'true';
        const newDeafened = !currentDeafened;
        
        this.deafenBtn.setAttribute('data-deafened', newDeafened.toString());
        
        if (newDeafened) {
            this.micBtn.setAttribute('data-muted', 'true');
        }
        
        if (window.voiceManager) {
            window.voiceManager._deafened = newDeafened;
            if (newDeafened) {
                window.voiceManager._micOn = false;
            }
        }
        
        if (window.localStorageManager) {
            const currentState = window.localStorageManager.getUnifiedVoiceState() || {};
            window.localStorageManager.setUnifiedVoiceState({
                ...currentState,
                isDeafened: newDeafened,
                isMuted: newDeafened ? true : currentState.isMuted
            });
        }
        
        if (window.MusicLoaderStatic) {
            if (newDeafened) {
                window.MusicLoaderStatic.playDiscordMuteSound();
            } else {
                window.MusicLoaderStatic.playDiscordUnmuteSound();
            }
        }
        
        if (window.voiceCallSection && window.voiceCallSection.updateAllAudioElementsMute) {
            window.voiceCallSection.updateAllAudioElementsMute(newDeafened);
        }
        
        this.updateMicButton();
        this.updateDeafenButton();
        
        window.dispatchEvent(new CustomEvent('userProfileDeafenToggled', {
            detail: { isDeafened: newDeafened, isMuted: newDeafened }
        }));
    }
    
    updateControls() {
        try {
            let isMuted = false;
            let isDeafened = false;
            
            if (window.voiceManager) {
                isMuted = !window.voiceManager._micOn;
                isDeafened = window.voiceManager._deafened;
            } else if (window.localStorageManager) {
                const state = window.localStorageManager.getUnifiedVoiceState();
                if (state) {
                    isMuted = state.isMuted || false;
                    isDeafened = state.isDeafened || false;
                }
            }
            
            if (this.micBtn) {
                this.micBtn.setAttribute('data-muted', isMuted.toString());
            }
            
            if (this.deafenBtn) {
                this.deafenBtn.setAttribute('data-deafened', isDeafened.toString());
            }
            
            this.updateMicButton();
            this.updateDeafenButton();
            
        } catch (error) {
            console.error('Error updating user profile controls:', error);
        }
    }
    
    updateMicButton() {
        if (!this.micBtn) return;
        
        const isMuted = this.micBtn.getAttribute('data-muted') === 'true';
        const micIcon = this.micBtn.querySelector('i');
        
        if (micIcon) {
            if (isMuted) {
                micIcon.className = 'fas fa-microphone-slash text-sm sm:text-lg';
                this.micBtn.title = 'Unmute';
            } else {
                micIcon.className = 'fas fa-microphone text-sm sm:text-lg';
                this.micBtn.title = 'Mute';
            }
        }
    }
    
    updateDeafenButton() {
        if (!this.deafenBtn) return;
        
        const isDeafened = this.deafenBtn.getAttribute('data-deafened') === 'true';
        const deafenIcon = this.deafenBtn.querySelector('i');
        
        if (deafenIcon) {
            if (isDeafened) {
                deafenIcon.className = 'fas fa-deaf text-sm sm:text-lg';
                this.deafenBtn.title = 'Undeafen';
            } else {
                deafenIcon.className = 'fas fa-headphones text-sm sm:text-lg';
                this.deafenBtn.title = 'Deafen';
            }
        }
    }
    
    handleMicClick() {
        try {
            this.isMuted = !this.isMuted;
            
            localStorage.setItem('userProfileMuted', this.isMuted.toString());
            
            if (window.voiceManager) {
                window.voiceManager.toggleMic();
            } else if (window.localStorageManager) {
                const currentState = window.localStorageManager.getUnifiedVoiceState() || {};
                window.localStorageManager.setUnifiedVoiceState({
                    ...currentState,
                    isMuted: this.isMuted
                });
            }
            
            if (window.MusicLoaderStatic) {
                if (this.isMuted) {
                    window.MusicLoaderStatic.playDiscordMuteSound();
                } else {
                    window.MusicLoaderStatic.playDiscordUnmuteSound();
                }
            }
            
            this.updateMicButton();
            
            window.dispatchEvent(new CustomEvent('userProfileMicToggled', {
                detail: { isMuted: this.isMuted }
            }));
            
        } catch (error) {
            console.error('Error in user profile mic click handler:', error);
        }
    }
    
    handleDeafenClick() {
        try {
            this.isDeafened = !this.isDeafened;
            
            if (this.isDeafened) {
                this.isMuted = true;
            }
            
            localStorage.setItem('userProfileDeafened', this.isDeafened.toString());
            localStorage.setItem('userProfileMuted', this.isMuted.toString());
            
            if (window.voiceManager) {
                window.voiceManager.toggleDeafen();
            } else if (window.localStorageManager) {
                const currentState = window.localStorageManager.getUnifiedVoiceState() || {};
                window.localStorageManager.setUnifiedVoiceState({
                    ...currentState,
                    isDeafened: this.isDeafened,
                    isMuted: this.isDeafened ? true : this.isMuted
                });
            }
            
            if (window.MusicLoaderStatic) {
                if (this.isDeafened) {
                    window.MusicLoaderStatic.playDiscordMuteSound();
                } else {
                    window.MusicLoaderStatic.playDiscordUnmuteSound();
                }
            }
            
            if (window.voiceCallSection && window.voiceCallSection.updateAllAudioElementsMute) {
                window.voiceCallSection.updateAllAudioElementsMute(this.isDeafened);
            }
            
            this.updateMicButton();
            this.updateDeafenButton();
            
            window.dispatchEvent(new CustomEvent('userProfileDeafenToggled', {
                detail: { isDeafened: this.isDeafened, isMuted: this.isMuted }
            }));
            
        } catch (error) {
            console.error('Error in user profile deafen click handler:', error);
        }
    }
    
    setupPeriodicSync() {
        setInterval(() => {
            this.updateControls();
        }, 2000);
    }
    
    isInVoiceCall() {
        if (window.voiceManager?.isConnected) {
            return true;
        }
        
        if (window.localStorageManager) {
            const state = window.localStorageManager.getUnifiedVoiceState();
            return state?.isConnected || false;
        }
        
        return false;
    }
    
    forceSync() {
        this.loadInitialState();
        this.updateControls();
        
        if (window.voiceCallManager) {
            window.voiceCallManager.updateButtonStates();
        }
    }
    
    debugState() {
        console.log('🔧 UserProfileVoiceControls State:', {
            isMuted: this.isMuted,
            isDeafened: this.isDeafened,
            initialized: this.initialized,
            eventListenersAttached: this.eventListenersAttached,
            elementsFound: {
                micBtn: !!this.micBtn,
                deafenBtn: !!this.deafenBtn
            }
        });
        
        console.log('🎤 Voice Managers:', {
            localStorageManager: !!window.localStorageManager,
            voiceManager: !!window.voiceManager,
            musicLoader: !!window.MusicLoaderStatic
        });
        
        if (window.localStorageManager) {
            const state = window.localStorageManager.getUnifiedVoiceState();
            console.log('📦 LocalStorage State:', state);
        }
    }
    
    reinitialize() {
        this.initialized = false;
        this.eventListenersAttached = false;
        this.retryCount = 0;
        this.init();
    }
}

function initializeUserProfileVoiceControls() {
    if (window.userProfileVoiceControls && window.userProfileVoiceControls.initialized) {
        return window.userProfileVoiceControls;
    }
    
    try {
        window.userProfileVoiceControls = new UserProfileVoiceControls();
        
        window.debugUserProfileVoiceControls = () => {
            if (window.userProfileVoiceControls) {
                window.userProfileVoiceControls.debugState();
            }
        };
        
        window.syncUserProfileVoiceControls = () => {
            if (window.userProfileVoiceControls) {
                window.userProfileVoiceControls.forceSync();
            }
        };
        
        return window.userProfileVoiceControls;
    } catch (error) {
        console.error('[UserProfileVoiceControls] ❌ Failed to initialize:', error);
        return null;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUserProfileVoiceControls);
} else {
    initializeUserProfileVoiceControls();
}

window.addEventListener('pageLoaded', () => {
    setTimeout(initializeUserProfileVoiceControls, 100);
});

window.addEventListener('layoutChanged', () => {
    setTimeout(initializeUserProfileVoiceControls, 200);
});

window.initializeUserProfileVoiceControls = initializeUserProfileVoiceControls;
</script>