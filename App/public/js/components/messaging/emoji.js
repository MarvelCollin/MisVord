class EmojiSelector {
    constructor() {
        this.emojiList = [
            '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉', 
            '🙏', '🔥', '💯', '👀', '😊', '🤔', '👋', '✨',
            '😍', '🥰', '😘', '😭', '😁', '🙄', '🤩', '🤣'
        ];
        this.activeMessageId = null;
        this.initialized = false;
        this.menu = null;
        this.currentReactions = {};
    }

    init() {
        if (this.initialized) return;
        
        this.createMenu();
        this.registerGlobalEvents();
        this.initialized = true;
    }

    createMenu() {
        this.menu = document.createElement('div');
        this.menu.className = 'emoji-selector-menu';
        this.menu.style.cssText = `
            position: fixed;
            display: none;
            background: #2b2d31;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            padding: 8px;
            z-index: 9999;
            width: 280px;
            display: none;
            flex-wrap: wrap;
            gap: 4px;
        `;
        
        this.emojiList.forEach(emoji => {
            const emojiButton = document.createElement('button');
            emojiButton.className = 'emoji-button';
            emojiButton.textContent = emoji;
            emojiButton.style.cssText = `
                background: transparent;
                border: none;
                padding: 5px;
                font-size: 20px;
                cursor: pointer;
                border-radius: 4px;
                transition: background-color 0.2s;
                width: 36px;
                height: 36px;
            `;
            
            emojiButton.addEventListener('mouseover', () => {
                emojiButton.style.backgroundColor = '#36393f';
            });
            
            emojiButton.addEventListener('mouseout', () => {
                emojiButton.style.backgroundColor = 'transparent';
            });
            
            emojiButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addReaction(emoji);
            });
            
            this.menu.appendChild(emojiButton);
        });
        
        document.body.appendChild(this.menu);
    }
    
    registerGlobalEvents() {
        document.addEventListener('click', (e) => {
            if (this.menu.style.display === 'flex') {
                const isClickInside = this.menu.contains(e.target) || 
                                     (e.target.classList.contains('message-reaction-button') || 
                                      e.target.closest('.message-reaction-button'));
                
                console.log('Document click:', {
                    isMenuShown: this.menu.style.display === 'flex',
                    isClickInside,
                    target: e.target.tagName,
                    targetClass: e.target.className,
                });
                
                if (!isClickInside) {
                    this.hideMenu();
                }
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.menu.style.display === 'flex') {
                this.hideMenu();
            }
        });
        
        document.addEventListener('message-reactions-loaded', (e) => {
            if (e.detail && e.detail.reactions) {
                this.updateReactionsDisplay(e.detail.messageId, e.detail.reactions);
            }
        });
        
        document.addEventListener('show-emoji-menu', (e) => {
            const {messageId, x, y} = e.detail;
            this.showMenu(messageId, x, y);
        });
        
        if (!window.showEmojiMenuAt) {
            window.showEmojiMenuAt = (messageId, x, y) => {
                this.showMenu(messageId || this.activeMessageId || 'test-123', 
                              x || 100, 
                              y || 100);
            };
        }
    }
    
    showMenu(messageId, x, y) {
        this.activeMessageId = messageId;
        
        const currentStyle = this.menu.getAttribute('style') || '';
        const newStyle = currentStyle
            .replace(/left:[^;]+;?/, '')
            .replace(/top:[^;]+;?/, '')
            .replace(/display:[^;]+;?/, '')
            .replace(/visibility:[^;]+;?/, '')
            .replace(/opacity:[^;]+;?/, '')
            + `left:${x}px;top:${y}px;display:flex;visibility:visible;opacity:1;`;
            
        this.menu.setAttribute('style', newStyle);
        
        document.body.appendChild(this.menu);
    }
    
    hideMenu() {
        const currentStyle = this.menu.getAttribute('style') || '';
        const newStyle = currentStyle.replace(/display:[^;]+;?/, 'display:none;');
        this.menu.setAttribute('style', newStyle);
        this.activeMessageId = null;
    }
    
    async addReaction(emoji) {
        if (!this.activeMessageId) return;
        
        const messageId = this.activeMessageId;
        this.hideMenu();
        
        try {
            const messageReactions = document.querySelector(`.message-reactions[data-message-id="${messageId}"]`);
            const existingReaction = messageReactions?.querySelector(`.message-reaction[data-emoji="${emoji}"]`);
            
            if (existingReaction && existingReaction.getAttribute('data-user-reacted') === 'true') {
                await window.ChatAPI.removeReaction(messageId, emoji);
            } else {
                await window.ChatAPI.addReaction(messageId, emoji);
            }
            
            const reactionEvent = new CustomEvent('reaction-updated', {
                detail: {
                    messageId,
                    emoji
                }
            });
            document.dispatchEvent(reactionEvent);
            
        } catch (error) {
            console.error('Error adding/removing reaction:', error);
        }
    }
    
    updateReactionsDisplay(messageId, reactions) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;
        
        let reactionsContainer = messageElement.querySelector('.message-reactions');
        if (!reactionsContainer) {
            reactionsContainer = document.createElement('div');
            reactionsContainer.className = 'message-reactions';
            reactionsContainer.setAttribute('data-message-id', messageId);
            messageElement.appendChild(reactionsContainer);
        } else {
            reactionsContainer.innerHTML = '';
        }
        
        const emojiCounts = {};
        const userReactions = {};
        const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
        
        reactions.forEach(reaction => {
            const emoji = reaction.emoji;
            emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
            
            if (reaction.user_id === currentUserId) {
                userReactions[emoji] = true;
            }
        });
        
        Object.keys(emojiCounts).forEach(emoji => {
            const reactionElement = document.createElement('div');
            reactionElement.className = 'message-reaction';
            reactionElement.setAttribute('data-emoji', emoji);
            reactionElement.setAttribute('data-count', emojiCounts[emoji]);
            reactionElement.setAttribute('data-user-reacted', userReactions[emoji] ? 'true' : 'false');
            
            if (userReactions[emoji]) {
                reactionElement.classList.add('user-reacted');
            }
            
            reactionElement.innerHTML = `
                <span class="reaction-emoji">${emoji}</span>
                <span class="reaction-count">${emojiCounts[emoji]}</span>
            `;
            
            reactionElement.addEventListener('click', () => {
                this.addReaction(emoji);
            });
            
            reactionsContainer.appendChild(reactionElement);
        });
    }
    
    attachToMessage(messageElement) {
        if (!messageElement) return;
        
        const messageId = messageElement.getAttribute('data-message-id');
        if (!messageId) return;
        
        let reactionButton = messageElement.querySelector('.message-reaction-button');
        
        if (!reactionButton) {
            const actionsContainer = messageElement.querySelector('.message-actions') || messageElement;
            
            reactionButton = document.createElement('button');
            reactionButton.className = 'message-reaction-button';
            reactionButton.innerHTML = `<i class="far fa-smile"></i>`;
            
            reactionButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const rect = reactionButton.getBoundingClientRect();
                
                const x = rect.left + window.scrollX;
                const y = rect.bottom + window.scrollY + 5;
                
                const menuWidth = 280; 
                const menuHeight = 200; 
                
                const viewportWidth = window.innerWidth;
                let adjustedX = x;
                if (x + menuWidth > viewportWidth) {
                    adjustedX = viewportWidth - menuWidth - 10;
                }
                
                const viewportHeight = window.innerHeight;
                let adjustedY = y;
                if (y + menuHeight > viewportHeight) {
                    adjustedY = rect.top + window.scrollY - menuHeight - 5;
                }
                
                console.log('Reaction button clicked:', {
                    messageId,
                    originalX: x,
                    originalY: y,
                    adjustedX: adjustedX,
                    adjustedY: adjustedY
                });
                
                this.showMenu(messageId, adjustedX, adjustedY);
                
                const clickEvent = new CustomEvent('emoji-menu-requested', {
                    detail: {messageId, x: adjustedX, y: adjustedY}
                });
                document.dispatchEvent(clickEvent);
            });
            
            if (actionsContainer.classList.contains('message-actions')) {
                actionsContainer.appendChild(reactionButton);
            } else {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'message-actions';
                actionsDiv.appendChild(reactionButton);
                messageElement.appendChild(actionsDiv);
            }
        }
        
        const messageObj = this.getMessageObject(messageElement);
        if (messageObj && messageObj.reactions && messageObj.reactions.length > 0) {
            this.currentReactions[messageId] = messageObj.reactions;
            this.updateReactionsDisplay(messageId, messageObj.reactions);
        } else {
            this.loadReactions(messageId);
        }
    }
    
    getMessageObject(messageElement) {
        try {
            let messageData = messageElement.getAttribute('data-message');
            if (messageData) {
                return JSON.parse(messageData);
            }
            
            if (window.chatSection && window.chatSection.messages) {
                const messageId = messageElement.getAttribute('data-message-id');
                return window.chatSection.messages.find(msg => msg.id == messageId);
            }
        } catch (err) {
            console.error('Error getting message data:', err);
        }
        
        return null;
    }
    
    async loadReactions(messageId) {
        try {
            if (!window.ChatAPI) {
                console.warn('ChatAPI not available to load reactions');
                return;
            }
            
            const reactions = await window.ChatAPI.getMessageReactions(messageId);
            
            if (reactions && reactions.length > 0) {
                if (!this.currentReactions[messageId]) {
                    this.currentReactions[messageId] = [];
                }
                
                this.currentReactions[messageId] = reactions;
                
                this.updateReactionsDisplay(messageId, reactions);
            }
        } catch (error) {
            console.error('Error loading reactions:', error);
        }
    }
    
    handleReactionAdded(data) {
        const { message_id, emoji, user_id, username } = data;
        
        if (!this.currentReactions[message_id]) {
            this.currentReactions[message_id] = [];
        }
        
        const existingIndex = this.currentReactions[message_id].findIndex(r => 
            r.emoji === emoji && r.user_id === user_id);
            
        if (existingIndex === -1) {
            this.currentReactions[message_id].push({
                emoji,
                user_id,
                username
            });
        }
        
        this.updateReactionsDisplay(message_id, this.currentReactions[message_id]);
    }
    
    handleReactionRemoved(data) {
        const { message_id, emoji, user_id } = data;
        
        if (!this.currentReactions[message_id]) return;
        
        this.currentReactions[message_id] = this.currentReactions[message_id].filter(r => 
            !(r.emoji === emoji && r.user_id === user_id));
        
        this.updateReactionsDisplay(message_id, this.currentReactions[message_id]);
    }
}

