<?php
$userName = $_SESSION['username'] ?? 'Anonymous';
$activeChannel = $GLOBALS['activeChannel'] ?? null;
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
     const videoGrid = document.getElementById('videoGrid');
     const localAvatarWrapper = document.getElementById('localAvatarWrapper');

     function attachStream(participantId, mediaStream) {
         let videoEl = document.querySelector(`video[data-pid="${participantId}"]`);
         if (!videoEl) {
             videoEl = document.createElement('video');
             videoEl.autoplay = true;
             videoEl.playsInline = true;
             videoEl.muted = participantId === 'local';
             videoEl.dataset.pid = participantId;
             videoEl.className = 'rounded-lg w-[320px] h-[240px] object-cover bg-black';
             videoGrid.appendChild(videoEl);
         }
         videoEl.srcObject = mediaStream;
     }

     function detachStream(participantId) {
         const videoEl = document.querySelector(`video[data-pid="${participantId}"]`);
         if (videoEl) videoEl.remove();
     }

     function handleStreamEnabled(stream, participant) {
         if (stream.kind !== 'video') return;
         attachStream(participant.id === window.videosdkMeeting?.localParticipant.id ? 'local' : participant.id, stream.track);
         if (participant.id === window.videosdkMeeting?.localParticipant.id) {
             localAvatarWrapper.style.display = 'none';
         }
     }

     function handleStreamDisabled(stream, participant) {
         if (stream.kind !== 'video') return;
         detachStream(participant.id === window.videosdkMeeting?.localParticipant.id ? 'local' : participant.id);
         if (participant.id === window.videosdkMeeting?.localParticipant.id) {
             localAvatarWrapper.style.display = 'block';
         }
     }

     window.waitForVideoSDK(() => {
         if (!window.videosdkMeeting) return;

         const meeting = window.videosdkMeeting;
         meeting.on('stream-enabled', (p, stream) => handleStreamEnabled(stream, p));
         meeting.on('stream-disabled', (p, stream) => handleStreamDisabled(stream, p));

         const lp = meeting.localParticipant;
         if (lp && (lp.isWebcamEnabled || lp.streams?.has?.('video'))) {
             const videoTrack = lp.getCameraStream ? lp.getCameraStream() : null;
             if (videoTrack) attachStream('local', videoTrack);
             localAvatarWrapper.style.display = 'none';
         }
     });
 });
</script>

