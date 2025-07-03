const roomManager = require('../services/roomManager');
const VoiceConnectionTracker = require('../services/voiceConnectionTracker');
const EventEmitter = require('events');

class BotHandler extends EventEmitter {
    static bots = new Map();
    static activeConnections = new Map();
    static processedMessages = new Set();
    static botEventEmitter = new EventEmitter();
    static botVoiceParticipants = new Map();

    static registerBot(botId, username) {
        console.log(`🤖 [BOT-DEBUG] Registering bot:`, {
            botId,
            username,
            currentBots: Array.from(this.bots.keys())
        });
        
        this.bots.set(botId, {
            id: botId,
            username: username,
            status: 'active',
            joinedRooms: new Set(),
            lastActivity: Date.now()
        });
        
        console.log(`✅ [BOT-DEBUG] Bot registered successfully. Total bots: ${this.bots.size}`);
    }

    static connectBot(io, botId, username) {
        console.log(`🤖 [BOT-DEBUG] Connecting bot:`, {
            botId,
            username,
            existingBot: this.bots.has(botId)
        });
        
        const bot = this.bots.get(botId);
        if (!bot) {
            console.log(`🤖 [BOT-DEBUG] Bot not found, registering new bot`);
            this.registerBot(botId, username);
        }

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
                console.log(`🤖 [BOT-DEBUG] Bot ${username} emitting ${event}`);
            },
            to: (room) => ({
                emit: (event, data) => {
                    io.to(room).emit(event, data);
                }
            })
        };

        this.activeConnections.set(botId, botClient);
        
        console.log(`🤖 [BOT-DEBUG] Setting up bot listeners for ${username}`);
        this.setupBotListeners(io, botId, username);
        
        console.log(`✅ [BOT-DEBUG] Bot connected successfully:`, {
            botId,
            username,
            totalActiveConnections: this.activeConnections.size
        });
        
        return botClient;
    }

    static setupBotListeners(io, botId, username) {
        console.log(`🎧 [BOT-DEBUG] Setting up listeners for bot:`, {
            botId,
            username,
            existingListeners: this.botEventEmitter.listenerCount('bot-message-intercept')
        });
        
        this.botEventEmitter.removeAllListeners('bot-message-intercept');
        console.log(`🧹 [BOT-DEBUG] Cleared existing listeners`);

        const messageHandler = async (data) => {
            console.log(`🎯 [BOT-DEBUG] Message intercepted by listener:`, {
                messageId: data.id,
                userId: data.user_id,
                content: data.content?.substring(0, 30) + '...',
                channelId: data.channel_id,
                roomId: data.room_id,
                targetType: data.target_type,
                targetId: data.target_id
            });
            
            const channelId = data.channel_id || (data.target_type === 'channel' ? data.target_id : null);
            const roomId = data.room_id || (data.target_type === 'dm' ? data.target_id : null);
            
            const messageType = channelId ? 'channel' : 'dm';
            
            console.log(`🎯 [BOT-DEBUG] Message type determined: ${messageType}`);
            
            const titiBotId = this.getTitiBotId();
            if (!titiBotId) {
                console.warn('⚠️ [BOT-DEBUG] TitiBot not found, skipping message processing');
                return;
            }
            
            const titiBotData = this.bots.get(titiBotId);
            if (!titiBotData) {
                console.warn('⚠️ [BOT-DEBUG] TitiBot data not found, skipping message processing');
                return;
            }
            
            console.log(`🤖 [BOT-DEBUG] Calling handleMessage with TitiBot:`, {
                titiBotId,
                titiBotUsername: titiBotData.username
            });
            
            await BotHandler.handleMessage(io, data, messageType, titiBotId, titiBotData.username);
        };

        this.botEventEmitter.on('bot-message-intercept', messageHandler);
        
        console.log(`✅ [BOT-DEBUG] Message listener attached. Total listeners: ${this.botEventEmitter.listenerCount('bot-message-intercept')}`);
    }

    static emitBotMessageIntercept(data) {
        console.log(`📢 [BOT-DEBUG] Emitting bot message intercept:`, {
            messageId: data.id,
            userId: data.user_id,
            content: data.content?.substring(0, 30) + '...',
            listenerCount: this.botEventEmitter.listenerCount('bot-message-intercept'),
            hasListeners: this.botEventEmitter.listenerCount('bot-message-intercept') > 0
        });
        
        this.botEventEmitter.emit('bot-message-intercept', data);
        
        console.log(`📤 [BOT-DEBUG] Bot message intercept emitted`);
    }

    static async handleMessage(io, data, messageType, botId, username) {
        console.log(`🤖 [BOT-DEBUG] Starting message handling:`, {
            content: data.content?.substring(0, 50) + '...',
            messageType,
            botId,
            username,
            userId: data.user_id,
            channelId: data.channel_id,
            roomId: data.room_id
        });
        
        const messageId = data.id || `${data.user_id}-${data.channel_id || data.room_id}-${data.content}`;
        
        if (this.processedMessages.has(messageId)) {
            console.log(`🤖 [BOT-DEBUG] Message already processed, skipping: ${messageId}`);
            return;
        }
        
        this.processedMessages.add(messageId);
        
        if (this.processedMessages.size > 100) {
            const oldestMessage = Array.from(this.processedMessages)[0];
            this.processedMessages.delete(oldestMessage);
        }

        const bot = this.bots.get(botId);
        
        if (!bot) {
            console.warn(`❌ [BOT-DEBUG] Bot not found with ID: ${botId}`);
            return;
        }
        
        if (data.user_id == botId) {
            console.log(`🤖 [BOT-DEBUG] Ignoring message from bot itself`);
            return;
        }

        const content = data.content?.toLowerCase().trim();
        
        // Prepare voiceChannelToJoin variable early so later checks can use it safely
        let voiceChannelToJoin = null;

        if (!content) {
            console.log(`🤖 [BOT-DEBUG] No content in message, skipping`);
            return;
        }

        const isTitiBotCommand = content.startsWith('/titibot');
        console.log(`🤖 [BOT-DEBUG] Command check: "${content}" -> isTitiBotCommand: ${isTitiBotCommand}`);
        
        const voiceRequiredCommands = ['play', 'stop', 'next', 'prev', 'queue'];
        const commandKeyword = content.split(' ')[1] || '';
        const requiresVoice = voiceRequiredCommands.includes(commandKeyword);

        // Determine real-time voice presence from payload first, then fallback to tracker
        let userInVoice = false;
        if (data.voice_context) {
            userInVoice = !!data.voice_context.user_in_voice;
            if (userInVoice && data.voice_context.voice_channel_id) {
                voiceChannelToJoin = data.voice_context.voice_channel_id;
            }
        } else {
            userInVoice = VoiceConnectionTracker.isUserInVoice(data.user_id);
        }

        if (isTitiBotCommand && requiresVoice && !userInVoice) {
            console.log('🎤 [BOT-DEBUG] Music command issued but user not in voice (checked via voice_context / tracker). Sending warning.');
            await this.sendBotResponse(io, data, messageType, botId, username, 'not_in_voice');
            return;
        }

        if (isTitiBotCommand) {
            console.log(`🤖 [BOT-DEBUG] Processing TitiBot command: ${content}`);
            
            // Only use voice_context from frontend - no fallbacks
            if (data.voice_context && data.voice_context.voice_channel_id) {
                voiceChannelToJoin = data.voice_context.voice_channel_id;
                console.log(`🎤 [BOT-DEBUG] User ${data.user_id} sent command from voice channel ${voiceChannelToJoin}`);
            } else {
                console.log(`🎤 [BOT-DEBUG] No voice context provided - user not in voice channel`);
            }
        }

        /* -------- Command Routing -------- */
        if (content.toLowerCase() === '/titibot ping') {
            console.log(`🏓 [BOT-DEBUG] Processing PING command`);
            await this.sendBotResponse(io, data, messageType, botId, username, 'ping');
        } else if (content.toLowerCase().startsWith('/titibot play ')) {
            const songName = content.substring('/titibot play '.length).trim();
            console.log(`🎵 [BOT-DEBUG] Processing PLAY command with song: "${songName}"`);
            
            // Join voice channel ONLY for play command
            if (voiceChannelToJoin) {
                console.log(`🎤 [BOT-DEBUG] Ensuring bot in voice channel ${voiceChannelToJoin} (PLAY)`);
                await this.ensureBotInVoiceChannel(io, botId, username, voiceChannelToJoin);
            }
            
            await this.sendBotResponse(io, data, messageType, botId, username, 'play', songName);
        } else if (content.toLowerCase() === '/titibot stop') {
            console.log(`⏹️ [BOT-DEBUG] Processing STOP command`);
            
            // Leave voice channel on stop command
            let channelIdForLeave = voiceChannelToJoin;
            if (!channelIdForLeave) {
                // If not provided, detect the channel the bot is currently in
                for (const key of this.botVoiceParticipants.keys()) {
                    if (key.startsWith(`${botId}-`)) {
                        channelIdForLeave = key.split('-')[1];
                        break;
                    }
                }
            }
            if (channelIdForLeave) {
                console.log(`🎤 [BOT-DEBUG] Removing bot from voice channel ${channelIdForLeave} (STOP)`);
                this.removeBotFromVoiceChannel(io, botId, channelIdForLeave);
            }
            
            await this.sendBotResponse(io, data, messageType, botId, username, 'stop');
        } else if (content.toLowerCase() === '/titibot next') {
            console.log(`⏭️ [BOT-DEBUG] Processing NEXT command`);
            await this.sendBotResponse(io, data, messageType, botId, username, 'next');
        } else if (content.toLowerCase() === '/titibot prev') {
            console.log(`⏮️ [BOT-DEBUG] Processing PREV command`);
            await this.sendBotResponse(io, data, messageType, botId, username, 'prev');
        } else if (content.toLowerCase().startsWith('/titibot queue ')) {
            const songName = content.substring('/titibot queue '.length).trim();
            console.log(`➕ [BOT-DEBUG] Processing QUEUE command with song: "${songName}"`);
            await this.sendBotResponse(io, data, messageType, botId, username, 'queue', songName);
        } else if (content.toLowerCase().startsWith('/titibot help')) {
            console.log(`❓ [BOT-DEBUG] Processing HELP command`);
            await this.sendBotResponse(io, data, messageType, botId, username, 'help');
        } else if (isTitiBotCommand) {
            console.log(`❌ [BOT-DEBUG] Unknown TitiBot command: "${content}"`);
        } else {
            console.log(`🤖 [BOT-DEBUG] Message does not match any bot commands, ignoring`);
        }
    }

    static async addBotToVoiceChannel(io, botId, username, voiceConnection) {
        const botParticipantKey = `${botId}-${voiceConnection.channelId}`;
        
        if (this.botVoiceParticipants.has(botParticipantKey)) {
            return;
        }

        const botParticipantData = {
            id: `bot-voice-${botId}`,
            user_id: botId.toString(),
            username: username,
            avatar_url: '/public/assets/common/default-profile-picture.png',
            isBot: true,
            channelId: voiceConnection.channelId,
            meetingId: voiceConnection.meetingId,
            joinedAt: Date.now()
        };

        this.botVoiceParticipants.set(botParticipantKey, botParticipantData);

        const voiceChannelRoom = `voice-channel-${voiceConnection.channelId}`;
        
        io.to(voiceChannelRoom).emit('bot-voice-participant-joined', {
            participant: botParticipantData,
            channelId: voiceConnection.channelId,
            meetingId: voiceConnection.meetingId
        });
    }

    static removeBotFromVoiceChannel(io, botId, channelId) {
        const botParticipantKey = `${botId}-${channelId}`;
        
        if (!this.botVoiceParticipants.has(botParticipantKey)) {
            return;
        }

        const botParticipant = this.botVoiceParticipants.get(botParticipantKey);
        this.botVoiceParticipants.delete(botParticipantKey);

        const voiceChannelRoom = `voice-channel-${channelId}`;
        io.to(voiceChannelRoom).emit('bot-voice-participant-left', {
            participant: botParticipant,
            channelId: channelId
        });
    }

    static async sendBotResponse(io, originalMessage, messageType, botId, username, command, parameter = null) {
        console.log(`📤 [BOT-DEBUG] Starting response generation:`, {
            command,
            parameter,
            messageType,
            botId,
            username,
            originalMessageId: originalMessage.id
        });
        
        let responseContent;
        let musicData = null;

        switch (command) {
            case 'ping':
                responseContent = '🏓 Pong! TitiBot is alive and ready to rock! 🎵';
                console.log(`🏓 [BOT-DEBUG] Generated PING response`);
                break;

            case 'help':
                responseContent = `🤖 **TitiBot Commands:**
📻 **/titibot ping** - Check if bot is alive
🎵 **/titibot play [song]** - Play music from iTunes
⏹️ **/titibot stop** - Stop current music
⏭️ **/titibot next** - Play next song
⏮️ **/titibot prev** - Play previous song
➕ **/titibot queue [song]** - Add song to queue`;
                console.log(`❓ [BOT-DEBUG] Generated HELP response`);
                break;

            case 'play':
                if (!parameter) {
                    responseContent = '❌ Udah di bilang formatnya play {namaLagu} masih ngemeng';
                    console.log(`❌ [BOT-DEBUG] PLAY command missing parameter`);
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
                    console.log(`🎵 [BOT-DEBUG] Generated PLAY response for: "${parameter}"`);
                }
                break;

            case 'stop':
                responseContent = '⏹️ Yah dimatiin';
                musicData = { action: 'stop' };
                console.log(`⏹️ [BOT-DEBUG] Generated STOP response`);
                break;

            case 'next':
                responseContent = '⏭️ Mainin musig selanjutnya';
                musicData = { action: 'next' };
                console.log(`⏭️ [BOT-DEBUG] Generated NEXT response`);
                break;

            case 'prev':
                responseContent = '⏮️ Mainin musig sebelumnya';
                musicData = { action: 'prev' };
                console.log(`⏮️ [BOT-DEBUG] Generated PREV response`);
                break;

            case 'queue':
                if (!parameter) {
                    responseContent = '❌ Udah di bilang formatnya queue {namaLagu} masih ngemeng';
                    console.log(`❌ [BOT-DEBUG] QUEUE command missing parameter`);
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
                    console.log(`➕ [BOT-DEBUG] Generated QUEUE response for: "${parameter}"`);
                }
                break;

            case 'not_in_voice':
                responseContent = '❌ You need to join a voice channel before using music commands.';
                console.log(`🎤 [BOT-DEBUG] Sending warning for not_in_voice command`);
                break;

            default:
                console.log(`❌ [BOT-DEBUG] Unknown command: ${command}`);
                return;
        }

        console.log(`⏳ [BOT-DEBUG] Waiting 3 seconds before sending response...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log(`🚀 [BOT-DEBUG] Sending bot response: "${responseContent?.substring(0, 50)}..."`);
        await this.sendDirectBotMessage(io, originalMessage, messageType, botId, username, responseContent, musicData);
    }

    static async sendDirectBotMessage(io, originalMessage, messageType, botId, username, responseContent, musicData) {
        console.log(`💬 [BOT-DEBUG] Starting direct bot message:`, {
            messageType,
            botId,
            username,
            content: responseContent?.substring(0, 50) + '...',
            hasMusicData: !!musicData,
            originalChannelId: originalMessage.channel_id,
            originalRoomId: originalMessage.room_id,
            originalTargetType: originalMessage.target_type,
            originalTargetId: originalMessage.target_id
        });
        
        const channelId = originalMessage.channel_id || (originalMessage.target_type === 'channel' ? originalMessage.target_id : null);
        const roomId = originalMessage.room_id || (originalMessage.target_type === 'dm' ? originalMessage.target_id : null);

        const targetType = messageType === 'channel' ? 'channel' : 'dm';
        const targetId = messageType === 'channel' ? channelId : roomId;
        
        console.log(`🎯 [BOT-DEBUG] Target resolution:`, {
            targetType,
            targetId,
            channelId,
            roomId
        });
        
        const temp_message_id = `bot-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const indonesiaTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
        const currentTimestamp = indonesiaTime.toISOString();

        // Create bot message data in the same format as user messages
        const botMessageData = {
            user_id: parseInt(botId),
            target_type: targetType,
            target_id: targetId,
            content: responseContent,
            message_type: 'text',
            attachments: [],
            mentions: [],
            reply_message_id: originalMessage.id,
            temp_message_id: temp_message_id
        };

        console.log(`💾 [BOT-DEBUG] Preparing database save:`, {
            targetType: botMessageData.target_type,
            targetId: botMessageData.target_id,
            content: botMessageData.content?.substring(0, 50) + '...',
            tempId: temp_message_id,
            replyToMessageId: originalMessage.id
        });

        try {
            // Send to the same endpoint that regular socket messages use
            const http = require('http');
            const querystring = require('querystring');
            
            const postData = JSON.stringify(botMessageData);
            
            const options = {
                hostname: 'app',
                port: 1001,
                path: '/api/chat/save-bot-message',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'X-Socket-User-ID': botId.toString(),
                    'X-Socket-Username': username,
                    'User-Agent': 'SocketServer/1.0'
                }
            };
            
            console.log(`🌐 [BOT-DEBUG] Making HTTP request to save bot message:`, {
                url: `http://app:1001${options.path}`,
                headers: options.headers
            });
            
            const response = await new Promise((resolve, reject) => {
                const req = http.request(options, (res) => {
                    let responseData = '';
                    
                    res.on('data', (chunk) => {
                        responseData += chunk;
                    });
                    
                    res.on('end', () => {
                        console.log(`🌐 [BOT-DEBUG] HTTP response received:`, {
                            statusCode: res.statusCode,
                            contentLength: responseData.length,
                            rawResponse: responseData.substring(0, 200) + (responseData.length > 200 ? '...' : '')
                        });
                        
                        try {
                            const result = JSON.parse(responseData);
                            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: result });
                        } catch (parseError) {
                            console.error(`❌ [BOT-DEBUG] Failed to parse response:`, parseError.message);
                            reject(new Error(`Failed to parse response: ${parseError.message}`));
                        }
                    });
                });
                
                req.on('error', (error) => {
                    console.error(`❌ [BOT-DEBUG] HTTP request error:`, error.message);
                    reject(error);
                });
                
                req.write(postData);
                req.end();
            });
            
            if (!response.ok) {
                console.error(`❌ [BOT-DEBUG] HTTP error response:`, {
                    status: response.status,
                    data: response.data
                });
                throw new Error(`HTTP ${response.status}: Bot message save failed`);
            }
            
            const saveResult = response.data;
            console.log(`✅ [BOT-DEBUG] Bot message saved successfully:`, {
                success: saveResult.success,
                messageId: saveResult.data?.message?.id || saveResult.message_id,
                tempId: temp_message_id
            });
            
            if (saveResult.success && saveResult.data?.message) {
                const savedMessage = saveResult.data.message;
                
                console.log(`📦 [BOT-DEBUG] Preparing broadcast data:`, {
                    realId: savedMessage.id,
                    tempId: temp_message_id,
                    sentAt: savedMessage.sent_at
                });
                
                // Prepare broadcast data with real database ID and all required fields
                const broadcastData = {
                    id: savedMessage.id,
                    message_id: savedMessage.id,
                    user_id: parseInt(botId),
                    username: username,
                    avatar_url: '/public/assets/common/default-profile-picture.png',
                    content: responseContent,
                    sent_at: savedMessage.sent_at || savedMessage.timestamp,
                    edited_at: null,
                    type: 'text',
                    message_type: 'text',
                    attachments: [],
                    has_reactions: false,
                    reaction_count: 0,
                    is_bot: true,
                    bot_id: botId,
                    timestamp: Date.parse(savedMessage.sent_at || currentTimestamp),
                    source: 'bot-message',
                    reply_message_id: originalMessage.id,
                    reply_data: {
                        message_id: originalMessage.id,
                        content: originalMessage.content,
                        user_id: originalMessage.user_id,
                        username: originalMessage.username,
                        avatar_url: originalMessage.avatar_url || '/public/assets/common/default-profile-picture.png'
                    }
                };

                // Add target-specific fields
                if (messageType === 'channel') {
                    broadcastData.channel_id = channelId;
                    broadcastData.target_type = 'channel';
                    broadcastData.target_id = channelId;
                } else {
                    broadcastData.room_id = roomId;
                    broadcastData.target_type = 'dm';
                    broadcastData.target_id = roomId;
                }

                // Add music data if present
                if (musicData) {
                    broadcastData.music_data = musicData;
                    console.log(`🎵 [BOT-DEBUG] Added music data to broadcast`);
                }
                
                const eventName = messageType === 'channel' ? 'new-channel-message' : 'user-message-dm';
                const targetRoom = messageType === 'channel' ? `channel-${channelId}` : `dm-room-${roomId}`;
                
                console.log(`📡 [BOT-DEBUG] Broadcasting bot message:`, {
                    eventName,
                    targetRoom,
                    messageId: savedMessage.id,
                    content: responseContent?.substring(0, 30) + '...'
                });
                
                // Use the same message forwarding as regular messages
                const MessageHandler = require('./messageHandler');
                
                // Create a mock client for the bot
                const mockBotClient = {
                    id: `bot-${botId}`,
                    data: {
                        user_id: parseInt(botId),
                        username: username,
                        avatar_url: '/public/assets/common/default-profile-picture.png',
                        authenticated: true
                    },
                    rooms: new Set([targetRoom]),
                    join: () => {},
                    to: () => ({
                        emit: () => {}
                    })
                };
                
                console.log(`🔄 [BOT-DEBUG] Using MessageHandler.forwardMessage for consistency`);
                
                // Forward the message using the standard message handler
                MessageHandler.forwardMessage(io, mockBotClient, eventName, broadcastData);
                
                // Send music command if needed
                if (musicData) {
                    io.to(targetRoom).emit('bot-music-command', {
                        channel_id: channelId,
                        room_id: roomId,
                        music_data: musicData
                    });
                    console.log(`🎵 [BOT-DEBUG] Music command sent for bot message`);
                }
                
                console.log(`✅ [BOT-DEBUG] Bot message fully processed and broadcasted`);
            } else {
                console.error(`❌ [BOT-DEBUG] Save failed:`, saveResult);
                throw new Error(`Failed to save bot message: ${saveResult.message || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error(`❌ [BOT-DEBUG] Error processing bot message:`, error.message);
            
            // Fallback: send temporary message if database save fails
            const fallbackData = {
                id: temp_message_id,
                user_id: parseInt(botId),
                username: username,
                avatar_url: '/public/assets/common/default-profile-picture.png',
                content: responseContent,
                sent_at: currentTimestamp,
                type: 'text',
                message_type: 'text',
                is_temporary: true,
                is_bot: true,
                bot_id: botId,
                error: 'Failed to save to database',
                timestamp: Date.now(),
                source: 'bot-fallback'
            };
            
            if (messageType === 'channel') {
                fallbackData.channel_id = channelId;
            } else {
                fallbackData.room_id = roomId;
            }
            
            const eventName = messageType === 'channel' ? 'new-channel-message' : 'user-message-dm';
            const targetRoom = messageType === 'channel' ? `channel-${channelId}` : `dm-room-${roomId}`;
            
            console.log(`⚠️ [BOT-DEBUG] Sending fallback message to room: ${targetRoom}`);
            
            io.to(targetRoom).emit(eventName, fallbackData);
            console.log(`⚠️ [BOT-DEBUG] Sent fallback temporary bot message`);
        }
    }

    static async handleCommand(io, commandData) {
        const { command, channel_id, user_id, username } = commandData;

        const titiBotId = this.getTitiBotId();
        if (!titiBotId) {
            return;
        }

        const bot = this.bots.get(titiBotId);
        if (!bot) {
            return;
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
        
        return true;
    }

    static getBotStatus(botId) {
        const bot = this.bots.get(botId);
        return bot || null;
    }

    static async ensureBotInVoiceChannel(io, botId, username, channelId) {
        const botParticipantKey = `${botId}-${channelId}`;
        
        if (this.botVoiceParticipants.has(botParticipantKey)) {
            console.log(`🤖 [BOT-VOICE] Bot ${username} already in voice channel ${channelId}`);
            return;
        }

        console.log(`🤖 [BOT-VOICE] Adding bot ${username} to voice channel ${channelId}`);
        
        const botParticipantData = {
            id: `bot-voice-${botId}`,
            user_id: botId.toString(),
            username: username,
            avatar_url: '/public/assets/common/default-profile-picture.png',
            isBot: true,
            channelId: channelId,
            meetingId: `voice_channel_${channelId}`,
            joinedAt: Date.now()
        };

        this.botVoiceParticipants.set(botParticipantKey, botParticipantData);

        const voiceChannelRoom = `voice-channel-${channelId}`;
        
        io.to(voiceChannelRoom).emit('bot-voice-participant-joined', {
            participant: botParticipantData,
            channelId: channelId,
            meetingId: `voice_channel_${channelId}`
        });
        
        console.log(`✅ [BOT-VOICE] Bot ${username} successfully joined voice channel ${channelId}`);
    }
}

module.exports = BotHandler;
