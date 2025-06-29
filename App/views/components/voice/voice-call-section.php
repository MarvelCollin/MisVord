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
    <!-- Channel Header -->
    <div class="flex items-center px-4 py-3 bg-[#2b2d31] border-b border-[#1a1b1e] shadow-sm">
        <div class="flex items-center space-x-2">
            <i class="fas fa-volume-up text-[#b5bac1]"></i>
            <span class="text-white font-medium"><?php echo htmlspecialchars($channelName); ?></span>
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-[#313338] via-[#2b2d31] to-[#1e1f22]">
        <!-- Video Grid -->
        <div id="videoGrid" class="hidden w-full max-w-7xl mx-auto p-6 grid gap-6 overflow-auto flex-1">
            <!-- Video grid items will be dynamically added here -->
        </div>

        <!-- Voice Only View -->
        <div id="voiceOnlyView" class="flex-1 w-full flex items-center justify-center p-12 max-w-6xl mx-auto">
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 w-full justify-items-center">
                <!-- Voice only participants will be added here -->
            </div>
        </div>

        <!-- Voice Controls Panel -->
        <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            <div class="voice-control-panel bg-[#1e1f22]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#40444b]/50 p-4">
                <div class="flex items-center space-x-4">
                    <!-- Microphone -->
                    <div class="relative group">
                        <button id="voiceMicBtn" class="mic-btn w-14 h-14 rounded-full bg-[#2f3136] hover:bg-[#3c3f47] text-[#b9bbbe] hover:text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" title="Mute/Unmute">
                            <i class="fas fa-microphone text-xl"></i>
                        </button>
                        <!-- Tooltip -->
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            <span class="mic-tooltip">Mute</span>
                        </div>
                    </div>

                    <!-- Deafen -->
                    <div class="relative group">
                        <button id="voiceDeafenBtn" class="deafen-btn w-14 h-14 rounded-full bg-[#2f3136] hover:bg-[#3c3f47] text-[#b9bbbe] hover:text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" title="Deafen/Undeafen">
                            <i class="fas fa-headphones text-xl"></i>
                        </button>
                        <!-- Tooltip -->
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            <span class="deafen-tooltip">Deafen</span>
                        </div>
                    </div>

                    <!-- Video/Camera -->
                    <div class="relative group">
                        <button id="voiceVideoBtn" class="video-btn w-14 h-14 rounded-full bg-[#2f3136] hover:bg-[#3c3f47] text-[#b9bbbe] hover:text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" title="Turn On/Off Camera">
                            <i class="fas fa-video-slash text-xl"></i>
                        </button>
                        <!-- Tooltip -->
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            <span class="video-tooltip">Turn On Camera</span>
                        </div>
                    </div>

                    <!-- Screen Share -->
                    <div class="relative group">
                        <button id="voiceScreenBtn" class="screen-btn w-14 h-14 rounded-full bg-[#2f3136] hover:bg-[#3c3f47] text-[#b9bbbe] hover:text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" title="Share Screen">
                            <i class="fas fa-desktop text-xl"></i>
                        </button>
                        <!-- Tooltip -->
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            <span class="screen-tooltip">Share Screen</span>
                        </div>
                    </div>

                    <!-- Settings -->
                    <div class="relative group">
                        <button id="voiceSettingsBtn" class="w-14 h-14 rounded-full bg-[#2f3136] hover:bg-[#3c3f47] text-[#b9bbbe] hover:text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" title="Voice Settings">
                            <i class="fas fa-cog text-xl"></i>
                        </button>
                        <!-- Tooltip -->
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            Voice Settings
                        </div>
                    </div>

                    <!-- Disconnect -->
                    <div class="relative group ml-4 pl-4 border-l border-[#40444b]">
                        <button id="voiceDisconnectBtn" class="w-14 h-14 rounded-full bg-[#ed4245] hover:bg-[#fc5054] text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" title="Leave Voice Channel">
                            <i class="fas fa-phone-slash text-xl"></i>
                        </button>
                        <!-- Tooltip -->
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            Leave Channel
                        </div>
                    </div>
                </div>

                <!-- Connection Info Bar -->
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

        <!-- Loading State -->
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
/* Discord-style speaking animation */
@keyframes discord-speaking {
    0%, 100% { 
        box-shadow: 0 0 0 0 rgba(59, 165, 93, 0.7);
    }
    50% { 
        box-shadow: 0 0 0 8px rgba(59, 165, 93, 0);
    }
}

/* Simple hover effect */
.participant-container:hover {
    transform: translateY(-2px);
}

/* Speaking indicator styles */
.speaking-ring {
    animation: discord-speaking 2s infinite;
}

/* Responsive participant sizing */
.participant-container {
    min-width: 100px;
    max-width: 140px;
}

/* Screen share styles */
.screen-share-container {
    @apply col-span-2 row-span-2 bg-[#1e1f22] rounded-xl overflow-hidden shadow-lg;
}

/* Animations */
@keyframes pulse-voice {
    0%, 100% { 
        box-shadow: 0 0 0 0 rgba(59, 165, 93, 0.4);
        transform: scale(1);
    }
    50% { 
        box-shadow: 0 0 0 8px rgba(59, 165, 93, 0);
        transform: scale(1.05);
    }
}

/* Enhanced Grid layouts */
@media (min-width: 768px) {
    .videoGrid-1 { 
        grid-template-columns: minmax(0, 600px);
        max-width: 600px;
        margin: 0 auto;
    }
    .videoGrid-2 { 
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 1000px;
    }
    .videoGrid-3, .videoGrid-4 { 
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 1200px;
    }
    .videoGrid-5, .videoGrid-6 { 
        grid-template-columns: repeat(3, minmax(0, 1fr));
        max-width: 1400px;
    }
    .videoGrid-7, .videoGrid-8, .videoGrid-9 { 
        grid-template-columns: repeat(3, minmax(0, 1fr));
        max-width: 1600px;
    }
}

/* Fade in animation */
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

/* Hover effects */
.participant-container:hover .participant-controls {
    @apply opacity-100 transform translate-y-0;
}

.participant-controls {
    @apply absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transform translate-y-2 transition-all duration-200;
}

.participant-controls button {
    @apply text-white hover:text-[#b5bac1] transition-colors duration-200 p-2 rounded-full hover:bg-white/10;
}

/* Loading animation */
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

/* Ensure Discord-style responsive layout */
@media (max-width: 640px) {
    .participant-container {
        min-width: 90px;
        max-width: 110px;
    }
    
    #voiceOnlyView {
        padding: 8px;
    }
    
    .grid {
        gap: 1rem;
    }
}

/* Debug styles */
.debug-highlight {
    border: 2px solid #ff0000 !important;
    background-color: rgba(255, 0, 0, 0.1) !important;
}

/* Voice Controls Styles */
.voice-control-panel {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}

/* Enhanced button animations */
.voice-control-panel button {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.voice-control-panel button:hover {
    transform: translateY(-2px) scale(1.05);
}

.voice-control-panel button:active {
    transform: translateY(0) scale(0.95);
}

/* Custom slider styles */
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

/* Custom checkbox styles */
.form-checkbox {
    accent-color: #5865f2;
}

.form-checkbox:checked {
    background-color: #5865f2;
    border-color: #5865f2;
}

/* Connection status animations */
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

/* Tooltip improvements */
.voice-control-panel .group:hover .absolute {
    transform: translateX(-50%) translateY(-2px);
}

/* Mobile responsiveness for voice controls */
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
}

/* Loading state for controls */
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

/* Enhanced modal animations */
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
function updateGridLayout() {
    const videoGrid = document.getElementById('videoGrid');
    const voiceOnlyView = document.getElementById('voiceOnlyView');
    if (!videoGrid || !voiceOnlyView) return;
    
    const videoParticipants = videoGrid.querySelectorAll('video:not(.hidden)').length;
    const voiceParticipants = voiceOnlyView.querySelectorAll('.participant-container').length;
    const hasScreenShare = videoGrid.querySelector('.screen-share-container');
    
    console.log('🔍 Grid Layout Update:', {
        videoParticipants,
        voiceParticipants,
        hasScreenShare: !!hasScreenShare
    });
    
    if (videoParticipants > 0) {
        videoGrid.classList.remove('hidden');
        videoGrid.classList.add('fade-in');
        voiceOnlyView.classList.add('hidden');
    } else {
        videoGrid.classList.add('hidden');
        voiceOnlyView.classList.remove('hidden');
        voiceOnlyView.classList.add('fade-in');
    }
    
    for (let i = 1; i <= 9; i++) {
        videoGrid.classList.remove(`videoGrid-${i}`);
    }
    videoGrid.classList.add(`videoGrid-${videoParticipants}`);
    
    if (hasScreenShare) {
        videoGrid.classList.add('has-screen-share');
    } else {
        videoGrid.classList.remove('has-screen-share');
    }
}

function createParticipantElement(participant, isVideo = false) {
    const container = document.createElement('div');
    
    // Discord-style participant container
    container.className = 'participant-container flex flex-col items-center space-y-2 p-4 hover:bg-[#393c43]/30 rounded-lg transition-all duration-200 group';
    container.dataset.participantId = participant.id || participant.name || 'unknown';
    
    const nameInitial = (participant.name || participant.id || 'U').charAt(0).toUpperCase();
    const displayName = (participant.name || participant.id || 'User').length > 15 
        ? (participant.name || participant.id || 'User').substring(0, 12) + '...' 
        : (participant.name || participant.id || 'User');
    
    // Determine if speaking (for demo, we'll make it random initially)
    const isSpeaking = Math.random() > 0.7; // Random for demo
    const isMuted = Math.random() > 0.8; // Random for demo
    
    if (isVideo) {
        container.innerHTML = `
            <div class="relative">
                <video autoplay playsinline class="w-32 h-24 object-cover rounded-lg bg-[#1e1f22] border-2 ${isSpeaking ? 'border-[#3ba55d] shadow-lg shadow-[#3ba55d]/30' : 'border-transparent'}"></video>
                <div class="absolute bottom-1 left-1 bg-[#1e1f22]/80 backdrop-blur-sm rounded px-1.5 py-0.5">
                    <span class="text-white text-xs font-medium">${displayName}</span>
                </div>
                ${isMuted ? '<div class="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><i class="fas fa-microphone-slash text-white text-xs"></i></div>' : ''}
            </div>
        `;
    } else {
        // Discord-style voice participant
        container.innerHTML = `
            <div class="relative">
                <!-- Avatar with speaking indicator -->
                <div class="relative">
                    <div class="w-20 h-20 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold text-xl relative transition-all duration-200 ${isSpeaking ? 'ring-4 ring-[#3ba55d] ring-opacity-60 shadow-lg shadow-[#3ba55d]/30' : ''}">
                        ${nameInitial}
                    </div>
                    
                    <!-- Speaking indicator ring -->
                    ${isSpeaking ? `
                        <div class="absolute inset-0 rounded-full border-3 border-[#3ba55d] animate-pulse"></div>
                        <div class="absolute inset-0 rounded-full border border-[#3ba55d] animate-ping"></div>
                    ` : ''}
                    
                    <!-- Muted indicator -->
                    ${isMuted ? `
                        <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-2 border-[#313338] flex items-center justify-center">
                            <i class="fas fa-microphone-slash text-white text-xs"></i>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Username -->
            <div class="text-center">
                <span class="text-[#dbdee1] text-sm font-medium ${isSpeaking ? 'text-[#3ba55d]' : ''} transition-colors duration-200">${displayName}</span>
            </div>
        `;
    }
    
    return container;
}

function addLocalParticipant() {
    const voiceOnlyView = document.getElementById('voiceOnlyView');
    const voiceGrid = voiceOnlyView?.querySelector('.grid') || voiceOnlyView?.querySelector('div') || voiceOnlyView?.children[0];
    
    if (!voiceGrid) {
        console.error('❌ Voice grid not found. VoiceOnlyView:', !!voiceOnlyView);
        if (voiceOnlyView) {
            console.log('VoiceOnlyView HTML:', voiceOnlyView.outerHTML.substring(0, 200));
        }
        return;
    }
    
    const existingLocal = voiceGrid.querySelector('[data-participant-id="local"]');
    if (existingLocal) {
        console.log('✅ Local participant already exists');
        return;
    }
    
    const username = document.querySelector('meta[name="username"]')?.content || 'You';
    const localParticipant = createParticipantElement({ 
        id: 'local', 
        name: username 
    }, false);
    
    voiceGrid.appendChild(localParticipant);
    console.log('✅ Local participant added to voice grid');
    
    updateGridLayout();
}

function addRemoteParticipant(participantId, participantName) {
    const voiceOnlyView = document.getElementById('voiceOnlyView');
    const voiceGrid = voiceOnlyView?.querySelector('.grid') || voiceOnlyView?.querySelector('div') || voiceOnlyView?.children[0];
    
    if (!voiceGrid) {
        console.error('❌ Voice grid not found');
        return;
    }
    
    const existingParticipant = voiceGrid.querySelector(`[data-participant-id="${participantId}"]`);
    if (existingParticipant) {
        console.log(`✅ Participant ${participantId} already exists`);
        return;
    }
    
    const remoteParticipant = createParticipantElement({ 
        id: participantId, 
        name: participantName || participantId 
    }, false);
    
    voiceGrid.appendChild(remoteParticipant);
    console.log(`✅ Remote participant ${participantId} added to voice grid`);
    
    updateGridLayout();
}

function removeParticipant(participantId) {
    const voiceOnlyView = document.getElementById('voiceOnlyView');
    const voiceGrid = voiceOnlyView?.querySelector('.grid') || voiceOnlyView?.querySelector('div') || voiceOnlyView?.children[0];
    
    if (!voiceGrid) return;
    
    const participant = voiceGrid.querySelector(`[data-participant-id="${participantId}"]`);
    if (participant) {
        participant.remove();
        console.log(`✅ Participant ${participantId} removed from voice grid`);
        updateGridLayout();
    }
}

function setupVoiceEventHandlers() {
    console.log('🔧 Setting up voice event handlers');
    
    window.addEventListener('voiceConnect', (event) => {
        console.log('🎤 Voice connected event received:', event.detail);
        
        // Add local participant immediately
        addLocalParticipant();
        
        setTimeout(() => {
            // Backup: ensure local participant is added even if first attempt failed
            if (!document.querySelector('[data-participant-id="local"]')) {
                console.log('🔧 Backup: Adding local participant');
                addLocalParticipant();
            }
            
            if (window.videosdkMeeting) {
                console.log('🔍 VideoSDK meeting found, setting up participant handlers');
                
                // Add existing participants
                if (window.videosdkMeeting.participants) {
                    window.videosdkMeeting.participants.forEach((participant, participantId) => {
                        if (participantId !== 'local') {
                            addRemoteParticipant(participantId, participant.displayName || participantId);
                        }
                    });
                }
                
                // Set up event handlers for future participants
                try {
                    window.videosdkMeeting.on('participant-joined', (participant) => {
                        console.log('👤 Participant joined:', participant.id);
                        addRemoteParticipant(participant.id, participant.displayName || participant.id);
                    });
                    
                    window.videosdkMeeting.on('participant-left', (participant) => {
                        console.log('👋 Participant left:', participant.id);
                        removeParticipant(participant.id);
                    });
                } catch (error) {
                    console.warn('⚠️ Error setting up VideoSDK event handlers:', error);
                }
            } else {
                console.log('⚠️ VideoSDK meeting not found, will retry...');
                // Retry in another 2 seconds
                setTimeout(() => {
                    if (window.videosdkMeeting && !document.querySelector('[data-participant-id="remote"]')) {
                        console.log('🔧 Retry: Setting up VideoSDK participants');
                        if (window.videosdkMeeting.participants) {
                            window.videosdkMeeting.participants.forEach((participant, participantId) => {
                                if (participantId !== 'local') {
                                    addRemoteParticipant(participantId, participant.displayName || participantId);
                                }
                            });
                        }
                    }
                }, 2000);
            }
        }, 500);
    });
    
    window.addEventListener('voiceDisconnect', () => {
        console.log('🔇 Voice disconnected, clearing participants');
        const voiceOnlyView = document.getElementById('voiceOnlyView');
        const voiceGrid = voiceOnlyView?.querySelector('.grid') || voiceOnlyView?.querySelector('div') || voiceOnlyView?.children[0];
        
        if (voiceGrid) {
            voiceGrid.innerHTML = '';
            updateGridLayout();
        }
    });
}

function toggleLoading(show) {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.classList.toggle('hidden', !show);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("🔊 Voice call section loaded");
    
    setupVoiceEventHandlers();
    updateGridLayout();
    
    // Add debug button in development
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1') || window.location.search.includes('debug=1')) {
        const debugContainer = document.createElement('div');
        debugContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
        
        const debugBtn = document.createElement('button');
        debugBtn.innerHTML = '🔧 Debug';
        debugBtn.className = 'bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors';
        debugBtn.onclick = window.debugVoiceSystem;
        
        const refreshBtn = document.createElement('button');
        refreshBtn.innerHTML = '🎨 Refresh';
        refreshBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors';
        refreshBtn.onclick = window.refreshParticipantStyling;
        

        
        debugContainer.appendChild(debugBtn);
        debugContainer.appendChild(refreshBtn);
        document.body.appendChild(debugContainer);
    }
    
    setTimeout(function() {
        const components = {
            videoGrid: !!document.getElementById('videoGrid'),
            voiceOnlyView: !!document.getElementById('voiceOnlyView'),
            voiceControls: !!document.getElementById('voiceControls'),
            voiceSection: !!window.voiceSection,
            voiceManager: !!window.voiceManager,
            videoSDKManager: !!window.videoSDKManager,
            videosdkMeeting: !!window.videosdkMeeting
        };
        
        console.log("🔍 Voice components check:", components);
        
        if (window.voiceState?.isConnected && !document.querySelector('.participant-container')) {
            console.log('🔧 Voice is connected but no participants showing, adding local participant');
            addLocalParticipant();
        }
        
        // Force refresh participants with new styling if they exist
        const existingParticipants = document.querySelectorAll('.participant-container');
        if (existingParticipants.length > 0) {
            console.log('🎨 Refreshing participant styling...');
            existingParticipants.forEach(participant => {
                const participantId = participant.dataset.participantId;
                const isLocal = participantId === 'local';
                const name = isLocal ? 
                    (document.querySelector('meta[name="username"]')?.content || 'You') : 
                    participantId;
                
                // Remove old participant
                participant.remove();
                
                // Add with new styling
                if (isLocal) {
                    addLocalParticipant();
                } else {
                    addRemoteParticipant(participantId, name);
                }
            });
        }
    }, 1000);
});

window.addEventListener('videoGridUpdate', updateGridLayout);
window.addEventListener('voiceConnect', () => toggleLoading(false));
window.addEventListener('voiceDisconnect', () => toggleLoading(false));

window.updateGridLayout = updateGridLayout;
window.createParticipantElement = createParticipantElement;
window.toggleLoading = toggleLoading;
window.addLocalParticipant = addLocalParticipant;
window.addRemoteParticipant = addRemoteParticipant;
window.removeParticipant = removeParticipant;

// Voice Controls Synchronization
function setupVoiceControlSync() {
    console.log('🔧 Setting up voice control synchronization');
    
    // Get all control elements
    const voiceMicBtn = document.getElementById('voiceMicBtn');
    const voiceDeafenBtn = document.getElementById('voiceDeafenBtn');
    const voiceVideoBtn = document.getElementById('voiceVideoBtn');
    const voiceScreenBtn = document.getElementById('voiceScreenBtn');
    const voiceSettingsBtn = document.getElementById('voiceSettingsBtn');
    const voiceDisconnectBtn = document.getElementById('voiceDisconnectBtn');
    
    // Connection timer elements
    const connectionTimeEl = document.getElementById('voiceConnectionTime');
    const participantCountEl = document.getElementById('voiceParticipantCount');
    
    let connectionStartTime = null;
    let connectionTimer = null;
    
    // Microphone control
    if (voiceMicBtn) {
        voiceMicBtn.addEventListener('click', () => {
            if (window.voiceStateManager) {
                window.voiceStateManager.toggleMic();
            }
        });
    }
    
    // Deafen control
    if (voiceDeafenBtn) {
        voiceDeafenBtn.addEventListener('click', () => {
            if (window.voiceStateManager) {
                window.voiceStateManager.toggleDeafen();
            }
        });
    }
    
    // Video control
    if (voiceVideoBtn) {
        voiceVideoBtn.addEventListener('click', () => {
            if (window.voiceStateManager) {
                window.voiceStateManager.toggleVideo();
            }
        });
    }
    
    // Screen share control
    if (voiceScreenBtn) {
        voiceScreenBtn.addEventListener('click', () => {
            if (window.voiceStateManager) {
                window.voiceStateManager.toggleScreenShare();
            }
        });
    }
    
    // Settings control
    if (voiceSettingsBtn) {
        voiceSettingsBtn.addEventListener('click', () => {
            showVoiceSettings();
        });
    }
    
    // Disconnect control
    if (voiceDisconnectBtn) {
        voiceDisconnectBtn.addEventListener('click', () => {
            if (window.voiceStateManager) {
                window.voiceStateManager.disconnectVoice();
            } else if (window.voiceManager) {
                window.voiceManager.leaveVoice();
            }
        });
    }
    
    // Update controls based on voice state
    function updateVoiceControls() {
        let state;
        if (window.localStorageManager) {
            state = window.localStorageManager.getVoiceState();
        } else if (window.voiceStateManager) {
            state = window.voiceStateManager.getState();
        } else {
            return;
        }
        
        // Update microphone button
        if (voiceMicBtn) {
            const micIcon = voiceMicBtn.querySelector('i');
            const micTooltip = voiceMicBtn.parentElement.querySelector('.mic-tooltip');
            
            if (state.isMuted || state.isDeafened) {
                micIcon.className = 'fas fa-microphone-slash text-xl';
                voiceMicBtn.classList.add('bg-[#ed4245]', 'text-white');
                voiceMicBtn.classList.remove('bg-[#2f3136]', 'text-[#b9bbbe]');
                if (micTooltip) micTooltip.textContent = 'Unmute';
            } else {
                micIcon.className = 'fas fa-microphone text-xl';
                voiceMicBtn.classList.remove('bg-[#ed4245]', 'text-white');
                voiceMicBtn.classList.add('bg-[#2f3136]', 'text-[#b9bbbe]');
                if (micTooltip) micTooltip.textContent = 'Mute';
            }
        }
        
        // Update deafen button
        if (voiceDeafenBtn) {
            const deafenIcon = voiceDeafenBtn.querySelector('i');
            const deafenTooltip = voiceDeafenBtn.parentElement.querySelector('.deafen-tooltip');
            
            if (state.isDeafened) {
                deafenIcon.className = 'fas fa-volume-xmark text-xl';
                voiceDeafenBtn.classList.add('bg-[#ed4245]', 'text-white');
                voiceDeafenBtn.classList.remove('bg-[#2f3136]', 'text-[#b9bbbe]');
                if (deafenTooltip) deafenTooltip.textContent = 'Undeafen';
            } else {
                deafenIcon.className = 'fas fa-headphones text-xl';
                voiceDeafenBtn.classList.remove('bg-[#ed4245]', 'text-white');
                voiceDeafenBtn.classList.add('bg-[#2f3136]', 'text-[#b9bbbe]');
                if (deafenTooltip) deafenTooltip.textContent = 'Deafen';
            }
        }
        
        // Update video button
        if (voiceVideoBtn) {
            const videoIcon = voiceVideoBtn.querySelector('i');
            const videoTooltip = voiceVideoBtn.parentElement.querySelector('.video-tooltip');
            
            if (state.isVideoOn) {
                videoIcon.className = 'fas fa-video text-xl';
                voiceVideoBtn.classList.add('bg-[#3ba55c]', 'text-white');
                voiceVideoBtn.classList.remove('bg-[#2f3136]', 'text-[#b9bbbe]');
                if (videoTooltip) videoTooltip.textContent = 'Turn Off Camera';
            } else {
                videoIcon.className = 'fas fa-video-slash text-xl';
                voiceVideoBtn.classList.remove('bg-[#3ba55c]', 'text-white');
                voiceVideoBtn.classList.add('bg-[#2f3136]', 'text-[#b9bbbe]');
                if (videoTooltip) videoTooltip.textContent = 'Turn On Camera';
            }
        }
        
        // Update screen share button
        if (voiceScreenBtn) {
            const screenIcon = voiceScreenBtn.querySelector('i');
            const screenTooltip = voiceScreenBtn.parentElement.querySelector('.screen-tooltip');
            
            if (state.isScreenSharing) {
                screenIcon.className = 'fas fa-desktop text-xl';
                voiceScreenBtn.classList.add('bg-[#5865f2]', 'text-white');
                voiceScreenBtn.classList.remove('bg-[#2f3136]', 'text-[#b9bbbe]');
                if (screenTooltip) screenTooltip.textContent = 'Stop Sharing';
            } else {
                screenIcon.className = 'fas fa-desktop text-xl';
                voiceScreenBtn.classList.remove('bg-[#5865f2]', 'text-white');
                voiceScreenBtn.classList.add('bg-[#2f3136]', 'text-[#b9bbbe]');
                if (screenTooltip) screenTooltip.textContent = 'Share Screen';
            }
        }
    }
    
    // Start connection timer
    function startConnectionTimer() {
        connectionStartTime = Date.now();
        
        if (connectionTimer) {
            clearInterval(connectionTimer);
        }
        
        connectionTimer = setInterval(() => {
            if (connectionTimeEl && connectionStartTime) {
                const elapsed = Math.floor((Date.now() - connectionStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                connectionTimeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    // Stop connection timer
    function stopConnectionTimer() {
        if (connectionTimer) {
            clearInterval(connectionTimer);
            connectionTimer = null;
        }
        connectionStartTime = null;
        if (connectionTimeEl) {
            connectionTimeEl.textContent = '00:00';
        }
    }
    
    // Update participant count
    function updateParticipantCount() {
        if (participantCountEl) {
            const participants = document.querySelectorAll('.participant-container').length;
            participantCountEl.textContent = participants.toString();
        }
    }
    
    // Listen for voice state changes
    if (window.voiceStateManager) {
        window.voiceStateManager.addListener(updateVoiceControls);
    }
    
    window.addEventListener('voiceStateChanged', updateVoiceControls);
    
    // Listen for voice events
    window.addEventListener('voiceConnect', (e) => {
        console.log('🎤 Voice controls: Voice connected');
        startConnectionTimer();
        updateVoiceControls();
        setTimeout(updateParticipantCount, 500);
    });
    
    window.addEventListener('voiceDisconnect', () => {
        console.log('🔇 Voice controls: Voice disconnected');
        stopConnectionTimer();
        updateVoiceControls();
        if (participantCountEl) {
            participantCountEl.textContent = '0';
        }
    });
    
    // Listen for participant changes
    window.addEventListener('participantJoined', updateParticipantCount);
    window.addEventListener('participantLeft', updateParticipantCount);
    
    // Periodic participant count update
    setInterval(updateParticipantCount, 2000);
    
    // Initial update
    updateVoiceControls();
    updateParticipantCount();
    
    console.log('✅ Voice control synchronization setup complete');
}

// Voice settings modal
function showVoiceSettings() {
    // Create settings modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]';
    modal.innerHTML = `
        <div class="bg-[#2f3136] rounded-lg p-6 m-4 max-w-lg w-full settings-modal-enter">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-semibold text-white">Voice Settings</h3>
                <button class="close-settings text-[#b9bbbe] hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-6">
                <!-- Input Device -->
                <div>
                    <label class="block text-sm font-medium text-[#b9bbbe] mb-2">Input Device</label>
                    <select class="w-full bg-[#1e1f22] border border-[#40444b] rounded-md px-3 py-2 text-white">
                        <option>Default - Built-in Microphone</option>
                    </select>
                </div>
                
                <!-- Output Device -->
                <div>
                    <label class="block text-sm font-medium text-[#b9bbbe] mb-2">Output Device</label>
                    <select class="w-full bg-[#1e1f22] border border-[#40444b] rounded-md px-3 py-2 text-white">
                        <option>Default - Built-in Speakers</option>
                    </select>
                </div>
                
                <!-- Input Volume -->
                <div>
                    <label class="block text-sm font-medium text-[#b9bbbe] mb-2">Input Volume</label>
                    <div class="flex items-center space-x-3">
                        <input type="range" min="0" max="100" value="100" class="flex-1 h-2 bg-[#1e1f22] rounded-lg appearance-none cursor-pointer slider">
                        <span class="text-white text-sm w-10">100%</span>
                    </div>
                </div>
                
                <!-- Output Volume -->
                <div>
                    <label class="block text-sm font-medium text-[#b9bbbe] mb-2">Output Volume</label>
                    <div class="flex items-center space-x-3">
                        <input type="range" min="0" max="100" value="100" class="flex-1 h-2 bg-[#1e1f22] rounded-lg appearance-none cursor-pointer slider">
                        <span class="text-white text-sm w-10">100%</span>
                    </div>
                </div>
                
                <!-- Voice Activity -->
                <div>
                    <label class="flex items-center space-x-3">
                        <input type="checkbox" checked class="form-checkbox h-4 w-4 text-[#5865f2] bg-[#1e1f22] border-[#40444b] rounded">
                        <span class="text-[#b9bbbe]">Voice Activity Detection</span>
                    </label>
                </div>
                
                <!-- Push to Talk -->
                <div>
                    <label class="flex items-center space-x-3">
                        <input type="checkbox" class="form-checkbox h-4 w-4 text-[#5865f2] bg-[#1e1f22] border-[#40444b] rounded">
                        <span class="text-[#b9bbbe]">Push to Talk</span>
                    </label>
                </div>
            </div>
            
            <div class="flex justify-end space-x-3 mt-6 pt-6 border-t border-[#40444b]">
                <button class="close-settings px-4 py-2 bg-[#4f545c] hover:bg-[#5d6269] text-white rounded transition-colors">
                    Cancel
                </button>
                <button class="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded transition-colors">
                    Save
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal handlers
    const closeButtons = modal.querySelectorAll('.close-settings');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // Slider value updates
    const sliders = modal.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        const valueSpan = slider.parentElement.querySelector('span');
        slider.addEventListener('input', () => {
            valueSpan.textContent = slider.value + '%';
        });
    });
}

// Initialize voice control sync when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Delay to ensure voice state manager is ready
    setTimeout(setupVoiceControlSync, 1000);
});

