/**
 * Server API module for handling server-related API calls
 */

const serverAPI = {
    /**
     * Create a new server
     * @param {FormData} formData - Server form data
     * @returns {Promise} - Promise with server creation response
     */
    createServer: function(formData) {
        return fetch('/api/servers/create', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    /**
     * Get server page HTML
     * @param {number} serverId - Server ID
     * @returns {Promise} - Promise with server page HTML
     */
    getServerPageHTML: function(serverId) {
        return fetch(`/server/${serverId}?render_html=1`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        });
    },
    
    /**
     * Get server statistics
     * @returns {Promise} - Promise with server statistics
     */
    getStats: function() {
        return fetch('/api/admin/servers/stats', {
            method: 'GET',
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
    
    /**
     * List servers with pagination
     * @param {number} page - Page number
     * @param {number} limit - Number of servers per page
     * @param {string} search - Search query
     * @returns {Promise} - Promise with servers list
     */
    listServers: function(page = 1, limit = 10, search = '') {
        const params = new URLSearchParams({
            page,
            limit,
            q: search
        });
        
        return fetch(`/api/admin/servers?${params.toString()}`, {
            method: 'GET',
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
    
    /**
     * Delete a server (admin API)
     * @param {number} serverId - Server ID
     * @returns {Promise} - Promise with deletion response
     */
    deleteServer: function(serverId) {
        return fetch(`/api/admin/servers/${serverId}`, {
            method: 'DELETE',
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
    
    /**
     * Delete a server (user API)
     * @param {number} serverId - Server ID
     * @returns {Promise} - Promise with deletion response
     */
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
    }
};

export default serverAPI;

window.serverAPI = serverAPI;
