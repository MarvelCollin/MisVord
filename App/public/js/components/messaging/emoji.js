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
        this.emojiPickerContainer = null;
        

        this.currentTooltip = null;
        this.tooltipTimeout = null;
        
        this.initTooltipStyles();
    }

    initTooltipStyles() {
        if (document.querySelector('style[data-reaction-tooltip-styles]')) {
            return;
        }
        
        const tooltipStyles = `
.reaction-tooltip {
    position: fixed;
    z-index: 10000;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
    min-width: 200px;
    max-width: 320px;
}

.reaction-tooltip-content {
    background: #1e1f22;
    border: 1px solid #41434a;
    border-radius: 8px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.24);
    overflow: hidden;
    pointer-events: auto;
}

.reaction-tooltip-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px 10px;
    border-bottom: 1px solid #41434a;
    background: #2b2d31;
}

.reaction-tooltip-emoji {
    font-size: 22px;
    line-height: 1;
}

.reaction-tooltip-count {
    font-size: 15px;
    font-weight: 600;
    color: #f2f3f5;
}

.reaction-tooltip-users {
    max-height: 220px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #41434a #2b2d31;
}

.reaction-tooltip-users::-webkit-scrollbar {
    width: 8px;
}

.reaction-tooltip-users::-webkit-scrollbar-track {
    background: #2b2d31;
}

.reaction-tooltip-users::-webkit-scrollbar-thumb {
    background: #41434a;
    border-radius: 4px;
}

.reaction-tooltip-user {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    transition: background-color 0.15s ease;
}

.reaction-tooltip-user:hover {
    background-color: #404249;
}

.reaction-tooltip-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.reaction-tooltip-username {
    font-size: 14px;
    font-weight: 500;
    color: #f2f3f5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
}

.reaction-tooltip-more {
    padding: 10px 16px;
    font-size: 12px;
    color: #a3a6aa;
    text-align: center;
    font-style: italic;
    border-top: 1px solid #41434a;
}


.bubble-reaction:hover,
.message-reaction-pill:hover {
    transform: scale(1.05);
    background-color: rgba(88, 101, 242, 0.1) !important;
    border-color: #5865f2 !important;
}

.bubble-reaction.user-reacted,
.message-reaction-pill.user-reacted {
    background-color: rgba(88, 101, 242, 0.15);
    border-color: #5865f2;
}

.bubble-reaction.user-reacted:hover,
.message-reaction-pill.user-reacted:hover {
    background-color: rgba(88, 101, 242, 0.25) !important;
}
`;
        
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-reaction-tooltip-styles', 'true');
        styleElement.textContent = tooltipStyles;
        document.head.appendChild(styleElement);
        

    }

    init() {
        this.setupStyles();
        this.initTooltipStyles();
        this.setupMessageHandling();
        this.setupExistingReactionButtons();
        this.setupSocketListeners();
        this.setupTooltipEventListeners();
        
        const messages = document.querySelectorAll('.bubble-message-content');
        messages.forEach(message => {
            const messageId = message.dataset.messageId;
            if (!messageId) return;
            
            const reactionElements = message.querySelectorAll('.bubble-reaction');
            const reactions = [];
            
            reactionElements.forEach(reaction => {
                const emoji = reaction.dataset.emoji;
                const count = parseInt(reaction.querySelector('.bubble-reaction-count')?.textContent || '0');
                const hasCurrentUser = reaction.classList.contains('user-reacted');
                const title = reaction.title || '';
                const usernames = title.includes(' by ') ? 
                    title.split(' by ')[1].split(', ').map(name => name.trim()) : 
                    [];
                
                for (let i = 0; i < count; i++) {
                    reactions.push({
                        emoji,
                        user_id: hasCurrentUser && i === 0 ? document.querySelector('meta[name="user-id"]')?.content : `user_${i}`,
                        username: usernames[i] || 'Unknown User',
                        display_name: usernames[i] || 'Unknown User',
                        avatar_url: '/public/assets/common/default-profile-picture.png'
                    });
                }
            });
            
            if (reactions.length > 0) {
                this.currentReactions[messageId] = reactions;
            }
            
            this.loadMessageReactions(messageId);
        });
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
            
            .message-reaction-pill.reaction-temporary {
                opacity: 0.7;
                border-style: dashed;
            }
            
            .message-reaction-pill.reaction-confirmed {
                animation: reactionConfirm 0.6s ease;
            }
            
            .message-reaction-pill.reaction-failed {
                animation: reactionFailed 0.8s ease;
                background: rgba(237, 66, 69, 0.2) !important;
                border-color: rgba(237, 66, 69, 0.4) !important;
            }
            
            .bubble-reaction.reaction-temporary {
                opacity: 0.7;
                border-style: dashed;
            }
            
            .bubble-reaction.reaction-confirmed {
                animation: reactionConfirm 0.6s ease;
            }
            
            .bubble-reaction.reaction-failed {
                animation: reactionFailed 0.8s ease;
                background: rgba(237, 66, 69, 0.2) !important;
                border-color: rgba(237, 66, 69, 0.4) !important;
            }
            
            @keyframes reactionConfirm {
                0% { transform: scale(1); }
                50% { 
                    transform: scale(1.15); 
                    background: rgba(67, 181, 129, 0.3);
                    border-color: rgba(67, 181, 129, 0.6);
                }
                100% { transform: scale(1); }
            }
            
            @keyframes reactionFailed {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                20%, 40%, 60%, 80% { transform: translateX(2px); }
            }
            
            .reaction-fade-in {
                animation: reactionFadeIn 0.3s ease forwards;
            }
            
            .reaction-appear {
                opacity: 1;
                transform: scale(1);
            }
            
            .reaction-pop {
                animation: reactionPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
            
            @keyframes reactionFadeIn {
                0% {
                    opacity: 0;
                    transform: scale(0.8) translateY(10px);
                }
                100% {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
            
            @keyframes reactionPop {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
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
            

            messagesToProcess.forEach(messageId => {
                const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                if (messageElement) {
                    this.updateReactionButtonState(messageElement, messageId);
                    

                    const messageGroup = messageElement.closest('.bubble-message-group, .message-group');
                    if (messageGroup && messageGroup.dataset.messageReactions) {
                        try {
                            const reactionsData = JSON.parse(messageGroup.dataset.messageReactions);
                            if (reactionsData && reactionsData.length > 0) {

                                this.updateReactionsDisplay(messageId, reactionsData);
                                this.loadedMessageIds.add(messageId);
                                return;
                            }
                        } catch (e) {
                            console.warn('⚠️ Failed to parse embedded reactions:', e);
                        }
                    }
                    

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


        document.querySelectorAll('.message-content').forEach(message => {
            const messageId = message.dataset.messageId;
            if (messageId && !this.loadedMessageIds.has(messageId)) {
                this.updateReactionButtonState(message, messageId);
                

                const messageGroup = message.closest('.bubble-message-group, .message-group');
                if (messageGroup && messageGroup.dataset.messageReactions) {
                    try {
                        const reactionsData = JSON.parse(messageGroup.dataset.messageReactions);
                        if (reactionsData && reactionsData.length > 0) {

                            this.updateReactionsDisplay(messageId, reactionsData);
                            this.loadedMessageIds.add(messageId);
                            return;
                        }
                    } catch (e) {
                        console.warn('⚠️ Failed to parse embedded reactions:', e);
                    }
                }
                

                if (/^\d+$/.test(String(messageId))) {
                    this.loadMessageReactions(messageId);
                }
            }
        });
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

                    this.showEmojiPicker(messageId, triggerElement);
                }
            }
            
            else if (e.target.closest('.bubble-action-button[data-action="react"]')) {
                e.stopPropagation();
                triggerElement = e.target.closest('.bubble-action-button[data-action="react"]');
                messageId = triggerElement.dataset.messageId;
                if (messageId) {

                    this.showEmojiPicker(messageId, triggerElement);
                }
            }
            
            else if (e.target.classList.contains('bubble-reaction') || e.target.closest('.bubble-reaction')) {
                e.stopPropagation();
                const reactionElement = e.target.classList.contains('bubble-reaction') ? e.target : e.target.closest('.bubble-reaction');
                messageId = reactionElement.dataset.messageId;
                const emoji = reactionElement.dataset.emoji;
                
                if (messageId && emoji) {

                    this.toggleReaction(messageId, emoji);
                }
            }
            
            else if (e.target.classList.contains('message-reaction-pill') || e.target.closest('.message-reaction-pill')) {
                e.stopPropagation();
                const reactionElement = e.target.classList.contains('message-reaction-pill') ? e.target : e.target.closest('.message-reaction-pill');
                messageId = reactionElement.dataset.messageId;
                const emoji = reactionElement.dataset.emoji;
                
                if (messageId && emoji) {

                    this.toggleReaction(messageId, emoji);
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
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content || window.globalSocketManager?.userId;
            

            const hasUserReacted = this.hasUserReacted(messageId, emoji, currentUserId);
            
            console.log('🔄 [EMOJI-REACTIONS] Toggle reaction:', {
                messageId,
                emoji,
                currentUserId,
                hasUserReacted,
                currentReactions: this.currentReactions[messageId]?.length || 0
            });
            
            if (hasUserReacted) {

                await this.removeReaction(messageId, emoji);
            } else {

                await this.addReaction(messageId, emoji);
            }
        } catch (error) {
            console.error('❌ [EMOJI-REACTIONS] Error toggling reaction:', error);
        }
    }

    hasUserReacted(messageId, emoji, userId) {
        if (!this.currentReactions[messageId]) {
            return false;
        }
        
        return this.currentReactions[messageId].some(reaction => 
            reaction.emoji === emoji && String(reaction.user_id) === String(userId)
        );
    }

    getUsersWhoReacted(messageId, emoji) {
        if (!this.currentReactions[messageId]) {
            return [];
        }
        
        return this.currentReactions[messageId]
            .filter(reaction => reaction.emoji === emoji)
            .map(reaction => ({
                user_id: reaction.user_id,
                username: reaction.display_name || reaction.username || 'Unknown User',
                avatar_url: reaction.avatar_url || '/public/assets/common/default-profile-picture.png'
            }));
    }

    createReactionTooltip(messageId, emoji, users) {
        const tooltip = document.createElement('div');
        tooltip.className = 'reaction-tooltip';
        tooltip.dataset.messageId = messageId;
        tooltip.dataset.emoji = emoji;
        
        const tooltipContent = document.createElement('div');
        tooltipContent.className = 'reaction-tooltip-content';
        

        const header = document.createElement('div');
        header.className = 'reaction-tooltip-header';
        header.innerHTML = `
            <span class="reaction-tooltip-emoji">${emoji}</span>
            <span class="reaction-tooltip-count">${users.length}</span>
        `;
        tooltipContent.appendChild(header);
        

        const usersList = document.createElement('div');
        usersList.className = 'reaction-tooltip-users';
        
        users.slice(0, 10).forEach(user => { 
            const userItem = document.createElement('div');
            userItem.className = 'reaction-tooltip-user';
            
            const avatarImg = document.createElement('img');
            avatarImg.className = 'reaction-tooltip-avatar user-avatar';
            avatarImg.alt = user.username;
            
            if (window.fallbackImageHandler) {
                window.fallbackImageHandler.setImageSrc(avatarImg, user.avatar_url, user.username);
            } else {
                avatarImg.src = user.avatar_url || '/public/assets/common/default-profile-picture.png';
                avatarImg.onerror = function() { this.src = '/public/assets/common/default-profile-picture.png'; };
            }
            
            const usernameSpan = document.createElement('span');
            usernameSpan.className = 'reaction-tooltip-username';
            usernameSpan.textContent = user.username;
            
            userItem.appendChild(avatarImg);
            userItem.appendChild(usernameSpan);
            
            usersList.appendChild(userItem);
        });
        
        if (users.length > 10) {
            const moreUsers = document.createElement('div');
            moreUsers.className = 'reaction-tooltip-more';
            moreUsers.textContent = `and ${users.length - 10} more...`;
            usersList.appendChild(moreUsers);
        }
        
        tooltipContent.appendChild(usersList);
        tooltip.appendChild(tooltipContent);
        
        return tooltip;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showReactionTooltip(reactionElement, messageId, emoji) {
        this.hideReactionTooltip();
        
        const users = this.getUsersWhoReacted(messageId, emoji);
        if (users.length === 0) return;
        
        const tooltip = this.createReactionTooltip(messageId, emoji, users);
        document.body.appendChild(tooltip);

        const rect = reactionElement.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 8;

        if (left < 8) left = 8;
        if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
        }

        if (top < 8) {
            top = rect.bottom + 8;
            tooltip.style.transform = 'translateY(-8px)';
        } else {
            tooltip.style.transform = 'translateY(8px)';
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.opacity = '1';
        
        this.currentTooltip = tooltip;

        this.tooltipTimeout = setTimeout(() => {
            if (this.currentTooltip && !this.currentTooltip.matches(':hover')) {
                this.hideReactionTooltip();
            }
        }, 3000);
    }

    hideReactionTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
            this.tooltipTimeout = null;
        }
    }

    async addReaction(messageId, emoji) {
        try {
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content || window.globalSocketManager?.userId;
            const currentUsername = window.globalSocketManager?.username || 'You';
            
            if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
                console.error('❌ [EMOJI-REACTIONS] WebSocket not ready for adding reaction');
                return;
            }
            
            console.log('🎯 [EMOJI-REACTIONS] Adding reaction via 2-path system:', {
                messageId,
                emoji,
                userId: currentUserId,
                username: currentUsername
            });
            
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (!messageElement) {
                console.error('❌ [EMOJI-REACTIONS] Message element not found:', messageId);
                return;
            }
            
            const { targetType, targetId } = this.getCurrentChannelContext();
            

            
            if (!targetId) {
                console.error('❌ [EMOJI-REACTIONS] No target ID found');
                return;
            }
            
            const tempReactionId = `temp-reaction-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            

            this.handleReactionAdded({
                message_id: messageId,
                emoji: emoji,
                user_id: currentUserId,
                username: currentUsername,
                temp_reaction_id: tempReactionId,
                is_temporary: true,
                avatar_url: null
            });
            
            const tempSocketData = {
                message_id: messageId,
                emoji: emoji,
                user_id: currentUserId,
                username: currentUsername,
                avatar_url: window.globalSocketManager?.avatar_url || '/public/assets/common/default-profile-picture.png',
                target_type: targetType,
                target_id: targetId,
                action: 'added',
                temp_reaction_id: tempReactionId,
                is_temporary: true,
                source: 'websocket-temp'
            };
            

            
            if (window.globalSocketManager.emitToRoom) {
                const success = window.globalSocketManager.emitToRoom('reaction-added', tempSocketData, targetType, targetId);
                if (!success) {
                    console.warn('⚠️ [EMOJI-REACTIONS] Room-based emit failed, falling back to direct emit');
                    window.globalSocketManager.io.emit('reaction-added', tempSocketData);
                }
            } else {
                window.globalSocketManager.io.emit('reaction-added', tempSocketData);
            }
            
        } catch (error) {
            console.error('❌ [EMOJI-REACTIONS] Error in 2-path reaction system:', error);
        }
    }

    async removeReaction(messageId, emoji) {
        try {
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content || window.globalSocketManager?.userId;
            const currentUsername = window.globalSocketManager?.username || 'You';
            
            if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
                console.error('❌ [EMOJI-REACTIONS] WebSocket not ready for removing reaction');
                return;
            }
            
            console.log('🎯 [EMOJI-REACTIONS] Removing reaction via 2-path system:', {
                messageId,
                emoji,
                userId: currentUserId,
                username: currentUsername
            });
            
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (!messageElement) {
                console.error('❌ [EMOJI-REACTIONS] Message element not found:', messageId);
                return;
            }
            
            const { targetType, targetId } = this.getCurrentChannelContext();
            

            
            if (!targetId) {
                console.error('❌ [EMOJI-REACTIONS] No target ID found');
                return;
            }
            
            const tempReactionId = `temp-reaction-remove-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            

            this.handleReactionRemoved({
                message_id: messageId,
                emoji: emoji,
                user_id: currentUserId,
                temp_reaction_id: tempReactionId,
                avatar_url: window.globalSocketManager?.avatar_url || '/public/assets/common/default-profile-picture.png'
            });
            
            const tempSocketData = {
                message_id: messageId,
                emoji: emoji,
                user_id: currentUserId,
                username: currentUsername,
                avatar_url: window.globalSocketManager?.avatar_url || '/public/assets/common/default-profile-picture.png',
                target_type: targetType,
                target_id: targetId,
                action: 'removed',
                temp_reaction_id: tempReactionId,
                is_temporary: true,
                source: 'websocket-temp'
            };
            

            
            if (window.globalSocketManager.emitToRoom) {
                const success = window.globalSocketManager.emitToRoom('reaction-removed', tempSocketData, targetType, targetId);
                if (!success) {
                    console.warn('⚠️ [EMOJI-REACTIONS] Room-based emit failed, falling back to direct emit');
                    window.globalSocketManager.io.emit('reaction-removed', tempSocketData);
                }
            } else {
                window.globalSocketManager.io.emit('reaction-removed', tempSocketData);
            }
            
        } catch (error) {
            console.error('❌ [EMOJI-REACTIONS] Error in 2-path reaction removal system:', error);
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
                const existingReactions = messageElement.querySelector('.bubble-reactions');
                if (existingReactions) {
                    existingReactions.remove();
                }
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
        const emojiUsers = {};
        const userReactions = new Set();
        const currentUserId = document.querySelector('meta[name="user-id"]')?.content;

        reactions.forEach(reaction => {
            const emoji = reaction.emoji;
            emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
            

            if (!emojiUsers[emoji]) {
                emojiUsers[emoji] = [];
            }
            emojiUsers[emoji].push({
                user_id: reaction.user_id,
                username: reaction.display_name || reaction.username || 'Unknown User',
                avatar_url: reaction.avatar_url || '/public/assets/common/default-profile-picture.png'
            });
            
            if (String(reaction.user_id) === String(currentUserId)) {
                userReactions.add(emoji);
            }
        });

        Object.entries(emojiCounts).forEach(([emoji, count]) => {
            const reactionPill = document.createElement('div');
            reactionPill.className = isBubbleMessage ? 'bubble-reaction' : 'message-reaction-pill';
            reactionPill.dataset.emoji = emoji;
            reactionPill.dataset.messageId = messageId;
            

            const usersWhoReacted = emojiUsers[emoji] || [];
            const usernames = usersWhoReacted.map(u => u.username).slice(0, 3);
            let title = `${emoji} ${count} reaction${count > 1 ? 's' : ''}`;
            if (usernames.length > 0) {
                if (usernames.length <= 3) {
                    title += ` by ${usernames.join(', ')}`;
                } else {
                    title += ` by ${usernames.join(', ')} and ${usersWhoReacted.length - 3} more`;
                }
            }
            reactionPill.title = title;

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


            let hoverTimeout;
            reactionPill.addEventListener('mouseenter', (e) => {

                hoverTimeout = setTimeout(() => {
                    this.showReactionTooltip(reactionPill, messageId, emoji);
                }, 500);
            });

            reactionPill.addEventListener('mouseleave', (e) => {
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    hoverTimeout = null;
                }

                setTimeout(() => {
                    if (this.currentTooltip && !this.currentTooltip.matches(':hover') && !reactionPill.matches(':hover')) {
                        this.hideReactionTooltip();
                    }
                }, 100);
            });

            reactionsContainer.appendChild(reactionPill);
        });

        this.currentReactions[messageId] = reactions;

    }

    setupSocketListeners() {
        const self = this;
        

        if (window.globalSocketManager?.io) {
            window.globalSocketManager.io.off('reaction-added');
            window.globalSocketManager.io.off('reaction-removed');
            window.globalSocketManager.io.off('reaction-confirmed');
            window.globalSocketManager.io.off('reaction-failed');

        }
        
        const setupListeners = () => {
            if (window.globalSocketManager?.io) {

                
                window.globalSocketManager.io.on('reaction-added', function(data) {

                    
                    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                    if (messageElement) {

                        self.handleReactionAdded(data);
                    } else {

                    }
                });
                
                window.globalSocketManager.io.on('reaction-removed', function(data) {

                    
                    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                    if (messageElement) {

                        self.handleReactionRemoved(data);
                    } else {

                    }
                });
                
                window.globalSocketManager.io.on('reaction-confirmed', function(data) {

                    
                    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                    if (messageElement) {

                        self.handleReactionConfirmed(data);
                    } else {

                    }
                });
                
                window.globalSocketManager.io.on('reaction-failed', function(data) {
                    const currentUserId = document.querySelector('meta[name="user-id"]')?.content || window.globalSocketManager?.userId;
                    
                    if (String(data.user_id) !== String(currentUserId)) {
                        return;
                    }
                    

                    
                    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
                    if (messageElement) {

                        self.handleReactionFailed(data);
                    } else {

                    }
                });
                

            } else {

                setTimeout(setupListeners, 200);
            }
        };
        
        setupListeners();
    }

    handleReactionAdded(data) {
        const { message_id, emoji, user_id, username, temp_reaction_id, is_temporary, avatar_url } = data;
        
        console.log('🔔 handleReactionAdded called with:', { 
            message_id, emoji, user_id, username, temp_reaction_id, is_temporary, avatar_url
        });
        
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

            let finalAvatarUrl = avatar_url;
            if (!finalAvatarUrl) {

                const existingUser = this.currentReactions[message_id].find(r => 
                    String(r.user_id) === String(user_id));
                finalAvatarUrl = existingUser?.avatar_url || '/public/assets/common/default-profile-picture.png';
            }
            
            this.currentReactions[message_id].push({
                emoji,
                user_id: String(user_id),
                username,
                avatar_url: finalAvatarUrl,
                temp_reaction_id,
                is_temporary
            });
            

            this.updateReactionsDisplay(message_id, this.currentReactions[message_id]);
            
            setTimeout(() => {
                const messageElement = document.querySelector(`[data-message-id="${message_id}"]`);
                const isBubbleMessage = messageElement?.closest('.bubble-message-group');
                const reactionSelector = isBubbleMessage ? '.bubble-reaction' : '.message-reaction-pill';
                const reactionElement = messageElement?.querySelector(`${reactionSelector}[data-emoji="${emoji}"]`);
                
                if (reactionElement) {

                    reactionElement.classList.add('reaction-pop');
                    
                    if (is_temporary) {
                        reactionElement.classList.add('reaction-temporary');

                    }
                    
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
        const { message_id, emoji, user_id, temp_reaction_id, avatar_url } = data;
        
        console.log('🗑️ [EMOJI-REACTIONS] Reaction removed:', {
            messageId: message_id,
            emoji,
            userId: user_id,
            tempId: temp_reaction_id,
            avatarUrl: avatar_url
        });
        
        if (!this.currentReactions[message_id]) return;

        this.currentReactions[message_id] = this.currentReactions[message_id].filter(r => 
            !(r.emoji === emoji && String(r.user_id) === String(user_id)));
        
        this.updateReactionsDisplay(message_id, this.currentReactions[message_id]);
        
        if (temp_reaction_id) {

        }
    }

    handleReactionConfirmed(data) {
        const { message_id, emoji, user_id, username, temp_reaction_id, action, avatar_url } = data;
        
        console.log('✅ [EMOJI-REACTIONS] Confirming permanent reaction:', {
            messageId: message_id,
            emoji,
            userId: user_id,
            action,
            tempId: temp_reaction_id,
            avatarUrl: avatar_url
        });
        
        if (!this.currentReactions[message_id]) {
            this.currentReactions[message_id] = [];
        }
        
        if (action === 'added') {
            const existingIndex = this.currentReactions[message_id].findIndex(r => 
                String(r.user_id) === String(user_id) && r.emoji === emoji);
                
            if (existingIndex === -1) {

                let finalAvatarUrl = avatar_url;
                if (!finalAvatarUrl) {

                    const existingUser = this.currentReactions[message_id].find(r => 
                        String(r.user_id) === String(user_id));
                    finalAvatarUrl = existingUser?.avatar_url || '/public/assets/common/default-profile-picture.png';
                }
                
                this.currentReactions[message_id].push({
                    emoji,
                    user_id: String(user_id),
                    username,
                    avatar_url: finalAvatarUrl,
                    is_permanent: true
                });
            } else {

                this.currentReactions[message_id][existingIndex].is_permanent = true;

                if (avatar_url && !this.currentReactions[message_id][existingIndex].avatar_url) {
                    this.currentReactions[message_id][existingIndex].avatar_url = avatar_url;
                }
            }
        } else if (action === 'removed') {
            this.currentReactions[message_id] = this.currentReactions[message_id].filter(r => 
                !(r.emoji === emoji && String(r.user_id) === String(user_id)));
        }
        
        this.updateReactionsDisplay(message_id, this.currentReactions[message_id]);
        
        const messageElement = document.querySelector(`[data-message-id="${message_id}"]`);
        if (messageElement) {
            const reactionElement = messageElement.querySelector(`[data-emoji="${emoji}"]`);
            if (reactionElement && action === 'added') {
                reactionElement.classList.add('reaction-confirmed');
                setTimeout(() => {
                    reactionElement.classList.remove('reaction-confirmed');
                }, 2000);
            }
        }
    }

    handleReactionFailed(data) {
        const { message_id, emoji, user_id, temp_reaction_id, error } = data;
        
        const currentUserId = document.querySelector('meta[name="user-id"]')?.content || window.globalSocketManager?.userId;
        
        if (String(user_id) !== String(currentUserId)) {
            return;
        }
        
        console.error('❌ [EMOJI-REACTIONS] Reaction failed:', {
            messageId: message_id,
            emoji,
            userId: user_id,
            tempId: temp_reaction_id,
            error
        });
        
        const messageElement = document.querySelector(`[data-message-id="${message_id}"]`);
        if (messageElement) {
            const reactionElement = messageElement.querySelector(`[data-emoji="${emoji}"]`);
            if (reactionElement) {
                reactionElement.classList.add('reaction-failed');
                setTimeout(() => {
                    reactionElement.classList.remove('reaction-failed');
                }, 3000);
            }
        }
        
        if (window.toast && typeof window.toast.error === 'function') {
            window.toast.error(`Failed to ${data.action || 'update'} reaction: ${error}`);
        } else {
            console.error('Toast not available for reaction error:', error);
        }
    }

    handleMessageIdUpdated(tempId, permanentId) {
        try {
            console.log('🔄 [EMOJI-REACTIONS] Handling message ID update:', {
                tempId,
                permanentId
            });
            

            if (this.currentReactions[tempId]) {
                this.currentReactions[permanentId] = this.currentReactions[tempId];
                delete this.currentReactions[tempId];

                

                if (this.currentReactions[permanentId] && this.currentReactions[permanentId].length > 0) {
                    if (this.loadedMessageIds.has(tempId)) {
                        this.loadedMessageIds.delete(tempId);
                    }
                    this.loadedMessageIds.add(permanentId);

                }
            } else {

                if (this.loadedMessageIds.has(tempId)) {
                    this.loadedMessageIds.delete(tempId);
                }

            }
            

            this.loadingReactions.delete(tempId);
            

            if (this.debounceTimers.has(tempId)) {
                clearTimeout(this.debounceTimers.get(tempId));
                this.debounceTimers.delete(tempId);
            }
            

            const messageElement = document.querySelector(`[data-message-id="${permanentId}"]`);
            if (messageElement) {
                this.updateReactionButtonState(messageElement, permanentId);
                

                const reactionElements = messageElement.querySelectorAll('[data-message-id]');
                reactionElements.forEach(element => {
                    if (element.dataset.messageId === tempId) {
                        element.dataset.messageId = permanentId;
                    }
                });
                

                if (this.currentReactions[permanentId]) {
                    this.updateReactionsDisplay(permanentId, this.currentReactions[permanentId]);
                } else {


                    this.loadMessageReactions(permanentId);
                }
                

            }
            
        } catch (error) {
            console.error('❌ [EMOJI-REACTIONS] Error handling message ID update:', error);
        }
    }

    updateReactionButtonState(messageElement, messageId) {
        const reactionButton = messageElement.querySelector('.message-action-reaction');
        if (reactionButton) {
            if (!/^\d+$/.test(String(messageId))) {
                reactionButton.style.pointerEvents = 'none';
                reactionButton.style.opacity = '0.4';
                reactionButton.disabled = true;

            } else {
                reactionButton.style.pointerEvents = '';
                reactionButton.style.opacity = '';
                reactionButton.disabled = false;

            }
        }
    }

    setupTooltipEventListeners() {

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.reaction-tooltip') && 
                !e.target.closest('.bubble-reaction') && 
                !e.target.closest('.message-reaction-pill')) {
                this.hideReactionTooltip();
            }
        });


        document.addEventListener('scroll', () => {
            this.hideReactionTooltip();
        }, true);


        window.addEventListener('resize', () => {
            this.hideReactionTooltip();
        });

        let hoverTimeout = null;
        document.addEventListener('mouseover', (e) => {
            const reactionElement = e.target.closest('.bubble-reaction, .message-reaction-pill');
            if (!reactionElement) return;

            const messageId = reactionElement.dataset.messageId;
            const emoji = reactionElement.dataset.emoji;
            if (!messageId || !emoji) return;

            hoverTimeout = setTimeout(() => {
                if (reactionElement.matches(':hover')) {
                    this.showReactionTooltip(reactionElement, messageId, emoji);
                }
            }, 500);
        });

        document.addEventListener('mouseout', (e) => {
            const reactionElement = e.target.closest('.bubble-reaction, .message-reaction-pill');
            if (!reactionElement) return;
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }

            setTimeout(() => {
                if (this.currentTooltip && !this.currentTooltip.matches(':hover') && !reactionElement.matches(':hover')) {
                    this.hideReactionTooltip();
                }
            }, 100);
        });

    }


    processMessageReactions(messageData) {
        if (!messageData || !messageData.id) return;
        
        const messageId = messageData.id;
        const reactions = messageData.reactions || [];
        
        if (reactions.length > 0) {
            console.log('📥 [EMOJI-REACTIONS] Processing reactions from message data:', {
                messageId,
                reactionCount: reactions.length
            });
            

            this.currentReactions[messageId] = reactions.map(reaction => ({
                emoji: reaction.emoji,
                user_id: String(reaction.user_id),
                username: reaction.username,
                avatar_url: reaction.avatar_url || '/public/assets/common/default-profile-picture.png'
            }));
            

            this.updateReactionsDisplay(messageId, this.currentReactions[messageId]);
            

            this.loadedMessageIds.add(messageId);
            

        } else {

        }
    }
    
    updateChannelContext(channelId, chatType = 'channel') {
        console.log('🔄 [EMOJI-REACTIONS] Updating channel context:', {
            channelId,
            chatType,
            currentReactions: Object.keys(this.currentReactions).length
        });
        
        this.currentChannelId = channelId;
        this.currentChatType = chatType;
        
        this.clearReactionCache();
        

    }
    
    clearReactionCache() {
        this.loadedMessageIds.clear();

    }
    
    getCurrentChannelContext() {
        let targetType = 'channel';
        let targetId = null;
        
        if (this.currentChannelId && this.currentChatType) {
            targetType = this.currentChatType;
            targetId = this.currentChannelId;
        } else if (window.chatSection?.targetId && window.chatSection?.chatType) {
            targetType = window.chatSection.chatType;
            targetId = window.chatSection.targetId;
        } else {
            const chatTypeMeta = document.querySelector('meta[name="chat-type"]');
            const chatIdMeta = document.querySelector('meta[name="chat-id"]');
            targetType = chatTypeMeta?.content || 'channel';
            targetId = chatIdMeta?.content;
        }
        
        if (targetType === 'direct') targetType = 'dm';
        
        return { targetType, targetId };
    }

    debugChannelContext() {
        const context = this.getCurrentChannelContext();
        console.log('🧪 [EMOJI-REACTIONS] Debug channel context:', {
            currentChannelId: this.currentChannelId,
            currentChatType: this.currentChatType,
            resolvedContext: context,
            chatSectionContext: {
                targetId: window.chatSection?.targetId,
                chatType: window.chatSection?.chatType
            },
            metaTags: {
                chatId: document.querySelector('meta[name="chat-id"]')?.content,
                chatType: document.querySelector('meta[name="chat-type"]')?.content,
                channelId: document.querySelector('meta[name="channel-id"]')?.content,
                channelType: document.querySelector('meta[name="channel-type"]')?.content
            },
            socketStatus: {
                ready: window.globalSocketManager?.isReady(),
                connected: window.globalSocketManager?.connected,
                authenticated: window.globalSocketManager?.authenticated,
                hasEmitToRoom: typeof window.globalSocketManager?.emitToRoom === 'function'
            }
        });
        return context;
    }
}

const emojiReactions = new EmojiReactions();

function initEmojiReactions() {
    if (emojiReactions.initialized) return;
    
    try {

        emojiReactions.init();

        

        window.emojiReactions = emojiReactions;
        

        if (window.globalSocketManager && window.globalSocketManager.isReady()) {

            emojiReactions.setupSocketListeners();
        } else {

            window.addEventListener('socketAuthenticated', function() {

                emojiReactions.setupSocketListeners();
            });
        }
    } catch (err) {
        console.error('❌ Error initializing emoji reactions:', err);
    }
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiReactions);
} else {
    initEmojiReactions();
}


window.emojiReactions = emojiReactions; 


window.initializeEmojiReactions = initEmojiReactions;


window.debugEmojis = function() {





                
    const messages = document.querySelectorAll('.message-content[data-message-id]');

    
    messages.forEach(msg => {
        const messageId = msg.dataset.messageId;
        const hasReactionsContainer = !!msg.querySelector('.message-reactions-container');
        const reactionsInMemory = emojiReactions.currentReactions[messageId] || [];
        



        
        if (reactionsInMemory.length > 0) {

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


window.forceLoadAllReactions = function() {

    const messages = document.querySelectorAll('.message-content[data-message-id]');
    
    messages.forEach(msg => {
        const messageId = msg.dataset.messageId;

        

        emojiReactions.loadedMessageIds.delete(messageId);
        

        emojiReactions.loadMessageReactions(messageId);
    });
    
    return `Started loading reactions for ${messages.length} messages`;
};


window.debugReactionSystem = function() {

    
    const messages = document.querySelectorAll('[data-message-id]');

    
    messages.forEach(msg => {
        const messageId = msg.dataset.messageId;
        const hasReactions = emojiReactions.currentReactions[messageId];
        const isLoaded = emojiReactions.loadedMessageIds.has(messageId);
        const reactionsInDOM = msg.querySelectorAll('.bubble-reaction, .message-reaction-pill').length;
        
        console.log(`📝 [DEBUG] Message ${messageId}:`, {
            hasReactions: !!hasReactions,
            reactionCount: hasReactions ? hasReactions.length : 0,
            isLoaded: isLoaded,
            reactionsInDOM: reactionsInDOM,
            isTemp: messageId.toString().startsWith('temp-')
        });
        

        if (!hasReactions && !/^temp-/.test(messageId) && /^\d+$/.test(messageId)) {

            emojiReactions.loadedMessageIds.delete(messageId);
            emojiReactions.loadMessageReactions(messageId);
        }
    });
    
    return {
        totalMessages: messages.length,
        loadedReactions: Object.keys(emojiReactions.currentReactions).length,
        markedAsLoaded: emojiReactions.loadedMessageIds.size
    };
};


window.reinitializeEmojiSystem = function() {
    try {

        

        emojiReactions.initialized = false;
        emojiReactions.currentReactions = {};
        emojiReactions.loadedMessageIds.clear();
        emojiReactions.loadingReactions.clear();
        

        initEmojiReactions();
        

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


window.debugReactionsSystem = function() {

    
    if (window.emojiReactions) {

        window.emojiReactions.debugChannelContext();
    } else {

    }
    
    console.log('🧪 [DEBUG] Chat section info:', {
        available: !!window.chatSection,
        targetId: window.chatSection?.targetId,
        chatType: window.chatSection?.chatType,
        socketRoomJoined: window.chatSection?.socketRoomJoined,
        lastJoinedRoom: window.chatSection?.lastJoinedRoom
    });
    
    console.log('🧪 [DEBUG] Socket manager info:', {
        available: !!window.globalSocketManager,
        ready: window.globalSocketManager?.isReady(),
        connected: window.globalSocketManager?.connected,
        authenticated: window.globalSocketManager?.authenticated,
        joinedChannels: Array.from(window.globalSocketManager?.joinedChannels || []),
        joinedRooms: Array.from(window.globalSocketManager?.joinedRooms || [])
    });
    

};

export default EmojiReactions;