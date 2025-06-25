import { MisVordAjax } from '../../core/ajax/ajax-handler.js';
import { LocalStorageManager } from '../../utils/local-storage-manager.js';

let serverDataCache = null;

async function fetchServerData() {
    if (serverDataCache) {
        return serverDataCache;
    }
    
    try {
        const response = await fetch('/api/user/servers', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.data.servers) {
            serverDataCache = {};
            data.data.servers.forEach(server => {
                serverDataCache[server.id] = server;
            });
            console.log('Server data fetched successfully:', serverDataCache);
            return serverDataCache;
        } else {
            console.error('Failed to fetch server data:', data);
            return {};
        }
    } catch (error) {
        console.error('Error fetching server data:', error);
        return {};
    }
}

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
});

function attachGroupClickHandlers() {
    console.log('Attaching group click handlers');
    
    document.querySelectorAll('.group-header:not([data-handlers-attached])').forEach(header => {
        console.log('Adding handlers to group header');
        
        header.setAttribute('data-handlers-attached', 'true');
        
        const clickHandler = function(e) {
            if (e.button === 2) return;
            
            console.log('Group header clicked via attachGroupClickHandlers');
            const group = this.closest('.server-group');
            if (!group) {
                console.log('No group found for header');
                return;
            }
            
            const groupId = group.getAttribute('data-group-id');
            if (!groupId) {
                console.log('No group ID found');
                return;
            }
            
            console.log('Toggling group:', groupId);
            toggleGroupCollapse(groupId, group);
            e.preventDefault();
            e.stopPropagation();
        };
        
        const contextHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Group header right-clicked');
            const group = this.closest('.server-group');
            if (!group) return;
            
            const groupId = group.getAttribute('data-group-id');
            if (!groupId) return;
            
            const groups = LocalStorageManager.getServerGroups();
            const currentGroup = groups.find(g => g.id === groupId);
            if (!currentGroup) return;
            
            showGroupContextMenu(e, groupId, currentGroup.name);
        };
        
        header.addEventListener('click', clickHandler);
        header.addEventListener('contextmenu', contextHandler);
    });
}

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
                renderServerGroups().then(() => {
                    // Force update all folder previews after a short delay to ensure proper rendering
                    setTimeout(() => {
                    const newGroup = document.querySelector(`.server-group[data-group-id="${groupId}"]`);
                    if (newGroup) {
                        console.log('Ensuring new folder visibility');
                        const group = LocalStorageManager.getServerGroups().find(g => g.id === groupId);
                        if (group) {
                            // Make sure it's visible (renderServerGroups already created the preview)
                            const folderIcon = newGroup.querySelector('.folder-icon');
                            const gridContainer = newGroup.querySelector('.server-preview-grid');
                            const serversContainer = newGroup.querySelector('.group-servers'); 
                            
                            newGroup.classList.add('open');
                            if (folderIcon) folderIcon.style.display = 'none';
                            if (gridContainer) gridContainer.style.display = 'grid';
                            if (serversContainer) serversContainer.classList.remove('hidden');
                        }
                    }
                }, 100);
                });
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

}

