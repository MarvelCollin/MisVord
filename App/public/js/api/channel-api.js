class ChannelAPI {
    constructor() {
        this.baseURL = '/api/channels';
    }    async makeRequest(url, options = {}) {
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
            console.error('Channel API request failed:', error);
            throw error;
        }
    }    async createChannel(channelData) {
        return await this.makeRequest('/api/channels', {
            method: 'POST',
            body: channelData
        });
    }

    async updateChannel(channelId, channelData) {
        return await this.makeRequest(`/api/channels/${channelId}`, {
            method: 'PUT',
            body: JSON.stringify(channelData)
        });
    }

    async deleteChannel(channelId) {
        return await this.makeRequest(`/api/channels/${channelId}`, {
            method: 'DELETE'
        });
    }

    async updateChannelPosition(positionData) {
        return await this.makeRequest('/api/channels/position', {
            method: 'POST',
            body: JSON.stringify(positionData)
        });
    }

    async updateChannelCategory(channelData) {
        return await this.makeRequest('/api/channels/category', {
            method: 'POST',
            body: JSON.stringify(channelData)
        });
    }    async createCategory(categoryData) {
        return await this.makeRequest('/api/categories', {
            method: 'POST',
            body: categoryData
        });
    }

    async updateCategoryPosition(positionData) {
        return await this.makeRequest('/api/categories/position', {
            method: 'POST',
            body: JSON.stringify(positionData)
        });
    }

    async updateBatchPositions(positionData) {
        return await this.makeRequest('/api/positions/batch', {
            method: 'POST',
            body: JSON.stringify(positionData)
        });
    }
}

window.ChannelAPI = new ChannelAPI();
