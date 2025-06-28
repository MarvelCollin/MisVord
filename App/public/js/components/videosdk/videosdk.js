class VideoSDKManager {
    constructor() {
        this.authToken = null;
        this.apiKey = "8ad2dbcd-638d-4fbb-999c-9a48a83caa15";
        this.secretKey = "2894abac68603be19aa80b781cad6683eebfb922f496c22cc46b19ad91647d4e";
        this.meeting = null;
        this.meetingCreated = false;
        this.meetingCreationAttempts = 0;
        this.MAX_MEETING_CREATION_ATTEMPTS = 3;
        this.initialized = false;
        this.eventHandlers = {};
        this.sdkVersion = null;
        
        this.defaultToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI4YWQyZGJjZC02MzhkLTRmYmItOTk5Yy05YTQ4YTgzY2FhMTUiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTc0ODkxMzI5NywiZXhwIjoxNzY0NDY1Mjk3fQ.16_7vBmTkjKz8plb9eiRPAcKwmIxHqCgIb1OqSeB5vQ";
    }

    init(authToken) {
        if (!authToken) {
            this.log("VideoSDK: Using default token");
            authToken = this.defaultToken;
        }
        
        if (typeof VideoSDK === 'undefined') {
            this.logError("VideoSDK: SDK not loaded");
            throw new Error("VideoSDK not loaded. Make sure to include the VideoSDK script.");
        }
        
        this.authToken = authToken;
        this.detectSDKVersion();
        VideoSDK.config(authToken);
        this.initialized = true;
        
        this.log("VideoSDK initialized with token");
        
        return this;
    }
    
    detectSDKVersion() {                        
        if (VideoSDK.Constants && VideoSDK.Constants.modes && VideoSDK.Constants.modes.SEND_AND_RECV) {
            this.sdkVersion = "0.1.x";
        } else if (VideoSDK.version) {
            this.sdkVersion = VideoSDK.version;
        } else if (VideoSDK.config && VideoSDK.initMeeting) {
            this.sdkVersion = "0.2.x";
        } else {
            this.sdkVersion = "unknown";
        }
        
        this.hasE2EE = typeof VideoSDK.enableE2EE === 'function';
        this.hasFastChannelSwitching = typeof VideoSDK.enableFastChannelSwitching === 'function';
        this.hasMediaRelay = typeof VideoSDK.enableMediaRelay === 'function';
        this.hasAdaptiveSubscriptions = typeof VideoSDK.enableAdaptiveSubscriptions === 'function';
        
        this.log(`Detected VideoSDK version: ${this.sdkVersion}`);
        this.log(`Features: E2EE: ${this.hasE2EE}, Fast Channel Switching: ${this.hasFastChannelSwitching}, Media Relay: ${this.hasMediaRelay}, Adaptive Subscriptions: ${this.hasAdaptiveSubscriptions}`);
    }
    
    getMetaConfig() {
        const authToken = this.getMeta('videosdk-token') || this.defaultToken;
        const meetingId = this.getMeta('meeting-id');
        const participantName = this.getMeta('username');
        const channelId = this.getMeta('channel-id');
        
        return {
            authToken,
            meetingId,
            participantName,
            channelId
        };
    }
    
    getMeta(name) {
        const meta = document.querySelector(`meta[name="${name}"]`);
        return meta ? meta.getAttribute('content') : null;
    }
    
    async getAuthToken() {
        const metaToken = this.getMeta('videosdk-token');
        if (metaToken) {
            return metaToken;
        }
        
        try {
            const token = await this.generateToken();
            return token;
        } catch (error) {
            console.error("Failed to generate token:", error);
            return this.defaultToken;
        }
    }
    
    async generateToken() {             
        return this.defaultToken;
    }
    
    async fetchTokens() {
        try {
            const authToken = await this.getAuthToken();
            
            this.authToken = authToken;
            
            return {
                token: this.authToken,
                apiKey: this.apiKey
            };
        } catch (error) {
            console.error("Failed to fetch VideoSDK tokens:", error);
            throw error;
        }
    }

    async createMeetingRoom(customId = null) {
        if (!this.authToken) {
            try {
                const tokens = await this.fetchTokens();
                this.authToken = tokens.token;
            } catch (error) {
                this.logError("Failed to get auth token", error);
                return null;
            }
        }
        
        if (this.meetingCreated) {
            this.log("Meeting already created, reusing existing meeting");
            return this.meeting?.id;
        }
        
        try {
            this.log("Creating new meeting room...");
            console.log("[VIDEOSDK] Creating new meeting room", customId ? `with custom ID: ${customId}` : "with auto-generated ID");
            
            const postData = customId ? { customRoomId: customId } : {};
            
            const response = await fetch('https://api.videosdk.live/v2/rooms', {
                method: 'POST',
                headers: {
                    'Authorization': this.authToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });
            
            if (response.ok) {
                const data = await response.json();
                this.log("Meeting room created:", data);
                console.log(`[VIDEOSDK] Meeting room created successfully with ID: ${data.roomId}`);
                this.meetingCreated = true;
                this.meetingCreationAttempts = 0;
                return data.roomId;
            } else {
                const errorText = await response.text();
                this.logError("Failed to create meeting room:", response.status, errorText);
                console.error(`[VIDEOSDK] Failed to create meeting room: ${response.status} - ${errorText}`);
                throw new Error(`HTTP Error: ${response.status}`);
            }
        } catch (error) {
            this.logError("Error creating meeting room:", error);
            console.error(`[VIDEOSDK] Error creating meeting room:`, error);
            
            this.meetingCreationAttempts++;
            if (this.meetingCreationAttempts >= this.MAX_MEETING_CREATION_ATTEMPTS) {
                this.logError("Max meeting creation attempts reached");
                throw new Error("Failed to create meeting after multiple attempts");
            }
            
            return null;
        }
    }
    
    async validateMeeting(meetingId) {
        if (!this.authToken) {
            try {
                const tokens = await this.fetchTokens();
                this.authToken = tokens.token;
            } catch (error) {
                this.logError("Failed to get auth token for meeting validation", error);
                return false;
            }
        }
        
        try {
            const response = await fetch(`https://api.videosdk.live/v2/rooms/validate/${meetingId}`, {
                method: 'GET',
                headers: {
                    'Authorization': this.authToken
                }
            });
            
            return response.status === 200;
        } catch (error) {
            this.logError("Error validating meeting:", error);
            return false;
        }
    }
    
    async getMeetingInfo(meetingId) {
        if (!this.authToken) {
            try {
                const tokens = await this.fetchTokens();
                this.authToken = tokens.token;
            } catch (error) {
                this.logError("Failed to get auth token for meeting info", error);
                return null;
            }
        }
        
        try {
            const response = await fetch(`https://api.videosdk.live/v2/rooms/${meetingId}`, {
                method: 'GET',
                headers: {
                    'Authorization': this.authToken
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
            
            this.logError("Failed to get meeting info", {
                status: response.status,
                meetingId
            });
            
            return null;
        } catch (error) {
            this.logError("Error getting meeting info:", error);
            return null;
        }
    }

    initMeeting(options) {
        if (!this.initialized) {
            throw new Error("VideoSDK not initialized. Call init() first.");
        }
        
        const defaultOptions = {
            meetingId: null,
            name: 'Anonymous',
            micEnabled: true,
            webcamEnabled: false,
            participantCanToggleSelfWebcam: true,
            participantCanToggleSelfMic: true,
            participantCanMute: true,
            participantCanUnmute: true,
            chatEnabled: false,
            screenShareEnabled: true,
            pollEnabled: false,
            whiteBoardEnabled: false,
            raiseHandEnabled: false
        };
        
        let mergedOptions = {...defaultOptions, ...options};
        
        if (this.sdkVersion === "0.1.x" && VideoSDK.Constants) {
            if (!mergedOptions.mode) {
                mergedOptions.mode = VideoSDK.Constants.modes.SEND_AND_RECV;
            }
        }
        
        if (!mergedOptions.meetingId) {
            throw new Error("Meeting ID is required");
        }
        
        try {
            console.log(`[VIDEOSDK] Initializing meeting with ID: ${mergedOptions.meetingId}, username: ${mergedOptions.name}`);
            this.meeting = VideoSDK.initMeeting(mergedOptions);
            
            this.setupEventHandlers();
            
            this.log("Meeting initialized:", mergedOptions.meetingId);
            console.log(`[VIDEOSDK] Meeting initialized successfully with ID: ${mergedOptions.meetingId}`);
            return this.meeting;
        } catch (error) {
            this.logError("Failed to initialize meeting", error);
            console.error(`[VIDEOSDK] Failed to initialize meeting: ${error.message || error}`);
            throw error;
        }
    }
    
    setupEventHandlers() {
        if (!this.meeting) return;
        
        let standardEvents = [
            "meeting-joined",
            "meeting-left",
            "participant-joined",
            "participant-left",
            "speaker-changed",
            "presenter-changed",
            "error",
            "recording-started",
            "recording-stopped",
            "livestream-started", 
            "livestream-stopped"
        ];
        
        if (this.sdkVersion === "0.2.x" || this.sdkVersion.startsWith("0.2")) {
            standardEvents = standardEvents.concat([
                "hls-state-changed",
                "transcription-state-changed",
                "transcription-text",
                "meeting-state-changed"
            ]);
        }
        
        const advancedEvents = [
            "device-changed",
            "stream-paused",
            "stream-resumed",
            "paused-all-streams",
            "resumed-all-streams"
        ];
        
        standardEvents.forEach(eventName => {
            this.registerEventHandler(eventName);
        });
        
        advancedEvents.forEach(eventName => {
            try {
                this.registerEventHandler(eventName);
            } catch (error) {
                this.log(`Event ${eventName} not supported in this SDK version, skipping`);
            }
        });
    }
    
    registerEventHandler(eventName) {
        try {
            const isEventSupported = this.isEventSupported(eventName);
            
            if (!isEventSupported) {
                this.log(`Event ${eventName} not supported in this SDK version, skipping`);
                return;
            }
            
            this.meeting.on(eventName, (...args) => {
                if (eventName !== "error") {
                    this.log(`Event: ${eventName}`);
                } else {
                    this.logError(`Meeting error:`, args[0]);
                }
                
                if (this.eventHandlers[eventName]) {
                    this.eventHandlers[eventName].forEach(handler => {
                        try {
                            handler(...args);
                        } catch (error) {
                            this.logError(`Error in custom handler for ${eventName}:`, error);
                        }
                    });
                }
            });
        } catch (error) {
            this.logError(`Failed to register event handler for ${eventName}:`, error);
        }
    }
    
    isEventSupported(eventName) {
        try {
            const dummyHandler = () => {};
            this.meeting.on(eventName, dummyHandler);
            
            this.meeting.off(eventName, dummyHandler);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    on(eventName, handler) {
        if (!this.eventHandlers[eventName]) {
            this.eventHandlers[eventName] = [];
        }
        this.eventHandlers[eventName].push(handler);
    }

    async joinMeeting() {
        if (!this.meeting) {
            throw new Error("No meeting initialized");
        }
        
        try {
            console.log(`[VIDEOSDK] Joining meeting with ID: ${this.meeting.id || 'unknown'}`);
            this.log(`Joining meeting with ID: ${this.meeting.id || 'unknown'}`);
            
            const joinPromise = this.meeting.join();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Connection timeout')), 15000);
            });
            
            await Promise.race([joinPromise, timeoutPromise]);
            
            let joinedEventReceived = false;
            let connectionEstablished = false;
            
            await new Promise((resolve, reject) => {
                const maxAttempts = 150;
                let attempts = 0;
                
                const checkConnection = () => {
                    attempts++;
                    const status = this.meeting.localParticipant?.connectionStatus;
                    
                    if (status === 'connected' && joinedEventReceived) {
                        connectionEstablished = true;
                        resolve();
                    } else if (status === 'failed' || status === 'closed') {
                        reject(new Error(`Connection ${status}`));
                    } else if (attempts >= maxAttempts) {
                        reject(new Error('Connection timeout'));
                    } else {
                        setTimeout(checkConnection, 100);
                    }
                };
                
                this.meeting.on("meeting-joined", () => {
                    console.log("[VIDEOSDK] Meeting joined event received");
                    joinedEventReceived = true;
                    if (this.meeting.localParticipant?.connectionStatus === 'connected') {
                        connectionEstablished = true;
                        resolve();
                    }
                });
                
                this.meeting.on("error", (error) => {
                    console.error("[VIDEOSDK] Meeting error:", error);
                    reject(error);
                });
                
                this.meeting.on("meeting-left", () => {
                    console.log("[VIDEOSDK] Meeting left event received");
                    reject(new Error('Meeting left'));
                });
                
                checkConnection();
            });
            
            if (!connectionEstablished) {
                throw new Error('Failed to establish connection');
            }
            
            console.log(`[VIDEOSDK] Successfully joined meeting with ID: ${this.meeting.id || 'unknown'}`);
            
            // Re-emit the voiceConnect event to ensure UI is updated
            if (window.voiceState) {
                window.voiceState.isConnected = true;
            }
            
            if (window.voiceManager) {
                window.voiceManager.isConnected = true;
            }
            
            const channelId = document.querySelector('meta[name="channel-id"]')?.content;
            const channelName = document.querySelector('.channel-name')?.textContent || 'Voice Channel';
            
            window.dispatchEvent(new CustomEvent('voiceConnect', {
                detail: { 
                    meetingId: this.meeting.id,
                    channelName: channelName,
                    channelId: channelId 
                }
            }));
            
            return true;
        } catch (error) {
            this.logError("Failed to join meeting", error);
            console.error(`[VIDEOSDK] Failed to join meeting: ${error.message || error}`);
            
            if (window.voiceState) {
                window.voiceState.isConnected = false;
            }
            
            if (window.voiceManager) {
                window.voiceManager.isConnected = false;
            }
            
            window.dispatchEvent(new CustomEvent('voiceDisconnect'));
            throw error;
        }
    }

    leaveMeeting() {
        if (this.meeting) {
            this.meeting.leave();
            return true;
        }
        return false;
    }
    
    toggleMic() {
        if (!this.meeting) return false;
        
        try {
            const isMicEnabled = this.sdkVersion === "0.2.x" 
                ? this.meeting.localParticipant.isMicEnabled
                : this.meeting.localParticipant.streams.has("audio");
                
            if (isMicEnabled) {
                this.meeting.muteMic();
                if (window.voiceStateManager) {
                    window.voiceStateManager.setState({ isMuted: true });
                }
            } else {
                this.meeting.unmuteMic();
                if (window.voiceStateManager) {
                    window.voiceStateManager.setState({ isMuted: false });
                }
            }
            return !isMicEnabled;
        } catch (error) {
            this.logError("Error toggling mic:", error);
            return false;
        }
    }
    
    async checkCameraPermissions() {
        try {
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: 'camera' });
                this.log(`Camera permission state: ${permission.state}`);
                return permission.state === 'granted';
            } else {
                this.log("Permissions API not available, testing direct access");
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
                this.log("Camera access test successful");
                return true;
            }
        } catch (error) {
            this.logError("Camera permission check failed:", error);
            return false;
        }
    }

    async toggleWebcam() {
        if (!this.meeting) {
            this.logError("No meeting available for webcam toggle");
            return false;
        }
        
        try {
            const localParticipant = this.meeting.localParticipant;
            if (!localParticipant) {
                this.logError("No local participant found");
                return false;
            }

            // Check connection status
            if (localParticipant.connectionStatus !== 'connected') {
                this.logError("Cannot toggle webcam - participant not fully connected");
                if (window.showToast) {
                    window.showToast('Please wait for connection to establish', 'error');
                }
                return false;
            }
            
            const currentWebcamState = this.getWebcamState();
            this.log(`Current webcam state: ${currentWebcamState}`);
                
            if (currentWebcamState) {
                this.log("Disabling webcam...");
                if (this.meeting.disableWebcam) {
                    await this.meeting.disableWebcam();
                } else if (localParticipant.disableWebcam) {
                    await localParticipant.disableWebcam();
                } else if (localParticipant.disableCam) {
                    await localParticipant.disableCam();
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const finalState = this.getWebcamState();
                this.log(`Webcam disabled, final state: ${finalState}`);
                return false;
            } else {
                this.log("Enabling webcam...");
                
                const hasPermission = await this.checkCameraPermissions();
                if (!hasPermission) {
                    throw new Error("Camera permission denied");
                }
                
                try {
                    // Wait for transport to be ready
                    await new Promise((resolve, reject) => {
                        const checkTransport = () => {
                            if (localParticipant.producer || localParticipant.transport) {
                                resolve();
                            } else if (localParticipant.connectionStatus !== 'connected') {
                                reject(new Error('Connection lost while enabling camera'));
                            } else {
                                setTimeout(checkTransport, 100);
                            }
                        };
                        checkTransport();
                    });

                    let stream;
                    if (this.meeting.enableWebcam) {
                        stream = await this.meeting.enableWebcam();
                    } else if (localParticipant.enableWebcam) {
                        stream = await localParticipant.enableWebcam();
                    } else if (localParticipant.enableCam) {
                        stream = await localParticipant.enableCam();
                    } else {
                        throw new Error("No webcam enable method found");
                    }
                    
                    this.log("Webcam enabled, waiting for stream...");
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    const finalState = this.getWebcamState();
                    this.log(`Webcam enable attempted, final state: ${finalState}`);
                    
                    if (!finalState) {
                        throw new Error("Webcam failed to enable - final state is false");
                    }
                    
                    // Manually trigger stream event if needed
                    if (stream && !localParticipant.streams.has('video')) {
                        this.log("Manually triggering stream event");
                        localParticipant.emit('stream-enabled', {
                            kind: 'video',
                            track: stream.getVideoTracks()[0],
                            stream: stream
                        });
                    }
                    
                    this.log("Webcam enabled successfully");
                    return true;
                } catch (permissionError) {
                    this.logError("Camera permission denied or failed to enable:", permissionError);
                    if (window.showToast) {
                        window.showToast('Camera failed to enable. Please check permissions.', 'error', 5000);
                    }
                    return false;
                }
            }
        } catch (error) {
            this.logError("Error toggling webcam:", error);
            return false;
        }
    }
    
    async toggleScreenShare() {
        if (!this.meeting) {
            this.logError("No meeting available for screen share toggle");
            return false;
        }
        
        try {
            const localParticipant = this.meeting.localParticipant;
            if (!localParticipant) {
                this.logError("No local participant found");
                return false;
            }
            
            const isScreenShareEnabled = this.sdkVersion === "0.2.x" 
                ? localParticipant.screenShareEnabled || localParticipant.isScreenShareEnabled
                : localParticipant.streams.has("share");
                
            this.log(`Current screen share state: ${isScreenShareEnabled}`);
                
            if (isScreenShareEnabled) {
                if (this.meeting.disableScreenShare) {
                    this.meeting.disableScreenShare();
                } else if (localParticipant.disableScreenShare) {
                    localParticipant.disableScreenShare();
                }
                
                if (window.voiceStateManager) {
                    window.voiceStateManager.setState({ isScreenSharing: false });
                }
                this.log("Screen share disabled");
                return false;
            } else {
                try {
                    if (this.meeting.enableScreenShare) {
                        await this.meeting.enableScreenShare();
                    } else if (localParticipant.enableScreenShare) {
                        await localParticipant.enableScreenShare();
                    }
                    
                    if (window.voiceStateManager) {
                        window.voiceStateManager.setState({ isScreenSharing: true });
                    }
                    this.log("Screen share enabled");
                    return true;
                } catch (permissionError) {
                    this.logError("Screen share permission denied or not available:", permissionError);
                    if (window.showToast) {
                        window.showToast('Screen share permission required. Please allow screen access.', 'error', 5000);
                    }
                    return false;
                }
            }
        } catch (error) {
            this.logError("Error toggling screen share:", error);
            const newState = !this.getScreenShareState();
            if (window.voiceStateManager) {
                window.voiceStateManager.setState({ isScreenSharing: newState });
            }
            return newState;
        }
    }
    
    toggleDeafen() {
        if (!this.meeting) return false;
        
        try {
            const currentDeafenState = window.voiceStateManager ? window.voiceStateManager.getState().isDeafened : false;
            const newDeafenState = !currentDeafenState;
            
            if (newDeafenState) {
                this.meeting.muteMic();
                if (window.voiceStateManager) {
                    window.voiceStateManager.setState({ 
                        isDeafened: true, 
                        isMuted: true 
                    });
                }
            } else {
                if (window.voiceStateManager) {
                    window.voiceStateManager.setState({ isDeafened: false });
                }
            }
            return newDeafenState;
        } catch (error) {
            this.logError("Error toggling deafen:", error);
            return false;
        }
    }
    
    
    toggleE2EE(enabled = true) {
        if (!this.hasE2EE) {
            this.logError("E2EE feature not available in this VideoSDK version");
            return false;
        }
        
        try {
            if (enabled) {
                VideoSDK.enableE2EE();
                this.log("End-to-end encryption enabled");
            } else {
                VideoSDK.disableE2EE();
                this.log("End-to-end encryption disabled");
            }
            return true;
        } catch (error) {
            this.logError("Error toggling E2EE:", error);
            return false;
        }
    }
    
    
    toggleFastChannelSwitching(enabled = true) {
        if (!this.hasFastChannelSwitching) {
            this.logError("Fast channel switching feature not available in this VideoSDK version");
            return false;
        }
        
        try {
            if (enabled) {
                VideoSDK.enableFastChannelSwitching();
                this.log("Fast channel switching enabled");
            } else {
                VideoSDK.disableFastChannelSwitching();
                this.log("Fast channel switching disabled");
            }
            return true;
        } catch (error) {
            this.logError("Error toggling fast channel switching:", error);
            return false;
        }
    }
    

    toggleAdaptiveSubscriptions(enabled = true) {
        if (!this.hasAdaptiveSubscriptions || !this.meeting) {
            this.logError("Adaptive subscriptions feature not available");
            return false;
        }
        
        try {
            if (enabled) {
                this.meeting.enableAdaptiveSubscriptions();
                this.log("Adaptive subscriptions enabled");
            } else {
                this.meeting.disableAdaptiveSubscriptions();
                this.log("Adaptive subscriptions disabled");
            }
            return true;
        } catch (error) {
            this.logError("Error toggling adaptive subscriptions:", error);
            return false;
        }
    }

    waitForVideoSDK(callback, maxAttempts = 50) {
        let attempts = 0;
        const checkSDK = () => {
            attempts++;
            if (typeof VideoSDK !== 'undefined' && VideoSDK.config && VideoSDK.initMeeting) {
                if (window.logger) {
                    window.logger.debug('videosdk', "VideoSDK loaded successfully");
                } else {
                    console.log("VideoSDK loaded successfully");
                }
                callback();
            } else if (attempts < maxAttempts) {
                setTimeout(checkSDK, 100);
            } else {
                const errorMsg = `VideoSDK failed to load after ${maxAttempts * 100}ms`;
                if (window.logger) {
                    window.logger.error('videosdk', errorMsg);
                } else {
                    console.error(errorMsg);
                }
                
                if (typeof callback === 'function') {
                    callback(new Error(errorMsg));
                }
            }
        };
        checkSDK();
    }
    
    log(message, ...args) {
        if (window.logger) {
            window.logger.info('videosdk', message, ...args);
        } else {
            console.log(`[VideoSDK] ${message}`, ...args);
        }
    }
    
    logError(message, ...args) {
        if (window.logger) {
            window.logger.error('videosdk', message, ...args);
        } else {
            console.error(`[VideoSDK Error] ${message}`, ...args);
        }
    }

    getWebcamState() {
        if (!this.meeting || !this.meeting.localParticipant) {
            this.log("getWebcamState: No meeting or participant");
            return false;
        }
        
        try {
            const participant = this.meeting.localParticipant;
            let isEnabled = false;
            
            if (this.sdkVersion === "0.2.x") {
                isEnabled = participant.isWebcamEnabled || participant.webcamEnabled || false;
            } else {
                isEnabled = participant.streams && participant.streams.has && participant.streams.has("video");
            }
            
            this.log(`getWebcamState: SDK version ${this.sdkVersion}, isEnabled: ${isEnabled}`);
            
            if (participant.streams) {
                const streamKeys = Array.from(participant.streams.keys ? participant.streams.keys() : []);
                this.log(`getWebcamState: Available streams: ${streamKeys.join(', ')}`);
                
                if (participant.streams.get && participant.streams.get('video')) {
                    const videoStream = participant.streams.get('video');
                    this.log(`getWebcamState: Video stream details:`, videoStream);
                }
            }
            
            return isEnabled;
        } catch (error) {
            this.logError("Error getting webcam state:", error);
            return false;
        }
    }
    
    getScreenShareState() {
        if (!this.meeting || !this.meeting.localParticipant) return false;
        
        try {
            return this.sdkVersion === "0.2.x" 
                ? this.meeting.localParticipant.isScreenShareEnabled
                : this.meeting.localParticipant.streams.has("share");
        } catch (error) {
            this.logError("Error getting screen share state:", error);
            return false;
        }
    }
    
    getMicState() {
        if (!this.meeting || !this.meeting.localParticipant) return false;
        
        try {
            return this.sdkVersion === "0.2.x" 
                ? this.meeting.localParticipant.isMicEnabled
                : this.meeting.localParticipant.streams.has("audio");
        } catch (error) {
            this.logError("Error getting mic state:", error);
            return false;
        }
    }
}

const videoSDKManager = new VideoSDKManager();

window.videoSDKManager = videoSDKManager;

window.waitForVideoSDK = function(callback, maxAttempts = 50) {
    videoSDKManager.waitForVideoSDK(callback, maxAttempts);
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = videoSDKManager;
} else if (typeof exports !== 'undefined') {
    exports.default = videoSDKManager;
}
