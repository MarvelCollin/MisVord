import { LocalStorageManager } from '../../utils/local-storage-manager.js';

let isRendering = false;
let serverDataCache = null;
let cacheExpiry = 0;
let isHandlingClick = false;

let homeIconClickCount = 0;
let lastClickTime = 0;
const CLICK_TIMEOUT = 3000;
const CLICKS_NEEDED = 16; 



document.addEventListener('DOMContentLoaded', function() {

    initServerSidebar();
    initializeHomeIconEasterEgg();
    
    // Delay tooltip setup slightly to ensure DOM is fully ready
    setTimeout(() => {
        setupAllTooltips();
        console.log('Tooltips initialized');
    }, 100);
    
    // Add global click handler to hide stuck tooltips
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.server-sidebar-icon') && !e.target.closest('.group-header')) {
            hideAllTooltips();
        }
    });
    
    // Add mouse move handler to hide tooltips when cursor is far from sidebar
    document.addEventListener('mousemove', function(e) {
        const sidebar = document.querySelector('.w-\\[72px\\]');
        if (sidebar) {
            const rect = sidebar.getBoundingClientRect();
            if (e.clientX > rect.right + 200) {
                hideAllTooltips();
            }
        }
    });
    
    document.addEventListener('click', async function(e) {
        const homeLink = e.target.closest('a[href="/home"]') || 
                        e.target.closest('a[href="/"]') ||
                        e.target.closest('.server-icon:first-child a');
        if (homeLink && !isHandlingClick) {
            e.preventDefault();
            
            handleEasterEggLogic();
            
            isHandlingClick = true;
            try {
                await handleHomeClick(e);
            } catch (error) {
                console.error('[Click Handler] ERROR in home navigation:', error);
            } finally {
                isHandlingClick = false;
            }
            return;
        }

        const exploreLink = e.target.closest('a[href="/explore-servers"]') ||
                           e.target.closest('a[href="/explore"]');
        if (exploreLink && !isHandlingClick) {
            e.preventDefault();
            
            isHandlingClick = true;
            try {
                await handleExploreClick(e);
            } catch (error) {
                console.error('[Click Handler] ERROR in explore navigation:', error);
            } finally {
                isHandlingClick = false;
            }
            return;
        }

        const serverLink = e.target.closest('.server-icon a[href^="/server/"]');
        if (serverLink && !isHandlingClick) {
            e.preventDefault(); 
            
            const serverId = serverLink.getAttribute('data-server-id');
            if (serverId) {
                isHandlingClick = true;
                try {
                    await handleServerClick(serverId, e);
                } catch (error) {
                    console.error('[Click Handler] ERROR in server navigation:', error);
                } finally {
                    isHandlingClick = false;
                }
            }
        }
    });
    
    window.addEventListener('popstate', function(event) {

        const serverId = event.state?.serverId;
        const pageType = event.state?.pageType;
        
        if (pageType === 'home') {
            handleHomeClick();
        } else if (serverId) {
            handleServerClick(serverId);
        } else {
            const currentPath = window.location.pathname;
            if (currentPath === '/home' || currentPath === '/home/' || currentPath === '/') {
                handleHomeClick();
            }
        }
    });
});

function handleEasterEggLogic() {
    const currentTime = Date.now();
    
    if (currentTime - lastClickTime > CLICK_TIMEOUT) {
        homeIconClickCount = 1;
    } else {
        homeIconClickCount++;
    }
    
    lastClickTime = currentTime;
    
    if (homeIconClickCount >= CLICKS_NEEDED) {
        homeIconClickCount = 0;
        if (window.MusicLoaderStatic?.playDiscordoSound) {
            window.MusicLoaderStatic.playDiscordoSound();
        }
    }
}

function initializeHomeIconEasterEgg() {
}

function initServerSidebar() {
    if (window.__SIDEBAR_INITIALIZED__) {

        return;
    }
    window.__SIDEBAR_INITIALIZED__ = true;

    
    performCompleteRender();
}

