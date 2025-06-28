const channelAPI = {
    createChannel: function(formData) {
        return fetch('/api/channels/create', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    updateChannel: function(channelId, data) {
        return fetch(`/api/channels/${channelId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    deleteChannel: function(channelId) {
        return fetch(`/api/channels/${channelId}`, {
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    getChannelMessages: function(channelId, offset = 0, limit = 50) {
        const params = new URLSearchParams({
            offset: offset,
            limit: limit
        });
        
        return fetch(`/api/chat/channel/${channelId}/messages?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
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
        console.log(`🎤 Joining voice channel: ${channelId}`);
        
        return fetch(`/api/voice/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                channel_id: channelId
            }),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    leaveVoiceChannel: function(channelId) {
        console.log(`🎤 Leaving voice channel: ${channelId}`);
        
        return fetch(`/api/voice/leave`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                channel_id: channelId
            }),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    createCategory: function(formData) {
        return fetch('/api/categories/create', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    updateChannelOrder: function(channelId, newPosition) {
        return fetch(`/api/channels/${channelId}/order`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                position: newPosition
            }),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    getChannelDetails: function(channelId) {
        return fetch(`/api/channels/${channelId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    }
};

export default channelAPI;

window.channelAPI = channelAPI;
