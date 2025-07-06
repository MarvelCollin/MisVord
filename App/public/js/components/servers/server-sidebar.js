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

    
    LocalStorageManager.initializeServerOrder();
    performCompleteRender();
}

function performCompleteRender() {

    clearAllPreviousState();
    renderFolders();
}

function clearAllPreviousState() {

    
    resetServersToMainList();
    
    document.querySelectorAll('.server-sidebar-icon[data-setup]').forEach(icon => {
        icon.removeAttribute('data-setup');
        icon.draggable = false;
        icon.classList.remove('in-group');
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
        
        icon.addEventListener('dragstart', e => {
            const serverId = icon.getAttribute('data-server-id');
            e.dataTransfer.setData('text/plain', serverId);
            icon.classList.add('dragging');
            
            document.querySelectorAll('.server-sidebar-icon').forEach(el => {
                if (el !== icon) {
                    el.classList.add('repositioning');
                }
            });
        });
        
        icon.addEventListener('dragend', () => {
            icon.classList.remove('dragging');
            document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
            document.querySelectorAll('.repositioning').forEach(el => el.classList.remove('repositioning'));
        });
        
        icon.addEventListener('dragover', e => {
            e.preventDefault();
            icon.classList.add('drop-target');
        });
        
        icon.addEventListener('dragleave', () => {
            icon.classList.remove('drop-target');
        });
        
        icon.addEventListener('drop', e => {
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
                
                updateServerOrderAfterDrop(draggedId, targetId);
                performCompleteRender();
            }
        });
    });
}

function updateServerOrderAfterDrop(draggedId, targetId) {
    const currentOrder = LocalStorageManager.getServerOrder();
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    
    const newTargetIndex = newOrder.indexOf(targetId);
    newOrder.splice(newTargetIndex, 0, draggedId);
    
    LocalStorageManager.setServerOrder(newOrder);
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
    
    let groups = LocalStorageManager.getServerGroups();
    
    // Automatically dissolve groups with one or zero servers.
    const validGroups = groups.filter(group => {
        if (group.servers.length <= 1) {
            LocalStorageManager.removeServerGroup(group.id);
            return false;
        }
        return true;
    });
    groups = validGroups;

    const serverOrder = LocalStorageManager.getServerOrder();
    
    document.querySelectorAll('.server-sidebar-group').forEach(el => el.remove());
    
    const serversInGroups = new Set();
    groups.forEach(group => {
        group.servers.forEach(serverId => serversInGroups.add(serverId));
    });
    
    const currentServerElements = Array.from(document.querySelectorAll('#server-list > .server-sidebar-icon[data-server-id]'));
    const currentServerIds = currentServerElements.map(el => el.getAttribute('data-server-id'));
    
    const newServerIds = currentServerIds.filter(id => !serverOrder.includes(id));
    if (newServerIds.length > 0) {
        const updatedOrder = [...serverOrder, ...newServerIds];
        LocalStorageManager.setServerOrder(updatedOrder);
    }
    
    currentServerElements.forEach(serverIcon => {
        const serverId = serverIcon.getAttribute('data-server-id');
        if (serversInGroups.has(serverId)) {
            serverIcon.style.display = 'none';
            serverIcon.classList.add('in-group');
        } else {
            serverIcon.style.display = '';
            serverIcon.classList.remove('in-group');
        }
    });
    
    const serverImageData = await buildServerImageData();
    
    const addServerButton = serverList.querySelector('.discord-add-server-button')?.parentNode;
    
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
        
        const serversContainer = folderElement.querySelector('.group-servers');
        
        const serversToMove = group.servers
            .map(serverId => ({
                id: serverId,
                element: document.querySelector(`.server-sidebar-icon[data-server-id="${serverId}"]`),
                orderIndex: serverOrder.indexOf(serverId)
            }))
            .filter(server => server.element)
            .sort((a, b) => (a.orderIndex === -1 ? Infinity : a.orderIndex) - (b.orderIndex === -1 ? Infinity : b.orderIndex));
        
        serversToMove.forEach(server => {
            if (serversContainer) {

                server.element.style.display = '';
                server.element.classList.add('in-group');
                if (server.element.parentNode) {
                    server.element.parentNode.removeChild(server.element);
                }
                serversContainer.appendChild(server.element);
            }
        });
        
        createFolderPreview(group, folderElement, serverImageData);
        updateFolderState(group, folderElement);
        setupFolderEvents(group, folderElement);
    }
    
    setupServerIcons();
    setupDropZones();
    setupAllTooltips();
    isRendering = false;
}

