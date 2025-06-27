class RoomManager {
    constructor() {
        this.userSockets = new Map();
        this.voiceMeetings = new Map();
    }

    getUserRoom(userId) {
        return `user-${userId}`;
    }

    getChannelRoom(channelId) {
        return `channel-${channelId}`;
    }

    getDMRoom(roomId) {
        return `dm-room-${roomId}`;
    }

    joinRoom(client, roomName) {
        client.join(roomName);
        console.log(`👥 Client ${client.id} joined room: ${roomName}`);
        
        // Track user sockets for presence management
        if (client.data?.user_id) {
            if (!this.userSockets.has(client.data.user_id)) {
                this.userSockets.set(client.data.user_id, new Set());
            }
            this.userSockets.get(client.data.user_id).add(client.id);
        }
    }

    leaveRoom(client, roomName) {
        client.leave(roomName);
        console.log(`👥 Client ${client.id} left room: ${roomName}`);
    }

    addUserSocket(userId, socketId) {
        if (this.userSockets.has(userId)) {
            this.userSockets.get(userId).add(socketId);
        } else {
            this.userSockets.set(userId, new Set([socketId]));
        }
    }

    removeUserSocket(userId, socketId) {
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
            userSocketSet.delete(socketId);
            
            if (userSocketSet.size === 0) {
                this.userSockets.delete(userId);
                return true; // User is now offline
            }
        }
        
        return false; // User still has other connections
    }

    isUserOnline(userId) {
        return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
    }

    getTargetRoom(data) {
        if (data.channel_id) {
            return this.getChannelRoom(data.channel_id);
        } else if (data.room_id) {
            return this.getDMRoom(data.room_id);
        } else if (data.target_type && data.target_id) {
            if (data.target_type === 'channel') {
                return this.getChannelRoom(data.target_id);
            } else if (data.target_type === 'dm') {
                return this.getDMRoom(data.target_id);
            }
        }
        return null;
    }

    broadcastToRoom(io, roomName, eventName, data) {
        if (!roomName) {
            console.warn(`⚠️ Cannot broadcast to undefined room for event: ${eventName}`);
            return;
        }
        
        console.log(`📡 Broadcasting ${eventName} to room: ${roomName}`);
        io.to(roomName).emit(eventName, data);
    }

    addVoiceMeeting(channelId, meetingId, socketId) {
        if (!this.voiceMeetings.has(channelId)) {
            this.voiceMeetings.set(channelId, {
                meeting_id: meetingId,
                channel_id: channelId,
                participants: new Set()
            });
        }
        
        this.voiceMeetings.get(channelId).participants.add(socketId);
        console.log(`🎤 Added participant to voice meeting in channel ${channelId}`);
    }

    removeVoiceMeeting(channelId, socketId) {
        const meeting = this.voiceMeetings.get(channelId);
        if (meeting) {
            meeting.participants.delete(socketId);
            
            if (meeting.participants.size === 0) {
                this.voiceMeetings.delete(channelId);
                console.log(`🎤 Removed empty voice meeting for channel ${channelId}`);
            }
            
            return {
                removed: true,
                participant_count: meeting.participants.size
            };
        }
        
        return { removed: false, participant_count: 0 };
    }

    getVoiceMeeting(channelId) {
        return this.voiceMeetings.get(channelId);
    }

    getAllVoiceMeetings() {
        return Array.from(this.voiceMeetings.values());
    }
}

module.exports = new RoomManager(); 