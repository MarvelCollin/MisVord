/**
 * VideoSDK Manager - Global Version
 * This is a non-module version of videosdk.js that can be loaded as a regular script
 */

(function() {
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
        
        initMeeting(options) {
            if (!this.initialized) {
                this.logError("VideoSDK not initialized. Call init() first.");
                throw new Error("VideoSDK not initialized");
            }
            
            if (!options || !options.meetingId) {
                this.logError("Missing required meeting options");
                throw new Error("Missing required meeting options");
            }
            
            try {
                const { meetingId, name, micEnabled = true, webcamEnabled = false } = options;
                
                this.log(`Initializing meeting with ID: ${meetingId}`);
                
                const meetingOptions = {
                    roomId: meetingId,
                    name: name || 'User',
                    micEnabled,
                    webcamEnabled
                };
                
                this.log("Meeting options:", meetingOptions);
                
                this.meeting = VideoSDK.initMeeting(meetingOptions);
                
                if (!this.meeting) {
                    this.logError("Failed to initialize meeting");
                    throw new Error("Failed to initialize meeting");
                }
                
                this.setupEventHandlers();
                
                this.log("Meeting initialized successfully");
                return this.meeting;
            } catch (error) {
                this.logError("Error initializing meeting:", error);
                throw error;
            }
        }
        
        setupEventHandlers() {
            if (!this.meeting) {
                this.logError("No active meeting to set up event handlers for");
                return;
            }
            
            try {
                // Register common events
                this.registerEventHandler("participant-joined");
                this.registerEventHandler("participant-left");
                this.registerEventHandler("meeting-joined");
                this.registerEventHandler("meeting-left");
                this.registerEventHandler("error");
                
                // Register media events
                this.registerEventHandler("mic-requested");
                this.registerEventHandler("webcam-requested");
                this.registerEventHandler("mic-on");
                this.registerEventHandler("mic-off");
                this.registerEventHandler("webcam-on");
                this.registerEventHandler("webcam-off");
                this.registerEventHandler("screen-share-started");
                this.registerEventHandler("screen-share-stopped");
                
                // Register stream events
                this.registerEventHandler("stream-enabled");
                this.registerEventHandler("stream-disabled");
                
                this.log("Event handlers set up successfully");
            } catch (error) {
                this.logError("Error setting up event handlers:", error);
            }
        }
        
        registerEventHandler(eventName) {
            if (!this.meeting || !this.isEventSupported(eventName)) {
                return;
            }
            
            try {
                this.meeting.on(eventName, (...args) => {
                    if (this.eventHandlers[eventName]) {
                        this.eventHandlers[eventName].forEach(handler => {
                            try {
                                handler(...args);
                            } catch (error) {
                                this.logError(`Error in ${eventName} handler:`, error);
                            }
                        });
                    }
                    
                    // Log the event for debugging
                    this.log(`Event: ${eventName}`, ...args);
                });
            } catch (error) {
                this.logError(`Error registering ${eventName} handler:`, error);
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
                this.logError("No active meeting to join");
                throw new Error("No active meeting to join");
            }
            
            try {
                this.log(`Joining meeting with ID: ${this.meeting.id || 'unknown'}`);
                await this.meeting.join();
                console.log(`[VIDEOSDK] Successfully joined meeting with ID: ${this.meeting.id || 'unknown'}`);
                return true;
            } catch (error) {
                this.logError("Failed to join meeting", error);
                console.error(`[VIDEOSDK] Failed to join meeting: ${error.message || error}`);
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
                } else {
                    this.meeting.unmuteMic();
                }
                return !isMicEnabled;
            } catch (error) {
                this.logError("Error toggling mic:", error);
                return false;
            }
        }
        
        toggleWebcam() {
            if (!this.meeting) return false;
            
            try {
                const isWebcamEnabled = this.sdkVersion === "0.2.x" 
                    ? this.meeting.localParticipant.isWebcamEnabled
                    : this.meeting.localParticipant.streams.has("video");
                    
                if (isWebcamEnabled) {
                    this.meeting.disableWebcam();
                } else {
                    this.meeting.enableWebcam();
                }
                return !isWebcamEnabled;
            } catch (error) {
                this.logError("Error toggling webcam:", error);
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
    }
    
    // Create global instance
    window.videoSDKManager = new VideoSDKManager();
    
    // Create global helper function
    window.waitForVideoSDK = function(callback, maxAttempts = 50) {
        window.videoSDKManager.waitForVideoSDK(callback, maxAttempts);
    };
})(); 