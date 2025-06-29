const roomManager = require('../services/roomManager');

class BotHandler {
    static bots = new Map();
    static activeConnections = new Map();
    static processedMessages = new Set();

    static registerBot(botId, username) {
        console.log(`🤖 Registering bot: ${username} (ID: ${botId})`);
        this.bots.set(botId, {
            id: botId,
            username: username,
            status: 'active',
            joinedRooms: new Set(),
            lastActivity: Date.now()
        });
    }

    static connectBot(io, botId, username) {
        const bot = this.bots.get(botId);
        if (!bot) {
            this.registerBot(botId, username);
        }

        console.log(`🔌 Connecting bot ${username} to socket system`);
        
        const botClient = {
            id: `bot-${botId}`,
            data: {
                user_id: botId,
                username: username,
                isBot: true
            },
            emit: (event, data) => {
                console.log(`🤖 Bot ${username} emitting ${event}`);
            },
            to: (room) => ({
                emit: (event, data) => {
                    console.log(`📡 Bot ${username} broadcasting ${event} to room ${room}`);
                    io.to(room).emit(event, data);
                }
            })
        };

        this.activeConnections.set(botId, botClient);
        this.setupBotListeners(io, botId, username);
        return botClient;
    }

    static setupBotListeners(io, botId, username) {
        console.log(`👂 Setting up message listeners for bot ${username}`);

        const existingListeners = io.listeners('bot-message-intercept');
        
        existingListeners.forEach((listener, index) => {
            if (listener.toString().includes('BOT-HANDLER') || listener.toString().includes('handleMessage')) {
                io.removeListener('bot-message-intercept', listener);
            }
        });

        const messageHandler = (data) => {
            const channelId = data.channel_id || (data.target_type === 'channel' ? data.target_id : null);
            const roomId = data.room_id || (data.target_type === 'dm' ? data.target_id : null);
            
            const messageType = channelId ? 'channel' : 'dm';
            BotHandler.handleMessage(io, data, messageType, botId, username);
        };

        io.on('bot-message-intercept', messageHandler);
        console.log(`✅ Bot ${username} is now listening for messages`);
    }

    static handleMessage(io, data, messageType, botId, username) {
        const messageId = data.id || `${data.user_id}-${data.channel_id || data.room_id}-${data.content}`;
        
        if (this.processedMessages.has(messageId)) {
            return;
        }
        
        this.processedMessages.add(messageId);
        
        if (this.processedMessages.size > 100) {
            const oldestMessage = Array.from(this.processedMessages)[0];
            this.processedMessages.delete(oldestMessage);
        }

        const bot = this.bots.get(botId);
        
        if (!bot || data.user_id == botId) {
            return;
        }

        const content = data.content?.toLowerCase().trim();
        
        if (!content) {
            return;
        }

        console.log(`📨 Bot ${username} received message: "${content.substring(0, 50)}..." in ${messageType}`);

        if (content === '/titibot ping') {
            this.respondToPing(io, data, messageType, botId, username);
        } else if (content.startsWith('/titibot play ')) {
            const songName = content.replace('/titibot play ', '').trim();
            this.respondToMusicCommand(io, data, messageType, botId, username, 'play', songName);
        } else if (content === '/titibot stop') {
            this.respondToMusicCommand(io, data, messageType, botId, username, 'stop');
        } else if (content === '/titibot next') {
            this.respondToMusicCommand(io, data, messageType, botId, username, 'next');
        } else if (content === '/titibot prev') {
            this.respondToMusicCommand(io, data, messageType, botId, username, 'prev');
        } else if (content.startsWith('/titibot queue ')) {
            const songName = content.replace('/titibot queue ', '').trim();
            this.respondToMusicCommand(io, data, messageType, botId, username, 'queue', songName);
        }
    }

    static handleCommand(io, commandData) {
        const { command, channel_id, user_id, username } = commandData;

        const titiBotId = this.getTitiBotId();
        if (!titiBotId) {
            console.warn('⚠️ TitiBot not found in active bots');
            return;
        }

        const bot = this.bots.get(titiBotId);
        if (!bot) {
            console.warn('⚠️ TitiBot not registered in handler');
            return;
        }

        if (command === 'ping') {
            const simulatedMessage = {
                channel_id: channel_id,
                user_id: user_id,
                username: username
            };
            
            this.respondToPing(io, simulatedMessage, 'channel', titiBotId, 'titibot');
        }
    }

    static getTitiBotId() {
        for (const [botId, botData] of this.bots.entries()) {
            if (botData.username === 'titibot') {
                return botId;
            }
        }
        return null;
    }

