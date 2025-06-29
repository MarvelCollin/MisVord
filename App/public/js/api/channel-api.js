const channelAPI = {
    createChannel: function(formData) {
        return $.ajax({
            url: '/api/channels/create',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    updateChannel: function(channelId, data) {
        return $.ajax({
            url: `/api/channels/${channelId}`,
            method: 'PUT',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: JSON.stringify(data)
        });
    },

    deleteChannel: function(channelId) {
        return $.ajax({
            url: `/api/channels/${channelId}`,
            method: 'DELETE',
            dataType: 'json',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    getChannelMessages: function(channelId, offset = 0, limit = 50) {
        const params = new URLSearchParams({
            offset: offset,
            limit: limit
        });
        
        return $.ajax({
            url: `/api/chat/channel/${channelId}/messages?${params.toString()}`,
            method: 'GET',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
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
        return $.ajax({
            url: '/api/voice/join',
            method: 'POST',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: JSON.stringify({ channel_id: channelId })
        });
    },

    leaveVoiceChannel: function(channelId) {
        return $.ajax({
            url: '/api/voice/leave',
            method: 'POST',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: JSON.stringify({ channel_id: channelId })
        });
    },

    createCategory: function(formData) {
        return $.ajax({
            url: '/api/categories/create',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    updateChannelOrder: function(channelId, newPosition) {
        return $.ajax({
            url: `/api/channels/${channelId}/order`,
            method: 'PUT',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: JSON.stringify({ position: newPosition })
        });
    },

    getChannelDetails: function(channelId) {
        return $.ajax({
            url: `/api/channels/${channelId}`,
            method: 'GET',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    moveChannelToCategory: function(channelId, serverId, categoryId, newPosition, oldCategoryId = null) {
        return $.ajax({
            url: '/api/channels/move',
            method: 'POST',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: JSON.stringify({
                channel_id: channelId,
                server_id: serverId,
                category_id: categoryId,
                old_category_id: oldCategoryId,
                new_position: newPosition
            })
        });
    },

    reorderChannels: function(serverId, channelOrders) {
        return $.ajax({
            url: '/api/channels/reorder',
            method: 'POST',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: JSON.stringify({
                server_id: serverId,
                channel_orders: channelOrders
            })
        });
    },

    reorderCategories: function(serverId, categoryOrders) {
        return $.ajax({
            url: '/api/categories/reorder',
            method: 'POST',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            data: JSON.stringify({
                server_id: serverId,
                category_orders: categoryOrders
            })
        });
    }
};

export default channelAPI;

window.channelAPI = channelAPI;
