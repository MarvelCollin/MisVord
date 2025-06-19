document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a server page without a channel selected
    const currentPath = window.location.pathname;
    const serverMatch = currentPath.match(/^\/server\/(\d+)$/);
    
    if (serverMatch && !window.location.search.includes('channel=')) {
        const serverId = serverMatch[1];
        
        // Look for the first text channel in the sidebar
        const firstTextChannel = document.querySelector('.channel-item[data-channel-type="text"]');
        
        if (firstTextChannel) {
            const channelId = firstTextChannel.getAttribute('data-channel-id');
            if (channelId) {
                window.logger.info('channel-redirect', 'Redirecting to first text channel:', channelId);
                
                // Update the URL without causing a full page reload
                const newUrl = `/server/${serverId}?channel=${channelId}`;
                window.history.replaceState(null, '', newUrl);
                
                // Reload the page to show the selected channel
                window.location.reload();
            }
        } else {
            window.logger.warn('channel-redirect', 'No text channels found for auto-redirect');
        }
    }
});
