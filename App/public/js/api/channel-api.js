const channelAPI = {
    getChannels: function(serverId) {
        return $.ajax({
            url: `/api/servers/${serverId}/channels`,
            method: 'GET',
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
            }
        });
    },

    createChannel: function(formData) {
        return $.ajax({
            url: '/api/channels',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
            }
        });
    },

    updateChannel: function(channelId, data) {
        return $.ajax({
            url: `/api/channels/${channelId}`,
            method: 'PUT',
            data: JSON.stringify(data),
            contentType: 'application/json',
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
            }
        });
    },

    deleteChannel: function(channelId) {
        return $.ajax({
            url: `/api/channels/${channelId}`,
            method: 'DELETE',
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
            }
        });
    },

    getChannelMessages: function(channelId, offset = 0, limit = 50) {
        return $.ajax({
            url: `/api/chat/channel/${channelId}/messages`,
            method: 'GET',
            data: { offset: offset, limit: limit },
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
            }
        });
    },

    createCategory: function(formData) {
        return $.ajax({
            url: '/api/categories',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
            }
        });
    },

    getChannelDetails: function(channelId, forceFresh = false) {
        const url = forceFresh ? `/api/channels/${channelId}?timestamp=${Date.now()}` : `/api/channels/${channelId}`;
        
        return $.ajax({
            url: url,
            method: 'GET',
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
            }
        });
    },

    updateChannelPosition: function(channelId, direction) {
        return $.ajax({
            url: `/api/channels/${channelId}/position`,
            method: 'PUT',
            data: JSON.stringify({ direction: direction }),
            contentType: 'application/json',
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
            }
        });
    },

    updateChannelName: function(channelId, name) {
        return $.ajax({
            url: `/api/channels/${channelId}`,
            method: 'PUT',
            data: JSON.stringify({ name: name }),
            contentType: 'application/json',
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            }
        }).fail(function(xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login';
            }
        });
    }
};

export default channelAPI;

window.channelAPI = channelAPI;
