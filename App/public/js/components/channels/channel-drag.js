import { showToast } from '../../core/ui/toast.js';

class ChannelDragDropManager {
    constructor() {
        this.draggedElement = null;
        this.draggedData = null;
        this.dropZones = [];
        this.ghostElement = null;
        this.isEnabled = false;
        this.serverId = null;

        this.init();
    }

    init() {
        console.log('🎯 Initializing Channel Drag & Drop Manager');
        
        document.addEventListener('DOMContentLoaded', () => {
            this.setupDragAndDrop();
        });

        this.bindEvents();
    }

    setupDragAndDrop() {
        const serverIdElement = document.getElementById('current-server-id');
        if (serverIdElement) {
            this.serverId = serverIdElement.value;
            this.isEnabled = true;
            this.initializeDragElements();
            console.log('✅ Drag & Drop enabled for server:', this.serverId);
        }
    }

    bindEvents() {
        document.addEventListener('channelListUpdated', () => {
            if (this.isEnabled) {
                this.initializeDragElements();
            }
        });

        window.addEventListener('channelManagerUpdated', () => {
            if (this.isEnabled) {
                this.initializeDragElements();
            }
        });
    }

    initializeDragElements() {
        const channelItems = document.querySelectorAll('.channel-item');
        const categoryHeaders = document.querySelectorAll('.category-header');
        const categorySections = document.querySelectorAll('.category-section');

        channelItems.forEach(channel => this.makeChannelDraggable(channel));
        categoryHeaders.forEach(header => this.makeCategoryDraggable(header));
        categorySections.forEach(section => this.makeCategoryDroppable(section));
        
        this.setupUncategorizedDropZone();
        
        console.log(`🎨 Initialized drag for ${channelItems.length} channels and ${categoryHeaders.length} categories`);
    }

    makeChannelDraggable(channelElement) {
        if (channelElement.hasAttribute('data-draggable-init')) return;
        
        channelElement.setAttribute('draggable', 'true');
        channelElement.setAttribute('data-draggable-init', 'true');
        
        channelElement.addEventListener('dragstart', (e) => {
            this.handleChannelDragStart(e, channelElement);
        });

        channelElement.addEventListener('dragend', (e) => {
            this.handleDragEnd(e);
        });

        this.addDragHandle(channelElement);
    }

    makeCategoryDraggable(categoryHeader) {
        if (categoryHeader.hasAttribute('data-draggable-init')) return;
        
        const categorySection = categoryHeader.closest('.category-section');
        if (!categorySection) return;

        categorySection.setAttribute('draggable', 'true');
        categorySection.setAttribute('data-draggable-init', 'true');
        
        categorySection.addEventListener('dragstart', (e) => {
            this.handleCategoryDragStart(e, categorySection);
        });

        categorySection.addEventListener('dragend', (e) => {
            this.handleDragEnd(e);
        });

        this.addCategoryDragHandle(categoryHeader);
    }

    makeCategoryDroppable(categorySection) {
        if (categorySection.hasAttribute('data-droppable-init')) return;
        
        categorySection.setAttribute('data-droppable-init', 'true');
        
        categorySection.addEventListener('dragover', (e) => {
            this.handleDragOver(e, categorySection);
        });

        categorySection.addEventListener('drop', (e) => {
            this.handleChannelDropOnCategory(e, categorySection);
        });

        categorySection.addEventListener('dragenter', (e) => {
            this.handleDragEnter(e, categorySection);
        });

        categorySection.addEventListener('dragleave', (e) => {
            this.handleDragLeave(e, categorySection);
        });
    }

    setupUncategorizedDropZone() {
        const channelList = document.querySelector('.channel-list');
        if (!channelList || channelList.hasAttribute('data-uncategorized-drop-init')) return;
        
        channelList.setAttribute('data-uncategorized-drop-init', 'true');
        
        channelList.addEventListener('dragover', (e) => {
            if (this.draggedData && this.draggedData.type === 'channel') {
                this.handleDragOver(e, channelList);
            }
        });

        channelList.addEventListener('drop', (e) => {
            if (this.draggedData && this.draggedData.type === 'channel') {
                this.handleChannelDropOnUncategorized(e);
            }
        });
    }

    addDragHandle(channelElement) {
        const existingHandle = channelElement.querySelector('.drag-handle');
        if (existingHandle) return;

        const handle = document.createElement('div');
        handle.className = 'drag-handle opacity-0 group-hover:opacity-100 hover:opacity-100 cursor-grab active:cursor-grabbing mr-2 transition-opacity';
        handle.innerHTML = '<i class="fas fa-grip-lines text-xs text-gray-500 hover:text-gray-300"></i>';
        handle.setAttribute('title', 'Drag to reorder');
        
        channelElement.classList.add('group');
        channelElement.insertBefore(handle, channelElement.firstChild);
    }

