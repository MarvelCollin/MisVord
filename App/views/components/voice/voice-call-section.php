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

<div class="voice-call-app w-full h-screen bg-gradient-to-br from-[#313338] via-[#2b2d31] to-[#1e1f22] flex flex-col relative overflow-hidden">
    <div class="voice-header bg-[#2b2d31]/90 backdrop-blur-sm border-b border-[#1a1b1e] p-4 flex items-center justify-between">
        <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-[#5865f2] rounded-full flex items-center justify-center">
                <i class="fas fa-volume-up text-white text-lg"></i>
            </div>
            <div>
                <h1 class="text-white font-semibold text-lg"><?php echo htmlspecialchars($channelName); ?></h1>
                <p class="text-[#b5bac1] text-sm">Voice Channel</p>
            </div>
        </div>
        <div class="flex items-center space-x-2 text-[#b5bac1] text-sm">
            <div class="flex items-center space-x-1">
                <div class="w-2 h-2 bg-[#3ba55c] rounded-full animate-pulse"></div>
                <span>Connected</span>
            </div>
            <span>•</span>
            <span id="voiceParticipantCount">1</span>
            <span>participants</span>
            <span>•</span>
            <span>Meeting ID: <span id="meetingIdDisplay" class="font-mono text-[#7289da]">-</span></span>
        </div>
    </div>

    <div class="voice-content flex-1 flex relative">
        <div id="cameraSection" class="hidden w-96 bg-[#1a1b1e] border-r border-[#40444b]/30 flex flex-col">
            <div class="bg-[#2b2d31] p-4 border-b border-[#40444b]/30">
                <div class="flex items-center space-x-2 mb-3">
                    <div class="w-8 h-8 bg-[#3ba55c] rounded-full flex items-center justify-center">
                        <i class="fas fa-video text-white text-sm"></i>
                    </div>
                    <h3 class="text-white font-semibold">Camera Feed</h3>
                </div>
                <div class="relative bg-black rounded-lg overflow-hidden shadow-lg" style="aspect-ratio: 16/9;">
                    <video id="localCameraVideo" class="w-full h-full object-cover" autoplay playsinline muted></video>
                    <div id="cameraPlaceholder" class="absolute inset-0 bg-gradient-to-br from-[#313338] to-[#1a1b1e] flex items-center justify-center">
                        <div class="text-center">
                            <div class="w-16 h-16 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-lg">
                                <?php echo strtoupper(substr($userName, 0, 1)); ?>
                            </div>
                            <span class="text-[#b5bac1] text-sm font-medium">Camera Off</span>
                            <p class="text-[#72767d] text-xs mt-1">Click camera button to enable</p>
                        </div>
                    </div>
                    <div class="absolute top-3 left-3 bg-[#1e1f22]/90 backdrop-blur-sm rounded-lg px-2 py-1">
                        <span class="text-white text-xs font-medium">You</span>
                    </div>
                    <div id="cameraControls" class="absolute bottom-3 right-3 flex space-x-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <button onclick="toggleCameraSettings()" class="bg-black/60 hover:bg-black/80 p-2 rounded-full transition-all duration-200" title="Camera Settings">
                            <i class="fas fa-cog text-white text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="flex-1 p-4 overflow-y-auto">
                <div class="flex items-center space-x-2 mb-3">
                    <div class="w-6 h-6 bg-[#5865f2] rounded-full flex items-center justify-center">
                        <i class="fas fa-users text-white text-xs"></i>
                    </div>
                    <h3 class="text-white font-medium">Participants</h3>
                    <span class="bg-[#5865f2] text-white text-xs px-2 py-1 rounded-full" id="sidebarParticipantCount">1</span>
                </div>
                <div id="participantsList" class="space-y-3">
                </div>
            </div>
        </div>

        <div class="main-content flex-1 flex flex-col relative">
            <div id="screenShareSection" class="hidden flex-1 bg-black relative border border-[#40444b]/30 rounded-lg m-4 overflow-hidden shadow-2xl">
                <div class="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-[#ed4245] rounded-full flex items-center justify-center animate-pulse">
                                <i class="fas fa-desktop text-white"></i>
                            </div>
                            <div>
                                <h3 class="text-white font-semibold" id="screenShareTitle">Screen Share Active</h3>
                                <p class="text-[#b5bac1] text-sm" id="screenShareUsername">Your Screen</p>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="minimizeScreenShare()" class="bg-black/60 hover:bg-black/80 p-2 rounded-full transition-all duration-200" title="Minimize">
                                <i class="fas fa-compress text-white"></i>
                            </button>
                            <button onclick="stopScreenShare()" class="bg-[#ed4245] hover:bg-[#fc5054] p-2 rounded-full transition-all duration-200" title="Stop Sharing">
                                <i class="fas fa-times text-white"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <video id="screenShareVideo" class="w-full h-full object-contain bg-black" autoplay playsinline></video>
                
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div class="flex items-center justify-center space-x-4">
                        <div class="flex items-center space-x-2 bg-black/60 rounded-lg px-3 py-2">
                            <div class="w-2 h-2 bg-[#3ba55c] rounded-full animate-pulse"></div>
                            <span class="text-white text-sm">Live</span>
                        </div>
                        <div class="flex items-center space-x-2 bg-black/60 rounded-lg px-3 py-2">
                            <i class="fas fa-eye text-[#b5bac1]"></i>
                            <span class="text-white text-sm" id="screenViewerCount">1 viewer</span>
                        </div>
                    </div>
                </div>
            </div>

            <div id="voiceOnlySection" class="flex-1 flex items-center justify-center">
                <div class="text-center max-w-lg">
                    <div class="relative mb-8">
                        <div class="w-32 h-32 bg-gradient-to-br from-[#5865f2] to-[#4752c4] rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto shadow-2xl">
                            <i class="fas fa-microphone"></i>
                        </div>
                        <div class="absolute -bottom-2 -right-2 w-12 h-12 bg-[#3ba55c] rounded-full flex items-center justify-center animate-pulse">
                            <i class="fas fa-check text-white"></i>
                        </div>
                    </div>
                    <h2 class="text-white text-3xl font-bold mb-3">Voice Connected</h2>
                    <p class="text-[#b5bac1] text-lg mb-8">You're connected to <span class="text-white font-medium"><?php echo htmlspecialchars($channelName); ?></span></p>
                    
                    <div class="bg-[#2b2d31]/50 backdrop-blur-sm rounded-xl p-6 border border-[#40444b]/30">
                        <h3 class="text-white font-semibold mb-4 flex items-center justify-center space-x-2">
                            <i class="fas fa-users text-[#5865f2]"></i>
                            <span>In this channel</span>
                        </h3>
                        <div id="voiceParticipantsGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        </div>
                    </div>
                </div>
            </div>

            <div id="videoGridSection" class="hidden flex-1 p-6">
                <div class="mb-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-[#3ba55c] rounded-full flex items-center justify-center">
                                <i class="fas fa-video text-white text-sm"></i>
                            </div>
                            <h3 class="text-white font-semibold text-lg">Video Participants</h3>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button onclick="toggleVideoLayout()" class="bg-[#2f3136] hover:bg-[#3c3f47] px-3 py-2 rounded-lg text-white text-sm transition-all duration-200">
                                <i class="fas fa-th-large mr-2"></i>Grid View
                            </button>
                            <button onclick="toggleVideoSidebar()" class="bg-[#2f3136] hover:bg-[#3c3f47] px-3 py-2 rounded-lg text-white text-sm transition-all duration-200">
                                <i class="fas fa-sidebar mr-2"></i>Sidebar
                            </button>
                        </div>
                    </div>
                </div>
                <div id="videoGrid" class="grid gap-4 h-full auto-rows-fr bg-[#1a1b1e]/30 rounded-xl p-4 border border-[#40444b]/30">
                </div>
            </div>
        </div>
    </div>

    <div class="voice-controls bg-[#1e1f22]/95 backdrop-blur-xl border-t border-[#40444b]/50 p-6">
        <div class="flex items-center justify-center space-x-6">
            <div class="relative group">
                <button id="micBtn" class="w-14 h-14 rounded-full bg-[#2f3136] hover:bg-[#3c3f47] text-[#b9bbbe] hover:text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                    <i class="fas fa-microphone text-xl"></i>
                </button>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    <span class="mic-tooltip">Mute</span>
                </div>
            </div>

            <div class="relative group">
                <button id="deafenBtn" class="w-14 h-14 rounded-full bg-[#2f3136] hover:bg-[#3c3f47] text-[#b9bbbe] hover:text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                    <i class="fas fa-headphones text-xl"></i>
                </button>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    <span class="deafen-tooltip">Deafen</span>
                </div>
            </div>

            <div class="relative group">
                <button id="videoBtn" class="w-14 h-14 rounded-full bg-[#2f3136] hover:bg-[#3c3f47] text-[#b9bbbe] hover:text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                    <i class="fas fa-video-slash text-xl"></i>
                </button>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    <span class="video-tooltip">Turn On Camera</span>
                </div>
            </div>

            <div class="relative group">
                <button id="screenBtn" class="w-14 h-14 rounded-full bg-[#2f3136] hover:bg-[#3c3f47] text-[#b9bbbe] hover:text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                    <i class="fas fa-desktop text-xl"></i>
                </button>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    <span class="screen-tooltip">Share Screen</span>
                </div>
            </div>

            <div class="w-px h-8 bg-[#40444b]"></div>

            <div class="relative group">
                <button id="disconnectBtn" class="w-14 h-14 rounded-full bg-[#ed4245] hover:bg-[#fc5054] text-white transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                    <i class="fas fa-phone-slash text-xl"></i>
                </button>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Leave Channel
                </div>
            </div>
        </div>
    </div>

    <div id="loadingOverlay" class="hidden absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-[#2f3136] rounded-2xl p-8 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-[#5865f2]/30 border-t-[#5865f2] mx-auto mb-4"></div>
            <p class="text-white font-medium">Connecting to voice...</p>
        </div>
    </div>
</div>

<style>
.voice-call-app {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.video-participant-card {
    background: #1e1f22;
    border-radius: 0.75rem;
    overflow: hidden;
    border: 1px solid rgba(64, 68, 75, 0.3);
    transition: all 0.2s ease;
    position: relative;
    aspect-ratio: 16/9;
}

.video-participant-card:hover {
    border-color: rgba(64, 68, 75, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.video-participant-card video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #000;
}

.voice-participant-card {
    display: flex;
    flex-col;
    align-items: center;
    padding: 1rem;
    transition: all 0.2s ease;
}

.voice-participant-card:hover {
    transform: scale(1.05);
}

.voice-participant-avatar {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    position: relative;
    transition: all 0.2s ease;
}

.voice-participant-avatar.speaking {
    animation: pulse-speaking 2s infinite;
}

@keyframes pulse-speaking {
    0%, 100% {
        box-shadow: 0 0 0 0 rgba(59, 165, 93, 0.4);
    }
    50% {
        box-shadow: 0 0 0 8px rgba(59, 165, 93, 0);
    }
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
    border: 2px solid #1e1f22;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23ffffff' viewBox='0 0 16 16'%3e%3cpath d='M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.188 2.262-.524l-.816-.816A2.99 2.99 0 0 1 8 11a3 3 0 0 1-3-3V6.341l-.912-.912A4.001 4.001 0 0 0 4 8v1a5 5 0 0 0 4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-1.025A5 5 0 0 1 3 9V8a5.001 5.001 0 0 1 .776-2.676L2.636 4.184a.5.5 0 1 1 .708-.708l11 11a.5.5 0 0 1-.708.708L8.5 9.5z'/%3e%3cpath d='M8 6a2 2 0 1 1 4 0v1a2 2 0 0 1-1.188 1.825l-.812-.812V6a1 1 0 0 0-2 0z'/%3e%3c/svg%3e");
    background-size: 8px 8px;
    background-repeat: no-repeat;
    background-position: center;
}

#videoGrid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

#screenShareSection {
    position: relative;
    z-index: 1;
}

#cameraSection {
    position: relative;
    z-index: 2;
}

.main-content {
    position: relative;
    z-index: 1;
}

@media (max-width: 768px) {
    #cameraSection {
        width: 100%;
        height: 200px;
        border-r: none;
        border-b: 1px solid rgba(64, 68, 75, 0.3);
    }
    
    .voice-content {
        flex-direction: column;
    }
    
    #videoGrid {
        grid-template-columns: 1fr;
    }
    
    .voice-controls .flex {
        space-x: 1rem;
    }
    
    .voice-controls button {
        width: 3rem;
        height: 3rem;
    }
}
</style>

