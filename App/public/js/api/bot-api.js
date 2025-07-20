class BotAPI {
    static BASE_URL = '/api';

    static async getBotByUsername(username) {
        const endpoint = `${this.BASE_URL}/bots/public-check/${username}`;
        
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to get bot by username:', error);
            throw error;
        }
    }

    static async isUserBot(userId) {
        try {
            const response = await fetch(`${this.BASE_URL}/users/${userId}/check-bot`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                return false;
            }
            
            const result = await response.json();
            return result.is_bot || false;
        } catch (error) {
            console.error('Failed to check if user is bot:', error);
            return false;
        }
    }

    static async sendBotCommand(channelId, roomId, command, parameter = null) {
        const endpoint = `${this.BASE_URL}/bot/command`;
        
        const data = {
            channel_id: channelId,
            room_id: roomId,
            command: command,
            parameter: parameter
        };
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to send bot command:', error);
            throw error;
        }
    }

    static async getBotStatus(botId) {
        const endpoint = `${this.BASE_URL}/bot/status/${botId}`;
        
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to get bot status:', error);
            throw error;
        }
    }

    static async getMusicQueue(channelId, roomId) {
        const endpoint = `${this.BASE_URL}/bot/music/queue`;
        
        const params = new URLSearchParams();
        if (channelId) params.append('channel_id', channelId);
        if (roomId) params.append('room_id', roomId);
        
        try {
            const response = await fetch(`${endpoint}?${params}`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to get music queue:', error);
            throw error;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BotAPI;
} else if (typeof window !== 'undefined') {
    window.BotAPI = BotAPI;
} 