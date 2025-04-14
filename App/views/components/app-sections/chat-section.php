<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}

// Get socket server URL from ENV or use default
$socketServer = $_ENV['SOCKET_SERVER'] ?? 'http://localhost:3000';
?>
<!-- Chat Section - Main chat area with messages -->
<div class="chat-section flex flex-col h-full">
    <!-- Channel Header -->
    <div class="flex items-center h-12 px-4 border-b border-[#2D3136] shadow-sm">
        <div class="flex items-center text-gray-200">
            <span class="text-gray-400 mr-2">#</span>
            <h2 class="font-semibold channel-header-name">Select a channel</h2>
        </div>
        <div class="ml-2 text-sm text-gray-400 channel-header-topic">Welcome to MiscVord</div>
        <div class="ml-auto flex items-center space-x-4">
            <button class="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>
            <button class="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </button>
            <button class="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
            </button>
        </div>
    </div>

    <!-- Messages Area -->
    <div id="messagesContainer" class="flex-1 overflow-y-auto p-4 pb-4">
        <!-- Messages will be loaded here -->
        <div class="welcome-placeholder text-center text-gray-400 py-10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2 class="text-xl font-semibold mb-2">Welcome to MiscVord!</h2>
            <p>Select a channel to start chatting</p>
        </div>
        
        <!-- Loading indicator hidden by default -->
        <div id="loadingMessages" class="hidden flex justify-center items-center py-10">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-discord-blue"></div>
        </div>
        
        <!-- Typing indicator -->
        <div class="typing-indicator hidden mt-4 flex items-center text-xs text-gray-500">
            <span id="typingUsername" class="font-semibold mr-1">Someone</span> is typing
            <div class="ml-2 flex">
                <span class="dot mx-0.5"></span>
                <span class="dot mx-0.5"></span>
                <span class="dot mx-0.5"></span>
            </div>
        </div>
    </div>
    
    <!-- New Message Form -->
    <form id="messageForm" class="p-4 border-t border-[#2D3136]">
        <div class="bg-[#40444b] rounded-lg flex items-center p-1">
            <button type="button" class="p-2 text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            </button>
            <input 
                id="messageInput" 
                type="text" 
                placeholder="Message #welcome" 
                class="bg-transparent border-none flex-1 p-2 focus:outline-none text-gray-200"
                disabled
            >
            <input type="hidden" id="currentChannelId" value="">
            <button type="button" class="p-2 text-gray-400 hover:text-white" id="uploadAttachmentBtn">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            </button>
            <button type="button" class="p-2 text-gray-400 hover:text-white" id="emojiPickerBtn">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
            <button type="button" class="p-2 text-gray-400 hover:text-white" id="sendMessageBtn">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    </form>

    <!-- Connection status indicator -->
    <div id="connectionStatus" class="fixed bottom-2 left-2 px-2 py-1 rounded text-xs hidden">
        <span class="flex items-center">
            <span id="connectionStatusDot" class="w-2 h-2 rounded-full mr-1"></span>
            <span id="connectionStatusText"></span>
        </span>
    </div>
</div>

<style>
.chat-section {
    background-color: #36393f;
    flex: 1;
    position: relative;
}

.channel-header {
    background-color: #36393f;
    border-bottom-color: rgba(79, 84, 92, 0.48);
}

.message-group {
    padding: 2px 0;
}

.message-group:hover {
    background-color: rgba(4, 4, 5, 0.07);
}

.message-input-container {
    background-color: #36393f;
}

/* Typing indicator animation */
.typing-animation {
    display: flex;
    align-items: center;
}

.dot {
    display: inline-block;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: #b9bbbe;
    margin: 0 2px;
    animation: pulse 1.5s infinite ease-in-out;
}

.dot:nth-child(2) {
    animation-delay: 0.2s;
}

.dot:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes pulse {
    0%, 50%, 100% {
        transform: scale(1);
        opacity: 0.6;
    }
    25%, 75% {
        transform: scale(1.5);
        opacity: 1;
    }
}

/* Connection status styles */
#connectionStatus.connected #connectionStatusDot {
    background-color: #57F287;
}

