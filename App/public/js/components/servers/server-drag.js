import { LocalStorageManager } from '../../utils/local-storage-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    
    

    if (!window.LocalStorageManager) {
        window.LocalStorageManager = LocalStorageManager;
    }
    
    document.addEventListener('dragend', function(e) {
        try {

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
    

    setInterval(() => {
        try {
            const serverIcons = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
            let allVisible = true;
            let missingServerIds = [];
            

            const localStorageServers = getAllServersFromLocalStorage();
            const visibleServerIds = Array.from(serverIcons).map(icon => icon.getAttribute('data-server-id'));
            
            localStorageServers.forEach(serverId => {
                if (!visibleServerIds.includes(serverId)) {
                    missingServerIds.push(serverId);
                    allVisible = false;
                }
            });
            

            serverIcons.forEach(icon => {

                const isInGroup = icon.classList.contains('in-group');
                const isHidden = icon.style.display === 'none';
                const isInDOM = document.body.contains(icon);
                
                if (isInDOM && !isInGroup && isHidden) {
                    icon.style.display = '';
                    allVisible = false;
                }
            });
            

            if (!allVisible && window.ServerSidebar && window.ServerSidebar.refresh) {
                
                window.ServerSidebar.refresh();
            }
        } catch (error) {
            console.error('[Server Drag] Error in periodic check:', error);
        }
    }, 5000);
    

    document.addEventListener('drop', function(e) {

        setTimeout(() => {
            validateServerVisibility();
        }, 500);
    });
});


function recoverFromDragError() {
    
    

    document.querySelectorAll('#server-list > .server-sidebar-icon.in-group').forEach(server => {
        server.classList.remove('in-group');
        server.style.display = '';
    });
    

    document.querySelectorAll('.server-sidebar-group .server-sidebar-icon').forEach(server => {
        server.style.display = '';
    });
    

    if (window.ServerSidebar && window.ServerSidebar.refresh) {
        window.ServerSidebar.refresh();
    }
}


function validateServerVisibility() {
    const allServers = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
    const mainListServers = document.querySelectorAll('#server-list > .server-sidebar-icon[data-server-id]');
    const groupServers = document.querySelectorAll('.server-sidebar-group .server-sidebar-icon[data-server-id]');
    

    const allServerIds = Array.from(allServers).map(server => server.getAttribute('data-server-id'));
    const mainListServerIds = Array.from(mainListServers).map(server => server.getAttribute('data-server-id'));
    const groupServerIds = Array.from(groupServers).map(server => server.getAttribute('data-server-id'));
    

    const accountedFor = new Set([...mainListServerIds, ...groupServerIds]);
    

    if (accountedFor.size < allServerIds.length) {
        
        if (window.ServerSidebar && window.ServerSidebar.refresh) {
            window.ServerSidebar.refresh();
        }
    }
}


function getAllServersFromLocalStorage() {
    try {

        if (window.LocalStorageManager) {
            const groups = window.LocalStorageManager.getServerGroups();
            const groupedServerIds = groups.flatMap(group => group.servers);
            

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