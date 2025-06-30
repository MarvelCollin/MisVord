class VoiceConnectionTracker {
    static connections = new Map();
    static userVoiceStatus = new Map();

    static addUserToVoice(userId, channelId, meetingId) {
        const userKey = userId.toString();
        console.log(`🎤 [VOICE-TRACKER] User ${userKey} joined voice channel ${channelId} (meeting: ${meetingId})`);
        
        this.connections.set(userKey, {
            userId: userKey,
            channelId: channelId,
            meetingId: meetingId,
            joinedAt: Date.now(),
            isConnected: true
        });
        
        this.userVoiceStatus.set(userKey, true);
        console.log(`✅ [VOICE-TRACKER] User ${userKey} voice status: CONNECTED`);
    }

    static removeUserFromVoice(userId) {
        const userKey = userId.toString();
        console.log(`🔇 [VOICE-TRACKER] User ${userKey} left voice channel`);
        
        this.connections.delete(userKey);
        this.userVoiceStatus.set(userKey, false);
        console.log(`✅ [VOICE-TRACKER] User ${userKey} voice status: DISCONNECTED`);
    }

    static getUserVoiceStatus(userId) {
        const userKey = userId.toString();
        return this.userVoiceStatus.get(userKey) || false;
    }

    static isUserInVoice(userId) {
        const userKey = userId.toString();
        const connection = this.connections.get(userKey);
        const isConnected = connection && connection.isConnected;
        
        console.log(`🔍 [VOICE-TRACKER] Checking voice status for user ${userKey}: ${isConnected ? 'CONNECTED' : 'NOT CONNECTED'}`);
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
            console.log(`📋 [VOICE-TRACKER] User ${userKey} voice connection:`, connection);
            return connection;
        }
        
        console.log(`📋 [VOICE-TRACKER] User ${userKey} has no active voice connection`);
        return null;
    }

    static getAllConnections() {
        return Array.from(this.connections.values());
    }

    static getChannelParticipants(channelId) {
        const participants = Array.from(this.connections.values())
            .filter(conn => conn.channelId === channelId && conn.isConnected);
        
        console.log(`👥 [VOICE-TRACKER] Channel ${channelId} has ${participants.length} participants`);
        return participants;
    }

    static cleanup() {
        const now = Date.now();
        const timeout = 30 * 60 * 1000;
        
        for (const [userId, connection] of this.connections.entries()) {
            if (now - connection.joinedAt > timeout) {
                console.log(`🧹 [VOICE-TRACKER] Cleaning up stale connection for user ${userId}`);
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