async function renderServerGroups() {
    console.log('Rendering server groups from localStorage');
    const serverList = document.getElementById('server-list');
    if (!serverList) {
        console.error('Server list not found in DOM');
        return;
    }
    
    const groups = LocalStorageManager.getServerGroups();
    console.log(`Found ${groups.length} groups in localStorage`);
    
    document.querySelectorAll('.server-group').forEach(el => el.remove());
    
    const originalIconPositions = new Map();
    const serverImageData = new Map();
    
    const serverDataFromAPI = await fetchServerData();
    
    document.querySelectorAll('.server-icon[data-server-id]').forEach(icon => {
        const serverId = icon.getAttribute('data-server-id');
        if (serverId) {
            originalIconPositions.set(serverId, { 
                element: icon,
                parent: icon.parentNode,
                nextSibling: icon.nextSibling
            });
            
            const serverData = serverDataFromAPI[serverId];
            if (serverData && serverData.image_url) {
                serverImageData.set(serverId, {
                    type: 'image',
                    src: serverData.image_url,
                    alt: serverData.name || 'Server'
                });
                console.log(`Got server image from API for ${serverId}:`, serverData.image_url);
            } else {
                const serverImg = icon.querySelector('.server-button img');
                const serverText = icon.querySelector('.server-button span');
                if (serverImg) {
                    serverImageData.set(serverId, {
                        type: 'image',
                        src: serverImg.src,
                        alt: serverImg.alt
                    });
                } else if (serverText) {
                    serverImageData.set(serverId, {
                        type: 'text',
                        text: serverText.textContent
                    });
                } else if (serverData && serverData.name) {
                    serverImageData.set(serverId, {
                        type: 'text',
                        text: serverData.name.charAt(0).toUpperCase()
                    });
                }
            }
        }
    });
    
    const insertionPoint = document.querySelector('#server-list .server-divider');
    
    groups.forEach(group => {
        console.log(`Processing group: ${group.name} with ${group.servers.length} servers, collapsed: ${group.collapsed}`);
        
        if (group.servers.length === 0) {
            LocalStorageManager.removeServerGroup(group.id);
            return;
        }
        
        const groupElement = createGroupElement(group);
        
        if (insertionPoint) {
            serverList.insertBefore(groupElement, insertionPoint);
        } else {
            serverList.appendChild(groupElement);
        }
        
        const serversContainer = groupElement.querySelector('.group-servers');
        
        group.servers.forEach(serverId => {
            const serverData = originalIconPositions.get(serverId);
            
            if (serverData && serversContainer) {
                const serverIcon = serverData.element;
                
                if (serverIcon.parentNode) {
                    serverIcon.parentNode.removeChild(serverIcon);
                }
                
                serversContainer.appendChild(serverIcon);
                console.log(`Added server ${serverId} to group ${group.name}`);
            } else {
                console.log(`Server ${serverId} not found or already processed`);
            }
        });
        
        createFolderPreviewWithData(group, groupElement, serverImageData);
        
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
    });
    
    setupGroupDropZones();
    
    setTimeout(() => {
        attachGroupClickHandlers();
        ensureFolderStates();
    }, 100);
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
    
    const serversContainer = document.createElement('div');
    serversContainer.className = 'group-servers';
    if (group.collapsed) {
        serversContainer.classList.add('hidden');
    }
    
    groupDiv.appendChild(header);
    groupDiv.appendChild(serversContainer);
    
    return groupDiv;
}

function createFolderPreviewWithData(group, groupElement, serverImageData) {
    if (!group || !groupElement || group.servers.length === 0) return;
    
    console.log(`Creating folder preview with data for group ${group.id}`);
    
    const header = groupElement.querySelector('.group-header');
    if (!header) return;
    
    // Complete cleanup of header content
    while (header.firstChild) {
        header.removeChild(header.firstChild);
    }
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'server-preview';
    
    const folderIcon = document.createElement('div');
    folderIcon.className = 'folder-icon';
    folderIcon.innerHTML = '<i class="fas fa-folder fa-2x"></i>';
    previewContainer.appendChild(folderIcon);
    
    const serverIds = group.servers.slice(0, 4);
    
    const gridContainer = document.createElement('div');
    gridContainer.className = 'server-preview-grid';
    
    let serversAdded = 0;
    
    serverIds.forEach((serverId, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'server-preview-item';
        
        const serverData = serverImageData.get(serverId);
        if (serverData) {
            if (serverData.type === 'image') {
                const img = document.createElement('img');
                img.src = serverData.src;
                img.alt = serverData.alt || 'Server';
                img.className = 'w-full h-full object-cover';
                previewItem.appendChild(img);
                serversAdded++;
                console.log('Added server image to preview from data:', serverData.src);
            } else if (serverData.type === 'text') {
                previewItem.textContent = serverData.text.charAt(0);
                serversAdded++;
            }
        } else {
            previewItem.textContent = serverId.charAt(0).toUpperCase();
            serversAdded++;
        }
        
        gridContainer.appendChild(previewItem);
    });
    
    if (serversAdded === 0) {
        const placeholderItem = document.createElement('div');
        placeholderItem.className = 'server-preview-item';
        placeholderItem.textContent = "S";
        gridContainer.appendChild(placeholderItem);
    }
    
    while (gridContainer.children.length < 4) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'server-preview-item empty';
        gridContainer.appendChild(emptyItem);
    }
    
    previewContainer.appendChild(gridContainer);
    
    header.appendChild(previewContainer);
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip hidden';
    tooltip.textContent = group.name;
    header.appendChild(tooltip);
    
    // Add event listeners only if not already attached
    if (!header.hasAttribute('data-events-attached')) {
        header.setAttribute('data-events-attached', 'true');
        
        header.addEventListener('mouseenter', () => {
            tooltip.classList.remove('hidden');
        });
        
        header.addEventListener('mouseleave', () => {
            tooltip.classList.add('hidden');
        });
    }
    
    const isOpen = !group.collapsed;
    console.log(`Group ${group.id} is ${isOpen ? 'open' : 'closed'}`);
    
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

