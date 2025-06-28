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

<meta name="meeting-id" content="<?php echo htmlspecialchars($meetingId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($userName); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($activeChannelId); ?>">
<meta name="server-id" content="<?php echo htmlspecialchars($currentServer->id ?? ''); ?>">

<div class="flex flex-col h-screen bg-[#313338]">
        <div id="connectingView" class="hidden flex-1 flex flex-col items-center justify-center bg-[#313338]">
            <div class="text-center space-y-4">
                <div class="inline-block">
                    <div class="animate-spin rounded-full h-12 w-12 border-4 border-t-[#5865f2] border-r-[#5865f2] border-b-transparent border-l-transparent"></div>
                </div>
                <p class="text-white text-lg">Connecting to voice...</p>
            </div>
        </div>
        
        <div id="videoGrid" class="hidden flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-auto">
        </div>
        
        <div id="voiceControls" class="hidden">
            <?php include __DIR__ . '/voice-tool.php'; ?>
        </div>
    </div>

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

@keyframes pulse-voice {
    0%, 100% { box-shadow: 0 0 0 0 rgba(59, 165, 93, 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(59, 165, 93, 0); }
}

.voice-active {
    animation: pulse-voice 2s infinite;
    border-color: #3ba55d !important;
}

.screen-share-container {
    grid-column: span 2;
}

.screen-share-container ~ .avatar-container,
.screen-share-container ~ video {
    max-height: 150px;
}
</style>

<script src="/public/js/components/voice/voice-section.js"></script>
<script src="/public/js/components/videosdk/videosdk.js"></script>
<script src="/public/js/components/voice/video-handler.js"></script>

<script>
// Voice grid layout helper. Local indicator/timer logic has been removed to avoid duplication with the global component.
function updateGridLayout() {
    const videoGrid = document.getElementById('videoGrid');
    if (!videoGrid) return;
    
    const participantCount = videoGrid.querySelectorAll('.avatar-container, video:not(.hidden)').length;
    
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
    
    // Join button helper (fallback)
    const joinBtn = document.getElementById('joinBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', function() {
            const connectingView = document.getElementById('connectingView');
            const joinView = document.getElementById('joinView');
            if (joinView) joinView.classList.add('hidden');
            if (connectingView) connectingView.classList.remove('hidden');
            if (window.voiceSection && typeof window.voiceSection.autoJoin === 'function') {
                window.voiceSection.autoJoin();
            } else if (window.voiceManager && typeof window.voiceManager.joinVoice === 'function') {
                window.voiceManager.joinVoice();
            } else if (window.triggerVoiceAutoJoin) {
                window.triggerVoiceAutoJoin();
            } else if (window.handleAutoJoin) {
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
