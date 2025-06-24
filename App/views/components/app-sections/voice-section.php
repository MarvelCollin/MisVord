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
    <!-- Channel header -->
    <div class="h-12 border-b border-[#1e1f22] flex items-center px-4 shadow-sm bg-[#313338] z-20">
        <div class="flex items-center">
            <i class="fas fa-volume-high text-gray-400 mr-2"></i>
            <span class="font-medium text-white"><?php echo htmlspecialchars($activeChannel['name'] ?? 'Voice Channel'); ?></span>
        </div>
        <div class="ml-auto">
            <button class="text-gray-400 hover:text-white">
                <i class="fas fa-comment-alt"></i>
            </button>
        </div>
    </div>
    
    <!-- Main content area -->
    <div class="flex-1 flex">
        <!-- No participants message when empty -->
        <div class="flex-1 flex flex-col">
            <!-- Video grid container -->
            <div id="videoContainer" class="w-full h-full flex flex-wrap justify-center items-center gap-8 p-4 hidden">
                <div id="videosContainer" class="flex flex-wrap justify-center items-center gap-8"></div>
            </div>
            
            <!-- Discord-style voice channel view -->
            <div class="flex-1 flex flex-col justify-center items-center bg-[#2b2d31]" id="discordVoiceView">
                <!-- Current user (you) -->
                <div class="user-voice-item w-full max-w-xl mb-4 bg-[#313338] rounded-md overflow-hidden">
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
                                <div class="text-xs text-gray-400" id="user-voice-status">
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
                
                <!-- Participants will be dynamically added here -->
                <div id="participants" class="w-full max-w-xl"></div>
                
                <!-- Empty state message (shows when no other participants) -->
                <div id="emptyVoiceMessage" class="flex flex-col items-center justify-center py-8 text-center">
                    <div class="w-40 h-40 mb-4 opacity-70">
                        <img src="https://discord.com/assets/cb0d3973-ea92-4d74-9f1e-88ed59493a63.svg" alt="No one here" class="w-full h-full" />
                    </div>
                    <h2 class="text-xl font-bold mb-2 text-white">No one's around to hang out with</h2>
                    <p class="text-gray-400 max-w-md text-sm">When friends are in this voice channel, you'll see them here.</p>
                </div>
            </div>
            
            <!-- Discord-style join UI (shows before connecting) -->
            <div id="joinUI" class="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-[#1e1f3a] via-[#2b2272] to-[#1e203a]">
                <h2 class="text-2xl font-bold text-white mb-2"><?php echo htmlspecialchars($activeChannel['name'] ?? 'Voice Channel'); ?></h2>
                <p class="text-gray-300 text-base mb-6">No one is currently in voice</p>
                
                <button id="joinBtn" class="bg-white hover:bg-gray-100 text-[#202225] font-medium py-1.5 px-4 rounded transition-colors">
                    Join Voice
                </button>
            </div>
        </div>
    </div>
    
    <!-- Voice tools at bottom -->
    <div class="voice-controls-container">
        <?php include __DIR__ . '/../voice/voice-tool.php'; ?>
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

.user-voice-item {
    transition: background-color 0.2s ease;
}

.user-voice-item:hover {
    background-color: #36393f;
}

