const roomManager = require('../services/roomManager');
const AuthHandler = require('./authHandler');

class BotHandler {
    static activeBots = new Map();
    static botSockets = new Map();
    static processedMessages = new Set();
    static botCommands = new Map();

    static async initializeBot(io, botData) {
        console.log(`🤖 [BOT-HANDLER] Initializing bot as real user: ${botData.username} (ID: ${botData.id})`);
        
        const botSocket = {
            id: `bot-socket-${botData.id}`,
            data: {
                user_id: parseInt(botData.id),
                username: botData.username,
                authenticated: true,
                avatar_url: botData.avatar_url || '/public/assets/common/default-profile-picture.png',
                isBot: true
            },
            emit: (event, data) => {
                console.log(`🤖 [BOT-HANDLER] Bot ${botData.username} emitting ${event}:`, data);
            },
            to: (room) => ({
                emit: (event, data) => {
                    console.log(`📡 [BOT-HANDLER] Bot ${botData.username} broadcasting ${event} to room ${room}`);
                    io.to(room).emit(event, data);
                }
            })
        };

        this.activeBots.set(parseInt(botData.id), {
            id: parseInt(botData.id),
            username: botData.username,
            status: 'online',
            avatar_url: botData.avatar_url || '/public/assets/common/default-profile-picture.png',
            joinedServers: new Set(),
            joinedChannels: new Set(),
            socket: botSocket
        });

        this.botSockets.set(parseInt(botData.id), botSocket);

        await this.authenticateBot(io, botSocket, botData);
        await this.joinBotToServers(io, parseInt(botData.id));

        console.log(`✅ [BOT-HANDLER] Bot ${botData.username} initialized as real user`);
        return botSocket;
    }

    static async authenticateBot(io, botSocket, botData) {
        console.log(`🔐 [BOT-HANDLER] Authenticating bot ${botData.username} as real user`);
        
        const authData = {
            user_id: parseInt(botData.id),
            username: botData.username,
            session_id: `bot-session-${botData.id}`,
            avatar_url: botData.avatar_url || '/public/assets/common/default-profile-picture.png'
        };

        AuthHandler.handle(io, botSocket, authData);
        
        const userRoom = roomManager.getUserRoom(botData.id);
        roomManager.joinRoom(botSocket, userRoom);
        roomManager.addUserSocket(botData.id, botSocket.id);

        io.emit('user-online', {
            user_id: parseInt(botData.id),
            username: botData.username,
            status: 'online',
            timestamp: Date.now()
        });

        console.log(`✅ [BOT-HANDLER] Bot ${botData.username} authenticated as real user`);
    }

    static async joinBotToServers(io, botId) {
        try {
            console.log(`🏠 [BOT-HANDLER] Loading servers for bot ${botId}`);
            
            const response = await fetch('http://localhost/api/users/' + botId + '/servers', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const servers = data.data?.servers || [];
                
                console.log(`📊 [BOT-HANDLER] Bot ${botId} found in ${servers.length} servers`);
                
                for (const server of servers) {
                    await this.joinBotToServerChannels(io, botId, server.id);
                }
            }
        } catch (error) {
            console.error(`❌ [BOT-HANDLER] Error loading servers for bot ${botId}:`, error);
        }
    }

    static async joinBotToServerChannels(io, botId, serverId) {
        try {
            console.log(`🔗 [BOT-HANDLER] Joining bot ${botId} to server ${serverId} channels`);
            
            const response = await fetch(`http://localhost/api/servers/${serverId}/channels`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const channels = data.data?.channels || [];
                
                const bot = this.activeBots.get(botId);
                if (bot) {
                    bot.joinedServers.add(serverId);
                    
                    for (const channel of channels) {
                        const channelRoom = roomManager.getChannelRoom(channel.id);
                        roomManager.joinRoom(bot.socket, channelRoom);
                        bot.joinedChannels.add(channel.id);
                        
                        console.log(`🔗 [BOT-HANDLER] Bot ${bot.username} joined channel #${channel.name} (${channel.id})`);
                    }
                }
            }
        } catch (error) {
            console.error(`❌ [BOT-HANDLER] Error joining bot to server channels:`, error);
        }
    }

    static setupMessageListeners(io) {
        console.log(`👂 [BOT-HANDLER] Setting up real user message listeners for bots`);

        io.on('new-channel-message', (messageData) => {
            this.handleChannelMessage(io, messageData);
        });

        io.on('user-message-dm', (messageData) => {
            this.handleDMMessage(io, messageData);
        });

        console.log(`✅ [BOT-HANDLER] Bot message listeners setup complete`);
    }

    static handleChannelMessage(io, messageData) {
        const messageId = messageData.id || `${messageData.user_id}-${messageData.channel_id}-${Date.now()}`;
        
        if (this.processedMessages.has(messageId)) {
            return;
        }
        
        this.processedMessages.add(messageId);
        
        if (this.processedMessages.size > 200) {
            const oldestMessage = Array.from(this.processedMessages)[0];
            this.processedMessages.delete(oldestMessage);
        }

        const content = messageData.content?.trim();
        if (!content || !content.startsWith('/titibot')) {
            return;
        }

        const channelId = messageData.channel_id;
        if (!channelId) {
            return;
        }

        for (const [botId, bot] of this.activeBots.entries()) {
            if (messageData.user_id === botId) {
                continue;
            }

            if (bot.joinedChannels.has(channelId)) {
                console.log(`🎯 [BOT-HANDLER] Bot ${bot.username} processing command in channel ${channelId}: "${content}"`);
                this.processCommand(io, messageData, bot, 'channel');
            }
        }
    }

