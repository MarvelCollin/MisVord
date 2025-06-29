const roomManager = require('../services/roomManager');

class BotHandler {
    static bots = new Map();
    static activeConnections = new Map();
    static processedMessages = new Set();

    static registerBot(botId, username) {
        console.log(`🤖 [BOT-HANDLER] Registering bot: ${username} (ID: ${botId})`);
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

        console.log(`🔌 [BOT-HANDLER] Connecting bot ${username} to socket system`);
        
        const botClient = {
            id: `bot-${botId}`,
            data: {
                user_id: botId,
                username: username,
                isBot: true
            },
            emit: (event, data) => {
                console.log(`🤖 [BOT-EMIT] Bot ${username} emitting ${event}:`, data);
            },
            to: (room) => ({
                emit: (event, data) => {
                    console.log(`📡 [BOT-BROADCAST] Bot ${username} broadcasting ${event} to room ${room}:`, data);
                    io.to(room).emit(event, data);
                }
            })
        };

        this.activeConnections.set(botId, botClient);
        this.setupBotListeners(io, botId, username);
        return botClient;
    }

    static setupBotListeners(io, botId, username) {
        console.log(`👂 [BOT-HANDLER] Setting up message listeners for bot ${username}`);

        // Remove any existing bot listeners for this specific bot
        const existingListeners = io.listeners('bot-message-intercept');
        console.log(`🔍 [BOT-HANDLER] Found ${existingListeners.length} existing bot-message-intercept listeners`);
        
        existingListeners.forEach((listener, index) => {
            if (listener.toString().includes('BOT-HANDLER') || listener.toString().includes('handleMessage')) {
                console.log(`🗑️ [BOT-HANDLER] Removing existing listener ${index}`);
                io.removeListener('bot-message-intercept', listener);
            }
        });

        // Create a bound function to maintain proper context
        const messageHandler = (data) => {
            // Normalize field names so detection works consistently
            if (data.channelId && !data.channel_id) data.channel_id = data.channelId;
            if (data.roomId && !data.room_id) data.room_id = data.roomId;

            console.log(`🔍 [BOT-HANDLER] Bot ${username} intercepted message:`, {
                messageId: data.id,
                content: data.content?.substring(0, 50) + '...',
                userId: data.user_id,
                channelId: data.channel_id,
                roomId: data.room_id,
                source: data.source
            });
            
            console.log(`🔍 [BOT-HANDLER] FULL MESSAGE DATA:`, JSON.stringify(data, null, 2));
            
            // Determine message type after normalization
            const messageType = data.channel_id ? 'channel' : 'dm';
            console.log(`🔍 [BOT-HANDLER] Message type determined: ${messageType}`);
            
            // Use BotHandler.handleMessage with explicit context
            BotHandler.handleMessage(io, data, messageType, botId, username);
        };

        // Listen for the global bot message intercept event
        io.on('bot-message-intercept', messageHandler);

        console.log(`✅ [BOT-HANDLER] Bot ${username} is now listening for all messages via bot-message-intercept`);
    }

    static handleMessage(io, data, messageType, botId, username) {
        console.log(`🔍 [BOT-HANDLER] handleMessage called with:`, {
            messageType: messageType,
            botId: botId,
            username: username,
            dataUserId: data.user_id,
            content: data.content
        });
        
        // Use message id if available, otherwise create a composite key
        const messageId = data.id || `${data.user_id}-${data.channel_id || data.room_id}-${data.content}`;
        
        // Skip if we've already processed this message
        if (this.processedMessages.has(messageId)) {
            console.log('🤖 [BOT-HANDLER] Skipping duplicate message:', messageId);
            return;
        }
        
        // Add to processed messages
        this.processedMessages.add(messageId);
        
        // Clean up old messages (keep last 100)
        if (this.processedMessages.size > 100) {
            const oldestMessage = Array.from(this.processedMessages)[0];
            this.processedMessages.delete(oldestMessage);
        }

        if (data.channelId && !data.channel_id) {
            data.channel_id = data.channelId;
        }
        if (data.roomId && !data.room_id) {
            data.room_id = data.roomId;
        }

        const bot = this.bots.get(botId);
        console.log(`🔍 [BOT-HANDLER] Bot lookup result:`, {
            botExists: !!bot,
            isOwnMessage: data.user_id == botId
        });
        
        if (!bot || data.user_id == botId) {
            console.log(`🔍 [BOT-HANDLER] Skipping message - bot not found or own message`);
            return;
        }

        const content = data.content?.toLowerCase().trim();
        console.log(`🔍 [BOT-HANDLER] Processing content: "${content}"`);
        
        if (!content) {
            console.log(`🔍 [BOT-HANDLER] No content found, returning`);
            return;
        }

        console.log(`📨 [BOT-HANDLER] Bot ${username} received message: "${content.substring(0, 50)}..." in ${messageType}`);

        // Process commands
        if (content === '/titibot ping') {
            console.log(`🎯 [BOT-HANDLER] Bot ${username} detected ping command, responding...`);
            this.respondToPing(io, data, messageType, botId, username);
        } else if (content.startsWith('/titibot play ')) {
            const songName = content.replace('/titibot play ', '').trim();
            console.log(`🎵 [BOT-HANDLER] Bot ${username} detected play command for: ${songName}`);
            this.respondToMusicCommand(io, data, messageType, botId, username, 'play', songName);
        } else if (content === '/titibot stop') {
            console.log(`⏹️ [BOT-HANDLER] Bot ${username} detected stop command`);
            this.respondToMusicCommand(io, data, messageType, botId, username, 'stop');
        } else if (content === '/titibot next') {
            console.log(`⏭️ [BOT-HANDLER] Bot ${username} detected next command`);
            this.respondToMusicCommand(io, data, messageType, botId, username, 'next');
        } else if (content === '/titibot prev') {
            console.log(`⏮️ [BOT-HANDLER] Bot ${username} detected prev command`);
            this.respondToMusicCommand(io, data, messageType, botId, username, 'prev');
        } else if (content.startsWith('/titibot queue ')) {
            const songName = content.replace('/titibot queue ', '').trim();
            console.log(`📝 [BOT-HANDLER] Bot ${username} detected queue command for: ${songName}`);
            this.respondToMusicCommand(io, data, messageType, botId, username, 'queue', songName);
        } else {
            console.log(`🔍 [BOT-HANDLER] No matching command found for: "${content}"`);
        }
    }

