import { MisVordAjax } from '../../core/ajax/ajax-handler.js';
import { LocalStorageManager } from '../../utils/local-storage-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    // Add link to our CSS file
    if (!document.querySelector('link[href="/css/server-sidebar.css"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.type = 'text/css';
        cssLink.href = '/css/server-sidebar.css';
        document.head.appendChild(cssLink);
    }

    initServerSidebar();
    initServerGroups();
    // Default folder state - uncollapsed with grid preview
    updateAllFolderPreviews();
});

export function initServerSidebar() {
    const serverIcons = document.querySelectorAll('.server-icon:not([data-initialized])');

    serverIcons.forEach(icon => {
            icon.setAttribute('data-initialized', 'true');

        // Set up click handler
            icon.addEventListener('click', (e) => {
            // Don't trigger for button clicks
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

                if (icon.classList.contains('active')) return;

                const serverId = icon.getAttribute('data-server-id');
                if (!serverId) return;

                e.preventDefault();
            handleServerClick(serverId);
        });

        // Make server icon draggable
        icon.setAttribute('draggable', 'true');
        
        icon.addEventListener('dragstart', (e) => {
            // Don't allow dragging home or special icons
            if (!icon.getAttribute('data-server-id')) {
                e.preventDefault();
                return;
            }
            
            e.dataTransfer.setData('text/plain', icon.getAttribute('data-server-id'));
            icon.classList.add('dragging');
            setTimeout(() => {
                icon.style.opacity = '0.4';
            }, 0);
        });
        
        icon.addEventListener('dragend', () => {
            icon.classList.remove('dragging');
            icon.style.opacity = '1';
            
            // Remove any lingering visual cues
            document.querySelectorAll('.drop-target').forEach(el => {
                el.classList.remove('drop-target');
            });
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
        });

        // Make server icon a drop target for other servers
        icon.addEventListener('dragover', (e) => {
            // Skip if this is the home icon or other special icons
            if (!icon.getAttribute('data-server-id')) return;
            
            // Only allow if this is a server outside of a group
            if (!icon.closest('.server-group') && !icon.classList.contains('dragging')) {
                e.preventDefault();
                icon.classList.add('drop-target');
            }
        });
        
        icon.addEventListener('dragleave', () => {
            icon.classList.remove('drop-target');
        });
        
        icon.addEventListener('drop', (e) => {
            // Skip if this is the home icon or other special icons
            if (!icon.getAttribute('data-server-id')) return;
            
            if (icon.closest('.server-group')) return; // Don't allow drops on servers already in groups
            
            icon.classList.remove('drop-target');
            const draggedServerId = e.dataTransfer.getData('text/plain');
            const targetServerId = icon.getAttribute('data-server-id');
            
            if (draggedServerId && targetServerId && draggedServerId !== targetServerId) {
                e.preventDefault();
                
                // Create a new group with both servers
                const groupName = "Folder";
                const groupId = LocalStorageManager.addServerGroup(groupName);
                
                // Add both servers to the new group
                LocalStorageManager.addServerToGroup(groupId, draggedServerId);
                LocalStorageManager.addServerToGroup(groupId, targetServerId);
                
                // Set default state to open (uncollapsed)
                LocalStorageManager.setGroupCollapsed(groupId, false);
                
                // Re-render the sidebar
                renderServerGroups();
            }
        });
    });
}

