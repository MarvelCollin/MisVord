import { MisVordAjax } from '../../core/ajax/ajax-handler.js';
import { LocalStorageManager } from '../../utils/local-storage-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Server sidebar script loaded!');
    
    if (!document.querySelector('link[href="/public/css/server-sidebar.css"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.type = 'text/css';
        cssLink.href = '/public/css/server-sidebar.css';
        document.head.appendChild(cssLink);
    }

    initServerSidebar();
    
    initServerGroups();
    
    setTimeout(() => {
        fixFolderDisplays();
        ensureFolderStates();
    }, 200);
    
    document.querySelectorAll('.group-header').forEach(header => {
        console.log('Adding click handler to group header:', header);
        header.addEventListener('click', (e) => {
            console.log('Group header clicked!', e.target);
            const group = header.closest('.server-group');
            if (!group) {
                console.log('No server group found');
                return;
            }
            
            const groupId = group.getAttribute('data-group-id');
            console.log('Group ID:', groupId);
            
            toggleGroupCollapse(groupId, group);
            e.preventDefault();
            e.stopPropagation();
        });
    });
});

export function initServerSidebar() {
    const serverIcons = document.querySelectorAll('.server-icon:not([data-initialized])');

    serverIcons.forEach(icon => {
            icon.setAttribute('data-initialized', 'true');

            icon.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

                if (icon.classList.contains('active')) return;

                const serverId = icon.getAttribute('data-server-id');
                if (!serverId) return;

                e.preventDefault();
            handleServerClick(serverId);
        });

        icon.setAttribute('draggable', 'true');
        
        icon.addEventListener('dragstart', (e) => {
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
            
            document.querySelectorAll('.drop-target').forEach(el => {
                el.classList.remove('drop-target');
            });
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
        });

        icon.addEventListener('dragover', (e) => {
            if (!icon.getAttribute('data-server-id')) return;
            
            if (!icon.closest('.server-group') && !icon.classList.contains('dragging')) {
                e.preventDefault();
                icon.classList.add('drop-target');
            }
        });
        
        icon.addEventListener('dragleave', () => {
            icon.classList.remove('drop-target');
        });
        
        icon.addEventListener('drop', (e) => {
            if (!icon.getAttribute('data-server-id')) return;
            
            if (icon.closest('.server-group')) return;
            
            icon.classList.remove('drop-target');
            const draggedServerId = e.dataTransfer.getData('text/plain');
            const targetServerId = icon.getAttribute('data-server-id');
            
            if (draggedServerId && targetServerId && draggedServerId !== targetServerId) {
                e.preventDefault();
                
                const groupName = "Folder";
                const groupId = LocalStorageManager.addServerGroup(groupName);

                LocalStorageManager.addServerToGroup(groupId, draggedServerId);
                LocalStorageManager.addServerToGroup(groupId, targetServerId);
                
                LocalStorageManager.setGroupCollapsed(groupId, false);
                
                renderServerGroups();
                
                setTimeout(() => {
                    const newGroup = document.querySelector(`.server-group[data-group-id="${groupId}"]`);
                    if (newGroup) {
                        console.log('Updating new folder preview');
                        const group = LocalStorageManager.getServerGroups().find(g => g.id === groupId);
                        if (group) {
                            createFolderPreview(group, newGroup);
                        }
                    }
                }, 100);
            }
        });
    });
}

export function initServerGroups() {
    console.log('Initializing server groups');
    
    renderServerGroups();
    
    const serverList = document.getElementById('server-list');
    if (serverList) {
        console.log('Found server list, setting up drop handlers');
        
        serverList.addEventListener('dragover', (e) => {
            if (e.target.closest('.server-group') || e.target.closest('.server-icon')) return;
            e.preventDefault();
            serverList.classList.add('drop-target');
        });
        
        serverList.addEventListener('dragleave', (e) => {
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
            if (e.target.closest('.server-group') || e.target.closest('.server-icon')) return;
            
            e.preventDefault();
            serverList.classList.remove('drop-target');
            const serverId = e.dataTransfer.getData('text/plain');
            if (serverId) {
                LocalStorageManager.removeServerFromAllGroups(serverId);
                
                renderServerGroups();
            }
        });
    }
    
    document.addEventListener('click', function(e) {
        console.log('Document click detected', e.target);
        
        const groupHeader = e.target.closest('.group-header');
        if (groupHeader) {
            console.log('Group header clicked via delegation');
            const group = groupHeader.closest('.server-group');
            if (!group) return;
            
            const groupId = group.getAttribute('data-group-id');
            if (!groupId) {
                console.log('No group ID found');
                return;
            }
            
            console.log('Toggling group', groupId);
            
            toggleGroupCollapse(groupId, group);
            e.preventDefault();
            e.stopPropagation();
        }
    });

    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.group-header')) {
            e.preventDefault();
            const groupHeader = e.target.closest('.group-header');
            const group = groupHeader.closest('.server-group');
            const groupId = group.getAttribute('data-group-id');
            
            const groups = LocalStorageManager.getServerGroups();
            const currentGroup = groups.find(g => g.id === groupId);
            if (!currentGroup) return;
            
            showGroupContextMenu(e, groupId, currentGroup.name);
        }
    });
}

