import { LocalStorageManager } from '../../utils/local-storage-manager.js';

const DEBUG_DRAG = true;

function debugLog(...args) {
    if (DEBUG_DRAG) {
        console.log(...args);
    }
}

let draggedElement = null;
let draggedServerId = null;
let dropIndicator = null;
let initialized = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('[DRAG DEBUG] DOM Content Loaded - initializing drag system');
    if (initialized) {
        console.log('[DRAG DEBUG] Already initialized, skipping');
        return;
    }
    initialized = true;
    
    if (!window.LocalStorageManager) {
        window.LocalStorageManager = LocalStorageManager;
        console.log('[DRAG DEBUG] LocalStorageManager attached to window');
    }
    
    initializeDragAndDrop();
    createDropIndicator();
    makeServersDraggable();
    console.log('[DRAG DEBUG] Drag system initialization complete');
});

function createDropIndicator() {
    if (dropIndicator) {
        console.log('[DRAG DEBUG] Drop indicator already exists');
        return;
    }
    
    dropIndicator = document.createElement('div');
    dropIndicator.className = 'drop-indicator';
    dropIndicator.style.cssText = `
        width: 100%;
        height: 4px;
        background: linear-gradient(90deg, var(--discord-primary), rgba(88, 101, 242, 0.8), var(--discord-primary));
        border-radius: 2px;
        margin: -6px 0;
        transition: all 0.2s ease;
        box-shadow: 0 0 8px rgba(88, 101, 242, 0.6);
        animation: pulse-glow 1s infinite ease-in-out;
    `;
    console.log('[DRAG DEBUG] Drop indicator created');
}

function initializeDragAndDrop() {
    const serverList = document.getElementById('server-list');
    console.log('[DRAG DEBUG] Initializing drag and drop - server list found:', !!serverList);
    if (!serverList) {
        console.error('[DRAG DEBUG] Server list element not found!');
        return;
    }
    
    console.log('[DRAG DEBUG] Adding event listeners to server list');
    serverList.addEventListener('dragstart', handleDragStart);
    serverList.addEventListener('dragend', handleDragEnd);
    serverList.addEventListener('dragover', handleDragOver);
    serverList.addEventListener('drop', handleDrop);
    
    const observer = new MutationObserver(() => {
        console.log('[DRAG DEBUG] DOM mutation detected, re-initializing draggable servers');
        makeServersDraggable();
    });
    observer.observe(serverList, { childList: true, subtree: true });
    console.log('[DRAG DEBUG] Mutation observer attached');
}

function makeServersDraggable() {
    const servers = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
    console.log('[DRAG DEBUG] Making servers draggable - found servers:', servers.length);
    
    servers.forEach((server, index) => {
        const serverId = server.getAttribute('data-server-id');
        console.log(`[DRAG DEBUG] Setting up server ${index + 1}/${servers.length} - ID: ${serverId}`);
        
        server.setAttribute('draggable', 'true');
        server.style.cursor = 'grab';
        
        const link = server.querySelector('a');
        if (link) {
            console.log(`[DRAG DEBUG] Found link in server ${serverId}, setting up click prevention`);
            let isDragging = false;
            
            server.addEventListener('dragstart', function(e) {
                isDragging = true;
                console.log(`[DRAG DEBUG] Server ${serverId} drag started (individual listener)`);
            });
            
            server.addEventListener('dragend', function(e) {
                console.log(`[DRAG DEBUG] Server ${serverId} drag ended (individual listener)`);
                setTimeout(() => { 
                    isDragging = false; 
                    console.log(`[DRAG DEBUG] Server ${serverId} isDragging reset to false`);
                }, 100);
            });
            
            link.addEventListener('click', function(e) {
                if (isDragging) {
                    console.log(`[DRAG DEBUG] Preventing navigation for server ${serverId} - was dragging`);
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                } else {
                    console.log(`[DRAG DEBUG] Allowing navigation for server ${serverId} - not dragging`);
                }
            });
        } else {
            console.log(`[DRAG DEBUG] No link found in server ${serverId}`);
        }
    });
    
    const groups = document.querySelectorAll('.server-sidebar-group');
    console.log('[DRAG DEBUG] Making groups draggable - found groups:', groups.length);
    groups.forEach((group, index) => {
        const groupId = group.getAttribute('data-group-id');
        console.log(`[DRAG DEBUG] Setting up group ${index + 1}/${groups.length} - ID: ${groupId}`);
        group.setAttribute('draggable', 'true');
    });
    
    console.log('[DRAG DEBUG] makeServersDraggable complete');
}

