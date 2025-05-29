// Message Handler Functionality
console.log('message-handler.js loaded');

document.addEventListener('DOMContentLoaded', function() {
    initMessageHandler();
});

function initMessageHandler() {
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messageContainer = document.getElementById('messages-container');
    
    if (messageForm && messageInput) {
        // Add event listener to the message form
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const message = messageInput.value.trim();
            if (!message) return;
            
            // Get the current channel ID from the URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const channelId = urlParams.get('channel');
            
            if (!channelId) {
                console.error('No channel ID found in URL');
                return;
            }
            
            // Get the server ID from the URL path
            const serverIdMatch = window.location.pathname.match(/\/server\/(\d+)/);
            const serverId = serverIdMatch ? serverIdMatch[1] : null;
            
            if (!serverId) {
                console.error('No server ID found in URL path');
                return;
            }
            
            // Send the message via API
            fetch(`/api/servers/${serverId}/channels/${channelId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: message
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Clear the input field
                    messageInput.value = '';
                    
                    // If we're using AJAX for loading messages, we would refresh the message list here
                    if (typeof loadMessages === 'function') {
                        loadMessages(channelId);
                    }
                } else {
                    console.error('Error sending message:', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
        
        // Add auto-resize functionality to the input
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        
        // Initial height adjustment
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';
    }
} 