function renderServerGroups() {
    console.log('Rendering server groups from localStorage');
    const serverList = document.getElementById('server-list');
    if (!serverList) {
        console.error('Server list not found in DOM');
        return;
    }
    
    // Get groups from local storage
    const groups = LocalStorageManager.getServerGroups();
    console.log(`Found ${groups.length} groups in localStorage`);
    
    // Remove existing groups from DOM
    document.querySelectorAll('.server-group').forEach(el => el.remove());
    
    // Setup for tracking server icons during reorganization
    const originalIconPositions = new Map();
    
    // Store original positions of server icons
    document.querySelectorAll('.server-icon[data-server-id]').forEach(icon => {
        const serverId = icon.getAttribute('data-server-id');
        if (serverId) {
            originalIconPositions.set(serverId, { 
                element: icon,
                parent: icon.parentNode,
                nextSibling: icon.nextSibling
            });
        }
    });
    
    // Insertion point (we want to insert after the home icon)
    const insertionPoint = document.querySelector('#server-list .server-divider');
    
    // Process each group
    groups.forEach(group => {
        console.log(`Processing group: ${group.name} with ${group.servers.length} servers, collapsed: ${group.collapsed}`);
        
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
            // Get the server icon from our stored map
            const serverData = originalIconPositions.get(serverId);
            
            if (serverData && serversContainer) {
                const serverIcon = serverData.element;
                
                // Check if it's still in the DOM (might have been moved already)
                if (serverIcon.parentNode) {
                    serverIcon.parentNode.removeChild(serverIcon);
                }
                
                // Add to the group
                serversContainer.appendChild(serverIcon);
                console.log(`Added server ${serverId} to group ${group.name}`);
            } else {
                console.log(`Server ${serverId} not found or already processed`);
            }
        });
        
        // Create the preview grid in the header
        createFolderPreview(group, groupElement);
        
        // Set initial open/closed state
        const folderIcon = groupElement.querySelector('.folder-icon');
        const gridContainer = groupElement.querySelector('.server-preview-grid');
        
        if (group.collapsed) {
            console.log(`Group ${group.id} is collapsed, hiding servers`);
            serversContainer.classList.add('hidden');
            groupElement.classList.remove('open');
            
            if (folderIcon) folderIcon.style.display = 'flex';
            if (gridContainer) gridContainer.style.display = 'none';
        } else {
            console.log(`Group ${group.id} is expanded, showing servers`);
            serversContainer.classList.remove('hidden');
            groupElement.classList.add('open');
            
            if (folderIcon) folderIcon.style.display = 'none';
            if (gridContainer) gridContainer.style.display = 'grid';
        }
        
        // Add click handler to group header to toggle visibility
        const header = groupElement.querySelector('.group-header');
        if (header) {
            header.addEventListener('click', (e) => {
                // Don't process right-clicks (they're for context menu)
                if (e.button === 2) return;
                
                console.log('Group header clicked');
                const groupId = groupElement.getAttribute('data-group-id');
                toggleGroupCollapse(groupId, groupElement);
                
                e.preventDefault();
                e.stopPropagation();
            });
            
            // Right-click for context menu
            header.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showGroupContextMenu(e, group.id, group.name);
            });
        }
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
    
    const header = document.createElement('div');
    header.className = 'group-header';
    header.title = group.name;

    const defaultFolderIcon = document.createElement('div');
    defaultFolderIcon.className = 'folder-icon';
    defaultFolderIcon.innerHTML = '<i class="fas fa-folder fa-2x"></i>';
    header.appendChild(defaultFolderIcon);
    
    const serversContainer = document.createElement('div');
    serversContainer.className = 'group-servers';
    if (group.collapsed) {
        serversContainer.classList.add('hidden');
    }
    
    groupDiv.appendChild(header);
    groupDiv.appendChild(serversContainer);
    
    return groupDiv;
}

