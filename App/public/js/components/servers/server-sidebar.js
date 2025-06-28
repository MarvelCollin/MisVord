import { LocalStorageManager } from '../../utils/local-storage-manager.js';
import { ajax } from '../../utils/ajax.js';

let isRendering = false;
let serverDataCache = null;
let cacheExpiry = 0;
let isHandlingClick = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Server Sidebar] DOMContentLoaded: Initializing server sidebar');
    initServerSidebar();
    
    // Single global click handler for server links
    document.addEventListener('click', function(e) {
        // Check if the clicked element or its parent is a server link
        const serverLink = e.target.closest('.server-icon a[href^="/server/"]');
        if (serverLink && !isHandlingClick) {
            console.log('[Server Sidebar] Server link clicked:', serverLink.getAttribute('href'));
            const serverId = serverLink.getAttribute('data-server-id');
            if (serverId) {
                e.preventDefault();
                isHandlingClick = true;
                console.log('[Server Sidebar] Handling server click for ID:', serverId);
                handleServerClick(serverId, e).finally(() => {
                    isHandlingClick = false;
                });
            }
        }
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', function(event) {
        console.log('[Server Sidebar] Popstate event triggered:', event.state);
        const serverId = event.state?.serverId;
        if (serverId) {
            handleServerClick(serverId);
        }
    });
});

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
    // Only setup drag and drop functionality
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
    }
}

