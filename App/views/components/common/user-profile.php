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
        <span class="absolute bottom-0 right-0.5 w-3 h-3 rounded-full border-2 border-discord-darker <?php echo $statusColor; ?> transition-colors z-30"></span>
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
            console.error('[UserProfileVoiceControls] ❌ Failed to initialize:', error);
        }
    }
    
    async waitForDependencies() {
        return new Promise((resolve, reject) => {
            const checkDependencies = () => {
                const hasLocalStorage = !!window.localStorageManager;
                const hasMusicLoader = !!window.MusicLoaderStatic;
                
                if (hasLocalStorage && hasMusicLoader) {
                    console.log('[UserProfileVoiceControls] Dependencies ready:', {
                        localStorageManager: hasLocalStorage,
                        musicLoader: hasMusicLoader
                    });
                    resolve();
                } else if (this.retryCount >= this.maxRetries) {
                    const missingDeps = [];
                    if (!hasLocalStorage) missingDeps.push('localStorageManager');
                    if (!hasMusicLoader) missingDeps.push('MusicLoaderStatic');
                    
                    console.error('[UserProfileVoiceControls] Missing dependencies after max retries:', missingDeps);
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
        return new Promise((resolve) => {
            const findElements = () => {
                this.micBtn = document.querySelector('.user-profile-section .mic-btn');
                this.deafenBtn = document.querySelector('.user-profile-section .deafen-btn');
                
                if (this.micBtn && this.deafenBtn) {
                    resolve();
                } else {
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
            return;
        }
        
        if (this.micBtn) {
            this.micBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleMicClick();
            });
        }
        
        if (this.deafenBtn) {
            this.deafenBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleDeafenClick();
            });
        }
        

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
            console.log('UserProfile: Connected to localStorageManager voice state listener');
        }
        
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.includes('misvord_unified_voice_state')) {
                this.updateControls();
            }
        });
        

        this.setupPeriodicSync();
        
        this.eventListenersAttached = true;
    }
    
    updateControls() {
        try {
            let state = null;
            
            if (window.localStorageManager) {
                state = window.localStorageManager.getUnifiedVoiceState();
                console.log('UserProfile: Retrieved localStorage state:', state);
            }
            
            if (!state) {
                state = {
                    isMuted: false,
                    isDeafened: false,
                    isConnected: false,
                    volume: 100
                };
            }
            
            this.updateMicButton(state);
            this.updateDeafenButton(state);
            
        } catch (error) {
            console.error('Error updating user profile controls:', error);
        }
    }
    
    updateMicButton(state) {
        if (!this.micBtn) return;
        
        const micIcon = this.micBtn.querySelector('i');
        if (!micIcon) return;
        
        this.micBtn.classList.remove('text-[#ed4245]', 'text-discord-lighter');
        
        if (state.isMuted || state.isDeafened) {
            micIcon.className = 'fas fa-microphone-slash text-lg';
            this.micBtn.style.backgroundColor = '#ed4245';
            this.micBtn.style.color = 'white';
        } else {
            micIcon.className = 'fas fa-microphone text-lg';
            this.micBtn.style.backgroundColor = '#3ba55c';
            this.micBtn.style.color = 'white';
        }
        this.micBtn.style.borderRadius = '4px';
        this.micBtn.style.padding = '4px 6px';
    }
    
    updateDeafenButton(state) {
        if (!this.deafenBtn) return;
        
        const deafenIcon = this.deafenBtn.querySelector('i');
        if (!deafenIcon) return;
        
        this.deafenBtn.classList.remove('text-[#ed4245]', 'text-discord-lighter');
        
        if (state.isDeafened) {
            deafenIcon.className = 'fas fa-volume-xmark text-lg';
            this.deafenBtn.style.backgroundColor = '#ed4245';
            this.deafenBtn.style.color = 'white';
        } else {
            deafenIcon.className = 'fas fa-headphones text-lg';
            this.deafenBtn.style.backgroundColor = '#3ba55c';
            this.deafenBtn.style.color = 'white';
        }
        this.deafenBtn.style.borderRadius = '4px';
        this.deafenBtn.style.padding = '4px 6px';
    }
    
    handleMicClick() {
        try {
            if (!window.localStorageManager) {
                console.warn('LocalStorageManager not available');
                return;
            }
            
            const currentState = window.localStorageManager.getUnifiedVoiceState();
            const wasPreviouslyMuted = currentState.isMuted;
            
            const newMutedState = !wasPreviouslyMuted;
            
            window.localStorageManager.setUnifiedVoiceState({
                ...currentState,
                isMuted: newMutedState
            });
            
            if (window.MusicLoaderStatic) {
                if (wasPreviouslyMuted) {
                    window.MusicLoaderStatic.playDiscordUnmuteSound();
                } else {
                    window.MusicLoaderStatic.playDiscordMuteSound();
                }
            }
            
            if (window.voiceManager && window.voiceManager.isConnected) {
                if (newMutedState) {
                    window.voiceManager.localParticipant?.disableMic();
                    window.voiceManager._micOn = false;
                } else {
                    window.voiceManager.localParticipant?.enableMic();
                    window.voiceManager._micOn = true;
                }
            }
            
            this.updateControls();
            
            console.log('UserProfile: Mic toggled via localStorage');
            
        } catch (error) {
            console.error('Error in user profile mic click handler:', error);
        }
    }
    
    handleDeafenClick() {
        try {
            if (!window.localStorageManager) {
                console.warn('LocalStorageManager not available');
                return;
            }
            
            const currentState = window.localStorageManager.getUnifiedVoiceState();
            const wasPreviouslyDeafened = currentState.isDeafened;
            
            const newDeafenedState = !wasPreviouslyDeafened;
            const newMutedState = newDeafenedState ? true : currentState.isMuted;
            
            window.localStorageManager.setUnifiedVoiceState({
                ...currentState,
                isDeafened: newDeafenedState,
                isMuted: newMutedState
            });
            
            if (window.MusicLoaderStatic) {
                if (wasPreviouslyDeafened) {
                    window.MusicLoaderStatic.playDiscordUnmuteSound();
                } else {
                    window.MusicLoaderStatic.playDiscordMuteSound();
                }
            }
            
            if (window.voiceManager && window.voiceManager.isConnected) {
                window.voiceManager._deafened = newDeafenedState;
                
                if (newDeafenedState && window.voiceManager._micOn) {
                    window.voiceManager.localParticipant?.disableMic();
                    window.voiceManager._micOn = false;
                }
                
                window.voiceManager.meeting?.participants.forEach(participant => {
                    if (participant.id !== window.voiceManager.localParticipant?.id) {
                        participant.streams.forEach(stream => {
                            if (stream.kind === 'audio') {
                                if (newDeafenedState) {
                                    stream.pause();
                                } else {
                                    stream.resume();
                                }
                            }
                        });
                    }
                });
            }
            
            this.updateControls();
            
            console.log('UserProfile: Deafen toggled via localStorage');
            
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


        this.updateControls();
        

        if (window.voiceCallManager) {
            window.voiceCallManager.updateButtonStates();
        }
    }
    
    debugState() {



        
        console.log('🔧 Initialization:', {
            initialized: this.initialized,
            eventListenersAttached: this.eventListenersAttached,
            retryCount: this.retryCount,
            elementsFound: {
                micBtn: !!this.micBtn,
                deafenBtn: !!this.deafenBtn
            }
        });
        
        console.log('🎤 Voice Managers:', {
            localStorageManager: !!window.localStorageManager,
            unifiedVoiceStateManager: !!window.unifiedVoiceStateManager,
            videoSDKManager: !!window.videoSDKManager,
            voiceManager: !!window.voiceManager,
            musicLoader: !!window.MusicLoaderStatic
        });
        
        if (window.unifiedVoiceStateManager) {

        }
        
        if (window.localStorageManager) {

        }
        
        if (window.videoSDKManager?.isReady()) {
            console.log('📹 VideoSDK State:', {
                connected: window.videoSDKManager.isConnected,
                micEnabled: window.videoSDKManager.meeting?.localParticipant?.micEnabled,
                webcamEnabled: window.videoSDKManager.meeting?.localParticipant?.webcamEnabled
            });
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
            } else {

            }
        };
        
        window.syncUserProfileVoiceControls = () => {
            if (window.userProfileVoiceControls) {
                window.userProfileVoiceControls.forceSync();
            } else {

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