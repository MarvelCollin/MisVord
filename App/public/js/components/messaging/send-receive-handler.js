class SendReceiveHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
    }

    async sendMessage() {
        // Basic validation
        if (!this.chatSection.messageInput || !this.chatSection.messageInput.value.trim()) {
            return;
        }
        
        const content = this.chatSection.messageInput.value.trim();
        console.log('📤 Sending message via WebSocket:', content.substring(0, 50) + (content.length > 50 ? '...' : ''));
        
        // Check if WebSocket is ready
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.error('❌ WebSocket not ready for sending message');
            this.chatSection.showNotification('Connection error. Please try again.', 'error');
            return;
        }
        
        try {
            // Prepare message options
            const options = { message_type: 'text' };
            
            // Handle replies if present
            if (this.chatSection.replyingTo) {
                options.reply_message_id = this.chatSection.replyingTo.messageId;
            }

            // Handle file attachments if present
            if (this.chatSection.fileUploadHandler && 
                this.chatSection.fileUploadHandler.currentFileUploads && 
                this.chatSection.fileUploadHandler.currentFileUploads.length > 0) {
                options.attachments = this.chatSection.fileUploadHandler.currentFileUploads;
            }

            // Generate temporary ID first
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            
            // Prepare message data for immediate display
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
            
            // Handle reply data for immediate display
            if (this.chatSection.replyingTo) {
                tempMessageData.reply_data = {
                    message_id: this.chatSection.replyingTo.messageId,
                    content: this.chatSection.replyingTo.content,
                    username: this.chatSection.replyingTo.username
                };
            }
            
            // Add temporary message to UI immediately
            this.chatSection.messageHandler.addMessage(tempMessageData);
            
            // Clear input after adding message
            this.chatSection.messageInput.value = '';
            this.chatSection.updateSendButton();
            
            // Clear reply if present
            if (this.chatSection.replyingTo) {
                this.chatSection.cancelReply();
            }

            // Clear file uploads if present
            if (this.chatSection.fileUploadHandler && 
                this.chatSection.fileUploadHandler.currentFileUploads && 
                this.chatSection.fileUploadHandler.currentFileUploads.length > 0) {
                this.chatSection.fileUploadHandler.removeFileUpload();
            }

            // Send stop typing event
            this.sendStopTypingEvent();

            // Prepare WebSocket message data
            const messageData = {
                content: content,
                target_type: this.chatSection.chatType === 'direct' ? 'dm' : this.chatSection.chatType,
                target_id: this.chatSection.targetId,
                message_type: options.message_type || 'text',
                attachments: options.attachments || [],
                mentions: options.mentions || [],
                reply_message_id: options.reply_message_id,
                temp_message_id: tempId
            };
            
            console.log('🔌 Sending message via WebSocket:', {
                event: 'save-and-send-message',
                targetType: messageData.target_type,
                targetId: messageData.target_id,
                tempId: tempId
            });

            // Send message via WebSocket for database save and broadcast to others
            window.globalSocketManager.io.emit('save-and-send-message', messageData);
            
            console.log('✅ Message sent with temp ID:', tempId);
            
        } catch (error) {
            console.error('❌ Error sending message via WebSocket:', error);
            
            // Restore input value
            this.chatSection.messageInput.value = content;
            this.chatSection.updateSendButton();
            
            // Show notification
            this.chatSection.showNotification('Failed to send message. Please try again.', 'error');
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
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            
            const formData = new FormData();
            
            // Add each file to the form data
            for (let i = 0; i < files.length; i++) {
                formData.append('files[]', files[i]);
            }
            
            // Add target info
            formData.append('target_type', this.chatSection.chatType);
            formData.append('target_id', this.chatSection.targetId);
            
            const response = await window.ChatAPI.uploadFiles(formData);
            
            if (response.success) {
                return {
                    success: true,
                    files: response.data.files || []
                };
            } else {
                console.error('❌ [SEND-RECEIVE] Failed to upload files:', response.message);
                return {
                    success: false,
                    files: [],
                    error: response.message
                };
            }
        } catch (error) {
            console.error('❌ [SEND-RECEIVE] Error uploading files:', error);
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
