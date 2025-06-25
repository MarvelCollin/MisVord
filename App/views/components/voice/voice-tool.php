<?php

$isMuted = false;
$isDeafened = false;
$isVideoOn = false;
$isScreenSharing = false;
$userName = $_SESSION['username'] ?? 'User';
$userStatus = 'online';
$channelName = $activeChannel->name ?? 'Voice Channel';
?>

<div class="voice-tools flex items-center justify-between w-full h-[52px] bg-[#232428] px-2">
    <div class="flex items-center">
        <div class="relative flex-shrink-0">
            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                <span class="text-white text-sm font-medium"><?php echo substr($userName, 0, 1); ?></span>
            </div>
            <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#232428] bg-[#3ba55c]"></div>
        </div>
        <div class="ml-2 text-xs">
            <div class="font-semibold text-white"><?php echo htmlspecialchars($userName); ?></div>
            <div class="text-gray-400">Online</div>
        </div>
    </div>
    
    <div class="flex items-center space-x-2">
        <button id="micBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center transition-colors bg-[#2f3136] text-gray-300 hover:bg-[#36373d]" title="Mute">
            <i class="fas fa-microphone text-sm"></i>
        </button>
        <button id="deafenBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center transition-colors bg-[#2f3136] text-gray-300 hover:bg-[#36373d]" title="Deafen">
            <i class="fas fa-headphones text-sm"></i>
        </button>
        <button id="joinVideoBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center transition-colors bg-[#2f3136] text-gray-300 hover:bg-[#36373d]" title="Turn On Camera">
            <i class="fas fa-video-slash text-sm"></i>
        </button>
        <button id="screenBtn" class="voice-control-btn h-8 w-8 rounded-md flex items-center justify-center transition-colors bg-[#2f3136] text-gray-300 hover:bg-[#36373d]" title="Share Your Screen">
            <i class="fas fa-desktop text-sm"></i>
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