window.makeServersDraggable = makeServersDraggable;

function handleDragStart(e) {
    console.log('[DRAG DEBUG] handleDragStart triggered');
    console.log('[DRAG DEBUG] Event target:', e.target);
    console.log('[DRAG DEBUG] Event target tagName:', e.target.tagName);
    console.log('[DRAG DEBUG] Event target classes:', e.target.className);
    
    const serverIcon = e.target.closest('.server-sidebar-icon[data-server-id]');
    console.log('[DRAG DEBUG] Found server icon:', serverIcon);
    
    if (!serverIcon) {
        console.log('[DRAG DEBUG] No server icon found - drag not started');
        return;
    }
    
    if (e.target.tagName === 'A') {
        console.log('[DRAG DEBUG] Target is a link - preventing drag');
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    
    draggedElement = serverIcon;
    draggedServerId = serverIcon.getAttribute('data-server-id');
    console.log('[DRAG DEBUG] Drag started for server ID:', draggedServerId);
    console.log('[DRAG DEBUG] Dragged element:', draggedElement);
    
    serverIcon.classList.add('dragging');
    console.log('[DRAG DEBUG] Added dragging class to server icon');
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedServerId);
    console.log('[DRAG DEBUG] DataTransfer configured with server ID:', draggedServerId);
    
    return true;
}

function handleDragEnd(e) {
    console.log('[DRAG DEBUG] handleDragEnd triggered');
    console.log('[DRAG DEBUG] Dragged element:', draggedElement);
    console.log('[DRAG DEBUG] Dragged server ID:', draggedServerId);
    
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        console.log('[DRAG DEBUG] Removed dragging class from element');
        draggedElement = null;
        draggedServerId = null;
        console.log('[DRAG DEBUG] Reset drag variables');
        
        if (dropIndicator && dropIndicator.parentNode) {
            dropIndicator.parentNode.removeChild(dropIndicator);
            console.log('[DRAG DEBUG] Removed drop indicator');
        }
        
        document.querySelectorAll('.drag-over, .drop-target, .drop-target-folder').forEach(el => {
            el.classList.remove('drag-over', 'drop-target', 'drop-target-folder');
        });
        console.log('[DRAG DEBUG] Cleaned up drag classes');
    } else {
        console.log('[DRAG DEBUG] No dragged element found during drag end');
    }
}

function handleDragOver(e) {
    if (!draggedElement) {
        console.log('[DRAG DEBUG] handleDragOver - no dragged element');
        return;
    }
    
    console.log('[DRAG DEBUG] handleDragOver - dragging:', draggedServerId);
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const serverList = document.getElementById('server-list');
    if (!serverList) {
        console.log('[DRAG DEBUG] handleDragOver - no server list found');
        return;
    }
    
    document.querySelectorAll('.drag-over, .drop-target, .drop-target-folder').forEach(el => {
        el.classList.remove('drag-over', 'drop-target', 'drop-target-folder');
    });
    
    const targetGroup = e.target.closest('.server-sidebar-group');
    const targetServer = e.target.closest('.server-sidebar-icon[data-server-id]');
    
    if (targetGroup && targetGroup !== draggedElement) {
        console.log('[DRAG DEBUG] Drag over group:', targetGroup.getAttribute('data-group-id'));
        targetGroup.classList.add('drag-over');
        if (dropIndicator && dropIndicator.parentNode) {
            dropIndicator.remove();
        }
    } else if (targetServer && targetServer !== draggedElement && !targetServer.closest('.server-sidebar-group')) {
        console.log('[DRAG DEBUG] Drag over server:', targetServer.getAttribute('data-server-id'));
        targetServer.classList.add('drop-target');
        if (dropIndicator && dropIndicator.parentNode) {
            dropIndicator.remove();
        }
    } else {
        console.log('[DRAG DEBUG] Drag over empty space - showing drop indicator');
        const afterElement = getDragAfterElement(serverList, e.clientY);
        if (afterElement === null) {
            serverList.appendChild(dropIndicator);
        } else {
            serverList.insertBefore(dropIndicator, afterElement);
        }
    }
}

