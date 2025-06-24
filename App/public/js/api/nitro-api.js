class NitroAPI {
    constructor() {
        this.baseURL = '/api/admin/nitro';
    }

    async makeRequest(url, options = {}) {
        try {
            const defaultOptions = {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
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

            console.log(`Making request to ${url}`, mergedOptions);
            const response = await fetch(url, mergedOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // Try to handle non-JSON responses
                const text = await response.text();
                console.error('Non-JSON response:', text.substring(0, 500));
                throw new Error('Server returned non-JSON response');
            }
            
            const text = await response.text();
            
            try {
                const data = JSON.parse(text);
                return data;
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Raw response:', text.substring(0, 500));
                throw new Error('Failed to parse JSON response');
            }
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
