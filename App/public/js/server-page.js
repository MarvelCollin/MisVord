document.addEventListener('DOMContentLoaded', function() {
    // Server hover effects
    const serverIcons = document.querySelectorAll('.server-icon:not(.active-server)');
    serverIcons.forEach(server => {
        server.addEventListener('mouseenter', function() {
            const pill = document.createElement('div');
            pill.className = 'absolute left-0 w-1 h-5 bg-white rounded-r-full transition-all duration-200';
            pill.style.top = '15px';
            this.appendChild(pill);
        });
        
        server.addEventListener('mouseleave', function() {
            const pill = this.querySelector(':scope > div.absolute');
            if (pill) pill.remove();
        });
    });

    // Channel click handler
    const channelItems = document.querySelectorAll('.channel-item');
    channelItems.forEach(channel => {
        channel.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all channels
            channelItems.forEach(ch => ch.classList.remove('bg-gray-700', 'text-white'));
            
            // Add active class to clicked channel
            this.classList.add('bg-gray-700', 'text-white');
            
            // Update channel name in header
            const channelName = this.querySelector('.channel-name').textContent.trim();
            document.querySelector('.channel-header-name').textContent = channelName;
        });
    });

    // Message input functionality
    const messageInput = document.querySelector('.message-input');
    const messageForm = document.querySelector('.message-form');
    
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const input = this.querySelector('input');
            const message = input.value.trim();
            
            if (message) {
                // In a real app, you would send this to the server
                // For now, just add it to the UI
                addMessage(message);
                input.value = '';
            }
        });
    }
    
    // Function to add a new message to the chat
    function addMessage(content) {
        const messagesContainer = document.querySelector('.messages-container');
        if (!messagesContainer) return;
        
        // Get current user info
        const username = document.querySelector('.user-profile-section .font-medium').textContent;
        const avatarSrc = document.querySelector('.user-profile-section img').src;
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex mb-4 message-group p-2 rounded hover:bg-gray-700/30';
        
        // Format current time
        const now = new Date();
        const timeString = `Today at ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Set message HTML
        messageDiv.innerHTML = `
            <img src="${avatarSrc}" alt="${username}'s avatar" class="w-10 h-10 rounded-full mr-4">
            <div>
                <div class="flex items-center">
                    <span class="font-semibold text-white">${username}</span>
                    <span class="text-xs text-gray-400 ml-2">${timeString}</span>
                </div>
                <p class="text-gray-200">${escapeHtml(content)}</p>
            </div>
        `;
        
        // Add to DOM and scroll into view
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Add animation class
        messageDiv.classList.add('animate-fadeIn');
        setTimeout(() => messageDiv.classList.remove('animate-fadeIn'), 500);
    }
    
    // Helper function to escape HTML to prevent XSS
    function escapeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
});
