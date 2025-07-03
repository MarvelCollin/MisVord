class SendReceiveHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
    }

    async sendMessage() {
        const messageInput = this.chatSection.messageInput;
        if (!messageInput) {
            return;
        }
        
        let content;
        if (messageInput.getAttribute('contenteditable') === 'true') {
            content = messageInput.textContent || messageInput.innerText || '';
        } else {
            content = messageInput.value || '';
        }
        
        if (!content.trim()) {
            return;
        }
        
        content = content.trim();
        console.log('📤 Sending message via WebSocket:', content.substring(0, 50) + (content.length > 50 ? '...' : ''));
        
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.error('❌ WebSocket not ready for sending message');
            this.chatSection.showNotification('Connection error. Please try again.', 'error');
            return;
        }
        
        try {
            const options = { message_type: 'text' };
            
            if (this.chatSection.replyingTo) {
                options.reply_message_id = this.chatSection.replyingTo.messageId;
            }
            
            const attachmentUrls = this.chatSection.fileUploadHandler.hasFiles() 
                ? this.chatSection.fileUploadHandler.getUploadedFileUrls() 
                : [];
            
            if (attachmentUrls.length > 0) {
                options.attachments = attachmentUrls;
                console.log('📎 Including attachments:', attachmentUrls.length, 'files');
            }
            
            let mentions = [];
            if (this.chatSection.mentionHandler) {
                mentions = this.chatSection.mentionHandler.parseMentions(content);
            if (mentions.length > 0) {
                options.mentions = mentions;
                console.log('💬 Including mentions:', mentions.length, 'mentions');
                }
            } else {
                console.warn('⚠️ [SEND-RECEIVE] MentionHandler not ready, skipping mention parsing');
                const simpleMentions = content.match(/@(\w+)/g);
                if (simpleMentions && simpleMentions.length > 0) {
                    mentions = simpleMentions.map(mention => ({
                        type: 'user',
                        username: mention.substring(1),
                        user_id: null
                    }));
                    options.mentions = mentions;
                    console.log('💬 Including basic mentions:', mentions.length, 'mentions (fallback)');
                }
            }
            
            await this.sendDirectOrChannelMessage(content, options);
            
            if (this.chatSection.messageInput) {
                if (this.chatSection.messageInput.getAttribute('contenteditable') === 'true') {
                    this.chatSection.messageInput.textContent = '';
                    this.chatSection.messageInput.innerHTML = '';
                } else {
                    this.chatSection.messageInput.value = '';
                }
                if (this.chatSection.mentionHandler) {
                    this.chatSection.mentionHandler.updateOverlayContent();
                }
            }
            
            if (this.chatSection.fileUploadHandler.hasFiles()) {
                this.chatSection.fileUploadHandler.removeFileUpload();
            }
            
            if (this.chatSection.replyingTo) {
                this.chatSection.clearReply();
            }
            
            console.log('✅ Message sent successfully');
        } catch (error) {
            console.error('❌ Error sending message:', error);
            this.chatSection.showNotification('Failed to send message: ' + error.message, 'error');
        }
    }

    sendStopTypingEvent() {
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            return;
        }
        
        if (this.chatSection.chatType === 'channel') {
            window.globalSocketManager.emitToRoom('stop-typing', {
                channel_id: this.chatSection.targetId,
                user_id: this.chatSection.userId,
                username: this.chatSection.username
            }, 'channel', this.chatSection.targetId);
        } else {
            window.globalSocketManager.emitToRoom('stop-typing', {
                room_id: this.chatSection.targetId,
                user_id: this.chatSection.userId,
                username: this.chatSection.username
            }, 'dm', this.chatSection.targetId);
        }
    }

    async sendDirectOrChannelMessage(content, options = {}) {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        const tempMessageData = {
            id: tempId,
            content: content,
            user_id: window.globalSocketManager?.userId,
            username: window.globalSocketManager?.username,
            avatar_url: window.globalSocketManager?.avatarUrl || '/public/assets/common/default-profile-picture.png',
            sent_at: new Date().toISOString(),
            message_type: options.message_type || 'text',
            attachments: options.attachments || [],
            mentions: options.mentions || [],
            reply_message_id: options.reply_message_id,
            reply_data: null,
            timestamp: Date.now(),
            is_temporary: true,
            source: 'client-sent'
        };
        
        if (this.chatSection.replyingTo) {
            tempMessageData.reply_data = {
                message_id: this.chatSection.replyingTo.messageId,
                content: this.chatSection.replyingTo.content,
                username: this.chatSection.replyingTo.username
            };
        }
        
        this.chatSection.messageHandler.addMessage(tempMessageData);
        
        this.sendStopTypingEvent();

        const messageData = {
            content: content,
            target_type: this.chatSection.chatType === 'direct' ? 'dm' : this.chatSection.chatType,
            target_id: this.chatSection.targetId,
            message_type: options.message_type || 'text',
            attachments: options.attachments || [],
            mentions: options.mentions || [],
            reply_message_id: options.reply_message_id,
            temp_message_id: tempId,
            context: {
                server_name: this.chatSection.currentServerName || null,
                channel_name: this.chatSection.currentChannelName || null,
                server_icon: this.chatSection.currentServerIcon || null
            }
        };
        
        const isTitiBotCommand = content && content.toLowerCase().includes('/titibot');
        if (isTitiBotCommand) {
            let voiceChannelId = null;
            let userInVoice = false;
            let detectionMethod = 'none';
            
            console.log('🤖 [SEND-RECEIVE] TitiBot command detected, checking voice context...');
            
            const urlParams = new URLSearchParams(window.location.search);
            const currentChannelId = urlParams.get('channel');
            const currentChannelType = urlParams.get('type');
            const metaChannelType = document.querySelector('meta[name="channel-type"]')?.content;
            
            console.log('🔍 [SEND-RECEIVE] Current page context:', { currentChannelId, currentChannelType, metaChannelType });
            
            // Priority 1: Check if user is actually connected to voice (regardless of current page)
            // This handles the case where user is in voice but sending commands from text channel
            if (window.unifiedVoiceStateManager) {
                const voiceState = window.unifiedVoiceStateManager.getState();
                console.log('🔍 [SEND-RECEIVE] Unified voice state:', voiceState);
                if (voiceState && voiceState.isConnected && voiceState.channelId) {
                    voiceChannelId = voiceState.channelId;
                    userInVoice = true;
                    detectionMethod = 'unifiedVoiceStateManager';
                    console.log(`🎤 [SEND-RECEIVE] Voice detected via unified state manager: ${voiceChannelId}`);
                }
            }
            
            // Priority 2: VideoSDK manager (user actually connected to voice)
            if (!userInVoice && window.videoSDKManager) {
                if (window.videoSDKManager.isConnected && window.videoSDKManager.isMeetingJoined) {
                    const meetingId = window.videoSDKManager.meetingId;
                    if (meetingId && meetingId.includes('voice_channel_')) {
                        voiceChannelId = meetingId.replace('voice_channel_', '');
                        userInVoice = true;
                        detectionMethod = 'videoSDKManager';
                        console.log(`🎤 [SEND-RECEIVE] Voice detected via VideoSDK: ${voiceChannelId}`);
                    }
                }
            }
            
            // Priority 3: Voice manager (user actually connected to voice)
            if (!userInVoice && window.voiceManager) {
                if (window.voiceManager.isConnected && window.voiceManager.currentChannelId) {
                    voiceChannelId = window.voiceManager.currentChannelId;
                    userInVoice = true;
                    detectionMethod = 'voiceManager';
                    console.log(`🎤 [SEND-RECEIVE] Voice detected via voice manager: ${voiceChannelId}`);
                }
            }
            
            // Priority 4: Global socket manager presence (user actually connected to voice)
            if (!userInVoice && window.globalSocketManager) {
                const currentActivity = window.globalSocketManager.currentActivityDetails;
                if (currentActivity && currentActivity.type) {
                    if (currentActivity.type === 'In Voice Call' || currentActivity.type.startsWith('In Voice - ')) {
                        if (currentActivity.channel_id) {
                            voiceChannelId = currentActivity.channel_id;
                            userInVoice = true;
                            detectionMethod = 'globalSocketManager';
                            console.log(`🎤 [SEND-RECEIVE] Voice detected via presence: ${voiceChannelId}`);
                        }
                    }
                }
            }
            
            // Priority 5: Current channel context (if we're viewing a voice channel page)
            // This handles the case where user is viewing voice channel but not connected yet
            if (!userInVoice && (currentChannelType === 'voice' || metaChannelType === 'voice') && currentChannelId) {
                const channelElement = document.querySelector(`[data-channel-id="${currentChannelId}"][data-channel-type="voice"]`);
                if (channelElement) {
                    voiceChannelId = currentChannelId;
                    userInVoice = true;
                    detectionMethod = 'currentVoiceChannel+present';
                    console.log(`🎤 [SEND-RECEIVE] Voice detected via current voice channel page: ${voiceChannelId}`);
                    console.log(`🔍 [SEND-RECEIVE] User viewing voice channel page - bot can join for them`);
                }
            }
            
            if (userInVoice && voiceChannelId) {
                messageData.voice_context = {
                    voice_channel_id: voiceChannelId,
                    user_in_voice: true
                };
                console.log(`🎤 [SEND-RECEIVE] Adding voice context to TitiBot command:`, {
                    ...messageData.voice_context,
                    detectionMethod
                });
                console.log(`🔍 [SEND-RECEIVE] Full messageData with voice context:`, {
                    content: messageData.content,
                    voice_context: messageData.voice_context,
                    target_type: messageData.target_type,
                    target_id: messageData.target_id
                });
            } else {
                messageData.voice_context = {
                    voice_channel_id: null,
                    user_in_voice: false
                };
                console.log(`🎤 [SEND-RECEIVE] User not in voice channel, TitiBot command will not include voice context`);
                console.log(`🔍 [SEND-RECEIVE] Debug info:`, {
                    urlChannelId: currentChannelId,
                    urlChannelType: currentChannelType,
                    metaChannelType,
                    unifiedVoiceState: window.unifiedVoiceStateManager?.getState(),
                    videoSDKConnected: window.videoSDKManager?.isConnected
                });
            }
        }
        
        console.log('🔌 Sending message via WebSocket:', {
            event: 'save-and-send-message',
            targetType: messageData.target_type,
            targetId: messageData.target_id,
            tempId: tempId,
            hasAttachments: (options.attachments || []).length > 0,
            attachmentCount: (options.attachments || []).length,
            isTitiBotCommand: isTitiBotCommand,
            voiceChannelId: messageData.voice_context?.voice_channel_id,
            voiceContext: messageData.voice_context
        });

        // Debug: Log the complete message data for TitiBot commands
        if (isTitiBotCommand) {
            console.log('🤖 [SEND-RECEIVE] Complete TitiBot message data being sent:', {
                content: messageData.content,
                voice_context: messageData.voice_context,
                target_type: messageData.target_type,
                target_id: messageData.target_id
            });
        }

        window.globalSocketManager.io.emit('save-and-send-message', messageData);
        
        console.log('✅ Message sent with temp ID:', tempId);
    }

    async fetchMessageHistory(options = {}) {
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            
            const limit = options.limit || 50;
            const before = options.before || null;
            
            console.log('📥 Fetching message history:', {
                targetId: this.chatSection.targetId,
                chatType: this.chatSection.chatType,
                limit,
                before
            });
            
            const response = await window.ChatAPI.getMessages(
                this.chatSection.targetId,
                this.chatSection.chatType,
                { limit, before }
            );
            
            if (response && response.success) {
                console.log('📬 Message history retrieved:', response.data?.messages?.length || 0, 'messages');
                
                return {
                    success: true,
                    messages: response.data?.messages || [],
                    hasMore: (response.data?.messages || []).length >= limit
                };
            } else {
                console.error('❌ Failed to fetch message history:', response?.message || 'Unknown error');
                
                return {
                    success: false,
                    messages: [],
                    hasMore: false,
                    error: response?.message || 'Unknown error'
                };
            }
        } catch (error) {
            console.error('❌ Error fetching message history:', error);
            
            return {
                success: false,
                messages: [],
                hasMore: false,
                error: error.message
            };
        }
    }

    async searchMessages(query) {
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            
            const response = await window.ChatAPI.searchMessages(
                this.chatSection.targetId,
                this.chatSection.chatType,
                query
            );
            
            if (response.success) {
                return {
                    success: true,
                    messages: response.data.messages || []
                };
            } else {
                console.error('❌ [SEND-RECEIVE] Failed to search messages:', response.message);
                return {
                    success: false,
                    messages: [],
                    error: response.message
                };
            }
        } catch (error) {
            console.error('❌ [SEND-RECEIVE] Error searching messages:', error);
            return {
                success: false,
                messages: [],
                error: error.message
            };
        }
    }

    async uploadFiles(files) {
        try {
            if (!files || files.length === 0) {
                return { success: true, files: [] };
            }
            
            const formData = new FormData();
            
            for (let i = 0; i < files.length; i++) {
                formData.append('files[]', files[i]);
            }
            
            formData.append('target_type', this.chatSection.chatType);
            formData.append('target_id', this.chatSection.targetId);
            
            const response = await fetch('/api/media/upload-multiple', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed with status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                return {
                    success: true,
                    files: result.data?.uploaded_files || []
                };
            } else {
                throw new Error(result.message || 'Upload failed');
            }
        } catch (error) {
            console.error('❌ Error uploading files:', error);
            return {
                success: false,
                files: [],
                error: error.message
            };
        }
    }

    async pinMessage(messageId) {
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            
            const response = await window.ChatAPI.pinMessage(messageId);
            
            if (response.success) {
                return {
                    success: true,
                    message: response.data || {}
                };
            } else {
                console.error('❌ Failed to pin message:', response.message);
                return {
                    success: false,
                    error: response.message
                };
            }
        } catch (error) {
            console.error('❌ Error pinning message:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async unpinMessage(messageId) {
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            
            const response = await window.ChatAPI.unpinMessage(messageId);
            
            if (response.success) {
                return {
                    success: true
                };
            } else {
                console.error('❌ Failed to unpin message:', response.message);
                return {
                    success: false,
                    error: response.message
                };
            }
        } catch (error) {
            console.error('❌ Error unpinning message:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getPinnedMessages() {
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            
            const response = await window.ChatAPI.getPinnedMessages(
                this.chatSection.targetId,
                this.chatSection.chatType
            );
            
            if (response.success) {
                return {
                    success: true,
                    messages: response.data.messages || []
                };
            } else {
                console.error('❌ Failed to get pinned messages:', response.message);
                return {
                    success: false,
                    messages: [],
                    error: response.message
                };
            }
        } catch (error) {
            console.error('❌ Error getting pinned messages:', error);
            return {
                success: false,
                messages: [],
                error: error.message
            };
        }
    }
}

export default SendReceiveHandler;
