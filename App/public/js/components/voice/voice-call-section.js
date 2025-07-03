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
        
        setInterval(() => {
            if (window.videoSDKManager?.isMeetingJoined) {
                this.syncButtonStates();
                this.syncAllParticipantStreams();
            }
        }, 3000);
        
        setTimeout(() => {
            this.retryInitialization();
        }, 1000);
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
                // Also manually trigger camera stream update for local participant
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
        
        if (kind === 'video') {
            const participantCard = document.querySelector(`[data-participant-id="${participantId}"]`);
            if (!participantCard) {
                console.warn(`🎥 [VoiceCallSection] Participant card not found for ${participantId}`);
                return;
            }

            const videoContainer = participantCard.querySelector('.participant-video');
            const videoElement = videoContainer?.querySelector('video');
            const avatar = participantCard.querySelector('.participant-avatar');

            if (stream) {
                let mediaStream;
                if (stream instanceof MediaStream) {
                    mediaStream = stream;
                } else if (stream.track) {
                    mediaStream = new MediaStream([stream.track]);
                } else if (stream.stream) {
                    mediaStream = stream.stream;
                } else {
                    console.warn(`🎥 [VoiceCallSection] Invalid stream format for ${participantId}:`, stream);
                    return;
                }
                
                if (videoElement && mediaStream) {
                    videoElement.srcObject = mediaStream;
                    videoElement.play().catch(e => console.warn('Video play failed:', e));
                    
                    if (videoContainer) {
                        videoContainer.classList.remove('hidden');
                    }
                    if (avatar) {
                        avatar.style.zIndex = '5';
                    }
                    
                    console.log(`🎥 [VoiceCallSection] Video stream attached for ${participantId}`);
                } else {
                    console.warn(`🎥 [VoiceCallSection] Video element not found for ${participantId}`);
                }
            } else {
                if (videoElement) {
                    videoElement.srcObject = null;
                }
                if (videoContainer) {
                    videoContainer.classList.add('hidden');
                }
                if (avatar) {
                    avatar.style.zIndex = '10';
                }
                
                console.log(`🎥 [VoiceCallSection] Video stream removed for ${participantId}`);
            }
        } else if (kind === 'share') {
            if (stream) {
                this.createScreenShareCard(participantId, stream);
                console.log(`🖥️ [VoiceCallSection] Screen share enabled for ${participantId}`);
            } else {
                this.removeScreenShareCard(participantId);
                console.log(`🖥️ [VoiceCallSection] Screen share disabled for ${participantId}`);
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
        const eventType = e.type; // 'videosdkStreamEnabled' or 'videosdkStreamDisabled'
        const isEnabled = eventType === 'videosdkStreamEnabled';
        
        console.log(`🎬 [VoiceCallSection] Stream ${isEnabled ? 'enabled' : 'disabled'} for ${participant}: ${kind}`, {
            hasStream: !!stream,
            hasTrack: !!(stream && stream.track),
            streamDetails: stream,
            eventData: data
        });
        
        this.updateParticipantStream(participant, isEnabled ? stream : null, kind);
        
        // Refresh grid layout after stream changes
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
            <div class="participant-avatar w-16 h-16 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-xl mb-3 relative ${isLocal ? 'local-participant' : ''}">
                <span class="participant-initials">${this.getInitials(name)}</span>
                
                <!-- Video stream container -->
                <div class="participant-video hidden absolute inset-0 rounded-full overflow-hidden z-10">
                    <video class="w-full h-full object-cover rounded-full" autoplay muted playsinline></video>
                </div>
                
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
            
            <!-- Screen share section -->
            <div class="screen-share-indicator hidden w-full mt-2">
                <div class="screen-share-content bg-[#1e1f22] rounded border border-[#40444b] aspect-video min-h-[120px] relative overflow-hidden">
                    <video class="screen-share-video w-full h-full object-contain rounded" autoplay muted playsinline></video>
                    <div class="absolute inset-0 flex items-center justify-center text-[#72767d] text-xs bg-[#1e1f22]/80 screen-share-placeholder">
                        <i class="fas fa-desktop mr-2"></i>
                        Loading screen share...
                    </div>
                </div>
                <span class="text-xs text-[#b9bbbe] mt-1 text-center block">🖥️ Screen Share</span>
            </div>
        `;

        // Add click handler for fullscreen on video/screen share
        const avatar = participant.querySelector('.participant-avatar');
        const screenShareContent = participant.querySelector('.screen-share-content');
        
        if (avatar) {
            avatar.addEventListener('click', () => this.toggleParticipantFullscreen(participantId));
        }
        
        if (screenShareContent) {
            screenShareContent.addEventListener('click', () => this.toggleParticipantFullscreen(participantId));
        }

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

        // Add click handler for fullscreen
        const videoContainer = screenShareCard.querySelector('.screen-share-content');
        if (videoContainer) {
            videoContainer.addEventListener('click', () => this.toggleParticipantFullscreen(participantId));
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
                const label = stream.track.label?.toLowerCase() || '';
                const isScreenShare = label.includes('screen') || label.includes('display');
                const kind = isScreenShare ? 'share' : 'video';
                
                console.log(`🎥 [VoiceCallSection] Found ${kind} stream for ${participant.id}: ${streamId}`);
                this.updateParticipantStream(participant.id, stream, kind);
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
        if (!element) return;

        const video = element.querySelector('video[src]');
        if (!video || !video.srcObject) return;

        console.log(`🖼️ [VoiceCallSection] Toggling fullscreen for participant: ${participantId}`);

        // Create fullscreen overlay
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-overlay';
        
        const fullscreenParticipant = document.createElement('div');
        fullscreenParticipant.className = 'fullscreen-participant';
        
        const fullscreenVideo = document.createElement('video');
        fullscreenVideo.className = 'w-full h-full object-contain';
        fullscreenVideo.srcObject = video.srcObject;
        fullscreenVideo.autoplay = true;
        fullscreenVideo.muted = true;
        fullscreenVideo.playsInline = true;
        
        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'minimize-btn';
        minimizeBtn.innerHTML = '<i class="fas fa-times"></i>';
        minimizeBtn.onclick = () => overlay.remove();
        
        fullscreenParticipant.appendChild(fullscreenVideo);
        fullscreenParticipant.appendChild(minimizeBtn);
        overlay.appendChild(fullscreenParticipant);
        document.body.appendChild(overlay);

        // Close on ESC key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
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
}

// Initialize voice call section when this script loads
if (typeof window !== 'undefined') {
    window.voiceCallSection = new VoiceCallSection();
}