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
            const data = JSON.parse(text);
            return this.normalizeResponse(data);
        } catch (e) {
            console.error('Failed to parse JSON response:', text);
            throw new Error('Invalid response from server');
        }
    }
    
    normalizeResponse(data) {
        // Ensure consistent response format
        if (!data) return { success: false, message: "Empty response from server" };
        
        // If data is already properly formatted with success property
        if (typeof data.success !== 'undefined') {
            return data;
        }
        
        // If data is in a different format, try to normalize it
        if (data.error) {
            return { 
                success: false, 
                message: data.error || "An error occurred",
                data: data
            };
        }
        
        // For any other format, assume it's successful data and wrap it
        return {
            success: true,
            message: "Operation successful",
            data: data
        };
    }
    
    normalizeUser(user) {
        if (!user) return null;
        
        // Ensure all user properties have at least a default value
        return {
            id: user.id || 'N/A',
            username: user.username || 'Unknown User',
            discriminator: user.discriminator || '0000',
            email: user.email || 'No Email',
            status: user.status || 'offline',
            display_name: user.display_name || user.username || 'Unknown User',
            bio: user.bio || '',
            avatar_url: user.avatar_url || null,
            banner_url: user.banner_url || null,
            created_at: user.created_at || null,
            updated_at: user.updated_at || null,
            google_id: user.google_id || null,
            ...user // Keep other properties intact
        };
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
            const data = await this.parseResponse(response);
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }

    async listUsers(page = 1, limit = 10, query = '') {
        try {
        let url = `${this.baseURL}/users?page=${page}&limit=${limit}`;
        
            if (query && query.trim() !== '') {
                url += `&q=${encodeURIComponent(query.trim())}`;
        }
        
            const response = await fetch(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });
            
            const data = await this.parseResponse(response);
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
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
window.userAdminAPI = userAdminAPI;