    static handleCommand(io, commandData) {
        console.log(`🎯 [BOT-HANDLER] Processing direct command:`, {
            command: commandData.command,
            channelId: commandData.channel_id,
            userId: commandData.user_id,
            username: commandData.username
        });

        const { command, channel_id, user_id, username } = commandData;

        const titiBotId = this.getTitiBotId();
        if (!titiBotId) {
            console.warn('⚠️ [BOT-HANDLER] TitiBot not found in active bots');
            return;
        }

        const bot = this.bots.get(titiBotId);
        if (!bot) {
            console.warn('⚠️ [BOT-HANDLER] TitiBot not registered in handler');
            return;
        }

        if (command === 'ping') {
            console.log(`🏓 [BOT-HANDLER] Processing ping command from ${username}`);
            
            const simulatedMessage = {
                channel_id: channel_id,
                user_id: user_id,
                username: username
            };
            
            this.respondToPing(io, simulatedMessage, 'channel', titiBotId, 'titibot');
        } else {
            console.log(`❓ [BOT-HANDLER] Unknown command: ${command}`);
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

        if (messageType === 'channel' && originalMessage.channel_id) {
            targetRoom = roomManager.getChannelRoom(originalMessage.channel_id);
            eventName = 'new-channel-message';
            responseData.channel_id = originalMessage.channel_id;
        } else if (messageType === 'dm' && originalMessage.room_id) {
            targetRoom = roomManager.getDMRoom(originalMessage.room_id);
            eventName = 'user-message-dm';
            responseData.room_id = originalMessage.room_id;
        }

        if (targetRoom && eventName) {
            console.log(`🚀 [BOT-RESPONSE] Bot ${username} sending immediate WebSocket reply in ${targetRoom}`);
            
            // Send response immediately via WebSocket only - NO AJAX!
            io.to(targetRoom).emit(eventName, responseData);
            console.log(`✅ [BOT-RESPONSE] Bot ${username} ping reply sent successfully via WebSocket`);
        }
    }

    static async respondToMusicCommand(io, originalMessage, messageType, botId, username, command, songName = null) {
        let responseContent;
        let musicData = null;

        // Handle music commands without external API calls
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

        if (messageType === 'channel' && originalMessage.channel_id) {
            targetRoom = roomManager.getChannelRoom(originalMessage.channel_id);
            eventName = 'new-channel-message';
            responseData.channel_id = originalMessage.channel_id;
        } else if (messageType === 'dm' && originalMessage.room_id) {
            targetRoom = roomManager.getDMRoom(originalMessage.room_id);
            eventName = 'user-message-dm';
            responseData.room_id = originalMessage.room_id;
        }

        if (targetRoom && eventName) {
            console.log(`🎵 [BOT-MUSIC] Bot ${username} sending immediate WebSocket music response for ${command} in ${targetRoom}`);
            
            // Send response immediately via WebSocket only - NO AJAX!
            io.to(targetRoom).emit(eventName, responseData);
            
            if (musicData) {
                io.to(targetRoom).emit('bot-music-command', {
                    channel_id: originalMessage.channel_id,
                    music_data: musicData
                });
            }
            
            console.log(`✅ [BOT-MUSIC] Bot ${username} music response sent successfully via WebSocket`);
        } else {
            console.error(`❌ [BOT-MUSIC] Room targeting failed:`, {
                targetRoom: targetRoom,
                eventName: eventName,
                messageType: messageType,
                originalMessage: {
                    channel_id: originalMessage.channel_id,
                    room_id: originalMessage.room_id,
                    user_id: originalMessage.user_id
                }
            });
        }
    }

    static joinBotToRoom(botId, roomType, roomId) {
        const bot = this.bots.get(botId);
        if (!bot) return false;

        const roomKey = `${roomType}-${roomId}`;
        bot.joinedRooms.add(roomKey);
        
        console.log(`🚪 [BOT-HANDLER] Bot ${bot.username} joined ${roomType} room: ${roomId}`);
        return true;
    }

    static getBotStatus(botId) {
        const bot = this.bots.get(botId);
        return bot || null;
    }
}

module.exports = BotHandler;
