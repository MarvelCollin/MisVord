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

        <!-- SCREEN SHARE VIEW (No longer used - now using grid-based approach) -->
        <div id="screenShareView" class="hidden">
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

/* Voice Participants Grid - Enhanced with Scrollable */
#participantGrid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
    gap: 12px !important;
    width: 100% !important;
    height: 100% !important;
    padding: 8px !important;
    box-sizing: border-box !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    scrollbar-width: thin !important;
    scrollbar-color: #5865f2 #2f3136 !important;
}

#participantGrid::-webkit-scrollbar {
    width: 8px !important;
}

#participantGrid::-webkit-scrollbar-track {
    background: #2f3136 !important;
    border-radius: 4px !important;
}

#participantGrid::-webkit-scrollbar-thumb {
    background: #5865f2 !important;
    border-radius: 4px !important;
    transition: background 0.3s ease !important;
}

#participantGrid::-webkit-scrollbar-thumb:hover {
    background: #7289da !important;
}

#participantGrid::-webkit-scrollbar-corner {
    background: #2f3136 !important;
}

#participantGrid[data-count="1"] {
    grid-template-columns: 1fr !important;
    justify-items: center !important;
}

#participantGrid[data-count="2"] {
    grid-template-columns: 1fr 1fr !important;
}

#participantGrid[data-count="3"] {
    grid-template-columns: 1fr 1fr 1fr !important;
}

#participantGrid[data-count="4"] {
    grid-template-columns: 1fr 1fr !important;
}

#participantGrid[data-count="5"], 
#participantGrid[data-count="6"] {
    grid-template-columns: 1fr 1fr 1fr !important;
}

#participantGrid[data-count="7"], 
#participantGrid[data-count="8"], 
#participantGrid[data-count="9"] {
    grid-template-columns: 1fr 1fr 1fr !important;
}

#participantGrid[data-count="10"],
#participantGrid[data-count="11"],
#participantGrid[data-count="12"] {
    grid-template-columns: 1fr 1fr 1fr 1fr !important;
}

#unifiedGridView {
    position: relative !important;
    overflow: hidden !important;
}

.scroll-indicator {
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(88, 101, 242, 0.8);
    color: white;
    padding: 8px;
    border-radius: 20px;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 100;
}

