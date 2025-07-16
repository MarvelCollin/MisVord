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
        
        this.eventListeners = [];
        this.isDestroyed = false;
        
        this.init();
    }
    
    init() {
        if (this.isDestroyed) return;
        
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                if (!this.isDestroyed) this.setup();
            });
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
                'micBtn': '#dc2626',
                'videoBtn': '#dc2626',
                'deafenBtn': '#dc2626', 
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
    }
    
    bindControls() {
        this.micBtn = document.getElementById("micBtn");
        this.videoBtn = document.getElementById("videoBtn");
        this.deafenBtn = document.getElementById("deafenBtn");
        this.screenBtn = document.getElementById("screenBtn");
        this.ticTacToeBtn = document.getElementById("ticTacToeBtn");
        this.disconnectBtn = document.getElementById("disconnectBtn");
        
        if (this.micBtn) {
            const micHandler = () => {
                if (!window.voiceManager || this.isDestroyed) return;
                const newState = window.voiceManager.toggleMic();
                this.updateMicButton(newState);
                
                if (newState) {
                    MusicLoaderStatic.playDiscordUnmuteSound();
                } else {
                    MusicLoaderStatic.playDiscordMuteSound();
                }
            };
            this.micBtn.addEventListener("click", micHandler);
            this.eventListeners.push({ element: this.micBtn, event: "click", handler: micHandler });
        }
        
        if (this.videoBtn) {
            const videoHandler = async () => {
                if (!window.voiceManager || this.isDestroyed) return;
                const newState = await window.voiceManager.toggleVideo();
                this.updateVideoButton(newState);
            };
            this.videoBtn.addEventListener("click", videoHandler);
            this.eventListeners.push({ element: this.videoBtn, event: "click", handler: videoHandler });
        }
        
        if (this.deafenBtn) {
            const deafenHandler = () => {
                if (!window.voiceManager || this.isDestroyed) return;
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
            };
            this.deafenBtn.addEventListener("click", deafenHandler);
            this.eventListeners.push({ element: this.deafenBtn, event: "click", handler: deafenHandler });
        }
        
        if (this.screenBtn) {
            const screenHandler = async () => {
                if (!window.voiceManager || this.isDestroyed) return;
                const state = await window.voiceManager.toggleScreenShare();
                this.updateScreenButton(state);
            };
            this.screenBtn.addEventListener("click", screenHandler);
            this.eventListeners.push({ element: this.screenBtn, event: "click", handler: screenHandler });
        }
        
        if (this.ticTacToeBtn) {
            const ticTacToeHandler = () => {
                if (this.isDestroyed) return;
                this.openTicTacToe();
            };
            this.ticTacToeBtn.addEventListener("click", ticTacToeHandler);
            this.eventListeners.push({ element: this.ticTacToeBtn, event: "click", handler: ticTacToeHandler });
        }
        
        if (this.disconnectBtn) {
            const disconnectHandler = () => {
                if (!window.voiceFacade || this.isDestroyed) return;
                MusicLoaderStatic.playDisconnectVoiceSound();
                window.voiceFacade.leave();
            };
            this.disconnectBtn.addEventListener("click", disconnectHandler);
            this.eventListeners.push({ element: this.disconnectBtn, event: "click", handler: disconnectHandler });
        }
    }
    
    bindEvents() {
        const participantJoinedHandler = (e) => {
            if (this.isDestroyed) return;
            this.handleParticipantJoined(e);
        };
        const participantLeftHandler = (e) => {
            if (this.isDestroyed) return;
            this.handleParticipantLeft(e);
        };
        const streamEnabledHandler = (e) => {
            if (this.isDestroyed) return;
            this.handleStreamEnabled(e);
        };
        const streamDisabledHandler = (e) => {
            if (this.isDestroyed) return;
            this.handleStreamDisabled(e);
        };
        const voiceStateChangedHandler = (e) => {
            if (this.isDestroyed) return;
            this.handleVoiceStateChanged(e);
        };
        
        window.addEventListener("participantJoined", participantJoinedHandler);
        window.addEventListener("participantLeft", participantLeftHandler);
        window.addEventListener("streamEnabled", streamEnabledHandler);
        window.addEventListener("streamDisabled", streamDisabledHandler);
        window.addEventListener("voiceStateChanged", voiceStateChangedHandler);
        
        this.eventListeners.push(
            { element: window, event: "participantJoined", handler: participantJoinedHandler },
            { element: window, event: "participantLeft", handler: participantLeftHandler },
            { element: window, event: "streamEnabled", handler: streamEnabledHandler },
            { element: window, event: "streamDisabled", handler: streamDisabledHandler },
            { element: window, event: "voiceStateChanged", handler: voiceStateChangedHandler }
        );
        
        const localVoiceStateHandler = (e) => {
            if (this.isDestroyed) return;
            this.handleLocalVoiceStateChanged(e);
        };
        const voiceDisconnectHandler1 = () => {
            if (this.isDestroyed) return;
            this.clearGrid();
        };
        const voiceConnectHandler = (e) => {
            if (this.isDestroyed) return;
            this.handleVoiceConnect(e);
        };
        const voiceDisconnectHandler2 = (e) => {
            if (this.isDestroyed) return;
            this.handleVoiceDisconnect(e);
        };
        
        window.addEventListener("localVoiceStateChanged", localVoiceStateHandler);
        window.addEventListener("voiceDisconnect", voiceDisconnectHandler1);
        window.addEventListener("voiceConnect", voiceConnectHandler);
        window.addEventListener("voiceDisconnect", voiceDisconnectHandler2);
        
        this.eventListeners.push(
            { element: window, event: "localVoiceStateChanged", handler: localVoiceStateHandler },
            { element: window, event: "voiceDisconnect", handler: voiceDisconnectHandler1 },
            { element: window, event: "voiceConnect", handler: voiceConnectHandler },
            { element: window, event: "voiceDisconnect", handler: voiceDisconnectHandler2 }
        );

        if (window.globalSocketManager?.io) {
            this.setupSocketListeners();
        } else {
            const globalSocketReadyHandler = () => {
                if (this.isDestroyed) return;
                this.setupSocketListeners();
            };
            window.addEventListener('globalSocketReady', globalSocketReadyHandler);
            this.eventListeners.push({ element: window, event: "globalSocketReady", handler: globalSocketReadyHandler });
        }

        if (window.localStorageManager) {
            const voiceStateListener = (state) => {
                if (this.isDestroyed) return;
                if (state.isConnected && state.channelId && state.meetingId) {
                    this.currentChannelId = state.channelId;
                    this.currentChannelName = state.channelName;
                    this.currentMeetingId = state.meetingId;
                    this.updateConnectionStatus(true);
                } else if (!state.isConnected) {
                    this.currentChannelId = null;
                    this.currentChannelName = null;
                    this.currentMeetingId = null;
                    this.updateConnectionStatus(false);
                }
            };
            window.localStorageManager.addVoiceStateListener(voiceStateListener);
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
            console.log(`🔊 [VOICE-CALL-SECTION] Voice state update received:`, data);
            
            if (!data.user_id || !data.channel_id || !data.type) return;
            
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
            if (data.user_id === currentUserId) {
                return;
            }
            
            this.updateParticipantVoiceState(data.user_id, data.type, data.state);
        });
        
        document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId) {
                socket.emit('check-voice-meeting', { channel_id: channelId });
            }
        });
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
            this.rebuildGridFromVideoSDK();
        }, 100);
        
        setTimeout(() => {
            if (window.voiceManager && typeof window.voiceManager.refreshAllParticipants === 'function') {
                window.voiceManager.refreshAllParticipants();
            }
        }, 200);
        
        setTimeout(() => {
            if (window.voiceManager && typeof window.voiceManager.checkAllParticipantsForExistingStreams === 'function') {
                window.voiceManager.checkAllParticipantsForExistingStreams();
            }
        }, 300);
        
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
        }
    }
    
    handleVoiceMeetingStatus(data) {
        

        if (data.has_meeting && data.meeting_id) {
            this.currentMeetingId = data.meeting_id;
        }

        if (Array.isArray(data.participants)) {
            const grid = document.getElementById("participantGrid");
            if (grid) {
                grid.innerHTML = "";
                this.participantElements = new Map();

                const uniqueParticipants = new Map();
                data.participants.forEach((participant) => {
                    const userId = participant.user_id || participant.id;
                    if (userId && !uniqueParticipants.has(userId)) {
                        uniqueParticipants.set(userId, participant);
                    }
                });

                uniqueParticipants.forEach((participant) => {
                    const participantId = participant.user_id || participant.id;
                    const element = this.createParticipantElement(participantId, participant);
                    grid.appendChild(element);
                    this.participantElements.set(participantId, element);
                });

                this.updateGridLayout();
                this.updateParticipantCount();
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
        console.log(`👤 [VOICE-CALL-SECTION] handleParticipantJoined:`, { participant, data });
        
        if (!participant) {
            console.warn('No participant ID provided');
            return;
        }
        
        if (this.participantElements.has(participant)) {
            console.log(`⚠️ [VOICE-CALL-SECTION] Participant already exists:`, participant);
            return;
        }
        
        if (!window.voiceManager) {
            console.warn('Voice manager not ready');
            return;
        }
        
        let participantData = data;
        if (!participantData && window.voiceManager.participants.has(participant)) {
            participantData = window.voiceManager.participants.get(participant);
        }
        
        if (!participantData) {
            console.warn('Participant data not found for:', participant);
            return;
        }
        
        const userId = participantData?.user_id || participantData?.id;
        if (userId) {
            for (const [existingParticipantId, existingElement] of this.participantElements.entries()) {
                const existingUserId = existingElement.getAttribute('data-user-id');
                if (existingUserId === String(userId)) {
                    console.log(`⚠️ [VOICE-CALL-SECTION] User already has a participant card:`, userId);
                    return;
                }
            }
        }
        
        const grid = document.getElementById("participantGrid");
        if (!grid) return;
        
        try {
            const element = this.createParticipantElement(participant, participantData);
            
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px) scale(0.9)';
            element.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
            
            grid.appendChild(element);
            this.participantElements.set(participant, element);
            console.log(`✅ [VOICE-CALL-SECTION] Participant element stored with key: ${participant}`);
            console.log(`📋 [VOICE-CALL-SECTION] Current participant keys:`, Array.from(this.participantElements.keys()));
            
            if (element.hasAttribute('data-is-local')) {
                this.updateLocalParticipantIndicators();
            }
            
            requestAnimationFrame(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0) scale(1)';
            });
            
            requestAnimationFrame(() => {
                this.restoreExistingStreamsForParticipant(participant, participantData, element);
            });
            
            this.updateGridLayout();
            this.updateParticipantCount();
            
            if (window.ChannelVoiceParticipants && this.currentChannelId) {
                const instance = window.ChannelVoiceParticipants.getInstance();
                instance.updateSidebarForChannel(this.currentChannelId, 'append');
            }
        } catch (error) {
            console.warn('Failed to handle participant joined:', participant, error);
        }
    }

    handleParticipantLeft(event) {
        const { participant } = event.detail;
        if (!participant) return;
        
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
            
            requestAnimationFrame(() => {
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
            });
        }
    }

    handleStreamEnabled(event) {
        const { participantId, kind, stream } = event.detail;
        console.log(`🎥 [VOICE-CALL-SECTION] handleStreamEnabled:`, { participantId, kind, stream });
        
        let element = this.participantElements.get(participantId);
        console.log(`🔍 [VOICE-CALL-SECTION] Participant element found:`, element ? 'YES' : 'NO');
        
        if (!element) {
            console.error(`❌ [VOICE-CALL-SECTION] No participant element found for ID: ${participantId}`);
            console.log(`📋 [VOICE-CALL-SECTION] Available participant keys:`, Array.from(this.participantElements.keys()));
            
            // Try to find via DOM first
            element = document.querySelector(`[data-participant-id="${participantId}"]`);
            if (element) {
                console.log(`🔧 [VOICE-CALL-SECTION] Found element via DOM query, adding to map`);
                this.participantElements.set(participantId, element);
            } else {
                console.error(`❌ [VOICE-CALL-SECTION] Element not found in DOM either`);
                console.log(`🔧 [VOICE-CALL-SECTION] Attempting to create participant card first...`);

                // Check if participant exists in voice manager
                if (window.voiceManager && window.voiceManager.participants.has(participantId)) {
                    const participantData = window.voiceManager.participants.get(participantId);
                    console.log(`✅ [VOICE-CALL-SECTION] Found participant data, creating element`);
                    
                    const newElement = this.createParticipantElement(participantId, participantData);
                    if (newElement) {
                        const grid = document.getElementById("participantGrid");
                        if (grid) {
                            // Add with animation
                            newElement.style.opacity = '0';
                            newElement.style.transform = 'translateY(20px) scale(0.9)';
                            newElement.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
                            
                            grid.appendChild(newElement);
                            this.participantElements.set(participantId, newElement);
                            this.updateGridLayout();
                            this.updateParticipantCount();
                            
                            requestAnimationFrame(() => {
                                newElement.style.opacity = '1';
                                newElement.style.transform = 'translateY(0) scale(1)';
                            });
                            
                            element = newElement;
                            console.log(`✅ [VOICE-CALL-SECTION] Created and added new participant element`);
                        }
                    }
                } else {
                    // Participant data doesn't exist, create a basic card
                    console.log(`⚠️ [VOICE-CALL-SECTION] Participant data not found, creating basic card`);
                    const basicParticipantData = {
                        id: participantId,
                        name: `User ${participantId.slice(-4)}`,
                        username: `User ${participantId.slice(-4)}`,
                        avatar_url: '/public/assets/common/default-profile-picture.png',
                        isBot: false,
                        isLocal: false,
                        streams: new Map()
                    };
                    
                    const newElement = this.createParticipantElement(participantId, basicParticipantData);
                    if (newElement) {
                        const grid = document.getElementById("participantGrid");
                        if (grid) {
                            grid.appendChild(newElement);
                            this.participantElements.set(participantId, newElement);
                            this.updateGridLayout();
                            this.updateParticipantCount();
                            element = newElement;
                            console.log(`✅ [VOICE-CALL-SECTION] Created basic participant element`);
                        }
                    }
                }
                
                if (!element) {
                    console.error(`❌ [VOICE-CALL-SECTION] Still no element after attempting to create participant card`);
                    return;
                }
            }
        }
        
        if (kind === 'video' || kind === 'webcam') {
            console.log(`📹 [VOICE-CALL-SECTION] Showing participant video for ${participantId}`);
            this.showParticipantVideo(element, stream);
        } else if (kind === 'share' || kind === 'screenshare') {
            console.log(`🖥️ [VOICE-CALL-SECTION] Creating screen share card for ${participantId}`);
            this.createScreenShareCard(participantId, stream);
        } else {
            console.log(`⚠️ [VOICE-CALL-SECTION] Unknown stream kind: ${kind} for ${participantId}`);
        }
    }
    
    handleStreamDisabled(event) {
        const { participantId, kind } = event.detail;
        console.log(`🎥❌ [VOICE-CALL-SECTION] Stream disabled:`, { participantId, kind });
        
        const element = this.participantElements.get(participantId);
        
        if (kind === 'video' || kind === 'webcam') {
            if (element) this.hideParticipantVideo(element);
        } else if (kind === 'share' || kind === 'screenshare') {
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
        if (!window.voiceManager || !window.voiceManager.initialized) {
            return;
        }
        
        const localCard = document.querySelector('[data-is-local="true"]');
        if (!localCard) return;
        
        const muteIndicator = localCard.querySelector('.mute-indicator');
        const deafenIndicator = localCard.querySelector('.deafen-indicator');
        
        if (muteIndicator) {
            const isMuted = !window.voiceManager.getMicState();
            muteIndicator.classList.toggle('hidden', !isMuted);
            
            muteIndicator.classList.remove('bg-red-500', 'bg-green-500');
            if (isMuted) {
                muteIndicator.classList.add('bg-red-500');
            } else {
                muteIndicator.classList.add('bg-green-500');
            }
        }
        
        if (deafenIndicator) {
            const isDeafened = window.voiceManager.getDeafenState();
            deafenIndicator.classList.toggle('hidden', !isDeafened);
            
            deafenIndicator.classList.remove('bg-red-600', 'bg-green-600');
            if (isDeafened) {
                deafenIndicator.classList.add('bg-red-600');
            } else {
                deafenIndicator.classList.add('bg-green-600');
            }
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
            console.log(`🔊 [VOICE-CALL-SECTION] Participant element not found for user ${userId}`);
            return;
        }
        
        if (type === 'mic') {
            const muteIndicator = participantElement.querySelector('.mute-indicator');
            if (muteIndicator) {
                const isMuted = !state;
                muteIndicator.classList.toggle('hidden', !isMuted);
                
                muteIndicator.classList.remove('bg-red-500', 'bg-green-500');
                if (isMuted) {
                    muteIndicator.classList.add('bg-red-500');
                } else {
                    muteIndicator.classList.add('bg-green-500');
                }
                
                console.log(`🔇 [VOICE-CALL-SECTION] Updated mute indicator for user ${userId}: ${isMuted ? 'muted' : 'unmuted'}`);
            }
        } else if (type === 'deafen') {
            const deafenIndicator = participantElement.querySelector('.deafen-indicator');
            if (deafenIndicator) {
                deafenIndicator.classList.toggle('hidden', !state);
                
                deafenIndicator.classList.remove('bg-red-600', 'bg-green-600');
                if (state) {
                    deafenIndicator.classList.add('bg-red-600');
                } else {
                    deafenIndicator.classList.add('bg-green-600');
                }
                
                console.log(`🔇 [VOICE-CALL-SECTION] Updated deafen indicator for user ${userId}: ${state ? 'deafened' : 'undeafened'}`);
            }
        }
    }

    createParticipantElement(participantId, data) {
        const div = document.createElement("div");
        div.className = "participant-card bg-[#2f3136] rounded-lg p-4 flex flex-col items-center justify-center relative border border-[#40444b] hover:border-[#5865f2] transition-all duration-200";
        div.setAttribute("data-participant-id", participantId);
        
        const userId = data?.user_id || data?.id;
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
            
            ${isLocal ? `
            <div class="voice-indicators absolute top-2 right-2 flex flex-col gap-1 z-30">
                <div class="mute-indicator w-6 h-6 bg-red-500 rounded-full flex items-center justify-center ${!window.voiceManager?.getMicState() ? '' : 'hidden'}">
                    <i class="fas fa-microphone-slash text-white text-xs"></i>
                </div>
                <div class="deafen-indicator w-6 h-6 bg-red-600 rounded-full flex items-center justify-center ${window.voiceManager?.getDeafenState() ? '' : 'hidden'}">
                    <i class="fas fa-deaf text-white text-xs"></i>
                </div>
            </div>
            ` : `
            <div class="voice-indicators absolute top-2 right-2 flex flex-col gap-1 z-30">
                <div class="mute-indicator w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hidden">
                    <i class="fas fa-microphone-slash text-white text-xs"></i>
                </div>
                <div class="deafen-indicator w-6 h-6 bg-red-600 rounded-full flex items-center justify-center hidden">
                    <i class="fas fa-deaf text-white text-xs"></i>
                </div>
            </div>
            `}
            
            <div class="participant-default-view flex flex-col items-center justify-center w-full h-full">
                <div class="participant-avatar w-16 h-16 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-xl mb-3 relative overflow-hidden">
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
        
        return div;
    }
    
    showParticipantVideo(element, stream) {
        console.log(`🎦 [VOICE-CALL-SECTION] showParticipantVideo called with:`, { 
            element: !!element, 
            stream: !!stream,
            streamType: stream?.constructor?.name,
            streamKind: stream?.kind,
            streamTrack: !!stream?.track,
            streamId: stream?.id
        });
        
        const videoOverlay = element.querySelector(".participant-video-overlay");
        const defaultView = element.querySelector(".participant-default-view");
        const video = element.querySelector("video");
        
        console.log(`🔍 [VOICE-CALL-SECTION] Video elements found:`, { 
            videoOverlay: !!videoOverlay, 
            defaultView: !!defaultView, 
            video: !!video 
        });
        
        if (video && stream) {
            let mediaStream;
            
            if (stream instanceof MediaStream) {
                mediaStream = stream;
                console.log(`📺 [VOICE-CALL-SECTION] Stream is already MediaStream`);
            } else if (stream.track) {
                mediaStream = new MediaStream([stream.track]);
                console.log(`📺 [VOICE-CALL-SECTION] Created MediaStream from track`);
            } else if (stream.stream) {
                mediaStream = stream.stream;
                console.log(`📺 [VOICE-CALL-SECTION] Using stream.stream property`);
            } else if (stream.getTracks && typeof stream.getTracks === 'function') {
                const tracks = stream.getTracks();
                if (tracks.length > 0) {
                    mediaStream = new MediaStream(tracks);
                    console.log(`📺 [VOICE-CALL-SECTION] Created MediaStream from getTracks()`, tracks.length);
                }
            } else {
                console.log(`📺 [VOICE-CALL-SECTION] Trying to use stream directly`);
                mediaStream = stream;
            }
            
            console.log(`📺 [VOICE-CALL-SECTION] Final media stream:`, {
                mediaStream: !!mediaStream,
                tracks: mediaStream?.getTracks?.()?.length || 0,
                videoTracks: mediaStream?.getVideoTracks?.()?.length || 0
            });
            
            if (mediaStream) {
                video.srcObject = mediaStream;
                video.play().then(() => {
                    console.log(`✅ [VOICE-CALL-SECTION] Video started playing successfully`);
                }).catch((error) => {
                    console.error(`❌ [VOICE-CALL-SECTION] Video play failed:`, error);
                });
                
                if (videoOverlay) {
                    videoOverlay.classList.remove("hidden");
                    console.log(`✅ [VOICE-CALL-SECTION] Video overlay shown`);
                }
                if (defaultView) {
                    defaultView.classList.add("hidden");
                    console.log(`✅ [VOICE-CALL-SECTION] Default view hidden`);
                }
            } else {
                console.error(`❌ [VOICE-CALL-SECTION] Could not create valid MediaStream`);
            }
        } else {
            console.error(`❌ [VOICE-CALL-SECTION] Missing video or stream:`, { video: !!video, stream: !!stream });
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
    
    createScreenShareCard(participantId, stream) {
        console.log(`🖥️ [VOICE-CALL-SECTION] createScreenShareCard called:`, { 
            participantId, 
            stream: !!stream,
            streamType: stream?.constructor?.name,
            streamKind: stream?.kind,
            streamId: stream?.id
        });
        
        const existingCard = document.querySelector(`[data-screen-share-id="${participantId}"]`);
        if (existingCard) {
            console.log(`⚠️ [VOICE-CALL-SECTION] Screen share card already exists for ${participantId}`);
            return;
        }
        
        const participantName = this.participantElements.get(participantId)?.querySelector(".participant-name")?.textContent || "Unknown";
        const grid = document.getElementById("participantGrid");
        if (!grid) {
            console.error(`❌ [VOICE-CALL-SECTION] No participant grid found`);
            return;
        }
        
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
                console.log(`📺 [VOICE-CALL-SECTION] Screen share stream is already MediaStream`);
            } else if (stream.track) {
                mediaStream = new MediaStream([stream.track]);
                console.log(`📺 [VOICE-CALL-SECTION] Created screen share MediaStream from track`);
            } else if (stream.stream) {
                mediaStream = stream.stream;
                console.log(`📺 [VOICE-CALL-SECTION] Using screen share stream.stream property`);
            } else if (stream.getTracks && typeof stream.getTracks === 'function') {
                const tracks = stream.getTracks();
                if (tracks.length > 0) {
                    mediaStream = new MediaStream(tracks);
                    console.log(`📺 [VOICE-CALL-SECTION] Created screen share MediaStream from getTracks()`, tracks.length);
                }
            } else {
                console.log(`📺 [VOICE-CALL-SECTION] Trying to use screen share stream directly`);
                mediaStream = stream;
            }
            
            console.log(`📺 [VOICE-CALL-SECTION] Final screen share media stream:`, {
                mediaStream: !!mediaStream,
                tracks: mediaStream?.getTracks?.()?.length || 0,
                videoTracks: mediaStream?.getVideoTracks?.()?.length || 0
            });
            
            if (mediaStream) {
                video.srcObject = mediaStream;
                video.play().then(() => {
                    console.log(`✅ [VOICE-CALL-SECTION] Screen share video started playing`);
                }).catch((error) => {
                    console.error(`❌ [VOICE-CALL-SECTION] Screen share video play failed:`, error);
                });
            }
        }
        
        grid.appendChild(card);
        this.updateGridLayout();
        console.log(`✅ [VOICE-CALL-SECTION] Screen share card added to grid`);
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
        
        if (count === 0) {
            grid.className = "w-full h-full grid gap-3 grid-cols-1";
        } else if (count === 1) {
            grid.className = "w-full h-full grid gap-3 grid-cols-1";
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
        const botParticipantId = `bot-${botId}`;
        const element = this.participantElements.get(botParticipantId);
        if (element) {
            const statusElement = element.querySelector('.music-status');
            if (statusElement) {
                statusElement.innerHTML = `<i class="fas fa-music mr-1"></i>${statusText}`;
            }
        }
    }
    
    clearGrid() {
        this.closeParticipantModal();
        
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
        if (!window.voiceManager || !window.voiceManager.initialized || !window.voiceManager.participants) {
            this.clearGrid();
            return;
        }
        
        const grid = document.getElementById("participantGrid");
        if (!grid) return;
        
        const existingParticipants = new Set(this.participantElements.keys());
        const currentParticipants = new Set(window.voiceManager.participants.keys());
        
        currentParticipants.forEach(participantId => {
            const participantData = window.voiceManager.participants.get(participantId);
            if (participantData && !this.participantElements.has(participantId)) {
                try {
                    const element = this.createParticipantElement(participantId, participantData);
                    grid.appendChild(element);
                    this.participantElements.set(participantId, element);
                    if (!participantData.isBot) {
                        requestAnimationFrame(() => {
                            this.restoreExistingStreamsForParticipant(participantId, participantData, element);
                        });
                    }
                } catch (error) {
                    console.warn('Failed to create participant element:', participantId, error);
                }
            }
        });
        
        existingParticipants.forEach(participantId => {
            if (!currentParticipants.has(participantId)) {
                const element = this.participantElements.get(participantId);
                if (element && element.parentNode) {
                    element.remove();
                    this.participantElements.delete(participantId);
                }
            }
        });
        
        this.updateGridLayout();
        this.updateParticipantCount();
        this.updateLocalParticipantIndicators();
    }
    
    restoreExistingStreamsForParticipant(participantId, participantData, element) {
        if (!participantData.streams || participantData.streams.size === 0) return;
        
        
        
        participantData.streams.forEach((stream, kind) => {
            if (kind === 'video' || kind === 'webcam') {
                
                this.showParticipantVideo(element, stream);
            } else if (kind === 'share') {
                
                this.createScreenShareCard(participantId, stream);
            }
        });
    }
    
    removeDuplicateCards() {
        const grid = document.getElementById("participantGrid");
        if (!grid) return;
        
        if (!window.voiceManager || !window.voiceManager.participants) return;
        
        const seenUserIds = new Set();
        const seenParticipantIds = new Set();
        const cardsToRemove = [];
        
        const cards = grid.querySelectorAll('.participant-card');
        cards.forEach(card => {
            const userId = card.getAttribute('data-user-id');
            const participantId = card.getAttribute('data-participant-id');
            
            if (!participantId) {
                cardsToRemove.push({ card, participantId: 'unknown' });
                return;
            }
            
            if (seenParticipantIds.has(participantId)) {
                cardsToRemove.push({ card, participantId });
                return;
            }
            
            if (userId && seenUserIds.has(userId)) {
                cardsToRemove.push({ card, participantId });
                return;
            }
            
            if (participantId) seenParticipantIds.add(participantId);
            if (userId) seenUserIds.add(userId);
        });
        
        cardsToRemove.forEach(({ card, participantId }) => {
            card.remove();
            if (participantId !== 'unknown') {
                this.participantElements.delete(participantId);
            }
        });
        
        if (cardsToRemove.length > 0) {
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
                                     
            if (window.voiceManager && window.voiceManager.isConnected && window.voiceManager.currentChannelId === urlChannelId) {
                window.voiceManager.refreshAllParticipants();
            }
        } else if (metaChannelId && window.voiceManager?.currentChannelId === metaChannelId) {
            this.currentChannelId = metaChannelId;
            this.currentChannelName = window.voiceManager?.currentChannelName || 'Voice Channel';
            
            if (window.voiceManager && window.voiceManager.isConnected) {
                window.voiceManager.refreshAllParticipants();
            }
        }
        
        if (window.localStorageManager) {
            const voiceState = window.localStorageManager.getUnifiedVoiceState();
            this.syncWithVoiceState(voiceState);
            
            if (!voiceState.isConnected) {
                window.localStorageManager.setUnifiedVoiceState({
                    ...voiceState,
                    isMuted: false,
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
    
    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
        
        if (this.duplicateCleanupInterval) {
            clearInterval(this.duplicateCleanupInterval);
            this.duplicateCleanupInterval = null;
        }
        
        this.closeParticipantModal();
        
        this.participantElements.clear();
        
        this.currentChannelId = null;
        this.currentChannelName = null;
        this.currentMeetingId = null;
        
        this.micBtn = null;
        this.videoBtn = null;
        this.deafenBtn = null;
        this.screenBtn = null;
        this.ticTacToeBtn = null;
        this.disconnectBtn = null;
    }
}

if (typeof window !== "undefined") {
    if (window.voiceCallSection) {
        window.voiceCallSection.destroy();
    }
    window.voiceCallSection = new VoiceCallSection();
}