const emojiSelector = new EmojiSelector();

function initEmojiSelector() {
    if (emojiSelector.initialized) {
        return;
    }
    
    emojiSelector.init();
    
    document.addEventListener('emoji-menu-requested', (e) => {
        const {messageId, x, y} = e.detail;
        emojiSelector.showMenu(messageId, x, y);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiSelector);
} else {
    initEmojiSelector();
}

window.addEventListener('load', initEmojiSelector);

document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .emoji-selector-menu {
            position: fixed !important;
            z-index: 999999 !important;
            background-color: #2b2d31 !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
            padding: 10px !important;
            width: 280px !important;
            flex-wrap: wrap !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        .emoji-selector-menu[style*="display:flex"] {
            display: flex !important;
        }
        
        .emoji-selector-menu .emoji-button {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 4px;
            font-size: 20px;
            transition: background-color 0.2s;
        }
        
        .emoji-selector-menu .emoji-button:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
        .message-reactions {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 4px;
        }
        
        .message-reaction {
            display: inline-flex;
            align-items: center;
            background: #36393f;
            border-radius: 12px;
            padding: 2px 6px;
            cursor: pointer;
            font-size: 14px;
            user-select: none;
        }
        
        .message-reaction.user-reacted {
            background: #4e5d94;
        }
        
        .reaction-emoji {
            font-size: 16px;
            margin-right: 4px;
        }
        
        .reaction-count {
            font-size: 12px;
        }
        
        .message-reaction-button {
            opacity: 0;
            transition: opacity 0.2s;
            background: transparent;
            border: none;
            color: #b9bbbe;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
        }
        
        .message-content:hover .message-reaction-button,
        .message-bubble:hover .message-reaction-button {
            opacity: 1;
        }
        
        .message-reaction-button:hover {
            background-color: #36393f;
            color: #dcddde;
        }
        
        .message-actions {
            display: flex;
            position: absolute;
            top: -20px;
            right: 10px;
            background: #36393f;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 100;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        .message-content:hover .message-actions,
        .message-bubble:hover .message-actions {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
    
    const chatObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        const messages = node.classList && node.classList.contains('message-content') 
                            ? [node] 
                            : node.querySelectorAll('.message-content, .message-bubble');
                            
                        messages.forEach(message => {
                            if (message.getAttribute('data-message-id')) {
                                try {
                                    console.log(`Attaching emoji to message: ${message.getAttribute('data-message-id')}`);
                                    emojiSelector.attachToMessage(message);
                                } catch (error) {
                                    console.error('Error attaching emoji to message:', error);
                                }
                            }
                        });
                    }
                });
            }
        });
    });
    
    const chatContainer = document.querySelector('.chat-messages') || 
                          document.querySelector('.message-container') || 
                          document.getElementById('message-container');
                          
    if (chatContainer) {
        chatObserver.observe(chatContainer, { childList: true, subtree: true });
        
        const existingMessages = chatContainer.querySelectorAll('.message-content, .message-bubble');
        existingMessages.forEach(message => {
            if (message.getAttribute('data-message-id')) {
                try {
                    console.log(`Attaching emoji to existing message: ${message.getAttribute('data-message-id')}`);
                    emojiSelector.attachToMessage(message);
                } catch (error) {
                    console.error('Error attaching emoji to existing message:', error);
                }
            }
        });
    }
    
    if (window.globalSocketManager && window.globalSocketManager.io) {
        window.globalSocketManager.io.on('reaction-added', (data) => {
            emojiSelector.handleReactionAdded(data);
        });
        
        window.globalSocketManager.io.on('reaction-removed', (data) => {
            emojiSelector.handleReactionRemoved(data);
        });
    }
});

window.emojiSelector = emojiSelector;