<script src="/public/js/components/videosdk/videosdk.js"></script>

<script>
class VoiceCallManager {
    constructor() {
        this.participants = new Map();
        this.isConnected = false;
        this.isMuted = false;
        this.isDeafened = false;
        this.isVideoOn = false;
        this.isScreenSharing = false;
        this.currentView = 'voice-only';
        this.localParticipantId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupControls();
        this.addLocalParticipant();
    }

    setupEventListeners() {
        console.log(`🎧 [DEBUG] Setting up VoiceCallManager event listeners...`);

        window.addEventListener('videosdkStreamEnabled', (event) => {
            const { kind, stream, participant } = event.detail;
            console.log(`📹 [DEBUG] videosdkStreamEnabled event received:`, {
                kind: kind,
                participant: participant,
                stream: stream,
                streamType: typeof stream,
                eventDetail: event.detail
            });
            
            if (kind === 'video') {
                console.log(`📹 [DEBUG] Handling video stream for ${participant}`);
                this.handleCameraStream(participant, stream);
            } else if (kind === 'share') {
                console.log(`📹 [DEBUG] Handling screen share for ${participant}`);
                this.handleScreenShare(participant, stream);
            } else {
                console.log(`📹 [DEBUG] Ignoring stream kind: ${kind}`);
            }
        });

        window.addEventListener('videosdkStreamDisabled', (event) => {
            const { kind, participant } = event.detail;
            console.log(`📹❌ [DEBUG] videosdkStreamDisabled event received:`, {
                kind: kind,
                participant: participant,
                eventDetail: event.detail
            });
            
            if (kind === 'video') {
                console.log(`📹❌ [DEBUG] Handling video disabled for ${participant}`);
                this.handleCameraDisabled(participant);
            } else if (kind === 'share') {
                console.log(`📹❌ [DEBUG] Handling screen share stopped`);
                this.handleScreenShareStopped();
            }
        });

        window.addEventListener('voiceConnect', (event) => {
            console.log(`🔗 [DEBUG] voiceConnect event received:`, event.detail);
            this.isConnected = true;
            
            // Capture the local participant ID
            if (window.videoSDKManager?.meeting?.localParticipant) {
                this.localParticipantId = window.videoSDKManager.meeting.localParticipant.id;
                console.log(`🔗 [DEBUG] Local participant ID captured:`, this.localParticipantId);
            }
            
            // Display the meeting ID
            if (event.detail?.meetingId) {
                this.displayMeetingId(event.detail.meetingId);
                console.log(`🔗 [DEBUG] Meeting ID displayed:`, event.detail.meetingId);
            }
            
            this.updateView();
        });

        window.addEventListener('voiceDisconnect', (event) => {
            console.log(`🔌 [DEBUG] voiceDisconnect event received:`, event.detail);
            this.isConnected = false;
            this.cleanup();
        });

        console.log(`🎧 [DEBUG] VoiceCallManager event listeners set up complete`);
    }