function performCompleteRender() {
    clearAllPreviousState();
    
    document.querySelectorAll('.server-sidebar-icon[data-server-id]').forEach(icon => {
        icon.removeAttribute('data-setup');
    });
    
    renderFolders();
    
    // Add a final safety check after rendering to ensure no servers are lost
    setTimeout(() => {
        try {
            // Get all servers that should be visible somewhere
            const allServerElements = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
            const allServerIds = Array.from(allServerElements).map(el => el.getAttribute('data-server-id'));
            
            // Check which servers are visible either in the main list or in groups
            const mainListServers = document.querySelectorAll('#server-list > .server-sidebar-icon[data-server-id]:not([style*="display: none"])');
            const groupServers = document.querySelectorAll('.server-sidebar-group .server-sidebar-icon[data-server-id]:not([style*="display: none"])');
            
            const visibleServerIds = new Set([
                ...Array.from(mainListServers).map(el => el.getAttribute('data-server-id')),
                ...Array.from(groupServers).map(el => el.getAttribute('data-server-id'))
            ]);
            
            // Find servers that aren't visible anywhere
            const missingServerIds = allServerIds.filter(id => !visibleServerIds.has(id));
            
            // If any servers are missing, make them visible in the main list
            if (missingServerIds.length > 0) {
                console.warn('[Server Sidebar] Found missing servers after render, restoring:', missingServerIds);
                
                missingServerIds.forEach(serverId => {
                    // Find the server element
                    const serverElement = document.querySelector(`.server-sidebar-icon[data-server-id="${serverId}"]`);
                    if (serverElement) {
                        // Remove from any groups it might be in
                        LocalStorageManager.removeServerFromAllGroups(serverId);
                        
                        // Reset its state
                        serverElement.classList.remove('in-group');
                        serverElement.style.display = '';
                        
                        // Move it to the main list if it's not already there
                        const mainList = document.getElementById('server-list');
                        const addServerButton = mainList.querySelector('.discord-add-server-button')?.parentNode;
                        
                        if (mainList && addServerButton && serverElement.parentNode !== mainList) {
                            if (serverElement.parentNode) {
                                serverElement.parentNode.removeChild(serverElement);
                            }
                            mainList.insertBefore(serverElement, addServerButton);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('[Server Sidebar] Error in safety check:', error);
        }
    }, 200);
}

function clearAllPreviousState() {
    resetServersToMainList();
    
    document.querySelectorAll('.server-sidebar-icon[data-setup]').forEach(icon => {
        icon.removeAttribute('data-setup');
        icon.draggable = false;
        icon.classList.remove('in-group');
        
        // Ensure server icon is visible if it should be
        if (!icon.classList.contains('in-group')) {
            icon.style.display = '';
        }
        
        // Store original server data for recovery
        if (!icon.hasAttribute('data-original-stored')) {
            const img = icon.querySelector('.server-sidebar-button img');
            const span = icon.querySelector('.server-sidebar-button span');
            
            if (img && img.src) {
                icon.setAttribute('data-original-img', img.src);
            }
            
            if (span && span.textContent) {
                icon.setAttribute('data-original-text', span.textContent);
            }
            
            icon.setAttribute('data-original-stored', 'true');
        }
    });
    
    document.querySelectorAll('.server-sidebar-group').forEach(folder => {
        folder.remove();
    });
    
    const serverList = document.getElementById('server-list');
    if (serverList && serverList.hasAttribute('data-drop-setup')) {
        serverList.removeAttribute('data-drop-setup');
        serverList.classList.remove('drop-target');
    }
    
    document.querySelectorAll('.drag-over, .drop-target').forEach(el => {
        el.classList.remove('drag-over', 'drop-target');
    });
    
    const existingMenu = document.getElementById('group-context-menu');
    if (existingMenu) existingMenu.remove();
}

function setupServerIcons() {           
    document.querySelectorAll('.server-sidebar-icon[data-server-id]:not([data-setup])').forEach(icon => {
        icon.setAttribute('data-setup', 'true');
        icon.draggable = true;
        
        setupTooltipForElement(icon);
        
        const existingDragStart = icon._dragStartListener;
        const existingDragEnd = icon._dragEndListener;
        const existingDragOver = icon._dragOverListener;
        const existingDragLeave = icon._dragLeaveListener;
        const existingDrop = icon._dropListener;
        
        if (existingDragStart) icon.removeEventListener('dragstart', existingDragStart);
        if (existingDragEnd) icon.removeEventListener('dragend', existingDragEnd);
        if (existingDragOver) icon.removeEventListener('dragover', existingDragOver);
        if (existingDragLeave) icon.removeEventListener('dragleave', existingDragLeave);
        if (existingDrop) icon.removeEventListener('drop', existingDrop);
        
        const dragStartListener = e => {
            const serverId = icon.getAttribute('data-server-id');
            e.dataTransfer.setData('text/plain', serverId);
            icon.classList.add('dragging');
            
            document.querySelectorAll('.server-sidebar-icon').forEach(el => {
                if (el !== icon) {
                    el.classList.add('repositioning');
                }
            });
        };
        
        const dragEndListener = () => {
            icon.classList.remove('dragging');
            document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
            document.querySelectorAll('.repositioning').forEach(el => el.classList.remove('repositioning'));
        };
        
        const dragOverListener = e => {
            e.preventDefault();
            icon.classList.add('drop-target');
        };
        
        const dragLeaveListener = () => {
            icon.classList.remove('drop-target');
        };
        
        const dropListener = e => {
            e.preventDefault();
            icon.classList.remove('drop-target');
            
            const draggedId = e.dataTransfer.getData('text/plain');
            const targetId = icon.getAttribute('data-server-id');
            
            if (draggedId && targetId && draggedId !== targetId) {
                const draggedInGroup = LocalStorageManager.getServerGroup(draggedId);
                const targetInGroup = LocalStorageManager.getServerGroup(targetId);
                
                if (draggedInGroup && targetInGroup && draggedInGroup.id === targetInGroup.id) {
                    return;
                }
                
                if (draggedInGroup) {
                    LocalStorageManager.removeServerFromAllGroups(draggedId);
                }
                if (targetInGroup) {
                    LocalStorageManager.addServerToGroup(targetInGroup.id, draggedId);
                } else {
                    const groupId = LocalStorageManager.addServerGroup('Folder');
                    LocalStorageManager.addServerToGroup(groupId, draggedId);
                    LocalStorageManager.addServerToGroup(groupId, targetId);
                    LocalStorageManager.setGroupCollapsed(groupId, false);
                }
                
                performCompleteRender();
            }
        };
        
        icon.addEventListener('dragstart', dragStartListener);
        icon.addEventListener('dragend', dragEndListener);
        icon.addEventListener('dragover', dragOverListener);
        icon.addEventListener('dragleave', dragLeaveListener);
        icon.addEventListener('drop', dropListener);
        
        icon._dragStartListener = dragStartListener;
        icon._dragEndListener = dragEndListener;
        icon._dragOverListener = dragOverListener;
        icon._dragLeaveListener = dragLeaveListener;
        icon._dropListener = dropListener;
    });
}

async function renderFolders() {
    if (isRendering) return;
    isRendering = true;
    
    const serverList = document.getElementById('server-list');
    if (!serverList) {
        isRendering = false;
        return;
    }
    
    serverDataCache = null;
    
    try {
        let groups = LocalStorageManager.getServerGroups();
    
        const allAvailableServerIds = new Set(
            Array.from(document.querySelectorAll('.server-sidebar-icon[data-server-id]'))
                .map(el => el.getAttribute('data-server-id'))
        );
    
        // Keep track of modified groups for logging
        let groupsChanged = false;
        groups.forEach(group => {
            const originalServerCount = group.servers.length;
            group.servers = group.servers.filter(serverId => allAvailableServerIds.has(serverId));
            if (group.servers.length !== originalServerCount) {
                groupsChanged = true;
            }
        });
    
        if (groupsChanged) {
            LocalStorageManager.setServerGroups(groups);
        }
        
        // Automatically dissolve groups with one or zero servers.
        const validGroups = groups.filter(group => {
            if (group.servers.length <= 1) {
                LocalStorageManager.removeServerGroup(group.id);
                return false;
            }
            return true;
        });
        groups = validGroups;
    
        // Clear existing groups first
        document.querySelectorAll('.server-sidebar-group').forEach(el => el.remove());
        
        // Create a set of all servers that belong to any group
        const serversInGroups = new Set();
        groups.forEach(group => {
            group.servers.forEach(serverId => serversInGroups.add(serverId));
        });
        
        // Update visibility of server icons in the main list
        const currentServerElements = Array.from(document.querySelectorAll('#server-list > .server-sidebar-icon[data-server-id]'));
        
        // Ensure existing elements that should be in groups are marked correctly
        currentServerElements.forEach(serverIcon => {
            const serverId = serverIcon.getAttribute('data-server-id');
            if (serversInGroups.has(serverId)) {
                // Hide server in main list if it's in a group
                serverIcon.style.display = 'none';
                serverIcon.classList.add('in-group');
            } else {
                // Make sure servers that are not in groups are visible
                serverIcon.style.display = '';
                serverIcon.classList.remove('in-group');
            }
        });
        
        // Build server image data once for all servers
        const serverImageData = await buildServerImageData();
        
        // Find reference for adding server button placement
        const addServerButton = serverList.querySelector('.discord-add-server-button')?.parentNode;
        
        // Create and insert folder elements
        for (const group of groups) {
            const folderElement = createFolderElement(group);
            if (addServerButton) {
                serverList.insertBefore(folderElement, addServerButton);
            } else {
                const lastServer = serverList.querySelector('.server-sidebar-icon[data-server-id]:last-of-type');
                if (lastServer) {
                    lastServer.insertAdjacentElement('afterend', folderElement);
                } else {
                    serverList.appendChild(folderElement);
                }
            }
            
            // Get the servers container inside the folder
            const serversContainer = folderElement.querySelector('.group-servers');
            
            // Keep track of servers actually moved to the group
            const movedServerIds = [];
            
            // Find all server elements belonging to this group
            const serversToMove = group.servers
                .map(serverId => {
                    // Look for server element in both the main list and within groups
                    let element = document.querySelector(`#server-list > .server-sidebar-icon[data-server-id="${serverId}"]`) || 
                                  document.querySelector(`.server-sidebar-icon[data-server-id="${serverId}"]`);
                    return {
                        id: serverId,
                        element: element
                    };
                })
                .filter(server => server.element);
            
            // Move servers into the group container
            serversToMove.forEach(server => {
                if (serversContainer) {
                    server.element.style.display = '';  // Ensure it's visible when moving to group
                    server.element.classList.add('in-group');
                    
                    // Remove from current parent before appending to new parent
                    if (server.element.parentNode) {
                        server.element.parentNode.removeChild(server.element);
                    }
                    serversContainer.appendChild(server.element);
                    movedServerIds.push(server.id);
                    
                    // Ensure we keep the data-setup attribute for tracking
                    server.element.removeAttribute('data-setup');
                }
            });
            
            // If some servers couldn't be moved, update the group in LocalStorage
            if (movedServerIds.length !== group.servers.length) {
                group.servers = movedServerIds;
                LocalStorageManager.setServerGroups(groups);
            }
            
            // Create folder preview, update state and set up events
            createFolderPreview(group, folderElement, serverImageData);
            updateFolderState(group, folderElement);
            setupFolderEvents(group, folderElement);
        }
        
        // Set up event handlers for server icons, drop zones and tooltips
        setupServerIcons();
        setupDropZones();
        setupAllTooltips();
    } catch (error) {
        console.error('Error in renderFolders:', error);
    } finally {
        isRendering = false;
    }
}

function resetServersToMainList() {
    const mainList = document.getElementById('server-list');
    if (!mainList) return;
    
    // Get all servers currently in groups
    const serversInGroups = document.querySelectorAll('.server-sidebar-group .group-servers .server-sidebar-icon[data-server-id]');
    
    const serversToReposition = [];
    serversInGroups.forEach(serverIcon => {
        serverIcon.classList.remove('in-group');
        serverIcon.style.display = '';  // Ensure visibility
        
        // Store for later repositioning
        serversToReposition.push({
            element: serverIcon,
            id: serverIcon.getAttribute('data-server-id')
        });
        
        // Remove from current parent
        if (serverIcon.parentNode) {
            serverIcon.parentNode.removeChild(serverIcon);
        }
    });
    
    // Also find any hidden servers in the main list that should be visible
    document.querySelectorAll('.server-sidebar-icon[data-server-id].in-group').forEach(serverIcon => {
        serverIcon.classList.remove('in-group');
        serverIcon.style.display = '';  // Ensure visibility
    });
    
    // Find insertion points in the main list
    const addButton = mainList.querySelector('.discord-add-server-button')?.parentNode;
    const divider = mainList.querySelector('.server-sidebar-divider');
    const exploreButton = mainList.querySelector('.discord-explore-server-button')?.closest('.server-sidebar-icon');
    
    // Insert all servers back into the main list in their proper positions
    serversToReposition.forEach(serverData => {
        if (addButton) {
            // Insert before the add server button
            mainList.insertBefore(serverData.element, addButton);
        } else if (exploreButton) {
            // Or before the explore button if it exists
            mainList.insertBefore(serverData.element, exploreButton);
        } else if (divider) {
            // Or after the divider
            divider.insertAdjacentElement('afterend', serverData.element);
        } else {
            // Or just append to the list
            mainList.appendChild(serverData.element);
        }
        
        // Reset state for re-setup
        serverData.element.removeAttribute('data-setup');
        
        // Ensure server is visible with a small delay to avoid flicker
        setTimeout(() => {
            if (serverData.element) {
                serverData.element.style.display = '';
                serverData.element.classList.remove('in-group');
            }
        }, 50);
    });
}

function setupTooltipForElement(element) {
    const tooltip = element.querySelector('.tooltip');
    if (!tooltip || tooltip.getAttribute('data-has-clone') === 'true') return;
    
    const tooltipContainer = document.getElementById('tooltip-container');
    if (!tooltipContainer) return;
    
    // Create a clone of the tooltip in the container
    const tooltipId = 'tooltip-' + Math.random().toString(36).substr(2, 9);
    tooltip.id = tooltipId;
    
    const clone = tooltip.cloneNode(true);
    clone.setAttribute('data-for-element', tooltipId);
    tooltipContainer.appendChild(clone);
    
    // Hide the original tooltip
    tooltip.style.display = 'none';
    tooltip.setAttribute('data-has-clone', 'true');
    
    const showTooltip = (e) => {
        // Hide any other visible tooltips first
        hideAllTooltips();
        
        const rect = element.getBoundingClientRect();
        clone.style.left = (rect.right + 10) + 'px';
        clone.style.top = (rect.top + rect.height/2) + 'px';
        clone.style.transform = 'translateY(-50%)';
        clone.classList.remove('hidden');
        clone.style.display = 'block';
        clone.style.opacity = '1';
    };
    
    const hideTooltip = () => {
        clone.classList.add('hidden');
        clone.style.opacity = '0';
        setTimeout(() => {
            if (clone.classList.contains('hidden')) {
                clone.style.display = 'none';
            }
        }, 200);
    };

    // Remove existing listeners
    element.removeEventListener('mouseenter', showTooltip);
    element.removeEventListener('mouseleave', hideTooltip);
    
    // Add new listeners
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
}

function setupAllTooltips() {
    console.log('Setting up all tooltips');
    document.querySelectorAll('.server-sidebar-icon, .server-sidebar-group .group-header').forEach(icon => {
        setupTooltipForElement(icon);
    });
}

async function buildServerImageData() {
    const serverImageData = new Map();
    
    const serverData = await getServerData();
    
    document.querySelectorAll('.server-sidebar-icon[data-server-id]').forEach(icon => {
        const serverId = icon.getAttribute('data-server-id');
        
        // Restore server content if needed
        restoreServerContent(icon);
        
        const existingImg = icon.querySelector('.server-sidebar-button img');
        const existingText = icon.querySelector('.server-sidebar-button span');
        
        if (existingImg && existingImg.src && !existingImg.src.includes('default-profile-picture')) {
            serverImageData.set(serverId, {
                type: 'image',
                src: existingImg.src,
                alt: existingImg.alt || 'Server'
            });
        } else if (existingText && existingText.textContent.trim()) {
            serverImageData.set(serverId, {
                type: 'text',
                text: existingText.textContent.trim().charAt(0).toUpperCase()
            });
        } else {
            const apiServer = serverData[serverId];
            if (apiServer && apiServer.image_url) {
                 serverImageData.set(serverId, {
                    type: 'image',
                    src: apiServer.image_url,
                    alt: apiServer.name || 'Server'
                });
            } else if (apiServer && apiServer.name) {
                serverImageData.set(serverId, {
                    type: 'text',
                    text: (apiServer.name || 'S').charAt(0).toUpperCase()
                });
            } else {
                 serverImageData.set(serverId, { type: 'text', text: '?' });
            }
        }
    });
    
    return serverImageData;
}

function restoreServerContent(icon) {
    if (!icon) return;
    
    const serverButton = icon.querySelector('.server-sidebar-button');
    if (!serverButton) return;
    
    // Check if we need to restore from stored data
    const hasImage = !!serverButton.querySelector('img');
    const hasText = !!serverButton.querySelector('span');
    
    if (!hasImage && !hasText) {
        const originalImg = icon.getAttribute('data-original-img');
        const originalText = icon.getAttribute('data-original-text');
        
        if (originalImg) {
            // Restore image
            const img = document.createElement('img');
            img.src = originalImg;
            img.alt = 'Server';
            img.className = 'w-full h-full object-cover rounded-full';
            serverButton.innerHTML = '';
            serverButton.appendChild(img);
        } else if (originalText) {
            // Restore text
            const span = document.createElement('span');
            span.textContent = originalText.charAt(0).toUpperCase();
            span.className = 'text-white font-bold text-xl';
            serverButton.innerHTML = '';
            serverButton.appendChild(span);
        }
    }
}

function createFolderElement(group) {
    const folder = document.createElement('div');
    folder.className = 'server-sidebar-group';
    folder.setAttribute('data-group-id', group.id);
    
    const header = document.createElement('div');
    header.className = 'group-header';
    
    const serversContainer = document.createElement('div');
    serversContainer.className = 'group-servers';
    

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip hidden absolute left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50';
    tooltip.textContent = group.name || 'Server Folder';
    header.appendChild(tooltip);
    
    folder.appendChild(header);
    folder.appendChild(serversContainer);
    
    return folder;
}

function createFolderPreview(group, folderElement, serverImageData) {
    const header = folderElement.querySelector('.group-header');
    
    // Build the tooltip content with server names
    const serverNames = group.servers
        .map(serverId => (serverDataCache && serverDataCache[serverId]) ? serverDataCache[serverId].name : null)
        .filter(name => name !== null);
        
    let tooltipContent = '';
    if (serverNames.length > 0) {
        tooltipContent = serverNames.join('<br>');
    }
    
    header.innerHTML = '';
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'server-preview';
    
    const folderIcon = document.createElement('div');
    folderIcon.className = 'folder-icon';
    folderIcon.innerHTML = '<i class="fas fa-folder fa-2x"></i>';
    
    const gridContainer = document.createElement('div');
    gridContainer.className = 'server-preview-grid';
    
    const uniqueServers = [...new Set(group.servers)].slice(0, 4);
    
    uniqueServers.forEach(serverId => {
        const previewItem = document.createElement('div');
        previewItem.className = 'server-preview-item';
        
        const serverInfo = serverImageData.get(serverId);
        if (serverInfo) {
            if (serverInfo.type === 'image') {
                const img = document.createElement('img');
                img.src = serverInfo.src;
                img.alt = serverInfo.alt;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '3px';
                previewItem.appendChild(img);
            } else {
                previewItem.textContent = serverInfo.text;
                previewItem.style.backgroundColor = '#36393f';
                previewItem.style.color = 'white';
                previewItem.style.fontSize = '8px';
                previewItem.style.fontWeight = '700';
            }
        } else {
            const cachedServer = serverDataCache ? serverDataCache[serverId] : null;
            if (cachedServer && cachedServer.name) {
                previewItem.textContent = cachedServer.name.charAt(0).toUpperCase();
            } else {
                previewItem.textContent = '?';
            }
            previewItem.style.backgroundColor = '#36393f';
            previewItem.style.color = 'white';
            previewItem.style.fontSize = '8px';
            previewItem.style.fontWeight = '700';
        }
        
        gridContainer.appendChild(previewItem);
    });
    
    while (gridContainer.children.length < 4) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'server-preview-item empty';
        gridContainer.appendChild(emptyItem);
    }
    
    previewContainer.appendChild(folderIcon);
    previewContainer.appendChild(gridContainer);
    header.appendChild(previewContainer);
    

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip hidden absolute left-16 bg-black text-white py-1 px-2 rounded text-sm z-50';
    tooltip.style.whiteSpace = 'normal';
    tooltip.style.textAlign = 'left';
    tooltip.innerHTML = tooltipContent;

    header.appendChild(tooltip);
}

function updateFolderState(group, folderElement) {
    const serversContainer = folderElement.querySelector('.group-servers');
    const folderIcon = folderElement.querySelector('.folder-icon');
    const gridContainer = folderElement.querySelector('.server-preview-grid');
    
    if (group.collapsed) {
        folderElement.classList.remove('open');
        serversContainer.classList.add('hidden');
        if (folderIcon) folderIcon.style.display = 'flex';
        if (gridContainer) gridContainer.style.display = 'none';
    } else {
        folderElement.classList.add('open');
        serversContainer.classList.remove('hidden');
        if (folderIcon) folderIcon.style.display = 'none';
        if (gridContainer) gridContainer.style.display = 'grid';
    }
}

function setupFolderEvents(group, folderElement) {
    const header = folderElement.querySelector('.group-header');
    
    header.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        
        LocalStorageManager.toggleGroupCollapsed(group.id);
        
        const updatedGroups = LocalStorageManager.getServerGroups();
        const updatedGroup = updatedGroups.find(g => g.id === group.id);
        
        if (updatedGroup) {
            updateFolderState(updatedGroup, folderElement);
        }
    });
    
    header.addEventListener('contextmenu', e => {
        e.preventDefault();
        showContextMenu(e, group.id, group.name);
    });
    
    const tooltip = header.querySelector('.tooltip');
    if (tooltip) {
        tooltip.style.maxWidth = '250px';
        tooltip.style.whiteSpace = 'normal';
        tooltip.style.lineHeight = '1.4';
    }
    
    header.addEventListener('mouseenter', () => {
        if (tooltip) tooltip.classList.remove('hidden');
    });
    
    header.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.classList.add('hidden');
    });
}

