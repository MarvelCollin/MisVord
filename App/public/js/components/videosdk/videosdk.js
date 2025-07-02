class VideoSDKManager {
    constructor() {
        this.authToken = null;
        this.apiKey = "8ad2dbcd-638d-4fbb-999c-9a48a83caa15";
        this.meeting = null;
        this.initialized = false;
        this.eventHandlers = {};
        this.isDeafened = false;
        this.isConnected = false;
        this.isMeetingJoined = false;
        this.sdkVersion = "0.2.7";
        this.tokenCache = null;
        this.tokenExpiry = 0;
        
        this.fallbackToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhcGlrZXkiOiI4YWQyZGJjZC02MzhkLTRmYmItOTk5Yy05YTQ4YTgzY2FhMTUiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIiwiYWxsb3dfcHVibGlzaCJdLCJpYXQiOjE3NTEyMTU2MjEsImV4cCI6MTc1MzgwNzYyMX0.duF2XwBk9-glZTDWS8QyX4yGNaf6faZXUCLsc07QxJk";
        this._webcamToggling = false;
        this._micState = false;
        this._webcamState = false;
        this._screenShareState = false;
        this.processedParticipants = new Set();
    }

    async getAuthToken() {
        console.log('🔑 Using fresh VideoSDK token...');
        return this.fallbackToken;
    }

    async init(authToken = null) {
        if (!authToken) {
            authToken = await this.getAuthToken();
        }
        
        if (typeof VideoSDK === 'undefined') {
            throw new Error("VideoSDK not loaded");
        }
        
        this.authToken = authToken;
        VideoSDK.config(authToken);
        this.initialized = true;
        
        console.log("✅ VideoSDK initialized with fresh token");
        return this;
    }
    
    getMetaConfig() {
        return {
            authToken: document.querySelector('meta[name="videosdk-token"]')?.content,
            meetingId: document.querySelector('meta[name="meeting-id"]')?.content,
            participantName: document.querySelector('meta[name="username"]')?.content,
            channelId: document.querySelector('meta[name="channel-id"]')?.content
        };
    }
    
    async createMeetingRoom(customId = null) {
        try {
            console.log("Creating meeting room" + (customId ? `: ${customId}` : ""));
            
            if (!this.authToken) {
                this.authToken = await this.getAuthToken();
            }
            
            const options = customId ? { customRoomId: customId } : {};
            
            const response = await fetch('https://api.videosdk.live/v2/rooms', {
                method: 'POST',
                headers: {
                    'Authorization': this.authToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(options)
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Meeting room created: ${data.roomId}`);
                return data.roomId;
            } else {
                console.error(`❌ Failed to create meeting room: ${response.status}`);
                const errorText = await response.text();
                console.error('Error details:', errorText);
                return null;
            }
        } catch (error) {
            console.error("❌ Error creating meeting room:", error);
            return null;
        }
    }

    initMeeting(options) {
        if (!this.initialized) {
            throw new Error("VideoSDK not initialized");
        }
        
        if (!options.meetingId) {
            throw new Error("Meeting ID is required");
        }
        
        const config = {
            meetingId: options.meetingId,
            name: options.name || 'Anonymous',
            micEnabled: options.micEnabled !== false,
            webcamEnabled: options.webcamEnabled || false
        };
        
        try {
            console.log(`Initializing meeting with ID: ${config.meetingId}`);
            
            if (this.meeting) {
                console.log("Meeting already initialized, cleaning up old instance");
                this.cleanupParticipantResources();
                this.meeting = null;
            }
            
            try {
                this.meeting = VideoSDK.initMeeting(config);
            } catch (sdkError) {
                console.error("VideoSDK error during initialization:", sdkError);
                throw new Error(`Failed to initialize meeting: ${sdkError.message || sdkError}`);
            }
            
            if (!this.meeting) {
                throw new Error("VideoSDK returned null meeting");
            }
            
            if (this.meeting.onn !== undefined) {
                console.warn("Cleaning up 'onn' property on meeting");
                delete this.meeting.onn;
            }
            
            if (this.meeting.localParticipant && this.meeting.localParticipant.onn !== undefined) {
                console.warn("Cleaning up 'onn' property on participant");
                delete this.meeting.localParticipant.onn;
            }
            
            this._micState = config.micEnabled;
            this._webcamState = config.webcamEnabled;
            this._screenShareState = false;
            
            this.setupEvents();
            
            return this.meeting;
        } catch (error) {
            console.error("Failed to initialize meeting:", error);
            this.meeting = null;
            throw error;
        }
    }
    
    setupEvents() {
        if (!this.meeting) return;
        
        const standardEvents = [
            'meeting-joined',
            'meeting-left',
            'participant-joined',
            'participant-left',
            'error'
        ];
        
        for (const eventName of standardEvents) {
            this.meeting.on(eventName, (...args) => {
                if (eventName === 'error') {
                    console.error("Meeting error:", args[0]);
                } else if (eventName === 'meeting-joined') {
                    console.log(`Event: ${eventName}`);
                    this.isMeetingJoined = true;
                    setTimeout(() => {
                        if (this.meeting?.localParticipant) {
                            console.log(`👤 [VideoSDK] Emitting local participant joined: ${this.meeting.localParticipant.id}`);
                            window.dispatchEvent(new CustomEvent('videosdkParticipantJoined', {
                                detail: { 
                                    participant: this.meeting.localParticipant.id, 
                                    participantObj: this.meeting.localParticipant 
                                }
                            }));
                        }
                        window.dispatchEvent(new CustomEvent('videosdkMeetingFullyJoined'));
                    }, 100);
                } else if (eventName === 'meeting-left') {
                    console.log(`Event: ${eventName}`);
                    this.isMeetingJoined = false;
                } else if (eventName === 'participant-joined') {
                    console.log(`🎉 [VideoSDK] Participant joined:`, args[0]);
                    const participant = args[0];
                    if (participant && participant.id) {
                        this.handleParticipantJoined(participant);
                    }
                } else if (eventName === 'participant-left') {
                    console.log(`👋 [VideoSDK] Participant left:`, args[0]);
                    const participant = args[0];
                    if (participant && participant.id) {
                        this.handleParticipantLeft(participant);
                    }
                } else {
                    console.log(`Event: ${eventName}`);
                }
                
                if (this.eventHandlers[eventName]) {
                    this.eventHandlers[eventName].forEach(handler => {
                        try {
                            handler(...args);
                        } catch (err) {
                            console.error(`Error in ${eventName} handler:`, err);
                        }
                    });
                }
            });
        }
        
        this.setupSimpleStreamHandlers();
        this.setupExistingParticipants();
    }
    
    handleParticipantJoined(participant) {
        console.log(`👤 [VideoSDK] Participant joined: ${participant.id} (${participant.displayName || participant.name || 'Unknown'})`);
        
        if (this.processedParticipants.has(participant.id)) {
            console.log(`👤 [VideoSDK] Participant ${participant.id} already processed, skipping`);
            return;
        }
        
        const existingParticipantName = participant.displayName || participant.name;
        if (existingParticipantName) {
            for (const [processedId] of this.processedParticipants.entries()) {
                const processedParticipant = this.meeting?.participants?.get(processedId);
                if (processedParticipant && 
                    (processedParticipant.displayName === existingParticipantName || 
                     processedParticipant.name === existingParticipantName)) {
                    console.log(`⚠️ [VideoSDK] Found duplicate participant name '${existingParticipantName}' - replacing old ID: ${processedId} with new ID: ${participant.id}`);
                    
                    if (processedId !== participant.id) {
                        this.processedParticipants.delete(processedId);
                        this.cleanupParticipantResourcesById(processedId);
                        
                        window.dispatchEvent(new CustomEvent('videosdkParticipantLeft', {
                            detail: { participant: processedId }
                        }));
                    }
                    break;
                }
            }
        }
        
        this.processedParticipants.add(participant.id);
        this.registerStreamEvents(participant);
        this.startStreamMonitoring(participant);
        
        console.log(`✅ [VideoSDK] Dispatching participant joined event for: ${participant.id}`);
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('videosdkParticipantJoined', {
                detail: { participant: participant.id, participantObj: participant }
            }));
        }, 200);
    }
    
    handleParticipantLeft(participant) {
        console.log(`👋 [VideoSDK] Participant left: ${participant.id}`);
        
        this.processedParticipants.delete(participant.id);
        this.cleanupParticipantResourcesById(participant.id);
        
        console.log(`✅ [VideoSDK] Dispatching participant left event for: ${participant.id}`);
        window.dispatchEvent(new CustomEvent('videosdkParticipantLeft', {
            detail: { participant: participant.id }
        }));
    }
    
    setupExistingParticipants() {
        if (!this.meeting || !this.meeting.participants) return;
        
        console.log(`👥 [VideoSDK] Setting up existing participants - Total: ${this.meeting.participants.size}, Local: ${this.meeting.localParticipant?.id}`);
        
        try {
            setTimeout(() => {
                this.meeting.participants.forEach((participant, participantId) => {
                    console.log(`👤 [VideoSDK] Processing participant: ${participant.id} (${participant.displayName || participant.name || 'Unknown'})`);
                    
                    if (this.processedParticipants.has(participant.id)) {
                        console.log(`👤 [VideoSDK] Participant ${participant.id} already processed, skipping`);
                        return;
                    }
                    
                    this.processedParticipants.add(participant.id);
                    this.registerStreamEvents(participant);
                    this.startStreamMonitoring(participant);
                    
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('videosdkParticipantJoined', {
                            detail: { participant: participant.id, participantObj: participant }
                        }));
                    }, 300);
                });
            }, 1000);
        } catch (error) {
            console.error('Error setting up existing participants:', error);
        }
    }
    
    cleanupParticipantResourcesById(participantId) {
        try {
            if (this.meeting?.participants) {
                const participant = this.meeting.participants.get(participantId);
                if (participant) {
                    if (participant._streamMonitorInterval) {
                        clearInterval(participant._streamMonitorInterval);
                        participant._streamMonitorInterval = null;
                    }
                    
                    participant._streamMonitoringActive = false;
                    
                    if (participant._previousStreams) {
                        participant._previousStreams.clear();
                        participant._previousStreams = null;
                    }
                    
                    console.log(`🧹 [VideoSDK] Cleaned up resources for participant: ${participantId}`);
                }
            }
        } catch (error) {
            console.error(`Error cleaning up participant ${participantId}:`, error);
        }
    }
    
    setupSimpleStreamHandlers() {
        if (!this.meeting?.localParticipant) return;
        
        try {
            const participant = this.meeting.localParticipant;
            this.registerStreamEvents(participant);
            this.startStreamMonitoring(participant);
        } catch (error) {
            console.error("Error setting up stream handlers:", error);
        }
    }
    
    registerStreamEvents(participant) {
        if (!participant || !participant.on) return;
        
        try {
            participant.on('stream-enabled', (data) => {
                if (!data) {
                    console.warn('[VideoSDK] Stream enabled event with no data');
                    return;
                }
                
                let kind = data.kind || 'unknown';
                let stream = null;
                
                if (data.stream) {
                    stream = data.stream;
                } else if (data.track) {
                    stream = new MediaStream([data.track]);
                    if (kind === 'unknown') {
                        kind = data.track.kind === 'video' ? 'video' : 'audio';
                    }
                } else if (data.id && participant.streams && participant.streams.get(data.id)) {
                    stream = participant.streams.get(data.id);
                } else {
                    console.debug('[VideoSDK] Stream enabled event - trying to find stream from participant streams');
                    if (participant.streams && participant.streams.size > 0) {
                        const latestStream = Array.from(participant.streams.values()).pop();
                        if (latestStream) {
                            stream = latestStream;
                            console.debug('[VideoSDK] Using latest available stream');
                        }
                    }
                }
                
                if (!stream && data.track) {
                    console.log('[VideoSDK] Creating MediaStream from track for', data.track.kind);
                    stream = new MediaStream([data.track]);
                    kind = data.track.kind === 'video' ? 'video' : 'audio';
                }
                
                if (kind === 'unknown' && stream) {
                    kind = this.detectStreamKind(stream, data);
                }
                
                if (kind === 'video') {
                    const isScreenShare = this.isScreenShareStream(stream, data);
                    if (isScreenShare) {
                        kind = 'share';
                    }
                }
                
                if (participant.id === this.meeting.localParticipant?.id) {
                    if (kind === 'video') {
                        this._webcamState = true;
                    } else if (kind === 'share') {
                        this._screenShareState = true;
                    } else if (kind === 'audio') {
                        this._micState = true;
                    }
                }
                
                console.log(`✅ [VideoSDK] Stream enabled: ${kind} for participant ${participant.id}`, {
                    hasStream: !!stream,
                    streamType: typeof stream,
                    isMediaStream: stream instanceof MediaStream,
                    trackCount: stream instanceof MediaStream ? stream.getTracks().length : 'N/A',
                    isLocal: participant.id === this.meeting.localParticipant?.id
                });
                
                window.dispatchEvent(new CustomEvent('videosdkStreamEnabled', { 
                    detail: { kind, stream, participant: participant.id, data } 
                }));
            });

            participant.on('stream-disabled', (data) => {
                if (!data) return;
                
                const kind = data.kind || 'unknown';
                console.log(`🔇 [VideoSDK] Stream disabled: ${kind} for participant ${participant.id}`);
                
                if (participant.id === this.meeting.localParticipant?.id) {
                    if (kind === 'video') {
                        this._webcamState = false;
                    } else if (kind === 'share') {
                        this._screenShareState = false;
                    } else if (kind === 'audio') {
                        this._micState = false;
                    }
                }
                
                window.dispatchEvent(new CustomEvent('videosdkStreamDisabled', { 
                    detail: { kind, participant: participant.id } 
                }));
            });
        } catch (error) {
            console.error("Error registering stream events:", error);
        }
    }
    
    detectStreamKind(stream, data) {
        if (stream instanceof MediaStream) {
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length > 0) {
                const track = videoTracks[0];
                return track.label?.toLowerCase().includes('screen') ? 'share' : 'video';
            } else {
                return 'audio';
            }
        } else if (stream.stream instanceof MediaStream) {
            const videoTracks = stream.stream.getVideoTracks();
            if (videoTracks.length > 0) {
                const track = videoTracks[0];
                return track.label?.toLowerCase().includes('screen') ? 'share' : 'video';
            } else {
                return 'audio';
            }
        } else if (stream.track?.kind === 'video') {
            return stream.track.label?.toLowerCase().includes('screen') ? 'share' : 'video';
        } else if (stream.track?.kind === 'audio') {
            return 'audio';
        }
        return 'unknown';
    }

    isScreenShareStream(stream, data) {
        const checkMethods = [
            () => data.track?.label?.toLowerCase().includes('screen'),
            () => data.track?.label?.toLowerCase().includes('share'),
            () => stream instanceof MediaStream && stream.getVideoTracks()[0]?.label?.toLowerCase().includes('screen'),
            () => stream instanceof MediaStream && stream.getVideoTracks()[0]?.label?.toLowerCase().includes('share'),
            () => stream.stream instanceof MediaStream && stream.stream.getVideoTracks()[0]?.label?.toLowerCase().includes('screen'),
            () => stream.track?.label?.toLowerCase().includes('screen'),
            () => data.kind === 'share'
        ];

        return checkMethods.some(check => {
            try { return check(); } catch { return false; }
        });
    }
    
    startStreamMonitoring(participant) {
        if (!participant || participant._streamMonitoringActive) return;
        
        participant._previousStreams = new Map();
        
        const interval = setInterval(() => {
            if (!participant || !participant.streams) {
                clearInterval(interval);
                return;
            }
            
            try {
                participant.streams.forEach((stream, streamId) => {
                    if (!participant._previousStreams.has(streamId)) {
                        let kind = 'unknown';
                        
                        if (streamId.includes('video') || streamId.includes('cam') || streamId.includes('webcam')) {
                            kind = 'video';
                        } else if (streamId.includes('audio') || streamId.includes('mic')) {
                            kind = 'audio';
                        } else if (streamId.includes('share') || streamId.includes('screen')) {
                            kind = 'share';
                        } else if (stream && stream.stream instanceof MediaStream) {
                            const videoTracks = stream.stream.getVideoTracks();
                            if (videoTracks.length > 0) {
                                const track = videoTracks[0];
                                kind = track.label?.toLowerCase().includes('screen') ? 'share' : 'video';
                            } else {
                                kind = 'audio';
                            }
                        } else if (stream && stream.track) {
                            const track = stream.track;
                            if (track.kind === 'video') {
                                kind = track.label?.toLowerCase().includes('screen') ? 'share' : 'video';
                            } else {
                                kind = 'audio';
                            }
                        }
                        
                        participant._previousStreams.set(streamId, kind);
                    }
                });
                
                participant._previousStreams.forEach((kind, streamId) => {
                    if (!participant.streams.has(streamId)) {
                        if (kind === 'video' || kind === 'share') {
                            window.dispatchEvent(new CustomEvent('videosdkStreamDisabled', {
                                detail: { 
                                    kind,
                                    participant: participant.id
                                }
                            }));
                        }
                        
                        participant._previousStreams.delete(streamId);
                    }
                });
            } catch (err) {
                console.warn("Error in stream monitor:", err);
            }
        }, 1000);
        
        participant._streamMonitorInterval = interval;
        participant._streamMonitoringActive = true;
    }

    async joinMeeting() {
        if (!this.meeting) {
            throw new Error("No meeting initialized");
        }
        
        try {
            console.log(`Joining meeting: ${this.meeting.id}`);
            
            window.videoSDKJoiningInProgress = true;
            
            window.videosdkMeeting = this.meeting;
            
            await this.meeting.join();
            
            this.isConnected = true;
            this.isDeafened = false;
            if (window.voiceState) window.voiceState.isConnected = true;
            if (window.voiceManager) window.voiceManager.isConnected = true;
            
            await this.waitForMeetingJoined();
            
            const channelId = document.querySelector('meta[name="channel-id"]')?.content;
            const channelName = document.querySelector('.voice-section .channel-name, .voice-channel-title, #channel-name')?.textContent || 'Voice Channel';
            
            window.dispatchEvent(new CustomEvent('voiceConnect', {
                detail: { 
                    meetingId: this.meeting.id,
                    channelName: channelName,
                    channelId: channelId 
                }
            }));
            
            if (window.globalSocketManager?.isReady() && channelId && this.meeting.id) {
                console.log('📝 [VideoSDK] Voice meeting socket registration handled by voice-manager.js');
            }
            
            window.videoSDKJoiningInProgress = false;
            return true;
        } catch (error) {
            console.error("Failed to join meeting:", error);
            
            this.isConnected = false;
            this.isMeetingJoined = false;
            this.isDeafened = false;
            if (window.voiceState) window.voiceState.isConnected = false;
            if (window.voiceManager) window.voiceManager.isConnected = false;
            
            window.videoSDKJoiningInProgress = false;
            window.dispatchEvent(new CustomEvent('voiceDisconnect'));
            throw error;
        }
    }

    async waitForMeetingJoined(timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (this.isMeetingJoined) {
                resolve();
                return;
            }
            
            const timeoutId = setTimeout(() => {
                reject(new Error('Timeout waiting for meeting to be fully joined'));
            }, timeout);
            
            const onMeetingJoined = () => {
                clearTimeout(timeoutId);
                window.removeEventListener('videosdkMeetingFullyJoined', onMeetingJoined);
                resolve();
            };
            
            window.addEventListener('videosdkMeetingFullyJoined', onMeetingJoined);
        });
    }

    leaveMeeting() {
        if (this.meeting) {
            try {
                this.cleanupParticipantResources();
                
                this.isDeafened = false;
                this.isConnected = false;
                this.isMeetingJoined = false;
                this._micState = false;
                this._webcamState = false;
                this._screenShareState = false;
                this.processedParticipants.clear();
                
                this.meeting.leave();
                this.meeting = null;
                
                window.dispatchEvent(new CustomEvent('voiceDisconnect'));
                
                console.log('[VideoSDKManager] Successfully left meeting and reset states');
                return true;
            } catch (error) {
                console.error("Error leaving meeting:", error);
                return false;
            }
        }
        return false;
    }
    
    cleanupParticipantResources() {
        try {
            if (this.meeting?.participants) {
                console.log(`🧹 [VideoSDK] Cleaning up resources for ${this.meeting.participants.size} participants`);
                
                this.meeting.participants.forEach((participant, participantId) => {
                    if (participant._streamMonitorInterval) {
                        clearInterval(participant._streamMonitorInterval);
                        participant._streamMonitorInterval = null;
                    }
                    
                    participant._streamMonitoringActive = false;
                    
                    if (participant._previousStreams) {
                        participant._previousStreams.clear();
                        participant._previousStreams = null;
                    }
                    
                    console.log(`🧹 [VideoSDK] Cleaned up participant: ${participantId}`);
                });
            }
            
            if (this.meeting?.localParticipant) {
                const participant = this.meeting.localParticipant;
                
                if (participant._streamMonitorInterval) {
                    clearInterval(participant._streamMonitorInterval);
                    participant._streamMonitorInterval = null;
                }
                
                participant._streamMonitoringActive = false;
                
                if (participant._previousStreams) {
                    participant._previousStreams.clear();
                    participant._previousStreams = null;
                }
                
                console.log(`🧹 [VideoSDK] Cleaned up local participant: ${participant.id}`);
            }
        } catch (error) {
            console.error("Error cleaning up participant resources:", error);
        }
    }
    
    toggleMic() {
        if (!this.meeting) return false;
        
        try {
            const isMicOn = this.getMicState();
            
            if (isMicOn) {
                this.meeting.muteMic();
                this._micState = false;
            } else {
                this.meeting.unmuteMic();
                this._micState = true;
            }
            
            window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                detail: { type: 'mic', state: this._micState }
            }));
            
            return this._micState;
        } catch (error) {
            console.error("Error toggling mic:", error);
            return false;
        }
    }
    
    toggleDeafen() {
        if (!this.meeting) {
            this.isDeafened = !this.isDeafened;
            console.log('[VideoSDKManager] No meeting active, toggling local deafen state to:', this.isDeafened);
            
            window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                detail: { type: 'deafen', state: this.isDeafened }
            }));
            
            return this.isDeafened;
        }
        
        try {
            const wasDeafened = this.getDeafenState();
            
            if (wasDeafened) {
                this.isDeafened = false;
                console.log('[VideoSDKManager] Undeafened - audio reception restored');
            } else {
                this.meeting.muteMic();
                this._micState = false;
                this.isDeafened = true;
                console.log('[VideoSDKManager] Deafened - microphone muted and audio reception disabled');
            }
            
            if (window.voiceStateManager) {
                setTimeout(() => {
                    window.voiceStateManager.syncWithVideoSDK();
                }, 100);
            }
            
            window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                detail: { type: 'deafen', state: this.isDeafened }
            }));
            
            console.log('[VideoSDKManager] Deafen toggled to:', this.isDeafened);
            return this.isDeafened;
        } catch (error) {
            console.error("Error toggling deafen:", error);
            this.isDeafened = !this.getDeafenState();
            
            window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                detail: { type: 'deafen', state: this.isDeafened }
            }));
            
            return this.isDeafened;
        }
    }
    
    getDeafenState() {
        if (this.isDeafened !== undefined) {
            return this.isDeafened;
        }
        
        if (!this.meeting?.localParticipant) return false;
        
        try {
            const participant = this.meeting.localParticipant;
            
            return this.isDeafened || false;
        } catch (error) {
            console.error("Error getting deafen state:", error);
            return false;
        }
    }
    
    async checkCameraPermission() {
        try {
            console.log('[VideoSDK] Checking camera permission...');
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            console.log('[VideoSDK] Camera permission granted, got stream with', stream.getTracks().length, 'tracks');
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('[VideoSDK] Camera permission check failed:', error);
            if (error.name === 'NotAllowedError') {
                window.showToast?.('Camera permission denied. Please allow camera access in your browser settings.', 'error');
            } else if (error.name === 'NotFoundError') {
                window.showToast?.('No camera device found. Please connect a camera and try again.', 'error');
            } else if (error.name === 'NotReadableError') {
                window.showToast?.('Camera is being used by another application. Please close other apps and try again.', 'error');
            } else {
                window.showToast?.('Camera access error: ' + error.message, 'error');
            }
            return false;
        }
    }

    async toggleWebcam() {
        if (this._webcamToggling) {
            console.log('[VideoSDK] Webcam toggle already in progress, skipping');
            return this.getWebcamState();
        }
        
        this._webcamToggling = true;
        
        try {
            console.log('[VideoSDK] toggleWebcam called');
            
            if (!this.meeting || !this.isConnected || !this.isMeetingJoined || !this.meeting.localParticipant) {
                console.error('[VideoSDK] Meeting not ready for webcam toggle');
                window.showToast?.('Voice not fully connected. Please wait a moment and try again.', 'error');
                return false;
            }
            
            const isWebcamOn = this.getWebcamState();
            console.log('[VideoSDK] Current webcam state:', isWebcamOn);
            
            if (isWebcamOn) {
                console.log('[VideoSDK] Disabling webcam...');
                await this.meeting.disableWebcam();
                this._webcamState = false;
                console.log('[VideoSDK] Webcam disabled successfully');
                
                window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                    detail: { type: 'video', state: false }
                }));
                
                return false;
            } else {
                console.log('[VideoSDK] Enabling webcam...');
                const hasPermission = await this.checkCameraPermission();
                if (!hasPermission) {
                    console.error('[VideoSDK] Camera permission denied');
                    return false;
                }
                
                console.log('[VideoSDK] Camera permission OK, calling meeting.enableWebcam()...');
                await this.meeting.enableWebcam();
                this._webcamState = true;
                console.log('[VideoSDK] Webcam enabled successfully');
                
                window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                    detail: { type: 'video', state: true }
                }));
                
                return true;
            }
        } catch (error) {
            console.error("[VideoSDK] Error toggling webcam:", error);
            
            if (error.code === 3014 || error.name === 'NotAllowedError') {
                window.showToast?.('Camera permission denied. Please allow camera access.', 'error');
            } else if (error.code === 3021 || error.name === 'NotFoundError') {
                window.showToast?.('No camera found. Please connect a camera.', 'error');
            } else if (error.code === 3023 || error.name === 'NotReadableError') {
                window.showToast?.('Camera is in use by another application.', 'error');
            } else if (error.code === 3033) {
                window.showToast?.('Camera access unavailable.', 'error');
            } else if (error.code === 3035) {
                window.showToast?.('Please wait for voice connection to complete before using camera.', 'error');
            } else {
                window.showToast?.('Failed to toggle camera: ' + error.message, 'error');
            }
            return false;
        } finally {
            setTimeout(() => {
                this._webcamToggling = false;
            }, 500);
        }
    }
    
    async toggleScreenShare() {
        if (!this.meeting || !this.isConnected || !this.isMeetingJoined) {
            console.error('Meeting not ready for screen share');
            return false;
        }

        if (!this.meeting.localParticipant) {
            console.error('Local participant not available');
            return false;
        }
        
        try {
            const isScreenSharing = this.getScreenShareState();
            
            if (isScreenSharing) {
                await this.meeting.disableScreenShare();
                this._screenShareState = false;
                console.log('[VideoSDK] Screen sharing disabled');
                
                window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                    detail: { type: 'screenShare', state: false }
                }));
                
                return false;
            } else {
                await this.meeting.enableScreenShare();
                this._screenShareState = true;
                console.log('[VideoSDK] Screen sharing enabled');
                
                window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                    detail: { type: 'screenShare', state: true }
                }));
                
                return true;
            }
        } catch (error) {
            console.error("Error toggling screen share:", error);
            if (error.code === 3016) {
                console.warn('Screen sharing permission denied by user');
            } else if (error.code === 3035) {
                window.showToast?.('Please wait for voice connection to complete before screen sharing.', 'error');
            }
            return false;
        }
    }
    
    getWebcamState() {
        if (this._webcamState !== undefined) {
            return this._webcamState;
        }
        
        if (!this.meeting?.localParticipant) return false;
        
        try {
            return this.meeting.localParticipant.isWebcamEnabled || 
                  (this.meeting.localParticipant.streams && 
                   this.meeting.localParticipant.streams.has && 
                   this.meeting.localParticipant.streams.has("video"));
        } catch (error) {
            console.error("Error getting webcam state:", error);
            return false;
        }
    }
    
    getScreenShareState() {
        if (this._screenShareState !== undefined) {
            return this._screenShareState;
        }
        
        if (!this.meeting?.localParticipant) return false;
        
        try {
            return this.meeting.localParticipant.isScreenShareEnabled || 
                  (this.meeting.localParticipant.streams && 
                   this.meeting.localParticipant.streams.has && 
                   this.meeting.localParticipant.streams.has("share"));
        } catch (error) {
            console.error("Error getting screen share state:", error);
            return false;
        }
    }
    
    getMicState() {
        if (this._micState !== undefined) {
            return this._micState;
        }
        
        if (!this.meeting?.localParticipant) return false;
        
        try {
            return this.meeting.localParticipant.isMicEnabled || 
                  (this.meeting.localParticipant.streams && 
                   this.meeting.localParticipant.streams.has && 
                   this.meeting.localParticipant.streams.has("audio"));
        } catch (error) {
            console.error("Error getting mic state:", error);
            return false;
        }
    }
    
    on(eventName, handler) {
        if (!eventName || typeof eventName !== 'string') return;
        
        if (!this.eventHandlers[eventName]) {
            this.eventHandlers[eventName] = [];
        }
        this.eventHandlers[eventName].push(handler);
    }
    
    isReady() {
        return this.initialized && this.meeting && this.isConnected && this.isMeetingJoined;
    }
    
    getConnectionState() {
        return {
            initialized: this.initialized,
            hasAuthToken: !!this.authToken,
            hasMeeting: !!this.meeting,
            isConnected: this.isConnected,
            isMeetingJoined: this.isMeetingJoined,
            isDeafened: this.isDeafened,
            sdkVersion: this.sdkVersion,
            participantConnected: this.meeting?.localParticipant?.connectionStatus === 'connected',
            micState: this.getMicState(),
            webcamState: this.getWebcamState(),
            screenShareState: this.getScreenShareState()
        };
    }
}

if (!window.videoSDKManager) {
    const videoSDKManager = new VideoSDKManager();
    window.videoSDKManager = videoSDKManager;
    console.log('✅ VideoSDKManager instance created and attached to window');
} else {
    console.log('ℹ️ VideoSDKManager already exists, skipping creation');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.videoSDKManager;
} else if (typeof exports !== 'undefined') {
    exports.default = window.videoSDKManager;
}
