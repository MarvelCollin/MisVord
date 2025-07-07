class RoomManager {
    constructor() {
        this.userSockets = new Map();
        this.voiceMeetings = new Map();

    }

    getUserRoom(userId) {
        const userRoom = `user-${userId}`;

        return userRoom;
    }

    getChannelRoom(channelId) {
        const normalizedChannelId = channelId.toString().replace('channel-', '');
        const channelRoom = `channel-${normalizedChannelId}`;

        return channelRoom;
    }

    getDMRoom(roomId) {
        const normalizedRoomId = roomId.toString().replace('dm-room-', '');
        const dmRoom = `dm-room-${normalizedRoomId}`;

        return dmRoom;
    }

    getVoiceChannelRoom(channelId) {

        const normalizedChannelId = channelId.toString().replace('voice_channel_', '');
        const voiceRoom = `voice_channel_${normalizedChannelId}`;

        return voiceRoom;
    }

    joinRoom(client, roomName) {


        if (client.rooms.has(roomName)) {


            try {

                client.leave(roomName);
                client.join(roomName);

            } catch (error) {
                console.error(`❌ [ROOM-MANAGER] Error rejoining room: ${error.message}`);
            }
            return;
        }

        try {
            client.join(roomName);


            if (client.rooms.has(roomName)) {

            } else {
                console.warn(`⚠️ [ROOM-MANAGER] Client ${client.id} not in room after join: ${roomName}`);


                client.join(roomName);
            }
        } catch (error) {
            console.error(`❌ [ROOM-MANAGER] Error joining room: ${error.message}`);
        }



        if (client.data?.user_id) {
            const userId = client.data.user_id;


            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());

            }
            this.userSockets.get(userId).add(client.id);

            const socketCount = this.userSockets.get(userId).size;

        } else {
            console.warn(`⚠️ [ROOM-MANAGER] Client ${client.id} has no user_id data for tracking`);
        }
    }

    leaveRoom(client, roomName) {


        client.leave(roomName);

    }

    addUserSocket(userId, socketId) {


        if (this.userSockets.has(userId)) {
            this.userSockets.get(userId).add(socketId);

        } else {
            this.userSockets.set(userId, new Set([socketId]));

        }

        const socketCount = this.userSockets.get(userId).size;

    }

    removeUserSocket(userId, socketId) {


        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
            userSocketSet.delete(socketId);


            if (userSocketSet.size === 0) {
                this.userSockets.delete(userId);

                return true;
            } else {
                const socketCount = userSocketSet.size;

            }
        } else {
            console.warn(`⚠️ [ROOM-MANAGER] No socket set found for user ${userId}`);
        }

        return false;
    }

    isUserOnline(userId) {
        const isOnline = this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;

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

        } else if (data.room_id) {
            targetRoom = this.getDMRoom(data.room_id);

        } else if (data.target_type && data.target_id) {
            if (data.target_type === 'channel') {
                targetRoom = this.getChannelRoom(data.target_id);

            } else if (data.target_type === 'dm') {
                targetRoom = this.getDMRoom(data.target_id);

            }
        }

        if (!targetRoom) {
            console.warn(`⚠️ [ROOM-MANAGER] Unable to determine target room from provided data`);
        }

        return targetRoom;
    }

    broadcastToRoom(io, roomName, eventName, data) {


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

        }

        this.voiceMeetings.get(channelId).participants.add(socketId);
        const participantCount = this.voiceMeetings.get(channelId).participants.size;

    }

    removeVoiceMeeting(channelId, socketId) {
        console.log(`🎤 [ROOM-MANAGER] Removing voice meeting participant from channel ${channelId}:`, {
            socketId: socketId
        });

        const meeting = this.voiceMeetings.get(channelId);
        if (meeting) {
            meeting.participants.delete(socketId);


            if (meeting.participants.size === 0) {
                this.voiceMeetings.delete(channelId);

            } else {
                const participantCount = meeting.participants.size;

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


        const meeting = this.voiceMeetings.get(channelId);
        if (meeting) {
            console.log(`✅ [ROOM-MANAGER] Voice meeting found for channel ${channelId}:`, {
                meetingId: meeting.meeting_id,
                participantCount: meeting.participants.size
            });
        } else {

        }

        return meeting;
    }

    getAllVoiceMeetings() {
        const meetings = Array.from(this.voiceMeetings.values());


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