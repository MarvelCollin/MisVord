class VoicePresenceDebug {
    constructor() {
        this.events = [];
        this.maxEvents = 100;
        this.init();
    }

    init() {
        this.setupEventListeners();
        window.voicePresenceDebug = this;

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
        if (!window.globalSocketManager || !window.globalSocketManager.io) {
            console.warn('[VOICE-PRESENCE-DEBUG] GlobalSocketManager or socket not available, retrying in 1 second...');
            setTimeout(() => {
                this.setupSocketListeners();
            }, 1000);
            return;
        }
        
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


    }

    getEvents() {
        return this.events;
    }

    getVoiceEvents() {
        return this.events.filter(event => 
            event.type.includes('VOICE') || 
            (event.type === 'SOCKET_PRESENCE_UPDATE' && 
             event.data.activity_details?.type?.startsWith('In Voice - ')) ||
            (event.type === 'OWN_PRESENCE_UPDATE' && 
             event.data.activity_details?.type?.startsWith('In Voice - '))
        );
    }

    printVoiceEvents() {
        console.table(this.getVoiceEvents());
    }

    testVoicePresenceFlow() {

        
        const currentUserId = window.globalSocketManager?.userId;
        if (!currentUserId) {
            console.error('❌ [VOICE-TEST] No current user ID found');
            return;
        }



        if (window.FriendsManager) {
            const friendsManager = window.FriendsManager.getInstance();
            const onlineUsers = friendsManager.cache.onlineUsers || {};
            const currentUserOnline = onlineUsers[currentUserId];
            


        }

        if (window.globalSocketManager?.isReady()) {

            
            window.globalSocketManager.updatePresence('online', { 
                type: 'In Voice - Test Channel',
                channel_name: 'Test Channel'
            });


            
            setTimeout(() => {
                window.globalSocketManager.updatePresence('online', { type: 'idle' });


            }, 3000);
        } else {
            console.error('❌ [VOICE-TEST] Socket not ready');
        }
    }

    testVoiceCallProtection() {

        
        if (!window.globalSocketManager?.isReady()) {
            console.error('❌ [VOICE-PROTECTION] Socket not ready');
            return;
        }


        window.globalSocketManager.updatePresence('online', { 
            type: 'In Voice - Test Channel',
            channel_name: 'Test Channel'
        });
        

        window.globalSocketManager.lastActivityTime = Date.now() - 25000;
        window.globalSocketManager.isUserActive = true;
        

        const timeSinceActivity = Date.now() - window.globalSocketManager.lastActivityTime;
        
        if (timeSinceActivity >= window.globalSocketManager.afkTimeout && window.globalSocketManager.isUserActive) {
            if (window.globalSocketManager.currentActivityDetails?.type?.startsWith('In Voice - ')) {

            } else {

            }
        }
        
        setTimeout(() => {

            window.globalSocketManager.updatePresence('online', { type: 'idle' });
            
            setTimeout(() => {
                const timeSinceActivity2 = Date.now() - window.globalSocketManager.lastActivityTime;
                if (timeSinceActivity2 >= window.globalSocketManager.afkTimeout && window.globalSocketManager.isUserActive) {
                    if (!window.globalSocketManager.currentActivityDetails?.type?.startsWith('In Voice - ')) {

                    } else {

                    }
                }
            }, 1000);
        }, 2000);
    }

    checkActiveNowDisplay() {
        const activeNowContainer = document.getElementById('active-friends-list') || 
                                  document.getElementById('global-active-friends-list');
        
        if (!activeNowContainer) {
            console.warn('⚠️ [VOICE-DEBUG] Active Now container not found');
            return;
        }

        const voiceCallUsers = Array.from(activeNowContainer.children).filter(child => {
            const activityText = child.querySelector('.text-xs.text-gray-400')?.textContent;
            return activityText && activityText.includes('In Voice -');
        });


        voiceCallUsers.forEach(user => {
            const username = user.querySelector('.font-semibold')?.textContent;

        });
    }

    clear() {
        this.events = [];

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