function handleDrop(e) {
    console.log('[DRAG DEBUG] handleDrop triggered');
    e.preventDefault();
    
    if (!draggedElement || !draggedServerId) {
        console.log('[DRAG DEBUG] No dragged element or server ID - aborting drop');
        return;
    }
    
    console.log('[DRAG DEBUG] Drop processing for server:', draggedServerId);
    
    const targetGroup = e.target.closest('.server-sidebar-group');
    const targetServer = e.target.closest('.server-sidebar-icon[data-server-id]');
    const serverList = document.getElementById('server-list');
    const originalGroup = draggedElement.closest('.server-sidebar-group');
    
    console.log('[DRAG DEBUG] Drop targets - Group:', targetGroup, 'Server:', targetServer);
    console.log('[DRAG DEBUG] Original group:', originalGroup);
    
    if (targetGroup && targetGroup !== draggedElement) {
        const groupId = targetGroup.getAttribute('data-group-id');
        console.log('[DRAG DEBUG] Dropping into group:', groupId);
        addServerToGroup(draggedServerId, groupId);
    } else if (targetServer && targetServer !== draggedElement && !targetServer.closest('.server-sidebar-group')) {
        const targetServerId = targetServer.getAttribute('data-server-id');
        console.log('[DRAG DEBUG] Creating/adding to group with server:', targetServerId);
        createOrAddToGroup(draggedServerId, targetServerId);
    } else if (serverList) {
        console.log('[DRAG DEBUG] Dropping in empty space - reordering');
        removeServerFromGroup(draggedServerId);
        const afterElement = getDragAfterElement(serverList, e.clientY);
        if (afterElement === null) {
            serverList.appendChild(draggedElement);
            console.log('[DRAG DEBUG] Moved to end of list');
        } else {
            serverList.insertBefore(draggedElement, afterElement);
            console.log('[DRAG DEBUG] Moved before element:', afterElement);
        }
    }
    
    if (originalGroup) {
        console.log('[DRAG DEBUG] Checking and cleaning up original group');
        checkAndCleanupGroup(originalGroup);
    }
    
    document.querySelectorAll('.drag-over, .drop-target, .drop-target-folder').forEach(el => {
        el.classList.remove('drag-over', 'drop-target', 'drop-target-folder');
    });
    console.log('[DRAG DEBUG] Cleaned up drop classes');
    
    setTimeout(() => {
        if (window.ServerSidebar && window.ServerSidebar.refresh) {
            console.log('[DRAG DEBUG] Refreshing server sidebar');
            window.ServerSidebar.refresh();
        }
    }, 100);
    
    console.log('[DRAG DEBUG] Drop processing complete');
}

function createOrAddToGroup(serverId1, serverId2) {
    console.log('[DRAG DEBUG] createOrAddToGroup called:', serverId1, 'with', serverId2);
    const groups = LocalStorageManager.getServerGroups() || [];
    console.log('[DRAG DEBUG] Current groups:', groups);
    
    const existingGroup = groups.find(g => g.servers.includes(serverId2));
    console.log('[DRAG DEBUG] Existing group for server2:', existingGroup);
    
    if (existingGroup) {
        if (!existingGroup.servers.includes(serverId1)) {
            LocalStorageManager.removeServerFromAllGroups(serverId1);
            existingGroup.servers.push(serverId1);
            LocalStorageManager.setServerGroups(groups);
            console.log('[DRAG DEBUG] Added server1 to existing group:', existingGroup.id);
        } else {
            console.log('[DRAG DEBUG] Server1 already in group');
        }
    } else {
        LocalStorageManager.removeServerFromAllGroups(serverId1);
        LocalStorageManager.removeServerFromAllGroups(serverId2);
        
        const groupId = 'group-' + Date.now();
        const newGroup = {
            id: groupId,
            name: 'Server Folder',
            servers: [serverId2, serverId1]
        };
        groups.push(newGroup);
        LocalStorageManager.setServerGroups(groups);
        console.log('[DRAG DEBUG] Created new group:', groupId, 'with servers:', [serverId2, serverId1]);
    }
}

