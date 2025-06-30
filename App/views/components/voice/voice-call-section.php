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

<div class="voice-call-app w-full h-screen bg-[#2f3136] flex flex-col relative overflow-hidden">
    <!-- Discord-style Header -->
    <div class="voice-header bg-[#36393f] border-b border-[#202225] px-4 py-3 flex items-center justify-between shadow-md">
        <div class="flex items-center space-x-3">
            <div class="w-6 h-6 text-[#72767d]">
                <i class="fas fa-volume-up"></i>
            </div>
            <div class="flex items-center space-x-2">
                <h1 class="text-white font-semibold text-base"><?php echo htmlspecialchars($channelName); ?></h1>
                <div class="flex items-center space-x-1 text-[#b9bbbe] text-xs">
                    <div class="w-2 h-2 bg-[#3ba55c] rounded-full"></div>
                    <span id="voiceParticipantCount">1</span>
                </div>
            </div>
        </div>
        <div class="flex items-center space-x-4 text-[#b9bbbe] text-xs">
            <span>Meeting: <span id="meetingIdDisplay" class="font-mono text-[#7289da]">-</span></span>
            <div class="flex items-center space-x-2">
                <i class="fas fa-cog hover:text-white cursor-pointer transition-colors"></i>
                <i class="fas fa-users hover:text-white cursor-pointer transition-colors"></i>
            </div>
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col relative overflow-hidden">
        
        <!-- UNIFIED GRID VIEW -->
        <div id="unifiedGridView" class="flex-1 p-4">
            <div id="participantGrid" class="w-full h-full grid gap-3 auto-rows-fr">
                <!-- All participants (voice + video + screen share) will be added here -->
            </div>
        </div>



        <!-- SCREEN SHARE VIEW (Full priority like Discord) -->
        <div id="screenShareView" class="hidden flex-1 flex flex-col">
            <!-- Screen Share Main Area -->
            <div class="flex-1 relative bg-black">
                <video id="screenShareVideo" class="w-full h-full object-contain" autoplay playsinline></video>
                
                <!-- Screen Share Controls Overlay -->
                <div class="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-3">
                    <div class="w-6 h-6 bg-[#ed4245] rounded-full flex items-center justify-center">
                        <i class="fas fa-desktop text-white text-xs"></i>
                    </div>
                    <div>
                        <span class="text-white text-sm font-medium" id="screenShareUsername">Your Screen</span>
                        <div class="text-[#b9bbbe] text-xs">Screen sharing</div>
                    </div>
                </div>

                <!-- Picture-in-Picture Camera (when same user has both) -->
                <div id="pipCamera" class="hidden absolute bottom-4 right-4 w-48 h-32 bg-[#36393f] rounded-lg overflow-hidden border-2 border-[#5865f2] shadow-xl">
                    <video id="pipCameraVideo" class="w-full h-full object-cover" autoplay playsinline muted></video>
                    <div class="absolute bottom-1 left-1 bg-black/80 rounded px-2 py-1">
                        <span class="text-white text-xs font-medium">You</span>
                    </div>
                </div>
            </div>
            
            <!-- Participants Strip (Discord style bottom strip) -->
            <div class="bg-[#36393f] border-t border-[#202225] p-3">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[#b9bbbe] text-xs font-medium">Participants</span>
                    <button onclick="stopScreenShare()" class="bg-[#ed4245] hover:bg-[#da373c] px-3 py-1 rounded text-white text-xs transition-colors">
                        <i class="fas fa-stop mr-1"></i>Stop Sharing
                    </button>
                </div>
                <div id="screenShareParticipants" class="flex space-x-3 overflow-x-auto">
                    <!-- Participants during screen share will be added here -->
                </div>
            </div>
        </div>
    </div>

    <!-- Discord-style Voice Controls -->
    <div class="voice-controls bg-[#36393f] border-t border-[#202225] p-4">
        <div class="flex items-center justify-center space-x-4">
            <!-- Primary Controls -->
            <button id="micBtn" class="voice-control-btn mic-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#ed4245] text-white transition-all duration-150 flex items-center justify-center group">
                <i class="fas fa-microphone text-sm"></i>
                <div class="voice-tooltip">Mute</div>
            </button>

            <button id="deafenBtn" class="voice-control-btn deafen-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#ed4245] text-white transition-all duration-150 flex items-center justify-center group">
                <i class="fas fa-headphones text-sm"></i>
                <div class="voice-tooltip">Deafen</div>
            </button>

            <button id="videoBtn" class="voice-control-btn video-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#3ba55c] text-white transition-all duration-150 flex items-center justify-center group">
                <i class="fas fa-video-slash text-sm"></i>
                <div class="voice-tooltip">Turn On Camera</div>
            </button>

            <button id="screenBtn" class="voice-control-btn screen-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#5865f2] text-white transition-all duration-150 flex items-center justify-center group">
                <i class="fas fa-desktop text-sm"></i>
                <div class="voice-tooltip">Share Screen</div>
            </button>

            <button id="ticTacToeBtn" class="voice-control-btn tic-tac-toe-btn w-10 h-10 rounded-full bg-[#4f545c] hover:bg-[#8b5cf6] text-white transition-all duration-150 flex items-center justify-center group">
                <i class="fas fa-chess-board text-sm"></i>
                <div class="voice-tooltip">Play Tic Mac Voe</div>
            </button>

            <div class="w-px h-6 bg-[#4f545c]"></div>

            <!-- Disconnect -->
            <button id="disconnectBtn" class="voice-control-btn disconnect-btn w-10 h-10 rounded-full bg-[#ed4245] hover:bg-[#da373c] text-white transition-all duration-150 flex items-center justify-center group">
                <i class="fas fa-phone-slash text-sm"></i>
                <div class="voice-tooltip">Leave</div>
            </button>
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
    background: #1e1f22 !important;
    border-radius: 8px !important;
    overflow: hidden !important;
    border: 2px solid #40444b !important;
    transition: all 0.2s ease !important;
    position: relative !important;
    aspect-ratio: 16/9 !important;
    min-height: 180px !important;
    max-height: 400px !important;
    width: 100% !important;
    height: 100% !important;
    box-sizing: border-box !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.video-participant-card:hover {
    border-color: #5865f2 !important;
    transform: scale(1.02) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

.video-participant-card video {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    background: #000 !important;
    display: block !important;
}

.video-participant-overlay {
    position: absolute !important;
    bottom: 8px !important;
    left: 8px !important;
    background: rgba(0, 0, 0, 0.8) !important;
    color: white !important;
    padding: 4px 8px !important;
    border-radius: 4px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    backdrop-filter: blur(4px) !important;
}

/* Voice Participants Grid */
#participantGrid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
    gap: 12px !important;
    width: 100% !important;
    height: 100% !important;
    padding: 8px !important;
    box-sizing: border-box !important;
}

#participantGrid[data-count="1"] {
    grid-template-columns: 1fr !important;
}

