<?php

$isMuted = false;
$isDeafened = false;
$isVideoOn = false;
$isScreenSharing = false;
$userName = $_SESSION['username'] ?? 'User';
$userStatus = 'online';
$channelName = $activeChannel['name'] ?? 'Voice Channel';
?>

<div class="voice-tools flex items-center justify-between w-full h-[52px] bg-[#232428] px-2 opacity-0 transform translate-y-5">
    <div class="flex items-center">
        <div class="relative flex-shrink-0">
            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                <span class="text-white text-sm font-medium"><?php echo substr($userName, 0, 1); ?></span>
            </div>
            <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#232428] bg-[#3ba55c]"></div>
        </div>
        <div class="ml-2 text-xs">
            <div class="font-semibold text-white"><?php echo htmlspecialchars($userName); ?></div>
            <div class="text-gray-400"><?php echo $userStatus === 'online' ? 'Online' : ucfirst($userStatus); ?></div>
        </div>
    </div>
    
    <div class="flex items-center space-x-2">
        <button id="toggleViewBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center transition-colors bg-[#2f3136] text-gray-300 hover:bg-[#36373d]" title="Toggle View">
            <i class="fas fa-users text-sm"></i>
        </button>
        <button id="micBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center transition-colors <?php echo $isMuted ? 'bg-[#ED4245] text-white' : 'bg-[#2f3136] text-gray-300 hover:bg-[#36373d]'; ?>" title="<?php echo $isMuted ? 'Unmute' : 'Mute'; ?>">
            <i class="fas <?php echo $isMuted ? 'fa-microphone-slash' : 'fa-microphone'; ?> text-sm"></i>
        </button>
        <button id="deafenBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center transition-colors <?php echo $isDeafened ? 'bg-[#ED4245] text-white' : 'bg-[#2f3136] text-gray-300 hover:bg-[#36373d]'; ?>" title="<?php echo $isDeafened ? 'Undeafen' : 'Deafen'; ?>">
            <i class="fas <?php echo $isDeafened ? 'fa-volume-xmark' : 'fa-headphones'; ?> text-sm"></i>
        </button>
        <button id="joinVideoBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center transition-colors <?php echo $isVideoOn ? 'bg-[#3ba55c] text-white' : 'bg-[#2f3136] text-gray-300 hover:bg-[#36373d]'; ?>" title="<?php echo $isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'; ?>">
            <i class="fas <?php echo $isVideoOn ? 'fa-video' : 'fa-video-slash'; ?> text-sm"></i>
        </button>
        <button id="screenBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center transition-colors <?php echo $isScreenSharing ? 'bg-[#5865F2] text-white' : 'bg-[#2f3136] text-gray-300 hover:bg-[#36373d]'; ?>" title="<?php echo $isScreenSharing ? 'Stop Sharing' : 'Share Your Screen'; ?>">
            <i class="fas fa-desktop text-sm"></i>
        </button>
        <button id="settingsBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center bg-[#2f3136] text-gray-300 hover:bg-[#36373d] transition-colors" title="Voice Settings">
            <i class="fas fa-cog text-sm"></i>
        </button>
        <button id="leaveBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center bg-[#2f3136] text-gray-300 hover:bg-[#ED4245] hover:text-white transition-colors" title="Disconnect">
            <i class="fas fa-phone-slash text-sm"></i>
        </button>
    </div>
</div>
<div id="voice-connection-indicator" class="voice-connection-indicator flex items-center bg-[#1e1f22] border-t border-[#1e1f22] px-3 py-1.5">
    <div class="flex items-center">
        <div class="w-2 h-2 rounded-full bg-[#3ba55c] mr-2"></div>
        <span class="text-xs text-gray-300 font-medium">Voice Connected</span>
    </div>
    <div class="ml-2 text-xs text-gray-400 font-medium max-w-[150px] truncate">
        <?php echo htmlspecialchars($channelName); ?>
    </div>
</div>

<style>
.voice-tools {
    user-select: none;
    transition: opacity 0.4s ease, transform 0.4s ease;
}

.voice-tools.visible {
    opacity: 1 !important;
    transform: translateY(0) !important;
}

.voice-control-btn {
    transition: all 0.2s ease;
    transform: scale(1);
}

.voice-control-btn:hover {
    transform: scale(1.1);
}

.voice-control-btn:active {
    transform: scale(0.95);
}

.voice-control-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.5);
}

