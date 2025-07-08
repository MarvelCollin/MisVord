const roomManager = require('../services/roomManager');
const VoiceConnectionTracker = require('../services/voiceConnectionTracker');
const EventEmitter = require('events');

class BotHandler extends EventEmitter {
    static bots = new Map();
    static activeConnections = new Map();
    static processedMessages = new Set();
    static botEventEmitter = new EventEmitter();
    static botVoiceParticipants = new Map();

    static async registerBot(botId, username) {
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
            lastActivity: Date.now(),
            avatar_url: '/public/assets/landing-page/robot.webp'
        });
        
        const avatar = await this.fetchBotAvatar(username);
        if (avatar) {
            const botObj = this.bots.get(botId);
            if (botObj) botObj.avatar_url = avatar;
        }
    }

    static connectBot(io, botId, username) {
        console.log(`🤖 [BOT-DEBUG] Connecting bot:`, {
            botId,
            username,
            existingBot: this.bots.has(botId)
        });
        
        const bot = this.bots.get(botId);
        if (!bot) {

            this.registerBot(botId, username);
        }

        const botClient = {
            id: `bot-${botId}`,
            data: {
                user_id: botId,
                username: username,
                isBot: true,
                authenticated: true,
                avatar_url: (this.bots.get(botId)?.avatar_url) || '/public/assets/landing-page/robot.webp'
            },
            emit: (event, data) => {

            },
            to: (room) => ({
                emit: (event, data) => {
                    io.to(room).emit(event, data);
                }
            })
        };

        this.activeConnections.set(botId, botClient);
        

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
            console.log(`⚠️ [BOT-DEBUG] Message already processed:`, {
                messageId,
                content: data.content?.substring(0, 30) + '...'
            });
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
        

        if (String(data.user_id) === String(botId)) {
            console.log(`🤖 [BOT-DEBUG] Ignoring bot's own message to prevent recursion:`, {
                messageUserId: data.user_id,
                botId: botId,
                content: data.content?.substring(0, 30) + '...'
            });
            return;
        }

        const content = data.content?.toLowerCase().trim();
        

        let voiceChannelToJoin = null;

        if (!content) {

            return;
        }

        const isTitiBotCommand = content.startsWith('/titibot');

        
        const voiceRequiredCommands = ['play', 'stop', 'next', 'prev', 'queue', 'join'];
        const commandKeyword = content.split(' ')[1] || '';
        const requiresVoice = voiceRequiredCommands.includes(commandKeyword);

        if (data.voice_context && data.voice_context.voice_channel_id) {
            voiceChannelToJoin = data.voice_context.voice_channel_id;

        } else {

        }

        if (requiresVoice && !voiceChannelToJoin) {

            await this.sendBotResponse(io, data, messageType, botId, username, 'not_in_voice');
            return;
        }

        /* -------- Command Routing -------- */
        if (content.toLowerCase() === '/titibot ping') {

            await this.sendBotResponse(io, data, messageType, botId, username, 'ping');
        } else if (content.toLowerCase().startsWith('/titibot play ')) {
            const songName = content.substring('/titibot play '.length).trim();


            

            if (voiceChannelToJoin) {

                await this.ensureBotInVoiceChannel(io, botId, username, voiceChannelToJoin);
            } else {
                console.warn(`⚠️ [BOT-DEBUG] No voice channel context for PLAY command - music will play without bot joining`);
            }
            
            await this.sendBotResponse(io, data, messageType, botId, username, 'play', songName);
        } else if (content.toLowerCase() === '/titibot stop') {

            

            let channelIdForLeave = voiceChannelToJoin;
            if (!channelIdForLeave) {

                for (const key of this.botVoiceParticipants.keys()) {
                    if (key.startsWith(`${botId}-`)) {
                        channelIdForLeave = key.split('-')[1];
                        break;
                    }
                }
            }
            if (channelIdForLeave) {

                this.removeBotFromVoiceChannel(io, botId, channelIdForLeave);
            }
            
            await this.sendBotResponse(io, data, messageType, botId, username, 'stop');
        } else if (content.toLowerCase() === '/titibot next') {

            await this.sendBotResponse(io, data, messageType, botId, username, 'next');
        } else if (content.toLowerCase() === '/titibot prev') {

            await this.sendBotResponse(io, data, messageType, botId, username, 'prev');
        } else if (content.toLowerCase().startsWith('/titibot queue ')) {
            const songName = content.substring('/titibot queue '.length).trim();

            await this.sendBotResponse(io, data, messageType, botId, username, 'queue', songName);
        } else if (content.toLowerCase().startsWith('/titibot help')) {

            await this.sendBotResponse(io, data, messageType, botId, username, 'help');
        } else if (isTitiBotCommand) {

        } else {

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
            avatar_url: this.bots.get(botId)?.avatar_url || '/public/assets/landing-page/robot.webp',
            isBot: true,
            channelId: voiceConnection.channelId,
            meetingId: voiceConnection.meetingId,
            joinedAt: Date.now()
        };

        this.botVoiceParticipants.set(botParticipantKey, botParticipantData);

        const voiceChannelRoom = `voice_channel_${voiceConnection.channelId}`;
        
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


        

        const voiceChannelRoom = `voice_channel_${channelId}`;
        const eventData = {
            participant: botParticipant,
            channelId: channelId
        };
        
        io.to(voiceChannelRoom).emit('bot-voice-participant-left', eventData);
        io.to(`channel-${channelId}`).emit('bot-voice-participant-left', eventData);
        

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
                responseContent = '🏓 Pong! Saya TitiBot siap nyanyi buat abang.';

                break;

            case 'help':
                responseContent = `🤖 **TitiBot Commands:**
📻 **/titibot ping** - Cek apakah botnya aktif
🎵 **/titibot play [song]** - Nyanyi musig 
⏹️ **/titibot stop** - Stop musig
⏭️ **/titibot next** - Nyanyi musig selanjutnya
⏮️ **/titibot prev** - Nyanyi musig sebelumnya
➕ **/titibot queue [song]** - Tambahin ke list`;

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
                            artist: '',
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
                    responseContent = '❌ Udah di bilang formatnya queue {namaLagu} malah ngemeng';

                } else {
                    responseContent = `➕ Berhasil di tambahin di queue king: "${parameter}"`;
                    musicData = {
                        action: 'queue',
                        query: parameter,
                        track: {
                            title: parameter,
                            artist: ''
                        }
                    };

                }
                break;

            case 'not_in_voice':
                responseContent = '❌ Minimal masuk voice channel dulu sih bang.';

                break;

            default:

                return;
        }


        await new Promise(resolve => setTimeout(resolve, 1000));
        

        await this.sendDirectBotMessage(io, originalMessage, messageType, botId, username, responseContent, musicData);
    }

    static async sendImmediateBotResponse(io, originalMessage, messageType, botId, username, responseContent, musicData) {

        
        const channelId = originalMessage.channel_id || (originalMessage.target_type === 'channel' ? originalMessage.target_id : null);
        const roomId = originalMessage.room_id || (originalMessage.target_type === 'dm' ? originalMessage.target_id : null);
        
        const temp_message_id = `bot-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const indonesiaTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
        const currentTimestamp = indonesiaTime.toISOString();
        
        const immediateData = {
            id: temp_message_id,
            user_id: parseInt(botId),
            username: username,
            avatar_url: this.bots.get(botId)?.avatar_url || '/public/assets/landing-page/robot.webp',
            content: responseContent,
            sent_at: currentTimestamp,
            type: 'text',
            message_type: 'text',
            is_bot: true,
            bot_id: botId,
            timestamp: Date.now(),
            source: 'bot-immediate',
            reply_message_id: originalMessage.id,
            reply_data: {
                message_id: originalMessage.id,
                content: originalMessage.content,
                user_id: originalMessage.user_id,
                username: originalMessage.username,
                avatar_url: originalMessage.avatar_url || '/public/assets/landing-page/robot.webp'
            }
        };
        
        if (messageType === 'channel') {
            immediateData.channel_id = channelId;
        } else {
            immediateData.room_id = roomId;
        }
        
        const eventName = messageType === 'channel' ? 'new-channel-message' : 'user-message-dm';
        const targetRoom = messageType === 'channel' ? `channel-${channelId}` : `dm-room-${roomId}`;
        

        io.to(targetRoom).emit(eventName, immediateData);
        

                    if (musicData) {
                const musicCommandData = {
                    channel_id: channelId,
                    room_id: roomId,
                    music_data: musicData,
                    bot_id: botId,
                    timestamp: Date.now()
                };
                
                // Only send to the text channel room and voice channel room
                io.to(targetRoom).emit('bot-music-command', musicCommandData);
                
                if (channelId) {
                    const voiceChannelRoom = `voice_channel_${channelId}`;
                    io.to(voiceChannelRoom).emit('bot-music-command', musicCommandData);
                }
                
                // Removed global broadcast to prevent music playing for all users
                // io.emit('bot-music-command', musicCommandData);
            }
        

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

        // Sanitize reply_message_id: only forward numeric IDs to the backend
        const replyIdForDB = (originalMessage.id && !isNaN(originalMessage.id) && originalMessage.id !== '') 
            ? parseInt(originalMessage.id) 
            : null;
        const botMessageData = {
            user_id: parseInt(botId),
            target_type: targetType,
            target_id: targetId,
            content: responseContent,
            message_type: 'text',
            attachments: [],
            mentions: [],
            reply_message_id: replyIdForDB,
            temp_message_id: temp_message_id
        };

        const broadcastData = {
            id: temp_message_id,
            temp_message_id: temp_message_id,
            user_id: parseInt(botId),
            username: username,
            avatar_url: this.bots.get(botId)?.avatar_url || '/public/assets/landing-page/robot.webp',
            content: responseContent,
            sent_at: currentTimestamp,
            timestamp: Date.parse(currentTimestamp),
            message_type: 'text',
            is_temporary: true,
            is_bot: true,
            bot_id: botId,
            source: 'bot-temp-message',
            reply_message_id: originalMessage.id,
            reply_data: {
                message_id: originalMessage.id,
                content: originalMessage.content,
                user_id: originalMessage.user_id,
                username: originalMessage.username,
                avatar_url: originalMessage.avatar_url || '/public/assets/landing-page/robot.webp'
            }
        };

        if (messageType === 'channel') {
            broadcastData.channel_id = channelId;
            broadcastData.target_type = 'channel';
            broadcastData.target_id = channelId;
        } else {
            broadcastData.room_id = roomId;
            broadcastData.target_type = 'dm';
            broadcastData.target_id = roomId;
        }

        if (musicData) {
            broadcastData.music_data = musicData;
        }

        const eventName = messageType === 'channel' ? 'new-channel-message' : 'user-message-dm';
        const targetRoom = messageType === 'channel' ? `channel-${channelId}` : `dm-room-${roomId}`;
        
        console.log(`📡 [BOT-DEBUG] Broadcasting temporary bot message:`, {
            eventName,
            targetRoom,
            tempMessageId: temp_message_id,
            content: responseContent?.substring(0, 30) + '...'
        });
        
        io.to(targetRoom).emit(eventName, broadcastData);

        console.log(`💾 [BOT-DEBUG] Preparing database save:`, {
            targetType: botMessageData.target_type,
            targetId: botMessageData.target_id,
            content: botMessageData.content?.substring(0, 50) + '...',
            tempId: temp_message_id,
            replyToMessageId: originalMessage.id,
            sanitizedReplyId: replyIdForDB,
            replyIdType: typeof replyIdForDB,
            originalIdType: typeof originalMessage.id
        });

        try {
            const http = require('http');
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
                        

                        if (!responseData || responseData.trim() === '') {
                            console.error(`❌ [BOT-DEBUG] Empty response received`);
                            return reject(new Error('Empty response received from server'));
                        }
                        
                        try {
                            const result = JSON.parse(responseData);
                            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: result });
                        } catch (parseError) {
                            console.error(`❌ [BOT-DEBUG] Failed to parse response:`, {
                                error: parseError.message,
                                responseData: responseData.substring(0, 500)
                            });
                            reject(new Error(`Failed to parse response: ${parseError.message}`));
                        }
                    });
                });
                
                req.on('error', (error) => {
                    console.error(`❌ [BOT-DEBUG] HTTP request error:`, error.message);
                    reject(error);
                });
                

                req.setTimeout(10000, () => {
                    req.abort();
                    reject(new Error('Request timeout after 10s'));
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
            

            let savedMessageObj = null;
            if (response.data.data?.message) {
                savedMessageObj = response.data.data.message;
            } else if (response.data.data?.data?.message) {
                savedMessageObj = response.data.data.data.message;
            }
            
            console.log(`✅ [BOT-DEBUG] Bot message saved successfully:`, {
                success: response.ok,
                messageId: savedMessageObj?.id || response.data.message_id,
                tempId: temp_message_id
            });
            
            if (response.ok && savedMessageObj) {
                const savedMessage = savedMessageObj;
                
                console.log(`📦 [BOT-DEBUG] Preparing message_id_updated event:`, {
                    realId: savedMessage.id,
                    tempId: temp_message_id,
                    sentAt: savedMessage.sent_at
                });
                
                const updateData = {
                    temp_message_id: temp_message_id,
                    real_message_id: savedMessage.id,
                    message_data: {
                        id: savedMessage.id,
                        message_id: savedMessage.id,
                        user_id: parseInt(botId),
                        username: username,
                        avatar_url: this.bots.get(botId)?.avatar_url || '/public/assets/landing-page/robot.webp',
                        content: responseContent,
                        sent_at: savedMessage.sent_at || currentTimestamp,
                        created_at: savedMessage.sent_at || currentTimestamp,
                        edited_at: null,
                        type: 'text',
                        message_type: 'text',
                        attachments: [],
                        has_reactions: false,
                        reaction_count: 0,
                        reactions: [],
                        is_bot: true,
                        bot_id: botId,
                        timestamp: Date.parse(savedMessage.sent_at || currentTimestamp),
                        source: 'database-loaded',
                        is_temporary: false,
                        is_pinned: false,
                        reply_message_id: originalMessage.id,
                        reply_data: {
                            message_id: originalMessage.id,
                            content: originalMessage.content,
                            user_id: originalMessage.user_id,
                            username: originalMessage.username,
                            avatar_url: originalMessage.avatar_url || '/public/assets/landing-page/robot.webp'
                        }
                    },
                    timestamp: Date.now()
                };

                if (messageType === 'channel') {
                    updateData.message_data.channel_id = channelId;
                    updateData.message_data.target_type = 'channel';
                    updateData.message_data.target_id = channelId;
                } else {
                    updateData.message_data.room_id = roomId;
                    updateData.message_data.target_type = 'dm';
                    updateData.message_data.target_id = roomId;
                }

                if (musicData) {
                    updateData.message_data.music_data = musicData;
                }
                
                console.log(`📡 [BOT-DEBUG] Emitting message_id_updated event:`, {
                    targetRoom,
                    tempId: temp_message_id,
                    realId: savedMessage.id
                });
                io.to(targetRoom).emit('message_id_updated', updateData);

                if (musicData) {
                    const musicCommandData = {
                        channel_id: channelId,
                        room_id: roomId,
                        music_data: musicData,
                        bot_id: botId,
                        timestamp: Date.now()
                    };
                    
                    console.log(`🎵 [BOT-DEBUG] Emitting music command to target rooms:`, {
                        targetRoom,
                        channelId,
                        roomId,
                        action: musicData.action
                    });
                    
                    // Send to the text channel room
                    io.to(targetRoom).emit('bot-music-command', musicCommandData);
                    
                    // Send to the voice channel room
                    if (channelId) {
                        const voiceChannelRoom = `voice_channel_${channelId}`;
                        io.to(voiceChannelRoom).emit('bot-music-command', musicCommandData);
                    }
                    
                    // Removed global broadcast to fix the issue with music playing for all users
                    // io.emit('bot-music-command', musicCommandData);
                }
            } else {
                console.error(`❌ [BOT-DEBUG] Save failed:`, response.data);
                throw new Error(`Failed to save bot message: ${response.data.message || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error(`❌ [BOT-DEBUG] Error processing bot message:`, error.message);
            
            const errorData = {
                temp_message_id: temp_message_id,
                error: error.message || 'Failed to save to database'
            };
            
            io.to(targetRoom).emit('message_save_failed', errorData);
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

            return;
        }


        

        const botClient = this.activeConnections.get(botId);
        const roomManager = require('../services/roomManager');
        const voiceChannelRoom = `voice_channel_${channelId}`;
        

        if (botClient) {
            try {

                const mockSocket = {
                    id: `bot-${botId}`,
                    rooms: new Set(),
                    join: (room) => {


                    },
                    leave: (room) => {

                    }
                };
                

            } catch (error) {
                console.error(`❌ [BOT-VOICE] Error joining voice room:`, error);
            }
        }
        
        const botParticipantData = {
            id: `bot-voice-${botId}`,
            user_id: botId.toString(),
            username: username,
            avatar_url: this.bots.get(botId)?.avatar_url || '/public/assets/landing-page/robot.webp',
            isBot: true,
            channelId: channelId,
            meetingId: `voice_channel_${channelId}`,
            joinedAt: Date.now()
        };

        this.botVoiceParticipants.set(botParticipantKey, botParticipantData);



        
        io.to(voiceChannelRoom).emit('bot-voice-participant-joined', {
            participant: botParticipantData,
            channelId: channelId,
            meetingId: `voice_channel_${channelId}`
        });
        

        io.to(`channel-${channelId}`).emit('bot-voice-participant-joined', {
            participant: botParticipantData,
            channelId: channelId,
            meetingId: `voice_channel_${channelId}`
        });
        

    }

    static async fetchBotAvatar(username) {
        return new Promise((resolve) => {
            try {
                const http = require('http');
                const options = {
                    hostname: 'app',
                    port: 1001,
                    path: `/api/bot/user/${username}`,
                    method: 'GET',
                    headers: { 'User-Agent': 'SocketServer/1.0' }
                };
                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const result = JSON.parse(data);
                            if (result.success && result.bot && result.bot.avatar_url) {
                                resolve(result.bot.avatar_url);
                            } else {
                                resolve(null);
                            }
                        } catch { resolve(null); }
                    });
                });
                req.on('error', () => resolve(null));
                req.end();
            } catch { resolve(null); }
        });
    }
}

module.exports = BotHandler;
