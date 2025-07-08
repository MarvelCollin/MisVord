if (typeof window.VideoSDKManager === 'undefined') {
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
        this.presenceMonitorInterval = null;
        this.lastPresenceCheck = null;
        this.joiningInProgress = false;
        this.processedParticipants = new Set();
        this.startPresenceMonitoring();
    }

    startPresenceMonitoring() {
        if (this.presenceMonitorInterval) {
            clearInterval(this.presenceMonitorInterval);
        }
        
        this.presenceMonitorInterval = setInterval(() => {
            this.checkAndSyncPresence();
        }, 2000);
    }

    checkAndSyncPresence() {
        if (this.joiningInProgress) {
            return;
        }
        
        const isActuallyInVoice = this.isConnected && this.isMeetingJoined && this.meeting;
        const sessionInVoice = sessionStorage.getItem('isInVoiceCall') === 'true';
        const currentActivity = window.globalSocketManager?.currentActivityDetails?.type || '';
        const isPresenceInVoice = currentActivity.startsWith('In Voice');
        
        const currentState = {
            videoSDKConnected: isActuallyInVoice,
            sessionMarker: sessionInVoice,
            presenceInVoice: isPresenceInVoice,
            activityType: currentActivity
        };
        
        const stateSignature = `${currentState.videoSDKConnected}:${currentState.sessionMarker}:${currentState.presenceInVoice}:${currentState.activityType}`;
        
        if (stateSignature === this.lastPresenceCheck) {
            return;
        }
        
        this.lastPresenceCheck = stateSignature;
        

        
        if (!isActuallyInVoice && (sessionInVoice || isPresenceInVoice)) {

            this.forcePresenceReset();
        } else if (isActuallyInVoice && !isPresenceInVoice) {

            this.syncPresenceToVoice();
        }
    }

    forcePresenceReset() {

        const isExplicitLeave = window.participantCoordinator?.explicitLeaveRequested || false;
        
        sessionStorage.removeItem('isInVoiceCall');
        sessionStorage.removeItem('voiceChannelName');
        
        if (window.globalSocketManager) {
            window.globalSocketManager.updatePresence('online', { type: 'active' }, 'videosdk-force-reset');
        }
        
        if (window.voiceManager) {
            window.voiceManager.isConnected = false;
        }
        

        if (isExplicitLeave) {
            window.dispatchEvent(new CustomEvent('voiceDisconnect'));
            window.dispatchEvent(new CustomEvent('presenceForceReset', { 
                detail: { reason: 'VideoSDK not connected' } 
            }));
        }
    }

    syncPresenceToVoice() {
        if (!this.isConnected || !this.isMeetingJoined) return;
        
        const channelName = sessionStorage.getItem('voiceChannelName') || 'Voice Channel';
        const channelId = document.querySelector('meta[name="channel-id"]')?.content;
        

        
        if (window.globalSocketManager?.isReady()) {
            const activityDetails = {
                type: `In Voice - ${channelName}`,
                state: 'In a voice channel',
                details: channelName,
                channel_id: channelId,
                channel_name: channelName,
            };
            window.globalSocketManager.updatePresence('online', activityDetails, 'videosdk-sync');
        }
    }

    async getAuthToken() {

        return this.fallbackToken;
    }

    async init(authToken = null) {
        if (this.initialized) {
            
            return this;
        }
        
        
        
        if (!authToken) {
            
            authToken = await this.getAuthToken();
        }
        
        if (!authToken) {
            throw new Error("No auth token available for VideoSDK initialization");
        }
        
        if (typeof VideoSDK === 'undefined') {
            throw new Error("VideoSDK not loaded - make sure the VideoSDK script is included");
        }
        
        
        this.authToken = authToken;
        VideoSDK.config(authToken);
        this.initialized = true;
        
        
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


    

    async externalInitMeeting(meetingId, participantName, micEnabled = true, webcamEnabled = false) {
        if (!this.initialized) {
            throw new Error("VideoSDK not initialized - call init() first");
        }
        
        if (typeof VideoSDK === 'undefined') {
            throw new Error("VideoSDK library not loaded");
        }
        
        try {

            

            this.meeting = VideoSDK.initMeeting({
                meetingId: meetingId,
                name: participantName,
                micEnabled: micEnabled,
                webcamEnabled: webcamEnabled
            });
            
            if (!this.meeting) {
                throw new Error("Failed to initialize meeting object");
            }
            

            

            this.setupEvents();
            
            return true;
        } catch (error) {
            console.error('[VideoSDK External] ❌ Failed to initialize meeting:', error);
            this.meeting = null;
            throw error;
        }
    }
    
    async externalJoinMeeting() {
        if (!this.meeting) {
            throw new Error("Meeting not initialized - call externalInitMeeting first");
        }
        
        try {
            this.joiningInProgress = true;
            
            this.isConnected = true;
            this.meeting.join();
            



            if (window.globalSocketManager) {
                const channelName = document.querySelector('meta[name="channel-name"]')?.content || 'Voice';
                window.globalSocketManager.updatePresence(
                    'online', 
                    { type: `In Voice - ${channelName}` },
                    'videosdk-join'
                );
                sessionStorage.setItem('isInVoiceCall', 'true');
                sessionStorage.setItem('voiceChannelName', channelName);
            }
            
            await this.waitForMeetingJoined();
            
            const channelId = document.querySelector('meta[name="channel-id"]')?.content;
            const channelName = document.querySelector('.voice-section .channel-name, .voice-channel-title, #channel-name')?.textContent || 'Voice Channel';
            
            if (window.globalSocketManager?.isReady()) {
                const activityDetails = {
                    type: `In Voice - ${channelName}`,
                    state: 'In a voice channel',
                    details: channelName,
                    channel_id: channelId,
                    channel_name: channelName,
                };
                window.globalSocketManager.updatePresence('online', activityDetails);

                



            }

            window.dispatchEvent(new CustomEvent('voiceConnect', {
                detail: { 
                    meetingId: this.meeting.id,
                    channelName: channelName,
                    channelId: channelId 
                }
            }));
            

            return true;
        } catch (error) {
            this.isConnected = false;
            this.isMeetingJoined = false;
            this.joiningInProgress = false;
            this.isDeafened = false;
            if (window.voiceState) window.voiceState.isConnected = false;
            if (window.voiceManager) window.voiceManager.isConnected = false;
            
            window.dispatchEvent(new CustomEvent('voiceDisconnect'));
            sessionStorage.removeItem('isInVoiceCall');
            sessionStorage.removeItem('voiceChannelName');
            throw error;
        }
    }
    

    markExternalJoinSuccess() {
        this.isConnected = true;
        this.isMeetingJoined = true;
        this.joiningInProgress = false;

        

        if (window.voiceManager) {
            window.voiceManager.isConnected = true;
            window.voiceJoinInProgress = false;
            window.videoSDKJoiningInProgress = false;
            
            if (window.MusicLoaderStatic?.stopCallSound) {
                window.MusicLoaderStatic.stopCallSound();
            }
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
                    this.isMeetingJoined = true;
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('videosdkMeetingFullyJoined'));
                    }, 100);
                } else if (eventName === 'meeting-left') {

                    this.isMeetingJoined = false;
                } else if (eventName === 'participant-joined') {

                    const participant = args[0];
                    if (participant && participant.id) {
                        this.handleParticipantJoined(participant);
                    }
                } else if (eventName === 'participant-left') {

                    const participant = args[0];
                    if (participant && participant.id) {
                        this.handleParticipantLeft(participant);
                    }
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
    }
    
    handleParticipantJoined(participant) {
        if (!participant || !participant.id) {
            return;
        }

        if (this.processedParticipants.has(participant.id)) {
            return;
        }

        this.processedParticipants.add(participant.id);

        this.registerStreamEvents(participant);
        this.startStreamMonitoring(participant);
        
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('videosdkParticipantJoined', {
                detail: { participant: participant.id, participantObj: participant }
            }));
        }, 50);
    }
    
    handleParticipantLeft(participant) {
        if (!participant || !participant.id) {
            return;
        }

        this.processedParticipants.delete(participant.id);
        
        this.cleanupParticipantResourcesById(participant.id);
        
        window.dispatchEvent(new CustomEvent('videosdkParticipantLeft', {
            detail: { participant: participant.id }
        }));
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

                    stream = new MediaStream([data.track]);
                    kind = data.track.kind === 'video' ? 'video' : 'audio';
                }
                
                if (kind === 'unknown' && stream) {
                    kind = this.detectStreamKind(stream, data);
                }
                
                if (kind === 'video' && stream) {
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
                    detail: { kind, participant: participant.id, data } 
                }));
            });
            
            setTimeout(() => {
                this.checkExistingStreamsForParticipant(participant);
            }, 500);
            
        } catch (error) {
            console.error("Error registering stream events:", error);
        }
    }
    
    checkExistingStreamsForParticipant(participant) {
        if (!participant || !participant.streams) return;
        

        
        participant.streams.forEach((stream, streamId) => {
            if (stream && stream.track && stream.track.kind === 'video') {
                const kind = this.detectStreamKind(stream, { stream, streamId });
                

                
                window.dispatchEvent(new CustomEvent('videosdkStreamEnabled', { 
                    detail: { kind, stream, participant: participant.id, data: { stream, streamId } } 
                }));
            }
        });
    }
    
    detectStreamKind(stream, data) {
        if (stream instanceof MediaStream) {
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length > 0) {
                const track = videoTracks[0];
                const isScreenShare = track.label && (
                    track.label.toLowerCase().includes('screen') || 
                    track.label.toLowerCase().includes('display')
                );
                return isScreenShare ? 'share' : 'video';
            } else {
                return 'audio';
            }
        } else if (stream.stream instanceof MediaStream) {
            const videoTracks = stream.stream.getVideoTracks();
            if (videoTracks.length > 0) {
                const track = videoTracks[0];
                const isScreenShare = track.label && (
                    track.label.toLowerCase().includes('screen') || 
                    track.label.toLowerCase().includes('display')
                );
                return isScreenShare ? 'share' : 'video';
            } else {
                return 'audio';
            }
        } else if (stream.track?.kind === 'video') {
            const isScreenShare = stream.track.label && (
                stream.track.label.toLowerCase().includes('screen') || 
                stream.track.label.toLowerCase().includes('display')
            );
            return isScreenShare ? 'share' : 'video';
        } else if (stream.track?.kind === 'audio') {
            return 'audio';
        }
        return 'video';
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
                        let kind = this.detectStreamKind(stream, { stream, streamId });
                        

                        
                        participant._previousStreams.set(streamId, kind);
                        
                        if (kind === 'video' || kind === 'share') {
                            window.dispatchEvent(new CustomEvent('videosdkStreamEnabled', {
                                detail: { 
                                    participant: participant.id,
                                    stream: stream,
                                    kind: kind,
                                    data: { stream, streamId }
                                }
                            }));
                        }
                    }
                });
                
                participant._previousStreams.forEach((kind, streamId) => {
                    if (!participant.streams.has(streamId)) {

                        
                        if (kind === 'video' || kind === 'share') {
                            window.dispatchEvent(new CustomEvent('videosdkStreamDisabled', {
                                detail: { 
                                    participant: participant.id,
                                    stream: null,
                                    kind: kind,
                                    data: { streamId }
                                }
                            }));
                        }
                        
                        participant._previousStreams.delete(streamId);
                    }
                });
            } catch (error) {
                console.error('[VideoSDK] Stream monitoring error:', error);
            }
        }, 1000);
        
        participant._streamMonitorInterval = interval;
        participant._streamMonitoringActive = true;
        

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

    async leaveMeeting() {
        try {
            if (this.meeting) {
                const leaveResult = this.meeting.leave();

                if (leaveResult && typeof leaveResult.then === 'function') {
                    await leaveResult.catch(err => {
                        console.warn('[VideoSDK] meeting.leave() rejected:', err);
                    });
                }
            } else {
                console.warn('[VideoSDK] No active meeting instance when trying to leave.');
            }
        } catch (err) {
            console.error('[VideoSDK] Unexpected error while leaving meeting:', err);
        }

        this.cleanupParticipantResources();

        this.isMeetingJoined = false;
        this.isConnected = false;
        this.joiningInProgress = false;
        this.meeting = null;
        this.processedParticipants.clear();

        sessionStorage.removeItem('isInVoiceCall');
        sessionStorage.removeItem('voiceChannelName');

        if (window.globalSocketManager) {
            window.globalSocketManager.updatePresence('online', { type: 'active' }, 'videosdk-leave');
        }

        if (window.voiceManager) {
            window.voiceManager.isConnected = false;
        }

        window.dispatchEvent(new CustomEvent('voiceDisconnect'));
        window.dispatchEvent(new CustomEvent('presenceForceReset', { 
            detail: { reason: 'Meeting left' } 
        }));

        this.checkAndSyncPresence();
    }
    
    cleanupParticipantResources() {
        if (window.globalSocketManager) {
            window.globalSocketManager.updatePresence('online', { type: 'active' }, 'videosdk-cleanup');
        }
        sessionStorage.removeItem('isInVoiceCall');
        sessionStorage.removeItem('voiceChannelName');
        
        try {
            if (this.meeting?.participants) {

                
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

            
            window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                detail: { type: 'deafen', state: this.isDeafened }
            }));
            
            return this.isDeafened;
        }
        
        try {
            const wasDeafened = this.getDeafenState();
            
            if (wasDeafened) {
                this.isDeafened = false;

            } else {
                this.meeting.muteMic();
                this._micState = false;
                this.isDeafened = true;

            }
            
            if (window.ChannelVoiceParticipants) {
                setTimeout(() => {
                    const instance = window.ChannelVoiceParticipants.getInstance();
                    if (instance && typeof instance.syncWithVideoSDK === 'function') {
                        instance.syncWithVideoSDK();
                    }
                }, 100);
            }
            
            window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                detail: { type: 'deafen', state: this.isDeafened }
            }));
            


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

            const stream = await navigator.mediaDevices.getUserMedia({ video: true });

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

            return this.getWebcamState();
        }
        
        this._webcamToggling = true;
        
        try {

            
            if (!this.meeting || !this.isConnected || !this.isMeetingJoined || !this.meeting.localParticipant) {
                console.error('[VideoSDK] Meeting not ready for webcam toggle');
                window.showToast?.('Voice not fully connected. Please wait a moment and try again.', 'error');
                return false;
            }
            
            const isWebcamOn = this.getWebcamState();

            
            if (isWebcamOn) {

                await this.meeting.disableWebcam();
                this._webcamState = false;

                
                window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                    detail: { type: 'video', state: false }
                }));
                
                if (window.voiceCallManager) {
                    setTimeout(() => window.voiceCallManager.updateGrid(), 100);
                }
                
                return false;
            } else {

                const hasPermission = await this.checkCameraPermission();
                if (!hasPermission) {
                    console.error('[VideoSDK] Camera permission denied');
                    return false;
                }
                

                await this.meeting.enableWebcam();
                this._webcamState = true;

                
                window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                    detail: { type: 'video', state: true }
                }));
                
                if (window.voiceCallManager) {
                    setTimeout(() => window.voiceCallManager.updateGrid(), 100);
                }
                
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

                
                window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                    detail: { type: 'screen', state: false }
                }));
                
                if (window.voiceCallManager) {
                    setTimeout(() => window.voiceCallManager.updateGrid(), 100);
                }
                
                return false;
            } else {
                await this.meeting.enableScreenShare();
                this._screenShareState = true;

                
                window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                    detail: { type: 'screen', state: true }
                }));
                
                if (window.voiceCallManager) {
                    setTimeout(() => window.voiceCallManager.updateGrid(), 100);
                }
                
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
    
    getMicState() {
        if (this._micState !== undefined) {
            return this._micState;
        }
        
        if (!this.meeting?.localParticipant) return false;
        
        try {
            const participant = this.meeting.localParticipant;
            const micStream = participant.streams.get('mic');
            return micStream ? !micStream.track.enabled : false;
        } catch (error) {
            console.error("Error getting mic state:", error);
            return false;
        }
    }
    
    getWebcamState() {
        if (this._webcamState !== undefined) {
            return this._webcamState;
        }
        
        if (!this.meeting?.localParticipant) return false;
        
        try {
            const participant = this.meeting.localParticipant;
            const webcamStream = participant.streams.get('webcam');
            return webcamStream ? webcamStream.track.enabled : false;
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
            const participant = this.meeting.localParticipant;
            const shareStream = participant.streams.get('share');
            return shareStream ? shareStream.track.enabled : false;
        } catch (error) {
            console.error("Error getting screen share state:", error);
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



    async preload() {
        if (this.initialized) {
            
            return true;
        }
        
        
        
        try {
            const authToken = await this.getAuthToken();
            await this.init(authToken);
            
            return true;
        } catch (error) {
            console.warn('[VideoSDK] Preload failed:', error);
            return false;
        }
    }

    static getInstance() {
        if (!window.videoSDKManager) {
            window.videoSDKManager = new VideoSDKManager();
        }
        return window.videoSDKManager;
    }
}

window.VideoSDKManager = VideoSDKManager;
}

if (!window.videoSDKManager) {
    const videoSDKManager = new VideoSDKManager();
    window.videoSDKManager = videoSDKManager;
} else {
}

window.addEventListener('beforeunload', () => {
    if (window.videoSDKManager?.isConnected) {

        if (window.globalSocketManager) {
            window.globalSocketManager.updatePresence('online', { type: 'active' }, 'page-unload');
        }
        sessionStorage.removeItem('isInVoiceCall');
        sessionStorage.removeItem('voiceChannelName');
    }
});

window.addEventListener('pagehide', () => {
    if (window.videoSDKManager?.isConnected) {

        if (window.globalSocketManager) {
            window.globalSocketManager.updatePresence('online', { type: 'active' }, 'page-hide');
        }
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.videoSDKManager;
} else if (typeof exports !== 'undefined') {
    exports.default = window.videoSDKManager;
}