    addCategoryDragHandle(categoryHeader) {
        const existingHandle = categoryHeader.querySelector('.category-drag-handle');
        if (existingHandle) return;

        const handle = document.createElement('div');
        handle.className = 'category-drag-handle opacity-0 group-hover:opacity-100 hover:opacity-100 cursor-grab active:cursor-grabbing mr-2 transition-opacity';
        handle.innerHTML = '<i class="fas fa-grip-lines text-xs text-gray-500 hover:text-gray-300"></i>';
        handle.setAttribute('title', 'Drag to reorder category');
        
        categoryHeader.classList.add('group');
        const chevron = categoryHeader.querySelector('i.fa-chevron-down');
        if (chevron) {
            categoryHeader.insertBefore(handle, chevron);
        } else {
            categoryHeader.insertBefore(handle, categoryHeader.firstChild);
        }
    }

    handleChannelDragStart(e, channelElement) {
        console.log('🎯 Channel drag started:', channelElement.dataset.channelId);
        
        this.draggedElement = channelElement;
        this.draggedData = {
            type: 'channel',
            id: channelElement.dataset.channelId,
            name: channelElement.querySelector('span').textContent,
            currentCategoryId: this.getCurrentCategoryId(channelElement),
            originalPosition: this.getChannelPosition(channelElement)
        };

        this.createGhostElement(channelElement);
        this.addDragVisualEffects(channelElement);
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(this.draggedData));
        
