class UserAdminAPI {
    constructor() {
        this.baseURL = '/api/admin';
    }

    async parseResponse(response) {
        const text = await response.text();

        if (text.trim().startsWith('<') || text.includes('<br />') || text.includes('</html>')) {
            console.error('Server returned HTML instead of JSON:', text.substring(0, 200));
            throw new Error('Server error occurred. Please try again.');
        }

        if (text.includes('Fatal error') || text.includes('Parse error')) {
            console.error('Server returned PHP error:', text.substring(0, 200));
            throw new Error('Server configuration error. Please contact support.');
        }

        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON response:', text);
            throw new Error('Invalid response from server');
        }
    }

    async makeRequest(url, options = {}) {
        try {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            };

            const mergedOptions = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            };

            const response = await fetch(url, mergedOptions);
            const data = await this.parseResponse(response);

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || data.error || `HTTP error! status: ${response.status}`,
                    status: response.status,
                    data: data
                };
            }

            return data;
        } catch (error) {
            console.error(`Admin API request to ${url} failed:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getStats() {
        return await this.makeRequest(`${this.baseURL}/stats`);
    }

    async listUsers(page = 1, limit = 10, search = '', status = 'all') {
        let url = `${this.baseURL}/users?page=${page}&limit=${limit}`;
        if (search) {
            url += `&q=${encodeURIComponent(search)}`;
        }
        if (status && status !== 'all') {
            url += `&status=${encodeURIComponent(status)}`;
        }
        return await this.makeRequest(url);
    }

    async getUser(userId) {
        return await this.makeRequest(`${this.baseURL}/users/${userId}`);
    }

    async toggleUserBan(userId) {
        return await this.makeRequest(`${this.baseURL}/users/${userId}/toggle-ban`, {
            method: 'POST'
        });
    }

    async deleteUser(userId) {
        return await this.makeRequest(`${this.baseURL}/users/${userId}`, {
            method: 'DELETE'
        });
    }

    async listServers(page = 1, limit = 10, search = '') {
        let url = `${this.baseURL}/servers?page=${page}&limit=${limit}`;
        if (search) {
            url += `&q=${encodeURIComponent(search)}`;
        }
        return await this.makeRequest(url);
    }

    async deleteServer(serverId) {
        return await this.makeRequest(`${this.baseURL}/servers/${serverId}`, {
            method: 'DELETE'
        });
    }

    normalizeUser(user) {
        return {
            id: user.id || 'N/A',
            username: user.username || 'Unknown User',
            discriminator: user.discriminator || '0000',
            email: user.email || 'No Email',
            status: user.status || 'offline',
            display_name: user.display_name || user.username || 'Unknown User',
            avatar_url: user.avatar_url || null,
            banner_url: user.banner_url || null,
            bio: user.bio || '',
            created_at: user.created_at || null,
            updated_at: user.updated_at || null
        };
    }
}

const userAdminAPI = new UserAdminAPI();
window.userAdminAPI = userAdminAPI;