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
                    io.to(room).emit(event, data);
                }
            })
        };

        this.activeConnections.set(botId, botClient);
        this.setupBotListeners(io, botId, username);
        
        return botClient;
    }

    static setupBotListeners(io, botId, username) {
        this.botEventEmitter.removeAllListeners('bot-message-intercept');

        const messageHandler = async (data) => {
            const channelId = data.channel_id || (data.target_type === 'channel' ? data.target_id : null);
            const roomId = data.room_id || (data.target_type === 'dm' ? data.target_id : null);
            
            const messageType = channelId ? 'channel' : 'dm';
            await BotHandler.handleMessage(io, data, messageType, botId, username);
        };

        this.botEventEmitter.on('bot-message-intercept', messageHandler);
    }

    static emitBotMessageIntercept(data) {
        this.botEventEmitter.emit('bot-message-intercept', data);
    }

    static async handleMessage(io, data, messageType, botId, username) {
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
        
        if (!bot) {
            return;
        }
        
        if (data.user_id == botId) {
            return;
        }

        const content = data.content?.toLowerCase().trim();
        
        if (!content) {
            return;
        }

        const isTitiBotCommand = content.startsWith('/titibot');
        let voiceChannelToJoin = null;
        
        if (isTitiBotCommand) {
            if (data.voice_context && data.voice_context.voice_channel_id) {
                voiceChannelToJoin = data.voice_context.voice_channel_id;
                console.log(`🎤 [BOT-HANDLER] User ${data.user_id} sent titibot command from voice channel ${voiceChannelToJoin}`);
            } else {
                const userVoiceConnection = VoiceConnectionTracker.getUserVoiceConnection(data.user_id);
                if (userVoiceConnection) {
                    voiceChannelToJoin = userVoiceConnection.channelId;
                    console.log(`🎤 [BOT-HANDLER] Found user voice connection: channel ${voiceChannelToJoin}`);
                }
            }
            
            if (voiceChannelToJoin) {
                await this.ensureBotInVoiceChannel(io, botId, username, voiceChannelToJoin);
            }
        }

        if (content.toLowerCase() === '/titibot ping') {
            await this.sendBotResponse(io, data, messageType, botId, username, 'ping');
        } else if (content.toLowerCase().startsWith('/titibot play ')) {
            const isInVoice = await this.checkVoiceConnection(data.user_id, io, data, messageType, botId, username);
            if (!isInVoice) return;
            
            const songName = content.substring('/titibot play '.length).trim();
            await this.sendBotResponse(io, data, messageType, botId, username, 'play', songName);
        } else if (content.toLowerCase() === '/titibot stop') {
            const isInVoice = await this.checkVoiceConnection(data.user_id, io, data, messageType, botId, username);
            if (!isInVoice) return;
            
            await this.sendBotResponse(io, data, messageType, botId, username, 'stop');
        } else if (content.toLowerCase() === '/titibot next') {
            const isInVoice = await this.checkVoiceConnection(data.user_id, io, data, messageType, botId, username);
            if (!isInVoice) return;
            
            await this.sendBotResponse(io, data, messageType, botId, username, 'next');
        } else if (content.toLowerCase() === '/titibot prev') {
            const isInVoice = await this.checkVoiceConnection(data.user_id, io, data, messageType, botId, username);
            if (!isInVoice) return;
            
            await this.sendBotResponse(io, data, messageType, botId, username, 'prev');
        } else if (content.toLowerCase().startsWith('/titibot queue ')) {
            const isInVoice = await this.checkVoiceConnection(data.user_id, io, data, messageType, botId, username);
            if (!isInVoice) return;
            
            const songName = content.substring('/titibot queue '.length).trim();
            await this.sendBotResponse(io, data, messageType, botId, username, 'queue', songName);
        } else if (content.toLowerCase().startsWith('/titibot help')) {
            await this.sendBotResponse(io, data, messageType, botId, username, 'help');
        }
    }

    static async checkVoiceConnection(userId, io, originalMessage, messageType, botId, username) {
        const isInVoice = VoiceConnectionTracker.isUserInVoice(userId);
        
        const voiceConnection = VoiceConnectionTracker.getUserVoiceConnection(userId);
        if (voiceConnection) {
            await this.addBotToVoiceChannel(io, botId, username, voiceConnection);
        }
        
        return true;
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
        let responseContent;
        let musicData = null;

        switch (command) {
            case 'ping':
                responseContent = '🏓 Pong! TitiBot is alive and ready to rock! 🎵';
                break;

            case 'help':
                responseContent = `🤖 **TitiBot Commands:**
📻 **/titibot ping** - Check if bot is alive
🎵 **/titibot play [song]** - Play music from iTunes
⏹️ **/titibot stop** - Stop current music
⏭️ **/titibot next** - Play next song
⏮️ **/titibot prev** - Play previous song
➕ **/titibot queue [song]** - Add song to queue`;
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
                return;
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.sendDirectBotMessage(io, originalMessage, messageType, botId, username, responseContent, musicData);
    }

    static async sendDirectBotMessage(io, originalMessage, messageType, botId, username, responseContent, musicData) {
        const channelId = originalMessage.channel_id || (originalMessage.target_type === 'channel' ? originalMessage.target_id : null);
        const roomId = originalMessage.room_id || (originalMessage.target_type === 'dm' ? originalMessage.target_id : null);

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
            music_data: musicData,
            reply_message_id: originalMessage.id,
            reply_data: {
                message_id: originalMessage.id,
                content: originalMessage.content,
                user_id: originalMessage.user_id,
                username: originalMessage.username,
                avatar_url: originalMessage.avatar_url || '/public/assets/common/default-profile-picture.png'
            }
        };
        
        const eventName = messageType === 'channel' ? 'new-channel-message' : 'user-message-dm';
        const targetRoom = messageType === 'channel' ? `channel-${channelId}` : `dm-${roomId}`;
        
        io.to(targetRoom).emit(eventName, botResponseData);
        
        try {
            const saveData = {
                user_id: botId.toString(),
                username: username,
                target_type: messageType,
                target_id: messageType === 'channel' ? channelId.toString() : roomId.toString(),
                content: responseContent,
                message_type: 'text',
                attachments: [],
                mentions: [],
                reply_message_id: originalMessage.id
            };
            
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
        
        if (musicData) {
            io.to(targetRoom).emit('bot-music-command', {
                channel_id: channelId,
                room_id: roomId,
                music_data: musicData
            });
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
