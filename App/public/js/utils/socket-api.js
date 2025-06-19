class SocketApi {
    constructor() {
        this.baseUrl = '/api/socket';
        this.defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }

    async emit(event, data, room = null) {
        try {
            const payload = {
                event,
                data,
                room
            };

            const response = await fetch(`${this.baseUrl}/emit`, {
                method: 'POST',
                ...this.defaultOptions,
                body: JSON.stringify(payload)
            });

            return await response.json();
        } catch (error) {
            console.error('Socket API emit error:', error);
            return { success: false, error: error.message };
        }
    }

    async notifyUser(userId, event, data) {
        try {
            const payload = {
                user_id: userId,
                event,
                data
            };

            const response = await fetch(`${this.baseUrl}/notify-user`, {
                method: 'POST',
                ...this.defaultOptions,
                body: JSON.stringify(payload)
            });

            return await response.json();
        } catch (error) {
            console.error('Socket API notify user error:', error);
            return { success: false, error: error.message };
        }
    }

    async broadcast(event, data) {
        try {
            const payload = {
                event,
                data
            };

            const response = await fetch(`${this.baseUrl}/broadcast`, {
                method: 'POST',
                ...this.defaultOptions,
                body: JSON.stringify(payload)
            });

            return await response.json();
        } catch (error) {
            console.error('Socket API broadcast error:', error);
            return { success: false, error: error.message };
        }
    }

    async broadcastToServer(serverId, event, data) {
        return this.emit(event, data, `server-${serverId}`);
    }

    async broadcastToChannel(channelId, event, data) {
        return this.emit(event, data, `channel-${channelId}`);
    }

    async updateUserStatus(userId, status, activityDetails = null) {
        const data = {
            user_id: userId,
            status,
            timestamp: new Date().toISOString()
        };

        if (activityDetails !== null) {
            data.activity_details = activityDetails;
        }

        return this.broadcast('user-status-changed', data);
    }

    async notifyTyping(channelId, userId, username, isTyping = true) {
        const event = isTyping ? 'typing-start' : 'typing-stop';
        
        return this.broadcastToChannel(channelId, event, {
            user_id: userId,
            username,
            channel_id: channelId,
            timestamp: new Date().toISOString()
        });
    }

    async notifyReaction(channelId, messageId, userId, username, reaction) {
        return this.broadcastToChannel(channelId, 'reaction-added', {
            message_id: messageId,
            user_id: userId,
            username,
            reaction,
            channel_id: channelId,
            timestamp: new Date().toISOString()
        });
    }
}

const socketApi = new SocketApi();
export default socketApi; 