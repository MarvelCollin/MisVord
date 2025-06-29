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
            if (stream instanceof MediaStream) {
                const videoTracks = stream.getVideoTracks();
                const audioTracks = stream.getAudioTracks();
                
                if (videoTracks.length > 0) {
                    const track = videoTracks[0];
                    if (track.label && track.label.toLowerCase().includes('screen')) {
                        return 'share';
                    } else {
                        return 'video';
                    }
                } else if (audioTracks.length > 0) {
                    return 'audio';
                }
                return 'audio';
            }
            
            if (stream && typeof stream.kind === 'string') {
                return stream.kind;
            }
            
            if (stream && stream.track) {
                const track = stream.track;
                if (track.kind === 'video') {
                    if (track.label && track.label.toLowerCase().includes('screen')) {
                        return 'share';
                    } else {
                        return 'video';
                    }
                } else if (track.kind === 'audio') {
                    return 'audio';
                }
                return track.kind;
            }
            
            if (stream && stream.mediaStream instanceof MediaStream) {
                const mediaStream = stream.mediaStream;
                const videoTracks = mediaStream.getVideoTracks();
                const audioTracks = mediaStream.getAudioTracks();
                
                if (videoTracks.length > 0) {
                    const track = videoTracks[0];
                    if (track.label && track.label.toLowerCase().includes('screen')) {
                        return 'share';
                    } else {
                        return 'video';
                    }
                } else if (audioTracks.length > 0) {
                    return 'audio';
                }
                return 'audio';
            }
            
            if (stream && stream.stream instanceof MediaStream) {
                const mediaStream = stream.stream;
                const videoTracks = mediaStream.getVideoTracks();
                const audioTracks = mediaStream.getAudioTracks();
                
                if (videoTracks.length > 0) {
                    const track = videoTracks[0];
                    if (track.label && track.label.toLowerCase().includes('screen')) {
                        return 'share';
                    } else {
                        return 'video';
                    }
                } else if (audioTracks.length > 0) {
                    return 'audio';
                }
                return 'audio';
            }
            
            return 'audio';
        } catch (error) {
            console.warn('Error determining stream type:', error);
            return 'audio';
        }
    }

    function getMediaStream(stream) {
        try {
            if (!stream) {
                console.warn('[VideoHandler] getMediaStream: No stream provided');
                return null;
            }

            console.log('[VideoHandler] getMediaStream: Analyzing stream object:', {
                isMediaStream: stream instanceof MediaStream,
                hasStream: !!stream.stream,
                hasMediaStream: !!stream.mediaStream,
                hasTrack: !!stream.track,
                keys: Object.keys(stream),
                streamType: typeof stream,
                constructor: stream.constructor?.name
            });
            
            if (stream instanceof MediaStream) {
                console.log('[VideoHandler] getMediaStream: Direct MediaStream found');
                return stream;
            }
            
            if (stream.track && typeof stream.track !== 'undefined') {
                console.log('[VideoHandler] getMediaStream: Creating MediaStream from track');
                return new MediaStream([stream.track]);
            }
            
            if (stream.mediaStream instanceof MediaStream) {
                console.log('[VideoHandler] getMediaStream: Found MediaStream in .mediaStream property');
                return stream.mediaStream;
            }
            
            if (stream.stream instanceof MediaStream) {
                console.log('[VideoHandler] getMediaStream: Found MediaStream in .stream property');
                return stream.stream;
            }

            if (stream.stream && stream.stream.stream instanceof MediaStream) {
                console.log('[VideoHandler] getMediaStream: Found nested MediaStream in .stream.stream');
                return stream.stream.stream;
            }

            if (stream.getVideoTracks && typeof stream.getVideoTracks === 'function') {
                console.log('[VideoHandler] getMediaStream: Stream has MediaStream methods');
                return stream;
            }

            if (stream.stream && stream.stream.getVideoTracks && typeof stream.stream.getVideoTracks === 'function') {
                console.log('[VideoHandler] getMediaStream: Nested stream has MediaStream methods');
                return stream.stream;
            }

            if (stream.track && stream.track.kind) {
                console.log('[VideoHandler] getMediaStream: Creating MediaStream from track object');
                return new MediaStream([stream.track]);
            }

            if (typeof stream === 'object' && stream.srcObject) {
                console.log('[VideoHandler] getMediaStream: Found srcObject property');
                return stream.srcObject;
            }

            console.warn('[VideoHandler] getMediaStream: Could not extract MediaStream, trying all properties:', stream);
            
            for (const [key, value] of Object.entries(stream)) {
                if (value instanceof MediaStream) {
                    console.log(`[VideoHandler] getMediaStream: Found MediaStream in property '${key}'`);
                    return value;
                }
                if (value && typeof value === 'object' && value.getVideoTracks) {
                    console.log(`[VideoHandler] getMediaStream: Found MediaStream-like object in property '${key}'`);
                    return value;
                }
            }
            
            console.warn('[VideoHandler] getMediaStream: No MediaStream found in any property');
            return null;
        } catch (error) {
            console.error('[VideoHandler] getMediaStream: Error extracting MediaStream:', error);
            return null;
        }
    }

    async function safeVideoPlay(videoEl, participantId) {
        if (!videoEl || !participantId) {
            console.warn(`[VideoHandler] safeVideoPlay: Missing videoEl or participantId`);
            return false;
        }

        try {
            const existingPromise = pendingPlayPromises.get(participantId);
            if (existingPromise) {
                console.log(`[VideoHandler] Waiting for existing play promise for ${participantId}`);
                try {
                    await existingPromise;
                } catch (e) {
                    console.warn(`[VideoHandler] Previous play promise failed for ${participantId}:`, e);
                }
            }

            if (!videoEl.srcObject) {
                console.warn(`[VideoHandler] No srcObject for ${participantId}`);
                return false;
            }

            console.log(`[VideoHandler] Starting video play for ${participantId}, readyState: ${videoEl.readyState}`);

            const playPromise = new Promise(async (resolve, reject) => {
                try {
                    if (videoEl.readyState >= 2) {
                        console.log(`[VideoHandler] Video ready, playing immediately for ${participantId}`);
                        await videoEl.play();
                        resolve(true);
                    } else {
                        console.log(`[VideoHandler] Video not ready, waiting for loadeddata event for ${participantId}`);
                        const onLoadedData = async () => {
                            try {
                                videoEl.removeEventListener('loadeddata', onLoadedData);
                                console.log(`[VideoHandler] Video loaded, playing for ${participantId}`);
                                await videoEl.play();
                                resolve(true);
                            } catch (error) {
                                console.error(`[VideoHandler] Play error after loadeddata for ${participantId}:`, error);
                                reject(error);
                            }
                        };
                        
                        videoEl.addEventListener('loadeddata', onLoadedData);
                        
                        setTimeout(() => {
                            videoEl.removeEventListener('loadeddata', onLoadedData);
                            console.warn(`[VideoHandler] Video load timeout for ${participantId}`);
                            reject(new Error('Video load timeout'));
                        }, 5000);
                    }
                } catch (error) {
                    console.error(`[VideoHandler] Play promise error for ${participantId}:`, error);
                    reject(error);
                }
            });

            pendingPlayPromises.set(participantId, playPromise);
            
            const result = await playPromise;
            pendingPlayPromises.delete(participantId);
            console.log(`[VideoHandler] Video play successful for ${participantId}`);
            return result;
            
        } catch (error) {
            pendingPlayPromises.delete(participantId);
            console.warn(`[VideoHandler] Error playing video for ${participantId}:`, error);
            
            if (error.name === 'NotAllowedError') {
                console.error(`[VideoHandler] Camera permission denied for ${participantId}`);
                window.showToast?.('Please allow camera access to enable video', 'error');
            } else if (error.name === 'AbortError') {
                console.warn(`[VideoHandler] Video play aborted for ${participantId} (likely due to new request)`);
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
                    } catch (e) {
                        console.warn('Error stopping track:', e);
                    }
                });
                videoEl.srcObject = null;
            }
        } catch (error) {
            console.warn('Error stopping video safely:', error);
        }
    }

    async function attachStream(participantId, stream = null) {
        if (!videoGrid) return;
        
        if (!participantId) {
            console.warn('Cannot attach stream without participant ID');
            return;
        }
        
        console.log(`[VideoHandler] Attempting to attach stream for ${participantId}`, {
            hasStream: !!stream,
            streamType: stream ? getStreamType(stream) : 'no-stream'
        });
        
        const username = participantId === 'local' ? 'You' : participantId;
        let videoEl = document.querySelector(`video[data-participant-id="${participantId}"]`);
        let avatarContainer = document.querySelector(`.participant-container[data-participant-id="${participantId}"]`);
        
        if (!videoEl && !avatarContainer) {
            console.log(`[VideoHandler] Creating new elements for ${participantId}`);
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

            console.log(`[VideoHandler] Stream details for ${participantId}:`, {
                streamType,
                hasMediaStream: !!mediaStream,
                videoTracks: mediaStream?.getVideoTracks?.()?.length || 0,
                audioTracks: mediaStream?.getAudioTracks?.()?.length || 0
            });

            if (streamType === 'video' && mediaStream) {
                try {
                    console.log(`[VideoHandler] Setting up video for ${participantId}`);
                    stopVideoSafely(videoEl);
                    
                    videoEl.srcObject = mediaStream;
                    videoEl.classList.remove('hidden');
                    if (avatarContainer) avatarContainer.classList.add('hidden');
                    
                    const playSuccess = await safeVideoPlay(videoEl, participantId);
                    console.log(`[VideoHandler] Video play result for ${participantId}:`, playSuccess);
                    
                    if (!playSuccess) {
                        console.warn(`[VideoHandler] Video play failed for ${participantId}, falling back to avatar`);
                        videoEl.classList.add('hidden');
                        if (avatarContainer) avatarContainer.classList.remove('hidden');
                    } else {
                        console.log(`[VideoHandler] Video successfully playing for ${participantId}`);
                    }
                } catch (error) {
                    console.error(`[VideoHandler] Error attaching video stream for ${participantId}:`, error);
                    videoEl.classList.add('hidden');
                    if (avatarContainer) avatarContainer.classList.remove('hidden');
                }
            } else if (streamType === 'share' && mediaStream) {
                console.log(`[VideoHandler] Setting up screen share for ${participantId}`);
                try {
                    stopVideoSafely(videoEl);
                    
                    videoEl.srcObject = mediaStream;
                    videoEl.classList.remove('hidden');
                    if (avatarContainer) avatarContainer.classList.add('hidden');
                    
                    const playSuccess = await safeVideoPlay(videoEl, participantId);
                    console.log(`[VideoHandler] Screen share play result for ${participantId}:`, playSuccess);
                    
                    if (!playSuccess) {
                        console.warn(`[VideoHandler] Screen share play failed for ${participantId}, falling back to avatar`);
                        videoEl.classList.add('hidden');
                        if (avatarContainer) avatarContainer.classList.remove('hidden');
                    }
                } catch (error) {
                    console.error(`[VideoHandler] Error attaching screen share for ${participantId}:`, error);
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
        } catch (e) {
            console.warn('Error dispatching grid update event:', e);
        }
    }

    function detachStream(participantId) {
        if (!videoGrid) return;
        
        const videoEl = document.querySelector(`video[data-participant-id="${participantId}"]`);
        const avatarContainer = document.querySelector(`.participant-container[data-participant-id="${participantId}"]`);
        
        if (videoEl) {
            try {
                stopVideoSafely(videoEl);
                videoEl.remove();
            } catch (error) {
                console.warn('Error cleaning up video element:', error);
            }
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