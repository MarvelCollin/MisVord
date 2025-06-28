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
$currentServer = $GLOBALS['currentServer'] ?? $GLOBALS['server'] ?? null;
$serverChannels = $GLOBALS['serverChannels'] ?? [];
?>

<link rel="stylesheet" href="/public/css/voice-section.css">

<meta name="meeting-id" content="<?php echo htmlspecialchars($meetingId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($userName); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($activeChannelId); ?>">
<meta name="server-id" content="<?php echo htmlspecialchars($currentServer->id ?? ''); ?>">

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
            <?php include __DIR__ . '/../voice/voice-not-join.php'; ?>
            <?php include __DIR__ . '/../voice/voice-connected.php'; ?>
        </div>
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
    
    if (!window.voiceState) {
        window.voiceState = { isConnected: false };
    }

    const voiceIndicatorEl = document.getElementById('voice-indicator');

    function toggleVoiceIndicator(show) {
        if (!voiceIndicatorEl) return;
        if (show) {
            voiceIndicatorEl.classList.remove('scale-0', 'opacity-0');
        } else {
            voiceIndicatorEl.classList.add('scale-0', 'opacity-0');
        }
    }
    
    async function connectToVoice() {
        const activeChannelId = document.querySelector('meta[name="channel-id"]')?.content;
        if (activeChannelId && window.autoJoinVoiceChannel) {
            await window.autoJoinVoiceChannel(activeChannelId);
        }
    }
    
    elements.joinBtn.onclick = async () => {
        elements.joinBtn.disabled = true;
        elements.joinBtn.textContent = 'Connecting...';
        elements.joinView.classList.add('hidden');
        elements.connectingView.classList.remove('hidden');
        await connectToVoice();
    };
    
    window.addEventListener('voiceConnect', (event) => {
        const details = event.detail || {};
        
        if (!window.videosdkMeeting) {
            console.log('No VideoSDK meeting found, skipping UI update');
            return;
        }
        
        const localParticipant = window.videosdkMeeting.localParticipant;
        if (!localParticipant) {
            console.log('No local participant found, skipping UI update');
            return;
        }
        
        const status = localParticipant.connectionStatus;
        console.log('Connection status:', status);
        
        if (status !== 'connected') {
            console.log('Participant not fully connected, waiting...');
            return;
        }
        
        console.log('Participant fully connected, updating UI');
        elements.connectingView.classList.add('hidden');
        elements.joinView.classList.add('hidden');
        elements.connectedView.classList.remove('hidden');
        elements.voiceControls.classList.remove('hidden');
        window.voiceState.isConnected = true;
        toggleVoiceIndicator(false);
        elements.joinBtn.disabled = false;
        elements.joinBtn.textContent = 'Connected';
        
        if (details.channelName) {
            const channelNameElements = document.querySelectorAll('.channel-name, .voice-ind-title');
            channelNameElements.forEach(el => {
                if (el.classList.contains('channel-name')) {
                    el.textContent = details.channelName.length > 10 
                        ? details.channelName.substring(0, 8) + '...' 
                        : details.channelName;
                } else {
                    el.textContent = details.channelName;
                }
            });
        }
        
        if (details.meetingId && details.channelName) {
            localStorage.setItem("voiceConnectionState", JSON.stringify({
                isConnected: true,
                channelName: details.channelName,
                meetingId: details.meetingId,
                currentChannelId: details.channelId,
                connectionTime: Date.now()
            }));
        }
        
        setTimeout(() => {
            if (window.initializeVoiceTools) {
                window.initializeVoiceTools();
            }
            if (window.voiceStateManager) {
                window.voiceStateManager.updateAllControls();
            }
        }, 100);
    });
    
    window.addEventListener('voiceDisconnect', () => {
        window.voiceState.isConnected = false;
        
        if (window.videosdkMeeting) {
            try {
                window.videoSDKManager?.leaveMeeting();
                window.videosdkMeeting = null;
            } catch (e) {
                console.error("Error when leaving VideoSDK meeting:", e);
            }
        }
        
        localStorage.removeItem("voiceConnectionState");
        
        elements.connectedView.classList.add('hidden');
        elements.connectingView.classList.add('hidden');
        elements.voiceControls.classList.add('hidden');
        elements.joinView.classList.remove('hidden');
        elements.joinBtn.disabled = false;
        elements.joinBtn.textContent = 'Join Voice';
        toggleVoiceIndicator(true);
        
        if (window.voiceStateManager) {
            window.voiceStateManager.reset();
        }
    });

    if (window.voiceState?.isConnected && window.videosdkMeeting?.localParticipant?.connectionStatus === 'connected') {
        elements.joinView.classList.add('hidden');
        elements.connectingView.classList.add('hidden');
        elements.connectedView.classList.remove('hidden');
        elements.voiceControls.classList.remove('hidden');
        elements.joinBtn.disabled = false;
        elements.joinBtn.textContent = 'Connected';
        toggleVoiceIndicator(false);
    }
}

window.initializeVoiceUI = initializeVoiceUI;
</script>