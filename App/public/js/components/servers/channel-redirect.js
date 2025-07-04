document.addEventListener('DOMContentLoaded', function() {
    const currentURL = window.location.href;
    const serverId = extractServerIdFromURL(currentURL);
    
    if (serverId && !currentURL.includes('?channel=')) {
        loadDefaultChannel(serverId);
    }
});

function extractServerIdFromURL(url) {
    const match = url.match(/\/server\/(\d+)/);
    return match ? match[1] : null;
}

async function loadDefaultChannel(serverId) {
    try {

        
        const response = await fetch(`/api/servers/${serverId}/channels`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.channels && data.data.channels.length > 0) {
            const firstChannel = data.data.channels[0];
            

            
            if (window.simpleChannelSwitcher) {
                window.simpleChannelSwitcher.switchToChannel(firstChannel.id, 'text');
            } else {
                console.warn('[Channel Redirect] simpleChannelSwitcher not available, will retry');
                setTimeout(() => {
                    if (window.simpleChannelSwitcher) {
                        window.simpleChannelSwitcher.switchToChannel(firstChannel.id, 'text');
                    }
                }, 1000);
            }
        } else {
            console.warn('[Channel Redirect] No channels found for server:', serverId);
        }
    } catch (error) {
        console.error('[Channel Redirect] Failed to load default channel:', error);
    }
}
