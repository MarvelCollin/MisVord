<?php
$userName = $_SESSION['username'] ?? 'Anonymous';
$activeChannel = $GLOBALS['activeChannel'] ?? null;
$currentServer = $GLOBALS['currentServer'] ?? $GLOBALS['server'] ?? null;
?>

<div id="connectedView" class="flex-1 flex flex-col bg-[#2b2d31] hidden">
    <div class="flex-1 flex flex-col justify-center items-center p-8">
        <div class="w-full max-w-4xl">
            <div id="videoGrid" class="flex flex-wrap gap-6 justify-center mb-8"></div>

            <div id="participants" class="flex flex-wrap gap-6 justify-center">
                <div class="voice-participant-card bg-[#2b2d31] rounded-lg p-6 flex flex-col items-center justify-center min-w-[200px] min-h-[240px] border border-[#3e4146] hover:border-[#5865f2] transition-all duration-200 shadow-lg" id="localParticipantCard">
                    <div class="relative mb-4" id="localAvatarWrapper">
                        <div class="w-20 h-20 rounded-full bg-[#5865F2] flex items-center justify-center overflow-hidden border-4 border-[#3ba55c] shadow-lg" id="localAvatar">
                            <span class="text-white text-2xl font-bold"><?php echo substr($userName, 0, 1); ?></span>
                        </div>
                        <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-[#3ba55c] rounded-full border-2 border-[#2b2d31] flex items-center justify-center" id="localMicIndicator">
                            <i class="fas fa-microphone text-white text-xs"></i>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="flex items-center justify-center mb-1">
                            <span class="text-white text-lg font-medium" id="localNameLabel"><?php echo htmlspecialchars($userName); ?></span>
                            <span class="ml-2 text-xs px-2 py-1 bg-[#5865F2] text-white rounded-full font-bold uppercase">You</span>
                        </div>
                        <div class="text-[#3ba55c] text-sm font-medium" id="localStatusLabel">
                            <i class="fas fa-circle text-xs mr-1"></i>
                            Voice Connected
                        </div>
                    </div>
                </div>
                
                <div class="voice-participant-card bg-[#2b2d31] rounded-lg p-6 flex flex-col items-center justify-center min-w-[200px] min-h-[240px] border border-[#3e4146] hover:border-[#5865f2] transition-all duration-200 shadow-lg opacity-50" style="display: none;" id="participant-template">
                    <div class="relative mb-4">
                        <div class="w-20 h-20 rounded-full bg-[#36393f] flex items-center justify-center overflow-hidden border-4 border-[#747f8d] shadow-lg">
                            <span class="text-white text-2xl font-bold">U</span>
                        </div>
                        <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-[#ed4245] rounded-full border-2 border-[#2b2d31] flex items-center justify-center">
                            <i class="fas fa-microphone-slash text-white text-xs"></i>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="text-white text-lg font-medium mb-1">Username</div>
                        <div class="text-[#747f8d] text-sm font-medium">
                            <i class="fas fa-circle text-xs mr-1"></i>
                            Connected
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="emptyParticipants" class="text-center mt-8">
                <div class="text-[#b9bbbe] text-lg mb-2">🎤 You're the only one here</div>
                <p class="text-[#747f8d] text-sm">Invite friends to join your voice channel!</p>
            </div>
        </div>
    </div>
</div>

<div id="voiceControls" class="hidden">
    <?php include __DIR__ . '/voice-tool.php'; ?>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    if (window.voiceConnectedInitialized) {
        return;
    }
    window.voiceConnectedInitialized = true;

    const videoGrid = document.getElementById('videoGrid');
    const localAvatarWrapper = document.getElementById('localAvatarWrapper');
    
    window.addEventListener('voiceConnect', () => {
        initializeView();
    });

    function attachStream(participantId, stream) {
        console.log('Attaching stream for', participantId, stream);
        
        let videoEl = document.querySelector(`video[data-participant-id="${participantId}"]`);
        if (!videoEl) {
            videoEl = document.createElement('video');
            videoEl.dataset.participantId = participantId;
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            videoEl.muted = (participantId === 'local');
            videoEl.className = 'rounded-lg w-[300px] h-[200px] object-cover bg-black border-2 border-gray-600';
            videoGrid.appendChild(videoEl);
            console.log('Created new video element for', participantId);
        }

        let mediaStream;
        if (stream instanceof MediaStream) {
            mediaStream = stream;
        } else if (stream.track) {
            mediaStream = new MediaStream([stream.track]);
        } else if (stream.mediaStream) {
            mediaStream = stream.mediaStream;
        } else if (stream.stream) {
            mediaStream = stream.stream;
        } else {
            console.error('Could not extract MediaStream from:', stream);
            return;
        }

        videoEl.srcObject = mediaStream;
        videoEl.play().catch(e => {
            console.error("Video play failed for " + participantId, e);
            if (e.name === 'NotAllowedError') {
                window.showToast?.('Please allow camera access to enable video', 'error');
            }
        });

        if (participantId === 'local') {
            localAvatarWrapper.style.display = 'none';
        }
        
        console.log('Stream attached successfully for', participantId);
    }

    function detachStream(participantId) {
        console.log('Detaching stream for', participantId);
        const videoEl = document.querySelector(`video[data-participant-id="${participantId}"]`);
        if (videoEl) {
            if (videoEl.srcObject) {
                const tracks = videoEl.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
            videoEl.srcObject = null;
            videoEl.remove();
            console.log('Video element removed for', participantId);
        }
        if (participantId === 'local') {
            localAvatarWrapper.style.display = 'block';
        }
    }

    function setupMeetingEventHandlers(meeting) {
        console.log('Setting up VideoSDK event handlers');
        
        // Handle remote participants' video
        meeting.on('stream-enabled', (participant, stream) => {
            console.log('Stream enabled event:', { participantId: participant.id, stream });
            if (stream.kind === 'video') {
                attachStream(participant.id, stream);
            }
        });

        meeting.on('stream-disabled', (participant, stream) => {
            console.log('Stream disabled event:', { participantId: participant.id, stream });
            if (stream.kind === 'video') {
                detachStream(participant.id);
            }
        });

        meeting.on('participant-left', (participant) => {
            console.log('Participant left:', participant.id);
            detachStream(participant.id);
        });

        // Handle local participant's video
        meeting.localParticipant.on('stream-enabled', (stream) => {
            console.log('Local stream enabled:', stream);
            if (stream.kind === 'video') {
                attachStream('local', stream);
            }
        });

        meeting.localParticipant.on('stream-disabled', (stream) => {
            console.log('Local stream disabled:', stream);
            if (stream.kind === 'video') {
                detachStream('local');
            }
        });

        // Check for existing streams
        if (meeting.localParticipant.streams) {
            console.log('Checking existing streams');
            meeting.localParticipant.streams.forEach((stream, kind) => {
                console.log('Found existing stream:', { kind, stream });
                if (kind === 'video') {
                    attachStream('local', stream);
                }
            });
        }
    }

    function initializeView() {
        if (!window.videosdkMeeting) {
            console.log("Waiting for meeting to initialize...");
            setTimeout(initializeView, 100);
            return;
        }

        console.log('Initializing view with meeting:', window.videosdkMeeting.id);
        setupMeetingEventHandlers(window.videosdkMeeting);

        // Check for existing video state
        if (window.videoSDKManager?.getWebcamState()) {
            console.log('Camera is enabled, checking for stream');
            const localParticipant = window.videosdkMeeting.localParticipant;
            if (localParticipant) {
                const videoStream = localParticipant.streams.get('video');
                if (videoStream) {
                    console.log('Found existing video stream');
                    attachStream('local', videoStream);
                } else {
                    console.log('No existing video stream found');
                }
            }
        }
    }

    window.addEventListener('voiceConnect', () => {
        console.log('Voice connect event received');
        setTimeout(initializeView, 500);
    });

    if (window.videosdkMeeting) {
        console.log('Meeting already exists, initializing view');
        initializeView();
    }
});
</script>


