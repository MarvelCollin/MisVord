/**
 * Voice Call Section Controller
 * Handles the voice control buttons (mic, camera, deafen, screen share)
 * in the voice call interface
 */
class VoiceCallSection {
    constructor() {
        this.micBtn = null;
        this.videoBtn = null;
        this.deafenBtn = null;
        this.screenBtn = null;
        this.ticTacToeBtn = null;
        this.disconnectBtn = null;
        
        this.initialized = false;
        this.streamProcessingDebounce = new Map(); // Add debouncing to prevent rapid re-processing
        this.bindEvents();
    }

    bindEvents() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }

        // Listen for VideoSDK participant events
        window.addEventListener('videosdkParticipantJoined', (e) => this.handleParticipantJoined(e));
        window.addEventListener('videosdkParticipantLeft', (e) => this.handleParticipantLeft(e));
        window.addEventListener('videosdkMeetingFullyJoined', () => this.handleMeetingJoined());
        
        // Listen for stream events
        window.addEventListener('videosdkStreamEnabled', (e) => this.handleStreamEvent(e));
        window.addEventListener('videosdkStreamDisabled', (e) => this.handleStreamEvent(e));
    }

    init() {
        if (this.initialized) return;
        
        // Get button references
        this.micBtn = document.getElementById('micBtn');
        this.videoBtn = document.getElementById('videoBtn');
        this.deafenBtn = document.getElementById('deafenBtn');
        this.screenBtn = document.getElementById('screenBtn');
        this.ticTacToeBtn = document.getElementById('ticTacToeBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');

        // Bind button events
        this.bindMicButton();
        this.bindVideoButton();
        this.bindDeafenButton();
        this.bindScreenButton();
        this.bindTicTacToeButton();
        this.bindDisconnectButton();

        // Listen for voice state changes to update button states
        window.addEventListener('voiceStateChanged', (e) => this.handleVoiceStateChanged(e));

        // Initial button state sync
        this.syncButtonStates();

        // Initial participant grid sync if meeting is already active
        if (window.videoSDKManager?.isMeetingJoined) {
            setTimeout(() => {
                this.refreshParticipantGrid();
            }, 500);
        }

        this.initialized = true;
        
        setInterval(() => {
            if (window.videoSDKManager?.isMeetingJoined) {
                this.syncButtonStates();
                // Reduce frequency and add debouncing to prevent blinking
                if (this.lastStreamSync && (Date.now() - this.lastStreamSync) < 5000) {
                    return; // Skip if we synced streams recently
                }
                this.lastStreamSync = Date.now();
                this.syncAllParticipantStreams();
            }
        }, 5000); // Increased from 3000 to 5000ms to reduce frequency
        
        setTimeout(() => {
            this.retryInitialization();
        }, 1000);
        
        this.startVideoOverlaySafetyMonitor();
    }

    retryInitialization() {
        // Retry initialization if VideoSDK is not ready yet
        if (!window.videoSDKManager?.isMeetingJoined) {
            setTimeout(() => {
                if (window.videoSDKManager?.isMeetingJoined) {
                    this.syncButtonStates();
                    this.refreshParticipantGrid();
                } else {
                    // Continue periodic checks
                }
            }, 2000);
        }
    }

    updateGridLayout() {
        const grid = document.getElementById('participantGrid');
        if (!grid) return;

        const participants = grid.querySelectorAll('.participant-card, .video-participant-card, .screen-share-card');
        const count = participants.length;

        // Update grid layout based on participant count
        if (count === 0) {
            grid.className = 'w-full h-full grid gap-3 auto-rows-fr grid-cols-1 place-items-center';
        } else if (count === 1) {
            grid.className = 'w-full h-full grid gap-3 auto-rows-fr grid-cols-1 place-items-center';
        } else if (count === 2) {
            grid.className = 'w-full h-full grid gap-3 auto-rows-fr grid-cols-2';
        } else if (count <= 4) {
            grid.className = 'w-full h-full grid gap-3 auto-rows-fr grid-cols-2';
        } else if (count <= 6) {
            grid.className = 'w-full h-full grid gap-3 auto-rows-fr grid-cols-3';
        } else if (count <= 9) {
            grid.className = 'w-full h-full grid gap-3 auto-rows-fr grid-cols-3';
        } else {
            grid.className = 'w-full h-full grid gap-3 auto-rows-fr grid-cols-4';
        }

        // Ensure proper aspect ratio for video elements
        participants.forEach(participant => {
            const video = participant.querySelector('video');
            if (video) {
                video.style.objectFit = 'cover';
                video.style.width = '100%';
                video.style.height = '100%';
            }
        });
    }

    bindMicButton() {
        if (!this.micBtn) return;
        
        this.micBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.videoSDKManager && typeof window.videoSDKManager.toggleMic === 'function') {
                try {
                    const newState = window.videoSDKManager.toggleMic();
                    this.updateMicButton(newState);
                } catch (error) {
                    // Silent error handling
                }
            } else {
                // SDK not available
            }
        });
    }

    bindVideoButton() {
        if (!this.videoBtn) return;
        
        this.videoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.videoSDKManager && typeof window.videoSDKManager.toggleWebcam === 'function') {
                try {
                    const newState = await window.videoSDKManager.toggleWebcam();
                    this.updateVideoButton(newState);
                } catch (error) {
                    // Silent error handling
                }
            } else {
                // SDK not available
            }
        });
    }

    bindDeafenButton() {
        if (!this.deafenBtn) return;
        
        this.deafenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.videoSDKManager && typeof window.videoSDKManager.toggleDeafen === 'function') {
                const newState = window.videoSDKManager.toggleDeafen();
                this.updateDeafenButton(newState);
            } else {
                // SDK not available
            }
        });
    }

    bindScreenButton() {
        if (!this.screenBtn) return;
        
        this.screenBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.videoSDKManager && typeof window.videoSDKManager.toggleScreenShare === 'function') {
                try {
                    const newState = await window.videoSDKManager.toggleScreenShare();
                    this.updateScreenButton(newState);
                } catch (error) {
                    // Silent error handling
                }
            } else {
                // SDK not available
            }
        });
    }

    bindTicTacToeButton() {
        if (!this.ticTacToeBtn) return;
        
        this.ticTacToeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // TODO: Implement Tic Tac Toe game functionality
        });
    }

    bindDisconnectButton() {
        if (!this.disconnectBtn) return;
        
        this.disconnectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
                window.voiceManager.leaveVoice();
            } else {
                // Voice manager not available
            }
        });
    }

    handleVoiceStateChanged(e) {
        const { type, state } = e.detail;
        
        switch (type) {
            case 'mic':
                this.updateMicButton(state);
                // Also update local participant's visual indicator
                this.updateLocalParticipantIndicator('mic', state);
                break;
            case 'video':
                this.updateVideoButton(state);
                if (window.videoSDKManager?.meeting?.localParticipant) {
                    const localId = window.videoSDKManager.meeting.localParticipant.id;
                    
                    if (state) {
                        const localParticipant = window.videoSDKManager.meeting.localParticipant;
                        if (localParticipant && localParticipant.streams) {
                            let webcamStream = null;
                            
                            for (let [streamId, stream] of localParticipant.streams) {
                                if (stream && stream.track && stream.track.kind === 'video') {
                                    const label = stream.track.label?.toLowerCase() || '';
                                    if (!label.includes('screen') && !label.includes('display')) {
                                        webcamStream = stream;
                                        break;
                                    }
                                }
                            }
                            
                            if (webcamStream) {
                                this.updateParticipantStream(localId, webcamStream, 'video');
                            } else {
                                // No webcam stream found
                            }
                        }
                    } else {
                        this.updateParticipantStream(localId, null, 'video');
                    }
                }
                break;
            case 'deafen':
                this.updateDeafenButton(state);
                // When deafened, also update mic indicator
                this.updateLocalParticipantIndicator('mic', !state);
                break;
            case 'screen':
                this.updateScreenButton(state);
                // Also manually trigger screen share update for local participant
                if (window.videoSDKManager?.meeting?.localParticipant) {
                    const localId = window.videoSDKManager.meeting.localParticipant.id;
                    
                    if (state) {
                        const localParticipant = window.videoSDKManager.meeting.localParticipant;
                        if (localParticipant && localParticipant.streams) {
                            let shareStream = null;
                            
                            for (let [streamId, stream] of localParticipant.streams) {
                                if (stream && stream.track && stream.track.kind === 'video') {
                                    const label = stream.track.label?.toLowerCase() || '';
                                    if (label.includes('screen') || label.includes('display')) {
                                        shareStream = stream;
                                        break;
                                    }
                                }
                            }
                            
                            if (shareStream) {
                                this.updateParticipantStream(localId, shareStream, 'share');
                            } else {
                                // No screen share stream found
                            }
                        }
                    } else {
                        this.updateParticipantStream(localId, null, 'share');
                    }
                }
                break;
        }
    }

    updateMicButton(isMicOn) {
        if (!this.micBtn) return;
        
        const icon = this.micBtn.querySelector('i');
        const tooltip = this.micBtn.querySelector('.voice-tooltip');
        
        if (isMicOn) {
            icon.className = 'fas fa-microphone text-sm';
            tooltip.textContent = 'Mute';
            this.micBtn.classList.remove('bg-[#ed4245]', 'text-[#ed4245]', 'muted');
            this.micBtn.classList.add('bg-[#4f545c]');
        } else {
            icon.className = 'fas fa-microphone-slash text-sm';
            tooltip.textContent = 'Unmute';
            this.micBtn.classList.remove('bg-[#4f545c]');
            this.micBtn.classList.add('bg-[#ed4245]', 'text-white', 'muted');
        }
    }

    updateVideoButton(isVideoOn) {
        if (!this.videoBtn) return;
        
        const icon = this.videoBtn.querySelector('i');
        const tooltip = this.videoBtn.querySelector('.voice-tooltip');
        
        if (isVideoOn) {
            icon.className = 'fas fa-video text-sm';
            tooltip.textContent = 'Turn Off Camera';
            this.videoBtn.classList.remove('bg-[#4f545c]');
            this.videoBtn.classList.add('bg-[#3ba55c]', 'text-white', 'active');
        } else {
            icon.className = 'fas fa-video-slash text-sm';
            tooltip.textContent = 'Turn On Camera';
            this.videoBtn.classList.remove('bg-[#3ba55c]', 'active');
            this.videoBtn.classList.add('bg-[#4f545c]');
        }
    }

    updateDeafenButton(isDeafened) {
        if (!this.deafenBtn) return;
        
        const icon = this.deafenBtn.querySelector('i');
        const tooltip = this.deafenBtn.querySelector('.voice-tooltip');
        
        if (isDeafened) {
            icon.className = 'fas fa-deaf text-sm';
            tooltip.textContent = 'Undeafen';
            this.deafenBtn.classList.remove('bg-[#4f545c]');
            this.deafenBtn.classList.add('bg-[#ed4245]', 'text-white', 'deafened');
        } else {
            icon.className = 'fas fa-headphones text-sm';
            tooltip.textContent = 'Deafen';
            this.deafenBtn.classList.remove('bg-[#ed4245]', 'deafened');
            this.deafenBtn.classList.add('bg-[#4f545c]');
        }
    }

    updateScreenButton(isScreenSharing) {
        if (!this.screenBtn) return;
        
        const icon = this.screenBtn.querySelector('i');
        const tooltip = this.screenBtn.querySelector('.voice-tooltip');
        
        if (isScreenSharing) {
            icon.className = 'fas fa-stop text-sm';
            tooltip.textContent = 'Stop Sharing';
            this.screenBtn.classList.remove('bg-[#4f545c]');
            this.screenBtn.classList.add('bg-[#5865f2]', 'text-white', 'screen-sharing');
        } else {
            icon.className = 'fas fa-desktop text-sm';
            tooltip.textContent = 'Share Screen';
            this.screenBtn.classList.remove('bg-[#5865f2]', 'screen-sharing');
            this.screenBtn.classList.add('bg-[#4f545c]');
        }
    }

    updateParticipantStream(participantId, stream, kind) {
        // Add debouncing to prevent rapid re-processing that causes blinking
        if (stream && this.isStreamAlreadyProcessing(participantId, stream.id || 'unknown', kind)) {
            return; // Skip if we just processed this stream recently
        }
        
        // ENHANCED SCREEN SHARE DETECTION
        let isScreenShare = false;
        if (kind === 'share') {
            isScreenShare = true;
        } else if (stream && this.isScreenShareStream(stream)) {
            isScreenShare = true;
        }
        
        // ABSOLUTE RULE: Screen share ONLY goes to separate cards, NEVER to participant overlays
        if (isScreenShare) {
            if (stream) {
                this.createScreenShareCard(participantId, stream);
            } else {
                this.removeScreenShareCard(participantId);
            }
            this.updateGridLayout();
            return; // EARLY EXIT - screen share handled separately
        }
        
        // ONLY handle camera/webcam video for participant overlays
        if (kind === 'video') {
            const participantCard = document.querySelector(`[data-participant-id="${participantId}"]`);
            if (!participantCard) {
                return;
            }

            const videoOverlay = participantCard.querySelector('.participant-video-overlay');
            const videoElement = videoOverlay?.querySelector('video');
            const defaultView = participantCard.querySelector('.participant-default-view');

            if (stream) {
                // TRIPLE CHECK: Absolutely ensure this is NOT screen share
                if (this.isScreenShareStream(stream)) {
                    this.updateParticipantStream(participantId, stream, 'share');
                    return;
                }
                
                let mediaStream;
                if (stream instanceof MediaStream) {
                    mediaStream = stream;
                } else if (stream.track) {
                    mediaStream = new MediaStream([stream.track]);
                } else if (stream.stream) {
                    mediaStream = stream.stream;
                } else {
                    return;
                }
                
                // FINAL SCREEN SHARE CHECK before setting video
                const tracks = mediaStream.getVideoTracks();
                if (tracks.length > 0) {
                    const track = tracks[0];
                    const label = track.label?.toLowerCase() || '';
                    if (label.includes('screen') || 
                        label.includes('display') ||
                        label.includes('web-contents-media-stream') ||
                        label.includes('browser-capture') ||
                        label.includes('screencapture')) {
                        this.updateParticipantStream(participantId, stream, 'share');
                        return;
                    }
                }
                
                if (videoElement && mediaStream) {
                    // IMPROVED: Better video element setup to prevent black screens
                    videoElement.muted = true;
                    videoElement.autoplay = true;
                    videoElement.playsInline = true;
                    
                    // Clear any existing error states
                    videoElement.onerror = null;
                    videoElement.onloadedmetadata = null;
                    
                    // Set up error handling BEFORE setting stream
                    const handleVideoError = () => {
                        // If video fails, fall back to avatar
                        if (videoOverlay) videoOverlay.classList.add('hidden');
                        if (defaultView) defaultView.classList.remove('hidden');
                        participantCard.classList.remove('video-active');
                    };
                    
                    const handleVideoLoaded = () => {
                        // Video loaded successfully
                        if (videoOverlay) videoOverlay.classList.remove('hidden');
                        if (defaultView) defaultView.classList.add('hidden');
                        participantCard.classList.add('video-active');
                    };
                    
                    videoElement.onerror = handleVideoError;
                    videoElement.onloadedmetadata = handleVideoLoaded;
                    
                    // Set stream AFTER event handlers
                    videoElement.srcObject = mediaStream;
                    
                    // IMPROVED: Better video play handling to prevent black screens
                    const attemptPlay = () => {
                        const playPromise = videoElement.play();
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                // Play successful
                                handleVideoLoaded();
                            }).catch(e => {
                                // If autoplay fails, try with user interaction
                                videoElement.muted = true;
                                
                                // Try again after short delay
                                setTimeout(() => {
                                    videoElement.play().then(() => {
                                        handleVideoLoaded();
                                    }).catch(() => {
                                        // Still failing, show video but may be paused
                                        handleVideoLoaded();
                                    });
                                }, 100);
                            });
                        } else {
                            // No play promise, assume loaded
                            handleVideoLoaded();
                        }
                    };
                    
                    // Try to play immediately if metadata is already loaded
                    if (videoElement.readyState >= 1) {
                        attemptPlay();
                    } else {
                        // Wait for loadedmetadata event
                        videoElement.addEventListener('loadedmetadata', attemptPlay, { once: true });
                    }
                } else {
                    // Fallback to avatar if video setup fails
                    if (videoElement) videoElement.srcObject = null;
                    if (videoOverlay) videoOverlay.classList.add('hidden');
                    if (defaultView) defaultView.classList.remove('hidden');
                    participantCard.classList.remove('video-active');
                }
            } else {
                // Disable camera video - IMPROVED cleanup
                if (videoElement) {
                    // Clear event handlers first
                    videoElement.onerror = null;
                    videoElement.onloadedmetadata = null;
                    
                    // Properly clean up video element
                    const currentStream = videoElement.srcObject;
                    if (currentStream && typeof currentStream.getTracks === 'function') {
                        // Don't stop tracks as they might be used elsewhere
                        // Just clear the video element
                    }
                    videoElement.srcObject = null;
                    videoElement.load(); // Reset video element state
                }
                if (videoOverlay) videoOverlay.classList.add('hidden');
                if (defaultView) defaultView.classList.remove('hidden');
                participantCard.classList.remove('video-active');
            }
        }

        this.updateGridLayout();
    }    syncButtonStates() {
        if (!window.videoSDKManager) {
            return;
        }
        
        try {
            if (typeof window.videoSDKManager.getMicState === 'function') {
                const micState = window.videoSDKManager.getMicState();
                this.updateMicButton(micState);
            }

            if (typeof window.videoSDKManager.getWebcamState === 'function') {
                const webcamState = window.videoSDKManager.getWebcamState();
                this.updateVideoButton(webcamState);
            }

            if (typeof window.videoSDKManager.getDeafenState === 'function') {
                const deafenState = window.videoSDKManager.getDeafenState();
                this.updateDeafenButton(deafenState);
            }

            if (typeof window.videoSDKManager.getScreenShareState === 'function') {
                const screenState = window.videoSDKManager.getScreenShareState();
                this.updateScreenButton(screenState);
            }
        } catch (error) {
            // Silent error handling
        }
    }

    // Public method to refresh button states
    refresh() {
        this.syncButtonStates();
        this.refreshParticipantGrid();
        this.updateActivityStatus();
    }

    // Participant Management Methods
    handleParticipantJoined(e) {
        const { participant, participantObj } = e.detail;
        this.addParticipantToGrid(participant, participantObj);
        this.updateParticipantCount();
        this.updateActivityStatus();
    }

    handleParticipantLeft(e) {
        const { participant } = e.detail;
        this.removeParticipantFromGrid(participant);
        this.updateParticipantCount();
        this.updateActivityStatus();
    }

    handleMeetingJoined() {
        this.refreshParticipantGrid();
        this.updateParticipantCount();
        this.updateActivityStatus();
    }

    handleStreamEvent(e) {
        const { participant, stream, kind, data } = e.detail;
        const eventType = e.type;
        const isEnabled = eventType === 'videosdkStreamEnabled';
        
        // ABSOLUTE RULE: ANY screen share detection = separate card ONLY
        if (kind === 'share' || (stream && this.isScreenShareStream(stream))) {
            if (isEnabled && stream) {
                this.createScreenShareCard(participant, stream);
            } else {
                this.removeScreenShareCard(participant);
            }
            this.updateGridLayout();
            return; // EARLY EXIT - no further processing
        }
        
        // Extra safety check for video events - FORCE screen detection
        if (kind === 'video' && stream && isEnabled) {
            const label = stream.track?.label?.toLowerCase() || '';
            if (label.includes('screen') || 
                label.includes('display') ||
                label.includes('web-contents-media-stream') ||
                label.includes('browser-capture') ||
                label.includes('screencapture')) {
                this.createScreenShareCard(participant, stream);
                this.updateGridLayout();
                return; // EARLY EXIT
            }
            
            // Additional check for MediaStream video tracks
            if (stream instanceof MediaStream) {
                const videoTracks = stream.getVideoTracks();
                for (const track of videoTracks) {
                    const trackLabel = track.label?.toLowerCase() || '';
                    if (trackLabel.includes('screen') || 
                        trackLabel.includes('display') ||
                        trackLabel.includes('web-contents-media-stream') ||
                        trackLabel.includes('browser-capture') ||
                        trackLabel.includes('screencapture')) {
                        this.createScreenShareCard(participant, stream);
                        this.updateGridLayout();
                        return; // EARLY EXIT
                    }
                }
            }
        }
        
        // Only handle legitimate camera/webcam video for participant overlays
        if (kind === 'video') {
            this.updateParticipantStream(participant, isEnabled ? stream : null, 'video');
        }
        
        setTimeout(() => {
            this.updateGridLayout();
        }, 100);
    }

    addParticipantToGrid(participantId, participantObj) {
        const grid = document.getElementById('participantGrid');
        if (!grid) {
            return;
        }

        if (grid.querySelector(`[data-participant-id="${participantId}"]`)) {
            return;
        }

        const participantElement = this.createParticipantElement(participantId, participantObj);
        grid.appendChild(participantElement);
        
        setTimeout(() => {
            this.checkParticipantStreams(participantObj);
        }, 100);
        
        this.updateGridLayout();
    }

    removeParticipantFromGrid(participantId) {
        const grid = document.getElementById('participantGrid');
        if (!grid) return;

        // Remove participant card
        const element = grid.querySelector(`[data-participant-id="${participantId}"]`);
        if (element) {
            element.remove();
        }

        // Also remove associated screen share card if it exists
        this.removeScreenShareCard(participantId);
        
        this.updateGridLayout();
    }

    createParticipantElement(participantId, participantObj) {
        const participant = document.createElement('div');
        participant.className = 'participant-card bg-[#2f3136] rounded-lg p-4 flex flex-col items-center justify-center relative border border-[#40444b] hover:border-[#5865f2] transition-all duration-200';
        participant.setAttribute('data-participant-id', participantId);

        const name = participantObj?.displayName || participantObj?.name || 'Unknown';
        // Clean display name by removing user ID suffix if present
        const displayName = name.includes('_') && !isNaN(name.split('_').pop()) ? 
            name.substring(0, name.lastIndexOf('_')) : name;
        const isLocal = participantId === window.videoSDKManager?.meeting?.localParticipant?.id;

        participant.innerHTML = `
            <!-- Full card video overlay (hidden by default) -->
            <div class="participant-video-overlay hidden absolute inset-0 rounded-lg overflow-hidden z-20">
                <video class="w-full h-full object-cover rounded-lg" autoplay muted playsinline></video>
                
                <!-- Video overlay info -->
                <div class="video-overlay-info absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 flex items-center justify-between">
                    <span class="text-white text-sm font-medium truncate">${displayName}${isLocal ? ' (You)' : ''}</span>
                    <div class="flex items-center space-x-1">
                        <!-- Voice indicator -->
                        <div class="voice-indicator w-3 h-3 rounded-full bg-[#3ba55c] hidden animate-pulse"></div>
                        <!-- Muted indicator -->
                        <div class="muted-indicator w-3 h-3 rounded-full bg-[#ed4245] ${isLocal && !window.videoSDKManager?.getMicState() ? '' : 'hidden'} flex items-center justify-center">
                            <i class="fas fa-microphone-slash text-xs text-white"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Default avatar view -->
            <div class="participant-default-view flex flex-col items-center justify-center w-full h-full">
                <div class="participant-avatar w-16 h-16 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-xl mb-3 relative ${isLocal ? 'local-participant' : ''} overflow-hidden">
                    <img class="participant-avatar-img w-full h-full object-cover rounded-full hidden" src="" alt="${displayName}">
                    <span class="participant-initials">${this.getInitials(displayName)}</span>
                    
                    <!-- Voice indicator -->
                    <div class="voice-indicator absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#3ba55c] border-2 border-[#2f3136] hidden z-20">
                        <div class="w-full h-full rounded-full bg-[#3ba55c] animate-pulse"></div>
                    </div>
                    
                    <!-- Muted indicator -->
                    <div class="muted-indicator absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-[#ed4245] border-2 border-[#2f3136] ${isLocal && !window.videoSDKManager?.getMicState() ? '' : 'hidden'} flex items-center justify-center z-20">
                        <i class="fas fa-microphone-slash text-xs text-white"></i>
                    </div>
                </div>
                
                <span class="participant-name text-white text-sm font-medium text-center mb-2 max-w-full truncate">
                    ${name}${isLocal ? ' (You)' : ''}
                </span>
            </div>
        `;

        // Add double-click handler for fullscreen
        participant.addEventListener('dblclick', () => {
            // Double-click detected for participant
            this.toggleParticipantFullscreen(participantId);
        });
        
        // Add single click handler for interaction feedback
        participant.addEventListener('click', () => {
            participant.style.transform = 'scale(0.98)';
            setTimeout(() => {
                participant.style.transform = '';
            }, 150);
        });

        // Load real profile picture
        this.loadParticipantAvatar(participant, participantId, name, isLocal);

        return participant;
    }

    createScreenShareCard(participantId, stream) {
        const grid = document.getElementById('participantGrid');
        if (!grid) {
            return;
        }

        // Check if screen share card already exists
        const existingCard = grid.querySelector(`[data-screen-share-id="${participantId}"]`);
        if (existingCard) {
            const video = existingCard.querySelector('.screen-share-video');
            if (video && stream) {
                let mediaStream;
                if (stream instanceof MediaStream) {
                    mediaStream = stream;
                } else if (stream.track) {
                    mediaStream = new MediaStream([stream.track]);
                } else if (stream.stream) {
                    mediaStream = stream.stream;
                }
                
                if (mediaStream) {
                    video.srcObject = mediaStream;
                    video.play().catch(e => {
                        // Silent error handling for video play failure
                    });
                }
            }
            return;
        }

        // Get participant name for the screen share card
        const participantElement = document.querySelector(`[data-participant-id="${participantId}"]`);
        const participantName = participantElement?.querySelector('.participant-name')?.textContent || 'Unknown';

        // Create screen share card
        const screenShareCard = document.createElement('div');
        screenShareCard.className = 'screen-share-card bg-[#1e1f22] rounded-lg p-3 flex flex-col items-center justify-center relative border-2 border-[#5865f2] transition-all duration-200';
        screenShareCard.setAttribute('data-screen-share-id', participantId);

        screenShareCard.innerHTML = `
            <div class="screen-share-header w-full mb-2 flex items-center justify-center">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-desktop text-[#5865f2] text-sm"></i>
                    <span class="text-white text-sm font-medium">${participantName} - Screen Share</span>
                </div>
            </div>
            
            <div class="screen-share-content w-full flex-1 bg-[#000] rounded border border-[#40444b] relative overflow-hidden min-h-[200px]">
                <video class="screen-share-video w-full h-full object-contain" autoplay muted playsinline></video>
                <div class="screen-share-loading absolute inset-0 flex items-center justify-center text-[#72767d] bg-[#1e1f22]/80">
                    <div class="flex flex-col items-center space-y-2">
                        <i class="fas fa-desktop text-2xl"></i>
                        <span class="text-sm">Loading screen share...</span>
                    </div>
                </div>
            </div>
        `;

        // Add double-click handler for fullscreen
        screenShareCard.addEventListener('dblclick', () => {
            // Double-click detected on screen share
            this.toggleParticipantFullscreen(participantId);
        });
        
        // Add single click feedback
        const videoContainer = screenShareCard.querySelector('.screen-share-content');
        if (videoContainer) {
            videoContainer.addEventListener('click', () => {
                screenShareCard.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    screenShareCard.style.transform = '';
                }, 150);
            });
        }

        // Set up the video stream
        const video = screenShareCard.querySelector('.screen-share-video');
        const loading = screenShareCard.querySelector('.screen-share-loading');
        
        if (video && stream) {
            let mediaStream;
            if (stream instanceof MediaStream) {
                mediaStream = stream;
            } else if (stream.track) {
                mediaStream = new MediaStream([stream.track]);
            } else if (stream.stream) {
                mediaStream = stream.stream;
            }
            
            if (mediaStream) {
                // IMPROVED: Better screen share video setup to prevent black screens
                video.muted = true;
                video.autoplay = true;
                video.playsInline = true;
                
                const handleVideoLoaded = () => {
                    if (loading) loading.classList.add('hidden');
                    this.updateGridLayout();
                };
                
                const handleVideoError = () => {
                    if (loading) {
                        loading.innerHTML = `
                            <div class="flex flex-col items-center space-y-2">
                                <i class="fas fa-exclamation-triangle text-[#ed4245] text-2xl"></i>
                                <span class="text-sm text-[#ed4245]">Failed to load screen share</span>
                            </div>
                        `;
                    }
                };
                
                video.addEventListener('loadedmetadata', handleVideoLoaded);
                video.addEventListener('error', handleVideoError);
                
                video.srcObject = mediaStream;
                
                // IMPROVED: Better play handling for screen share
                const attemptPlay = () => {
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            handleVideoLoaded();
                        }).catch(e => {
                            // Try again with explicit settings
                            video.muted = true;
                            setTimeout(() => {
                                video.play().then(() => {
                                    handleVideoLoaded();
                                }).catch(() => {
                                    // Still failing, but show video element
                                    handleVideoLoaded();
                                });
                            }, 100);
                        });
                    } else {
                        handleVideoLoaded();
                    }
                };
                
                if (video.readyState >= 1) {
                    attemptPlay();
                } else {
                    video.addEventListener('loadedmetadata', attemptPlay, { once: true });
                }
            }
        }

        // Add the card to the grid
        grid.appendChild(screenShareCard);
        this.updateGridLayout();
    }

    removeScreenShareCard(participantId) {
        const grid = document.getElementById('participantGrid');
        if (!grid) return;

        const screenShareCard = grid.querySelector(`[data-screen-share-id="${participantId}"]`);
        if (screenShareCard) {
            // IMPROVED: Clean up video stream properly
            const video = screenShareCard.querySelector('.screen-share-video');
            if (video) {
                // Clear event handlers first
                video.onloadedmetadata = null;
                video.onerror = null;
                
                // Clean up stream without stopping tracks (they might be used elsewhere)
                if (video.srcObject) {
                    video.srcObject = null;
                }
                video.load(); // Reset video element state
            }
            
            screenShareCard.remove();
            this.updateGridLayout();
        }
    }

    updateAudioIndicator(element, stream) {
        const voiceIndicator = element.querySelector('.voice-indicator');
        const mutedIndicator = element.querySelector('.muted-indicator');

        // Check if stream exists and is enabled
        const isStreamActive = stream && stream.track && stream.track.enabled;

        if (isStreamActive) {
            voiceIndicator.classList.remove('hidden');
            mutedIndicator.classList.add('hidden');
        } else {
            voiceIndicator.classList.add('hidden');
            mutedIndicator.classList.remove('hidden');
        }
    }

    updateLocalParticipantIndicator(type, state) {
        if (!window.videoSDKManager?.meeting?.localParticipant) return;
        
        const localParticipantId = window.videoSDKManager.meeting.localParticipant.id;
        const element = document.querySelector(`[data-participant-id="${localParticipantId}"]`);
        
        if (!element) return;
        
        if (type === 'mic') {
            const voiceIndicator = element.querySelector('.voice-indicator');
            const mutedIndicator = element.querySelector('.muted-indicator');
            
            if (state) { // Mic is on
                voiceIndicator.classList.remove('hidden');
                mutedIndicator.classList.add('hidden');
            } else { // Mic is off/muted
                voiceIndicator.classList.add('hidden');
                mutedIndicator.classList.remove('hidden');
            }
        }
    }

    updateGridLayout() {
        const grid = document.getElementById('participantGrid');
        if (!grid) return;

        const participants = grid.querySelectorAll('.participant-card');
        const count = participants.length;

        // Update grid layout based on participant count
        if (count === 1) {
            grid.className = 'w-full h-full grid gap-3 auto-rows-fr grid-cols-1 place-items-center';
        } else if (count === 2) {
            grid.className = 'w-full h-full grid gap-3 auto-rows-fr grid-cols-2';
        } else if (count <= 4) {
            grid.className = 'w-full h-full grid gap-3 auto-rows-fr grid-cols-2';
        } else if (count <= 9) {
            grid.className = 'w-full h-full grid gap-3 auto-rows-fr grid-cols-3';
        } else {
            grid.className = 'w-full h-full grid gap-3 auto-rows-fr grid-cols-4 overflow-y-auto';
        }
    }

    updateParticipantCount() {
        const countElement = document.getElementById('voiceParticipantCount');
        if (!countElement) return;

        const grid = document.getElementById('participantGrid');
        const count = grid ? grid.querySelectorAll('.participant-card').length : 0;
        countElement.textContent = count.toString();
    }

    refreshParticipantGrid() {
        const grid = document.getElementById('participantGrid');
        if (!grid) return;

        grid.innerHTML = '';

        if (window.videoSDKManager?.meeting?.participants) {
            const participants = Array.from(window.videoSDKManager.meeting.participants.values());
            participants.forEach(participant => {
                this.addParticipantToGrid(participant.id, participant);
                this.checkParticipantStreams(participant);
            });

            const localParticipant = window.videoSDKManager.meeting.localParticipant;
            if (localParticipant && !grid.querySelector(`[data-participant-id="${localParticipant.id}"]`)) {
                this.addParticipantToGrid(localParticipant.id, localParticipant);
                this.checkParticipantStreams(localParticipant);
            }
        }

        this.updateParticipantCount();
    }

    checkParticipantStreams(participant) {
        if (!participant || !participant.streams) return;
        
        // Add debouncing to prevent rapid re-processing 
        if (this.isStreamAlreadyProcessing(participant.id, 'check-streams', 'all')) {
            return;
        }
        
        participant.streams.forEach((stream, streamId) => {
            if (stream && stream.track && stream.track.kind === 'video') {
                // PRIORITY 1: Check if the stream object itself says it's a share
                if (stream.kind === 'share') {
                    this.updateParticipantStream(participant.id, stream, 'share');
                    return;
                }
                
                // PRIORITY 2: Check track label for screen share indicators
                const label = stream.track.label?.toLowerCase() || '';
                const isScreenShare = label.includes('screen') || 
                                    label.includes('display') ||
                                    label.includes('web-contents-media-stream') ||
                                    label.includes('browser-capture') ||
                                    label.includes('screencapture');
                
                if (isScreenShare) {
                    this.updateParticipantStream(participant.id, stream, 'share');
                } else {
                    this.updateParticipantStream(participant.id, stream, 'video');
                }
            }
        });
    }

    getInitials(name) {
        if (!name) return '?';
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }

    toggleParticipantFullscreen(participantId) {
        const element = document.querySelector(`[data-participant-id="${participantId}"]`);
        if (!element) {
            return;
        }

        // Try to find video from video overlay first, then screen share
        let video = element.querySelector('.participant-video-overlay video');
        let isScreenShare = false;
        
        if (!video || !video.srcObject) {
            video = element.querySelector('.screen-share-video');
            isScreenShare = true;
        }
        
        if (!video || !video.srcObject) {
            return;
        }

        // Create fullscreen overlay
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-overlay fixed inset-0 bg-black/95 flex items-center justify-center z-[9999] backdrop-blur-sm';
        
        const fullscreenContainer = document.createElement('div');
        fullscreenContainer.className = 'fullscreen-participant relative max-w-[95vw] max-h-[95vh] min-w-[400px] min-h-[300px] bg-[#1e1f22] rounded-lg overflow-hidden border-2 border-[#5865f2] shadow-2xl';
        
        const fullscreenVideo = document.createElement('video');
        fullscreenVideo.className = 'w-full h-full object-contain bg-black';
        fullscreenVideo.srcObject = video.srcObject;
        fullscreenVideo.autoplay = true;
        fullscreenVideo.muted = true;
        fullscreenVideo.playsInline = true;
        
        // Get participant name
        const nameElement = element.querySelector('.participant-name, .video-overlay-info span');
        const participantName = nameElement?.textContent?.trim() || 'Unknown Participant';
        
        // Create header with participant info
        const header = document.createElement('div');
        header.className = 'absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10';
        header.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-${isScreenShare ? 'desktop' : 'video'} text-[#5865f2] text-lg"></i>
                    <span class="text-white font-semibold text-lg">${participantName}</span>
                    <span class="text-gray-300 text-sm">${isScreenShare ? 'Screen Share' : 'Camera'}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="minimize-btn w-10 h-10 bg-[#ed4245] hover:bg-[#da373c] rounded-full flex items-center justify-center transition-colors">
                        <i class="fas fa-times text-white"></i>
                    </button>
                </div>
            </div>
        `;
        
        const minimizeBtn = header.querySelector('.minimize-btn');
        minimizeBtn.onclick = () => {
            overlay.style.opacity = '0';
            overlay.style.transform = 'scale(0.95)';
            setTimeout(() => overlay.remove(), 200);
        };
        
        // Instructions
        const instructions = document.createElement('div');
        instructions.className = 'absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-sm text-center opacity-80';
        instructions.innerHTML = 'Press <strong>ESC</strong> to exit fullscreen • Click outside to close';
        
        fullscreenContainer.appendChild(fullscreenVideo);
        fullscreenContainer.appendChild(header);
        fullscreenContainer.appendChild(instructions);
        overlay.appendChild(fullscreenContainer);
        
        // Add animation
        overlay.style.opacity = '0';
        overlay.style.transform = 'scale(0.95)';
        document.body.appendChild(overlay);
        
        // Animate in
        requestAnimationFrame(() => {
            overlay.style.transition = 'all 0.2s ease-out';
            overlay.style.opacity = '1';
            overlay.style.transform = 'scale(1)';
        });

        // Close handlers
        const closeFullscreen = () => {
            overlay.style.opacity = '0';
            overlay.style.transform = 'scale(0.95)';
            setTimeout(() => overlay.remove(), 200);
            document.removeEventListener('keydown', escHandler);
        };
        
        // ESC key handler
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeFullscreen();
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeFullscreen();
            }
        });
        
        // Hide instructions after 5 seconds
        setTimeout(() => {
            if (instructions) {
                instructions.style.opacity = '0';
            }
        }, 5000);
    }

    updateActivityStatus() {
        // Update presence activity to reflect current voice state
        if (!window.globalSocketManager?.isReady()) return;

        const channelName = sessionStorage.getItem('voiceChannelName') || 'Voice Channel';
        const participantCount = document.querySelectorAll('[data-participant-id]').length;
        
        const activityDetails = {
            type: `In Voice - ${channelName}`,
            state: `${participantCount} participant${participantCount !== 1 ? 's' : ''}`,
            details: channelName,
            startTimestamp: Date.now()
        };

        window.globalSocketManager.updatePresence('dnd', activityDetails, 'voice-call-section');
    }

    syncAllParticipantStreams() {
        if (!window.videoSDKManager?.meeting) return;
        
        const grid = document.getElementById('participantGrid');
        if (!grid) return;
        
        const participants = Array.from(window.videoSDKManager.meeting.participants.values());
        const localParticipant = window.videoSDKManager.meeting.localParticipant;
        
        if (localParticipant) {
            participants.push(localParticipant);
        }
        
        participants.forEach(participant => {
            const participantCard = grid.querySelector(`[data-participant-id="${participant.id}"]`);
            if (participantCard && participant.streams) {
                this.checkParticipantStreams(participant);
            }
        });
    }

    // Helper method to detect if a stream is a screen share
    isScreenShareStream(stream) {
        if (!stream) {
            return false;
        }
        
        // Check MediaStream format
        if (stream instanceof MediaStream) {
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length > 0) {
                const track = videoTracks[0];
                const label = track.label?.toLowerCase() || '';
                const isScreen = label.includes('screen') || 
                               label.includes('display') ||
                               label.includes('web-contents-media-stream') ||
                               label.includes('browser-capture') ||
                               label.includes('screencapture');
                return isScreen;
            }
        }
        
        // Check nested stream format
        if (stream.stream instanceof MediaStream) {
            const videoTracks = stream.stream.getVideoTracks();
            if (videoTracks.length > 0) {
                const track = videoTracks[0];
                const label = track.label?.toLowerCase() || '';
                const isScreen = label.includes('screen') || 
                               label.includes('display') ||
                               label.includes('web-contents-media-stream') ||
                               label.includes('browser-capture') ||
                               label.includes('screencapture');
                return isScreen;
            }
        }
        
        // Check track-based format
        if (stream.track && stream.track.kind === 'video') {
            const label = stream.track.label?.toLowerCase() || '';
            const isScreen = label.includes('screen') || 
                           label.includes('display') || 
                           label.includes('web-contents-media-stream') ||
                           label.includes('browser-capture') ||
                           label.includes('screencapture');
            return isScreen;
        }
        
        return false;
    }

    // Helper method to compare if a stream is a screen share
    isSameStream(stream1, stream2) {
        if (!stream1 || !stream2) return false;
        
        // Get tracks from both streams
        let tracks1 = [];
        let tracks2 = [];
        
        if (stream1 instanceof MediaStream) {
            tracks1 = stream1.getTracks();
        }
        
        if (stream2 instanceof MediaStream) {
            tracks2 = stream2.getTracks();
        } else if (stream2.track) {
            tracks2 = [stream2.track];
        } else if (stream2.stream instanceof MediaStream) {
            tracks2 = stream2.stream.getTracks();
        }
        
        // Compare track IDs
        if (tracks1.length > 0 && tracks2.length > 0) {
            return tracks1.some(t1 => tracks2.some(t2 => t1.id === t2.id));
        }
        
        return false;
    }

    // REMOVED: All complex cleaning functions
    // Screen share should NEVER be set on participant overlays in the first place

    isStreamAlreadyProcessing(participantId, streamId, action) {
        const key = `${participantId}-${streamId}-${action}`;
        const now = Date.now();
        const lastProcessed = this.streamProcessingDebounce.get(key);
        
        // Debounce for 1000ms to prevent rapid re-processing
        if (lastProcessed && (now - lastProcessed) < 1000) {
            return true;
        }
        
        this.streamProcessingDebounce.set(key, now);
        return false;
    }

    // Safety monitor to prevent screen share in participant overlays
    startVideoOverlaySafetyMonitor() {
        // REMOVED: This was causing blinking by constantly re-processing streams
    }

    loadParticipantAvatar(participantElement, participantId, name, isLocal) {
        // Get the avatar image element
        const avatarImg = participantElement.querySelector('.participant-avatar-img');
        const avatarContainer = participantElement.querySelector('.participant-avatar');
        const initialsSpan = participantElement.querySelector('.participant-initials');
        
        if (!avatarImg || !avatarContainer || !initialsSpan) return;
        
        // For local user, get avatar from meta tags or session
        if (isLocal) {
            const userAvatar = document.querySelector('meta[name="user-avatar"]')?.content || 
                              document.querySelector('meta[name="username"]')?.getAttribute('data-avatar') ||
                              '/public/assets/common/default-profile-picture.png';
            
            if (userAvatar && userAvatar !== '/public/assets/common/default-profile-picture.png') {
                avatarImg.src = userAvatar;
                avatarImg.onload = () => {
                    avatarImg.classList.remove('hidden');
                    initialsSpan.classList.add('hidden');
                };
                avatarImg.onerror = () => {
                    // Keep initials visible if image fails to load
                    avatarImg.classList.add('hidden');
                    initialsSpan.classList.remove('hidden');
                };
            }
            return;
        }
        
        // For remote users, try to fetch from user API
        if (!window.userAPI) {
            console.warn('UserAPI not available for fetching participant avatar');
            return;
        }
        
        // Extract user ID from participant ID if it's a valid format
        let userId = participantId;
        
        // Try multiple methods to extract user ID
        if (typeof participantId === 'string') {
            // Method 1: Extract from participant name format "username_userid"
            if (participantId.includes('_')) {
                const parts = participantId.split('_');
                if (parts.length > 1 && !isNaN(parts[parts.length - 1])) {
                    userId = parts[parts.length - 1];
                }
            }
        }
        
        // Method 2: Extract from participant name format "username_userid"
        if (name && typeof name === 'string' && name.includes('_')) {
            const nameParts = name.split('_');
            if (nameParts.length > 1 && !isNaN(nameParts[nameParts.length - 1])) {
                userId = nameParts[nameParts.length - 1];
            }
        }
        
        // Method 3: Get from meta tag if local user
        if (isLocal) {
            const userIdMeta = document.querySelector('meta[name="user-id"]')?.content;
            if (userIdMeta && !isNaN(userIdMeta)) {
                userId = userIdMeta;
            }
        }
        
        // Fetch user profile to get avatar
        window.userAPI.getUserProfile(userId)
            .then(response => {
                if (response.success && response.data && response.data.user) {
                    const user = response.data.user;
                    if (user.avatar_url && user.avatar_url !== '/public/assets/common/default-profile-picture.png') {
                        avatarImg.src = user.avatar_url;
                        avatarImg.onload = () => {
                            avatarImg.classList.remove('hidden');
                            initialsSpan.classList.add('hidden');
                        };
                        avatarImg.onerror = () => {
                            // Keep initials visible if image fails to load
                            avatarImg.classList.add('hidden');
                            initialsSpan.classList.remove('hidden');
                        };
                    }
                }
            })
            .catch(error => {
                console.warn('Failed to fetch user profile for avatar:', error);
                // Keep initials visible if API call fails
            });
    }
}

// Initialize voice call section when this script loads
if (typeof window !== 'undefined') {
    window.voiceCallSection = new VoiceCallSection();
}