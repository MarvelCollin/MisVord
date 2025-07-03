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
        
        console.log('🎮 [VoiceCallSection] Initializing voice controls...');
        
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
        console.log('✅ [VoiceCallSection] Voice controls initialized');
        
        // Start safety monitor to prevent screen share in participant overlays
        this.startVideoOverlaySafetyMonitor();
        
        setInterval(() => {
            if (window.videoSDKManager?.isMeetingJoined) {
                this.syncButtonStates();
                this.syncAllParticipantStreams();
            }
        }, 3000);
        
        setTimeout(() => {
            this.retryInitialization();
        }, 1000);
        
        this.startVideoOverlaySafetyMonitor();
    }

    retryInitialization() {
        // Retry initialization if VideoSDK is not ready yet
        if (!window.videoSDKManager?.isMeetingJoined) {
            console.log('🔄 [VoiceCallSection] VideoSDK not ready, retrying initialization...');
            setTimeout(() => {
                if (window.videoSDKManager?.isMeetingJoined) {
                    console.log('✅ [VoiceCallSection] VideoSDK ready, syncing states');
                    this.syncButtonStates();
                    this.refreshParticipantGrid();
                } else {
                    console.log('⏳ [VoiceCallSection] VideoSDK still not ready, will continue periodic checks');
                }
            }, 2000);
        }
    }

    updateGridLayout() {
        const grid = document.getElementById('participantGrid');
        if (!grid) return;

        const participants = grid.querySelectorAll('.participant-card, .video-participant-card, .screen-share-card');
        const count = participants.length;

        console.log(`🔄 [VoiceCallSection] Updating grid layout for ${count} participants`);

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
            
            console.log('🎤 [VoiceCallSection] Mic button clicked');
            
            if (window.videoSDKManager && typeof window.videoSDKManager.toggleMic === 'function') {
                try {
                    const newState = window.videoSDKManager.toggleMic();
                    console.log('🎤 [VoiceCallSection] Mic toggle result:', newState);
                    this.updateMicButton(newState);
                } catch (error) {
                    console.error('🎤 [VoiceCallSection] Error toggling mic:', error);
                }
            } else {
                console.warn('VideoSDK manager not available for mic toggle');
            }
        });
    }

    bindVideoButton() {
        if (!this.videoBtn) return;
        
        this.videoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('📹 [VoiceCallSection] Video button clicked');
            
            if (window.videoSDKManager && typeof window.videoSDKManager.toggleWebcam === 'function') {
                try {
                    const newState = await window.videoSDKManager.toggleWebcam();
                    console.log('📹 [VoiceCallSection] Video toggle result:', newState);
                    this.updateVideoButton(newState);
                } catch (error) {
                    console.error('📹 [VoiceCallSection] Error toggling video:', error);
                }
            } else {
                console.warn('VideoSDK manager not available for video toggle');
            }
        });
    }

    bindDeafenButton() {
        if (!this.deafenBtn) return;
        
        this.deafenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔇 [VoiceCallSection] Deafen button clicked');
            
            if (window.videoSDKManager && typeof window.videoSDKManager.toggleDeafen === 'function') {
                const newState = window.videoSDKManager.toggleDeafen();
                this.updateDeafenButton(newState);
            } else {
                console.warn('VideoSDK manager not available for deafen toggle');
            }
        });
    }

    bindScreenButton() {
        if (!this.screenBtn) return;
        
        this.screenBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🖥️ [VoiceCallSection] Screen share button clicked');
            
            if (window.videoSDKManager && typeof window.videoSDKManager.toggleScreenShare === 'function') {
                try {
                    const newState = await window.videoSDKManager.toggleScreenShare();
                    this.updateScreenButton(newState);
                } catch (error) {
                    console.error('Error toggling screen share:', error);
                }
            } else {
                console.warn('VideoSDK manager not available for screen share toggle');
            }
        });
    }

    bindTicTacToeButton() {
        if (!this.ticTacToeBtn) return;
        
        this.ticTacToeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🎯 [VoiceCallSection] Tic Tac Toe button clicked');
            // TODO: Implement Tic Tac Toe game functionality
        });
    }

    bindDisconnectButton() {
        if (!this.disconnectBtn) return;
        
        this.disconnectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('📞 [VoiceCallSection] Disconnect button clicked');
            
            if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
                window.voiceManager.leaveVoice();
            } else {
                console.warn('Voice manager not available for disconnect');
            }
        });
    }

    handleVoiceStateChanged(e) {
        const { type, state } = e.detail;
        
        console.log(`🔄 [VoiceCallSection] Voice state changed: ${type} = ${state}`);
        
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
                    console.log(`📹 [VoiceCallSection] Manually updating camera stream for local participant: ${localId}`);
                    
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
                                console.log('📹 [VoiceCallSection] Found webcam stream, updating video');
                                this.updateParticipantStream(localId, webcamStream, 'video');
                            } else {
                                console.warn('📹 [VoiceCallSection] No webcam stream found');
                            }
                        }
                    } else {
                        console.log('📹 [VoiceCallSection] Camera disabled, removing video stream');
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
                    console.log(`🖥️ [VoiceCallSection] Manually updating screen share for local participant: ${localId}`);
                    
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
                                console.log('🖥️ [VoiceCallSection] Found screen share stream, creating card');
                                this.updateParticipantStream(localId, shareStream, 'share');
                            } else {
                                console.warn('🖥️ [VoiceCallSection] No screen share stream found');
                            }
                        }
                    } else {
                        console.log('🖥️ [VoiceCallSection] Screen share disabled, removing card');
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
        console.log(`🎥 [VoiceCallSection] Updating ${kind} stream for participant:`, participantId, stream);
        
        // DEEP DEBUG: Log all stream details
        if (stream) {
            console.log(`🔍 [VoiceCallSection] DEEP DEBUG - Stream analysis:`, {
                participantId,
                kind,
                streamType: typeof stream,
                isMediaStream: stream instanceof MediaStream,
                hasTrack: !!stream.track,
                trackLabel: stream.track?.label,
                trackKind: stream.track?.kind,
                hasStream: !!stream.stream,
                nestedStreamType: stream.stream ? typeof stream.stream : 'none',
                videoTracks: stream instanceof MediaStream ? stream.getVideoTracks().map(t => ({label: t.label, kind: t.kind})) : 'not MediaStream',
                allProps: Object.keys(stream)
            });
        }
        
        // ENHANCED SCREEN SHARE DETECTION
        let isScreenShare = false;
        if (kind === 'share') {
            isScreenShare = true;
            console.log(`🖥️ [VoiceCallSection] SCREEN SHARE - Detected by kind parameter`);
        } else if (stream && this.isScreenShareStream(stream)) {
            isScreenShare = true;
            console.log(`🖥️ [VoiceCallSection] SCREEN SHARE - Detected by isScreenShareStream method`);
        }
        
        // ABSOLUTE RULE: Screen share ONLY goes to separate cards, NEVER to participant overlays
        if (isScreenShare) {
            console.log(`🖥️ [VoiceCallSection] SCREEN SHARE CONFIRMED - ONLY creating separate card`);
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
            console.log(`🎥 [VoiceCallSection] Processing VIDEO kind for participant overlay: ${participantId}`);
            
            const participantCard = document.querySelector(`[data-participant-id="${participantId}"]`);
            if (!participantCard) {
                console.warn(`🎥 [VoiceCallSection] Participant card not found for ${participantId}`);
                return;
            }

            const videoOverlay = participantCard.querySelector('.participant-video-overlay');
            const videoElement = videoOverlay?.querySelector('video');
            const defaultView = participantCard.querySelector('.participant-default-view');

            if (stream) {
                console.log(`🎥 [VoiceCallSection] Setting video stream for participant ${participantId}`);
                
                // TRIPLE CHECK: Absolutely ensure this is NOT screen share
                if (this.isScreenShareStream(stream)) {
                    console.error(`🚫 [VoiceCallSection] BLOCKED: Screen share trying to enter video path - redirecting`);
                    this.updateParticipantStream(participantId, stream, 'share');
                    return;
                }
                
                let mediaStream;
                if (stream instanceof MediaStream) {
                    mediaStream = stream;
                    console.log(`🎥 [VoiceCallSection] Using direct MediaStream`);
                } else if (stream.track) {
                    mediaStream = new MediaStream([stream.track]);
                    console.log(`🎥 [VoiceCallSection] Created MediaStream from track`);
                } else if (stream.stream) {
                    mediaStream = stream.stream;
                    console.log(`🎥 [VoiceCallSection] Using nested stream`);
                } else {
                    console.warn(`🎥 [VoiceCallSection] Invalid stream format for ${participantId}:`, stream);
                    return;
                }
                
                // FINAL SCREEN SHARE CHECK before setting video
                const tracks = mediaStream.getVideoTracks();
                if (tracks.length > 0) {
                    const track = tracks[0];
                    const label = track.label?.toLowerCase() || '';
                    console.log(`🎥 [VoiceCallSection] FINAL CHECK - Track label: "${label}"`);
                    if (label.includes('screen') || 
                        label.includes('display') ||
                        label.includes('web-contents-media-stream') ||
                        label.includes('browser-capture') ||
                        label.includes('screencapture')) {
                        console.error(`🚫 [VoiceCallSection] FINAL BLOCK: Screen share detected in camera path - REJECTED`);
                        this.updateParticipantStream(participantId, stream, 'share');
                        return;
                    }
                }
                
                console.log(`✅ [VoiceCallSection] SAFE TO PROCEED - Setting camera video for participant ${participantId}`);
                
                if (videoElement && mediaStream) {
                    videoElement.srcObject = mediaStream;
                    videoElement.play().catch(e => console.warn('Video play failed:', e));
                    
                    if (videoOverlay) videoOverlay.classList.remove('hidden');
                    if (defaultView) defaultView.classList.add('hidden');
                    participantCard.classList.add('video-active');
                    
                    console.log(`🎥 [VoiceCallSection] CAMERA video enabled for ${participantId}`);
                } else {
                    console.warn(`🎥 [VoiceCallSection] Video element not found for ${participantId}`);
                }
            } else {
                // Disable camera video
                if (videoElement) videoElement.srcObject = null;
                if (videoOverlay) videoOverlay.classList.add('hidden');
                if (defaultView) defaultView.classList.remove('hidden');
                participantCard.classList.remove('video-active');
                
                console.log(`🎥 [VoiceCallSection] Camera disabled, showing avatar for ${participantId}`);
            }
        }

        this.updateGridLayout();
    }

    syncButtonStates() {
        if (!window.videoSDKManager) {
            console.warn('🚫 [VoiceCallSection] VideoSDK manager not available for button sync');
            return;
        }
        
        console.log('🔄 [VoiceCallSection] Syncing button states with VideoSDK...');
        
        try {
            if (typeof window.videoSDKManager.getMicState === 'function') {
                const micState = window.videoSDKManager.getMicState();
                console.log('🎤 [VoiceCallSection] Mic state:', micState);
                this.updateMicButton(micState);
            }
            
            if (typeof window.videoSDKManager.getWebcamState === 'function') {
                const webcamState = window.videoSDKManager.getWebcamState();
                console.log('📹 [VoiceCallSection] Webcam state:', webcamState);
                this.updateVideoButton(webcamState);
            }
            
            if (typeof window.videoSDKManager.getDeafenState === 'function') {
                const deafenState = window.videoSDKManager.getDeafenState();
                console.log('🔇 [VoiceCallSection] Deafen state:', deafenState);
                this.updateDeafenButton(deafenState);
            }
            
            if (typeof window.videoSDKManager.getScreenShareState === 'function') {
                const screenState = window.videoSDKManager.getScreenShareState();
                console.log('🖥️ [VoiceCallSection] Screen share state:', screenState);
                this.updateScreenButton(screenState);
            }
            
            console.log('✅ [VoiceCallSection] Button states synced successfully');
        } catch (error) {
            console.error('❌ [VoiceCallSection] Error syncing button states:', error);
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
        console.log(`👤 [VoiceCallSection] Participant joined: ${participant}`);
        this.addParticipantToGrid(participant, participantObj);
        this.updateParticipantCount();
        this.updateActivityStatus();
    }

    handleParticipantLeft(e) {
        const { participant } = e.detail;
        console.log(`👋 [VoiceCallSection] Participant left: ${participant}`);
        this.removeParticipantFromGrid(participant);
        this.updateParticipantCount();
        this.updateActivityStatus();
    }

    handleMeetingJoined() {
        console.log(`🎉 [VoiceCallSection] Meeting fully joined, refreshing grid`);
        this.refreshParticipantGrid();
        this.updateParticipantCount();
        this.updateActivityStatus();
    }

    handleStreamEvent(e) {
        const { participant, stream, kind, data } = e.detail;
        const eventType = e.type;
        const isEnabled = eventType === 'videosdkStreamEnabled';
        
        console.log(`🎬 [VoiceCallSection] Stream event: ${eventType} for ${participant}, kind: ${kind}`, {
            hasStream: !!stream,
            hasTrack: !!(stream && stream.track),
            streamDetails: stream,
        });
        
        // ENHANCED DEBUGGING for stream classification
        if (stream && kind === 'video') {
            console.log(`🔍 [VoiceCallSection] ANALYZING VIDEO STREAM for classification:`, {
                participant,
                kind,
                streamType: typeof stream,
                isMediaStream: stream instanceof MediaStream,
                hasTrack: !!stream.track,
                trackLabel: stream.track?.label,
                trackKind: stream.track?.kind,
                videoTrackLabels: stream instanceof MediaStream ? 
                    stream.getVideoTracks().map(t => t.label) : 'not MediaStream'
            });
        }
        
        // ABSOLUTE RULE: ANY screen share detection = separate card ONLY
        if (kind === 'share' || (stream && this.isScreenShareStream(stream))) {
            console.log(`🖥️ [VoiceCallSection] SCREEN SHARE DETECTED - Creating separate card ONLY`);
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
            console.log(`🔍 [VoiceCallSection] Extra safety check - video track label: "${label}"`);
            if (label.includes('screen') || 
                label.includes('display') ||
                label.includes('web-contents-media-stream') ||
                label.includes('browser-capture') ||
                label.includes('screencapture')) {
                console.log(`🚫 [VoiceCallSection] INTERCEPTED: Screen/display in video label - FORCE redirecting to screen share card`);
                this.createScreenShareCard(participant, stream);
                this.updateGridLayout();
                return; // EARLY EXIT
            }
            
            // Additional check for MediaStream video tracks
            if (stream instanceof MediaStream) {
                const videoTracks = stream.getVideoTracks();
                for (const track of videoTracks) {
                    const trackLabel = track.label?.toLowerCase() || '';
                    console.log(`🔍 [VoiceCallSection] Checking MediaStream video track: "${trackLabel}"`);
                    if (trackLabel.includes('screen') || 
                        trackLabel.includes('display') ||
                        trackLabel.includes('web-contents-media-stream') ||
                        trackLabel.includes('browser-capture') ||
                        trackLabel.includes('screencapture')) {
                        console.log(`🚫 [VoiceCallSection] INTERCEPTED: Screen detected in MediaStream track - FORCE redirecting`);
                        this.createScreenShareCard(participant, stream);
                        this.updateGridLayout();
                        return; // EARLY EXIT
                    }
                }
            }
        }
        
        // Only handle legitimate camera/webcam video for participant overlays
        if (kind === 'video') {
            console.log(`✅ [VoiceCallSection] Processing as CAMERA video for participant overlay: ${participant}`);
            this.updateParticipantStream(participant, isEnabled ? stream : null, 'video');
        }
        
        setTimeout(() => {
            this.updateGridLayout();
        }, 100);
    }

    addParticipantToGrid(participantId, participantObj) {
        const grid = document.getElementById('participantGrid');
        if (!grid) {
            console.error('❌ [VoiceCallSection] Participant grid not found');
            return;
        }

        if (grid.querySelector(`[data-participant-id="${participantId}"]`)) {
            console.log(`⚠️ [VoiceCallSection] Participant ${participantId} already exists in grid`);
            return;
        }

        console.log(`➕ [VoiceCallSection] Adding participant ${participantId} to grid`);
        const participantElement = this.createParticipantElement(participantId, participantObj);
        grid.appendChild(participantElement);
        
        setTimeout(() => {
            this.checkParticipantStreams(participantObj);
        }, 100);
        
        this.updateGridLayout();
        console.log(`✅ [VoiceCallSection] Participant ${participantId} added to grid`);
    }

    removeParticipantFromGrid(participantId) {
        const grid = document.getElementById('participantGrid');
        if (!grid) return;

        // Remove participant card
        const element = grid.querySelector(`[data-participant-id="${participantId}"]`);
        if (element) {
            element.remove();
            console.log(`👋 [VoiceCallSection] Removed participant card for ${participantId}`);
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
        const isLocal = participantId === window.videoSDKManager?.meeting?.localParticipant?.id;

        participant.innerHTML = `
            <!-- Full card video overlay (hidden by default) -->
            <div class="participant-video-overlay hidden absolute inset-0 rounded-lg overflow-hidden z-20">
                <video class="w-full h-full object-cover rounded-lg" autoplay muted playsinline></video>
                
                <!-- Video overlay info -->
                <div class="video-overlay-info absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 flex items-center justify-between">
                    <span class="text-white text-sm font-medium truncate">${name}${isLocal ? ' (You)' : ''}</span>
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
                <div class="participant-avatar w-16 h-16 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-xl mb-3 relative ${isLocal ? 'local-participant' : ''}">
                    <span class="participant-initials">${this.getInitials(name)}</span>
                    
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
            console.log(`🖼️ [VoiceCallSection] Double-click detected for participant: ${participantId}`);
            this.toggleParticipantFullscreen(participantId);
        });
        
        // Add single click handler for interaction feedback
        participant.addEventListener('click', () => {
            participant.style.transform = 'scale(0.98)';
            setTimeout(() => {
                participant.style.transform = '';
            }, 150);
        });

        return participant;
    }

    createScreenShareCard(participantId, stream) {
        const grid = document.getElementById('participantGrid');
        if (!grid) {
            console.error('❌ [VoiceCallSection] Participant grid not found for screen share');
            return;
        }

        // Check if screen share card already exists
        const existingCard = grid.querySelector(`[data-screen-share-id="${participantId}"]`);
        if (existingCard) {
            console.log(`🖥️ [VoiceCallSection] Updating existing screen share card for ${participantId}`);
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
                    video.play().catch(e => console.warn('Screen share video play failed:', e));
                }
            }
            return;
        }

        // Get participant name for the screen share card
        const participantElement = document.querySelector(`[data-participant-id="${participantId}"]`);
        const participantName = participantElement?.querySelector('.participant-name')?.textContent || 'Unknown';

        console.log(`🖥️ [VoiceCallSection] Creating screen share card for ${participantId} (${participantName})`);

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
            console.log(`🖥️ [VoiceCallSection] Double-click detected on screen share for: ${participantId}`);
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
                video.srcObject = mediaStream;
                video.play().catch(e => console.warn('Screen share video play failed:', e));
                
                video.addEventListener('loadedmetadata', () => {
                    console.log(`🖥️ [VoiceCallSection] Screen share video loaded for ${participantId}`);
                    if (loading) loading.classList.add('hidden');
                    this.updateGridLayout();
                });
                
                video.addEventListener('error', (e) => {
                    console.error('🖥️ [VoiceCallSection] Screen share video error:', e);
                    if (loading) {
                        loading.innerHTML = `
                            <div class="flex flex-col items-center space-y-2">
                                <i class="fas fa-exclamation-triangle text-[#ed4245] text-2xl"></i>
                                <span class="text-sm text-[#ed4245]">Failed to load screen share</span>
                            </div>
                        `;
                    }
                });
            }
        }

        // Add the card to the grid
        grid.appendChild(screenShareCard);
        this.updateGridLayout();
        console.log(`✅ [VoiceCallSection] Screen share card created for ${participantId}`);
    }

    removeScreenShareCard(participantId) {
        const grid = document.getElementById('participantGrid');
        if (!grid) return;

        const screenShareCard = grid.querySelector(`[data-screen-share-id="${participantId}"]`);
        if (screenShareCard) {
            console.log(`🖥️ [VoiceCallSection] Removing screen share card for ${participantId}`);
            
            // Clean up video stream
            const video = screenShareCard.querySelector('.screen-share-video');
            if (video && video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }
            
            screenShareCard.remove();
            this.updateGridLayout();
            console.log(`✅ [VoiceCallSection] Screen share card removed for ${participantId}`);
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
        
        console.log(`🔍 [VoiceCallSection] Checking streams for participant: ${participant.id}`);
        
        participant.streams.forEach((stream, streamId) => {
            if (stream && stream.track && stream.track.kind === 'video') {
                console.log(`🔍 [VoiceCallSection] Analyzing stream ${streamId}:`, {
                    streamKind: stream.kind,
                    trackKind: stream.track.kind,
                    trackLabel: stream.track.label,
                    streamObj: stream
                });
                
                // PRIORITY 1: Check if the stream object itself says it's a share
                if (stream.kind === 'share') {
                    console.log(`🖥️ [VoiceCallSection] STREAM KIND IS SHARE - Creating separate card ONLY for ${participant.id}: ${streamId}`);
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
                    console.log(`🖥️ [VoiceCallSection] SCREEN SHARE DETECTED BY LABEL - Creating separate card ONLY for ${participant.id}: ${streamId}`);
                    this.updateParticipantStream(participant.id, stream, 'share');
                } else {
                    console.log(`🎥 [VoiceCallSection] CONFIRMED CAMERA - Applying to participant overlay for ${participant.id}: ${streamId}`);
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
            console.warn(`🖼️ [VoiceCallSection] Participant element not found: ${participantId}`);
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
            console.warn(`🖼️ [VoiceCallSection] No active video found for participant: ${participantId}`);
            return;
        }

        console.log(`🖼️ [VoiceCallSection] Opening fullscreen ${isScreenShare ? 'screen share' : 'camera'} for participant: ${participantId}`);

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
        console.log('🎮 [VoiceCallSection] Updated activity status:', activityDetails);
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
            console.log(`🔍 [VoiceCallSection] isScreenShareStream: No stream provided`);
            return false;
        }
        
        console.log(`🔍 [VoiceCallSection] isScreenShareStream: Analyzing stream:`, {
            streamType: typeof stream,
            isMediaStream: stream instanceof MediaStream,
            hasTrack: !!stream.track,
            hasStreamProp: !!stream.stream,
            trackLabel: stream.track?.label,
            trackKind: stream.track?.kind
        });
        
        // Check MediaStream format
        if (stream instanceof MediaStream) {
            const videoTracks = stream.getVideoTracks();
            console.log(`🔍 [VoiceCallSection] MediaStream check: ${videoTracks.length} video tracks`);
            if (videoTracks.length > 0) {
                const track = videoTracks[0];
                const label = track.label?.toLowerCase() || '';
                console.log(`🔍 [VoiceCallSection] Track label: "${label}"`);
                const isScreen = label.includes('screen') || 
                               label.includes('display') ||
                               label.includes('web-contents-media-stream') ||
                               label.includes('browser-capture') ||
                               label.includes('screencapture');
                if (isScreen) console.log(`🖥️ [VoiceCallSection] SCREEN DETECTED in MediaStream track label`);
                return isScreen;
            }
        }
        
        // Check nested stream format
        if (stream.stream instanceof MediaStream) {
            const videoTracks = stream.stream.getVideoTracks();
            console.log(`🔍 [VoiceCallSection] Nested MediaStream check: ${videoTracks.length} video tracks`);
            if (videoTracks.length > 0) {
                const track = videoTracks[0];
                const label = track.label?.toLowerCase() || '';
                console.log(`🔍 [VoiceCallSection] Nested track label: "${label}"`);
                const isScreen = label.includes('screen') || 
                               label.includes('display') ||
                               label.includes('web-contents-media-stream') ||
                               label.includes('browser-capture') ||
                               label.includes('screencapture');
                if (isScreen) console.log(`🖥️ [VoiceCallSection] SCREEN DETECTED in nested MediaStream track label`);
                return isScreen;
            }
        }
        
        // Check track-based format
        if (stream.track && stream.track.kind === 'video') {
            const label = stream.track.label?.toLowerCase() || '';
            console.log(`🔍 [VoiceCallSection] Direct track check: "${label}"`);
            const isScreen = label.includes('screen') || 
                           label.includes('display') || 
                           label.includes('web-contents-media-stream') ||
                           label.includes('browser-capture') ||
                           label.includes('screencapture');
            if (isScreen) console.log(`🖥️ [VoiceCallSection] SCREEN DETECTED in direct track label`);
            return isScreen;
        }
        
        console.log(`🔍 [VoiceCallSection] isScreenShareStream: No screen share detected`);
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

    // Safety monitor to prevent screen share in participant overlays
    startVideoOverlaySafetyMonitor() {
        console.log('🛡️ [VoiceCallSection] Starting video overlay safety monitor');
        
        setInterval(() => {
            const participantCards = document.querySelectorAll('[data-participant-id]');
            
            participantCards.forEach(card => {
                const participantId = card.getAttribute('data-participant-id');
                const videoOverlay = card.querySelector('.participant-video-overlay video');
                
                if (videoOverlay && videoOverlay.srcObject) {
                    const stream = videoOverlay.srcObject;
                    if (stream instanceof MediaStream) {
                        const videoTracks = stream.getVideoTracks();
                        videoTracks.forEach(track => {
                            const label = track.label?.toLowerCase() || '';
                            if (label.includes('screen') || 
                                label.includes('display') ||
                                label.includes('web-contents-media-stream') ||
                                label.includes('browser-capture') ||
                                label.includes('screencapture')) {
                                console.error(`🚨 [VoiceCallSection] SAFETY VIOLATION: Screen share detected in participant overlay for ${participantId} - REMOVING`);
                                
                                // Immediately remove the screen share from participant overlay
                                videoOverlay.srcObject = null;
                                
                                // Hide video overlay and show default view
                                const overlay = card.querySelector('.participant-video-overlay');
                                const defaultView = card.querySelector('.participant-default-view');
                                if (overlay && defaultView) {
                                    overlay.classList.add('hidden');
                                    defaultView.classList.remove('hidden');
                                }
                                
                                // Create proper screen share card instead
                                const properStream = new MediaStream([track]);
                                this.createScreenShareCard(participantId, properStream);
                                
                                // Force grid layout update
                                this.updateGridLayout();
                            }
                        });
                    }
                }
            });
        }, 1000); // Check every second
    }
}

// Initialize voice call section when this script loads
if (typeof window !== 'undefined') {
    window.voiceCallSection = new VoiceCallSection();
}