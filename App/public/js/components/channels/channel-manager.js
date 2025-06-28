import { showToast } from '../../core/ui/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    initChannelManager();
});

function initChannelManager() {
    loadServerChannels();
    initUpdateChannelForms();
    initDeleteChannelButtons();
}

function loadServerChannels() {
    const serverId = getServerId();
    if (!serverId) return;

    window.serverAPI.getServerChannels(serverId)
        .then(response => {
            if (response.data) {
                renderChannelList(response.data);
            }
        })
        .catch(error => {
            console.error('Error loading channels:', error);
        });
}

function initUpdateChannelForms() {
    const updateChannelForms = document.querySelectorAll('.update-channel-form');

    updateChannelForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const channelId = this.getAttribute('data-channel-id');
            const formData = new FormData(this);            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            window.channelAPI.updateChannel(channelId, data)
                .then(response => {
                    if (response.data) {
                        showToast('Channel updated successfully', 'success');

                        const modal = document.getElementById(`edit-channel-modal-${channelId}`);
                        if (modal && typeof closeModal === 'function') {
                            closeModal(modal);
                        }

                        if (response.data && response.data.channel) {
                            updateChannelInUI(response.data.channel);
                        } else {
                            refreshChannelList();
                        }
                    }
                })
                .catch(error => {
                    console.error('Error updating channel:', error);
                    showToast('Failed to update channel', 'error');
                });
        });
    });
}

function initDeleteChannelButtons() {
    const deleteChannelButtons = document.querySelectorAll('.delete-channel-btn');

    deleteChannelButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            const channelId = this.getAttribute('data-channel-id');
            const channelName = this.getAttribute('data-channel-name') || 'this channel';

            if (confirm(`Are you sure you want to delete ${channelName}? This cannot be undone.`)) {
                deleteChannel(channelId);
            }
        });
    });
}

function deleteChannel(channelId) {
    window.channelAPI.deleteChannel(channelId)
        .then(response => {
            if (response.data) {
                showToast('Channel deleted successfully', 'success');
                refreshChannelList();
            }
        })
        .catch(error => {
            console.error('Error deleting channel:', error);
            showToast('Failed to delete channel', 'error');
        });
}

function refreshChannelList() {
    const urlParts = window.location.pathname.split('/');
    const serverId = urlParts[urlParts.indexOf('server') + 1];

    if (serverId) {
        window.serverAPI.getServerChannels(serverId)
            .then(response => {
                if (response.data) {
                    renderChannelList(response.data);
                } else {
                    console.error('Error refreshing channels:', response.message);
                    showToast('Error refreshing channels', 'error');
                }
            })
            .catch(error => {
                console.error('Error refreshing channels:', error);
                showToast('Error refreshing channels', 'error');
            });
    } else {
        console.error('No server ID found in URL');
        showToast('Error: Could not determine server', 'error');
    }
}

