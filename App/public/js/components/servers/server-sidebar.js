import { MisVordAjax } from '../../core/ajax/ajax-handler.js';
import { LocalStorageManager } from '../../utils/local-storage-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    initServerSidebar();
    initServerGroups();
});

export function initServerSidebar() {
    const serverIcons = document.querySelectorAll('.server-icon');

    serverIcons.forEach(icon => {
        if (!icon.hasAttribute('data-initialized')) {
            icon.setAttribute('data-initialized', 'true');

            const tooltip = icon.querySelector('.tooltip');
            if (tooltip) {
                icon.addEventListener('mouseenter', () => {
                    tooltip.classList.remove('hidden');
                    tooltip.classList.add('opacity-100');
                });

                icon.addEventListener('mouseleave', () => {
                    tooltip.classList.add('hidden');
                    tooltip.classList.remove('opacity-100');
                });
            }

            icon.addEventListener('click', (e) => {
                if (icon.classList.contains('active')) return;

                const serverId = icon.getAttribute('data-server-id');
                if (!serverId) return;

                e.preventDefault();

                handleServerClick(serverId);
            });

            // Make server icon draggable
            icon.setAttribute('draggable', 'true');
            
            icon.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', icon.getAttribute('data-server-id'));
                icon.classList.add('dragging');
                setTimeout(() => {
                    icon.style.opacity = '0.4';
                }, 0);
            });
            
            icon.addEventListener('dragend', () => {
                icon.classList.remove('dragging');
                icon.style.opacity = '1';
            });

            // Make server icon a drop target for other servers
            icon.addEventListener('dragover', (e) => {
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
                if (icon.closest('.server-group')) return; // Don't allow drops on servers already in groups
                
                icon.classList.remove('drop-target');
                const draggedServerId = e.dataTransfer.getData('text/plain');
                const targetServerId = icon.getAttribute('data-server-id');
                
                if (draggedServerId && targetServerId && draggedServerId !== targetServerId) {
                    e.preventDefault();
                    
                    // Create a new group with both servers
                    const groupName = "Server Group";
                    const groupId = LocalStorageManager.addServerGroup(groupName);
                    
                    // Add both servers to the new group
                    LocalStorageManager.addServerToGroup(groupId, draggedServerId);
                    LocalStorageManager.addServerToGroup(groupId, targetServerId);
                    
                    // Re-render the sidebar
                    renderServerGroups();
                }
            });
        }
    });

    updateActiveServer();
}

export function initServerGroups() {
    // Render existing groups from local storage
    renderServerGroups();
    
    // Handle group collapsing
    document.addEventListener('click', (e) => {
        if (e.target.closest('.group-header')) {
            // Don't collapse when clicking on the name (used for rename)
            if (e.target.classList.contains('group-name')) return;
            
            const groupId = e.target.closest('.server-group').getAttribute('data-group-id');
            toggleGroupCollapse(groupId);
        }
    });
    
    // Handle group name editing via double click
    document.addEventListener('dblclick', (e) => {
        if (e.target.classList.contains('group-name')) {
            const groupHeader = e.target.closest('.group-header');
            const groupId = groupHeader.closest('.server-group').getAttribute('data-group-id');
            const currentName = e.target.textContent;
            
            // Create input for editing
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentName;
            input.className = 'text-xs bg-discord-dark text-white border-none outline-none rounded px-1 w-8 focus:ring-1 focus:ring-discord-primary';
            input.style.width = '8rem';
            
            // Replace span with input
            e.target.replaceWith(input);
            input.focus();
            input.select();
            
            // Handle saving on blur and enter key
            const saveGroupName = () => {
                if (input.value.trim()) {
                    LocalStorageManager.renameServerGroup(groupId, input.value);
                }
                renderServerGroups();
            };
            
            input.addEventListener('blur', saveGroupName);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveGroupName();
                }
            });
        }
    });
}

function renderServerGroups() {
    const groups = LocalStorageManager.getServerGroups();
    
    // Remove existing group containers
    document.querySelectorAll('.server-group').forEach(group => group.remove());
    
    // Get all servers
    const serverIcons = Array.from(document.querySelectorAll('.server-icon'));
    
    // Create groups and add servers to them
    groups.forEach(group => {
        // If group has no servers, remove it
        if (group.servers.length === 0) {
            LocalStorageManager.removeServerGroup(group.id);
            return;
        }
        
        createGroupElement(group);
        
        // Move servers to their respective groups
        group.servers.forEach(serverId => {
            const serverIcon = serverIcons.find(icon => 
                icon.getAttribute('data-server-id') === serverId
            );
            
            if (serverIcon) {
                const groupElement = document.querySelector(`.server-group[data-group-id="${group.id}"] .group-servers`);
                if (groupElement) {
                    // Clone the server icon to keep the event listeners
                    const clone = serverIcon.cloneNode(true);
                    groupElement.appendChild(clone);
                    
                    // Remove the original
                    serverIcon.remove();
                }
            }
        });
    });
    
    // Make group containers accept drops
    setupDropZones();
    
    // Re-initialize event listeners on server icons (including newly created ones)
    initServerSidebar();
}

