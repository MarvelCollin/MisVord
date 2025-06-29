import BubbleChatComponent from './bubble-chat-component.js';

class MessageHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.processedMessageIds = new Set();
        this.lastMessageGroup = null;
        this.messageGroupTimeThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.temporaryMessages = new Map(); // Track temporary messages
        
        // Initialize the bubble chat component
        this.bubbleComponent = window.BubbleChatComponent || new BubbleChatComponent();
    }
    


    addMessage(messageData) {
        // Enhanced validation - reject invalid messages
        if (!messageData || 
            !messageData.id || 
            messageData.id === '' || 
            messageData.id === '0' ||
            (!messageData.content && !messageData.attachments?.length)) {
            console.error('❌ [MESSAGE-HANDLER] Invalid message data - missing ID or content:', messageData);
            return;
        }
        
        const isTemporary = messageData.is_temporary || messageData.id.toString().startsWith('temp-');
        
        // Primary deduplication check - skip if we've already processed this message
        if (this.processedMessageIds.has(messageData.id)) {
            console.log(`🔄 [MESSAGE-HANDLER] Message ${messageData.id} already processed, skipping`);
            return;
        }
        
        // Check if message element already exists in DOM
        const existingElement = document.querySelector(`[data-message-id="${messageData.id}"]`);
        if (existingElement && !isTemporary) {
            console.log(`🔄 [MESSAGE-HANDLER] Message ${messageData.id} already exists in DOM, skipping`);
            this.processedMessageIds.add(messageData.id);
            return;
        }
        
        // Handle temporary message updates
        if (isTemporary) {
            console.log(`📥 [MESSAGE-HANDLER] Adding temporary message ${messageData.id} to UI`);
        } else {
            console.log(`📥 [MESSAGE-HANDLER] Adding permanent message ${messageData.id} to UI`);
        }
        
        const messagesContainer = this.chatSection.getMessagesContainer();
        if (!messagesContainer) {
            console.error('❌ [MESSAGE-HANDLER] Messages container not found');
            return;
        }
        
        // Hide empty state if it's showing
        this.chatSection.hideEmptyState();
        
        // Format the message data for the bubble component
        const formattedMessage = this.formatMessageForBubble(messageData);
        
        // Final validation on formatted message
        if (!this.isValidFormattedMessage(formattedMessage)) {
            console.error('❌ [MESSAGE-HANDLER] Formatted message failed validation:', formattedMessage);
            return;
        }
        
        // Check if we should append to existing message group or create a new one
        const shouldGroupWithPrevious = this.shouldGroupWithPreviousMessage(messageData);
        
        let messageElement;
        let messageGroup;
        
        if (shouldGroupWithPrevious && this.lastMessageGroup) {
            // Append to existing message group
            const messageContent = this.bubbleComponent.createMessageContent(formattedMessage);
            
            // Add temporary styling if needed
            if (isTemporary) {
                this.bubbleComponent.markAsTemporary(messageContent);
                this.temporaryMessages.set(messageData.id, messageContent);
            }
            
            this.lastMessageGroup.querySelector('.bubble-contents').appendChild(messageContent);
            messageGroup = this.lastMessageGroup;
            messageElement = messageContent;
        } else {
            // Create new message group using bubble component
            messageGroup = this.bubbleComponent.createMessageGroup(formattedMessage);
            if (!messageGroup) {
                console.error('❌ [MESSAGE-HANDLER] Failed to create message group for:', formattedMessage);
                return;
            }
            messagesContainer.appendChild(messageGroup);
            this.lastMessageGroup = messageGroup;
            messageElement = messageGroup.querySelector('[data-message-id]');
        
            // Add temporary styling if needed
        if (isTemporary) {
                this.bubbleComponent.markAsTemporary(messageElement);
                this.temporaryMessages.set(messageData.id, messageElement);
            }
        }
        
        // Add to processed messages IMMEDIATELY to prevent duplicates
        this.processedMessageIds.add(messageData.id);
        
        // Scroll to bottom if needed
        this.chatSection.scrollToBottomIfNeeded();
        
        console.log(`✅ [MESSAGE-HANDLER] Message ${messageData.id} successfully added to UI (source: ${messageData.source})`);
    }
    
    formatMessageForBubble(messageData) {
        // Convert messageData to format expected by bubble component
        return {
            id: messageData.id,
            user_id: messageData.user_id || messageData.userId,
            username: messageData.username || 'Unknown User',
            avatar_url: messageData.avatar_url || messageData.avatarUrl || '/public/assets/common/default-profile-picture.png',
            content: messageData.content || '',
            sent_at: messageData.sent_at || messageData.timestamp,
            edited_at: messageData.edited_at || messageData.editedAt,
            message_type: messageData.message_type || messageData.messageType || 'text',
            attachments: messageData.attachments || [],
            reply_message_id: messageData.reply_message_id || messageData.replyMessageId,
            reply_data: messageData.reply_data || messageData.replyData,
            reactions: messageData.reactions || [],
            timestamp: messageData.timestamp || Date.now()
        };
    }
    
    isValidFormattedMessage(messageData) {
        return messageData && 
               messageData.id && 
               messageData.id !== '' && 
               messageData.id !== '0' &&
               (messageData.content || (messageData.attachments && messageData.attachments.length > 0));
    }
    
    shouldGroupWithPreviousMessage(messageData) {
        if (!this.lastMessageGroup) {
            return false;
        }
        
        const lastMessageUserId = this.lastMessageGroup.dataset.userId;
        const lastMessageTimestamp = parseInt(this.lastMessageGroup.dataset.timestamp);
        const currentMessageTimestamp = messageData.timestamp ? parseInt(messageData.timestamp) : Date.now();
        
        // Group messages if:
        // 1. Same user
        // 2. Within time threshold
        // 3. Not a reply message (replies always start a new group)
        return (
            lastMessageUserId === (messageData.user_id || messageData.userId).toString() &&
            (currentMessageTimestamp - lastMessageTimestamp) < this.messageGroupTimeThreshold &&
            !(messageData.reply_message_id || messageData.replyMessageId)
        );
    }

    



    handleMessageConfirmed(data) {
        console.log('✅ [MESSAGE-HANDLER] Message confirmed:', data);
        
        const { temp_message_id, permanent_message_id } = data;
        
        if (!temp_message_id || !permanent_message_id) {
            console.error('❌ [MESSAGE-HANDLER] Missing message IDs in confirmation:', data);
            return;
        }
        
        // Find the temporary message element
        const tempMessageContent = document.querySelector(`[data-message-id="${temp_message_id}"]`);
        if (!tempMessageContent) {
            console.warn(`⚠️ [MESSAGE-HANDLER] Temporary message ${temp_message_id} not found`);
            return;
        }
        
        // Update the message ID
        tempMessageContent.dataset.messageId = permanent_message_id;
        
        // Remove temporary styling using bubble component
        this.bubbleComponent.markAsConfirmed(tempMessageContent);
        
        // Update processed IDs
        this.processedMessageIds.delete(temp_message_id);
        this.processedMessageIds.add(permanent_message_id);
        
        // Remove from temporary messages map
        this.temporaryMessages.delete(temp_message_id);
        
        console.log(`✅ [MESSAGE-HANDLER] Message ${temp_message_id} confirmed as ${permanent_message_id}`);
    }

    handleMessageFailed(data) {
        console.error('❌ [MESSAGE-HANDLER] Message failed:', data);
        
        const { temp_message_id, error } = data;
        
        if (!temp_message_id) {
            console.error('❌ [MESSAGE-HANDLER] Missing temp_message_id in failure:', data);
            return;
        }
        
        // Find the temporary message element
        const tempMessageContent = document.querySelector(`[data-message-id="${temp_message_id}"]`);
        if (!tempMessageContent) {
            console.warn(`⚠️ [MESSAGE-HANDLER] Failed message ${temp_message_id} not found`);
            return;
        }
        
        // Mark as failed using bubble component
        this.bubbleComponent.markAsFailed(tempMessageContent, error);
        
        // Remove from temporary messages map
        this.temporaryMessages.delete(temp_message_id);
        
        console.log(`❌ [MESSAGE-HANDLER] Message ${temp_message_id} marked as failed`);
    }

    clearProcessedMessages() {
        console.log(`🧹 [MESSAGE-HANDLER] Clearing ${this.processedMessageIds.size} processed message IDs and ${this.temporaryMessages.size} temporary messages`);
        this.processedMessageIds.clear();
        this.temporaryMessages.clear();
        this.lastMessageGroup = null;
    }
    
    removeMessage(messageId) {
        console.log(`🗑️ [MESSAGE-HANDLER] Removing message ${messageId} from tracking`);
        this.processedMessageIds.delete(messageId);
        this.temporaryMessages.delete(messageId);
    }
}

export default MessageHandler;
 