// Unified WebSocket configuration
if (typeof window.ENV_CONFIG === 'undefined') {
    window.ENV_CONFIG = {
        // This will be dynamically replaced by server-side values
        IS_LOCAL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        IS_VPS: true
    };
}

let globalSocket = null;

function getGlobalSocket() {
    return globalSocket;
}

function setGlobalSocket(socket) {
    globalSocket = socket;
    window.socket = socket;
    
    const socketReadyEvent = new CustomEvent('socketReady', { detail: { socket } });
    document.dispatchEvent(socketReadyEvent);
    
    return socket;
}

document.addEventListener('DOMContentLoaded', function() {
    const serverElements = document.querySelectorAll('.server-icon');
    let socket = null;
    let currentChannelId = null;
    let currentUserId = null;
    let currentUsername = null;
    
    // Get user data from the app container
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        currentUserId = appContainer.dataset.userId;
        currentUsername = appContainer.dataset.username;
    }
    
    // Initialize socket connection
    function initializeSocket() {
        if (globalSocket) {
            return globalSocket;
        }
        
        // Determine environment
        const isLocalhost = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';
        
        // Get socket URL and path from meta tags (set by PHP)
        const socketServerMeta = document.querySelector('meta[name="socket-server"]');
        const socketPathMeta = document.querySelector('meta[name="socket-path"]');
        
        let socketServerUrl = socketServerMeta ? socketServerMeta.content : null;
        let socketPath = socketPathMeta ? socketPathMeta.content : null;
        
        // Normalize paths if needed
        if (socketPath && !socketPath.startsWith('/')) {
            socketPath = '/' + socketPath;
        }
        
        // Fallbacks if meta tags aren't available
        if (!socketServerUrl) {
            if (isLocalhost) {
                socketServerUrl = window.location.protocol + '//' + window.location.hostname + ':1002';
            } else {
                socketServerUrl = window.location.origin;
            }
        }
        
        if (!socketPath) {
            socketPath = isLocalhost ? '/socket.io' : '/misvord/socket/socket.io';
        }
        
        console.log('[Socket] Connecting to:', socketServerUrl, 'with path:', socketPath);
        
        // Create new socket
        const newSocket = io(socketServerUrl, {
            path: socketPath,
            transports: ['websocket', 'polling'],
            secure: window.location.protocol === 'https:',
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000
        });
        
        // Set to global and return
        socket = setGlobalSocket(newSocket);
        
        socket.on('connect', () => {
            console.log('Connected to socket server');
            
            // Join with user data
            if (currentUserId && currentUsername) {
                socket.emit('join', {
                    userId: currentUserId,
                    username: currentUsername
                });
            }
            
            // Subscribe to current channel if available
            if (currentChannelId) {
                subscribeToChannel(currentChannelId);
            }
        });
        
        socket.on('message', (message) => {
            console.log('Received message:', message);
            addMessage({
                userId: message.user.userId,
                username: message.user.username,
                content: message.content,
                timestamp: message.sent_at || new Date()
            });
        });
        
        socket.on('user_typing', (data) => {
            showTypingIndicator(data.user.username);
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });
    }
    
    function subscribeToChannel(channelId) {
        if (socket && socket.connected) {
            // First unsubscribe from previous channel if any
            if (currentChannelId && currentChannelId !== channelId) {
                socket.emit('unsubscribe', { channelId: currentChannelId });
            }
            
            // Subscribe to new channel
            socket.emit('subscribe', { channelId: channelId });
            currentChannelId = channelId;
            console.log(`Subscribed to channel ${channelId}`);
        }
    }
    
    function showTypingIndicator(username) {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.textContent = `${username} is typing...`;
            typingIndicator.classList.remove('hidden');
            
            // Hide after 3 seconds
            clearTimeout(window.typingTimeout);
            window.typingTimeout = setTimeout(() => {
                typingIndicator.classList.add('hidden');
            }, 3000);
        }
    }
    
    serverElements.forEach(server => {
        server.addEventListener('mouseenter', () => {
            const serverName = server.getAttribute('data-server-name');
            const tooltip = document.getElementById('server-tooltip');
            
            tooltip.textContent = serverName;
            tooltip.style.display = 'block';
            tooltip.style.top = `${server.getBoundingClientRect().top + window.scrollY}px`;
            tooltip.style.left = `${server.getBoundingClientRect().right + window.scrollX + 10}px`;
        });
        
        server.addEventListener('mouseleave', () => {
            document.getElementById('server-tooltip').style.display = 'none';
        });
    });
    
    const channelElements = document.querySelectorAll('.channel-item');
    
    channelElements.forEach(channel => {
        channel.addEventListener('click', () => {
            document.querySelectorAll('.channel-item').forEach(ch => {
                ch.classList.remove('bg-gray-700');
            });
            
            channel.classList.add('bg-gray-700');
            
            const channelName = channel.getAttribute('data-channel-name');
            const channelId = channel.getAttribute('data-channel-id');
            
            document.getElementById('current-channel-name').textContent = channelName;
            
            // Set the current channel and subscribe to it
            currentChannelId = channelId;
            if (socket) {
                subscribeToChannel(channelId);
            }
            
            // Load previous messages
            loadChannelMessages(channelId);
        });
    });
    
    function loadChannelMessages(channelId) {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;
        
        // Clear existing messages
        messageContainer.innerHTML = '<div class="loading-messages">Loading messages...</div>';
        
        // Get the current server ID
        const serverId = getCurrentServerId();
        
        // Use the server ID in the API endpoint if available
        let apiUrl = serverId ? 
            `/api/servers/${serverId}/channels/${channelId}/messages` :
            `/api/channels/${channelId}/messages`;
        
        // Make an AJAX request to fetch messages
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                messageContainer.innerHTML = '';
                if (data.success && data.messages) {
                    if (data.messages.length === 0) {
                        messageContainer.innerHTML = '<div class="text-center text-gray-400 my-4">No messages yet</div>';
                    } else {
                        // Display messages in chronological order
                        data.messages.reverse().forEach(msg => {
                            addMessage({
                                userId: msg.user_id,
                                username: msg.user.username,
                                content: msg.content,
                                timestamp: msg.sent_at
                            });
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching messages:', error);
                messageContainer.innerHTML = '<div class="text-center text-red-500 my-4">Error loading messages</div>';
            });
    }
    
    // Helper function to get the current server ID
    function getCurrentServerId() {
        // Try to extract from URL path like /server/123
        const path = window.location.pathname;
        const serverMatch = path.match(/\/server\/(\d+)/);
        
        if (serverMatch && serverMatch[1]) {
            return serverMatch[1];
        }
        
        // Check if there's a hidden input with server ID
        const serverIdInput = document.getElementById('currentServerId');
        if (serverIdInput && serverIdInput.value) {
            return serverIdInput.value;
        }
        
        return null;
    }
    
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messageContainer = document.getElementById('message-container');
    
    if (messageInput) {
        // Add typing indicator functionality
        let typingTimeout;
        messageInput.addEventListener('input', () => {
            clearTimeout(typingTimeout);
            
            if (socket && currentChannelId) {
                socket.emit('typing', { channelId: currentChannelId });
                
                // Only emit typing event every 3 seconds at most
                typingTimeout = setTimeout(() => {
                    // Do nothing, just preventing multiple events
                }, 3000);
            }
        });
    }
    
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const messageText = messageInput.value.trim();
            if (messageText && currentChannelId) {
                // Get the current server ID
                const serverId = getCurrentServerId();
                
                // Use the server ID in the API endpoint if available
                let apiUrl = serverId ? 
                    `/api/servers/${serverId}/channels/${currentChannelId}/messages` :
                    `/api/channels/${currentChannelId}/messages`;
                
                // Send message via API
                fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: messageText
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('Message sent successfully');
                        // The message will be added via socket
                    } else {
                        console.error('Failed to send message:', data.message);
                        // Show error
                        const errorElement = document.createElement('div');
                        errorElement.className = 'text-red-500 text-sm mt-1';
                        errorElement.textContent = 'Failed to send message';
                        messageForm.appendChild(errorElement);
                        setTimeout(() => errorElement.remove(), 3000);
                    }
                })
                .catch(error => {
                    console.error('Error sending message:', error);
                });
                
                messageInput.value = '';
            }
        });
    }
    
    function addMessage(message) {
        if (!messageContainer) return;
        
        const isCurrentUser = message.userId == currentUserId;
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'mb-4', 'flex');
        
        const currentTime = new Date(message.timestamp);
        const formattedTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
        
        messageElement.innerHTML = `
            <div class="flex-shrink-0 mr-3">
                <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-lg">
                    ${message.username.charAt(0).toUpperCase()}
                </div>
            </div>
            <div class="flex-grow">
                <div class="flex items-baseline">
                    <span class="font-bold text-white mr-2">${escapeHtml(message.username)}</span>
                    <span class="text-xs text-gray-400">${formattedTime}</span>
                </div>
                <div class="text-gray-200 leading-relaxed">${escapeHtml(message.content)}</div>
            </div>
        `;
        
        messageContainer.appendChild(messageElement);
        messageContainer.scrollTop = messageContainer.scrollHeight;
        
        setTimeout(() => {
            messageElement.classList.add('message-appear');
        }, 10);
    }
    
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Initialize WebSocket connection
    initializeSocket();
});