    static handleDMMessage(io, messageData) {
        const messageId = messageData.id || `${messageData.user_id}-${messageData.room_id}-${Date.now()}`;
        
        if (this.processedMessages.has(messageId)) {
            return;
        }
        
        this.processedMessages.add(messageId);

        const content = messageData.content?.trim();
        if (!content || !content.startsWith('/titibot')) {
            return;
        }

        for (const [botId, bot] of this.activeBots.entries()) {
            if (messageData.user_id === botId) {
                continue;
            }

            console.log(`🎯 [BOT-HANDLER] Bot ${bot.username} processing DM command: "${content}"`);
            this.processCommand(io, messageData, bot, 'dm');
        }
    }

    static async processCommand(io, originalMessage, bot, messageType) {
        const content = originalMessage.content.toLowerCase().trim();
        let command = '';
        let parameter = '';

        if (content === '/titibot ping') {
            command = 'ping';
        } else if (content.startsWith('/titibot play ')) {
            command = 'play';
            parameter = content.replace('/titibot play ', '').trim();
        } else if (content === '/titibot stop') {
            command = 'stop';
        } else if (content === '/titibot next') {
            command = 'next';
        } else if (content === '/titibot prev') {
            command = 'prev';
        } else if (content.startsWith('/titibot queue ')) {
            command = 'queue';
            parameter = content.replace('/titibot queue ', '').trim();
        } else if (content === '/titibot help') {
            command = 'help';
        } else {
            command = 'unknown';
        }

        const response = this.generateResponse(command, parameter, originalMessage.username);
        await this.sendBotResponse(io, originalMessage, bot, messageType, response);
    }

    static generateResponse(command, parameter, senderUsername) {
        let responseContent;
        let musicData = null;

        switch (command) {
            case 'ping':
                responseContent = `🏓 Pong! Hi ${senderUsername}, I'm TitiBot and I'm online!`;
                break;

            case 'play':
                if (!parameter) {
                    responseContent = '❌ Please specify a song name. Usage: `/titibot play {song name}`';
                } else {
                    responseContent = `🎵 Playing: "${parameter}" (simulated)`;
                    musicData = {
                        action: 'play',
                        track: {
                            title: parameter,
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
                if (!parameter) {
                    responseContent = '❌ Please specify a song name. Usage: `/titibot queue {song name}`';
                } else {
                    responseContent = `➕ Added to queue: "${parameter}"`;
                    musicData = {
                        action: 'queue',
                        track: {
                            title: parameter,
                            artist: 'Unknown Artist'
                        }
                    };
                }
                break;

            case 'help':
                responseContent = `🤖 **TitiBot Commands:**
• \`/titibot ping\` - Check if I'm online
• \`/titibot play {song}\` - Play a song
• \`/titibot stop\` - Stop music
• \`/titibot next\` - Next song
• \`/titibot prev\` - Previous song
• \`/titibot queue {song}\` - Add song to queue
• \`/titibot help\` - Show this help`;
                break;

            default:
                responseContent = `❌ Unknown command. Type \`/titibot help\` for available commands.`;
        }

        return { content: responseContent, musicData };
    }

    static async sendBotResponse(io, originalMessage, bot, messageType, response) {
        console.log(`🤖 [BOT-HANDLER] ${bot.username} sending response: "${response.content.substring(0, 50)}..."`);
        
        try {
            const MessageHandler = require('./messageHandler');
            
            const targetType = messageType === 'channel' ? 'channel' : 'dm';
            const targetId = messageType === 'channel' 
                ? originalMessage.channel_id 
                : originalMessage.room_id;

            const botMessageData = {
                content: response.content,
                target_type: targetType,
                target_id: targetId,
                message_type: 'text',
                attachments: [],
                mentions: [],
                reply_message_id: originalMessage.id,
                music_data: response.musicData
            };

            await MessageHandler.saveAndSendMessage(io, bot.socket, botMessageData);
            
            if (response.musicData) {
                const targetRoom = messageType === 'channel' 
                    ? roomManager.getChannelRoom(targetId)
                    : roomManager.getDMRoom(targetId);
                
                if (targetRoom) {
                    io.to(targetRoom).emit('bot-music-command', {
                        channel_id: originalMessage.channel_id,
                        room_id: originalMessage.room_id,
                        music_data: response.musicData
                    });
                }
            }
            
            console.log(`✅ [BOT-HANDLER] ${bot.username} response sent successfully`);
            
        } catch (error) {
            console.error(`❌ [BOT-HANDLER] ${bot.username} failed to send response:`, error);
        }
    }

    static getBotById(botId) {
        return this.activeBots.get(parseInt(botId)) || null;
    }

    static getAllActiveBots() {
        return Array.from(this.activeBots.values());
    }

    static isBotActive(botId) {
        return this.activeBots.has(parseInt(botId));
    }

    static disconnectBot(botId) {
        const bot = this.activeBots.get(parseInt(botId));
        if (bot) {
            console.log(`🔌 [BOT-HANDLER] Disconnecting bot ${bot.username}`);
            this.activeBots.delete(parseInt(botId));
            this.botSockets.delete(parseInt(botId));
            return true;
        }
        return false;
    }
}

module.exports = BotHandler;
