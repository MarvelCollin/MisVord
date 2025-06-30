const serverAPI = {
    createServer: function(formData) {
        return $.ajax({
            url: '/api/servers/create',
            method: 'POST',
            data: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    getServerPageHTML: function(serverId) {
        return $.ajax({
            url: `/server/${serverId}?render_html=1`,
            method: 'GET',
            dataType: 'html',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },
    
    getStats: function() {
        return $.ajax({
            url: '/api/admin/servers/stats',
            method: 'GET',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },
    
    listServers: function(page = 1, limit = 10, search = '') {
        const params = new URLSearchParams({
            page,
            limit,
            q: search
        });
        
        return $.ajax({
            url: `/api/admin/servers?${params.toString()}`,
            method: 'GET',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },
    
    getServerDetails: function(serverId) {
        return $.ajax({
            url: `/api/admin/servers/${serverId}`,
            method: 'GET',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    deleteServer: function(serverId) {
        return $.ajax({
            url: `/api/admin/servers/${serverId}`,
            method: 'DELETE',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },
    
    deleteUserServer: function(serverId) {
        return fetch(`/api/servers`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                server_id: serverId
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    updateServerSettings: function(serverId, formData) {
        return fetch(`/api/servers/${serverId}/settings`, {
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

    getServerMembers: function(serverId) {
        return fetch(`/api/servers/${serverId}/members`, {
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

    getServerRoles: function(serverId) {
        return fetch(`/api/servers/${serverId}/roles`, {
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

    promoteMember: function(serverId, userId) {
        return fetch(`/api/servers/${serverId}/members/${userId}/promote`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    demoteMember: function(serverId, userId) {
        return fetch(`/api/servers/${serverId}/members/${userId}/demote`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    kickMember: function(serverId, userId) {
        return fetch(`/api/servers/${serverId}/members/${userId}/kick`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    updateServerName: function(serverId, name) {
        return fetch(`/api/servers/${serverId}/update/name`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    updateServerDescription: function(serverId, description) {
        return fetch(`/api/servers/${serverId}/update/description`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ description: description })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    updateServerPublic: function(serverId, isPublic) {
        return fetch(`/api/servers/${serverId}/update/public`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_public: isPublic })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    updateServerCategory: function(serverId, category) {
        return fetch(`/api/servers/${serverId}/update/category`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ category: category })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    getServerChannels: function(serverId) {
        return $.ajax({
            url: `/api/servers/${serverId}/channels`,
            method: 'GET',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    getServerBundle: function(serverId) {
        return fetch(`/api/servers/${serverId}/details`, {
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

    generateInvite: function(serverId, options = {}) {
        return fetch(`/api/servers/${serverId}/invite`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(options)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    getPerServerProfile: function(serverId) {
        return fetch(`/api/servers/${serverId}/profile`, {
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



    joinServer: function(data) {
        const formData = new FormData();
        if (typeof data === 'object' && data.server_id) {
            formData.append('server_id', data.server_id);
        } else {
            formData.append('server_id', data);
        }

        return $.ajax({
            url: '/api/servers/join',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    getExploreLayout: function() {
        return $.ajax({
            url: '/explore-servers/layout',
            method: 'GET',
            dataType: 'html',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    leaveServer: function(serverId) {
        return fetch(`/api/servers/leave`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                server_id: serverId
            })
        })
        .then(response => response.json());
    },

    createChannel: function(serverId, channelData) {
        return $.ajax({
            url: `/api/servers/${serverId}/channels`,
            method: 'POST',
            data: JSON.stringify(channelData),
            contentType: 'application/json',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    updateChannel: function(serverId, channelId, channelData) {
        return $.ajax({
            url: `/api/servers/${serverId}/channels/${channelId}`,
            method: 'PUT',
            data: JSON.stringify(channelData),
            contentType: 'application/json',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    deleteChannel: function(serverId, channelId) {
        return $.ajax({
            url: `/api/servers/${serverId}/channels/${channelId}`,
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    createCategory: function(serverId, categoryData) {
        return $.ajax({
            url: `/api/servers/${serverId}/categories`,
            method: 'POST',
            data: JSON.stringify(categoryData),
            contentType: 'application/json',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    updateCategory: function(serverId, categoryId, categoryData) {
        return $.ajax({
            url: `/api/servers/${serverId}/categories/${categoryId}`,
            method: 'PUT',
            data: JSON.stringify(categoryData),
            contentType: 'application/json',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    deleteCategory: function(serverId, categoryId) {
        return $.ajax({
            url: `/api/servers/${serverId}/categories/${categoryId}`,
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    generateInviteLink: function(serverId, options = {}) {
        return $.ajax({
            url: `/api/servers/${serverId}/invite`,
            method: 'POST',
            data: JSON.stringify(options),
            contentType: 'application/json',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    },

    getInviteDetails: function(inviteCode) {
        return $.ajax({
            url: `/api/invites/${inviteCode}`,
            method: 'GET',
            dataType: 'json',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
    }
};

export default serverAPI;

window.serverAPI = serverAPI;
