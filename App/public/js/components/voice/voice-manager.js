class VoiceManager {
    constructor() {
        this.meeting = null;
        this.isConnected = false;
        this.isMeetingJoined = false;
        this.currentChannelId = null;
        this.currentChannelName = null;
        this.currentMeetingId = null;
        this.authToken = null;
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
        await this.fetchAuthToken();
        this.setupBeforeUnloadHandler();
        this.setupBotEventListeners();
        

        if (window.localStorageManager) {
            this.syncChannelWithUnifiedState();
            

            window.localStorageManager.addVoiceStateListener(() => {
                this.syncChannelWithUnifiedState();
            });
            console.log('VoiceManager: LocalStorageManager detected and connected');
        } else {
            console.warn('VoiceManager: LocalStorageManager not available during initialization');
        }
        
        window.voiceManager = this;
        
    }
    
    async ensureInitialized() {
        if (!this.sdkLoaded) {
            await this.loadVideoSDK();
        }
        if (!this.authToken) {
            await this.fetchAuthToken();
        }
        return this.sdkLoaded;
    }

    async fetchAuthToken() {
        try {
            const response = await fetch('/api/videosdk/token', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.authToken = data.token;
                
            } else {
                console.error('[VoiceManager] Failed to fetch auth token:', response.status);
            }
        } catch (error) {
            console.error('[VoiceManager] Error fetching auth token:', error);
        }
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
        window.addEventListener('beforeunload', (event) => {
            if (this.isConnected) {
                
                

                if (this.meeting) {
                    try {
                        this.meeting.leave();
                    } catch (error) {
                        console.error('Error leaving meeting during page unload:', error);
                    }
                }
                

                if (window.globalSocketManager?.io) {
                    try {
                        window.globalSocketManager.io.emit('unregister-voice-meeting', {
                            channel_id: this.currentChannelId,
                            force_disconnect: true
                        });
                    } catch (error) {
                        console.error('Error notifying socket during page unload:', error);
                    }
                }
                

                if (window.localStorageManager) {
                    try {
                        const currentState = window.localStorageManager.getUnifiedVoiceState();
                        window.localStorageManager.setUnifiedVoiceState({
                            ...currentState,
                            isConnected: false,
                            channelId: null,
                            meetingId: null,
                            connectionTime: null,
                            disconnectionReason: 'page_reload'
                        });
                    } catch (error) {
                        console.error('Error updating unified state during page unload:', error);
                    }
                }
                

                if (navigator.sendBeacon && window.location.origin) {
                    try {
                        const disconnectEndpoint = `${window.location.origin}/public/api/voice/disconnect.php`;
                        const data = new FormData();
                        data.append('channel_id', this.currentChannelId || '');
                        data.append('meeting_id', this.currentMeetingId || '');
                        data.append('user_id', document.querySelector('meta[name="user-id"]')?.content || '');
                        navigator.sendBeacon(disconnectEndpoint, data);
                    } catch (error) {
                        console.error('Error sending beacon during page unload:', error);
                    }
                }
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
        const { participant, channelId, isRecovery } = data;
        if (!participant || !participant.user_id) return;
        
        if (channelId === this.currentChannelId) {
            const botId = `bot-${participant.user_id}`;
            

            let avatarUrl = participant.avatar_url;
            if (!avatarUrl || avatarUrl === '/public/assets/common/default-profile-picture.png') {
                avatarUrl = '/public/assets/landing-page/robot.webp';
            }
            
            this.botParticipants.set(botId, {
                id: botId,
                user_id: participant.user_id,
                name: participant.username || 'TitiBot',
                username: participant.username || 'TitiBot',
                avatar_url: avatarUrl,
                isBot: true,
                isLocal: false,
                streams: new Map(),
                channelId: channelId,
                status: participant.status || 'Ready to play music' 
            });
            
            this.participants.set(botId, this.botParticipants.get(botId));
            
            window.dispatchEvent(new CustomEvent('participantJoined', {
                detail: { participant: botId, data: this.botParticipants.get(botId) }
            }));
            
            if (window.ChannelVoiceParticipants) {
                const instance = window.ChannelVoiceParticipants.getInstance();

                const updateMode = isRecovery ? 'full' : 'append';
                setTimeout(() => {
                    instance.updateSidebarForChannel(channelId, updateMode);
                }, isRecovery ? 100 : 0); 
            }
            
            console.log(`🤖 [VOICE-MANAGER] Bot participant ${isRecovery ? 'recovered' : 'joined'}:`, {
                botId,
                username: participant.username,
                channelId,
                isRecovery: !!isRecovery
            });
        }
    }
    
    handleBotParticipantLeft(data) {
        const { participant } = data;
        if (!participant || !participant.user_id) return;
        
        const botId = `bot-${participant.user_id}`;
        if (this.botParticipants.has(botId)) {
            const botData = this.botParticipants.get(botId);
            const channelId = botData.channelId;
            
            this.botParticipants.delete(botId);
            this.participants.delete(botId);
            
            window.dispatchEvent(new CustomEvent('participantLeft', {
                detail: { participant: botId }
            }));
            
            if (window.ChannelVoiceParticipants && channelId) {
                const instance = window.ChannelVoiceParticipants.getInstance();
                instance.updateSidebarForChannel(channelId);
            }
        }
    }
    
    
    async _joinVoice(channelId, channelName, options = {}) {
        if (this.isConnected) {
            if (this.currentChannelId === channelId) return;
            await this._leaveVoice();
        }
        
        const { skipJoinSound = false } = options;
        
        try {
            this.currentChannelId = channelId;
            this.currentChannelName = channelName;
            
            const voiceState = window.localStorageManager?.getUnifiedVoiceState();
            let meetingId = null;
            
            if (voiceState && voiceState.channelId === channelId && voiceState.meetingId && voiceState.isConnected) {
                meetingId = voiceState.meetingId;
                console.log(`🔄 [VOICE-MANAGER] Using stored meeting ID from unified voice state:`, {
                    channelId,
                    meetingId,
                    storedState: voiceState
                });
            } else {
                meetingId = await this.getOrCreateMeeting(channelId);
                console.log(`🆕 [VOICE-MANAGER] Got meeting ID from server:`, {
                    channelId,
                    meetingId
                });
            }
            
            const userName = this.getUserName();
            const userAvatar = document.querySelector('meta[name="user-avatar"]')?.content || '/public/assets/common/default-profile-picture.png';
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content || 'unknown';
            
            if (!this.authToken) {
                console.error('[VoiceManager] Cannot create meeting: Auth token not available');
                return null;
            }
            
            VideoSDK.config(this.authToken);
            
            this.meeting = VideoSDK.initMeeting({
                meetingId: meetingId,
                name: userName,
                micEnabled: true,
                webcamEnabled: false,
                metaData: {
                    user_id: currentUserId,
                    avatar_url: userAvatar
                }
            });
            
            this._micOn = true;
            this._videoOn = false;
            this._screenShareOn = false;
            this._deafened = false;
            
            this.setupMeetingEvents();
            await this.meeting.join();
            
            this.isConnected = true;
            this.currentMeetingId = meetingId;
            
            this.syncChannelWithUnifiedState();
            
            this.updateUnifiedVoiceState({
                isConnected: true,
                channelId: channelId,
                channelName: channelName,
                meetingId: meetingId,
                connectionTime: Date.now(),
                isMuted: !this._micOn,
                isDeafened: this._deafened
            });
            
            this.updatePresence();
            this.notifySocketServer('join', meetingId);
            this.loadExistingBotParticipants();
            
            window.dispatchEvent(new CustomEvent('voiceConnect', {
                detail: { channelId, channelName, meetingId, skipJoinSound }
            }));
            
            if (currentUserId) {
                window.dispatchEvent(new CustomEvent('localVoiceStateChanged', {
                    detail: {
                        userId: currentUserId,
                        channelId: channelId,
                        type: 'mic',
                        state: this._micOn
                    }
                }));
                
                window.dispatchEvent(new CustomEvent('localVoiceStateChanged', {
                    detail: {
                        userId: currentUserId,
                        channelId: channelId,
                        type: 'deafen',
                        state: this._deafened
                    }
                }));
            }
            
            if (!skipJoinSound && window.MusicLoaderStatic) {
                window.MusicLoaderStatic.playJoinVoiceSound();
            }
            
        } catch (error) {
            console.error('Failed to join voice:', error);
            this.cleanup();
            throw error;
        }
    }

    
    async _leaveVoice() {
        if (!this.isConnected) return;
        
        try {
            if (window.MusicLoaderStatic) {
                window.MusicLoaderStatic.playDisconnectVoiceSound();
            }
            
            this.notifySocketServer('leave');
            
            if (this.meeting) {
                await this.meeting.leave();
            }
            
            this.cleanup();
            
            if (window.localStorageManager) {
                window.localStorageManager.clearVoiceState();
            } else {
                this.updateUnifiedVoiceState({
                    isConnected: false,
                    channelId: null,
                    channelName: null,
                    meetingId: null,
                    connectionTime: null,
                    disconnectionTime: Date.now()
                });
            }
            
            window.dispatchEvent(new CustomEvent('voiceDisconnect', {
                detail: { 
                    channelId: null,
                    channelName: null,
                    meetingId: null
                }
            }));
            
        } catch (error) {
            console.error('Failed to leave voice:', error);
        }
    }
    

    async joinVoice(...args) { return this._joinVoice(...args); }
    async leaveVoice(...args) { return this._leaveVoice(...args); }
    
    syncChannelWithUnifiedState() {
        if (!window.localStorageManager) return;
        
        const voiceState = window.localStorageManager.getUnifiedVoiceState();
        

        if (this.isConnected && voiceState.isConnected) {
            let needsSync = false;
            

            if (this.currentChannelId && voiceState.channelId && 
                this.currentChannelId !== voiceState.channelId) {
                needsSync = true;
                console.log(`🔄 [VOICE-MANAGER] Channel ID mismatch detected:`, {
                    manager: this.currentChannelId,
                    storage: voiceState.channelId
                });
            }
            

            if (this.currentMeetingId && voiceState.meetingId && 
                this.currentMeetingId !== voiceState.meetingId) {
                needsSync = true;
                console.log(`🔄 [VOICE-MANAGER] Meeting ID mismatch detected:`, {
                    manager: this.currentMeetingId,
                    storage: voiceState.meetingId
                });
            }
            
            if (needsSync) {
                console.log(`🔄 [VOICE-MANAGER] Syncing unified voice state with current values:`, {
                    channelId: this.currentChannelId,
                    channelName: this.currentChannelName,
                    meetingId: this.currentMeetingId
                });
                
                this.updateUnifiedVoiceState({
                    ...voiceState,
                    channelId: this.currentChannelId,
                    channelName: this.currentChannelName,
                    meetingId: this.currentMeetingId
                });
            }
            
            this._videoOn = voiceState.videoOn || false;
            this._screenShareOn = voiceState.screenShareOn || false;
            this._deafened = voiceState.isDeafened || false;
            
            if (voiceState.isMuted !== undefined) {
                this._micOn = !voiceState.isMuted;
            }
            
            if (this._deafened && this.meeting) {
                this.meeting.participants.forEach(participant => {
                    if (participant.id !== this.localParticipant?.id) {
                        try {
                            participant.streams.forEach(stream => {
                                if (stream.kind === 'audio') {
                                    stream.pause();
                                }
                            });
                        } catch (error) {
                            console.warn('Could not pause audio stream during sync:', participant.id);
                        }
                    }
                });
            }
        }

        else if (!this.isConnected && voiceState.isConnected && 
                 voiceState.channelId && voiceState.meetingId) {
            
            this.currentChannelId = voiceState.channelId;
            this.currentChannelName = voiceState.channelName;
            this.currentMeetingId = voiceState.meetingId;
        }
    }
    
    cleanup() {
        const shouldPreserveStates = this.isConnected && this.currentChannelId;
        let videoState = false;
        let screenShareState = false;
        
        if (shouldPreserveStates && window.localStorageManager) {
            videoState = this._videoOn;
            screenShareState = this._screenShareOn;
        }
        
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
        
        this.updateUnifiedVoiceState({
            isConnected: false,
            channelId: null,
            channelName: null,
            meetingId: null,
            connectionTime: null,
            videoOn: videoState,
            screenShareOn: screenShareState
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
        
        this.meeting.on('meeting-joined', async () => {
            this.isMeetingJoined = true;
            this.localParticipant = this.meeting.localParticipant;
            
            this.localParticipant.enableMic();
            this._micOn = true;
            
            this.handleParticipantJoined(this.meeting.localParticipant);
            
            this.checkAllParticipantsForExistingStreams();
            await this.restoreVideoStatesFromStorage();
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
    
    async restoreVideoStatesFromStorage() {
        if (!window.localStorageManager || !this.meeting || !this.localParticipant) return;
        
        const storedState = window.localStorageManager.getUnifiedVoiceState();
        
        if (storedState.videoOn && !this._videoOn) {
            try {
                await this.meeting.enableWebcam();
                this._videoOn = true;
                window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                    detail: { type: 'video', state: this._videoOn }
                }));
            } catch (error) {
                console.error('Failed to restore video:', error);
            }
        } else if (!storedState.videoOn && this._videoOn) {
            try {
                await this.meeting.disableWebcam();
                this._videoOn = false;
                window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                    detail: { type: 'video', state: this._videoOn }
                }));
            } catch (error) {
                console.error('Failed to disable video:', error);
            }
        }
        
        if (storedState.screenShareOn && !this._screenShareOn) {
            try {
                await this.meeting.enableScreenShare();
                this._screenShareOn = true;
                window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                    detail: { type: 'screen', state: this._screenShareOn }
                }));
            } catch (error) {
                console.error('Failed to restore screen share:', error);
            }
        } else if (!storedState.screenShareOn && this._screenShareOn) {
            try {
                await this.meeting.disableScreenShare();
                this._screenShareOn = false;
                window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                    detail: { type: 'screen', state: this._screenShareOn }
                }));
            } catch (error) {
                console.error('Failed to disable screen share:', error);
            }
        }
    }
    
    handleParticipantJoined(participant) {
        if (!participant || this.participants.has(participant.id)) return;
        
        let avatarUrl = '/public/assets/common/default-profile-picture.png';
        try {
            if (participant.metaData) {
                const meta = typeof participant.metaData === 'string' ? JSON.parse(participant.metaData) : participant.metaData;
                if (meta && meta.avatar_url) {
                    avatarUrl = meta.avatar_url;
                }
            }
        } catch (e) {
            console.warn('[VoiceManager] Failed to parse participant metaData:', e);
        }
        

        let userIdField = participant.id;
        try {
            if (participant.metaData) {
                const meta = typeof participant.metaData === 'string' ? JSON.parse(participant.metaData) : participant.metaData;
                if (meta && meta.user_id) {
                    userIdField = String(meta.user_id);
                }
            }
        } catch (e) {

        }



        const participantKey = participant.id;
        const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
        const isLocalUser = currentUserId && String(userIdField) === currentUserId;
        
        this.participants.set(participantKey, {
            id: participant.id,
            user_id: userIdField,
            name: participant.displayName || participant.name,
            username: participant.displayName || participant.name,
            avatar_url: avatarUrl,
            isBot: false,
            isLocal: participant.id === this.localParticipant?.id,
            isSelf: isLocalUser,
            streams: new Map()
        });
        
        this.setupStreamHandlers(participant);
        
        if (this._deafened && participant.id !== this.localParticipant?.id) {
            setTimeout(() => {
                try {
                    participant.streams.forEach(stream => {
                        if (stream.kind === 'audio') {
                            stream.pause();
                        }
                    });
                } catch (error) {
                    console.warn('Could not pause audio stream for new participant:', participant.id);
                }
            }, 100);
        }
        
        this.checkAndRestoreExistingStreams(participant);
        
        window.dispatchEvent(new CustomEvent('participantJoined', {
            detail: { participant: participantKey, data: this.participants.get(participantKey) }
        }));
        
        if (window.ChannelVoiceParticipants && this.currentChannelId) {
            const instance = window.ChannelVoiceParticipants.getInstance();
            instance.updateSidebarForChannel(this.currentChannelId);
        }
    }
    
    handleParticipantLeft(participant) {
        if (!participant) return;
        

        const participantKey = participant.id;
        
        if (this.participants.has(participantKey)) {
            this.participants.delete(participantKey);
            
            window.dispatchEvent(new CustomEvent('participantLeft', {
                detail: { participant: participantKey }
            }));
        }
        
        if (window.ChannelVoiceParticipants && this.currentChannelId) {
            const instance = window.ChannelVoiceParticipants.getInstance();
            instance.updateSidebarForChannel(this.currentChannelId);
        }
    }
    
    setupStreamHandlers(participant) {
        if (!participant) return;
        
        participant.on('stream-enabled', (stream) => {
            const participantData = this.participants.get(participant.id);
            if (participantData) {
                participantData.streams.set(stream.kind, stream);
            }
            
            if (this._deafened && participant.id !== this.localParticipant?.id && stream.kind === 'audio') {
                try {
                    stream.pause();
                } catch (error) {
                    console.warn('Could not pause audio stream for participant:', participant.id);
                }
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
    
    checkAndRestoreExistingStreams(participant) {
        if (!participant) return;
        
        
        console.log(`🔍 [VOICE-MANAGER] Participant object:`, {
            id: participant.id,
            webcamOn: participant.webcamOn,
            screenShareOn: participant.screenShareOn,
            micOn: participant.micOn,
            hasWebcamStream: !!participant.webcamStream,
            hasScreenShareStream: !!participant.screenShareStream,
            hasMicStream: !!participant.micStream,
            hasVideoStream: !!participant.videoStream,
            hasStreamsObject: !!participant.streams
        });
        
        setTimeout(() => {
            if (participant.webcamOn && participant.webcamStream) {
                
                const participantData = this.participants.get(participant.id);
                if (participantData) {
                    participantData.streams.set('video', participant.webcamStream);
                }
                
                window.dispatchEvent(new CustomEvent('streamEnabled', {
                    detail: { 
                        participantId: participant.id,
                        kind: 'video',
                        stream: participant.webcamStream
                    }
                }));
            }
            
            if (participant.screenShareOn && participant.screenShareStream) {
                
                const participantData = this.participants.get(participant.id);
                if (participantData) {
                    participantData.streams.set('share', participant.screenShareStream);
                }
                
                window.dispatchEvent(new CustomEvent('streamEnabled', {
                    detail: { 
                        participantId: participant.id,
                        kind: 'share',
                        stream: participant.screenShareStream
                    }
                }));
            }
            
            if (participant.micOn && participant.micStream) {
                
                const participantData = this.participants.get(participant.id);
                if (participantData) {
                    participantData.streams.set('audio', participant.micStream);
                }
            }
            
            if (participant.videoStream) {
                const participantData = this.participants.get(participant.id);
                if (participantData) {
                    participantData.streams.set('video', participant.videoStream);
                }
                
                window.dispatchEvent(new CustomEvent('streamEnabled', {
                    detail: { 
                        participantId: participant.id,
                        kind: 'video',
                        stream: participant.videoStream
                    }
                }));
            }
            
            if (participant.streams) {
                
                
                if (participant.streams.video) {
                    
                    const participantData = this.participants.get(participant.id);
                    if (participantData) {
                        participantData.streams.set('video', participant.streams.video);
                    }
                    
                    window.dispatchEvent(new CustomEvent('streamEnabled', {
                        detail: { 
                            participantId: participant.id,
                            kind: 'video',
                            stream: participant.streams.video
                        }
                    }));
                }
                
                if (participant.streams.share) {
                    
                    const participantData = this.participants.get(participant.id);
                    if (participantData) {
                        participantData.streams.set('share', participant.streams.share);
                    }
                    
                    window.dispatchEvent(new CustomEvent('streamEnabled', {
                        detail: { 
                            participantId: participant.id,
                            kind: 'share',
                            stream: participant.streams.share
                        }
                    }));
                }
            }
        }, 200);
    }
    
    checkAllParticipantsForExistingStreams() {
        if (!this.meeting || !this.meeting.participants) return;
        
        
        
        this.meeting.participants.forEach((participant) => {
            if (participant && this.participants.has(participant.id)) {
                this.checkAndRestoreExistingStreams(participant);
            }
        });
        
        if (this.meeting.localParticipant && this.participants.has(this.meeting.localParticipant.id)) {
            this.checkAndRestoreExistingStreams(this.meeting.localParticipant);
        }
    }
    
    toggleMic() {
        if (!this.meeting || !this.localParticipant) return this._micOn;
        
        try {
            if (this._micOn) {
                this.localParticipant.disableMic();
                this._micOn = false;
            } else {
                this.localParticipant.enableMic();
                this._micOn = true;
            }
            
            this.updateUnifiedVoiceState({
                isMuted: !this._micOn
            });
            
            window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                detail: { type: 'mic', state: this._micOn }
            }));
            
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
            if (currentUserId && this.currentChannelId) {
                window.dispatchEvent(new CustomEvent('localVoiceStateChanged', {
                    detail: {
                        userId: currentUserId,
                        channelId: this.currentChannelId,
                        type: 'mic',
                        state: this._micOn
                    }
                }));
            }
            
            return this._micOn;
        } catch (error) {
            console.error('Failed to toggle mic:', error);
            return this._micOn;
        }
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
            
            this.updateUnifiedVoiceState({
                videoOn: this._videoOn
            });
            
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
        if (!this.meeting || !this.localParticipant) return this._deafened;
        
        try {
            this._deafened = !this._deafened;
            
            if (this._deafened) {
                if (this._micOn) {
                    this.localParticipant.disableMic();
                    this._micOn = false;
                }
                
                this.meeting.participants.forEach(participant => {
                    if (participant.id !== this.localParticipant.id) {
                        participant.streams.forEach(stream => {
                            if (stream.kind === 'audio') {
                                stream.pause();
                            }
                        });
                    }
                });
            } else {
                this.meeting.participants.forEach(participant => {
                    if (participant.id !== this.localParticipant.id) {
                        participant.streams.forEach(stream => {
                            if (stream.kind === 'audio') {
                                stream.resume();
                            }
                        });
                    }
                });
            }
            
            this.updateUnifiedVoiceState({
                isDeafened: this._deafened,
                isMuted: !this._micOn
            });
            
            window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                detail: { type: 'deafen', state: this._deafened }
            }));
            
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
            if (currentUserId && this.currentChannelId) {
                window.dispatchEvent(new CustomEvent('localVoiceStateChanged', {
                    detail: {
                        userId: currentUserId,
                        channelId: this.currentChannelId,
                        type: 'deafen',
                        state: this._deafened
                    }
                }));
                
                if (this._deafened && !this._micOn) {
                    window.dispatchEvent(new CustomEvent('localVoiceStateChanged', {
                        detail: {
                            userId: currentUserId,
                            channelId: this.currentChannelId,
                            type: 'mic',
                            state: this._micOn
                        }
                    }));
                }
            }
            
            return this._deafened;
        } catch (error) {
            console.error('Failed to toggle deafen:', error);
            return this._deafened;
        }
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
            
            this.updateUnifiedVoiceState({
                screenShareOn: this._screenShareOn
            });
            
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

        const domMeetingId = document.querySelector(`[data-channel-id="${channelId}"]`)?.getAttribute('data-meeting-id');
        if (domMeetingId) {
            
            return domMeetingId;
        }


        const existing = await this.checkExistingMeeting(channelId);
        if (existing?.meeting_id) {
            console.log(`🔄 [VOICE-MANAGER] Found existing meeting on server:`, {
                channelId,
                meetingId: existing.meeting_id
            });
            return existing.meeting_id;
        }
        

        const voiceState = window.localStorageManager?.getUnifiedVoiceState();
        if (voiceState && voiceState.channelId === channelId && voiceState.meetingId) {

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
        

        const customMeetingId = `voice_channel_${channelId}`;
        
        if (!this.authToken) {
            console.error('[VoiceManager] Cannot create meeting: Auth token not available');
            return null;
        }
        
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
    
    broadcastVoiceState(type, state) {
        if (!window.globalSocketManager?.io || !this.currentChannelId) return;
        
        const stateData = {
            channel_id: this.currentChannelId,
            type: type,
            state: state
        };
        
        console.log(`📡 [VOICE-MANAGER] Broadcasting voice state:`, stateData);
        
        window.globalSocketManager.io.emit('voice-state-change', stateData);
    }

    validateCurrentState() {
        if (!window.localStorageManager || !window.globalSocketManager?.io) return;
        
        const voiceState = window.localStorageManager.getUnifiedVoiceState();
        if (voiceState.isConnected && voiceState.channelId) {
            if (window.globalSocketManager.isReady()) {
                window.globalSocketManager.joinRoom('channel', voiceState.channelId);
            }
            
            window.globalSocketManager.io.emit('check-voice-meeting', { 
                channel_id: voiceState.channelId 
            });
        }
        
        document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
            const channelId = channel.getAttribute('data-channel-id');
            if (channelId && window.globalSocketManager?.isReady()) {
                window.globalSocketManager.joinRoom('channel', channelId);
                window.globalSocketManager.io.emit('check-voice-meeting', { 
                    channel_id: channelId 
                });
            }
        });
    }

    updateUnifiedVoiceState(state) {
        if (window.localStorageManager) {
            if (this.currentChannelId && state.channelId && 
                this.currentChannelId !== state.channelId) {
                console.warn(`⚠️ [VOICE-MANAGER] Channel ID mismatch while updating unified state:
                    Manager: ${this.currentChannelId}, Update: ${state.channelId}
                    Using manager's value for consistency.`);
                state.channelId = this.currentChannelId;
                state.channelName = this.currentChannelName;
            }
            
            if (this.currentMeetingId && state.meetingId && 
                this.currentMeetingId !== state.meetingId) {
                console.warn(`⚠️ [VOICE-MANAGER] Meeting ID mismatch while updating unified state:
                    Manager: ${this.currentMeetingId}, Update: ${state.meetingId}
                    Using manager's value for consistency.`);
                state.meetingId = this.currentMeetingId;
            }
            
            const stateWithVideoStates = {
                ...state,
                videoOn: this._videoOn,
                screenShareOn: this._screenShareOn
            };
            
            window.localStorageManager.setUnifiedVoiceState(stateWithVideoStates);
        }
    }
}

if (!window.voiceManager) {
    window.voiceManager = new VoiceManager();
}

if (!window.videoSDKManager) {
    window.videoSDKManager = window.voiceManager;
}

