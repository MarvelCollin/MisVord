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

<div class="flex flex-col h-full w-full bg-[#313338] relative">
    <div class="flex items-center px-4 py-3 bg-[#2b2d31] border-b border-[#1a1b1e] shadow-sm">
        <div class="flex items-center space-x-2">
            <i class="fas fa-volume-up text-[#b5bac1]"></i>
            <span class="text-white font-medium"><?php echo htmlspecialchars($channelName); ?></span>
        </div>
    </div>

    <div class="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-[#313338] via-[#2b2d31] to-[#1e1f22]">
        <div class="flex-1 flex relative">
        <div id="mainContentArea" class="flex-1 flex flex-col relative">
            <div id="screenShareContainer" class="hidden flex-1 bg-[#1a1b1e] rounded-lg m-4 relative overflow-hidden shadow-xl">
                <div class="absolute top-4 left-4 z-10 bg-[#1e1f22]/90 backdrop-blur-sm rounded-lg px-3 py-2">
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-[#3ba55c] rounded-full"></div>
                        <span class="text-white text-sm font-medium" id="screenShareUsername">Screen Share</span>
                    </div>
                </div>
                <video id="screenShareVideo" class="w-full h-full object-contain bg-black" autoplay playsinline></video>
            </div>
            
            <div id="speakerView" class="hidden flex-1 bg-[#1a1b1e] rounded-lg m-4 relative overflow-hidden shadow-xl">
                <div class="absolute top-4 left-4 z-10 bg-[#1e1f22]/90 backdrop-blur-sm rounded-lg px-3 py-2">
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 bg-[#3ba55c] rounded-full animate-pulse"></div>
                        <span class="text-white text-sm font-medium" id="speakerUsername">Speaker</span>
                    </div>
                </div>
                <video id="speakerVideo" class="w-full h-full object-cover bg-[#1e1f22]" autoplay playsinline></video>
            </div>
            
            <div id="voiceOnlyGrid" class="flex-1 flex items-center justify-center p-8">
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-6 max-w-6xl w-full justify-items-center">
                </div>
            </div>
        </div>
        
        <div id="videoSidebar" class="hidden w-80 p-4 flex flex-col space-y-4 max-h-full overflow-y-auto">
            <div class="text-[#b5bac1] text-sm font-medium px-2 mb-2">Participants</div>
            <div id="videoParticipants" class="space-y-3">
            </div>
        </div>
    </div>
    
    <div id="voiceParticipantsBar" class="bg-[#2b2d31] border-t border-[#1a1b1e] p-4">
        <div class="flex items-center justify-center">
            <div class="flex items-center space-x-4 max-w-6xl overflow-x-auto" id="voiceParticipantsList">
            </div>
        </div>
    </div>

    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div class="voice-control-panel bg-[#1e1f22]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#40444b]/50 p-4">
            <div class="flex items-center space-x-4">
                <div class="relative group">
                    <button id="voiceMicBtn" class="mic-btn w-14 h-14 rounded-full bg-[#2f3136] hover:bg-[#3c3f47] text-[#b9bbbe] hover:text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" title="Mute/Unmute">
                        <i class="fas fa-microphone text-xl"></i>
                    </button>
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        <span class="mic-tooltip">Mute</span>
                    </div>
                </div>

                <div class="relative group">
                    <button id="voiceDeafenBtn" class="deafen-btn w-14 h-14 rounded-full bg-[#2f3136] hover:bg-[#3c3f47] text-[#b9bbbe] hover:text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" title="Deafen/Undeafen">
                        <i class="fas fa-headphones text-xl"></i>
                    </button>
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        <span class="deafen-tooltip">Deafen</span>
                    </div>
                </div>

                <div class="relative group">
                    <button id="voiceVideoBtn" class="video-btn w-14 h-14 rounded-full bg-[#2f3136] hover:bg-[#3c3f47] text-[#b9bbbe] hover:text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" title="Turn On/Off Camera">
                        <i class="fas fa-video-slash text-xl"></i>
                    </button>
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        <span class="video-tooltip">Turn On Camera</span>
                    </div>
                </div>

                <div class="relative group">
                    <button id="voiceScreenBtn" class="screen-btn w-14 h-14 rounded-full bg-[#2f3136] hover:bg-[#3c3f47] text-[#b9bbbe] hover:text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" title="Share Screen">
                        <i class="fas fa-desktop text-xl"></i>
                    </button>
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        <span class="screen-tooltip">Share Screen</span>
                    </div>
                </div>

                <div class="relative group">
                    <button id="voiceSettingsBtn" class="w-14 h-14 rounded-full bg-[#2f3136] hover:bg-[#3c3f47] text-[#b9bbbe] hover:text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" title="Voice Settings">
                        <i class="fas fa-cog text-xl"></i>
                    </button>
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        Voice Settings
                    </div>
                </div>

                <div class="relative group ml-4 pl-4 border-l border-[#40444b]">
                    <button id="voiceDisconnectBtn" class="w-14 h-14 rounded-full bg-[#ed4245] hover:bg-[#fc5054] text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" title="Leave Voice Channel">
                        <i class="fas fa-phone-slash text-xl"></i>
                    </button>
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        Leave Channel
                    </div>
                </div>
            </div>

            <div class="mt-3 pt-3 border-t border-[#40444b]/50 flex items-center justify-center space-x-4 text-xs text-[#72767d]">
                <div class="flex items-center space-x-1">
                    <div class="w-2 h-2 bg-[#3ba55c] rounded-full animate-pulse"></div>
                    <span>Connected</span>
                </div>
                <div class="flex items-center space-x-1">
                    <i class="fas fa-clock"></i>
                    <span id="voiceConnectionTime">00:00</span>
                </div>
                <div class="flex items-center space-x-1">
                    <i class="fas fa-users"></i>
                    <span id="voiceParticipantCount">1</span>
                </div>
            </div>
        </div>
    </div>

    <div id="loadingState" class="hidden absolute inset-0 bg-gradient-to-br from-[#313338]/95 via-[#2b2d31]/95 to-[#1e1f22]/95 backdrop-blur-sm flex items-center justify-center z-30">
        <div class="flex flex-col items-center space-y-6 p-8 bg-[#2f3136]/80 rounded-2xl border border-[#40444b]/30 shadow-2xl backdrop-blur-md">
            <div class="relative">
                <div class="animate-spin rounded-full h-16 w-16 border-4 border-[#5865f2]/30 border-t-[#5865f2] shadow-lg"></div>
                <div class="absolute inset-0 rounded-full bg-gradient-to-tr from-[#5865f2]/20 to-transparent animate-pulse"></div>
            </div>
            <div class="text-center space-y-2">
                <span class="text-[#dcddde] text-lg font-semibold">Connecting to voice...</span>
                <span class="text-[#72767d] text-sm">Please wait while we set up your connection</span>
            </div>
        </div>
    </div>
</div>
</div>

<style>
@keyframes discord-speaking {
    0%, 100% { 
        box-shadow: 0 0 0 0 rgba(59, 165, 93, 0.7);
    }
    50% { 
        box-shadow: 0 0 0 8px rgba(59, 165, 93, 0);
    }
}

.participant-container:hover {
    transform: translateY(-2px);
}

.speaking-ring {
    animation: discord-speaking 2s infinite;
}

#screenShareContainer video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
}

#speakerView video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #1e1f22;
}

