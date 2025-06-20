class DirectMessageAPI {
    constructor() {
        this.baseURL = '/api/direct-messages';
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
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: errorText || 'Unknown error occurred' };
                }
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            if (!text) {
                return {};
            }

            try {
                return JSON.parse(text);
            } catch (parseError) {
                console.error('Failed to parse JSON response:', text);
                throw new Error('Invalid JSON response received');
            }
        } catch (error) {
            console.error('Direct Message API request failed:', error);
            throw error;
        }
    }

    async createDirectMessage(messageData) {
        return await this.makeRequest('/api/direct-messages/create', {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }
}

window.DirectMessageAPI = new DirectMessageAPI();
