class NitroAPI {
    constructor() {
        this.baseURL = '/api/admin/nitro';
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
            console.error('Nitro API request failed:', error);
            throw error;
        }
    }

    async getStats() {
        return await this.makeRequest(`${this.baseURL}/stats`);
    }

    async listCodes(page = 1, limit = 10, search = '') {
        const params = new URLSearchParams({
            page, 
            limit,
            search
        });
        return await this.makeRequest(`${this.baseURL}/list?${params.toString()}`);
    }

    async generateCode(userId = null) {
        const formData = new FormData();
        if (userId) {
            formData.append('user_id', userId);
        }
        
        return await this.makeRequest(`${this.baseURL}/generate`, {
            method: 'POST',
            body: formData
        });
    }

    async deleteCode(codeId) {
        return await this.makeRequest(`${this.baseURL}/delete/${codeId}`, {
            method: 'DELETE'
        });
    }

    async redeemCode(code) {
        return await this.makeRequest(`${this.baseURL}/redeem`, {
            method: 'POST',
            body: JSON.stringify({ code })
        });
    }
}

const nitroAPI = new NitroAPI();
export default nitroAPI;