.video-participant-card {
    @apply bg-[#1e1f22] rounded-lg overflow-hidden shadow-lg border border-[#40444b]/30 hover:border-[#40444b]/60 transition-all duration-200;
}

.video-participant-card video {
    width: 100%;
    height: 160px;
    object-fit: cover;
    background: #000;
}

.voice-participant-avatar {
    @apply relative w-12 h-12 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold text-sm transition-all duration-200;
}

.voice-participant-avatar.speaking {
    @apply ring-2 ring-[#3ba55c] ring-offset-2 ring-offset-[#2b2d31];
    animation: pulse-voice 2s infinite;
}

.voice-participant-avatar.muted::after {
    content: '';
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    background: #ed4245;
    border-radius: 50%;
    border: 2px solid #2b2d31;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23ffffff' viewBox='0 0 16 16'%3e%3cpath d='M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.188 2.262-.524l-.816-.816A2.99 2.99 0 0 1 8 11a3 3 0 0 1-3-3V6.341l-.912-.912A4.001 4.001 0 0 0 4 8v1a5 5 0 0 0 4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-1.025A5 5 0 0 1 3 9V8a5.001 5.001 0 0 1 .776-2.676L2.636 4.184a.5.5 0 1 1 .708-.708l11 11a.5.5 0 0 1-.708.708L8.5 9.5z'/%3e%3cpath d='M8 6a2 2 0 1 1 4 0v1a2 2 0 0 1-1.188 1.825l-.812-.812V6a1 1 0 0 0-2 0z'/%3e%3c/svg%3e");
    background-size: 8px 8px;
    background-repeat: no-repeat;
    background-position: center;
}

#voiceParticipantsBar {
    scrollbar-width: thin;
    scrollbar-color: #40444b #2b2d31;
}

#voiceParticipantsBar::-webkit-scrollbar {
    height: 4px;
}

