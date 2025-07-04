class VoiceConnectionTracker {
    static connections = new Map();
    static userVoiceStatus = new Map();

    static addUserToVoice(userId, channelId, meetingId, username = null) {
        const userKey = userId.toString();

        
        this.connections.set(userKey, {
            userId: userKey,
            channelId: channelId,
            meetingId: meetingId,
            username: username,
            joinedAt: Date.now(),
            isConnected: true
        });
        
        this.userVoiceStatus.set(userKey, true);

    }

    static removeUserFromVoice(userId) {
        const userKey = userId.toString();

        
        this.connections.delete(userKey);
        this.userVoiceStatus.set(userKey, false);

    }

    static getUserVoiceStatus(userId) {
        const userKey = userId.toString();
        const isConnected = this.connections.has(userKey) && this.connections.get(userKey).isConnected;
        

        if (isConnected) {
            console.log(`🔍 [VOICE-TRACKER] Connection details:`, {
                channelId: this.connections.get(userKey)?.channelId,
                meetingId: this.connections.get(userKey)?.meetingId,
                joinedAt: new Date(this.connections.get(userKey)?.joinedAt).toISOString()
            });
        }
        
        return isConnected;
    }

    static isUserInVoice(userId) {
        const userKey = userId.toString();
        const connection = this.connections.get(userKey);
        const isConnected = connection && connection.isConnected;
        

        if (connection) {
            console.log(`🔍 [VOICE-TRACKER] Connection details:`, {
                channelId: connection.channelId,
                meetingId: connection.meetingId,
                joinedAt: new Date(connection.joinedAt).toISOString()
            });
        }
        
        return isConnected;
    }

    static getUserVoiceConnection(userId) {
        const userKey = userId.toString();
        const connection = this.connections.get(userKey);
        
        if (connection && connection.isConnected) {

            return connection;
        }
        

        return null;
    }

    static getAllConnections() {
        return Array.from(this.connections.values());
    }

    static getChannelParticipants(channelId) {
        const participants = Array.from(this.connections.values())
            .filter(conn => conn.channelId === channelId && conn.isConnected)
            .map(conn => ({
                userId: conn.userId,
                channelId: conn.channelId,
                meetingId: conn.meetingId,
                joinedAt: conn.joinedAt,
                username: conn.username || 'Unknown'
            }));
        

        return participants;
    }

    static cleanup() {
        const now = Date.now();
        const timeout = 30 * 60 * 1000;
        
        for (const [userId, connection] of this.connections.entries()) {
            if (now - connection.joinedAt > timeout) {

                this.removeUserFromVoice(userId);
            }
        }
    }

    static getStats() {
        return {
            totalConnections: this.connections.size,
            activeUsers: Array.from(this.connections.keys()),
            channelDistribution: this.getChannelDistribution()
        };
    }

    static getChannelDistribution() {
        const distribution = {};
        for (const connection of this.connections.values()) {
            if (connection.isConnected) {
                distribution[connection.channelId] = (distribution[connection.channelId] || 0) + 1;
            }
        }
        return distribution;
    }
}

setInterval(() => {
    VoiceConnectionTracker.cleanup();
}, 5 * 60 * 1000);

module.exports = VoiceConnectionTracker; 