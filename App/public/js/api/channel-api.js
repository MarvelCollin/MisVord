const channelAPI = {
    getChannels: function(serverId) {
        return $.ajax({
            url: `/api/servers/${serverId}/channels`,
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error(`HTTP error! Status: ${xhr.status}`);
        });
    },

    createChannel: function(formData) {
        return $.ajax({
            url: '/api/channels',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error(`HTTP error! Status: ${xhr.status}`);
        });
    },

    updateChannel: function(channelId, data) {
        return $.ajax({
            url: `/api/channels/${channelId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error(`HTTP error! Status: ${xhr.status}`);
        });
    },

    deleteChannel: function(channelId) {
        return $.ajax({
            url: `/api/channels/${channelId}`,
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error(`HTTP error! Status: ${xhr.status}`);
        });
    },

    getChannelMessages: function(channelId, offset = 0, limit = 50) {
        const params = {
            offset: offset,
            limit: limit
        };
        
        return $.ajax({
            url: `/api/chat/channel/${channelId}/messages`,
            method: 'GET',
            data: params,
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error(`HTTP error! Status: ${xhr.status}`);
        });
    },

    createCategory: function(formData) {
        return $.ajax({
            url: '/api/categories',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error(`HTTP error! Status: ${xhr.status}`);
        });
    },

    getChannelDetails: function(channelId, forceFresh = false) {
        let url = `/api/channels/${channelId}`;
        const params = {};
        if (forceFresh) {
            params.timestamp = Date.now();
        }
        
        return $.ajax({
            url: url,
            method: 'GET',
            data: params,
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error(`HTTP error! Status: ${xhr.status}`);
        });
    },

    updateChannelName: function(channelId, name) {
        return $.ajax({
            url: `/api/channels/${channelId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ name: name }),
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error(`HTTP error! Status: ${xhr.status}`);
        });
    }
};

export default channelAPI;

window.channelAPI = channelAPI;