#voiceParticipantsBar::-webkit-scrollbar-track {
    background: #2b2d31;
}

#voiceParticipantsBar::-webkit-scrollbar-thumb {
    background: #40444b;
    border-radius: 2px;
}

#voiceParticipantsBar::-webkit-scrollbar-thumb:hover {
    background: #4f545c;
}

#videoSidebar {
    scrollbar-width: thin;
    scrollbar-color: #40444b #313338;
}

#videoSidebar::-webkit-scrollbar {
    width: 6px;
}

#videoSidebar::-webkit-scrollbar-track {
    background: #313338;
}

#videoSidebar::-webkit-scrollbar-thumb {
    background: #40444b;
    border-radius: 3px;
}

#videoSidebar::-webkit-scrollbar-thumb:hover {
    background: #4f545c;
}

.video-participant-name {
    @apply absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-xs font-medium;
}

.video-participant-controls {
    @apply absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200;
}

.video-participant-controls button {
    @apply w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white text-xs transition-all duration-200;
}

@keyframes pulse-voice {
    0%, 100% { 
        box-shadow: 0 0 0 0 rgba(59, 165, 93, 0.4);
        transform: scale(1);
    }
    50% { 
        box-shadow: 0 0 0 6px rgba(59, 165, 93, 0);
        transform: scale(1.05);
    }
}

.fade-in {
    animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.loading-dot {
    @apply w-2 h-2 bg-[#5865f2] rounded-full;
    animation: loading-dot 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes loading-dot {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
}

.voice-control-panel {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}

.voice-control-panel button {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.voice-control-panel button:hover {
    transform: translateY(-2px) scale(1.05);
}

.voice-control-panel button:active {
    transform: translateY(0) scale(0.95);
}

.slider {
    background: linear-gradient(to right, #5865f2 0%, #5865f2 var(--value, 100%), #1e1f22 var(--value, 100%), #1e1f22 100%);
}

.slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #5865f2;
    cursor: pointer;
    border: 2px solid #36393f;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
    background: #4752c4;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(88, 101, 242, 0.4);
}

.slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #5865f2;
    cursor: pointer;
    border: 2px solid #36393f;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
    background: #4752c4;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(88, 101, 242, 0.4);
}

.form-checkbox {
    accent-color: #5865f2;
}

.form-checkbox:checked {
    background-color: #5865f2;
    border-color: #5865f2;
}

@keyframes pulse-green {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.7;
        transform: scale(1.1);
    }
}

.connection-pulse {
    animation: pulse-green 2s infinite;
}

.voice-control-panel .group:hover .absolute {
    transform: translateX(-50%) translateY(-2px);
}

@media (max-width: 640px) {
    .voice-control-panel {
        transform: translateX(-50%) scale(0.9);
        bottom: 1rem;
    }
    
    .voice-control-panel .flex {
        space-x: 0.75rem;
    }
    
    .voice-control-panel button {
        width: 3rem;
        height: 3rem;
    }
    
    .voice-control-panel .text-xl {
        font-size: 1rem;
    }
    
    #videoSidebar {
        width: 240px;
    }
    
    #voiceParticipantsBar {
        padding: 0.75rem;
    }
    
    .voice-participant-avatar {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 0.75rem;
    }
}

