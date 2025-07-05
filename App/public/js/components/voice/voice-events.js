if (typeof window.VOICE_EVENTS === 'undefined') {
const VOICE_EVENTS = {
    VOICE_CONNECT: 'voiceConnect',
    VOICE_DISCONNECT: 'voiceDisconnect',
    VOICE_STATE_CHANGED: 'voiceStateChanged',
    VOICE_UI_READY: 'voiceUIReady',
    
    VIDEOSDK_STREAM_ENABLED: 'videosdkStreamEnabled',
    VIDEOSDK_STREAM_DISABLED: 'videosdkStreamDisabled',
    VIDEOSDK_MEETING_JOINED: 'videosdkMeetingFullyJoined',
    

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
} 