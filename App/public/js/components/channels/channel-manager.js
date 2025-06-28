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
        window.location.reload();
    }
}

function renderChannelList(data) {
    const channelContainer = document.querySelector('.channel-wrapper .channel-list');
    if (!channelContainer) return;

    const headerDiv = channelContainer.querySelector('.flex.justify-between.items-center');
    channelContainer.innerHTML = '';
    if (headerDiv) {
        channelContainer.appendChild(headerDiv);
    }

    // Handle uncategorized channels
    const uncategorizedChannels = data.channels ? data.channels.filter(ch => !ch.category_id) : [];
    if (uncategorizedChannels.length > 0) {
        const uncategorizedSection = document.createElement('div');
        uncategorizedSection.className = 'uncategorized-channels mb-4';

        uncategorizedChannels.forEach(channel => {
            const channelEl = createChannelElement(channel);
            uncategorizedSection.appendChild(channelEl);
        });

        channelContainer.appendChild(uncategorizedSection);
    }

    // Handle categorized channels
    if (data.categories && data.categories.length > 0) {
        data.categories.forEach(category => {
            const categoryChannels = data.channels ? data.channels.filter(ch => ch.category_id === category.id) : [];
            const categoryEl = createCategoryElement({
                ...category,
                channels: categoryChannels
            });
            channelContainer.appendChild(categoryEl);
        });
    }

    initChannelEventListeners();
}

function createCategoryElement(category) {
    const categoryContainer = document.createElement('div');
    categoryContainer.className = 'category-container mb-4';
    categoryContainer.dataset.categoryId = category.id;

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

    const channelsContainer = document.createElement('div');
    channelsContainer.className = 'channels-container';

    if (category.channels && category.channels.length > 0) {
        category.channels.forEach(channel => {
            const channelEl = createChannelElement(channel);
            channelsContainer.appendChild(channelEl);
        });
    } else {

        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-gray-400 text-xs italic px-6 py-2';
        emptyMessage.textContent = 'No channels in this category';
        channelsContainer.appendChild(emptyMessage);
    }

    categoryContainer.appendChild(categoryHeader);
    categoryContainer.appendChild(channelsContainer);

    return categoryContainer;
}

function createChannelElement(channel) {
    const channelEl = document.createElement('div');
    channelEl.className = 'channel-item flex items-center py-1 px-2 mx-2 rounded hover:bg-gray-700 cursor-pointer';
    channelEl.id = `channel-${channel.id}`;
    channelEl.dataset.channelId = channel.id;

    channelEl.innerHTML = `
        <div class="channel-icon mr-2 text-gray-400">
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

function initChannelEventListeners() {

    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', function(e) {

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

    document.querySelectorAll('.add-channel-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); 
            const categoryId = this.getAttribute('data-category-id');
            openCreateChannelModal(categoryId);
        });
    });

    document.querySelectorAll('.channel-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.closest('.channel-actions')) {
                return; // Ignore clicks on edit/delete buttons
            }

            const channelId = this.dataset.channelId;
            const serverId = getServerId();

            if (!channelId || !serverId) return;

            // Prefer AJAX navigation via ChatSection when available
            if (window.chatSection && typeof window.chatSection.joinNewChannel === 'function') {
                window.chatSection.joinNewChannel(channelId);

                // Push state so URL reflects current channel without reload
                const newUrl = `/server/${serverId}?channel=${channelId}`;
                window.history.pushState({ channelId }, '', newUrl);

                // Update active styling
                document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('bg-gray-700', 'text-white'));
                this.classList.add('bg-gray-700', 'text-white');
            } else {
                // Fallback: full navigation
                window.location.href = `/server/${serverId}?channel=${channelId}`;
            }
        });
    });

    initUpdateChannelForms();
    initDeleteChannelButtons();
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

if (typeof window !== 'undefined') {
    window.refreshChannelList = refreshChannelList;
    window.renderChannelList = renderChannelList;
    window.createChannelAtPosition = createChannelAtPosition;
    window.openCreateChannelModal = openCreateChannelModal;
}