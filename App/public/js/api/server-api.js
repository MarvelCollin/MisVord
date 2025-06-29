const serverAPI = {
    createServer: function(formData) {
        return new Promise((resolve, reject) => {
            ajax({
                url: '/api/servers/create',
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

    getServerPageHTML: function(serverId) {
        return new Promise((resolve, reject) => {
            ajax({
                url: `/server/${serverId}?render_html=1`,
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
                },
                success: resolve,
                error: reject
            });
        });
    },
    
    getStats: function() {
        return new Promise((resolve, reject) => {
            ajax({
                url: '/api/admin/servers/stats',
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
    
    listServers: function(page = 1, limit = 10, search = '') {
        return new Promise((resolve, reject) => {
        const params = new URLSearchParams({
            page,
            limit,
            q: search
        });
        
            ajax({
                url: `/api/admin/servers?${params.toString()}`,
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
    
    getServerDetails: function(serverId) {
        return new Promise((resolve, reject) => {
            ajax({
                url: `/api/admin/servers/${serverId}`,
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

    deleteServer: function(serverId) {
        return new Promise((resolve, reject) => {
            ajax({
                url: `/api/admin/servers/${serverId}`,
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
                },
                success: resolve,
                error: reject
            });
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
        return fetch(`/api/servers/${serverId}/channels`, {
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

    updatePerServerProfile: function(serverId, data) {
        return fetch(`/api/servers/${serverId}/profile`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    }
};

export default serverAPI;

window.serverAPI = serverAPI;
