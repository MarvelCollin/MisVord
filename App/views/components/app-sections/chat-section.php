<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>
<!-- Chat Section - Main chat area with messages -->
<div class="chat-section flex flex-col h-full">
    <!-- Channel Header -->
    <div class="flex items-center h-12 px-4 border-b border-[#2D3136] shadow-sm">
        <div class="flex items-center text-gray-200">
            <span class="text-gray-400 mr-2">#</span>
            <h2 class="font-semibold">binus-pathing</h2>
        </div>
        <div class="ml-2 text-sm text-gray-400">Welcome to Binus Pathing - How did you get in here?</div>
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
    <div class="flex-1 overflow-y-auto p-4">
        <!-- Message Group -->
        <div class="flex mb-4">
            <img src="<?php echo asset('/landing-page/blue-egg.webp'); ?>" alt="User avatar" class="w-10 h-10 rounded-full mr-4">
            <div>
                <div class="flex items-center">
                    <span class="font-semibold text-white">JohnDev</span>
                    <span class="text-xs text-gray-400 ml-2">Today at 12:30 PM</span>
                </div>
                <p class="text-gray-200">Hey everyone! Has anyone used MiscVord's new features?</p>
            </div>
        </div>
        
        <!-- Message Group -->
        <div class="flex mb-4">
            <img src="<?php echo asset('/landing-page/red-egg.webp'); ?>" alt="User avatar" class="w-10 h-10 rounded-full mr-4">
            <div>
                <div class="flex items-center">
                    <span class="font-semibold text-white">SarahCodes</span>
                    <span class="text-xs text-gray-400 ml-2">Today at 12:35 PM</span>
                </div>
                <p class="text-gray-200">Yes, the new voice chat quality is much better. And the screen sharing works really well too!</p>
                <p class="text-gray-200 mt-1">Have you tried the new server discovery page?</p>
            </div>
        </div>
        
        <!-- Message Group -->
        <div class="flex mb-4">
            <img src="<?php echo asset('/landing-page/green-egg.webp'); ?>" alt="User avatar" class="w-10 h-10 rounded-full mr-4">
            <div>
                <div class="flex items-center">
                    <span class="font-semibold text-white"><?php echo $_SESSION['username']; ?></span>
                    <span class="text-xs text-gray-400 ml-2">Today at 12:42 PM</span>
                </div>
                <p class="text-gray-200">Just joined! This interface looks amazing.</p>
            </div>
        </div>
    </div>
</div>

<!-- Message Input -->
<div class="p-4">
    <div class="bg-[#40444b] rounded-lg flex items-center p-1">
        <button class="p-2 text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
        </button>
        <input type="text" placeholder="Message #binus-pathing" class="bg-transparent border-none flex-1 p-2 focus:outline-none text-gray-200">
        <button class="p-2 text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
        <button class="p-2 text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </button>
    </div>
</div>

<style>
.chat-section {
    background-color: #36393f;
    flex: 1;
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
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    
    // Auto scroll to bottom on load
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Send message on Enter key
    messageInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && messageInput.value.trim() !== '') {
            // Create new message (dummy function to show how it would work)
            addNewMessage('You', messageInput.value.trim());
            messageInput.value = '';
        }
    });
    
    // Function to add a new message
    function addNewMessage(username, text) {
        const currentDate = new Date();
        const hours = currentDate.getHours();
        const minutes = currentDate.getMinutes().toString().padStart(2, '0');
        const timeString = `Today at ${hours % 12 || 12}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
        
        const messageGroup = document.createElement('div');
        messageGroup.className = 'message-group flex mb-4';
        
        messageGroup.innerHTML = `
            <img src="<?php echo asset('/landing-page/green-egg.webp'); ?>" alt="User Avatar" class="w-10 h-10 rounded-full mr-4">
            <div class="message-content">
                <div class="message-header flex items-center">
                    <span class="text-indigo-400 font-medium">${username}</span>
                    <span class="text-gray-500 text-xs ml-2">${timeString}</span>
                </div>
                <div class="message-text text-gray-200">
                    <p>${text}</p>
                </div>
            </div>
        `;
        
        // Hide typing indicator
        document.querySelector('.typing-indicator').style.display = 'none';
        
        // Add message to container and scroll to bottom
        messagesContainer.appendChild(messageGroup);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Show typing indicator again after a delay (simulating other user response)
        setTimeout(() => {
            document.querySelector('.typing-indicator').style.display = 'flex';
            
            // Simulate response
            setTimeout(() => {
                const responses = [
                    "That's awesome!",
                    "Interesting point...",
                    "I totally agree with you.",
                    "Let's talk about this more later.",
                    "Has anyone played the new game that just released?"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addBotMessage('NinjaPlayer', randomResponse);
            }, 3000);
        }, 1000);
    }
    
    // Function to add a bot message
    function addBotMessage(username, text) {
        const currentDate = new Date();
        const hours = currentDate.getHours();
        const minutes = currentDate.getMinutes().toString().padStart(2, '0');
        const timeString = `Today at ${hours % 12 || 12}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
        
        const messageGroup = document.createElement('div');
        messageGroup.className = 'message-group flex mb-4';
        
        messageGroup.innerHTML = `
            <img src="<?php echo asset('/landing-page/wumpus_happy.webp'); ?>" alt="User Avatar" class="w-10 h-10 rounded-full mr-4">
            <div class="message-content">
                <div class="message-header flex items-center">
                    <span class="text-blue-400 font-medium">${username}</span>
                    <span class="text-gray-500 text-xs ml-2">${timeString}</span>
                </div>
                <div class="message-text text-gray-200">
                    <p>${text}</p>
                </div>
            </div>
        `;
        
        // Hide typing indicator
        document.querySelector('.typing-indicator').style.display = 'none';
        
        // Add message to container and scroll to bottom
        messagesContainer.appendChild(messageGroup);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});
</script>
