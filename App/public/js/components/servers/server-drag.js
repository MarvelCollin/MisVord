

document.addEventListener('DOMContentLoaded', function() {
    console.log('Server drag module loaded');
    
    // Force refresh local storage data after drag operations
    document.addEventListener('dragend', function(e) {
        if (window.ServerSidebar && window.ServerSidebar.refresh) {
            // First timeout to allow LocalStorage to update
            setTimeout(() => {
                // If the LocalStorageManager exists, reload data from storage
                if (window.LocalStorageManager && window.LocalStorageManager.reloadFromStorage) {
                    window.LocalStorageManager.reloadFromStorage();
                }
                
                // Then refresh the UI with the updated data
                setTimeout(() => {
                    window.ServerSidebar.refresh();
                }, 50);
            }, 50);
        }
    });
    
    // Add periodic check to ensure all servers are visible
    setInterval(() => {
        const serverIcons = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
        let allVisible = true;
        
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
        
        if (!allVisible && window.ServerSidebar && window.ServerSidebar.refresh) {
            // Force reload from local storage before refreshing
            if (window.LocalStorageManager && window.LocalStorageManager.reloadFromStorage) {
                window.LocalStorageManager.reloadFromStorage();
            }
            window.ServerSidebar.refresh();
        }
    }, 5000);
});

export default { loaded: true }; 