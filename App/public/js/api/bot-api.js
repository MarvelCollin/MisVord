class BotAPI {
    constructor() {
        this.baseURL = '/api/bots';
        console.log('🤖 BotAPI initialized (Limited AJAX for bot check only)');
    }

    async checkBot(username) {
        try {
            const response = await fetch(`${this.baseURL}/check/${encodeURIComponent(username)}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
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
            console.error(`Bot check failed for ${username}:`, error.message);
            return {
                success: false,
                message: error.message || 'Failed to check bot status'
            };
        }
    }

    async createBot(botData) {
        console.log('🤖 Bot creation via AJAX disabled');
        return {
            success: false,
            message: 'Bot creation via AJAX has been disabled. Use WebSocket methods instead.'
        };
    }

    async listBots(limit = 50) {
        console.log('🤖 Bot listing via AJAX disabled');
        return {
            success: false,
            message: 'Bot listing via AJAX has been disabled. Use WebSocket methods instead.'
        };
    }

    async addToServer(botId, serverId) {
        console.log('🤖 Add to server via AJAX disabled');
        return {
            success: false,
            message: 'Add to server via AJAX has been disabled. Use WebSocket methods instead.'
        };
    }

    async removeFromServer(botId, serverId) {
        console.log('🤖 Remove from server via AJAX disabled');
        return {
            success: false,
            message: 'Remove from server via AJAX has been disabled. Use WebSocket methods instead.'
        };
    }

    async deleteBot(botId) {
        console.log('🤖 Bot deletion via AJAX disabled');
        return {
            success: false,
            message: 'Bot deletion via AJAX has been disabled. Use WebSocket methods instead.'
        };
    }
}

const botAPI = new BotAPI();
window.botAPI = botAPI;
