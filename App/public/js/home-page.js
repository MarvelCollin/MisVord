if (typeof window.ENV_CONFIG === 'undefined') {
    window.ENV_CONFIG = {
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
    let socket = null;
    let currentUserId = null;
    let currentUsername = null;
    let currentFriendId = null;

    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        currentUserId = appContainer.dataset.userId;
        currentUsername = appContainer.dataset.username;
    }

    function initializeSocket() {
        if (globalSocket) {
            return globalSocket;
        }

        const isLocalhost = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';

        const socketServerUrl = appContainer ? appContainer.dataset.socketUrl : null;
        let socketPath = null;

        if (!socketServerUrl) {
            if (isLocalhost) {
                socketServerUrl = 'http://localhost:1002';
            } else {
                socketServerUrl = window.location.origin;
            }
        }

        if (!socketPath) {
            socketPath = isLocalhost ? '/socket.io' : '/misvord/socket/socket.io';
        }

        console.log('[Socket] Connecting to:', socketServerUrl, 'with path:', socketPath);

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

        socket = setGlobalSocket(newSocket);

        socket.on('connect', () => {
            console.log('Connected to socket server');

            if (currentUserId && currentUsername) {
                socket.emit('join', {
                    userId: currentUserId,
                    username: currentUsername
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });
    }

    // Initialize socket connection
    initializeSocket();

    // Friend list functionality
    const friendItems = document.querySelectorAll('.friend-item');
    const dmItems = document.querySelectorAll('.dm-item');
    
    // Handle friend selection for messaging
    function selectFriend(friendId, friendName) {
        currentFriendId = friendId;
        
        // Update UI to show selected friend
        document.querySelectorAll('.friend-item').forEach(item => {
            item.classList.remove('bg-gray-800');
        });
        
        document.getElementById(`friend-${friendId}`)?.classList.add('bg-gray-800');
        
        // Update header with friend name
        const header = document.getElementById('chat-header');
        if (header) {
            header.innerHTML = `
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white mr-2">
                        ${friendName.charAt(0)}
                    </div>
                    <span class="font-semibold">${friendName}</span>
                </div>
            `;
        }
        
        // Load chat history
        loadDirectMessages(friendId);
    }
    
    // Load direct messages between current user and friend
    function loadDirectMessages(friendId) {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;
        
        messageContainer.innerHTML = '<div class="text-center text-gray-400 my-4">Loading messages...</div>';
        
        fetch(`/api/direct-messages/${friendId}`)
            .then(response => response.json())
            .then(data => {
                messageContainer.innerHTML = '';
                if (data.success && data.messages) {
                    if (data.messages.length === 0) {
                        messageContainer.innerHTML = '<div class="text-center text-gray-400 my-4">No messages yet. Say hello!</div>';
                    } else {
                        data.messages.forEach(msg => {
                            addMessage({
                                userId: msg.sender_id,
                                username: msg.sender.username,
                                content: msg.content,
                                timestamp: msg.sent_at
                            });
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Error loading direct messages:', error);
                messageContainer.innerHTML = '<div class="text-center text-red-500 my-4">Error loading messages</div>';
            });
    }
    
    // Add a message to the UI
    function addMessage(message) {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'flex mb-4';
        
        const isCurrentUser = message.userId === currentUserId;
        
        const timestamp = new Date(message.timestamp);
        const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="mr-4">
                <div class="w-10 h-10 rounded-full bg-${isCurrentUser ? 'indigo' : 'purple'}-500 flex items-center justify-center text-white">
                    ${message.username.charAt(0)}
                </div>
            </div>
            <div class="flex-1">
                <div class="flex items-center">
                    <span class="font-semibold text-white">${escapeHtml(message.username)}</span>
                    <span class="ml-2 text-xs text-gray-400">${timeString}</span>
                </div>
                <div class="text-gray-300">${escapeHtml(message.content)}</div>
            </div>
        `;
        
        messageContainer.appendChild(messageElement);
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
    
    // Helper function to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Handle sending messages
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    
    if (messageForm && messageInput) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const content = messageInput.value.trim();
            if (!content || !currentFriendId) return;
            
            if (socket && socket.connected) {
                socket.emit('direct_message', {
                    receiverId: currentFriendId,
                    content: content
                });
                
                // Add message to UI immediately for better UX
                addMessage({
                    userId: currentUserId,
                    username: currentUsername,
                    content: content,
                    timestamp: new Date()
                });
                
                // Clear input
                messageInput.value = '';
            } else {
                console.error('Socket not connected');
            }
        });
    }
    
    // Handle clicking on a server icon
    const serverIcons = document.querySelectorAll('.server-icon');
    serverIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const serverId = icon.getAttribute('data-server-id');
            window.location.href = `/server/${serverId}`;
        });
    });
    
    // Friend search functionality
    const searchInput = document.getElementById('friend-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            document.querySelectorAll('.friend-item').forEach(item => {
                const friendName = item.querySelector('.friend-name').textContent.toLowerCase();
                if (friendName.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
    
    // Friend status buttons (Online, All, Pending, Blocked)
    const statusButtons = document.querySelectorAll('.friend-status-btn');
    if (statusButtons) {
        statusButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                statusButtons.forEach(btn => btn.classList.remove('bg-gray-700'));
                // Add active class to clicked button
                button.classList.add('bg-gray-700');
                
                // Filter friends based on status
                const status = button.getAttribute('data-status');
                filterFriendsByStatus(status);
            });
        });
    }
    
    function filterFriendsByStatus(status) {
        // Implementation would depend on your app's structure
        console.log(`Filtering friends by status: ${status}`);
        // Example implementation:
        document.querySelectorAll('.friend-item').forEach(item => {
            const friendStatus = item.getAttribute('data-status');
            if (status === 'all' || friendStatus === status) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
}); 