function resetServersToMainList() {
    const mainList = document.getElementById('server-list');
    if (!mainList) return;
    
    const serverOrder = LocalStorageManager.getServerOrder();
    const serversInGroups = document.querySelectorAll('.server-sidebar-group .group-servers .server-sidebar-icon[data-server-id]');
    
    const serversToReposition = [];
    serversInGroups.forEach(serverIcon => {
        serverIcon.classList.remove('in-group');
        serverIcon.style.display = '';
        serversToReposition.push({
            element: serverIcon,
            id: serverIcon.getAttribute('data-server-id')
        });
        if (serverIcon.parentNode) {
            serverIcon.parentNode.removeChild(serverIcon);
        }
    });
    
    document.querySelectorAll('.server-sidebar-icon[data-server-id].in-group').forEach(serverIcon => {
        serverIcon.classList.remove('in-group');
        serverIcon.style.display = '';
    });
    
    const addButton = mainList.querySelector('.discord-add-server-button')?.parentNode;
    const divider = mainList.querySelector('.server-sidebar-divider');
    
    serversToReposition.sort((a, b) => {
        const aIndex = serverOrder.indexOf(a.id);
        const bIndex = serverOrder.indexOf(b.id);
        return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex);
    });
    
    const existingServers = mainList.querySelectorAll('.server-sidebar-icon[data-server-id]');
    const existingServerMap = new Map();
    existingServers.forEach(server => {
        const id = server.getAttribute('data-server-id');
        const index = serverOrder.indexOf(id);
        existingServerMap.set(index === -1 ? Infinity : index, server);
    });
    
    serversToReposition.forEach(serverData => {
        const targetIndex = serverOrder.indexOf(serverData.id);
        if (targetIndex === -1) {
            if (addButton) {
                mainList.insertBefore(serverData.element, addButton);
            } else if (divider) {
                divider.insertAdjacentElement('afterend', serverData.element);
            } else {
                mainList.appendChild(serverData.element);
            }
            return;
        }
        
        let insertBeforeElement = addButton;
        for (const [index, element] of existingServerMap.entries()) {
            if (index > targetIndex) {
                insertBeforeElement = element;
                break;
            }
        }
        
        if (insertBeforeElement && mainList.contains(insertBeforeElement)) {
            mainList.insertBefore(serverData.element, insertBeforeElement);
        } else if (addButton) {
            mainList.insertBefore(serverData.element, addButton);
        } else if (divider) {
            divider.insertAdjacentElement('afterend', serverData.element);
        } else {
            mainList.appendChild(serverData.element);
        }
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
        icon.removeAttribute('data-setup');
        const serverId = icon.getAttribute('data-server-id');
        
        const apiServer = serverData[serverId];
        if (apiServer) {
            if (apiServer.image_url) {
                serverImageData.set(serverId, {
                    type: 'image',
                    src: apiServer.image_url,
                    alt: apiServer.name || 'Server'
                });
            } else {
                serverImageData.set(serverId, {
                    type: 'text',
                    text: (apiServer.name || 'Server').charAt(0).toUpperCase()
                });
            }
            return;
        }
        
        const existingImg = icon.querySelector('.server-button img');
        const existingText = icon.querySelector('.server-button span');
        
        if (existingImg && existingImg.src && !existingImg.src.includes('default-profile-picture')) {
            serverImageData.set(serverId, {
                type: 'image',
                src: existingImg.src,
                alt: existingImg.alt || 'Server'
            });
        } else if (existingText && existingText.textContent) {
            serverImageData.set(serverId, {
                type: 'text',
                text: existingText.textContent.charAt(0).toUpperCase()
            });
        } else {
            serverImageData.set(serverId, {
                type: 'text',
                text: 'S'
            });
        }
    });
    
    return serverImageData;
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
    const existingTooltip = header.querySelector('.tooltip');
    

    const tooltipText = existingTooltip ? existingTooltip.textContent : group.name;
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
            previewItem.textContent = serverId.toString().charAt(0).toUpperCase();
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
    tooltip.className = 'tooltip hidden absolute left-16 bg-black text-white py-1 px-2 rounded text-sm whitespace-nowrap z-50';
    tooltip.textContent = tooltipText;
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
    header.addEventListener('mouseenter', () => {
        tooltip.classList.remove('hidden');
    });
    
    header.addEventListener('mouseleave', () => {
        tooltip.classList.add('hidden');
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
    
    const serverList = document.getElementById('server-list');
    if (!serverList.hasAttribute('data-drop-setup')) {
        serverList.setAttribute('data-drop-setup', 'true');
        
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
                
                if (wasInGroup) {

                }
                
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
        serversContainer.appendChild(serverElement);
        
        const newRect = serverElement.getBoundingClientRect();
        const deltaX = originalRect.left - newRect.left;
        const deltaY = originalRect.top - newRect.top;
        
        serverElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        serverElement.style.transition = 'transform 0.3s ease';
        
        requestAnimationFrame(() => {
            serverElement.style.transform = 'translate(0, 0)';
            
            setTimeout(() => {
                serverElement.style.transition = '';
                serverElement.style.transform = '';
                
                updateGroupPreview(groupId, folderElement);
            }, 300);
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

    
    const currentServerElements = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
    const currentServerIds = Array.from(currentServerElements).map(el => el.getAttribute('data-server-id'));
    const savedOrder = LocalStorageManager.getServerOrder();
    
    const newServers = currentServerIds.filter(id => !savedOrder.includes(id));
    const removedServers = savedOrder.filter(id => !currentServerIds.includes(id));
    
    if (newServers.length > 0 || removedServers.length > 0) {

        
        const cleanedOrder = savedOrder.filter(id => currentServerIds.includes(id));
        const updatedOrder = [...cleanedOrder, ...newServers];
        LocalStorageManager.setServerOrder(updatedOrder);
    }
    
    performCompleteRender();
}

function testServerPositioning() {
    const serverOrder = LocalStorageManager.getServerOrder();
    const currentElements = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
    


    
    return {
        orderLength: serverOrder.length,
        domLength: currentElements.length,
        orderConsistent: serverOrder.length === currentElements.length
    };
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