export function initServerGroups() {
    // Render existing groups from local storage
    renderServerGroups();
    
    // Add handlers for server list
    const serverList = document.getElementById('server-list');
    if (serverList) {
        // Handle server list as a drop target for removing from groups
        serverList.addEventListener('dragover', (e) => {
            // Only process if we're not over a server icon or group
            if (e.target.closest('.server-group') || e.target.closest('.server-icon')) return;
            e.preventDefault();
            serverList.classList.add('drop-target');
        });
        
        serverList.addEventListener('dragleave', (e) => {
            // Make sure we're not leaving for a child element
            const rect = serverList.getBoundingClientRect();
            const isInside = 
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;
                
            if (!isInside) {
                serverList.classList.remove('drop-target');
            }
        });
        
        serverList.addEventListener('drop', (e) => {
            // Only process if we're not over a server icon or group
            if (e.target.closest('.server-group') || e.target.closest('.server-icon')) return;
            
            e.preventDefault();
            serverList.classList.remove('drop-target');
            const serverId = e.dataTransfer.getData('text/plain');
            if (serverId) {
                LocalStorageManager.removeServerFromAllGroups(serverId);
                
                // Re-render groups
                renderServerGroups();
            }
        });
    }
    
    // Global handlers for group interactions
    document.addEventListener('click', (e) => {
        // Handle group collapse toggling
        if (e.target.closest('.group-header')) {
            const groupHeader = e.target.closest('.group-header');
            const group = groupHeader.closest('.server-group');
            const groupId = group.getAttribute('data-group-id');
            
            // Toggle the collapsed state
            toggleGroupCollapse(groupId, group);
        }
    });
    
    // Handle group name editing via double click
    document.addEventListener('dblclick', (e) => {
        if (e.target.closest('.group-header')) {
            const groupHeader = e.target.closest('.group-header');
            const group = groupHeader.closest('.server-group');
            const groupId = group.getAttribute('data-group-id');
            
            // Get current name from local storage since it's not visible in the UI
            const groups = LocalStorageManager.getServerGroups();
            const currentGroup = groups.find(g => g.id === groupId);
            if (!currentGroup) return;
            
            const currentName = currentGroup.name;
            
            // Prompt for new name
            const newName = prompt('Enter folder name:', currentName);
            if (newName !== null && newName.trim()) {
                LocalStorageManager.renameServerGroup(groupId, newName);
                renderServerGroups();
            }
        }
    });
}

function renderServerGroups() {
    const groups = LocalStorageManager.getServerGroups();
    
    // Remove existing group containers
    document.querySelectorAll('.server-group').forEach(group => group.remove());
    
    const serverList = document.getElementById('server-list');
    if (!serverList) return;
    
    // Get all server icons that aren't in the home section
    const serverIcons = Array.from(document.querySelectorAll('.server-icon[data-server-id]'));
    
    // Find insertion point - after the home divider
    const divider = serverList.querySelector('.server-divider');
    const insertionPoint = divider ? divider.nextElementSibling : serverList.firstElementChild;
    
    // Create groups and add servers to them
    groups.forEach(group => {
        // If group has no servers, remove it
        if (group.servers.length === 0) {
            LocalStorageManager.removeServerGroup(group.id);
            return;
        }
        
        // Create the group element
        const groupElement = createGroupElement(group);
        
        // Insert at the appropriate position
        if (insertionPoint) {
            serverList.insertBefore(groupElement, insertionPoint);
        } else {
            serverList.appendChild(groupElement);
        }
        
        // Find the container for servers in this group
        const serversContainer = groupElement.querySelector('.group-servers');
        
        // Move matching servers to their groups
        group.servers.forEach(serverId => {
            const serverIcon = serverIcons.find(icon => 
                icon.getAttribute('data-server-id') === serverId
            );
            
            if (serverIcon && serversContainer) {
                // Remove it from the main list
                if (serverIcon.parentNode) {
                    serverIcon.parentNode.removeChild(serverIcon);
                }
                
                // Add to the group
                serversContainer.appendChild(serverIcon);
            }
        });
        
        // Set initial state (open/closed)
        if (!group.collapsed) {
            groupElement.classList.add('open');
        }
        
        // Create the preview grid in the header
        createFolderPreview(group, groupElement);
    });
    
    // Setup drop zones for groups
    setupGroupDropZones();
    
    // Reinitialize server icons
    initServerSidebar();
}

function createGroupElement(group) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'server-group';
    if (!group.collapsed) {
        groupDiv.classList.add('open');
    }
    groupDiv.setAttribute('data-group-id', group.id);
    
    // Create folder header (appears as folder icon)
    const header = document.createElement('div');
    header.className = 'group-header';
    header.title = group.name;
    
    // Create servers container
    const serversContainer = document.createElement('div');
    serversContainer.className = 'group-servers';
    if (group.collapsed) {
        serversContainer.classList.add('hidden');
    }
    
    // Add to group
    groupDiv.appendChild(header);
    groupDiv.appendChild(serversContainer);
    
    return groupDiv;
}

