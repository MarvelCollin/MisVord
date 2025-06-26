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
        this.debounceTimers = new Map();
        this.loadedMessageIds = new Set();
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
                            if (messageId && !this.currentReactions[messageId] && !message.querySelector('.message-reactions-container')) {
                                // Only load reactions if we don't have them cached and no reactions container exists
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

        // Load reactions for existing messages only if they don't have reactions already
        document.querySelectorAll('.message-content').forEach(message => {
            const messageId = message.dataset.messageId;
            if (messageId && !this.currentReactions[messageId] && !message.querySelector('.message-reactions-container')) {
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
        console.log(`🔍 Attempting to load reactions for message ID: ${messageId}`);
        
        // Only load reactions once per message ID
        if (this.loadedMessageIds.has(messageId)) {
            console.log(`⏭️ Skipping reactions load - already loaded for message ID: ${messageId}`);
            
            // Remove any leftover skeletons
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                const skeleton = messageElement.querySelector('.reaction-skeleton');
                if (skeleton) {
                    skeleton.remove();
                }
            }
            
            return;
        }
        
        // Prevent duplicate API calls for the same message
        if (this.loadingReactions.has(messageId)) {
            console.log(`⏯️ Skipping reactions load - already in progress for message ID: ${messageId}`);
            return;
        }

        // Clear any existing debounce timer
        if (this.debounceTimers.has(messageId)) {
            console.log(`⏱️ Clearing existing debounce timer for message ID: ${messageId}`);
            clearTimeout(this.debounceTimers.get(messageId));
        }

        // Ensure the message has a skeleton reaction placeholder while loading
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement && !messageElement.querySelector('.message-reactions-container')) {
            const reactionSkeleton = document.createElement('div');
            reactionSkeleton.className = 'message-reactions-container reaction-skeleton';
            reactionSkeleton.innerHTML = '<div class="reaction-loading-pulse"></div>';
            
            const messageContent = messageElement.querySelector('.message-main-text') || messageElement;
            if (messageContent.parentElement) {
                messageContent.parentElement.appendChild(reactionSkeleton);
            } else {
                messageElement.appendChild(reactionSkeleton);
            }
        }

        console.log(`⏰ Setting debounce timer for message ID: ${messageId}`);
        // Use a shorter debounce for better UX
        const timer = setTimeout(async () => {
            console.log(`🚀 Executing reactions load for message ID: ${messageId}`);
            this.loadingReactions.add(messageId);
            
            try {
                console.log(`📨 Calling ChatAPI.getMessageReactions for message ID: ${messageId}`);
                const reactions = await window.ChatAPI.getMessageReactions(messageId);
                console.log(`📦 Received reactions for message ID: ${messageId}`, reactions);
                this.updateReactionsDisplay(messageId, reactions || []);
                this.loadedMessageIds.add(messageId);
            } catch (error) {
                console.error(`❌ Error loading reactions for message ID: ${messageId}`, error);
                
                // Remove skeleton on error
                if (messageElement) {
                    const skeleton = messageElement.querySelector('.reaction-skeleton');
                    if (skeleton) {
                        skeleton.remove();
                    }
                }
            } finally {
                this.loadingReactions.delete(messageId);
                this.debounceTimers.delete(messageId);
                console.log(`✅ Completed reactions loading process for message ID: ${messageId}`);
            }
        }, 50); // Faster debounce for better UX

        this.debounceTimers.set(messageId, timer);
    }

    updateReactionsDisplay(messageId, reactions) {
        console.log(`🎭 updateReactionsDisplay called for message ID ${messageId} with reactions:`, reactions);
        
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.error(`❌ Message element not found for ID: ${messageId}`);
            return;
        }
        console.log(`✅ Found message element for ID ${messageId}:`, messageElement);

        // Check if reactions actually changed to avoid unnecessary DOM operations
        const existingReactions = this.currentReactions[messageId] || [];
        const reactionsChanged = JSON.stringify(existingReactions) !== JSON.stringify(reactions);
        
        if (!reactionsChanged) {
            console.log(`⏭️ No reaction changes detected for message ID ${messageId} - skipping update`);
            
            // If there's a skeleton, replace it with empty container (for no reactions case)
            const skeleton = messageElement.querySelector('.reaction-skeleton');
            if (skeleton) {
                skeleton.remove();
            }
            
            return; // No need to update if reactions haven't changed
        }
        console.log(`🔄 Detected reaction changes for message ID ${messageId} - updating display`);

        // Find any container including skeletons
        let reactionsContainer = messageElement.querySelector('.message-reactions-container');
        let wasSkeleton = false;
        
        if (reactionsContainer && reactionsContainer.classList.contains('reaction-skeleton')) {
            wasSkeleton = true;
        }
        
        if (!reactions || reactions.length === 0) {
            console.log(`🗑️ No reactions for message ID ${messageId} - removing container`);
            if (reactionsContainer) {
                reactionsContainer.remove();
                console.log(`✅ Removed reactions container for message ID ${messageId}`);
            }
            this.currentReactions[messageId] = [];
            return;
        }

        // If it was a skeleton or doesn't exist, create a proper container
        if (wasSkeleton || !reactionsContainer) {
            if (wasSkeleton) {
                // Remove the skeleton
                reactionsContainer.remove();
            }
            
            console.log(`🆕 Creating new reactions container for message ID ${messageId}`);
            reactionsContainer = document.createElement('div');
            reactionsContainer.className = 'message-reactions-container';
            
            const messageContent = messageElement.querySelector('.message-main-text') || 
                                 messageElement.querySelector('.message-content') ||
                                 messageElement;
            
            console.log(`🔍 Found message content element for appending reactions:`, messageContent);
            
            if (messageContent.parentElement) {
                console.log(`➕ Appending reactions container to parent element for message ID ${messageId}`);
                messageContent.parentElement.appendChild(reactionsContainer);
            } else {
                console.log(`➕ Appending reactions container directly to message element for ID ${messageId}`);
                messageElement.appendChild(reactionsContainer);
            }
        } else {
            console.log(`🔄 Using existing reactions container for message ID ${messageId}`);
        }

        reactionsContainer.innerHTML = '';
        console.log(`🧹 Cleared reactions container for message ID ${messageId}`);

        const emojiCounts = {};
        const userReactions = new Set();
        const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
        console.log(`👤 Current user ID: ${currentUserId}`);

        reactions.forEach(reaction => {
            const emoji = reaction.emoji;
            emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
            
            if (String(reaction.user_id) === String(currentUserId)) {
                userReactions.add(emoji);
                console.log(`🔍 Detected user's reaction: ${emoji} for message ID ${messageId}`);
            }
        });

        console.log(`📊 Emoji counts for message ID ${messageId}:`, emojiCounts);
        console.log(`👤 User reactions for message ID ${messageId}:`, Array.from(userReactions));

        Object.entries(emojiCounts).forEach(([emoji, count]) => {
            console.log(`🔧 Creating reaction pill for emoji: ${emoji} with count: ${count}`);
            const reactionPill = document.createElement('div');
            reactionPill.className = 'message-reaction-pill';
            reactionPill.dataset.emoji = emoji;
            reactionPill.dataset.messageId = messageId;
            reactionPill.title = `${count} reaction${count > 1 ? 's' : ''}`;

            if (userReactions.has(emoji)) {
                reactionPill.classList.add('user-reacted');
                console.log(`👤 Marked reaction pill as user-reacted for emoji: ${emoji}`);
            }

            reactionPill.innerHTML = `
                <span class="reaction-emoji">${emoji}</span>
                <span class="reaction-count">${count}</span>
            `;
            
            // Add animation class
            reactionPill.classList.add('reaction-fade-in');
            setTimeout(() => {
                reactionPill.classList.add('reaction-appear');
            }, 10);

            reactionPill.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleReaction(messageId, emoji);
            });

            reactionsContainer.appendChild(reactionPill);
            console.log(`✅ Added reaction pill for emoji: ${emoji} to container`);
        });

        this.currentReactions[messageId] = reactions;
        console.log(`✅ Updated currentReactions for message ID ${messageId}`);
        
        // Add visibility check
        console.log(`🔍 Final reaction container styles:`, {
            display: window.getComputedStyle(reactionsContainer).display,
            visibility: window.getComputedStyle(reactionsContainer).visibility,
            opacity: window.getComputedStyle(reactionsContainer).opacity,
            height: window.getComputedStyle(reactionsContainer).height,
            width: window.getComputedStyle(reactionsContainer).width,
            childCount: reactionsContainer.childElementCount
        });
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
            
            // Add a popup animation for the newly added reaction
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

// Add a debug function for the console
window.debugEmojis = function() {
    console.log('🔬 EmojiReactions Debug Info:');
    console.log('✅ Initialized:', emojiReactions.initialized);
    console.log('📊 Current reactions by message ID:', emojiReactions.currentReactions);
    console.log('🧠 Loaded message IDs:', Array.from(emojiReactions.loadedMessageIds));
    console.log('⏳ Loading reactions for:', Array.from(emojiReactions.loadingReactions));
    
    // Check for messages on the page
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