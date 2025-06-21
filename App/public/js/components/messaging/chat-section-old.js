document.addEventListener('DOMContentLoaded', function() {
    window.logger.info('messaging', 'Chat section initializing...');

    window.MisVordDebug = {
        initialized: false,
        messagingAvailable: false,
        richComposerAvailable: false,
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
                richComposerAvailable: this.richComposerAvailable,
                socketAvailable: typeof io !== 'undefined',
                globalSocketManager: !!window.globalSocketManager,
                MisVordMessaging: !!window.MisVordMessaging,
                RichMessageComposer: !!window.RichMessageComposer,
                recentErrors: this.errors.slice(-5),
                recentLogs: this.logs.slice(-10)
            };
        }
    };    // Initialize Rich Message Composer if available
    function initializeRichComposer() {
        const richComposerContainer = document.getElementById('rich-message-composer-container');
        const composerElement = richComposerContainer ? richComposerContainer.querySelector('[id^="main-message-composer"]') : null;
        const simpleMessageForm = document.getElementById('simple-message-form');
        
        if (window.RichMessageComposer && composerElement && window.ChatData) {
            try {
                window.MisVordDebug.log('Initializing Rich Message Composer');
                
                window.richMessageComposer = new window.RichMessageComposer(composerElement, window.MisVordMessaging);
                window.MisVordDebug.richComposerAvailable = true;
                window.MisVordDebug.log('Rich Message Composer initialized successfully');
                
                // Hide simple form since rich composer is active
                if (simpleMessageForm) {
                    simpleMessageForm.classList.add('hidden');
                }
                
                return true;
            } catch (error) {
                window.MisVordDebug.error('Failed to initialize Rich Message Composer', error);
                // Fallback to simple form
                if (simpleMessageForm) {
                    simpleMessageForm.classList.remove('hidden');
                }
                return false;
            }
        }
        
        // Show simple form if rich composer not available
        if (simpleMessageForm) {
            simpleMessageForm.classList.remove('hidden');
        }
        window.MisVordDebug.log('Using simple message form (rich composer not available)');
        return false;
    }

    // Try to initialize rich composer, fallback to simple form
    let richComposerInitialized = false;
    
    // Wait for RichMessageComposer to be loaded
    function waitForRichComposer(attempts = 0) {
        if (window.RichMessageComposer) {
            richComposerInitialized = initializeRichComposer();
        } else if (attempts < 10) {
            setTimeout(() => waitForRichComposer(attempts + 1), 100);
        } else {
            window.MisVordDebug.log('Rich Message Composer not loaded, using simple form');
            const simpleMessageForm = document.getElementById('simple-message-form');
            if (simpleMessageForm) {
                simpleMessageForm.classList.remove('hidden');
            }
        }
    }
    
    waitForRichComposer();

    // Initialize simple message form functionality (fallback)
    const messageInput = document.getElementById('message-input');
    const characterCount = document.querySelector('.character-count');
    const sendButton = document.getElementById('send-button');

    window.MisVordDebug.log('Chat elements check', {
        messageInput: !!messageInput,
        characterCount: !!characterCount,
        sendButton: !!sendButton,
        messageForm: !!document.getElementById('message-form'),
        chatMessages: !!document.getElementById('chat-messages'),
        richComposerContainer: !!document.getElementById('rich-message-composer-container')
    });

    if (messageInput && sendButton) {
        window.MisVordDebug.log('Message input and send button found - initializing simple chat interface');

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

        sendButton.addEventListener('click', async function(e) {
            e.preventDefault();
            const form = document.getElementById('message-form');
            if (form) {
                if (window.MisVordMessaging && window.MisVordMessaging.handleSubmit) {
                    await window.MisVordMessaging.handleSubmit(form);
                } else {
                    const messageInput = document.getElementById('message-input');
                    const content = messageInput ? messageInput.value.trim() : '';
                    if (content && window.ChatAPI) {
                        const chatId = messageInput.getAttribute('data-chat-id');
                        const chatType = messageInput.getAttribute('data-chat-type') || 'channel';
                        
                        try {
                            const response = await window.ChatAPI.sendMessage(chatId, content, chatType);
                            if (response.success) {
                                messageInput.value = '';
                                messageInput.style.height = 'auto';
                            }
                        } catch (error) {
                            console.error('Error sending message:', error);
                        }
                    }
                }
            }
        });

        sendButton.disabled = true;
        setTimeout(() => {
            if (!richComposerInitialized && messageInput) {
                messageInput.focus();
                window.MisVordDebug.log('Message input focused (simple form)');
            }
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
    }    // Get meta tags for chat data
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

    // Always create socket data element for potential messaging system use
    let socketData = document.getElementById('socket-data');
    if (!socketData) {
        socketData = document.createElement('div');
        socketData.id = 'socket-data';
        socketData.style.display = 'none';
        document.body.appendChild(socketData);
    }
    
    // Update socket data attributes
    socketData.setAttribute('data-chat-type', chatType);
    socketData.setAttribute('data-chat-id', chatId);
    socketData.setAttribute('data-channel-id', channelId);
    socketData.setAttribute('data-user-id', userId);
    socketData.setAttribute('data-username', username);
    
    window.MisVordDebug.log('Socket data element created/updated and added to DOM');    // Check for direct message parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const dmParam = urlParams.get('dm');
    if (dmParam) {
        window.MisVordDebug.log('Direct message parameter detected:', dmParam);
        
        // Set up for direct message
        socketData.setAttribute('data-chat-id', dmParam);
        socketData.setAttribute('data-chat-type', 'direct');
        socketData.setAttribute('data-channel-id', ''); // Clear channel ID for DM
        
        // Wait for unified chat manager and switch to DM
        const initDirectMessage = () => {
            if (window.unifiedChatManager && window.unifiedChatManager.initialized) {
                window.MisVordDebug.log('Switching to direct message:', dmParam);
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