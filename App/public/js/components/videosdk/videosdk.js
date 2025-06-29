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
            
            // Additional validation
            if (this.meeting) {
                console.log("Meeting already initialized, cleaning up old instance");
                this.cleanupParticipantResources();
                this.meeting = null;
            }
            
            // Create meeting with error handling
            try {
                this.meeting = VideoSDK.initMeeting(config);
            } catch (sdkError) {
                console.error("VideoSDK error during initialization:", sdkError);
                throw new Error(`Failed to initialize meeting: ${sdkError.message || sdkError}`);
            }
            
            if (!this.meeting) {
                throw new Error("VideoSDK returned null meeting");
            }
            
            // For safety, clean up any accidental "onn" property that might exist on VideoSDK objects
            if (this.meeting.onn !== undefined) {
                console.warn("Cleaning up 'onn' property on meeting");
                delete this.meeting.onn;
            }
            
            if (this.meeting.localParticipant && this.meeting.localParticipant.onn !== undefined) {
                console.warn("Cleaning up 'onn' property on participant");
                delete this.meeting.localParticipant.onn;
            }
            
            // Set up event handling
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
                    window.dispatchEvent(new CustomEvent('videosdkMeetingFullyJoined'));
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
        console.log(`👤 [VideoSDK] Setting up handlers for joined participant: ${participant.id}`);
        
        this.registerStreamEvents(participant);
        this.startStreamMonitoring(participant);
        
        window.dispatchEvent(new CustomEvent('videosdkParticipantJoined', {
            detail: { participant: participant.id, participantObj: participant }
        }));
    }
    
    handleParticipantLeft(participant) {
        console.log(`👋 [VideoSDK] Cleaning up handlers for left participant: ${participant.id}`);
        
        this.cleanupParticipantResourcesById(participant.id);
        
        window.dispatchEvent(new CustomEvent('videosdkParticipantLeft', {
            detail: { participant: participant.id }
        }));
    }
    
    setupExistingParticipants() {
        if (!this.meeting || !this.meeting.participants) return;
        
        console.log(`👥 [VideoSDK] Setting up handlers for existing participants`);
        console.log(`👥 [VideoSDK] Total participants in meeting: ${this.meeting.participants.size}`);
        console.log(`👥 [VideoSDK] Local participant ID: ${this.meeting.localParticipant?.id}`);
        
        try {
            this.meeting.participants.forEach((participant, participantId) => {
                console.log(`👤 [VideoSDK] Processing participant: ${participant.id} (${participant.displayName || participant.name || 'Unknown'})`);
                
                if (participant.id !== this.meeting.localParticipant?.id) {
                    console.log(`👤 [VideoSDK] Setting up existing remote participant: ${participant.id}`);
                    this.registerStreamEvents(participant);
                    this.startStreamMonitoring(participant);
                    
                    // Dispatch event for UI to handle existing participant
                    window.dispatchEvent(new CustomEvent('videosdkParticipantJoined', {
                        detail: { participant: participant.id, participantObj: participant }
                    }));
                } else {
                    console.log(`👤 [VideoSDK] Skipping local participant: ${participant.id}`);
                }
            });
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
                    if (stream instanceof MediaStream) {
                        const videoTracks = stream.getVideoTracks();
                        if (videoTracks.length > 0) {
                            const track = videoTracks[0];
                            kind = track.label?.toLowerCase().includes('screen') ? 'share' : 'video';
                        } else {
                            kind = 'audio';
                        }
                    } else if (stream.stream instanceof MediaStream) {
                        const videoTracks = stream.stream.getVideoTracks();
                        if (videoTracks.length > 0) {
                            const track = videoTracks[0];
                            kind = track.label?.toLowerCase().includes('screen') ? 'share' : 'video';
                        } else {
                            kind = 'audio';
                        }
                    } else if (stream.track?.kind === 'video') {
                        kind = stream.track.label?.toLowerCase().includes('screen') ? 'share' : 'video';
                    } else if (stream.track?.kind === 'audio') {
                        kind = 'audio';
                    }
                }
                
                // After kind heuristic determination, refine screen share detection
                if (kind === 'video') {
                    let label = '';
                    if (data.track && data.track.label) {
                        label = data.track.label.toLowerCase();
                    } else if (stream instanceof MediaStream) {
                        const vt = stream.getVideoTracks()[0];
                        if (vt && vt.label) label = vt.label.toLowerCase();
                    } else if (stream && stream.track && stream.track.label) {
                        label = stream.track.label.toLowerCase();
                    }
                    if (label.includes('screen') || label.includes('share')) {
                        kind = 'share';
                    }
                }
                
                console.log(`✅ [VideoSDK] Stream enabled: ${kind} for participant ${participant.id}`, {
                    hasStream: !!stream,
                    streamType: typeof stream,
                    isMediaStream: stream instanceof MediaStream,
                    trackCount: stream instanceof MediaStream ? stream.getTracks().length : 'N/A'
                });
                
                window.dispatchEvent(new CustomEvent('videosdkStreamEnabled', { 
                    detail: { kind, stream, participant: participant.id, data } 
                }));
            });

            participant.on('stream-disabled', (data) => {
                if (!data) return;
                
                const kind = data.kind || 'unknown';
                console.log(`🔇 [VideoSDK] Stream disabled: ${kind} for participant ${participant.id}`);
                
                window.dispatchEvent(new CustomEvent('videosdkStreamDisabled', { 
                    detail: { kind, participant: participant.id } 
                }));
            });
        } catch (error) {
            console.error("Error registering stream events:", error);
        }
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
            const channelName = document.querySelector('.channel-name')?.textContent || 'Voice Channel';
            
            window.dispatchEvent(new CustomEvent('voiceConnect', {
                detail: { 
                    meetingId: this.meeting.id,
                    channelName: channelName,
                    channelId: channelId 
                }
            }));
            
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
            // Clean up all participants, not just local
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
            
            // Also clean up local participant specifically
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
            } else {
                this.meeting.unmuteMic();
            }
            
            return !isMicOn;
        } catch (error) {
            console.error("Error toggling mic:", error);
            return false;
        }
    }
    
    toggleDeafen() {
        if (!this.meeting) {
            // If no meeting, just toggle the local state
            this.isDeafened = !this.isDeafened;
            console.log('[VideoSDKManager] No meeting active, toggling local deafen state to:', this.isDeafened);
            return this.isDeafened;
        }
        
        try {
            const wasDeafened = this.getDeafenState();
            
            if (wasDeafened) {
                // Undeafen - restore previous mic state (don't auto-unmute mic)
                this.isDeafened = false;
                console.log('[VideoSDKManager] Undeafened - audio reception restored');
            } else {
                // Deafen - mute microphone and disable audio reception
                this.meeting.muteMic();
                this.isDeafened = true;
                console.log('[VideoSDKManager] Deafened - microphone muted and audio reception disabled');
            }
            
            // Notify voice state manager of the change
            if (window.voiceStateManager) {
                setTimeout(() => {
                    window.voiceStateManager.syncWithVideoSDK();
                }, 100);
            }
            
            console.log('[VideoSDKManager] Deafen toggled to:', this.isDeafened);
            return this.isDeafened;
        } catch (error) {
            console.error("Error toggling deafen:", error);
            // Fallback to manual state management
            this.isDeafened = !this.getDeafenState();
            return this.isDeafened;
        }
    }
    
    getDeafenState() {
        // Return stored deafen state if available
        if (this.isDeafened !== undefined) {
            return this.isDeafened;
        }
        
        // Try to determine from meeting state
        if (!this.meeting?.localParticipant) return false;
        
        try {
            // Check if audio is muted (basic deafen detection)
            const participant = this.meeting.localParticipant;
            
            // In VideoSDK, deafen is typically implemented as muting audio output
            // We'll track this manually since VideoSDK doesn't have a direct deafen API
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
                console.log('[VideoSDK] Webcam disabled successfully');
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
                console.log('[VideoSDK] Webcam enabled successfully');
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
                console.log('[VideoSDK] Screen sharing disabled');
                return false;
            } else {
                await this.meeting.enableScreenShare();
                console.log('[VideoSDK] Screen sharing enabled');
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
    
    // Simple state getters
    getWebcamState() {
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
        // Basic validation
        if (!eventName || typeof eventName !== 'string') return;
        
        // Register handler
        if (!this.eventHandlers[eventName]) {
            this.eventHandlers[eventName] = [];
        }
        this.eventHandlers[eventName].push(handler);
    }
    
    // Helper methods for state checking
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

// Create global instance
const videoSDKManager = new VideoSDKManager();
window.videoSDKManager = videoSDKManager;



// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = videoSDKManager;
} else if (typeof exports !== 'undefined') {
    exports.default = videoSDKManager;
}
