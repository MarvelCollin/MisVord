class RoomManager {
    constructor() {
        this.userSockets = new Map();
        this.voiceMeetings = new Map();
        console.log(`🏗️ [ROOM-MANAGER] RoomManager initialized`);
    }

    getUserRoom(userId) {
        const userRoom = `user-${userId}`;
        console.log(`👤 [ROOM-MANAGER] Generated user room name: ${userRoom} for user ${userId}`);
        return userRoom;
    }

    getChannelRoom(channelId) {
        const normalizedChannelId = channelId.toString().replace('channel-', '');
        const channelRoom = `channel-${normalizedChannelId}`;
        console.log(`📺 [ROOM-MANAGER] Generated channel room name: ${channelRoom} for channel ${channelId}`);
        return channelRoom;
    }

    getDMRoom(roomId) {
        const normalizedRoomId = roomId.toString().replace('dm-room-', '');
        const dmRoom = `dm-room-${normalizedRoomId}`;
        console.log(`💬 [ROOM-MANAGER] Generated DM room name: ${dmRoom} for room ${roomId}`);
        return dmRoom;
    }

    getVoiceChannelRoom(channelId) {
        const normalizedChannelId = channelId.toString().replace('voice-channel-', '');
        const voiceRoom = `voice-channel-${normalizedChannelId}`;
        console.log(`🎤 [ROOM-MANAGER] Generated voice channel room name: ${voiceRoom} for channel ${channelId}`);
        return voiceRoom;
    }

    joinRoom(client, roomName) {
        console.log(`🚪 [ROOM-MANAGER] Client ${client.id} attempting to join room: ${roomName}`);
        
        if (client.rooms.has(roomName)) {
            console.log(`ℹ️ [ROOM-MANAGER] Client ${client.id} is already in room: ${roomName}`);
            
            try {
                console.log(`🔄 [ROOM-MANAGER] Force rejoining room: ${roomName}`);
                client.leave(roomName);
                client.join(roomName);
                console.log(`✅ [ROOM-MANAGER] Client ${client.id} successfully rejoined room: ${roomName}`);
            } catch (error) {
                console.error(`❌ [ROOM-MANAGER] Error rejoining room: ${error.message}`);
            }   
            return;
        }
        
        try {
            client.join(roomName);
            console.log(`✅ [ROOM-MANAGER] Client ${client.id} successfully joined room: ${roomName}`);
            
            if (client.rooms.has(roomName)) {
                console.log(`✅ [ROOM-MANAGER] Verified client ${client.id} is in room: ${roomName}`);
            } else {
                console.warn(`⚠️ [ROOM-MANAGER] Client ${client.id} not in room after join: ${roomName}`);
                
                console.log(`🔄 [ROOM-MANAGER] Attempting to join room again: ${roomName}`);
                client.join(roomName);
            }
        } catch (error) {
            console.error(`❌ [ROOM-MANAGER] Error joining room: ${error.message}`);
        }
        
        console.log(`🏠 [ROOM-MANAGER] Client ${client.id} rooms:`, Array.from(client.rooms));
        
        if (client.data?.user_id) {
            const userId = client.data.user_id;
            console.log(`👤 [ROOM-MANAGER] Tracking socket ${client.id} for user ${userId}`);
            
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
                console.log(`📝 [ROOM-MANAGER] Created new socket set for user ${userId}`);
            }
            this.userSockets.get(userId).add(client.id);
            
            const socketCount = this.userSockets.get(userId).size;
            console.log(`📊 [ROOM-MANAGER] User ${userId} now has ${socketCount} active socket(s)`);
        } else {
            console.warn(`⚠️ [ROOM-MANAGER] Client ${client.id} has no user_id data for tracking`);
        }
    }

    leaveRoom(client, roomName) {
        console.log(`🚪 [ROOM-MANAGER] Client ${client.id} attempting to leave room: ${roomName}`);
        
        client.leave(roomName);
        console.log(`✅ [ROOM-MANAGER] Client ${client.id} successfully left room: ${roomName}`);
    }

    addUserSocket(userId, socketId) {
        console.log(`👤 [ROOM-MANAGER] Adding socket ${socketId} for user ${userId}`);
        
        if (this.userSockets.has(userId)) {
            this.userSockets.get(userId).add(socketId);
            console.log(`📝 [ROOM-MANAGER] Added socket ${socketId} to existing user ${userId} socket set`);
        } else {
            this.userSockets.set(userId, new Set([socketId]));
            console.log(`📝 [ROOM-MANAGER] Created new socket set for user ${userId} with socket ${socketId}`);
        }
        
        const socketCount = this.userSockets.get(userId).size;
        console.log(`📊 [ROOM-MANAGER] User ${userId} now has ${socketCount} active socket(s)`);
    }

    removeUserSocket(userId, socketId) {
        console.log(`👤 [ROOM-MANAGER] Removing socket ${socketId} for user ${userId}`);
        
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
            userSocketSet.delete(socketId);
            console.log(`🗑️ [ROOM-MANAGER] Removed socket ${socketId} from user ${userId} socket set`);
            
            if (userSocketSet.size === 0) {
                this.userSockets.delete(userId);
                console.log(`🔄 [ROOM-MANAGER] User ${userId} has no more active sockets - marked as offline`);
                return true; 
            } else {
                const socketCount = userSocketSet.size;
                console.log(`📊 [ROOM-MANAGER] User ${userId} still has ${socketCount} active socket(s)`);
            }
        } else {
            console.warn(`⚠️ [ROOM-MANAGER] No socket set found for user ${userId}`);
        }
        
        return false; 
    }

    isUserOnline(userId) {
        const isOnline = this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
        console.log(`👤 [ROOM-MANAGER] User ${userId} online status: ${isOnline}`);
        return isOnline;
    }

    getTargetRoom(data) {
        console.log(`🎯 [ROOM-MANAGER] Determining target room for data:`, {
            channelId: data.channel_id,
            roomId: data.room_id,
            targetType: data.target_type,
            targetId: data.target_id
        });
        
        let targetRoom = null;
        
        if (data.channel_id) {
            targetRoom = this.getChannelRoom(data.channel_id);
            console.log(`🎯 [ROOM-MANAGER] Target room from channel_id: ${targetRoom}`);
        } else if (data.room_id) {
            targetRoom = this.getDMRoom(data.room_id);
            console.log(`🎯 [ROOM-MANAGER] Target room from room_id: ${targetRoom}`);
        } else if (data.target_type && data.target_id) {
            if (data.target_type === 'channel') {
                targetRoom = this.getChannelRoom(data.target_id);
                console.log(`🎯 [ROOM-MANAGER] Target room from target_type channel: ${targetRoom}`);
            } else if (data.target_type === 'dm') {
                targetRoom = this.getDMRoom(data.target_id);
                console.log(`🎯 [ROOM-MANAGER] Target room from target_type dm: ${targetRoom}`);
            }
        }
        
        if (!targetRoom) {
            console.warn(`⚠️ [ROOM-MANAGER] Unable to determine target room from provided data`);
        }
        
        return targetRoom;
    }

    broadcastToRoom(io, roomName, eventName, data) {
        console.log(`📡 [ROOM-MANAGER] Broadcasting event ${eventName} to room ${roomName}`);
        
        if (!roomName) {
            console.warn(`⚠️ [ROOM-MANAGER] Cannot broadcast to undefined room for event: ${eventName}`);
            return;
        }
        
        console.log(`📤 [ROOM-MANAGER] Broadcast details:`, {
            event: eventName,
            room: roomName,
            messageId: data.id || data.message_id || 'N/A',
            userId: data.user_id || 'N/A',
            source: data.source || 'N/A'
        });
        
        io.to(roomName).emit(eventName, data);
        console.log(`✅ [ROOM-MANAGER] Successfully broadcasted ${eventName} to room ${roomName}`);
    }

    addVoiceMeeting(channelId, meetingId, socketId) {
        console.log(`🎤 [ROOM-MANAGER] Adding voice meeting for channel ${channelId}:`, {
            meetingId: meetingId,
            socketId: socketId
        });
        
        if (!this.voiceMeetings.has(channelId)) {
            this.voiceMeetings.set(channelId, {
                meeting_id: meetingId,
                channel_id: channelId,
                participants: new Set()
            });
            console.log(`✅ [ROOM-MANAGER] Created new voice meeting for channel ${channelId}`);
        }
        
        this.voiceMeetings.get(channelId).participants.add(socketId);
        const participantCount = this.voiceMeetings.get(channelId).participants.size;
        console.log(`👤 [ROOM-MANAGER] Added participant ${socketId} to voice meeting in channel ${channelId} (${participantCount} total)`);
    }

    removeVoiceMeeting(channelId, socketId) {
        console.log(`🎤 [ROOM-MANAGER] Removing voice meeting participant from channel ${channelId}:`, {
            socketId: socketId
        });
        
        const meeting = this.voiceMeetings.get(channelId);
        if (meeting) {
            meeting.participants.delete(socketId);
            console.log(`🗑️ [ROOM-MANAGER] Removed participant ${socketId} from voice meeting in channel ${channelId}`);
            
            if (meeting.participants.size === 0) {
                this.voiceMeetings.delete(channelId);
                console.log(`🔄 [ROOM-MANAGER] Removed empty voice meeting for channel ${channelId}`);
            } else {
                const participantCount = meeting.participants.size;
                console.log(`📊 [ROOM-MANAGER] Voice meeting in channel ${channelId} now has ${participantCount} participant(s)`);
            }
            
            return {
                removed: true,
                participant_count: meeting.participants.size
            };
        } else {
            console.warn(`⚠️ [ROOM-MANAGER] No voice meeting found for channel ${channelId}`);
        }
        
        return { removed: false, participant_count: 0 };
    }

    getVoiceMeeting(channelId) {
        console.log(`🎤 [ROOM-MANAGER] Getting voice meeting for channel ${channelId}`);
        
        const meeting = this.voiceMeetings.get(channelId);
        if (meeting) {
            console.log(`✅ [ROOM-MANAGER] Voice meeting found for channel ${channelId}:`, {
                meetingId: meeting.meeting_id,
                participantCount: meeting.participants.size
            });
        } else {
            console.log(`📭 [ROOM-MANAGER] No voice meeting found for channel ${channelId}`);
        }
        
        return meeting;
    }

    getAllVoiceMeetings() {
        const meetings = Array.from(this.voiceMeetings.values());
        console.log(`🎤 [ROOM-MANAGER] Getting all voice meetings (${meetings.length} total)`);
        
        meetings.forEach((meeting, index) => {
            console.log(`📊 [ROOM-MANAGER] Voice meeting ${index + 1}:`, {
                channelId: meeting.channel_id,
                meetingId: meeting.meeting_id,
                participantCount: meeting.participants.size
            });
        });
        
        return meetings;
    }
}

module.exports = new RoomManager();