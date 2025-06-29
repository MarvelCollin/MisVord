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
            const messagesToProcess = new Set();
            
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const messages = node.classList?.contains('message-content') ? 
                            [node] : node.querySelectorAll?.('.message-content') || [];
                        
                        messages.forEach(message => {
                            const messageId = message.dataset.messageId;
                            if (messageId && !this.loadedMessageIds.has(messageId)) {
                                messagesToProcess.add(messageId);
                            }
                        });
                    }
                });
            });
            
            // Process messages in batch to avoid repeated calls
            messagesToProcess.forEach(messageId => {
                const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                if (messageElement) {
                    this.updateReactionButtonState(messageElement, messageId);
                    if (/^\d+$/.test(String(messageId))) {
                        this.loadMessageReactions(messageId);
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Process existing messages only once
        document.querySelectorAll('.message-content').forEach(message => {
            const messageId = message.dataset.messageId;
            if (messageId && !this.loadedMessageIds.has(messageId)) {
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
            let triggerElement = null;
            let messageElement = null;
            let messageId = null;
            
            if (e.target.classList.contains('message-action-reaction') || 
                e.target.closest('.message-action-reaction')) {
                e.stopPropagation();
                triggerElement = e.target.classList.contains('message-action-reaction') ? e.target : e.target.closest('.message-action-reaction');
                messageElement = triggerElement.closest('.message-content') || triggerElement.closest('[data-message-id]');
                if (messageElement) {
                    messageId = messageElement.dataset.messageId;
                    if (messageId) {
                        this.showEmojiPicker(messageId, triggerElement);
                    }
                }
            }
            
            else if (e.target.classList.contains('bubble-action-button') && e.target.dataset.action === 'react') {
                e.stopPropagation();
                triggerElement = e.target;
                messageId = e.target.dataset.messageId;
                if (messageId) {
                    console.log('🎯 [EMOJI-REACTIONS] Bubble action button clicked for message:', messageId);
                    this.showEmojiPicker(messageId, triggerElement);
                }
            }
            
            else if (e.target.closest('.bubble-action-button[data-action="react"]')) {
                e.stopPropagation();
                triggerElement = e.target.closest('.bubble-action-button[data-action="react"]');
                messageId = triggerElement.dataset.messageId;
                if (messageId) {
                    console.log('🎯 [EMOJI-REACTIONS] Bubble action button (child) clicked for message:', messageId);
                    this.showEmojiPicker(messageId, triggerElement);
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
            console.log('🎉 Reaction API response:', response);
            
            if (response.success && response.data) {
                const currentUserId = document.querySelector('meta[name="user-id"]')?.content || window.globalSocketManager?.userId;
                const currentUsername = window.globalSocketManager?.username || 'You';
                
                // Handle local reaction addition first
                this.handleReactionAdded({
                    message_id: messageId,
                    emoji: emoji,
                    user_id: currentUserId,
                    username: currentUsername
                });
                
                // Emit socket event to notify other users
                if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                    const socketData = {
                        message_id: messageId,
                        emoji: emoji,
                        user_id: currentUserId,
                        username: currentUsername,
                        action: 'added'
                    };
                    
                    const targetType = response.data.target_type || 'channel';
                    const targetId = response.data.target_id;
                    
                    if (targetId) {
                        console.log(`📡 Emitting reaction-added event for ${targetType}:${targetId}`);
                        window.globalSocketManager.emitToRoom('reaction-added', socketData, targetType, targetId);
                    }
                }
            }
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    }

    async removeReaction(messageId, emoji) {
        try {
            const response = await window.ChatAPI.removeReaction(messageId, emoji);
            console.log('🗑️ Remove reaction API response:', response);
            
            if (response.success && response.data) {
                const currentUserId = document.querySelector('meta[name="user-id"]')?.content || window.globalSocketManager?.userId;
                
                // Handle local reaction removal first
                this.handleReactionRemoved({
                    message_id: messageId,
                    emoji: emoji,
                    user_id: currentUserId
                });
                
                // Emit socket event to notify other users
                if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                    const socketData = {
                        message_id: messageId,
                        emoji: emoji,
                        user_id: currentUserId,
                        username: window.globalSocketManager?.username || 'You',
                        action: 'removed'
                    };
                    
                    const targetType = response.data.target_type || 'channel';
                    const targetId = response.data.target_id;
                    
                    if (targetId) {
                        console.log(`📡 Emitting reaction-removed event for ${targetType}:${targetId}`);
                        window.globalSocketManager.emitToRoom('reaction-removed', socketData, targetType, targetId);
                    }
                }
            }
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

        const isBubbleMessage = messageElement.closest('.bubble-message-group');
        let reactionsContainer = isBubbleMessage ? 
            messageElement.querySelector('.bubble-reactions') : 
            messageElement.querySelector('.message-reactions-container');
        
        if (!reactions || reactions.length === 0) {
            if (reactionsContainer) {
                reactionsContainer.remove();
            }
            this.currentReactions[messageId] = [];
            return;
        }

        if (!reactionsContainer) {
            reactionsContainer = document.createElement('div');
            reactionsContainer.className = isBubbleMessage ? 'bubble-reactions' : 'message-reactions-container';
            
            if (isBubbleMessage) {
                messageElement.appendChild(reactionsContainer);
            } else {
                const messageContent = messageElement.querySelector('.message-main-text') || 
                                     messageElement.querySelector('.message-content') ||
                                     messageElement;
                
                if (messageContent.parentElement) {
                    messageContent.parentElement.appendChild(reactionsContainer);
                } else {
                    messageElement.appendChild(reactionsContainer);
                }
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
            reactionPill.className = isBubbleMessage ? 'bubble-reaction' : 'message-reaction-pill';
            reactionPill.dataset.emoji = emoji;
            reactionPill.dataset.messageId = messageId;
            reactionPill.title = `${count} reaction${count > 1 ? 's' : ''}`;

            if (userReactions.has(emoji)) {
                reactionPill.classList.add('user-reacted');
            }

            if (isBubbleMessage) {
                reactionPill.innerHTML = `
                    <span class="bubble-reaction-emoji">${emoji}</span>
                    <span class="bubble-reaction-count">${count}</span>
                `;
            } else {
                reactionPill.innerHTML = `
                    <span class="reaction-emoji">${emoji}</span>
                    <span class="reaction-count">${count}</span>
                `;
            }
            
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
        console.log(`✅ [EMOJI-REACTIONS] Updated reactions display for message ${messageId} (${isBubbleMessage ? 'bubble' : 'regular'} style)`);
    }

    setupSocketListeners() {
        const self = this;
        
        // First, clear any existing listeners to avoid duplicates
        if (window.globalSocketManager?.io) {
            window.globalSocketManager.io.off('reaction-added');
            window.globalSocketManager.io.off('reaction-removed');
            console.log('🧹 Cleared existing reaction socket listeners');
        }
        
        const setupListeners = () => {
            if (window.globalSocketManager?.io) {
                console.log('🔌 Setting up emoji reaction socket listeners...');
                
                window.globalSocketManager.io.on('reaction-added', function(data) {
                    console.log('📥 Received reaction-added:', data);
                    
                    // Only process if the message is in the current view
                    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                    if (messageElement) {
                        console.log('📍 Found message element for reaction, updating UI');
                        self.handleReactionAdded(data);
                    } else {
                        console.log('⚠️ Message element not found for reaction-added');
                    }
                });
                
                window.globalSocketManager.io.on('reaction-removed', function(data) {
                    console.log('📥 Received reaction-removed:', data);
                    
                    // Only process if the message is in the current view
                    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                    if (messageElement) {
                        console.log('📍 Found message element for reaction, updating UI');
                        self.handleReactionRemoved(data);
                    } else {
                        console.log('⚠️ Message element not found for reaction-removed');
                    }
                });
                
                console.log('✅ Emoji reaction socket listeners set up successfully');
            } else {
                console.log('⏳ Socket not ready yet, retrying in 200ms...');
                setTimeout(setupListeners, 200);
            }
        };
        
        setupListeners();
    }

    handleReactionAdded(data) {
        const { message_id, emoji, user_id, username } = data;
        
        console.log('🔔 handleReactionAdded called with:', { message_id, emoji, user_id, username });
        
        if (!this.currentReactions[message_id]) {
            this.currentReactions[message_id] = [];
        }

        const existingIndex = this.currentReactions[message_id].findIndex(r => 
            String(r.user_id) === String(user_id) && r.emoji === emoji);
         
        console.log('🔍 Existing reaction check:', { 
            messageId: message_id, 
            existingReaction: existingIndex !== -1,
            currentReactions: this.currentReactions[message_id].length
        });
            
        if (existingIndex === -1) {
            this.currentReactions[message_id].push({
                emoji,
                user_id: String(user_id),
                username
            });
            
            console.log('👆 Added reaction to memory, updating display for message:', message_id);
            this.updateReactionsDisplay(message_id, this.currentReactions[message_id]);
            
            setTimeout(() => {
                const reactionElement = document.querySelector(`[data-message-id="${message_id}"] .message-reaction-pill[data-emoji="${emoji}"]`);
                if (reactionElement) {
                    console.log('✨ Adding animation to reaction element');
                    reactionElement.classList.add('reaction-pop');
                    setTimeout(() => {
                        reactionElement.classList.remove('reaction-pop');
                    }, 1000);
                } else {
                    console.warn('⚠️ Could not find reaction element for animation');
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
    
    try {
        console.log('🚀 Initializing emoji reactions system...');
        emojiReactions.init();
        console.log('✅ Emoji reactions system initialized successfully');
        
        // Attach to window object for global access
        window.emojiReactions = emojiReactions;
        
        // Check if socket is connected
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            console.log('📡 Socket is already connected, setting up reaction listeners');
            emojiReactions.setupSocketListeners();
        } else {
            console.log('🔌 Socket not ready, will set up listeners when authenticated');
            window.addEventListener('socketAuthenticated', function() {
                console.log('📡 Socket authenticated, setting up reaction listeners');
                emojiReactions.setupSocketListeners();
            });
        }
    } catch (err) {
        console.error('❌ Error initializing emoji reactions:', err);
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiReactions);
} else {
    initEmojiReactions();
}

// Make sure it's attached to window
window.emojiReactions = emojiReactions; 

// Add a deferred init method for when DOM is ready but other components need to initialize it
window.initializeEmojiReactions = initEmojiReactions;

// Debug utilities
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
        initialized: emojiReactions.initialized,
        socketConnected: !!(window.globalSocketManager && window.globalSocketManager.isReady())
    };
};

// Force-load all reactions
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

// Helper to reinitialize if needed
window.reinitializeEmojiSystem = function() {
    try {
        console.log('🔄 Reinitializing emoji reactions system...');
        
        // Reset state
        emojiReactions.initialized = false;
        emojiReactions.currentReactions = {};
        emojiReactions.loadedMessageIds.clear();
        emojiReactions.loadingReactions.clear();
        
        // Reinit
        initEmojiReactions();
        
        // Check for messages and load reactions
        const messages = document.querySelectorAll('.message-content[data-message-id]');
        messages.forEach(msg => {
            const messageId = msg.dataset.messageId;
            if (/^\d+$/.test(String(messageId))) {
                emojiReactions.loadMessageReactions(messageId);
            }
        });
        
        return `Reinitialized emoji system and found ${messages.length} messages`;
    } catch (err) {
        console.error('❌ Error reinitializing emoji system:', err);
        return `Error: ${err.message}`;
    }
};