function createFolderPreview(group, groupElement) {
    if (!group || !groupElement || group.servers.length === 0) return;
    
    console.log(`Creating folder preview for group ${group.id}`);
    
    // Remove any existing preview first
    const existingPreview = groupElement.querySelector('.server-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'server-preview';
    
    // Create folder icon for collapsed state
    const folderIcon = document.createElement('div');
    folderIcon.className = 'folder-icon';
    folderIcon.innerHTML = '<i class="fas fa-folder fa-2x"></i>';
    previewContainer.appendChild(folderIcon);
    
    // Get up to 4 servers from the group
    const serverIds = group.servers.slice(0, 4);
    
    // Create grid container for server previews (shown when folder is open)
    const gridContainer = document.createElement('div');
    gridContainer.className = 'server-preview-grid';
    
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
            } else {
                // Fallback if no content found
                previewItem.textContent = serverId.charAt(0).toUpperCase();
            }
        } else {
            // Fallback if server element not found
            previewItem.textContent = "S";
        }
        
        gridContainer.appendChild(previewItem);
    });
    
    // Add missing grid items if needed
    while (gridContainer.children.length < 4) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'server-preview-item empty';
        gridContainer.appendChild(emptyItem);
    }
    
    // Add grid to preview container
    previewContainer.appendChild(gridContainer);
    
    // Add preview to group header
    const header = groupElement.querySelector('.group-header');
    if (header) {
        header.innerHTML = ''; // Clear header
        header.appendChild(previewContainer);
        
        // Add group name tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip hidden';
        tooltip.textContent = group.name;
        header.appendChild(tooltip);
        
        // Setup tooltip behavior
        header.addEventListener('mouseenter', () => {
            tooltip.classList.remove('hidden');
        });
        
        header.addEventListener('mouseleave', () => {
            tooltip.classList.add('hidden');
        });
    }
    
    // Set initial visibility based on collapsed state
    const isOpen = !group.collapsed;
    console.log(`Group ${group.id} is ${isOpen ? 'open' : 'closed'}`);
    
    // Apply proper display settings based on state
    if (isOpen) {
        groupElement.classList.add('open');
        folderIcon.style.display = 'none';
        gridContainer.style.display = 'grid';
    } else {
        groupElement.classList.remove('open');
        folderIcon.style.display = 'flex';
        gridContainer.style.display = 'none';
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
    document.querySelectorAll('.server-group').forEach(group => {
        group.addEventListener('dragover', (e) => {
            e.preventDefault();
            group.classList.add('drag-over');
        });
        
        group.addEventListener('dragleave', (e) => {
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
                
                renderServerGroups();
            }
        });
    });
}

