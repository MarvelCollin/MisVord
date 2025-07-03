class ChannelDragSystem {
    constructor() {
        this.isDragging = false;
        this.draggedElement = null;
        this.draggedType = null;
        this.draggedId = null;
        this.dropTargets = [];
        this.dragIndicator = null;
        this.originalPosition = null;
        this.serverId = null;
        
        this.init();
    }
    
    init() {
        this.createDragIndicator();
        this.setupEventListeners();
        this.initializeDragElements();
    }
    
    createDragIndicator() {
        this.dragIndicator = document.createElement('div');
        this.dragIndicator.className = 'channel-drag-indicator';
        this.dragIndicator.style.cssText = `
            position: absolute;
            height: 2px;
            background: #5865f2;
            border-radius: 1px;
            z-index: 1000;
            display: none;
            box-shadow: 0 0 4px rgba(88, 101, 242, 0.5);
        `;
        document.body.appendChild(this.dragIndicator);
    }
    
    setupEventListeners() {
        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragend', this.handleDragEnd.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
        document.addEventListener('dragenter', this.handleDragEnter.bind(this));
        document.addEventListener('dragleave', this.handleDragLeave.bind(this));
    }
    
    initializeDragElements() {
        const serverId = this.getServerId();
        if (!serverId) return;
        
        this.serverId = serverId;
        
        this.setupChannelDragging();
        this.setupCategoryDragging();
    }
    
    setupChannelDragging() {
        document.querySelectorAll('.channel-item[data-channel-id]:not([data-drag-setup])').forEach(channel => {
            channel.setAttribute('data-drag-setup', 'true');
            channel.draggable = true;
            
            const channelId = channel.getAttribute('data-channel-id');
            const channelType = channel.getAttribute('data-channel-type') || 'text';
            
            channel.addEventListener('dragstart', (e) => {
                this.isDragging = true;
                this.draggedElement = channel;
                this.draggedType = 'channel';
                this.draggedId = channelId;
                
                this.originalPosition = {
                    parent: channel.parentElement,
                    nextSibling: channel.nextElementSibling
                };
                
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: 'channel',
                    id: channelId,
                    channelType: channelType
                }));
                
                channel.style.opacity = '0.5';
                this.addDragStyles();
            });
        });
    }
    
    setupCategoryDragging() {
        document.querySelectorAll('.category-section[data-category-id]:not([data-drag-setup])').forEach(category => {
            const categoryHeader = category.querySelector('.category-header');
            if (!categoryHeader) return;
            
            category.setAttribute('data-drag-setup', 'true');
            categoryHeader.draggable = true;
            
            const categoryId = category.getAttribute('data-category-id');
            
            categoryHeader.addEventListener('dragstart', (e) => {
                this.isDragging = true;
                this.draggedElement = category;
                this.draggedType = 'category';
                this.draggedId = categoryId;
                
                this.originalPosition = {
                    parent: category.parentElement,
                    nextSibling: category.nextElementSibling
                };
                
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: 'category',
                    id: categoryId
                }));
                
                category.style.opacity = '0.5';
                this.addDragStyles();
            });
        });
    }
    
    addDragStyles() {
        document.body.classList.add('channel-dragging');
        
        if (!document.getElementById('channel-drag-styles')) {
            const styles = document.createElement('style');
            styles.id = 'channel-drag-styles';
            styles.textContent = `
                .channel-dragging .channel-item:not(.dragging) {
                    transition: transform 0.2s ease, margin 0.2s ease;
                }
                .channel-dragging .category-section:not(.dragging) {
                    transition: transform 0.2s ease, margin 0.2s ease;
                }
                .channel-drag-over {
                    background-color: rgba(88, 101, 242, 0.1) !important;
                    border-left: 2px solid #5865f2 !important;
                }
                .category-drag-over {
                    background-color: rgba(88, 101, 242, 0.05) !important;
                    border: 1px solid rgba(88, 101, 242, 0.3) !important;
                    border-radius: 4px !important;
                }
                .dragging {
                    pointer-events: none;
                }
            `;
            document.head.appendChild(styles);
        }
    }
    
    handleDragStart(e) {
        if (!this.isDragging) return;
        
        e.target.classList.add('dragging');
    }
    
    handleDragEnd(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.dragIndicator.style.display = 'none';
        
        if (this.draggedElement) {
            this.draggedElement.style.opacity = '';
            this.draggedElement.classList.remove('dragging');
        }
        
        document.querySelectorAll('.channel-drag-over, .category-drag-over').forEach(el => {
            el.classList.remove('channel-drag-over', 'category-drag-over');
        });
        
        document.body.classList.remove('channel-dragging');
        
        this.draggedElement = null;
        this.draggedType = null;
        this.draggedId = null;
        this.originalPosition = null;
    }
    
    handleDragOver(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        const target = this.findDropTarget(e.target);
        if (!target) return;
        
        this.showDropIndicator(e, target);
    }
    
    handleDragEnter(e) {
        if (!this.isDragging) return;
        
        const target = this.findDropTarget(e.target);
        if (!target) return;
        
        if (this.draggedType === 'channel') {
            if (target.classList.contains('category-channels') || target.classList.contains('channels-section')) {
                target.classList.add('channel-drag-over');
            } else if (target.classList.contains('category-section')) {
                target.classList.add('category-drag-over');
            }
        } else if (this.draggedType === 'category') {
            if (target.classList.contains('channel-list')) {
                target.classList.add('category-drag-over');
            }
        }
    }
    
    handleDragLeave(e) {
        if (!this.isDragging) return;
        
        const target = e.target;
        target.classList.remove('channel-drag-over', 'category-drag-over');
    }
    
    handleDrop(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        const target = this.findDropTarget(e.target);
        if (!target) return;
        
        const dropData = this.calculateDropPosition(e, target);
        if (!dropData) return;
        
        this.performDrop(dropData);
    }
    
    findDropTarget(element) {
        if (!element) return null;
        
        if (this.draggedType === 'channel') {
            return element.closest('.category-channels') || 
                   element.closest('.channels-section') || 
                   element.closest('.voice-channels-section') ||
                   element.closest('.category-section') ||
                   element.closest('.channel-list');
        } else if (this.draggedType === 'category') {
            return element.closest('.channel-list');
        }
        
        return null;
    }
    
    showDropIndicator(e, target) {
        const rect = target.getBoundingClientRect();
        const children = Array.from(target.children);
        
        let insertPosition = children.length;
        let indicatorY = rect.bottom - 1;
        
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const childRect = child.getBoundingClientRect();
            const childMiddle = childRect.top + childRect.height / 2;
            
            if (e.clientY < childMiddle) {
                insertPosition = i;
                indicatorY = childRect.top - 1;
                break;
            }
        }
        
        this.dragIndicator.style.cssText += `
            display: block;
            left: ${rect.left + 8}px;
            top: ${indicatorY}px;
            width: ${rect.width - 16}px;
        `;
    }
    
    calculateDropPosition(e, target) {
        const rect = target.getBoundingClientRect();
        const children = Array.from(target.children).filter(child => 
            child !== this.draggedElement && 
            !child.classList.contains('dragging')
        );
        
        let insertIndex = children.length;
        let categoryId = null;
        
        if (target.classList.contains('category-channels')) {
            categoryId = target.closest('.category-section')?.getAttribute('data-category-id');
        }
        
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const childRect = child.getBoundingClientRect();
            const childMiddle = childRect.top + childRect.height / 2;
            
            if (e.clientY < childMiddle) {
                insertIndex = i;
                break;
            }
        }
        
        return {
            target,
            insertIndex,
            categoryId,
            position: insertIndex + 1
        };
    }
    
    async performDrop(dropData) {
        try {
            if (this.draggedType === 'channel') {
                await this.moveChannel(dropData);
            } else if (this.draggedType === 'category') {
                await this.moveCategory(dropData);
            }
            
            this.refreshChannelList();
        } catch (error) {
            console.error('Error performing drop:', error);
            if (window.showToast) {
                window.showToast('Failed to move item', 'error');
            }
            
            this.revertDrag();
        }
    }
    
    async moveChannel(dropData) {
        const updates = [];
        const affectedChannels = this.getAffectedChannels(dropData);
        
        affectedChannels.forEach((channel, index) => {
            updates.push({
                type: 'channel',
                id: channel.id,
                position: index + 1,
                category_id: dropData.categoryId || null
            });
        });
        
        const response = await fetch('/api/positions/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ updates })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update channel positions');
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to update positions');
        }
    }
    
    async moveCategory(dropData) {
        const updates = [];
        const affectedCategories = this.getAffectedCategories(dropData);
        
        affectedCategories.forEach((category, index) => {
            updates.push({
                type: 'category',
                id: category.id,
                position: index + 1
            });
        });
        
        const response = await fetch('/api/positions/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ updates })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update category positions');
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to update positions');
        }
    }
    
    getAffectedChannels(dropData) {
        const container = dropData.target;
        const channels = [];
        
        Array.from(container.children).forEach(child => {
            if (child.classList.contains('channel-item')) {
                const channelId = child.getAttribute('data-channel-id');
                if (channelId) {
                    channels.push({ id: channelId, element: child });
                }
            }
        });
        
        if (this.draggedType === 'channel') {
            const draggedIndex = channels.findIndex(ch => ch.id === this.draggedId);
            if (draggedIndex !== -1) {
                channels.splice(draggedIndex, 1);
            }
            
            channels.splice(dropData.insertIndex, 0, { 
                id: this.draggedId, 
                element: this.draggedElement 
            });
        }
        
        return channels;
    }
    
    getAffectedCategories(dropData) {
        const container = dropData.target;
        const categories = [];
        
        Array.from(container.children).forEach(child => {
            if (child.classList.contains('category-section')) {
                const categoryId = child.getAttribute('data-category-id');
                if (categoryId) {
                    categories.push({ id: categoryId, element: child });
                }
            }
        });
        
        if (this.draggedType === 'category') {
            const draggedIndex = categories.findIndex(cat => cat.id === this.draggedId);
            if (draggedIndex !== -1) {
                categories.splice(draggedIndex, 1);
            }
            
            categories.splice(dropData.insertIndex, 0, { 
                id: this.draggedId, 
                element: this.draggedElement 
            });
        }
        
        return categories;
    }
    
    revertDrag() {
        if (this.originalPosition && this.draggedElement) {
            if (this.originalPosition.nextSibling) {
                this.originalPosition.parent.insertBefore(
                    this.draggedElement, 
                    this.originalPosition.nextSibling
                );
            } else {
                this.originalPosition.parent.appendChild(this.draggedElement);
            }
        }
    }
    
    refreshChannelList() {
        if (window.showToast) {
            window.showToast('Channels reordered successfully', 'success');
        }
        
        setTimeout(() => {
            if (typeof window.location !== 'undefined') {
                window.location.reload();
            }
        }, 1000);
    }
    
    getServerId() {
        const serverIdInput = document.getElementById('current-server-id');
        if (serverIdInput) {
            return serverIdInput.value;
        }
        
        const match = window.location.pathname.match(/\/server\/(\d+)/);
        return match ? match[1] : null;
    }
    
    reinitialize() {
        this.initializeDragElements();
    }
}

let channelDragSystem = null;

function initChannelDragSystem() {
    if (channelDragSystem) {
        channelDragSystem.reinitialize();
    } else {
        channelDragSystem = new ChannelDragSystem();
    }
}

if (typeof window !== 'undefined') {
    window.initChannelDragSystem = initChannelDragSystem;
    window.channelDragSystem = channelDragSystem;
    
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initChannelDragSystem, 500);
    });
    
    const observer = new MutationObserver((mutations) => {
        let shouldReinit = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.classList?.contains('channel-item') || 
                            node.classList?.contains('category-section') ||
                            node.querySelector?.('.channel-item, .category-section')) {
                            shouldReinit = true;
                        }
                    }
                });
            }
        });
        
        if (shouldReinit) {
            setTimeout(initChannelDragSystem, 100);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

export { ChannelDragSystem, initChannelDragSystem };
