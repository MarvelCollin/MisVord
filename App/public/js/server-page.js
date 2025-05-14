document.addEventListener('DOMContentLoaded', function() {
    const serverElements = document.querySelectorAll('.server-icon');
    
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
            document.getElementById('current-channel-name').textContent = channelName;
        });
    });
    
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messageContainer = document.getElementById('message-container');
    
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const messageText = messageInput.value.trim();
            if (messageText) {
                
                
                addMessage({
                    userId: currentUserId,
                    username: currentUsername, 
                    content: messageText,
                    timestamp: new Date()
                });
                
                messageInput.value = '';
            }
        });
    }
    
    function addMessage(message) {
        
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
});