function createFolderPreview(group, groupElement) {
    if (!group || !groupElement || group.servers.length === 0) return;
    
    console.log(`Creating folder preview for group ${group.id}`);
    
    const existingPreview = groupElement.querySelector('.server-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'server-preview';
    
    const folderIcon = document.createElement('div');
    folderIcon.className = 'folder-icon';
    folderIcon.innerHTML = '<i class="fas fa-folder fa-2x"></i>';
    previewContainer.appendChild(folderIcon);
    
    const serverIds = group.servers.slice(0, 4);
    
    const gridContainer = document.createElement('div');
    gridContainer.className = 'server-preview-grid';
    
    let serversAdded = 0;
    
    serverIds.forEach((serverId, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'server-preview-item';
        
        const serverElement = document.querySelector(`.server-icon[data-server-id="${serverId}"]`);
        if (serverElement) {
            // Find image inside the server button - matches PHP structure exactly
            const serverImg = serverElement.querySelector('.server-button img');
            
            // Find span inside server button for text fallback
            const serverText = serverElement.querySelector('.server-button span');
            
            if (serverImg) {
                const img = document.createElement('img');
                img.src = serverImg.src;
                img.alt = serverImg.alt || 'Server';
                img.className = 'w-full h-full object-cover';
                previewItem.appendChild(img);
                serversAdded++;
                console.log('Added server image to preview:', serverImg.src);
            } else if (serverText) {
                previewItem.textContent = serverText.textContent.charAt(0);
                serversAdded++;
            } else {
                const buttonContent = serverElement.querySelector('.server-button');
                if (buttonContent) {
                    const contentText = buttonContent.textContent.trim();
                    if (contentText) {
                        previewItem.textContent = contentText.charAt(0);
                    } else {
                        previewItem.textContent = serverId.charAt(0).toUpperCase();
                    }
                } else {
                    previewItem.textContent = serverId.charAt(0).toUpperCase();
                }
                serversAdded++;
            }
        } else {
            previewItem.textContent = serverId.charAt(0).toUpperCase();
            serversAdded++;
        }
        
        gridContainer.appendChild(previewItem);
    });
    
    if (serversAdded === 0) {
        const placeholderItem = document.createElement('div');
        placeholderItem.className = 'server-preview-item';
        placeholderItem.textContent = "S";
        gridContainer.appendChild(placeholderItem);
    }
    
    while (gridContainer.children.length < 4) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'server-preview-item empty';
        gridContainer.appendChild(emptyItem);
    }
    
    previewContainer.appendChild(gridContainer);
    
    const header = groupElement.querySelector('.group-header');
    if (header) {
        header.innerHTML = '';
        header.appendChild(previewContainer);
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip hidden';
        tooltip.textContent = group.name;
        header.appendChild(tooltip);
        
        // Add event listeners only if not already attached
        if (!header.hasAttribute('data-events-attached')) {
            header.setAttribute('data-events-attached', 'true');
            
            header.addEventListener('mouseenter', () => {
                tooltip.classList.remove('hidden');
            });
            
            header.addEventListener('mouseleave', () => {
                tooltip.classList.add('hidden');
            });
        }
    }
    
    const isOpen = !group.collapsed;
    console.log(`Group ${group.id} is ${isOpen ? 'open' : 'closed'}`);
    
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
    
    // Prevent rapid multiple calls
    if (groupElement && groupElement.hasAttribute('data-toggling')) {
        console.log('Already toggling, ignoring...');
        return;
    }
    
    if (groupElement) {
        groupElement.setAttribute('data-toggling', 'true');
        setTimeout(() => {
            groupElement.removeAttribute('data-toggling');
        }, 300);
    }
    
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
    
    renameOption.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
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
    
    deleteOption.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (confirm('Are you sure you want to delete this folder? Servers will return to the main list.')) {
            LocalStorageManager.removeServerGroup(groupId);
            renderServerGroups();
        }
        menu.remove();
    });
    
    menu.appendChild(renameOption);
    menu.appendChild(deleteOption);
    
    document.body.appendChild(menu);
    
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    
    document.addEventListener('click', closeMenu);
}

function fixFolderDisplays() {
    console.log('Fixing folder displays');
    
    const groups = LocalStorageManager.getServerGroups();
    
    document.querySelectorAll('.server-group').forEach(group => {
        const groupId = group.getAttribute('data-group-id');
        const groupData = groups.find(g => g.id === groupId);
        
        if (!groupData) return;
        
        const isOpen = !groupData.collapsed;
        const serversContainer = group.querySelector('.group-servers');
        const folderIcon = group.querySelector('.folder-icon');
        const previewGrid = group.querySelector('.server-preview-grid');
        
        console.log(`Group ${groupId} is ${isOpen ? 'open' : 'closed'}`);
        
        if (isOpen) {
            group.classList.add('open');
            if (folderIcon) folderIcon.style.display = 'none';
            if (previewGrid) previewGrid.style.display = 'grid';
            if (serversContainer) serversContainer.classList.remove('hidden');
        } else {
            group.classList.remove('open');           
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