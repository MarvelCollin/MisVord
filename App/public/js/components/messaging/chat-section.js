 document.addEventListener('DOMContentLoaded', function() {
    window.logger.info('messaging', 'Chat section initializing...');

    window.MisVordDebug = {
        initialized: false,
        messagingAvailable: false,
        errors: [],
        logs: [],

        log: function(message, data) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                message: message,
                data: data || {}
            };
            this.logs.push(logEntry);
            console.log(`[MisVordDebug] ${message}`, data);
            if (this.logs.length > 50) this.logs.shift();
        }, 
        error: function(message, error) {
            const errorEntry = {
                timestamp: new Date().toISOString(),
                message: message,
                error: error ? error.toString() : 'Unknown error',
                stack: error ? error.stack : 'No stack trace'
            };
            this.errors.push(errorEntry);
            console.error(`[MisVordDebug] ${message}`, error);
            if (this.errors.length > 20) this.errors.shift();
        },

        getDebugInfo: function() {
            return {
                initialized: this.initialized,
                messagingAvailable: this.messagingAvailable,
                socketAvailable: typeof io !== 'undefined',
                globalSocketManager: !!window.globalSocketManager,
                MisVordMessaging: !!window.MisVordMessaging,
                recentErrors: this.errors.slice(-5),
                recentLogs: this.logs.slice(-10)
            };
        }
    };    const messageInput = document.getElementById('message-input');
    const characterCount = document.querySelector('.character-count');
    const sendButton = document.getElementById('send-button');

    window.MisVordDebug.log('Chat elements check', {
        messageInput: !!messageInput,
        characterCount: !!characterCount,
        sendButton: !!sendButton,
        messageForm: !!document.getElementById('message-form'),
        chatMessages: !!document.getElementById('chat-messages')
    });

    if (messageInput && sendButton) {
        window.MisVordDebug.log('Message input and send button found - initializing chat interface');

        messageInput.addEventListener('input', function(e) {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';

            if (characterCount) {
                const length = this.value.length;
                characterCount.textContent = `${length}/2000`;
                characterCount.classList.toggle('hidden', length === 0);
                characterCount.classList.toggle('text-red-400', length > 1900);
            }

            const hasContent = this.value.trim().length > 0;
            sendButton.disabled = !hasContent;
        });

        sendButton.disabled = true;
        setTimeout(() => {
            messageInput.focus();
            window.MisVordDebug.log('Message input focused');
        }, 500);
    } else {
        window.MisVordDebug.log('Chat interface not available', {
            messageInput: !!messageInput,
            sendButton: !!sendButton,
            reason: 'No active channel selected or channel is voice-only'
        });
        
        // Check if we're on a server page without a selected channel
        const currentPath = window.location.pathname;
        const serverMatch = currentPath.match(/^\/servers\/(\d+)$/);
        if (serverMatch && !window.location.search.includes('channel=')) {
            window.MisVordDebug.log('Server page detected without channel parameter - this is expected behavior');
        }
    }    // Get meta tags for channel and user data
    const getMeta = (name) => {
        const meta = document.querySelector(`meta[name="${name}"]`);
        return meta ? meta.getAttribute('content') : null;
    };
    
    const channelId = getMeta('channel-id') || (messageInput ? messageInput.getAttribute('data-channel-id') : '');
    const userId = getMeta('user-id');
    const username = getMeta('username');

    window.MisVordDebug.log('Socket connection data', { channelId, userId, username });

    // Always create socket data element for potential messaging system use
    const socketData = document.createElement('div');
    socketData.id = 'socket-data';
    socketData.setAttribute('data-channel-id', channelId);
    socketData.setAttribute('data-user-id', userId);
    socketData.setAttribute('data-username', username);
    socketData.style.display = 'none';
    document.body.appendChild(socketData);
    window.MisVordDebug.log('Socket data element created and added to DOM');

    if (typeof io !== 'undefined') {
        window.MisVordDebug.log('Socket.IO is available');
        
        window.addEventListener('MisVordGlobalReady', function(event) {
            window.MisVordDebug.log('Global socket manager is ready:', event.detail);
            window.MisVordDebug.initialized = true;
            
            // Update status indicator
            const socketStatus = document.querySelector('.socket-status');
            if (socketStatus && event.detail.socketManager.isReady()) {
                socketStatus.innerHTML = '<span class="text-green-500">•</span> <span class="ml-1">Connected</span>';
            }
        });

        if (window.globalSocketManager) {
            window.MisVordDebug.log('Global socket manager already available');
            window.MisVordDebug.initialized = true;
            
            const socketStatus = document.querySelector('.socket-status');
            if (socketStatus && window.globalSocketManager.isReady()) {
                socketStatus.innerHTML = '<span class="text-green-500">•</span> <span class="ml-1">Connected</span>';
            }
        }

    } else {
        window.MisVordDebug.error('Socket.IO not available - messaging disabled');

        const socketStatus = document.querySelector('.socket-status');
        if (socketStatus) {
            socketStatus.innerHTML = '<span class="text-red-500">•</span> <span class="ml-1">WebSocket required - please refresh</span>';
        }

        if (messageInput) {
            messageInput.disabled = true;
            messageInput.placeholder = 'WebSocket connection required for messaging';
        }
    }

    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        const hasMessages = messagesContainer.querySelector('[id^="msg-"]');
        if (hasMessages) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                window.MisVordDebug.log('Auto-scrolled to bottom on page load');
            }, 100);
        }

        const observer = new MutationObserver(() => {
            const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 50;
            if (isAtBottom) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        });

        observer.observe(messagesContainer, {
            childList: true,
            subtree: true
        });
    }

    window.MisVordDebug.log('Chat section initialization complete');
}); 