@media (max-width: 768px) {
    #videoSidebar {
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        z-index: 10;
        background: rgba(49, 51, 56, 0.95);
        backdrop-filter: blur(10px);
    }
}

.control-loading {
    opacity: 0.5;
    pointer-events: none;
}

.control-loading::after {
    content: '';
    position: absolute;
    inset: 0;
    background: conic-gradient(from 0deg, transparent, #5865f2, transparent);
    border-radius: inherit;
    animation: spin 1s linear infinite;
    mask: radial-gradient(circle at center, transparent 60%, black 61%);
}

.settings-modal-enter {
    animation: modalEnter 0.3s ease-out forwards;
}

@keyframes modalEnter {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}
</style>

<script src="/public/js/components/voice/voice-section.js"></script>
<script src="/public/js/components/videosdk/videosdk.js"></script>
<script src="/public/js/components/voice/video-handler.js"></script>

<script>
document.addEventListener('DOMContentLoaded', function() {
    initializeVoiceControls();
});

function initializeVoiceControls() {
    const micBtn = document.getElementById('voiceMicBtn');
    const deafenBtn = document.getElementById('voiceDeafenBtn');
    const videoBtn = document.getElementById('voiceVideoBtn');
    const screenBtn = document.getElementById('voiceScreenBtn');
    const settingsBtn = document.getElementById('voiceSettingsBtn');
    const disconnectBtn = document.getElementById('voiceDisconnectBtn');

    if (micBtn) {
        micBtn.addEventListener('click', function() {
            toggleMicrophone();
        });
    }

    if (deafenBtn) {
        deafenBtn.addEventListener('click', function() {
            toggleDeafen();
        });
    }

    if (videoBtn) {
        videoBtn.addEventListener('click', function() {
            toggleCamera();
        });
    }

    if (screenBtn) {
        screenBtn.addEventListener('click', function() {
            toggleScreenShare();
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            openVoiceSettings();
        });
    }

    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', function() {
            disconnectFromVoice();
        });
    }
}

function toggleMicrophone() {
    if (!window.videoSDKManager || !window.videoSDKManager.isReady()) {
        showToast('Voice not connected', 'error');
        return;
    }

    try {
        const newMicState = window.videoSDKManager.toggleMic();
        const micBtn = document.getElementById('voiceMicBtn');
        const micIcon = micBtn.querySelector('i');
        const micTooltip = micBtn.querySelector('.mic-tooltip');

        if (newMicState) {
            micIcon.className = 'fas fa-microphone text-xl';
            micTooltip.textContent = 'Mute';
            micBtn.classList.remove('bg-red-500');
            micBtn.classList.add('bg-[#2f3136]');
            showToast('Microphone enabled', 'success');
        } else {
            micIcon.className = 'fas fa-microphone-slash text-xl';
            micTooltip.textContent = 'Unmute';
            micBtn.classList.remove('bg-[#2f3136]');
            micBtn.classList.add('bg-red-500');
            showToast('Microphone muted', 'info');
        }
    } catch (error) {
        console.error('Error toggling microphone:', error);
        showToast('Failed to toggle microphone', 'error');
    }
}

function toggleDeafen() {
    if (!window.videoSDKManager || !window.videoSDKManager.isReady()) {
        showToast('Voice not connected', 'error');
        return;
    }

    try {
        const newDeafenState = window.videoSDKManager.toggleDeafen();
        const deafenBtn = document.getElementById('voiceDeafenBtn');
        const deafenIcon = deafenBtn.querySelector('i');
        const deafenTooltip = deafenBtn.querySelector('.deafen-tooltip');

        if (newDeafenState) {
            deafenIcon.className = 'fas fa-volume-mute text-xl';
            deafenTooltip.textContent = 'Undeafen';
            deafenBtn.classList.remove('bg-[#2f3136]');
            deafenBtn.classList.add('bg-red-500');
            showToast('Audio deafened', 'info');
        } else {
            deafenIcon.className = 'fas fa-headphones text-xl';
            deafenTooltip.textContent = 'Deafen';
            deafenBtn.classList.remove('bg-red-500');
            deafenBtn.classList.add('bg-[#2f3136]');
            showToast('Audio undeafened', 'success');
        }
    } catch (error) {
        console.error('Error toggling deafen:', error);
        showToast('Failed to toggle deafen', 'error');
    }
}

