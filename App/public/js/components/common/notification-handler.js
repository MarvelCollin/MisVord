class GlobalNotificationHandler {
    constructor() {
        this.socket = null;
        this.currentUserId = null;
        this.currentNotification = null;
        this.processedNotifications = new Set();
        this.init();
        this.addNotificationStyles();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.waitForSocket().then(() => {
                this.currentUserId = window.globalSocketManager.userId;
                this.listenForNotifications();
            }).catch(error => {
                console.error("Socket manager not available for notifications.", error);
            });
        });
    }

    waitForSocket() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 20;
            let attempts = 0;
            const interval = setInterval(() => {
                if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                    clearInterval(interval);
                    this.socket = window.globalSocketManager.io;
                    resolve();
                } else if (attempts++ > maxAttempts) {
                    clearInterval(interval);
                    reject(new Error("Socket manager did not become ready in time."));
                }
            }, 500);
        });
    }

    listenForNotifications() {
        if (!this.socket) return;

        this.socket.on('mention_notification', (data) => {
            this.handleMentionNotification(data);
        });
    }

    handleMentionNotification(data) {
        console.log('📧 [NOTIFICATION] Received mention notification:', {
            type: data.type,
            user_id: data.user_id,
            currentUserId: this.currentUserId,
            message_id: data.message_id,
            content: data.content?.substring(0, 50) + '...'
        });
        
        if (!this.currentUserId) {
            this.currentUserId = window.globalSocketManager?.userId;
            if(!this.currentUserId) return;
        };

        const notificationId = `${data.message_id || data.timestamp || Date.now()}-${data.user_id}-${data.type}`;
        
        if (this.processedNotifications.has(notificationId)) {
            console.log('📧 [NOTIFICATION] Duplicate notification ignored:', notificationId);
            return;
        }
        
        this.processedNotifications.add(notificationId);
        
        setTimeout(() => {
            this.processedNotifications.delete(notificationId);
        }, 30000);

        const isUserMention = data.type === 'user' && data.mentioned_user_id?.toString() === this.currentUserId.toString();
        const isAllMention = data.type === 'all' && data.user_id?.toString() !== this.currentUserId.toString();
        const isRoleMention = data.type === 'role' && data.mentioned_user_id?.toString() === this.currentUserId.toString();
        
        console.log('📧 [NOTIFICATION] Mention check results:', {
            isUserMention,
            isAllMention,
            isRoleMention,
            willShow: isUserMention || isAllMention || isRoleMention
        });

        if (isUserMention || isAllMention || isRoleMention) {
            this.showNotification(data, isAllMention, isRoleMention);
            this.playNotificationSound();
        }
    }

    showNotification(data, isAllMention, isRoleMention) {

        console.log('🔍 [NOTIFICATION] Server ID analysis:', {
            'data.server_id': data.server_id,
            'data.context.server_id': data.context?.server_id,
            'data.context': data.context,
            'typeof server_id': typeof data.server_id,
            'typeof context.server_id': typeof data.context?.server_id
        });
        
        this.clearExistingNotifications();
        
        const mentionerUsername = data.username;
        const mentionerAvatar = data.avatar_url || '/public/assets/common/default-profile-picture.png';
        const channelName = data.context.channel_name || 'Channel';
        const serverName = data.context.server_name || 'Server';
        const serverIcon = data.context.server_icon || '/public/assets/common/default-profile-picture.png';
        const title = `New Mention in ${channelName}`;
        
        let mentionColor = 'from-blue-500 to-indigo-600';
        let mentionText = 'mention';
        
        if (isAllMention) {
            mentionColor = 'from-orange-500 to-red-500';
            mentionText = 'all';
        } else if (isRoleMention) {
            mentionColor = 'from-purple-500 to-pink-500';
            mentionText = 'role';
        }
        
        const notificationElement = document.createElement('div');
        notificationElement.className = 'notification-toast fixed top-4 right-4 z-[9999] opacity-0 transform translate-x-full transition-all duration-300 ease-out';
        notificationElement.style.maxWidth = '400px';
        notificationElement.style.zIndex = '99999';
        
        const notificationHTML = `
            <div class="bg-gradient-to-r ${mentionColor} p-1 rounded-lg shadow-2xl">
                <div class="bg-[#2b2d31] rounded-md p-4 border border-gray-600">
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0">
                            <div class="w-10 h-10 bg-gradient-to-br ${mentionColor} rounded-full flex items-center justify-center overflow-hidden">
                                <img src="${mentionerAvatar}" alt="${mentionerUsername}" class="w-full h-full object-cover">
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-2 mb-1">
                                <img src="${serverIcon}" alt="${serverName}" class="w-5 h-5 rounded-full object-cover">
                                <h3 class="text-white font-semibold text-sm truncate">${title}</h3>
                            </div>
                            <p class="text-gray-300 text-xs mb-2">
                                <span class="font-medium text-blue-400">@${mentionerUsername}</span> mentioned ${mentionText} in 
                                <span class="font-medium text-green-400">${serverName}</span>
                            </p>
                            <div class="bg-[#1e1f22] rounded p-2 border-l-4 border-blue-500">
                                <p class="text-gray-200 text-xs leading-relaxed">${data.content}</p>
                            </div>
                            <div class="mt-2 flex justify-end">
                                <button class="notification-view-btn px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
                                    View Message
                                </button>
                            </div>
                        </div>
                        <button class="notification-close-btn text-gray-400 hover:text-white text-lg font-bold">&times;</button>
                    </div>
                </div>
            </div>
        `;
        
        notificationElement.innerHTML = notificationHTML;
        document.body.appendChild(notificationElement);
        
        setTimeout(() => {
            notificationElement.classList.remove('opacity-0', 'translate-x-full');
            notificationElement.classList.add('opacity-100', 'translate-x-0');
        }, 100);
        
        const closeBtn = notificationElement.querySelector('.notification-close-btn');
        closeBtn.addEventListener('click', () => this.hideNotification(notificationElement));
        
        const viewBtn = notificationElement.querySelector('.notification-view-btn');
        viewBtn.addEventListener('click', () => {
            this.navigateToMention(data);
            this.hideNotification(notificationElement);
        });
        
        this.autoHideTimeout = setTimeout(() => {
            this.hideNotification(notificationElement);
        }, 10000);
        
        this.currentNotification = notificationElement;
    }

    hideNotification(notificationElement) {
        if (notificationElement) {
            notificationElement.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => {
                if (notificationElement.parentNode) {
                    notificationElement.parentNode.removeChild(notificationElement);
                }
            }, 300);
        }
        
        if (this.autoHideTimeout) {
            clearTimeout(this.autoHideTimeout);
            this.autoHideTimeout = null;
        }
    }

    clearExistingNotifications() {
        if (this.currentNotification) {
            this.hideNotification(this.currentNotification);
            this.currentNotification = null;
        }
        
        const existingNotifications = document.querySelectorAll('.notification-toast');
        existingNotifications.forEach(notification => {
            this.hideNotification(notification);
        });
    }

    addNotificationStyles() {
        if (document.getElementById('notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slide-in {
                from {
                    transform: translateX(100%) scale(0.9);
                    opacity: 0;
                }
                to {
                    transform: translateX(0) scale(1);
                    opacity: 1;
                }
            }
            
            @keyframes slide-out-right {
                from {
                    transform: translateX(0) scale(1);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%) scale(0.9);
                    opacity: 0;
                }
            }
            
            .animate-slide-in {
                animation: slide-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            
            .notification-card {
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
            }
            
            .notification-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: inherit;
                background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    }

    playNotificationSound() {
        try {
            const audio = new Audio('/public/assets/sound/discordo_sound.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => {});
        } catch (error) {
        }
    }

    async navigateToMention(data) {
        try {

            console.log('🔍 [NOTIFICATION] Server ID detection analysis:', {
                'data.server_id': data.server_id,
                'data.context.server_id': data.context?.server_id,
                'current_location': window.location.href,
                'current_pathname': window.location.pathname
            });
            
            if (data.target_type === 'channel' && data.target_id) {
                let serverId = null;
                
                if (data.server_id) {
                    serverId = data.server_id;

                } else if (data.context && data.context.server_id) {
                    serverId = data.context.server_id;

                } else {
                    console.warn('⚠️ [NOTIFICATION] No server_id in notification data or context!');


                    
                    const currentPath = window.location.pathname;
                    const serverMatch = currentPath.match(/\/server\/(\d+)/);
                    if (serverMatch) {
                        serverId = serverMatch[1];

                    } else {
                        console.error('❌ [NOTIFICATION] Cannot determine server_id for navigation');
                        return;
                    }
                }
                


                
                const currentPath = window.location.pathname;
                const currentServerMatch = currentPath.match(/\/server\/(\d+)/);
                const currentServerId = currentServerMatch ? currentServerMatch[1] : null;
                
                console.log('🔄 [NOTIFICATION] Navigation comparison:', {
                    currentServerId: currentServerId,
                    targetServerId: serverId,
                    sameServer: currentServerId === serverId.toString()
                });
                
                if (currentServerId === serverId.toString()) {

                    
                    if (window.simpleChannelSwitcher && typeof window.simpleChannelSwitcher.switchToChannel === 'function') {

                        await window.simpleChannelSwitcher.switchToChannel(data.target_id, 'text', true, data.message_id);

                        
                        if (data.message_id) {
                            setTimeout(() => {
                                if (window.MessageHighlighter && typeof window.MessageHighlighter.highlightMessage === 'function') {

                                    window.MessageHighlighter.highlightMessage(data.message_id);
                                }
                            }, 1500);
                        }
                        return;
                    } else {
                        console.warn('⚠️ [NOTIFICATION] SimpleChannelSwitcher not available, falling back to URL navigation');

                    }
                }
                
                const targetUrl = `/server/${serverId}?channel=${data.target_id}&type=text${data.message_id ? '#message-' + data.message_id : ''}`;

                
                window.location.href = targetUrl;
                
            } else if (data.target_type === 'dm' && data.target_id) {

                const targetUrl = `/home/channels/dm/${data.target_id}${data.message_id ? '#message-' + data.message_id : ''}`;

                window.location.href = targetUrl;
            } else {
                console.warn('⚠️ [NOTIFICATION] Invalid navigation data:', data);
            }
        } catch (error) {
            console.error('❌ [NOTIFICATION] Navigation error:', error);
        }
    }
}

window.testNotificationNavigation = function(testServerId = 13, testChannelId = 13, testMessageId = 'test-123') {

    
    const testData = {
        target_type: 'channel',
        target_id: testChannelId,
        server_id: testServerId,
        message_id: testMessageId,
        context: {
            server_id: testServerId,
            server_name: 'Test Server',
            channel_name: 'Test Channel'
        },
        username: 'TestUser',
        content: 'This is a test mention'
    };
    

    
    if (window.globalNotificationHandler) {
        window.globalNotificationHandler.navigateToMention(testData).catch(error => {
            console.error('❌ [NOTIFICATION-TEST] Navigation error:', error);
        });
    } else {
        console.error('❌ [NOTIFICATION-TEST] globalNotificationHandler not found');
    }
};

window.debugCurrentLocation = function() {
    console.log('🔍 [LOCATION-DEBUG] Current location analysis:', {
        href: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        serverMatch: window.location.pathname.match(/\/server\/(\d+)/),
        channelParam: new URLSearchParams(window.location.search).get('channel'),
        metaServerId: document.querySelector('meta[name="server-id"]')?.content,
        metaChannelId: document.querySelector('meta[name="channel-id"]')?.content
    });
};

window.testCorrectServerNavigation = function() {

    
    if (window.location.pathname.includes('/server/14')) {

        window.testNotificationNavigation(13, 13, 'test-server-13');
    } else if (window.location.pathname.includes('/server/13')) {

        window.testNotificationNavigation(14, 13, 'test-server-14');
    } else {

        window.testNotificationNavigation(13, 13, 'test-general');
    }
};

window.testAllMentionNotification = function() {

    
    const testAllMentionData = {
        type: 'all',
        message_id: 'test-all-' + Date.now(),
        content: 'This is a test @all mention',
        user_id: '999',
        username: 'TestUser',
        avatar_url: '/public/assets/common/default-profile-picture.png',
        channel_id: 13,
        target_type: 'channel',
        target_id: 13,
        server_id: 13,
        timestamp: Date.now(),
        context: {
            server_id: 13,
            server_name: 'Test Server',
            channel_name: 'Test Channel',
            server_icon: '/public/assets/common/main-logo.png'
        }
    };
    

    
    if (window.globalNotificationHandler) {
        window.globalNotificationHandler.handleMentionNotification(testAllMentionData);

    } else {
        console.error('❌ [ALL-MENTION-TEST] globalNotificationHandler not found');
    }
};

new GlobalNotificationHandler(); 