

class VoiceCallManager {
    constructor() {
        this.isConnected = false;
        this.localParticipantId = null;
        this.isMuted = false;
        this.isDeafened = false;
        this.isVideoOn = false;
        this.isScreenSharing = false;
        this.currentView = 'unified';
        this.eventListenersRegistered = false;
        this.fullscreenParticipant = null;
        this.isFullscreenMode = false;
        this._participants = new Map();
        
        this.userId = document.querySelector('meta[name="user-id"]')?.content;
        this.meetingId = document.querySelector('meta[name="meeting-id"]')?.content;
        this.channelId = document.querySelector('meta[name="channel-id"]')?.content;
        this.serverId = document.querySelector('meta[name="server-id"]')?.content;
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        this.setupControls();
        this.setupDoubleClickHandlers();
        this.updateParticipantCount();
    }

    setupEventListeners() {
        if (this.eventListenersRegistered || window.voiceEventListenersRegistered) {
            console.log('[VOICE-CALL-MANAGER] Event listeners already registered, skipping');
            return;
        }
        
        this.eventListenersRegistered = true;
        window.voiceEventListenersRegistered = true;
        
        console.log('[VOICE-CALL-MANAGER] Setting up event listeners for participant management');

        window.addEventListener('videosdkParticipantJoined', (event) => {
            const { participant, participantObj } = event.detail;
            const isLocal = participantObj?.id === window.videoSDKManager?.meeting?.localParticipant?.id;
            console.log(`[VOICE-CALL-MANAGER] VideoSDK participant joined: ${participant} (local: ${isLocal})`);
            this.handleParticipantJoined({
                participantId: participant,
                participantObj: participantObj,
                source: isLocal ? 'local' : 'videosdk'
            });
        });

        window.addEventListener('videosdkParticipantLeft', (event) => {
            const { participant } = event.detail;
            console.log(`[VOICE-CALL-MANAGER] VideoSDK participant left: ${participant}`);
            this.handleParticipantLeft(participant);
        });

        window.addEventListener('videosdkMeetingFullyJoined', (event) => {
            console.log('[VOICE-CALL-MANAGER] VideoSDK meeting fully joined, ensuring local participant');
            setTimeout(() => {
                if (window.videoSDKManager?.meeting?.localParticipant && !this._participants.has(window.videoSDKManager.meeting.localParticipant.id)) {
                    console.log('[VOICE-CALL-MANAGER] Fallback: Adding local participant after meeting joined');
                    this.localParticipantId = window.videoSDKManager.meeting.localParticipant.id;
                    this.handleParticipantJoined({
                        participantId: this.localParticipantId,
                        participantObj: window.videoSDKManager.meeting.localParticipant,
                        source: 'local'
                    });
                }
            }, 200);
        });

        window.addEventListener('voiceConnect', (event) => {
            console.log('[VOICE-CALL-MANAGER] Voice connect event received', event.detail);
            
            this.isConnected = true;
            
            if (window.unifiedVoiceStateManager) {
                window.unifiedVoiceStateManager.setState({
                    isConnected: true,
                    channelId: event.detail?.channelId || null,
                    channelName: event.detail?.channelName || null,
                    meetingId: event.detail?.meetingId || null,
                    connectionTime: Date.now()
                });
            }
            
            if (window.videoSDKManager?.meeting?.localParticipant) {
                this.localParticipantId = window.videoSDKManager.meeting.localParticipant.id;
                console.log('[VOICE-CALL-MANAGER] Set local participant ID:', this.localParticipantId);
            }
            
            if (event.detail?.meetingId) {
                this.displayMeetingId(event.detail.meetingId);
            }
            
            if (!window.voiceJoinSuccessShown) {
                const channelName = event.detail?.channelName || 'Voice Channel';
                this.showToast(`Successfully joined ${channelName}`, 'success');
                window.voiceJoinSuccessShown = true;
                setTimeout(() => {
                    window.voiceJoinSuccessShown = false;
                }, 3000);
            }
            
            if (window.MusicLoaderStatic?.stopCallSound) {
                window.MusicLoaderStatic.stopCallSound();
            }
            
            if (window.MusicLoaderStatic?.stopJoinVoiceSound) {
                window.MusicLoaderStatic.stopJoinVoiceSound();
            }
            
            if (window.MusicLoaderStatic?.playJoinVoiceSound) {
                window.MusicLoaderStatic.playJoinVoiceSound();
            }
            
            this.updateGrid();
        });

        window.addEventListener('voiceDisconnect', () => {
            this.cleanup();
        });

        window.addEventListener('videosdkStreamEnabled', (event) => {
            const { kind, stream, participant } = event.detail;
            
            if (kind === 'video') {
                this.handleCameraStream(participant, stream);
            } else if (kind === 'share') {
                this.handleScreenShare(participant, stream);
            }
        });

        window.addEventListener('videosdkStreamDisabled', (event) => {
            const { kind, participant } = event.detail;
            
            if (kind === 'video') {
                this.handleCameraDisabled(participant);
            } else if (kind === 'share') {
                this.handleScreenShareStopped(participant);
            }
        });

        window.addEventListener('voiceStateChanged', (event) => {
            const { type, state } = event.detail;
            this.updateControlsUI(type, state);
        });

        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            const io = window.globalSocketManager.io;
            
            io.on('bot-voice-participant-joined', (data) => {
                console.log('[VOICE-CALL-MANAGER] Bot joined voice channel:', data);
                this.handleBotJoined(data);
                
                if (window.showToast) {
                    const botName = data.participant?.username || 'Bot';
                    window.showToast(`${botName} joined the voice channel`, 'info');
                }
            });

            io.on('bot-voice-participant-left', (data) => {
                console.log('[VOICE-CALL-MANAGER] Bot left voice channel:', data);
                this.handleBotLeft(data);
                
                if (window.showToast) {
                    const botName = data.participant?.username || 'Bot';
                    window.showToast(`${botName} left the voice channel`, 'info');
                }
            });
        }

