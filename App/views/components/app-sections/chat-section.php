<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<!-- Chat Section - Main chat area with messages -->
<div class="chat-section flex flex-col h-full">
    <!-- Channel Header -->
    <div class="channel-header p-3 border-b border-gray-700 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <h3 class="text-white font-medium truncate">general</h3>
        <div class="channel-topic text-gray-400 text-sm ml-3 truncate border-l border-gray-600 pl-3">
            General chat for discussing anything related to gaming
        </div>
        
        <!-- Channel Actions -->
        <div class="flex items-center ml-auto space-x-4">
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

    <!-- Messages Area - Scrollable content -->
    <div class="messages-container flex-grow overflow-y-auto py-4 px-4" id="messagesContainer">
        <!-- Welcome message -->
        <div class="welcome-message mb-6">
            <div class="bg-gray-700 rounded-full p-4 w-16 h-16 mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-white mb-2">Welcome to #general!</h3>
            <p class="text-gray-400 mb-4">This is the start of the #general channel. Share your gaming adventures and make new friends!</p>
        </div>

        <!-- Date Divider -->
        <div class="date-divider flex items-center my-4">
            <div class="h-px bg-gray-700 flex-grow"></div>
            <div class="px-4 text-xs text-gray-500 font-medium">April 9, 2025</div>
            <div class="h-px bg-gray-700 flex-grow"></div>
        </div>

        <!-- Message Groups -->
        <!-- Message 1 -->
        <div class="message-group flex mb-4">
            <img src="<?php echo asset('/landing-page/discord-logo.webp'); ?>" alt="User Avatar" class="w-10 h-10 rounded-full mr-4">
            <div class="message-content">
                <div class="message-header flex items-center">
                    <span class="text-emerald-400 font-medium">GameMaster</span>
                    <span class="text-gray-500 text-xs ml-2">Today at 10:23 AM</span>
                </div>
                <div class="message-text text-gray-200">
                    <p>Hey everyone! Welcome to our new gaming server!</p>
                </div>
            </div>
        </div>

        <!-- Message 2 -->
        <div class="message-group flex mb-4">
            <img src="<?php echo asset('/landing-page/wumpus_happy.webp'); ?>" alt="User Avatar" class="w-10 h-10 rounded-full mr-4">
            <div class="message-content">
                <div class="message-header flex items-center">
                    <span class="text-blue-400 font-medium">NinjaPlayer</span>
                    <span class="text-gray-500 text-xs ml-2">Today at 10:25 AM</span>
                </div>
                <div class="message-text text-gray-200">
                    <p>Thanks for setting this up! I'm excited to play some games with everyone 🎮</p>
                </div>
            </div>
        </div>

        <!-- Message 3 -->
        <div class="message-group flex mb-4">
            <img src="<?php echo asset('/landing-page/flying-cat.webp'); ?>" alt="User Avatar" class="w-10 h-10 rounded-full mr-4">
            <div class="message-content">
                <div class="message-header flex items-center">
                    <span class="text-pink-400 font-medium">ProGamer2025</span>
                    <span class="text-gray-500 text-xs ml-2">Today at 10:30 AM</span>
                </div>
                <div class="message-text text-gray-200">
                    <p>Anyone up for Valorant later today? We could set up a custom game!</p>
                </div>
            </div>
        </div>

        <!-- Message 4 (with image attachment) -->
        <div class="message-group flex mb-4">
            <img src="<?php echo asset('/landing-page/thropy.webp'); ?>" alt="User Avatar" class="w-10 h-10 rounded-full mr-4">
            <div class="message-content">
                <div class="message-header flex items-center">
                    <span class="text-yellow-400 font-medium">StreamerExtraordinaire</span>
                    <span class="text-gray-500 text-xs ml-2">Today at 11:05 AM</span>
                </div>
                <div class="message-text text-gray-200">
                    <p>Check out this awesome screenshot from yesterday's tournament!</p>
                    <div class="message-attachment mt-2">
                        <img src="<?php echo asset('/landing-page/actor-sit.webp'); ?>" alt="Game Screenshot" class="rounded-md max-w-sm max-h-96">
                    </div>
                </div>
            </div>
        </div>

        <!-- Message 5 (with reply) -->
        <div class="message-group flex mb-4">
            <img src="<?php echo asset('/landing-page/discord-logo.webp'); ?>" alt="User Avatar" class="w-10 h-10 rounded-full mr-4">
            <div class="message-content">
                <div class="message-header flex items-center">
                    <span class="text-emerald-400 font-medium">GameMaster</span>
                    <span class="text-gray-500 text-xs ml-2">Today at 11:15 AM</span>
                </div>
                <div class="message-reply bg-gray-700 bg-opacity-30 rounded p-2 mb-1 text-sm">
                    <span class="text-pink-400">@ProGamer2025</span>
                    <span class="text-gray-400">Anyone up for Valorant later today? We could set up a custom game!</span>
                </div>
                <div class="message-text text-gray-200">
                    <p>I'm in for Valorant! Let's schedule it for 7PM. I'll create a calendar event for everyone.</p>
                </div>
            </div>
        </div>

        <!-- Message 6 (with code block) -->
        <div class="message-group flex mb-4">
            <img src="<?php echo asset('/landing-page/robot.webp'); ?>" alt="User Avatar" class="w-10 h-10 rounded-full mr-4">
            <div class="message-content">
                <div class="message-header flex items-center">
                    <span class="text-purple-400 font-medium">CodeWizard</span>
                    <span class="text-gray-500 text-xs ml-2">Today at 11:30 AM</span>
                </div>
                <div class="message-text text-gray-200">
                    <p>Hey, I've been working on a Discord bot for our server. Here's a snippet of the command handler:</p>
                    <pre class="bg-gray-900 rounded p-3 text-sm my-2 overflow-x-auto"><code>client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  try {
    const command = client.commands.get(commandName);
    if (!command) return;
    
    await command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply('There was an error executing that command!');
  }
});</code></pre>
                </div>
            </div>
        </div>

        <!-- Typing Indicator -->
        <div class="typing-indicator flex items-center text-xs text-gray-400 mt-2">
            <div class="typing-animation mr-2">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
            <span>NinjaPlayer is typing...</span>
        </div>
    </div>
    
    <!-- New Message Input -->
    <div class="message-input-container px-4 py-4 border-t border-gray-700">
        <div class="flex items-center">
            <!-- Attachment Button -->
            <button class="text-gray-400 hover:text-white p-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
            
            <!-- Message Input -->
            <div class="flex-grow mx-2 bg-gray-700 rounded-md">
                <div class="relative">
                    <input type="text" placeholder="Message #general" class="w-full bg-transparent text-white p-3 rounded-md focus:outline-none" id="messageInput">
                    
                    <!-- Emojis Button -->
                    <button class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- GIF Button -->
            <button class="text-gray-400 hover:text-white p-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </button>
        </div>
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
