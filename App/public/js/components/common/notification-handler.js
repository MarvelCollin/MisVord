class GlobalNotificationHandler {
    constructor() {
        this.socket = null;
        this.currentUserId = null;
        this.init();
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
        if (!this.currentUserId) {
            this.currentUserId = window.globalSocketManager?.userId;
            if(!this.currentUserId) return;
        };

        const isUserMention = data.type === 'user' && data.mentioned_user_id?.toString() === this.currentUserId.toString();
        const isAllMention = data.type === 'all' && data.user_id?.toString() !== this.currentUserId.toString();
        const isRoleMention = data.type === 'role' && data.mentioned_user_id?.toString() === this.currentUserId.toString();

        if (isUserMention || isAllMention || isRoleMention) {
            this.showNotification(data, isAllMention, isRoleMention);
            this.playNotificationSound();
        }
    }

    showNotification(data, isAllMention, isRoleMention) {
        const mentionerUsername = data.username;
        const channelName = data.context.channel_name || 'Channel';
        const serverName = data.context.server_name || 'Server';
        const serverIcon = data.context.server_icon || '/public/assets/common/default-profile-picture.png';
        const title = `New Mention in ${channelName}`;
    
        const toastHTML = `
            <div class="group flex flex-col w-full max-w-md bg-gray-900/40 backdrop-blur-md rounded-xl shadow-xl border border-white/5 overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:bg-gray-900/50 cursor-pointer">
                <!-- Header -->
                <div class="flex items-center justify-between p-4">
                    <div class="flex items-center space-x-3">
                        <img src="${serverIcon}" alt="Server Icon" class="w-8 h-8 rounded-lg object-cover border border-white/10">
                        <div class="flex flex-col">
                            <div class="flex items-center space-x-1">
                                <span class="text-xs font-medium text-gray-400">in</span>
                                <span class="text-sm font-medium text-gray-200">${serverName}</span>
                            </div>
                            <div class="flex items-center text-xs text-indigo-400/90">
                                <i class="fas fa-hashtag text-xs mr-1"></i>
                                <span>${channelName}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="flex items-center text-xs text-gray-400">
                            <i class="far fa-clock mr-1.5"></i>
                            now
                        </div>
                        <button class="close-btn text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-md hover:bg-gray-700/50">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Content -->
                <div class="px-4 pb-4">
                    <div class="flex items-start space-x-3">
                        <div class="relative flex-shrink-0">
                            <div class="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10">
                                <img class="w-full h-full object-cover" 
                                    src="${data.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                                    alt="${mentionerUsername}">
                                <div class="absolute inset-0 ring-1 ring-inset ring-black/10"></div>
                            </div>
                            <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                        </div>
                        
                        <div class="flex-1 min-w-0 space-y-1">
                            <div class="flex items-center space-x-2">
                                <span class="text-sm font-semibold text-white">${mentionerUsername}</span>
                                <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${
                                    isAllMention ? 'bg-amber-400/10 text-amber-300' : 
                                    isRoleMention ? 'bg-purple-400/10 text-purple-300' : 'bg-indigo-400/10 text-indigo-300'
                                }">
                                    <i class="fas fa-at mr-1 text-xs opacity-75"></i>
                                    ${isAllMention ? 'all' : isRoleMention ? data.role : 'mention'}
                                </span>
                            </div>

                            <div class="relative group/message">
                                <div class="absolute -left-2 top-0 bottom-0 w-0.5 bg-gray-700/30 group-hover/message:bg-indigo-500/30 transition-colors duration-150"></div>
                                <p class="text-sm text-gray-300/90 leading-relaxed break-words pl-2">
                                    ${(data.content || '').substring(0, 120)}${data.content.length > 120 ? '...' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Action Hint -->
                    <div class="mt-3 flex items-center justify-end text-xs text-gray-400/75">
                        <i class="fas fa-arrow-right mr-1.5 group-hover:translate-x-0.5 transition-transform duration-150"></i>
                        View message
                    </div>
                </div>
            </div>
        `;
    
        const onClick = () => {
            this.navigateToMention(data);
        };

        if (window.showToast) {
            window.showToast(toastHTML, 'custom', 8000, title, onClick);
        }

        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            let bodyText;
            if (isAllMention) {
                bodyText = `${mentionerUsername} mentioned @all in #${channelName} (${serverName})`;
            } else if (isRoleMention) {
                bodyText = `${mentionerUsername} mentioned @${data.role} in #${channelName} (${serverName})`;
            } else {
                bodyText = `${mentionerUsername} mentioned you in #${channelName} (${serverName})`;
            }
            
            const notification = new Notification(title, {
                body: bodyText,
                icon: serverIcon || data.avatar_url || '/public/assets/common/default-profile-picture.png',
                tag: `mention-${data.message_id || Date.now()}`,
                requireInteraction: false
            });
            
            notification.onclick = () => {
                window.focus();
                this.navigateToMention(data);
                notification.close();
            };
            
            setTimeout(() => notification.close(), 10000);
        }
    }

    playNotificationSound() {
        try {
            const audio = new Audio('/public/assets/sound/discordo_sound.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => {});
        } catch (error) {
        }
    }

    navigateToMention(data) {
        try {
            console.log('🔗 [NOTIFICATION] Navigating to mention:', data);
            
            let targetUrl = '';
            
            if (data.target_type === 'channel' && data.target_id) {
                let serverId = null;
                
                const currentPath = window.location.pathname;
                const serverMatch = currentPath.match(/\/server\/(\d+)/);
                if (serverMatch) {
                    serverId = serverMatch[1];
                }
                
                if (!serverId) {
                    const serverIdFromMeta = document.querySelector('meta[name="server-id"]')?.content;
                    if (serverIdFromMeta) {
                        serverId = serverIdFromMeta;
                    }
                }
                
                if (!serverId && data.channel_id) {
                    serverId = data.server_id;
                }
                
                if (serverId) {
                    targetUrl = `/server/${serverId}?channel=${data.target_id}`;
                } else {
                    console.warn('⚠️ [NOTIFICATION] No server ID found, trying channel direct access');
                    targetUrl = `/home?channel=${data.target_id}`;
                }
            } else if (data.target_type === 'dm' && data.room_id) {
                targetUrl = `/home/channels/dm/${data.room_id}`;
            } else if (data.room_id && !data.target_type) {
                targetUrl = `/home/channels/dm/${data.room_id}`;
            }
            
            if (targetUrl) {
                if (data.message_id) {
                    targetUrl += `#message-${data.message_id}`;
                }
                
                console.log('🔗 [NOTIFICATION] Navigating to:', targetUrl);
                window.location.href = targetUrl;
            } else {
                console.warn('⚠️ [NOTIFICATION] Could not determine navigation URL for mention');
                if (window.showToast) {
                    window.showToast('Unable to navigate to message', 'warning', 3000);
                }
            }
        } catch (error) {
            console.error('❌ [NOTIFICATION] Error navigating to mention:', error);
            if (window.showToast) {
                window.showToast('Navigation failed', 'error', 3000);
            }
        }
    }
}

new GlobalNotificationHandler(); 