function setupDropZones() {
    document.querySelectorAll('.server-sidebar-group:not([data-drop-setup])').forEach(folder => {
        folder.setAttribute('data-drop-setup', 'true');
        const header = folder.querySelector('.group-header');
        const serversContainer = folder.querySelector('.group-servers');
        
        [header, serversContainer].forEach(element => {
            if (!element) return;
            
            element.addEventListener('dragover', e => {
                e.preventDefault();
                e.stopPropagation();
                folder.classList.add('drag-over');
                
                folder.style.transition = 'all 0.2s ease';
                folder.style.transform = 'scale(1.02)';
                folder.style.boxShadow = '0 4px 12px rgba(88, 101, 242, 0.3)';
            });
            
            element.addEventListener('dragleave', e => {
                const rect = folder.getBoundingClientRect();
                if (e.clientX < rect.left || e.clientX > rect.right || 
                    e.clientY < rect.top || e.clientY > rect.bottom) {
                    folder.classList.remove('drag-over');
                    
                    folder.style.transform = 'scale(1)';
                    folder.style.boxShadow = '';
                    setTimeout(() => {
                        folder.style.transition = '';
                    }, 200);
                }
            });
            
            element.addEventListener('drop', e => {
                e.preventDefault();
                e.stopPropagation();
                folder.classList.remove('drag-over');
                
                folder.style.transform = 'scale(1)';
                folder.style.boxShadow = '';
                folder.style.transition = '';
                
                const serverId = e.dataTransfer.getData('text/plain');
                const groupId = folder.getAttribute('data-group-id');
                
                if (serverId && groupId) {
                    const currentGroup = LocalStorageManager.getServerGroup(serverId);
                    if (currentGroup && currentGroup.id === groupId) {
                        return;
                    }
                    
                    handleServerAddToGroup(serverId, groupId, folder);
                }
            });
        });
        
        folder.querySelectorAll('.server-sidebar-icon').forEach(serverIcon => {
            serverIcon.addEventListener('dragover', e => {
                e.preventDefault();
                e.stopPropagation();
                folder.classList.add('drag-over');
                
                folder.style.transition = 'all 0.2s ease';
                folder.style.transform = 'scale(1.02)';
                folder.style.boxShadow = '0 4px 12px rgba(88, 101, 242, 0.3)';
            });
            
            serverIcon.addEventListener('drop', e => {
                e.preventDefault();
                e.stopPropagation();
                folder.classList.remove('drag-over');
                
                folder.style.transform = 'scale(1)';
                folder.style.boxShadow = '';
                folder.style.transition = '';
                
                const serverId = e.dataTransfer.getData('text/plain');
                const groupId = folder.getAttribute('data-group-id');
                
                if (serverId && groupId) {
                    const currentGroup = LocalStorageManager.getServerGroup(serverId);
                    if (currentGroup && currentGroup.id === groupId) {
                        return;
                    }
                    
                    handleServerAddToGroup(serverId, groupId, folder);
                }
            });
        });
    });
    
    // Enhanced drop zone for ungrouping - covers the entire sidebar area
    const serverList = document.getElementById('server-list');
    const sidebarContainer = document.querySelector('.w-\\[72px\\]') || document.querySelector('[class*="w-[72px]"]');
    
    if (serverList && !serverList.hasAttribute('data-drop-setup')) {
        serverList.setAttribute('data-drop-setup', 'true');
        
        // Add drop zone to the entire sidebar container for better ungrouping
        if (sidebarContainer) {
            sidebarContainer.addEventListener('dragover', e => {
                // Only handle if not over a specific server or group
                if (!e.target.closest('.server-sidebar-group') && !e.target.closest('.server-sidebar-icon')) {
                    e.preventDefault();
                    sidebarContainer.classList.add('drop-target');
                    
                    // Visual feedback for ungrouping
                    sidebarContainer.style.backgroundColor = 'rgba(88, 101, 242, 0.1)';
                    sidebarContainer.style.transition = 'background-color 0.2s ease';
                }
            });
            
            sidebarContainer.addEventListener('dragleave', e => {
                const rect = sidebarContainer.getBoundingClientRect();
                if (e.clientX < rect.left || e.clientX > rect.right || 
                    e.clientY < rect.top || e.clientY > rect.bottom) {
                    sidebarContainer.classList.remove('drop-target');
                    sidebarContainer.style.backgroundColor = '';
                }
            });
            
            sidebarContainer.addEventListener('drop', e => {
                // Only handle if not over a specific server or group
                if (!e.target.closest('.server-sidebar-group') && !e.target.closest('.server-sidebar-icon')) {
                    e.preventDefault();
                    sidebarContainer.classList.remove('drop-target');
                    sidebarContainer.style.backgroundColor = '';
                    
                    const serverId = e.dataTransfer.getData('text/plain');
                    if (serverId) {
                        const wasInGroup = LocalStorageManager.getServerGroup(serverId);
                        if (wasInGroup) {
                            LocalStorageManager.removeServerFromAllGroups(serverId);
                        }
                        // Always render regardless if server was in group or not
                        performCompleteRender();
                    }
                }
            });
        }
        
        // Keep the original server list drop handling as backup
        serverList.addEventListener('dragover', e => {
            if (e.target.closest('.server-sidebar-group') || e.target.closest('.server-sidebar-icon')) return;
            e.preventDefault();
            serverList.classList.add('drop-target');
        });
        
        serverList.addEventListener('dragleave', e => {
            const rect = serverList.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right || 
                e.clientY < rect.top || e.clientY > rect.bottom) {
                serverList.classList.remove('drop-target');
            }
        });
        
        serverList.addEventListener('drop', e => {
            if (e.target.closest('.server-sidebar-group') || e.target.closest('.server-sidebar-icon')) return;
            
            e.preventDefault();
            serverList.classList.remove('drop-target');
            
            const serverId = e.dataTransfer.getData('text/plain');
            if (serverId) {
                const wasInGroup = LocalStorageManager.getServerGroup(serverId);
                LocalStorageManager.removeServerFromAllGroups(serverId);
                
                // Always render to ensure server is visible
                performCompleteRender();
            }
        });
    }
}