function renderChannelList(rawData) {
    // Unwrap nested data if response structure is { success, data: {...} }
    let data = rawData;
    if (data && !data.channels && !data.uncategorized && data.data) {
        data = data.data;
    }

    // Extract incoming server id (supports various API formats)
    const incomingServerId = data?.server_id || data?.serverId || data?.server?.id || null;
    const currentUrlServerId = getServerId(); // Get server ID from URL

    console.log('🔄 renderChannelList called:', {
        incomingServerId,
        currentUrlServerId,
        dataKeys: Object.keys(data || {})
    });
    
    const channelContainer = document.querySelector('.channel-wrapper .channel-list') || 
                           document.querySelector('.channel-list');
    
    if (!channelContainer) {
        console.error('❌ Channel container not found');
        return;
    }

    // Get the server id currently rendered in the DOM (if any)
    const currentRenderedServerId = channelContainer.getAttribute('data-server-id');
    
    // Determine if the currently rendered channel list is out-of-sync with the API response
    const existingChannels = channelContainer.querySelectorAll('.channel-item');
    const serverMismatch = (currentUrlServerId && currentRenderedServerId && currentUrlServerId !== currentRenderedServerId) ||
                          (incomingServerId && currentRenderedServerId && incomingServerId !== currentRenderedServerId);

    // Determine if the currently rendered channel list is out-of-sync with the API response
    const existingChannelIds = Array.from(existingChannels).map(ch => ch.dataset.channelId);
    const apiChannelIds = (data.channels || data.uncategorized || []).map(ch => String(ch.id));
    const hasWrongChannels = !existingChannelIds.every(id => apiChannelIds.includes(id)) ||
                              existingChannelIds.length !== apiChannelIds.length;

    // Trigger a fresh render whenever there are no channels, a server mismatch, *or* the wrong channels are present
    const needsFullRender = !existingChannels.length || serverMismatch || hasWrongChannels;

    console.log('🔍 Render decision:', {
        existingChannels: existingChannels.length,
        currentRenderedServerId,
        currentUrlServerId,
        incomingServerId,
        serverMismatch,
        hasWrongChannels,
        needsFullRender
    });

    // Always force re-render if server mismatch or wrong channels detected
    const correctServerId = currentUrlServerId || incomingServerId;

    if (serverMismatch || hasWrongChannels) {
        console.log('🚨 FORCE RE-RENDER:', {
            serverMismatch,
            hasWrongChannels,
            existingChannelIds,
            apiChannelIds
        });
        
        // Force clear everything
        channelContainer.innerHTML = '';
        
        // Add server ID input with correct value
        if (correctServerId) {
            const newInput = document.createElement('input');
            newInput.type = 'hidden';
            newInput.id = 'current-server-id';
            newInput.value = correctServerId;
            channelContainer.appendChild(newInput);
            channelContainer.setAttribute('data-server-id', correctServerId);
        }
    }

    // If channels already rendered for SAME server, just refresh event listeners & highlighting
    if (!needsFullRender) {
        console.log(`📋 ${existingChannels.length} channels already rendered for server ${currentRenderedServerId}. Refreshing only.`);
        initChannelEventListeners();

        // Update active highlight
        const currentChannelId = new URLSearchParams(window.location.search).get('channel');
        if (currentChannelId) {
            document.querySelectorAll('.channel-item').forEach(ch => ch.classList.remove('bg-discord-lighten', 'bg-gray-700', 'text-white', 'active-channel'));
            const activeChannel = channelContainer.querySelector(`[data-channel-id="${currentChannelId}"]`);
            if (activeChannel) {
                activeChannel.classList.add('bg-discord-lighten', 'text-white', 'active-channel');
                console.log(`✅ Marked channel ${currentChannelId} as active (refresh only)`);
            } else {
                console.warn(`⚠️ Channel ${currentChannelId} not found in DOM for highlighting`);
            }
        }
        return;
    }

    // --- FULL RENDER FOLLOWS ---

    console.log('🧹 Performing full channel render');

    // Ensure container is clean
    if (channelContainer.children.length === 0 || serverMismatch) {
        const correctServerId = currentUrlServerId || incomingServerId;
        if (correctServerId) {
            const newInput = document.createElement('input');
            newInput.type = 'hidden';
            newInput.id = 'current-server-id';
            newInput.value = correctServerId;
            channelContainer.appendChild(newInput);
            channelContainer.setAttribute('data-server-id', correctServerId);
        }
    }

    // Render all channels from data
    const allChannels = data.channels || data.uncategorized || [];
    console.log(`📋 Rendering ${allChannels.length} channels:`, allChannels.map(ch => `${ch.id}:${ch.name}`));

    if (allChannels.length === 0) {
        channelContainer.innerHTML += '<div class="p-4 text-gray-400 text-center text-sm">No channels available</div>';
        return;
    }

    // Separate text and voice channels
    const textChannels = allChannels.filter(ch => 
        ch.type === 'text' || ch.type === 1 || ch.type_name === 'text'
    );
    
    const voiceChannels = allChannels.filter(ch => 
        ch.type === 'voice' || ch.type === 2 || ch.type_name === 'voice'
    );

    console.log(`📝 Text channels: ${textChannels.length}, 🎤 Voice channels: ${voiceChannels.length}`);

    // Clear existing sections
    const oldTextSection = channelContainer.querySelector('.channels-section');
    const oldVoiceSection = channelContainer.querySelector('.voice-channels-section');
    if (oldTextSection) oldTextSection.remove();
    if (oldVoiceSection) oldVoiceSection.remove();

    // Render text channels
    if (textChannels.length > 0) {
        const textSection = document.createElement('div');
        textSection.className = 'channels-section group mb-4';
        
        textChannels.forEach(channel => {
            const channelEl = createChannelElementPHP(channel);
            textSection.appendChild(channelEl);
        });
        
        channelContainer.appendChild(textSection);
    }

    // Render voice channels
    if (voiceChannels.length > 0) {
        const voiceSection = document.createElement('div');
        voiceSection.className = 'voice-channels-section group mb-4';
        
        voiceChannels.forEach(channel => {
            const channelEl = createChannelElementPHP(channel);
            voiceSection.appendChild(channelEl);
        });
        
        channelContainer.appendChild(voiceSection);
    }

    // Set up event listeners
    initChannelEventListeners();
    
    // Mark current channel as active
    const currentChannelId = new URLSearchParams(window.location.search).get('channel');
    if (currentChannelId) {
        const activeChannel = channelContainer.querySelector(`[data-channel-id="${currentChannelId}"]`);
        if (activeChannel) {
            activeChannel.classList.add('bg-discord-lighten', 'text-white', 'active-channel');
            console.log(`✅ Marked channel ${currentChannelId} as active`);
        } else {
            console.warn(`⚠️ Channel ${currentChannelId} not found in rendered channels`);
            console.log(`   Available channels:`, allChannels.map(ch => ch.id));
        }
    }

    console.log('✅ Channel rendering complete');
}