function toggleGroupCollapse(groupId, groupElement) {
    console.log('Toggling group collapse for', groupId);
    
    // Get current state from localStorage first
    const groups = LocalStorageManager.getServerGroups();
    const group = groups.find(g => g.id === groupId);
    
    if (!group) {
        console.error('Could not find group with ID:', groupId);
        return;
    }
    
    // Toggle the collapsed state
    const isCollapsed = !group.collapsed;
    group.collapsed = isCollapsed;
    
    // Save the updated state
    LocalStorageManager.saveServerGroups(groups);
    
    console.log('Group is now', isCollapsed ? 'collapsed' : 'expanded');
    
    // Update the DOM
    const groupEl = groupElement || document.querySelector(`.server-group[data-group-id="${groupId}"]`);
    if (groupEl) {
        console.log('Found group element to toggle');
        const serversContainer = groupEl.querySelector('.group-servers');
        const folderIcon = groupEl.querySelector('.folder-icon');
        const gridContainer = groupEl.querySelector('.server-preview-grid');
        
        if (!isCollapsed) { // If now expanded
            console.log('Expanding group');
            serversContainer.classList.remove('hidden');
            groupEl.classList.add('open');
            
            if (folderIcon) folderIcon.style.display = 'none';
            if (gridContainer) gridContainer.style.display = 'grid';
            
        } else { // If now collapsed
            console.log('Collapsing group');
            serversContainer.classList.add('hidden');
            groupEl.classList.remove('open');
            
            if (folderIcon) folderIcon.style.display = 'flex';
            if (gridContainer) gridContainer.style.display = 'none';
        }
    } else {
        console.error('Could not find group element for ID:', groupId);
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

function showGroupContextMenu(event, groupId, currentName) {
    const existingMenu = document.getElementById('group-context-menu');
    if (existingMenu) existingMenu.remove();
    
    const menu = document.createElement('div');
    menu.id = 'group-context-menu';
    menu.className = 'group-context-menu';
    menu.style.position = 'absolute';
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;
    menu.style.zIndex = '1000';
    menu.style.backgroundColor = '#18191c';
    menu.style.border = '1px solid #2f3136';
    menu.style.borderRadius = '4px';
    menu.style.padding = '4px 0';
    menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
    menu.style.minWidth = '180px';
    
    const renameOption = document.createElement('div');
    renameOption.className = 'context-menu-item';
    renameOption.innerHTML = '<i class="fas fa-edit"></i> Rename Folder';
    renameOption.style.padding = '8px 12px';
    renameOption.style.cursor = 'pointer';
    renameOption.style.color = '#dcddde';
    renameOption.style.fontSize = '14px';
    renameOption.style.display = 'flex';
    renameOption.style.alignItems = 'center';
    renameOption.style.gap = '8px';
    
    renameOption.addEventListener('mouseover', () => {
        renameOption.style.backgroundColor = '#5865f2';
        renameOption.style.color = 'white';
    });
    
    renameOption.addEventListener('mouseout', () => {
        renameOption.style.backgroundColor = 'transparent';
        renameOption.style.color = '#dcddde';
    });
    
    renameOption.addEventListener('click', () => {
        const newName = prompt('Enter folder name:', currentName);
        if (newName !== null && newName.trim()) {
            LocalStorageManager.renameServerGroup(groupId, newName);
            renderServerGroups();
        }
        menu.remove();
    });
    
    const deleteOption = document.createElement('div');
    deleteOption.className = 'context-menu-item';
    deleteOption.innerHTML = '<i class="fas fa-trash"></i> Delete Folder';
    deleteOption.style.padding = '8px 12px';
    deleteOption.style.cursor = 'pointer';
    deleteOption.style.color = '#ed4245';
    deleteOption.style.fontSize = '14px';
    deleteOption.style.display = 'flex';
    deleteOption.style.alignItems = 'center';
    deleteOption.style.gap = '8px';
    
    deleteOption.addEventListener('mouseover', () => {
        deleteOption.style.backgroundColor = '#ed4245';
        deleteOption.style.color = 'white';
    });
    
    deleteOption.addEventListener('mouseout', () => {
        deleteOption.style.backgroundColor = 'transparent';
        deleteOption.style.color = '#ed4245';
    });
    
    deleteOption.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this folder? Servers will return to the main list.')) {
            LocalStorageManager.removeServerGroup(groupId);
            renderServerGroups();
        }
        menu.remove();
    });
    
    menu.appendChild(renameOption);
    menu.appendChild(deleteOption);
    
    document.body.appendChild(menu);
    
    document.addEventListener('click', function closeMenu() {
        menu.remove();
        document.removeEventListener('click', closeMenu);
    });
}

function fixFolderDisplays() {
    console.log('Fixing folder displays');
    
    document.querySelectorAll('.server-group').forEach(group => {
        const isOpen = group.classList.contains('open');
        const groupId = group.getAttribute('data-group-id');
        const serversContainer = group.querySelector('.group-servers');
        const folderIcon = group.querySelector('.folder-icon');
        const previewGrid = group.querySelector('.server-preview-grid');
        
        console.log(`Group ${groupId} is ${isOpen ? 'open' : 'closed'}`);
        
        if (isOpen) {
            if (folderIcon) folderIcon.style.display = 'none';
            if (previewGrid) previewGrid.style.display = 'grid';
            if (serversContainer) serversContainer.classList.remove('hidden');
        } else {                
            if (folderIcon) folderIcon.style.display = 'flex';
            if (previewGrid) previewGrid.style.display = 'none';
            if (serversContainer) serversContainer.classList.add('hidden');
        }
    });
}

// Function to ensure folder states are consistently applied
function ensureFolderStates() {
    console.log('Ensuring folder states are consistent');
    const groups = LocalStorageManager.getServerGroups();
    
    groups.forEach(group => {
        const groupElement = document.querySelector(`.server-group[data-group-id="${group.id}"]`);
        if (!groupElement) return;
        
        const serversContainer = groupElement.querySelector('.group-servers');
        const folderIcon = groupElement.querySelector('.folder-icon');
        const gridContainer = groupElement.querySelector('.server-preview-grid');
        
        // Make sure DOM state matches localStorage state
        if (group.collapsed) {
            console.log(`Ensuring group ${group.id} is collapsed`);
            serversContainer.classList.add('hidden');
            groupElement.classList.remove('open');
            
            if (folderIcon) folderIcon.style.display = 'flex';
            if (gridContainer) gridContainer.style.display = 'none';
        } else {
            console.log(`Ensuring group ${group.id} is expanded`);
            serversContainer.classList.remove('hidden');
            groupElement.classList.add('open');
            
            if (folderIcon) folderIcon.style.display = 'none';
            if (gridContainer) gridContainer.style.display = 'grid';
        }
    });
}

export const ServerSidebar = {
    initServerSidebar,
    updateActiveServer,
    handleServerClick,
    initServerGroups
};