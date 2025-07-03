class NotificationIntegration {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        if (this.initialized) return;
        
        document.addEventListener('DOMContentLoaded', () => {
            this.waitForDependencies().then(() => {
                this.setupIntegration();
            }).catch(error => {
                console.error("Failed to initialize notification integration:", error);
            });
        });
        
        this.initialized = true;
    }

    waitForDependencies() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 20;
            let attempts = 0;
            const interval = setInterval(() => {
                if (window.globalNotificationHandler && window.notificationToast) {
                    clearInterval(interval);
                    resolve();
                } else if (attempts++ > maxAttempts) {
                    clearInterval(interval);
                    reject(new Error("Required notification components did not become available in time."));
                }
            }, 500);
        });
    }

    setupIntegration() {
        // Store original showNotification method for reference
        const originalShowNotification = window.globalNotificationHandler.showNotification;
        
        // Override the showNotification method to use our new toast system
        window.globalNotificationHandler.showNotification = (data, isAllMention, isRoleMention) => {
            // Call original method if needed (for backward compatibility)
            // originalShowNotification.call(window.globalNotificationHandler, data, isAllMention, isRoleMention);
            
            // Use our new toast system instead
            this.showModernNotification(data, isAllMention, isRoleMention);
        };
        
        console.log("✅ Notification integration complete - using modern toast notifications");
    }

    showModernNotification(data, isAllMention, isRoleMention) {
        const mentionerUsername = data.username;
        const channelName = data.context?.channel_name || 'Channel';
        const serverName = data.context?.server_name || 'Server';
        
        let type = 'mention';
        let title = `@${mentionerUsername} mentioned you`;
        
        if (isAllMention) {
            type = 'discord';
            title = `@${mentionerUsername} mentioned everyone`;
        } else if (isRoleMention) {
            type = 'discord';
            title = `@${mentionerUsername} mentioned your role`;
        }
        
        // Format the message content
        const message = `
            <div class="flex items-center gap-1 text-xs mb-1">
                <span class="text-gray-400">in</span>
                <span class="font-medium text-green-400">#${channelName}</span>
                <span class="text-gray-400">on</span>
                <span class="font-medium text-blue-400">${serverName}</span>
            </div>
            <div class="bg-gray-800/70 rounded p-2 border-l-2 border-${isAllMention ? 'orange' : 'blue'}-500">
                <p class="text-gray-200 text-xs">${data.content}</p>
            </div>
        `;
        
        // Create the notification with actions
        window.notificationToast.show({
            title: title,
            message: message,
            type: type,
            duration: 10000,
            onClick: () => {
                window.globalNotificationHandler.navigateToMention(data);
            },
            actions: [
                {
                    label: 'View Message',
                    primary: true,
                    onClick: () => {
                        window.globalNotificationHandler.navigateToMention(data);
                    }
                }
            ]
        });
        
        // Play notification sound
        window.globalNotificationHandler.playNotificationSound();
    }
}

// Initialize the integration
new NotificationIntegration(); 