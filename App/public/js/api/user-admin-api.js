class UserAdminAPI {
    constructor() {
        this.baseURL = '/api/admin';
    }

    async parseResponse(response) {
        const text = await response.text();
        
        if (text.trim().startsWith('<') || text.includes('<br />') || text.includes('</html>') || text.includes('<!DOCTYPE')) {
            console.error('Server returned HTML instead of JSON:', text.substring(0, 200));
            throw new Error('Server error occurred. Please try again.');
        }
        
        if (text.includes('Fatal error') || text.includes('Parse error') || text.includes('Warning:') || text.includes('Notice:')) {
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
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            };

            if (!(options.body instanceof FormData)) {
                defaultOptions.headers['Content-Type'] = 'application/json';
            }

            const mergedOptions = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            };

            if (options.body instanceof FormData) {
                delete mergedOptions.headers['Content-Type'];
            }

            const response = await fetch(url, mergedOptions);
            const data = await this.parseResponse(response);
            
            if (!response.ok) {
                const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error('User Admin API request failed:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const response = await fetch(`${this.baseURL}/users/stats`);
            return await response.json();
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }

    async listUsers(page = 1, limit = 10, query = '') {
        let url = `${this.baseURL}/users?page=${page}&limit=${limit}`;
        
        if (query) {
            url += `&q=${encodeURIComponent(query)}`;
        }
        
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Error listing users:', error);
            throw error;
        }
    }

    async getUser(userId) {
        try {
            const response = await fetch(`${this.baseURL}/users/${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    }

    async toggleUserBan(userId) {
        try {
            const response = await fetch(`${this.baseURL}/users/${userId}/toggle-ban`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error toggling user ban status:', error);
            throw error;
        }
    }

    async updateUser(userId, userData) {
        return await this.makeRequest(`${this.baseURL}/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(userId) {
        return await this.makeRequest(`${this.baseURL}/users/${userId}`, {
            method: 'DELETE'
        });
    }
}

const userAdminAPI = new UserAdminAPI();
export default userAdminAPI; 