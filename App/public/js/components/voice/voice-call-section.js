

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
    
    setup() {
        this.bindControls();
        this.bindEvents();
        this.initializeVoiceState();
        this.ensureChannelSync();
        this.syncButtonStates();
        
        // Call ensureChannelSync again after a delay to ensure everything is in sync
        setTimeout(() => {
            this.ensureChannelSync();
        }, 500);
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
                    const currentState = window.voiceManager.getMicState();
                    const newState = window.voiceManager.toggleMic();
                    this.updateMicButton(newState);
                    
                    if (newState !== currentState) {
                        if (newState) {
                            MusicLoaderStatic.playDiscordUnmuteSound();
                        } else {
                            MusicLoaderStatic.playDiscordMuteSound();
                        }
                    }
                }
            });
        }
        
        if (this.videoBtn) {
            this.videoBtn.addEventListener("click", async () => {
                if (window.voiceManager) {
                    const state = await window.voiceManager.toggleVideo();
                    this.updateVideoButton(state);
                }
            });
        }
        
        if (this.deafenBtn) {
            this.deafenBtn.addEventListener("click", () => {
                if (window.voiceManager) {
                    const state = window.voiceManager.toggleDeafen();
                    this.updateDeafenButton(state);
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
                if (window.voiceFacade) {
                    MusicLoaderStatic.playDisconnectVoiceSound();
                    window.voiceFacade.leave();
                } else if (window.voiceManager) {
                    MusicLoaderStatic.playDisconnectVoiceSound();
                    window.voiceManager.leaveVoice();
                }
            });
        }
    }
    
    bindEvents() {
        window.addEventListener("participantJoined", (e) => this.handleParticipantJoined(e));
        window.addEventListener("participantLeft", (e) => this.handleParticipantLeft(e));
        window.addEventListener("streamEnabled", (e) => this.handleStreamEnabled(e));
        window.addEventListener("streamDisabled", (e) => this.handleStreamDisabled(e));
        window.addEventListener("voiceStateChanged", (e) => this.handleVoiceStateChanged(e));
        window.addEventListener("voiceDisconnect", () => this.clearGrid());
        
        window.addEventListener("bot-voice-participant-joined", (e) => this.handleBotParticipantJoined(e));
        window.addEventListener("bot-voice-participant-left", (e) => this.handleBotParticipantLeft(e));
        
        // Listen for unified voice state changes
        window.addEventListener("voiceStateChanged", (e) => this.handleUnifiedVoiceStateChanged(e));
        window.addEventListener("voiceConnect", (e) => this.handleVoiceConnect(e));
        window.addEventListener("voiceDisconnect", (e) => this.handleVoiceDisconnect(e));
        
        // Listen for voice meeting updates
        if (window.globalSocketManager?.io) {
            this.setupSocketListeners();
        } else {
            window.addEventListener('globalSocketReady', () => this.setupSocketListeners());
        }
        
        // Listen for local storage changes
        if (window.localStorageManager) {
            window.localStorageManager.addVoiceStateListener((state) => {
                this.syncWithVoiceState(state);
            });
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
    }
    
    handleUnifiedVoiceStateChanged(event) {
        const { state, source } = event.detail;
        this.syncWithVoiceState(state);
    }
    
    handleVoiceConnect(event) {
        const { channelId, channelName, meetingId } = event.detail;
        
        // Validate the channel ID against our sources of truth
        const urlParams = new URLSearchParams(window.location.search);
        const urlChannelId = urlParams.get('channel');
        const urlChannelType = urlParams.get('type');
        const metaChannelId = document.querySelector('meta[name="channel-id"]')?.content;
        
        let finalChannelId = channelId;
        let finalChannelName = channelName;
        
        // If we're in a voice page and there's a mismatch, use the URL parameter instead
        if (urlChannelType === 'voice' && urlChannelId && urlChannelId !== channelId) {
            console.warn(`⚠️ [VOICE-CALL-SECTION] Channel ID mismatch in handleVoiceConnect: event=${channelId}, url=${urlChannelId}`);
            finalChannelId = urlChannelId;
            
            const channelElement = document.querySelector(`[data-channel-id="${urlChannelId}"]`);
            finalChannelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                              channelElement?.getAttribute('data-channel-name') || 
                              channelName || 'Voice Channel';
        }
        // Or if there's a mismatch with meta tag
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
        
        // Persist meetingId on channel DOM element so debug panel can read it
        const channelDom = document.querySelector(`[data-channel-id="${finalChannelId}"]`);
        if (channelDom && meetingId) {
            channelDom.setAttribute('data-meeting-id', meetingId);
        }
        
        // Ensure all components have the same channel ID
        if (window.voiceManager) {
            window.voiceManager.currentChannelId = finalChannelId;
            window.voiceManager.currentChannelName = finalChannelName;
            window.voiceManager.currentMeetingId = meetingId;
        }
        
        // Update unified voice state (localStorage)
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
        
        if (window.unifiedVoiceStateManager) {
            const currentState = window.unifiedVoiceStateManager.getState() || {};
            window.unifiedVoiceStateManager.setState({
                ...currentState,
                channelId: finalChannelId,
                channelName: finalChannelName,
                meetingId: meetingId,
                isConnected: true
            });
        }
        
        // Update UI to show connected state
        this.updateConnectionStatus(true);
        
        if (!event.detail.skipJoinSound) {
            MusicLoaderStatic.playJoinVoiceSound();
        }
    }
    
    handleVoiceDisconnect(event) {
        this.currentChannelId = null;
        this.currentChannelName = null;
        this.currentMeetingId = null;
        
        // Update UI to show disconnected state
        this.updateConnectionStatus(false);
        this.clearGrid();
    }
    
    handleVoiceMeetingRegistered(data) {
        console.log(`✅ [VOICE-CALL-SECTION] Voice meeting registered:`, data);
        
        if (data.user_id === this.getCurrentUserId()) {
            this.currentMeetingId = data.meeting_id;
            this.updateConnectionStatus(true);
        }
    }
    
    handleVoiceMeetingUpdate(data) {
        console.log(`🔄 [VOICE-CALL-SECTION] Voice meeting update:`, data);
        
        if (data.action === 'join' && data.user_id === this.getCurrentUserId()) {
            this.currentMeetingId = data.meeting_id;
            this.updateConnectionStatus(true);
        } else if (data.action === 'leave' && data.user_id === this.getCurrentUserId()) {
            this.currentMeetingId = null;
            this.updateConnectionStatus(false);
        }
    }
    
    handleVoiceMeetingStatus(data) {
        console.log(`📊 [VOICE-CALL-SECTION] Voice meeting status:`, data);
        
        if (data.has_meeting && data.meeting_id) {
            this.currentMeetingId = data.meeting_id;
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
        }
    }
    
    ensureChannelSync() {
        // Priority order: URL > Meta tag > Unified state > Voice manager
        const urlParams = new URLSearchParams(window.location.search);
        const urlChannelId = urlParams.get('channel');
        const urlChannelType = urlParams.get('type');
        const metaChannelId = document.querySelector('meta[name="channel-id"]')?.content;
        const unifiedState = window.unifiedVoiceStateManager?.getState();
        
        let determinedChannelId = null;
        let determinedChannelName = null;
        
        // URL takes highest priority
        if (urlChannelType === 'voice' && urlChannelId) {
            determinedChannelId = urlChannelId;
            const channelElement = document.querySelector(`[data-channel-id="${urlChannelId}"]`);
            determinedChannelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                                    channelElement?.getAttribute('data-channel-name') || 
                                    'Voice Channel';
        } 
        // Then meta tag if it exists
        else if (metaChannelId) {
            determinedChannelId = metaChannelId;
            const channelElement = document.querySelector(`[data-channel-id="${metaChannelId}"]`);
            determinedChannelName = channelElement?.querySelector('.channel-name')?.textContent?.trim() || 
                                    channelElement?.getAttribute('data-channel-name') || 
                                    'Voice Channel';
        }
        // Then unified state if it exists
        else if (unifiedState?.channelId) {
            determinedChannelId = unifiedState.channelId;
            determinedChannelName = unifiedState.channelName || 'Voice Channel';
        }
        // Finally voice manager as fallback
        else if (window.voiceManager?.currentChannelId) {
            determinedChannelId = window.voiceManager.currentChannelId;
            determinedChannelName = window.voiceManager.currentChannelName || 'Voice Channel';
        }
        
        if (determinedChannelId) {
            console.log(`✅ [VOICE-CALL-SECTION] Channel sync determined: ${determinedChannelId} (${determinedChannelName})`);
            
            // Update all systems with this single source of truth
            this.currentChannelId = determinedChannelId;
            this.currentChannelName = determinedChannelName;
            
            if (window.voiceManager) {
                window.voiceManager.currentChannelId = determinedChannelId;
                window.voiceManager.currentChannelName = determinedChannelName;
            }
            
            if (window.unifiedVoiceStateManager) {
                const currentState = window.unifiedVoiceStateManager.getState() || {};
                window.unifiedVoiceStateManager.setState({
                    ...currentState,
                    channelId: determinedChannelId,
                    channelName: determinedChannelName
                });
            }
            
            // Also ensure localStorage directly matches this source of truth
            this.syncUnifiedVoiceStateWithCurrentChannel();
            
            return true;
        }
        
        return false;
    }
    
    syncUnifiedVoiceStateWithCurrentChannel() {
        if (!window.localStorageManager || !this.currentChannelId) return;
        
        const currentState = window.localStorageManager.getUnifiedVoiceState();
        
        // Check if either channel ID or meeting ID are different
        if (currentState.channelId !== this.currentChannelId || 
            (this.currentMeetingId && currentState.meetingId !== this.currentMeetingId)) {
            
            console.log(`🔄 [VOICE-CALL-SECTION] Syncing unified voice state with current channel:`, {
                channelId: {
                    current: this.currentChannelId,
                    storage: currentState.channelId
                },
                meetingId: {
                    current: this.currentMeetingId,
                    storage: currentState.meetingId
                }
            });
            
            window.localStorageManager.setUnifiedVoiceState({
                ...currentState,
                channelId: this.currentChannelId,
                channelName: this.currentChannelName,
                meetingId: this.currentMeetingId || currentState.meetingId
            });
        }
    }
    
    updateConnectionStatus(isConnected) {
        const connectionInfo = document.querySelector('.voice-connection-info');
        if (connectionInfo) {
            if (isConnected && this.currentChannelName) {
                connectionInfo.textContent = `Connected to ${this.currentChannelName}`;
                connectionInfo.classList.add('connected');
                connectionInfo.classList.remove('disconnected');
            } else {
                connectionInfo.textContent = 'Not connected';
                connectionInfo.classList.add('disconnected');
                connectionInfo.classList.remove('connected');
            }
        }
    }
    
    getCurrentUserId() {
        return document.querySelector('meta[name="user-id"]')?.content || 
               window.currentUserId;
    }
    
    handleParticipantJoined(event) {
        const { participant, data } = event.detail;
        if (this.participantElements.has(participant)) return;
        
        const element = this.createParticipantElement(participant, data);
        const grid = document.getElementById("participantGrid");
        if (grid) {
            grid.appendChild(element);
            this.participantElements.set(participant, element);
            this.updateGridLayout();
            this.updateParticipantCount();
            
            if (window.ChannelVoiceParticipants && this.currentChannelId) {
                const instance = window.ChannelVoiceParticipants.getInstance();
                instance.updateSidebarForChannel(this.currentChannelId);
            }
        }
    }
    
    handleParticipantLeft(event) {
        const { participant } = event.detail;
        const element = this.participantElements.get(participant);
        if (element) {
            element.remove();
            this.participantElements.delete(participant);
            this.updateGridLayout();
            this.updateParticipantCount();
            
            if (window.ChannelVoiceParticipants && this.currentChannelId) {
                const instance = window.ChannelVoiceParticipants.getInstance();
                instance.updateSidebarForChannel(this.currentChannelId);
            }
        }
    }
    
    handleBotParticipantJoined(event) {
        const { participant } = event.detail;
        if (!participant || !participant.user_id) return;
        
        const botId = `bot-${participant.user_id}`;
        if (this.participantElements.has(botId)) return;
        
        const botData = {
            displayName: participant.username || 'TitiBot',
            name: participant.username || 'TitiBot',
            isBot: true,
            user_id: participant.user_id,
            avatar_url: participant.avatar_url || '/public/assets/landing-page/robot.webp',
            channelId: participant.channelId || participant.channel_id
        };
        
        const element = this.createParticipantElement(botId, botData);
        const grid = document.getElementById("participantGrid");
        if (grid) {
            grid.appendChild(element);
            this.participantElements.set(botId, element);
            this.updateGridLayout();
            this.updateParticipantCount();
            
            const targetChannelId = participant.channelId || participant.channel_id || this.currentChannelId;
            if (window.ChannelVoiceParticipants && targetChannelId) {
                const instance = window.ChannelVoiceParticipants.getInstance();
                instance.updateSidebarForChannel(targetChannelId);
            }
        }
    }
    
    handleBotParticipantLeft(event) {
        const { participant } = event.detail;
        if (!participant || !participant.user_id) return;
        
        const botId = `bot-${participant.user_id}`;
        const element = this.participantElements.get(botId);
        if (element) {
            element.remove();
            this.participantElements.delete(botId);
            this.updateGridLayout();
            this.updateParticipantCount();
            
            const targetChannelId = participant.channelId || participant.channel_id || this.currentChannelId;
            if (window.ChannelVoiceParticipants && targetChannelId) {
                const instance = window.ChannelVoiceParticipants.getInstance();
                instance.updateSidebarForChannel(targetChannelId);
            }
        }
    }
    
    handleStreamEnabled(event) {
        const { participantId, kind, stream } = event.detail;
        const element = this.participantElements.get(participantId);
        if (!element) return;
        
        if (kind === 'video' || kind === 'webcam') {
            this.showParticipantVideo(element, stream);
        } else if (kind === 'share') {
            this.createScreenShareCard(participantId, stream);
        }
    }
    
    handleStreamDisabled(event) {
        const { participantId, kind } = event.detail;
        const element = this.participantElements.get(participantId);
        
        if (kind === 'video' || kind === 'webcam') {
            if (element) this.hideParticipantVideo(element);
        } else if (kind === 'share') {
            this.removeScreenShareCard(participantId);
        }
    }
    
    handleVoiceStateChanged(event) {
        const { type, state } = event.detail;
        
        switch (type) {
            case 'mic':
                this.updateMicButton(state);
                break;
            case 'video':
                this.updateVideoButton(state);
                break;
            case 'deafen':
                this.updateDeafenButton(state);
                break;
            case 'screen':
                this.updateScreenButton(state);
                break;
        }
    }
    
    createParticipantElement(participantId, data) {
        const div = document.createElement("div");
        div.className = "participant-card bg-[#2f3136] rounded-lg p-4 flex flex-col items-center justify-center relative border border-[#40444b] hover:border-[#5865f2] transition-all duration-200";
        div.setAttribute("data-participant-id", participantId);
        
        const name = data?.displayName || data?.name || data?.username || "Unknown";
        const isLocal = data?.isLocal || (participantId === window.voiceManager?.localParticipant?.id);
        const isBot = data?.isBot || participantId.startsWith('bot-');
        const avatarUrl = data?.avatar_url || '/public/assets/common/default-profile-picture.png';
        const hasCustomAvatar = avatarUrl && !avatarUrl.includes('default-profile-picture');
        const showImage = isBot || hasCustomAvatar;
        
        div.innerHTML = `
            <div class="participant-video-overlay hidden absolute inset-0 rounded-lg overflow-hidden z-20">
                <video class="w-full h-full object-cover rounded-lg" autoplay muted playsinline></video>
                <div class="video-overlay-info absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1">
                    <span class="text-white text-sm font-medium truncate">${name}${isLocal ? ' (You)' : ''}</span>
                </div>
            </div>
            <div class="participant-default-view flex flex-col items-center justify-center w-full h-full">
                <div class="participant-avatar w-16 h-16 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-xl mb-3 relative overflow-hidden">
                    ${showImage ? `<img src="${avatarUrl}" alt="${name}" class="w-full h-full object-cover rounded-full" onerror="this.src='/public/assets/common/default-profile-picture.png'">` : `<span>${this.getInitials(name)}</span>`}
                    ${isBot ? '<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-[#5865f2] rounded-full flex items-center justify-center"><i class="fas fa-robot text-white text-xs"></i></div>' : ''}
                </div>
                <span class="participant-name text-white text-sm font-medium text-center mb-2 max-w-full truncate">${name}${isLocal ? ' (You)' : ''}${isBot ? ' (Bot)' : ''}</span>
                ${isBot ? '<div class="music-status text-xs text-[#5865f2] text-center"><i class="fas fa-music mr-1"></i>Ready to play music</div>' : ''}
            </div>
        `;
        
        return div;
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
            grid.className = "w-full h-full grid gap-3 grid-cols-1 place-items-center";
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
        const grid = document.getElementById("participantGrid");
        if (grid) {
            grid.innerHTML = "";
        }
        this.participantElements.clear();
        this.updateParticipantCount();
    }
    
    syncButtonStates() {
        if (!window.voiceManager) return;
        
        this.updateMicButton(window.voiceManager.getMicState());
        this.updateVideoButton(window.voiceManager.getVideoState());
        this.updateDeafenButton(window.voiceManager.getDeafenState());
        this.updateScreenButton(window.voiceManager.getScreenShareState());
    }
    
    updateMicButton(isOn) {
        if (!this.micBtn) return;
        
        const icon = this.micBtn.querySelector("i");
        const tooltip = this.micBtn.querySelector(".voice-tooltip");
        
        if (isOn) {
            icon.className = "fas fa-microphone text-sm";
            tooltip.textContent = "Mute";
            this.micBtn.classList.remove("bg-[#ed4245]");
            this.micBtn.classList.add("bg-[#4f545c]");
        } else {
            icon.className = "fas fa-microphone-slash text-sm";
            tooltip.textContent = "Unmute";
            this.micBtn.classList.remove("bg-[#4f545c]");
            this.micBtn.classList.add("bg-[#ed4245]");
        }
    }
    
    updateVideoButton(isOn) {
        if (!this.videoBtn) return;
        
        const icon = this.videoBtn.querySelector("i");
        const tooltip = this.videoBtn.querySelector(".voice-tooltip");
        
        if (isOn) {
            icon.className = "fas fa-video text-sm";
            tooltip.textContent = "Turn Off Camera";
            this.videoBtn.classList.remove("bg-[#4f545c]");
            this.videoBtn.classList.add("bg-[#3ba55c]");
        } else {
            icon.className = "fas fa-video-slash text-sm";
            tooltip.textContent = "Turn On Camera";
            this.videoBtn.classList.remove("bg-[#3ba55c]");
            this.videoBtn.classList.add("bg-[#4f545c]");
        }
    }
    
    updateDeafenButton(isOn) {
        if (!this.deafenBtn) return;
        
        const icon = this.deafenBtn.querySelector("i");
        const tooltip = this.deafenBtn.querySelector(".voice-tooltip");
        
        if (isOn) {
            icon.className = "fas fa-deaf text-sm";
            tooltip.textContent = "Undeafen";
            this.deafenBtn.classList.remove("bg-[#4f545c]");
            this.deafenBtn.classList.add("bg-[#ed4245]");
        } else {
            icon.className = "fas fa-headphones text-sm";
            tooltip.textContent = "Deafen";
            this.deafenBtn.classList.remove("bg-[#ed4245]");
            this.deafenBtn.classList.add("bg-[#4f545c]");
        }
    }
    
    updateScreenButton(isOn) {
        if (!this.screenBtn) return;
        
        const icon = this.screenBtn.querySelector("i");
        const tooltip = this.screenBtn.querySelector(".voice-tooltip");
        
        if (isOn) {
            icon.className = "fas fa-stop text-sm";
            tooltip.textContent = "Stop Sharing";
            this.screenBtn.classList.remove("bg-[#4f545c]");
            this.screenBtn.classList.add("bg-[#5865f2]");
        } else {
            icon.className = "fas fa-desktop text-sm";
            tooltip.textContent = "Share Screen";
            this.screenBtn.classList.remove("bg-[#5865f2]");
            this.screenBtn.classList.add("bg-[#4f545c]");
        }
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
        
        // Sync with current unified voice state
        if (window.localStorageManager) {
            const voiceState = window.localStorageManager.getUnifiedVoiceState();
            this.syncWithVoiceState(voiceState);
        }
        
        // Check if there's an active voice manager connection
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
