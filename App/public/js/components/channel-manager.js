import { MiscVordAjax } from '../core/ajax-handler.js';
import { showToast } from '../core/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    initChannelManager();
});

function initChannelManager() {
    // Load channels on page load
    loadServerChannels();

    initCreateChannelForm();

    initCreateCategoryForm();

    initUpdateChannelForms();

    initDeleteChannelButtons();
}

/**
 * Load server channels on page load
 */
function loadServerChannels() {
    const serverId = getServerId();
    if (!serverId) return;
    
    // Show loading indicator if available
    const loadingEl = document.getElementById('channel-loading');
    if (loadingEl) loadingEl.classList.remove('hidden');
    
    MiscVordAjax.get(`/api/servers/${serverId}/channels`, {
        onSuccess: function(response) {
            if (response.success) {
                renderChannelList(response.data);
            }
            // Hide loading indicator
            if (loadingEl) loadingEl.classList.add('hidden');
        },
        onError: function() {
            // Hide loading indicator on error
            if (loadingEl) loadingEl.classList.add('hidden');
        }
    });
}

function initCreateChannelForm() {
    const createChannelForm = document.getElementById('create-channel-form');

    if (createChannelForm) {
        createChannelForm.addEventListener('submit', function(e) {
            e.preventDefault();

            MiscVordAjax.submitForm(createChannelForm, {
                onSuccess: function(response) {
                    if (response.success) {
                        showToast('Channel created successfully', 'success');

                        const modal = document.getElementById('create-channel-modal');
                        if (modal && typeof closeModal === 'function') {
                            closeModal(modal);
                        }

                        createChannelForm.reset();

                        if (response.data && response.data.channel && response.data.channel.id) {
                            const serverId = response.data.channel.server_id;
                            const channelId = response.data.channel.id;
                            window.location.href = `/server/${serverId}?channel=${channelId}`;
                        } else {
                            refreshChannelList();
                        }
                    }
                }
            });
        });
    }
}

function initCreateCategoryForm() {
    const createCategoryForm = document.getElementById('create-category-form');

    if (createCategoryForm) {
        createCategoryForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(createCategoryForm);
            const serverId = formData.get('server_id');
            const categoryName = formData.get('name');

            if (!categoryName) {
                showToast('Category name is required', 'error');
                return;
            }

            MiscVordAjax.post('/api/channels/category', formData, {
                onSuccess: function(response) {
                    if (response.success) {
                        showToast('Category created successfully', 'success');

                        const modal = document.getElementById('create-category-modal');
                        if (modal && typeof closeModal === 'function') {
                            closeModal(modal);
                        }

                        createCategoryForm.reset();

                        refreshChannelList();
                    }
                }
            });
        });
    }
}

