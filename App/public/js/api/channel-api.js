class ChannelAPI {
    constructor() {
        this.baseURL = '/api/channels';
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
            console.error('Channel API request failed:', error);
            throw error;
        }
    }

    async getChannelContent(serverId, channelId, type = 'text') {
        if (!serverId || !channelId) {
            console.error('Missing required parameters', { serverId, channelId });
            throw new Error('Server ID and Channel ID are required');
        }
        
        try {
            const url = `/api/channel-content?server_id=${encodeURIComponent(serverId)}&channel_id=${encodeURIComponent(channelId)}&type=${encodeURIComponent(type)}`;
            console.log('Requesting channel content from:', url);
            
            const response = await this.makeRequest(url, {
                method: 'GET'
            });
            
            console.log('Raw channel API response:', response);
            
            if (response && response.success) {
                if (!response.data.channel_name && response.data.channel && response.data.channel.name) {
                    console.log('Channel name found in nested object, moving to top level for consistency');
                    response.data.channel_name = response.data.channel.name;
                }
                
                if (!response.data && response.channel_name) {
                    console.log('Channel name found at root level, restructuring response');
                    response.data = {
                        channel_name: response.channel_name,
                        ...response
                    };
                }
            }
            
            return response;
        } catch (error) {
            console.error('Error in getChannelContent:', error);
            throw error;
        }
    }

    async createChannel(channelData) {
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
    }

    async createCategory(categoryData) {
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

const channelAPI = new ChannelAPI();
window.channelAPI = channelAPI;
