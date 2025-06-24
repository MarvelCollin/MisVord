<?php
require_once dirname(__DIR__, 3) . '/config/videosdk.php';

if (!isset($currentServer) || empty($currentServer)) {
    echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
    return;
}

$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;

if (!$activeChannel) {
    if (isset($GLOBALS['currentChannel'])) {
        $activeChannel = $GLOBALS['currentChannel'];
    } else {
        $serverChannels = $GLOBALS['serverChannels'] ?? [];
        if (!empty($serverChannels) && $activeChannelId) {
            foreach ($serverChannels as $channel) {
                if ($channel['id'] == $activeChannelId) {
                    $activeChannel = (object)$channel;
                    break;
                }
            }
        }
    }
}

$channelName = 'Voice Channel';
if ($activeChannel) {
    if (is_object($activeChannel)) {
        $channelName = $activeChannel->name ?? $channelName;
    } elseif (is_array($activeChannel)) {
        $channelName = $activeChannel['name'] ?? $channelName;
    }
}

if (!$activeChannel) {
    echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a voice channel</div>';
    return;
}

$meetingId = 'voice_channel_' . $activeChannelId;
$userName = $_SESSION['username'] ?? 'Anonymous';
$authToken = VideoSDKConfig::getAuthToken();

$additional_js[] = 'components/voice/voice-manager';
?>

<meta name="videosdk-token" content="<?php echo htmlspecialchars($authToken); ?>">
<meta name="meeting-id" content="<?php echo htmlspecialchars($meetingId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($userName); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($activeChannelId); ?>">
<meta name="channel-type" content="voice">

<!-- Main content area with Discord-style layout -->
<div class="flex flex-col h-screen bg-[#313338] text-white voice-channel-wrapper" data-channel-id="<?php echo htmlspecialchars($activeChannelId); ?>">
    <!-- Channel header -->
    <div class="h-12 border-b border-[#1e1f22] flex items-center px-4 shadow-sm">
        <div class="flex items-center">
            <i class="fas fa-volume-high text-gray-400 mr-2"></i>
            <span class="font-medium text-white"><?php echo htmlspecialchars($channelName); ?></span>
        </div>
    </div>
    
    <!-- Main content area (mostly empty like Discord) -->
    <div class="flex-1 flex">
        <!-- Main empty area -->
        <div class="flex-1 flex flex-col justify-center items-center">
            <!-- Centered content or user display area -->
            <div id="videoContainer" class="w-full h-full flex items-center justify-center">
                <div id="videosContainer" class="flex flex-wrap justify-center items-center gap-8 pt-8"></div>
            </div>
            
            <!-- Discord style empty view with trophy icon -->
            <div class="flex flex-col items-center justify-center py-10 text-center">
                <h2 class="text-2xl font-bold mb-2">No one's around to hang out with</h2>
                <p class="text-gray-400 max-w-md">When friends are active in this voice channel, you'll see them here.</p>
            </div>
        </div>
    </div>
    
    <!-- Voice controls bar (fixed at bottom) -->
    <div class="h-16 bg-[#1e1f22] border-t border-[#1e1f22] flex items-center justify-between px-4">
        <div class="flex items-center">
            <div class="mr-4 text-sm">
                <div class="text-xs text-gray-400 uppercase">Voice Connected</div>
                <div class="text-white font-medium"><?php echo htmlspecialchars($channelName); ?></div>
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
/* Discord-specific colors */
:root {
    --discord-primary: #5865F2;
    --discord-primary-hover: #4752c4;
    --discord-green: #3BA55D;
    --discord-red: #ED4245;
    --discord-background: #313338;
    --discord-dark: #1e1f22;
    --discord-channel-hover: rgba(79, 84, 92, 0.16);
}

/* Button effects */
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

/* Voice animations */
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

/* Transitions */
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

<script src="https://sdk.videosdk.live/js-sdk/0.0.82/videosdk.js"></script>

<script>
document.addEventListener('DOMContentLoaded', initializeVoiceChannel);
document.addEventListener('channelChanged', handleChannelChange);

function initializeVoiceChannel() {
    const voiceChannelWrapper = document.querySelector('.voice-channel-wrapper');
    if (!voiceChannelWrapper) return;
    
    const channelId = voiceChannelWrapper.getAttribute('data-channel-id');
    if (!channelId) return;
    
    if (typeof window.voiceManager !== 'undefined' && typeof window.voiceManager.initialize === 'function') {
        window.voiceManager.initialize();
    }
}

function handleChannelChange(event) {
    if (event.detail && event.detail.channelType === 'voice') {
        setTimeout(initializeVoiceChannel, 100);
    } else {
        if (typeof window.voiceManager !== 'undefined' && typeof window.voiceManager.cleanup === 'function') {
            window.voiceManager.cleanup();
        }
    }
}

window.addEventListener('beforeunload', function() {
    if (typeof window.voiceManager !== 'undefined' && typeof window.voiceManager.cleanup === 'function') {
        window.voiceManager.cleanup();
    }
});
</script>
