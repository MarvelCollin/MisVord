console.log('📣 Emoji reactions script loading...'); 

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
        this.loadingReactions = new Set();
        this.loadedMessageIds = new Set();
        this.debounceTimers = new Map();
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
                                this.updateReactionButtonState(message, messageId);
                                if (/^\d+$/.test(String(messageId))) {
                                    this.loadMessageReactions(messageId);
                                }
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
                this.updateReactionButtonState(message, messageId);
                if (/^\d+$/.test(String(messageId))) {
                    this.loadMessageReactions(messageId);
                }
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
        
        if (!/^\d+$/.test(String(messageId))) {
            return;
        }
        
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
            const response = await window.ChatAPI.addReaction(messageId, emoji);
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content || window.globalSocketManager?.userId;
            const currentUsername = window.globalSocketManager?.username || 'You';
            this.handleReactionAdded({
                message_id: messageId,
                emoji: emoji,
                user_id: currentUserId,
                username: currentUsername
            });
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    }

    async removeReaction(messageId, emoji) {
        try {
            const response = await window.ChatAPI.removeReaction(messageId, emoji);
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content || window.globalSocketManager?.userId;
            this.handleReactionRemoved({
                message_id: messageId,
                emoji: emoji,
                user_id: currentUserId
            });
        } catch (error) {
            console.error('Error removing reaction:', error);
        }
    }

    async loadMessageReactions(messageId) {
        if (!window.ChatAPI) return;
        
        if (!/^\d+$/.test(String(messageId))) {
            return;
        }
        
        if (this.loadedMessageIds.has(messageId)) return;
        
        if (this.loadingReactions.has(messageId)) return;
        
        if (this.debounceTimers.has(messageId)) {
            clearTimeout(this.debounceTimers.get(messageId));
        }

        this.loadingReactions.add(messageId);
        
        try {
            const reactions = await window.ChatAPI.getMessageReactions(messageId);
            this.updateReactionsDisplay(messageId, reactions || []);
            this.loadedMessageIds.add(messageId);
        } catch (error) {
            console.error(`Error loading reactions for message ${messageId}:`, error);
        } finally {
            this.loadingReactions.delete(messageId);
            this.debounceTimers.delete(messageId);
        }
    }

    updateReactionsDisplay(messageId, reactions, retryCount = 0) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            if (retryCount < 5) {
                setTimeout(() => {
                    this.updateReactionsDisplay(messageId, reactions, retryCount + 1);
                }, 300);
            }
            return;
        }

        let reactionsContainer = messageElement.querySelector('.message-reactions-container');
        
        if (!reactions || reactions.length === 0) {
            if (reactionsContainer) {
                reactionsContainer.remove();
            }
            this.currentReactions[messageId] = [];
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
            
            reactionPill.classList.add('reaction-fade-in');
            setTimeout(() => {
                reactionPill.classList.add('reaction-appear');
            }, 10);

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
                    console.log('📥 Received reaction-added:', data);
                    this.handleReactionAdded(data);
                });
                
                window.globalSocketManager.io.on('reaction-removed', (data) => {
                    console.log('📥 Received reaction-removed:', data);
                    this.handleReactionRemoved(data);
                });
                
                console.log('✅ Emoji reaction socket listeners set up');
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
            
            setTimeout(() => {
                const reactionElement = document.querySelector(`[data-message-id="${message_id}"] .message-reaction-pill[data-emoji="${emoji}"]`);
                if (reactionElement) {
                    reactionElement.classList.add('reaction-pop');
                    setTimeout(() => {
                        reactionElement.classList.remove('reaction-pop');
                    }, 1000);
                }
            }, 50);
        }
    }

    handleReactionRemoved(data) {
        const { message_id, emoji, user_id } = data;
        
        if (!this.currentReactions[message_id]) return;

        this.currentReactions[message_id] = this.currentReactions[message_id].filter(r => 
            !(r.emoji === emoji && String(r.user_id) === String(user_id)));
        
        // Always update display, removing the equality check
        this.updateReactionsDisplay(message_id, this.currentReactions[message_id]);
    }

    updateReactionButtonState(messageElement, messageId) {
        const reactionButton = messageElement.querySelector('.message-action-reaction');
        if (reactionButton) {
            if (!/^\d+$/.test(String(messageId))) {
                reactionButton.style.pointerEvents = 'none';
                reactionButton.style.opacity = '0.4';
            } else {
                reactionButton.style.pointerEvents = '';
                reactionButton.style.opacity = '';
            }
        }
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

window.debugEmojis = function() {
    console.log('🔬 EmojiReactions Debug Info:');
    console.log('✅ Initialized:', emojiReactions.initialized);
    console.log('📊 Current reactions by message ID:', emojiReactions.currentReactions);
    console.log('🧠 Loaded message IDs:', Array.from(emojiReactions.loadedMessageIds));
    console.log('⏳ Loading reactions for:', Array.from(emojiReactions.loadingReactions));
                
    const messages = document.querySelectorAll('.message-content[data-message-id]');
    console.log(`📝 Found ${messages.length} messages on page`);
    
    messages.forEach(msg => {
        const messageId = msg.dataset.messageId;
        const hasReactionsContainer = !!msg.querySelector('.message-reactions-container');
        const reactionsInMemory = emojiReactions.currentReactions[messageId] || [];
        
        console.log(`📌 Message ID: ${messageId}`);
        console.log(`   - Has reactions container: ${hasReactionsContainer}`);
        console.log(`   - Reactions in memory: ${reactionsInMemory.length}`);
        
        if (reactionsInMemory.length > 0) {
            console.log(`   - Reaction details:`, reactionsInMemory);
        }
        
        if (!hasReactionsContainer && reactionsInMemory.length > 0) {
            console.warn(`⚠️ Message ${messageId} has reactions in memory but no container!`);
        }
    });
    
    return {
        reactionsLoaded: Object.keys(emojiReactions.currentReactions).length,
        messageCount: messages.length,
        initialized: emojiReactions.initialized
    };
};

// Add a function to force-load reactions for all visible messages
window.forceLoadAllReactions = function() {
    console.log('🔄 Force loading reactions for all visible messages...');
    const messages = document.querySelectorAll('.message-content[data-message-id]');
    
    messages.forEach(msg => {
        const messageId = msg.dataset.messageId;
        console.log(`📥 Force loading reactions for message ID: ${messageId}`);
        
        // Clear cached state
        emojiReactions.loadedMessageIds.delete(messageId);
        
        // Load reactions
        emojiReactions.loadMessageReactions(messageId);
    });
    
    return `Started loading reactions for ${messages.length} messages`;
};