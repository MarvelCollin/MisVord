class VoiceConnectionTracker {
    static connections = new Map();
    static userVoiceStatus = new Map();
    static botConnections = new Map();
    static participantStates = new Map();

    static addUserToVoice(userId, channelId, meetingId, username = null, avatarUrl = null) {
        const userKey = userId.toString();

        this.connections.set(userKey, {
            userId: userKey,
            channelId: channelId,
            meetingId: meetingId,
            username: username,
            avatar_url: avatarUrl || '/public/assets/common/default-profile-picture.png',
            joinedAt: Date.now(),
            isConnected: true,
            isBot: false
        });
        
        this.userVoiceStatus.set(userKey, true);
        
        this.participantStates.set(userKey, {
            isMuted: false,
            isDeafened: false,
            lastUpdated: Date.now()
        });
    }
    
    static updateParticipantState(userId, type, state) {
        const userKey = userId.toString();
        
        if (!this.participantStates.has(userKey)) {
            this.participantStates.set(userKey, {
                isMuted: false,
                isDeafened: false,
                lastUpdated: Date.now()
            });
        }
        
        const currentState = this.participantStates.get(userKey);
        
        if (type === 'mic') {
            currentState.isMuted = !state;
        } else if (type === 'deafen') {
            currentState.isDeafened = state;
        }
        
        currentState.lastUpdated = Date.now();
        
        console.log(`🔊 [VOICE-TRACKER] Updated participant state for ${userKey}:`, currentState);
    }
    
    static getParticipantState(userId) {
        const userKey = userId.toString();
        return this.participantStates.get(userKey) || {
            isMuted: false,
            isDeafened: false,
            lastUpdated: null
        };
    }

    static removeUserFromVoice(userId) {
        const userKey = userId.toString();

        this.connections.delete(userKey);
        this.userVoiceStatus.set(userKey, false);
        this.participantStates.delete(userKey);
    }

    static addBotToVoice(botId, channelId, meetingId, username = null) {
        const botKey = `bot-${botId}`;

        this.botConnections.set(botKey, {
            userId: botId.toString(),
            channelId: channelId,
            meetingId: meetingId,
            username: username,
            avatar_url: '/public/assets/landing-page/robot.webp', 
            joinedAt: Date.now(),
            isConnected: true,
            isBot: true
        });

        this.connections.set(botKey, this.botConnections.get(botKey));
    }

    static removeBotFromVoice(botId, channelId) {
        const botKey = `bot-${botId}`;

        this.botConnections.delete(botKey);
        this.connections.delete(botKey);
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
                username: conn.username || 'Unknown',
                avatar_url: conn.avatar_url || '/public/assets/common/default-profile-picture.png',
                isBot: conn.isBot || false
            }));
        
        return participants;
    }

    static getHumanParticipants(channelId) {
        const participants = Array.from(this.connections.values())
            .filter(conn => conn.channelId === channelId && conn.isConnected && !conn.isBot)
            .map(conn => ({
                userId: conn.userId,
                channelId: conn.channelId,
                meetingId: conn.meetingId,
                joinedAt: conn.joinedAt,
                username: conn.username || 'Unknown',
                avatar_url: conn.avatar_url || '/public/assets/common/default-profile-picture.png'
            }));
        
        return participants;
    }

    static getBotParticipants(channelId) {
        const participants = Array.from(this.botConnections.values())
            .filter(conn => conn.channelId === channelId && conn.isConnected)
            .map(conn => ({
                userId: conn.userId,
                channelId: conn.channelId,
                meetingId: conn.meetingId,
                joinedAt: conn.joinedAt,
                username: conn.username || 'Bot',
                isBot: true
            }));
        
        return participants;
    }

    static cleanup() {
        const now = Date.now();
        const timeout = 30 * 60 * 1000;
        
        for (const [userId, connection] of this.connections.entries()) {
            if (now - connection.joinedAt > timeout) {
                if (connection.isBot) {
                    this.removeBotFromVoice(connection.userId, connection.channelId);
                } else {
                    this.removeUserFromVoice(userId);
                }
            }
        }
    }

    static getStats() {
        return {
            totalConnections: this.connections.size,
            humanConnections: this.connections.size - this.botConnections.size,
            botConnections: this.botConnections.size,
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