#participantGrid[data-count="2"] {
    grid-template-columns: 1fr 1fr !important;
}

#participantGrid[data-count="3"] {
    grid-template-columns: 1fr 1fr !important;
    grid-template-rows: 1fr 1fr !important;
}

#participantGrid[data-count="3"] .participant-card:first-child {
    grid-column: 1 / -1 !important;
}

#participantGrid[data-count="4"] {
    grid-template-columns: 1fr 1fr !important;
    grid-template-rows: 1fr 1fr !important;
}

#participantGrid[data-count="5"], #participantGrid[data-count="6"] {
    grid-template-columns: 1fr 1fr 1fr !important;
    grid-template-rows: 1fr 1fr !important;
}

#participantGrid[data-count="7"], #participantGrid[data-count="8"], #participantGrid[data-count="9"] {
    grid-template-columns: 1fr 1fr 1fr !important;
    grid-template-rows: 1fr 1fr 1fr !important;
}

.participant-card {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    background: #2f3136 !important;
    border-radius: 12px !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
    border: 2px solid transparent !important;
    min-height: 150px !important;
    position: relative !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
}

.participant-card:hover {
    background: #32353b !important;
    transform: scale(1.02) !important;
}

.participant-card.speaking {
    border-color: #3ba55c !important;
    box-shadow: 0 0 20px rgba(59, 165, 93, 0.3) !important;
}

.participant-avatar {
    width: 80px !important;
    height: 80px !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: white !important;
    font-weight: 700 !important;
    font-size: 24px !important;
    position: relative !important;
    margin-bottom: 12px !important;
    transition: all 0.3s ease !important;
    border: 3px solid transparent !important;
    box-sizing: border-box !important;
}

.participant-video {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    border-radius: 12px !important;
    background: #000 !important;
}

.participant-overlay {
    position: absolute !important;
    bottom: 8px !important;
    left: 8px !important;
    right: 8px !important;
    background: rgba(0, 0, 0, 0.8) !important;
    color: white !important;
    padding: 6px 10px !important;
    border-radius: 6px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    backdrop-filter: blur(4px) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
}

.participant-avatar.muted::after {
    content: '';
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 20px;
    height: 20px;
    background: #ed4245;
    border-radius: 50%;
    border: 2px solid #1e1f22;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23ffffff' viewBox='0 0 16 16'%3e%3cpath d='M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.188 2.262-.524l-.816-.816A2.99 2.99 0 0 1 8 11a3 3 0 0 1-3-3V6.341l-.912-.912A4.001 4.001 0 0 0 4 8v1a5 5 0 0 0 4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-1.025A5 5 0 0 1 3 9V8a5.001 5.001 0 0 1 .776-2.676L2.636 4.184a.5.5 0 1 1 .708-.708l11 11a.5.5 0 0 1-.708.708L8.5 9.5z'/%3e%3cpath d='M8 6a2 2 0 1 1 4 0v1a2 2 0 0 1-1.188 1.825l-.812-.812V6a1 1 0 0 0-2 0z'/%3e%3c/svg%3e");
    background-size: 10px 10px;
    background-repeat: no-repeat;
    background-position: center;
}

#videoGrid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
    aspect-ratio: unset !important;
    min-height: 200px !important;
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
    #participantGrid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
        gap: 8px !important;
        padding: 4px !important;
    }
    
    #participantGrid[data-count="2"], 
    #participantGrid[data-count="3"], 
    #participantGrid[data-count="4"] {
        grid-template-columns: 1fr 1fr !important;
        grid-template-rows: repeat(auto, 1fr) !important;
    }
    
    #participantGrid[data-count="3"] .participant-card:first-child {
        grid-column: 1 !important;
    }
    
    .participant-card {
        min-height: 120px !important;
    }
    
    .participant-avatar {
        width: 60px !important;
        height: 60px !important;
        font-size: 18px !important;
        margin-bottom: 8px !important;
    }
    
    .voice-controls {
        padding: 12px !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
    }
    
    .voice-control-btn {
        width: 40px !important;
        height: 40px !important;
        flex-shrink: 0 !important;
    }
    
    .voice-control-btn i {
        font-size: 14px !important;
    }
    
    .voice-tooltip {
        display: none !important;
    }
}

