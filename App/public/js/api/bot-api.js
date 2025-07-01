class BotAPI {
    constructor() {
        this.baseURL = '/api/bots';
    }

    async checkBot(username) {
        try {
            const response = await fetch(`${this.baseURL}/check/${encodeURIComponent(username)}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const text = await response.text();
            
            if (text.trim().startsWith('<') || text.includes('<!DOCTYPE')) {
                throw new Error('Server returned HTML instead of JSON');
            }

            if (!text) {
                return { success: false, message: 'Empty response from server' };
            }

            return JSON.parse(text);
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to check bot status'
            };
        }
    }

    async createBot(botData) {
        return {
            success: false,
            message: 'Bot creation via AJAX has been disabled. Use WebSocket methods instead.'
        };
    }

    async listBots(limit = 50) {
        return {
            success: false,
            message: 'Bot listing via AJAX has been disabled. Use WebSocket methods instead.'
        };
    }

    async addToServer(botId, serverId) {
        return {
            success: false,
            message: 'Add to server via AJAX has been disabled. Use WebSocket methods instead.'
        };
    }

    async removeFromServer(botId, serverId) {
        return {
            success: false,
            message: 'Remove from server via AJAX has been disabled. Use WebSocket methods instead.'
        };
    }

    async deleteBot(botId) {
        return {
            success: false,
            message: 'Bot deletion via AJAX has been disabled. Use WebSocket methods instead.'
        };
    }
}

const botAPI = new BotAPI();
window.botAPI = botAPI;
