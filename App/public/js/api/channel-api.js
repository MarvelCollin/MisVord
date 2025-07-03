const channelAPI = {
    getChannels: function(serverId) {
        return fetch(`/api/servers/${serverId}/channels`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },

    createChannel: function(formData) {
        return fetch('/api/channels', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },

    updateChannel: function(channelId, data) {
        return fetch(`/api/channels/${channelId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },

    deleteChannel: function(channelId) {
        return fetch(`/api/channels/${channelId}`, {
            method: 'DELETE',
            credentials: 'include'
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
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
                'Accept': 'application/json'
            }
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },

    createCategory: function(formData) {
        return fetch('/api/categories', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },

    getChannelDetails: function(channelId, forceFresh = false) {
        let url = `/api/channels/${channelId}`;
        if (forceFresh) {
            url += `?timestamp=${Date.now()}`;
        }
        
        return fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },

    updateChannelPosition: function(channelId, position) {
        return fetch(`/api/channels/${channelId}/position`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ position: position })
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    }
};

export default channelAPI;

window.channelAPI = channelAPI;