function createChannelElementPHP(channel) {
    console.log('🎯 Creating channel element for:', channel);
    
    const channelEl = document.createElement('div');
    
    // Use the same structure as PHP renderChannel function
    const isActive = new URLSearchParams(window.location.search).get('channel') == channel.id;
    const activeClass = isActive ? 'bg-discord-lighten text-white active-channel' : '';
    
    const type = channel.type_name || channel.type || 'text';
    const icon = getChannelIconJS(type);
    
    channelEl.className = `channel-item flex items-center py-2 px-3 rounded cursor-pointer text-gray-400 hover:text-gray-300 hover:bg-discord-lighten ${activeClass}`;
    channelEl.setAttribute('data-channel-id', channel.id);
    channelEl.setAttribute('data-channel-type', type);
    channelEl.setAttribute('data-server-id', channel.server_id);
    
    channelEl.innerHTML = `
        <i class="fas fa-${icon} text-xs mr-3 text-gray-500"></i>
        <span class="text-sm">${channel.name}</span>
        ${type === 'voice' ? '<span class="ml-auto text-xs text-gray-500">0</span>' : ''}
    `;
    
    console.log(`✅ Created channel element: ${channel.name} (${type}) - Active: ${isActive}`);
    return channelEl;
}

function getChannelIconJS(type) {
    switch(String(type).toLowerCase()) {
        case 'voice':
        case '2':
            return 'volume-high';
        case 'announcement':
            return 'bullhorn';
        case 'forum':
            return 'users';
        default:
            return 'hashtag';
    }
}

function initChannelEventListeners() {
    console.log('🎯 Setting up channel event listeners');

    // Set up channel click handlers via the switch manager
    if (window.channelSwitchManager) {
        const channelContainer = document.querySelector('.channel-wrapper') || 
                               document.querySelector('.channel-list');
        if (channelContainer) {
            window.channelSwitchManager.setupChannelClickHandlers(channelContainer);
            console.log('✅ Channel click handlers set up via switchManager');
        }
    } else {
        console.warn('⚠️ channelSwitchManager not available, waiting and retrying...');
        
        // Wait for channelSwitchManager to load
        let retries = 0;
        const maxRetries = 10;
        
        const checkForManager = () => {
            retries++;
            if (window.channelSwitchManager) {
                const channelContainer = document.querySelector('.channel-wrapper') || 
                                       document.querySelector('.channel-list');
                if (channelContainer) {
                    window.channelSwitchManager.setupChannelClickHandlers(channelContainer);
                    console.log('✅ Channel click handlers set up via switchManager (delayed)');
                }
            } else if (retries < maxRetries) {
                setTimeout(checkForManager, 200);
            } else {
                console.warn('⚠️ channelSwitchManager still not available, setting up basic handlers');
                setupBasicChannelHandlers();
            }
        };
        
        setTimeout(checkForManager, 200);
    }

    // Clean up any old event listeners on forms/buttons
    initUpdateChannelForms();
    initDeleteChannelButtons();
    
    console.log('✅ Event listeners setup complete');
}

function setupBasicChannelHandlers() {
    // Fallback: basic click handlers
    document.querySelectorAll('.channel-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const channelId = item.dataset.channelId;
            const serverId = document.getElementById('current-server-id')?.value;
            
            if (channelId && serverId) {
                const newUrl = `/server/${serverId}?channel=${channelId}`;
                window.location.href = newUrl;
            }
        });
    });
    console.log('✅ Basic channel handlers set up');
}