.scroll-indicator.visible {
    opacity: 1;
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
        padding: 8px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        max-height: calc(100vh - 200px) !important;
    }
    
    #participantGrid::-webkit-scrollbar {
        width: 6px !important;
    }
    
    #participantGrid[data-count="1"] {
        grid-template-columns: 1fr !important;
        justify-items: center !important;
    }
    
    #participantGrid[data-count="2"] {
        grid-template-columns: 1fr 1fr !important;
    }
    
    #participantGrid[data-count="3"], 
    #participantGrid[data-count="4"],
    #participantGrid[data-count="5"],
    #participantGrid[data-count="6"] {
        grid-template-columns: 1fr 1fr !important;
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
    
    .scroll-indicator {
        right: 5px !important;
        padding: 6px !important;
        font-size: 10px !important;
    }
    
    .fullscreen-participant {
        min-width: 95vw !important;
        min-height: 70vh !important;
        max-width: 95vw !important;
        max-height: 85vh !important;
        width: 95vw !important;
        height: 80vh !important;
    }
    
    .fullscreen-participant .voice-participant-avatar {
        width: 150px !important;
        height: 150px !important;
        font-size: 60px !important;
        margin-bottom: 20px !important;
    }
    
    .fullscreen-participant .voice-participant-card span {
        font-size: 18px !important;
    }
    
    .minimize-btn {
        width: 35px !important;
        height: 35px !important;
        top: 10px !important;
        right: 10px !important;
        font-size: 14px !important;
    }
    
    .fullscreen-participant-info {
        bottom: 10px !important;
        left: 10px !important;
        padding: 6px 12px !important;
        font-size: 14px !important;
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

/* Local Participant Styles */
.voice-participant-avatar.local-participant {
    background: #3ba55c !important;
    border: 3px solid #43b05c !important;
    box-shadow: 0 0 10px rgba(59, 165, 92, 0.3) !important;
    animation: local-glow 2s ease-in-out infinite !important;
}

@keyframes local-glow {
    0%, 100% {
        box-shadow: 0 0 10px rgba(59, 165, 92, 0.3);
    }
    50% {
        box-shadow: 0 0 20px rgba(59, 165, 92, 0.6);
    }
}

.voice-participant-card:has(.local-participant) {
    background: linear-gradient(135deg, #2f3136 0%, #36393f 100%) !important;
    border: 2px solid rgba(59, 165, 92, 0.3) !important;
}

.voice-participant-card:has(.local-participant):hover {
    background: linear-gradient(135deg, #36393f 0%, #3c3f47 100%) !important;
    border: 2px solid rgba(59, 165, 92, 0.5) !important;
    transform: translateY(-2px) !important;
}

.screen-share-card {
    border: 2px solid #5865f2 !important;
    box-shadow: 0 0 10px rgba(88, 101, 242, 0.3) !important;
}

.screen-share-card:hover {
    border-color: #7289da !important;
    box-shadow: 0 0 15px rgba(88, 101, 242, 0.5) !important;
}

.screen-share-card video {
    object-fit: contain !important;
}

.screen-share-card .video-participant-overlay {
    background: rgba(88, 101, 242, 0.9) !important;
}

.fullscreen-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(0, 0, 0, 0.95) !important;
    z-index: 1000 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    backdrop-filter: blur(5px) !important;
    animation: fullscreenFadeIn 0.3s ease-out !important;
}

.fullscreen-participant {
    max-width: 90vw !important;
    max-height: 90vh !important;
    min-width: 400px !important;
    min-height: 300px !important;
    width: 800px !important;
    height: 600px !important;
    border-radius: 12px !important;
    overflow: hidden !important;
    border: 3px solid #5865f2 !important;
    box-shadow: 0 0 30px rgba(88, 101, 242, 0.5) !important;
    position: relative !important;
    background: #1e1f22 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.fullscreen-participant video {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
}

.fullscreen-participant .voice-participant-card {
    width: 100% !important;
    height: 100% !important;
    background: transparent !important;
    border: none !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
}

.fullscreen-participant .voice-participant-avatar {
    width: 200px !important;
    height: 200px !important;
    font-size: 80px !important;
    margin-bottom: 30px !important;
}

.fullscreen-participant .voice-participant-card span {
    font-size: 24px !important;
    font-weight: 600 !important;
}

.minimize-btn {
    position: absolute !important;
    top: 15px !important;
    right: 15px !important;
    width: 40px !important;
    height: 40px !important;
    background: rgba(0, 0, 0, 0.8) !important;
    border: 2px solid #5865f2 !important;
    border-radius: 50% !important;
    color: white !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    font-size: 16px !important;
    z-index: 10 !important;
}

.minimize-btn:hover {
    background: rgba(88, 101, 242, 0.8) !important;
    transform: scale(1.1) !important;
    box-shadow: 0 0 15px rgba(88, 101, 242, 0.6) !important;
}

.fullscreen-participant-info {
    position: absolute !important;
    bottom: 15px !important;
    left: 15px !important;
    background: rgba(0, 0, 0, 0.8) !important;
    color: white !important;
    padding: 8px 16px !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    backdrop-filter: blur(4px) !important;
    border: 1px solid rgba(88, 101, 242, 0.3) !important;
}

@keyframes fullscreenFadeIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>

<script>
class UnifiedParticipantManager {
    constructor() {
        this.participants = new Map();
        this.eventQueue = [];
        this.processing = false;
        this.participantSources = new Map();
    }

    async processEvent(event) {
        this.eventQueue.push(event);
        if (!this.processing) {
            this.processing = true;
            await this.processQueuedEvents();
            this.processing = false;
        }
    }

    async processQueuedEvents() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            await this.handleSingleEvent(event);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    async handleSingleEvent(event) {
        try {
            switch (event.type) {
                case 'participant_joined':
                    await this.handleParticipantJoined(event.data);
                    break;
                case 'participant_left':
                    await this.handleParticipantLeft(event.data);
                    break;
                case 'bot_joined':
                    await this.handleBotJoined(event.data);
                    break;
                case 'bot_left':
                    await this.handleBotLeft(event.data);
                    break;
            }
        } catch (error) {
            console.error('Error processing event:', error);
        }
    }

    async handleParticipantJoined(data) {
        const participantId = data.participantId || data.participant;
        const source = data.source || 'videosdk';
        
        if (this.participants.has(participantId)) {
            const existingSource = this.participantSources.get(participantId);
            console.log(`⚠️ [PARTICIPANT-MANAGER] Participant ${participantId} already exists from source: ${existingSource}, ignoring duplicate from: ${source}`);
            return;
        }

        const isLocal = source === 'local' || (window.voiceCallManager?.localParticipantId === participantId);
        const participantName = data.participantObj?.displayName || data.participantObj?.name || data.name || `User ${participantId.slice(-4)}`;
        
        const participant = {
            id: participantId,
            name: isLocal ? `${participantName} (You)` : participantName,
            hasVideo: false,
            hasScreenShare: false,
            isMuted: false,
            isSpeaking: false,
            isBot: false,
            isLocal: isLocal,
            source: source
        };

        this.participants.set(participantId, participant);
        this.participantSources.set(participantId, source);
        
        console.log(`✅ [PARTICIPANT-MANAGER] Added participant: ${participant.name} (${participantId}) from source: ${source}`);
        
        if (window.voiceCallManager) {
            window.voiceCallManager.createParticipantElement(participant);
            window.voiceCallManager.updateParticipantCount();
        }
        
        if (!isLocal && window.MusicLoaderStatic?.playJoinVoiceSound) {
            window.MusicLoaderStatic.playJoinVoiceSound();
        }
    }

    async handleParticipantLeft(data) {
        const participantId = data.participantId || data.participant;
        
        if (!this.participants.has(participantId)) {
            console.log(`⚠️ [PARTICIPANT-MANAGER] Participant ${participantId} not found for removal`);
            return;
        }

        const participant = this.participants.get(participantId);
        this.participants.delete(participantId);
        this.participantSources.delete(participantId);
        
        console.log(`🗑️ [PARTICIPANT-MANAGER] Removed participant: ${participant.name} (${participantId})`);
        
        if (window.voiceCallManager) {
            window.voiceCallManager.removeParticipantElement(participantId);
            window.voiceCallManager.updateParticipantCount();
        }
        
        const wasLocal = participant.isLocal || participant.source === 'local';
        if (!wasLocal && window.MusicLoaderStatic?.playDisconnectVoiceSound) {
            window.MusicLoaderStatic.playDisconnectVoiceSound();
        }
    }

    async handleBotJoined(data) {
        const botId = data.participant?.id || data.id;
        const source = 'bot';
        
        if (this.participants.has(botId)) {
            console.log(`⚠️ [PARTICIPANT-MANAGER] Bot ${botId} already exists, ignoring duplicate`);
            return;
        }

        const participant = {
            id: botId,
            name: data.participant?.username || data.username || 'Bot',
            hasVideo: false,
            hasScreenShare: false,
            isMuted: false,
            isSpeaking: false,
            isBot: true,
            source: source
        };

        this.participants.set(botId, participant);
        this.participantSources.set(botId, source);
        
        console.log(`🤖 [PARTICIPANT-MANAGER] Added bot: ${participant.name} (${botId})`);
        
        if (window.voiceCallManager) {
            window.voiceCallManager.createParticipantElement(participant);
            window.voiceCallManager.updateParticipantCount();
        }
    }

    async handleBotLeft(data) {
        const botId = data.participant?.id || data.id;
        
        if (!this.participants.has(botId)) {
            console.log(`⚠️ [PARTICIPANT-MANAGER] Bot ${botId} not found for removal`);
            return;
        }

        const participant = this.participants.get(botId);
        this.participants.delete(botId);
        this.participantSources.delete(botId);
        
        console.log(`🤖🗑️ [PARTICIPANT-MANAGER] Removed bot: ${participant.name} (${botId})`);
        
        if (window.voiceCallManager) {
            window.voiceCallManager.removeParticipantElement(botId);
            window.voiceCallManager.updateParticipantCount();
        }
    }

    getParticipant(participantId) {
        return this.participants.get(participantId);
    }

    getParticipantCount() {
        return this.participants.size;
    }

    clear() {
        this.participants.clear();
        this.participantSources.clear();
        this.eventQueue = [];
    }
}

class VoiceCallManager {
    constructor() {
        this.isConnected = false;
        this.localParticipantId = null;
        this.isMuted = false;
        this.isDeafened = false;
        this.isVideoOn = false;
        this.isScreenSharing = false;
        this.currentView = 'unified';
        this.eventListenersRegistered = false;
        this.fullscreenParticipant = null;
        this.isFullscreenMode = false;
        
        this.participantManager = new UnifiedParticipantManager();
        
        setTimeout(() => {
            this.init();
        }, 100);
    }

    init() {
        this.setupEventListeners();
        this.setupControls();
        this.setupDoubleClickHandlers();
    }

    setupEventListeners() {
        if (this.eventListenersRegistered || window.voiceEventListenersRegistered) {
            console.log('⚠️ [VOICE-CALL-MANAGER] Event listeners already registered, skipping');
            return;
        }
        
        this.eventListenersRegistered = true;
        window.voiceEventListenersRegistered = true;
        
        console.log('🎧 [VOICE-CALL-MANAGER] Setting up event listeners for participant management');

        window.addEventListener('videosdkParticipantJoined', (event) => {
            this.participantManager.processEvent({
                type: 'participant_joined',
                data: {
                    participantId: event.detail.participant,
                    participantObj: event.detail.participantObj,
                    source: 'videosdk'
                }
            });
        });

        window.addEventListener('videosdkParticipantLeft', (event) => {
            this.participantManager.processEvent({
                type: 'participant_left',
                data: {
                    participantId: event.detail.participant,
                    source: 'videosdk'
                }
            });
        });

        window.addEventListener('voiceConnect', (event) => {
            console.log('🔗 [VOICE-CALL-MANAGER] Voice connect event received', event.detail);
            
            this.isConnected = true;
            
            if (window.unifiedVoiceStateManager) {
                window.unifiedVoiceStateManager.setState({
                    isConnected: true,
                    channelId: event.detail?.channelId || null,
                    channelName: event.detail?.channelName || null,
                    meetingId: event.detail?.meetingId || null,
                    connectionTime: Date.now()
                });
            }
            
            if (window.videoSDKManager?.meeting?.localParticipant) {
                this.localParticipantId = window.videoSDKManager.meeting.localParticipant.id;
                console.log('👤 [VOICE-CALL-MANAGER] Set local participant ID:', this.localParticipantId);
                
                setTimeout(() => {
                    console.log('👤 [VOICE-CALL-MANAGER] Adding local participant to UI');
                    this.participantManager.processEvent({
                        type: 'participant_joined',
                        data: {
                            participantId: this.localParticipantId,
                            participantObj: window.videoSDKManager.meeting.localParticipant,
                            source: 'local'
                        }
                    });
                }, 500);
            }
            
            if (event.detail?.meetingId) {
                this.displayMeetingId(event.detail.meetingId);
            }
            
            const channelName = event.detail?.channelName || 'Voice Channel';
            this.showToast(`Successfully joined ${channelName}`, 'success');
            
            if (window.MusicLoaderStatic?.playJoinVoiceSound) {
                window.MusicLoaderStatic.playJoinVoiceSound();
            }
            
            this.updateGrid();
        });

        window.addEventListener('voiceDisconnect', (event) => {
            console.log('🔌 [VOICE-CALL-MANAGER] Voice disconnect event received');
            
            this.isConnected = false;
            
            if (window.unifiedVoiceStateManager) {
                window.unifiedVoiceStateManager.setState({
                    isConnected: false,
                    channelId: null,
                    channelName: null,
                    meetingId: null,
                    connectionTime: null
                });
            }
            
            const meetingIdDisplay = document.getElementById('meetingIdDisplay');
            if (meetingIdDisplay) {
                meetingIdDisplay.textContent = '-';
                meetingIdDisplay.onclick = null;
                meetingIdDisplay.style.cursor = 'default';
                meetingIdDisplay.title = '';
            }
            
            if (this.localParticipantId) {
                console.log('🗑️ [VOICE-CALL-MANAGER] Removing local participant on disconnect');
                this.participantManager.processEvent({
                    type: 'participant_left',
                    data: {
                        participantId: this.localParticipantId,
                        source: 'local'
                    }
                });
            }
            
            this.cleanup();
            
            if (window.MusicLoaderStatic?.playDisconnectVoiceSound) {
                window.MusicLoaderStatic.playDisconnectVoiceSound();
            }
        });

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
                this.handleScreenShareStopped(participant);
            }
        });

        window.addEventListener('voiceStateChanged', (event) => {
            const { type, state } = event.detail;
            
            if (type === 'mic') {
                this.isMuted = !state;
                this.updateButtonStates();
                
                if (window.unifiedVoiceStateManager) {
                    window.unifiedVoiceStateManager.setState({ isMuted: this.isMuted });
                }
            } else if (type === 'video') {
                this.isVideoOn = state;
                this.updateButtonStates();
                
                if (window.unifiedVoiceStateManager) {
                    window.unifiedVoiceStateManager.setState({ isVideoOn: this.isVideoOn });
                }
            } else if (type === 'screenShare') {
                this.isScreenSharing = state;
                this.updateButtonStates();
                
                if (window.unifiedVoiceStateManager) {
                    window.unifiedVoiceStateManager.setState({ isScreenSharing: this.isScreenSharing });
                }
            } else if (type === 'deafen') {
                this.isDeafened = state;
                this.updateButtonStates();
                
                if (window.unifiedVoiceStateManager) {
                    window.unifiedVoiceStateManager.setState({ isDeafened: this.isDeafened });
                }
            }
        });

        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            const io = window.globalSocketManager.io;
            
            io.on('bot-voice-participant-joined', (data) => {
                this.participantManager.processEvent({
                    type: 'bot_joined',
                    data: data
                });
            });

            io.on('bot-voice-participant-left', (data) => {
                this.participantManager.processEvent({
                    type: 'bot_left',
                    data: data
                });
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

    setupDoubleClickHandlers() {
        const participantGrid = document.getElementById('participantGrid');
        if (!participantGrid) return;
        
        participantGrid.addEventListener('dblclick', (event) => {
            const card = event.target.closest('[data-participant-id]');
            if (!card) return;
            
            const participantId = card.dataset.participantId;
            this.toggleParticipantFullscreen(participantId);
        });
    }

    toggleParticipantFullscreen(participantId) {
        if (this.fullscreenParticipant === participantId) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen(participantId);
        }
    }

    enterFullscreen(participantId) {
        this.exitFullscreen();
        
        this.fullscreenParticipant = participantId;
        this.isFullscreenMode = true;
        
        const targetCard = document.querySelector(`[data-participant-id="${participantId}"]`);
        if (!targetCard) return;
        
        const participant = this.participantManager.getParticipant(participantId);
        if (!participant) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-overlay';
        overlay.id = 'participantFullscreenOverlay';
        
        const clonedCard = targetCard.cloneNode(true);
        clonedCard.className = 'fullscreen-participant';
        
        const originalVideo = targetCard.querySelector('video');
        const clonedVideo = clonedCard.querySelector('video');
        
        console.log('🔍 [FULLSCREEN] Debug info:', {
            participantId,
            hasOriginalVideo: !!originalVideo,
            hasClonedVideo: !!clonedVideo,
            hasVideoStream: !!(originalVideo?.srcObject),
            originalVideoSrc: originalVideo?.src,
            cardClasses: targetCard.className,
            cardType: targetCard.classList.contains('video-participant-card') ? 'video' : 'voice'
        });
        
        if (originalVideo && clonedVideo && originalVideo.srcObject) {
            console.log('🔍 [FULLSCREEN] Copying video stream to fullscreen');
            clonedVideo.srcObject = originalVideo.srcObject;
            clonedVideo.autoplay = true;
            clonedVideo.playsInline = true;
            clonedVideo.muted = originalVideo.muted;
            
            clonedVideo.play().then(() => {
                console.log('🔍 [FULLSCREEN] Video playing successfully in fullscreen');
            }).catch(error => {
                console.warn('🔍 [FULLSCREEN] Video play failed:', error);
            });
        } else if (originalVideo && !originalVideo.srcObject) {
            console.log('🔍 [FULLSCREEN] Original video has no srcObject, might be voice-only participant');
        } else {
            console.log('🔍 [FULLSCREEN] No video element found, this is likely a voice-only participant');
        }
        
        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'minimize-btn';
        minimizeBtn.innerHTML = '<i class="fas fa-times"></i>';
        minimizeBtn.onclick = () => this.exitFullscreen();
        
        const participantInfo = document.createElement('div');
        participantInfo.className = 'fullscreen-participant-info';
        const isLocal = participantId === this.localParticipantId ? ' (You)' : '';
        participantInfo.textContent = `${participant.name}${isLocal}`;
        
        clonedCard.appendChild(minimizeBtn);
        clonedCard.appendChild(participantInfo);
        overlay.appendChild(clonedCard);
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.exitFullscreen();
            }
        });
        
        document.addEventListener('keydown', this.handleFullscreenKeydown.bind(this));
        
        console.log(`🔍 [FULLSCREEN] Participant ${participantId} entered fullscreen mode`);
    }

    exitFullscreen() {
        if (!this.isFullscreenMode) return;
        
        this.fullscreenParticipant = null;
        this.isFullscreenMode = false;
        
        const overlay = document.getElementById('participantFullscreenOverlay');
        if (overlay) {
            overlay.remove();
        }
        
        document.removeEventListener('keydown', this.handleFullscreenKeydown.bind(this));
        
        console.log(`🔍 [FULLSCREEN] Fullscreen mode exited`);
    }

    handleFullscreenKeydown(event) {
        if (event.key === 'Escape' && this.isFullscreenMode) {
            this.exitFullscreen();
        }
    }



    createParticipantElement(participant) {
        const container = document.getElementById('participantGrid');
        if (!container) {
            console.error('🔊 [ERROR] participantGrid container not found');
            return;
        }

        const existingVideoCard = document.querySelector(`[data-participant-id="${participant.id}"].video-participant-card`);
        if (existingVideoCard) {
            console.log(`⚠️ [VOICE-MANAGER] Video card exists for ${participant.id}, skipping voice card creation`);
            return;
        }

        const existingElement = document.querySelector(`[data-participant-id="${participant.id}"].voice-participant-card`);
        if (existingElement) {
            console.log(`⚠️ [VOICE-MANAGER] Voice card for participant ${participant.id} already exists`);
            return;
        }

        console.log(`🔊 [DEBUG] Creating voice participant element for: ${participant.name}`);

        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';
        container.style.gap = '16px';
        container.style.width = '100%';
        container.style.maxWidth = '800px';
        container.style.margin = '0 auto';

        const element = document.createElement('div');
        element.className = 'voice-participant-card';
        element.dataset.participantId = participant.id;

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

        const avatarColor = participant.isBot ? '#5865f2' : (participant.isLocal ? '#3ba55c' : this.getAvatarColor(participant.name));
        const initial = participant.name.charAt(0).toUpperCase();
        const botIndicator = participant.isBot ? '<i class="fas fa-robot text-xs text-[#5865f2] ml-1"></i>' : '';
        const localIndicator = participant.isLocal ? '<i class="fas fa-user text-xs text-[#3ba55c] ml-1"></i>' : '';
        const borderColor = participant.isBot ? '#5865f2' : (participant.isLocal ? '#3ba55c' : 'transparent');

        element.innerHTML = `
            <div class="voice-participant-avatar ${participant.isBot ? 'bot-participant' : ''} ${participant.isLocal ? 'local-participant' : ''}" style="background: ${avatarColor}; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 20px; margin-bottom: 8px; border: 3px solid ${borderColor};">
                ${participant.isBot ? '<i class="fas fa-robot text-white"></i>' : initial}
            </div>
            <span style="color: white; font-size: 12px; text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; justify-content: center;">${participant.name}${botIndicator}${localIndicator}</span>
        `;

        container.appendChild(element);
        
        if (!participant.isLocal) {
            this.scrollToNewParticipant(element);
        }
        
        this.updateView();
    }

    scrollToNewParticipant(element) {
        const participantGrid = document.getElementById('participantGrid');
        if (!participantGrid || !element) return;
        
        setTimeout(() => {
            const elementRect = element.getBoundingClientRect();
            const containerRect = participantGrid.getBoundingClientRect();
            
            if (elementRect.bottom > containerRect.bottom) {
                element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'end',
                    inline: 'nearest'
                });
            }
        }, 200);
    }

    removeParticipantElement(participantId) {
        const voiceCard = document.querySelector(`[data-participant-id="${participantId}"].voice-participant-card`);
        const videoCard = document.querySelector(`[data-participant-id="${participantId}"].video-participant-card`);
        
        if (voiceCard) voiceCard.remove();
        if (videoCard) videoCard.remove();
        
        if (this.fullscreenParticipant === participantId) {
            this.exitFullscreen();
        }
    }

    updateParticipantCount() {
        const count = this.participantManager.getParticipantCount();
        const countElement = document.getElementById('voiceParticipantCount');
        if (countElement) {
            countElement.textContent = count;
        }
        
        const container = document.getElementById('participantGrid');
        if (container) {
            container.setAttribute('data-count', count);
        }
        
        setTimeout(() => {
            this.setupScrollIndicator();
        }, 100);
    }

    cleanup() {
        console.log('🧹 [VOICE-CALL-MANAGER] Cleaning up participants and UI');
        
        this.participantManager.clear();
        
        const container = document.getElementById('participantGrid');
        if (container) {
            container.innerHTML = '';
        }
        
        this.exitFullscreen();
        
        this.updateParticipantCount();
        
        this.isConnected = false;
        this.localParticipantId = null;
        this.isVideoOn = false;
        this.isScreenSharing = false;
    }

    get participants() {
        return this.participantManager.participants;
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
            participantInMap: this.participantManager.participants.has(participantId),
            totalParticipants: this.participantManager.participants.size
        });
        
        if (participantId === this.localParticipantId) {
            console.log(`🎥 [DEBUG] Handling local participant camera stream`);
            this.isVideoOn = true;
        }
        
        const participant = this.participantManager.getParticipant(participantId);
        if (participant) {
            participant.hasVideo = true;
        }
        
        this.createVideoParticipantCard(participantId, stream);
        this.updateParticipantCards(participantId);
        
        console.log('✅ [DEBUG] Camera stream handled - SUCCESS');
        this.updateView();
    }

    handleCameraDisabled(participantId) {
        console.log(`🎥❌ Handling camera disabled for ${participantId}`);
        
        const participant = this.participantManager.getParticipant(participantId);
        if (participant) {
            participant.hasVideo = false;
        }
        
        if (participantId === this.localParticipantId) {
            this.isVideoOn = false;
            console.log('✅ Local camera disabled');
        }
        
        this.removeVideoParticipantCard(participantId);
        this.updateParticipantCards(participantId);
        
        this.updateView();
    }

    handleScreenShare(participantId, stream) {
        console.log(`🖥️ Handling screen share for ${participantId}`, stream);
        
        const participant = this.participantManager.getParticipant(participantId);
        if (participant) {
            participant.hasScreenShare = true;
        }
        
        if (participantId === this.localParticipantId) {
            this.isScreenSharing = true;
        }
        
        this.createScreenShareParticipantCard(participantId, stream);
        this.updateParticipantCards(participantId);
        
        console.log('✅ Screen share created as participant card');
        this.updateView();
    }

    handleScreenShareStopped(participantId = null) {
        console.log(`🖥️❌ Handling screen share stopped for ${participantId || 'unknown'}`);
        
        const screenCard = document.querySelector(`[data-participant-id="${participantId}"].screen-share-card`);
        if (screenCard) {
            screenCard.remove();
        }
        
        const participant = this.participantManager.getParticipant(participantId);
        if (participant) {
            participant.hasScreenShare = false;
        }
        
        if (participantId === this.localParticipantId || !participantId) {
            this.isScreenSharing = false;
        }
        
        this.updateParticipantCards(participantId);
        
        console.log('✅ Screen share stopped');
        this.updateView();
    }

    createScreenShareParticipantCard(participantId, stream) {
        const container = document.getElementById('participantGrid');
        if (!container) {
            return;
        }

        let existingCard = document.querySelector(`[data-participant-id="${participantId}"].screen-share-card`);
        if (existingCard) {
            const video = existingCard.querySelector('video');
            if (video && stream) {
                this.attachStreamToVideo(video, stream);
            }
            return;
        }

        let participant = this.participantManager.getParticipant(participantId);
        if (!participant) {
            participant = {
                id: participantId,
                name: `User ${participantId.slice(-4)}`,
                hasVideo: false,
                hasScreenShare: false,
                isMuted: false,
                isSpeaking: false
            };
        }

        const card = document.createElement('div');
        card.className = 'screen-share-card video-participant-card';
        card.dataset.participantId = participantId;
        card.style.width = '100%';
        card.style.height = '100%';
        card.style.minHeight = '180px';
        card.style.maxHeight = '400px';
        card.style.border = '2px solid #5865f2';

        const isLocal = participantId === this.localParticipantId;
        const localIndicator = isLocal ? ' (You)' : '';

        card.innerHTML = `
            <video autoplay playsinline ${isLocal ? '' : 'muted'} style="width: 100%; height: 100%; object-fit: contain; background: #000;" data-participant-id="${participantId}"></video>
            <div class="video-participant-overlay">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-desktop text-[#5865f2]"></i>
                    <span>${participant.name}${localIndicator} - Screen</span>
                </div>
                ${participant.isMuted ? '<i class="fas fa-microphone-slash ml-2"></i>' : ''}
            </div>
        `;

        const video = card.querySelector('video');
        if (video && stream) {
            this.attachStreamToVideo(video, stream);
        }

        container.appendChild(card);
        
        if (!participant.isLocal) {
            this.scrollToNewParticipant(card);
        }
        
        this.updateView();
    }

    createVideoParticipantCard(participantId, stream) {
        const container = document.getElementById('participantGrid');
        if (!container) {
            return;
        }

        let existingCard = document.querySelector(`[data-participant-id="${participantId}"].video-participant-card:not(.screen-share-card)`);
        if (existingCard) {
            const video = existingCard.querySelector('video');
            if (video && stream) {
                this.attachStreamToVideo(video, stream);
            }
            return;
        }

        let participant = this.participantManager.getParticipant(participantId);
        if (!participant) {
            participant = {
                id: participantId,
                name: `User ${participantId.slice(-4)}`,
                hasVideo: false,
                hasScreenShare: false,
                isMuted: false,
                isSpeaking: false
            };
        }

        const card = document.createElement('div');
        card.className = 'video-participant-card';
        card.dataset.participantId = participantId;
        card.style.width = '100%';
        card.style.height = '100%';
        card.style.minHeight = '180px';
        card.style.maxHeight = '400px';

        const isLocal = participantId === this.localParticipantId;
        const localIndicator = isLocal ? ' (You)' : '';

        card.innerHTML = `
            <video autoplay playsinline ${isLocal ? '' : 'muted'} style="width: 100%; height: 100%; object-fit: cover; background: #000;" data-participant-id="${participantId}"></video>
            <div class="video-participant-overlay">
                <span>${participant.name}${localIndicator}</span>
                ${participant.isMuted ? '<i class="fas fa-microphone-slash ml-2"></i>' : ''}
            </div>
        `;

        const video = card.querySelector('video');
        if (video && stream) {
            this.attachStreamToVideo(video, stream);
        }

        container.appendChild(card);
        participant.hasVideo = true;
        
        if (!participant.isLocal) {
            this.scrollToNewParticipant(card);
        }
    }

    removeVoiceParticipantCard(participantId) {
        const voiceCard = document.querySelector(`[data-participant-id="${participantId}"].voice-participant-card`);
        if (voiceCard) {
            voiceCard.remove();
        }
        
        if (this.fullscreenParticipant === participantId) {
            this.exitFullscreen();
        }
    }

    removeVideoParticipantCard(participantId) {
        const videoCard = document.querySelector(`[data-participant-id="${participantId}"].video-participant-card:not(.screen-share-card)`);
        
        if (videoCard) {
            videoCard.remove();
        }
        
        if (this.fullscreenParticipant === participantId) {
            this.exitFullscreen();
        }
        
        const participant = this.participantManager.getParticipant(participantId);
        if (participant) {
            participant.hasVideo = false;
        }
    }

    updateParticipantCards(participantId) {
        const participant = this.participantManager.getParticipant(participantId);
        if (!participant) return;
        
        const hasVideo = participant.hasVideo || false;
        const hasScreenShare = participant.hasScreenShare || false;
        const hasVideoCard = !!document.querySelector(`[data-participant-id="${participantId}"].video-participant-card:not(.screen-share-card)`);
        const hasScreenShareCard = !!document.querySelector(`[data-participant-id="${participantId}"].screen-share-card`);
        const hasVoiceCard = !!document.querySelector(`[data-participant-id="${participantId}"].voice-participant-card`);
        
        console.log(`🔄 Updating participant cards for ${participantId}:`, {
            hasVideo, hasScreenShare, hasVideoCard, hasScreenShareCard, hasVoiceCard
        });
        
        if (!hasVideo && !hasScreenShare) {
            if (!hasVoiceCard && (hasVideoCard || hasScreenShareCard)) {
                this.removeVoiceParticipantCard(participantId);
                this.createParticipantElement(participant);
            }
        } else {
            if (hasVoiceCard) {
                this.removeVoiceParticipantCard(participantId);
            }
        }
    }

    getParticipantStreamStates(participantId) {
        const participant = this.participantManager.getParticipant(participantId);
        if (!participant) {
            return { hasVideo: false, hasScreenShare: false };
        }
        
        return {
            hasVideo: participant.hasVideo || false,
            hasScreenShare: participant.hasScreenShare || false
        };
    }

    shouldCreateVoiceCard(participantId) {
        const states = this.getParticipantStreamStates(participantId);
        return !states.hasVideo && !states.hasScreenShare;
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
        const result = Array.from(this.participantManager.participants.values()).some(p => p.hasVideo && p.id !== this.localParticipantId);
        console.log(`🔍 [DEBUG] hasOtherVideo() check:`, {
            participants: Array.from(this.participantManager.participants.values()).map(p => ({
                id: p.id,
                hasVideo: p.hasVideo,
                isLocalParticipant: p.id === this.localParticipantId
            })),
            localParticipantId: this.localParticipantId,
            result: result
        });
        return result;
    }

    updateGrid() {
        const participantGrid = document.getElementById('participantGrid');
        if (!participantGrid) return;

        const participantCount = this.participantManager.getParticipantCount();
        participantGrid.setAttribute('data-count', participantCount.toString());
        
        participantGrid.style.display = 'grid';
        participantGrid.style.gap = '12px';
        participantGrid.style.width = '100%';
        participantGrid.style.height = '100%';
        participantGrid.style.padding = '8px';
        
        this.setupScrollIndicator();
        this.handleGridScrolling();
    }

    setupScrollIndicator() {
        const unifiedGridView = document.getElementById('unifiedGridView');
        const participantGrid = document.getElementById('participantGrid');
        
        if (!unifiedGridView || !participantGrid) return;
        
        let scrollIndicator = unifiedGridView.querySelector('.scroll-indicator');
        if (!scrollIndicator) {
            scrollIndicator = document.createElement('div');
            scrollIndicator.className = 'scroll-indicator';
            scrollIndicator.innerHTML = '<i class="fas fa-chevron-down"></i>';
            unifiedGridView.appendChild(scrollIndicator);
        }
        
        const checkScrollable = () => {
            const isScrollable = participantGrid.scrollHeight > participantGrid.clientHeight;
            const participantCount = this.participantManager.getParticipantCount();
            
            if (isScrollable && participantCount > 6) {
                scrollIndicator.classList.add('visible');
                scrollIndicator.textContent = `${participantCount} participants`;
            } else {
                scrollIndicator.classList.remove('visible');
            }
        };
        
        setTimeout(checkScrollable, 100);
        
        participantGrid.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = participantGrid;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
            
            if (isAtBottom) {
                scrollIndicator.classList.remove('visible');
            } else {
                const participantCount = this.participantManager.getParticipantCount();
                if (participantCount > 6) {
                    scrollIndicator.classList.add('visible');
                }
            }
        });
    }

    handleGridScrolling() {
        const participantGrid = document.getElementById('participantGrid');
        if (!participantGrid) return;
        
        participantGrid.style.scrollBehavior = 'smooth';
        
        let isScrolling = false;
        participantGrid.addEventListener('scroll', () => {
            if (!isScrolling) {
                isScrolling = true;
                setTimeout(() => {
                    isScrolling = false;
                }, 100);
            }
        });
        
        participantGrid.addEventListener('wheel', (e) => {
            e.stopPropagation();
        });
    }

    updateView() {
        const unifiedGridView = document.getElementById('unifiedGridView');
        const screenShareView = document.getElementById('screenShareView');

        console.log(`🔄 [DEBUG] updateView() called with state:`, {
            isVideoOn: this.isVideoOn,
            isScreenSharing: this.isScreenSharing,
            hasOtherVideo: this.hasOtherVideo(),
            currentView: this.currentView,
            elementsFound: {
                unifiedGridView: !!unifiedGridView,
                screenShareView: !!screenShareView
            }
        });

        this.currentView = 'unified';
        screenShareView?.classList.add('hidden');
        unifiedGridView?.classList.remove('hidden');
        this.updateGrid();
        console.log('🎤 [DEBUG] Showing unified grid view');

        this.updateButtonStates();
        this.updateParticipantCount();
    }

    async toggleMic() {
        if (!window.videoSDKManager?.isReady()) {
            this.showToast('Voice not connected', 'error');
            return;
        }

        try {
            const newState = window.videoSDKManager.toggleMic();
            this.showToast(newState ? 'Microphone enabled' : 'Microphone muted', 'info');
            
            if (window.MusicLoaderStatic) {
                if (newState) {
                    window.MusicLoaderStatic.playDiscordUnmuteSound();
                } else {
                    window.MusicLoaderStatic.playDiscordMuteSound();
                }
            }
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

    addBotParticipant(participant) {
        this.participantManager.processEvent({
            type: 'bot_joined',
            data: { participant: participant }
        });
    }

    removeBotParticipant(participantId) {
        this.participantManager.processEvent({
            type: 'bot_left',
            data: { participant: { id: participantId } }
        });
    }

    disconnect() {
        if (window.voiceManager?.isConnected) {
            window.voiceManager.leaveVoice();
        }
        
        if (window.MusicLoaderStatic?.playDisconnectVoiceSound) {
            window.MusicLoaderStatic.playDisconnectVoiceSound();
        }
        
        this.showToast('Disconnected from voice channel', 'info');
    }

    updateScreenShareParticipants() {
        
    }

    showPictureInPicture() {
        
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

    createScreenShareParticipantElement(participant) {
        
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

const initializeVoiceCallSystem = () => {
    if (window.voiceCallManager) {
        console.log('⚠️ [VOICE-CALL] VoiceCallManager already exists, skipping duplicate creation');
        return;
    }
    
    if (!window.localStorageManager) {
        setTimeout(initializeVoiceCallSystem, 100);
        return;
    }
    
    if (!window.unifiedVoiceStateManager) {
        setTimeout(initializeVoiceCallSystem, 100);
        return;
    }
    
    console.log('🚀 [VOICE-CALL] Creating single VoiceCallManager instance');
    window.voiceCallManager = new VoiceCallManager();
    
    const gridViewBtn = document.getElementById('gridViewBtn');
    const speakerViewBtn = document.getElementById('speakerViewBtn');
    
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', toggleVideoLayout);
    }
    
    if (speakerViewBtn) {
        speakerViewBtn.addEventListener('click', toggleVideoLayout);
    }
    
    if (window.globalSocketManager && window.globalSocketManager.isReady()) {
        console.log('✅ [VOICE-CALL] Socket manager ready, voice call system operational');
    } else {
        console.log('⏳ [VOICE-CALL] Waiting for socket manager...');
        const checkSocket = () => {
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                console.log('✅ [VOICE-CALL] Socket manager ready, voice call system now operational');
            } else {
                setTimeout(checkSocket, 500);
            }
        };
        checkSocket();
    }
};

document.addEventListener('DOMContentLoaded', initializeVoiceCallSystem);
</script>