    setupControls() {
        document.getElementById('micBtn').addEventListener('click', () => this.toggleMic());
        document.getElementById('deafenBtn').addEventListener('click', () => this.toggleDeafen());
        document.getElementById('videoBtn').addEventListener('click', () => this.toggleVideo());
        document.getElementById('screenBtn').addEventListener('click', () => this.toggleScreenShare());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
    }

    addLocalParticipant() {
        const username = document.querySelector('meta[name="username"]')?.content || 'You';
        this.addParticipant('local', username, true);
    }

    addParticipant(id, name, isLocal = false) {
        const participant = {
            id,
            name,
            isLocal,
            isMuted: false,
            isDeafened: false,
            isSpeaking: false,
            hasVideo: false
        };

        this.participants.set(id, participant);
        this.createParticipantElement(participant);
        this.updateParticipantCount();
    }

    createParticipantElement(participant) {
        const container = document.getElementById('voiceParticipantsGrid');
        if (!container) return;

        const element = document.createElement('div');
        element.className = 'voice-participant-card';
        element.dataset.participantId = participant.id;

        const avatarColor = this.getAvatarColor(participant.name);
        const initial = participant.name.charAt(0).toUpperCase();

        element.innerHTML = `
            <div class="voice-participant-avatar" style="background: ${avatarColor}">
                ${initial}
            </div>
            <span class="text-white text-xs mt-2 text-center max-w-full truncate">${participant.name}</span>
        `;

        container.appendChild(element);
    }