    static async respondToPing(io, originalMessage, messageType, botId, username) {
        const channelId = originalMessage.channel_id || (originalMessage.target_type === 'channel' ? originalMessage.target_id : null);
        const roomId = originalMessage.room_id || (originalMessage.target_type === 'dm' ? originalMessage.target_id : null);

        const responseContent = `🏓 Pong! Hi ${originalMessage.username}, I'm TitiBot and I'm online!`;
        
        const responseData = {
            id: `bot-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: responseContent,
            user_id: botId,
            username: username,
            message_type: 'text',
            timestamp: Date.now(),
            source: 'bot-response',
            avatar_url: '/public/assets/common/default-profile-picture.png',
            sent_at: new Date().toISOString()
        };

        let targetRoom;
        let eventName;

        if (messageType === 'channel' && channelId) {
            targetRoom = roomManager.getChannelRoom(channelId);
            eventName = 'new-channel-message';
            responseData.channel_id = channelId;
        } else if (messageType === 'dm' && roomId) {
            targetRoom = roomManager.getDMRoom(roomId);
            eventName = 'user-message-dm';
            responseData.room_id = roomId;
        }

        if (targetRoom && eventName) {
            console.log(`🚀 Bot ${username} sending ping reply to ${targetRoom}`);
            
            io.to(targetRoom).emit(eventName, responseData);
            
            io.emit('bot-response', {
                content: responseContent,
                channel_id: responseData.channel_id,
                room_id: responseData.room_id,
                username: username
            });
        }
    }

    static async respondToMusicCommand(io, originalMessage, messageType, botId, username, command, songName = null) {
        let responseContent;
        let musicData = null;

        switch (command) {
            case 'play':
                if (!songName) {
                    responseContent = '❌ Please specify a song name. Usage: `/titibot play {song name}`';
                } else {
                    responseContent = `🎵 Playing: "${songName}" (simulated - no external API)`;
                    musicData = {
                        action: 'play',
                        track: {
                            title: songName,
                            artist: 'Unknown Artist',
                            previewUrl: null
                        }
                    };
                }
                break;

            case 'stop':
                responseContent = '⏹️ Music stopped';
                musicData = { action: 'stop' };
                break;

            case 'next':
                responseContent = '⏭️ Playing next song';
                musicData = { action: 'next' };
                break;

            case 'prev':
                responseContent = '⏮️ Playing previous song';
                musicData = { action: 'prev' };
                break;

            case 'queue':
                if (!songName) {
                    responseContent = '❌ Please specify a song name. Usage: `/titibot queue {song name}`';
                } else {
                    responseContent = `➕ Added to queue: "${songName}"`;
                    musicData = {
                        action: 'queue',
                        track: {
                            title: songName,
                            artist: 'Unknown Artist'
                        }
                    };
                }
                break;

            default:
                responseContent = '❌ Unknown music command';
        }

        const responseData = {
            id: `bot-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: responseContent,
            user_id: botId,
            username: username,
            message_type: 'text',
            timestamp: Date.now(),
            source: 'bot-response',
            avatar_url: '/public/assets/common/default-profile-picture.png',
            sent_at: new Date().toISOString()
        };

        if (musicData) {
            responseData.music_data = musicData;
        }

        let targetRoom;
        let eventName;

        const channelId = originalMessage.channel_id || (originalMessage.target_type === 'channel' ? originalMessage.target_id : null);
        const roomId = originalMessage.room_id || (originalMessage.target_type === 'dm' ? originalMessage.target_id : null);

        if (messageType === 'channel' && channelId) {
            targetRoom = roomManager.getChannelRoom(channelId);
            eventName = 'new-channel-message';
            responseData.channel_id = channelId;
        } else if (messageType === 'dm' && roomId) {
            targetRoom = roomManager.getDMRoom(roomId);
            eventName = 'user-message-dm';
            responseData.room_id = roomId;
        }

        if (targetRoom && eventName) {
            console.log(`🎵 Bot ${username} sending music response for ${command}`);
            
            io.to(targetRoom).emit(eventName, responseData);
            
            if (musicData) {
                io.to(targetRoom).emit('bot-music-command', {
                    channel_id: originalMessage.channel_id,
                    music_data: musicData
                });
            }
        }
    }

    static joinBotToRoom(botId, roomType, roomId) {
        const bot = this.bots.get(botId);
        if (!bot) return false;

        const roomKey = `${roomType}-${roomId}`;
        bot.joinedRooms.add(roomKey);
        
        console.log(`🚪 Bot ${bot.username} joined ${roomType} room: ${roomId}`);
        return true;
    }

    static getBotStatus(botId) {
        const bot = this.bots.get(botId);
        return bot || null;
    }
}

module.exports = BotHandler;
