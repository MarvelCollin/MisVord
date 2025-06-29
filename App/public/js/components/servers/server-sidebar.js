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
        console.log('[Click Handler] Click event detected');
        console.log('[Click Handler] Target element:', {
            tagName: e.target.tagName,
            className: e.target.className,
            id: e.target.id,
            href: e.target.href,
            dataset: e.target.dataset
        });
        console.log('[Click Handler] Currently handling click:', isHandlingClick);
        
        const homeLink = e.target.closest('a[href="/home"]') || 
                        e.target.closest('a[href="/"]') ||
                        e.target.closest('.server-icon:first-child a');
        if (homeLink && !isHandlingClick) {
            console.log('[Click Handler] HOME NAVIGATION DETECTED');
            console.log('[Click Handler] Home link found:', {
                href: homeLink.getAttribute('href'),
                element: homeLink.tagName,
                parentClass: homeLink.parentElement?.className
            });
            e.preventDefault();
            
            console.log('[Click Handler] Executing easter egg logic');
            handleEasterEggLogic();
            
            isHandlingClick = true;
            console.log('[Click Handler] Starting home navigation');
            try {
                await handleHomeClick(e);
                console.log('[Click Handler] Home navigation completed successfully');
            } catch (error) {
                console.error('[Click Handler] ERROR in home navigation:', error);
                console.error('[Click Handler] Fallback to location.href');
                window.location.href = homeLink.getAttribute('href') || '/home';
            } finally {
                isHandlingClick = false;
                console.log('[Click Handler] Home click handling finished');
            }
            return;
        }

        const exploreLink = e.target.closest('a[href="/explore-servers"]') ||
                           e.target.closest('a[href="/explore"]');
        if (exploreLink && !isHandlingClick) {
            console.log('[Click Handler] EXPLORE NAVIGATION DETECTED');
            console.log('[Click Handler] Explore link found:', {
                href: exploreLink.getAttribute('href'),
                element: exploreLink.tagName,
                parentClass: exploreLink.parentElement?.className
            });
            e.preventDefault();
            
            isHandlingClick = true;
            console.log('[Click Handler] Starting explore navigation');
            try {
                await handleExploreClick(e);
                console.log('[Click Handler] Explore navigation completed successfully');
            } catch (error) {
                console.error('[Click Handler] ERROR in explore navigation:', error);
                console.error('[Click Handler] Fallback to location.href');
                window.location.href = exploreLink.getAttribute('href') || '/explore-servers';
            } finally {
                isHandlingClick = false;
                console.log('[Click Handler] Explore click handling finished');
            }
            return;
        }

        const serverLink = e.target.closest('.server-icon a[href^="/server/"]');
        if (serverLink && !isHandlingClick) {
            console.log('[Click Handler] SERVER NAVIGATION DETECTED');
            console.log('[Click Handler] Server link found:', {
                href: serverLink.getAttribute('href'),
                serverId: serverLink.getAttribute('data-server-id'),
                element: serverLink.tagName,
                parentClass: serverLink.parentElement?.className
            });
            e.preventDefault(); 
            
            const serverId = serverLink.getAttribute('data-server-id');
            if (serverId) {
                isHandlingClick = true;
                console.log('[Click Handler] Starting server navigation for ID:', serverId);
                try {
                    await handleServerClick(serverId, e);
                    console.log('[Click Handler] Server navigation completed successfully');
                } catch (error) {
                    console.error('[Click Handler] ERROR in server navigation:', error);
                    console.error('[Click Handler] Server ID was:', serverId);
                    console.error('[Click Handler] Error details:', {
                        message: error.message,
                        critical: error.critical,
                        stack: error.stack
                    });
                    if (error.critical) {
                        console.error('[Click Handler] Critical error - would fallback to page reload');
                    }
                } finally {
                    isHandlingClick = false;
                    console.log('[Click Handler] Server click handling finished');
                }
            } else {
                console.error('[Click Handler] Server link found but no server ID available');
                console.error('[Click Handler] Server link attributes:', {
                    href: serverLink.href,
                    dataset: serverLink.dataset,
                    attributes: Array.from(serverLink.attributes).map(attr => ({ name: attr.name, value: attr.value }))
                });
            }
        } else if (serverLink) {
            console.log('[Click Handler] Server link found but already handling click - skipping');
        } else {
            console.log('[Click Handler] No navigation target found - regular click');
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
    console.group('[Home Navigation] Home Click Flow Started');
    console.log('[Home Navigation] Event details:', {
        type: event ? event.type : 'no-event',
        target: event ? event.target.tagName : 'no-target',
        currentPath: window.location.pathname
    });
    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.log('[Home Navigation] Event prevented successfully');
    }
    
    if (window.location.pathname === '/home' || window.location.pathname === '/home/' || window.location.pathname === '/') {
        console.log('[Home Navigation] Already on home page, skipping navigation');
        console.groupEnd();
        return;
    }
    
    console.log('[Home Navigation] Pre-navigation state check');
    console.log('[Home Navigation] - Current URL:', window.location.href);
    console.log('[Home Navigation] - Available functions:', {
        loadHomePage: typeof window.loadHomePage,
        globalSocketManager: typeof window.globalSocketManager,
        voiceManager: typeof window.voiceManager
    });
    
    try {
        const currentChannelId = new URLSearchParams(window.location.search).get('channel');
        if (currentChannelId && window.globalSocketManager) {
            console.log('[Home Navigation] Cleaning up socket for channel:', currentChannelId);
            window.globalSocketManager.leaveChannel(currentChannelId);
        }

        if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
            console.log('[Home Navigation] Cleaning up voice manager');
            window.voiceManager.leaveVoice();
            window.voiceManager = null;
        }

        console.log('[Home Navigation] Starting AJAX home page load');
        if (window.loadHomePage && typeof window.loadHomePage === 'function') {
            await window.loadHomePage('friends');
            console.log('[Home Navigation] AJAX home page load completed successfully');
        } else {
            console.error('[Home Navigation] CRITICAL - loadHomePage function not available');
            console.error('[Home Navigation] Available window functions:', Object.keys(window).filter(k => k.includes('load')));
            throw new Error('loadHomePage function not available');
        }

        console.log('[Home Navigation] Updating active server state');
        updateActiveServer();

        console.log('[Home Navigation] Dispatching HomePageChanged event');
        window.dispatchEvent(new CustomEvent('HomePageChanged', { 
            detail: { 
                pageType: 'friends',
                previousChannelId: currentChannelId 
            } 
        }));

        console.log('[Home Navigation] SUCCESS - Home navigation completed');

    } catch (error) {
        console.error('[Home Navigation] ERROR in handleHomeClick:', error);
        console.error('[Home Navigation] Error stack:', error.stack);
        console.log('[Home Navigation] FALLBACK - Using location.href (no reload)');
        window.location.href = '/home';
    } finally {
        console.groupEnd();
    }
}

