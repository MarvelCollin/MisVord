class EmojiSocketHandler {
    constructor() {
        this.emojiList = [
            '👍', '❤️', '🅰️', '🇾', '🇹', '2️⃣', '🅰️', '🇩', '🇲',
            '🇮', '🇪', '🇵', '🇸', '❤️', '1️⃣', '👨‍💻', '🇲', '💙',
            '🔼', '🧡', '🇼', '🙏', '🤍', '🇳', '👋', 
            '🇧', '😂', '😭', '🇧', '6️⃣', '🌴'
        ];
        this.activeMessageId = null;
        this.initialized = false;
        this.menu = null;
        this.currentReactions = {};
        this.handleDocumentClick = null;
    }

    init() {
        if (this.initialized) return;
        this.setupStyles();
        this.registerGlobalEvents();
        this.initialized = true;
    }

    setupStyles() {
        const existingStyle = document.getElementById('emoji-picker-style');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        const style = document.createElement('style');
        style.id = 'emoji-picker-style';
        style.textContent = `
            .emoji-selector-menu {
                position: fixed !important;
                z-index: 999999 !important;
                background-color: #2b2d31 !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
                padding: 10px !important;
                width: 250px !important;
                flex-wrap: wrap !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                display: none;
            }
            
            .emoji-selector-menu.visible {
                display: flex !important;
            }
            
            .emoji-header {
                width: 100% !important;
                padding-bottom: 4px !important;
                margin-bottom: 4px !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                font-size: 12px !important;
                color: #b9bbbe !important;
                font-weight: bold !important;
            }
            
            .emoji-selector-menu .emoji-button {
                width: 32px !important;
                height: 32px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                border-radius: 4px !important;
                font-size: 20px !important;
                transition: background-color 0.2s !important;
                background: transparent !important;
                border: none !important;
                padding: 0 !important;
                margin: 1px !important;
            }
            
            .emoji-selector-menu .emoji-button:hover {
                background-color: rgba(255, 255, 255, 0.1) !important;
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
        `;
        document.head.appendChild(style);
    }

    registerGlobalEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.menu && document.body.contains(this.menu)) {
                this.hideMenu();
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
        
        try {
            const existingMenu = document.querySelector('.emoji-selector-menu');
            if (existingMenu) {
                existingMenu.remove();
            }
            
            const menu = document.createElement('div');
            menu.className = 'emoji-selector-menu';
            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
            
            const header = document.createElement('div');
            header.className = 'emoji-header';
            header.textContent = 'FREQUENTLY USED';
            menu.appendChild(header);
            
            this.emojiList.forEach(emoji => {
                const button = document.createElement('button');
                button.className = 'emoji-button';
                button.textContent = emoji;
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.addReaction(emoji);
                });
                menu.appendChild(button);
            });
            
            document.body.appendChild(menu);
            this.menu = menu;
            
            menu.style.opacity = '0';
            menu.style.transform = 'scale(0.95)';
            
            void menu.offsetWidth;
            menu.classList.add('visible');
            
            setTimeout(() => {
                menu.style.opacity = '1';
                menu.style.transform = 'scale(1)';
            }, 10);
            
            document.addEventListener('click', this.handleDocumentClick = (e) => {
                if (!menu.contains(e.target) && 
                    !e.target.classList.contains('message-action-reaction') && 
                    !e.target.closest('.message-action-reaction')) {
                    this.hideMenu();
                    document.removeEventListener('click', this.handleDocumentClick);
                }
            });
            
        } catch (error) {
            console.error('Error creating emoji menu:', error);
        }
    }

    hideMenu() {
        try {
            if (!this.menu || !document.body.contains(this.menu)) {
                return;
            }
            
            this.menu.style.opacity = '0';
            this.menu.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                if (this.menu && document.body.contains(this.menu)) {
                    this.menu.remove();
                }
                this.activeMessageId = null;
                
                if (this.handleDocumentClick) {
                    document.removeEventListener('click', this.handleDocumentClick);
                    this.handleDocumentClick = null;
                }
            }, 100);
            
        } catch (error) {
            console.error('Error hiding emoji menu:', error);
        }
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

const emojiSocketHandler = new EmojiSocketHandler();

function initEmojiSocketHandler() {
    if (emojiSocketHandler.initialized) {
        return;
    }
    
    emojiSocketHandler.init();
    
    document.addEventListener('emoji-menu-requested', (e) => {
        const {messageId, x, y} = e.detail;
        emojiSocketHandler.showMenu(messageId, x, y);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiSocketHandler);
} else {
    initEmojiSocketHandler();
}

window.addEventListener('load', initEmojiSocketHandler);

window.emojiSocketHandler = emojiSocketHandler;

if (document.readyState !== 'loading') {
    initEmojiSocketHandler();
}

if (window.globalSocketManager && window.globalSocketManager.io) {
    window.globalSocketManager.io.on('reaction-added', (data) => {
        emojiSocketHandler.handleReactionAdded(data);
    });
    
    window.globalSocketManager.io.on('reaction-removed', (data) => {
        emojiSocketHandler.handleReactionRemoved(data);
    });
}
