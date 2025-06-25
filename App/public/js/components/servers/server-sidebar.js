import { LocalStorageManager } from '../../utils/local-storage-manager.js';

let isRendering = false;
let serverDataCache = null;
let cacheExpiry = 0;

document.addEventListener('DOMContentLoaded', function() {
    initServerSidebar();
});

function initServerSidebar() {
    setupServerIcons();
    renderFolders();
}

function setupServerIcons() {
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
                    renderFolders();
                    return;
                }
                
                const groupId = LocalStorageManager.addServerGroup('Folder');
                LocalStorageManager.addServerToGroup(groupId, draggedId);
                LocalStorageManager.addServerToGroup(groupId, targetId);
                LocalStorageManager.setGroupCollapsed(groupId, false);
                renderFolders();
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
    
    const groups = LocalStorageManager.getServerGroups();
    
    document.querySelectorAll('.server-group').forEach(el => el.remove());
    
    const serverElements = new Map();
    const serverImageData = new Map();
    
    document.querySelectorAll('.server-icon[data-server-id]').forEach(icon => {
        icon.removeAttribute('data-setup');
        const serverId = icon.getAttribute('data-server-id');
        serverElements.set(serverId, icon.cloneNode(true));
        
        const existingImg = icon.querySelector('.server-button img');
        const existingText = icon.querySelector('.server-button span');
        
        if (existingImg) {
            serverImageData.set(serverId, {
                type: 'image',
                src: existingImg.src,
                alt: existingImg.alt || 'Server'
            });
        } else if (existingText) {
            serverImageData.set(serverId, {
                type: 'text',
                text: existingText.textContent.charAt(0).toUpperCase()
            });
        } else {
            serverImageData.set(serverId, {
                type: 'text',
                text: serverId.toString().charAt(0).toUpperCase()
            });
        }
    });
    
    const serverData = await getServerData();
    Object.keys(serverData).forEach(serverId => {
        if (serverData[serverId].image_url) {
            serverImageData.set(serverId, {
                type: 'image',
                src: serverData[serverId].image_url,
                alt: serverData[serverId].name || 'Server'
            });
        }
    });
    
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
        renderFolders();
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
            });
            
            element.addEventListener('dragleave', e => {
                const rect = folder.getBoundingClientRect();
                if (e.clientX < rect.left || e.clientX > rect.right || 
                    e.clientY < rect.top || e.clientY > rect.bottom) {
                    folder.classList.remove('drag-over');
                }
            });
            
            element.addEventListener('drop', e => {
                e.preventDefault();
                e.stopPropagation();
                folder.classList.remove('drag-over');
                
                const serverId = e.dataTransfer.getData('text/plain');
                const groupId = folder.getAttribute('data-group-id');
                
                if (serverId && groupId) {
                    const currentGroup = LocalStorageManager.getServerGroup(serverId);
                    if (currentGroup && currentGroup.id === groupId) {
                        return;
                    }
                    
                    LocalStorageManager.addServerToGroup(groupId, serverId);
                    renderFolders();
                }
            });
        });
        
        folder.querySelectorAll('.server-icon').forEach(serverIcon => {
            serverIcon.addEventListener('dragover', e => {
                e.preventDefault();
                e.stopPropagation();
                folder.classList.add('drag-over');
            });
            
            serverIcon.addEventListener('drop', e => {
                e.preventDefault();
                e.stopPropagation();
                folder.classList.remove('drag-over');
                
                const serverId = e.dataTransfer.getData('text/plain');
                const groupId = folder.getAttribute('data-group-id');
                
                if (serverId && groupId) {
                    const currentGroup = LocalStorageManager.getServerGroup(serverId);
                    if (currentGroup && currentGroup.id === groupId) {
                        return;
                    }
                    
                    LocalStorageManager.addServerToGroup(groupId, serverId);
                    renderFolders();
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
                renderFolders();
            }
        });
    }
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
            renderFolders();
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
            renderFolders();
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
    const now = Date.now();
    if (serverDataCache && now < cacheExpiry) {
        return serverDataCache;
    }
    
    try {
        const response = await fetch('/api/user/servers', {
            method: 'GET',
            credentials: 'include',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.servers) {
                const serverMap = {};
                data.data.servers.forEach(server => {
                    serverMap[server.id] = server;
                });
                serverDataCache = serverMap;
                cacheExpiry = now + 300000;
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

export function handleServerClick(serverId) {
    document.body.classList.add('content-loading');
    window.location.href = `/server/${serverId}`;
}

export const ServerSidebar = {
    updateActiveServer,
    handleServerClick,
    renderFolders
};