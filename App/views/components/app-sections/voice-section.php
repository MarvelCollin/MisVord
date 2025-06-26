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
?>

<link rel="stylesheet" href="/public/css/voice-section.css">

<meta name="meeting-id" content="<?php echo htmlspecialchars($meetingId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($userName); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($activeChannelId); ?>">

<div class="flex flex-col h-screen bg-[#313338] text-white" id="voice-container">
    <div class="h-12 border-b border-[#1e1f22] flex items-center px-4 bg-[#313338] z-20">
        <div class="flex items-center">
            <i class="fas fa-volume-high text-gray-400 mr-2"></i>
            <span class="font-medium text-white"><?php echo htmlspecialchars($activeChannel->name ?? 'Voice Channel'); ?></span>
        </div>
        <div class="ml-auto">
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-comment-alt"></i>
            </button>
        </div>
    </div>
    
    <div class="flex-1 flex">
        <div class="flex-1 flex flex-col">
            <div id="joinView" class="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#1e1f3a] via-[#2b2272] to-[#1e203a]">
                <h2 class="text-2xl font-bold text-white mb-2"><?php echo htmlspecialchars($activeChannel->name ?? 'Voice Channel'); ?></h2>
                <p class="text-gray-300 text-base mb-6">No one is currently in voice</p>
                
                <button id="joinBtn" class="bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium py-2 px-6 rounded transition-colors">
                    Join Voice
                </button>
            </div>
            
            <div id="connectingView" class="flex-1 flex flex-col items-center justify-center bg-[#2b2d31] hidden">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5865F2] mb-4"></div>
                <p class="text-white text-lg">Connecting to voice...</p>
            </div>
            
            <div id="connectedView" class="flex-1 flex flex-col bg-[#2b2d31] hidden">
                <div class="flex-1 flex flex-col justify-center items-center">
                    <div class="w-full max-w-xl">
                        <div class="user-voice-item w-full bg-[#313338] rounded-md overflow-hidden mb-4">
                            <div class="px-3 py-2 flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="relative w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center overflow-hidden mr-2">
                                        <span class="text-white text-sm font-semibold"><?php echo substr($userName, 0, 1); ?></span>
                                    </div>
                                    <div class="flex flex-col">
                                        <div class="flex items-center">
                                            <span class="text-white text-sm font-medium"><?php echo htmlspecialchars($userName); ?></span>
                                            <span class="ml-1 text-xs px-1.5 py-0.5 bg-[#5865F2] text-white rounded text-[10px] uppercase font-bold">you</span>
                                        </div>
                                        <div class="text-xs text-gray-400">
                                            <span class="text-[#3ba55c]">Connected to voice</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-gray-400">
                                    <div class="flex items-center space-x-1">
                                        <div class="w-4 h-4 flex items-center justify-center">
                                            <i class="fas fa-microphone text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="participants" class="w-full"></div>
                        
                        <div id="emptyMessage" class="flex flex-col items-center justify-center py-8 text-center">
                            <div class="w-40 h-40 mb-4 opacity-70">
                                <img src="https://discord.com/assets/cb0d3973-ea92-4d74-9f1e-88ed59493a63.svg" alt="No one here" class="w-full h-full" />
                            </div>
                            <h2 class="text-xl font-bold mb-2 text-white">No one's around to hang out with</h2>
                            <p class="text-gray-400 max-w-md text-sm">When friends are in this voice channel, you'll see them here.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div id="voiceControls" class="hidden">
        <?php include __DIR__ . '/../voice/voice-tool.php'; ?>
    </div>
</div>





<script>
document.addEventListener('DOMContentLoaded', function() {
    initializeVoiceUI();
});

function initializeVoiceUI() {
    const elements = {
        joinBtn: document.getElementById('joinBtn'),
        joinView: document.getElementById('joinView'),
        connectingView: document.getElementById('connectingView'),
        connectedView: document.getElementById('connectedView'),
        voiceControls: document.getElementById('voiceControls')
    };
    
    if (!elements.joinBtn) {
        setTimeout(initializeVoiceUI, 200);
        return;
    }
    
    window.voiceState = { isConnected: false };
    
    async function connectToVoice() {
        const activeChannelId = document.querySelector('meta[name="channel-id"]')?.content;
        if (activeChannelId && window.autoJoinVoiceChannel) {
            await window.autoJoinVoiceChannel(activeChannelId);
        }
    }
    
    elements.joinBtn.onclick = async () => {
        elements.joinBtn.disabled = true;
        elements.joinBtn.textContent = 'Connecting...';
        await connectToVoice();
    };
    
    window.addEventListener('voiceDisconnect', () => {
        window.voiceState.isConnected = false;
        if (window.videosdkMeeting) {
            window.videoSDKManager?.leaveMeeting();
            window.videosdkMeeting = null;
        }
        
        elements.connectedView.classList.add('hidden');
        elements.connectingView.classList.add('hidden');
        elements.voiceControls.classList.add('hidden');
        elements.joinView.classList.remove('hidden');
        elements.joinBtn.disabled = false;
        elements.joinBtn.textContent = 'Join Voice';
    });
}
</script>