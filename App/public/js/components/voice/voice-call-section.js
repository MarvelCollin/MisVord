import MusicLoaderStatic from '/public/js/utils/music-loader-static.js';
import '/public/js/components/voice/voice-facade.js';

class VoiceCallSection {
    constructor() {
        this.micBtn = null;
        this.videoBtn = null;
        this.deafenBtn = null;
        this.screenBtn = null;
        this.ticTacToeBtn = null;
        this.disconnectBtn = null;
        
        this.participantElements = new Map();
        this.currentModal = null;
        this.modalEscListener = null;
        this.duplicateCleanupInterval = null;
        
        this.currentChannelId = null;
        this.currentChannelName = null;
        this.currentMeetingId = null;
        
        this.init();
    }
    
    init() {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this.setup());
        } else {
            this.setup();
        }
    }
    
    fixButtonStyling() {
        const buttons = ['micBtn', 'videoBtn', 'deafenBtn', 'screenBtn', 'ticTacToeBtn', 'disconnectBtn'];
        
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (!btn) return;

            const styles = {
                width: '48px',
                height: '48px',
                minWidth: '48px',
                minHeight: '48px',
                borderRadius: '50%',
                border: 'none',
                outline: 'none',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                userSelect: 'none',
                flexShrink: '0',
                margin: '0 8px'
            };

            Object.assign(btn.style, styles);
            this.setButtonBackgroundColor(btn, btnId);
        });
    }

    setButtonBackgroundColor(btn, btnId) {
        const colorMap = {
            'micBtn': '#16a34a',
            'videoBtn': '#dc2626', 
            'deafenBtn': '#16a34a',
            'screenBtn': '#dc2626',
            'ticTacToeBtn': '#dc2626',
            'disconnectBtn': '#ed4245'
        };

        if (colorMap[btnId]) {
            btn.style.backgroundColor = colorMap[btnId];
        }

        btn.addEventListener('mouseenter', () => {
            const hoverColors = {
                'micBtn': this._micOn ? '#dc2626' : '#16a34a',
                'videoBtn': '#dc2626',
                'deafenBtn': this._deafened ? '#16a34a' : '#dc2626', 
                'screenBtn': '#dc2626',
                'ticTacToeBtn': '#8b5cf6',
                'disconnectBtn': '#da373c'
            };

            if (hoverColors[btnId] && !btn.classList.contains('active') && !btn.classList.contains('muted') && !btn.classList.contains('deafened')) {
                btn.style.opacity = '0.8';
                btn.style.transform = 'scale(1.05)';
            }
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.opacity = '1';
            btn.style.transform = 'scale(1)';
        });
    }

    ensureIconsVisible() {
        const icons = document.querySelectorAll('.voice-control-btn i');
        icons.forEach(icon => {
            icon.style.display = 'block';
            icon.style.fontSize = '16px';
            icon.style.color = 'white';
            icon.style.pointerEvents = 'none';
        });
    }

    removeDebugPanel() {

        const existingPanel = document.getElementById('voice-debug-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
    }

    setup() {
        this.fixButtonStyling();
        this.ensureIconsVisible();
        this.removeDebugPanel();
        
        this.bindControls();
        this.bindEvents();
        this.initializeVoiceState();
        this.ensureChannelSync();
        this.updateLocalParticipantIndicators();
        this.syncButtonStates();
        
        this.duplicateCleanupInterval = setInterval(() => {
            this.removeDuplicateCards();
            this.cleanupOrphanedElements();
        }, 2000); 
    }
    
    bindControls() {
        this.micBtn = document.getElementById("micBtn");
        this.videoBtn = document.getElementById("videoBtn");
        this.deafenBtn = document.getElementById("deafenBtn");
        this.screenBtn = document.getElementById("screenBtn");
        this.ticTacToeBtn = document.getElementById("ticTacToeBtn");
        this.disconnectBtn = document.getElementById("disconnectBtn");
        
        if (this.micBtn) {
            this.micBtn.addEventListener("click", () => {
                if (window.voiceManager) {
                    const newState = window.voiceManager.toggleMic();
                    this.updateMicButton(newState);
                    
                    if (newState) {
                        MusicLoaderStatic.playDiscordUnmuteSound();
                    } else {
                        MusicLoaderStatic.playDiscordMuteSound();
                    }
                    
                    if (window.localStorageManager) {
                        const currentState = window.localStorageManager.getUnifiedVoiceState();
                        window.localStorageManager.setUnifiedVoiceState({
                            ...currentState,
                            isMuted: !newState
                        });
                    }
                }
            });
        }
        
        if (this.videoBtn) {
            this.videoBtn.addEventListener("click", async () => {
                if (window.voiceManager) {
                    const newState = await window.voiceManager.toggleVideo();
                    this.updateVideoButton(newState);
                }
            });
        }
        
        if (this.deafenBtn) {
            this.deafenBtn.addEventListener("click", () => {
                if (window.voiceManager) {
                    const wasPreviouslyDeafened = window.voiceManager._deafened;
                    const state = window.voiceManager.toggleDeafen();
                    this.updateDeafenButton(state);
                    
                    if (window.MusicLoaderStatic) {
                        if (wasPreviouslyDeafened) {
                            window.MusicLoaderStatic.playDiscordUnmuteSound();
                        } else {
                            window.MusicLoaderStatic.playDiscordMuteSound();
                        }
                    }
                    
                    if (window.localStorageManager) {
                        const currentState = window.localStorageManager.getUnifiedVoiceState();
                        window.localStorageManager.setUnifiedVoiceState({
                            ...currentState,
                            isDeafened: state,
                            isMuted: state ? true : currentState.isMuted
                        });
                    }
                }
            });
        }
        
        if (this.screenBtn) {
            this.screenBtn.addEventListener("click", async () => {
                if (window.voiceManager) {
                    const state = await window.voiceManager.toggleScreenShare();
                    this.updateScreenButton(state);
                }
            });
        }
        
        if (this.ticTacToeBtn) {
            this.ticTacToeBtn.addEventListener("click", () => {
                this.openTicTacToe();
            });
        }
        
        if (this.disconnectBtn) {
            this.disconnectBtn.addEventListener("click", () => {
                if (!window.voiceFacade) return;
                MusicLoaderStatic.playDisconnectVoiceSound();
                window.voiceFacade.leave();
            });
        }
    }
    
    bindEvents() {
        window.addEventListener("participantJoined", (e) => this.handleParticipantJoined(e));
        window.addEventListener("participantLeft", (e) => this.handleParticipantLeft(e));
        window.addEventListener("streamEnabled", (e) => this.handleStreamEnabled(e));
        window.addEventListener("streamDisabled", (e) => this.handleStreamDisabled(e));
        window.addEventListener("voiceStateChanged", (e) => this.handleVoiceStateChanged(e));
        window.addEventListener("localVoiceStateChanged", (e) => this.handleLocalVoiceStateChanged(e));
        window.addEventListener("voiceDisconnect", () => this.clearGrid());
        
        window.addEventListener("voiceConnect", (e) => this.handleVoiceConnect(e));
        window.addEventListener("voiceDisconnect", (e) => this.handleVoiceDisconnect(e));

        if (window.globalSocketManager?.io) {
            this.setupSocketListeners();
        } else {
            window.addEventListener('globalSocketReady', () => this.setupSocketListeners());
        }

        if (window.localStorageManager) {
            window.localStorageManager.addVoiceStateListener((state) => {
                if (state.isConnected && state.channelId && state.meetingId) {
                    this.currentChannelId = state.channelId;
                    this.currentChannelName = state.channelName;
                    this.currentMeetingId = state.meetingId;
                    this.updateConnectionStatus(true, true);
                }
            });

            window.addEventListener('unifiedVoiceStateChanged', (e) => this.handleUnifiedVoiceStateChanged(e));
        }
    }
    
    setupSocketListeners() {
        const socket = window.globalSocketManager?.io;
        if (!socket) return;
        
        socket.on('voice-meeting-registered', (data) => {
            this.handleVoiceMeetingRegistered(data);
        });
        
        socket.on('voice-meeting-update', (data) => {
            this.handleVoiceMeetingUpdate(data);
        });
        
        socket.on('voice-meeting-status', (data) => {
            this.handleVoiceMeetingStatus(data);
        });
        
        socket.on('voice-state-update', (data) => {
            
            
            if (!data.user_id || !data.channel_id || !data.type) return;
            
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
            if (data.user_id === currentUserId) {
                return;
            }
            
            
            this.updateParticipantVoiceState(data.user_id, data.type, data.state);
        });

        if (window.socket) {
            window.socket.on('voice-activity-update', (data) => {
                
                
                if (!data.user_id || !data.channel_id) return;
                
                const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
                if (data.user_id === currentUserId) return;
                
                this.updateSpeakingIndicator(data.user_id, data.is_speaking);
            });
        }
    }
    
    handleUnifiedVoiceStateChanged(event) {
        const { state, source } = event.detail;
        this.syncWithVoiceState(state);
    }
    
    handleVoiceConnect(event) {
        const { channelId, channelName, meetingId } = event.detail;
        

        const urlParams = new URLSearchParams(window.location.search);
        const urlChannelId = urlParams.get('channel');
        const urlChannelType = urlParams.get('type');
        const metaChannelId = document.querySelector('meta[name="channel-id"]')?.content;
        
        let finalChannelId = channelId;
        let finalChannelName = channelName;
        

        if (urlChannelType === 'voice' && urlChannelId && urlChannelId !== channelId) {
            console.warn(`⚠️ [VOICE-CALL-SECTION] Channel ID mismatch in handleVoiceConnect: event=${channelId}, url=${urlChannelId}`);
            finalChannelId = urlChannelId;
            
            const channelElement = document.querySelector(`[data-channel-id="${urlChannelId}"]`);
            finalChannelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                              channelElement?.getAttribute('data-channel-name') || 
                              channelName || 'Voice Channel';
        } 

        else if (metaChannelId && metaChannelId !== channelId && document.querySelector(`[data-channel-id="${metaChannelId}"][data-channel-type="voice"]`)) {
            console.warn(`⚠️ [VOICE-CALL-SECTION] Channel ID mismatch in handleVoiceConnect: event=${channelId}, meta=${metaChannelId}`);
            finalChannelId = metaChannelId;
            
            const channelElement = document.querySelector(`[data-channel-id="${metaChannelId}"]`);
            finalChannelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                              channelElement?.getAttribute('data-channel-name') || 
                              channelName || 'Voice Channel';
        }
        
        this.currentChannelId = finalChannelId;
        this.currentChannelName = finalChannelName;
        this.currentMeetingId = meetingId;
        

        const channelDom = document.querySelector(`[data-channel-id="${finalChannelId}"]`);
        if (channelDom && meetingId) {
            channelDom.setAttribute('data-meeting-id', meetingId);
        }
        

        if (window.voiceManager) {
            window.voiceManager.currentChannelId = finalChannelId;
            window.voiceManager.currentChannelName = finalChannelName;
            window.voiceManager.currentMeetingId = meetingId;
        }
        

        if (window.localStorageManager) {
            const currentState = window.localStorageManager.getUnifiedVoiceState();
            window.localStorageManager.setUnifiedVoiceState({
                ...currentState,
                isConnected: true,
                channelId: finalChannelId,
                channelName: finalChannelName,
                meetingId: meetingId,
                connectionTime: Date.now()
            });
        }
        

        this.updateConnectionStatus(true);
        
        setTimeout(() => {
            if (window.globalSocketManager?.io && finalChannelId) {
                console.log(`🔍 [VOICE-CALL-SECTION] Requesting voice meeting status after connection:`, finalChannelId);
                window.globalSocketManager.io.emit('check-voice-meeting', { 
                    channel_id: finalChannelId 
                });
                window.globalSocketManager.io.emit('request-music-state', { 
                    channel_id: finalChannelId 
                });
            }
        }, 300);

        setTimeout(() => {
            console.log(`🔄 [VOICE-CALL-SECTION] Starting participant synchronization after voice connect`);
            this.syncWithExistingParticipants();
            
            if (window.voiceManager && typeof window.voiceManager.checkAllParticipantsForExistingStreams === 'function') {
                window.voiceManager.checkAllParticipantsForExistingStreams();
            }
        }, 500);
        
        setTimeout(() => {
            this.rebuildGridFromVideoSDK();
            if (window.voiceManager && typeof window.voiceManager.forceStreamSync === 'function') {
                window.voiceManager.forceStreamSync();
            }
            this.forceResyncAllStreams();
            
            console.log(`🔄 [VOICE-CALL-SECTION] Force rebuilding grid after voice connect`);
        }, 500);
        
        setTimeout(() => {
            if (window.voiceManager && typeof window.voiceManager.forceStreamSync === 'function') {
                window.voiceManager.forceStreamSync();
            }
            if (window.voiceManager && typeof window.voiceManager.checkAllParticipantsForExistingStreams === 'function') {
                window.voiceManager.checkAllParticipantsForExistingStreams();
            }
            this.ensureAllExistingStreamsVisibleToNewParticipant();
        }, 800);
        
        setTimeout(() => {
            this.forceResyncAllStreams();
            if (window.voiceManager) {
                window.voiceManager.participants.forEach((data, participantId) => {
                    const participant = window.voiceManager.meeting?.participants?.get(participantId);
                    if (participant) {
                        window.voiceManager.forceParticipantStreamSync(participant);
                    }
                });
            }
            this.removeDuplicateCards();
            this.cleanupOrphanedElements();
        }, 1200);
        
        if (!event.detail.skipJoinSound) {
            MusicLoaderStatic.playJoinVoiceSound();
        }
    }
    
    handleVoiceDisconnect(event) {
        this.currentChannelId = null;
        this.currentChannelName = null;
        this.currentMeetingId = null;
        

        this.updateConnectionStatus(false);
        this.clearGrid();
    }
    
    handleVoiceMeetingRegistered(data) {
        
        
        if (data.user_id === this.getCurrentUserId()) {
            this.currentMeetingId = data.meeting_id;
            this.updateConnectionStatus(true);
        }
    }
    
    handleVoiceMeetingUpdate(data) {
        
        
        if (data.action === 'join' && data.user_id === this.getCurrentUserId()) {
            this.currentMeetingId = data.meeting_id;
            this.updateConnectionStatus(true);
        } else if (data.action === 'leave' && data.user_id === this.getCurrentUserId()) {
            this.currentMeetingId = null;
            this.updateConnectionStatus(false);
        } else if (data.action === 'join' && data.user_id !== this.getCurrentUserId()) {
            if (!this.participantElements.has(data.user_id)) {
                const participantData = {
                    user_id: data.user_id,
                    username: data.username,
                    avatar_url: data.avatar_url,
                    isBot: data.isBot || false
                };
                const element = this.createParticipantElement(data.user_id, participantData);
                const grid = document.getElementById("participantGrid");
                if (grid) {
                    grid.appendChild(element);
                    this.participantElements.set(data.user_id, element);
                    this.updateGridLayout();
                    this.updateParticipantCount();
                }

                if (!participantData.isBot && window.musicPlayer) {
                    window.musicPlayer.shareCurrentMusicStateWithParticipant(data.user_id);
                }
            }
        } else if (data.action === 'leave' && data.user_id !== this.getCurrentUserId()) {
            const element = this.participantElements.get(data.user_id);
            if (element) {
                element.remove();
                this.participantElements.delete(data.user_id);
                this.updateGridLayout();
                this.updateParticipantCount();
            }
        } else if (data.action === 'already_registered') {
            if (!this.participantElements.has(data.user_id)) {
                const participantData = {
                    user_id: data.user_id,
                    username: data.username,
                    avatar_url: data.avatar_url,
                    isBot: data.isBot || false
                };
                const element = this.createParticipantElement(data.user_id, participantData);
                const grid = document.getElementById("participantGrid");
                if (grid) {
                    grid.appendChild(element);
                    this.participantElements.set(data.user_id, element);
                    this.updateGridLayout();
                    this.updateParticipantCount();
                }
            }
        }
    }
    
    handleVoiceMeetingStatus(data) {
        console.log(`📊 [VOICE-CALL-SECTION] Processing voice meeting status:`, {
            hasParticipants: Array.isArray(data.participants),
            participantCount: data.participants?.length,
            hasMeeting: data.has_meeting,
            meetingId: data.meeting_id,
            currentChannelId: this.currentChannelId,
            existingCards: this.participantElements.size
        });

        if (data.has_meeting && data.meeting_id) {
            this.currentMeetingId = data.meeting_id;
        }

        if (Array.isArray(data.participants)) {
            const grid = document.getElementById("participantGrid");
            if (grid) {
                const currentUserId = this.getCurrentUserId();
                const existingParticipants = new Set(this.participantElements.keys());
                const incomingParticipants = new Set();

                const uniqueParticipants = new Map();
                data.participants.forEach((participant) => {
                    const userId = participant.user_id || participant.id;
                    const participantId = participant.isBot ? `bot-${userId}` : participant.id || userId;
                    
                    if (!uniqueParticipants.has(participantId)) {
                        uniqueParticipants.set(participantId, {
                            ...participant,
                            id: participantId,
                            user_id: userId,
                            isLocal: String(userId) === currentUserId
                        });
                    }
                    
                    incomingParticipants.add(participantId);
                });

                uniqueParticipants.forEach((participant, participantId) => {
                    if (!this.participantElements.has(participantId) && !this.hasExistingCardForUser(participant)) {
                        console.log(`➕ [VOICE-CALL-SECTION] Creating participant card:`, {
                            participantId,
                            username: participant.username,
                            isBot: participant.isBot,
                            isLocal: participant.isLocal
                        });
                        
                        const element = this.createParticipantElement(participantId, participant);
                        grid.appendChild(element);
                        this.participantElements.set(participantId, element);
                        
                        if (!participant.isBot && window.musicPlayer) {
                            setTimeout(() => {
                                window.musicPlayer.shareCurrentMusicStateWithParticipant(participantId);
                            }, 500);
                        }
                    } else {
                        console.log(`✅ [VOICE-CALL-SECTION] Participant card already exists:`, participantId);
                    }
                });

                this.updateGridLayout();
                this.updateParticipantCount();
                this.updateLocalParticipantIndicators();
                this.removeDuplicateCards();
            }
        }
    }
    
    syncWithVoiceState(state) {
        if (!state) return;
        
        if (state.isConnected && state.channelId && state.meetingId) {
            this.currentChannelId = state.channelId;
            this.currentChannelName = state.channelName;
            this.currentMeetingId = state.meetingId;
            this.updateConnectionStatus(true);
        } else {
            this.currentChannelId = null;
            this.currentChannelName = null;
            this.currentMeetingId = null;
            this.updateConnectionStatus(false);
            
            if (window.localStorageManager) {
                window.localStorageManager.clearVoiceState();
            }
        }
        
        this.updateLocalParticipantIndicators();
        this.syncButtonStates();
    }
    
    syncWithExistingParticipants() {
        if (!window.voiceManager || !window.voiceManager.participants) return;
        
        console.log(`🔄 [VOICE-CALL-SECTION] Starting participant sync:`, {
            voiceManagerParticipants: window.voiceManager.participants.size,
            voiceManagerBots: window.voiceManager.botParticipants?.size || 0,
            existingCards: this.participantElements.size
        });

        if (window.voiceManager && typeof window.voiceManager.forceStreamSync === 'function') {
            window.voiceManager.forceStreamSync();
        }
        
        const grid = document.getElementById("participantGrid");
        if (!grid) return;
        
        const allParticipants = window.voiceManager.getAllParticipants();
        
        const existingParticipantIds = new Set();
        grid.querySelectorAll('.participant-card').forEach(card => {
            const participantId = card.getAttribute('data-participant-id');
            if (participantId) {
                existingParticipantIds.add(participantId);
            }
        });
        
        allParticipants.forEach((participantData, participantId) => {
            if (!existingParticipantIds.has(participantId) && !this.hasExistingCardForUser(participantData)) {
                console.log(`➕ [VOICE-CALL-SECTION] Creating card for participant:`, {
                    participantId,
                    username: participantData.username,
                    isBot: participantData.isBot,
                    isLocal: participantData.isLocal
                });
                
                const element = this.createParticipantElement(participantId, participantData);
                grid.appendChild(element);
                this.participantElements.set(participantId, element);
                
                if (!participantData.isBot) {
                    this.restoreExistingStreamsForParticipant(participantId, participantData, element);
                    
                    const voiceParticipant = window.voiceManager.meeting?.participants?.get(participantId);
                    if (voiceParticipant && window.voiceManager.forceParticipantStreamSync) {
                        window.voiceManager.forceParticipantStreamSync(voiceParticipant);
                    }
                    
                    setTimeout(() => {
                        this.syncParticipantStreams(participantId, element);
                        this.ensureParticipantStreamsSynced(participantId, element);
                    }, 100);
                }
            } else {
                console.log(`✅ [VOICE-CALL-SECTION] Participant card already exists:`, participantId);
            }
        });
        
        if (window.voiceManager && typeof window.voiceManager.checkAllParticipantsForExistingStreams === 'function') {
            window.voiceManager.checkAllParticipantsForExistingStreams();
        }
        
        this.forceResyncAllStreams();
        
        this.updateGridLayout();
        this.updateParticipantCount();
        this.updateLocalParticipantIndicators();
        this.removeDuplicateCards();

        if (this.currentChannelId && window.globalSocketManager?.io) {
            console.log(`🔍 [VOICE-CALL-SECTION] Requesting voice meeting status for channel:`, this.currentChannelId);
            window.globalSocketManager.io.emit('check-voice-meeting', { 
                channel_id: this.currentChannelId 
            });
        }
        
        console.log(`✅ [VOICE-CALL-SECTION] Participant sync completed:`, {
            totalCards: this.participantElements.size,
            cardIds: Array.from(this.participantElements.keys())
        });
    }
    
    ensureParticipantStreamsSynced(participantId, element) {
        if (!window.voiceManager || !window.voiceManager.meeting) return;
        
        const participant = window.voiceManager.meeting.participants?.get(participantId);
        if (!participant) return;
        
        if (participant.webcamOn && participant.webcamStream) {
            this.showParticipantVideo(element, participant.webcamStream);
        }
        
        if (participant.screenShareOn && participant.screenShareStream) {
            this.createScreenShareCard(participantId, participant.screenShareStream);
        }
        
        if (participant.micOn && participant.micStream) {
            this.attachParticipantAudio(element, participant.micStream, participantId);
        }
    }
    
    forceResyncAllStreams() {
        if (!window.voiceManager || !window.voiceManager.meeting) return;
        
        this.participantElements.forEach((element, participantId) => {
            const participant = window.voiceManager.meeting.participants?.get(participantId);
            if (!participant) return;
            
            if (participant.webcamOn && participant.webcamStream) {
                this.showParticipantVideo(element, participant.webcamStream);
            }
            
            if (participant.screenShareOn && participant.screenShareStream) {
                this.createScreenShareCard(participantId, participant.screenShareStream);
            }
            
            if (participant.micOn && participant.micStream) {
                this.attachParticipantAudio(element, participant.micStream, participantId);
            }
        });
    }

    ensureChannelSync() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlChannelId = urlParams.get('channel');
        const urlChannelType = urlParams.get('type');
        const metaChannelId = document.querySelector('meta[name="channel-id"]')?.content;
        
        let determinedChannelId = null;
        let determinedChannelName = null;
        
        if (urlChannelType === 'voice' && urlChannelId) {
            determinedChannelId = urlChannelId;
            const channelElement = document.querySelector(`[data-channel-id="${urlChannelId}"]`);
            determinedChannelName = this.getChannelName(channelElement);
        } 
        else if (metaChannelId) {
            determinedChannelId = metaChannelId;
            const channelElement = document.querySelector(`[data-channel-id="${metaChannelId}"]`);
            determinedChannelName = this.getChannelName(channelElement);
        }
        
        if (determinedChannelId) {
            this.currentChannelId = determinedChannelId;
            this.currentChannelName = determinedChannelName;
            this.syncButtonStates();
            return true;
        }
        
        return false;
    }

    getChannelName(channelElement) {
        return channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
               channelElement?.getAttribute('data-channel-name') || 
               'Voice Channel';
    }

    handleParticipantJoined(event) {
        const { participant, data } = event.detail;
        
        console.log(`👤 [VOICE-CALL-SECTION] Participant joined event:`, {
            participant,
            data,
            hasExistingCard: this.participantElements.has(participant),
            voiceManagerHasParticipant: window.voiceManager?.participants.has(participant),
            totalExistingCards: this.participantElements.size
        });
        
        if (!participant || this.participantElements.has(participant)) {
            console.log(`⚠️ [VOICE-CALL-SECTION] Skipping participant join - already exists or invalid:`, participant);
            return;
        }
        
        if (!window.voiceManager || !window.voiceManager.participants.has(participant)) {
            console.log(`⚠️ [VOICE-CALL-SECTION] Skipping participant join - not in voice manager:`, participant);
            return;
        }
        
        const userId = data?.user_id || data?.id;
        if (userId) {
            const existingElement = this.findExistingElementByUserId(participant);
            if (existingElement) {
                console.log(`🔄 [VOICE-CALL-SECTION] Reusing existing element for participant:`, participant);
                this.participantElements.set(participant, existingElement);
                return;
            }
            
            for (const [existingParticipantId, existingElement] of this.participantElements.entries()) {
                const existingUserId = existingElement.getAttribute('data-user-id');
                if (existingUserId === String(userId)) {
                    console.log(`🔄 [VOICE-CALL-SECTION] Found duplicate user ID, skipping:`, { participant, userId, existingParticipantId });
                    return;
                }
            }
        }
        
        if (this.hasExistingCardForUser(data)) {
            console.log(`🔄 [VOICE-CALL-SECTION] Has existing card for user, skipping:`, data);
            return;
        }
        
        const grid = document.getElementById("participantGrid");
        if (!grid) {
            console.error(`❌ [VOICE-CALL-SECTION] Participant grid not found`);
            return;
        }
        
        console.log(`➕ [VOICE-CALL-SECTION] Creating new participant card:`, {
            participant,
            username: data?.username,
            isBot: data?.isBot,
            userId: data?.user_id
        });
        
        const element = this.createParticipantElement(participant, data);
        
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px) scale(0.9)';
        element.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
        
        grid.appendChild(element);
        this.participantElements.set(participant, element);
        
        if (element.hasAttribute('data-is-local')) {
            this.updateLocalParticipantIndicators();
        }
        
        element.style.opacity = '1';
        element.style.transform = 'translateY(0) scale(1)';
        
        this.restoreExistingStreamsForParticipant(participant, data, element);
        this.syncParticipantStreams(participant, element);
        
        if (window.voiceManager && typeof window.voiceManager.forceParticipantStreamSync === 'function') {
            const voiceParticipant = window.voiceManager.meeting?.participants?.get(participant);
            if (voiceParticipant) {
                window.voiceManager.forceParticipantStreamSync(voiceParticipant);
            }
        }
        
        this.ensureAllExistingStreamsVisibleToNewParticipant();
        
        this.updateGridLayout();
        this.updateParticipantCount();
        this.removeDuplicateCards();
        
        if (window.ChannelVoiceParticipants && this.currentChannelId) {
            const instance = window.ChannelVoiceParticipants.getInstance();
            instance.updateSidebarForChannel(this.currentChannelId, 'append');
        }
        
        console.log(`✅ [VOICE-CALL-SECTION] Participant card created successfully:`, {
            participant,
            totalCards: this.participantElements.size
        });
    }
    
    ensureAllExistingStreamsVisibleToNewParticipant() {
        if (!window.voiceManager || !window.voiceManager.meeting) return;
        
        this.participantElements.forEach((element, participantId) => {
            const participant = window.voiceManager.meeting.participants?.get(participantId);
            if (!participant) return;
            
            if (participant.webcamOn && participant.webcamStream) {
                setTimeout(() => {
                    this.showParticipantVideo(element, participant.webcamStream);
                }, 100);
            }
            
            if (participant.screenShareOn && participant.screenShareStream) {
                setTimeout(() => {
                    this.createScreenShareCard(participantId, participant.screenShareStream);
                }, 200);
            }
            
            if (participant.micOn && participant.micStream) {
                setTimeout(() => {
                    this.attachParticipantAudio(element, participant.micStream, participantId);
                }, 50);
            }
        });
        
        if (window.voiceManager.localParticipant) {
            const localParticipant = window.voiceManager.localParticipant;
            const localElement = this.participantElements.get(localParticipant.id);
            
            if (localElement) {
                if (localParticipant.webcamOn && localParticipant.webcamStream) {
                    setTimeout(() => {
                        this.showParticipantVideo(localElement, localParticipant.webcamStream);
                    }, 100);
                }
                
                if (localParticipant.screenShareOn && localParticipant.screenShareStream) {
                    setTimeout(() => {
                        this.createScreenShareCard(localParticipant.id, localParticipant.screenShareStream);
                    }, 200);
                }
            }
        }
    }

    handleParticipantLeft(event) {
        const { participant } = event.detail;
        if (!participant) return;
        
        this.removeScreenShareCard(participant);
        

        if (this.currentModal) {
            const modalParticipantId = this.currentModal.getAttribute('data-participant-id');
            if (modalParticipantId === participant) {
                this.closeParticipantModal();
            }
        }
        
        const element = this.participantElements.get(participant);
        if (element) {

            element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            element.style.opacity = '0';
            element.style.transform = 'translateY(-20px) scale(0.9)';
            
            setTimeout(() => {
                if (element.parentNode) {
                    element.remove();
                }
                this.participantElements.delete(participant);
                this.updateGridLayout();
                this.updateParticipantCount();
                

                if (window.ChannelVoiceParticipants && this.currentChannelId) {
                    const instance = window.ChannelVoiceParticipants.getInstance();
                    instance.updateSidebarForChannel(this.currentChannelId, 'full');
                }
            }, 300);
        }
    }

    handleStreamEnabled(event) {
        const { participantId, kind, stream } = event.detail;
        let element = this.participantElements.get(participantId);
        
        if (!element) {
            element = this.findExistingElementByUserId(participantId);
            if (element) {
                this.participantElements.set(participantId, element);
            }
        }
        
        if (!element) {
            if (window.voiceManager && window.voiceManager.participants.has(participantId)) {
                const participantData = window.voiceManager.participants.get(participantId);
                const grid = document.getElementById("participantGrid");
                if (grid && !this.hasExistingCardForUser(participantData)) {
                    const newElement = this.createParticipantElement(participantId, participantData);
                    grid.appendChild(newElement);
                    this.participantElements.set(participantId, newElement);
                    element = newElement;
                    
                    this.removeDuplicateCards();
                }
            }
            if (!element) return;
        }
        
        if (!window.voiceManager || !window.voiceManager.participants.has(participantId)) {
            return;
        }
        
        if (kind === 'video' || kind === 'webcam') {
            this.showParticipantVideo(element, stream);
        } else if (kind === 'audio') {
            this.attachParticipantAudio(element, stream, participantId);
        } else if (kind === 'share') {
            this.createScreenShareCard(participantId, stream);
        }
        
        this.updateGridLayout();
    }
    
    findExistingElementByUserId(participantId) {
        if (!window.voiceManager || !window.voiceManager.participants.has(participantId)) return null;
        
        const participantData = window.voiceManager.participants.get(participantId);
        const userId = participantData?.user_id;
        
        if (userId) {
            const grid = document.getElementById("participantGrid");
            if (grid) {
                const existingCard = grid.querySelector(`[data-user-id="${userId}"]`);
                return existingCard;
            }
        }
        
        return null;
    }
    
    hasExistingCardForUser(participantData) {
        const userId = participantData?.user_id;
        const participantId = participantData?.id;
        
        if (!userId && !participantId) return false;
        
        const grid = document.getElementById("participantGrid");
        if (!grid) return false;
        
        if (userId) {
            const existingCard = grid.querySelector(`[data-user-id="${userId}"]`);
            if (existingCard) return true;
        }
        
        if (participantId) {
            const existingCard = grid.querySelector(`[data-participant-id="${participantId}"]`);
            if (existingCard) return true;
        }
        
        if (participantData.isBot && userId) {
            const botId = `bot-${userId}`;
            const existingBotCard = grid.querySelector(`[data-participant-id="${botId}"]`);
            if (existingBotCard) return true;
        }
        
        return false;
    }

    handleStreamDisabled(event) {
        const { participantId, kind } = event.detail;
        const element = this.participantElements.get(participantId);
        
        if (kind === 'video' || kind === 'webcam') {
            if (element) this.hideParticipantVideo(element);
        } else if (kind === 'audio') {
            if (element) this.detachParticipantAudio(element);
        } else if (kind === 'share') {
            this.removeScreenShareCard(participantId);
        }
    }
    
    handleVoiceStateChanged(event) {
        const { type, state } = event.detail;
        
        switch (type) {
            case 'mic':
                this.updateMicButton(state);
                this.updateLocalParticipantIndicators();
                break;
            case 'video':
                this.updateVideoButton(state);
                break;
            case 'deafen':
                this.updateDeafenButton(state);
                if (state && window.voiceManager) {
                    this.updateMicButton(window.voiceManager._micOn);
                }
                this.updateLocalParticipantIndicators();
                break;
            case 'screen':
                this.updateScreenButton(state);
                break;
            case 'stateUpdate':
                if (event.detail.state) {
                    this.syncWithVoiceState(event.detail.state);
                }
                break;
        }
    }
    
    handleLocalVoiceStateChanged(event) {
        const { userId, channelId, type, state } = event.detail;
        if (channelId === this.currentChannelId) {
            this.updateParticipantVoiceState(userId, type, state);
            
            if (type === 'deafen' && state === true && window.voiceManager) {
                const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
                if (userId === currentUserId) {
                    this.updateParticipantVoiceState(userId, 'mic', false);
                }
            }
        }
    }
    
    updateLocalParticipantIndicators() {
        if (!window.voiceManager) return;
        
        const localCard = document.querySelector('[data-is-local="true"]');
        if (!localCard) return;
        
        const muteIndicator = localCard.querySelector('.mute-indicator');
        const deafenIndicator = localCard.querySelector('.deafen-indicator');
        
        if (muteIndicator) {
            const isMuted = !window.voiceManager.getMicState();
            muteIndicator.classList.toggle('hidden', !isMuted);
            
            muteIndicator.classList.remove('bg-red-500', 'bg-green-500');
            muteIndicator.classList.add('bg-red-500');
        }
        
        if (deafenIndicator) {
            const isDeafened = window.voiceManager.getDeafenState();
            deafenIndicator.classList.toggle('hidden', !isDeafened);
            
            deafenIndicator.classList.remove('bg-red-600', 'bg-green-600');
            deafenIndicator.classList.add('bg-red-600');
        }
    }
    
    updateParticipantVoiceState(userId, type, state) {
        console.log(`🔊 [VOICE-CALL-SECTION] Updating participant voice state:`, {
            userId, type, state
        });
        
        let participantElement = this.participantElements?.get(userId);
        
        if (!participantElement) {
            for (const [participantId, element] of this.participantElements.entries()) {
                const elementUserId = element.getAttribute('data-user-id');
                if (elementUserId === String(userId)) {
                    participantElement = element;
                    break;
                }
            }
        }
        
        if (!participantElement) {
            
            return;
        }
        
        if (type === 'mic') {
            const muteIndicator = participantElement.querySelector('.mute-indicator');
            if (muteIndicator) {
                const isMuted = !state;
                muteIndicator.classList.toggle('hidden', !isMuted);
                
                muteIndicator.classList.remove('bg-red-500', 'bg-green-500');
                muteIndicator.classList.add('bg-red-500');
                
                
            }
        } else if (type === 'deafen') {
            const deafenIndicator = participantElement.querySelector('.deafen-indicator');
            if (deafenIndicator) {
                deafenIndicator.classList.toggle('hidden', !state);
                
                deafenIndicator.classList.remove('bg-red-600', 'bg-green-600');
                deafenIndicator.classList.add('bg-red-600');
                
                
            }
        }
    }

    updateSpeakingIndicator(userId, isSpeaking) {
        const participantElement = this.participantElements.get(userId);
        if (!participantElement) {
            for (const [participantId, element] of this.participantElements.entries()) {
                const elementUserId = element.getAttribute('data-user-id');
                if (elementUserId === String(userId)) {
                    const avatarContainer = element.querySelector('.participant-avatar');
                    if (avatarContainer) {
                        if (isSpeaking) {
                            avatarContainer.classList.add('speaking-indicator');
                        } else {
                            avatarContainer.classList.remove('speaking-indicator');
                        }
                    }
                    return;
                }
            }
            return;
        }

        const avatarContainer = participantElement.querySelector('.participant-avatar');
        if (avatarContainer) {
            if (isSpeaking) {
                avatarContainer.classList.add('speaking-indicator');
            } else {
                avatarContainer.classList.remove('speaking-indicator');
            }
        }
    }

    createParticipantElement(participantId, data) {
        const userId = data?.user_id || data?.id;
        
        const grid = document.getElementById("participantGrid");
        if (grid && userId) {
            const existingCard = grid.querySelector(`[data-user-id="${userId}"]`);
            if (existingCard) {
                const existingParticipantId = existingCard.getAttribute('data-participant-id');
                if (existingParticipantId !== participantId) {
                    existingCard.remove();
                    this.participantElements.delete(existingParticipantId);
                } else {
                    return existingCard;
                }
            }
        }
        
        const div = document.createElement("div");
        div.className = "participant-card bg-[#2f3136] rounded-lg p-4 flex flex-col items-center justify-center relative border border-[#40444b] hover:border-[#5865f2] transition-all duration-200";
        div.setAttribute("data-participant-id", participantId);
        
        if (userId) {
            div.setAttribute("data-user-id", String(userId));
        }
        
        const name = data?.displayName || data?.name || data?.username || "Unknown";
        const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
        const isLocal = (data?.isLocal) || 
                       (data?.isSelf) || 
                       (participantId === window.voiceManager?.localParticipant?.id) ||
                       (currentUserId && userId && String(userId) === currentUserId);
        const isBot = data?.isBot || participantId.startsWith('bot-');
        const avatarUrl = data?.avatar_url || '/public/assets/common/default-profile-picture.png';
        const hasCustomAvatar = avatarUrl && !avatarUrl.includes('default-profile-picture');
        const showImage = isBot || hasCustomAvatar;
        const botStatus = data?.status || 'Ready to play music';
        

        div.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.openParticipantModal(participantId, data, 'participant');
        });
        
        div.innerHTML = `
            <div class="participant-video-overlay hidden absolute inset-0 rounded-lg overflow-hidden z-20">
                <video class="w-full h-full object-cover rounded-lg" autoplay muted playsinline></video>
                <div class="video-overlay-info absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1">
                    <span class="text-white text-sm font-medium truncate">${name}${isLocal ? ' (You)' : ''}</span>
                </div>
            </div>
            
            <audio autoplay playsinline ${isLocal ? 'muted' : ''}></audio>
            
            <div class="voice-indicators absolute top-2 right-2 flex flex-col gap-1 z-30">
                <div class="mute-indicator w-6 h-6 rounded-full flex items-center justify-center bg-red-500 ${this.getParticipantMicIndicatorVisibility(participantId, isLocal)}">
                    <i class="fas fa-microphone-slash text-white text-xs"></i>
                </div>
                <div class="deafen-indicator w-6 h-6 rounded-full flex items-center justify-center bg-red-600 ${this.getParticipantDeafenIndicatorVisibility(participantId, isLocal)}">
                    <i class="fas fa-deaf text-white text-xs"></i>
                </div>
            </div>
            
            <div class="participant-default-view flex flex-col items-center justify-center w-full h-full">
                <div class="participant-avatar border-2 border-[#40444b] w-16 h-16 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-xl mb-3 relative overflow-hidden">
                    ${showImage ? `<img src="${avatarUrl}" alt="${name}" class="w-full h-full object-cover rounded-full" onerror="this.src='/public/assets/common/default-profile-picture.png'">` : `<span>${this.getInitials(name)}</span>`}
                    ${isBot ? '<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-[#5865f2] rounded-full flex items-center justify-center"><i class="fas fa-robot text-white text-xs"></i></div>' : ''}
                </div>
                <span class="participant-name text-white text-sm font-medium text-center mb-2 max-w-full truncate">${name}${isLocal ? ' (You)' : ''}${isBot ? ' (Bot)' : ''}</span>
                ${isBot ? `<div class="music-status text-xs text-[#5865f2] text-center"><i class="fas fa-music mr-1"></i>${botStatus}</div>` : ''}
            </div>
        `;
        
        if (isLocal) {
            div.setAttribute("data-is-local", "true");
        }
        
        setTimeout(() => {
            this.updateParticipantIndicators(participantId, isLocal);
        }, 100);
        
        return div;
    }
    
    updateParticipantIndicators(participantId, isLocal) {
        const element = this.participantElements.get(participantId);
        if (!element) return;
        
        const muteIndicator = element.querySelector('.mute-indicator');
        const deafenIndicator = element.querySelector('.deafen-indicator');
        
        if (isLocal) {
            if (muteIndicator && window.voiceManager) {
                const isMuted = !window.voiceManager.getMicState();
                muteIndicator.classList.toggle('hidden', !isMuted);
            }
            if (deafenIndicator && window.voiceManager) {
                const isDeafened = window.voiceManager.getDeafenState();
                deafenIndicator.classList.toggle('hidden', !isDeafened);
            }
        } else {
            if (muteIndicator && window.voiceManager?.meeting) {
                const participant = window.voiceManager.meeting.participants.get(participantId);
                if (participant) {
                    const isMuted = !participant.micOn;
                    muteIndicator.classList.toggle('hidden', !isMuted);
                }
            }
        }
    }
    
    getParticipantMicIndicatorVisibility(participantId, isLocal) {
        if (isLocal) {
            return !window.voiceManager?.getMicState() ? '' : 'hidden';
        }
        
        if (!window.voiceManager?.meeting) return 'hidden';
        
        const participant = window.voiceManager.meeting.participants.get(participantId);
        if (!participant) return 'hidden';
        
        return !participant.micOn ? '' : 'hidden';
    }
    
    getParticipantDeafenIndicatorVisibility(participantId, isLocal) {
        if (isLocal) {
            return window.voiceManager?.getDeafenState() ? '' : 'hidden';
        }
        
        return 'hidden';
    }
    
    showParticipantVideo(element, stream) {
        const videoOverlay = element.querySelector(".participant-video-overlay");
        const defaultView = element.querySelector(".participant-default-view");
        const video = element.querySelector("video");
        
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
                video.play().catch(() => {});
                
                if (videoOverlay) videoOverlay.classList.remove("hidden");
                if (defaultView) defaultView.classList.add("hidden");
            }
        }
    }
    
    hideParticipantVideo(element) {
        const videoOverlay = element.querySelector(".participant-video-overlay");
        const defaultView = element.querySelector(".participant-default-view");
        const video = element.querySelector("video");
        
        if (video) {
            video.srcObject = null;
        }
        
        if (videoOverlay) videoOverlay.classList.add("hidden");
        if (defaultView) defaultView.classList.remove("hidden");
    }
    
    attachParticipantAudio(element, stream, participantId) {
        const audio = element.querySelector("audio");
        
        if (audio && stream) {
            let mediaStream;
            if (stream instanceof MediaStream) {
                mediaStream = stream;
            } else if (stream.track) {
                mediaStream = new MediaStream([stream.track]);
            } else if (stream.stream) {
                mediaStream = stream.stream;
            }
            
            if (mediaStream) {
                audio.srcObject = mediaStream;
                audio.play().catch(() => {});
                
                if (window.voiceManager && window.voiceManager._deafened) {
                    audio.muted = true;
                }
            }
        }
    }
    
    detachParticipantAudio(element) {
        const audio = element.querySelector("audio");
        
        if (audio) {
            audio.srcObject = null;
            audio.pause();
        }
    }
    
    createScreenShareCard(participantId, stream) {
        const existingCard = document.querySelector(`[data-screen-share-id="${participantId}"]`);
        if (existingCard) return;
        
        const participantName = this.participantElements.get(participantId)?.querySelector(".participant-name")?.textContent || "Unknown";
        const grid = document.getElementById("participantGrid");
        if (!grid) return;
        
        const card = document.createElement("div");
        card.className = "screen-share-card bg-[#1e1f22] rounded-lg p-2 flex flex-col relative border-2 border-[#5865f2] h-full";
        card.setAttribute("data-screen-share-id", participantId);
        
        card.innerHTML = `
            <div class="mb-1 flex items-center justify-center">
                <i class="fas fa-desktop text-[#5865f2] text-sm mr-2"></i>
                <span class="text-white text-sm font-medium">${participantName} - Screen Share</span>
            </div>
            <div class="flex-1 bg-black rounded overflow-hidden">
                <video class="w-full h-full object-contain" autoplay muted playsinline></video>
            </div>
        `;
        

        card.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.openParticipantModal(participantId, { displayName: participantName }, 'screenshare');
        });
        
        const video = card.querySelector("video");
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
                video.play().catch(() => {});
            }
        }
        
        grid.appendChild(card);
        this.updateGridLayout();
    }
    
    removeScreenShareCard(participantId) {
        const card = document.querySelector(`[data-screen-share-id="${participantId}"]`);
        if (card) {
            const video = card.querySelector("video");
            if (video) video.srcObject = null;
            card.remove();
            this.updateGridLayout();
        }
    }
    
    updateGridLayout() {
        const grid = document.getElementById("participantGrid");
        if (!grid) return;
        
        const count = grid.children.length;
        
        if (count === 0 || count === 1) {
            grid.className = "w-full h-full grid gap-3 grid-cols-1 place-items-stretch";
        } else if (count === 2) {
            grid.className = "w-full h-full grid gap-3 grid-cols-2";
        } else if (count <= 4) {
            grid.className = "w-full h-full grid gap-3 grid-cols-2";
        } else if (count <= 6) {
            grid.className = "w-full h-full grid gap-3 grid-cols-3";
        } else {
            grid.className = "w-full h-full grid gap-3 grid-cols-4";
        }
    }
    
    updateParticipantCount() {
        const count = this.participantElements.size;
        const countEl = document.getElementById("voiceParticipantCount");
        if (countEl) {
            countEl.textContent = count.toString();
        }
    }

    updateConnectionStatus(isConnected, skipSidebarRefresh = false) {
        const connectionInfo = document.querySelector('.voice-connection-info');
        if (!connectionInfo) return;

        if (isConnected && this.currentChannelName) {
            connectionInfo.textContent = `Connected to ${this.currentChannelName}`;
            connectionInfo.classList.add('connected');
            connectionInfo.classList.remove('disconnected');


            if (!skipSidebarRefresh && window.ChannelVoiceParticipants && this.currentChannelId) {
                const instance = window.ChannelVoiceParticipants.getInstance();
                instance.updateSidebarForChannel(this.currentChannelId);
            } else if (skipSidebarRefresh && window.ChannelVoiceParticipants && this.currentChannelId) {

                const instance = window.ChannelVoiceParticipants.getInstance();
                instance.ensureParticipantsVisible(this.currentChannelId);
            }
        } else {
            connectionInfo.textContent = 'Not connected';
            connectionInfo.classList.add('disconnected');
            connectionInfo.classList.remove('connected');
            this.clearGrid();
        }
    }
    
    updateBotParticipantStatus(botId, statusText) {
        const element = this.participantElements.get(`bot-${botId}`);
        if (element) {
            const statusElement = element.querySelector('.music-status');
            if (statusElement) {
                statusElement.innerHTML = `<i class="fas fa-music mr-1"></i>${statusText}`;
            }
        }
    }
    
    clearGrid() {
        this.closeParticipantModal();
        
        if (this.duplicateCleanupInterval) {
            clearInterval(this.duplicateCleanupInterval);
            this.duplicateCleanupInterval = null;
        }
        
        const grid = document.getElementById("participantGrid");
        if (grid) {
            grid.innerHTML = "";
            this.participantElements.clear();
            this.updateParticipantCount();
            
            if (window.ChannelVoiceParticipants && this.currentChannelId) {
                const instance = window.ChannelVoiceParticipants.getInstance();
                instance.updateSidebarForChannel(this.currentChannelId);
            }
        }
    }
    
    rebuildGridFromVideoSDK() {
        if (!window.voiceManager || !window.voiceManager.participants) {
            this.clearGrid();
            return;
        }
        
        console.log(`🔄 [VOICE-CALL-SECTION] Rebuilding grid from VideoSDK:`, {
            voiceManagerParticipants: window.voiceManager.participants.size,
            voiceManagerBots: window.voiceManager.botParticipants?.size || 0,
            currentCards: this.participantElements.size
        });
        
        if (window.voiceManager && typeof window.voiceManager.forceStreamSync === 'function') {
            window.voiceManager.forceStreamSync();
        }
        
        this.clearGrid();
        
        const grid = document.getElementById("participantGrid");
        if (!grid) return;
        
        const allParticipants = window.voiceManager.getAllParticipants();
        const botParticipants = window.voiceManager.getBotParticipants();
        
        console.log(`🔄 [VOICE-CALL-SECTION] Adding participants to grid:`, {
            humanCount: allParticipants.size,
            botCount: botParticipants.size
        });

        allParticipants.forEach((participantData, participantId) => {
            if (participantData && !this.participantElements.has(participantId) && !this.hasExistingCardForUser(participantData)) {
                console.log(`➕ [VOICE-CALL-SECTION] Adding human participant to grid:`, {
                    participantId,
                    username: participantData.username,
                    isLocal: participantData.isLocal
                });
                
                const element = this.createParticipantElement(participantId, participantData);
                grid.appendChild(element);
                this.participantElements.set(participantId, element);
                
                this.restoreExistingStreamsForParticipant(participantId, participantData, element);
                this.ensureParticipantStreamsSynced(participantId, element);
            }
        });
        
        botParticipants.forEach((botData, botId) => {
            if (botData && !this.participantElements.has(botId) && !this.hasExistingCardForUser(botData)) {
                console.log(`🤖 [VOICE-CALL-SECTION] Adding bot participant to grid:`, {
                    botId,
                    username: botData.username
                });
                
                const element = this.createParticipantElement(botId, botData);
                grid.appendChild(element);
                this.participantElements.set(botId, element);
            }
        });
        
        if (window.voiceManager && typeof window.voiceManager.forceStreamSync === 'function') {
            window.voiceManager.forceStreamSync();
        }
        
        setTimeout(() => {
            this.forceResyncAllStreams();
        }, 200);
        
        this.updateGridLayout();
        this.updateParticipantCount();
        this.updateLocalParticipantIndicators();
        this.removeDuplicateCards();
        
        console.log(`✅ [VOICE-CALL-SECTION] Grid rebuild completed:`, {
            totalCards: this.participantElements.size,
            cardIds: Array.from(this.participantElements.keys())
        });
    }
    
    restoreExistingStreamsForParticipant(participantId, participantData, element) {
        if (!window.voiceManager || !window.voiceManager.participants.has(participantId)) return;
        
        const voiceParticipantData = window.voiceManager.participants.get(participantId);
        const participant = window.voiceManager.meeting?.participants?.get(participantId);
        
        if (voiceParticipantData && voiceParticipantData.streams && voiceParticipantData.streams.size > 0) {
            voiceParticipantData.streams.forEach((stream, kind) => {
                if (kind === 'video' || kind === 'webcam') {
                    this.showParticipantVideo(element, stream);
                } else if (kind === 'audio') {
                    this.attachParticipantAudio(element, stream, participantId);
                } else if (kind === 'share') {
                    this.createScreenShareCard(participantId, stream);
                }
            });
        } else if (participant) {
            if (participant.webcamOn && participant.webcamStream) {
                this.showParticipantVideo(element, participant.webcamStream);
                voiceParticipantData.streams.set('video', participant.webcamStream);
            }
            
            if (participant.micOn && participant.micStream) {
                this.attachParticipantAudio(element, participant.micStream, participantId);
                voiceParticipantData.streams.set('audio', participant.micStream);
            }
            
            if (participant.screenShareOn && participant.screenShareStream) {
                this.createScreenShareCard(participantId, participant.screenShareStream);
                voiceParticipantData.streams.set('share', participant.screenShareStream);
            }
        }
    }
    
    syncParticipantStreams(participantId, element) {
        if (!window.voiceManager || !window.voiceManager.meeting) return;
        
        const participant = window.voiceManager.meeting.participants?.get(participantId);
        if (!participant) return;
        
        if (participant.webcamOn && participant.webcamStream) {
            const existingVideo = element.querySelector('.participant-video-overlay video');
            if (!existingVideo || !existingVideo.srcObject) {
                this.showParticipantVideo(element, participant.webcamStream);
            }
        }
        
        if (participant.micOn && participant.micStream) {
            const existingAudio = element.querySelector('audio');
            if (!existingAudio || !existingAudio.srcObject) {
                this.attachParticipantAudio(element, participant.micStream, participantId);
            }
        }
        
        if (participant.screenShareOn && participant.screenShareStream) {
            const existingScreenShare = document.querySelector(`[data-screen-share-id="${participantId}"]`);
            if (!existingScreenShare) {
                this.createScreenShareCard(participantId, participant.screenShareStream);
            }
        }
    }
    
    removeDuplicateCards() {
        const grid = document.getElementById("participantGrid");
        if (!grid) return;
        
        const seenUserIds = new Map();
        const seenParticipantIds = new Set();
        const cardsToRemove = [];
        
        const cards = grid.querySelectorAll('.participant-card');
        cards.forEach(card => {
            const userId = card.getAttribute('data-user-id');
            const participantId = card.getAttribute('data-participant-id');
            
            let shouldRemove = false;
            
            if (!window.voiceManager || !window.voiceManager.participants.has(participantId)) {
                if (!participantId || !participantId.startsWith('bot-') || !window.voiceManager.botParticipants.has(participantId)) {
                    shouldRemove = true;
                }
            }
            
            if (participantId && seenParticipantIds.has(participantId)) {
                shouldRemove = true;
            } else if (participantId) {
                seenParticipantIds.add(participantId);
            }
            
            if (userId) {
                const existingCard = seenUserIds.get(userId);
                if (existingCard) {
                    const existingParticipantId = existingCard.getAttribute('data-participant-id');
                    const isBotCard = participantId && participantId.startsWith('bot-');
                    const isExistingBotCard = existingParticipantId && existingParticipantId.startsWith('bot-');
                    
                    if (isBotCard && !isExistingBotCard) {
                        shouldRemove = false;
                        cardsToRemove.push({ card: existingCard, participantId: existingParticipantId });
                    } else {
                        shouldRemove = true;
                    }
                } else {
                    seenUserIds.set(userId, card);
                }
            }
            
            if (shouldRemove) {
                cardsToRemove.push({ card, participantId });
            }
        });
        
        cardsToRemove.forEach(({ card, participantId }) => {
            card.remove();
            this.participantElements.delete(participantId);
        });
        
        if (cardsToRemove.length > 0) {
            this.updateGridLayout();
            this.updateParticipantCount();
        }
    }
    
    cleanupOrphanedElements() {
        const grid = document.getElementById("participantGrid");
        if (!grid) return;
        
        const cards = grid.querySelectorAll('.participant-card');
        let removedCount = 0;
        
        cards.forEach(card => {
            const participantId = card.getAttribute('data-participant-id');
            const userId = card.getAttribute('data-user-id');
            
            if (participantId && !this.participantElements.has(participantId)) {
                card.remove();
                removedCount++;
                return;
            }
            
            if (!window.voiceManager || !window.voiceManager.participants.has(participantId)) {
                card.remove();
                this.participantElements.delete(participantId);
                removedCount++;
                return;
            }
            
            const gridCards = grid.querySelectorAll(`[data-user-id="${userId}"]`);
            if (gridCards.length > 1) {
                const isFirstOccurrence = gridCards[0] === card;
                if (!isFirstOccurrence) {
                    card.remove();
                    this.participantElements.delete(participantId);
                    removedCount++;
                }
            }
        });
        
        if (removedCount > 0) {
            this.updateGridLayout();
            this.updateParticipantCount();
        }
    }

    syncButtonStates() {
        if (!window.voiceManager) return;
        
        if (window.voiceManager.isConnected) {
            const micState = window.voiceManager._micOn;
            const videoState = window.voiceManager._videoOn;
            const deafenState = window.voiceManager._deafened;
            const screenState = window.voiceManager._screenShareOn;
            
            this.updateMicButton(micState);
            this.updateVideoButton(videoState);
            this.updateDeafenButton(deafenState);
            this.updateScreenButton(screenState);
            
            if (window.localStorageManager) {
                window.localStorageManager.setUnifiedVoiceState({
                    isMuted: !micState,
                    videoOn: videoState,
                    isDeafened: deafenState,
                    screenShareOn: screenState,
                    isConnected: true
                });
            }
        } else {
            const storedState = window.localStorageManager?.getUnifiedVoiceState();
            const micState = !(storedState?.isMuted === true);
            const deafenState = storedState?.isDeafened || false;
            const videoState = storedState?.videoOn || false;
            const screenState = storedState?.screenShareOn || false;
            
            this.updateMicButton(micState);
            this.updateVideoButton(videoState);
            this.updateDeafenButton(deafenState);
            this.updateScreenButton(screenState);
        }
        
        this.updateLocalParticipantIndicators();
    }
    
    updateMicButton(isOn) {
        if (!this.micBtn) return;
        
        const icon = this.micBtn.querySelector("i");
        if (!icon) return; 
        
        this.micBtn.classList.remove("muted", "bg-[#ed4245]", "bg-[#4f545c]", "bg-green-600", "bg-red-600");
        
        if (isOn) {
            icon.className = "fas fa-microphone text-sm";
            this.micBtn.style.backgroundColor = "#16a34a";
        } else {
            icon.className = "fas fa-microphone-slash text-sm";
            this.micBtn.classList.add("muted");
            this.micBtn.style.backgroundColor = "#dc2626";
        }
        this.micBtn.style.color = "white";
    }
    
    updateVideoButton(isOn) {
        if (!this.videoBtn) return;
        
        const icon = this.videoBtn.querySelector("i");
        if (!icon) return; 
        
        this.videoBtn.classList.remove("bg-[#4f545c]", "bg-[#3ba55c]", "bg-green-600", "bg-red-600", "active");
        
        if (isOn) {
            icon.className = "fas fa-video text-sm";
            this.videoBtn.classList.add("active");
            this.videoBtn.style.backgroundColor = "#16a34a";
        } else {
            icon.className = "fas fa-video-slash text-sm";
            this.videoBtn.style.backgroundColor = "#dc2626";
        }
        this.videoBtn.style.color = "white";
    }
    
    updateDeafenButton(isOn) {
        if (!this.deafenBtn) return;
        
        const icon = this.deafenBtn.querySelector("i");
        if (!icon) return; 
        
        this.deafenBtn.classList.remove("deafened", "bg-[#ed4245]", "bg-[#4f545c]", "bg-green-600", "bg-red-600");
        
        if (isOn) {
            icon.className = "fas fa-deaf text-sm";
            this.deafenBtn.classList.add("deafened");
            this.deafenBtn.style.backgroundColor = "#dc2626";
        } else {
            icon.className = "fas fa-headphones text-sm";
            this.deafenBtn.style.backgroundColor = "#16a34a";
        }
        this.deafenBtn.style.color = "white";
        
        this.updateAllAudioElementsMute(isOn);
    }
    
    updateAllAudioElementsMute(shouldMute) {
        this.participantElements.forEach((element, participantId) => {
            const audio = element.querySelector("audio");
            if (audio && !element.hasAttribute("data-is-local")) {
                audio.muted = shouldMute;
            }
        });
    }
    
    updateScreenButton(isOn) {
        if (!this.screenBtn) return;
        
        const icon = this.screenBtn.querySelector("i");
        if (!icon) return; 
        
        this.screenBtn.classList.remove("bg-[#4f545c]", "bg-[#5865f2]", "bg-green-600", "bg-red-600", "screen-sharing");
        
        if (isOn) {
            icon.className = "fas fa-stop text-sm";
            this.screenBtn.classList.add("screen-sharing");
            this.screenBtn.style.backgroundColor = "#16a34a";
        } else {
            icon.className = "fas fa-desktop text-sm";
            this.screenBtn.style.backgroundColor = "#dc2626";
        }
        this.screenBtn.style.color = "white";
    }
    
    openTicTacToe() {
        const serverId = document.querySelector('meta[name="server-id"]')?.content;
        const userId = document.querySelector('meta[name="user-id"]')?.content;
        const username = document.querySelector('meta[name="username"]')?.content;
        
        if (!serverId || !userId || !username) return;
        
        if (!window.globalSocketManager?.isReady()) return;
        
        if (!document.querySelector('link[href*="tic-tac-toe.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/public/css/tic-tac-toe.css?v=' + Date.now();
            document.head.appendChild(link);
        }
        
        const loadTicTacToe = () => {
            if (window.TicTacToeModal) {
                window.TicTacToeModal.createTicTacToeModal(serverId, userId, username);
            } else {
                const script = document.createElement('script');
                script.src = '/public/js/components/activity/tic-tac-toe.js?v=' + Date.now();
                script.onload = () => {
                    if (window.TicTacToeModal) {
                        window.TicTacToeModal.createTicTacToeModal(serverId, userId, username);
                    }
                };
                document.head.appendChild(script);
            }
        };
        
        loadTicTacToe();
    }
    
    getInitials(name) {
        if (!name) return "?";
        return name.split(" ").map(w => w.charAt(0).toUpperCase()).slice(0, 2).join("");
    }

    getCurrentUserId() {
        return document.querySelector('meta[name="user-id"]')?.content || window.currentUserId;
    }

    openParticipantModal(participantId, data, type = 'participant') {

        this.closeParticipantModal();
        
        const name = data?.displayName || data?.name || data?.username || "Unknown";
        const isLocal = data?.isLocal || (participantId === window.voiceManager?.localParticipant?.id);
        const isBot = data?.isBot || participantId.startsWith('bot-');
        const avatarUrl = data?.avatar_url || '/public/assets/common/default-profile-picture.png';
        const hasCustomAvatar = avatarUrl && !avatarUrl.includes('default-profile-picture');
        const showImage = isBot || hasCustomAvatar;
        

        const overlay = document.createElement('div');
        overlay.id = 'participant-fullscreen-modal';
        overlay.className = 'fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center backdrop-blur-sm';
        overlay.style.animation = 'modalFadeIn 0.3s ease-out';
        

        let modalContent = '';
        
        if (type === 'screenshare') {

            const originalCard = document.querySelector(`[data-screen-share-id="${participantId}"]`);
            const originalVideo = originalCard?.querySelector('video');
            
            modalContent = `
                <div class="modal-content bg-[#1e1f22] rounded-2xl p-6 max-w-6xl max-h-[90vh] w-[90vw] h-[80vh] flex flex-col relative border-2 border-[#5865f2] shadow-2xl">
                    <button class="modal-close-btn absolute top-4 right-4 w-10 h-10 bg-[#ed4245] hover:bg-[#dc2626] rounded-full flex items-center justify-center text-white transition-all duration-200 z-10">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                    
                    <div class="modal-header mb-4 flex items-center justify-center">
                        <i class="fas fa-desktop text-[#5865f2] text-lg mr-3"></i>
                        <h3 class="text-white text-xl font-semibold">${name} - Screen Share</h3>
                    </div>
                    
                    <div class="modal-video-container flex-1 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                        <video class="w-full h-full object-contain" autoplay muted playsinline ${originalVideo?.srcObject ? '' : 'hidden'}></video>
                        <div class="video-placeholder ${originalVideo?.srcObject ? 'hidden' : ''} text-white text-center">
                            <i class="fas fa-desktop text-6xl text-[#5865f2] mb-4"></i>
                            <p class="text-lg">Screen share content will appear here</p>
                        </div>
                    </div>
                </div>
            `;
        } else {

            const originalCard = this.participantElements.get(participantId);
            const hasVideo = originalCard?.querySelector('.participant-video-overlay:not(.hidden)');
            const originalVideo = originalCard?.querySelector('video');
            
            modalContent = `
                <div class="modal-content bg-[#2f3136] rounded-2xl p-8 max-w-4xl max-h-[90vh] w-[80vw] flex flex-col items-center justify-center relative border-2 border-[#5865f2] shadow-2xl">
                    <button class="modal-close-btn absolute top-4 right-4 w-10 h-10 bg-[#ed4245] hover:bg-[#dc2626] rounded-full flex items-center justify-center text-white transition-all duration-200 z-10">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                    
                    ${hasVideo ? `
                        <div class="modal-video-container w-full h-[70vh] bg-black rounded-xl overflow-hidden flex items-center justify-center mb-6">
                            <video class="w-full h-full object-cover rounded-xl" autoplay muted playsinline></video>
                        </div>
                    ` : `
                        <div class="modal-avatar-container mb-6">
                            <div class="w-48 h-48 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-6xl relative overflow-hidden border-4 border-[#7289da] shadow-lg">
                                ${showImage ? `<img src="${avatarUrl}" alt="${name}" class="w-full h-full object-cover rounded-full" onerror="this.src='/public/assets/common/default-profile-picture.png'">` : `<span>${this.getInitials(name)}</span>`}
                                ${isBot ? '<div class="absolute -bottom-2 -right-2 w-12 h-12 bg-[#5865f2] rounded-full flex items-center justify-center border-4 border-[#2f3136]"><i class="fas fa-robot text-white text-lg"></i></div>' : ''}
                            </div>
                        </div>
                    `}
                    
                    <div class="modal-info text-center">
                        <h3 class="text-white text-3xl font-bold mb-2">${name}${isLocal ? ' (You)' : ''}${isBot ? ' (Bot)' : ''}</h3>
                        ${isBot ? '<p class="text-[#5865f2] text-lg mb-4"><i class="fas fa-music mr-2"></i>Ready to play music</p>' : ''}
                        <div class="flex items-center justify-center space-x-6 text-[#b9bbbe]">
                            <div class="flex items-center space-x-2">
                                <div class="w-3 h-3 bg-[#3ba55c] rounded-full"></div>
                                <span>Connected</span>
                            </div>
                            ${hasVideo ? '<div class="flex items-center space-x-2"><i class="fas fa-video text-[#3ba55c]"></i><span>Camera On</span></div>' : ''}
                            ${type === 'screenshare' ? '<div class="flex items-center space-x-2"><i class="fas fa-desktop text-[#5865f2]"></i><span>Screen Sharing</span></div>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }
        
        overlay.innerHTML = modalContent;
        

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeParticipantModal();
            }
        });
        

        const closeBtn = overlay.querySelector('.modal-close-btn');
        closeBtn.addEventListener('click', () => {
            this.closeParticipantModal();
        });
        

        const modalVideo = overlay.querySelector('video');
        if (modalVideo) {
            let originalVideo = null;
            
            if (type === 'screenshare') {
                const originalCard = document.querySelector(`[data-screen-share-id="${participantId}"]`);
                originalVideo = originalCard?.querySelector('video');
            } else {
                const originalCard = this.participantElements.get(participantId);
                originalVideo = originalCard?.querySelector('.participant-video-overlay video');
            }
            
            if (originalVideo && originalVideo.srcObject) {
                modalVideo.srcObject = originalVideo.srcObject;
                modalVideo.play().catch(() => {});
                

                modalVideo.classList.remove('hidden');
                const placeholder = overlay.querySelector('.video-placeholder');
                if (placeholder) placeholder.classList.add('hidden');
            }
        }
        

        document.body.appendChild(overlay);
        

        this.modalEscListener = (e) => {
            if (e.key === 'Escape') {
                this.closeParticipantModal();
            }
        };
        document.addEventListener('keydown', this.modalEscListener);
        

        this.currentModal = overlay;
    }
    
    closeParticipantModal() {
        const modal = document.getElementById('participant-fullscreen-modal') || this.currentModal;
        if (modal) {

            const modalVideo = modal.querySelector('video');
            if (modalVideo) {
                modalVideo.srcObject = null;
            }
            

            modal.style.animation = 'modalFadeOut 0.2s ease-out';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
            }, 200);
        }
        

        if (this.modalEscListener) {
            document.removeEventListener('keydown', this.modalEscListener);
            this.modalEscListener = null;
        }
        
        this.currentModal = null;
    }

    initializeVoiceState() {
        const metaChannelId = document.querySelector('meta[name="channel-id"]')?.content;
        const urlParams = new URLSearchParams(window.location.search);
        const urlChannelId = urlParams.get('channel');
        const urlChannelType = urlParams.get('type');
        
        if (urlChannelType === 'voice' && urlChannelId) {
            this.currentChannelId = urlChannelId;
            const channelElement = document.querySelector(`[data-channel-id="${urlChannelId}"]`);
            this.currentChannelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                                     channelElement?.getAttribute('data-channel-name') || 
                                     'Voice Channel';
        } else if (metaChannelId && window.voiceManager?.currentChannelId === metaChannelId) {
            this.currentChannelId = metaChannelId;
            this.currentChannelName = window.voiceManager?.currentChannelName || 'Voice Channel';
        }
        
        if (window.localStorageManager) {
            const voiceState = window.localStorageManager.getUnifiedVoiceState();
            this.syncWithVoiceState(voiceState);
            
            if (!voiceState.isConnected) {
                window.localStorageManager.setUnifiedVoiceState({
                    ...voiceState,
                    isMuted: true,
                    isDeafened: false,
                    videoOn: false,
                    screenShareOn: false
                });
            }
        }
        
        if (window.voiceManager) {
            if (!this.currentChannelId) {
                this.currentChannelId = window.voiceManager.currentChannelId;
                this.currentChannelName = window.voiceManager.currentChannelName;
            }
            this.currentMeetingId = window.voiceManager.currentMeetingId;
            
            if (window.voiceManager.isConnected) {
                this.updateConnectionStatus(true);
            }
        }
    }
}

if (typeof window !== "undefined") {
    window.voiceCallSection = new VoiceCallSection();
}