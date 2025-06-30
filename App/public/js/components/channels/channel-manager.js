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
                }
            })
            .catch(error => {
                console.error('Error refreshing channels:', error);
            });
    } else {
        console.warn('No server ID found, cannot refresh channel list');
    }
}

function renderChannelList(rawData) {
    console.log('🔄 renderChannelList called - PHP handles rendering, JS only updates state');
    
    let data = rawData;
    if (data && !data.channels && !data.uncategorized && data.data) {
        data = data.data;
    }

    const currentUrlServerId = getServerId();
    const currentChannelId = new URLSearchParams(window.location.search).get('channel');
    
    console.log('📋 Data received:', {
        serverId: currentUrlServerId,
        activeChannelId: currentChannelId,
        channelsCount: (data.channels || []).length
    });

    initChannelEventListeners();
    
    if (currentChannelId) {
        const channelContainer = document.querySelector('.channel-wrapper .channel-list') || 
                               document.querySelector('.channel-list');
        
        if (channelContainer) {
            document.querySelectorAll('.channel-item').forEach(ch => ch.classList.remove('active-channel'));
            const activeChannel = channelContainer.querySelector(`[data-channel-id="${currentChannelId}"]`);
            if (activeChannel) {
                activeChannel.classList.add('active-channel');
                console.log(`✅ Marked channel ${currentChannelId} as active`);
            }
        }
    }
    
    if (window.channelDragDropManager) {
        window.channelDragDropManager.initializeDragElements();
    }
    
    window.dispatchEvent(new CustomEvent('channelManagerUpdated'));
    console.log('✅ Channel state updated');
}



function initChannelEventListeners() {
    console.log('🎯 Setting up channel event listeners');

    if (!window.channelSwitchManager) {
        console.warn('⚠️ channelSwitchManager not available, waiting and retrying...');
        
        let retries = 0;
        const maxRetries = 10;
        
        const checkForManager = () => {
            retries++;
            if (window.channelSwitchManager) {
                console.log('✅ Channel switch manager found (delayed)');
            } else if (retries < maxRetries) {
                setTimeout(checkForManager, 200);
            } else {
                console.warn('⚠️ channelSwitchManager still not available, setting up basic handlers');
                setupBasicChannelHandlers();
            }
        };
        
        setTimeout(checkForManager, 200);
    } else {
        console.log('✅ Channel switch manager ready');
    }

    initUpdateChannelForms();
    initDeleteChannelButtons();
    
    console.log('✅ Event listeners setup complete');
}

function setupBasicChannelHandlers() {
    document.querySelectorAll('.channel-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.channel-actions')) return;
            
            const channelId = item.dataset.channelId;
            const serverId = document.getElementById('current-server-id')?.value;
            
            if (channelId && serverId) {
                console.warn('Basic channel navigation fallback disabled - use channelSwitchManager instead');
            }
        });
    });
    console.log('✅ Basic channel handlers set up (disabled fallback navigation)');
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
        ch.classList.remove('active-channel');
    });
    
    // Find and highlight the current channel
    const activeChannel = document.querySelector(`[data-channel-id="${currentChannelId}"]`);
    if (activeChannel) {
        activeChannel.classList.add('active-channel');
        console.log(`✅ Successfully highlighted channel ${currentChannelId}`);
        return true;
    } else {
        console.warn(`⚠️ Channel ${currentChannelId} not found in DOM`);
        return false;
    }
}

function debugChannelState() {
    const channelList = document.querySelector('.channel-list');
    const channels = channelList ? channelList.querySelectorAll('.channel-item') : [];
    
    console.table({
        'Channel List Container': !!channelList,
        'Channel Count': channels.length,
        'Server ID from URL': getServerId(),
        'Server ID from DOM': document.getElementById('current-server-id')?.value,
        'Active Channel ID': new URLSearchParams(window.location.search).get('channel')
    });
    
    return {
        channelList,
        channels: Array.from(channels).map(ch => ({
            id: ch.dataset.channelId,
            name: ch.querySelector('span')?.textContent,
            active: ch.classList.contains('active-channel')
        }))
    };
}

if (typeof window !== 'undefined') {
    window.channelManager = {
        renderChannelList,
        refreshChannelList,
        loadServerChannels,
        initChannelManager,
        debugChannelState
    };
    
    window.refreshChannelList = refreshChannelList;
    window.openCreateChannelModal = openCreateChannelModal;
    window.debugChannelState = debugChannelState;
}