async function handleServerAddToGroup(serverId, groupId, folderElement) {
    LocalStorageManager.addServerToGroup(groupId, serverId);
    
    const serverElement = document.querySelector(`.server-sidebar-icon[data-server-id="${serverId}"]`);
    if (!serverElement) {
        performCompleteRender();
        return;
    }
    
    const originalParent = serverElement.parentNode;
    const originalRect = serverElement.getBoundingClientRect();
    
    const serversContainer = folderElement.querySelector('.group-servers');
    if (serversContainer) {
        serverElement.removeAttribute('data-setup');
        serversContainer.appendChild(serverElement);
        serverElement.classList.add('in-group');
        
        const newRect = serverElement.getBoundingClientRect();
        const deltaX = originalRect.left - newRect.left;
        const deltaY = originalRect.top - newRect.top;
        
        serverElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        serverElement.style.transition = 'transform 0.3s ease';
        
        // Make sure the server stays visible during the animation
        serverElement.style.display = '';
        
        // Use a Promise to ensure the animation completes before re-rendering
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                serverElement.style.transform = 'translate(0, 0)';
                
                // Wait for animation to complete before re-rendering
                setTimeout(() => {
                    serverElement.style.transition = '';
                    serverElement.style.transform = '';
                    resolve();
                    
                    // Only perform complete render after animation is done
                    performCompleteRender(); 
                }, 350); // Slightly longer than animation duration to ensure completion
            });
        });
    } else {
        performCompleteRender();
    }
}

