const roomManager = require('../services/roomManager');

class BotHandler {
    static bots = new Map();
    static activeConnections = new Map();

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

        io.on('connection', (client) => {
            client.on('new-channel-message', (data) => {
                this.handleMessage(io, data, 'channel', botId, username);
            });

            client.on('user-message-dm', (data) => {
                this.handleMessage(io, data, 'dm', botId, username);
            });
        });

        const existingConnections = Array.from(io.sockets.sockets.values());
        existingConnections.forEach(client => {
            const originalChannelHandler = client.listeners('new-channel-message');
            const originalDMHandler = client.listeners('user-message-dm');

            client.removeAllListeners('new-channel-message');
            client.removeAllListeners('user-message-dm');

            originalChannelHandler.forEach(handler => {
                client.on('new-channel-message', handler);
            });
            
            originalDMHandler.forEach(handler => {
                client.on('user-message-dm', handler);
            });

            client.on('new-channel-message', (data) => {
                this.handleMessage(io, data, 'channel', botId, username);
            });

            client.on('user-message-dm', (data) => {
                this.handleMessage(io, data, 'dm', botId, username);
            });
        });
    }

    static handleMessage(io, data, messageType, botId, username) {
        const bot = this.bots.get(botId);
        if (!bot || data.user_id == botId) {
            return;
        }

        const content = data.content?.toLowerCase().trim();
        if (!content) return;

        console.log(`📨 [BOT-HANDLER] Bot ${username} received message: "${content.substring(0, 50)}..." in ${messageType}`);

        if (content === '/titibot ping') {
            console.log(`🎯 [BOT-HANDLER] Bot ${username} detected ping command, responding...`);
            this.respondToPing(io, data, messageType, botId, username);
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
            avatar_url: '/assets/common/default-profile-picture.png'
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
            console.log(`🚀 [BOT-RESPONSE] Bot ${username} sending response to ${targetRoom}`);
            
            try {
                await this.saveBotMessage(responseData, messageType);
                
                io.to(targetRoom).emit(eventName, responseData);
                
                console.log(`✅ [BOT-RESPONSE] Bot ${username} response sent successfully`);
            } catch (error) {
                console.error(`❌ [BOT-RESPONSE] Error sending bot response:`, error);
            }
        }
    }

    static async saveBotMessage(messageData, messageType) {
        try {
            const fetch = (await import('node-fetch')).default;
            
            const payload = {
                content: messageData.content,
                message_type: 'text',
                user_id: messageData.user_id
            };

            let endpoint;
            if (messageType === 'channel') {
                endpoint = `http://localhost:8080/api/channels/${messageData.channel_id}/messages`;
            } else {
                endpoint = `http://localhost:8080/api/chat/send`;
                payload.chat_type = 'direct';
                payload.target_id = messageData.room_id;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log(`💾 [BOT-HANDLER] Bot message saved to database`);
            } else {
                console.error(`❌ [BOT-HANDLER] Failed to save bot message:`, response.status);
            }
        } catch (error) {
            console.error(`❌ [BOT-HANDLER] Error saving bot message:`, error);
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
