class SendReceiveHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
    }

    async sendMessage() {
        if (!this.chatSection.messageInput || !this.chatSection.messageInput.value.trim()) {
            return;
        }
        
        const content = this.chatSection.messageInput.value.trim();
        const timestamp = Date.now();

        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }

            const options = {
                message_type: 'text'
            };

            if (this.chatSection.replyingTo) {
                options.reply_message_id = this.chatSection.replyingTo.messageId;
            }

            // Add file uploads if any
            if (this.chatSection.fileUploadHandler.currentFileUploads && 
                this.chatSection.fileUploadHandler.currentFileUploads.length > 0) {
                options.attachments = this.chatSection.fileUploadHandler.currentFileUploads;
            }

            // Clear input and cancel reply before sending
            // (this provides better UX by making the UI feel more responsive)
            const inputValue = this.chatSection.messageInput.value;
            this.chatSection.messageInput.value = '';
            this.chatSection.updateSendButton();
            
            if (this.chatSection.replyingTo) {
                this.chatSection.cancelReply();
            }

            // Clear file uploads if any
            if (this.chatSection.fileUploadHandler.currentFileUploads && 
                this.chatSection.fileUploadHandler.currentFileUploads.length > 0) {
                this.chatSection.fileUploadHandler.removeFileUpload();
            }

            // Send stop typing event
            this.sendStopTypingEvent();

            // Send the message to the server
            const response = await window.ChatAPI.sendMessage(
                this.chatSection.targetId,
                content,
                this.chatSection.chatType,
                options
            );

            if (response.success) {
                console.log(`✅ [SEND-RECEIVE] Message sent successfully, ID: ${response.data.message_id}`);
                
                // Message is already added to UI by the socket event handler
            } else {
                console.error('❌ [SEND-RECEIVE] Failed to send message:', response.message);
                this.chatSection.showNotification('Failed to send message. Please try again.', 'error');
                
                // Restore input value on failure
                this.chatSection.messageInput.value = inputValue;
                this.chatSection.updateSendButton();
            }
        } catch (error) {
            console.error('❌ [SEND-RECEIVE] Error sending message:', error);
            this.chatSection.showNotification('Failed to send message. Please try again.', 'error');
            
            // Restore input value on error
            this.chatSection.messageInput.value = content;
            this.chatSection.updateSendButton();
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
            
            const response = await window.ChatAPI.getMessages(
                this.chatSection.targetId,
                this.chatSection.chatType,
                { limit, before }
            );
            
            if (response.success) {
                return {
                    success: true,
                    messages: response.data.messages || [],
                    hasMore: (response.data.messages || []).length >= limit
                };
            } else {
                console.error('❌ [SEND-RECEIVE] Failed to fetch message history:', response.message);
                return {
                    success: false,
                    messages: [],
                    hasMore: false,
                    error: response.message
                };
            }
        } catch (error) {
            console.error('❌ [SEND-RECEIVE] Error fetching message history:', error);
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
                console.log(`✅ [SEND-RECEIVE] Message ${messageId} pinned successfully`);
                return true;
            } else {
                console.error('❌ [SEND-RECEIVE] Failed to pin message:', response.message);
                this.chatSection.showNotification('Failed to pin message. Please try again.', 'error');
                return false;
            }
        } catch (error) {
            console.error('❌ [SEND-RECEIVE] Error pinning message:', error);
            this.chatSection.showNotification('Failed to pin message. Please try again.', 'error');
            return false;
        }
    }

    async unpinMessage(messageId) {
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            
            const response = await window.ChatAPI.unpinMessage(messageId);
            
            if (response.success) {
                console.log(`✅ [SEND-RECEIVE] Message ${messageId} unpinned successfully`);
                return true;
            } else {
                console.error('❌ [SEND-RECEIVE] Failed to unpin message:', response.message);
                this.chatSection.showNotification('Failed to unpin message. Please try again.', 'error');
                return false;
            }
        } catch (error) {
            console.error('❌ [SEND-RECEIVE] Error unpinning message:', error);
            this.chatSection.showNotification('Failed to unpin message. Please try again.', 'error');
            return false;
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
                console.error('❌ [SEND-RECEIVE] Failed to get pinned messages:', response.message);
                return {
                    success: false,
                    messages: [],
                    error: response.message
                };
            }
        } catch (error) {
            console.error('❌ [SEND-RECEIVE] Error getting pinned messages:', error);
            return {
                success: false,
                messages: [],
                error: error.message
            };
        }
    }
}

export default SendReceiveHandler;