async function updateGroupPreview(groupId, folderElement) {
    const groups = LocalStorageManager.getServerGroups();
    const group = groups.find(g => g.id === groupId);
    
    if (!group) return;
    
    const serverImageData = await buildServerImageData();
    
    createFolderPreview(group, folderElement, serverImageData);
    updateFolderState(group, folderElement);
    
    setupFolderEvents(group, folderElement);
}

function showContextMenu(event, groupId, groupName) {
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
    renameOption.addEventListener('click', () => {
        const newName = prompt('Enter folder name:', groupName);
        if (newName && newName.trim()) {
            LocalStorageManager.renameServerGroup(groupId, newName);
            performCompleteRender();
        }
        menu.remove();
    });
    
    const deleteOption = document.createElement('div');
    deleteOption.className = 'context-menu-item';
    deleteOption.innerHTML = '<i class="fas fa-trash"></i> Delete Folder';
    deleteOption.style.color = '#ed4245';
    deleteOption.addEventListener('click', () => {
        if (confirm('Delete this folder? Servers will return to the main list.')) {
            LocalStorageManager.removeServerGroup(groupId);
            performCompleteRender();
        }
        menu.remove();
    });
    
    menu.appendChild(renameOption);
    menu.appendChild(deleteOption);
    document.body.appendChild(menu);
    
    const closeMenu = e => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    
    document.addEventListener('click', closeMenu);
}

