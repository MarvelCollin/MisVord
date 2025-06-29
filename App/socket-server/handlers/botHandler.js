const roomManager = require('../services/roomManager');
const EventEmitter = require('events');

class BotHandler extends EventEmitter {
    static bots = new Map();
    static activeConnections = new Map();
    static processedMessages = new Set();
    static botEventEmitter = new EventEmitter();

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
        console.log(`🚀 [BOT-CONNECT] === CONNECTING BOT ===`);
        console.log(`🤖 [BOT-CONNECT] Bot ID: ${botId}, Username: ${username}`);
        
        const bot = this.bots.get(botId);
        if (!bot) {
            console.log(`📝 [BOT-CONNECT] Bot not found, registering new bot`);
            this.registerBot(botId, username);
        } else {
            console.log(`✅ [BOT-CONNECT] Bot already registered`);
        }

        console.log(`🔌 Connecting bot ${username} to socket system`);
        
        const botClient = {
            id: `bot-${botId}`,
            data: {
                user_id: botId,
                username: username,
                isBot: true,
                authenticated: true,
                avatar_url: '/public/assets/common/default-profile-picture.png'
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
        console.log(`📋 [BOT-CONNECT] Bot stored in activeConnections with ID: ${botId}`);
        
        this.setupBotListeners(io, botId, username);
        console.log(`✅ [BOT-CONNECT] Bot connection complete`);
        
        return botClient;
    }

    static setupBotListeners(io, botId, username) {
        console.log(`🔧 [BOT-LISTENERS] === SETTING UP BOT LISTENERS ===`);
        console.log(`👂 Setting up message listeners for bot ${username} (ID: ${botId})`);

        console.log(`📊 [BOT-LISTENERS] Checking existing bot-message-intercept listeners...`);
        
        // Remove any existing listeners for this bot
        this.botEventEmitter.removeAllListeners('bot-message-intercept');
        console.log(`🧹 [BOT-LISTENERS] Cleared all existing bot-message-intercept listeners`);

        const messageHandler = async (data) => {
            console.log(`🚨 [BOT-LISTENERS] === MESSAGE HANDLER TRIGGERED ===`);
            console.log(`📨 [BOT-LISTENERS] bot-message-intercept received by ${username}:`, {
                messageId: data.id,
                content: data.content?.substring(0, 30) + '...',
                userId: data.user_id,
                targetType: data.target_type,
                targetId: data.target_id
            });
            console.log(`🔍 [BOT-LISTENERS] Full event data:`, JSON.stringify(data, null, 2));
            
            const channelId = data.channel_id || (data.target_type === 'channel' ? data.target_id : null);
            const roomId = data.room_id || (data.target_type === 'dm' ? data.target_id : null);
            
            const messageType = channelId ? 'channel' : 'dm';
            console.log(`🎯 [BOT-LISTENERS] Calling handleMessage for ${username} with messageType: ${messageType}`);
            await BotHandler.handleMessage(io, data, messageType, botId, username);
        };

        this.botEventEmitter.on('bot-message-intercept', messageHandler);
        console.log(`✅ Bot ${username} is now listening for messages via EventEmitter`);
        console.log(`📊 [BOT-LISTENERS] Total listeners now: ${this.botEventEmitter.listenerCount('bot-message-intercept')}`);
        
        // Test the listener setup with a more comprehensive test
        console.log(`🧪 [BOT-LISTENERS] Testing EventEmitter bot-message-intercept...`);
        
        // Test 1: Simple event test
        console.log(`🧪 [BOT-LISTENERS] Test 1: Simple event test...`);
        this.botEventEmitter.on('test-simple', (data) => {
            console.log(`✅ [BOT-LISTENERS] Simple event test WORKED! Data:`, data);
        });
        this.botEventEmitter.emit('test-simple', { test: 'simple test data' });
        
        // Test 2: Bot message intercept test
        setTimeout(() => {
            console.log(`🧪 [BOT-LISTENERS] Test 2: Bot message intercept test...`);
            console.log(`🧪 [BOT-LISTENERS] Current listener count: ${this.botEventEmitter.listenerCount('bot-message-intercept')}`);
            console.log(`🧪 [BOT-LISTENERS] Emitting test event NOW...`);
            const testData = {
                id: 'test-message-123',
                content: '/titibot ping',
                user_id: 999,
                username: 'test-user',
                target_type: 'channel',
                target_id: 13,
                channel_id: 13
            };
            console.log(`🧪 [BOT-LISTENERS] Test data being emitted:`, testData);
            this.botEventEmitter.emit('bot-message-intercept', testData);
            console.log(`🧪 [BOT-LISTENERS] Test event emitted - waiting for handler response...`);
        }, 1000);
    }

    // Add static method for external message emission
    static emitBotMessageIntercept(data) {
        console.log(`📡 [BOT-EMIT] Emitting bot-message-intercept via EventEmitter:`, {
            messageId: data.id,
            content: data.content?.substring(0, 50) + '...',
            userId: data.user_id,
            targetType: data.target_type,
            targetId: data.target_id
        });
        this.botEventEmitter.emit('bot-message-intercept', data);
        console.log(`✅ [BOT-EMIT] bot-message-intercept emitted successfully`);
    }

    static async handleMessage(io, data, messageType, botId, username) {
        console.log(`🤖 [BOT-HANDLER] === PROCESSING MESSAGE ===`);
        console.log(`🤖 [BOT-HANDLER] Bot: ${username} (ID: ${botId})`);
        console.log(`🤖 [BOT-HANDLER] Message type: ${messageType}`);
        console.log(`🤖 [BOT-HANDLER] Full message data:`, JSON.stringify(data, null, 2));
        
        const messageId = data.id || `${data.user_id}-${data.channel_id || data.room_id}-${data.content}`;
        
        if (this.processedMessages.has(messageId)) {
            console.log(`🔄 [BOT-HANDLER] Message already processed, skipping: ${messageId}`);
            return;
        }
        
        this.processedMessages.add(messageId);
        
        if (this.processedMessages.size > 100) {
            const oldestMessage = Array.from(this.processedMessages)[0];
            this.processedMessages.delete(oldestMessage);
        }

        const bot = this.bots.get(botId);
        
        if (!bot) {
            console.warn(`⚠️ [BOT-HANDLER] Bot not found in registry: ${botId}`);
            console.log(`🤖 [BOT-HANDLER] Available bots:`, Array.from(this.bots.keys()));
            return;
        }
        
        if (data.user_id == botId) {
            console.log(`🤖 [BOT-HANDLER] Ignoring message from bot itself`);
            return;
        }

        const content = data.content?.toLowerCase().trim();
        
        if (!content) {
            console.warn(`⚠️ [BOT-HANDLER] No content in message`);
            return;
        }

        console.log(`📨 Bot ${username} received message: "${content.substring(0, 50)}..." in ${messageType}`);
        console.log(`🔍 [BOT-HANDLER] Checking commands against: "${content}"`);

        if (content.toLowerCase() === '/titibot ping') {
            console.log(`✅ [BOT-HANDLER] PING command detected!`);
            await this.sendBotResponse(io, data, messageType, botId, username, 'ping');
        } else if (content.toLowerCase().startsWith('/titibot play ')) {
            console.log(`✅ [BOT-HANDLER] PLAY command detected!`);
            const songName = content.substring('/titibot play '.length).trim();
            console.log(`🎵 [BOT-HANDLER] Song name: "${songName}"`);
            await this.sendBotResponse(io, data, messageType, botId, username, 'play', songName);
        } else if (content.toLowerCase() === '/titibot stop') {
            console.log(`✅ [BOT-HANDLER] STOP command detected!`);
            await this.sendBotResponse(io, data, messageType, botId, username, 'stop');
        } else if (content.toLowerCase() === '/titibot next') {
            console.log(`✅ [BOT-HANDLER] NEXT command detected!`);
            await this.sendBotResponse(io, data, messageType, botId, username, 'next');
        } else if (content.toLowerCase() === '/titibot prev') {
            console.log(`✅ [BOT-HANDLER] PREV command detected!`);
            await this.sendBotResponse(io, data, messageType, botId, username, 'prev');
        } else if (content.toLowerCase().startsWith('/titibot queue ')) {
            console.log(`✅ [BOT-HANDLER] QUEUE command detected!`);
            const songName = content.substring('/titibot queue '.length).trim();
            console.log(`🎵 [BOT-HANDLER] Queue song name: "${songName}"`);
            await this.sendBotResponse(io, data, messageType, botId, username, 'queue', songName);
        } else {
            console.log(`❌ [BOT-HANDLER] No matching command found for: "${content}"`);
        }
    }

    static async sendBotResponse(io, originalMessage, messageType, botId, username, command, parameter = null) {
        console.log(`🚀 [BOT-RESPONSE] === SENDING BOT RESPONSE ===`);
        console.log(`🤖 Bot ${username} preparing response for command: ${command}`);
        console.log(`📝 [BOT-RESPONSE] Parameters: ${parameter || 'none'}`);
        console.log(`📍 [BOT-RESPONSE] Message type: ${messageType}`);
        console.log(`🎯 [BOT-RESPONSE] Original message:`, JSON.stringify(originalMessage, null, 2));
        
        let responseContent;
        let musicData = null;

        switch (command) {
            case 'ping':
                responseContent = `🏓 Pong! Halo bang ${originalMessage.username}`;
                break;

            case 'play':
                if (!parameter) {
                    responseContent = '❌ Udah di bilang formatnya play {namaLagu} masih ngemeng';
                } else {
                    responseContent = `🎵 MUSIGGGGGGG: "${parameter}" - Searching and playing...`;
                    musicData = {
                        action: 'play',
                        query: parameter,
                        track: {
                            title: parameter,
                            artist: 'Searching...',
                            previewUrl: null
                        }
                    };
                }
                break;

            case 'stop':
                responseContent = '⏹️ Yah dimatiin';
                musicData = { action: 'stop' };
                break;

            case 'next':
                responseContent = '⏭️ Mainin musig selanjutnya';
                musicData = { action: 'next' };
                break;

            case 'prev':
                responseContent = '⏮️ Mainin musig sebelumnya';
                musicData = { action: 'prev' };
                break;

            case 'queue':
                if (!parameter) {
                    responseContent = '❌ Udah di bilang formatnya queue {namaLagu} masih ngemeng';
                } else {
                    responseContent = `➕ Berhasil di tambahin di queue king: "${parameter}" - Searching...`;
                    musicData = {
                        action: 'queue',
                        query: parameter,
                        track: {
                            title: parameter,
                            artist: 'Searching...'
                        }
                    };
                }
                break;

            default:
                responseContent = '❌ bro minimal baca tutorial dulu kalo command';
        }

        console.log(`🚀 [BOT-RESPONSE] Sending bot response using DIRECT message emission (same as normal users)`);
        
        await this.sendDirectBotMessage(io, originalMessage, messageType, botId, username, responseContent, musicData);
    }

    static async sendDirectBotMessage(io, originalMessage, messageType, botId, username, responseContent, musicData) {
        console.log(`📡 [BOT-DIRECT] Using direct bot message emission (same pattern as normal users)`);
        
        const channelId = originalMessage.channel_id || (originalMessage.target_type === 'channel' ? originalMessage.target_id : null);
        const roomId = originalMessage.room_id || (originalMessage.target_type === 'dm' ? originalMessage.target_id : null);
        const currentTimestamp = new Date().toISOString();

        const botResponseData = {
            id: `bot-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            user_id: botId.toString(),
            username: username,
            avatar_url: '/public/assets/common/default-profile-picture.png',
            content: responseContent,
            sent_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            edited_at: null,
            type: 'text',
            message_type: 'text',
            attachments: [],
            has_reactions: false,
            reaction_count: 0,
            channel_id: messageType === 'channel' ? channelId : null,
            room_id: messageType === 'dm' ? roomId : null,
            is_bot: true,
            bot_id: botId,
            music_data: musicData
        };
        
        const eventName = messageType === 'channel' ? 'new-channel-message' : 'user-message-dm';
        const targetRoom = messageType === 'channel' ? `channel-${channelId}` : `dm-${roomId}`;
        
        console.log(`📡 [BOT-DIRECT] Emitting bot response to room ${targetRoom}:`, {
            event: eventName,
            messageId: botResponseData.id,
            content: botResponseData.content?.substring(0, 50) + '...',
            username: botResponseData.username,
            musicData: musicData ? 'YES' : 'NO'
        });
        
        io.to(targetRoom).emit(eventName, botResponseData);
        console.log(`✅ [BOT-DIRECT] Bot response sent to ${targetRoom} via ${eventName}`);
        
        try {
            console.log(`💾 [BOT-DATABASE] Saving bot message to database...`);
            
            const saveData = {
                user_id: botId.toString(),
                username: username,
                target_type: messageType,
                target_id: messageType === 'channel' ? channelId.toString() : roomId.toString(),
                content: responseContent,
                message_type: 'text',
                attachments: [],
                mentions: []
            };
            
            console.log(`📤 [BOT-DATABASE] Save data:`, JSON.stringify(saveData, null, 2));
            
            const http = require('http');
            const postData = JSON.stringify(saveData);
            
            const options = {
                hostname: 'app',
                port: 1001,
                path: '/api/chat/save-bot-message',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            const req = http.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const saveResult = JSON.parse(responseData);
                        console.log(`💾 [BOT-DATABASE] Save result:`, JSON.stringify(saveResult, null, 2));
                        
                        if (saveResult.success) {
                            console.log(`✅ [BOT-DATABASE] Bot message saved successfully with ID: ${saveResult.data.message_id}`);
                        } else {
                            console.error(`❌ [BOT-DATABASE] Failed to save bot message:`, saveResult);
                        }
                    } catch (parseError) {
                        console.error(`❌ [BOT-DATABASE] Error parsing save response:`, parseError.message);
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error(`❌ [BOT-DATABASE] Request error:`, error.message);
            });
            
            req.write(postData);
            req.end();
            
        } catch (saveError) {
            console.error(`❌ [BOT-DATABASE] Error saving bot message:`, saveError.message);
        }
        
        console.log(`🎯 [BOT-RESPONSE] === BOT RESPONSE COMPLETE ===`);
        
        if (musicData) {
            console.log(`🎵 [BOT-DIRECT] Sending music command:`, musicData);
            io.to(targetRoom).emit('bot-music-command', {
                channel_id: channelId,
                room_id: roomId,
                music_data: musicData
            });
        }
    }

    static async fallbackDirectResponse(io, originalMessage, messageType, botId, username, responseContent, musicData) {
        console.log(`🔄 [BOT-FALLBACK] Using fallback response (this should not be called anymore)`);
        await this.sendDirectBotMessage(io, originalMessage, messageType, botId, username, responseContent, musicData);
    }

    static async handleCommand(io, commandData) {
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
                username: username,
                target_type: 'channel',
                target_id: channel_id
            };
            
            await this.sendBotResponse(io, simulatedMessage, 'channel', titiBotId, 'titibot', 'ping');
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