/* Discord-style additions */
.voice-control-btn {
    position: relative;
    border: none;
    outline: none;
    cursor: pointer;
}

.voice-control-btn.active {
    background-color: #3ba55c !important;
}

.voice-control-btn.muted {
    background-color: #ed4245 !important;
}

.voice-control-btn.deafened {
    background-color: #ed4245 !important;
}

.voice-control-btn.screen-sharing {
    background-color: #5865f2 !important;
}

/* Tooltips */
.voice-tooltip {
    position: absolute;
    bottom: 120%;
    left: 50%;
    transform: translateX(-50%);
    background: #18191c;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    z-index: 1000;
}

.voice-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #18191c;
}

.voice-control-btn:hover .voice-tooltip {
    opacity: 1;
}

/* Enhanced voice participant styling */
.voice-participant-avatar.speaking {
    border: 4px solid #3ba55c;
    animation: discord-speaking 2s ease-in-out infinite;
}

@keyframes discord-speaking {
    0%, 100% {
        box-shadow: 0 0 0 0 rgba(59, 165, 93, 0.4);
        transform: scale(1);
    }
    50% {
        box-shadow: 0 0 0 10px rgba(59, 165, 93, 0);
        transform: scale(1.05);
    }
}

#videoGrid {
    display: grid !important;
    gap: 8px !important;
    width: 100% !important;
    height: 100% !important;
    min-height: 300px !important;
}

#videoGrid[data-count="1"] {
    grid-template-columns: 1fr !important;
    grid-template-rows: 1fr !important;
}

#videoGrid[data-count="2"] {
    grid-template-columns: 1fr 1fr !important;
    grid-template-rows: 1fr !important;
}

#videoGrid[data-count="3"] {
    grid-template-columns: 1fr 1fr !important;
    grid-template-rows: 1fr 1fr !important;
}

#videoGrid[data-count="3"] .video-participant-card:first-child {
    grid-column: 1 / -1 !important;
}

#videoGrid[data-count="4"] {
    grid-template-columns: 1fr 1fr !important;
    grid-template-rows: 1fr 1fr !important;
}

#videoGrid[data-count="5"], #videoGrid[data-count="6"] {
    grid-template-columns: 1fr 1fr 1fr !important;
    grid-template-rows: 1fr 1fr !important;
}

#videoGrid[data-count="7"], #videoGrid[data-count="8"], #videoGrid[data-count="9"] {
    grid-template-columns: 1fr 1fr 1fr !important;
    grid-template-rows: 1fr 1fr 1fr !important;
}

@media (max-width: 768px) {
    #videoGrid[data-count="2"], #videoGrid[data-count="3"], #videoGrid[data-count="4"] {
        grid-template-columns: 1fr !important;
        grid-template-rows: repeat(auto, 1fr) !important;
    }
    
    #videoGrid[data-count="3"] .video-participant-card:first-child {
        grid-column: 1 !important;
    }
}

/* Participant Cards */
.voice-only-participant {
    display: flex;
    align-items: center;
    background: #2f3136;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 12px;
    color: #b9bbbe;
    border: 1px solid #40444b;
}

.voice-only-participant .avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin-right: 8px;
    background: #5865f2;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 10px;
}

.screen-share-participant {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 80px;
}

.screen-share-participant .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #5865f2;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    margin-bottom: 4px;
    border: 2px solid transparent;
}

.screen-share-participant .avatar.speaking {
    border-color: #3ba55c;
    animation: discord-speaking 2s ease-in-out infinite;
}

