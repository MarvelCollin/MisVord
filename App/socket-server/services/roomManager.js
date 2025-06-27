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
        console.log(`Client ${client.id} joined room: ${roomName}`);
    }

    leaveRoom(client, roomName) {
        client.leave(roomName);
        console.log(`Client ${client.id} left room: ${roomName}`);
    }

    addUserSocket(userId, socketId) {
        if (this.userSockets.has(userId)) {
            this.userSockets.get(userId).add(socketId);
        } else {
            this.userSockets.set(userId, new Set([socketId]));
        }
    }

    removeUserSocket(userId, socketId) {
        if (this.userSockets.has(userId)) {
            this.userSockets.get(userId).delete(socketId);
            if (this.userSockets.get(userId).size === 0) {
                this.userSockets.delete(userId);
                return true;
            }
        }
        return false;
    }

    isUserOnline(userId) {
        return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
    }

    getTargetRoom(data) {
        if (!data) {
            console.warn('⚠️ [ROOM] No data provided to getTargetRoom');
            return null;
        }
        
        if (data.target_type === 'channel' && data.target_id) {
            const room = this.getChannelRoom(data.target_id);
            console.log(`🎯 [ROOM] Target room for channel ${data.target_id}: ${room}`);
            return room;
        }
        if ((data.target_type === 'dm' || data.target_type === 'direct') && data.target_id) {
            const room = this.getDMRoom(data.target_id);
            console.log(`🎯 [ROOM] Target room for DM ${data.target_id}: ${room}`);
            return room;
        }
        if (data.roomId) {
            const room = this.getDMRoom(data.roomId);
            console.log(`🎯 [ROOM] Target room for roomId ${data.roomId}: ${room}`);
            return room;
        }
        if (data.channelId) {
            const room = this.getChannelRoom(data.channelId);
            console.log(`🎯 [ROOM] Target room for channelId ${data.channelId}: ${room}`);
            return room;
        }
        if (data.chatRoomId) {
            const room = this.getDMRoom(data.chatRoomId);
            console.log(`🎯 [ROOM] Target room for chatRoomId ${data.chatRoomId}: ${room}`);
            return room;
        }
        if (data.channel_id) {
            const room = this.getChannelRoom(data.channel_id);
            console.log(`🎯 [ROOM] Target room for channel_id ${data.channel_id}: ${room}`);
            return room;
        }
        
        console.warn('⚠️ [ROOM] Could not determine target room from data:', data);
        return null;
    }

    broadcastToRoom(io, roomName, eventName, data) {
        if (!roomName) {
            console.warn('⚠️ [BROADCAST] No room name provided');
            return;
        }
        
        io.to(roomName).emit(eventName, data);
        console.log(`📡 [BROADCAST] ${eventName} to room: ${roomName}`);
    }

    addVoiceMeeting(channelId, meetingId, socketId) {
        if (!this.voiceMeetings.has(channelId)) {
            this.voiceMeetings.set(channelId, {
                meetingId,
                participants: new Set([socketId])
            });
        } else {
            this.voiceMeetings.get(channelId).participants.add(socketId);
        }
    }

    removeVoiceMeeting(channelId, socketId) {
        if (this.voiceMeetings.has(channelId)) {
            const meeting = this.voiceMeetings.get(channelId);
            meeting.participants.delete(socketId);
            
            if (meeting.participants.size === 0) {
                this.voiceMeetings.delete(channelId);
                return { removed: true, participantCount: 0 };
            }
            
            return { removed: false, participantCount: meeting.participants.size };
        }
        return { removed: false, participantCount: 0 };
    }

    getVoiceMeeting(channelId) {
        return this.voiceMeetings.get(channelId) || null;
    }

    getAllVoiceMeetings() {
        return Array.from(this.voiceMeetings.entries()).map(([channelId, meeting]) => ({
            channelId,
            meetingId: meeting.meetingId,
            participantCount: meeting.participants.size
        }));
    }
}

module.exports = new RoomManager(); 