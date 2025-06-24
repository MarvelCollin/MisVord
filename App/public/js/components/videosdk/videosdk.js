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
            this.logError("VideoSDK: Missing auth token");
            throw new Error("VideoSDK initialization error: Missing auth token");
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
        // Try to detect SDK version based on available features
        if (VideoSDK.Constants && VideoSDK.Constants.modes && VideoSDK.Constants.modes.SEND_AND_RECV) {
            this.sdkVersion = "0.1.x";
        } else if (VideoSDK.config && VideoSDK.initMeeting) {
            this.sdkVersion = "0.2.x";
        } else {
            this.sdkVersion = "unknown";
        }
        
        this.log(`Detected VideoSDK version: ${this.sdkVersion}`);
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
        
        try {
            this.log("Creating new meeting room...");
            
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
                this.meetingCreated = true;
                this.meetingCreationAttempts = 0;
                return data.roomId;
            } else {
                const errorText = await response.text();
                this.logError("Failed to create meeting room:", response.status, errorText);
                throw new Error(`HTTP Error: ${response.status}`);
            }
        } catch (error) {
            this.logError("Error creating meeting room:", error);
            
            this.meetingCreationAttempts++;
            if (this.meetingCreationAttempts < this.MAX_MEETING_CREATION_ATTEMPTS) {
                this.log(`Retrying meeting creation (Attempt ${this.meetingCreationAttempts + 1}/${this.MAX_MEETING_CREATION_ATTEMPTS})...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.createMeetingRoom(customId);
            }
            
            this.logError("Failed to create meeting room after multiple attempts");
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
        
        // Adjust options based on SDK version
        if (this.sdkVersion === "0.1.x" && VideoSDK.Constants) {
            if (!mergedOptions.mode) {
                mergedOptions.mode = VideoSDK.Constants.modes.SEND_AND_RECV;
            }
        }
        
        if (!mergedOptions.meetingId) {
            throw new Error("Meeting ID is required");
        }
        
        try {
            this.meeting = VideoSDK.initMeeting(mergedOptions);
            
            this.setupEventHandlers();
            
            this.log("Meeting initialized:", mergedOptions.meetingId);
            return this.meeting;
        } catch (error) {
            this.logError("Failed to initialize meeting", error);
            throw error;
        }
    }
    
    setupEventHandlers() {
        if (!this.meeting) return;
        
        const standardEvents = [
            "meeting-joined",
            "meeting-left",
            "participant-joined",
            "participant-left",
            "speaker-changed",
            "presenter-changed",
            "error"
        ];
        
        standardEvents.forEach(eventName => {
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
        });
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
            await this.meeting.join();
            return true;
        } catch (error) {
            this.logError("Failed to join meeting", error);
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
        if (!this.meeting || !this.meeting.localParticipant) return false;
        
        if (this.meeting.localParticipant.streams.has("audio")) {
            this.meeting.muteMic();
            return false;
        } else {
            this.meeting.unmuteMic();
            return true;
        }
    }
    
    toggleWebcam() {
        if (!this.meeting || !this.meeting.localParticipant) return false;
        
        if (this.meeting.localParticipant.streams.has("video")) {
            this.meeting.disableWebcam();
            return false;
        } else {
            this.meeting.enableWebcam();
            return true;
        }
    }
    
    toggleScreenShare() {
        if (!this.meeting || !this.meeting.localParticipant) return false;
        
        if (this.meeting.localParticipant.streams.has("share")) {
            this.meeting.disableScreenShare();
            return false;
        } else {
            this.meeting.enableScreenShare();
            return true;
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
}

const videoSDKManager = new VideoSDKManager();

window.videoSDKManager = videoSDKManager;

window.waitForVideoSDK = function(callback, maxAttempts = 50) {
    videoSDKManager.waitForVideoSDK(callback, maxAttempts);
};

export default videoSDKManager;