        document.getElementById('ticTacToeBtn')?.addEventListener('click', () => {
            TicTacToeModal.createTicTacToeModal(this.serverId, this.userId);
        });
    }

    async handleParticipantJoined(data) {
        const participantId = data.participantId || data.participant;
        const source = data.source || 'videosdk';
        
        if (this._participants.has(participantId)) {
            console.log(`[VOICE-CALL-MANAGER] Participant ${participantId} already exists, updating source to ${source}`);
            const existingParticipant = this._participants.get(participantId);
            existingParticipant.source = source;
            return;
        }

        const isLocal = source === 'local' || (this.localParticipantId === participantId);
        let participantName;
        if (isLocal) {
            participantName = document.querySelector('meta[name="username"]')?.content || 
                            data.participantObj?.displayName || 
                            data.participantObj?.name || 
                            'You';
        } else {
            participantName = data.participantObj?.displayName || data.participantObj?.name || data.name || `User ${participantId.slice(-4)}`;
        }
        
        let participantData = {
            id: participantId,
            name: participantName,
            hasVideo: false,
            hasScreenShare: false,
            isMuted: false,
            isSpeaking: false,
            isBot: false,
            isLocal: isLocal,
            source: source
        };

        if (!isLocal && !data.participantObj?.isBot) {
            const isValidUserId = /^\d+$/.test(participantId);
            
            if (isValidUserId) {
                try {
                    if (window.userAPI) {
                        const userData = await window.userAPI.getUserProfile(participantId);
                        if (userData && userData.success && userData.data && userData.data.user) {
                            participantData.name = userData.data.user.display_name || userData.data.user.username || participantData.name;
                            participantData.avatarUrl = userData.data.user.avatar_url;
                        }
                    } else {
                        const response = await fetch(`/api/users/${participantId}/profile`, {
                            method: 'GET',
                            credentials: 'same-origin'
                        });
                        
                        if (response.ok) {
                            const userData = await response.json();
                            if (userData.success && userData.data && userData.data.user) {
                                participantData.name = userData.data.user.display_name || userData.data.user.username || participantData.name;
                                participantData.avatarUrl = userData.data.user.avatar_url;
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Failed to fetch participant profile data:', error);
                }
            }
        }

        this._participants.set(participantId, participantData);
        
        console.log(`[VOICE-CALL-MANAGER] Added participant: ${participantData.name} (${participantId})`);
        
        await this.createParticipantElement(participantData);
        this.updateParticipantCount();
        this.updateGrid();
        
        this.broadcastParticipantUpdate('join', participantId, participantData.name);
    }

    handleParticipantLeft(participantId) {
        if (!this._participants.has(participantId)) {
            console.log(`[VOICE-CALL-MANAGER] Participant ${participantId} not found for removal`);
            return;
        }

        const participant = this._participants.get(participantId);
        this._participants.delete(participantId);
        
        console.log(`[VOICE-CALL-MANAGER] Removed participant: ${participant.name} (${participantId})`);
        
        this.removeParticipantElement(participantId);
        this.updateParticipantCount();
        
        const wasLocal = participant.isLocal || participant.source === 'local';
        if (!wasLocal && window.MusicLoaderStatic?.playDisconnectVoiceSound) {
            window.MusicLoaderStatic.playDisconnectVoiceSound();
        }
    }

    async handleBotJoined(data) {
        const botId = data.participant?.id || data.id;
        
        if (this._participants.has(botId)) {
            console.log(`[VOICE-CALL-MANAGER] Bot ${botId} already exists, ignoring duplicate`);
            return;
        }

        const participant = {
            id: botId,
            name: data.participant?.username || data.username || 'Bot',
            hasVideo: false,
            hasScreenShare: false,
            isMuted: false,
            isSpeaking: false,
            isBot: true,
            source: 'bot'
        };

        this._participants.set(botId, participant);
        
        console.log(`[VOICE-CALL-MANAGER] Added bot: ${participant.name} (${botId})`);
        
        await this.createParticipantElement(participant);
        this.updateParticipantCount();
    }

    async handleBotLeft(data) {
        const botId = data.participant?.id || data.id;
        
        if (!this._participants.has(botId)) {
            console.log(`[VOICE-CALL-MANAGER] Bot ${botId} not found for removal`);
            return;
        }

        const participant = this._participants.get(botId);
        this._participants.delete(botId);
        
        console.log(`[VOICE-CALL-MANAGER] Removed bot: ${participant.name} (${botId})`);
        
        this.removeParticipantElement(botId);
        this.updateParticipantCount();
    }

    getParticipant(participantId) {
        return this._participants.get(participantId);
    }

    getParticipantCount() {
        return this._participants.size;
    }



    async createParticipantElement(participant) {
        const container = document.getElementById('participantGrid');
        if (!container) {
            console.error('[ERROR] participantGrid container not found');
            return;
        }

        const existingVideoCard = document.querySelector(`[data-participant-id="${participant.id}"].video-participant-card`);
        if (existingVideoCard) {
            console.log(`[VOICE-MANAGER] Video card exists for ${participant.id}, skipping voice card creation`);
            return;
        }

        const existingElement = document.querySelector(`[data-participant-id="${participant.id}"].voice-participant-card`);
        if (existingElement) {
            console.log(`[VOICE-MANAGER] Voice card for participant ${participant.id} already exists`);
            return;
        }

        console.log(`[DEBUG] Creating voice participant element for: ${participant.name}`);



        const element = document.createElement('div');
        element.className = 'voice-participant-card participant-card';
        element.dataset.participantId = participant.id;

        const avatarColor = participant.isBot ? '#5865f2' : (participant.isLocal ? '#3ba55c' : this.getAvatarColor(participant.name));
        const initial = participant.name.charAt(0).toUpperCase();
        const botIndicator = participant.isBot ? '<i class="fas fa-robot text-xs text-[#5865f2] ml-1"></i>' : '';
        const localIndicator = participant.isLocal ? '<i class="fas fa-user text-xs text-[#3ba55c] ml-1"></i>' : '';
        const borderColor = participant.isBot ? '#5865f2' : (participant.isLocal ? '#3ba55c' : 'transparent');
        
        const avatarUrl = await this.getParticipantAvatarUrl(participant);
        const avatarContent = avatarUrl ? 
            `<img src="${avatarUrl}" alt="${participant.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
             <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 20px;">${participant.isBot ? '<i class="fas fa-robot text-white"></i>' : initial}</div>` :
            `${participant.isBot ? '<i class="fas fa-robot text-white"></i>' : initial}`;

        element.innerHTML = `
            <div class="voice-participant-avatar participant-avatar ${participant.isBot ? 'bot-participant' : ''} ${participant.isLocal ? 'local-participant' : ''}" style="background: ${avatarUrl ? 'transparent' : avatarColor}; border: 3px solid ${borderColor};">
                ${avatarContent}
            </div>
            <span style="color: white; font-size: 12px; text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; justify-content: center;">${participant.name}${participant.isLocal ? ' (You)' : ''}${botIndicator}${localIndicator}</span>
        `;

        container.appendChild(element);
        
        if (!participant.isLocal) {
            this.scrollToNewParticipant(element);
        }
        
        this.updateView();
    }

    scrollToNewParticipant(element) {
        const participantGrid = document.getElementById('participantGrid');
        if (!participantGrid || !element) return;
        
        setTimeout(() => {
            const elementRect = element.getBoundingClientRect();
            const containerRect = participantGrid.getBoundingClientRect();
            
            if (elementRect.bottom > containerRect.bottom) {
                element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'end',
                    inline: 'nearest'
                });
            }
        }, 200);
    }

    removeParticipantElement(participantId) {
        const voiceCard = document.querySelector(`[data-participant-id="${participantId}"].voice-participant-card`);
        const videoCard = document.querySelector(`[data-participant-id="${participantId}"].video-participant-card:not(.screen-share-card)`);
        const screenShareCard = document.querySelector(`[data-participant-id="${participantId}-screenshare"].screen-share-card`);
        
        if (voiceCard) voiceCard.remove();
        if (videoCard) videoCard.remove();
        if (screenShareCard) screenShareCard.remove();
        
        if (this.fullscreenParticipant === participantId || this.fullscreenParticipant === `${participantId}-screenshare`) {
            this.exitFullscreen();
        }
        
        this.updateGrid();
    }

    updateParticipantCount() {
        const count = this._participants.size;
        const countElement = document.getElementById('voiceParticipantCount');
        if (countElement) {
            countElement.textContent = count;
        }
        
        const container = document.getElementById('participantGrid');
        if (container) {
            container.setAttribute('data-count', count);
        }
        
        setTimeout(() => {
            this.setupScrollIndicator();
        }, 100);
    }

    cleanup() {
        console.log('[VOICE-CALL-MANAGER] Cleaning up participants and UI');
        
        const currentChannelId = window.voiceManager?.currentChannelId;
        const participantIds = Array.from(this._participants.keys());
        
        participantIds.forEach(id => {
            this.removeParticipantElement(id);
        });
        
        this._participants.clear();
        
        const container = document.getElementById('participantGrid');
        if (container) {
            container.innerHTML = '';
        }
        
        this.exitFullscreen();
        
        this.updateParticipantCount();
        
        if (currentChannelId && window.ChannelVoiceParticipants) {
            const instance = window.ChannelVoiceParticipants.getInstance();
            instance.updateChannelCount(currentChannelId, 0);
        }
        
        this.isConnected = false;
        this.localParticipantId = null;
        this.isVideoOn = false;
        this.isScreenSharing = false;
        
        console.log('âœ… [VOICE-CALL-MANAGER] Cleanup completed');
    }

    get participants() {
        return this._participants;
    }

    async handleCameraStream(participantId, stream) {
        console.log(`[DEBUG] Handling camera stream for ${participantId}`, {
            stream: stream,
            streamType: typeof stream,
            isMediaStream: stream instanceof MediaStream,
            hasStreamProperty: !!stream?.stream,
            hasTrackProperty: !!stream?.track,
            streamTracks: stream instanceof MediaStream ? stream.getTracks().length : 'N/A',
            localParticipantId: this.localParticipantId,
            isLocalParticipant: participantId === this.localParticipantId,
            participantInMap: this._participants.has(participantId),
            totalParticipants: this._participants.size
        });
        
        if (participantId === this.localParticipantId) {
            console.log(`[DEBUG] Handling local participant camera stream`);
            this.isVideoOn = true;
        }
        
        const participant = this._participants.get(participantId);
        if (participant) {
            participant.hasVideo = true;
        }
        
        this.createVideoParticipantCard(participantId, stream);
        await this.updateParticipantCards(participantId);
        
        console.log('[DEBUG] Camera stream handled - SUCCESS');
        this.updateView();
    }

    async handleCameraDisabled(participantId) {
        console.log(`[CAMERA] Handling camera disabled for ${participantId}`);
        
        const participant = this._participants.get(participantId);
        if (participant) {
            participant.hasVideo = false;
        }
        
        if (participantId === this.localParticipantId) {
            this.isVideoOn = false;
            console.log('[CAMERA] Local camera disabled');
        }
        
        this.removeVideoParticipantCard(participantId);
        await this.updateParticipantCards(participantId);
        
        this.updateView();
    }

    async handleScreenShare(participantId, stream) {
        console.log(`[SCREEN-SHARE] Handling screen share for ${participantId}`, stream);
        
        const participant = this._participants.get(participantId);
        if (participant) {
            participant.hasScreenShare = true;
        }
        
        if (participantId === this.localParticipantId) {
            this.isScreenSharing = true;
        }
        
        this.createScreenShareParticipantCard(participantId, stream);
        await this.updateParticipantCards(participantId);
        
        console.log('[SCREEN-SHARE] Screen share created as participant card');
        this.updateView();
    }

    async handleScreenShareStopped(participantId = null) {
        console.log(`[SCREEN-SHARE] Handling screen share stopped for ${participantId || 'unknown'}`);
        
        const screenShareId = `${participantId}-screenshare`;
        const screenCard = document.querySelector(`[data-participant-id="${screenShareId}"].screen-share-card`);
        if (screenCard) {
            screenCard.remove();
        }
        
        const participant = this._participants.get(participantId);
        if (participant) {
            participant.hasScreenShare = false;
        }
        
        if (participantId === this.localParticipantId || !participantId) {
            this.isScreenSharing = false;
        }
        
        if (this.fullscreenParticipant === screenShareId) {
            this.exitFullscreen();
        }
        
        await this.updateParticipantCards(participantId);
        
        console.log('[SCREEN-SHARE] Screen share stopped');
        this.updateView();
    }

    createScreenShareParticipantCard(participantId, stream) {
        const container = document.getElementById('participantGrid');
        if (!container) {
            return;
        }

        const screenShareId = `${participantId}-screenshare`;
        let existingCard = document.querySelector(`[data-participant-id="${screenShareId}"].screen-share-card`);
        if (existingCard) {
            const video = existingCard.querySelector('video');
            if (video && stream) {
                this.attachStreamToVideo(video, stream);
            }
            return;
        }

        let participant = this._participants.get(participantId);
        if (!participant) {
            participant = {
                id: participantId,
                name: `User ${participantId.slice(-4)}`,
                hasVideo: false,
                hasScreenShare: false,
                isMuted: false,
                isSpeaking: false
            };
        }

        console.log('[SCREEN-SHARE] Creating screen share card:', {
            participantId,
            screenShareId,
            participantName: participant.name
        });

        const card = document.createElement('div');
        card.className = 'screen-share-card video-participant-card';
        card.dataset.participantId = screenShareId;
        card.style.border = '2px solid #5865f2';

        const isLocal = participantId === this.localParticipantId;

        card.innerHTML = `
            <video autoplay playsinline ${isLocal ? '' : 'muted'} data-participant-id="${screenShareId}"></video>
            <div class="video-participant-overlay">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-desktop text-[#5865f2]"></i>
                    <span>${participant.name}${isLocal ? ' (You)' : ''} - Screen</span>
                </div>
                ${participant.isMuted ? '<i class="fas fa-microphone-slash ml-2"></i>' : ''}
            </div>
        `;

        const video = card.querySelector('video');
        if (video && stream) {
            this.attachStreamToVideo(video, stream);
        }

        container.appendChild(card);
        
        this.updateGrid();
        
        console.log('[SCREEN-SHARE] Screen share card added to DOM:', {
            cardId: screenShareId,
            cardClasses: card.className,
            hasVideo: !!card.querySelector('video')
        });
        
        if (!participant.isLocal) {
            this.scrollToNewParticipant(card);
        }
        
        this.updateView();
    }

    createVideoParticipantCard(participantId, stream) {
        const container = document.getElementById('participantGrid');
        if (!container) {
            return;
        }

        let existingCard = document.querySelector(`[data-participant-id="${participantId}"].video-participant-card:not(.screen-share-card)`);
        if (existingCard) {
            const video = existingCard.querySelector('video');
            if (video && stream) {
                this.attachStreamToVideo(video, stream);
            }
            return;
        }

        let participant = this._participants.get(participantId);
        if (!participant) {
            participant = {
                id: participantId,
                name: `User ${participantId.slice(-4)}`,
                hasVideo: false,
                hasScreenShare: false,
                isMuted: false,
                isSpeaking: false
            };
        }

        const card = document.createElement('div');
        card.className = 'video-participant-card';
        card.dataset.participantId = participantId;

        const isLocal = participantId === this.localParticipantId;

        card.innerHTML = `
            <video autoplay playsinline ${isLocal ? '' : 'muted'} data-participant-id="${participantId}"></video>
            <div class="video-participant-overlay">
                <span>${participant.name}${isLocal ? ' (You)' : ''}</span>
                ${participant.isMuted ? '<i class="fas fa-microphone-slash ml-2"></i>' : ''}
            </div>
        `;

        const video = card.querySelector('video');
        if (video && stream) {
            this.attachStreamToVideo(video, stream);
        }

        container.appendChild(card);
        participant.hasVideo = true;
        
        this.updateGrid();
        
        if (!participant.isLocal) {
            this.scrollToNewParticipant(card);
        }
    }

    removeVoiceParticipantCard(participantId) {
        const voiceCard = document.querySelector(`[data-participant-id="${participantId}"].voice-participant-card`);
        if (voiceCard) {
            voiceCard.remove();
        }
        
        if (this.fullscreenParticipant === participantId) {
            this.exitFullscreen();
        }
    }

    removeVideoParticipantCard(participantId) {
        const videoCard = document.querySelector(`[data-participant-id="${participantId}"].video-participant-card:not(.screen-share-card)`);
        
        if (videoCard) {
            videoCard.remove();
        }
        
        if (this.fullscreenParticipant === participantId) {
            this.exitFullscreen();
        }
        
        const participant = this._participants.get(participantId);
        if (participant) {
            participant.hasVideo = false;
        }
    }

    async updateParticipantCards(participantId) {
        const participant = this._participants.get(participantId);
        if (!participant) return;
        
        const hasVideo = participant.hasVideo || false;
        const hasScreenShare = participant.hasScreenShare || false;
        const hasVideoCard = !!document.querySelector(`[data-participant-id="${participantId}"].video-participant-card:not(.screen-share-card)`);
        const hasScreenShareCard = !!document.querySelector(`[data-participant-id="${participantId}-screenshare"].screen-share-card`);
        const hasVoiceCard = !!document.querySelector(`[data-participant-id="${participantId}"].voice-participant-card`);
        
        console.log(`[UPDATE] Updating participant cards for ${participantId}:`, {
            hasVideo, hasScreenShare, hasVideoCard, hasScreenShareCard, hasVoiceCard
        });
        
        if (!hasVideo && !hasScreenShare) {
            if (!hasVoiceCard) {
                await this.createParticipantElement(participant);
            }
        } else {
            if (hasVoiceCard) {
                this.removeVoiceParticipantCard(participantId);
            }
        }
    }

    getParticipantStreamStates(participantId) {
        const participant = this._participants.get(participantId);
        if (!participant) {
            return { hasVideo: false, hasScreenShare: false };
        }
        
        return {
            hasVideo: participant.hasVideo || false,
            hasScreenShare: participant.hasScreenShare || false
        };
    }

    shouldCreateVoiceCard(participantId) {
        const states = this.getParticipantStreamStates(participantId);
        return !states.hasVideo && !states.hasScreenShare;
    }

    attachStreamToVideo(videoElement, stream) {
        try {
            console.log(`[DEBUG] attachStreamToVideo called with:`, {
                videoElement: !!videoElement,
                videoElementId: videoElement?.id,
                stream: stream,
                streamType: typeof stream,
                isMediaStream: stream instanceof MediaStream,
                hasStreamProperty: !!stream?.stream,
                hasTrackProperty: !!stream?.track
            });

            if (videoElement.srcObject) {
                console.log(`[DEBUG] Cleaning up existing srcObject...`);
                const tracks = videoElement.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }

            let mediaStream = null;
            if (stream instanceof MediaStream) {
                console.log(`[DEBUG] Stream is MediaStream directly`);
                mediaStream = stream;
            } else if (stream.stream instanceof MediaStream) {
                console.log(`[DEBUG] Stream has .stream property with MediaStream`);
                mediaStream = stream.stream;
            } else if (stream.track) {
                console.log(`[DEBUG] Stream has .track property, creating MediaStream`);
                mediaStream = new MediaStream([stream.track]);
            } else {
                console.error(`[ERROR] Unknown stream format:`, stream);
            }

            if (mediaStream) {
                console.log(`[DEBUG] Setting srcObject and playing...`, {
                    mediaStreamTracks: mediaStream.getTracks().length,
                    trackTypes: mediaStream.getTracks().map(t => t.kind)
                });
                videoElement.srcObject = mediaStream;
                videoElement.play().then(() => {
                    console.log(`[SUCCESS] Video element is now playing`);
                }).catch(error => {
                    console.warn(`[WARN] Video play failed:`, error);
                });
            } else {
                console.error(`[ERROR] No valid MediaStream found`);
            }
        } catch (error) {
            console.error('[ERROR] Error attaching stream:', error);
        }
    }

    hasOtherVideo() {
        const result = Array.from(this._participants.values()).some(p => p.hasVideo && p.id !== this.localParticipantId);
        console.log(`[DEBUG] hasOtherVideo() check:`, {
            participants: Array.from(this._participants.values()).map(p => ({
                id: p.id,
                hasVideo: p.hasVideo,
                isLocalParticipant: p.id === this.localParticipantId
            })),
            localParticipantId: this.localParticipantId,
            result: result
        });
        return result;
    }

    updateGrid() {
        const participantGrid = document.getElementById('participantGrid');
        if (!participantGrid) return;

        const participantCount = this._participants.size;
        participantGrid.setAttribute('data-count', participantCount.toString());
        
        this.calculateSmartGrid(participantGrid, participantCount);
        this.setupScrollIndicator();
        this.handleGridScrolling();
    }

    calculateSmartGrid(container, participantCount) {
        if (participantCount === 0) return;

        const containerRect = container.getBoundingClientRect();
        const availableWidth = containerRect.width - 16;
        const availableHeight = containerRect.height - 16;
        
        if (availableWidth <= 0 || availableHeight <= 0) {
            setTimeout(() => this.updateGrid(), 100);
            return;
        }

        const { cols, rows, cellWidth, cellHeight } = this.getOptimalGridLayout(
            participantCount, 
            availableWidth, 
            availableHeight
        );

        container.style.display = 'grid';
        container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        container.style.gap = '12px';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.padding = '8px';
        
        this.updateParticipantCardSizes(cellWidth, cellHeight);
    }

    getOptimalGridLayout(participantCount, containerWidth, containerHeight) {
        const minCellWidth = window.innerWidth <= 768 ? 200 : 300;
        const minCellHeight = window.innerWidth <= 768 ? 150 : 200;
        const aspectRatio = 16 / 9;
        
        let bestLayout = { cols: 1, rows: 1, cellWidth: containerWidth, cellHeight: containerHeight };
        let bestScore = 0;

        for (let cols = 1; cols <= Math.min(participantCount, 6); cols++) {
            const rows = Math.ceil(participantCount / cols);
            
            const cellWidth = (containerWidth - (cols - 1) * 12) / cols;
            const cellHeight = (containerHeight - (rows - 1) * 12) / rows;
            
            if (cellWidth < minCellWidth || cellHeight < minCellHeight) continue;
            
            const widthScore = Math.min(cellWidth / minCellWidth, 2);
            const heightScore = Math.min(cellHeight / minCellHeight, 2);
            const aspectScore = 1 - Math.abs((cellWidth / cellHeight) - aspectRatio) / aspectRatio;
            const utilizationScore = participantCount / (cols * rows);
            
            const score = widthScore * heightScore * aspectScore * utilizationScore;
            
            if (score > bestScore) {
                bestScore = score;
                bestLayout = { cols, rows, cellWidth, cellHeight };
            }
        }

        return bestLayout;
    }

    updateParticipantCardSizes(cellWidth, cellHeight) {
        const allCards = document.querySelectorAll('.participant-card, .video-participant-card, .screen-share-card');
        
        allCards.forEach(card => {
            const video = card.querySelector('video');
            if (video) {
                video.style.objectFit = cellWidth / cellHeight > 16/9 ? 'contain' : 'cover';
                video.style.width = '100%';
                video.style.height = '100%';
            }
            
            const avatar = card.querySelector('.participant-avatar');
            if (avatar) {
                const size = Math.min(cellWidth * 0.3, cellHeight * 0.3, 120);
                avatar.style.width = `${size}px`;
                avatar.style.height = `${size}px`;
                avatar.style.fontSize = `${size * 0.3}px`;
            }
        });
    }

    setupScrollIndicator() {
        const unifiedGridView = document.getElementById('unifiedGridView');
        const participantGrid = document.getElementById('participantGrid');
        
        if (!unifiedGridView || !participantGrid) return;
        
        let scrollIndicator = unifiedGridView.querySelector('.scroll-indicator');
        if (!scrollIndicator) {
            scrollIndicator = document.createElement('div');
            scrollIndicator.className = 'scroll-indicator';
            scrollIndicator.innerHTML = '<i class="fas fa-chevron-down"></i>';
            unifiedGridView.appendChild(scrollIndicator);
        }
        
        const checkScrollable = () => {
            const isScrollable = participantGrid.scrollHeight > participantGrid.clientHeight;
            const participantCount = this._participants.size;
            
            if (isScrollable && participantCount > 4) {
                scrollIndicator.classList.add('visible');
                scrollIndicator.textContent = `${participantCount} participants`;
            } else {
                scrollIndicator.classList.remove('visible');
            }
        };
        
        setTimeout(checkScrollable, 200);
        
        participantGrid.removeEventListener('scroll', this._scrollHandler);
        this._scrollHandler = () => {
            const { scrollTop, scrollHeight, clientHeight } = participantGrid;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
            
            if (isAtBottom) {
                scrollIndicator.classList.remove('visible');
            } else {
                const participantCount = this._participants.size;
                if (participantCount > 4) {
                    scrollIndicator.classList.add('visible');
                }
            }
        };
        participantGrid.addEventListener('scroll', this._scrollHandler);
    }

    handleGridScrolling() {
        const participantGrid = document.getElementById('participantGrid');
        if (!participantGrid) return;
        
        participantGrid.style.scrollBehavior = 'smooth';
        
        let isScrolling = false;
        participantGrid.addEventListener('scroll', () => {
            if (!isScrolling) {
                isScrolling = true;
                setTimeout(() => {
                    isScrolling = false;
                }, 100);
            }
        });
        
        participantGrid.addEventListener('wheel', (e) => {
            e.stopPropagation();
        });
    }

    updateView() {
        const unifiedGridView = document.getElementById('unifiedGridView');
        const screenShareView = document.getElementById('screenShareView');

        console.log(`[DEBUG] updateView() called with state:`, {
            isVideoOn: this.isVideoOn,
            isScreenSharing: this.isScreenSharing,
            hasOtherVideo: this.hasOtherVideo(),
            currentView: this.currentView,
            elementsFound: {
                unifiedGridView: !!unifiedGridView,
                screenShareView: !!screenShareView
            }
        });

        this.currentView = 'unified';
        screenShareView?.classList.add('hidden');
        unifiedGridView?.classList.remove('hidden');
        this.updateGrid();
        console.log('[DEBUG] Showing unified grid view');

        this.updateButtonStates();
        this.updateParticipantCount();
    }

    async toggleMic() {
        try {
            if (window.localStorageManager) {
                const isMuted = window.localStorageManager.toggleVoiceMute();
                this.showToast(isMuted ? 'Microphone muted' : 'Microphone enabled', 'info');
            } else if (window.videoSDKManager?.isReady()) {
                const newState = window.videoSDKManager.toggleMic();
                this.showToast(newState ? 'Microphone enabled' : 'Microphone muted', 'info');
                
                if (window.MusicLoaderStatic) {
                    if (newState) {
                        window.MusicLoaderStatic.playDiscordUnmuteSound();
                    } else {
                        window.MusicLoaderStatic.playDiscordMuteSound();
                    }
                }
            } else {
                this.showToast('Voice not connected', 'error');
            }
        } catch (error) {
            console.error('Error toggling mic:', error);
            this.showToast('Failed to toggle microphone', 'error');
        }
    }

    async toggleDeafen() {
        try {
            let isDeafened = false;
            
            // Toggle deafen state
            if (window.localStorageManager) {
                isDeafened = window.localStorageManager.toggleVoiceDeafen();
                
                // When deafening, also mute the microphone
                if (isDeafened && !this.isMuted) {
                    window.localStorageManager.setVoiceMute(true);
                    this.isMuted = true;
                }
                
                this.showToast(isDeafened ? 'Audio deafened' : 'Audio undeafened', 'info');
            } else if (window.videoSDKManager?.isReady()) {
                isDeafened = window.videoSDKManager.toggleDeafen();
                
                // When deafening, also mute the microphone
                if (isDeafened && !this.isMuted) {
                    window.videoSDKManager.toggleMic(false); // Force mute
                    this.isMuted = true;
                }
                
                this.showToast(isDeafened ? 'Audio deafened' : 'Audio undeafened', 'info');
            } else {
                this.showToast('Voice not connected', 'error');
                return;
            }
            
            // Update UI for both deafen and mic buttons
            this.isDeafened = isDeafened;
            this.updateButtonStates();
            
            // Dispatch event for cross-component sync
            window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                detail: {
                    type: 'deafen',
                    state: isDeafened,
                    source: 'voice-call-section'
                }
            }));
            
            // If we're deafening, also dispatch mic mute event
            if (isDeafened && !this.isMuted) {
                window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                    detail: {
                        type: 'mic',
                        state: false,
                        source: 'voice-call-section'
                    }
                }));
            }
        } catch (error) {
            console.error('Error toggling deafen:', error);
            this.showToast('Failed to toggle deafen', 'error');
        }
    }

    async toggleVideo() {
        if (!window.videoSDKManager?.isReady()) {
            this.showToast('Voice not connected', 'error');
            return;
        }

        if (!this.localParticipantId && window.videoSDKManager?.meeting?.localParticipant) {
            this.localParticipantId = window.videoSDKManager.meeting.localParticipant.id;
        }

        try {
            const newState = await window.videoSDKManager.toggleWebcam();
            this.showToast(newState ? 'Camera enabled' : 'Camera disabled', 'info');
        } catch (error) {
            this.showToast('Failed to toggle camera', 'error');
        }
    }

    async toggleScreenShare() {
        if (!window.videoSDKManager?.isReady()) {
            this.showToast('Voice not connected', 'error');
            return;
        }

        try {
            const newState = await window.videoSDKManager.toggleScreenShare();
            this.showToast(newState ? 'Screen share started' : 'Screen share stopped', 'info');
        } catch (error) {
            console.error('Error toggling screen share:', error);
            this.showToast('Failed to toggle screen share', 'error');
        }
    }

    openTicTacToe() {
        const serverId = document.querySelector('meta[name="server-id"]')?.content;
        const userId = document.querySelector('meta[name="user-id"]')?.content;
        const username = document.querySelector('meta[name="username"]')?.content;
        
        if (!serverId || !userId || !username) {
            this.showToast('Missing required information. Please refresh the page.', 'error');
            return;
        }
        
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            this.showToast('Connection not ready. Please wait and try again.', 'error');
            return;
        }
        
        if (window.TicTacToeModal) {
            window.TicTacToeModal.createTicTacToeModal(serverId, userId, username);
        } else {
            this.loadTicTacToeAndOpen(serverId, userId, username);
        }
    }

    async loadTicTacToeAndOpen(serverId, userId, username) {
        try {
            if (!document.querySelector('script[src*="tic-tac-toe.js"]')) {
                const script = document.createElement('script');
                script.src = '/public/js/components/activity/tic-tac-toe.js?v=' + Date.now();
                script.onload = () => {
                    if (window.TicTacToeModal) {
                        window.TicTacToeModal.createTicTacToeModal(serverId, userId, username);
                    } else {
                        this.showToast('Game not available. Please try again later.', 'error');
                    }
                };
                script.onerror = () => {
                    this.showToast('Failed to load game. Please try again.', 'error');
                };
                document.head.appendChild(script);
            }
        } catch (error) {
            this.showToast('Failed to load game. Please try again.', 'error');
        }
    }

    addBotParticipant(participant) {
        this._participants.set(participant.id, participant);
        this.updateParticipantCount();
    }

    removeBotParticipant(participantId) {
        this._participants.delete(participantId);
        this.updateParticipantCount();
    }

    disconnect() {
        console.log('ðŸšª [VOICE-CALL-MANAGER] Disconnect button clicked - leaving voice channel');
        
        if (window.voiceManager?.isConnected) {
            window.voiceManager.leaveVoice();
        }
        
        // ðŸŽ¯ PRESENCE RESET AFTER VOICE DISCONNECT
        if (window.globalSocketManager?.isReady()) {
            console.log('ðŸŽ¤ [VOICE-CALL-MANAGER] Resetting presence to online after voice disconnect');
            window.globalSocketManager.updatePresence('online', { type: 'active' });
        }
        
        window.dispatchEvent(new CustomEvent('voiceDisconnect'));
        console.log('ðŸ“¡ [VOICE-CALL-MANAGER] Dispatched voiceDisconnect event');
        
        if (window.MusicLoaderStatic?.playDisconnectVoiceSound) {
            window.MusicLoaderStatic.playDisconnectVoiceSound();
        }
        
        this.showToast('Disconnected from voice channel', 'info');
    }

    updateScreenShareParticipants() {
        
    }

    showPictureInPicture() {
        
    }

    updateButtonStates() {
        // Update mic button
        const micBtn = document.getElementById('micBtn');
        const micIcon = micBtn?.querySelector('i');
        const micTooltip = micBtn?.querySelector('.voice-tooltip');
        
        if (this.isMuted) {
            micBtn?.classList.add('muted');
            micIcon?.classList.replace('fa-microphone', 'fa-microphone-slash');
            if (micTooltip) micTooltip.textContent = 'Unmute';
        } else {
            micBtn?.classList.remove('muted');
            micIcon?.classList.replace('fa-microphone-slash', 'fa-microphone');
            if (micTooltip) micTooltip.textContent = 'Mute';
        }

        // Update deafen button
        const deafenBtn = document.getElementById('deafenBtn');
        const deafenIcon = deafenBtn?.querySelector('i');
        const deafenTooltip = deafenBtn?.querySelector('.voice-tooltip');
        
        if (this.isDeafened) {
            deafenBtn?.classList.add('deafened');
            deafenIcon?.classList.replace('fa-headphones', 'fa-volume-mute');
            if (deafenTooltip) deafenTooltip.textContent = 'Undeafen';
        } else {
            deafenBtn?.classList.remove('deafened');
            deafenIcon?.classList.replace('fa-volume-mute', 'fa-headphones');
            if (deafenTooltip) deafenTooltip.textContent = 'Deafen';
        }

        // Update video button
        const videoBtn = document.getElementById('videoBtn');
        const videoIcon = videoBtn?.querySelector('i');
        const videoTooltip = videoBtn?.querySelector('.voice-tooltip');
        
        if (this.isVideoOn) {
            videoBtn?.classList.add('active');
            videoIcon?.classList.replace('fa-video-slash', 'fa-video');
            if (videoTooltip) videoTooltip.textContent = 'Turn Off Camera';
        } else {
            videoBtn?.classList.remove('active');
            videoIcon?.classList.replace('fa-video', 'fa-video-slash');
            if (videoTooltip) videoTooltip.textContent = 'Turn On Camera';
        }

        // Update screen share button
        const screenBtn = document.getElementById('screenBtn');
        const screenIcon = screenBtn?.querySelector('i');
        const screenTooltip = screenBtn?.querySelector('.voice-tooltip');
        
        if (this.isScreenSharing) {
            screenBtn?.classList.add('screen-sharing');
            screenIcon?.classList.replace('fa-desktop', 'fa-stop-circle');
            if (screenTooltip) screenTooltip.textContent = 'Stop Sharing';
        } else {
            screenBtn?.classList.remove('screen-sharing');
            screenIcon?.classList.replace('fa-stop-circle', 'fa-desktop');
            if (screenTooltip) screenTooltip.textContent = 'Share Screen';
        }
    }

    createScreenShareParticipantElement(participant) {
        
    }

    displayMeetingId(meetingId) {
        const meetingIdDisplay = document.getElementById('meetingIdDisplay');
        if (meetingIdDisplay && meetingId) {
            meetingIdDisplay.textContent = meetingId;
            meetingIdDisplay.title = `Click to copy meeting ID: ${meetingId}`;
            meetingIdDisplay.style.cursor = 'pointer';
            
            // Add click to copy functionality
            meetingIdDisplay.onclick = () => {
                navigator.clipboard.writeText(meetingId).then(() => {
                    this.showToast('Meeting ID copied to clipboard', 'success');
                }).catch(() => {
                    this.showToast('Failed to copy meeting ID', 'error');
                });
            };
        }
    }

    async getParticipantAvatarUrl(participant) {
        // Show a distinctive icon for bots instead of the generic default image
        if (participant.isBot) {
            return null; // triggers icon fallback in the UI
        }
        if (participant.isLocal) {
            return document.querySelector('meta[name="user-avatar"]')?.content || 
                   sessionStorage.getItem('user_avatar_url') ||
                   window.currentUserAvatar ||
                   '/public/assets/common/default-profile-picture.png';
        }
        
        if (participant.avatarUrl) {
            return participant.avatarUrl;
        }
        
        if (participant.id && !participant.isBot) {
            const isValidUserId = /^\d+$/.test(participant.id);
            
            if (isValidUserId) {
                try {
                    if (window.userAPI) {
                        const userData = await window.userAPI.getUserProfile(participant.id);
                        if (userData && userData.success && userData.data && userData.data.user && userData.data.user.avatar_url) {
                            participant.avatarUrl = userData.data.user.avatar_url;
                            return userData.data.user.avatar_url;
                        }
                    } else {
                        const response = await fetch(`/api/users/${participant.id}/profile`, {
                            method: 'GET',
                            credentials: 'same-origin'
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            if (data.success && data.data && data.data.user && data.data.user.avatar_url) {
                                participant.avatarUrl = data.data.user.avatar_url;
                                return data.data.user.avatar_url;
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Failed to fetch participant avatar:', error);
                }
            } else {
                console.log('[VOICE-CALL] Using session ID for avatar lookup:', participant.id);
            }
        }
        
        return '/public/assets/common/default-profile-picture.png';
    }

    getAvatarColor(username) {
        const colors = ['#5865f2', '#3ba55c', '#faa61a', '#ed4245', '#9b59b6', '#e91e63', '#00bcd4', '#607d8b'];
        const hash = username.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }

    showToast(message, type) {
        if (window.showToast) {
            window.showToast(message, type, 3000);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    setupControls() {
        document.getElementById('micBtn').addEventListener('click', () => this.toggleMic());
        document.getElementById('deafenBtn').addEventListener('click', () => this.toggleDeafen());
        document.getElementById('videoBtn').addEventListener('click', () => this.toggleVideo());
        document.getElementById('screenBtn').addEventListener('click', () => this.toggleScreenShare());
        document.getElementById('ticTacToeBtn').addEventListener('click', () => this.openTicTacToe());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
    }

    setupDoubleClickHandlers() {
        const participantGrid = document.getElementById('participantGrid');
        if (!participantGrid) return;
        
        participantGrid.addEventListener('dblclick', (event) => {
            const card = event.target.closest('.screen-share-card, .video-participant-card, .voice-participant-card');
            if (!card) return;
            
            let participantIdAttr = card.dataset.participantId || '';
            const isScreenShare = card.classList.contains('screen-share-card') || participantIdAttr.endsWith('-screenshare');

            if (isScreenShare) {
                participantIdAttr = participantIdAttr.replace('-screenshare', '');
            }
            
            console.log('[FULLSCREEN] Double-click detected:', {
                participantId: participantIdAttr,
                isScreenShare,
                cardClasses: card.className
            });
            
            this.toggleParticipantFullscreen(participantIdAttr, isScreenShare ? 'screenshare' : 'video');
        });
    }

    toggleParticipantFullscreen(participantId, cardType = 'video') {
        const fullscreenId = cardType === 'screenshare' ? `${participantId}-screenshare` : participantId;
        
        if (this.fullscreenParticipant === fullscreenId) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen(participantId, cardType);
        }
    }

    enterFullscreen(participantId, cardType = 'video') {
        this.exitFullscreen();
        
        const fullscreenId = cardType === 'screenshare' ? `${participantId}-screenshare` : participantId;
        this.fullscreenParticipant = fullscreenId;
        this.isFullscreenMode = true;
        
        let targetCard;
        let cardSelector;
        if (cardType === 'screenshare') {
            cardSelector = `[data-participant-id="${participantId}-screenshare"].screen-share-card`;
            targetCard = document.querySelector(cardSelector);
        } else {
            cardSelector = `[data-participant-id="${participantId}"].video-participant-card:not(.screen-share-card), [data-participant-id="${participantId}"].voice-participant-card`;
            targetCard = document.querySelector(cardSelector);
        }
        
        if (!targetCard) {
            console.log('[FULLSCREEN] Target card not found, aborting fullscreen');
            return;
        }
        
        const participant = this._participants.get(participantId);
        if (!participant) {
            console.log('[FULLSCREEN] Participant not found:', participantId);
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-overlay';
        overlay.id = 'participantFullscreenOverlay';
        
        const clonedCard = targetCard.cloneNode(true);
        clonedCard.className = 'fullscreen-participant';
        
        const originalVideo = targetCard.querySelector('video');
        const clonedVideo = clonedCard.querySelector('video');
        
        if (originalVideo && clonedVideo && originalVideo.srcObject) {
            clonedVideo.srcObject = originalVideo.srcObject;
            clonedVideo.autoplay = true;
            clonedVideo.playsInline = true;
            clonedVideo.muted = originalVideo.muted;
            clonedVideo.play().catch(error => console.warn('[FULLSCREEN] Video play failed:', error));
        }
        
        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'minimize-btn';
        minimizeBtn.innerHTML = '<i class="fas fa-times"></i>';
        minimizeBtn.onclick = () => this.exitFullscreen();
        
        const participantInfo = document.createElement('div');
        participantInfo.className = 'fullscreen-participant-info';
        const isLocal = participantId === this.localParticipantId ? ' (You)' : '';
        const shareType = cardType === 'screenshare' ? ' - Screen' : '';
        participantInfo.textContent = `${participant.name}${isLocal}${shareType}`;
        
        clonedCard.appendChild(minimizeBtn);
        clonedCard.appendChild(participantInfo);
        overlay.appendChild(clonedCard);
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.exitFullscreen();
            }
        });
        
        document.addEventListener('keydown', this.handleFullscreenKeydown.bind(this));
    }

    exitFullscreen() {
        if (!this.isFullscreenMode) return;
        
        this.fullscreenParticipant = null;
        this.isFullscreenMode = false;
        
        const overlay = document.getElementById('participantFullscreenOverlay');
        if (overlay) {
            overlay.remove();
        }
        
        document.removeEventListener('keydown', this.handleFullscreenKeydown.bind(this));
    }

    handleFullscreenKeydown(event) {
        if (event.key === 'Escape' && this.isFullscreenMode) {
            this.exitFullscreen();
        }
    }

    clear() {
        this._participants.clear();
    }

    broadcastParticipantUpdate(action, participantId, participantName) {
        // This is a placeholder for potential future use with a backend service.
        // For now, it just logs to the console.
        //console.log(`[VoiceCallManager] Participant update: ${participantName} (${participantId}) has ${action}.`);
    }

    updateControlsUI(type, state) {
        const controlMap = {
            mic: { btn: document.getElementById('micBtn'), icon: 'fas fa-microphone', activeClass: 'text-[#3ba55c]', tooltip: 'Unmute', defaultTooltip: 'Mute' },
            deafen: { btn: document.getElementById('deafenBtn'), icon: 'fas fa-headphones', activeClass: 'text-[#3ba55c]', tooltip: 'Undeafen', defaultTooltip: 'Deafen' },
            video: { btn: document.getElementById('videoBtn'), icon: 'fas fa-video-slash', activeClass: 'text-[#3ba55c]', tooltip: 'Turn Off Camera', defaultTooltip: 'Turn On Camera' },
            screenShare: { btn: document.getElementById('screenBtn'), icon: 'fas fa-desktop', activeClass: 'text-[#5865f2]', tooltip: 'Stop Sharing', defaultTooltip: 'Share Screen' }
        };

        const control = controlMap[type];
        if (!control) return;

        const iconEl = control.btn.querySelector('i');

        if (state) {
            control.btn.classList.add('active');
            if (control.activeClass) {
                iconEl.classList.add(control.activeClass);
            }
            control.btn.querySelector('.voice-tooltip').textContent = control.tooltip;
            
            if (type === 'mic' || type === 'deafen') {
                control.btn.classList.add('bg-[#ed4245]');
            } else if (type === 'video') {
                iconEl.className = 'fas fa-video text-sm';
            } else if (type === 'screenShare') {
                iconEl.classList.add(control.activeClass);
            }
        } else {
            control.btn.classList.remove('active');
            if (control.activeClass) {
                iconEl.classList.remove(control.activeClass);
            }
            control.btn.querySelector('.voice-tooltip').textContent = control.defaultTooltip;

            if (type === 'mic' || type === 'deafen') {
                control.btn.classList.remove('bg-[#ed4245]');
            } else if (type === 'video') {
                iconEl.className = 'fas fa-video-slash text-sm';
            } else if (type === 'screenShare') {
                iconEl.classList.remove(control.activeClass);
            }
        }

        if (type === 'deafen') {
            const micBtn = document.getElementById('micBtn');
            const micIcon = micBtn.querySelector('i');
            micBtn.disabled = state;
            micBtn.classList.toggle('opacity-50', state);

            if (state) {
                micIcon.classList.remove('fa-microphone-slash');
                micIcon.classList.add('fa-microphone');
                micBtn.classList.add('bg-[#ed4245]');
                micBtn.querySelector('.voice-tooltip').textContent = 'Deafened';
            } else {
                micBtn.querySelector('.voice-tooltip').textContent = this.isMicMuted ? 'Unmute' : 'Mute';
            }
        }
    }
    
    addParticipant(participantId, participantName = 'Anonymous', avatarUrl = '') {
        if (this.participants.has(participantId)) return;

        const participantData = {
            id: participantId,
            name: participantName,
            avatar: avatarUrl || '/public/assets/common/default-profile-picture.png',
            streams: new Map()
        };
        this.participants.set(participantId, participantData);
        
        this.updateGrid();
        this.broadcastParticipantUpdate('join', participantId, participantData.name);
    }

    removeParticipant(participantId) {
        const participantData = this.participants.get(participantId);
        if (participantData) {
            this.participants.delete(participantId);
            this.updateGrid();
            this.broadcastParticipantUpdate('leave', participantId, participantData.name);
        }
    }
    
    updateParticipantStream(participantId, kind, stream) {
        if (!this.participants || !this.participants.has(participantId)) {
            const data = this.getParticipantData(participantId);
            if (data) {
                this.addParticipant(participantId, data.name, data.avatar);
            } else {
                return;
            }
        }
        
        const participant = this.participants.get(participantId);
        if (participant?.streams) {
            participant.streams.set(kind, stream);
            
            if (kind === 'video' || kind === 'share') {
                participant.hasVideo = true;
            }

            this.updateGrid();
        }
    }
    
    removeParticipantStream(participantId, kind) {
        if (!this.participants) return;
        const participant = this.participants.get(participantId);
        if (participant?.streams?.has(kind)) {
            participant.streams.delete(kind);
            if (kind === 'video' || kind === 'share') {
                participant.hasVideo = Array.from(participant.streams.keys()).some(k => k === 'video' || k === 'share');
            }
            this.updateGrid();
        }
    }

    updateGrid() {
        const grid = document.getElementById('participantGrid');
        if (!grid || !this.participants) return;

        const sortedParticipants = Array.from(this.participants.values()).sort((a, b) => {
            const aHasVideo = a.streams?.has('video') || a.streams?.has('share');
            const bHasVideo = b.streams?.has('video') || b.streams?.has('share');
            if (aHasVideo !== bHasVideo) return aHasVideo ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        // Clear grid but preserve elements for transition
        const existingElements = new Map();
        Array.from(grid.children).forEach(child => {
            existingElements.set(child.dataset.participantId, child);
        });
        
        const fragment = document.createDocumentFragment();
        
        sortedParticipants.forEach(p => {
            const hasVideo = p.streams?.has('video') || p.streams?.has('share');
            let el;

            if (existingElements.has(p.id)) {
                el = existingElements.get(p.id);
                existingElements.delete(p.id);
                
                // Update existing element
                if (hasVideo) {
                    this.updateVideoCard(el, p);
                } else {
                    this.updateVoiceCard(el, p);
                }

            } else {
                el = hasVideo ? this.createVideoCard(p) : this.createVoiceCard(p);
            }
            
            fragment.appendChild(el);
        });

        // Remove participants who left
        existingElements.forEach(el => el.remove());
        
        // Append new/updated participants
        grid.innerHTML = '';
        grid.appendChild(fragment);

        this.adjustGridLayout(sortedParticipants.length);
        this.updateParticipantCount();
    }

    createVideoCard(participant) {
        const card = document.createElement('div');
        card.className = 'video-participant-card';
        card.dataset.participantId = participant.id;

        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.muted = participant.id === this.userId;
        
        const stream = participant.streams.get('share') || participant.streams.get('video');
        if (stream) {
            video.srcObject = stream;
            video.play().catch(e => console.error("Video play error:", e));
        }

        const overlay = document.createElement('div');
        overlay.className = 'video-participant-overlay';
        overlay.textContent = participant.name;

        card.append(video, overlay);
        return card;
    }

    updateVideoCard(card, participant) {
        let video = card.querySelector('video');
        if (!video) {
            video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;
            card.innerHTML = '';
            card.appendChild(video);
        }
        
        const stream = participant.streams.get('share') || participant.streams.get('video');
        if (stream && video.srcObject !== stream) {
            video.srcObject = stream;
            video.play().catch(e => console.error("Video play error:", e));
        }
        
        let overlay = card.querySelector('.video-participant-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'video-participant-overlay';
            card.appendChild(overlay);
        }
        overlay.textContent = participant.name;
        
        card.className = 'video-participant-card';
        return card;
    }

    createVoiceCard(participant) {
        const card = document.createElement('div');
        card.className = 'participant-card';
        card.dataset.participantId = participant.id;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'participant-avatar';
        if (participant.avatar) {
            avatarDiv.innerHTML = `<img src="${participant.avatar}" alt="${participant.name}" class="w-full h-full object-cover">`;
        } else {
            avatarDiv.textContent = participant.name.charAt(0).toUpperCase();
            avatarDiv.style.backgroundColor = this.getUserColor(participant.name);
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'participant-name';
        nameSpan.textContent = participant.name;

        card.append(avatarDiv, nameSpan);
        return card;
    }

    updateVoiceCard(card, participant) {
        card.className = 'participant-card';
        let avatarDiv = card.querySelector('.participant-avatar');
        if (!avatarDiv) {
            avatarDiv = document.createElement('div');
            avatarDiv.className = 'participant-avatar';
            card.innerHTML = '';
            card.appendChild(avatarDiv);
        }

        if (participant.avatar) {
            let img = avatarDiv.querySelector('img');
            if (!img) {
                img = document.createElement('img');
                img.alt = participant.name;
                img.className = 'w-full h-full object-cover';
                avatarDiv.innerHTML = '';
                avatarDiv.appendChild(img);
            }
            if (img.src !== participant.avatar) {
                img.src = participant.avatar;
            }
        } else {
            avatarDiv.innerHTML = participant.name.charAt(0).toUpperCase();
            avatarDiv.style.backgroundColor = this.getUserColor(participant.name);
        }

        let nameSpan = card.querySelector('.participant-name');
        if (!nameSpan) {
            nameSpan = document.createElement('span');
            nameSpan.className = 'participant-name';
            card.appendChild(nameSpan);
        }
        nameSpan.textContent = participant.name;
        
        return card;
    }
    
    adjustGridLayout(count) {
        const grid = document.getElementById('participantGrid');
        if (!grid) return;
        
        let cols = Math.ceil(Math.sqrt(count));
        let rows = Math.ceil(count / cols);
        
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    }

    getUserColor(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return "#" + "00000".substring(0, 6 - c.length) + c;
    }
    
    updateParticipantCount() {
        const countEl = document.getElementById('voiceParticipantCount');
        if (countEl) {
            countEl.textContent = this.participants.size;
        }
    }
    
    broadcastParticipantUpdate(action, participantId, participantName) {
    }

    cleanup() {
        this.participants.clear();
        this.updateGrid();
        this.updateParticipantCount();
    }

    getParticipantData(participantId) {
        if (!window.videoSDKManager?.meeting?.participants) return null;
        
        return this.participants.get(participantId);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.voice-call-app')) {
        window.voiceCallManager = new VoiceCallManager();
    }
});
