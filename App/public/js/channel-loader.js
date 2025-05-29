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
            if (data.success) {
                updateChannelUI(channelContainer, data.channels, data.categories);
                console.log('Channels loaded successfully');
            } else {
                console.error('Error loading channels:', data.message);
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
    // Save current scroll position
    const scrollPosition = container.scrollTop;
    
    // Store the current active channel
    const activeChannelId = document.querySelector('.channel-item.active')?.dataset.channelId;
    
    // Create the HTML for channels
    let html = '';
    
    if (categories.length === 0) {
        // No categories, just list channels
        html += '<div class="space-y-1">';
        channels.forEach(channel => {
            const isActive = activeChannelId === channel.id;
            const channelIcon = getChannelIcon(channel.type_name || channel.type);
            html += createChannelHTML(channel, isActive, channelIcon);
        });
        html += '</div>';
    } else {
        // Group by categories
        categories.forEach(category => {
            const categoryId = category.id;
            const categoryChannels = channels.filter(c => 
                c.parent_id == categoryId || c.category_id == categoryId
            );
            
            // Check if category was expanded or collapsed
            const isExpanded = !document.getElementById(`category-${categoryId}-channels`)?.classList.contains('hidden');
            
            html += createCategoryHTML(category, categoryChannels, isExpanded);
        });
        
        // Add uncategorized channels
        const uncategorizedChannels = channels.filter(c => 
            (!c.parent_id || c.parent_id === null) && (!c.category_id || c.category_id === null)
        );
        
        if (uncategorizedChannels.length > 0) {
            html += '<div class="space-y-1 mt-2">';
            uncategorizedChannels.forEach(channel => {
                const isActive = activeChannelId === channel.id;
                const channelIcon = getChannelIcon(channel.type_name || channel.type);
                html += createChannelHTML(channel, isActive, channelIcon);
            });
            html += '</div>';
        }
    }
    
    // Update the container with new HTML
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
    const currentServerId = document.querySelector('meta[name="server-id"]').getAttribute('content');
    return `
        <a href="/server/${currentServerId}?channel=${channel.id}" 
           class="channel-item flex items-center px-2 py-1 rounded group ${isActive ? 'bg-discord-light text-white active' : 'text-gray-400 hover:bg-discord-light/50 hover:text-gray-300'}"
           data-channel-id="${channel.id}">
            <i class="fas fa-${channelIcon} w-4 text-sm"></i>
            <span class="ml-1 truncate">${escapeHtml(channel.name)}</span>
            <div class="ml-auto hidden group-hover:flex">
                <button class="text-gray-500 hover:text-gray-300 p-1">
                    <i class="fas fa-user-plus text-xs"></i>
                </button>
                <button class="text-gray-500 hover:text-gray-300 p-1">
                    <i class="fas fa-cog text-xs"></i>
                </button>
            </div>
        </a>
    `;
}

function createCategoryHTML(category, categoryChannels, isExpanded) {
    let html = `
        <div class="space-y-1">
            <div class="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-400 cursor-pointer px-1 py-1.5 select-none" 
                data-category-id="${category.id}" 
                onclick="toggleCategory(this)">
                <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'} w-3 mr-1"></i>
                <span class="uppercase tracking-wide">${escapeHtml(category.name)}</span>
            </div>
            
            <div class="space-y-1 ${isExpanded ? '' : 'hidden'}" id="category-${category.id}-channels">
    `;
    
    categoryChannels.forEach(channel => {
        const isActive = document.querySelector('.channel-item.active')?.dataset.channelId === channel.id;
        const channelIcon = getChannelIcon(channel.type_name || channel.type);
        html += `
            <a href="/server/${channel.server_id}?channel=${channel.id}" 
               class="channel-item flex items-center px-2 py-1 ml-2 rounded group ${isActive ? 'bg-discord-light text-white active' : 'text-gray-400 hover:bg-discord-light/50 hover:text-gray-300'}"
               data-channel-id="${channel.id}">
                <i class="fas fa-${channelIcon} w-4 text-sm"></i>
                <span class="ml-1 truncate">${escapeHtml(channel.name)}</span>
                <div class="ml-auto hidden group-hover:flex">
                    <button class="text-gray-500 hover:text-gray-300 p-1">
                        <i class="fas fa-user-plus text-xs"></i>
                    </button>
                    <button class="text-gray-500 hover:text-gray-300 p-1">
                        <i class="fas fa-cog text-xs"></i>
                    </button>
                </div>
            </a>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// Toggle category visibility
function toggleCategory(element) {
    const categoryId = element.getAttribute('data-category-id');
    const channelsContainer = document.getElementById(`category-${categoryId}-channels`);
    const icon = element.querySelector('i');
    
    if (channelsContainer.classList.contains('hidden')) {
        channelsContainer.classList.remove('hidden');
        icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
        document.cookie = `category_${categoryId}=expanded; path=/;`;
    } else {
        channelsContainer.classList.add('hidden');
        icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
        document.cookie = `category_${categoryId}=collapsed; path=/;`;
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