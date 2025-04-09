<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<!-- Channel Section - Server Sidebar with channels listing -->
<div class="channel-sidebar flex flex-col h-full">
    <!-- Server Header -->
    <div class="server-header p-3 border-b border-gray-700 flex items-center justify-between">
        <h2 class="text-white font-medium truncate">Gaming Server</h2>
        <button class="text-gray-300 hover:text-white focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </button>
    </div>

    <!-- Channel Search -->
    <div class="px-3 py-2">
        <div class="relative">
            <input type="text" placeholder="Search channels" class="w-full bg-gray-900 text-gray-300 rounded py-1 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 absolute top-1.5 right-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>
    </div>

    <!-- Channel List - Scrollable area -->
    <div class="overflow-y-auto flex-grow channel-list">
        <!-- Text Channels Category -->
        <div class="channel-category">
            <div class="channel-category-header flex items-center px-2 py-1.5 text-xs text-gray-400 uppercase font-semibold cursor-pointer hover:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-0.5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <span>Text Channels</span>
            </div>
            
            <div class="channel-items">
                <!-- General channel (active) -->
                <div class="channel-item active">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span>general</span>
                </div>
                
                <!-- Announcements channel -->
                <div class="channel-item">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span>announcements</span>
                </div>
                
                <!-- Rules channel -->
                <div class="channel-item">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span>rules-info</span>
                </div>
            </div>
        </div>
        
        <!-- Gaming Channels Category -->
        <div class="channel-category">
            <div class="channel-category-header flex items-center px-2 py-1.5 text-xs text-gray-400 uppercase font-semibold cursor-pointer hover:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-0.5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <span>Gaming</span>
            </div>
            
            <div class="channel-items">
                <div class="channel-item">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span>minecraft</span>
                </div>
                
                <div class="channel-item">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span>valorant</span>
                </div>
                
                <div class="channel-item">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span>league-of-legends</span>
                </div>
            </div>
        </div>
        
        <!-- Voice Channels Category -->
        <div class="channel-category">
            <div class="channel-category-header flex items-center px-2 py-1.5 text-xs text-gray-400 uppercase font-semibold cursor-pointer hover:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-0.5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <span>Voice Channels</span>
            </div>
            
            <div class="channel-items">
                <div class="channel-item voice-channel">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span>General Voice</span>
                    
                    <!-- Voice Channel Users -->
                    <div class="voice-users mt-1 ml-5">
                        <div class="voice-user flex items-center">
                            <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span class="text-gray-400 text-xs">GameMaster (speaking)</span>
                        </div>
                        <div class="voice-user flex items-center">
                            <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span class="text-gray-400 text-xs">NinjaPlayer</span>
                        </div>
                    </div>
                </div>
                
                <div class="channel-item voice-channel">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span>Gaming Voice</span>
                </div>
                
                <div class="channel-item voice-channel">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span>AFK</span>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.channel-sidebar {
    width: 240px;
    background-color: #2f3136;
}

.server-header {
    background-color: #2f3136;
    border-bottom-color: rgba(79, 84, 92, 0.48);
}

.channel-category {
    margin-top: 16px;
}

.channel-category:first-child {
    margin-top: 0;
}

.channel-item {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    margin: 1px 0;
    border-radius: 4px;
    cursor: pointer;
    color: #96989d;
    font-size: 0.9rem;
    gap: 5px;
}

.channel-item:hover {
    background-color: rgba(79, 84, 92, 0.3);
    color: #dcddde;
}

.channel-item.active {
    background-color: rgba(79, 84, 92, 0.6);
    color: #ffffff;
}

.channel-item span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.voice-users {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.voice-channel {
    margin-bottom: 8px;
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Add click event listeners to channels
    const channels = document.querySelectorAll('.channel-item');
    channels.forEach(channel => {
        channel.addEventListener('click', function() {
            channels.forEach(ch => ch.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Add toggle functionality to category headers
    const categoryHeaders = document.querySelectorAll('.channel-category-header');
    categoryHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const arrowIcon = this.querySelector('svg');
            arrowIcon.classList.toggle('rotate-90');
            arrowIcon.classList.toggle('rotate-0');
            
            const channelItems = this.parentNode.querySelector('.channel-items');
            if (channelItems.style.display === 'none') {
                channelItems.style.display = 'block';
            } else {
                channelItems.style.display = 'none';
            }
        });
    });
    
    // Simulate a speaking user in voice channel
    const speakingIndicator = document.querySelector('.voice-user:first-child .w-2');
    setInterval(() => {
        speakingIndicator.classList.toggle('animate-pulse');
    }, 2000);
});
</script>
