const VOICE_EVENTS = {
    // Connection events
    VOICE_CONNECT: 'voiceConnect',
    VOICE_DISCONNECT: 'voiceDisconnect',
    VOICE_STATE_CHANGED: 'voiceStateChanged',
    VOICE_UI_READY: 'voiceUIReady',
    
    // VideoSDK events
    VIDEOSDK_STREAM_ENABLED: 'videosdkStreamEnabled',
    VIDEOSDK_STREAM_DISABLED: 'videosdkStreamDisabled',
    VIDEOSDK_MEETING_JOINED: 'videosdkMeetingFullyJoined',
    
    // UI events
    VIDEO_GRID_UPDATE: 'videoGridUpdate'
};

const STREAM_TYPES = {
    AUDIO: 'audio',
    VIDEO: 'video',
    SCREEN_SHARE: 'share'
};

const CONNECTION_STATES = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    ERROR: 'error'
};

window.VOICE_EVENTS = VOICE_EVENTS;
window.STREAM_TYPES = STREAM_TYPES;
window.CONNECTION_STATES = CONNECTION_STATES; 