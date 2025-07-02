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

        if (isUserMention || isAllMention) {
            this.showNotification(data, isAllMention);
            this.playNotificationSound();
        }
    }

    showNotification(data, isAllMention) {
        const mentionerUsername = data.username;
        const channelName = data.context.channel_name || 'Channel';
        const serverName = data.context.server_name || 'Server';
        const serverIcon = data.context.server_icon || '/public/assets/common/default-profile-picture.png';
        const title = `New Mention in ${channelName}`;
    
        const toastHTML = `
            <div class="group flex flex-col w-full max-w-md bg-gray-900/40 backdrop-blur-md rounded-xl shadow-xl border border-white/5 overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:bg-gray-900/50">
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
                    <div class="flex items-center text-xs text-gray-400">
                        <i class="far fa-clock mr-1.5"></i>
                        now
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
                                    isAllMention ? 'bg-amber-400/10 text-amber-300' : 'bg-indigo-400/10 text-indigo-300'
                                }">
                                    <i class="fas fa-at mr-1 text-xs opacity-75"></i>
                                    ${isAllMention ? 'all' : 'mention'}
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
    
        if (window.showToast) {
            window.showToast(toastHTML, 'custom', 8000, title);
        }

        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            const bodyText = `${mentionerUsername} ${isAllMention ? 'mentioned @all' : 'mentioned you'} in #${channelName} (${serverName})`;
            
            new Notification(title, {
                body: bodyText,
                icon: serverIcon || data.avatar_url || '/public/assets/common/default-profile-picture.png'
            });
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
}

new GlobalNotificationHandler(); 