.user-voice-item.speaking {
    background-color: #3c3f45;
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

<template id="participantTemplate">
    <div class="user-voice-item w-full bg-[#313338] rounded-md overflow-hidden mb-2">
        <div class="px-3 py-2 flex items-center justify-between">
            <div class="flex items-center">
                <div class="participant-avatar relative w-8 h-8 rounded-full bg-[#3ba55c] flex items-center justify-center overflow-hidden mr-2">
                    <span class="text-white text-sm font-semibold">U</span>
                </div>
                <div class="flex flex-col">
                    <div class="flex items-center">
                        <span class="participant-name text-white text-sm font-medium">User</span>
                    </div>
                    <div class="text-xs text-gray-400 participant-status"></div>
                </div>
            </div>
            <div class="text-gray-400 participant-icons">
                <div class="flex items-center space-x-1">
                    <div class="w-4 h-4 flex items-center justify-center">
                        <i class="fas fa-microphone-slash text-xs"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

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

// JavaScript to handle participant template rendering and UI visibility
document.addEventListener("DOMContentLoaded", function() {
    // Signal that the voice channel content has loaded
    document.dispatchEvent(new CustomEvent('channelContentLoaded', {
        detail: {
            type: 'voice',
            channelId: '<?php echo htmlspecialchars($activeChannelId); ?>'
        }
    }));
    
    // If auto-join flag was set, this will trigger the join
    if (window.attemptAutoJoinVoice) {
        setTimeout(() => window.attemptAutoJoinVoice(), 300);
    }
    
    // Handle join UI visibility
    const joinUI = document.getElementById('joinUI');
    const discordVoiceView = document.getElementById('discordVoiceView');
    const voiceControlsContainer = document.querySelector('.voice-controls-container');
    const mainContent = document.querySelector('.flex-1.flex.flex-col');
    
    // Hide voice controls and discord view initially, show join UI
    if (voiceControlsContainer) voiceControlsContainer.style.display = 'none';
    if (discordVoiceView) discordVoiceView.style.display = 'none';
    if (joinUI) joinUI.style.display = 'flex';
    
    // Apply full-height gradient background
    if (mainContent) {
        mainContent.style.background = 'linear-gradient(180deg, #1e1f3a 0%, #2b2272 50%, #1e203a 100%)';
    }
    
    // Listen for connection events
    window.addEventListener('voiceConnect', function(event) {
        // Hide join UI, show Discord voice view and controls
        if (joinUI) joinUI.style.display = 'none';
        if (discordVoiceView) discordVoiceView.style.display = 'flex';
        if (voiceControlsContainer) voiceControlsContainer.style.display = 'block';
        
        // Remove gradient background when connected
        if (mainContent) {
            mainContent.style.background = '#2b2d31';
        }
    });
    
    window.addEventListener('voiceDisconnect', function(event) {
        // Show join UI, hide Discord voice view and controls
        if (joinUI) joinUI.style.display = 'flex';
        if (discordVoiceView) discordVoiceView.style.display = 'none';
        if (voiceControlsContainer) voiceControlsContainer.style.display = 'none';
        
        // Restore gradient background when disconnected
        if (mainContent) {
            mainContent.style.background = 'linear-gradient(180deg, #1e1f3a 0%, #2b2272 50%, #1e203a 100%)';
        }
    });
    
    // Add click event to join button to make it more responsive
    const joinBtn = document.getElementById('joinBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', function() {
            joinBtn.textContent = 'Connecting...';
            joinBtn.classList.add('opacity-70', 'cursor-not-allowed');
            setTimeout(() => {
                // The actual connection will be handled by the existing click handler
                // This just makes the UI more responsive
            }, 100);
        });
    }
    
    // This function will be called by voice-manager.js when adding participants
    window.renderParticipant = function(participant) {
        if (!participant) return;
        
        const template = document.getElementById('participantTemplate');
        if (!template) return;
        
        const clone = document.importNode(template.content, true);
        
        // Set participant details
        const nameElement = clone.querySelector('.participant-name');
        if (nameElement) nameElement.textContent = participant.displayName || 'User';
        
        // Set avatar initial
        const avatarElement = clone.querySelector('.participant-avatar span');
        if (avatarElement) {
            const initial = participant.displayName ? participant.displayName.charAt(0).toUpperCase() : 'U';
            avatarElement.textContent = initial;
        }
        
        // Add to participants container
        const container = document.getElementById('participants');
        if (container) {
            const participantDiv = document.createElement('div');
            participantDiv.id = `participant-item-${participant.id}`;
            participantDiv.appendChild(clone);
            container.appendChild(participantDiv);
            
            // Hide empty message if we have participants
            const emptyMessage = document.getElementById('emptyVoiceMessage');
            if (emptyMessage) emptyMessage.style.display = 'none';
        }
    };
});
</script>