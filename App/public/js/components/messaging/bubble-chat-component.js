class BubbleChatComponent {
    constructor() {
        this.addBubbleChatCSS();
        console.log(' BubbleChatComponent initialized');
    }
    
    addBubbleChatCSS() {
        if (document.getElementById('bubble-chat-css')) return;
        
        const style = document.createElement('style');
        style.id = 'bubble-chat-css';
        style.textContent = `
            .bubble-message-group {
                display: flex !important;
                align-items: flex-start !important;
                padding: 2px 16px !important;
                transition: background-color 0.1s ease !important;
                position: relative !important;
                overflow: visible !important;
            }
            
            .bubble-message-group:hover {
                background-color: rgba(79, 84, 92, 0.16) !important;
            }
            
            .bubble-message-group:hover .bubble-message-actions {
                opacity: 1 !important;
            }
            
            .bubble-avatar {
                width: 40px !important;
                height: 40px !important;
                border-radius: 50% !important;
                overflow: hidden !important;
                margin-right: 16px !important;
                margin-top: 2px !important;
                flex-shrink: 0 !important;
            }
            
            .bubble-avatar img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
            }
            
            .bubble-content-wrapper {
                flex: 1 !important;
                min-width: 0 !important;
                position: relative !important;
                overflow: visible !important;
            }
            
            .bubble-header {
                display: flex !important;
                align-items: baseline !important;
                margin-bottom: 4px !important;
            }
            
            .bubble-username {
                font-weight: 600 !important;
                color: #f2f3f5 !important;
                margin-right: 8px !important;
                font-size: 15px !important;
                cursor: pointer !important;
            }
            
            .bubble-username:hover {
                text-decoration: underline !important;
            }
            
            .bubble-timestamp {
                font-size: 12px !important;
                color: #a3a6aa !important;
            }
            
            .bubble-contents {
                overflow: visible !important;
                position: relative !important;
            }
            
            .bubble-message-content {
                position: relative !important;
                overflow: visible !important;
                margin-bottom: 1px !important;
            }
            
            .bubble-message-text {
                color: #dcddde !important;
                word-wrap: break-word !important;
                line-height: 1.375 !important;
            }
            
            .bubble-message-actions {
                position: absolute !important;
                right: -4px !important;
                top: -4px !important;
                z-index: 999 !important;
                opacity: 0 !important;
                transition: opacity 0.2s ease !important;
                display: flex !important;
                align-items: center !important;
                background-color: #36393f !important;
                border-radius: 6px !important;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
                overflow: visible !important;
            }
            
            .bubble-action-button {
                padding: 8px !important;
                color: #b9bbbe !important;
                background: transparent !important;
                border: none !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
            }
            
            .bubble-action-button:hover {
                color: #dcddde !important;
                background-color: #32353b !important;
            }
            
            .bubble-action-button:first-child {
                border-radius: 6px 0 0 6px !important;
            }
            
            .bubble-action-button:last-child {
                border-radius: 0 6px 6px 0 !important;
            }
            
            .bubble-action-button.delete-button:hover {
                color: #ed4245 !important;
            }
            
            .bubble-message-temporary {
                opacity: 0.7 !important;
            }
            
            .bubble-message-failed {
                opacity: 0.5 !important;
                border-left: 3px solid #ed4245 !important;
                padding-left: 8px !important;
            }
            
            .bubble-error-text {
                color: #ed4245 !important;
                font-size: 12px !important;
                margin-top: 4px !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    createMessageGroup(messageData) {
        // Validate message data before creating group
        if (!messageData || 
            !messageData.id || 
            messageData.id === '' || 
            messageData.id === '0' ||
            (!messageData.content && !messageData.attachments?.length)) {
            console.error('❌ [BUBBLE-COMPONENT] Invalid message data for group creation:', messageData);
            return null;
        }
        
        const messageGroup = document.createElement('div');
        messageGroup.className = 'bubble-message-group';
        messageGroup.dataset.userId = messageData.user_id || messageData.userId;
        messageGroup.dataset.timestamp = messageData.timestamp || Date.now();
        
        const avatar = this.createAvatar(messageData);
        messageGroup.appendChild(avatar);
        
        const contentWrapper = this.createContentWrapper(messageData);
        messageGroup.appendChild(contentWrapper);
        
        return messageGroup;
    }
    
    createAvatar(messageData) {
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'bubble-avatar';
        
        const avatarImg = document.createElement('img');
        avatarImg.src = messageData.avatar_url || messageData.avatarUrl || '/public/assets/common/default-profile-picture.png';
        avatarImg.alt = messageData.username || 'User';
        avatarImg.onerror = function() {
            this.src = '/public/assets/common/default-profile-picture.png';
        };
        
        avatarContainer.appendChild(avatarImg);
        return avatarContainer;
    }
    
    createContentWrapper(messageData) {
        const wrapper = document.createElement('div');
        wrapper.className = 'bubble-content-wrapper';
        
        const header = this.createHeader(messageData);
        wrapper.appendChild(header);
        
        const contents = document.createElement('div');
        contents.className = 'bubble-contents';
        
        const messageContent = this.createMessageContent(messageData);
        contents.appendChild(messageContent);
        
        wrapper.appendChild(contents);
        return wrapper;
    }
    
    createHeader(messageData) {
        const header = document.createElement('div');
        header.className = 'bubble-header';
        
        const username = document.createElement('span');
        username.className = 'bubble-username';
        username.textContent = messageData.username || 'Unknown User';
        
        const timestamp = document.createElement('span');
        timestamp.className = 'bubble-timestamp';
        timestamp.textContent = this.formatTimestamp(messageData.sent_at || messageData.timestamp);
        
        header.appendChild(username);
        header.appendChild(timestamp);
        
        return header;
    }
    
    createMessageContent(messageData) {
        const content = document.createElement('div');
        content.className = 'bubble-message-content';
        content.dataset.messageId = messageData.id;
        content.dataset.userId = messageData.user_id || messageData.userId;
        
        if (messageData.content) {
            const messageText = this.createMessageText(messageData);
            content.appendChild(messageText);
        }
        
        const actions = this.createMessageActions(messageData);
        content.appendChild(actions);
        
        return content;
    }
    
    createMessageText(messageData) {
        const textContainer = document.createElement('div');
        textContainer.className = 'bubble-message-text';
        textContainer.textContent = messageData.content || '';
        
        return textContainer;
    }
    
    createMessageActions(messageData) {
        const actions = document.createElement('div');
        actions.className = 'bubble-message-actions';
        
        const replyBtn = document.createElement('button');
        replyBtn.className = 'bubble-action-button';
        replyBtn.innerHTML = '<i class="fas fa-reply"></i>';
        replyBtn.title = 'Reply';
        actions.appendChild(replyBtn);
        
        const reactBtn = document.createElement('button');
        reactBtn.className = 'bubble-action-button';
        reactBtn.innerHTML = '<i class="fas fa-smile"></i>';
        reactBtn.title = 'React';
        actions.appendChild(reactBtn);
        
        const moreBtn = document.createElement('button');
        moreBtn.className = 'bubble-action-button';
        moreBtn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
        moreBtn.title = 'More';
        actions.appendChild(moreBtn);
        
        return actions;
    }
    
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }
    
    markAsTemporary(messageElement) {
        messageElement.classList.add('bubble-message-temporary');
    }
    
    markAsConfirmed(messageElement) {
        messageElement.classList.remove('bubble-message-temporary');
    }
    
    markAsFailed(messageElement, error) {
        messageElement.classList.add('bubble-message-failed');
        
        const errorText = document.createElement('div');
        errorText.className = 'bubble-error-text';
        errorText.textContent = error || 'Failed to send message';
        messageElement.appendChild(errorText);
    }
    
    static downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

window.BubbleChatComponent = window.BubbleChatComponent || new BubbleChatComponent();
export default BubbleChatComponent;
