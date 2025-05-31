/**
 * Simple drag and drop functionality for channels and categories
 * Discord-style implementation
 */

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initDragDrop, 1000);
});

function initDragDrop() {
    // Make sure the channel container is loaded into the DOM
    const channelContent = document.querySelector('#channel-container');
    const channelListContainer = document.querySelector('.channel-list-container');
    
    // Make the content visible if it's in the hidden container
    if (channelContent && channelContent.classList.contains('hidden') && 
        channelListContainer && !channelListContainer.querySelector('.channel-item')) {
        channelListContainer.innerHTML += channelContent.innerHTML;
    }

    // Get current server ID
    const serverIdElement = document.querySelector('#current-server-id') || document.querySelector('meta[name="server-id"]');
    if (!serverIdElement) return;
    
    // Add required CSS
    addDragDropStyles();
    
    // Initialize draggable elements
    initCategories();
    initChannels();
}

function addDragDropStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .draggable {
            cursor: default;
            transition: background-color 0.1s ease, box-shadow 0.1s ease, transform 0.1s ease;
        }
        
        .dragging {
            opacity: 0.7;
            background-color: #2f3136 !important;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            transform: scale(1.01);
            z-index: 1000;
        }
        
        .dragging .drag-handle,
        .dragging .drag-icon {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
        }
        
        .drag-over {
            position: relative;
            border-radius: 4px;
            background-color: rgba(88, 101, 242, 0.1) !important;
        }
        
        .drag-over::after {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 2px;
            height: 100%;
            background-color: #5865f2;
            border-radius: 4px 0 0 4px;
        }
        
        .drag-handle,
        .drag-icon {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            pointer-events: none !important;
        }
        
        /* Remove hover states too - ensure they never appear */
        .channel-item:hover .drag-handle,
        .category-header:hover .drag-handle {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
        }
        
        /* Hide text labels */
        .channel-type-label {
            display: none !important;
        }
        
        /* Simplify channel names */
        .channel-item .channel-name {
            font-weight: normal !important;
            color: #8e9297 !important;
        }
        
        .channel-item:hover .channel-name {
            color: #dcddde !important;
        }
        
        /* Clean up hash symbols */
        .channel-item .channel-hash {
            color: #8e9297 !important;
            margin-right: 5px !important;
        }
        
        /* Hide all category headers and channel type headers */
        .font-semibold.uppercase.text-xs:contains("Text Channels"),
        .font-semibold.uppercase.text-xs:contains("Voice Channels"),
        .font-semibold.uppercase.text-xs:contains("Channels") {
            display: none !important;
        }
        
        /* Hide the header containers */
        .text-gray-400.flex.items-center.justify-between.mb-1.px-1 {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
}

function initCategories() {
    const categoryList = document.querySelector('.category-list');
    if (!categoryList) return;
    
    const categories = document.querySelectorAll('.category-item');
    
    categories.forEach(category => {
        // Add drag handle if not exists
        const categoryHeader = category.querySelector('.category-header');
        if (categoryHeader) {
            if (!categoryHeader.querySelector('.drag-handle')) {
                const dragHandle = document.createElement('span');
                dragHandle.className = 'drag-handle';
                dragHandle.innerHTML = '<span class="drag-icon"></span>';
                categoryHeader.querySelector('div').prepend(dragHandle);
            }
            
            // Make draggable
            category.setAttribute('draggable', 'true');
            category.classList.add('draggable');
            
            // Remove any existing event listeners
            category.removeEventListener('dragstart', handleCategoryDragStart);
            category.removeEventListener('dragend', handleCategoryDragEnd);
            
            // Add event listeners
            category.addEventListener('dragstart', handleCategoryDragStart);
            category.addEventListener('dragend', handleCategoryDragEnd);
        }
    });
    
    // Add event listeners for drop targets
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
    // Setup uncategorized channels
    const uncategorizedChannels = document.querySelector('.uncategorized-channels');
    if (uncategorizedChannels) {
        setupChannelContainer(uncategorizedChannels, null);
    }
    
    // Setup categorized channels
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
        // Add drag handle if not exists
        const firstDiv = channel.querySelector('div');
        if (firstDiv && !channel.querySelector('.drag-handle')) {
            const dragHandle = document.createElement('span');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = '<span class="drag-icon"></span>';
            firstDiv.prepend(dragHandle);
        }
        
        // Make draggable
        channel.setAttribute('draggable', 'true');
        channel.classList.add('draggable');
        
        // Remove any existing event listeners
        channel.removeEventListener('dragstart', handleChannelDragStart);
        channel.removeEventListener('dragend', handleChannelDragEnd);
        
        // Add event listeners
        channel.addEventListener('dragstart', handleChannelDragStart);
        channel.addEventListener('dragend', handleChannelDragEnd);
    });
    
    // Add event listeners for drop targets
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