.voice-connection-indicator {
    height: 24px;
    transition: opacity 0.3s ease, transform 0.3s ease;
    animation: slideInBottom 0.3s ease forwards;
}

@keyframes slideInBottom {
    from {
        opacity: 0;
        transform: translateY(100%);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const voiceTools = document.querySelector('.voice-tools');
    if (voiceTools) {
        window.addEventListener('voiceConnect', function() {
            setTimeout(() => {
                voiceTools.classList.add('visible');
            }, 300);
        });
        
        window.addEventListener('voiceDisconnect', function() {
            voiceTools.classList.remove('visible');
        });
    }
    
    const leaveBtn = document.getElementById('leaveBtn');
    if (leaveBtn) {
        leaveBtn.addEventListener('click', function() {
            if (window.voiceSectionManager && typeof window.voiceSectionManager.exitFullscreenMode === 'function') {
                window.voiceSectionManager.exitFullscreenMode();
            } else {
                window.dispatchEvent(new Event('voiceDisconnect'));
            }
        });
    }

    const toggleViewBtn = document.getElementById('toggleViewBtn');
    if (toggleViewBtn) {
        toggleViewBtn.addEventListener('click', function() {
            const videoContainer = document.getElementById('videoContainer');
            const discordView = document.getElementById('discordVoiceView');
            
            if (videoContainer && discordView) {
                const isVideoVisible = !videoContainer.classList.contains('hidden');
                
                if (isVideoVisible) {
                    videoContainer.classList.add('hidden');
                    discordView.classList.remove('hidden');
                    toggleViewBtn.innerHTML = '<i class="fas fa-video text-sm"></i>';
                    toggleViewBtn.title = 'Switch to Video Grid';
                } else {
                    videoContainer.classList.remove('hidden');
                    discordView.classList.add('hidden');
                    toggleViewBtn.innerHTML = '<i class="fas fa-users text-sm"></i>';
                    toggleViewBtn.title = 'Switch to Discord UI';
                }
            }
        });
    }
    
    const micBtn = document.getElementById('micBtn');
    if (micBtn) {
        micBtn.addEventListener('click', function() {
            const isMuted = micBtn.classList.contains('bg-[#ED4245]');
            micBtn.classList.add('animate-click');
            setTimeout(() => micBtn.classList.remove('animate-click'), 200);
            
            if (isMuted) {
                micBtn.classList.remove('bg-[#ED4245]', 'text-white');
                micBtn.classList.add('bg-[#2f3136]', 'text-gray-300');
                micBtn.innerHTML = '<i class="fas fa-microphone text-sm"></i>';
                micBtn.title = 'Mute';
            } else {
                micBtn.classList.add('bg-[#ED4245]', 'text-white');
                micBtn.classList.remove('bg-[#2f3136]', 'text-gray-300');
                micBtn.innerHTML = '<i class="fas fa-microphone-slash text-sm"></i>';
                micBtn.title = 'Unmute';
            }
        });
    }
    
    const deafenBtn = document.getElementById('deafenBtn');
    if (deafenBtn) {
        deafenBtn.addEventListener('click', function() {
            const isDeafened = deafenBtn.classList.contains('bg-[#ED4245]');
            deafenBtn.classList.add('animate-click');
            setTimeout(() => deafenBtn.classList.remove('animate-click'), 200);
            
            if (isDeafened) {
                deafenBtn.classList.remove('bg-[#ED4245]', 'text-white');
                deafenBtn.classList.add('bg-[#2f3136]', 'text-gray-300');
                deafenBtn.innerHTML = '<i class="fas fa-headphones text-sm"></i>';
                deafenBtn.title = 'Deafen';
            } else {
                deafenBtn.classList.add('bg-[#ED4245]', 'text-white');
                deafenBtn.classList.remove('bg-[#2f3136]', 'text-gray-300');
                deafenBtn.innerHTML = '<i class="fas fa-volume-xmark text-sm"></i>';
                deafenBtn.title = 'Undeafen';
            }
        });
    }
    
    document.querySelectorAll('.voice-control-btn').forEach(btn => {
        btn.classList.add('transform', 'transition-transform', 'duration-200');
        btn.addEventListener('mouseenter', () => {
            btn.classList.add('scale-110');
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.classList.remove('scale-110');
        });
        btn.addEventListener('mousedown', () => {
            btn.classList.add('scale-95');
        });
        
        btn.addEventListener('mouseup', () => {
            btn.classList.remove('scale-95');
        });
    });
});
</script>
