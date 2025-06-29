document.addEventListener('DOMContentLoaded', () => {
    if (window.videoHandlerInitialized) return;
    window.videoHandlerInitialized = true;

    const videoGrid = document.getElementById('videoGrid');
    const localAvatarWrapper = document.querySelector('.local-avatar-wrapper');
    
    if (!videoGrid) {
        console.error('Video grid element not found');
        return;
    }

    const pendingPlayPromises = new Map();
    const processedStreams = new Map();
    const streamProcessingTimestamps = new Map();
    let initializationInProgress = false;
    
    window.addEventListener('voiceConnect', () => {
        if (!initializationInProgress) {
            initializationInProgress = true;
            setTimeout(() => {
                initializeView();
                initializationInProgress = false;
            }, 500);
        }
    });

    function isDuplicateStreamEvent(participantId, streamType) {
        const key = `${participantId}-${streamType}`;
        const now = Date.now();
        const lastProcessed = streamProcessingTimestamps.get(key);
        
        if (lastProcessed && (now - lastProcessed) < 1000) {
            console.log(`[VideoHandler] Skipping duplicate stream event for ${participantId} (${streamType})`);
            return true;
        }
        
        streamProcessingTimestamps.set(key, now);
        return false;
    }

    window.addEventListener('videosdkStreamEnabled', (event) => {
        console.log('[VideoHandler] Received videosdkStreamEnabled event:', event.detail);
        const { kind, stream, participant } = event.detail;
        
        if (kind === 'video' || kind === 'share') {
            if (!isDuplicateStreamEvent(participant, kind)) {
                console.log('[VideoHandler] Processing video stream for participant:', participant);
                attachStream(participant, stream);
            }
        }
    });

    window.addEventListener('videosdkStreamDisabled', (event) => {
        console.log('[VideoHandler] Received videosdkStreamDisabled event:', event.detail);
        const { kind, participant } = event.detail;
        
        if (kind === 'video' || kind === 'share') {
            if (!isDuplicateStreamEvent(participant, `disable-${kind}`)) {
                console.log('[VideoHandler] Disabling video for participant:', participant);
                const videoEl = document.querySelector(`video[data-participant-id="${participant}"]`);
                const avatarContainer = document.querySelector(`.participant-container[data-participant-id="${participant}"]`);
                
                if (videoEl) {
                    stopVideoSafely(videoEl);
                    videoEl.classList.add('hidden');
                }
                if (avatarContainer) avatarContainer.classList.remove('hidden');
            }
        }
    });

    function createAvatarElement(participantId, username = 'User') {
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
        if (!stream) return 'audio';
        
            if (stream instanceof MediaStream) {
                const videoTracks = stream.getVideoTracks();
                if (videoTracks.length > 0) {
                    const track = videoTracks[0];
                return track.label?.toLowerCase().includes('screen') ? 'share' : 'video';
                }
                return 'audio';
            }
            
        if (stream.kind) return stream.kind;
                
                if (stream.stream instanceof MediaStream) {
            const videoTracks = stream.stream.getVideoTracks();
                if (videoTracks.length > 0) {
                    const track = videoTracks[0];
                return track.label?.toLowerCase().includes('screen') ? 'share' : 'video';
                }
                return 'audio';
            }
            
        if (stream.track?.kind === 'video') {
            return stream.track.label?.toLowerCase().includes('screen') ? 'share' : 'video';
        }
        
                    return 'audio';
    }

    function getMediaStream(stream) {
        if (!stream) return null;
        
        if (stream instanceof MediaStream) {
            console.log('[VideoHandler] Using direct MediaStream:', stream.getTracks().length, 'tracks');
            return stream;
        }
        
        if (stream.stream instanceof MediaStream) {
            console.log('[VideoHandler] Using nested MediaStream:', stream.stream.getTracks().length, 'tracks');
            return stream.stream;
        }
        
        if (stream.track && stream.track instanceof MediaStreamTrack) {
            console.log('[VideoHandler] Creating MediaStream from track:', stream.track.kind);
            return new MediaStream([stream.track]);
        }
        
        if (stream.mediaStream instanceof MediaStream) {
            console.log('[VideoHandler] Using mediaStream property:', stream.mediaStream.getTracks().length, 'tracks');
            return stream.mediaStream;
        }
        
        if (stream.kind && stream.track) {
            console.log('[VideoHandler] Creating MediaStream from kind+track:', stream.kind);
            return new MediaStream([stream.track]);
        }
        
        console.warn('[VideoHandler] Unable to extract MediaStream from:', stream);
        return null;
    }

    async function safeVideoPlay(videoEl, participantId) {
        if (!videoEl || !participantId) return false;

            const existingPromise = pendingPlayPromises.get(participantId);
            if (existingPromise) {
                try {
                    await existingPromise;
            } catch (e) {}
        }

        if (!videoEl.srcObject) return false;

            const playPromise = new Promise(async (resolve, reject) => {
                try {
                    if (videoEl.readyState >= 2) {
                        await videoEl.play();
                        resolve(true);
                    } else {
                        const onLoadedData = async () => {
                            try {
                                videoEl.removeEventListener('loadeddata', onLoadedData);
                                await videoEl.play();
                                resolve(true);
                            } catch (error) {
                                reject(error);
                            }
                        };
                        
                        videoEl.addEventListener('loadeddata', onLoadedData);
                        
                        setTimeout(() => {
                            videoEl.removeEventListener('loadeddata', onLoadedData);
                            reject(new Error('Video load timeout'));
                        }, 5000);
                    }
                } catch (error) {
                    reject(error);
                }
            });

            pendingPlayPromises.set(participantId, playPromise);
            
        try {
            const result = await playPromise;
            pendingPlayPromises.delete(participantId);
            return result;
        } catch (error) {
            pendingPlayPromises.delete(participantId);
            if (error.name === 'NotAllowedError') {
                window.showToast?.('Please allow camera access to enable video', 'error');
            }
            return false;
        }
    }

    function stopVideoSafely(videoEl) {
        if (!videoEl) return;
        
        try {
            videoEl.pause();
            
            if (videoEl.srcObject) {
                const tracks = videoEl.srcObject.getTracks();
                tracks.forEach(track => {
                    try {
                        track.stop();
                    } catch (e) {}
                });
                videoEl.srcObject = null;
            }
        } catch (error) {}
    }

    async function attachStream(participantId, stream = null) {
        if (!videoGrid) return;
        
        if (!participantId) return;
        
        const processKey = `${participantId}-${stream?.track?.id || 'default'}`;
        if (processedStreams.has(processKey)) {
            console.log(`[VideoHandler] Stream already processed for ${participantId}, skipping duplicate`);
            return;
        }
        
        console.log(`[VideoHandler] attachStream called for ${participantId}`, {
            hasStream: !!stream,
            streamType: typeof stream,
            isMediaStream: stream instanceof MediaStream
        });
        
        processedStreams.set(processKey, Date.now());
        setTimeout(() => processedStreams.delete(processKey), 2000);
        
        const username = participantId === 'local' ? 'You' : participantId;
        let videoEl = document.querySelector(`video[data-participant-id="${participantId}"]`);
        let avatarContainer = document.querySelector(`.participant-container[data-participant-id="${participantId}"]`);
        
        if (!videoEl && !avatarContainer) {
            avatarContainer = createAvatarElement(participantId, username);
            videoGrid.appendChild(avatarContainer);
            
            videoEl = document.createElement('video');
            videoEl.dataset.participantId = participantId;
            videoEl.autoplay = false;
            videoEl.playsInline = true;
            videoEl.muted = (participantId === 'local');
            videoEl.className = 'w-full h-full object-cover bg-black rounded-xl hidden';
            videoGrid.appendChild(videoEl);
            videoGrid.classList.remove('hidden');
        }

        try {
            const streamType = getStreamType(stream);
            const mediaStream = getMediaStream(stream);

            console.log(`[VideoHandler] Processing stream for ${participantId}:`, {
                streamType,
                hasMediaStream: !!mediaStream,
                mediaStreamTracks: mediaStream?.getTracks().length || 0
            });

            if ((streamType === 'video' || streamType === 'share') && mediaStream) {
                try {
                    console.log(`[VideoHandler] Setting up video for ${participantId}`);
                    stopVideoSafely(videoEl);
                    
                    videoEl.srcObject = mediaStream;
                    videoEl.classList.remove('hidden');
                    if (avatarContainer) avatarContainer.classList.add('hidden');
                    
                    const playSuccess = await safeVideoPlay(videoEl, participantId);
                    console.log(`[VideoHandler] Video play result for ${participantId}:`, playSuccess);
                    
                    if (!playSuccess) {
                        console.warn(`[VideoHandler] Video play failed for ${participantId}, showing avatar`);
                        videoEl.classList.add('hidden');
                        if (avatarContainer) avatarContainer.classList.remove('hidden');
                    }
                } catch (error) {
                    console.error(`[VideoHandler] Error setting up video for ${participantId}:`, error);
                    videoEl.classList.add('hidden');
                    if (avatarContainer) avatarContainer.classList.remove('hidden');
                }
            } else {
                console.log(`[VideoHandler] Showing avatar for ${participantId} (streamType: ${streamType})`);
                if (avatarContainer) avatarContainer.classList.remove('hidden');
                if (videoEl) {
                    videoEl.classList.add('hidden');
                    stopVideoSafely(videoEl);
                }
            }

            if (participantId === 'local' && localAvatarWrapper) {
                localAvatarWrapper.style.display = 'none';
            }
        } catch (error) {
            console.error(`[VideoHandler] Error in attachStream for ${participantId}:`, error);
            if (avatarContainer) avatarContainer.classList.remove('hidden');
            if (videoEl) videoEl.classList.add('hidden');
        }

        try {
            window.dispatchEvent(new Event('videoGridUpdate'));
        } catch (e) {}
    }

    function detachStream(participantId) {
        if (!videoGrid) return;
        
        const videoEl = document.querySelector(`video[data-participant-id="${participantId}"]`);
        const avatarContainer = document.querySelector(`.participant-container[data-participant-id="${participantId}"]`);
        
        if (videoEl) {
            try {
                stopVideoSafely(videoEl);
                videoEl.remove();
            } catch (error) {}
        }
        
        if (avatarContainer) {
            avatarContainer.remove();
        }
        
        pendingPlayPromises.delete(participantId);
        
        const remainingElements = videoGrid.querySelectorAll('video:not(.hidden), .participant-container:not(.hidden)');
        if (!remainingElements.length) {
            videoGrid.classList.add('hidden');
        }
        
        if (participantId === 'local' && localAvatarWrapper) {
            localAvatarWrapper.style.display = 'block';
        }

        window.dispatchEvent(new Event('videoGridUpdate'));
    }

    function setupMeetingEventHandlers(meeting) {
        if (!meeting) return;
        
        try {
            meeting.participants.forEach(participant => {
                attachStream(participant.id);
                
                if (participant.streams) {
                    participant.streams.forEach(stream => {
                        if (stream) attachStream(participant.id, stream);
                    });
                }
            });
            
            if (!document.querySelector(`[data-participant-id="local"]`)) {
                attachStream('local');
                
                if (meeting.localParticipant?.streams) {
                    meeting.localParticipant.streams.forEach(stream => {
                        if (stream) attachStream('local', stream);
                    });
                }
            }
            
            meeting.on('stream-enabled', (participant, stream) => {
                if (stream) attachStream(participant.id, stream);
            });

            meeting.on('stream-disabled', (participant, stream) => {
                if (stream) {
                    const streamType = getStreamType(stream);
                    if (streamType === 'video') {
                        const videoEl = document.querySelector(`video[data-participant-id="${participant.id}"]`);
                        const avatarContainer = document.querySelector(`.participant-container[data-participant-id="${participant.id}"]`);
                        
                        if (videoEl) {
                            stopVideoSafely(videoEl);
                            videoEl.classList.add('hidden');
                        }
                        if (avatarContainer) avatarContainer.classList.remove('hidden');
                    }
                }
            });
            
            meeting.on('participant-joined', participant => {
                attachStream(participant.id);
            });

            meeting.on('participant-left', participant => {
                detachStream(participant.id);
            });

            meeting.localParticipant.on('stream-enabled', stream => {
                if (stream) attachStream('local', stream);
            });

            meeting.localParticipant.on('stream-disabled', stream => {
                if (stream) {
                    const streamType = getStreamType(stream);
                    if (streamType === 'video') {
                        const videoEl = document.querySelector(`video[data-participant-id="local"]`);
                        const avatarContainer = document.querySelector(`.participant-container[data-participant-id="local"]`);
                        
                        if (videoEl) {
                            stopVideoSafely(videoEl);
                            videoEl.classList.add('hidden');
                        }
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
            console.log('[VideoHandler] Initializing video view');
            
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

    if (window.videosdkMeeting) {
        setTimeout(initializeView, 100);
    }
}); 