document.addEventListener('DOMContentLoaded', function() {
    initMessageInput();
    initChannelToggle();
    initScrollToBottom();
    setupSocketListeners();
    initResponseListener();
    
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

function initMessageInput() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;
    
    messageInput.setAttribute('data-autosize', 'true');
    
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

function sendMessage() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;
    
    const channelId = messageInput.dataset.channelId;
    const content = messageInput.value.trim();
    
    if (!channelId || !content) return;
    
    const socket = window.misvordSocket;
    
    if (socket) {
        const message = {
            channelId,
            content,
            userId: document.getElementById('app-container').dataset.userId
        };
        
        socket.emit('message', message);
        messageInput.value = '';
        messageInput.style.height = 'auto';
    } else {
        console.error('Socket not available');
    }
}

function setupSocketListeners() {
    const socket = window.misvordSocket;
    if (!socket) return;
    
    socket.on('message', (message) => {
        addMessageToChat(message);
    });
    
    socket.on('typing', (data) => {
        showTypingIndicator(data);
    });
    
    socket.on('user-status-change', (data) => {
        updateUserStatus(data);
    });
}

function addMessageToChat(message) {
    const chatMessages = document.getElementById('chat-messages');
    const activeChannelId = document.getElementById('message-input')?.dataset.channelId;
    
    if (!chatMessages || message.channelId !== activeChannelId) return;
    
    const wasAtBottom = isScrolledToBottom(chatMessages);
    const lastMessage = chatMessages.querySelector('.message-container:last-child');
    const isSameUser = lastMessage && lastMessage.dataset.userId === message.userId;
    
    const messageDate = new Date(message.timestamp);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    const timeString = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let html = '';
    
    if (isSameUser) {
        html = `
            <div class="relative group-hover:visible invisible">
                <span class="text-xs text-gray-400 absolute -left-12">${timeString}</span>
            </div>
            <div class="text-gray-300 select-text break-words">
                ${formatMessageContent(message.content)}
            </div>
        `;
        
        lastMessage.insertAdjacentHTML('beforeend', html);
    } else {
        html = `
            <div class="mb-4 group hover:bg-discord-dark/30 p-1 rounded -mx-1 message-container" data-user-id="${message.userId}">
                <div class="flex items-start">
                    <div class="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden mr-3">
                        <img src="${message.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.username)}&background=random`}" 
                             alt="Avatar" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center">
                            <span class="font-medium text-white mr-2">${escapeHtml(message.username)}</span>
                            <span class="text-xs text-gray-400">${timeString}</span>
                        </div>
                        <div class="text-gray-300 select-text break-words">
                            ${formatMessageContent(message.content)}
                        </div>
                    </div>
                </div>
                <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1 ml-12">
                    <button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">
                        <i class="fas fa-face-smile text-xs"></i>
                    </button>
                    <button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">
                        <i class="fas fa-pen-to-square text-xs"></i>
                    </button>
                    <button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">
                        <i class="fas fa-reply text-xs"></i>
                    </button>
                    <button class="p-1 text-gray-400 hover:text-white hover:bg-discord-light rounded-sm">
                        <i class="fas fa-ellipsis text-xs"></i>
                    </button>
                </div>
            </div>
        `;
        
        chatMessages.insertAdjacentHTML('beforeend', html);
    }
    
    if (wasAtBottom) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function showTypingIndicator(data) {
    const { username, channelId } = data;
    const activeChannelId = document.getElementById('message-input')?.dataset.channelId;
    
    if (channelId !== activeChannelId) return;
    
    const typingIndicator = document.getElementById('typing-indicator');
    if (!typingIndicator) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.className = 'text-xs text-gray-400 px-4 py-2';
        indicator.textContent = `${username} is typing...`;
        
        chatMessages.parentNode.insertBefore(indicator, chatMessages.nextSibling);
        
        setTimeout(() => {
            indicator.remove();
        }, 3000);
    } else {
        typingIndicator.textContent = `${username} is typing...`;
        
        clearTimeout(window.typingTimeout);
        window.typingTimeout = setTimeout(() => {
            typingIndicator.remove();
        }, 3000);
    }
}

function updateUserStatus(data) {
    const { userId, status } = data;
    const memberElements = document.querySelectorAll(`[data-user-id="${userId}"]`);
    
    memberElements.forEach(element => {
        const statusIndicator = element.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.className = `absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark bg-discord-${getStatusClass(status)}`;
        }
    });
}

function getStatusClass(status) {
    switch (status) {
        case 'online': return 'green';
        case 'idle': case 'away': return 'yellow';
        case 'dnd': return 'red';
        default: return 'gray-500';
    }
}

function initChannelToggle() {
    const toggleButtons = document.querySelectorAll('[data-toggle="channel-list"]');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const target = document.getElementById(targetId);
            
            if (target) {
                target.classList.toggle('hidden');
                
                const icon = this.querySelector('i');
                if (icon) {
                    if (target.classList.contains('hidden')) {
                        icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
                    } else {
                        icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
                    }
                }
            }
        });
    });
}

function initScrollToBottom() {
    const scrollButton = document.getElementById('scroll-to-bottom');
    const chatMessages = document.getElementById('chat-messages');
    
    if (!scrollButton || !chatMessages) return;
    
    chatMessages.addEventListener('scroll', function() {
        if (!isScrolledToBottom(chatMessages)) {
            scrollButton.classList.remove('hidden');
        } else {
            scrollButton.classList.add('hidden');
        }
    });
    
    scrollButton.addEventListener('click', function() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

function isScrolledToBottom(element) {
    return element.scrollHeight - element.clientHeight <= element.scrollTop + 30;
}

function formatMessageContent(content) {
    if (!content) return '';
    
    let formatted = escapeHtml(content);
    
    formatted = formatted
        .replace(/\n/g, '<br>')
        .replace(/```(.+?)```/gs, '<pre class="bg-discord-darker p-2 rounded my-1 text-sm overflow-x-auto"><code>$1</code></pre>')
        .replace(/`(.+?)`/g, '<code class="bg-discord-darker px-1 rounded text-sm">$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/~~(.+?)~~/g, '<del>$1</del>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-400 hover:underline">$1</a>');
    
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function initResponseListener() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;
    
    let typingTimeout;
    
    messageInput.addEventListener('input', function() {
        const channelId = messageInput.dataset.channelId;
        const socket = window.misvordSocket;
        
        if (!socket || !channelId) return;
        
        clearTimeout(typingTimeout);
        
        socket.emit('typing', {
            channelId,
            username: document.getElementById('app-container').dataset.username
        });
        
        typingTimeout = setTimeout(() => {
            socket.emit('stop-typing', {
                channelId
            });
        }, 3000);
    });
}