// Category drag handlers
function handleCategoryDragStart(event) {
    const categoryId = this.getAttribute('data-category-id');
    
    event.dataTransfer.setData('application/category', categoryId);
    event.dataTransfer.effectAllowed = 'move';
    this.classList.add('dragging');
    
    // Create a clean drag image without the drag handle dots
    const dragImage = this.cloneNode(true);
    
    // Remove any drag handles from the drag image
    const dragHandles = dragImage.querySelectorAll('.drag-handle, .drag-icon');
    dragHandles.forEach(handle => handle.remove());
    
    // Style for ghost image
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
    
    const dropTarget = findDropTarget(event.clientY, categories);
    if (!dropTarget || dropTarget === draggedCategory) return;
    
    // Get the index of the drop target
    const newIndex = categories.indexOf(dropTarget);
    
    // Reorder in the DOM
    if (event.clientY < dropTarget.getBoundingClientRect().top + dropTarget.offsetHeight / 2) {
        categoryList.insertBefore(draggedCategory, dropTarget);
    } else {
        categoryList.insertBefore(draggedCategory, dropTarget.nextElementSibling);
    }
    
    // Update positions on the server
    updateCategoryPosition(categoryId, newIndex);
}

// Channel drag handlers
function handleChannelDragStart(event) {
    const channelId = this.getAttribute('data-channel-id');
    
    event.dataTransfer.setData('application/channel', channelId);
    event.dataTransfer.effectAllowed = 'move';
    this.classList.add('dragging');
    
    // Create a clean drag image without the drag handle dots
    const dragImage = this.cloneNode(true);
    
    // Remove any drag handles from the drag image
    const dragHandles = dragImage.querySelectorAll('.drag-handle, .drag-icon');
    dragHandles.forEach(handle => handle.remove());
    
    // Style for ghost image
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
    
    const dropTarget = findDropTarget(event.clientY, channels);
    
    // Get the new position index
    let newIndex = 0;
    
    if (dropTarget) {
        if (event.clientY < dropTarget.getBoundingClientRect().top + dropTarget.offsetHeight / 2) {
            container.insertBefore(draggedChannel, dropTarget);
            newIndex = channels.indexOf(dropTarget);
        } else {
            container.insertBefore(draggedChannel, dropTarget.nextElementSibling);
            newIndex = channels.indexOf(dropTarget) + 1;
        }
    } else {
        container.appendChild(draggedChannel);
        newIndex = channels.length;
    }
    
    // Update position on the server
    updateChannelPosition(channelId, newIndex, categoryId);
}

// Helper functions
function findDropTarget(clientY, elements) {
    for (const element of elements) {
        const rect = element.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) {
            return element;
        }
    }
    return null;
}

function handleDragEnter(event) {
    // Clear any existing drag-over indicators first
    document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
    });
    
    // Only add the drag-over class to the immediate target
    const validTarget = event.target.classList.contains('channel-item') || 
                        event.target.classList.contains('category-item');
    
    if (validTarget) {
        event.target.classList.add('drag-over');
    }
}

function handleDragLeave(event) {
    // Only remove the class from the specific element
    if (event.target.classList.contains('drag-over')) {
        event.target.classList.remove('drag-over');
    }
}

// API functions
function updateCategoryPosition(categoryId, position) {
    fetch('/api/categories/position', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            category_id: categoryId,
            position: position
        })
    })
    .then(response => {
        if (!response.ok) {
            // For debugging - capture and log the entire response text
            return response.text().then(text => {
                console.error(`Server returned error ${response.status}: ${text}`);
                throw new Error(`Server returned ${response.status}: ${text}`);
            });
        }
        return response.json();
    })
    .catch(error => {
        console.error('Error updating category position:', error);
    });
}

function updateChannelPosition(channelId, position, categoryId) {
    fetch('/api/channels/position', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            channel_id: channelId,
            position: position,
            category_id: categoryId
        })
    })
    .then(response => {
        if (!response.ok) {
            // For debugging - capture and log the entire response text
            return response.text().then(text => {
                console.error(`Server returned error ${response.status}: ${text}`);
                throw new Error(`Server returned ${response.status}: ${text}`);
            });
        }
        return response.json();
    })
    .catch(error => {
        console.error('Error updating channel position:', error);
    });
}

// Initialize on various events
window.addEventListener('load', initDragDrop);

// Reinitialize when LazyLoader loads the content
document.addEventListener('LazyLoaderCompleted', function(event) {
    if (event.detail && event.detail.target === 'channel-list') {
        setTimeout(initDragDrop, 500);
    }
});

// Periodic check to make sure drag and drop is initialized
setInterval(function() {
    const channelListContainer = document.querySelector('.channel-list-container');
    if (channelListContainer && channelListContainer.querySelector('.channel-item')) {
        const initialized = document.querySelectorAll('.draggable').length > 0;
        if (!initialized) {
            initDragDrop();
        }
    }
}, 2000); 