    handleCameraStream(participantId, stream) {
        console.log(`🎥 [DEBUG] Handling camera stream for ${participantId}`, {
            stream: stream,
            streamType: typeof stream,
            isMediaStream: stream instanceof MediaStream,
            hasStreamProperty: !!stream?.stream,
            hasTrackProperty: !!stream?.track,
            streamTracks: stream instanceof MediaStream ? stream.getTracks().length : 'N/A',
            localParticipantId: this.localParticipantId,
            isLocalParticipant: participantId === this.localParticipantId
        });
        
        if (participantId === this.localParticipantId) {
            const video = document.getElementById('localCameraVideo');
            const placeholder = document.getElementById('cameraPlaceholder');
            const cameraSection = document.getElementById('cameraSection');
            
            console.log(`🎥 [DEBUG] Elements found:`, {
                video: !!video,
                placeholder: !!placeholder,
                cameraSection: !!cameraSection
            });
            
            if (video && stream) {
                console.log(`🎥 [DEBUG] Attempting to attach stream...`);
                
                try {
                    this.attachStreamToVideo(video, stream);
                    console.log(`🎥 [DEBUG] Stream attached, updating visibility...`);
                    
                    video.classList.remove('hidden');
                    console.log(`🎥 [DEBUG] Video element shown`);
                    
                    if (placeholder) {
                        placeholder.classList.add('hidden');
                        console.log(`🎥 [DEBUG] Placeholder hidden`);
                    }
                    
                    if (cameraSection) {
                        cameraSection.classList.remove('hidden');
                        console.log(`🎥 [DEBUG] Camera section shown`);
                    }
                    
                    this.isVideoOn = true;
                    console.log('✅ [DEBUG] Local camera stream attached and visible - SUCCESS');
                    
                    setTimeout(() => {
                        console.log(`🎥 [DEBUG] Post-attachment status:`, {
                            videoSrcObject: !!video.srcObject,
                            videoVisible: !video.classList.contains('hidden'),
                            placeholderHidden: placeholder?.classList.contains('hidden'),
                            cameraSectionVisible: !cameraSection?.classList.contains('hidden'),
                            isVideoOn: this.isVideoOn
                        });
                    }, 1000);
                    
                } catch (error) {
                    console.error(`🎥 [ERROR] Failed to attach stream:`, error);
                }
            } else {
                console.error(`🎥 [ERROR] Missing elements or stream:`, {
                    hasVideo: !!video,
                    hasStream: !!stream
                });
            }
        } else {
            console.log(`🎥 [DEBUG] Remote participant detected - ${participantId}!`);
            console.log(`🎥 [DEBUG] About to create video participant card...`);
            console.log(`🎥 [DEBUG] Current participants in Map:`, Array.from(this.participants.keys()));
            this.createVideoParticipantCard(participantId, stream);
        }
        
        console.log(`🎥 [DEBUG] Calling updateView()...`);
        this.updateView();
    }