.screen-share-participant .name {
    font-size: 11px;
    color: #b9bbbe;
    text-align: center;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Animations */
.view-transition {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Bot Participant Styles */
.voice-participant-avatar.bot-participant {
    background: #5865f2 !important;
    border: 3px solid #7289da !important;
    box-shadow: 0 0 10px rgba(88, 101, 242, 0.3) !important;
    animation: bot-glow 3s ease-in-out infinite !important;
}

@keyframes bot-glow {
    0%, 100% {
        box-shadow: 0 0 10px rgba(88, 101, 242, 0.3);
    }
    50% {
        box-shadow: 0 0 20px rgba(88, 101, 242, 0.6);
    }
}

.voice-participant-card:has(.bot-participant) {
    background: linear-gradient(135deg, #2f3136 0%, #36393f 100%) !important;
    border: 2px solid rgba(88, 101, 242, 0.3) !important;
}

.voice-participant-card:has(.bot-participant):hover {
    background: linear-gradient(135deg, #36393f 0%, #3c3f47 100%) !important;
    border: 2px solid rgba(88, 101, 242, 0.5) !important;
    transform: translateY(-3px) !important;
}
</style>

<script>
class VoiceCallManager {
    constructor() {
        this.participants = new Map();
        this.isConnected = false;
        this.isMuted = false;
        this.isDeafened = false;
        this.isVideoOn = false;
        this.isScreenSharing = false;
        this.localParticipantId = null;
        this.screenShareParticipantId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupControls();
    }

    setupEventListeners() {
        window.addEventListener('videosdkStreamEnabled', (event) => {
            const { kind, stream, participant } = event.detail;
            
            if (kind === 'video') {
                this.handleCameraStream(participant, stream);
            } else if (kind === 'share') {
                this.handleScreenShare(participant, stream);
            }
        });

        window.addEventListener('videosdkStreamDisabled', (event) => {
            const { kind, participant } = event.detail;
            
            if (kind === 'video') {
                this.handleCameraDisabled(participant);
            } else if (kind === 'share') {
                this.handleScreenShareStopped();
            }
        });

        window.addEventListener('voiceStateChanged', (event) => {
            const { type, state } = event.detail;
            
            if (type === 'mic') {
                this.isMuted = !state;
                this.updateButtonStates();
            } else if (type === 'video') {
                this.isVideoOn = state;
                this.updateButtonStates();
            } else if (type === 'screenShare') {
                this.isScreenSharing = state;
                this.updateButtonStates();
            } else if (type === 'deafen') {
                this.isDeafened = state;
                this.updateButtonStates();
            }
        });

        window.addEventListener('videosdkParticipantJoined', (event) => {
            const { participant, participantObj } = event.detail;
            this.addRemoteParticipant(participant, participantObj);
        });

        window.addEventListener('videosdkParticipantLeft', (event) => {
            const { participant } = event.detail;
            this.removeRemoteParticipant(participant);
        });

        window.addEventListener('voiceConnect', (event) => {
            this.isConnected = true;
            
            if (window.videoSDKManager?.meeting?.localParticipant) {
                this.localParticipantId = window.videoSDKManager.meeting.localParticipant.id;
                
                if (!this.participants.has(this.localParticipantId)) {
                    const localParticipant = window.videoSDKManager.meeting.localParticipant;
                    const localName = localParticipant.displayName || localParticipant.name || document.querySelector('meta[name="username"]')?.content || 'You';
                    this.addParticipant(this.localParticipantId, localName, true);
                }
            }
            
            if (event.detail?.meetingId) {
                this.displayMeetingId(event.detail.meetingId);
            }
            
            this.updateGrid();
        });

        window.addEventListener('voiceDisconnect', (event) => {
            this.isConnected = false;
            
            const meetingIdDisplay = document.getElementById('meetingIdDisplay');
            if (meetingIdDisplay) {
                meetingIdDisplay.textContent = '-';
                meetingIdDisplay.onclick = null;
                meetingIdDisplay.style.cursor = 'default';
                meetingIdDisplay.title = '';
            }
            
            this.cleanup();
        });

        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            const io = window.globalSocketManager.io;
            
            io.on('bot-voice-participant-joined', (data) => {
                const { participant } = data;
                if (participant && participant.username) {
                    this.addBotParticipant(participant);
                }
            });

            io.on('bot-voice-participant-left', (data) => {
                const { participant } = data;
                if (participant && participant.user_id) {
                    this.removeBotParticipant(participant.user_id);
                }
            });
        }
    }

    setupControls() {
        document.getElementById('micBtn').addEventListener('click', () => this.toggleMic());
        document.getElementById('deafenBtn').addEventListener('click', () => this.toggleDeafen());
        document.getElementById('videoBtn').addEventListener('click', () => this.toggleVideo());
        document.getElementById('screenBtn').addEventListener('click', () => this.toggleScreenShare());
        document.getElementById('ticTacToeBtn').addEventListener('click', () => this.openTicTacToe());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
    }

    addRemoteParticipant(participantId, participantObj) {
        console.log(`👤 [DEBUG] Adding remote participant ${participantId} to UI`);
        
        // Check if participant already exists
        if (this.participants.has(participantId)) {
            console.log(`⚠️ [DEBUG] Participant ${participantId} already exists, skipping duplicate`);
            return;
        }
        
        // Extract name from participant object if available
        let participantName = `User ${participantId.slice(-4)}`;
        if (participantObj && participantObj.displayName) {
            participantName = participantObj.displayName;
        } else if (participantObj && participantObj.name) {
            participantName = participantObj.name;
        }
        
        // Add to participants map
        this.addParticipant(participantId, participantName, false);
        
        console.log(`✅ [DEBUG] Remote participant ${participantId} (${participantName}) added to UI`);
    }

    removeRemoteParticipant(participantId) {
        console.log(`👋 [DEBUG] Removing remote participant ${participantId} from UI`);
        
        // Remove from participants map
        this.participants.delete(participantId);
        
        // Remove participant element from voice view
        const participantCard = document.querySelector(`[data-participant-id="${participantId}"].voice-participant-card`);
        if (participantCard) {
            participantCard.remove();
            console.log(`🗑️ [DEBUG] Removed voice participant card for ${participantId}`);
        }
        
        // Remove video participant card if exists
        this.removeVideoParticipantCard(participantId);
        
        this.updateParticipantCount();
        console.log(`✅ [DEBUG] Remote participant ${participantId} removed from UI`);
    }

    ensureParticipantInUI(participantId) {
        if (!this.participants.has(participantId) && participantId !== this.localParticipantId) {
            console.log(`⚠️ [DEBUG] Participant ${participantId} not in UI, adding them now`);
            
            // Try to get participant object from VideoSDK
            let participantObj = null;
            if (window.videoSDKManager?.meeting?.participants) {
                participantObj = window.videoSDKManager.meeting.participants.get(participantId);
            }
            
            this.addRemoteParticipant(participantId, participantObj);
        }
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
        if (!container) {
            console.error('🔊 [ERROR] voiceParticipantsGrid container not found');
            return;
        }

        console.log(`🔊 [DEBUG] Creating voice participant element for: ${participant.name}`);

        // Force grid display styles on container
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';
        container.style.gap = '16px';
        container.style.width = '100%';
        container.style.maxWidth = '800px';
        container.style.margin = '0 auto';

        const element = document.createElement('div');
        element.className = 'voice-participant-card';
        element.dataset.participantId = participant.id;

        // Force participant card styles
        element.style.display = 'flex';
        element.style.flexDirection = 'column';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.padding = '16px';
        element.style.background = '#2f3136';
        element.style.borderRadius = '8px';
        element.style.minHeight = '120px';
        element.style.border = '2px solid transparent';
        element.style.cursor = 'pointer';
        element.style.transition = 'all 0.2s ease';

        const avatarColor = participant.isBot ? '#5865f2' : this.getAvatarColor(participant.name);
        const initial = participant.name.charAt(0).toUpperCase();
        const botIndicator = participant.isBot ? '<i class="fas fa-robot text-xs text-[#5865f2] ml-1"></i>' : '';

        element.innerHTML = `
            <div class="voice-participant-avatar ${participant.isBot ? 'bot-participant' : ''}" style="background: ${avatarColor}; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 20px; margin-bottom: 8px; border: 3px solid ${participant.isBot ? '#5865f2' : 'transparent'};">
                ${participant.isBot ? '<i class="fas fa-robot text-white"></i>' : initial}
            </div>
            <span style="color: white; font-size: 12px; text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; justify-content: center;">${participant.name}${botIndicator}</span>
        `;

        container.appendChild(element);
        
        console.log(`🔊 [DEBUG] Voice participant element created for: ${participant.name}`);
        
        // Log container styles after adding element
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(container);
            console.log(`🔊 [DEBUG] Voice grid styles after adding ${participant.name}:`, {
                display: computedStyle.display,
                gridTemplateColumns: computedStyle.gridTemplateColumns,
                gap: computedStyle.gap,
                childCount: container.children.length
            });
        }, 100);
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
            isLocalParticipant: participantId === this.localParticipantId,
            participantInMap: this.participants.has(participantId),
            totalParticipants: this.participants.size
        });
        
        if (participantId === this.localParticipantId) {
            // Handle local participant camera
            console.log(`🎥 [DEBUG] Handling local participant camera stream`);
            
            this.isVideoOn = true;
            
            // Update participant data
            const localParticipant = this.participants.get(participantId);
            if (localParticipant) {
                localParticipant.hasVideo = true;
            }
            
            // Create video card for local participant
            this.createVideoParticipantCard(participantId, stream);
            
            console.log('✅ [DEBUG] Local camera stream handled - SUCCESS');
            
        } else {
            console.log(`🎥 [DEBUG] Remote participant detected - ${participantId}!`);
            console.log(`🎥 [DEBUG] About to create video participant card...`);
            console.log(`🎥 [DEBUG] Current participants in Map:`, Array.from(this.participants.keys()));
            
            // Ensure participant is in the UI before handling their stream
            this.ensureParticipantInUI(participantId);
            
            this.createVideoParticipantCard(participantId, stream);
        }
        
        console.log(`🎥 [DEBUG] Calling updateView()...`);
        this.updateView();
    }

    handleCameraDisabled(participantId) {
        console.log(`🎥❌ Handling camera disabled for ${participantId}`);
        
        // Update participant data
        const participant = this.participants.get(participantId);
        if (participant) {
            participant.hasVideo = false;
        }
        
        if (participantId === this.localParticipantId) {
            this.isVideoOn = false;
            console.log('✅ Local camera disabled');
        }
        
        // Remove video card
        this.removeVideoParticipantCard(participantId);
        
        this.updateView();
    }

    handleScreenShare(participantId, stream) {
        console.log(`🖥️ Handling screen share for ${participantId}`, stream);
        
        const video = document.getElementById('screenShareVideo');
        const username = document.getElementById('screenShareUsername');
        
        if (video && stream) {
            this.attachStreamToVideo(video, stream);
            
            const participant = this.participants.get(participantId);
            const displayName = participantId === this.localParticipantId ? 'Your Screen' : 
                              (participant ? `${participant.name}'s Screen` : `${participantId}'s Screen`);
            
            if (username) username.textContent = displayName;
            
            if (participantId === this.localParticipantId) {
                this.isScreenSharing = true;
            }
            
            console.log('✅ Screen share stream attached');
        }
        
        this.updateView();
    }

    handleScreenShareStopped() {
        console.log(`🖥️❌ Handling screen share stopped`);
        
        const video = document.getElementById('screenShareVideo');
        const pipCamera = document.getElementById('pipCamera');
        
        if (video && video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
        
        // Hide picture-in-picture camera
        if (pipCamera) {
            pipCamera.classList.add('hidden');
        }
        
        this.isScreenSharing = false;
        
        console.log('✅ Screen share stopped');
        this.updateView();
    }

    createVideoParticipantCard(participantId, stream) {
        const container = document.getElementById('videoGrid');
        if (!container) {
            return;
        }

        let existingCard = document.querySelector(`[data-participant-id="${participantId}"].video-participant-card`);
        if (existingCard) {
            const video = existingCard.querySelector('video');
            if (video && stream) {
                this.attachStreamToVideo(video, stream);
            }
            return;
        }

        let participant = this.participants.get(participantId);
        if (!participant) {
            participant = {
                id: participantId,
                name: `User ${participantId.slice(-4)}`,
                hasVideo: false,
                isMuted: false,
                isSpeaking: false
            };
            this.participants.set(participantId, participant);
        }

        const card = document.createElement('div');
        card.className = 'video-participant-card';
        card.dataset.participantId = participantId;
        card.style.width = '100%';
        card.style.height = '100%';
        card.style.minHeight = '180px';
        card.style.maxHeight = '400px';

        card.innerHTML = `
            <video autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover; background: #000;" data-participant-id="${participantId}"></video>
            <div class="video-participant-overlay">
                <span>${participant.name}</span>
                ${participant.isMuted ? '<i class="fas fa-microphone-slash ml-2"></i>' : ''}
            </div>
        `;

        const video = card.querySelector('video');
        if (video && stream) {
            this.attachStreamToVideo(video, stream);
        }

        container.appendChild(card);
        participant.hasVideo = true;
        
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
        const voiceOnlyView = document.getElementById('voiceOnlyView');
        const videoGridView = document.getElementById('videoGridView');
        const screenShareView = document.getElementById('screenShareView');

        console.log(`🔄 [DEBUG] updateView() called with state:`, {
            isVideoOn: this.isVideoOn,
            isScreenSharing: this.isScreenSharing,
            hasOtherVideo: this.hasOtherVideo(),
            currentView: this.currentView,
            elementsFound: {
                voiceOnlyView: !!voiceOnlyView,
                videoGridView: !!videoGridView,
                screenShareView: !!screenShareView
            }
        });

        // Hide all views first
        voiceOnlyView?.classList.add('hidden');
        videoGridView?.classList.add('hidden');
        screenShareView?.classList.add('hidden');

        if (this.isScreenSharing) {
            // Screen Share View (Highest Priority)
            this.currentView = 'screen-share';
            screenShareView?.classList.remove('hidden');
            this.updateScreenShareParticipants();
            console.log('📺 [DEBUG] Showing screen share view');
            
            // Handle PiP camera if same user has both camera and screen share
            if (this.isVideoOn) {
                this.showPictureInPicture();
            }
            
        } else if (this.isVideoOn || this.hasOtherVideo()) {
            // Video Grid View
            this.currentView = 'video';
            videoGridView?.classList.remove('hidden');
            this.updateVideoGrid();
            this.updateVideoParticipantCount();
            console.log('🎥 [DEBUG] Showing video grid view');
            
        } else {
            // Voice Only View (Default)
            this.currentView = 'voice-only';
            voiceOnlyView?.classList.remove('hidden');
            console.log('🎤 [DEBUG] Showing voice-only view');
        }

        // Update button states
        this.updateButtonStates();
        this.updateParticipantCount();

        // Final state check
        setTimeout(() => {
            console.log(`🔄 [DEBUG] Final view state:`, {
                currentView: this.currentView,
                voiceOnlyVisible: voiceOnlyView && !voiceOnlyView.classList.contains('hidden'),
                videoGridVisible: videoGridView && !videoGridView.classList.contains('hidden'),
                screenShareVisible: screenShareView && !screenShareView.classList.contains('hidden')
            });
        }, 100);
    }

    async toggleMic() {
        if (!window.videoSDKManager?.isReady()) {
            this.showToast('Voice not connected', 'error');
            return;
        }

        try {
            const newState = window.videoSDKManager.toggleMic();
            this.showToast(newState ? 'Microphone enabled' : 'Microphone muted', 'info');
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
            this.showToast(newState ? 'Audio deafened' : 'Audio undeafened', 'info');
        } catch (error) {
            console.error('Error toggling deafen:', error);
            this.showToast('Failed to toggle deafen', 'error');
        }
    }

    async toggleVideo() {
        if (!window.videoSDKManager?.isReady()) {
            this.showToast('Voice not connected', 'error');
            return;
        }

        if (!this.localParticipantId && window.videoSDKManager?.meeting?.localParticipant) {
            this.localParticipantId = window.videoSDKManager.meeting.localParticipant.id;
        }

        try {
            const newState = await window.videoSDKManager.toggleWebcam();
            this.showToast(newState ? 'Camera enabled' : 'Camera disabled', 'info');
        } catch (error) {
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
            this.showToast(newState ? 'Screen share started' : 'Screen share stopped', 'info');
        } catch (error) {
            console.error('Error toggling screen share:', error);
            this.showToast('Failed to toggle screen share', 'error');
        }
    }



    openTicTacToe() {
        const serverId = document.querySelector('meta[name="server-id"]')?.content;
        const userId = document.querySelector('meta[name="user-id"]')?.content;
        const username = document.querySelector('meta[name="username"]')?.content;
        
        if (!serverId || !userId || !username) {
            this.showToast('Missing required information. Please refresh the page.', 'error');
            return;
        }
        
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            this.showToast('Connection not ready. Please wait and try again.', 'error');
            return;
        }
        
        if (window.TicTacToeModal) {
            window.TicTacToeModal.createTicTacToeModal(serverId, userId, username);
        } else {
            this.loadTicTacToeAndOpen(serverId, userId, username);
        }
    }

    async loadTicTacToeAndOpen(serverId, userId, username) {
        try {
            if (!document.querySelector('script[src*="tic-tac-toe.js"]')) {
                const script = document.createElement('script');
                script.src = '/public/js/components/activity/tic-tac-toe.js?v=' + Date.now();
                script.onload = () => {
                    if (window.TicTacToeModal) {
                        window.TicTacToeModal.createTicTacToeModal(serverId, userId, username);
                    } else {
                        this.showToast('Game not available. Please try again later.', 'error');
                    }
                };
                script.onerror = () => {
                    this.showToast('Failed to load game. Please try again.', 'error');
                };
                document.head.appendChild(script);
            }
        } catch (error) {
            this.showToast('Failed to load game. Please try again.', 'error');
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
        
        if (mainCount) mainCount.textContent = count;
    }

    updateVideoParticipantCount() {
        const videoCount = Array.from(this.participants.values()).filter(p => p.hasVideo).length;
        const countElement = document.getElementById('videoParticipantCount');
        
        if (countElement) {
            const text = videoCount === 1 ? '1 participant with video' : `${videoCount} participants with video`;
            countElement.textContent = text;
        }
    }

    updateVideoGrid() {
        const videoGrid = document.getElementById('videoGrid');
        if (!videoGrid) {
            return;
        }

        const videoParticipants = Array.from(this.participants.values()).filter(p => p.hasVideo);
        const count = videoParticipants.length;
        
        videoGrid.setAttribute('data-count', count.toString());
        
        videoGrid.style.display = 'grid';
        videoGrid.style.gap = '8px';
        videoGrid.style.width = '100%';
        videoGrid.style.height = '100%';
        videoGrid.style.minHeight = '300px';
        
        const voiceOnlyParticipants = Array.from(this.participants.values()).filter(p => !p.hasVideo);
        const voiceOnlyStrip = document.getElementById('voiceOnlyStrip');
        const voiceOnlyContainer = document.getElementById('voiceOnlyParticipants');
        
        if (voiceOnlyParticipants.length > 0 && count > 0) {
            voiceOnlyStrip?.classList.remove('hidden');
            
            if (voiceOnlyContainer) {
                voiceOnlyContainer.innerHTML = '';
                voiceOnlyParticipants.forEach(participant => {
                    const element = this.createVoiceOnlyParticipantElement(participant);
                    voiceOnlyContainer.appendChild(element);
                });
            }
        } else {
            voiceOnlyStrip?.classList.add('hidden');
        }
    }

    updateScreenShareParticipants() {
        const container = document.getElementById('screenShareParticipants');
        if (!container) return;

        container.innerHTML = '';
        
        Array.from(this.participants.values()).forEach(participant => {
            const element = this.createScreenShareParticipantElement(participant);
            container.appendChild(element);
        });
    }

    showPictureInPicture() {
        const pipCamera = document.getElementById('pipCamera');
        const pipVideo = document.getElementById('pipCameraVideo');
        
        if (pipCamera && pipVideo) {
            pipCamera.classList.remove('hidden');
            
            // Copy local video stream to PiP
            const localVideo = document.querySelector('#videoGrid video[data-participant-id="' + this.localParticipantId + '"]');
            if (localVideo && localVideo.srcObject) {
                pipVideo.srcObject = localVideo.srcObject;
            }
        }
    }

    updateButtonStates() {
        // Update mic button
        const micBtn = document.getElementById('micBtn');
        const micIcon = micBtn?.querySelector('i');
        const micTooltip = micBtn?.querySelector('.voice-tooltip');
        
        if (this.isMuted) {
            micBtn?.classList.add('muted');
            micIcon?.classList.replace('fa-microphone', 'fa-microphone-slash');
            if (micTooltip) micTooltip.textContent = 'Unmute';
        } else {
            micBtn?.classList.remove('muted');
            micIcon?.classList.replace('fa-microphone-slash', 'fa-microphone');
            if (micTooltip) micTooltip.textContent = 'Mute';
        }

        // Update deafen button
        const deafenBtn = document.getElementById('deafenBtn');
        const deafenIcon = deafenBtn?.querySelector('i');
        const deafenTooltip = deafenBtn?.querySelector('.voice-tooltip');
        
        if (this.isDeafened) {
            deafenBtn?.classList.add('deafened');
            deafenIcon?.classList.replace('fa-headphones', 'fa-volume-mute');
            if (deafenTooltip) deafenTooltip.textContent = 'Undeafen';
        } else {
            deafenBtn?.classList.remove('deafened');
            deafenIcon?.classList.replace('fa-volume-mute', 'fa-headphones');
            if (deafenTooltip) deafenTooltip.textContent = 'Deafen';
        }

        // Update video button
        const videoBtn = document.getElementById('videoBtn');
        const videoIcon = videoBtn?.querySelector('i');
        const videoTooltip = videoBtn?.querySelector('.voice-tooltip');
        
        if (this.isVideoOn) {
            videoBtn?.classList.add('active');
            videoIcon?.classList.replace('fa-video-slash', 'fa-video');
            if (videoTooltip) videoTooltip.textContent = 'Turn Off Camera';
        } else {
            videoBtn?.classList.remove('active');
            videoIcon?.classList.replace('fa-video', 'fa-video-slash');
            if (videoTooltip) videoTooltip.textContent = 'Turn On Camera';
        }

        // Update screen share button
        const screenBtn = document.getElementById('screenBtn');
        const screenIcon = screenBtn?.querySelector('i');
        const screenTooltip = screenBtn?.querySelector('.voice-tooltip');
        
        if (this.isScreenSharing) {
            screenBtn?.classList.add('screen-sharing');
            screenIcon?.classList.replace('fa-desktop', 'fa-stop-circle');
            if (screenTooltip) screenTooltip.textContent = 'Stop Sharing';
        } else {
            screenBtn?.classList.remove('screen-sharing');
            screenIcon?.classList.replace('fa-stop-circle', 'fa-desktop');
            if (screenTooltip) screenTooltip.textContent = 'Share Screen';
        }
    }

    createVoiceOnlyParticipantElement(participant) {
        const element = document.createElement('div');
        element.className = 'voice-only-participant';
        
        const avatarColor = this.getAvatarColor(participant.name);
        const initial = participant.name.charAt(0).toUpperCase();
        
        element.innerHTML = `
            <div class="avatar" style="background: ${avatarColor}">${initial}</div>
            <span>${participant.name}</span>
        `;
        
        return element;
    }

    createScreenShareParticipantElement(participant) {
        const element = document.createElement('div');
        element.className = 'screen-share-participant';
        
        const avatarColor = this.getAvatarColor(participant.name);
        const initial = participant.name.charAt(0).toUpperCase();
        
        element.innerHTML = `
            <div class="avatar ${participant.isSpeaking ? 'speaking' : ''}" style="background: ${avatarColor}">${initial}</div>
            <div class="name">${participant.name}</div>
        `;
        
        return element;
    }

    displayMeetingId(meetingId) {
        const meetingIdDisplay = document.getElementById('meetingIdDisplay');
        if (meetingIdDisplay && meetingId) {
            meetingIdDisplay.textContent = meetingId;
            meetingIdDisplay.title = `Click to copy meeting ID: ${meetingId}`;
            meetingIdDisplay.style.cursor = 'pointer';
            
            // Add click to copy functionality
            meetingIdDisplay.onclick = () => {
                navigator.clipboard.writeText(meetingId).then(() => {
                    this.showToast('Meeting ID copied to clipboard', 'success');
                }).catch(() => {
                    this.showToast('Failed to copy meeting ID', 'error');
                });
            };
        }
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

    addBotParticipant(botParticipant) {
        const botData = {
            id: botParticipant.user_id,
            name: botParticipant.username,
            isLocal: false,
            isMuted: false,
            isDeafened: false,
            isSpeaking: false,
            hasVideo: false,
            isBot: true
        };

        this.participants.set(botParticipant.user_id, botData);
        this.createParticipantElement(botData);
        this.updateParticipantCount();
    }

    removeBotParticipant(botUserId) {
        this.participants.delete(botUserId);
        
        const participantCard = document.querySelector(`[data-participant-id="${botUserId}"].voice-participant-card`);
        if (participantCard) {
            participantCard.remove();
        }
        
        this.updateParticipantCount();
    }

    cleanup() {
        const videos = document.querySelectorAll('#screenShareVideo, #pipCameraVideo, .video-participant-card video');
        videos.forEach(video => {
            if (video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                video.srcObject = null;
            }
        });

        const videoGrid = document.getElementById('videoGrid');
        const voiceParticipantsGrid = document.getElementById('voiceParticipantsGrid');
        const screenShareParticipants = document.getElementById('screenShareParticipants');
        const voiceOnlyParticipants = document.getElementById('voiceOnlyParticipants');

        if (videoGrid) videoGrid.innerHTML = '';
        if (voiceParticipantsGrid) voiceParticipantsGrid.innerHTML = '';
        if (screenShareParticipants) screenShareParticipants.innerHTML = '';
        if (voiceOnlyParticipants) voiceOnlyParticipants.innerHTML = '';

        const pipCamera = document.getElementById('pipCamera');
        if (pipCamera) pipCamera.classList.add('hidden');

        this.participants.clear();
        this.isVideoOn = false;
        this.isScreenSharing = false;
        this.isMuted = false;
        this.isDeafened = false;
        this.currentView = 'voice-only';
        this.localParticipantId = null;
        
        this.updateView();
    }
}

// Global functions for UI interactions
function stopScreenShare() {
    if (window.voiceCallManager) {
        window.voiceCallManager.toggleScreenShare();
    }
}

function toggleVideoLayout() {
    // Toggle between grid and speaker view
    const gridBtn = document.getElementById('gridViewBtn');
    const speakerBtn = document.getElementById('speakerViewBtn');
    
    if (gridBtn?.classList.contains('bg-[#4f545c]')) {
        // Switch to speaker view
        gridBtn.classList.remove('bg-[#4f545c]');
        gridBtn.classList.add('bg-[#36393f]');
        speakerBtn.classList.remove('bg-[#36393f]');
        speakerBtn.classList.add('bg-[#4f545c]');
        
        // Implement speaker view logic here
        window.voiceCallManager?.showToast('Speaker view coming soon', 'info');
    } else {
        // Switch to grid view
        speakerBtn.classList.remove('bg-[#4f545c]');
        speakerBtn.classList.add('bg-[#36393f]');
        gridBtn.classList.remove('bg-[#36393f]');
        gridBtn.classList.add('bg-[#4f545c]');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.voiceCallManager = new VoiceCallManager();
    
    // Set up view toggle buttons
    const gridViewBtn = document.getElementById('gridViewBtn');
    const speakerViewBtn = document.getElementById('speakerViewBtn');
    
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', toggleVideoLayout);
    }
    
    if (speakerViewBtn) {
        speakerViewBtn.addEventListener('click', toggleVideoLayout);
    }
});
</script>