// Also initialize when voice state manager becomes available
if (window.voiceStateManager) {
    setupVoiceControlSync();
} else {
    // Wait for voice state manager
    const checkVoiceStateManager = () => {
        if (window.voiceStateManager) {
            setupVoiceControlSync();
        } else {
            setTimeout(checkVoiceStateManager, 500);
        }
    };
    checkVoiceStateManager();
}

// Function to refresh all participant styling
window.refreshParticipantStyling = function() {
    console.log('🎨 Manually refreshing participant styling...');
    const existingParticipants = document.querySelectorAll('.participant-container');
    const participantData = [];
    
    // Collect participant data
    existingParticipants.forEach(participant => {
        const participantId = participant.dataset.participantId;
        const isLocal = participantId === 'local';
        const name = isLocal ? 
            (document.querySelector('meta[name="username"]')?.content || 'You') : 
            participantId;
        
        participantData.push({ id: participantId, name, isLocal });
        participant.remove();
    });
    
    // Re-add with new styling
    participantData.forEach(data => {
        if (data.isLocal) {
            addLocalParticipant();
        } else {
            addRemoteParticipant(data.id, data.name);
        }
    });
    
    console.log('✅ Participant styling refreshed');
};



// Debug function to test participant system
window.debugVoiceSystem = function() {
    console.log('🔧 =================================');
    console.log('🔧 Debug Voice System');
    console.log('🔧 =================================');
    
    const voiceOnlyView = document.getElementById('voiceOnlyView');
    const grid = voiceOnlyView?.querySelector('.grid') || voiceOnlyView?.querySelector('div') || voiceOnlyView?.children[0];
    
    console.log('🔍 DOM Elements:');
    console.log('  - VoiceOnlyView:', !!voiceOnlyView);
    console.log('  - VoiceOnlyView HTML:', voiceOnlyView?.outerHTML.substring(0, 200));
    console.log('  - Grid element:', !!grid);
    console.log('  - Grid classes:', grid?.className);
    console.log('  - Current participants:', document.querySelectorAll('.participant-container').length);
    
    console.log('🔍 Voice State:');
    console.log('  - voiceState.isConnected:', window.voiceState?.isConnected);
    console.log('  - voiceManager exists:', !!window.voiceManager);
    console.log('  - videosdkMeeting exists:', !!window.videosdkMeeting);
    
    console.log('🔍 Container visibility:');
    console.log('  - voice-not-join-container hidden:', document.getElementById('voice-not-join-container')?.classList.contains('hidden'));
    console.log('  - voice-call-container hidden:', document.getElementById('voice-call-container')?.classList.contains('hidden'));
    
    // Highlight the grid for visual debugging
    if (grid) {
        grid.classList.add('debug-highlight');
        setTimeout(() => grid.classList.remove('debug-highlight'), 3000);
        console.log('✅ Grid highlighted with red border for 3 seconds');
    }
    
    // Try to add test participant
    console.log('🔧 Adding test local participant...');
    try {
        addLocalParticipant();
        console.log('✅ Local participant addition attempted');
    } catch (error) {
        console.error('❌ Error adding local participant:', error);
    }
    
    // Check results
    setTimeout(() => {
        const participantCount = document.querySelectorAll('.participant-container').length;
        console.log(`🔍 Result: ${participantCount} participants found after addition attempt`);
        
        if (participantCount === 0) {
            console.log('🔧 Trying alternative method...');
            // Try adding directly to the first child
            if (voiceOnlyView && voiceOnlyView.children[0]) {
                const testParticipant = createParticipantElement({ id: 'debug-test', name: 'Debug Test' });
                voiceOnlyView.children[0].appendChild(testParticipant);
                console.log('🔧 Debug participant added directly');
            }
        }
    }, 100);
    
    console.log('🔧 =================================');
};
</script>