    handleCameraDisabled(participantId) {
        console.log(`🎥❌ Handling camera disabled for ${participantId}`);
        
        if (participantId === this.localParticipantId) {
            const video = document.getElementById('localCameraVideo');
            const placeholder = document.getElementById('cameraPlaceholder');
            
            if (video && video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                video.srcObject = null;
            }
            
            if (video) video.classList.add('hidden');
            if (placeholder) placeholder.classList.remove('hidden');
            
            this.isVideoOn = false;
            console.log('✅ Local camera stream removed and hidden');
        } else {
            this.removeVideoParticipantCard(participantId);
        }
        
        this.updateView();
    }

    handleScreenShare(participantId, stream) {
        console.log(`🖥️ Handling screen share for ${participantId}`, stream);
        
        const video = document.getElementById('screenShareVideo');
        const username = document.getElementById('screenShareUsername');
        const title = document.getElementById('screenShareTitle');
        const section = document.getElementById('screenShareSection');
        
        if (video && stream && section) {
            this.attachStreamToVideo(video, stream);
            
            const participant = this.participants.get(participantId);
            const displayName = participantId === this.localParticipantId ? 'Your Screen' : 
                              (participant ? `${participant.name}'s Screen` : `${participantId}'s Screen`);
            
            if (username) username.textContent = displayName;
            if (title) title.textContent = 'Screen Share Active';
            
            section.classList.remove('hidden');
            this.isScreenSharing = true;
            
            console.log('✅ Screen share stream attached and visible');
        }
        
        this.updateView();
    }

