class BotAPI {
    constructor() {
        this.baseURL = '/api/bots';
    }

    async parseResponse(response) {
        const text = await response.text();

        if (text.trim().startsWith('<') || text.includes('<!DOCTYPE')) {
            console.error('Server returned HTML instead of JSON');
            throw new Error('Server error occurred. Please try again.');
        }

        if (text.includes('Fatal error') || text.includes('Parse error')) {
            console.error('Server returned PHP error');
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
                console.error(`API endpoint not found: ${url}`);
                return {
                    success: false,
                    error: {
                        code: 404,
                        message: `API endpoint not found: ${url}`
                    }
                };
            }

            if (response.status === 500) {
                console.error('Server error occurred:', url);
                return {
                    success: false,
                    error: {
                        code: 500,
                        message: 'Internal server error occurred. Please try again later.'
                    }
                };
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
            let errorMessage = error.message;
            if (error.message === '[object Object]') {
                errorMessage = 'Unknown server error occurred';
            }

            console.error(`Bot API request to ${url} failed:`, errorMessage);
            throw error;
        }
    }

    async createBot(botData) {
        return await this.makeRequest(`${this.baseURL}/create`, {
            method: 'POST',
            body: JSON.stringify(botData)
        });
    }

    async checkBot(username) {
        return await this.makeRequest(`${this.baseURL}/check/${encodeURIComponent(username)}`);
    }

    async listBots(limit = 50) {
        return await this.makeRequest(`${this.baseURL}?limit=${limit}`);
    }

    async addToServer(botId, serverId) {
        return await this.makeRequest(`${this.baseURL}/add-to-server`, {
            method: 'POST',
            body: JSON.stringify({
                bot_id: botId,
                server_id: serverId
            })
        });
    }

    async removeFromServer(botId, serverId) {
        return await this.makeRequest(`${this.baseURL}/remove-from-server`, {
            method: 'POST',
            body: JSON.stringify({
                bot_id: botId,
                server_id: serverId
            })
        });
    }

    async deleteBot(botId) {
        return await this.makeRequest(`${this.baseURL}/${botId}`, {
            method: 'DELETE'
        });
    }
}

const botAPI = new BotAPI();
window.botAPI = botAPI;
