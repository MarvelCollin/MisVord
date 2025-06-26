<?php

$isMuted = false;
$isDeafened = false;
$isVideoOn = false;
$isScreenSharing = false;
$userName = $_SESSION['username'] ?? 'User';
$userStatus = 'online';
$channelName = $activeChannel->name ?? 'Voice Channel';
?>

<div class="voice-tools flex items-center justify-center w-full h-[52px] bg-[#232428] px-4">
    <div class="flex items-center space-x-3">
        <button id="micBtn" class="voice-control-btn h-9 w-9 rounded-md flex items-center justify-center transition-colors bg-[#2f3136] text-gray-300 hover:bg-[#36373d]" title="Mute">
            <i class="fas fa-microphone text-lg"></i>
        </button>
        <button id="deafenBtn" class="voice-control-btn h-9 w-9 rounded-md flex items-center justify-center transition-colors bg-[#2f3136] text-gray-300 hover:bg-[#36373d]" title="Deafen">
            <i class="fas fa-headphones text-lg"></i>
        </button>
        <button id="joinVideoBtn" class="voice-control-btn h-9 w-9 rounded-md flex items-center justify-center transition-colors bg-[#2f3136] text-gray-300 hover:bg-[#36373d]" title="Turn On Camera">
            <i class="fas fa-video text-lg"></i>
        </button>
        <button id="screenBtn" class="voice-control-btn h-9 w-9 rounded-md flex items-center justify-center transition-colors bg-[#2f3136] text-gray-300 hover:bg-[#36373d]" title="Share Your Screen">
            <i class="fas fa-desktop text-lg"></i>
        </button>
        <button id="settingsBtn" class="voice-control-btn h-9 w-9 rounded-md flex items-center justify-center transition-colors bg-[#2f3136] text-gray-300 hover:bg-[#36373d]" title="Voice Settings">
            <i class="fas fa-cog text-lg"></i>
        </button>
        <button id="leaveBtn" class="voice-control-btn h-9 w-9 rounded-md flex items-center justify-center bg-[#2f3136] text-gray-300 hover:bg-[#ED4245] hover:text-white transition-colors" title="Disconnect">
            <i class="fas fa-phone-slash text-lg"></i>
        </button>
    </div>
</div>