    handleScreenShareStopped() {
        console.log(`🖥️❌ Handling screen share stopped`);
        
        const video = document.getElementById('screenShareVideo');
        const section = document.getElementById('screenShareSection');
        
        if (video && video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
        
        if (section) section.classList.add('hidden');
        this.isScreenSharing = false;
        
        console.log('✅ Screen share stream removed and hidden');
        this.updateView();
    }

    createVideoParticipantCard(participantId, stream) {
        console.log(`👥 [DEBUG] Creating video card for participant: ${participantId}`);
        
        const container = document.getElementById('videoGrid');
        if (!container) {
            console.error(`👥 [ERROR] videoGrid container not found`);
            return;
        }

        // Check if card already exists
        let existingCard = document.querySelector(`[data-participant-id="${participantId}"].video-participant-card`);
        if (existingCard) {
            console.log(`👥 [DEBUG] Video card already exists for ${participantId}, updating stream`);
            const video = existingCard.querySelector('video');
            if (video && stream) {
                this.attachStreamToVideo(video, stream);
            }
            return;
        }

        // Get or create participant info
        let participant = this.participants.get(participantId);
        if (!participant) {
            console.log(`👥 [DEBUG] Participant ${participantId} not in Map, creating entry`);
            participant = {
                id: participantId,
                name: `User ${participantId.slice(-4)}`, // Use last 4 chars as fallback name
                hasVideo: false
            };
            this.participants.set(participantId, participant);
        }

        console.log(`👥 [DEBUG] Creating video card with name: ${participant.name}`);

        const card = document.createElement('div');
        card.className = 'video-participant-card bg-[#1a1b1e] rounded-lg relative overflow-hidden';
        card.style.minHeight = '200px';
        card.style.width = '100%';
        card.dataset.participantId = participantId;

        card.innerHTML = `
            <video autoplay playsinline muted class="w-full h-full object-cover"></video>
            <div class="absolute top-3 left-3 bg-black/60 rounded px-2 py-1">
                <span class="text-white text-sm">${participant.name}</span>
            </div>
        `;

        const video = card.querySelector('video');
        if (video && stream) {
            console.log(`👥 [DEBUG] Attaching stream to video element for ${participantId}`);
            this.attachStreamToVideo(video, stream);
        }

        container.appendChild(card);
        participant.hasVideo = true;
        
        console.log(`👥 [SUCCESS] Video card created for ${participantId}`);
        this.updateView();
    }

    removeVideoParticipantCard(participantId) {
        const card = document.querySelector(`[data-participant-id="${participantId}"].video-participant-card`);
        if (card) {
            card.remove();
        }
        
        const participant = this.participants.get(participantId);
        if (participant) {
            participant.hasVideo = false;
        }
        
        this.updateView();
    }

    attachStreamToVideo(videoElement, stream) {
        try {
            console.log(`🔧 [DEBUG] attachStreamToVideo called with:`, {
                videoElement: !!videoElement,
                videoElementId: videoElement?.id,
                stream: stream,
                streamType: typeof stream,
                isMediaStream: stream instanceof MediaStream,
                hasStreamProperty: !!stream?.stream,
                hasTrackProperty: !!stream?.track
            });

            if (videoElement.srcObject) {
                console.log(`🔧 [DEBUG] Cleaning up existing srcObject...`);
                const tracks = videoElement.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }

            let mediaStream = null;
            if (stream instanceof MediaStream) {
                console.log(`🔧 [DEBUG] Stream is MediaStream directly`);
                mediaStream = stream;
            } else if (stream.stream instanceof MediaStream) {
                console.log(`🔧 [DEBUG] Stream has .stream property with MediaStream`);
                mediaStream = stream.stream;
            } else if (stream.track) {
                console.log(`🔧 [DEBUG] Stream has .track property, creating MediaStream`);
                mediaStream = new MediaStream([stream.track]);
            } else {
                console.error(`🔧 [ERROR] Unknown stream format:`, stream);
            }

            if (mediaStream) {
                console.log(`🔧 [DEBUG] Setting srcObject and playing...`, {
                    mediaStreamTracks: mediaStream.getTracks().length,
                    trackTypes: mediaStream.getTracks().map(t => t.kind)
                });
                videoElement.srcObject = mediaStream;
                videoElement.play().then(() => {
                    console.log(`🔧 [SUCCESS] Video element is now playing`);
                }).catch(error => {
                    console.warn(`🔧 [WARN] Video play failed:`, error);
                });
            } else {
                console.error(`🔧 [ERROR] No valid MediaStream found`);
            }
        } catch (error) {
            console.error('🔧 [ERROR] Error attaching stream:', error);
        }
    }

    hasOtherVideo() {
        const result = Array.from(this.participants.values()).some(p => p.hasVideo && p.id !== this.localParticipantId);
        console.log(`🔍 [DEBUG] hasOtherVideo() check:`, {
            participants: Array.from(this.participants.values()).map(p => ({
                id: p.id,
                hasVideo: p.hasVideo,
                isLocalParticipant: p.id === this.localParticipantId
            })),
            localParticipantId: this.localParticipantId,
            result: result
        });
        return result;
    }

    updateView() {
        const voiceSection = document.getElementById('voiceOnlySection');
        const videoSection = document.getElementById('videoGridSection');
        const screenSection = document.getElementById('screenShareSection');
        const cameraSection = document.getElementById('cameraSection');

        console.log(`🔄 [DEBUG] updateView() called with state:`, {
            isVideoOn: this.isVideoOn,
            isScreenSharing: this.isScreenSharing,
            hasOtherVideo: this.hasOtherVideo(),
            currentView: this.currentView,
            elementsFound: {
                voiceSection: !!voiceSection,
                videoSection: !!videoSection,
                screenSection: !!screenSection,
                cameraSection: !!cameraSection
            }
        });

        // Hide all sections first
        voiceSection?.classList.add('hidden');
        videoSection?.classList.add('hidden');
        console.log(`🔄 [DEBUG] Hidden voice and video sections`);

        if (this.isScreenSharing) {
            this.currentView = 'screen-share';
            console.log('📺 [DEBUG] Showing screen share view');
        } else if (this.isVideoOn || this.hasOtherVideo()) {
            this.currentView = 'video';
            videoSection?.classList.remove('hidden');
            console.log('🎥 [DEBUG] Showing video grid section - Condition met:', {
                isVideoOn: this.isVideoOn,
                hasOtherVideo: this.hasOtherVideo(),
                videoSectionExists: !!videoSection
            });
            
            if (this.isVideoOn) {
                cameraSection?.classList.remove('hidden');
                console.log('🎥 [DEBUG] Showing camera section (local video on)');
            } else {
                console.log('🎥 [DEBUG] Camera section not shown (local video off)');
            }
        } else {
            this.currentView = 'voice-only';
            voiceSection?.classList.remove('hidden');
            cameraSection?.classList.add('hidden');
            console.log('🎤 [DEBUG] Showing voice-only view');
        }

        // Final state check
        setTimeout(() => {
            console.log(`🔄 [DEBUG] Final view state:`, {
                currentView: this.currentView,
                voiceSectionVisible: voiceSection && !voiceSection.classList.contains('hidden'),
                videoSectionVisible: videoSection && !videoSection.classList.contains('hidden'),
                cameraSectionVisible: cameraSection && !cameraSection.classList.contains('hidden'),
                screenSectionVisible: screenSection && !screenSection.classList.contains('hidden')
            });
        }, 100);

        this.updateParticipantCount();
    }

    async toggleMic() {
        if (!window.videoSDKManager?.isReady()) {
            this.showToast('Voice not connected', 'error');
            return;
        }

        try {
            const newState = window.videoSDKManager.toggleMic();
            this.isMuted = !newState;
            this.updateMicButton();
            this.showToast(this.isMuted ? 'Microphone muted' : 'Microphone enabled', 'info');
        } catch (error) {
            console.error('Error toggling mic:', error);
            this.showToast('Failed to toggle microphone', 'error');
        }
    }

    async toggleDeafen() {
        if (!window.videoSDKManager?.isReady()) {
            this.showToast('Voice not connected', 'error');
            return;
        }

        try {
            const newState = window.videoSDKManager.toggleDeafen();
            this.isDeafened = newState;
            this.updateDeafenButton();
            this.showToast(this.isDeafened ? 'Audio deafened' : 'Audio undeafened', 'info');
        } catch (error) {
            console.error('Error toggling deafen:', error);
            this.showToast('Failed to toggle deafen', 'error');
        }
    }

    async toggleVideo() {
        console.log(`📹 [DEBUG] toggleVideo() called`);
        
        if (!window.videoSDKManager?.isReady()) {
            console.error(`📹 [ERROR] VideoSDK not ready:`, {
                videoSDKManager: !!window.videoSDKManager,
                isReady: window.videoSDKManager?.isReady?.()
            });
            this.showToast('Voice not connected', 'error');
            return;
        }

        // Ensure we have the local participant ID
        if (!this.localParticipantId && window.videoSDKManager?.meeting?.localParticipant) {
            this.localParticipantId = window.videoSDKManager.meeting.localParticipant.id;
            console.log(`📹 [DEBUG] Captured missing local participant ID:`, this.localParticipantId);
        }

        try {
            console.log(`📹 [DEBUG] Calling videoSDKManager.toggleWebcam()...`);
            const newState = await window.videoSDKManager.toggleWebcam();
            console.log(`📹 [DEBUG] toggleWebcam() returned:`, newState);
            
            // Manual test: Trigger the event ourselves to see if the UI responds
            if (newState) {
                console.log(`📹 [DEBUG] Camera should be ON - Testing manual event trigger...`);
                
                // Get the current meeting and local participant
                if (window.videoSDKManager.meeting?.localParticipant) {
                    const participant = window.videoSDKManager.meeting.localParticipant;
                    console.log(`📹 [DEBUG] Local participant found:`, {
                        id: participant.id,
                        streams: participant.streams ? Array.from(participant.streams.keys()) : 'No streams map'
                    });
                    
                    // Check if we can find a video stream
                    if (participant.streams) {
                        participant.streams.forEach((stream, streamId) => {
                            console.log(`📹 [DEBUG] Found stream ${streamId}:`, {
                                stream: stream,
                                streamType: typeof stream,
                                isMediaStream: stream instanceof MediaStream,
                                hasStreamProperty: !!stream?.stream
                            });
                            
                            if (streamId.includes('video') || streamId.includes('cam')) {
                                console.log(`📹 [DEBUG] Found video stream, manually triggering event...`);
                                window.dispatchEvent(new CustomEvent('videosdkStreamEnabled', {
                                    detail: {
                                        kind: 'video',
                                        stream: stream,
                                        participant: participant.id
                                    }
                                }));
                            }
                        });
                    }
                }
            } else {
                console.log(`📹 [DEBUG] Camera should be OFF`);
            }
            
            this.updateVideoButton();
            this.showToast(newState ? 'Camera enabled' : 'Camera disabled', 'info');
        } catch (error) {
            console.error('📹 [ERROR] Error toggling video:', error);
            this.showToast('Failed to toggle camera', 'error');
        }
    }

    async toggleScreenShare() {
        if (!window.videoSDKManager?.isReady()) {
            this.showToast('Voice not connected', 'error');
            return;
        }

        try {
            const newState = await window.videoSDKManager.toggleScreenShare();
            this.updateScreenButton();
            this.showToast(newState ? 'Screen share started' : 'Screen share stopped', 'info');
        } catch (error) {
            console.error('Error toggling screen share:', error);
            this.showToast('Failed to toggle screen share', 'error');
        }
    }

    updateMicButton() {
        const btn = document.getElementById('micBtn');
        const icon = btn.querySelector('i');
        const tooltip = btn.parentElement.querySelector('.mic-tooltip');
        
        if (this.isMuted) {
            icon.className = 'fas fa-microphone-slash text-xl';
            tooltip.textContent = 'Unmute';
            btn.classList.add('bg-red-500');
            btn.classList.remove('bg-[#2f3136]');
        } else {
            icon.className = 'fas fa-microphone text-xl';
            tooltip.textContent = 'Mute';
            btn.classList.remove('bg-red-500');
            btn.classList.add('bg-[#2f3136]');
        }
    }

    updateDeafenButton() {
        const btn = document.getElementById('deafenBtn');
        const icon = btn.querySelector('i');
        const tooltip = btn.parentElement.querySelector('.deafen-tooltip');
        
        if (this.isDeafened) {
            icon.className = 'fas fa-volume-mute text-xl';
            tooltip.textContent = 'Undeafen';
            btn.classList.add('bg-red-500');
            btn.classList.remove('bg-[#2f3136]');
        } else {
            icon.className = 'fas fa-headphones text-xl';
            tooltip.textContent = 'Deafen';
            btn.classList.remove('bg-red-500');
            btn.classList.add('bg-[#2f3136]');
        }
    }

    updateVideoButton() {
        const btn = document.getElementById('videoBtn');
        const icon = btn.querySelector('i');
        const tooltip = btn.parentElement.querySelector('.video-tooltip');
        
        if (this.isVideoOn) {
            icon.className = 'fas fa-video text-xl';
            tooltip.textContent = 'Turn Off Camera';
            btn.classList.add('bg-green-600');
            btn.classList.remove('bg-[#2f3136]');
        } else {
            icon.className = 'fas fa-video-slash text-xl';
            tooltip.textContent = 'Turn On Camera';
            btn.classList.remove('bg-green-600');
            btn.classList.add('bg-[#2f3136]');
        }
    }

    updateScreenButton() {
        const btn = document.getElementById('screenBtn');
        const icon = btn.querySelector('i');
        const tooltip = btn.parentElement.querySelector('.screen-tooltip');
        
        if (this.isScreenSharing) {
            icon.className = 'fas fa-stop-circle text-xl';
            tooltip.textContent = 'Stop Sharing';
            btn.classList.add('bg-blue-600');
            btn.classList.remove('bg-[#2f3136]');
        } else {
            icon.className = 'fas fa-desktop text-xl';
            tooltip.textContent = 'Share Screen';
            btn.classList.remove('bg-blue-600');
            btn.classList.add('bg-[#2f3136]');
        }
    }

    disconnect() {
        if (window.voiceManager?.isConnected) {
            window.voiceManager.leaveVoice();
        }
        this.showToast('Disconnected from voice channel', 'info');
    }

    updateParticipantCount() {
        const count = this.participants.size;
        const mainCount = document.getElementById('voiceParticipantCount');
        const sidebarCount = document.getElementById('sidebarParticipantCount');
        
        if (mainCount) mainCount.textContent = count;
        if (sidebarCount) sidebarCount.textContent = count;
    }

    getAvatarColor(username) {
        const colors = ['#5865f2', '#3ba55c', '#faa61a', '#ed4245', '#9b59b6', '#e91e63', '#00bcd4', '#607d8b'];
        const hash = username.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }

    showToast(message, type) {
        if (window.showToast) {
            window.showToast(message, type, 3000);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    cleanup() {
        console.log('🧹 Cleaning up voice call manager');
        
        const videos = document.querySelectorAll('#localCameraVideo, #screenShareVideo, .video-participant-card video');
        videos.forEach(video => {
            if (video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                video.srcObject = null;
            }
        });

        const cameraSection = document.getElementById('cameraSection');
        const screenSection = document.getElementById('screenShareSection');
        const videoGrid = document.getElementById('videoGrid');
        const participantsList = document.getElementById('participantsList');

        cameraSection?.classList.add('hidden');
        screenSection?.classList.add('hidden');
        if (videoGrid) videoGrid.innerHTML = '';
        if (participantsList) participantsList.innerHTML = '';

        this.participants.clear();
        this.isVideoOn = false;
        this.isScreenSharing = false;
        this.currentView = 'voice-only';
        this.localParticipantId = null;
        
        this.updateView();
    }
}

function stopScreenShare() {
    if (window.voiceCallManager) {
        window.voiceCallManager.toggleScreenShare();
    }
}

function minimizeScreenShare() {
    const screenSection = document.getElementById('screenShareSection');
    if (screenSection) {
        screenSection.style.transform = 'scale(0.3)';
        screenSection.style.transformOrigin = 'bottom right';
        screenSection.style.position = 'fixed';
        screenSection.style.bottom = '120px';
        screenSection.style.right = '20px';
        screenSection.style.width = '300px';
        screenSection.style.height = '200px';
        screenSection.style.zIndex = '100';
        screenSection.style.transition = 'all 0.3s ease';
    }
}

function toggleCameraSettings() {
    window.voiceCallManager?.showToast('Camera settings coming soon', 'info');
}

function toggleVideoLayout() {
    const videoGrid = document.getElementById('videoGrid');
    if (videoGrid) {
        const currentCols = videoGrid.style.gridTemplateColumns;
        if (currentCols.includes('repeat(auto-fit')) {
            videoGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            videoGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
        }
    }
}

function toggleVideoSidebar() {
    const cameraSection = document.getElementById('cameraSection');
    if (cameraSection) {
        cameraSection.classList.toggle('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.voiceCallManager = new VoiceCallManager();
});
</script>
