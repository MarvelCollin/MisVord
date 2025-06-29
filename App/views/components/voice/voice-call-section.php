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
    <div class="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <!-- Video Grid -->
        <div id="videoGrid" class="hidden w-full max-w-7xl mx-auto p-4 grid gap-4 overflow-auto">
            <!-- Video grid items will be dynamically added here -->
        </div>

        <!-- Voice Only View -->
        <div id="voiceOnlyView" class="flex-1 w-full flex items-center justify-center p-8 max-w-6xl mx-auto">
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
                <!-- Voice only participants will be added here -->
            </div>
        </div>

        <!-- Loading State -->
        <div id="loadingState" class="hidden absolute inset-0 bg-[#313338] bg-opacity-90 flex items-center justify-center">
            <div class="flex flex-col items-center space-y-4">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-[#5865f2] border-t-transparent"></div>
                <span class="text-[#b5bac1]">Connecting to voice...</span>
            </div>
        </div>
    </div>
</div>

<style>
/* Base styles for participant containers */
.participant-container {
    @apply relative bg-[#2f3136] rounded-xl overflow-hidden transition-all duration-300 shadow-md hover:shadow-lg hover:transform hover:scale-[1.02];
}

/* Video participant styles */
.video-participant {
    @apply aspect-video relative bg-[#1e1f22];
}

.video-participant video {
    @apply w-full h-full object-cover;
}

/* Voice only participant styles */
.voice-participant {
    @apply flex flex-col items-center justify-center p-6 space-y-4 bg-[#2f3136] rounded-xl hover:bg-[#34363c] transition-colors duration-200;
}

.voice-participant .avatar {
    @apply w-20 h-20 rounded-full bg-[#1a1b1e] flex items-center justify-center text-3xl font-medium text-white relative shadow-inner;
}

.voice-participant .name {
    @apply text-[#b5bac1] text-sm font-medium truncate max-w-full;
}

/* Status indicators */
.status-indicator {
    @apply absolute bottom-2 right-2 w-4 h-4 rounded-full border-[3px] border-[#2f3136] shadow-sm;
}

.status-speaking {
    @apply bg-[#3ba55d];
    animation: pulse-voice 2s infinite;
}

.status-muted {
    @apply bg-[#ED4245];
}

.status-idle {
    @apply bg-[#b5bac1];
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

/* Grid layouts */
@media (min-width: 768px) {
    .videoGrid-1 { 
        grid-template-columns: minmax(0, 800px);
        max-width: 800px;
        margin: 0 auto;
    }
    .videoGrid-2 { 
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 1200px;
    }
    .videoGrid-3, .videoGrid-4 { 
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 1400px;
    }
    .videoGrid-5, .videoGrid-6 { 
        grid-template-columns: repeat(3, minmax(0, 1fr));
        max-width: 1600px;
    }
    .videoGrid-7, .videoGrid-8, .videoGrid-9 { 
        grid-template-columns: repeat(3, minmax(0, 1fr));
        max-width: 1800px;
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
    container.className = `participant-container ${isVideo ? 'video-participant' : 'voice-participant'}`;
    container.dataset.participantId = participant.id || participant.name || 'unknown';
    
    const nameInitial = (participant.name || participant.id || 'U').charAt(0).toUpperCase();
    const displayName = (participant.name || participant.id || 'User').length > 15 
        ? (participant.name || participant.id || 'User').substring(0, 12) + '...' 
        : (participant.name || participant.id || 'User');
    
    container.innerHTML = `
        ${isVideo ? `
            <video autoplay playsinline class="peer"></video>
            <div class="participant-controls">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 rounded-full bg-[#1a1b1e] flex items-center justify-center text-white">
                            ${nameInitial}
                        </div>
                        <span class="text-white text-sm font-medium">${displayName}</span>
                    </div>
                    <div class="flex space-x-2">
                        <button class="mute-user" title="Mute User">
                            <i class="fas fa-microphone-slash"></i>
                        </button>
                        <button class="volume-control" title="Adjust Volume">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </div>
                </div>
            </div>
        ` : `
            <div class="avatar">
                ${nameInitial}
                <div class="status-indicator status-idle"></div>
            </div>
            <span class="name">${displayName}</span>
        `}
    `;
    
    return container;
}

function addLocalParticipant() {
    const voiceOnlyView = document.getElementById('voiceOnlyView');
    const voiceGrid = voiceOnlyView?.querySelector('.grid');
    
    if (!voiceGrid) {
        console.error('❌ Voice grid not found');
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
    const voiceGrid = voiceOnlyView?.querySelector('.grid');
    
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
    const voiceGrid = voiceOnlyView?.querySelector('.grid');
    
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
        
        setTimeout(() => {
            addLocalParticipant();
            
            if (window.videosdkMeeting) {
                console.log('🔍 VideoSDK meeting found, setting up participant handlers');
                
                if (window.videosdkMeeting.participants) {
                    window.videosdkMeeting.participants.forEach((participant, participantId) => {
                        if (participantId !== 'local') {
                            addRemoteParticipant(participantId, participant.displayName || participantId);
                        }
                    });
                }
                
                window.videosdkMeeting.on('participant-joined', (participant) => {
                    console.log('👤 Participant joined:', participant.id);
                    addRemoteParticipant(participant.id, participant.displayName || participant.id);
                });
                
                window.videosdkMeeting.on('participant-left', (participant) => {
                    console.log('👋 Participant left:', participant.id);
                    removeParticipant(participant.id);
                });
            }
        }, 500);
    });
    
    window.addEventListener('voiceDisconnect', () => {
        console.log('🔇 Voice disconnected, clearing participants');
        const voiceOnlyView = document.getElementById('voiceOnlyView');
        const voiceGrid = voiceOnlyView?.querySelector('.grid');
        
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
</script>
