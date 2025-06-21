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
    };

    const messageInput = document.getElementById('message-input');
    const characterCount = document.querySelector('.character-count');
    const characterCountContainer = document.querySelector('.character-count-container');
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
            this.style.height = Math.min(this.scrollHeight, 160) + 'px';

            const length = this.value.length;
            if (characterCount) {
                characterCount.textContent = length;
                
                if (length > 1900) {
                    characterCountContainer?.classList.remove('hidden');
                    characterCount.classList.add('text-red-400');
                } else if (length > 1500) {
                    characterCountContainer?.classList.remove('hidden');
                    characterCount.classList.remove('text-red-400');
                } else {
                    characterCountContainer?.classList.add('hidden');
                    characterCount.classList.remove('text-red-400');
                }
            }

            const hasContent = this.value.trim().length > 0;
            sendButton.disabled = !hasContent;
        });

        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendButton.disabled) {
                    sendButton.click();
                }
            }
        });

        sendButton.addEventListener('click', async function(e) {
            e.preventDefault();
            const form = document.getElementById('message-form');
            if (form) {
                await handleMessageSubmit(form);
            }
        });

        sendButton.disabled = true;
    } else {
        window.MisVordDebug.log('Chat interface not available', {
            messageInput: !!messageInput,
            sendButton: !!sendButton,
            reason: 'No active channel selected or channel is voice-only'
        });
        
        const currentPath = window.location.pathname;
        const serverMatch = currentPath.match(/^\/servers\/(\d+)$/);
        if (serverMatch && !window.location.search.includes('channel=')) {
            window.MisVordDebug.log('Server page detected without channel parameter - this is expected behavior');
        }
    }

    async function handleMessageSubmit(form) {
        const messageInput = form.querySelector('#message-input');
        const content = messageInput.value.trim();
        
        if (!content || content.length === 0) return;
        if (content.length > 2000) {
            window.MisVordDebug.error('Message too long', { length: content.length });
            return;
        }

        const formData = new FormData(form);
        const chatType = formData.get('chat_type');
        const chatId = formData.get('chat_id');

        window.MisVordDebug.log('Submitting message', { chatType, chatId, contentLength: content.length });

        try {
            if (window.MisVordMessaging && typeof window.MisVordMessaging.sendMessage === 'function') {
                messageInput.value = '';
                messageInput.style.height = 'auto';
                sendButton.disabled = true;
                characterCountContainer?.classList.add('hidden');
                
                await window.MisVordMessaging.sendMessage(chatId, content, chatType);
            } else {
                throw new Error('MisVordMessaging not available');
            }
        } catch (error) {
            window.MisVordDebug.error('Message send failed', error);
            messageInput.value = content;
        }
    }

    const getMeta = (name) => {
        const meta = document.querySelector(`meta[name="${name}"]`);
        return meta ? meta.getAttribute('content') : null;
    };
    
    const chatType = getMeta('chat-type') || 'channel';
    const chatId = getMeta('chat-id') || getMeta('channel-id') || (messageInput ? messageInput.getAttribute('data-chat-id') || messageInput.getAttribute('data-channel-id') : '');
    const channelId = getMeta('channel-id') || (chatType === 'channel' ? chatId : '');
    const userId = getMeta('user-id');
    const username = getMeta('username');

    window.MisVordDebug.log('Socket connection data', { chatType, chatId, channelId, userId, username });

    let socketData = document.getElementById('socket-data');
    if (!socketData) {
        socketData = document.createElement('div');
        socketData.id = 'socket-data';
        socketData.style.display = 'none';
        document.body.appendChild(socketData);
    }
    
    socketData.setAttribute('data-chat-type', chatType);
    socketData.setAttribute('data-chat-id', chatId);
    socketData.setAttribute('data-channel-id', channelId);
    socketData.setAttribute('data-user-id', userId);
    socketData.setAttribute('data-username', username);
    
    window.MisVordDebug.log('Socket data element created/updated and added to DOM');

    const urlParams = new URLSearchParams(window.location.search);
    const dmParam = urlParams.get('dm');
    if (dmParam) {
        window.MisVordDebug.log('Direct message parameter detected:', dmParam);
        
        socketData.setAttribute('data-chat-id', dmParam);
        socketData.setAttribute('data-chat-type', 'direct');
        socketData.setAttribute('data-channel-id', '');
        
        const initDirectMessage = () => {
            if (window.unifiedChatManager && window.unifiedChatManager.initialized) {
                window.unifiedChatManager.switchToChat(dmParam, 'direct');
            } else {
                setTimeout(initDirectMessage, 100);
            }
        };
        
        setTimeout(initDirectMessage, 500);
    }

    if (typeof io !== 'undefined') {
        window.MisVordDebug.log('Socket.IO is available');
        
        window.addEventListener('MisVordGlobalReady', function(event) {
            window.MisVordDebug.log('Global socket manager is ready:', event.detail);
            window.MisVordDebug.initialized = true;
            
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
