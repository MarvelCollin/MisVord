document.addEventListener('DOMContentLoaded', () => {
    if (window.videoHandlerInitialized) return;
    window.videoHandlerInitialized = true;

    const videoGrid = document.getElementById('videoGrid');
    const localAvatarWrapper = document.getElementById('localAvatarWrapper');
    
    if (!videoGrid) {
        console.error('Video grid element not found');
        return;
    }
    
    window.addEventListener('voiceConnect', () => {
        initializeView();
    });

    function attachStream(participantId, stream) {
        if (!videoGrid) return;
        
        let videoEl = document.querySelector(`video[data-participant-id="${participantId}"]`);
        if (!videoEl) {
            videoEl = document.createElement('video');
            videoEl.dataset.participantId = participantId;
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            videoEl.muted = (participantId === 'local');
            videoEl.className = 'w-full h-[200px] object-cover bg-black rounded-md';
            videoGrid.appendChild(videoEl);
            videoGrid.classList.remove('hidden');
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
            if (e.name === 'NotAllowedError') {
                window.showToast?.('Please allow camera access to enable video', 'error');
            }
        });

        if (participantId === 'local' && localAvatarWrapper) {
            localAvatarWrapper.style.display = 'none';
        }
    }

    function detachStream(participantId) {
        if (!videoGrid) return;
        
        const videoEl = document.querySelector(`video[data-participant-id="${participantId}"]`);
        if (videoEl) {
            if (videoEl.srcObject) {
                const tracks = videoEl.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
            videoEl.srcObject = null;
            videoEl.remove();
            
            if (!videoGrid.children.length) {
                videoGrid.classList.add('hidden');
            }
        }
        
        if (participantId === 'local' && localAvatarWrapper) {
            localAvatarWrapper.style.display = 'block';
        }
    }

    function setupMeetingEventHandlers(meeting) {
        if (!meeting) return;
        
        meeting.on('stream-enabled', (participant, stream) => {
            if (stream.kind === 'video') {
                attachStream(participant.id, stream);
            }
        });

        meeting.on('stream-disabled', (participant, stream) => {
            if (stream.kind === 'video') {
                detachStream(participant.id);
            }
        });

        meeting.on('participant-left', (participant) => {
            detachStream(participant.id);
        });

        meeting.localParticipant.on('stream-enabled', (stream) => {
            if (stream.kind === 'video') {
                attachStream('local', stream);
            }
        });

        meeting.localParticipant.on('stream-disabled', (stream) => {
            if (stream.kind === 'video') {
                detachStream('local');
            }
        });

        if (meeting.localParticipant.streams) {
            meeting.localParticipant.streams.forEach((stream, kind) => {
                if (kind === 'video') {
                    attachStream('local', stream);
                }
            });
        }
    }

    function initializeView() {
        if (!window.videosdkMeeting) {
            setTimeout(initializeView, 100);
            return;
        }

        setupMeetingEventHandlers(window.videosdkMeeting);

        if (window.videoSDKManager?.getWebcamState()) {
            const localParticipant = window.videosdkMeeting.localParticipant;
            if (localParticipant) {
                const videoStream = localParticipant.streams.get('video');
                if (videoStream) {
                    attachStream('local', videoStream);
                }
            }
        }
    }

    window.addEventListener('voiceConnect', () => {
        setTimeout(initializeView, 500);
    });

    if (window.videosdkMeeting) {
        initializeView();
    }
}); 