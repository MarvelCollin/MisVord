class VoiceManager {
    constructor() {
        this.meeting = null;
        this.isConnected = false;
        this.isMeetingJoined = false;
        this.currentChannelId = null;
        this.currentChannelName = null;
        this.currentMeetingId = null;
        this.authToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhcGlrZXkiOiI4YWQyZGJjZC02MzhkLTRmYmItOTk5Yy05YTQ4YTgzY2FhMTUiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIiwiYWxsb3dfcHVibGlzaCJdLCJpYXQiOjE3NTEyMTU2MjEsImV4cCI6MTc1MzgwNzYyMX0.duF2XwBk9-glZTDWS8QyX4yGNaf6faZXUCLsc07QxJk";
        this.participants = new Map();
        this.botParticipants = new Map();
        this.localParticipant = null;
        
        this._micOn = false;
        this._videoOn = false;
        this._screenShareOn = false;
        this._deafened = false;
        
        this.init();
    }
    
    async init() {
        await this.loadVideoSDK();
        this.setupBeforeUnloadHandler();
        this.setupBotEventListeners();
        window.voiceManager = this;
        console.log('[VoiceManager] Initialized successfully');
    }
    
    async ensureInitialized() {
        if (!this.sdkLoaded) {
            await this.loadVideoSDK();
        }
        return this.sdkLoaded;
    }
    
    async loadVideoSDK() {
        if (typeof VideoSDK !== 'undefined') {
            this.sdkLoaded = true;
            return;
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js';
            script.onload = () => {
                this.sdkLoaded = true;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    setupBeforeUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            if (this.isConnected) {
                this.leaveVoice();
            }
        });
    }
    
    setupBotEventListeners() {
        if (window.globalSocketManager?.io) {
            window.globalSocketManager.io.on('bot-voice-participant-joined', (data) => {
                this.handleBotParticipantJoined(data);
            });
            
            window.globalSocketManager.io.on('bot-voice-participant-left', (data) => {
                this.handleBotParticipantLeft(data);
            });
        } else {
            window.addEventListener('globalSocketReady', () => {
                this.setupBotEventListeners();
            });
        }
    }
    
    handleBotParticipantJoined(data) {
        const { participant, channelId } = data;
        if (!participant || !participant.user_id) return;
        
        if (channelId === this.currentChannelId) {
            const botId = `bot-${participant.user_id}`;
            this.botParticipants.set(botId, {
                id: botId,
                user_id: participant.user_id,
                name: participant.username || 'TitiBot',
                username: participant.username || 'TitiBot',
                avatar_url: participant.avatar_url || '/public/assets/landing-page/robot.webp',
                isBot: true,
                isLocal: false,
                streams: new Map(),
                channelId: channelId
            });
            
            this.participants.set(botId, this.botParticipants.get(botId));
            
            window.dispatchEvent(new CustomEvent('participantJoined', {
                detail: { participant: botId, data: this.botParticipants.get(botId) }
            }));
        }
    }
    
    handleBotParticipantLeft(data) {
        const { participant } = data;
        if (!participant || !participant.user_id) return;
        
        const botId = `bot-${participant.user_id}`;
        if (this.botParticipants.has(botId)) {
            this.botParticipants.delete(botId);
            this.participants.delete(botId);
            
            window.dispatchEvent(new CustomEvent('participantLeft', {
                detail: { participant: botId }
            }));
        }
    }
    
    async joinVoice(channelId, channelName) {
        if (this.isConnected) {
            if (this.currentChannelId === channelId) return;
            await this.leaveVoice();
        }
        
        try {
            this.currentChannelId = channelId;
            this.currentChannelName = channelName;
            
            // Check unified voice state first
            const voiceState = window.localStorageManager?.getUnifiedVoiceState();
            let meetingId = null;
            
            // If there's a stored meeting ID for this channel, use it
            if (voiceState && voiceState.channelId === channelId && voiceState.meetingId && voiceState.isConnected) {
                meetingId = voiceState.meetingId;
                console.log(`🔄 [VOICE-MANAGER] Using stored meeting ID from unified voice state:`, {
                    channelId,
                    meetingId,
                    storedState: voiceState
                });
            } else {
                // Get or create meeting ID from server
                meetingId = await this.getOrCreateMeeting(channelId);
                console.log(`🆕 [VOICE-MANAGER] Got meeting ID from server:`, {
                    channelId,
                    meetingId
                });
            }
            
            const userName = this.getUserName();
            
            VideoSDK.config(this.authToken);
            
            this.meeting = VideoSDK.initMeeting({
                meetingId: meetingId,
                name: userName,
                micEnabled: true,
                webcamEnabled: false
            });
            
            this.setupMeetingEvents();
            await this.meeting.join();
            
            this.isConnected = true;
            this.currentMeetingId = meetingId;
            
            // Update unified voice state
            this.updateUnifiedVoiceState({
                isConnected: true,
                channelId: channelId,
                channelName: channelName,
                meetingId: meetingId,
                connectionTime: Date.now()
            });
            
            this.updatePresence();
            this.notifySocketServer('join', meetingId);
            this.loadExistingBotParticipants();
            
            window.dispatchEvent(new CustomEvent('voiceConnect', {
                detail: { channelId, channelName, meetingId }
            }));
            
        } catch (error) {
            console.error('Failed to join voice:', error);
            this.cleanup();
            throw error;
        }
    }
    
    async leaveVoice() {
        if (!this.isConnected) return;
        
        try {
            this.notifySocketServer('leave');
            
            if (this.meeting) {
                await this.meeting.leave();
            }
            
            this.cleanup();
            
            // Update unified voice state
            this.updateUnifiedVoiceState({
                isConnected: false,
                channelId: null,
                channelName: null,
                meetingId: null,
                connectionTime: null
            });
            
            window.dispatchEvent(new CustomEvent('voiceDisconnect', {
                detail: { channelId: this.currentChannelId }
            }));
            
        } catch (error) {
            console.error('Failed to leave voice:', error);
            this.cleanup();
            
            // Still update state even if leaving failed
            this.updateUnifiedVoiceState({
                isConnected: false,
                channelId: null,
                channelName: null,
                meetingId: null,
                connectionTime: null
            });
        }
    }
    
    cleanup() {
        this.meeting = null;
        this.isConnected = false;
        this.isMeetingJoined = false;
        this.currentChannelId = null;
        this.currentChannelName = null;
        this.currentMeetingId = null;
        this.participants.clear();
        this.botParticipants.clear();
        this.localParticipant = null;
        
        this._micOn = false;
        this._videoOn = false;
        this._screenShareOn = false;
        this._deafened = false;
        
        if (window.globalSocketManager) {
            window.globalSocketManager.updatePresence('online', { type: 'active' });
        }
        
        // Update unified voice state
        this.updateUnifiedVoiceState({
            isConnected: false,
            channelId: null,
            channelName: null,
            meetingId: null,
            connectionTime: null
        });
    }
    
    loadExistingBotParticipants() {
        if (window.BotComponent && window.BotComponent.voiceBots) {
            window.BotComponent.voiceBots.forEach((botData, botId) => {
                if (botData.channel_id === this.currentChannelId) {
                    this.handleBotParticipantJoined({
                        participant: botData,
                        channelId: this.currentChannelId
                    });
                }
            });
        }
    }
    
    getAllParticipants() {
        return new Map([...this.participants]);
    }
    
    getHumanParticipants() {
        const humanParticipants = new Map();
        this.participants.forEach((participant, id) => {
            if (!participant.isBot) {
                humanParticipants.set(id, participant);
            }
        });
        return humanParticipants;
    }
    
    getBotParticipants() {
        return new Map([...this.botParticipants]);
    }
    
    setupMeetingEvents() {
        if (!this.meeting) return;
        
        this.meeting.on('meeting-joined', () => {
            this.isMeetingJoined = true;
            this.localParticipant = this.meeting.localParticipant;
            this.handleParticipantJoined(this.meeting.localParticipant);
        });
        
        this.meeting.on('meeting-left', () => {
            this.isMeetingJoined = false;
        });
        
        this.meeting.on('participant-joined', (participant) => {
            this.handleParticipantJoined(participant);
        });
        
        this.meeting.on('participant-left', (participant) => {
            this.handleParticipantLeft(participant);
        });
        
        if (this.meeting.localParticipant) {
            this.setupStreamHandlers(this.meeting.localParticipant);
        }
    }
    
    handleParticipantJoined(participant) {
        if (!participant || this.participants.has(participant.id)) return;
        
        this.participants.set(participant.id, {
            id: participant.id,
            name: participant.displayName || participant.name,
            username: participant.displayName || participant.name,
            isBot: false,
            isLocal: participant.id === this.localParticipant?.id,
            streams: new Map()
        });
        
        this.setupStreamHandlers(participant);
        
        window.dispatchEvent(new CustomEvent('participantJoined', {
            detail: { participant: participant.id, data: participant }
        }));
    }
    
    handleParticipantLeft(participant) {
        if (!participant) return;
        
        this.participants.delete(participant.id);
        
        window.dispatchEvent(new CustomEvent('participantLeft', {
            detail: { participant: participant.id }
        }));
    }
    
    setupStreamHandlers(participant) {
        if (!participant) return;
        
        participant.on('stream-enabled', (stream) => {
            const participantData = this.participants.get(participant.id);
            if (participantData) {
                participantData.streams.set(stream.kind, stream);
            }
            
            window.dispatchEvent(new CustomEvent('streamEnabled', {
                detail: { 
                    participantId: participant.id,
                    kind: stream.kind,
                    stream: stream
                }
            }));
        });
        
        participant.on('stream-disabled', (stream) => {
            const participantData = this.participants.get(participant.id);
            if (participantData) {
                participantData.streams.delete(stream.kind);
            }
            
            window.dispatchEvent(new CustomEvent('streamDisabled', {
                detail: {
                    participantId: participant.id,
                    kind: stream.kind
                }
            }));
        });
    }
    
    toggleMic() {
        if (!this.meeting || !this.localParticipant) return this._micOn;
        
        if (this._micOn) {
            this.meeting.muteMic();
            this._micOn = false;
        } else {
            this.meeting.unmuteMic();
            this._micOn = true;
        }
        
        window.dispatchEvent(new CustomEvent('voiceStateChanged', {
            detail: { type: 'mic', state: this._micOn }
        }));
        
        return this._micOn;
    }
    
    async toggleVideo() {
        if (!this.meeting || !this.localParticipant) return this._videoOn;
        
        try {
            if (this._videoOn) {
                await this.meeting.disableWebcam();
                this._videoOn = false;
            } else {
                await this.meeting.enableWebcam();
                this._videoOn = true;
            }
            
            window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                detail: { type: 'video', state: this._videoOn }
            }));
            
            return this._videoOn;
        } catch (error) {
            console.error('Failed to toggle video:', error);
            return this._videoOn;
        }
    }
    
    toggleDeafen() {
        this._deafened = !this._deafened;
        
        if (this._deafened && this._micOn) {
            this.toggleMic();
        }
        
        window.dispatchEvent(new CustomEvent('voiceStateChanged', {
            detail: { type: 'deafen', state: this._deafened }
        }));
        
        return this._deafened;
    }
    
    async toggleScreenShare() {
        if (!this.meeting || !this.localParticipant) return this._screenShareOn;
        
        try {
            if (this._screenShareOn) {
                await this.meeting.disableScreenShare();
                this._screenShareOn = false;
            } else {
                await this.meeting.enableScreenShare();
                this._screenShareOn = true;
            }
            
            window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                detail: { type: 'screen', state: this._screenShareOn }
            }));
            
            return this._screenShareOn;
        } catch (error) {
            console.error('Failed to toggle screen share:', error);
            return this._screenShareOn;
        }
    }
    
    getMicState() { return this._micOn; }
    getVideoState() { return this._videoOn; }
    getDeafenState() { return this._deafened; }
    getScreenShareState() { return this._screenShareOn; }
    
    async getOrCreateMeeting(channelId) {
        // First check if there's an existing meeting on the server
        const existing = await this.checkExistingMeeting(channelId);
        if (existing?.meeting_id) {
            console.log(`🔄 [VOICE-MANAGER] Found existing meeting on server:`, {
                channelId,
                meetingId: existing.meeting_id
            });
            return existing.meeting_id;
        }
        
        // Check unified voice state for this channel
        const voiceState = window.localStorageManager?.getUnifiedVoiceState();
        if (voiceState && voiceState.channelId === channelId && voiceState.meetingId) {
            // Validate the stored meeting ID with the server
            const isValid = await this.validateMeetingId(voiceState.meetingId, channelId);
            if (isValid) {
                console.log(`✅ [VOICE-MANAGER] Using validated meeting ID from unified voice state:`, {
                    channelId,
                    meetingId: voiceState.meetingId
                });
                return voiceState.meetingId;
            } else {
                console.log(`❌ [VOICE-MANAGER] Stored meeting ID is invalid, creating new one:`, {
                    channelId,
                    invalidMeetingId: voiceState.meetingId
                });
            }
        }
        
        // Create new meeting
        const customMeetingId = `voice_channel_${channelId}_${Date.now()}`;
        
        try {
            const response = await fetch('https://api.videosdk.live/v2/rooms', {
                method: 'POST',
                headers: {
                    'Authorization': this.authToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ customRoomId: customMeetingId })
            });
            
            const data = await response.json();
            const meetingId = data.roomId || customMeetingId;
            
            console.log(`🆕 [VOICE-MANAGER] Created new meeting:`, {
                channelId,
                meetingId
            });
            
            return meetingId;
        } catch (error) {
            console.error('Failed to create meeting:', error);
            return customMeetingId;
        }
    }
    
    async checkExistingMeeting(channelId) {
        return new Promise((resolve) => {
            if (!window.globalSocketManager?.io) {
                resolve(null);
                return;
            }
            
            const timeout = setTimeout(() => {
                window.globalSocketManager.io.off('voice-meeting-status', handler);
                resolve(null);
            }, 3000);
            
            const handler = (data) => {
                if (data.channel_id === channelId) {
                    clearTimeout(timeout);
                    window.globalSocketManager.io.off('voice-meeting-status', handler);
                    
                    console.log(`🔍 [VOICE-MANAGER] Server meeting check result:`, {
                        channelId,
                        hasMeeting: data.has_meeting,
                        meetingId: data.meeting_id,
                        participantCount: data.participant_count
                    });
                    
                    resolve(data.has_meeting ? data : null);
                }
            };
            
            window.globalSocketManager.io.on('voice-meeting-status', handler);
            window.globalSocketManager.io.emit('check-voice-meeting', { channel_id: channelId });
        });
    }
    
    async validateMeetingId(meetingId, channelId) {
        return new Promise((resolve) => {
            if (!window.globalSocketManager?.io) {
                resolve(false);
                return;
            }
            
            const timeout = setTimeout(() => {
                window.globalSocketManager.io.off('voice-meeting-status', handler);
                resolve(false);
            }, 3000);
            
            const handler = (data) => {
                if (data.channel_id === channelId) {
                    clearTimeout(timeout);
                    window.globalSocketManager.io.off('voice-meeting-status', handler);
                    resolve(data.has_meeting && data.meeting_id === meetingId);
                }
            };
            
            window.globalSocketManager.io.on('voice-meeting-status', handler);
            window.globalSocketManager.io.emit('check-voice-meeting', { channel_id: channelId });
        });
    }
    
    notifySocketServer(action, meetingId) {
        if (!window.globalSocketManager?.io) return;
        
        if (action === 'join') {
            window.globalSocketManager.io.emit('register-voice-meeting', {
                channel_id: this.currentChannelId,
                meeting_id: meetingId,
                username: this.getUserName()
            });
        } else if (action === 'leave') {
            window.globalSocketManager.io.emit('unregister-voice-meeting', {
                channel_id: this.currentChannelId
            });
        }
    }
    
    updatePresence() {
        if (!window.globalSocketManager || !this.currentChannelName) return;
        
        window.globalSocketManager.updatePresence('online', {
            type: `In Voice - ${this.currentChannelName}`,
            state: 'In a voice channel',
            details: this.currentChannelName
        });
    }
    
    getUserName() {
        return document.querySelector('meta[name="username"]')?.content || 
               window.currentUsername || 
               'Anonymous';
    }

    updateUnifiedVoiceState(state) {
        if (window.localStorageManager) {
            window.localStorageManager.setUnifiedVoiceState(state);
        }
    }
}

if (!window.voiceManager) {
    window.voiceManager = new VoiceManager();
}

if (!window.videoSDKManager) {
    window.videoSDKManager = window.voiceManager;
}
    
    