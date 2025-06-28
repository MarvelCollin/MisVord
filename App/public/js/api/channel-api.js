const channelAPI = {
    createChannel: function(formData) {
        return new Promise((resolve, reject) => {
            ajax({
                url: '/api/channels/create',
            method: 'POST',
                data: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
                },
                success: resolve,
                error: reject
            });
        });
    },

    updateChannel: function(channelId, data) {
        return new Promise((resolve, reject) => {
            ajax({
                url: `/api/channels/${channelId}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
                data: data,
                success: resolve,
                error: reject
            });
        });
    },

    deleteChannel: function(channelId) {
        return new Promise((resolve, reject) => {
            ajax({
                url: `/api/channels/${channelId}`,
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
                success: resolve,
                error: reject
            });
        });
    },

    getChannelMessages: function(channelId, offset = 0, limit = 50) {
        return new Promise((resolve, reject) => {
        const params = new URLSearchParams({
            offset: offset,
            limit: limit
        });
        
            ajax({
                url: `/api/chat/channel/${channelId}/messages?${params.toString()}`,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
                },
                success: resolve,
                error: reject
            });
        });
    },

    switchToChannel: function(serverId, channelId, channelType = 'text') {
        console.log(`📍 Channel API: switching to channel ${channelId} on server ${serverId}`);
        
        if (window.channelSwitchManager) {
            const clickedElement = document.querySelector(`[data-channel-id="${channelId}"]`);
            return window.channelSwitchManager.switchToChannel(serverId, channelId, clickedElement);
        } else {
            console.error('Channel switch manager not available');
            return Promise.reject(new Error('Channel switch manager not available'));
        }
    },

    joinVoiceChannel: function(channelId) {
        return new Promise((resolve, reject) => {
            ajax({
                url: '/api/voice/join',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
                data: { channel_id: channelId },
                success: resolve,
                error: reject
            });
        });
    },

    leaveVoiceChannel: function(channelId) {
        return new Promise((resolve, reject) => {
            ajax({
                url: '/api/voice/leave',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
                data: { channel_id: channelId },
                success: resolve,
                error: reject
            });
        });
    },

    createCategory: function(formData) {
        return new Promise((resolve, reject) => {
            ajax({
                url: '/api/categories/create',
            method: 'POST',
                data: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
                },
                success: resolve,
                error: reject
            });
        });
    },

    updateChannelOrder: function(channelId, newPosition) {
        return new Promise((resolve, reject) => {
            ajax({
                url: `/api/channels/${channelId}/order`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
                data: { position: newPosition },
                success: resolve,
                error: reject
            });
        });
    },

    getChannelDetails: function(channelId) {
        return new Promise((resolve, reject) => {
            ajax({
                url: `/api/channels/${channelId}`,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
                },
                success: resolve,
                error: reject
            });
        });
    }
};

export default channelAPI;

window.channelAPI = channelAPI;
