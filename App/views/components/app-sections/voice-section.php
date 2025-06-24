<?php

if (!isset($currentServer) || empty($currentServer)) {
    echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
    return;
}

$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;

if (!$activeChannel) {
    echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a voice channel</div>';
    return;
}

$meetingId = 'voice_channel_' . $activeChannelId;
$userName = $_SESSION['username'] ?? 'Anonymous';

$additional_js[] = 'components/videosdk/videosdk';
$additional_js[] = 'components/voice/voice-manager';
?>

<meta name="meeting-id" content="<?php echo htmlspecialchars($meetingId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($userName); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($activeChannelId); ?>">

<div class="flex flex-col h-screen bg-[#313338] text-white">
    <div class="h-12 border-b border-[#1e1f22] flex items-center px-4 shadow-sm">
        <div class="flex items-center">
            <i class="fas fa-volume-high text-gray-400 mr-2"></i>
            <span class="font-medium text-white"><?php echo htmlspecialchars($activeChannel['name'] ?? 'Voice Channel'); ?></span>
        </div>
    </div>
    
    <div class="flex-1 flex">
        <div id="participantsPanel" class="w-64 bg-[#232428] border-r border-[#1e1f22] flex flex-col py-4 px-2 hidden">
            <div class="text-xs text-gray-400 uppercase mb-2">Voice Participants</div>
            <div id="participants" class="flex-1 flex flex-col gap-1"></div>
        </div>
        <div class="flex-1 flex flex-col justify-center items-center">
            <div id="videoContainer" class="w-full h-full flex items-center justify-center">
                <div id="videosContainer" class="flex flex-wrap justify-center items-center gap-8 pt-8"></div>
            </div>
            
            <div class="flex flex-col items-center justify-center py-10 text-center">
                <h2 class="text-2xl font-bold mb-2">No one's around to hang out with</h2>
                <p class="text-gray-400 max-w-md">When friends are active in this voice channel, you'll see them here.</p>
            </div>
        </div>
    </div>
    
    <div class="h-16 bg-[#1e1f22] border-t border-[#1e1f22] flex items-center justify-between px-4">
        <div class="flex items-center">
            <div class="mr-4 text-sm">
                <div class="text-xs text-gray-400 uppercase">Voice Connected</div>
                <div class="text-white font-medium"><?php echo htmlspecialchars($activeChannel['name'] ?? 'Voice Channel'); ?></div>
            </div>
            <div class="h-8 border-l border-gray-700 mx-2"></div>
            <div class="flex items-center space-x-1">
                <button id="micBtn" class="bg-[#272729] hover:bg-[#3a3a3d] text-gray-200 rounded-full p-2 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed btn-voice" disabled>
                    <i class="fas fa-microphone text-sm"></i>
                </button>
                <button id="joinVideoBtn" class="bg-[#272729] hover:bg-[#3a3a3d] text-gray-200 rounded-full p-2 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed btn-voice hidden">
                    <i class="fas fa-video text-sm"></i>
                </button>
            </div>
        </div>
        
        <div class="flex items-center space-x-3">
            <button id="screenBtn" class="bg-[#272729] hover:bg-[#3a3a3d] text-gray-200 rounded-full p-2 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed btn-voice" disabled>
                <i class="fas fa-desktop text-sm"></i>
            </button>
            <button id="joinBtn" class="bg-[#5B64EA] hover:bg-[#4752c4] text-white rounded-full p-3 focus:outline-none transition-all btn-voice w-10 h-10 flex items-center justify-center">
                <i class="fas fa-phone text-sm"></i>
            </button>
            <button id="leaveBtn" class="bg-[#ED4245] hover:bg-[#d83134] text-white rounded-full p-3 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed btn-voice hidden w-10 h-10 flex items-center justify-center" disabled>
                <i class="fas fa-phone-slash text-sm"></i>
            </button>
        </div>
    </div>
    
</div>

<style>
:root {
    --discord-primary: #5865F2;
    --discord-primary-hover: #4752c4;
    --discord-green: #3BA55D;
    --discord-red: #ED4245;
    --discord-background: #313338;
    --discord-dark: #1e1f22;
    --discord-channel-hover: rgba(79, 84, 92, 0.16);
}

.btn-voice {
    position: relative;
    overflow: hidden;
}

.btn-voice:after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.3);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%);
    transform-origin: 50% 50%;
}

.btn-voice:focus:not(:active)::after {
    animation: ripple 1s ease-out;
}

@keyframes ripple {
    0% {
        transform: scale(0, 0);
        opacity: 0.5;
    }
    20% {
        transform: scale(25, 25);
        opacity: 0.3;
    }
    100% {
        opacity: 0;
        transform: scale(40, 40);
    }
}
                        
@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(88, 101, 242, 0.4);
    }
    70% {
        box-shadow: 0 0 0 3px rgba(88, 101, 242, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(88, 101, 242, 0);
    }
}

.speaking {
    animation: pulse 2s infinite;
}

.fade-in {
    animation: fadeIn 0.3s ease forwards;
}

.fade-out {
    animation: fadeOut 0.3s ease forwards;
}

.slide-up {
    animation: slideUp 0.3s ease forwards;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
</style>

<!-- Add scripts only if not already loaded -->
<script>
if (typeof VideoSDK === 'undefined') {
    console.log("Loading VideoSDK from voice-section.php");
    const videoSDKScript = document.createElement('script');
    videoSDKScript.src = "https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js";
    document.head.appendChild(videoSDKScript);
} else {
    console.log("VideoSDK already loaded");
}

// Make sure our scripts get loaded through the PHP architecture
if (typeof window.videoSDKManager === 'undefined') {
    console.log("Adding videosdk.js to additional_js");
    if (typeof additional_js !== 'undefined') {
        if (!additional_js.includes('components/videosdk/videosdk')) {
            additional_js.push('components/videosdk/videosdk');
        }
    }
}
if (typeof additional_js !== 'undefined') {
    if (!additional_js.includes('components/voice/voice-manager')) {
        additional_js.push('components/voice/voice-manager');
    }
}
</script>