async function getServerData() {
    try {
        const response = await fetch('/api/user/servers', {
            method: 'GET',
            credentials: 'include',
            headers: { 
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        
        if (data.data && data.data.servers) {
            const serverMap = {};
            data.data.servers.forEach(server => {
                serverMap[server.id] = server;
            });
            serverDataCache = serverMap;
            cacheExpiry = Date.now() + 300000;
            return serverMap;
        }
    } catch (error) {
        console.error('Failed to fetch server data:', error);
    }
    
    return serverDataCache || {};
}

export function updateActiveServer(pageType = null, serverId = null) {

    
    document.querySelectorAll('.server-sidebar-icon.active').forEach(icon => {
        icon.classList.remove('active');
    });
    
    document.querySelectorAll('.discord-explore-server-button.active').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (!pageType) {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/server/')) {
            pageType = 'server';
            serverId = currentPath.split('/server/')[1].split('/')[0];
        } else if (currentPath === '/home' || currentPath === '/home/' || currentPath === '/') {
            pageType = 'home';
        } else if (currentPath.includes('/explore')) {
            pageType = 'explore';
        }
    }
    

    
    switch (pageType) {
        case 'server':
            if (serverId) {
                const serverIdStr = String(serverId);

                
                const serverLink = document.querySelector(`a[data-server-id="${serverIdStr}"]`);
                const activeIcon = serverLink ? serverLink.closest('.server-icon') : null;
                if (activeIcon) {
                    activeIcon.classList.add('active');

                } else {
                    console.warn('[Update Active Server] Server icon not found for ID:', serverIdStr);
                    const allServerLinks = document.querySelectorAll('a[data-server-id]');
                    const availableIds = Array.from(allServerLinks).map(link => link.getAttribute('data-server-id'));

                    
                    if (availableIds.length === 0) {

                    }
                }
            }
            break;
            
        case 'home':
                            const homeIcon = document.querySelector('.server-sidebar-icon:first-child');
                if (homeIcon) {
                    homeIcon.classList.add('active');

                } else {
                    console.warn('[Update Active Server] Home icon not found');
                }
            break;
            
        case 'explore':
            const exploreButton = document.querySelector('.discord-explore-server-button');
            if (exploreButton) {
                exploreButton.classList.add('active');

            } else {
                console.warn('[Update Active Server] Explore button not found');
            }
            break;
            
        default:

    }
}

export async function handleHomeClick(event) {

    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (window.location.pathname === '/home' || window.location.pathname === '/home/' || window.location.pathname === '/') {

        return;
    }

    try {

        const isVoiceConnected = window.unifiedVoiceStateManager?.getState()?.isConnected || 
                                window.voiceManager?.isConnected || 
                                window.videoSDKManager?.isConnected;
        
        const currentPath = window.location.pathname;
        const isOnAllowedPage = currentPath === '/home' || currentPath === '/home/' || currentPath === '/' || 
                               currentPath.includes('/server/') || currentPath.includes('/explore');
        
        if (isVoiceConnected && isOnAllowedPage) {

            

            if (window.unifiedVoiceStateManager) {
                const voiceState = window.unifiedVoiceStateManager.getState();

            }
            

            history.pushState({ 
                pageType: 'home',
                preserveVoice: true 
            }, 'Home', '/home');
        }
        

        window.location.href = '/home';

    } catch (error) {
        console.error('[Home Navigation] ERROR in handleHomeClick:', error);
    }
}

async function getDefaultChannelForServer(serverId) {
    try {
        const response = await fetch(`/api/servers/${serverId}/channels`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.channels && data.data.channels.length > 0) {
            const textChannel = data.data.channels.find(channel => 
                channel.type === 'text' || channel.type === 0 || channel.type_name === 'text'
            );
            return textChannel ? textChannel.id : data.data.channels[0].id;
        }
        return null;
    } catch (error) {
        console.error('[Server Navigation] Error getting default channel:', error);
        return null;
    }
}

export async function handleServerClick(serverId, event) {

    
    if (!serverId) {
        console.error('[Server Navigation] No server ID provided');
        return;
    }

    try {

        const isVoiceConnected = window.unifiedVoiceStateManager?.getState()?.isConnected || 
                                window.voiceManager?.isConnected || 
                                window.videoSDKManager?.isConnected;
        
        const currentPath = window.location.pathname;
        const isOnAllowedPage = currentPath === '/home' || currentPath === '/home/' || currentPath === '/' || 
                               currentPath.includes('/server/') || currentPath.includes('/explore');
        
        if (isVoiceConnected && isOnAllowedPage) {

            

            if (window.unifiedVoiceStateManager) {
                const voiceState = window.unifiedVoiceStateManager.getState();

            }
        }
        
        let defaultChannelId = null;
        

        defaultChannelId = await getDefaultChannelForServer(serverId);

        
        let redirectUrl = `/server/${serverId}`;
        if (defaultChannelId) {
            redirectUrl += `?channel=${defaultChannelId}`;
        }
        

        

        if (isVoiceConnected && isOnAllowedPage) {

            history.pushState({ 
                serverId: serverId, 
                channelId: defaultChannelId,
                preserveVoice: true 
            }, `Server ${serverId}`, redirectUrl);
        }
        
        window.location.href = redirectUrl;
        
    } catch (error) {
        console.error('[Server Navigation] ERROR in handleServerClick:', error);
    }
}

export async function handleExploreClick(event) {

    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (window.location.pathname === '/explore-servers' || window.location.pathname === '/explore') {

        return;
    }
    
    try {

        window.location.href = '/explore-servers';

    } catch (error) {
        console.error('[Explore Navigation] ERROR in handleExploreClick:', error);
    }
}

function getActiveChannelFromResponse(layoutContainer) {
    if (!layoutContainer) return null;
    
    const activeChannelInput = layoutContainer.querySelector('#active-channel-id');
    if (activeChannelInput && activeChannelInput.value) {
        return activeChannelInput.value;
    }
    
    const activeChannelElement = layoutContainer.querySelector('.channel-item.active-channel, .channel-item.active');
    if (activeChannelElement) {
        return activeChannelElement.getAttribute('data-channel-id');
    }
    
    const firstTextChannel = layoutContainer.querySelector('.channel-item[data-channel-type="text"]');
    if (firstTextChannel) {
        return firstTextChannel.getAttribute('data-channel-id');
    }
    
    return null;
}

function showServerChannelSection() {
    const serverChannelSelectors = [
        '.w-60.bg-discord-dark.flex.flex-col',
        'div[class*="w-60"][class*="bg-discord-dark"]',  
        'div[class*="w-60 bg-discord-dark"]'
    ];
    
    let found = false;
    serverChannelSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {

            element.style.display = 'flex';
            found = true;
        }
    });
    
    if (!found) {

    }
}

