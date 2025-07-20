const roomManager = require('../services/roomManager');
const VoiceConnectionTracker = require('../services/voiceConnectionTracker');
const EventEmitter = require('events');
const { buildApiUrl } = require('../config/env');

class BotHandler extends EventEmitter {
    static bots = new Map();
    static activeConnections = new Map();
    static processedMessages = new Set();
    static botEventEmitter = new EventEmitter();
    static botVoiceParticipants = new Map();
    static musicQueues = new Map();

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
            emit: (event, data) => {},
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
            roomId: data.room_id,
            tempMessageId: data.id
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
        
        if (isTitiBotCommand) {
            console.log(`🤖 [BOT-DEBUG] TitiBot command detected, waiting for message to be saved to database:`, {
                tempMessageId: data.id,
                command: content
            });
            
            this.waitForMessageSaved(io, data, messageType, botId, username, content);
            return;
        }
    }

    static waitForMessageSaved(io, originalData, messageType, botId, username, content) {
        const tempMessageId = originalData.id;
        const timeout = setTimeout(() => {
            console.warn(`⚠️ [BOT-DEBUG] Timeout waiting for message to be saved, proceeding anyway:`, {
                tempMessageId,
                command: content
            });
            this.processBotCommand(io, originalData, messageType, botId, username, content, null);
        }, 5000);

        const messageUpdatedHandler = (updateData) => {
            if (updateData.temp_message_id === tempMessageId) {
                clearTimeout(timeout);
                io.off('message_id_updated', messageUpdatedHandler);
                
                console.log(`✅ [BOT-DEBUG] Original message saved, proceeding with bot response:`, {
                    tempId: tempMessageId,
                    realId: updateData.real_message_id,
                    command: content
                });
                
                const updatedData = {
                    ...originalData,
                    id: updateData.real_message_id,
                    message_id: updateData.real_message_id
                };
                
                this.processBotCommand(io, updatedData, messageType, botId, username, content, updateData.real_message_id);
            }
        };

        io.on('message_id_updated', messageUpdatedHandler);
    }

    static async processBotCommand(io, data, messageType, botId, username, content, realMessageId) {
        console.log(`🤖 [BOT-DEBUG] Processing bot command:`, {
            command: content,
            realMessageId,
            botId,
            username
        });

        let voiceChannelToJoin = null;
        
        const voiceRequiredCommands = ['play', 'stop', 'next', 'prev', 'queue', 'list'];
        const leaveCommands = ['stop'];
        const commandKeyword = content.split(' ')[1] || '';
        const requiresVoice = voiceRequiredCommands.includes(commandKeyword);
        const requiresLeave = leaveCommands.includes(commandKeyword);

        if (data.voice_context && data.voice_context.voice_channel_id) {
            voiceChannelToJoin = data.voice_context.voice_channel_id;
        }

        if (requiresVoice && !voiceChannelToJoin && !requiresLeave) {
            await this.sendBotResponse(io, data, messageType, botId, username, 'not_in_voice');
            return;
        }

        if (content === '/titibot ping') {
            await this.sendBotResponse(io, data, messageType, botId, username, 'ping');
        } else if (content.startsWith('/titibot play ')) {
            const songName = content.substring('/titibot play '.length).trim();

            if (voiceChannelToJoin) {
                await this.joinBotToVoiceChannel(io, botId, username, voiceChannelToJoin);
            }
            
            await this.sendBotResponse(io, data, messageType, botId, username, 'play', songName);
        } else if (content === '/titibot stop') {
            if (voiceChannelToJoin) {
                await this.leaveBotFromVoiceChannel(io, botId, voiceChannelToJoin);
            } else {
                for (const key of this.botVoiceParticipants.keys()) {
                    if (key.startsWith(`${botId}-`)) {
                        const channelIdForLeave = key.split('-')[1];
                        await this.leaveBotFromVoiceChannel(io, botId, channelIdForLeave);
                        break;
                    }
                }
            }
            await this.sendBotResponse(io, data, messageType, botId, username, 'stop');
        } else if (content === '/titibot next') {
            if (voiceChannelToJoin) {
                await this.joinBotToVoiceChannel(io, botId, username, voiceChannelToJoin);
            }
            await this.sendBotResponse(io, data, messageType, botId, username, 'next');
        } else if (content === '/titibot prev') {
            await this.sendBotResponse(io, data, messageType, botId, username, 'prev');
        } else if (content.startsWith('/titibot queue ')) {
            const songName = content.substring('/titibot queue '.length).trim();
            await this.sendBotResponse(io, data, messageType, botId, username, 'queue', songName);
        } else if (content.startsWith('/titibot help')) {
            await this.sendBotResponse(io, data, messageType, botId, username, 'help');
        } else if (content === '/titibot list') {
            await this.sendBotResponse(io, data, messageType, botId, username, 'list');
        }
    }

    static async joinBotToVoiceChannel(io, botId, username, channelId) {
        const botParticipantKey = `${botId}-${channelId}`;
        
        if (this.botVoiceParticipants.has(botParticipantKey)) {
            return;
        }

        for (const [key, participant] of this.botVoiceParticipants.entries()) {
            if (key.startsWith(`${botId}-`) && participant.channelId !== channelId) {
                await this.leaveBotFromVoiceChannel(io, botId, participant.channelId);
                break;
            }
        }

        if (!this.bots.has(botId)) {
            await this.registerBot(botId, username);
        }

        const botData = this.bots.get(botId);
        const avatarUrl = botData?.avatar_url || '/public/assets/landing-page/robot.webp';

        try {
            const virtualBotClient = {
                id: `bot-${botId}-${channelId}`,
                data: {
                    user_id: botId,
                    username: username,
                    isBot: true,
                    authenticated: true,
                    avatar_url: avatarUrl
                },
                join: async (room) => {},
                leave: async (room) => {},
                emit: (event, data) => {}
            };

            const registrationData = {
                channel_id: channelId,
                meeting_id: `voice_channel_${channelId}`,
                username: username,
                broadcast: true
            };

            const roomManager = require('../services/roomManager');
            const VoiceConnectionTracker = require('../services/voiceConnectionTracker');

            VoiceConnectionTracker.addBotToVoice(
                botId, 
                channelId, 
                registrationData.meeting_id, 
                username
            );

            roomManager.addVoiceMeeting(channelId, registrationData.meeting_id, virtualBotClient.id);

            await virtualBotClient.join(`voice_channel_${channelId}`);

            const botParticipantData = {
                id: `bot-voice-${botId}`,
                user_id: botId.toString(),
                username: username,
                avatar_url: avatarUrl,
                isBot: true,
                channelId: channelId,
                channel_id: channelId,
                meetingId: registrationData.meeting_id,
                joinedAt: Date.now(),
                status: 'Ready to play music'
            };

            this.botVoiceParticipants.set(botParticipantKey, botParticipantData);

            const participants = VoiceConnectionTracker.getChannelParticipants(channelId);
            const participantCount = participants.length;

            const joinEventData = {
                channel_id: channelId,
                meeting_id: registrationData.meeting_id,
                participant_count: participantCount,
                action: 'join',
                user_id: botId,
                username: username,
                avatar_url: avatarUrl,
                isBot: true,
                timestamp: Date.now()
            };

            const botEventData = {
                participant: botParticipantData,
                channelId: channelId,
                meetingId: registrationData.meeting_id
            };

            io.emit('voice-meeting-update', joinEventData);
            io.to(`voice_channel_${channelId}`).emit('voice-meeting-update', joinEventData);
            io.to(`channel-${channelId}`).emit('voice-meeting-update', joinEventData);
            
            io.to(`voice_channel_${channelId}`).emit('bot-voice-participant-joined', botEventData);
            io.to(`channel-${channelId}`).emit('bot-voice-participant-joined', botEventData);

        } catch (error) {
            console.error(`❌ [BOT-JOIN] Failed to join bot ${botId} to channel ${channelId}:`, error);
            throw error;
        }
    }

    static async leaveBotFromVoiceChannel(io, botId, channelId) {
        const botParticipantKey = `${botId}-${channelId}`;
        
        if (!this.botVoiceParticipants.has(botParticipantKey)) {
            return;
        }

        try {
            const botParticipantData = this.botVoiceParticipants.get(botParticipantKey);
            const virtualBotClientId = `bot-${botId}-${channelId}`;

            const roomManager = require('../services/roomManager');
            const VoiceConnectionTracker = require('../services/voiceConnectionTracker');

            const result = roomManager.removeVoiceMeeting(channelId, virtualBotClientId);
            VoiceConnectionTracker.removeBotFromVoice(botId, channelId);
            this.botVoiceParticipants.delete(botParticipantKey);

            const participants = VoiceConnectionTracker.getChannelParticipants(channelId);
            const participantCount = participants.length;

            const leaveEventData = {
                channel_id: channelId,
                meeting_id: botParticipantData.meetingId,
                participant_count: participantCount,
                action: 'leave',
                user_id: botId,
                username: botParticipantData.username,
                isBot: true,
                timestamp: Date.now(),
                reason: 'command_triggered'
            };

            const botEventData = {
                participant: botParticipantData,
                channelId: channelId,
                meetingId: botParticipantData.meetingId
            };

            io.emit('voice-meeting-update', leaveEventData);
            io.to(`voice_channel_${channelId}`).emit('voice-meeting-update', leaveEventData);
            io.to(`channel-${channelId}`).emit('voice-meeting-update', leaveEventData);
            
            io.to(`voice_channel_${channelId}`).emit('bot-voice-participant-left', botEventData);
            io.to(`channel-${channelId}`).emit('bot-voice-participant-left', botEventData);

        } catch (error) {
            console.error(`❌ [BOT-LEAVE] Failed to remove bot ${botId} from channel ${channelId}:`, error);
            throw error;
        }
    }


    static async ensureBotInVoiceChannel(io, botId, username, channelId) {
        return await this.joinBotToVoiceChannel(io, botId, username, channelId);
    }


    static removeBotFromVoiceChannel(io, botId, channelId) {
        const VoiceConnectionTracker = require('../services/voiceConnectionTracker');
        const humanParticipants = VoiceConnectionTracker.getHumanParticipants(channelId);
        
        if (humanParticipants.length > 0) {
            return;
        }

        const musicStopData = {
            channel_id: channelId,
            music_data: { action: 'stop' },
            bot_id: botId,
            timestamp: Date.now()
        };
        
        const voiceChannelRoom = `voice_channel_${channelId}`;
        const channelRoom = `channel-${channelId}`;
        
        io.to(voiceChannelRoom).emit('bot-music-command', musicStopData);
        io.to(channelRoom).emit('bot-music-command', musicStopData);

        this.leaveBotFromVoiceChannel(io, botId, channelId);
    }

    static async searchMusic(query) {
        try {
            const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=5&country=us`;
            const https = require('https');
            
            return new Promise((resolve, reject) => {
                const req = https.get(apiUrl, (res) => {
                    let data = '';
                    
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    
                    res.on('end', () => {
                        try {
                            const result = JSON.parse(data);
                            if (result.results && result.results.length > 0) {
                                const track = result.results.find(t => t.previewUrl);
                                if (track) {
                                    resolve({
                                        title: track.trackName,
                                        artist: track.artistName,
                                        album: track.collectionName,
                                        previewUrl: track.previewUrl,
                                        artworkUrl: track.artworkUrl100,
                                        duration: track.trackTimeMillis,
                                        id: track.trackId
                                    });
                                } else {
                                    resolve(null);
                                }
                            } else {
                                resolve(null);
                            }
                        } catch (parseError) {
                            resolve(null);
                        }
                    });
                });
                
                req.on('error', () => {
                    resolve(null);
                });
                
                req.setTimeout(5000, () => {
                    req.abort();
                    resolve(null);
                });
            });
        } catch (error) {
            return null;
        }
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
⏹️ **/titibot stop** - Stop musig dan keluar dari voice channel
⏭️ **/titibot next** - Nyanyi musig selanjutnya
⏮️ **/titibot prev** - Nyanyi musig sebelumnya
➕ **/titibot queue [song]** - Tambahin ke list
📋 **/titibot list** - Lihat daftar lagu dalam queue`;
                break;

            case 'play':
                if (!parameter) {
                    responseContent = '❌ Udah di bilang formatnya play {namaLagu} masih ngemeng';
                } else {
                    const searchResult = await this.searchMusic(parameter);
                    if (searchResult && searchResult.previewUrl) {
                        responseContent = `🎵 MUSIGGGGGGGGGGGGGG: **${searchResult.title}** by **${searchResult.artist}** 🎶`;
                        musicData = {
                            action: 'play',
                            query: parameter,
                            track: searchResult
                        };
                        
                        const playChannelKey = originalMessage.channel_id || originalMessage.target_id;
                        if (playChannelKey) {
                            if (!this.musicQueues.has(playChannelKey)) {
                                this.musicQueues.set(playChannelKey, []);
                            }
                            const queue = this.musicQueues.get(playChannelKey);
                            queue.forEach(song => song.isCurrentlyPlaying = false);
                            queue.unshift({
                                title: searchResult.title,
                                artist: searchResult.artist,
                                previewUrl: searchResult.previewUrl,
                                addedAt: new Date().toISOString(),
                                isCurrentlyPlaying: true
                            });
                        }
                    } else {
                        responseContent = `❌ Sorry bang, ga nemu lagu "${parameter}" di iTunes. Coba judul lagu yang lain ya~`;
                    }
                }
                break;

            case 'stop':
                const stopChannelKey = originalMessage.channel_id || originalMessage.target_id;
                if (stopChannelKey && this.musicQueues.has(stopChannelKey)) {
                    const queueLength = this.musicQueues.get(stopChannelKey).length;
                    this.musicQueues.delete(stopChannelKey);
                    responseContent = `⏹️ Music stopped! Cleared ${queueLength} song(s) from queue. Saya keluar dari voice channel ya~`;
                } else {
                    responseContent = '⏹️ Music stopped! Saya keluar dari voice channel ya~';
                }
                musicData = { action: 'stop' };
                break;

            case 'next':
                const nextChannelKey = originalMessage.channel_id || originalMessage.target_id;
                if (nextChannelKey && this.musicQueues.has(nextChannelKey)) {
                    const queue = this.musicQueues.get(nextChannelKey);
                    if (queue.length > 1) {
                        let currentPlayingIndex = queue.findIndex(song => song.isCurrentlyPlaying);
                        if (currentPlayingIndex === -1) {
                            queue.forEach(song => song.isCurrentlyPlaying = false);
                            queue[0].isCurrentlyPlaying = true;
                            const firstTrack = queue[0];
                            responseContent = `🎵 Starting with first song: **${firstTrack.title}** by **${firstTrack.artist}**`;
                            musicData = { 
                                action: 'next',
                                track: firstTrack
                            };
                        } else if (currentPlayingIndex < queue.length - 1) {
                            queue.forEach(song => song.isCurrentlyPlaying = false);
                            queue[currentPlayingIndex + 1].isCurrentlyPlaying = true;
                            const nextTrack = queue[currentPlayingIndex + 1];
                            responseContent = `⏭️ Next song: **${nextTrack.title}** by **${nextTrack.artist}**`;
                            musicData = { 
                                action: 'next',
                                track: nextTrack
                            };
                        } else {
                            responseContent = '❌ Already at the last song in queue';
                        }
                    } else if (queue.length === 1) {
                        let currentPlayingIndex = queue.findIndex(song => song.isCurrentlyPlaying);
                        if (currentPlayingIndex === -1) {
                            queue[0].isCurrentlyPlaying = true;
                            const onlyTrack = queue[0];
                            responseContent = `🎵 Playing the only song: **${onlyTrack.title}** by **${onlyTrack.artist}**`;
                            musicData = { 
                                action: 'next',
                                track: onlyTrack
                            };
                        } else {
                            responseContent = '❌ No next song in queue. Add more songs with `/titibot queue [song name]`';
                        }
                    } else {
                        responseContent = '❌ Queue is empty. Add songs first with `/titibot play [song name]` or `/titibot queue [song name]`';
                    }
                } else {
                    responseContent = '❌ No music queue found for this channel';
                }
                break;

            case 'prev':
                const prevChannelKey = originalMessage.channel_id || originalMessage.target_id;
                if (prevChannelKey && this.musicQueues.has(prevChannelKey)) {
                    const queue = this.musicQueues.get(prevChannelKey);
                    if (queue.length > 1) {
                        let currentPlayingIndex = queue.findIndex(song => song.isCurrentlyPlaying);
                        if (currentPlayingIndex === -1) {
                            queue.forEach(song => song.isCurrentlyPlaying = false);
                            queue[0].isCurrentlyPlaying = true;
                            const firstTrack = queue[0];
                            responseContent = `🎵 Starting with first song: **${firstTrack.title}** by **${firstTrack.artist}**`;
                            musicData = { 
                                action: 'prev',
                                track: firstTrack
                            };
                        } else if (currentPlayingIndex > 0) {
                            queue.forEach(song => song.isCurrentlyPlaying = false);
                            queue[currentPlayingIndex - 1].isCurrentlyPlaying = true;
                            const prevTrack = queue[currentPlayingIndex - 1];
                            responseContent = `⏮️ Previous song: **${prevTrack.title}** by **${prevTrack.artist}**`;
                            musicData = { 
                                action: 'prev',
                                track: prevTrack
                            };
                        } else {
                            responseContent = '❌ Already at the first song in queue';
                        }
                    } else if (queue.length === 1) {
                        let currentPlayingIndex = queue.findIndex(song => song.isCurrentlyPlaying);
                        if (currentPlayingIndex === -1) {
                            queue[0].isCurrentlyPlaying = true;
                            const onlyTrack = queue[0];
                            responseContent = `🎵 Playing the only song: **${onlyTrack.title}** by **${onlyTrack.artist}**`;
                            musicData = { 
                                action: 'prev',
                                track: onlyTrack
                            };
                        } else {
                            responseContent = '❌ No previous song in queue. Add more songs with `/titibot queue [song name]`';
                        }
                    } else {
                        responseContent = '❌ Queue is empty. Add songs first with `/titibot play [song name]` or `/titibot queue [song name]`';
                    }
                } else {
                    responseContent = '❌ No music queue found for this channel';
                }
                break;

            case 'queue':
                if (!parameter) {
                    responseContent = '❌ Udah di bilang formatnya queue {namaLagu} malah ngemeng';
                } else {
                    const searchResult = await this.searchMusic(parameter);
                    if (searchResult && searchResult.previewUrl) {
                        responseContent = `➕ Added to queue: **${searchResult.title}** by **${searchResult.artist}** 🎶`;
                        musicData = {
                            action: 'queue',
                            query: parameter,
                            track: searchResult
                        };
                        
                        const queueChannelKey = originalMessage.channel_id || originalMessage.target_id;
                        if (queueChannelKey) {
                            if (!this.musicQueues.has(queueChannelKey)) {
                                this.musicQueues.set(queueChannelKey, []);
                            }
                            this.musicQueues.get(queueChannelKey).push({
                                title: searchResult.title,
                                artist: searchResult.artist,
                                previewUrl: searchResult.previewUrl,
                                addedAt: new Date().toISOString()
                            });
                        }
                    } else {
                        responseContent = `❌ Sorry bang, ga nemu lagu "${parameter}" buat di queue. Coba judul lagu yang lain ya~`;
                    }
                }
                break;

            case 'list':
                const listChannelKey = originalMessage.channel_id || originalMessage.target_id;
                const queue = this.musicQueues.get(listChannelKey) || [];
                
                if (queue.length === 0) {
                    responseContent = `📋 **Current Music Queue:**
❌ Queue kosong nih bang, tambahin lagu dulu pake \`/titibot queue [nama lagu]\`

🎵 **Contoh penggunaan:**
• \`/titibot queue never gonna give you up\`
• \`/titibot queue bohemian rhapsody\`
• \`/titibot play despacito\``;
                } else {
                    responseContent = `📋 **Current Music Queue (${queue.length} songs):**\n\n`;
                    queue.forEach((song, index) => {
                        const status = song.isCurrentlyPlaying ? '🎵 **(Now Playing)**' : '';
                        const number = `**${index + 1}.**`;
                        responseContent += `${number} **${song.title}** by **${song.artist}** ${status}\n`;
                    });
                    responseContent += `\n🎮 **Commands:**
• \`/titibot next\` - Skip to next song
• \`/titibot prev\` - Go to previous song
• \`/titibot stop\` - Stop music and clear queue`;
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

        const replyIdForDB = (originalMessage.id && !isNaN(originalMessage.id) && originalMessage.id !== '' && !originalMessage.id.toString().startsWith('temp-')) 
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
                url: buildApiUrl(options.path),
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
                    
                    console.log(`🎵 [BOT-DEBUG] Sending music command to all voice participants:`, {
                        targetRoom,
                        channelId,
                        roomId,
                        action: musicData.action
                    });
                    
                    io.to(targetRoom).emit('bot-music-command', musicCommandData);
                    
                    if (channelId) {
                        const voiceChannelRoom = `voice_channel_${channelId}`;
                        const channelRoom = `channel-${channelId}`;
                        
                        io.to(voiceChannelRoom).emit('bot-music-command', musicCommandData);
                        io.to(channelRoom).emit('bot-music-command', musicCommandData);
                        
                        const VoiceConnectionTracker = require('../services/voiceConnectionTracker');
                        const participants = VoiceConnectionTracker.getChannelParticipants(channelId);
                        
                        console.log(`🎵 [BOT-DEBUG] Found ${participants.length} participants in channel ${channelId}:`, 
                            participants.map(p => ({ userId: p.userId, username: p.username, socketId: p.socket_id }))
                        );
                        
                        participants.forEach(participant => {
                            if (participant.userId && participant.userId !== botId.toString()) {
                                console.log(`🎵 [BOT-DEBUG] Sending music command to participant ${participant.username} (${participant.userId})`);
                                
                                const userSockets = require('../services/roomManager').userSockets.get(participant.userId.toString());
                                if (userSockets && userSockets.size > 0) {
                                    userSockets.forEach(socketId => {
                                        io.to(socketId).emit('bot-music-command', musicCommandData);
                                    });
                                }
                            }
                        });
                    }
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