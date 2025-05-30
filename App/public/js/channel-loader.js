// Channel Loader - Handles AJAX loading of channels
document.addEventListener('DOMContentLoaded', function() {
    // Initialize channel loader
    initChannelLoader();
});

function initChannelLoader() {
    const serverIdElement = document.querySelector('meta[name="server-id"]');
    if (serverIdElement) {
        const serverId = serverIdElement.getAttribute('content');
        if (serverId) {
            console.log('Channel loader initialized for server:', serverId);
            loadChannels(serverId);
            
            // Set up auto-refresh every 30 seconds
            setInterval(() => {
                loadChannels(serverId);
            }, 30000);
        }
    }
}

// Make loadChannels globally available
window.loadChannels = function(serverId) {
    _loadChannels(serverId);
};

// Internal implementation
function _loadChannels(serverId) {
    const channelContainer = document.getElementById('channel-container');
    if (!channelContainer) return;
    
    // Optional loading indicator
    const loadingIndicator = document.getElementById('channel-loading');
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    
    fetch(`/api/servers/${serverId}/channels`)
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                throw new Error('Server returned non-JSON response');
            }
        })
        .then(data => {
            console.log('API response:', data); // Debug
            
            if (data.success) {
                // Handle response structure from ServerController's getServerChannels method
                let channels = [];
                let categories = [];
                
                // Handle different response structures
                if (data.data) {
                    // New structure from ServerController's successResponse method
                    if (data.data.categories) {
                        categories = data.data.categories;
                        
                        // Extract all channels from the categories
                        categories.forEach(category => {
                            if (Array.isArray(category.channels)) {
                                channels = [...channels, ...category.channels];
                            }
                        });
                    }
                    
                    // Add uncategorized channels
                    if (Array.isArray(data.data.uncategorizedChannels)) {
                        channels = [...channels, ...data.data.uncategorizedChannels];
                    }
                } else if (data.channels || data.categories) {
                    // Old structure with direct channels and categories arrays
                    channels = data.channels || [];
                    categories = data.categories || [];
                }
                
                updateChannelUI(channelContainer, channels, categories);
                console.log('Channels loaded successfully', 
                    `(${channels.length} channels, ${categories.length} categories)`);
            } else {
                console.error('Error loading channels:', data.message || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Error fetching channels:', error);
        })
        .finally(() => {
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
        });
}

// Local reference for internal use (aliasing the global function)
const loadChannels = _loadChannels;

function updateChannelUI(container, channels, categories) {
    // Ensure channels and categories are arrays
    channels = Array.isArray(channels) ? channels : [];
    categories = Array.isArray(categories) ? categories : [];
    
    // Save current scroll position
    const scrollPosition = container.scrollTop;
    
    // Store the current active channel
    const activeChannelId = document.querySelector('.channel-item.active')?.dataset.channelId;
    
    // Create the HTML for channels
    let html = '';
    
    // Get voice and text channels without categories
    const textChannels = channels.filter(c => 
        (!c.category_id || c.category_id === null) && 
        (c.type === 'text' || c.type === 1 || c.type_name === 'text')
    );
    
    const voiceChannels = channels.filter(c => 
        (!c.category_id || c.category_id === null) && 
        (c.type === 'voice' || c.type === 2 || c.type_name === 'voice')
    );
    
    // Add uncategorized text channels first if they exist
    if (textChannels.length > 0) {
        html += '<div class="mb-2">';
        textChannels.forEach(channel => {
            const isActive = activeChannelId === channel.id;
            const channelIcon = getChannelIcon(channel.type_name || channel.type);
            html += createChannelHTML(channel, isActive, channelIcon);
        });
        html += '</div>';
    }
    
    // Add uncategorized voice channels next if they exist
    if (voiceChannels.length > 0) {
        html += '<div class="mb-2">';
        voiceChannels.forEach(channel => {
            const isActive = activeChannelId === channel.id;
            const channelIcon = getChannelIcon(channel.type_name || channel.type);
            html += createChannelHTML(channel, isActive, channelIcon);
        });
        html += '</div>';
    }
    
    // Add categories with their channels
    if (categories.length > 0) {
        // Ensure unique categories by ID
        const uniqueCategories = [];
        const seenCategoryIds = new Set();
        
        categories.forEach(category => {
            if (!category.id || seenCategoryIds.has(category.id)) return;
            seenCategoryIds.add(category.id);
            uniqueCategories.push(category);
        });
        
        uniqueCategories.forEach(category => {
            const categoryId = category.id;
            const categoryChannels = channels.filter(c => 
                c.category_id == categoryId || c.parent_id == categoryId
            );
            
            // Check if category was expanded or collapsed
            const isExpanded = !document.getElementById(`category-${categoryId}-channels`)?.classList.contains('hidden');
            
            html += createCategoryHTML(category, categoryChannels, isExpanded);
        });
    }
    
    // Update the container with new HTML
    container.classList.remove('hidden');  // Make sure the container is visible
    container.innerHTML = html;
    
    // Restore scroll position
    container.scrollTop = scrollPosition;
    
    // Re-attach event listeners for category toggle
    document.querySelectorAll('[data-category-id]').forEach(element => {
        element.addEventListener('click', function() {
            toggleCategory(this);
        });
    });
}

function getChannelIcon(channelType) {
    // Convert numeric types to string if needed
    if (typeof channelType === 'number') {
        switch(channelType) {
            case 2: return 'volume-high'; // voice
            case 3: return 'folder'; // category
            case 4: return 'bullhorn'; // announcement
            default: return 'hashtag'; // text (1) or unknown
        }
    }
    
    // Handle string types
    switch(String(channelType).toLowerCase()) {
        case 'voice': return 'volume-high';
        case 'category': return 'folder';
        case 'announcement': return 'bullhorn';
        default: return 'hashtag'; // text or unknown
    }
}

function createChannelHTML(channel, isActive, channelIcon) {
    // Check for valid channel object
    if (!channel) return '';
    
    // Get server ID from meta tag or use from channel if available
    const serverId = channel.server_id || document.querySelector('meta[name="server-id"]')?.getAttribute('content') || '';
    const channelId = channel.id || '';
    const channelName = channel.name || 'Unnamed Channel';
    
    const isVoice = (channelIcon === 'volume-high');
    
    // Parse channel name to handle emoji in the format "channel name" or "emoji channel name" or "emoji channel emoji"
    const channelNameParts = parseChannelName(channelName);
    
    return `
        <a href="/server/${serverId}?channel=${channelId}" 
           class="channel-item flex items-center px-1 py-[6px] ml-2 rounded group ${isActive ? 'bg-discord-light text-white active' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-100'}"
           data-channel-id="${channelId}">
            <i class="fas fa-${channelIcon || 'hashtag'} w-4 text-sm opacity-70"></i>
            <span class="ml-1.5 truncate text-[14px]">${channelNameParts}</span>
            ${isActive ? `
            <div class="ml-auto flex">
                <button class="text-gray-400 hover:text-gray-200 p-1 opacity-70 hover:opacity-100">
                    <i class="fas fa-user-plus text-xs"></i>
                </button>
                <button class="text-gray-400 hover:text-gray-200 p-1 opacity-70 hover:opacity-100">
                    <i class="fas fa-cog text-xs"></i>
                </button>
            </div>
            ` : ''}
        </a>
    `;
}

function createCategoryHTML(category, categoryChannels, isExpanded) {
    // Ensure categoryChannels is an array
    categoryChannels = Array.isArray(categoryChannels) ? categoryChannels : [];
    
    // Ensure category has all required properties
    const categoryId = category.id || '';
    const categoryName = category.name || 'Unnamed Category';
    
    // Parse category name to handle emoji
    const categoryNameParts = parseCategoryName(categoryName);
    
    let html = `
        <div class="category-container mt-1">
            <div class="category-header flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-gray-200 cursor-pointer py-[6px] px-0.5 select-none" 
                data-category-id="${categoryId}" 
                onclick="toggleCategory(this)">
                <div class="flex items-center">
                    <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'} w-3 mr-[2px] text-xs"></i>
                    <span class="uppercase tracking-wide text-[11px]">${categoryNameParts}</span>
                </div>
                <div class="category-actions opacity-0 group-hover:opacity-100 pr-1">
                    <button onclick="openCreateCategoryModal(); event.stopPropagation();" class="text-gray-400 hover:text-gray-200 p-0.5">
                        <i class="fas fa-plus text-[10px]"></i>
                    </button>
                </div>
            </div>
            
            <div class="channels-container ${isExpanded ? '' : 'hidden'}" id="category-${categoryId}-channels">
    `;
    
    if (categoryChannels.length > 0) {
        categoryChannels.forEach(channel => {
            if (!channel) return; // Skip undefined channels
            
            const isActive = document.querySelector('.channel-item.active')?.dataset.channelId === channel.id;
            const channelIcon = getChannelIcon(channel.type_name || channel.type);
            const serverId = channel.server_id || document.querySelector('meta[name="server-id"]')?.getAttribute('content') || '';
            const channelId = channel.id || '';
            const channelName = channel.name || 'Unnamed Channel';
            
            // Parse channel name to handle emoji
            const channelNameParts = parseChannelName(channelName);
            
            html += `
                <a href="/server/${serverId}?channel=${channelId}" 
                   class="channel-item flex items-center px-1 py-[6px] ml-2 rounded group ${isActive ? 'bg-discord-light text-white active' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-100'}"
                   data-channel-id="${channelId}">
                    <i class="fas fa-${channelIcon} w-4 text-sm opacity-70"></i>
                    <span class="ml-1.5 truncate text-[14px]">${channelNameParts}</span>
                    ${isActive ? `
                    <div class="ml-auto flex">
                        ${channelIcon !== 'volume-high' ? `
                        <button class="text-gray-400 hover:text-gray-200 p-1 opacity-70 hover:opacity-100">
                            <i class="fas fa-user-plus text-xs"></i>
                        </button>
                        ` : ''}
                        <button class="text-gray-400 hover:text-gray-200 p-1 opacity-70 hover:opacity-100">
                            <i class="fas fa-cog text-xs"></i>
                        </button>
                    </div>
                    ` : ''}
                </a>
            `;
        });
    } else {
        // No channels
        html += `<div class="text-xs text-gray-500 italic px-4 py-1 text-[11px] ml-6">No channels in this category</div>`;
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Parse channel name to handle emoji
 * @param {string} name - The channel name that may contain emoji
 * @returns {string} - HTML with emoji properly displayed
 */
function parseChannelName(name) {
    if (!name) return '';
    
    // Simple regex to detect emoji-like patterns
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
    
    // Replace emoji with spans for proper styling
    return name.replace(emojiRegex, '<span class="mr-1">$1</span>');
}

/**
 * Parse category name to handle emoji
 * @param {string} name - The category name that may contain emoji
 * @returns {string} - HTML with emoji properly displayed
 */
function parseCategoryName(name) {
    if (!name) return '';
    
    // Special handling for category names, which might be UPPER CASE with emoji
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
    
    // Replace emoji with spans for proper styling
    return name.replace(emojiRegex, '<span class="mx-0.5">$1</span>');
}

// Toggle category visibility
function toggleCategory(element) {
    const categoryId = element.getAttribute('data-category-id');
    const categoryContainer = element.closest('.category-container');
    const channelsContainer = document.getElementById(`category-${categoryId}-channels`);
    const icon = element.querySelector('i.fa-chevron-down, i.fa-chevron-right');
    
    if (!channelsContainer || !icon) return;
    
    if (channelsContainer.classList.contains('hidden')) {
        // Expand category
        channelsContainer.classList.remove('hidden');
        icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
        
        // Add a subtle animation
        channelsContainer.style.maxHeight = '0';
        channelsContainer.style.opacity = '0';
        
        // Force a reflow
        void channelsContainer.offsetHeight;
        
        // Apply transition
        channelsContainer.style.transition = 'max-height 0.2s ease-out, opacity 0.15s ease-out';
        channelsContainer.style.maxHeight = '500px';
        channelsContainer.style.opacity = '1';
        
        // Save state
        document.cookie = `category_${categoryId}=expanded; path=/; max-age=2592000`; // 30 days
    } else {
        // Collapse category
        icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
        
        // Add a subtle animation
        channelsContainer.style.maxHeight = channelsContainer.scrollHeight + 'px';
        channelsContainer.style.transition = 'max-height 0.2s ease-in, opacity 0.15s ease-in';
        
        // Force a reflow
        void channelsContainer.offsetHeight;
        
        // Apply transition
        channelsContainer.style.maxHeight = '0';
        channelsContainer.style.opacity = '0';
        
        // Hide after animation completes
        setTimeout(() => {
            channelsContainer.classList.add('hidden');
            channelsContainer.style.maxHeight = '';
            channelsContainer.style.opacity = '';
            channelsContainer.style.transition = '';
        }, 200);
        
        // Save state
        document.cookie = `category_${categoryId}=collapsed; path=/; max-age=2592000`; // 30 days
    }
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