async function toggleCamera() {
    if (!window.videoSDKManager || !window.videoSDKManager.isReady()) {
        showToast('Voice not connected', 'error');
        return;
    }

    const videoBtn = document.getElementById('voiceVideoBtn');
    const videoIcon = videoBtn.querySelector('i');
    const videoTooltip = videoBtn.querySelector('.video-tooltip');
    
    videoBtn.disabled = true;
    videoBtn.style.opacity = '0.6';

    try {
        const newVideoState = await window.videoSDKManager.toggleWebcam();
        
        if (newVideoState) {
            videoIcon.className = 'fas fa-video text-xl';
            videoTooltip.textContent = 'Turn Off Camera';
            videoBtn.classList.remove('bg-[#2f3136]');
            videoBtn.classList.add('bg-green-600');
            showToast('Camera enabled', 'success');
        } else {
            videoIcon.className = 'fas fa-video-slash text-xl';
            videoTooltip.textContent = 'Turn On Camera';
            videoBtn.classList.remove('bg-green-600');
            videoBtn.classList.add('bg-[#2f3136]');
            showToast('Camera disabled', 'info');
        }
    } catch (error) {
        console.error('Error toggling camera:', error);
        showToast('Failed to toggle camera', 'error');
    } finally {
        setTimeout(() => {
            videoBtn.disabled = false;
            videoBtn.style.opacity = '1';
        }, 1000);
    }
}

async function toggleScreenShare() {
    if (!window.videoSDKManager || !window.videoSDKManager.isReady()) {
        showToast('Voice not connected', 'error');
        return;
    }

    const screenBtn = document.getElementById('voiceScreenBtn');
    const screenIcon = screenBtn.querySelector('i');
    const screenTooltip = screenBtn.querySelector('.screen-tooltip');
    
    screenBtn.disabled = true;
    screenBtn.style.opacity = '0.6';

    try {
        const newScreenState = await window.videoSDKManager.toggleScreenShare();
        
        if (newScreenState) {
            screenIcon.className = 'fas fa-stop-circle text-xl';
            screenTooltip.textContent = 'Stop Sharing';
            screenBtn.classList.remove('bg-[#2f3136]');
            screenBtn.classList.add('bg-blue-600');
            showToast('Screen share started', 'success');
        } else {
            screenIcon.className = 'fas fa-desktop text-xl';
            screenTooltip.textContent = 'Share Screen';
            screenBtn.classList.remove('bg-blue-600');
            screenBtn.classList.add('bg-[#2f3136]');
            showToast('Screen share stopped', 'info');
        }
    } catch (error) {
        console.error('Error toggling screen share:', error);
        showToast('Failed to toggle screen share', 'error');
    } finally {
        setTimeout(() => {
            screenBtn.disabled = false;
            screenBtn.style.opacity = '1';
        }, 1000);
    }
}

function openVoiceSettings() {
    showToast('Voice settings feature coming soon', 'info');
}

function disconnectFromVoice() {
    if (window.voiceManager && window.voiceManager.isConnected) {
        window.voiceManager.leaveVoice();
        showToast('Disconnected from voice channel', 'info');
    } else {
        showToast('Not connected to voice', 'error');
    }
}

