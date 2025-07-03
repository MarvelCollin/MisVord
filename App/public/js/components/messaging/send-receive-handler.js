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
            
            if (window.unifiedVoiceStateManager) {
                const voiceState = window.unifiedVoiceStateManager.getState();
                if (voiceState.isConnected && voiceState.channelId) {
                    voiceChannelId = voiceState.channelId;
                }
            }
            
            if (!voiceChannelId && window.voiceManager?.currentChannelId) {
                voiceChannelId = window.voiceManager.currentChannelId;
            }
            
            if (!voiceChannelId) {
                const channelMeta = document.querySelector('meta[name="channel-id"]');
                if (channelMeta && window.location.pathname.includes('/server/')) {
                    voiceChannelId = channelMeta.content;
                }
            }
            
            if (voiceChannelId) {
                messageData.voice_context = {
                    voice_channel_id: voiceChannelId,
                    user_in_voice: !!(window.unifiedVoiceStateManager?.getState()?.isConnected || window.voiceManager?.isConnected)
                };
                console.log(`🎤 [SEND-RECEIVE] Adding voice context to titibot command:`, messageData.voice_context);
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
            voiceChannelId: messageData.voice_context?.voice_channel_id
        });

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
