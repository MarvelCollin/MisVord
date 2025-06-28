<?php
$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;
$userName = $_SESSION['username'] ?? 'Anonymous';
$currentServer = $GLOBALS['currentServer'] ?? $GLOBALS['server'] ?? null;
$meetingId = 'voice_channel_' . $activeChannelId;

if (!$activeChannel) {
    echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a voice channel</div>';
    return;
}

$channelName = $activeChannel->name ?? 'Voice Channel';
?>

<!-- Meta tags for VideoSDK -->
<meta name="meeting-id" content="<?php echo htmlspecialchars($meetingId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($userName); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($activeChannelId); ?>">
<meta name="server-id" content="<?php echo htmlspecialchars($currentServer->id ?? ''); ?>">

<!-- Main voice call container - Discord style -->
<div class="flex flex-col h-screen bg-[#313338]">
    <!-- Header with channel name -->
    <div class="h-12 border-b border-[#1f2024] flex items-center px-4 bg-[#313338] shadow-sm">
        <div class="flex items-center space-x-2">
            <i class="fas fa-volume-high text-[#b5bac1]"></i>
            <span class="text-white font-medium"><?php echo htmlspecialchars($channelName); ?></span>
        </div>
        <div class="ml-auto flex items-center space-x-4">
            <button class="text-[#b5bac1] hover:text-[#dbdee1]">
                <i class="fas fa-user-friends"></i>
            </button>
            <button class="text-[#b5bac1] hover:text-[#dbdee1]">
                <i class="fas fa-comment-alt"></i>
            </button>
        </div>
    </div>
    
    <!-- Main content area: Join view, connecting view, and video grid -->
    <div class="flex-1 flex flex-col relative">
        <!-- "Join Voice" view when not connected -->
        <div id="joinView" class="flex-1 flex flex-col items-center justify-center bg-[#313338] relative">
            <div class="text-center space-y-8">
                <div class="relative">
                    <h2 class="text-3xl font-bold text-white mb-2">
                        <?php echo htmlspecialchars($channelName); ?>
                    </h2>
                </div>
                
                <p class="text-gray-400 text-lg">Time to join the conversation</p>
                
                <div class="">
                    <button id="joinBtn" class="bg-[#5865f2] hover:bg-[#4752c4] transition-colors text-white font-medium py-3 px-8 rounded-md flex items-center gap-3">
                        <i class="fas fa-phone-alt"></i>
                        Join Voice
                    </button>
                </div>
            </div>
        </div>

        <!-- "Connecting" view while establishing connection -->
        <div id="connectingView" class="hidden flex-1 flex flex-col items-center justify-center bg-[#313338]">
            <div class="text-center space-y-4">
                <div class="inline-block">
                    <div class="animate-spin rounded-full h-12 w-12 border-4 border-t-[#5865f2] border-r-[#5865f2] border-b-transparent border-l-transparent"></div>
                </div>
                <p class="text-white text-lg">Connecting to voice...</p>
            </div>
        </div>
        
        <!-- Video grid for participants -->
        <div id="videoGrid" class="hidden flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-auto">
            <!-- Video elements will be dynamically inserted here by video-handler.js -->
        </div>
        
        <!-- Voice indicator (when connected to voice) -->
        <div id="voice-indicator" class="hidden fixed bottom-16 right-4 bg-[#232428] py-2 px-3 rounded-md shadow-lg text-white z-50 flex items-center">
            <div class="relative mr-2">
                <div class="w-2 h-2 rounded-full bg-green-500 absolute -top-1 -right-1"></div>
                <i class="fas fa-microphone text-green-400"></i>
            </div>
            <div>
                <div class="text-xs opacity-70">Connected to</div>
                <div class="text-sm font-medium voice-ind-title"><?php echo htmlspecialchars($channelName); ?></div>
            </div>
            <div class="ml-4 pl-4 border-l border-gray-700 text-xs">
                <div class="opacity-70">Duration</div>
                <div class="font-mono connection-duration">00:00</div>
            </div>
        </div>
    </div>
    
    <!-- Bottom voice control bar -->
    <div id="voiceControls" class="hidden">
        <?php include __DIR__ . '/voice-tool.php'; ?>
    </div>
</div>

<!-- Discord-style grid for screen share layout -->
<style>
.avatar-container {
    position: relative;
    background: #2f3136;
    border-radius: 8px;
    overflow: hidden;
}

.user-status-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    background-color: #3ba55d;
    border-radius: 50%;
    border: 2px solid #36393f;
}