function showToast(message, type = 'info', duration = 3000) {
    if (window.showToast) {
        window.showToast(message, type, duration);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

function updateDiscordLayout() {
    const screenShareContainer = document.getElementById('screenShareContainer');
    const speakerView = document.getElementById('speakerView');
    const voiceOnlyGrid = document.getElementById('voiceOnlyGrid');
    const videoSidebar = document.getElementById('videoSidebar');
    const voiceParticipantsBar = document.getElementById('voiceParticipantsBar');
    
    const hasScreenShare = document.querySelector('[data-stream-type="share"]');
    const videoParticipants = document.querySelectorAll('[data-stream-type="video"]');
    const hasActiveSpeaker = document.querySelector('.video-participant-card.active-speaker');
    
    if (hasScreenShare) {
        screenShareContainer.classList.remove('hidden');
        speakerView.classList.add('hidden');
        voiceOnlyGrid.classList.add('hidden');
    } else if (hasActiveSpeaker || videoParticipants.length > 0) {
        screenShareContainer.classList.add('hidden');
        if (hasActiveSpeaker) {
            speakerView.classList.remove('hidden');
            voiceOnlyGrid.classList.add('hidden');
        } else {
            speakerView.classList.add('hidden');
            voiceOnlyGrid.classList.remove('hidden');
        }
    } else {
        screenShareContainer.classList.add('hidden');
        speakerView.classList.add('hidden');
        voiceOnlyGrid.classList.remove('hidden');
    }
    
    if (videoParticipants.length > 0) {
        videoSidebar.classList.remove('hidden');
    } else {
        videoSidebar.classList.add('hidden');
    }
    
    const voiceParticipants = document.querySelectorAll('.voice-participant-avatar');
    if (voiceParticipants.length > 0) {
        voiceParticipantsBar.classList.remove('hidden');
    } else {
        voiceParticipantsBar.classList.add('hidden');
    }
}

function createVideoParticipantCard(participant) {
    const card = document.createElement('div');
    card.className = 'video-participant-card group relative';
    card.dataset.participantId = participant.id;
    card.dataset.streamType = 'video';
    
    const displayName = (participant.name || participant.id || 'User').length > 15 
        ? (participant.name || participant.id || 'User').substring(0, 12) + '...' 
        : (participant.name || participant.id || 'User');
    
    card.innerHTML = `
        <video autoplay playsinline muted class="w-full h-40 object-cover bg-black"></video>
        <div class="video-participant-name">${displayName}</div>
        <div class="video-participant-controls">
            <button class="pin-btn" title="Pin">
                <i class="fas fa-thumbtack"></i>
            </button>
            <button class="mute-btn" title="Mute">
                <i class="fas fa-microphone-slash"></i>
            </button>
        </div>
    `;
    
    const pinBtn = card.querySelector('.pin-btn');
    const muteBtn = card.querySelector('.mute-btn');
    
    if (pinBtn) {
        pinBtn.addEventListener('click', () => pinParticipant(participant.id));
    }
    
    if (muteBtn) {
        muteBtn.addEventListener('click', () => muteParticipant(participant.id));
    }
    
    return card;
}

function createVoiceParticipantAvatar(participant) {
    const avatar = document.createElement('div');
    avatar.className = 'voice-participant-avatar';
    avatar.dataset.participantId = participant.id;
    
    const nameInitial = (participant.name || participant.id || 'U').charAt(0).toUpperCase();
    const displayName = (participant.name || participant.id || 'User').length > 10 
        ? (participant.name || participant.id || 'User').substring(0, 8) + '...' 
        : (participant.name || participant.id || 'User');
    
    avatar.innerHTML = `
        <span class="text-sm font-bold">${nameInitial}</span>
        <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-[#b5bac1] whitespace-nowrap">${displayName}</div>
    `;
    
    return avatar;
}

function createScreenShareView(participant) {
    const screenShareContainer = document.getElementById('screenShareContainer');
    const screenShareVideo = document.getElementById('screenShareVideo');
    const screenShareUsername = document.getElementById('screenShareUsername');
    
    screenShareUsername.textContent = `${participant.name || participant.id} is sharing their screen`;
    screenShareContainer.dataset.participantId = participant.id;
    screenShareContainer.dataset.streamType = 'share';
    
    return screenShareVideo;
}

function addParticipantVideo(participantId, stream, streamType = 'video') {
    if (streamType === 'share') {
        const video = createScreenShareView({ id: participantId, name: participantId });
        if (video && stream) {
            video.srcObject = stream;
        }
    } else {
        const videoParticipants = document.getElementById('videoParticipants');
        const existingCard = videoParticipants.querySelector(`[data-participant-id="${participantId}"]`);
        
        if (!existingCard) {
            const card = createVideoParticipantCard({ id: participantId, name: participantId });
            const video = card.querySelector('video');
            if (video && stream) {
                video.srcObject = stream;
            }
            videoParticipants.appendChild(card);
        }
    }
    
    updateDiscordLayout();
}

function removeParticipantVideo(participantId, streamType = 'video') {
    if (streamType === 'share') {
        const screenShareContainer = document.getElementById('screenShareContainer');
        const screenShareVideo = document.getElementById('screenShareVideo');
        screenShareContainer.removeAttribute('data-participant-id');
        screenShareContainer.removeAttribute('data-stream-type');
        if (screenShareVideo) {
            screenShareVideo.srcObject = null;
        }
    } else {
        const videoParticipants = document.getElementById('videoParticipants');
        const card = videoParticipants.querySelector(`[data-participant-id="${participantId}"]`);
        if (card) {
            card.remove();
        }
    }
    
    updateDiscordLayout();
}

function addVoiceParticipant(participantId, participantName) {
    const voiceParticipantsList = document.getElementById('voiceParticipantsList');
    const existingAvatar = voiceParticipantsList.querySelector(`[data-participant-id="${participantId}"]`);
    
    if (!existingAvatar) {
        const avatar = createVoiceParticipantAvatar({ 
            id: participantId, 
            name: participantName || participantId 
        });
        voiceParticipantsList.appendChild(avatar);
    }
    
    updateDiscordLayout();
}

function removeVoiceParticipant(participantId) {
    const voiceParticipantsList = document.getElementById('voiceParticipantsList');
    const avatar = voiceParticipantsList.querySelector(`[data-participant-id="${participantId}"]`);
    if (avatar) {
        avatar.remove();
    }
    
    updateDiscordLayout();
}

function updateParticipantSpeaking(participantId, isSpeaking) {
    const voiceAvatar = document.querySelector(`.voice-participant-avatar[data-participant-id="${participantId}"]`);
    if (voiceAvatar) {
        if (isSpeaking) {
            voiceAvatar.classList.add('speaking');
        } else {
            voiceAvatar.classList.remove('speaking');
        }
    }
    
    const videoCard = document.querySelector(`.video-participant-card[data-participant-id="${participantId}"]`);
    if (videoCard) {
        const video = videoCard.querySelector('video');
        if (video) {
            if (isSpeaking) {
                video.style.border = '2px solid #3ba55c';
                video.style.boxShadow = '0 0 10px rgba(59, 165, 93, 0.5)';
            } else {
                video.style.border = 'none';
                video.style.boxShadow = 'none';
            }
        }
    }
}

function updateParticipantMuted(participantId, isMuted) {
    const voiceAvatar = document.querySelector(`.voice-participant-avatar[data-participant-id="${participantId}"]`);
    if (voiceAvatar) {
        if (isMuted) {
            voiceAvatar.classList.add('muted');
        } else {
            voiceAvatar.classList.remove('muted');
        }
    }
}

function pinParticipant(participantId) {
    const speakerView = document.getElementById('speakerView');
    const speakerVideo = document.getElementById('speakerVideo');
    const speakerUsername = document.getElementById('speakerUsername');
    
    const videoCard = document.querySelector(`.video-participant-card[data-participant-id="${participantId}"]`);
    if (videoCard) {
        const sourceVideo = videoCard.querySelector('video');
        if (sourceVideo && sourceVideo.srcObject) {
            speakerVideo.srcObject = sourceVideo.srcObject;
            speakerUsername.textContent = participantId;
            
            document.querySelectorAll('.video-participant-card').forEach(card => {
                card.classList.remove('active-speaker');
            });
            videoCard.classList.add('active-speaker');
            
            updateDiscordLayout();
        }
    }
}

function muteParticipant(participantId) {
    console.log(`Mute participant ${participantId} - This would require admin permissions`);
}

function addLocalParticipant() {
    const username = document.querySelector('meta[name="username"]')?.content || 'You';
    addVoiceParticipant('local', username);
}

function addRemoteParticipant(participantId, participantName) {
    addVoiceParticipant(participantId, participantName);
}

function removeParticipant(participantId) {
    removeVoiceParticipant(participantId);
    removeParticipantVideo(participantId, 'video');
    removeParticipantVideo(participantId, 'share');
}

function setupVoiceEventHandlers() {
    console.log('🔧 Setting up Discord-style voice event handlers');
    
    window.addEventListener('voiceConnect', (event) => {
        console.log('🎤 Voice connected event received:', event.detail);
        addLocalParticipant();
        
        if (window.videosdkMeeting) {
            console.log('🔍 VideoSDK meeting found, setting up participant handlers');
            
            window.videosdkMeeting.participants.forEach((participant) => {
                if (participant.id !== window.videosdkMeeting.localParticipant.id) {
                    addRemoteParticipant(participant.id, participant.displayName || participant.id);
                }
            });
            
            window.videosdkMeeting.on('participant-joined', (participant) => {
                console.log('👤 Participant joined:', participant.id);
                addRemoteParticipant(participant.id, participant.displayName || participant.id);
            });
            
            window.videosdkMeeting.on('participant-left', (participant) => {
                console.log('👤 Participant left:', participant.id);
                removeParticipant(participant.id);
            });
        }
    });
    
    window.addEventListener('voiceDisconnect', () => {
        console.log('🔇 Voice disconnected, clearing all participants');
        document.getElementById('voiceParticipantsList').innerHTML = '';
        document.getElementById('videoParticipants').innerHTML = '';
        document.getElementById('screenShareContainer').classList.add('hidden');
        document.getElementById('speakerView').classList.add('hidden');
        document.getElementById('voiceOnlyGrid').classList.remove('hidden');
        updateDiscordLayout();
    });
    
    window.addEventListener('videosdkStreamEnabled', (event) => {
        const { kind, stream, participant } = event.detail;
        console.log(`📹 Stream enabled: ${kind} for ${participant}`);
        
        if (kind === 'video') {
            addParticipantVideo(participant, stream, 'video');
        } else if (kind === 'share') {
            addParticipantVideo(participant, stream, 'share');
        }
    });
    
    window.addEventListener('videosdkStreamDisabled', (event) => {
        const { kind, participant } = event.detail;
        console.log(`📹 Stream disabled: ${kind} for ${participant}`);
        
        if (kind === 'video') {
            removeParticipantVideo(participant, 'video');
        } else if (kind === 'share') {
            removeParticipantVideo(participant, 'share');
        }
    });
}

function toggleLoading(show) {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        if (show) {
            loadingState.classList.remove('hidden');
        } else {
            loadingState.classList.add('hidden');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        const components = {
            screenShareContainer: !!document.getElementById('screenShareContainer'),
            speakerView: !!document.getElementById('speakerView'),
            voiceOnlyGrid: !!document.getElementById('voiceOnlyGrid'),
            videoSidebar: !!document.getElementById('videoSidebar'),
            voiceParticipantsBar: !!document.getElementById('voiceParticipantsBar'),
            voiceSection: !!window.voiceSection,
            voiceManager: !!window.voiceManager,
            videoSDKManager: !!window.videoSDKManager,
            videosdkMeeting: !!window.videosdkMeeting
        };
        
        console.log('🔍 Discord-style voice components check:', components);
        
        setupVoiceEventHandlers();
        updateDiscordLayout();
        
        if (window.voiceState?.isConnected) {
            console.log('🔧 Voice is connected, adding local participant');
            addLocalParticipant();
        }
    }, 1000);
});

window.addEventListener('videoGridUpdate', updateDiscordLayout);
window.addEventListener('voiceConnect', () => toggleLoading(false));
window.addEventListener('voiceDisconnect', () => toggleLoading(false));

window.updateDiscordLayout = updateDiscordLayout;
window.addParticipantVideo = addParticipantVideo;
window.removeParticipantVideo = removeParticipantVideo;
window.addVoiceParticipant = addVoiceParticipant;
window.removeVoiceParticipant = removeVoiceParticipant;
window.updateParticipantSpeaking = updateParticipantSpeaking;
window.updateParticipantMuted = updateParticipantMuted;
window.pinParticipant = pinParticipant;
window.addLocalParticipant = addLocalParticipant;
window.addRemoteParticipant = addRemoteParticipant;
window.removeParticipant = removeParticipant;
window.toggleLoading = toggleLoading;
</script>
