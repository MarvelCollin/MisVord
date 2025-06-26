class EmojiReactions {
    constructor() {
        this.emojiList = [
            '👍', '❤️', '😂', '😭', '😮', '😡', '🎉', '🔥',
            '💯', '👀', '😊', '🤔', '👋', '✨', '😍', '🥰',
            '😘', '😁', '🙄', '🤩', '🤣', '😎', '🙏', '💙',
            '🧡', '💚', '💛', '💜', '🖤', '🤍', '🌟', '⚡'
        ];
        this.currentReactions = {};
        this.initialized = false;
        this.menu = null;
        this.activeMessageId = null;
    }

    init() {
        if (this.initialized) return;
        this.setupStyles();
        this.setupMessageHandling();
        this.setupSocketListeners();
        this.initialized = true;
    }

    setupStyles() {
        if (document.getElementById('emoji-reactions-style')) return;
        
        const style = document.createElement('style');
        style.id = 'emoji-reactions-style';
        style.textContent = `
            .emoji-picker-menu {
                position: fixed;
                z-index: 999999;
                background: #2f3136;
                border-radius: 8px;
                padding: 12px;
                width: 280px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                border: 1px solid rgba(79, 84, 92, 0.48);
                display: none;
                flex-wrap: wrap;
                gap: 4px;
            }
            
            .emoji-picker-menu.visible {
                display: flex;
            }
            
            .emoji-picker-header {
                width: 100%;
                font-size: 11px;
                font-weight: 600;
                color: #72767d;
                text-transform: uppercase;
                margin-bottom: 8px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(79, 84, 92, 0.32);
            }
            
            .emoji-picker-button {
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                border-radius: 6px;
                font-size: 20px;
                transition: background-color 0.15s ease;
                background: transparent;
                border: none;
                padding: 0;
            }
            
            .emoji-picker-button:hover {
                background: rgba(79, 84, 92, 0.32);
            }
            
            .message-reactions-container {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-top: 6px;
                margin-bottom: 2px;
            }
            
            .message-reaction-pill {
                display: inline-flex;
                align-items: center;
                background: rgba(79, 84, 92, 0.16);
                border: 1px solid rgba(79, 84, 92, 0.24);
                border-radius: 12px;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 13px;
                user-select: none;
                transition: all 0.2s ease;
                min-height: 28px;
                gap: 4px;
            }
            
            .message-reaction-pill:hover {
                background: rgba(79, 84, 92, 0.24);
                border-color: rgba(79, 84, 92, 0.4);
                transform: translateY(-1px);
            }
            
            .message-reaction-pill.user-reacted {
                background: rgba(88, 101, 242, 0.15);
                border-color: rgba(88, 101, 242, 0.4);
                color: #5865f2;
            }
            
            .message-reaction-pill.user-reacted:hover {
                background: rgba(88, 101, 242, 0.25);
                border-color: rgba(88, 101, 242, 0.6);
            }
            
            .reaction-emoji {
                font-size: 16px;
                line-height: 1;
            }
            
            .reaction-count {
                font-size: 12px;
                font-weight: 500;
                color: #b9bbbe;
                line-height: 1;
            }
            
            .message-reaction-pill.user-reacted .reaction-count {
                color: #5865f2;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    }

    setupMessageHandling() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const messages = node.classList?.contains('message-content') ? 
                            [node] : node.querySelectorAll?.('.message-content') || [];
                        
                        messages.forEach(message => {
                            const messageId = message.dataset.messageId;
                            if (messageId) {
                                this.loadMessageReactions(messageId);
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
                this.loadMessageReactions(messageId);
            }
        });

        this.setupExistingReactionButtons();
    }

    setupExistingReactionButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('message-action-reaction') || 
                e.target.closest('.message-action-reaction')) {
                e.stopPropagation();
                const messageElement = e.target.closest('.message-content') || 
                                    e.target.closest('[data-message-id]');
                if (messageElement) {
                    const messageId = messageElement.dataset.messageId;
                    if (messageId) {
                        this.showEmojiPicker(messageId, e.target);
                    }
                }
            }
        });
    }

    showEmojiPicker(messageId, triggerElement) {
        this.activeMessageId = messageId;
        this.hideEmojiPicker();

        const menu = document.createElement('div');
        menu.className = 'emoji-picker-menu';

        const header = document.createElement('div');
        header.className = 'emoji-picker-header';
        header.textContent = 'Frequently Used';
        menu.appendChild(header);

        this.emojiList.forEach(emoji => {
            const button = document.createElement('button');
            button.className = 'emoji-picker-button';
            button.textContent = emoji;
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleReaction(messageId, emoji);
            });
            menu.appendChild(button);
        });

        const rect = triggerElement.getBoundingClientRect();
        menu.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
        menu.style.top = `${rect.bottom + 8}px`;

        document.body.appendChild(menu);
        this.menu = menu;

        setTimeout(() => menu.classList.add('visible'), 10);

        const closeHandler = (e) => {
            if (!menu.contains(e.target) && !triggerElement.contains(e.target)) {
                this.hideEmojiPicker();
                document.removeEventListener('click', closeHandler);
            }
        };
        
        document.addEventListener('click', closeHandler);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideEmojiPicker();
            }
        }, { once: true });
    }

    hideEmojiPicker() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
        this.activeMessageId = null;
    }

    async toggleReaction(messageId, emoji) {
        this.hideEmojiPicker();
        
        try {
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            const reactionsContainer = messageElement?.querySelector('.message-reactions-container');
            const existingReaction = reactionsContainer?.querySelector(`[data-emoji="${emoji}"]`);
            const isUserReacted = existingReaction?.classList.contains('user-reacted');

            if (isUserReacted) {
                await this.removeReaction(messageId, emoji);
            } else {
                await this.addReaction(messageId, emoji);
            }
        } catch (error) {
            console.error('Error toggling reaction:', error);
        }
    }

    async addReaction(messageId, emoji) {
        try {
            await window.ChatAPI.addReaction(messageId, emoji);
            this.emitReactionSocket('reaction-added', messageId, emoji);
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    }

    async removeReaction(messageId, emoji) {
        try {
            await window.ChatAPI.removeReaction(messageId, emoji);
            this.emitReactionSocket('reaction-removed', messageId, emoji);
        } catch (error) {
            console.error('Error removing reaction:', error);
        }
    }

    emitReactionSocket(eventType, messageId, emoji) {
        if (!window.globalSocketManager?.io) return;

        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        const isChannelMessage = messageElement?.closest('.channel-messages');
        const isDMMessage = messageElement?.closest('.dm-messages');

        const socketData = {
            message_id: messageId,
            emoji: emoji,
            user_id: document.querySelector('meta[name="user-id"]')?.content,
            username: document.querySelector('meta[name="username"]')?.content
        };

        if (isChannelMessage) {
            const channelId = messageElement.dataset.channelId || window.currentChannelId;
            socketData.target_type = 'channel';
            socketData.target_id = channelId;
            socketData.channelId = channelId;
        } else if (isDMMessage) {
            const roomId = messageElement.dataset.roomId || window.currentRoomId;
            socketData.target_type = 'dm';
            socketData.target_id = roomId;
            socketData.roomId = roomId;
        }

        window.globalSocketManager.io.emit(eventType, socketData);
    }

    async loadMessageReactions(messageId) {
        try {
            const reactions = await window.ChatAPI.getMessageReactions(messageId);
            this.updateReactionsDisplay(messageId, reactions || []);
        } catch (error) {
            console.error('Error loading reactions:', error);
        }
    }

    updateReactionsDisplay(messageId, reactions) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.log('Message element not found for ID:', messageId);
            return;
        }

        let reactionsContainer = messageElement.querySelector('.message-reactions-container');
        
        if (!reactions || reactions.length === 0) {
            if (reactionsContainer) {
                reactionsContainer.remove();
            }
            return;
        }

        if (!reactionsContainer) {
            reactionsContainer = document.createElement('div');
            reactionsContainer.className = 'message-reactions-container';
            
            const messageContent = messageElement.querySelector('.message-main-text') || 
                                 messageElement.querySelector('.message-content') ||
                                 messageElement;
            
            if (messageContent.parentElement) {
                messageContent.parentElement.appendChild(reactionsContainer);
            } else {
                messageElement.appendChild(reactionsContainer);
            }
        }

        reactionsContainer.innerHTML = '';

        const emojiCounts = {};
        const userReactions = new Set();
        const currentUserId = document.querySelector('meta[name="user-id"]')?.content;

        reactions.forEach(reaction => {
            const emoji = reaction.emoji;
            emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
            
            if (String(reaction.user_id) === String(currentUserId)) {
                userReactions.add(emoji);
            }
        });

        Object.entries(emojiCounts).forEach(([emoji, count]) => {
            const reactionPill = document.createElement('div');
            reactionPill.className = 'message-reaction-pill';
            reactionPill.dataset.emoji = emoji;
            reactionPill.dataset.messageId = messageId;
            reactionPill.title = `${count} reaction${count > 1 ? 's' : ''}`;

            if (userReactions.has(emoji)) {
                reactionPill.classList.add('user-reacted');
            }

            reactionPill.innerHTML = `
                <span class="reaction-emoji">${emoji}</span>
                <span class="reaction-count">${count}</span>
            `;

            reactionPill.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleReaction(messageId, emoji);
            });

            reactionsContainer.appendChild(reactionPill);
        });

        this.currentReactions[messageId] = reactions;
    }

    setupSocketListeners() {
        const setupListeners = () => {
            if (window.globalSocketManager?.io) {
                window.globalSocketManager.io.on('reaction-added', (data) => {
                    this.handleReactionAdded(data);
                });
                
                window.globalSocketManager.io.on('reaction-removed', (data) => {
                    this.handleReactionRemoved(data);
                });
            } else {
                setTimeout(setupListeners, 200);
            }
        };
        
        setupListeners();
    }

    handleReactionAdded(data) {
        const { message_id, emoji, user_id, username } = data;
        
        if (!this.currentReactions[message_id]) {
            this.currentReactions[message_id] = [];
        }

        const existingIndex = this.currentReactions[message_id].findIndex(r => 
            String(r.user_id) === String(user_id) && r.emoji === emoji);
            
        if (existingIndex === -1) {
            this.currentReactions[message_id].push({
                emoji,
                user_id: String(user_id),
                username
            });
            
            this.updateReactionsDisplay(message_id, this.currentReactions[message_id]);
        }
    }

    handleReactionRemoved(data) {
        const { message_id, emoji, user_id } = data;
        
        if (!this.currentReactions[message_id]) return;

        this.currentReactions[message_id] = this.currentReactions[message_id].filter(r => 
            !(r.emoji === emoji && String(r.user_id) === String(user_id)));
        
        this.updateReactionsDisplay(message_id, this.currentReactions[message_id]);
    }
}

const emojiReactions = new EmojiReactions();

function initEmojiReactions() {
    if (emojiReactions.initialized) return;
    emojiReactions.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiReactions);
} else {
    initEmojiReactions();
}

window.emojiReactions = emojiReactions; 