export async function handleServerClick(serverId, event) {
    console.group('[Server Navigation] Server Click Flow Started');
    console.log('[Server Navigation] Input params:', {
        serverId: serverId,
        eventType: event?.type,
        eventTarget: event?.target?.tagName,
        currentPath: window.location.pathname
    });
    
    if (!serverId) {
        console.error('[Server Navigation] CRITICAL - No server ID provided');
        console.groupEnd();
        throw new Error('No server ID provided');
    }

    console.log('[Server Navigation] Pre-navigation state check');
    console.log('[Server Navigation] - Current URL:', window.location.href);
    console.log('[Server Navigation] - Target server ID:', serverId);
    console.log('[Server Navigation] - Available functions:', {
        loadServerPage: typeof window.loadServerPage,
        globalSocketManager: typeof window.globalSocketManager,
        voiceManager: typeof window.voiceManager
    });

    try {
        console.log('[Server Navigation] Using simplified server navigation approach');
        
        const currentChannelId = new URLSearchParams(window.location.search).get('channel');
        if (currentChannelId && window.globalSocketManager) {
            console.log('[Server Navigation] Cleaning up socket for channel:', currentChannelId);
            window.globalSocketManager.leaveChannel(currentChannelId);
                        } else {
            console.log('[Server Navigation] No active channel to clean up');
        }

        if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
            console.log('[Server Navigation] Cleaning up voice manager');
            window.voiceManager.leaveVoice();
            window.voiceManager = null;
                        } else {
            console.log('[Server Navigation] No voice manager to clean up');
        }
        
        console.log('[Server Navigation] Starting AJAX server page load');
        if (window.loadServerPage && typeof window.loadServerPage === 'function') {
            console.log('[Server Navigation] Calling loadServerPage with serverId:', serverId);
            await window.loadServerPage(serverId);
            console.log('[Server Navigation] AJAX server page load completed successfully');
                        } else {
            console.error('[Server Navigation] CRITICAL - loadServerPage function not available');
            console.error('[Server Navigation] Available window functions:', Object.keys(window).filter(k => k.includes('load')));
            console.error('[Server Navigation] Window.loadServerPage type:', typeof window.loadServerPage);
            throw new Error('loadServerPage function not available');
        }
        
        console.log('[Server Navigation] Updating active server state');
    updateActiveServer();

        console.log('[Server Navigation] Dispatching ServerChanged event');
        window.dispatchEvent(new CustomEvent('ServerChanged', { detail: { serverId } }));

        console.log('[Server Navigation] SUCCESS - Server navigation completed');

    } catch (error) {
        console.error('[Server Navigation] ERROR in handleServerClick:', error);
        console.error('[Server Navigation] Error stack:', error.stack);
        console.error('[Server Navigation] Server ID was:', serverId);
        console.error('[Server Navigation] Event was:', event);
        console.log('[Server Navigation] ERROR: Cannot load server, no fallback allowed per user request');
    } finally {
        console.groupEnd();
    }
}

