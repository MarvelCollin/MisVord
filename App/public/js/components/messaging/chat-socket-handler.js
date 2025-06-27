class EmojiSocketHandler {
    constructor() {
        this.emojiList = [
            '👍', '❤️', '😂', '😭', '😮', '😡', '🎉', '🔥',
            '💯', '👀', '😊', '🤔', '👋', '✨', '😍', '🥰',
            '😘', '😁', '🙄', '🤩', '🤣', '😎', '🙏', '💙',
            '🧡', '💚', '💛', '💜', '🖤', '🤍', '💯', '🌟'
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
                gap: 3px;
                margin-top: 6px;
                margin-bottom: 2px;
                max-width: 100%;
            }
            
            .message-reaction {
                display: inline-flex;
                align-items: center;
                background: rgba(79, 84, 92, 0.16);
                border: 1px solid rgba(79, 84, 92, 0.24);
                border-radius: 12px;
                padding: 3px 6px;
                cursor: pointer;
                font-size: 13px;
                user-select: none;
                transition: all 0.15s ease;
                min-height: 24px;
                position: relative;
                overflow: hidden;
            }
            
            .message-reaction:hover {
                background: rgba(79, 84, 92, 0.24);
                border-color: rgba(79, 84, 92, 0.32);
                transform: scale(1.05);
            }
            
            .message-reaction.user-reacted {
                background: rgba(88, 101, 242, 0.15);
                border-color: rgba(88, 101, 242, 0.3);
                color: #5865f2;
            }
            
            .message-reaction.user-reacted:hover {
                background: rgba(88, 101, 242, 0.2);
                border-color: rgba(88, 101, 242, 0.4);
            }
            
            .reaction-emoji {
                font-size: 14px;
                margin-right: 3px;
                line-height: 1;
            }
            
            .reaction-count {
                font-size: 11px;
                font-weight: 500;
                line-height: 1;
                color: #b9bbbe;
            }
            
            .message-reaction.user-reacted .reaction-count {
                color: #5865f2;
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

        this.setupMessageObserver();
    }

    setupMessageObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const messages = node.classList?.contains('message-content') ? 
                            [node] : node.querySelectorAll?.('.message-content') || [];
                        
                        messages.forEach(message => {
                            const messageId = message.dataset.messageId;
                            if (messageId) {
                                this.loadReactions(messageId);
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        document.querySelectorAll('.message-content').forEach(message => {
            const messageId = message.dataset.messageId;
            if (messageId) {
                this.loadReactions(messageId);
            }
        });

        this.setupExistingReactionButtons();
    }

    setupExistingReactionButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('message-action-reaction') || 
                e.target.closest('.message-action-reaction')) {
                e.stopPropagation();
                const messageElement = e.target.closest('.message-content');
                if (messageElement) {
                    const messageId = messageElement.dataset.messageId;
                    if (messageId) {
                        const rect = e.target.getBoundingClientRect();
                        this.showMenu(messageId, rect.left - 100, rect.bottom + 5);
                    }
                }
            }
        });
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
            if (!window.ChatAPI) {
                throw new Error('ChatAPI not available');
            }
            
            await window.ChatAPI.addReaction(messageId, emoji);
            
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

    async loadReactions(messageId) {
        try {
            if (!window.ChatAPI) {
                console.warn('ChatAPI not available to load reactions');
                return;
            }
            
            const reactions = await window.ChatAPI.getMessageReactions(messageId);
            
            if (window.emojiReactions) {
                window.emojiReactions.updateReactionsDisplay(messageId, reactions || []);
            }
        } catch (error) {
            console.error('Error loading reactions:', error);
        }
    }
}

const emojiSocketHandler = new EmojiSocketHandler();

function initEmojiSocketHandler() {
    console.log('Chat socket handler init skipped');
}

window.emojiSocketHandler = {
    initialized: false,
    init: () => {},
    showMenu: (messageId, x, y) => {
        if (emojiSocketHandler) {
            emojiSocketHandler.showMenu(messageId, x, y);
        }
    }
};
