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
            
            if (window.channelSwitchManager) {
                const channelElement = document.querySelector(`[data-channel-id="${firstChannel.id}"]`);
                await window.channelSwitchManager.switchToChannel(serverId, firstChannel.id, channelElement);
            }
        }
    } catch (error) {
        console.error('Failed to load default channel:', error);
    }
}