#connectionStatus.connecting #connectionStatusDot {
    background-color: #FAA61A;
    animation: blink 1.5s infinite;
}

#connectionStatus.disconnected #connectionStatusDot {
    background-color: #ED4245;
}

@keyframes blink {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
}

/* Remove the bottom padding adjustment since we've moved the user profile */
#messagesContainer {
    padding-bottom: 1rem;
}

#messageForm {
    position: relative;
    z-index: 5;
}
</style>

<!-- Socket.IO client script -->
<script src="https://cdn.socket.io/4.6.0/socket.io.min.js" integrity="sha384-c79GN5VsunZvi+Q/WObgk2in0CbZsHnjEqvFxC5DxHn9lTfNce2WW6h2pH6u/kF+" crossorigin="anonymous"></script>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Socket connection
    const socket = io('<?php echo $socketServer; ?>');
    
    // DOM elements
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const messageForm = document.getElementById('messageForm');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const currentChannelIdInput = document.getElementById('currentChannelId');
    const loadingMessages = document.getElementById('loadingMessages');
    const typingIndicator = document.querySelector('.typing-indicator');
    const typingUsername = document.getElementById('typingUsername');
    const channelHeaderName = document.querySelector('.channel-header-name');
    const connectionStatus = document.getElementById('connectionStatus');
    const connectionStatusText = document.getElementById('connectionStatusText');
    
    // State variables
    let isLoadingMessages = false;
    let currentChannelId = null;
    let messagesLastFetchTime = 0;
    let typingTimeout;
    
    // Track message IDs we've already displayed to prevent duplicates
    const displayedMessageIds = new Set();
    
    // Socket.IO connection events
    socket.on('connect', function() {
        console.log('Connected to WebSocket server');
        updateConnectionStatus('connected', 'Connected');
        
        // Join with user information
        socket.emit('join', {
            userId: '<?php echo $_SESSION['user_id']; ?>',
            username: '<?php echo $_SESSION['username']; ?>'
        });
        
        // If we were previously in a channel, rejoin it
        if (currentChannelId) {
            socket.emit('subscribe', { channelId: currentChannelId });
        }
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from WebSocket server');
        updateConnectionStatus('disconnected', 'Disconnected');
    });
    
    socket.on('connect_error', function(error) {
        console.error('Connection error:', error);
        updateConnectionStatus('disconnected', 'Connection Error');
    });
    
    socket.on('joined', function(data) {
        console.log('Joined WebSocket server:', data);
    });
    
    socket.on('subscribed', function(data) {
        console.log('Subscribed to channel:', data);
    });
    
    // Message events
    socket.on('message', function(message) {
        console.log('Received message:', message);
        
        // Check if we've already displayed this message
        if (message.id && displayedMessageIds.has(message.id)) {
            console.log('Skipping duplicate message:', message.id);
            return;
        }
        
        // Add to displayed messages set
        if (message.id) {
            displayedMessageIds.add(message.id);
        }
        
        handleNewMessage(message);
    });
    
    socket.on('user_typing', function(data) {
        handleUserTyping(data);
    });
    
    socket.on('user_joined_channel', function(data) {
        showNotification(`${data.user.username} joined the channel`, 'info');
    });
    
    socket.on('user_left_channel', function(data) {
        showNotification(`${data.user.username} left the channel`, 'info');
    });
    
    // Function to update connection status UI
    function updateConnectionStatus(status, text) {
        connectionStatus.className = `fixed bottom-2 left-2 px-2 py-1 rounded text-xs bg-[#202225] ${status}`;
        connectionStatus.classList.remove('hidden');
        connectionStatusText.textContent = text;
    }

    // Function to load messages for a channel
    window.loadChannel = function(channelId, channelName) {
        // Set current channel
        currentChannelId = channelId;
        currentChannelIdInput.value = channelId;
        
        // Update UI
        channelHeaderName.textContent = channelName;
        messageInput.placeholder = `Message #${channelName}`;
        messageInput.disabled = false;
        
        // Show loading indicator
        messagesContainer.innerHTML = '';
        loadingMessages.classList.remove('hidden');
        
        // Subscribe to this channel via WebSocket
        socket.emit('subscribe', { channelId: channelId });
        
        // Fetch messages
        fetchMessages(channelId);
    };
    
    // Function to fetch messages from the server
    function fetchMessages(channelId) {
        if (isLoadingMessages) return;
        
        isLoadingMessages = true;
        updateConnectionStatus('connecting', 'Loading messages...');
        
        // Get the current server ID from the URL or a hidden input
        const serverId = getCurrentServerId();
        
        // Use the new API endpoint structure if server ID is available, otherwise fall back to old endpoint
        const apiUrl = serverId ? 
            `/api/servers/${serverId}/channels/${channelId}/messages` : 
            `/api/channels/${channelId}/messages`;
            
        fetch(apiUrl)
            .then(response => {
                // Check if response is JSON
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error(`Expected JSON, got ${contentType}`);
                }
                return response.json();
            })
            .then(data => {
                isLoadingMessages = false;
                loadingMessages.classList.add('hidden');
                updateConnectionStatus('connected', 'Connected');
                
                if (data.success) {
                    // Clear existing messages if this is initial load
                    if (messagesLastFetchTime === 0) {
                        messagesContainer.innerHTML = '';
                    }
                    
                    // Render messages
                    if (data.messages.length === 0) {
                        messagesContainer.innerHTML = `
                            <div class="text-center text-gray-400 py-10">
                                <p>No messages here yet. Start the conversation!</p>
                            </div>
                        `;
                    } else {
                        // Sort messages in ascending order (oldest first)
                        const sortedMessages = data.messages.sort((a, b) => 
                            new Date(a.sent_at) - new Date(b.sent_at)
                        );
                        
                        renderMessages(sortedMessages);
                    }
                    
                    // Update last fetch time
                    messagesLastFetchTime = Date.now();
                    
                    // Scroll to bottom
                    scrollToBottom();
                } else {
                    console.error('Error fetching messages:', data.message);
                    messagesContainer.innerHTML = `
                        <div class="text-center text-gray-400 py-10">
                            <p>Error loading messages: ${data.message || 'Unknown error'}</p>
                        </div>
                    `;
                    updateConnectionStatus('disconnected', 'Error loading messages');
                }
            })
            .catch(error => {
                isLoadingMessages = false;
                loadingMessages.classList.add('hidden');
                console.error('Error fetching messages:', error);
                messagesContainer.innerHTML = `
                    <div class="text-center text-gray-400 py-10">
                        <p>Error loading messages. Please try again later.</p>
                        <p class="text-sm mt-2">${error.message}</p>
                    </div>
                `;
                updateConnectionStatus('disconnected', 'Connection error');
            });
    }
    
    // Function to get current server ID
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
    
    // Function to render messages from API response
    function renderMessages(messages) {
        let lastSender = null;
        let messageGroupDiv = null;
        
        messages.forEach(message => {
            // Track this message ID to prevent duplicates
            if (message.id) {
                displayedMessageIds.add(message.id);
            }
            
            // Check if this is a new sender
            if (lastSender !== message.user.id) {
                // Create new message group
                messageGroupDiv = document.createElement('div');
                messageGroupDiv.className = 'message-group flex mb-4';
                messageGroupDiv.dataset.userId = message.user.id;
                
                // Avatar
                const avatarUrl = message.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.user.username)}&background=random`;
                
                messageGroupDiv.innerHTML = `
                    <img src="${avatarUrl}" alt="${message.user.username}" class="w-10 h-10 rounded-full mr-4">
                    <div class="message-content flex-1">
                        <div class="message-header flex items-center">
                            <span class="font-semibold text-white">${message.user.username}</span>
                            <span class="text-xs text-gray-400 ml-2">${message.formatted_time}</span>
                        </div>
                        <div class="messages">
                            <div class="message" data-message-id="${message.id}">
                                <p class="text-gray-200">${formatMessageContent(message.content)}</p>
                                ${message.attachment_url ? `<div class="mt-2"><img src="${message.attachment_url}" alt="Attachment" class="max-w-xs rounded"></div>` : ''}
                                ${message.edited_at ? `<span class="text-xs text-gray-500 ml-1">(edited)</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
                
                messagesContainer.appendChild(messageGroupDiv);
            } else {
                // Add to existing message group
                const messagesDiv = messageGroupDiv.querySelector('.messages');
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message mt-1';
                messageDiv.dataset.messageId = message.id;
                
                messageDiv.innerHTML = `
                    <p class="text-gray-200">${formatMessageContent(message.content)}</p>
                    ${message.attachment_url ? `<div class="mt-2"><img src="${message.attachment_url}" alt="Attachment" class="max-w-xs rounded"></div>` : ''}
                    ${message.edited_at ? `<span class="text-xs text-gray-500 ml-1">(edited)</span>` : ''}
                `;
                
                messagesDiv.appendChild(messageDiv);
            }
            
            lastSender = message.user.id;
        });
    }
    
    // Function to format message content (handling markdown, links, etc.)
    function formatMessageContent(content) {
        // Basic URL linking
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-400 hover:underline">$1</a>');
        
        // Basic markdown (bold, italics, etc.)
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        content = content.replace(/~~(.*?)~~/g, '<del>$1</del>');
        content = content.replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-1 rounded">$1</code>');
        
        return content;
    }
    
    // Function to send a message
    function sendMessage() {
        const content = messageInput.value.trim();
        
        if (!content || !currentChannelId) {
            return;
        }
        
        // Clear input
        messageInput.value = '';
        
        // Show loading state
        sendMessageBtn.disabled = true;
        
        // Get the current server ID
        const serverId = getCurrentServerId();
        
        // Use the new API endpoint structure if server ID is available, otherwise fall back to old endpoint
        const apiUrl = serverId ? 
            `/api/servers/${serverId}/channels/${currentChannelId}/messages` : 
            `/api/channels/${currentChannelId}/messages`;
        
        // Send message to server
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                content: content
            })
        })
        .then(response => {
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON, got ${contentType}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                console.error('Error sending message:', data.message);
                // Re-add the message to the input if it failed
                messageInput.value = content;
                showNotification('Failed to send message: ' + data.message, 'error');
            }
            // Remove the socket.emit call since the MessageController will broadcast the message
            // The server will send the message back via socket.io
        })
        .catch(error => {
            console.error('Error sending message:', error);
            // Re-add the message to the input if it failed
            messageInput.value = content;
            showNotification('Failed to send message. Please try again.', 'error');
        })
        .finally(() => {
            // Re-enable the send button
            sendMessageBtn.disabled = false;
        });
    }
    
    // Helper function to show notifications
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.classList.add('fixed', 'bottom-4', 'right-4', 'px-4', 'py-2', 'rounded', 'shadow-lg', 'text-white', 'z-50');
        
        // Set style based on type
        if (type === 'error') {
            notification.classList.add('bg-red-500');
        } else if (type === 'success') {
            notification.classList.add('bg-green-500');
        } else {
            notification.classList.add('bg-blue-500');
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Function to handle new messages received via WebSocket
    function handleNewMessage(message) {
        // Check if we're looking at the right channel
        if (message.channelId && message.channelId != currentChannelId) {
            return;
        }
        
        // Find if there's an existing message group for this user
        const lastMessageGroup = messagesContainer.querySelector(`.message-group[data-user-id="${message.user.userId}"]`);
        
        if (lastMessageGroup && isRecentMessage(lastMessageGroup)) {
            // Add to existing group
            const messagesDiv = lastMessageGroup.querySelector('.messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message mt-1';
            messageDiv.dataset.messageId = message.id;
            
            messageDiv.innerHTML = `
                <p class="text-gray-200">${formatMessageContent(message.content)}</p>
                ${message.attachment_url ? `<div class="mt-2"><img src="${message.attachment_url}" alt="Attachment" class="max-w-xs rounded"></div>` : ''}
            `;
            
            messagesDiv.appendChild(messageDiv);
        } else {
            // Create new message group
            const messageGroupDiv = document.createElement('div');
            messageGroupDiv.className = 'message-group flex mb-4';
            messageGroupDiv.dataset.userId = message.user.userId;
            messageGroupDiv.dataset.timestamp = new Date().getTime();
            
            // Avatar
            const avatarUrl = message.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.user.username)}&background=random`;
            
            messageGroupDiv.innerHTML = `
                <img src="${avatarUrl}" alt="${message.user.username}" class="w-10 h-10 rounded-full mr-4">
                <div class="message-content flex-1">
                    <div class="message-header flex items-center">
                        <span class="font-semibold text-white">${message.user.username}</span>
                        <span class="text-xs text-gray-400 ml-2">${message.formatted_time || 'Just now'}</span>
                    </div>
                    <div class="messages">
                        <div class="message" data-message-id="${message.id}">
                            <p class="text-gray-200">${formatMessageContent(message.content)}</p>
                            ${message.attachment_url ? `<div class="mt-2"><img src="${message.attachment_url}" alt="Attachment" class="max-w-xs rounded"></div>` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            messagesContainer.appendChild(messageGroupDiv);
        }
        
        // Scroll to bottom to show new message
        scrollToBottom();
    }
    
    // Function to check if a message group is recent (for grouping messages)
    function isRecentMessage(messageGroup) {
        if (!messageGroup.dataset.timestamp) return false;
        const timestamp = parseInt(messageGroup.dataset.timestamp);
        const now = new Date().getTime();
        
        // Group messages that are within 5 minutes of each other
        return now - timestamp < 5 * 60 * 1000;
    }
    
    // Function to handle message updates
    function handleMessageUpdate(data) {
        const messageElement = document.querySelector(`.message[data-message-id="${data.id}"]`);
        if (!messageElement) return;
        
        const contentElement = messageElement.querySelector('p');
        contentElement.innerHTML = formatMessageContent(data.content);
        
        // Add edited indicator if not already there
        if (!messageElement.querySelector('.text-gray-500')) {
            const editedSpan = document.createElement('span');
            editedSpan.className = 'text-xs text-gray-500 ml-1';
            editedSpan.textContent = '(edited)';
            contentElement.insertAdjacentElement('afterend', editedSpan);
        }
    }
    
    // Function to handle message deletions
    function handleMessageDelete(data) {
        const messageElement = document.querySelector(`.message[data-message-id="${data.id}"]`);
        if (!messageElement) return;
        
        // Remove the message element
        messageElement.remove();
        
        // If this was the only message in the group, remove the whole group
        const messageGroups = document.querySelectorAll('.message-group');
        messageGroups.forEach(group => {
            if (group.querySelector('.message') === null) {
                group.remove();
            }
        });
    }
    
    // Function to handle typing indicator
    function handleUserTyping(data) {
        // Don't show typing indicator for own messages
        if (data.user.userId === '<?php echo $_SESSION['user_id']; ?>') {
            return;
        }
        
        // Show typing indicator
        typingUsername.textContent = data.user.username;
        typingIndicator.classList.remove('hidden');
        
        // Hide after a few seconds
        setTimeout(() => {
            typingIndicator.classList.add('hidden');
        }, 3000);
    }
    
    // Adjust scroll position
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Send message on form submit
    messageForm.addEventListener('submit', function(e) {
        e.preventDefault();
        sendMessage();
    });
    
    // Send message on button click
    sendMessageBtn.addEventListener('click', function() {
        sendMessage();
    });
    
    // Send message on Enter key, but allow Shift+Enter for new line
    messageInput.addEventListener('keydown', function(e) { 
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Send typing indicator when user starts typing
    messageInput.addEventListener('input', function() {
        if (!currentChannelId) return;
        
        clearTimeout(typingTimeout);
        
        // Emit typing event to WebSocket
        socket.emit('typing', {
            channelId: currentChannelId,
            userId: '<?php echo $_SESSION['user_id']; ?>'
        });
        
        // Stop "typing" after 3 seconds of inactivity
        typingTimeout = setTimeout(() => {
            // Could emit a "stopped typing" event if needed
        }, 3000);
    });
});
</script>
