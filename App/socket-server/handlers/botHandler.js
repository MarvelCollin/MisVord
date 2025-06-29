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

        // Remove any existing bot listeners
        const existingListeners = io.listeners('bot-message-intercept');
        existingListeners.forEach(listener => {
            if (listener.toString().includes('BOT-HANDLER') || listener.toString().includes('handleMessage')) {
                io.removeListener('bot-message-intercept', listener);
            }
        });

        // Listen for the global bot message intercept event
        io.on('bot-message-intercept', (data) => {
            console.log(`🔍 [BOT-HANDLER] Bot ${username} intercepted message:`, {
                messageId: data.id,
                content: data.content?.substring(0, 50) + '...',
                userId: data.user_id,
                channelId: data.channel_id,
                roomId: data.room_id,
                source: data.source
            });
            
            // Determine message type based on data
            const messageType = data.channel_id ? 'channel' : 'dm';
            this.handleMessage(io, data, messageType, botId, username);
        });

        console.log(`✅ [BOT-HANDLER] Bot ${username} is now listening for all messages via bot-message-intercept`);
    }

    static handleMessage(io, data, messageType, botId, username) {
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
        if (!bot || data.user_id == botId) {
            return;
        }

        const content = data.content?.toLowerCase().trim();
        if (!content) return;

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
            reply_message_id: originalMessage.id,
            reply_data: {
                messageId: originalMessage.id,
                username: originalMessage.username,
                content: originalMessage.content
            }
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
            console.log(`🚀 [BOT-RESPONSE] Bot ${username} sending reply to message ${originalMessage.id} in ${targetRoom}`);
            
            try {
                const savedMessage = await this.saveBotMessage(responseData, messageType);
                let emitMessage = (savedMessage && savedMessage.id) ? savedMessage : responseData;
                // Ensure channel_id or room_id is included for client-side filter
                if (messageType === 'channel' && !emitMessage.channel_id) {
                    emitMessage.channel_id = responseData.channel_id || originalMessage.channel_id;
                }
                if (messageType === 'dm' && !emitMessage.room_id) {
                    emitMessage.room_id = responseData.room_id || originalMessage.room_id;
                }
                if (savedMessage) {
                    console.log(`💾 [BOT-RESPONSE] Bot message saved to database successfully:`, {
                        messageId: savedMessage?.id,
                        channelId: emitMessage.channel_id || emitMessage.room_id,
                        fullResponse: savedMessage
                    });
                }

                io.to(targetRoom).emit(eventName, emitMessage);
                
                console.log(`✅ [BOT-RESPONSE] Bot ${username} reply sent successfully`);
            } catch (error) {
                console.error(`❌ [BOT-RESPONSE] Error sending bot response:`, error);
            }
        }
    }

    static async respondToMusicCommand(io, originalMessage, messageType, botId, username, command, songName = null) {
        let responseContent;
        let musicData = null;

        try {
            switch (command) {
                case 'play':
                    if (!songName) {
                        responseContent = '❌ Please specify a song name. Usage: `/titibot play {song name}`';
                        break;
                    }
                    
                    const trackData = await this.searchItunes(songName);
                    if (!trackData) {
                        responseContent = `❌ Could not find "${songName}" on iTunes`;
                        break;
                    }
                    
                    responseContent = `🎵 Now playing: **${trackData.title}** by ${trackData.artist}`;
                    musicData = {
                        action: 'play',
                        track: trackData
                    };
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
                        break;
                    }
                    
                    const queueTrackData = await this.searchItunes(songName);
                    if (!queueTrackData) {
                        responseContent = `❌ Could not find "${songName}" on iTunes`;
                        break;
                    }
                    
                    responseContent = `➕ Added to queue: **${queueTrackData.title}** by ${queueTrackData.artist}`;
                    musicData = {
                        action: 'queue',
                        track: queueTrackData
                    };
                    break;

                default:
                    responseContent = '❌ Unknown music command';
            }
        } catch (error) {
            console.error(`❌ [BOT-MUSIC] Error processing music command:`, error);
            responseContent = '❌ Error processing music command';
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
            reply_message_id: originalMessage.id,
            reply_data: {
                messageId: originalMessage.id,
                username: originalMessage.username,
                content: originalMessage.content
            }
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
            console.log(`🚪 [BOT-MUSIC] Channel room debug:`, {
                channel_id: originalMessage.channel_id,
                targetRoom: targetRoom,
                eventName: eventName
            });
        } else if (messageType === 'dm' && originalMessage.room_id) {
            targetRoom = roomManager.getDMRoom(originalMessage.room_id);
            eventName = 'user-message-dm';
            responseData.room_id = originalMessage.room_id;
            console.log(`🚪 [BOT-MUSIC] DM room debug:`, {
                room_id: originalMessage.room_id,
                targetRoom: targetRoom,
                eventName: eventName
            });
        }

        if (targetRoom && eventName) {
            console.log(`🎵 [BOT-MUSIC] Bot ${username} sending music response for ${command} in ${targetRoom}`);
            
            try {
                // Try to save to database, but don't let failure block real-time display
                let savedMessage = null;
                try {
                    savedMessage = await this.saveBotMessage(responseData, messageType);
                    console.log(`💾 [BOT-MUSIC] Database save result:`, savedMessage ? 'SUCCESS' : 'FAILED');
                } catch (dbError) {
                    console.warn(`⚠️ [BOT-MUSIC] Database save failed, proceeding with real-time only:`, dbError.message);
                }
                
                // Use saved message if available, otherwise use temporary data
                let emitMessage = (savedMessage && savedMessage.id) ? savedMessage : responseData;
                // Ensure channel_id or room_id is included for client-side filter
                if (messageType === 'channel' && !emitMessage.channel_id) {
                    emitMessage.channel_id = responseData.channel_id || originalMessage.channel_id;
                }
                if (messageType === 'dm' && !emitMessage.room_id) {
                    emitMessage.room_id = responseData.room_id || originalMessage.room_id;
                }
                if (musicData) emitMessage.music_data = musicData;

                io.to(targetRoom).emit(eventName, emitMessage);
                
                if (musicData) {
                    io.to(targetRoom).emit('bot-music-command', {
                        channel_id: originalMessage.channel_id,
                        music_data: musicData
                    });
                }
                
                console.log(`✅ [BOT-MUSIC] Bot ${username} music response sent successfully`);
            } catch (error) {
                console.error(`❌ [BOT-MUSIC] Error sending bot music response:`, error);
            }
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
            return;
        }
    }

    static async searchItunes(query) {
        try {
            const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`;
            
            console.log(`🔍 [BOT-MUSIC] Searching iTunes for: ${query}`);
            
            const fetchFn = this.getFetch();
            const response = await fetchFn(apiUrl);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const track = data.results[0];
                const trackData = {
                    title: track.trackName,
                    artist: track.artistName,
                    album: track.collectionName,
                    previewUrl: track.previewUrl,
                    artworkUrl: track.artworkUrl100,
                    duration: track.trackTimeMillis,
                    id: track.trackId
                };
                
                console.log(`✅ [BOT-MUSIC] Found track: ${trackData.title} by ${trackData.artist}`);
                return trackData;
            }
            
            console.log(`❌ [BOT-MUSIC] No results found for: ${query}`);
            return null;
        } catch (error) {
            console.error(`❌ [BOT-MUSIC] iTunes search error:`, error?.message || error);
            return null;
        }
    }

    static async saveBotMessage(messageData, messageType) {
        try {
             const payload = {
                 content: messageData.content,
                 message_type: 'text',
                 user_id: messageData.user_id
             };

             // Use the same format as regular chat messages
             if (messageType === 'channel') {
                 payload.channel_id = messageData.channel_id;
             } else {
                 payload.target_id = messageData.room_id;
             }

             if (messageData.reply_message_id) {
                 payload.reply_message_id = messageData.reply_message_id;
             }

             // Use bot-specific endpoint
             let endpoint;
             if (messageType === 'channel') {
                 endpoint = `http://app:1001/api/bots/send-channel-message`;
             } else {
                 endpoint = `http://app:1001/api/chat/send`;
                 payload.chat_type = 'direct';
             }

             console.log(`📡 [BOT-HANDLER] Sending bot message to database:`, {
                 endpoint,
                 payload: { ...payload, content: payload.content.substring(0, 50) + '...' }
             });

             // Convert payload to form data for PHP compatibility
             const formData = new URLSearchParams();
             Object.entries(payload).forEach(([key, value]) => {
                 if (value !== undefined && value !== null) {
                     if (typeof value === 'object') {
                         formData.append(key, JSON.stringify(value));
                     } else {
                         formData.append(key, value);
                     }
                 }
             });

             const fetchFn = this.getFetch();
             const response = await fetchFn(endpoint, {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/x-www-form-urlencoded',
                     'Accept': 'application/json',
                     'X-Requested-With': 'XMLHttpRequest',
                     'Origin': 'http://app:1001',
                 },
                 body: formData.toString()
             });

             let responseData;
             try {
                 const responseText = await response.text();
                 console.log(`💾 [BOT-HANDLER] Raw response from database:`, responseText.substring(0, 200));
                 responseData = JSON.parse(responseText);
             } catch (parseError) {
                 console.error(`❌ [BOT-HANDLER] Failed to parse response:`, parseError);
                 return false;
             }
             
             if (response.ok && responseData.success) {
                 // Handle nested data structure: responseData.data.data.message
                 const savedMessage = responseData?.data?.data?.message || responseData?.data?.message || null;
                 
                 console.log(`💾 [BOT-HANDLER] Bot message saved to database successfully:`, {
                     messageId: savedMessage?.id,
                     channelId: payload.channel_id || payload.target_id,
                     fullResponse: responseData
                 });
                 return savedMessage || true;
             } else {
                 console.error(`❌ [BOT-HANDLER] Failed to save bot message:`, {
                     status: response.status,
                     statusText: response.statusText,
                     error: responseData.error || responseData.message
                 });
                 return false;
             }
         } catch (error) {
             console.error(`❌ [BOT-HANDLER] Error saving bot message:`, error);
             return false;
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

    static getFetch() {
        if (typeof fetch !== 'undefined') return fetch;
        // fallback minimal fetch using https for Node < 18
        const https = require('https');
        return (url, opts = {}) => {
            return new Promise((resolve, reject) => {
                try {
                    const parsed = new URL(url);
                    const options = {
                        method: opts.method || 'GET',
                        headers: opts.headers || { 'Content-Type': 'application/json' }
                    };
                    const req = https.request(parsed, options, res => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => {
                            resolve({
                                ok: res.statusCode >= 200 && res.statusCode < 300,
                                status: res.statusCode,
                                statusText: res.statusMessage,
                                text: () => Promise.resolve(data),
                                json: () => Promise.resolve(JSON.parse(data))
                            });
                        });
                    });
                    req.on('error', reject);
                    if (opts.body) req.write(opts.body);
                    req.end();
                } catch (e) {
                    reject(e);
                }
            });
        };
    }
}

module.exports = BotHandler;
