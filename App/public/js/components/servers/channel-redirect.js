document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const serverMatch = currentPath.match(/^\/server\/(\d+)$/);
    
    if (serverMatch && !window.location.search.includes('channel=')) {
        const serverId = serverMatch[1];
        
        const firstTextChannel = document.querySelector('.channel-item[data-channel-type="text"]');
        
        if (firstTextChannel) {
            const channelId = firstTextChannel.getAttribute('data-channel-id');
            if (channelId) {
                window.logger.info('channel-redirect', 'Redirecting to first text channel:', channelId);
                
                const newUrl = `/server/${serverId}?channel=${channelId}`;
                window.history.replaceState(null, '', newUrl);
                
                window.location.reload();
            }
        } else {
            window.logger.warn('channel-redirect', 'No text channels found for auto-redirect');
        }
    }
});
