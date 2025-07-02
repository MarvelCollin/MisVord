class VoicePresenceDebug {
    constructor() {
        this.events = [];
        this.maxEvents = 100;
        this.init();
    }

    init() {
        this.setupEventListeners();
        window.voicePresenceDebug = this;
        console.log('🐛 [VOICE-PRESENCE-DEBUG] Debug utility initialized');
    }

    setupEventListeners() {
        window.addEventListener('voiceConnect', (event) => {
            this.logEvent('VOICE_CONNECT', event.detail);
        });

        window.addEventListener('voiceDisconnect', () => {
            this.logEvent('VOICE_DISCONNECT', {});
        });

        window.addEventListener('ownPresenceUpdate', (event) => {
            this.logEvent('OWN_PRESENCE_UPDATE', event.detail);
        });

        if (window.globalSocketManager?.io) {
            this.setupSocketListeners();
        } else {
            window.addEventListener('globalSocketReady', () => {
                this.setupSocketListeners();
            });
        }
    }

    setupSocketListeners() {
        const socket = window.globalSocketManager.io;
        
        socket.on('user-presence-update', (data) => {
            this.logEvent('SOCKET_PRESENCE_UPDATE', data);
        });

        socket.on('voice-meeting-update', (data) => {
            this.logEvent('VOICE_MEETING_UPDATE', data);
        });
    }

    logEvent(type, data) {
        const event = {
            timestamp: new Date().toISOString(),
            type,
            data: JSON.parse(JSON.stringify(data))
        };

        this.events.unshift(event);
        
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(0, this.maxEvents);
        }

        console.log(`🐛 [VOICE-PRESENCE-DEBUG] ${type}:`, data);
    }

    getEvents() {
        return this.events;
    }

    getVoiceEvents() {
        return this.events.filter(event => 
            event.type.includes('VOICE') || 
            (event.type === 'SOCKET_PRESENCE_UPDATE' && 
             event.data.activity_details?.type === 'In Voice Call') ||
            (event.type === 'OWN_PRESENCE_UPDATE' && 
             event.data.activity_details?.type === 'In Voice Call')
        );
    }

    printVoiceEvents() {
        console.table(this.getVoiceEvents());
    }

    testVoicePresenceFlow() {
        console.log('🧪 [VOICE-PRESENCE-TEST] Starting voice presence test...');
        
        const currentUserId = window.globalSocketManager?.userId;
        if (!currentUserId) {
            console.error('❌ [VOICE-PRESENCE-TEST] No current user ID found');
            return;
        }

        console.log('👤 [VOICE-PRESENCE-TEST] Current user ID:', currentUserId);

        if (window.FriendsManager) {
            const friendsManager = window.FriendsManager.getInstance();
            const onlineUsers = friendsManager.cache.onlineUsers || {};
            const currentUserOnline = onlineUsers[currentUserId];
            
            console.log('📊 [VOICE-PRESENCE-TEST] Current user online status:', currentUserOnline);
            console.log('📊 [VOICE-PRESENCE-TEST] Total online users:', Object.keys(onlineUsers).length);
        }

        if (window.globalSocketManager?.isReady()) {
            console.log('✅ [VOICE-PRESENCE-TEST] Socket is ready');
            
            window.globalSocketManager.updatePresence('online', { type: 'In Voice Call' });
            console.log('📡 [VOICE-PRESENCE-TEST] Sent test presence update: In Voice Call');
            
            setTimeout(() => {
                window.globalSocketManager.updatePresence('online', { type: 'idle' });
                console.log('📡 [VOICE-PRESENCE-TEST] Sent test presence update: idle');
            }, 3000);
        } else {
            console.error('❌ [VOICE-PRESENCE-TEST] Socket not ready');
        }
    }

    checkActiveNowDisplay() {
        const activeNowContainer = document.getElementById('active-friends-list') || 
                                  document.getElementById('global-active-friends-list');
        
        if (!activeNowContainer) {
            console.warn('⚠️ [VOICE-PRESENCE-DEBUG] Active Now container not found');
            return;
        }

        const voiceCallUsers = Array.from(activeNowContainer.children).filter(child => {
            const activityText = child.querySelector('.text-xs.text-gray-400')?.textContent;
            return activityText && activityText.includes('In Voice Call');
        });

        console.log('🎤 [VOICE-PRESENCE-DEBUG] Users shown as "In Voice Call":', voiceCallUsers.length);
        voiceCallUsers.forEach(user => {
            const username = user.querySelector('.font-semibold')?.textContent;
            console.log('  -', username);
        });
    }

    clear() {
        this.events = [];
        console.log('🧹 [VOICE-PRESENCE-DEBUG] Events cleared');
    }

    static getInstance() {
        if (!window._voicePresenceDebug) {
            window._voicePresenceDebug = new VoicePresenceDebug();
        }
        return window._voicePresenceDebug;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    VoicePresenceDebug.getInstance();
});

window.VoicePresenceDebug = VoicePresenceDebug; 