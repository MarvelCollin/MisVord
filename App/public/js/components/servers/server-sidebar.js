import { LocalStorageManager } from '../../utils/local-storage-manager.js';
import { playDiscordoSound, playCallSound } from '../../utils/music-loader-static.js';
import { NavigationManager } from '../../utils/navigation-manager.js';
import { loadServerPage } from '../../utils/load-server-page.js';

let isRendering = false;
let serverDataCache = null;
let cacheExpiry = 0;
let isHandlingClick = false;

let lastServerSwitchTime = 0;
const SERVER_SWITCH_DELAY = 1300;

let homeIconClickCount = 0;
let lastClickTime = 0;
const CLICK_TIMEOUT = 3000;
const CLICKS_NEEDED = 16; 

function showServerLoadingIndicator(serverId) {
    const serverIcon = document.querySelector(`a[data-server-id="${serverId}"]`)?.closest('.server-icon');
    if (!serverIcon) return;
    
    const serverButton = serverIcon.querySelector('.server-button');
    if (!serverButton) return;
    
    let loadingOverlay = serverButton.querySelector('.server-loading-overlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'server-loading-overlay';
        loadingOverlay.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        serverButton.appendChild(loadingOverlay);
    }
    
    loadingOverlay.style.display = 'flex';
    serverButton.style.opacity = '0.7';
}

