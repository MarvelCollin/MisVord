<?php
// Voice tools component - Discord style controls
// This component is to be included in voice-section.php

$isMuted = false; // This would be dynamically set based on actual state
$isDeafened = false; // This would be dynamically set based on actual state
$isVideoOn = false; // This would be dynamically set based on actual state
$isScreenSharing = false; // This would be dynamically set based on actual state
$userName = $_SESSION['username'] ?? 'User';
$userStatus = 'online'; // Could be: online, idle, dnd, invisible
$channelName = $activeChannel['name'] ?? 'Voice Channel';
?>

<div class="voice-tools flex items-center justify-between w-full h-[52px] bg-[#232428] px-2">
    <!-- Left section: User info -->
    <div class="flex items-center">
        <div class="relative flex-shrink-0">
            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                <span class="text-white text-sm font-medium"><?php echo substr($userName, 0, 1); ?></span>
                <!-- If user has avatar -->
                <!-- <img src="/path/to/avatar.png" alt="Avatar" class="w-full h-full object-cover"> -->
            </div>
            <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#232428] bg-[#3ba55c]"></div>
        </div>
        <div class="ml-2 text-xs">
            <div class="font-semibold text-white"><?php echo htmlspecialchars($userName); ?></div>
            <div class="text-gray-400"><?php echo $userStatus === 'online' ? 'Online' : ucfirst($userStatus); ?></div>
        </div>
    </div>
    
    <!-- Right section: Voice controls -->
    <div class="flex items-center space-x-2">
        <!-- Toggle view button (Discord UI / Video Grid) -->
        <button id="toggleViewBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center transition-colors bg-[#2f3136] text-gray-300 hover:bg-[#36373d]" title="Toggle View">
            <i class="fas fa-users text-sm"></i>
        </button>
        
        <!-- Mute button -->
        <button id="micBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center transition-colors <?php echo $isMuted ? 'bg-[#ED4245] text-white' : 'bg-[#2f3136] text-gray-300 hover:bg-[#36373d]'; ?>" title="<?php echo $isMuted ? 'Unmute' : 'Mute'; ?>">
            <i class="fas <?php echo $isMuted ? 'fa-microphone-slash' : 'fa-microphone'; ?> text-sm"></i>
        </button>
        
        <!-- Deafen button -->
        <button id="deafenBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center transition-colors <?php echo $isDeafened ? 'bg-[#ED4245] text-white' : 'bg-[#2f3136] text-gray-300 hover:bg-[#36373d]'; ?>" title="<?php echo $isDeafened ? 'Undeafen' : 'Deafen'; ?>">
            <i class="fas <?php echo $isDeafened ? 'fa-volume-xmark' : 'fa-headphones'; ?> text-sm"></i>
        </button>
        
        <!-- Video button -->
        <button id="joinVideoBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center transition-colors <?php echo $isVideoOn ? 'bg-[#3ba55c] text-white' : 'bg-[#2f3136] text-gray-300 hover:bg-[#36373d]'; ?>" title="<?php echo $isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'; ?>">
            <i class="fas <?php echo $isVideoOn ? 'fa-video' : 'fa-video-slash'; ?> text-sm"></i>
        </button>
        
        <!-- Screen share button -->
        <button id="screenBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center transition-colors <?php echo $isScreenSharing ? 'bg-[#5865F2] text-white' : 'bg-[#2f3136] text-gray-300 hover:bg-[#36373d]'; ?>" title="<?php echo $isScreenSharing ? 'Stop Sharing' : 'Share Your Screen'; ?>">
            <i class="fas fa-desktop text-sm"></i>
        </button>
        
        <!-- Settings button (Discord style) -->
        <button id="settingsBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center bg-[#2f3136] text-gray-300 hover:bg-[#36373d] transition-colors" title="Voice Settings">
            <i class="fas fa-cog text-sm"></i>
        </button>
        
        <!-- Disconnect button -->
        <button id="leaveBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center bg-[#2f3136] text-gray-300 hover:bg-[#ED4245] hover:text-white transition-colors" title="Disconnect">
            <i class="fas fa-phone-slash text-sm"></i>
        </button>
    </div>
</div>

<!-- User status indicator for voice channel - shows when connected -->
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
/* Additional styles for voice tools */
.voice-tools {
    user-select: none;
}

.voice-control-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.5);
}

.voice-connection-indicator {
    height: 24px;
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Toggle between video grid and Discord UI views
    const toggleViewBtn = document.getElementById('toggleViewBtn');
    if (toggleViewBtn) {
        toggleViewBtn.addEventListener('click', function() {
            const videoContainer = document.getElementById('videoContainer');
            const discordView = document.getElementById('discordVoiceView');
            
            if (videoContainer && discordView) {
                const isVideoVisible = !videoContainer.classList.contains('hidden');
                
                if (isVideoVisible) {
                    // Switch to Discord UI
                    videoContainer.classList.add('hidden');
                    discordView.classList.remove('hidden');
                    toggleViewBtn.innerHTML = '<i class="fas fa-video text-sm"></i>';
                    toggleViewBtn.title = 'Switch to Video Grid';
                } else {
                    // Switch to video grid
                    videoContainer.classList.remove('hidden');
                    discordView.classList.add('hidden');
                    toggleViewBtn.innerHTML = '<i class="fas fa-users text-sm"></i>';
                    toggleViewBtn.title = 'Switch to Discord UI';
                }
            }
        });
    }
    
    // Hook up the deafen button
    const deafenBtn = document.getElementById('deafenBtn');
    if (deafenBtn) {
        deafenBtn.addEventListener('click', function() {
            const isDeafened = deafenBtn.classList.contains('bg-[#ED4245]');
            
            if (isDeafened) {
                // Undeafen
                deafenBtn.classList.remove('bg-[#ED4245]', 'text-white');
                deafenBtn.classList.add('bg-[#2f3136]', 'text-gray-300');
                deafenBtn.innerHTML = '<i class="fas fa-headphones text-sm"></i>';
                deafenBtn.title = 'Deafen';
            } else {
                // Deafen
                deafenBtn.classList.add('bg-[#ED4245]', 'text-white');
                deafenBtn.classList.remove('bg-[#2f3136]', 'text-gray-300');
                deafenBtn.innerHTML = '<i class="fas fa-volume-xmark text-sm"></i>';
                deafenBtn.title = 'Undeafen';
            }
        });
    }
});
</script>