function createGroupElement(group) {
    const serverList = document.querySelector('.server-list');
    if (!serverList) return;
    
    const groupDiv = document.createElement('div');
    groupDiv.className = 'server-group my-2';
    groupDiv.setAttribute('data-group-id', group.id);
    
    groupDiv.innerHTML = `
        <div class="group-header w-12 h-6 flex items-center justify-between px-1 cursor-pointer">
            <span class="group-name text-xs text-gray-400 truncate">${group.name}</span>
            <i class="fas ${group.collapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-gray-400 text-xs"></i>
        </div>
        <div class="group-servers ${group.collapsed ? 'hidden' : ''}"></div>
    `;
    
    // Insert group before the "Create Server" button
    const createServerBtn = document.querySelector('[data-action="create-server"]').parentElement;
    serverList.insertBefore(groupDiv, createServerBtn);
    
    return groupDiv;
}

function setupDropZones() {
    // Setup groups as drop zones
    document.querySelectorAll('.server-group').forEach(group => {
        group.addEventListener('dragover', (e) => {
            e.preventDefault();
            group.classList.add('drag-over');
        });
        
        group.addEventListener('dragleave', () => {
            group.classList.remove('drag-over');
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
    
    // Setup ungrouped area as drop zone
    const serverList = document.querySelector('.server-list');
    if (serverList) {
        serverList.addEventListener('dragover', (e) => {
            if (e.target.closest('.server-group')) return;
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
                
            if (!isInside && !e.target.closest('.server-group')) {
                serverList.classList.remove('drop-target');
            }
        });
        
        serverList.addEventListener('drop', (e) => {
            if (e.target.closest('.server-group')) return;
            
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

function toggleGroupCollapse(groupId) {
    LocalStorageManager.toggleGroupCollapsed(groupId);
    
    const group = document.querySelector(`.server-group[data-group-id="${groupId}"]`);
    if (group) {
        const serversContainer = group.querySelector('.group-servers');
        const icon = group.querySelector('.group-header i');
        
        if (serversContainer.classList.contains('hidden')) {
            serversContainer.classList.remove('hidden');
            icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        } else {
            serversContainer.classList.add('hidden');
            icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        }
    }
}

export function updateActiveServer() {
    document.querySelectorAll('.server-icon.active').forEach(icon => {
        icon.classList.remove('active');
        
        const serverDiv = icon.querySelector('.w-12.h-12');
        if (serverDiv) {
            serverDiv.classList.remove('rounded-2xl', 'bg-discord-primary');
            serverDiv.classList.add('rounded-full', 'bg-discord-dark');
        }
        
        const indicator = icon.querySelector('.w-1');
        if (indicator) {
            indicator.classList.remove('h-10');
            indicator.classList.add('h-0');
        }
    });

    const currentPath = window.location.pathname;
    if (currentPath.includes('/server/')) {
        const serverId = currentPath.split('/server/')[1].split('/')[0];
        const activeIcon = document.querySelector(`.server-icon[data-server-id="${serverId}"]`);

        if (activeIcon) {
            // Add active state
            activeIcon.classList.add('active');
            
            // Update server icon styling
            const serverDiv = activeIcon.querySelector('.w-12.h-12');
            if (serverDiv) {
                serverDiv.classList.remove('rounded-full', 'bg-discord-dark');
                serverDiv.classList.add('rounded-2xl', 'bg-discord-primary');
            }
            
            // Update indicator
            const indicator = activeIcon.querySelector('.w-1');
            if (indicator) {
                indicator.classList.remove('h-0');
                indicator.classList.add('h-10');
            } else {
                // If no indicator exists, create one
                const indicatorDiv = document.createElement('div');
                indicatorDiv.className = 'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-md';
                activeIcon.appendChild(indicatorDiv);
            }
            
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

export const ServerSidebar = {
    initServerSidebar,
    updateActiveServer,
    handleServerClick,
    initServerGroups
};