export async function handleExploreClick(event) {
    console.group('[Explore Navigation] Explore Click Flow Started');
    console.log('[Explore Navigation] Event details:', {
        type: event ? event.type : 'no-event',
        target: event ? event.target.tagName : 'no-target',
        currentPath: window.location.pathname
    });
    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.log('[Explore Navigation] Event prevented successfully');
    }
    
    if (window.location.pathname === '/explore-servers' || window.location.pathname === '/explore') {
        console.log('[Explore Navigation] Already on explore page, skipping navigation');
        console.groupEnd();
        return;
    }
    
    console.log('[Explore Navigation] Pre-navigation state check');
    console.log('[Explore Navigation] - Current URL:', window.location.href);
    console.log('[Explore Navigation] - Available functions:', {
        loadExplorePage: typeof window.loadExplorePage,
        globalSocketManager: typeof window.globalSocketManager,
        voiceManager: typeof window.voiceManager
    });
    
    try {
        const currentChannelId = new URLSearchParams(window.location.search).get('channel');
        if (currentChannelId && window.globalSocketManager) {
            console.log('[Explore Navigation] Cleaning up socket for channel:', currentChannelId);
            window.globalSocketManager.leaveChannel(currentChannelId);
        }

        if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
            console.log('[Explore Navigation] Cleaning up voice manager');
            window.voiceManager.leaveVoice();
            window.voiceManager = null;
        }

        console.log('[Explore Navigation] Starting AJAX explore page load');
        if (window.loadExplorePage && typeof window.loadExplorePage === 'function') {
            await window.loadExplorePage();
            console.log('[Explore Navigation] AJAX explore page load completed successfully');
        } else {
            console.error('[Explore Navigation] CRITICAL - loadExplorePage function not available');
            console.error('[Explore Navigation] Available window functions:', Object.keys(window).filter(k => k.includes('load')));
            throw new Error('loadExplorePage function not available');
        }

        console.log('[Explore Navigation] Updating active server state');
        updateActiveServer();

        console.log('[Explore Navigation] Dispatching ExplorePageChanged event');
        window.dispatchEvent(new CustomEvent('ExplorePageChanged', { 
            detail: { 
                pageType: 'explore',
                previousChannelId: currentChannelId 
            } 
        }));

        console.log('[Explore Navigation] SUCCESS - Explore navigation completed');

    } catch (error) {
        console.error('[Explore Navigation] ERROR in handleExploreClick:', error);
        console.error('[Explore Navigation] Error stack:', error.stack);
        console.log('[Explore Navigation] FALLBACK - Using location.href');
        window.location.href = '/explore-servers';
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