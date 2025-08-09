export async function loadServerPage(serverId, channelId = null) {
    const newURL = `/server/${serverId}${channelId ? `?channel=${channelId}` : ''}`;
    window.location.href = newURL;
}

window.loadServerPage = loadServerPage; 