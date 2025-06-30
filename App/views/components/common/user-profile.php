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
                     alt="Avatar" class="w-full h-full object-cover">
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
        <div class="text-sm text-white font-medium truncate" id="current-user-name" data-user-id="<?php echo htmlspecialchars($_SESSION['user_id'] ?? ''); ?>"><?php echo htmlspecialchars(($currentUser && isset($currentUser->username)) ? $currentUser->username : ($_SESSION['username'] ?? 'User')); ?></div>
        <div class="text-xs text-discord-lighter truncate">#<?php echo htmlspecialchars($_SESSION['discriminator'] ?? rand(1000, 9999)); ?></div>
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
document.addEventListener('DOMContentLoaded', function() {
    const micBtn = document.querySelector('.user-profile-section .mic-btn');
    const deafenBtn = document.querySelector('.user-profile-section .deafen-btn');
    
    function updateUserProfileControls() {
        if (!window.localStorageManager) {
            console.warn('LocalStorageManager not available');
            return;
        }
        
        const state = window.localStorageManager.getVoiceState();
        
        if (micBtn) {
            const micIcon = micBtn.querySelector('i');
            if (state.isMuted || state.isDeafened) {
                micIcon.className = 'fas fa-microphone-slash text-lg';
                micBtn.classList.add('text-[#ed4245]');
                micBtn.classList.remove('text-discord-lighter');
            } else {
                micIcon.className = 'fas fa-microphone text-lg';
                micBtn.classList.remove('text-[#ed4245]');
                micBtn.classList.add('text-discord-lighter');
            }
        }
        
        if (deafenBtn) {
            const deafenIcon = deafenBtn.querySelector('i');
            if (state.isDeafened) {
                deafenIcon.className = 'fas fa-volume-xmark text-lg';
                deafenBtn.classList.add('text-[#ed4245]');
                deafenBtn.classList.remove('text-discord-lighter');
            } else {
                deafenIcon.className = 'fas fa-headphones text-lg';
                deafenBtn.classList.remove('text-[#ed4245]');
                deafenBtn.classList.add('text-discord-lighter');
            }
        }
    }
    
    function handleMicClick() {
        if (window.localStorageManager) {
            const currentState = window.localStorageManager.getVoiceState();
            const newMutedState = !currentState.isMuted;
            
            window.localStorageManager.toggleVoiceMute();
            
            if (window.MusicLoaderStatic) {
                if (newMutedState) {
                    window.MusicLoaderStatic.playDiscordMuteSound();
                } else {
                    window.MusicLoaderStatic.playDiscordUnmuteSound();
                }
            }
        } else {
            console.warn('LocalStorageManager not available for mic toggle');
        }
    }
    
    function handleDeafenClick() {
        if (window.localStorageManager) {
            window.localStorageManager.toggleVoiceDeafen();
        } else {
            console.warn('LocalStorageManager not available for deafen toggle');
        }
    }
    
    if (micBtn) {
        micBtn.removeEventListener('click', handleMicClick);
        micBtn.addEventListener('click', handleMicClick);
    }
    
    if (deafenBtn) {
        deafenBtn.removeEventListener('click', handleDeafenClick);
        deafenBtn.addEventListener('click', handleDeafenClick);
    }
    
    window.addEventListener('voiceStateChanged', updateUserProfileControls);
    
    if (window.localStorageManager) {
        window.localStorageManager.addVoiceStateListener(updateUserProfileControls);
    }
    
    const checkAndUpdate = () => {
        if (window.localStorageManager) {
            updateUserProfileControls();
        } else {
            setTimeout(checkAndUpdate, 100);
        }
    };
    
    checkAndUpdate();
    

});
</script> 