function hideServerLoadingIndicator(serverId) {
    const serverIcon = document.querySelector(`a[data-server-id="${serverId}"]`)?.closest('.server-icon');
    if (!serverIcon) return;
    
    const serverButton = serverIcon.querySelector('.server-button');
    if (!serverButton) return;
    
    const loadingOverlay = serverButton.querySelector('.server-loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
    
    serverButton.style.opacity = '1';
}

function showHomeLoadingIndicator() {
    const homeIcon = document.querySelector('.server-icon:first-child');
    if (!homeIcon) return;
    
    const serverButton = homeIcon.querySelector('.server-button');
    if (!serverButton) return;
    
    let loadingOverlay = serverButton.querySelector('.server-loading-overlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'server-loading-overlay';
        loadingOverlay.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        serverButton.appendChild(loadingOverlay);
    }
    
    loadingOverlay.style.display = 'flex';
    serverButton.style.opacity = '0.7';
}

function hideHomeLoadingIndicator() {
    const homeIcon = document.querySelector('.server-icon:first-child');
    if (!homeIcon) return;
    
    const serverButton = homeIcon.querySelector('.server-button');
    if (!serverButton) return;
    
    const loadingOverlay = serverButton.querySelector('.server-loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
    
    serverButton.style.opacity = '1';
}

function showExploreLoadingIndicator() {
    const exploreButton = document.querySelector('.discord-explore-server-button');
    if (!exploreButton) return;
    
    let loadingOverlay = exploreButton.querySelector('.server-loading-overlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'server-loading-overlay';
        loadingOverlay.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        exploreButton.appendChild(loadingOverlay);
    }
    
    loadingOverlay.style.display = 'flex';
    exploreButton.style.opacity = '0.7';
}

function hideExploreLoadingIndicator() {
    const exploreButton = document.querySelector('.discord-explore-server-button');
    if (!exploreButton) return;
    
    const loadingOverlay = exploreButton.querySelector('.server-loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
    
    exploreButton.style.opacity = '1';
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Server Sidebar] DOMContentLoaded: Initializing server sidebar');
    initServerSidebar();
    initializeHomeIconEasterEgg();
    
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
        console.log('[Server Sidebar] Popstate event triggered:', event.state);
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
        playDiscordoSound();
    }
}

function initializeHomeIconEasterEgg() {
}

function initServerSidebar() {
    console.log('[Server Sidebar] Initializing server sidebar');
    performCompleteRender();
}

function performCompleteRender() {
    console.log('[Server Sidebar] Performing complete render');
    clearAllPreviousState();
    renderFolders();
}

function clearAllPreviousState() {
    console.log('[Server Sidebar] Clearing previous state');
    document.querySelectorAll('.server-icon[data-setup]').forEach(icon => {
        icon.removeAttribute('data-setup');
        icon.draggable = false;
        const newIcon = icon.cloneNode(true);
        icon.parentNode.replaceChild(newIcon, icon);
    });
    
    document.querySelectorAll('.server-group[data-drop-setup]').forEach(folder => {
        folder.removeAttribute('data-drop-setup');
        const newFolder = folder.cloneNode(true);
        folder.parentNode.replaceChild(newFolder, folder);
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
    console.log('[Server Sidebar] Setting up server icons drag and drop');
    document.querySelectorAll('.server-icon[data-server-id]:not([data-setup])').forEach(icon => {
        icon.setAttribute('data-setup', 'true');
        icon.draggable = true;
        
        icon.addEventListener('dragstart', e => {
            const serverId = icon.getAttribute('data-server-id');
            e.dataTransfer.setData('text/plain', serverId);
            icon.style.opacity = '0.5';
        });
        
        icon.addEventListener('dragend', () => {
            icon.style.opacity = '1';
            document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
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
                    performCompleteRender();
                    return;
                }
                
                const groupId = LocalStorageManager.addServerGroup('Folder');
                LocalStorageManager.addServerToGroup(groupId, draggedId);
                LocalStorageManager.addServerToGroup(groupId, targetId);
                LocalStorageManager.setGroupCollapsed(groupId, false);
                performCompleteRender();
            }
        });
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
    
    const groups = LocalStorageManager.getServerGroups();
    
    document.querySelectorAll('.server-group').forEach(el => el.remove());
    
    const serverImageData = await buildServerImageData();
    const insertPoint = serverList.querySelector('.server-divider');
    
    for (const group of groups) {
        if (group.servers.length === 0) {
            LocalStorageManager.removeServerGroup(group.id);
            continue;
        }
        
        const folderElement = createFolderElement(group);
        if (insertPoint) {
            serverList.insertBefore(folderElement, insertPoint);
        } else {
            serverList.appendChild(folderElement);
        }
        
        const serversContainer = folderElement.querySelector('.group-servers');
        
        group.servers.forEach(serverId => {
            const serverElement = document.querySelector(`.server-icon[data-server-id="${serverId}"]`);
            if (serverElement && serversContainer) {
                if (serverElement.parentNode) {
                    serverElement.parentNode.removeChild(serverElement);
                }
                serversContainer.appendChild(serverElement);
            }
        });
        
        createFolderPreview(group, folderElement, serverImageData);
        updateFolderState(group, folderElement);
        setupFolderEvents(group, folderElement);
    }
    
    setupServerIcons();
    setupDropZones();
    isRendering = false;
}

async function buildServerImageData() {
    const serverImageData = new Map();
    
    const serverData = await getServerData();
    
    document.querySelectorAll('.server-icon[data-server-id]').forEach(icon => {
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
        
        if (existingImg && existingImg.src && !existingImg.src.includes('main-logo')) {
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
    folder.className = 'server-group';
    folder.setAttribute('data-group-id', group.id);
    
    const header = document.createElement('div');
    header.className = 'group-header';
    
    const serversContainer = document.createElement('div');
    serversContainer.className = 'group-servers';
    
    folder.appendChild(header);
    folder.appendChild(serversContainer);
    
    return folder;
}

function createFolderPreview(group, folderElement, serverImageData) {
    const header = folderElement.querySelector('.group-header');
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
    tooltip.className = 'tooltip hidden';
    tooltip.textContent = group.name;
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
    document.querySelectorAll('.server-group:not([data-drop-setup])').forEach(folder => {
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
        
        folder.querySelectorAll('.server-icon').forEach(serverIcon => {
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
            if (e.target.closest('.server-group') || e.target.closest('.server-icon')) return;
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
            if (e.target.closest('.server-group') || e.target.closest('.server-icon')) return;
            
            e.preventDefault();
            serverList.classList.remove('drop-target');
            
            const serverId = e.dataTransfer.getData('text/plain');
            if (serverId) {
                LocalStorageManager.removeServerFromAllGroups(serverId);
                performCompleteRender();
            }
        });
    }
}

async function handleServerAddToGroup(serverId, groupId, folderElement) {
    LocalStorageManager.addServerToGroup(groupId, serverId);
    
    const serverElement = document.querySelector(`.server-icon[data-server-id="${serverId}"]`);
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
        const response = await $.ajax({
            url: '/api/user/servers',
            method: 'GET',
            dataType: 'json',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        if (response.data && response.data.servers) {
            const serverMap = {};
            response.data.servers.forEach(server => {
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
    console.log('[Update Active Server] Called with:', { pageType, serverId });
    
    // Clear all active states from server icons
    document.querySelectorAll('.server-icon.active').forEach(icon => {
        icon.classList.remove('active');
        console.log('[Update Active Server] Removed active from server icon');
    });
    
    // Clear explore button active state
    document.querySelectorAll('.discord-explore-server-button.active').forEach(btn => {
        btn.classList.remove('active');
        console.log('[Update Active Server] Removed active from explore button');
    });
    
    // If no parameters provided, try to detect from URL
    if (!pageType) {
        const currentPath = window.location.pathname;
        console.log('[Update Active Server] Detecting from URL:', currentPath);
        
        if (currentPath.includes('/server/')) {
            pageType = 'server';
            serverId = currentPath.split('/server/')[1].split('/')[0];
        } else if (currentPath === '/home' || currentPath === '/home/' || currentPath === '/') {
            pageType = 'home';
        } else if (currentPath.includes('/explore')) {
            pageType = 'explore';
        }
    }
    
    console.log('[Update Active Server] Final state:', { pageType, serverId });
    
    // Apply active state based on page type
    switch (pageType) {
        case 'server':
            if (serverId) {
                // Convert serverId to string for consistent comparison
                const serverIdStr = String(serverId);
                console.log('[Update Active Server] Looking for server ID:', serverIdStr);
                
                // Find the server icon by looking for the anchor with data-server-id, then get its parent
                const serverLink = document.querySelector(`a[data-server-id="${serverIdStr}"]`);
                const activeIcon = serverLink ? serverLink.closest('.server-icon') : null;
                if (activeIcon) {
                    activeIcon.classList.add('active');
                    console.log('[Update Active Server] Activated server icon for ID:', serverIdStr);
                } else {
                    console.warn('[Update Active Server] Server icon not found for ID:', serverIdStr);
                    // Debug: Let's see what server links we have
                    const allServerLinks = document.querySelectorAll('a[data-server-id]');
                    console.log('[Update Active Server] Available server IDs:', 
                        Array.from(allServerLinks).map(link => link.getAttribute('data-server-id')));
                }
            }
            break;
            
        case 'home':
            const homeIcon = document.querySelector('.server-icon:first-child');
            if (homeIcon) {
                homeIcon.classList.add('active');
                console.log('[Update Active Server] Activated home icon');
            } else {
                console.warn('[Update Active Server] Home icon not found');
            }
            break;
            
        case 'explore':
            const exploreButton = document.querySelector('.discord-explore-server-button');
            if (exploreButton) {
                exploreButton.classList.add('active');
                console.log('[Update Active Server] Activated explore button');
            } else {
                console.warn('[Update Active Server] Explore button not found');
            }
            break;
            
        default:
            console.log('[Update Active Server] No active state applied for pageType:', pageType);
    }
}

export async function handleHomeClick(event) {
    console.log('[Home Navigation] Home Click Flow Started');
    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (window.location.pathname === '/home' || window.location.pathname === '/home/' || window.location.pathname === '/') {
        console.log('[Home Navigation] Already on home page, skipping navigation');
        return;
    }

    const currentTime = Date.now();
    const timeSinceLastSwitch = currentTime - lastServerSwitchTime;
    
    if (timeSinceLastSwitch < SERVER_SWITCH_DELAY) {
        console.log('[Home Navigation] Home navigation blocked - too soon after last switch');
        return;
    }
    
    lastServerSwitchTime = currentTime;
    showHomeLoadingIndicator();

    try {
        if (window.voiceManager && window.voiceManager.isConnected) {
            console.log('[Home Navigation] Voice connection detected, keeping alive and showing global indicator');
            if (window.globalVoiceIndicator) {
                setTimeout(() => {
                    window.globalVoiceIndicator.ensureIndicatorVisible();
                }, 300);
            }
        }

        let success = false;
        
        if (window.navigationManager) {
            console.log('[Home Navigation] Trying navigation manager');
            success = await window.navigationManager.navigateToHome('friends');
        }
        
        if (!success && typeof window.loadHomePage === 'function') {
            console.log('[Home Navigation] Navigation manager failed, trying loadHomePage');
            await window.loadHomePage('friends');
            success = true;
        }
        
        if (!success) {
            console.error('[Home Navigation] All navigation methods failed');
            console.warn('[Home Navigation] Page reload fallbacks disabled - navigation failed');
            return;
        }

        console.log('[Home Navigation] SUCCESS - Home navigation completed');

    } catch (error) {
        console.error('[Home Navigation] ERROR in handleHomeClick:', error);
        if (typeof window.loadHomePage === 'function') {
            try {
                await window.loadHomePage('friends');
            } catch (fallbackError) {
                console.error('[Home Navigation] Fallback also failed:', fallbackError);
                console.warn('[Home Navigation] Page reload fallbacks disabled - navigation failed');
            }
        } else {
            console.warn('[Home Navigation] Page reload fallbacks disabled - navigation failed');
        }
    } finally {
        hideHomeLoadingIndicator();
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
    console.log('[Server Navigation] Server Click Flow Started');
    
    if (!serverId) {
        console.error('[Server Navigation] No server ID provided');
        return;
    }

    const currentTime = Date.now();
    const timeSinceLastSwitch = currentTime - lastServerSwitchTime;
    
    if (timeSinceLastSwitch < SERVER_SWITCH_DELAY) {
        console.log('[Server Navigation] Server switch blocked - too soon after last switch');
        return;
    }
    
    lastServerSwitchTime = currentTime;
    showServerLoadingIndicator(serverId);

    try {
        let defaultChannelId = null;
        
        console.log('[Server Navigation] Getting default channel for server:', serverId);
        defaultChannelId = await getDefaultChannelForServer(serverId);
        console.log('[Server Navigation] Default channel ID:', defaultChannelId);
        
        let success = false;
        
        if (window.navigationManager) {
            console.log('[Server Navigation] Trying navigation manager with channel:', defaultChannelId);
            success = await window.navigationManager.navigateToServer(serverId, defaultChannelId);
        }
        
        if (!success && typeof window.loadServerPage === 'function') {
            console.log('[Server Navigation] Navigation manager failed, trying loadServerPage with channel:', defaultChannelId);
            await window.loadServerPage(serverId, defaultChannelId);
            success = true;
        }
        
        if (!success) {
            console.log('[Server Navigation] All navigation methods failed, using direct AJAX fallback with channel:', defaultChannelId);
            await handleServerClickFallback(serverId, defaultChannelId);
            success = true;
        }
        
        if (success) {
            console.log('[Server Navigation] SUCCESS - Server navigation completed with channel:', defaultChannelId);
        }
        
    } catch (error) {
        console.error('[Server Navigation] ERROR in handleServerClick:', error);
        try {
            console.log('[Server Navigation] Attempting fallback navigation');
            await handleServerClickFallback(serverId);
        } catch (fallbackError) {
            console.error('[Server Navigation] Fallback also failed:', fallbackError);
            console.warn('[Server Navigation] Page reload fallbacks disabled - server navigation failed');
        }
    } finally {
        hideServerLoadingIndicator(serverId);
    }
}

async function handleServerClickFallback(serverId, channelId = null) {
    console.warn('[Server Navigation] handleServerClickFallback disabled - routes were removed');
    console.warn('[Server Navigation] Fallback AJAX navigation not available for server:', serverId);
    throw new Error('Server fallback navigation disabled');
}

export async function handleExploreClick(event) {
    console.log('[Explore Navigation] Explore Click Flow Started');
    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (window.location.pathname === '/explore-servers' || window.location.pathname === '/explore') {
        console.log('[Explore Navigation] Already on explore page, skipping navigation');
        return;
    }

    const currentTime = Date.now();
    const timeSinceLastSwitch = currentTime - lastServerSwitchTime;
    
    if (timeSinceLastSwitch < SERVER_SWITCH_DELAY) {
        console.log('[Explore Navigation] Explore navigation blocked - too soon after last switch');
        return;
    }
    
    lastServerSwitchTime = currentTime;
    showExploreLoadingIndicator();
    
    try {
        if (window.voiceManager && window.voiceManager.isConnected) {
            console.log('[Explore Navigation] Voice connection detected, keeping alive and showing global indicator');
            if (window.globalVoiceIndicator) {
                setTimeout(() => {
                    window.globalVoiceIndicator.ensureIndicatorVisible();
                }, 300);
            }
        }

        let success = false;
        
        if (window.navigationManager) {
            console.log('[Explore Navigation] Trying navigation manager');
            success = await window.navigationManager.navigateToExplore();
        }
        
        if (!success && typeof window.loadExplorePage === 'function') {
            console.log('[Explore Navigation] Navigation manager failed, trying loadExplorePage');
            await window.loadExplorePage();
            success = true;
        }
        
        if (!success) {
            console.error('[Explore Navigation] All navigation methods failed');
            console.warn('[Explore Navigation] Page reload fallbacks disabled - navigation failed');
            return;
        }

        console.log('[Explore Navigation] SUCCESS - Explore navigation completed');

    } catch (error) {
        console.error('[Explore Navigation] ERROR in handleExploreClick:', error);
        if (typeof window.loadExplorePage === 'function') {
            try {
                await window.loadExplorePage();
            } catch (fallbackError) {
                console.error('[Explore Navigation] Fallback also failed:', fallbackError);
                console.warn('[Explore Navigation] Page reload fallbacks disabled - navigation failed');
            }
        } else {
            console.warn('[Explore Navigation] Page reload fallbacks disabled - navigation failed');
        }
    } finally {
        hideExploreLoadingIndicator();
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
            console.log('[Server Sidebar] Showing server channel section with selector:', selector);
            element.style.display = 'flex';
            found = true;
        }
    });
    
    if (!found) {
        console.log('[Server Sidebar] No server channel section found to show');
    }
}

export function refreshServerGroups() {
    performCompleteRender();
}

// Make functions globally available
window.updateActiveServer = updateActiveServer;
window.loadServerPage = loadServerPage;

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