export function refreshServerGroups() {

    
    performCompleteRender();
}

window.updateActiveServer = updateActiveServer;
window.handleServerClick = handleServerClick;
window.handleHomeClick = handleHomeClick;

export const ServerSidebar = {
    updateActiveServer,
    handleServerClick,
    renderFolders: () => performCompleteRender(),
    refresh: () => performCompleteRender()
};

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    try {
        const date = new Date(timestamp);
        date.setTime(date.getTime() + (7 * 60 * 60 * 1000));
        
        const now = new Date();
        now.setTime(now.getTime() + (7 * 60 * 60 * 1000));
        
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
        } else {
            return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', timeZone: 'Asia/Jakarta' });
        }
    } catch (e) {
        console.error('Error formatting timestamp:', e);
        return '';
    }
}

function formatMessageContent(content) {
    if (!content) return '';
    
    let formattedContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
    
    formattedContent = formattedContent
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/```([\s\S]*?)```/g, '<div class="bg-[#2b2d31] p-2 my-1 rounded text-sm font-mono"><code>$1</code></div>')
        .replace(/`(.*?)`/g, '<code class="bg-[#2b2d31] px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    
    return formattedContent;
}

function groupMessagesByUser(messages) {
    const groups = [];
    let currentGroup = null;
    
    messages.forEach(message => {
        if (!currentGroup || currentGroup.userId !== message.user_id) {
            currentGroup = {
                userId: message.user_id,
                username: message.username,
                avatarUrl: message.avatar_url,
                messages: []
            };
            groups.push(currentGroup);
        }
        currentGroup.messages.push(message);
    });
    
    return groups;
}

// Function to hide all tooltips
function hideAllTooltips() {
    const tooltipContainer = document.getElementById('tooltip-container');
    if (tooltipContainer) {
        const tooltips = tooltipContainer.querySelectorAll('.tooltip');
        tooltips.forEach(tooltip => {
            tooltip.classList.add('hidden');
            tooltip.style.opacity = '0';
            tooltip.style.display = 'none';
        });
    }
}

// Expose the function globally
window.hideAllTooltips = hideAllTooltips;