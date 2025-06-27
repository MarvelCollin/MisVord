const roomManager = require('../services/roomManager');
const AuthHandler = require('./authHandler');

class RoomHandler {
    static joinChannel(io, client, data) {
        const { channel_id } = data;
        if (!channel_id) {
            client.emit('error', { message: 'Channel ID is required' });
            return;
        }
        
        const roomName = roomManager.getChannelRoom(channel_id);
        roomManager.joinRoom(client, roomName);
        
        client.emit('channel-joined', { 
            channel_id,
            room: roomName, 
            message: `Joined channel ${channel_id}`
        });
    }

    static leaveChannel(io, client, data) {
        const { channel_id } = data;
        if (!channel_id) {
            client.emit('error', { message: 'Channel ID is required' });
            return;
        }
        
        const roomName = roomManager.getChannelRoom(channel_id);
        roomManager.leaveRoom(client, roomName);
        
        client.emit('channel-left', { 
            channel_id,
            message: `Left channel ${channel_id}`
        });
    }

    static joinDMRoom(io, client, data) {
        const { room_id } = data;
        if (!room_id) {
            client.emit('error', { message: 'Room ID is required' });
            return;
        }
        
        const roomName = roomManager.getDMRoom(room_id);
        roomManager.joinRoom(client, roomName);
        
        client.emit('dm-room-joined', { 
            room_id,
            room: roomName, 
            message: `Joined DM room ${room_id}`
        });
    }
}

module.exports = RoomHandler; 