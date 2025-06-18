import { MisVordAjax } from '../../core/ajax/ajax-handler.js';

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initDragDrop, 1000);
});

function initDragDrop() {

    const channelContent = document.querySelector('#channel-container');
    const channelListContainer = document.querySelector('.channel-list-container');

    if (channelContent && channelContent.classList.contains('hidden') && 
        channelListContainer && !channelListContainer.querySelector('.channel-item')) {
        channelListContainer.innerHTML += channelContent.innerHTML;
    }

    const serverIdElement = document.querySelector('#current-server-id') || document.querySelector('meta[name="server-id"]');
    if (!serverIdElement) return;

    addDragDropStyles();

    initCategories();
    initChannels();
}

function addDragDropStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .draggable {
            cursor: grab;
            transition: background-color 0.1s ease, box-shadow 0.1s ease;
        }

        .dragging {
            opacity: 0.7;
            background-color: #2f3136 !important;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            transform: scale(1.01);
            z-index: 1000;
            cursor: grabbing !important;
        }

        .drag-handle {
            display: flex !important;
            opacity: 0.4 !important;
            visibility: visible !important;
            width: 8px !important;
            height: 8px !important;
            margin-right: 4px !important;
            cursor: grab;
            transition: opacity 0.2s;
        }

        .channel-item:hover .drag-handle,
        .category-header:hover .drag-handle {
            opacity: 0.9 !important;
        }

        .drag-over {
            position: relative;
            border-radius: 4px;
            background-color: rgba(88, 101, 242, 0.2) !important;
            box-shadow: 0 0 5px rgba(88, 101, 242, 0.5);
        }

        .drag-over::after {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 3px;
            height: 100%;
            background-color: #5865f2;
            border-radius: 4px 0 0 4px;
        }

        .drop-preview {
            height: 2px;
            background-color: #5865f2;
            margin: 2px 0;
            animation: pulse-drop 1.5s infinite;
        }

        @keyframes pulse-drop {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }

        .drop-target-above::before,
        .drop-target-below::after {
            content: '';
            display: block;
            height: 3px;
            background-color: #5865f2;
            position: absolute;
            left: 0;
            right: 0;
            z-index: 10;
        }

        .drop-target-above::before {
            top: 0;
        }

        .drop-target-below::after {
            bottom: 0;
        }

        .updating {
            opacity: 0.7;
            pointer-events: none;
        }

        .update-success {
            animation: pulse-success 1s ease;
        }

        .update-error {
            animation: pulse-error 1s ease;
        }

        @keyframes pulse-success {
            0%, 100% { background-color: transparent; }
            50% { background-color: rgba(59, 165, 93, 0.2); }
        }

        @keyframes pulse-error {
            0%, 100% { background-color: transparent; }
            50% { background-color: rgba(237, 66, 69, 0.2); }
        }
    `;
    document.head.appendChild(style);
}

function initCategories() {
    const categoryList = document.querySelector('.category-list');
    if (!categoryList) return;

    const categories = document.querySelectorAll('.category-item');

    categories.forEach(category => {

        const categoryHeader = category.querySelector('.category-header');
        if (categoryHeader) {
            if (!categoryHeader.querySelector('.drag-handle')) {
                const dragHandle = document.createElement('span');
                dragHandle.className = 'drag-handle';
                dragHandle.innerHTML = '<i class="fas fa-grip-lines fa-xs"></i>';
                categoryHeader.querySelector('div').prepend(dragHandle);
            }

            category.setAttribute('draggable', 'true');
            category.classList.add('draggable');

            category.removeEventListener('dragstart', handleCategoryDragStart);
            category.removeEventListener('dragend', handleCategoryDragEnd);

            category.addEventListener('dragstart', handleCategoryDragStart);
            category.addEventListener('dragend', handleCategoryDragEnd);
        }
    });

    categoryList.removeEventListener('dragover', handleCategoryDragOver);
    categoryList.removeEventListener('dragenter', handleDragEnter);
    categoryList.removeEventListener('dragleave', handleDragLeave);
    categoryList.removeEventListener('drop', handleCategoryDrop);

    categoryList.addEventListener('dragover', handleCategoryDragOver);
    categoryList.addEventListener('dragenter', handleDragEnter);
    categoryList.addEventListener('dragleave', handleDragLeave);
    categoryList.addEventListener('drop', handleCategoryDrop);
}

function initChannels() {

    const uncategorizedChannels = document.querySelector('.uncategorized-channels');
    if (uncategorizedChannels) {
        setupChannelContainer(uncategorizedChannels, null);
    }

    const categoryChannels = document.querySelectorAll('.category-channels');

    categoryChannels.forEach(channelList => {
        const categoryItem = channelList.closest('.category-item');
        const categoryId = categoryItem ? categoryItem.getAttribute('data-category-id') : null;
        setupChannelContainer(channelList, categoryId);
    });
}

function setupChannelContainer(container, categoryId) {
    const channels = container.querySelectorAll('.channel-item');

    channels.forEach(channel => {

        const firstDiv = channel.querySelector('div');
        if (firstDiv && !channel.querySelector('.drag-handle')) {
            const dragHandle = document.createElement('span');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = '<i class="fas fa-grip-lines fa-xs"></i>';
            firstDiv.prepend(dragHandle);
        }

        channel.setAttribute('draggable', 'true');
        channel.classList.add('draggable');

        channel.removeEventListener('dragstart', handleChannelDragStart);
        channel.removeEventListener('dragend', handleChannelDragEnd);

        channel.addEventListener('dragstart', handleChannelDragStart);
        channel.addEventListener('dragend', handleChannelDragEnd);
    });

    container.removeEventListener('dragover', handleChannelDragOver);
    container.removeEventListener('dragenter', handleDragEnter);
    container.removeEventListener('dragleave', handleDragLeave);
    container.removeEventListener('drop', function(event) { handleChannelDrop(event, categoryId); });

    container.addEventListener('dragover', handleChannelDragOver);
    container.addEventListener('dragenter', handleDragEnter);
    container.addEventListener('dragleave', handleDragLeave);
    container.addEventListener('drop', function(event) { 
        handleChannelDrop(event, categoryId); 
    });
}

function handleCategoryDragStart(event) {
    const categoryId = this.getAttribute('data-category-id');

    event.dataTransfer.setData('application/category', categoryId);
    event.dataTransfer.effectAllowed = 'move';
    this.classList.add('dragging');

    const dragImage = this.cloneNode(true);

    const dragHandles = dragImage.querySelectorAll('.drag-handle, .drag-icon');
    dragHandles.forEach(handle => handle.remove());

    dragImage.style.opacity = '0.7';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 10, 10);

    setTimeout(() => {
        document.body.removeChild(dragImage);
    }, 0);
}

function handleCategoryDragEnd(event) {
    this.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function handleCategoryDragOver(event) {
    if (!event.dataTransfer.types.includes('application/category')) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function handleCategoryDrop(event) {
    event.preventDefault();
    const categoryId = event.dataTransfer.getData('application/category');
    if (!categoryId) return;

    const categoryList = document.querySelector('.category-list');
    const categories = Array.from(categoryList.querySelectorAll('.category-item'));
    const draggedCategory = document.querySelector(`.category-item[data-category-id="${categoryId}"]`);

    if (!draggedCategory) return;

    let dropTarget;

    if (event.target.classList.contains('category-item')) {
        dropTarget = event.target;
    } 

    else if (event.target.closest('.category-item')) {
        dropTarget = event.target.closest('.category-item');
    }

    else {
        dropTarget = categoryList;
    }

    let targetIndex = categories.length;
    let targetElement = null;

    if (dropTarget.classList && dropTarget.classList.contains('category-item') && dropTarget !== draggedCategory) {

        const rect = dropTarget.getBoundingClientRect();
        const isInUpperHalf = event.clientY - rect.top < rect.height / 2;

        const dropTargetIndex = categories.indexOf(dropTarget);

        if (isInUpperHalf) {

            targetElement = dropTarget;
            targetIndex = dropTargetIndex;
        } else {

            targetIndex = dropTargetIndex + 1;
            targetElement = categories[dropTargetIndex + 1] || null;
        }
    } 

    else {

        const mouseY = event.clientY;
        let closestDistance = Infinity;
        let closestIndex = -1;

        categories.forEach((category, index) => {
            if (category === draggedCategory) return;

            const rect = category.getBoundingClientRect();
            const categoryMiddle = rect.top + rect.height / 2;
            const distance = Math.abs(mouseY - categoryMiddle);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;

                if (mouseY < categoryMiddle) {
                    targetElement = category;
                    targetIndex = index;
                } else {
                    targetIndex = index + 1;
                    targetElement = categories[index + 1] || null;
                }
            }
        });

        if (closestIndex === -1 || targetIndex >= categories.length) {
            targetIndex = categories.length;
            targetElement = null;
        }
    }

    if (targetElement) {
        categoryList.insertBefore(draggedCategory, targetElement);
    } else {
        categoryList.appendChild(draggedCategory);
    }

    document.querySelectorAll('.drag-over, .drop-target-above, .drop-target-below').forEach(el => {
        el.classList.remove('drag-over', 'drop-target-above', 'drop-target-below');
    });

    draggedCategory.classList.add('updating');

    updateCategoryPosition(categoryId, targetIndex)
        .then(() => {
            draggedCategory.classList.remove('updating');
            draggedCategory.classList.add('update-success');
            setTimeout(() => {
                draggedCategory.classList.remove('update-success');
            }, 1000);

            document.querySelectorAll('.drop-preview').forEach(el => el.remove());
        })
        .catch((error) => {
            console.error('Error updating category position:', error);
            draggedCategory.classList.remove('updating');
            draggedCategory.classList.add('update-error');
            setTimeout(() => {
                draggedCategory.classList.remove('update-error');
            }, 1000);
        });
}

function handleChannelDragStart(event) {
    const channelId = this.getAttribute('data-channel-id');

    event.dataTransfer.setData('application/channel', channelId);
    event.dataTransfer.effectAllowed = 'move';
    this.classList.add('dragging');

    const dragImage = this.cloneNode(true);

    const dragHandles = dragImage.querySelectorAll('.drag-handle, .drag-icon');
    dragHandles.forEach(handle => handle.remove());

    dragImage.style.opacity = '0.7';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 10, 10);

    setTimeout(() => {
        document.body.removeChild(dragImage);
    }, 0);
}

function handleChannelDragEnd(event) {
    this.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function handleChannelDragOver(event) {
    if (!event.dataTransfer.types.includes('application/channel')) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function handleChannelDrop(event, categoryId) {
    event.preventDefault();
    const channelId = event.dataTransfer.getData('application/channel');
    if (!channelId) return;

    const container = event.currentTarget;
    const channels = Array.from(container.querySelectorAll('.channel-item'));
    const draggedChannel = document.querySelector(`.channel-item[data-channel-id="${channelId}"]`);

    if (!draggedChannel) return;

    let dropTarget;

    if (event.target.classList.contains('channel-item')) {
        dropTarget = event.target;
    } 

    else if (event.target.closest('.channel-item')) {
        dropTarget = event.target.closest('.channel-item');
    }

    else {
        dropTarget = container;
    }

    let newPosition = 0;
    let targetItem = null;

    if (dropTarget.classList && dropTarget.classList.contains('channel-item') && dropTarget !== draggedChannel) {

        const rect = dropTarget.getBoundingClientRect();
        const isInUpperHalf = event.clientY - rect.top < rect.height / 2;

        const dropTargetIndex = channels.indexOf(dropTarget);

        if (isInUpperHalf) {

            targetItem = dropTarget;
            newPosition = dropTargetIndex;
        } else {

            newPosition = dropTargetIndex + 1;
            targetItem = channels[dropTargetIndex + 1] || null;
        }
    } 

    else {

        const mouseY = event.clientY;
        let closestDistance = Infinity;
        let closestIndex = -1;

        channels.forEach((channel, index) => {
            if (channel === draggedChannel) return;

            const rect = channel.getBoundingClientRect();
            const channelMiddle = rect.top + rect.height / 2;
            const distance = Math.abs(mouseY - channelMiddle);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;

                if (mouseY < channelMiddle) {
                    targetItem = channel;
                    newPosition = index;
                } else {
                    newPosition = index + 1;
                    targetItem = channels[index + 1] || null;
                }
            }
        });

        if (closestIndex === -1 || newPosition >= channels.length) {
            newPosition = channels.length;
            targetItem = null;
        }
    }

    if (targetItem) {
        container.insertBefore(draggedChannel, targetItem);
    } else {
        container.appendChild(draggedChannel);
    }

    document.querySelectorAll('.drag-over, .drop-target-above, .drop-target-below').forEach(el => {
        el.classList.remove('drag-over', 'drop-target-above', 'drop-target-below');
    });

    draggedChannel.classList.add('updating');

    updateChannelPosition(channelId, newPosition, categoryId)
        .then(() => {
            draggedChannel.classList.remove('updating');

            draggedChannel.classList.add('update-success');
            setTimeout(() => {
                draggedChannel.classList.remove('update-success');
            }, 1000);

            document.querySelectorAll('.drop-preview').forEach(el => el.remove());
        })
        .catch((error) => {
            console.error('Error updating channel position:', error);
            draggedChannel.classList.remove('updating');
            draggedChannel.classList.add('update-error');
            setTimeout(() => {
                draggedChannel.classList.remove('update-error');
            }, 1000);
        });
}

function findDropTarget(clientY, elements) {
    for (const element of elements) {
        const rect = element.getBoundingClientRect();
        const elementMiddle = rect.top + rect.height / 2;

        if (clientY < elementMiddle) {
            return element;
        }
    }
    return null;
}

function handleDragEnter(event) {

    document.querySelectorAll('.drag-over, .drop-target-above, .drop-target-below').forEach(el => {
        el.classList.remove('drag-over', 'drop-target-above', 'drop-target-below');
    });

    const isChannelOrCategory = event.target.classList.contains('channel-item') || 
                                event.target.classList.contains('category-item') ||
                                event.target.closest('.channel-item') ||
                                event.target.closest('.category-item');

    if (!isChannelOrCategory) return;

    const targetItem = event.target.classList.contains('channel-item') || event.target.classList.contains('category-item') 
        ? event.target 
        : (event.target.closest('.channel-item') || event.target.closest('.category-item'));

    if (!targetItem) return;

    targetItem.classList.add('drag-over');

    const rect = targetItem.getBoundingClientRect();
    const isInUpperHalf = event.clientY - rect.top < rect.height / 2;

    if (isInUpperHalf) {
        targetItem.classList.add('drop-target-above');
    } else {
        targetItem.classList.add('drop-target-below');
    }
}

function handleDragLeave(event) {

    const relatedTarget = event.relatedTarget;
    if (relatedTarget && event.target.contains(relatedTarget)) {
        return;
    }

    if (event.target.classList.contains('drag-over')) {
        event.target.classList.remove('drag-over', 'drop-target-above', 'drop-target-below');
    }
}

function updateCategoryPosition(categoryId, position) {
    console.log(`Updating category ${categoryId} to position ${position}`);

    return MisVordAjax.post('/api/categories/position', {
        category_id: categoryId,
        position: position
    });
}

function updateChannelPosition(channelId, position, categoryId) {
    console.log(`Updating channel ${channelId} to position ${position} in category ${categoryId}`);

    return MisVordAjax.post('/api/channels/position', {
        channel_id: channelId,
        position: position,
        category_id: categoryId
    });
}

window.addEventListener('load', initDragDrop);

document.addEventListener('LazyLoaderCompleted', function(event) {
    if (event.detail && event.detail.target === 'channel-list') {
        setTimeout(initDragDrop, 500);
    }
});

setInterval(function() {
    const channelListContainer = document.querySelector('.channel-list-container');
    if (channelListContainer && channelListContainer.querySelector('.channel-item')) {
        const initialized = document.querySelectorAll('.draggable').length > 0;
        if (!initialized) {
            initDragDrop();
        }
    }
}, 2000);

function handleNewChannelDrop(event, categoryId, position) {

    event.preventDefault();

    const serverIdElement = document.querySelector('#current-server-id') || document.querySelector('meta[name="server-id"]');
    if (!serverIdElement) {
        console.error('Server ID not found');
        return;
    }

    const serverId = serverIdElement.value || serverIdElement.getAttribute('content');

    if (typeof openCreateChannelModal === 'function') {

        openCreateChannelModal(categoryId, position);
    } else {

        showCreateChannelModal(serverId, categoryId, position);
    }
}

function showCreateChannelModal(serverId, categoryId, position) {

    const existingModal = document.getElementById('quick-create-channel-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'quick-create-channel-modal';
    modal.className = 'fixed inset-0 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50"></div>
        <div class="bg-discord-dark rounded-lg p-6 relative z-10 max-w-md w-full">
            <h3 class="text-xl font-bold mb-4 text-white">Create New Channel</h3>
            <form id="quick-create-channel-form">
                <div class="mb-4">
                    <label class="block text-gray-300 mb-1">Channel Name</label>
                    <input type="text" name="name" class="w-full bg-discord-light text-white rounded p-2" 
                           placeholder="new-channel" pattern="[a-z0-9\\-_]+" required>
                    <p class="text-xs text-gray-400 mt-1">
                        Lowercase letters, numbers, hyphens, and underscores only
                    </p>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-300 mb-1">Channel Type</label>
                    <select name="type" class="w-full bg-discord-light text-white rounded p-2">
                        <option value="text">Text Channel</option>
                        <option value="voice">Voice Channel</option>
                    </select>
                </div>
                <input type="hidden" name="server_id" value="${serverId}">
                <input type="hidden" name="category_id" value="${categoryId || ''}">
                <input type="hidden" name="position" value="${position}">
                <div class="flex justify-end space-x-2 mt-6">
                    <button type="button" id="cancel-quick-channel" class="px-4 py-2 text-white">
                        Cancel
                    </button>
                    <button type="submit" class="bg-discord-blue px-4 py-2 rounded text-white">
                        Create Channel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('cancel-quick-channel').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('quick-create-channel-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const form = e.target;
        const name = form.name.value.trim();
        const type = form.type.value;
        const serverId = form.server_id.value;
        const categoryId = form.category_id.value || null;
        const position = parseInt(form.position.value, 10);

        if (typeof createChannelAtPosition === 'function') {
            createChannelAtPosition(name, type, serverId, categoryId, position)
                .then(() => {
                    modal.remove();
                })
                .catch(error => {
                    console.error('Error creating channel:', error);
                });
        } else {

            const formData = new FormData(form);

            fetch('/api/channels', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Channel created at position:', position);
                    modal.remove();
                    window.location.reload(); 
                } else {
                    alert(data.message || 'Failed to create channel');
                }
            })
            .catch(error => {
                console.error('Error creating channel:', error);
                alert('An error occurred');
            });
        }
    });

    setTimeout(() => {
        modal.querySelector('input[name="name"]').focus();
    }, 100);
}

function showChannelContextMenu(event, channelId) {
    event.preventDefault();

    removeContextMenus();

    const contextMenu = document.createElement('div');
    contextMenu.className = 'channel-context-menu fixed bg-discord-dark rounded shadow-lg py-1 z-50';
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.top = `${event.clientY}px`;

    contextMenu.innerHTML = `
        <div class="px-3 py-1 text-xs text-gray-400">Channel Options</div>
        <button class="w-full text-left px-3 py-1 hover:bg-discord-light text-white text-sm">Edit Channel</button>
        <button class="w-full text-left px-3 py-1 hover:bg-discord-light text-white text-sm">Delete Channel</button>
        <button class="w-full text-left px-3 py-1 hover:bg-discord-light text-white text-sm">Add to Category</button>
    `;

    document.body.appendChild(contextMenu);

    document.addEventListener('click', removeContextMenus);

    function removeContextMenus() {
        const menus = document.querySelectorAll('.channel-context-menu');
        menus.forEach(menu => menu.remove());
        document.removeEventListener('click', removeContextMenus);
    }
}

function batchUpdatePositions(updates, serverId) {
    console.log('Batch updating positions:', updates);

    return MisVordAjax.post('/api/positions/batch', {
        updates: updates,
        server_id: serverId
    });
}

function collectChannelPositions() {
    const serverId = document.querySelector('#current-server-id')?.value || 
                    document.querySelector('meta[name="server-id"]')?.getAttribute('content');

    if (!serverId) {
        console.error('Server ID not found');
        return null;
    }

    const updates = [];

    document.querySelectorAll('.category-item').forEach((category, categoryIndex) => {
        const categoryId = category.getAttribute('data-category-id');

        updates.push({
            id: categoryId,
            type: 'category',
            position: categoryIndex,
            server_id: serverId
        });

        const channels = category.querySelectorAll('.channel-item');
        channels.forEach((channel, channelIndex) => {
            const channelId = channel.getAttribute('data-channel-id');

            updates.push({
                id: channelId,
                type: 'channel',
                position: channelIndex,
                category_id: categoryId,
                server_id: serverId
            });
        });
    });

    const uncategorizedContainer = document.querySelector('.uncategorized-channels');
    if (uncategorizedContainer) {
        const channels = uncategorizedContainer.querySelectorAll('.channel-item');
        channels.forEach((channel, channelIndex) => {
            const channelId = channel.getAttribute('data-channel-id');

            updates.push({
                id: channelId,
                type: 'channel',
                position: channelIndex,
                category_id: null,
                server_id: serverId
            });
        });
    }

    return {
        updates: updates,
        server_id: serverId
    };
}

function syncAllPositions() {
    const positionData = collectChannelPositions();
    if (!positionData) return Promise.reject('Could not collect positions');

    return batchUpdatePositions(positionData.updates, positionData.server_id)
        .then(response => {
            console.log('Positions synced successfully:', response);
            return response;
        })
        .catch(error => {
            console.error('Error syncing positions:', error);
            throw error;
        });
}

function handleNewCategoryDrop(event, position) {

    event.preventDefault();

    const serverIdElement = document.querySelector('#current-server-id') || document.querySelector('meta[name="server-id"]');
    if (!serverIdElement) {
        console.error('Server ID not found');
        return;
    }

    const serverId = serverIdElement.value || serverIdElement.getAttribute('content');

    if (typeof openCreateCategoryModal === 'function') {

        openCreateCategoryModal(position);
    } else {

        showCreateCategoryModal(serverId, position);
    }
}

function showCreateCategoryModal(serverId, position) {

    const existingModal = document.getElementById('quick-create-category-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'quick-create-category-modal';
    modal.className = 'fixed inset-0 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50"></div>
        <div class="bg-discord-dark rounded-lg p-6 relative z-10 max-w-md w-full">
            <h3 class="text-xl font-bold mb-4 text-white">Create New Category</h3>
            <form id="quick-create-category-form">
                <div class="mb-4">
                    <label class="block text-gray-300 mb-1">Category Name</label>
                    <input type="text" name="name" class="w-full bg-discord-light text-white rounded p-2" 
                           placeholder="CATEGORY NAME" required>
                </div>
                <input type="hidden" name="server_id" value="${serverId}">
                <input type="hidden" name="position" value="${position}">
                <div class="flex justify-end space-x-2 mt-6">
                    <button type="button" id="cancel-quick-category" class="px-4 py-2 text-white">
                        Cancel
                    </button>
                    <button type="submit" class="bg-discord-blue px-4 py-2 rounded text-white">
                        Create Category
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('cancel-quick-category').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('quick-create-category-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const form = e.target;
        const name = form.name.value.trim();
        const serverId = form.server_id.value;
        const position = parseInt(form.position.value, 10);

        if (typeof createCategoryAtPosition === 'function') {
            createCategoryAtPosition(name, serverId, position)
                .then(() => {
                    modal.remove();
                })
                .catch(error => {
                    console.error('Error creating category:', error);
                });
        } else {

            const formData = new FormData(form);

            fetch('/api/channels/category', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Category created at position:', position);
                    modal.remove();
                    window.location.reload(); 
                } else {
                    alert(data.message || 'Failed to create category');
                }
            })
            .catch(error => {
                console.error('Error creating category:', error);
                alert('An error occurred');
            });
        }
    });

    setTimeout(() => {
        modal.querySelector('input[name="name"]').focus();
    }, 100);
}