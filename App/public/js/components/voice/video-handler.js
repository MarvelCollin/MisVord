document.addEventListener('DOMContentLoaded', () => {
    if (window.videoHandlerInitialized) return;
    window.videoHandlerInitialized = true;

    const videoGrid = document.getElementById('videoGrid');
    const localAvatarWrapper = document.querySelector('.local-avatar-wrapper');
    
    if (!videoGrid) {
        console.error('Video grid element not found');
        return;
    }
    
    window.addEventListener('voiceConnect', () => {
        initializeView();
    });

    function createAvatarElement(participantId, username = 'User', imageSrc = null) {
        const container = document.createElement('div');
        container.className = 'participant-container voice-participant';
        container.dataset.participantId = participantId;
        
        const nameInitial = username.charAt(0).toUpperCase();
        const displayName = username.length > 15 ? username.substring(0, 12) + '...' : username;
        
        container.innerHTML = `
            <div class="avatar">
                ${nameInitial}
                <div class="status-indicator status-idle"></div>
            </div>
            <span class="name">${displayName}</span>
        `;
        
        return container;
    }

    function getStreamType(stream) {
        try {
            // Case 1: Direct MediaStream object
            if (stream instanceof MediaStream) {
                return stream.getVideoTracks().length > 0 ? 'video' : 'audio';
            }
            
            // Case 2: Stream object with kind property
            if (stream && typeof stream.kind === 'string') {
                return stream.kind;
            }
            
            // Case 3: Stream object with track property
            if (stream && stream.track) {
                return stream.track.kind;
            }
            
            // Case 4: Stream object with mediaStream property
            if (stream && stream.mediaStream instanceof MediaStream) {
                return stream.mediaStream.getVideoTracks().length > 0 ? 'video' : 'audio';
            }
            
            // Case 5: Stream object with stream property
            if (stream && stream.stream instanceof MediaStream) {
                return stream.stream.getVideoTracks().length > 0 ? 'video' : 'audio';
            }
            
            // Default case: unknown/audio
            return 'audio';
        } catch (error) {
            console.warn('Error determining stream type:', error);
            return 'audio';
        }
    }

    function getMediaStream(stream) {
        try {
            // Check if stream is null or undefined first
            if (!stream) {
                return null;
            }
            
            // Handle different stream formats
            if (stream instanceof MediaStream) {
                return stream;
            } else if (stream.track && typeof stream.track !== 'undefined') {
                return new MediaStream([stream.track]);
            } else if (stream.mediaStream instanceof MediaStream) {
                return stream.mediaStream;
            } else if (stream.stream instanceof MediaStream) {
                return stream.stream;
            }
            
            // Try to handle other potential formats
            if (stream.getVideoTracks && typeof stream.getVideoTracks === 'function') {
                return stream;
            }
            
            return null;
        } catch (error) {
            console.warn('Error extracting MediaStream:', error);
            return null;
        }
    }

    function attachStream(participantId, stream = null) {
        if (!videoGrid) return;
        
        // Safety check for participantId
        if (!participantId) {
            console.warn('Cannot attach stream without participant ID');
            return;
        }
        
        const username = participantId === 'local' ? 'You' : participantId;
        let videoEl = document.querySelector(`video[data-participant-id="${participantId}"]`);
        let avatarContainer = document.querySelector(`.participant-container[data-participant-id="${participantId}"]`);
        
        // Create elements if they don't exist
        if (!videoEl && !avatarContainer) {
            avatarContainer = createAvatarElement(participantId, username);
            videoGrid.appendChild(avatarContainer);
            
            videoEl = document.createElement('video');
            videoEl.dataset.participantId = participantId;
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            videoEl.muted = (participantId === 'local');
            videoEl.className = 'w-full h-full object-cover bg-black rounded-xl hidden';
            videoGrid.appendChild(videoEl);
            videoGrid.classList.remove('hidden');
        }

        try {
            const streamType = getStreamType(stream);
            const mediaStream = getMediaStream(stream);

            // Show/hide appropriate elements based on stream type
            if (streamType === 'video' && mediaStream) {
                try {
                    videoEl.srcObject = mediaStream;
                    videoEl.classList.remove('hidden');
                    if (avatarContainer) avatarContainer.classList.add('hidden');
                    
                    videoEl.play().catch(e => {
                        console.warn('Error playing video:', e);
                        if (e.name === 'NotAllowedError') {
                            window.showToast?.('Please allow camera access to enable video', 'error');
                        }
                        // Fallback to avatar on error
                        videoEl.classList.add('hidden');
                        if (avatarContainer) avatarContainer.classList.remove('hidden');
                    });
                } catch (error) {
                    console.error('Error attaching video stream:', error);
                    // Fallback to avatar on error
                    videoEl.classList.add('hidden');
                    if (avatarContainer) avatarContainer.classList.remove('hidden');
                }
            } else {
                // Audio only or no stream - show avatar
                if (avatarContainer) avatarContainer.classList.remove('hidden');
                if (videoEl) {
                    videoEl.classList.add('hidden');
                    if (videoEl.srcObject) {
                        try {
                            const tracks = videoEl.srcObject.getTracks();
                            tracks.forEach(track => track.stop());
                        } catch (e) {
                            console.warn('Error stopping tracks:', e);
                        }
                        videoEl.srcObject = null;
                    }
                }
            }

            if (participantId === 'local' && localAvatarWrapper) {
                localAvatarWrapper.style.display = 'none';
            }
        } catch (error) {
            console.error('Error in attachStream:', error);
            // Ensure avatar is shown on error
            if (avatarContainer) avatarContainer.classList.remove('hidden');
            if (videoEl) videoEl.classList.add('hidden');
        }

        // Update grid layout
        try {
            window.dispatchEvent(new Event('videoGridUpdate'));
        } catch (e) {
            console.warn('Error dispatching grid update event:', e);
        }
    }

    function detachStream(participantId) {
        if (!videoGrid) return;
        
        const videoEl = document.querySelector(`video[data-participant-id="${participantId}"]`);
        const avatarContainer = document.querySelector(`.participant-container[data-participant-id="${participantId}"]`);
        
        // Clean up video element
        if (videoEl) {
            try {
                if (videoEl.srcObject) {
                    const tracks = videoEl.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                }
                videoEl.srcObject = null;
                videoEl.remove();
            } catch (error) {
                console.warn('Error cleaning up video element:', error);
            }
        }
        
        // Remove avatar container
        if (avatarContainer) {
            avatarContainer.remove();
        }
        
        // Check if there are any participants left
        const remainingElements = videoGrid.querySelectorAll('video:not(.hidden), .participant-container:not(.hidden)');
        if (!remainingElements.length) {
            videoGrid.classList.add('hidden');
        }
        
        if (participantId === 'local' && localAvatarWrapper) {
            localAvatarWrapper.style.display = 'block';
        }

        // Update grid layout
        window.dispatchEvent(new Event('videoGridUpdate'));
    }

    function setupMeetingEventHandlers(meeting) {
        if (!meeting) return;
        
        try {
            // Add current participants
            meeting.participants.forEach(participant => {
                attachStream(participant.id);
                
                if (participant.streams) {
                    participant.streams.forEach(stream => {
                        if (stream) attachStream(participant.id, stream);
                    });
                }
            });
            
            // Handle local participant
            if (!document.querySelector(`[data-participant-id="local"]`)) {
                attachStream('local');
                
                if (meeting.localParticipant?.streams) {
                    meeting.localParticipant.streams.forEach(stream => {
                        if (stream) attachStream('local', stream);
                    });
                }
            }
            
            // Stream events
            meeting.on('stream-enabled', (participant, stream) => {
                if (stream) attachStream(participant.id, stream);
            });

            meeting.on('stream-disabled', (participant, stream) => {
                if (stream) {
                    const streamType = getStreamType(stream);
                    if (streamType === 'video') {
                        const videoEl = document.querySelector(`video[data-participant-id="${participant.id}"]`);
                        const avatarContainer = document.querySelector(`.participant-container[data-participant-id="${participant.id}"]`);
                        
                        if (videoEl) videoEl.classList.add('hidden');
                        if (avatarContainer) avatarContainer.classList.remove('hidden');
                    }
                }
            });
            
            // Participant events
            meeting.on('participant-joined', participant => {
                attachStream(participant.id);
            });

            meeting.on('participant-left', participant => {
                detachStream(participant.id);
            });

            // Local participant events
            meeting.localParticipant.on('stream-enabled', stream => {
                if (stream) attachStream('local', stream);
            });

            meeting.localParticipant.on('stream-disabled', stream => {
                if (stream) {
                    const streamType = getStreamType(stream);
                    if (streamType === 'video') {
                        const videoEl = document.querySelector(`video[data-participant-id="local"]`);
                        const avatarContainer = document.querySelector(`.participant-container[data-participant-id="local"]`);
                        
                        if (videoEl) videoEl.classList.add('hidden');
                        if (avatarContainer) avatarContainer.classList.remove('hidden');
                    }
                }
            });
        } catch (error) {
            console.error('Error setting up meeting event handlers:', error);
        }
    }

    function initializeView() {
        if (!window.videosdkMeeting) {
            setTimeout(initializeView, 100);
            return;
        }

        try {
            setupMeetingEventHandlers(window.videosdkMeeting);

            if (window.videoSDKManager?.getWebcamState()) {
                const localParticipant = window.videosdkMeeting.localParticipant;
                if (localParticipant?.streams) {
                    try {
                        const videoStream = Array.from(localParticipant.streams.values())
                            .find(stream => getStreamType(stream) === 'video');
                        
                        if (videoStream) {
                            attachStream('local', videoStream);
                        } else {
                            attachStream('local');
                        }
                    } catch (error) {
                        console.warn('Error accessing video stream:', error);
                        attachStream('local');
                    }
                }
            } else {
                attachStream('local');
            }
        } catch (error) {
            console.error('Error initializing view:', error);
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