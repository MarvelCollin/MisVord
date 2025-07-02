class GlobalNotificationHandler {
    constructor() {
        this.socket = null;
        this.currentUserId = null;
        this.currentNotification = null;
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
        this.clearExistingNotifications();
        
        const mentionerUsername = data.username;
        const channelName = data.context.channel_name || 'Channel';
        const serverName = data.context.server_name || 'Server';
        const serverIcon = data.context.server_icon || '/public/assets/common/default-profile-picture.png';
        const title = `New Mention in ${channelName}`;
        
        let mentionColor = 'from-blue-500 to-indigo-600';
        let mentionText = 'mention';
        let mentionIcon = '👤';
        
        if (isAllMention) {
            mentionColor = 'from-orange-500 to-red-500';
            mentionText = 'all';
            mentionIcon = '📢';
        } else if (isRoleMention) {
            mentionColor = 'from-purple-500 to-pink-500';
            mentionText = data.role;
            mentionIcon = '👑';
        }
    
        const toastHTML = `
            <div class="notification-card group relative w-96 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl cursor-pointer animate-slide-in">
                <!-- Glow Effect -->
                <div class="absolute inset-0 bg-gradient-to-r ${mentionColor} opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mentionColor}"></div>
                
                <!-- Header -->
                <div class="relative p-5 pb-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="relative">
                                <img src="${serverIcon}" alt="Server" class="w-10 h-10 rounded-xl object-cover ring-2 ring-white/20 shadow-lg">
                                <div class="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r ${mentionColor} rounded-full flex items-center justify-center text-xs shadow-lg">
                                    ${mentionIcon}
                                </div>
                            </div>
                            <div class="flex flex-col">
                                <div class="flex items-center space-x-1.5">
                                    <span class="text-xs font-medium text-gray-400">in</span>
                                    <span class="text-sm font-bold text-white">${serverName}</span>
                                </div>
                                <div class="flex items-center text-xs text-gray-300/80">
                                    <span class="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                                    <span>#${channelName}</span>
                                </div>
                            </div>
                        </div>
                        <button class="close-btn group/close p-2 rounded-xl hover:bg-white/10 transition-all duration-200">
                            <svg class="w-4 h-4 text-gray-400 group-hover/close:text-white group-hover/close:rotate-90 transition-all duration-200" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Content -->
                <div class="relative px-5 pb-5">
                    <div class="flex items-start space-x-4">
                        <div class="relative flex-shrink-0">
                            <div class="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/20 shadow-lg">
                                <img class="w-full h-full object-cover" 
                                    src="${data.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                                    alt="${mentionerUsername}">
                            </div>
                            <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 shadow-lg"></div>
                        </div>
                        
                        <div class="flex-1 min-w-0 space-y-2">
                            <div class="flex items-center space-x-2 flex-wrap">
                                <span class="text-base font-bold text-white">${mentionerUsername}</span>
                                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${mentionColor} text-white shadow-lg">
                                    <span class="mr-1">${mentionIcon}</span>
                                    @${mentionText}
                                </span>
                            </div>

                            <div class="relative bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                <div class="absolute top-2 left-2 w-1 h-4 bg-gradient-to-b ${mentionColor} rounded-full"></div>
                                <p class="text-sm text-gray-200 leading-relaxed pl-4">
                                    ${(data.content || '').substring(0, 100)}${data.content && data.content.length > 100 ? '...' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Action -->
                    <div class="mt-4 flex items-center justify-center">
                        <div class="flex items-center space-x-2 text-xs text-gray-300 bg-white/5 rounded-full px-4 py-2 group-hover:bg-white/10 transition-all duration-300">
                            <span class="relative flex h-2 w-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-r ${mentionColor} opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r ${mentionColor}"></span>
                            </span>
                            <span class="font-medium">Click to view message</span>
                            <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        `;
    
        const onClick = () => {
            this.navigateToMention(data);
        };

        if (window.showToast) {
            this.currentNotification = window.showToast(toastHTML, 'custom', 10000, title, onClick);
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

    clearExistingNotifications() {
        if (this.currentNotification && typeof this.currentNotification.close === 'function') {
            this.currentNotification.close();
            this.currentNotification = null;
        }
        
        const existingToasts = document.querySelectorAll('.notification-card');
        existingToasts.forEach(toast => {
            const parent = toast.closest('.toast-item');
            if (parent) {
                parent.style.animation = 'slide-out-right 0.3s ease-in forwards';
                setTimeout(() => {
                    if (parent.parentNode) {
                        parent.parentNode.removeChild(parent);
                    }
                }, 300);
            }
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
                
                setTimeout(() => {
                    if (window.messageHighlighter && data.message_id) {
                        console.log('✨ [NOTIFICATION] Triggering message highlight after navigation');
                        window.messageHighlighter.highlightMessage(data.message_id, true);
                    }
                }, 1000);
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