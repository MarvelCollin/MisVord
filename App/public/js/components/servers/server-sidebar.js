import { MisVordAjax } from '../../core/ajax/ajax-handler.js';
import { LocalStorageManager } from '../../utils/local-storage-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Server sidebar script loaded!');
    
    // Add link to our CSS file
    if (!document.querySelector('link[href="/public/css/server-sidebar.css"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.type = 'text/css';
        cssLink.href = '/public/css/server-sidebar.css';
        document.head.appendChild(cssLink);
    }

    initServerSidebar();
    initServerGroups();
    
    // Force update all folder previews after a short delay to ensure proper rendering
    setTimeout(() => {
        updateAllFolderPreviews();
        console.log('Forced update of all folder previews');
    }, 500);
    
    // Add direct click handler to ensure folder clicks work
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
            
            // Toggle the collapsed state
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
                
                // Force update all folder previews after a short delay to ensure proper rendering
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
    
    // Render existing groups from local storage
    renderServerGroups();
    
    // Add handlers for server list
    const serverList = document.getElementById('server-list');
    if (serverList) {
        console.log('Found server list, setting up drop handlers');
        
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
    
    // Global handlers for group interactions - use event delegation
    document.addEventListener('click', function(e) {
        console.log('Document click detected', e.target);
        
        // Handle group collapse toggling
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
            
            // Toggle the collapsed state
            toggleGroupCollapse(groupId, group);
            e.preventDefault();
            e.stopPropagation();
        }
    });
    
    // Handle group name editing via right-click context menu
    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.group-header')) {
            e.preventDefault();
            const groupHeader = e.target.closest('.group-header');
            const group = groupHeader.closest('.server-group');
            const groupId = group.getAttribute('data-group-id');
            
            // Get current name from local storage since it's not visible in the UI
            const groups = LocalStorageManager.getServerGroups();
            const currentGroup = groups.find(g => g.id === groupId);
            if (!currentGroup) return;
            
            // Show context menu with options
            showGroupContextMenu(e, groupId, currentGroup.name);
        }
    });
}

function renderServerGroups() {
    const groups = LocalStorageManager.getServerGroups();
    console.log('Rendering server groups:', groups);
    
    // Remove existing group containers
    document.querySelectorAll('.server-group').forEach(group => group.remove());
    
    const serverList = document.getElementById('server-list');
    if (!serverList) return;
    
    // Get all server icons that aren't in the home section
    const serverIcons = Array.from(document.querySelectorAll('.server-icon[data-server-id]'));
    const originalIconPositions = new Map();
    
    // Store original positions of all server icons
    serverIcons.forEach(icon => {
        const serverId = icon.getAttribute('data-server-id');
        if (serverId) {
            // Store a clone of the icon and its parent
            originalIconPositions.set(serverId, {
                element: icon,
                parent: icon.parentNode
            });
        }
    });
    
    console.log(`Found ${serverIcons.length} server icons in DOM`);
    
    // Find insertion point - after the home divider
    const divider = serverList.querySelector('.server-divider');
    const insertionPoint = divider ? divider.nextElementSibling : serverList.firstElementChild;
    
    // Process each group
    groups.forEach(group => {
        console.log(`Processing group: ${group.name} with ${group.servers.length} servers`);
        
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
        
        // Set initial state (open/closed)
        if (group.collapsed) {
            serversContainer.classList.add('hidden');
            groupElement.classList.remove('open');
        } else {
            groupElement.classList.add('open');
            serversContainer.classList.remove('hidden');
        }
        
        // Create the preview grid in the header and ensure folder icon is visible
        createFolderPreview(group, groupElement);
        
        // Make sure the folder icon is correctly displayed based on collapsed state
        const folderIcon = groupElement.querySelector('.folder-icon');
        const gridContainer = groupElement.querySelector('.server-preview-grid');
        
        if (group.collapsed) {
            if (folderIcon) folderIcon.style.display = 'flex';
            if (gridContainer) gridContainer.style.display = 'none';
        } else {
            if (folderIcon) folderIcon.style.display = 'none';
            if (gridContainer) gridContainer.style.display = 'grid';
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
    
    // Create folder header (appears as folder icon)
    const header = document.createElement('div');
    header.className = 'group-header';
    header.title = group.name;
    
    // Create default folder icon to ensure it's visible before preview is generated
    const defaultFolderIcon = document.createElement('div');
    defaultFolderIcon.className = 'folder-icon';
    defaultFolderIcon.innerHTML = '<i class="fas fa-folder fa-2x"></i>';
    header.appendChild(defaultFolderIcon);
    
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
    
    // Remove any existing preview first
    const existingPreview = groupElement.querySelector('.server-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    // Create grid container
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
            }
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
    
    // Update visibility based on collapsed state
    if (group.collapsed) {
        groupElement.classList.remove('open');
        folderIcon.style.display = 'flex';
        gridContainer.style.display = 'none';
    } else {
        groupElement.classList.add('open');
        folderIcon.style.display = 'none';
        gridContainer.style.display = 'grid';
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
    console.log('Toggling group collapse for', groupId);
    
    const isCollapsed = LocalStorageManager.toggleGroupCollapsed(groupId);
    console.log('Group is now', isCollapsed ? 'collapsed' : 'expanded');
    
    const group = groupElement || document.querySelector(`.server-group[data-group-id="${groupId}"]`);
    if (group) {
        console.log('Found group element to toggle');
        const serversContainer = group.querySelector('.group-servers');
        
        if (!isCollapsed) { // If now expanded
            console.log('Expanding group');
            serversContainer.classList.remove('hidden');
            group.classList.add('open');
            
            // Update folder preview
            const folderIcon = group.querySelector('.folder-icon');
            const gridContainer = group.querySelector('.server-preview-grid');
            
            console.log('Folder icon:', folderIcon);
            console.log('Grid container:', gridContainer);
            
            if (folderIcon) folderIcon.style.display = 'none';
            if (gridContainer) gridContainer.style.display = 'grid';
            
        } else { // If now collapsed
            console.log('Collapsing group');
            serversContainer.classList.add('hidden');
            group.classList.remove('open');
            
            // Update folder preview
            const folderIcon = group.querySelector('.folder-icon');
            const gridContainer = group.querySelector('.server-preview-grid');
            
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

// New function to show context menu for groups
function showGroupContextMenu(event, groupId, currentName) {
    // Remove any existing context menus
    const existingMenu = document.getElementById('group-context-menu');
    if (existingMenu) existingMenu.remove();
    
    // Create context menu
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
    
    // Add rename option
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
    
    // Add delete option
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
    
    // Add options to menu
    menu.appendChild(renameOption);
    menu.appendChild(deleteOption);
    
    // Add menu to document
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu() {
        menu.remove();
        document.removeEventListener('click', closeMenu);
    });
}

export const ServerSidebar = {
    initServerSidebar,
    updateActiveServer,
    handleServerClick,
    initServerGroups
};