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

    function createAvatarElement(participantId, username, imageSrc) {
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'avatar-container relative rounded-md overflow-hidden bg-gray-800 w-full h-[200px] flex items-center justify-center';
        avatarContainer.dataset.participantId = participantId;
        
        // Create the avatar image or default avatar
        const avatar = document.createElement('div');
        avatar.className = 'flex flex-col items-center justify-center w-full h-full';
        
        const imageElement = document.createElement('img');
        imageElement.className = 'w-24 h-24 rounded-full object-cover border-2 border-indigo-500';
        imageElement.src = imageSrc || '/public/assets/common/default-profile-picture.png';
        imageElement.alt = username || 'User';
        imageElement.onerror = () => {
            imageElement.src = '/public/assets/common/default-profile-picture.png';
        };
        
        const usernameElement = document.createElement('div');
        usernameElement.className = 'text-white text-lg mt-3 font-medium';
        usernameElement.textContent = username || (participantId === 'local' ? 'You' : 'User');
        
        const micStatus = document.createElement('div');
        micStatus.className = 'absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900/80 px-3 py-1 rounded-full flex items-center';
        
        const micIcon = document.createElement('i');
        micIcon.className = 'fas fa-microphone text-green-400 mr-2';
        
        micStatus.appendChild(micIcon);
        
        avatar.appendChild(imageElement);
        avatar.appendChild(usernameElement);
        avatarContainer.appendChild(avatar);
        avatarContainer.appendChild(micStatus);
        
        return avatarContainer;
    }

    function attachStream(participantId, stream) {
        if (!videoGrid) return;
        
        // Get user information
        const username = participantId === 'local' ? 
            (document.querySelector('meta[name="username"]')?.content || 'You') : 
            (window.videosdkMeeting?.participants.get(participantId)?.displayName || 'User');
            
        // Get profile picture URL (assuming there's a way to get this)
        const profilePicture = participantId === 'local' ? 
            document.querySelector('.user-avatar img')?.src || null : null;
        
        let videoEl = document.querySelector(`video[data-participant-id="${participantId}"]`);
        let avatarContainer = document.querySelector(`.avatar-container[data-participant-id="${participantId}"]`);
        
        // If neither video nor avatar exists, create them
        if (!videoEl && !avatarContainer) {
            // Create container for avatar
            avatarContainer = createAvatarElement(participantId, username, profilePicture);
            videoGrid.appendChild(avatarContainer);
            
            // Create video element (initially hidden)
            videoEl = document.createElement('video');
            videoEl.dataset.participantId = participantId;
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            videoEl.muted = (participantId === 'local');
            videoEl.className = 'w-full h-[200px] object-cover bg-black rounded-md hidden';
            videoGrid.appendChild(videoEl);
            videoGrid.classList.remove('hidden');
        }

        // Show video and hide avatar when we have a video stream
        if (stream && (stream.kind === 'video' || stream instanceof MediaStream)) {
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
            videoEl.classList.remove('hidden');
            if (avatarContainer) avatarContainer.classList.add('hidden');
            
            videoEl.play().catch(e => {
                if (e.name === 'NotAllowedError') {
                    window.showToast?.('Please allow camera access to enable video', 'error');
                }
            });
        } else {
            // For audio-only, show avatar
            if (avatarContainer) avatarContainer.classList.remove('hidden');
            if (videoEl) videoEl.classList.add('hidden');
        }

        if (participantId === 'local' && localAvatarWrapper) {
            localAvatarWrapper.style.display = 'none';
        }
    }

    function detachStream(participantId) {
        if (!videoGrid) return;
        
        const videoEl = document.querySelector(`video[data-participant-id="${participantId}"]`);
        const avatarContainer = document.querySelector(`.avatar-container[data-participant-id="${participantId}"]`);
        
        if (videoEl) {
            if (videoEl.srcObject) {
                const tracks = videoEl.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
            videoEl.srcObject = null;
            videoEl.remove();
        }
        
        if (avatarContainer) {
            avatarContainer.remove();
        }
        
        // Check if there are any participants left
        const remainingElements = videoGrid.querySelectorAll('video, .avatar-container');
        if (!remainingElements.length) {
            videoGrid.classList.add('hidden');
        }
        
        if (participantId === 'local' && localAvatarWrapper) {
            localAvatarWrapper.style.display = 'block';
        }
    }

    function setupMeetingEventHandlers(meeting) {
        if (!meeting) return;
        
        // Add current participants
        meeting.participants.forEach(participant => {
            // Add avatar for each participant
            attachStream(participant.id);
            
            // Handle any active streams
            participant.streams.forEach((stream) => {
                if (stream.kind === 'video') {
                    attachStream(participant.id, stream);
                }
            });
        });
        
        // Handle local participant
        if (!document.querySelector(`[data-participant-id="local"]`)) {
            attachStream('local');
            
            meeting.localParticipant.streams.forEach((stream) => {
                if (stream.kind === 'video') {
                    attachStream('local', stream);
                }
            });
        }
        
        // Stream events
        meeting.on('stream-enabled', (participant, stream) => {
            if (stream.kind === 'video') {
                attachStream(participant.id, stream);
            }
        });

        meeting.on('stream-disabled', (participant, stream) => {
            if (stream.kind === 'video') {
                // Instead of detaching, just hide video and show avatar
                const videoEl = document.querySelector(`video[data-participant-id="${participant.id}"]`);
                const avatarContainer = document.querySelector(`.avatar-container[data-participant-id="${participant.id}"]`);
                
                if (videoEl) videoEl.classList.add('hidden');
                if (avatarContainer) avatarContainer.classList.remove('hidden');
            }
        });
        
        // Participant events
        meeting.on('participant-joined', (participant) => {
            attachStream(participant.id);
        });

        meeting.on('participant-left', (participant) => {
            detachStream(participant.id);
        });

        // Local participant events
        meeting.localParticipant.on('stream-enabled', (stream) => {
            if (stream.kind === 'video') {
                attachStream('local', stream);
            }
        });

        meeting.localParticipant.on('stream-disabled', (stream) => {
            if (stream.kind === 'video') {
                // Instead of detaching, just hide video and show avatar
                const videoEl = document.querySelector(`video[data-participant-id="local"]`);
                const avatarContainer = document.querySelector(`.avatar-container[data-participant-id="local"]`);
                
                if (videoEl) videoEl.classList.add('hidden');
                if (avatarContainer) avatarContainer.classList.remove('hidden');
            }
        });
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
        } else {
            // If webcam is not active, show avatar
            attachStream('local');
        }
    }

    window.addEventListener('voiceConnect', () => {
        setTimeout(initializeView, 500);
    });

    if (window.videosdkMeeting) {
        initializeView();
    }
}); 