function getServerId() {
    const urlParts = window.location.pathname.split('/');
    return urlParts[urlParts.indexOf('server') + 1];
}

function openCreateChannelModal(categoryId = null) {
    const modal = document.getElementById('create-channel-modal');
    if (!modal) return;

    if (categoryId) {
        const categoryIdInput = modal.querySelector('input[name="category_id"]');
        if (categoryIdInput) {
            categoryIdInput.value = categoryId;
        }
    }

    if (typeof window.openModal === 'function') {
        window.openModal(modal);
    } else {
        modal.classList.remove('hidden');
    }
}

function updateChannelInUI(channel) {
    const channelElement = document.querySelector(`#channel-${channel.id}`);

    if (channelElement) {
        const channelNameElement = channelElement.querySelector('.channel-name');
        if (channelNameElement) {
            channelNameElement.textContent = channel.name;
        }

        if (channel.is_private) {
            channelElement.classList.add('private-channel');
        } else {
            channelElement.classList.remove('private-channel');
        }
    } else {
        refreshChannelList();
    }
}

function createChannelAtPosition(name, type, serverId, categoryId = null, position = null) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('type', type);
    formData.append('server_id', serverId);

    if (categoryId) {
        formData.append('category_id', categoryId);
    }

    if (position !== null) {
        formData.append('position', position);
    }

    return window.channelAPI.createChannel(formData)
        .then(data => {
            if (data.data) {
                console.log('Channel created at position:', position);
                showToast('Channel created successfully', 'success');
                refreshChannelList();
                return data;
            } else {
                showToast(data.message || 'Failed to create channel', 'error');
                throw new Error(data.message || 'Failed to create channel');
            }
        })
        .catch(error => {
            console.error('Error creating channel:', error);
            showToast('An error occurred', 'error');
            throw error;
        });
}

function createCategoryAtPosition(name, serverId, position = null) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('server_id', serverId);

    if (position !== null) {
        formData.append('position', position);
    }

    return window.channelAPI.createCategory(formData)
        .then(data => {
            if (data.data) {
                console.log('Category created at position:', position);
                showToast('Category created successfully', 'success');
                refreshChannelList();
                return data;
            } else {
                showToast(data.message || 'Failed to create category', 'error');
                throw new Error(data.message || 'Failed to create category');
            }
        })
        .catch(error => {
            console.error('Error creating category:', error);
            showToast('An error occurred', 'error');
            throw error;
        });
}

function forceHighlightCurrentChannel() {
    const currentChannelId = new URLSearchParams(window.location.search).get('channel');
    if (!currentChannelId) return;

    console.log(`🎯 Force highlighting channel ${currentChannelId}`);
    
    // Clear all active states
    document.querySelectorAll('.channel-item').forEach(ch => {
        ch.classList.remove('bg-discord-lighten', 'bg-gray-700', 'text-white', 'active-channel');
    });
    
    // Find and highlight the current channel
    const activeChannel = document.querySelector(`[data-channel-id="${currentChannelId}"]`);
    if (activeChannel) {
        activeChannel.classList.add('bg-discord-lighten', 'text-white', 'active-channel');
        console.log(`✅ Successfully highlighted channel ${currentChannelId}`);
        return true;
    } else {
        console.warn(`⚠️ Channel ${currentChannelId} not found in DOM`);
        return false;
    }
}

function debugChannelState() {
    const currentChannelId = new URLSearchParams(window.location.search).get('channel');
    const channelItems = document.querySelectorAll('.channel-item');
    const activeChannels = document.querySelectorAll('.channel-item.active-channel');
    
    console.log(`🔍 CHANNEL DEBUG:`);
    console.log(`   Current URL channel: ${currentChannelId}`);
    console.log(`   Total channel items: ${channelItems.length}`);
    console.log(`   Active channels: ${activeChannels.length}`);
    
    channelItems.forEach((item, index) => {
        const channelId = item.dataset.channelId;
        const isActive = item.classList.contains('active-channel');
        const classes = Array.from(item.classList).join(' ');
        console.log(`   Channel ${index + 1}: ID=${channelId}, Active=${isActive}, Classes=${classes}`);
    });
}

if (typeof window !== 'undefined') {
    window.refreshChannelList = refreshChannelList;
    window.renderChannelList = renderChannelList;
    window.createChannelAtPosition = createChannelAtPosition;
    window.openCreateChannelModal = openCreateChannelModal;
    window.forceHighlightCurrentChannel = forceHighlightCurrentChannel;
    window.debugChannelState = debugChannelState;
}