function createFolderPreview(group, groupElement) {
    if (!group || !groupElement || group.servers.length === 0) return;
    
    // Create grid container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'server-preview';
    
    // Get up to 4 servers from the group
    const serverIds = group.servers.slice(0, 4);
    
    // Fill preview grid with server icons
    serverIds.forEach((serverId, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'server-preview-item';
        
        // Try to find server info
        const serverElement = document.querySelector(`.server-icon[data-server-id="${serverId}"]`);
        if (serverElement) {
            // Clone the visual (image or text)
            const serverContent = serverElement.querySelector('img') || serverElement.querySelector('span');
            
            if (serverContent) {
                if (serverContent.tagName === 'IMG') {
                    const img = document.createElement('img');
                    img.src = serverContent.src;
                    img.alt = serverContent.alt;
                    previewItem.appendChild(img);
                } else {
                    previewItem.textContent = serverContent.textContent;
                }
            }
        }
        
        previewContainer.appendChild(previewItem);
    });
    
    // Add missing grid items if needed
    while (previewContainer.children.length < 4) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'server-preview-item';
        previewContainer.appendChild(emptyItem);
    }
    
    // Add preview to group header
    const header = groupElement.querySelector('.group-header');
    if (header) {
        header.appendChild(previewContainer);
    }
}

function updateAllFolderPreviews() {
    const groups = LocalStorageManager.getServerGroups();
    groups.forEach(group => {
        const groupElement = document.querySelector(`.server-group[data-group-id="${group.id}"]`);
        if (groupElement) {
            createFolderPreview(group, groupElement);
        }
    });
}

function setupGroupDropZones() {
    // Setup groups as drop zones
    document.querySelectorAll('.server-group').forEach(group => {
        group.addEventListener('dragover', (e) => {
            e.preventDefault();
            group.classList.add('drag-over');
        });
        
        group.addEventListener('dragleave', (e) => {
            // Check if we're still within the group
            const rect = group.getBoundingClientRect();
            if (
                e.clientX < rect.left ||
                e.clientX > rect.right ||
                e.clientY < rect.top ||
                e.clientY > rect.bottom
            ) {
                group.classList.remove('drag-over');
            }
        });
        
        group.addEventListener('drop', (e) => {
            e.preventDefault();
            group.classList.remove('drag-over');
            
            const serverId = e.dataTransfer.getData('text/plain');
            if (serverId) {
                const groupId = group.getAttribute('data-group-id');
                LocalStorageManager.addServerToGroup(groupId, serverId);
                
                // Re-render groups
                renderServerGroups();
            }
        });
    });
}

function toggleGroupCollapse(groupId, groupElement) {
    const isCollapsed = LocalStorageManager.toggleGroupCollapsed(groupId);
    
    const group = groupElement || document.querySelector(`.server-group[data-group-id="${groupId}"]`);
    if (group) {
        const serversContainer = group.querySelector('.group-servers');
        
        if (!isCollapsed) { // If now expanded
            serversContainer.classList.remove('hidden');
            group.classList.add('open');
        } else { // If now collapsed
            serversContainer.classList.add('hidden');
            group.classList.remove('open');
        }
    }
}

export function updateActiveServer() {
    document.querySelectorAll('.server-icon.active').forEach(icon => {
        icon.classList.remove('active');
    });

    const currentPath = window.location.pathname;
    if (currentPath.includes('/server/')) {
        const serverId = currentPath.split('/server/')[1].split('/')[0];
        const activeIcon = document.querySelector(`.server-icon[data-server-id="${serverId}"]`);

        if (activeIcon) {
            // Add active state
            activeIcon.classList.add('active');
            console.log(`Server ${serverId} set as active`);
        } else {
            console.warn(`Could not find server icon for ID: ${serverId}`);
        }
    }
}

export function handleServerClick(serverId) {
    document.body.classList.add('content-loading');
    window.location.href = `/server/${serverId}`;
}

export const ServerSidebar = {
    initServerSidebar,
    updateActiveServer,
    handleServerClick,
    initServerGroups
};