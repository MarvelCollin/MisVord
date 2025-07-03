class ChannelDragManager {
    constructor() {
        this.isInitialized = false;
        this.isDragging = false;
        this.draggedElement = null;
        this.draggedType = null;
        this.currentServerId = null;
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        console.log('[Channel Drag] Initializing channel drag system');
        
        this.currentServerId = this.getCurrentServerId();
        if (!this.currentServerId) {
            console.warn('[Channel Drag] No server ID found, skipping initialization');
            return;
        }
        
        this.setupChannelDrag();
        this.setupCategoryDrag();
        this.setupDropZones();
        this.addDragStyles();
        
        this.isInitialized = true;
        console.log('[Channel Drag] Channel drag system initialized');
    }
    
    getCurrentServerId() {
        const serverIdInput = document.getElementById('current-server-id');
        if (serverIdInput) return serverIdInput.value;
        
        const channelList = document.querySelector('.channel-list');
        if (channelList) return channelList.getAttribute('data-server-id');
        
        const urlMatch = window.location.pathname.match(/\/server\/(\d+)/);
        if (urlMatch) return urlMatch[1];
        
        return null;
    }
    
    setupChannelDrag() {
        const channels = document.querySelectorAll('.channel-item[data-channel-id]');
        
        channels.forEach(channel => {
            if (channel.hasAttribute('data-drag-setup')) return;
            
            channel.setAttribute('data-drag-setup', 'true');
            channel.draggable = true;
            
            channel.addEventListener('dragstart', (e) => this.handleChannelDragStart(e));
            channel.addEventListener('dragend', (e) => this.handleDragEnd(e));
            channel.addEventListener('dragover', (e) => this.handleChannelDragOver(e));
            channel.addEventListener('drop', (e) => this.handleChannelDrop(e));
            channel.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });
        
        console.log(`[Channel Drag] Setup drag for ${channels.length} channels`);
    }
    
    setupCategoryDrag() {
        const categories = document.querySelectorAll('.category-header[data-category-id]');
        
        categories.forEach(category => {
            if (category.hasAttribute('data-drag-setup')) return;
            
            category.setAttribute('data-drag-setup', 'true');
            category.draggable = true;
            
            category.addEventListener('dragstart', (e) => this.handleCategoryDragStart(e));
            category.addEventListener('dragend', (e) => this.handleDragEnd(e));
            category.addEventListener('dragover', (e) => this.handleCategoryDragOver(e));
            category.addEventListener('drop', (e) => this.handleCategoryDrop(e));
            category.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });
        
        console.log(`[Channel Drag] Setup drag for ${categories.length} categories`);
    }
    
    setupDropZones() {
        const categoryChannels = document.querySelectorAll('.category-channels');
        categoryChannels.forEach(zone => {
            zone.addEventListener('dragover', (e) => this.handleDropZoneDragOver(e));
            zone.addEventListener('drop', (e) => this.handleDropZoneDrop(e));
            zone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });
        
        const sections = document.querySelectorAll('.channels-section, .voice-channels-section');
        sections.forEach(section => {
            section.addEventListener('dragover', (e) => this.handleSectionDragOver(e));
            section.addEventListener('drop', (e) => this.handleSectionDrop(e));
            section.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });
        
        console.log('[Channel Drag] Setup drop zones');
    }
    
    handleChannelDragStart(e) {
        this.isDragging = true;
        this.draggedElement = e.target;
        this.draggedType = 'channel';
        
        const channelId = e.target.getAttribute('data-channel-id');
        const channelName = e.target.getAttribute('data-channel-name');
        
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'channel',
            id: channelId,
            name: channelName,
            position: e.target.getAttribute('data-channel-position'),
            categoryId: e.target.getAttribute('data-category-id'),
            channelType: e.target.getAttribute('data-channel-type')
        }));
        
        e.target.classList.add('dragging');
        document.querySelectorAll('.channel-item, .category-header').forEach(el => {
            if (el !== e.target) el.classList.add('drag-potential-target');
        });
        
        console.log('[Channel Drag] Started dragging channel:', channelName);
    }
    
    handleCategoryDragStart(e) {
        this.isDragging = true;
        this.draggedElement = e.target;
        this.draggedType = 'category';
        
        const categoryId = e.target.getAttribute('data-category-id');
        const categoryName = e.target.getAttribute('data-category-name');
        
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'category',
            id: categoryId,
            name: categoryName,
            position: e.target.getAttribute('data-category-position')
        }));
        
        e.target.classList.add('dragging');
        document.querySelectorAll('.category-header').forEach(el => {
            if (el !== e.target) el.classList.add('drag-potential-target');
        });
        
        console.log('[Channel Drag] Started dragging category:', categoryName);
    }
    
    handleChannelDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.isDragging) return;
        
        const dragData = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
        
        if (dragData.type === 'channel') {
            e.target.closest('.channel-item').classList.add('drag-over');
        }
    }
    
    handleCategoryDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.isDragging) return;
        
        const dragData = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
        
        if (dragData.type === 'category') {
            e.target.closest('.category-header').classList.add('drag-over');
        }
    }
    
    handleDropZoneDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.isDragging) return;
        
        const dragData = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
        
        if (dragData.type === 'channel') {
            e.target.classList.add('drag-over-zone');
        }
    }
    
    handleSectionDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.isDragging) return;
        
        const dragData = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
        
        if (dragData.type === 'channel') {
            e.target.classList.add('drag-over-zone');
        }
    }
    
    handleChannelDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const dragData = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
        const targetChannel = e.target.closest('.channel-item');
        
        if (dragData.type === 'channel' && targetChannel) {
            const targetId = targetChannel.getAttribute('data-channel-id');
            const targetPosition = parseInt(targetChannel.getAttribute('data-channel-position'));
            const targetCategoryId = targetChannel.getAttribute('data-category-id');
            
            if (dragData.id !== targetId) {
                this.reorderChannels(dragData, {
                    id: targetId,
                    position: targetPosition,
                    categoryId: targetCategoryId
                });
            }
        }
        
        this.clearDragStates();
    }
    
    handleCategoryDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const dragData = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
        const targetCategory = e.target.closest('.category-header');
        
        if (dragData.type === 'category' && targetCategory) {
            const targetId = targetCategory.getAttribute('data-category-id');
            const targetPosition = parseInt(targetCategory.getAttribute('data-category-position'));
            
            if (dragData.id !== targetId) {
                this.reorderCategories(dragData, {
                    id: targetId,
                    position: targetPosition
                });
            }
        }
        
        this.clearDragStates();
    }
    
    handleDropZoneDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const dragData = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
        
        if (dragData.type === 'channel') {
            const categoryId = e.target.getAttribute('data-category-id');
            
            if (dragData.categoryId !== categoryId) {
                this.moveChannelToCategory(dragData, categoryId);
            }
        }
        
        this.clearDragStates();
    }
    
    handleSectionDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const dragData = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
        
        if (dragData.type === 'channel') {
            if (dragData.categoryId) {
                this.moveChannelToCategory(dragData, null);
            }
        }
        
        this.clearDragStates();
    }
    
    handleDragLeave(e) {
        e.target.classList.remove('drag-over', 'drag-over-zone');
    }
    
    handleDragEnd(e) {
        this.clearDragStates();
    }
    
    clearDragStates() {
        this.isDragging = false;
        this.draggedElement = null;
        this.draggedType = null;
        
        document.querySelectorAll('.dragging, .drag-over, .drag-over-zone, .drag-potential-target').forEach(el => {
            el.classList.remove('dragging', 'drag-over', 'drag-over-zone', 'drag-potential-target');
        });
    }
    
    async reorderChannels(draggedChannel, targetChannel) {
        console.log('[Channel Drag] Reordering channels:', draggedChannel, targetChannel);
        
        try {
            const channels = this.getChannelsInSameContext(draggedChannel, targetChannel);
            const reorderedChannels = this.calculateNewOrder(channels, draggedChannel.id, targetChannel.id);
            
            const response = await fetch('/api/channels/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    channels: reorderedChannels
                })
            });
            
            if (response.ok) {
                this.refreshChannelList();
                console.log('[Channel Drag] Channels reordered successfully');
            } else {
                console.error('[Channel Drag] Failed to reorder channels');
            }
        } catch (error) {
            console.error('[Channel Drag] Error reordering channels:', error);
        }
    }
    
    async reorderCategories(draggedCategory, targetCategory) {
        console.log('[Channel Drag] Reordering categories:', draggedCategory, targetCategory);
        
        try {
            const categories = this.getAllCategories();
            const reorderedCategories = this.calculateNewOrder(categories, draggedCategory.id, targetCategory.id);
            
            const response = await fetch('/api/categories/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    categories: reorderedCategories
                })
            });
            
            if (response.ok) {
                this.refreshChannelList();
                console.log('[Channel Drag] Categories reordered successfully');
            } else {
                console.error('[Channel Drag] Failed to reorder categories');
            }
        } catch (error) {
            console.error('[Channel Drag] Error reordering categories:', error);
        }
    }
    
    async moveChannelToCategory(channel, newCategoryId) {
        console.log('[Channel Drag] Moving channel to category:', channel.name, newCategoryId);
        
        try {
            const response = await fetch('/api/channels/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    channel_id: channel.id,
                    category_id: newCategoryId,
                    position: null
                })
            });
            
            if (response.ok) {
                this.refreshChannelList();
                console.log('[Channel Drag] Channel moved successfully');
            } else {
                console.error('[Channel Drag] Failed to move channel');
            }
        } catch (error) {
            console.error('[Channel Drag] Error moving channel:', error);
        }
    }
    
    getChannelsInSameContext(draggedChannel, targetChannel) {
        const channels = [];
        let contextSelector;
        
        if (draggedChannel.categoryId && targetChannel.categoryId && draggedChannel.categoryId === targetChannel.categoryId) {
            contextSelector = `.category-channels[data-category-id="${draggedChannel.categoryId}"] .channel-item`;
        } else if (!draggedChannel.categoryId && !targetChannel.categoryId) {
            const draggedType = draggedChannel.channelType;
            if (draggedType === 'voice') {
                contextSelector = '.voice-channels-section .channel-item';
            } else {
                contextSelector = '.channels-section .channel-item';
            }
        } else {
            return [];
        }
        
        document.querySelectorAll(contextSelector).forEach(el => {
            channels.push({
                id: el.getAttribute('data-channel-id'),
                position: parseInt(el.getAttribute('data-channel-position')),
                category_id: el.getAttribute('data-category-id') || null
            });
        });
        
        return channels.sort((a, b) => a.position - b.position);
    }
    
    getAllCategories() {
        const categories = [];
        
        document.querySelectorAll('.category-header[data-category-id]').forEach(el => {
            categories.push({
                id: el.getAttribute('data-category-id'),
                position: parseInt(el.getAttribute('data-category-position'))
            });
        });
        
        return categories.sort((a, b) => a.position - b.position);
    }
    
    calculateNewOrder(items, draggedId, targetId) {
        const draggedIndex = items.findIndex(item => item.id === draggedId);
        const targetIndex = items.findIndex(item => item.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return items;
        
        const newItems = [...items];
        const draggedItem = newItems.splice(draggedIndex, 1)[0];
        newItems.splice(targetIndex, 0, draggedItem);
        
        return newItems.map((item, index) => ({
            ...item,
            position: index + 1
        }));
    }
    
    refreshChannelList() {
        setTimeout(() => {
            if (window.location.pathname.includes('/server/')) {
                window.location.reload();
            }
        }, 100);
    }
    
    addDragStyles() {
        if (document.getElementById('channel-drag-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'channel-drag-styles';
        style.textContent = `
            .channel-item.dragging {
                opacity: 0.5;
                transform: scale(1.02);
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .category-header.dragging {
                opacity: 0.5;
                transform: scale(1.02);
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .channel-item.drag-over {
                border: 2px solid #5865f2;
                background-color: rgba(88, 101, 242, 0.1);
            }
            
            .category-header.drag-over {
                border: 2px solid #5865f2;
                background-color: rgba(88, 101, 242, 0.1);
            }
            
            .category-channels.drag-over-zone {
                background-color: rgba(88, 101, 242, 0.05);
                border: 2px dashed #5865f2;
                border-radius: 4px;
                min-height: 40px;
            }
            
            .channels-section.drag-over-zone,
            .voice-channels-section.drag-over-zone {
                background-color: rgba(88, 101, 242, 0.05);
                border: 2px dashed #5865f2;
                border-radius: 4px;
                min-height: 40px;
            }
            
            .drag-potential-target {
                transition: all 0.2s ease;
                opacity: 0.7;
            }
            
            .channel-item, .category-header {
                transition: all 0.2s ease;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    reinitialize() {
        this.isInitialized = false;
        this.clearDragStates();
        
        document.querySelectorAll('[data-drag-setup]').forEach(el => {
            el.removeAttribute('data-drag-setup');
        });
        
        this.init();
    }
}

let channelDragManager = null;

export function initChannelDragSystem() {
    if (!channelDragManager) {
        channelDragManager = new ChannelDragManager();
    } else {
        channelDragManager.reinitialize();
    }
    
    return channelDragManager;
}

export function getChannelDragManager() {
    return channelDragManager;
}

if (typeof window !== 'undefined') {
    window.initChannelDragSystem = initChannelDragSystem;
    window.getChannelDragManager = getChannelDragManager;
}

export default ChannelDragManager;
