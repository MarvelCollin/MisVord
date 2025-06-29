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

            // Clear input first for better UX responsiveness
            const inputValue = this.chatSection.messageInput.value;
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
                message_type: options.message_type,
                attachments: options.attachments || [],
                mentions: options.mentions || [],
                reply_message_id: options.reply_message_id
            };
            
            console.log('🔌 Sending message via WebSocket:', {
                event: 'save-and-send-message',
                targetType: messageData.target_type,
                targetId: messageData.target_id
            });

            // Set up listeners for the new WebSocket flow before sending
            this.setupNewMessageFlowListeners(inputValue);

            // Send message via WebSocket (this will show immediately and emit save-to-database)
            window.globalSocketManager.io.emit('save-and-send-message', messageData);
            
            console.log('✅ Message sent via WebSocket');
            
        } catch (error) {
            console.error('❌ Error sending message via WebSocket:', error);
            
            // Restore input value
            this.chatSection.messageInput.value = content;
            this.chatSection.updateSendButton();
            
            // Show notification
            this.chatSection.showNotification('Failed to send message. Please try again.', 'error');
        }
    }

    setupNewMessageFlowListeners(originalInputValue) {
        // Listen for database save request from socket server
        const onSaveToDatabase = async (data) => {
            console.log('💾 Database save request received:', data);
            
            try {
                // Make AJAX call to save to database
                const response = await this.saveMessageToDatabase(data);
                
                if (response.success) {
                    console.log('✅ Message saved to database:', response.data);
                    
                    // Emit update with real message ID to replace temporary message
                    window.globalSocketManager.io.emit('message-database-saved', {
                        temp_message_id: data.temp_message_id,
                        real_message_id: response.data.message_id,
                        message_data: response.data
                    });
                    
                    // Update the temporary message in UI with permanent ID
                    this.updateTemporaryMessage(data.temp_message_id, response.data);
                    
                } else {
                    console.error('❌ Failed to save message to database:', response.message);
                    this.handleDatabaseSaveError(data.temp_message_id, response.message);
                }
                
            } catch (error) {
                console.error('❌ Error saving message to database:', error);
                this.handleDatabaseSaveError(data.temp_message_id, error.message);
            }
            
            // Remove this listener after handling
            window.globalSocketManager.io.off('save-to-database', onSaveToDatabase);
        };
        
        // Listen for database save errors from socket server
        const onDatabaseSaveError = (data) => {
            console.error('❌ Database save error received:', data);
            this.handleDatabaseSaveError(data.temp_message_id, data.error);
            
            // Remove this listener
            window.globalSocketManager.io.off('database-save-error', onDatabaseSaveError);
        };
        
        // Listen for message sent confirmation (temporary message shown)
        const onMessageSent = (data) => {
            console.log('✅ Message sent confirmation received:', data);
            // No need to do anything here since message is already shown
            
            // Remove this listener
            window.globalSocketManager.io.off('message-sent', onMessageSent);
        };
        
        // Listen for message sending errors
        const onMessageError = (data) => {
            console.error('❌ Message sending error received:', data);
            
            // Restore input value
            this.chatSection.messageInput.value = originalInputValue;
            this.chatSection.updateSendButton();
            
            // Show error notification
            this.chatSection.showNotification(data.error || 'Failed to send message. Please try again.', 'error');
            
            // Remove this listener
            window.globalSocketManager.io.off('message-error', onMessageError);
        };
        
        // Attach listeners
        window.globalSocketManager.io.on('save-to-database', onSaveToDatabase);
        window.globalSocketManager.io.on('database-save-error', onDatabaseSaveError);
        window.globalSocketManager.io.on('message-sent', onMessageSent);
        window.globalSocketManager.io.on('message-error', onMessageError);
        
        // Set up timeout to remove listeners if no response received
        setTimeout(() => {
            window.globalSocketManager.io.off('save-to-database', onSaveToDatabase);
            window.globalSocketManager.io.off('database-save-error', onDatabaseSaveError);
            window.globalSocketManager.io.off('message-sent', onMessageSent);
            window.globalSocketManager.io.off('message-error', onMessageError);
        }, 30000); // 30 second timeout
    }

    async saveMessageToDatabase(messageData) {
        try {
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not initialized');
            }
            
            console.log('💾 Saving message to database via AJAX:', messageData);
            
            // Use the existing ChatAPI to save the message
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: messageData.content,
                    target_type: messageData.target_type,
                    target_id: messageData.target_id,
                    message_type: messageData.message_type,
                    attachments: messageData.attachments,
                    mentions: messageData.mentions,
                    reply_message_id: messageData.reply_message_id
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('💾 Database save response:', result);
            
            return result;
            
        } catch (error) {
            console.error('❌ Error in saveMessageToDatabase:', error);
            throw error;
        }
    }

    updateTemporaryMessage(tempMessageId, messageData) {
        try {
            const tempElement = document.querySelector(`[data-message-id="${tempMessageId}"]`);
            if (tempElement && messageData.message_id) {
                console.log(`🔄 Updating temporary message ${tempMessageId} to permanent ID ${messageData.message_id}`);
                
                // Update the message ID to the real server ID
                tempElement.dataset.messageId = messageData.message_id;
                
                // Remove temporary styling
                tempElement.classList.remove('temporary-message');
                tempElement.style.opacity = '1';
                
                // Update processed IDs if handler exists
                if (this.chatSection.messageHandler) {
                    this.chatSection.messageHandler.processedMessageIds.delete(tempMessageId);
                    this.chatSection.messageHandler.processedMessageIds.add(messageData.message_id);
                }
                
                console.log(`✅ Updated temporary message ${tempMessageId} to permanent ID ${messageData.message_id}`);
            } else {
                console.warn(`⚠️ Could not find temporary message element for ID: ${tempMessageId}`);
            }
        } catch (error) {
            console.error('❌ Error updating temporary message:', error);
        }
    }

    handleDatabaseSaveError(tempMessageId, errorMessage) {
        try {
            console.error(`❌ Database save failed for message ${tempMessageId}:`, errorMessage);
            
            // Find the temporary message element
            const tempElement = document.querySelector(`[data-message-id="${tempMessageId}"]`);
            if (tempElement) {
                // Add error styling
                tempElement.classList.add('message-error');
                tempElement.style.opacity = '0.5';
                tempElement.style.borderLeft = '3px solid #ed4245';
                
                // Add retry button or error indicator
                const errorIndicator = document.createElement('span');
                errorIndicator.className = 'error-indicator text-red-500 text-xs ml-2';
                errorIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed to save';
                errorIndicator.title = errorMessage;
                
                const messageText = tempElement.querySelector('.message-main-text');
                if (messageText && !messageText.querySelector('.error-indicator')) {
                    messageText.appendChild(errorIndicator);
                }
            }
            
            // Show notification
            this.chatSection.showNotification('Message failed to save to database: ' + errorMessage, 'error');
            
        } catch (error) {
            console.error('❌ Error handling database save error:', error);
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
