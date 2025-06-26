const roomManager = require('../services/roomManager');
const AuthHandler = require('./authHandler');

class RoomHandler {
    static joinChannel(io, client, data) {
        if (!AuthHandler.requireAuth(client)) {
            client.emit('error', { message: 'Authentication required' });
            return;
        }
        
        const { channelId } = data;
        if (!channelId) {
            client.emit('error', { message: 'Channel ID is required' });
            return;
        }
        
        const roomName = roomManager.getChannelRoom(channelId);
        roomManager.joinRoom(client, roomName);
        
        client.emit('channel-joined', { 
            channelId,
            room: roomName, 
            message: `Joined channel ${channelId}`
        });
    }

    static leaveChannel(io, client, data) {
        const { channelId } = data;
        if (!channelId) {
            client.emit('error', { message: 'Channel ID is required' });
            return;
        }
        
        const roomName = roomManager.getChannelRoom(channelId);
        roomManager.leaveRoom(client, roomName);
        
        client.emit('channel-left', { 
            channelId,
            message: `Left channel ${channelId}`
        });
    }

    static joinDMRoom(io, client, data) {
        if (!AuthHandler.requireAuth(client)) {
            client.emit('error', { message: 'Authentication required' });
            return;
        }
        
        const { roomId } = data;
        if (!roomId) {
            client.emit('error', { message: 'Room ID is required' });
            return;
        }
        
        const roomName = roomManager.getDMRoom(roomId);
        roomManager.joinRoom(client, roomName);
        
        client.emit('dm-room-joined', { 
            roomId,
            room: roomName, 
            message: `Joined DM room ${roomId}`
        });
    }
}

module.exports = RoomHandler; 