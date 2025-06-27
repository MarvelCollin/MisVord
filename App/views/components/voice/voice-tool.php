<?php
$userName = $_SESSION['username'] ?? 'User';
$channelName = $activeChannel->name ?? 'Voice Channel';
?>

<div class="flex items-center justify-center h-14 bg-[#232428] px-4 w-full">
    <div class="flex items-center space-x-2">
        <div class="flex rounded-lg bg-[#2f3136] p-1">
            <button id="micBtn" class="mic-btn flex items-center justify-center h-8 w-11 rounded-md transition-colors bg-transparent text-gray-300 hover:bg-[#36373d]" title="Mute">
                <i class="fas fa-microphone text-lg"></i>
            </button>
            <button id="joinVideoBtn" class="video-btn flex items-center justify-center h-8 w-11 rounded-md transition-colors bg-transparent text-gray-300 hover:bg-[#36373d]" title="Turn On Camera">
                <i class="fas fa-video-slash text-lg"></i>
            </button>
        </div>

        <div class="flex rounded-lg bg-[#2f3136] p-1">
            <button id="screenBtn" class="screen-btn flex items-center justify-center h-8 w-11 rounded-md transition-colors bg-transparent text-gray-300 hover:bg-[#36373d]" title="Share Your Screen">
                <i class="fas fa-desktop text-lg"></i>
            </button>
            <button id="deafenBtn" class="deafen-btn flex items-center justify-center h-8 w-11 rounded-md transition-colors bg-transparent text-gray-300 hover:bg-[#36373d]" title="Deafen">
                <i class="fas fa-headphones text-lg"></i>
            </button>
            <button id="gameBtn" class="flex items-center justify-center h-8 w-11 rounded-md bg-transparent text-gray-300 hover:bg-[#36373d] transition-colors" title="Activity">
                <i class="fas fa-gamepad text-lg"></i>
            </button>
            <button id="settingsBtn" class="flex items-center justify-center h-8 w-11 rounded-md bg-transparent text-gray-300 hover:bg-[#36373d] transition-colors" title="Voice Settings">
                <i class="fas fa-cog text-lg"></i>
            </button>
        </div>

        <button id="leaveBtn" class="flex items-center justify-center h-9 w-12 rounded-md bg-[#ED4245] text-white hover:bg-[#c93b3f] transition-colors" title="Disconnect">
            <i class="fas fa-phone-slash text-lg"></i>
        </button>
    </div>
</div>