function initUpdateChannelForms() {
    const updateChannelForms = document.querySelectorAll('.update-channel-form');

    updateChannelForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const channelId = this.getAttribute('data-channel-id');
            const formData = new FormData(this);

            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }

            MiscVordAjax.put(`/api/channels/${channelId}`, data, {
                onSuccess: function(response) {
                    if (response.success) {
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
                }
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
    MiscVordAjax.delete(`/api/channels/${channelId}`, {
        onSuccess: function(response) {
            if (response.success) {
                showToast('Channel deleted successfully', 'success');

                refreshChannelList();
            }
        }
    });
}

function refreshChannelList() {
    // Get the current server ID from the URL
    const urlParts = window.location.pathname.split('/');
    const serverId = urlParts[urlParts.indexOf('server') + 1];
    
    if (serverId) {
        MiscVordAjax.get(`/api/servers/${serverId}/channels`, {
            onSuccess: function(response) {
                if (response.success) {
                    // Update the categories and channels in the UI
                    renderChannelList(response.data);
                }
            }
        });
    } else {
        // Fallback to page reload if we can't determine server ID
        window.location.reload();
    }
}

/**
 * Render channel list in UI based on server data
 * @param {Object} data - Server data with categories and channels
 */
function renderChannelList(data) {
    const channelContainer = document.querySelector('.channel-list-container');
    if (!channelContainer) return;
    
    // Clear existing channel list except for the header
    const headerDiv = channelContainer.querySelector('.flex.justify-between.items-center');
    channelContainer.innerHTML = '';
    if (headerDiv) {
        channelContainer.appendChild(headerDiv);
    }
    
    // Add uncategorized channels if any
    if (data.uncategorizedChannels && data.uncategorizedChannels.length > 0) {
        const uncategorizedSection = document.createElement('div');
        uncategorizedSection.className = 'uncategorized-channels mb-4';
        
        data.uncategorizedChannels.forEach(channel => {
            const channelEl = createChannelElement(channel);
            uncategorizedSection.appendChild(channelEl);
        });
        
        channelContainer.appendChild(uncategorizedSection);
    }
    
    // Add categories with channels
    if (data.categories && data.categories.length > 0) {
        data.categories.forEach(category => {
            const categoryEl = createCategoryElement(category);
            channelContainer.appendChild(categoryEl);
        });
    }
    
    // Initialize any event listeners on the new elements
    initChannelEventListeners();
}

/**
 * Create a category element with its channels
 * @param {Object} category - Category object with channels array
 * @returns {HTMLElement} - Category element with channels
 */
function createCategoryElement(category) {
    const categoryContainer = document.createElement('div');
    categoryContainer.className = 'category-container mb-4';
    categoryContainer.dataset.categoryId = category.id;
    
    // Create category header
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'category-header flex items-center justify-between py-2 px-3 text-gray-300 cursor-pointer hover:text-white';
    categoryHeader.innerHTML = `
        <div class="flex items-center">
            <span class="mr-1"><i class="fas fa-chevron-down text-xs"></i></span>
            <span class="font-semibold uppercase text-xs tracking-wide">${category.name}</span>
        </div>
        <div class="category-actions opacity-0 group-hover:opacity-100">
            <button class="add-channel-btn text-gray-400 hover:text-white" 
                    data-category-id="${category.id}" title="Add Channel">
                <i class="fas fa-plus text-xs"></i>
            </button>
        </div>
    `;
    
    // Create channels container
    const channelsContainer = document.createElement('div');
    channelsContainer.className = 'channels-container';
    
    // Add channels to the container
    if (category.channels && category.channels.length > 0) {
        category.channels.forEach(channel => {
            const channelEl = createChannelElement(channel);
            channelsContainer.appendChild(channelEl);
        });
    } else {
        // No channels message
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-gray-400 text-xs italic px-6 py-2';
        emptyMessage.textContent = 'No channels in this category';
        channelsContainer.appendChild(emptyMessage);
    }
    
    // Assemble category element
    categoryContainer.appendChild(categoryHeader);
    categoryContainer.appendChild(channelsContainer);
    
    return categoryContainer;
}

/**
 * Create a channel element
 * @param {Object} channel - Channel object
 * @returns {HTMLElement} - Channel element
 */
function createChannelElement(channel) {
    const channelEl = document.createElement('div');
    channelEl.className = 'channel-item flex items-center py-1 px-2 mx-2 rounded hover:bg-gray-700 cursor-pointer';
    channelEl.id = `channel-${channel.id}`;
    channelEl.dataset.channelId = channel.id;
    
    // Determine if it's a text channel (type 1) or voice channel (type 2)
    let isTextChannel = true; // Default to text channel
    
    // Handle type as both string and number
    if (channel.type === 2 || channel.type === '2' || 
        (channel.type_name && (channel.type_name === 'voice' || channel.type_name === '2'))) {
        isTextChannel = false;
    }
    
    const iconClass = isTextChannel ? 'fa-hashtag' : 'fa-volume-up';
    
    channelEl.innerHTML = `
        <div class="channel-icon mr-2 text-gray-400">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="channel-name text-gray-300 hover:text-white flex-grow">
            ${channel.name}
        </div>
        <div class="channel-actions hidden group-hover:flex">
            <button class="edit-channel-btn text-gray-400 hover:text-white mr-1" 
                    data-channel-id="${channel.id}" title="Edit Channel">
                <i class="fas fa-cog text-xs"></i>
            </button>
            <button class="delete-channel-btn text-gray-400 hover:text-red-500" 
                    data-channel-id="${channel.id}" 
                    data-channel-name="${channel.name}" title="Delete Channel">
                <i class="fas fa-trash text-xs"></i>
            </button>
        </div>
    `;
    
    if (channel.is_private) {
        channelEl.classList.add('private-channel');
        const lockIcon = document.createElement('span');
        lockIcon.className = 'ml-1 text-gray-400';
        lockIcon.innerHTML = '<i class="fas fa-lock text-xs"></i>';
        channelEl.querySelector('.channel-name').appendChild(lockIcon);
    }
    
    return channelEl;
}

/**
 * Initialize event listeners for channel elements
 */
function initChannelEventListeners() {
    // Category toggle
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', function(e) {
            // Skip if clicking on add button
            if (e.target.closest('.add-channel-btn')) {
                return;
            }
            
            const category = this.closest('.category-container');
            const channelsContainer = category.querySelector('.channels-container');
            const chevron = this.querySelector('i.fa-chevron-down, i.fa-chevron-right');
            
            if (channelsContainer.classList.contains('hidden')) {
                channelsContainer.classList.remove('hidden');
                if (chevron) chevron.classList.replace('fa-chevron-right', 'fa-chevron-down');
            } else {
                channelsContainer.classList.add('hidden');
                if (chevron) chevron.classList.replace('fa-chevron-down', 'fa-chevron-right');
            }
        });
    });
    
    // Add channel to category button
    document.querySelectorAll('.add-channel-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent category toggle
            const categoryId = this.getAttribute('data-category-id');
            openCreateChannelModal(categoryId);
        });
    });
    
    // Channel click (navigation)
    document.querySelectorAll('.channel-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.closest('.channel-actions')) {
                // Don't navigate if clicking on actions
                return;
            }
            
            const channelId = this.dataset.channelId;
            const serverId = getServerId();
            if (channelId && serverId) {
                window.location.href = `/server/${serverId}?channel=${channelId}`;
            }
        });
    });
    
    // Initialize edit and delete buttons
    initUpdateChannelForms();
    initDeleteChannelButtons();
}

/**
 * Helper function to get server ID from URL
 */
function getServerId() {
    const urlParts = window.location.pathname.split('/');
    return urlParts[urlParts.indexOf('server') + 1];
}

/**
 * Open the create channel modal and pre-select category if provided
 * @param {string|null} categoryId - Optional category ID to pre-select
 */
function openCreateChannelModal(categoryId = null) {
    const modal = document.getElementById('create-channel-modal');
    if (!modal) return;
    
    // Set the category ID if provided
    if (categoryId) {
        const categoryIdInput = modal.querySelector('input[name="category_id"]');
        if (categoryIdInput) {
            categoryIdInput.value = categoryId;
        }
    }
    
    // Show the modal
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