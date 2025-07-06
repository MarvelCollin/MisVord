import { LocalStorageManager } from '../../utils/local-storage-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Server drag module loaded');
    
    // Expose LocalStorageManager for error recovery functions
    if (!window.LocalStorageManager) {
        window.LocalStorageManager = LocalStorageManager;
    }
    
    document.addEventListener('dragend', function(e) {
        try {
            // Add a small delay to ensure DOM updates are complete
            setTimeout(() => {
                if (window.ServerSidebar && window.ServerSidebar.refresh) {
                    window.ServerSidebar.refresh();
                }
            }, 150);
        } catch (error) {
            console.error('[Server Drag] Error handling dragend:', error);
            recoverFromDragError();
        }
    });
    
    // Add periodic check to ensure all servers are visible
    setInterval(() => {
        try {
            const serverIcons = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
            let allVisible = true;
            let missingServerIds = [];
            
            // Check if all servers have a visual representation
            const localStorageServers = getAllServersFromLocalStorage();
            const visibleServerIds = Array.from(serverIcons).map(icon => icon.getAttribute('data-server-id'));
            
            localStorageServers.forEach(serverId => {
                if (!visibleServerIds.includes(serverId)) {
                    missingServerIds.push(serverId);
                    allVisible = false;
                }
            });
            
            // Check for hidden servers that shouldn't be hidden
            serverIcons.forEach(icon => {
                // Check if the server is actually visible in the DOM
                const isInGroup = icon.classList.contains('in-group');
                const isHidden = icon.style.display === 'none';
                const isInDOM = document.body.contains(icon);
                
                if (isInDOM && !isInGroup && isHidden) {
                    icon.style.display = '';
                    allVisible = false;
                }
            });
            
            // If any servers are missing or incorrectly hidden, refresh
            if (!allVisible && window.ServerSidebar && window.ServerSidebar.refresh) {
                console.log('[Server Drag] Recovering visibility for servers:', missingServerIds);
                window.ServerSidebar.refresh();
            }
        } catch (error) {
            console.error('[Server Drag] Error in periodic check:', error);
        }
    }, 5000);
    
    // Enhanced drag recovery mechanism
    document.addEventListener('drop', function(e) {
        // Add a safety check to prevent servers from disappearing
        setTimeout(() => {
            validateServerVisibility();
        }, 500);
        
        // Add additional recovery check after animations complete
        setTimeout(() => {
            validateServerVisibility();
            recoverMissingServers();
        }, 1000);
    });
    
    // Create a safety net MutationObserver to detect and fix disappearing servers
    const serverList = document.getElementById('server-list');
    if (serverList) {
        const observer = new MutationObserver(mutations => {
            // Wait a moment for DOM to settle
            setTimeout(() => {
                validateServerVisibility();
            }, 200);
        });
        
        observer.observe(serverList, { 
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
});

// Helper function to recover from drag errors
function recoverFromDragError() {
    console.log('[Server Drag] Attempting to recover from drag error');
    
    // Force all servers with in-group class but not in a group to be visible
    document.querySelectorAll('#server-list > .server-sidebar-icon.in-group').forEach(server => {
        server.classList.remove('in-group');
        server.style.display = '';
    });
    
    // Ensure all servers in groups are properly displayed
    document.querySelectorAll('.server-sidebar-group .server-sidebar-icon').forEach(server => {
        server.style.display = '';
    });
    
    // Refresh sidebar to ensure proper state
    if (window.ServerSidebar && window.ServerSidebar.refresh) {
        window.ServerSidebar.refresh();
    }
}

// Helper to validate server visibility
function validateServerVisibility() {
    const allServers = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
    const mainListServers = document.querySelectorAll('#server-list > .server-sidebar-icon[data-server-id]');
    const groupServers = document.querySelectorAll('.server-sidebar-group .server-sidebar-icon[data-server-id]');
    
    // Check if any server is missing from both main list and groups
    const allServerIds = Array.from(allServers).map(server => server.getAttribute('data-server-id'));
    const mainListServerIds = Array.from(mainListServers).map(server => server.getAttribute('data-server-id'));
    const groupServerIds = Array.from(groupServers).map(server => server.getAttribute('data-server-id'));
    
    // Combination of servers that should exist
    const accountedFor = new Set([...mainListServerIds, ...groupServerIds]);
    
    // Check if all servers are accounted for
    if (accountedFor.size < allServerIds.length) {
        console.log('[Server Drag] Some servers are not properly displayed, refreshing');
        if (window.ServerSidebar && window.ServerSidebar.refresh) {
            window.ServerSidebar.refresh();
        }
    }
}

// Helper function to recover missing servers
function recoverMissingServers() {
    try {
        // Get server IDs from all sources
        const allServerElements = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
        const visibleServerElements = document.querySelectorAll('.server-sidebar-icon[data-server-id]:not([style*="display: none"]):not([style*="visibility: hidden"])');
        
        // Get IDs of all servers vs. visible servers
        const allServerIds = Array.from(allServerElements).map(el => el.getAttribute('data-server-id'));
        const visibleServerIds = Array.from(visibleServerElements).map(el => el.getAttribute('data-server-id'));
        
        // Find missing servers (invisible or detached)
        const missingServerIds = allServerIds.filter(id => !visibleServerIds.includes(id));
        
        // Check local storage groups
        const groups = window.LocalStorageManager.getServerGroups();
        const serversInGroups = new Set();
        groups.forEach(group => group.servers.forEach(id => serversInGroups.add(id)));
        
        // Fix each missing server
        if (missingServerIds.length > 0) {
            console.log('[Server Drag] Recovering missing servers:', missingServerIds);
            
            missingServerIds.forEach(serverId => {
                // Find the server element
                const serverElement = document.querySelector(`.server-sidebar-icon[data-server-id="${serverId}"]`);
                if (!serverElement) return; // Skip if element truly doesn't exist
                
                // Reset the server visibility
                serverElement.style.display = '';
                serverElement.style.visibility = '';
                
                // Check if the server should be in a group
                const shouldBeInGroup = serversInGroups.has(serverId);
                const isInGroup = serverElement.classList.contains('in-group');
                const isInGroupContainer = !!serverElement.closest('.group-servers');
                
                // Handle inconsistent states
                if (shouldBeInGroup && !isInGroup) {
                    serverElement.classList.add('in-group');
                } else if (!shouldBeInGroup && isInGroup) {
                    serverElement.classList.remove('in-group');
                    
                    // Move to main list if not there already
                    if (isInGroupContainer) {
                        const mainList = document.getElementById('server-list');
                        if (mainList) {
                            const addButton = mainList.querySelector('.discord-add-server-button')?.parentNode;
                            
                            if (serverElement.parentNode) {
                                serverElement.parentNode.removeChild(serverElement);
                            }
                            
                            if (addButton) {
                                mainList.insertBefore(serverElement, addButton);
                            } else {
                                mainList.appendChild(serverElement);
                            }
                        }
                    }
                }
            });
            
            // If we had to fix anything, consider refreshing the sidebar
            if (window.ServerSidebar?.refresh) {
                window.ServerSidebar.refresh();
            }
        }
    } catch (error) {
        console.error('[Server Drag] Error in recoverMissingServers:', error);
    }
}

// Helper to get all server IDs from localStorage
function getAllServersFromLocalStorage() {
    try {
        // Check if we have LocalStorageManager accessible
        if (window.LocalStorageManager) {
            const groups = window.LocalStorageManager.getServerGroups();
            const groupedServerIds = groups.flatMap(group => group.servers);
            
            // Combine with any servers in the DOM
            const domServerIds = Array.from(
                document.querySelectorAll('.server-sidebar-icon[data-server-id]')
            ).map(icon => icon.getAttribute('data-server-id'));
            
            return [...new Set([...groupedServerIds, ...domServerIds])];
        }
        
        return [];
    } catch (error) {
        console.error('[Server Drag] Error getting servers from localStorage:', error);
        return [];
    }
}

export default { loaded: true }; 