        setTimeout(() => {
            this.highlightDropZones();
        }, 0);
    }

    handleCategoryDragStart(e, categorySection) {
        const categoryHeader = categorySection.querySelector('.category-header span');
        const categoryName = categoryHeader ? categoryHeader.textContent : 'Unknown';
        
        console.log('🗂️ Category drag started:', categoryName);
        
        this.draggedElement = categorySection;
        this.draggedData = {
            type: 'category',
            id: this.getCategoryId(categorySection),
            name: categoryName,
            originalPosition: this.getCategoryPosition(categorySection)
        };

        this.createGhostElement(categorySection);
        this.addDragVisualEffects(categorySection);
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(this.draggedData));
    }

    handleDragOver(e, dropTarget) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (this.draggedData && this.draggedData.type === 'channel') {
            this.showDropIndicator(e, dropTarget);
        }
    }

    handleDragEnter(e, categorySection) {
        if (this.draggedData && this.draggedData.type === 'channel') {
            categorySection.classList.add('drag-over');
        }
    }

    handleDragLeave(e, categorySection) {
        const rect = categorySection.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            categorySection.classList.remove('drag-over');
            this.removeDropIndicators();
        }
    }

    handleChannelDropOnCategory(e, categorySection) {
        e.preventDefault();
        
        if (!this.draggedData || this.draggedData.type !== 'channel') return;
        
        const categoryId = this.getCategoryId(categorySection);
        const newPosition = this.calculateDropPosition(e, categorySection);
        
        console.log('📥 Channel dropped on category:', categoryId, 'position:', newPosition);
        
        this.moveChannelToCategory(
            this.draggedData.id,
            categoryId,
            newPosition,
            this.draggedData.currentCategoryId
        );
        
        this.cleanup();
    }

    handleChannelDropOnUncategorized(e) {
        e.preventDefault();
        
        if (!this.draggedData || this.draggedData.type !== 'channel') return;
        
        const newPosition = this.calculateUncategorizedDropPosition(e);
        
        console.log('📤 Channel dropped on uncategorized, position:', newPosition);
        
        this.moveChannelToCategory(
            this.draggedData.id,
            null,
            newPosition,
            this.draggedData.currentCategoryId
        );
        
        this.cleanup();
    }

    handleDragEnd(e) {
        this.cleanup();
    }

    createGhostElement(element) {
        this.ghostElement = element.cloneNode(true);
        this.ghostElement.style.opacity = '0.5';
        this.ghostElement.style.transform = 'rotate(5deg)';
        this.ghostElement.style.pointerEvents = 'none';
        document.body.appendChild(this.ghostElement);
    }

    addDragVisualEffects(element) {
        element.classList.add('dragging');
        element.style.opacity = '0.5';
    }

    highlightDropZones() {
        if (this.draggedData.type === 'channel') {
            document.querySelectorAll('.category-section').forEach(section => {
                section.classList.add('drop-zone-active');
            });
            
            const channelList = document.querySelector('.channel-list');
            if (channelList) {
                channelList.classList.add('uncategorized-drop-zone-active');
            }
        }
    }

    showDropIndicator(e, dropTarget) {
        this.removeDropIndicators();
        
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        indicator.innerHTML = '<div class="drop-line"></div>';
        
        const position = this.calculateDropPosition(e, dropTarget);
        const channelElements = dropTarget.querySelectorAll('.channel-item');
        
        if (position < channelElements.length) {
            channelElements[position].parentNode.insertBefore(indicator, channelElements[position]);
        } else if (channelElements.length > 0) {
            channelElements[channelElements.length - 1].parentNode.appendChild(indicator);
        } else {
            const categoryChannels = dropTarget.querySelector('.category-channels');
            if (categoryChannels) {
                categoryChannels.appendChild(indicator);
            }
        }
    }

    removeDropIndicators() {
        document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    }

    cleanup() {
        console.log('🧹 Cleaning up drag operation');
        
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            this.draggedElement.style.opacity = '';
        }
        
        if (this.ghostElement) {
            this.ghostElement.remove();
            this.ghostElement = null;
        }
        
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        
        document.querySelectorAll('.drop-zone-active').forEach(el => {
            el.classList.remove('drop-zone-active');
        });
        
        document.querySelectorAll('.uncategorized-drop-zone-active').forEach(el => {
            el.classList.remove('uncategorized-drop-zone-active');
        });
        
        this.removeDropIndicators();
        
        this.draggedElement = null;
        this.draggedData = null;
    }

    getCurrentCategoryId(channelElement) {
        const categorySection = channelElement.closest('.category-section');
        return categorySection ? this.getCategoryId(categorySection) : null;
    }

    getCategoryId(categorySection) {
        return categorySection.dataset.categoryId || 
               categorySection.getAttribute('data-category-id') ||
               null;
    }

    getChannelPosition(channelElement) {
        const parent = channelElement.parentNode;
        const siblings = Array.from(parent.querySelectorAll('.channel-item'));
        return siblings.indexOf(channelElement);
    }

    getCategoryPosition(categorySection) {
        const channelList = document.querySelector('.channel-list');
        const categories = Array.from(channelList.querySelectorAll('.category-section'));
        return categories.indexOf(categorySection);
    }

    calculateDropPosition(e, dropTarget) {
        const channelElements = Array.from(dropTarget.querySelectorAll('.channel-item'));
        
        for (let i = 0; i < channelElements.length; i++) {
            const rect = channelElements[i].getBoundingClientRect();
            const midPoint = rect.top + (rect.height / 2);
            
            if (e.clientY < midPoint) {
                return i;
            }
        }
        
        return channelElements.length;
    }

    calculateUncategorizedDropPosition(e) {
        const uncategorizedChannels = Array.from(
            document.querySelectorAll('.channels-section .channel-item, .voice-channels-section .channel-item')
        );
        
        for (let i = 0; i < uncategorizedChannels.length; i++) {
            const rect = uncategorizedChannels[i].getBoundingClientRect();
            const midPoint = rect.top + (rect.height / 2);
            
            if (e.clientY < midPoint) {
                return i;
            }
        }
        
        return uncategorizedChannels.length;
    }

    moveChannelToCategory(channelId, categoryId, newPosition, oldCategoryId) {
        console.log('🚀 Moving channel:', { channelId, categoryId, newPosition, oldCategoryId });
        
        if (!window.channelAPI) {
            console.error('Channel API not available');
            showToast('Channel API not available', 'error');
            return;
        }
        
        window.channelAPI.moveChannelToCategory(
            channelId,
            this.serverId,
            categoryId,
            newPosition,
            oldCategoryId
        )
        .then(response => {
            console.log('✅ Channel move response:', response);
            
            if (response.success) {
                showToast('Channel moved successfully', 'success');
                this.refreshChannelList();
            } else {
                showToast(response.message || 'Failed to move channel', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Failed to move channel:', error);
            showToast('Failed to move channel', 'error');
        });
    }

    refreshChannelList() {
        if (window.channelManager && window.channelManager.refreshChannelList) {
            window.channelManager.refreshChannelList();
        } else if (window.refreshChannelList) {
            window.refreshChannelList();
        } else {
            setTimeout(() => window.location.reload(), 1000);
        }
    }
}

const channelDragDropManager = new ChannelDragDropManager();

if (typeof window !== 'undefined') {
    window.channelDragDropManager = channelDragDropManager;
}

export default channelDragDropManager;
