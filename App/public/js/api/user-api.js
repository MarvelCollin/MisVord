class UserAPI {
    constructor() {
        this.baseURL = '/api/users';
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
            
            if (response.status === 404) {
                console.error('API endpoint not found:', url);
                throw new Error(`API endpoint not found: ${url}`);
            }
            
            if (response.status === 500) {
                console.error('Server error occurred:', url);
                throw new Error(`Internal server error occurred. Please try again later.`);
            }
            
            const data = await this.parseResponse(response);
            
            if (!response.ok) {
                const errorMessage = data && (data.error || data.message) ? 
                    (data.error || data.message) : 
                    `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            // Format error message 
            let errorMessage = error.message;
            if (error.message === '[object Object]') {
                errorMessage = 'Unknown server error occurred';
            }
            
            console.error(`User API request to ${url} failed:`, errorMessage);
            throw error;
        }
    }

    async getUserProfile(userId, serverId = null) {
        let url = `/api/users/${userId}/profile`;
        
        if (serverId) {
            url += `?server_id=${serverId}`;
        }
        
        return await this.makeRequest(url);
    }
    
    async getMutualRelations(userId) {
        return await this.makeRequest(`/api/users/${userId}/mutual`);
    }
}

const userAPI = new UserAPI();
export default userAPI;