export async function handleServerClick(serverId, event) {
    console.log('[Server Sidebar] handleServerClick called with serverId:', serverId);
    if (!serverId) {
        console.log('[Server Sidebar] No server ID provided, returning');
        return;
    }
    
    // Prevent default link behavior if event is provided
    if (event) {
        console.log('[Server Sidebar] Preventing default click behavior');
        event.preventDefault();
    }

    try {
        // First, fetch the server's channels
        console.log('[Server Sidebar] Fetching channels for server:', serverId);
        const channelResponse = await new Promise((resolve, reject) => {
            ajax({
                url: `/api/servers/${serverId}/channels`,
                method: 'GET',
                dataType: 'json',
                success: resolve,
                error: reject
            });
        });

        if (!channelResponse.success || !channelResponse.data) {
            console.error('[Server Sidebar] Failed to fetch channels:', channelResponse);
            return;
        }

        console.log('[Server Sidebar] Received channel data:', {
            channelCount: channelResponse.data.channels.length,
            channels: channelResponse.data.channels.map(ch => ({id: ch.id, name: ch.name, type: ch.type})),
            categoryCount: channelResponse.data.categories.length,
            uncategorizedCount: channelResponse.data.uncategorized.length
        });

        // Get the first channel if available
        const firstChannel = channelResponse.data.channels && channelResponse.data.channels.length > 0 
            ? channelResponse.data.channels[0] 
            : null;

        console.log('[Server Sidebar] First channel:', firstChannel ? {
            id: firstChannel.id,
            name: firstChannel.name,
            type: firstChannel.type
        } : 'No channels available');

        // Update URL without reloading, preserving or setting channel parameter
        const newUrl = firstChannel 
            ? `/server/${serverId}?channel=${firstChannel.id}` 
            : `/server/${serverId}`;
        console.log('[Server Sidebar] Updating URL to:', newUrl);
        window.history.pushState({ serverId }, '', newUrl);
        
        console.log('[Server Sidebar] Making Ajax request for server content');
        const serverResponse = await new Promise((resolve, reject) => {
            ajax({
                url: `/server/${serverId}?render_html=1`,
                method: 'GET',
                dataType: 'text',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                success: resolve,
                error: reject
            });
        });

        console.log('[Server Sidebar] Server content received via Ajax');
        const mainContent = document.querySelector('.flex-1') || 
                          document.querySelector('[class*="server-content"]') || 
                          document.querySelector('main');
        
        if (!mainContent) {
            console.error('[Server Sidebar] No main content element found to update');
            return;
        }

        // Clean up current channel socket if any
        const currentChannelId = new URLSearchParams(window.location.search).get('channel');
        if (currentChannelId && window.globalSocketManager) {
            console.log('[Server Sidebar] Leaving channel:', currentChannelId);
            window.globalSocketManager.leaveChannel(currentChannelId);
        }

        // Clean up voice manager if any
        if (window.voiceManager) {
            console.log('[Server Sidebar] Cleaning up voice manager');
            window.voiceManager.leaveVoice();
            window.voiceManager = null;
        }

        // Now fetch the channel section HTML with the channel data
        console.log('[Server Sidebar] Fetching channel section HTML with data:', {
            channelCount: channelResponse.data.channels.length,
            firstChannelId: firstChannel?.id,
            categories: channelResponse.data.categories
        });

        const channelSectionData = {
            channels: channelResponse.data.channels,
            categories: channelResponse.data.categories,
            activeChannelId: firstChannel ? firstChannel.id : null
        };

        console.log('[Server Sidebar] Sending channel section data:', JSON.stringify(channelSectionData));

        const channelHtml = await new Promise((resolve, reject) => {
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
                    console.log('[Server Sidebar] Channel section response length:', response.length);
                    console.log('[Server Sidebar] Channel section response preview:', response.substring(0, 200));
                    resolve(response);
                },
                error: (err) => {
                    console.error('[Server Sidebar] Channel section error:', err);
                    reject(err);
                }
            });
        });

        // Update the channel section
        const channelWrapper = document.querySelector('.channel-wrapper');
        if (channelWrapper) {
            console.log('[Server Sidebar] Updating channel wrapper HTML');
            console.log('[Server Sidebar] Channel wrapper before update:', {
                childCount: channelWrapper.children.length,
                html: channelWrapper.innerHTML.substring(0, 200)
            });
            channelWrapper.innerHTML = channelHtml;
            console.log('[Server Sidebar] Channel wrapper after update:', {
                childCount: channelWrapper.children.length,
                html: channelWrapper.innerHTML.substring(0, 200)
            });
        } else {
            console.error('[Server Sidebar] Channel wrapper element not found');
        }

        // Update page content
        if (window.pageUtils) {
            console.log('[Server Sidebar] Using pageUtils to update content');
            window.pageUtils.updatePageContent(mainContent, serverResponse);
        } else {
            console.log('[Server Sidebar] Using manual DOM parsing to update content');
            const parser = new DOMParser();
            const doc = parser.parseFromString(serverResponse, 'text/html');
            
            // Find the server content section
            const serverContent = doc.querySelector('.server-content') || 
                                doc.querySelector('.flex-1') || 
                                doc.querySelector('main');
            
            if (serverContent) {
                // Update the main content
                mainContent.innerHTML = serverContent.innerHTML;
                
                // Update the server sidebar if it exists in the response
                const newSidebar = doc.querySelector('.server-sidebar');
                const currentSidebar = document.querySelector('.server-sidebar');
                if (newSidebar && currentSidebar) {
                    currentSidebar.innerHTML = newSidebar.innerHTML;
                }
                
                // Execute any inline scripts
                const scripts = doc.querySelectorAll('script:not([src])');
                scripts.forEach(script => {
                    if (script.textContent.trim()) {
                        try {
                            eval(script.textContent);
                        } catch (error) {
                            console.error('[Server Sidebar] Script execution error:', error);
                        }
                    }
                });
            }
        }

        // Update active server in sidebar
        console.log('[Server Sidebar] Updating active server');
        updateActiveServer();

        // Initialize server page components
        if (typeof window.initServerPage === 'function') {
            console.log('[Server Sidebar] Initializing server page');
            window.initServerPage();
        }
        
        // Initialize channel handlers
        if (typeof window.initializeChannelClickHandlers === 'function') {
            console.log('[Server Sidebar] Initializing channel click handlers');
            const channelItems = document.querySelectorAll('.channel-item');
            console.log('[Server Sidebar] Found channel items:', {
                count: channelItems.length,
                items: Array.from(channelItems).map(item => ({
                    id: item.getAttribute('data-channel-id'),
                    type: item.getAttribute('data-channel-type')
                }))
            });
            window.initializeChannelClickHandlers();
        }

        // Re-initialize server sidebar if needed
        if (typeof window.initServerSidebar === 'function') {
            console.log('[Server Sidebar] Re-initializing server sidebar');
            window.initServerSidebar();
        }

        // Dispatch server change event
        console.log('[Server Sidebar] Dispatching ServerChanged event');
        const event = new CustomEvent('ServerChanged', { 
            detail: { 
                serverId,
                previousChannelId: currentChannelId 
            } 
        });
        document.dispatchEvent(event);

        // Wait a bit for the DOM to update
        await new Promise(resolve => setTimeout(resolve, 100));

        // Switch to first channel if available
        if (firstChannel && window.channelSwitchManager) {
            console.log('[Server Sidebar] Switching to first channel:', firstChannel.id);
            const channelElement = document.querySelector(`[data-channel-id="${firstChannel.id}"]`);
            if (channelElement) {
                console.log('[Server Sidebar] Found channel element:', {
                    id: channelElement.getAttribute('data-channel-id'),
                    type: channelElement.getAttribute('data-channel-type')
                });
                window.channelSwitchManager.switchToChannel(serverId, firstChannel.id, channelElement);
            } else {
                console.warn('[Server Sidebar] Channel element not found for ID:', firstChannel.id);
                console.log('[Server Sidebar] Available channel elements:', 
                    Array.from(document.querySelectorAll('[data-channel-id]')).map(el => ({
                        id: el.getAttribute('data-channel-id'),
                        type: el.getAttribute('data-channel-type')
                    }))
                );
            }
        }
    } catch (error) {
        console.error('[Server Sidebar] Error in handleServerClick:', error);
        window.location.href = `/server/${serverId}`;
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