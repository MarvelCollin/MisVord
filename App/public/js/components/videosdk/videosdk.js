class VideoSDKManager {
    constructor() {
        this.authToken = null;
        this.apiKey = "8ad2dbcd-638d-4fbb-999c-9a48a83caa15";
        this.meeting = null;
        this.initialized = false;
        this.eventHandlers = {};
        
        // Hardcoded token for development
        this.defaultToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI4YWQyZGJjZC02MzhkLTRmYmItOTk5Yy05YTQ4YTgzY2FhMTUiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTc0ODkxMzI5NywiZXhwIjoxNzY0NDY1Mjk3fQ.16_7vBmTkjKz8plb9eiRPAcKwmIxHqCgIb1OqSeB5vQ";
    }

    init(authToken) {
        if (!authToken) {
            authToken = this.defaultToken;
        }
        
        if (typeof VideoSDK === 'undefined') {
            throw new Error("VideoSDK not loaded");
        }
        
        this.authToken = authToken;
        VideoSDK.config(authToken);
        this.initialized = true;
        
        console.log("VideoSDK initialized");
        return this;
    }
    
    getMetaConfig() {
        return {
            authToken: document.querySelector('meta[name="videosdk-token"]')?.content || this.defaultToken,
            meetingId: document.querySelector('meta[name="meeting-id"]')?.content,
            participantName: document.querySelector('meta[name="username"]')?.content,
            channelId: document.querySelector('meta[name="channel-id"]')?.content
        };
    }
    
    async createMeetingRoom(customId = null) {
        try {
            console.log("Creating meeting room" + (customId ? `: ${customId}` : ""));
            
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
                console.log(`Meeting room created: ${data.roomId}`);
                return data.roomId;
            } else {
                console.error(`Failed to create meeting room: ${response.status}`);
                return null;
            }
        } catch (error) {
            console.error("Error creating meeting room:", error);
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
        
        // Basic events
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
                } else {
                    console.log(`Event: ${eventName}`);
                }
                
                // Notify any registered handlers
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
        
        // Simple setup for stream events
        this.setupSimpleStreamHandlers();
    }
    
    setupSimpleStreamHandlers() {
        if (!this.meeting?.localParticipant) return;
        
        try {
            const participant = this.meeting.localParticipant;
            
            // Create safe event system by completely wrapping the participant's event mechanism
            this.wrapParticipantEventSystem(participant);
            
            // Register all event handlers through our safe wrapper
            this.registerStreamEvents(participant);
            
        } catch (error) {
            console.error("Error setting up stream handlers:", error);
        }
    }
    
    wrapParticipantEventSystem(participant) {
        // Skip if participant is missing or already wrapped
        if (!participant || participant._safeEventSystemInstalled) return;
        
        try {
            // Store original on method if it exists
            const originalOn = participant.on;
            
            // Create our event registry
            if (!participant._eventHandlers) {
                participant._eventHandlers = {
                    'stream-enabled': [],
                    'stream-disabled': [],
                    'error': []
                };
            }
            
            // Delete problematic property directly
            if ('onn' in participant) {
                console.log("Deleting problematic 'onn' property");
                delete participant.onn;
            }
            
            // Replace on method with our safe version
            participant.on = function(eventName, handler) {
                // Only allow valid events
                if (typeof eventName !== 'string') {
                    console.warn(`Invalid event type: ${typeof eventName}`);
                    return;
                }
                
                // Normalize event name
                const normalizedName = eventName.trim().toLowerCase();
                
                // Check if it's a valid event
                const validEvents = ['stream-enabled', 'stream-disabled', 'error'];
                if (!validEvents.includes(normalizedName)) {
                    console.warn(`Ignoring unrecognized event: ${eventName}`);
                    return;
                }
                
                // Store handler in our registry
                if (!participant._eventHandlers[normalizedName]) {
                    participant._eventHandlers[normalizedName] = [];
                }
                participant._eventHandlers[normalizedName].push(handler);
                
                // If original method exists, try to use it safely
                if (typeof originalOn === 'function') {
                    try {
                        originalOn.call(participant, normalizedName, handler);
                    } catch (err) {
                        console.warn(`Error in original on method for ${normalizedName}, falling back to direct handler`);
                        // We'll handle it through our registry
                    }
                }
            };
            
            // Add method to trigger events manually
            participant.safeEmit = function(eventName, data) {
                const normalizedName = eventName?.trim().toLowerCase();
                if (!normalizedName || !participant._eventHandlers[normalizedName]) return;
                
                // Call all handlers
                participant._eventHandlers[normalizedName].forEach(handler => {
                    try {
                        handler(data);
                    } catch (err) {
                        console.error(`Error in ${normalizedName} handler:`, err);
                    }
                });
            };
            
            // Mark as wrapped
            participant._safeEventSystemInstalled = true;
            console.log("Installed safe event system");
            
        } catch (error) {
            console.error("Error wrapping participant event system:", error);
        }
    }
    
    registerStreamEvents(participant) {
        if (!participant || !participant.on) return;
        
        // Create wrapper functions that use try-catch blocks
        const safeRegister = (eventName, handler) => {
            try {
                participant.on(eventName, handler);
            } catch (err) {
                console.error(`Error registering ${eventName}:`, err);
                
                // If direct registration fails, we still have our handler registry
                if (participant._eventHandlers && participant._eventHandlers[eventName]) {
                    if (!participant._eventHandlers[eventName].includes(handler)) {
                        participant._eventHandlers[eventName].push(handler);
                    }
                }
            }
        };
        
        // Stream enabled handler
        const streamEnabledHandler = (data) => {
            if (!data) return;
            
            try {
                const kind = data.kind || 
                    (data.stream?.getVideoTracks?.().length > 0 ? 'video' : 
                     data.stream?.getAudioTracks?.().length > 0 ? 'audio' : 'unknown');
                
                console.log(`Stream of kind ${kind} enabled`);
                
                window.dispatchEvent(new CustomEvent('videosdkStreamEnabled', { 
                    detail: { 
                        kind, 
                        stream: data.stream || null,
                        participant: participant.id
                    } 
                }));
            } catch (error) {
                console.error("Error handling stream-enabled:", error);
            }
        };
        
        // Stream disabled handler
        const streamDisabledHandler = (data) => {
            if (!data) return;
            
            const kind = data.kind || 'unknown';
            console.log(`Stream of kind ${kind} disabled`);
            
            window.dispatchEvent(new CustomEvent('videosdkStreamDisabled', { 
                detail: { 
                    kind,
                    participant: participant.id
                } 
            }));
        };
        
        // Error handler
        const errorHandler = (error) => {
            console.error("Stream error:", error);
        };
        
        // Register all handlers safely
        safeRegister('stream-enabled', streamEnabledHandler);
        safeRegister('stream-disabled', streamDisabledHandler);
        safeRegister('error', errorHandler);
        
        // Monitor for stream changes directly using a timer as a fallback
        this.startStreamMonitoring(participant);
    }
    
    startStreamMonitoring(participant) {
        // Skip if no participant or already monitoring
        if (!participant || participant._streamMonitoringActive) return;
        
        // Track previous stream state
        participant._previousStreams = new Map();
        
        // Set up interval to monitor streams
        const interval = setInterval(() => {
            if (!participant || !participant.streams) {
                clearInterval(interval);
                return;
            }
            
            try {
                // Check for new streams
                participant.streams.forEach((stream, streamId) => {
                    if (!participant._previousStreams.has(streamId)) {
                        // New stream found
                        const kind = streamId.includes('video') ? 'video' : 
                                    streamId.includes('audio') ? 'audio' : 
                                    streamId.includes('share') ? 'share' : 'unknown';
                                    
                        console.log(`Stream monitor detected new ${kind} stream`);
                        
                        // Manually trigger event
                        participant.safeEmit('stream-enabled', { 
                            kind, 
                            stream: stream.stream || stream
                        });
                        
                        // Update tracking
                        participant._previousStreams.set(streamId, true);
                    }
                });
                
                // Check for removed streams
                participant._previousStreams.forEach((_, streamId) => {
                    if (!participant.streams.has(streamId)) {
                        // Stream was removed
                        const kind = streamId.includes('video') ? 'video' : 
                                    streamId.includes('audio') ? 'audio' : 
                                    streamId.includes('share') ? 'share' : 'unknown';
                                    
                        console.log(`Stream monitor detected removed ${kind} stream`);
                        
                        // Manually trigger event
                        participant.safeEmit('stream-disabled', { kind });
                        
                        // Update tracking
                        participant._previousStreams.delete(streamId);
                    }
                });
            } catch (err) {
                console.warn("Error in stream monitor:", err);
            }
        }, 1000);
        
        // Store interval for cleanup
        participant._streamMonitorInterval = interval;
        participant._streamMonitoringActive = true;
    }

    async joinMeeting() {
        if (!this.meeting) {
            throw new Error("No meeting initialized");
        }
        
        try {
            console.log(`Joining meeting: ${this.meeting.id}`);
            
            // Set flag to prevent disconnection during joining
            window.videoSDKJoiningInProgress = true;
            
            // Store meeting globally
            window.videosdkMeeting = this.meeting;
            
            // Join meeting
            await this.meeting.join();
            
            // Update state
            this.isConnected = true;
            if (window.voiceState) window.voiceState.isConnected = true;
            if (window.voiceManager) window.voiceManager.isConnected = true;
            
            // Notify success
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
            
            // Reset state
            this.isConnected = false;
            if (window.voiceState) window.voiceState.isConnected = false;
            if (window.voiceManager) window.voiceManager.isConnected = false;
            
            window.videoSDKJoiningInProgress = false;
            window.dispatchEvent(new CustomEvent('voiceDisconnect'));
            throw error;
        }
    }

    leaveMeeting() {
        if (this.meeting) {
            try {
                // Clean up any monitoring resources
                this.cleanupParticipantResources();
                
                // Leave the meeting
                this.meeting.leave();
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
            // Clean up participant resources
            if (this.meeting?.localParticipant) {
                const participant = this.meeting.localParticipant;
                
                // Clear any stream monitoring interval
                if (participant._streamMonitorInterval) {
                    clearInterval(participant._streamMonitorInterval);
                    participant._streamMonitorInterval = null;
                }
                
                // Reset monitoring state
                participant._streamMonitoringActive = false;
                
                // Clear previous streams
                if (participant._previousStreams) {
                    participant._previousStreams.clear();
                }
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
    
    async toggleWebcam() {
        if (!this.meeting) return false;
        
        try {
            const isWebcamOn = this.getWebcamState();
            
            if (isWebcamOn) {
                await this.meeting.disableWebcam();
                return false;
            } else {
                await this.meeting.enableWebcam();
                return true;
            }
        } catch (error) {
            console.error("Error toggling webcam:", error);
            return false;
        }
    }
    
    async toggleScreenShare() {
        if (!this.meeting) return false;
        
        try {
            const isScreenSharing = this.getScreenShareState();
            
            if (isScreenSharing) {
                await this.meeting.disableScreenShare();
                return false;
            } else {
                await this.meeting.enableScreenShare();
                return true;
            }
        } catch (error) {
            console.error("Error toggling screen share:", error);
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
}

// Create global instance
const videoSDKManager = new VideoSDKManager();
window.videoSDKManager = videoSDKManager;

// Helper function to wait for SDK to load
window.waitForVideoSDK = function(callback, maxAttempts = 20) {
    let attempts = 0;
    
    const checkSDK = () => {
        if (typeof VideoSDK !== 'undefined') {
            callback();
        } else if (attempts >= maxAttempts) {
            console.error("VideoSDK failed to load");
            callback(new Error("VideoSDK failed to load"));
        } else {
            attempts++;
            setTimeout(checkSDK, 100);
        }
    };
    
    checkSDK();
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = videoSDKManager;
} else if (typeof exports !== 'undefined') {
    exports.default = videoSDKManager;
}