function addServerToGroup(serverId, groupId) {
    console.log('[DRAG DEBUG] addServerToGroup called:', serverId, 'to group', groupId);
    const groups = LocalStorageManager.getServerGroups() || [];
    const group = groups.find(g => g.id === groupId);
    console.log('[DRAG DEBUG] Found target group:', group);
    
    if (group && !group.servers.includes(serverId)) {
        LocalStorageManager.removeServerFromAllGroups(serverId);
        group.servers.push(serverId);
        LocalStorageManager.setServerGroups(groups);
        console.log('[DRAG DEBUG] Added server to group. New servers:', group.servers);
    } else if (!group) {
        console.log('[DRAG DEBUG] Target group not found:', groupId);
    } else {
        console.log('[DRAG DEBUG] Server already in group');
    }
}

function removeServerFromGroup(serverId) {
    console.log('[DRAG DEBUG] removeServerFromGroup called for:', serverId);
    LocalStorageManager.removeServerFromAllGroups(serverId);
    console.log('[DRAG DEBUG] Server removed from all groups');
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.children].filter(child => 
        (child.classList.contains('server-sidebar-icon') && child.hasAttribute('data-server-id') && 
         child.getAttribute('draggable') === 'true' && !child.classList.contains('dragging')) ||
        (child.classList.contains('server-sidebar-group') && child.getAttribute('draggable') === 'true' && 
         !child.classList.contains('dragging'))
    );

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function checkAndCleanupGroup(group) {
    const groupServers = group.querySelector('.group-servers');
    if (!groupServers) return;
    
    const remainingServers = groupServers.querySelectorAll('.server-sidebar-icon[data-server-id]');
    
    if (remainingServers.length <= 1) {
        const groups = LocalStorageManager.getServerGroups() || [];
        const groupId = group.getAttribute('data-group-id');
        
        if (remainingServers.length === 1) {
            const lastServer = remainingServers[0];
            const serverList = document.getElementById('server-list');
            if (serverList) {
                serverList.insertBefore(lastServer, group);
                lastServer.classList.remove('in-group');
                lastServer.style.display = '';
            }
        }
        
        const newGroups = groups.filter(g => g.id !== groupId);
        LocalStorageManager.setServerGroups(newGroups);
        
        group.remove();
    }
}

window.makeServersDraggable = makeServersDraggable;
window.debugDragSystem = function() {
    console.log('[DRAG DEBUG] === DRAG SYSTEM STATUS ===');
    console.log('[DRAG DEBUG] Initialized:', initialized);
    console.log('[DRAG DEBUG] Current dragged element:', draggedElement);
    console.log('[DRAG DEBUG] Current dragged server ID:', draggedServerId);
    console.log('[DRAG DEBUG] Drop indicator exists:', !!dropIndicator);
    console.log('[DRAG DEBUG] Server list element:', document.getElementById('server-list'));
    
    const servers = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
    console.log('[DRAG DEBUG] Found servers:', servers.length);
    servers.forEach((server, i) => {
        console.log(`[DRAG DEBUG] Server ${i+1}: ID=${server.getAttribute('data-server-id')}, draggable=${server.getAttribute('draggable')}`);
    });
    
    const groups = LocalStorageManager.getServerGroups() || [];
    console.log('[DRAG DEBUG] Stored groups:', groups);
    console.log('[DRAG DEBUG] === END STATUS ===');
};

export default { loaded: true };