@media (min-width: 768px) {
    .videoGrid-1 { grid-template-columns: 1fr; }
    .videoGrid-2 { grid-template-columns: 1fr 1fr; }
    .videoGrid-3, .videoGrid-4 { grid-template-columns: 1fr 1fr; }
    .videoGrid-5, .videoGrid-6, .videoGrid-7, .videoGrid-8, .videoGrid-9 { grid-template-columns: 1fr 1fr 1fr; }
}

/* Animations for voice activity */
@keyframes pulse-voice {
    0%, 100% { box-shadow: 0 0 0 0 rgba(59, 165, 93, 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(59, 165, 93, 0); }
}

.voice-active {
    animation: pulse-voice 2s infinite;
    border-color: #3ba55d !important;
}

/* Screen share styling */
.screen-share-container {
    grid-column: span 2;
}

.screen-share-container ~ .avatar-container,
.screen-share-container ~ video {
    max-height: 150px;
}
</style>

<!-- Scripts -->
<script src="/public/js/components/voice/voice-section.js"></script>
<script src="/public/js/components/videosdk/videosdk.js"></script>
<script src="/public/js/components/voice/video-handler.js"></script>

<script>
// Duration timer for voice connection
let durationInterval;
let connectionStartTime;

function startDurationTimer() {
    connectionStartTime = Date.now();
    const durationElement = document.querySelector('.connection-duration');
    
    if (durationElement) {
        clearInterval(durationInterval);
        durationInterval = setInterval(() => {
            const duration = Math.floor((Date.now() - connectionStartTime) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            durationElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }
}

// Listen for voice connect event to show indicator and start timer
window.addEventListener('voiceConnect', () => {
    const voiceIndicator = document.getElementById('voice-indicator');
    if (voiceIndicator) {
        voiceIndicator.classList.remove('hidden');
        startDurationTimer();
    }
});

// Hide indicator on disconnect
window.addEventListener('voiceDisconnect', () => {
    const voiceIndicator = document.getElementById('voice-indicator');
    if (voiceIndicator) {
        voiceIndicator.classList.add('hidden');
        clearInterval(durationInterval);
    }
});

// Update video grid layout based on participant count
function updateGridLayout() {
    const videoGrid = document.getElementById('videoGrid');
    if (!videoGrid) return;
    
    const participantCount = videoGrid.querySelectorAll('.avatar-container, video:not(.hidden)').length;
    
    // Remove all previous grid classes
    for (let i = 1; i <= 9; i++) {
        videoGrid.classList.remove(`videoGrid-${i}`);
    }
    
    // Add appropriate grid class
    videoGrid.classList.add(`videoGrid-${participantCount}`);
    
    // Check if any screen shares are present
    const hasScreenShare = videoGrid.querySelector('.screen-share-container');
    if (hasScreenShare) {
        videoGrid.classList.add('has-screen-share');
    } else {
        videoGrid.classList.remove('has-screen-share');
    }
}

// Initialize debug console for voice issues
document.addEventListener('DOMContentLoaded', function() {
    console.log("🔊 Voice call section loaded");
    
    // Check component loading
    setTimeout(function() {
        console.log("🔍 Voice components check:", {
            videoGrid: !!document.getElementById('videoGrid'),
            joinBtn: !!document.getElementById('joinBtn'),
            voiceControls: !!document.getElementById('voiceControls'),
            voiceSection: !!window.voiceSection,
            voiceManager: !!window.voiceManager,
            videoSDKManager: !!window.videoSDKManager
        });
    }, 1000);
    
    // Manual join button handler as backup
    const joinBtn = document.getElementById('joinBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', function() {
            const connectingView = document.getElementById('connectingView');
            const joinView = document.getElementById('joinView');
            
            if (joinView) joinView.classList.add('hidden');
            if (connectingView) connectingView.classList.remove('hidden');
            
            // Try multiple ways to join voice
            if (window.voiceSection && typeof window.voiceSection.autoJoin === 'function') {
                window.voiceSection.autoJoin();
            }
            else if (window.voiceManager && typeof window.voiceManager.joinVoice === 'function') {
                window.voiceManager.joinVoice();
            }
            else if (window.triggerVoiceAutoJoin) {
                window.triggerVoiceAutoJoin();
            }
            else if (window.handleAutoJoin) {
                window.handleAutoJoin();
            }
        });
    }
});

// Listen for grid updates to adjust layout
window.addEventListener('videoGridUpdate', updateGridLayout);

// Expose for external use
window.updateGridLayout = updateGridLayout;
</script>
