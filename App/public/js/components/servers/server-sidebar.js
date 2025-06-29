import { LocalStorageManager } from '../../utils/local-storage-manager.js';
import { ajax } from '../../utils/ajax.js';
import { playDiscordoSound, playCallSound } from '../../utils/music-loader-static.js';
import { loadHomePage } from '../../utils/load-home-page.js';
import { loadServerPage } from '../../utils/load-server-page.js';

let isRendering = false;
let serverDataCache = null;
let cacheExpiry = 0;
let isHandlingClick = false;

let homeIconClickCount = 0;
let lastClickTime = 0;
const CLICK_TIMEOUT = 3000;
const CLICKS_NEEDED = 16; 

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Server Sidebar] DOMContentLoaded: Initializing server sidebar');
    initServerSidebar();
    initializeHomeIconEasterEgg();
    
    document.addEventListener('click', async function(e) {
        console.log('[Server Sidebar] Click detected on:', e.target);
        
        const homeLink = e.target.closest('a[href="/home"]') || 
                        e.target.closest('a[href="/"]') ||
                        e.target.closest('.server-icon:first-child a');
        if (homeLink && !isHandlingClick) {
            console.log('[Server Sidebar] Home link clicked:', homeLink.getAttribute('href'));
            console.log('[Server Sidebar] Home link element:', homeLink);
            console.log('[Server Sidebar] Home link parent:', homeLink.parentElement);
            e.preventDefault();
            
            handleEasterEggLogic();
            
            isHandlingClick = true;
            try {
                await handleHomeClick(e);
            } catch (error) {
                console.error('Error handling home click:', error);
                window.location.href = homeLink.getAttribute('href') || '/home';
            } finally {
                isHandlingClick = false;
            }
            return;
        }

        const serverLink = e.target.closest('.server-icon a[href^="/server/"]');
        if (serverLink && !isHandlingClick) {
            console.log('[Server Sidebar] Server link clicked:', serverLink.getAttribute('href'));
            e.preventDefault(); 
            const serverId = serverLink.getAttribute('data-server-id');
            if (serverId) {
                isHandlingClick = true;
                console.log('[Server Sidebar] Handling server click for ID:', serverId);
                try {
                    await handleServerClick(serverId, e);
                } catch (error) {
                    console.error('Error handling server click:', error);
                    if (error.critical) {
                        window.location.href = serverLink.href;
                    }
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
        const response = await fetch('/api/user/servers', {
            method: 'GET',
            credentials: 'include',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        if (response.ok) {
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
        }
    } catch (error) {
        console.error('Failed to fetch server data:', error);
    }
    
    return serverDataCache || {};
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
        }
    } else if (currentPath === '/home' || currentPath === '/home/' || currentPath === '/') {
        const homeIcon = document.querySelector('.server-icon:first-child');
        if (homeIcon) {
            homeIcon.classList.add('active');
        }
    }
}

export async function handleHomeClick(event) {
    console.group('[Server Sidebar] Home Click Flow');
    console.log('Starting handleHomeClick');
    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.log('[Server Sidebar] Event prevented successfully');
    }
    
    if (window.location.pathname === '/home' || window.location.pathname === '/home/' || window.location.pathname === '/') {
        console.log('[Server Sidebar] Already on home page, skipping navigation');
        console.groupEnd();
        return;
    }
    
    try {
        const currentChannelId = new URLSearchParams(window.location.search).get('channel');
        if (currentChannelId && window.globalSocketManager) {
            console.log('Cleaning up socket for channel:', currentChannelId);
            window.globalSocketManager.leaveChannel(currentChannelId);
        }

        if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
            console.log('Cleaning up voice manager');
            window.voiceManager.leaveVoice();
            window.voiceManager = null;
        }

        console.log('Loading home page content via AJAX');
        if (window.loadHomePage && typeof window.loadHomePage === 'function') {
            await window.loadHomePage('friends');
        } else {
            console.error('[Server Sidebar] loadHomePage function not available');
            throw new Error('loadHomePage function not available');
        }

        updateActiveServer();

        console.log('Dispatching HomePageChanged event');
        window.dispatchEvent(new CustomEvent('HomePageChanged', { 
            detail: { 
                pageType: 'friends',
                previousChannelId: currentChannelId 
            } 
        }));

    } catch (error) {
        console.error('Error in handleHomeClick:', error);
        console.log('[Server Sidebar] CRITICAL: Using location.href as fallback (no reload)');
        window.location.href = '/home';
    } finally {
        console.groupEnd();
    }
}

export async function handleServerClick(serverId, event) {
    console.group('[Server Sidebar] Server Click Flow');
    console.log('Starting handleServerClick with:', { serverId, eventType: event?.type });
    
    if (!serverId) {
        console.error('No server ID provided');
        console.groupEnd();
        throw new Error('No server ID provided');
    }

    try {
        const currentPath = window.location.pathname;
        const isOnHomePage = currentPath === '/home' || currentPath === '/home/' || currentPath === '/';
        
        if (isOnHomePage) {
            console.log('Transitioning from home to server, loading full server page');
            
            if (window.loadServerPage && typeof window.loadServerPage === 'function') {
                await window.loadServerPage(serverId);
            } else {
                console.error('loadServerPage function not available, using fallback');
                window.location.href = `/server/${serverId}`;
                return;
            }
            
            updateActiveServer();
            window.dispatchEvent(new CustomEvent('ServerChanged', { detail: { serverId } }));
            return;
        }
        console.log('Fetching channels for server:', serverId);
        const channelResponse = await new Promise((resolve, reject) => {
            ajax({
                url: `/api/servers/${serverId}/channels`,
                method: 'GET',
                dataType: 'json',
                success: resolve,
                error: (xhr, status, error) => {
                    const err = new Error('Failed to fetch channels');
                    err.critical = xhr.status >= 500;
                    reject(err);
                }
            });
        });

        if (!channelResponse.success || !channelResponse.data) {
            console.error('Failed to fetch channels:', channelResponse);
            console.groupEnd();
            const err = new Error('Failed to fetch channels');
            err.critical = false;
            throw err;
        }

        console.group('Channel Data');
        console.log('Raw channel response:', channelResponse);
        console.log('Channel count:', channelResponse.data.channels.length);
        console.log('Categories:', channelResponse.data.categories);
        console.log('Channels:', channelResponse.data.channels.map(ch => ({
            id: ch.id,
            name: ch.name,
            type: ch.type,
            categoryId: ch.category_id
        })));
        console.groupEnd();

        const firstChannel = channelResponse.data.channels && channelResponse.data.channels.length > 0 
            ? channelResponse.data.channels[0] 
            : null;

        console.log('Selected first channel:', firstChannel ? {
            id: firstChannel.id,
            name: firstChannel.name,
            type: firstChannel.type,
            categoryId: firstChannel.category_id
        } : 'No channels available');

        const newUrl = firstChannel 
            ? `/server/${serverId}?channel=${firstChannel.id}` 
            : `/server/${serverId}`;
        console.log('Updating URL to:', newUrl);
        window.history.pushState({ serverId }, '', newUrl);

        const currentChannelId = new URLSearchParams(window.location.search).get('channel');
        if (currentChannelId && window.globalSocketManager) {
            console.log('Cleaning up socket for channel:', currentChannelId);
            window.globalSocketManager.leaveChannel(currentChannelId);
        }

        if (window.voiceManager) {
            console.log('Cleaning up voice manager');
            window.voiceManager.leaveVoice();
            window.voiceManager = null;
        }
        console.group('Channel Section Update');
        const channelSectionData = {
            channels: channelResponse.data.channels,
            categories: channelResponse.data.categories,
            activeChannelId: firstChannel ? firstChannel.id : null
        };
        console.log('Channel section data:', channelSectionData);

        const channelHtml = await new Promise((resolve, reject) => {
            console.log('Fetching channel section HTML');
            ajax({
                url: `/server/${serverId}/channel-section`,
                method: 'POST',
                dataType: 'text',
                data: channelSectionData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json'
                },
                success: (response) => {
                    console.log('Channel section HTML received, length:', response.length);
                    console.log('Preview of HTML:', response.substring(0, 200));
                    resolve(response);
                },
                error: (xhr, status, error) => {
                    console.error('Channel section error:', error);
                    const err = new Error('Failed to fetch channel section');
                    err.critical = xhr.status >= 500;
                    reject(err);
                }
            });
        });

        const channelWrapper = document.querySelector('.channel-wrapper');
        if (channelWrapper) {
            console.log('Found channel wrapper, updating HTML');
            channelWrapper.innerHTML = channelHtml;
        } else {
            console.error('Channel wrapper element not found! This suggests we need full server page load.');
            console.log('Available elements:', {
                'channel-section': !!document.querySelector('.channel-section'),
                'server-content': !!document.querySelector('.server-content'),
                'channel-wrapper': !!document.querySelector('.channel-wrapper')
            });
            
            console.log('Falling back to full server page load');
            if (window.loadServerPage && typeof window.loadServerPage === 'function') {
                await window.loadServerPage(serverId);
            } else {
                window.location.href = `/server/${serverId}`;
            }
            return;
        }
        console.groupEnd();

        if (firstChannel) {
            console.group('Section Update');
            const chatSection = document.querySelector('.chat-section');
            const voiceSection = document.querySelector('.voice-section');
            
            if (chatSection) chatSection.classList.add('hidden');
            if (voiceSection) voiceSection.classList.add('hidden');
            
            if (firstChannel.type === 'text') {
                console.log('Updating chat section for channel:', firstChannel.id);
                if (chatSection) {
                    chatSection.classList.remove('hidden');
                    try {
                        const response = await new Promise((resolve, reject) => {
                            ajax({
                                url: `/api/chat/channel/${firstChannel.id}`,
                                method: 'GET',
                                dataType: 'json',
                                headers: {
                                    'X-Requested-With': 'XMLHttpRequest'
                                },
                                success: resolve,
                                error: (xhr, status, error) => {
                                    const err = new Error('Failed to fetch chat data');
                                    err.critical = xhr.status >= 500;
                                    reject(err);
                                }
                            });
                        });
                        
                        const messagesContainer = chatSection.querySelector('.messages-container');
                        if (!messagesContainer) {
                            const err = new Error('Messages container not found');
                            err.critical = false;
                            throw err;
                        }
                        
                        messagesContainer.innerHTML = '';
                        
                        if (response.data?.data?.messages?.length > 0) {
                            const messages = response.data.data.messages;
                            const messageGroups = groupMessagesByUser(messages);
                            
                            messageGroups.forEach(group => {
                                const messageGroup = document.createElement('div');
                                messageGroup.className = 'message-group';
                                messageGroup.dataset.userId = group.userId;
                                
                                messageGroup.innerHTML = `
                                    <div class="message-avatar">
                                        <img src="${group.avatarUrl || '/public/assets/common/default-profile-picture.png'}" 
                                             alt="${group.username}'s avatar" 
                                             onerror="this.src='/public/assets/common/default-profile-picture.png'">
                                    </div>
                                    <div class="message-content-wrapper">
                                        <div class="message-header">
                                            <span class="message-username">${group.username}</span>
                                            <span class="message-timestamp">${formatTimestamp(group.messages[0].sent_at)}</span>
                                        </div>
                                        <div class="message-contents">
                                            ${group.messages.map(message => `
                                                <div class="message-content relative" data-message-id="${message.id}" data-user-id="${message.user_id}">
                                                    ${message.reply_message_id && message.reply_data ? `
                                                        <div class="reply-container">
                                                            <div class="reply-line"></div>
                                                            <div class="reply-content">
                                                                <span class="reply-username">${message.reply_data.username}</span>
                                                                <span class="reply-message-text">${message.reply_data.content ? 
                                                                    message.reply_data.content.substring(0, 60) + (message.reply_data.content.length > 60 ? '...' : '') : 
                                                                    '<span class="italic">Original message not found</span>'
                                                                }</span>
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                    <div class="message-main-text text-[#dcddde]">
                                                        ${formatMessageContent(message.content)}
                                                        ${message.edited_at ? '<span class="edited-badge text-xs text-[#a3a6aa] ml-1">(edited)</span>' : ''}
                                                    </div>
                                                    ${message.attachments?.length > 0 ? `
                                                        <div class="message-attachments">
                                                            ${message.attachments.map(attachment => `
                                                                <div class="message-attachment">
                                                                    <a href="${attachment}" target="_blank" class="attachment-link">
                                                                        <i class="fas fa-paperclip"></i> ${attachment.split('/').pop()}
                                                                    </a>
                                                                </div>
                                                            `).join('')}
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `;
                                
                                messagesContainer.appendChild(messageGroup);
                            });
                        } else {
                            messagesContainer.innerHTML = `
                                <div class="flex flex-col items-center justify-center h-full text-[#dcddde]">
                                    <i class="fas fa-comments text-6xl mb-4 text-[#4f545c]"></i>
                                    <p class="text-lg">No messages yet</p>
                                    <p class="text-sm text-[#a3a6aa]">Be the first to send a message!</p>
                                </div>
                            `;
                        }
                    } catch (error) {
                        console.error('Error updating chat section:', error);
                    }
                }
            } else if (firstChannel.type === 'voice') {
                console.log('Updating voice section for channel:', firstChannel.id);
                if (voiceSection) {
                    voiceSection.classList.remove('hidden');
                    try {
                        playCallSound();
                        
                        if (!window.voiceManager) {
                            window.voiceManager = new VoiceManager();
                        }
                        window.voiceManager.setupVoice(firstChannel.id);
                        const channelIdMeta = document.querySelector('meta[name="channel-id"]');
                        if (channelIdMeta) {
                            channelIdMeta.content = firstChannel.id;
                        } else {
                            const meta = document.createElement('meta');
                            meta.name = 'channel-id';
                            meta.content = firstChannel.id;
                            document.head.appendChild(meta);
                        }
                        
                        const meetingIdMeta = document.querySelector('meta[name="meeting-id"]');
                        if (meetingIdMeta) {
                            meetingIdMeta.content = `voice_channel_${firstChannel.id}`;
                        } else {
                            const meta = document.createElement('meta');
                            meta.name = 'meeting-id';
                            meta.content = `voice_channel_${firstChannel.id}`;
                            document.head.appendChild(meta);
                        }
                    } catch (error) {
                        console.error('Error updating voice section:', error);
                    }
                }
            }
            console.groupEnd();
        }

        console.log('Updating active server state');
    updateActiveServer();
        console.group('Channel Handlers');
        const channelItems = document.querySelectorAll('.channel-item');
        console.log('Found channel items:', {
            count: channelItems.length,
            items: Array.from(channelItems).map(item => ({
                id: item.dataset.channelId,
                type: item.dataset.channelType,
                name: item.textContent.trim()
            }))
        });

        if (firstChannel) {
            console.log('Looking for first channel element:', firstChannel.id);
            const channelElement = document.querySelector(`.channel-item[data-channel-id="${firstChannel.id}"]`);
            if (channelElement) {
                console.log('Found first channel element:', {
                    id: channelElement.dataset.channelId,
                    type: channelElement.dataset.channelType,
                    name: channelElement.textContent.trim()
                });
            } else {
                console.error('Channel element not found for ID:', firstChannel.id);
            }
        }
        console.groupEnd();
        console.log('Dispatching ServerChanged event');
        window.dispatchEvent(new CustomEvent('ServerChanged', { detail: { serverId } }));

    } catch (error) {
        console.error('Error in handleServerClick:', error);
        console.trace();
        throw error;
    } finally {
        console.groupEnd();
    }
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
        const now = new Date();
        
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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