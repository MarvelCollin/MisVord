class MentionHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.mentionRegex = /@(\w+)/g;
        this.allMentionRegex = /@all/g;
        this.autocompleteContainer = null;
        this.currentMentions = [];
        this.availableUsers = new Map();
        this.isAutocompleteVisible = false;
        this.selectedIndex = -1;
        this.isLoading = false;
        this.usersLoaded = false;
        this.debounceTimer = null;
        this.lastTargetId = null;
        this.userCache = new Map();
        
        // Initialize rich text handler if available
        this.richTextHandler = window.richTextHandler || null;
        if (!this.richTextHandler && window.RichTextHandler) {
            this.richTextHandler = new window.RichTextHandler();
        }
        
        this.init();
    }
    
    init() {
        this.setupMessageInputListeners();
        this.createAutocompleteContainer();
    }
    
    setupMessageInputListeners() {
        if (!this.chatSection.messageInput) return;
        
        this.chatSection.messageInput.addEventListener('input', (e) => {
            this.handleInputChangeDebounced(e);
        });
        
        this.chatSection.messageInput.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.mention-autocomplete')) {
                this.hideAutocomplete();
            }
        });
    }
    
    createAutocompleteContainer() {
        this.autocompleteContainer = document.createElement('div');
        this.autocompleteContainer.className = 'mention-autocomplete absolute z-50 bg-[#2f3136] border border-[#40444b] rounded-md shadow-lg max-h-60 overflow-y-auto hidden';
        this.autocompleteContainer.style.cssText = `
            bottom: 100%;
            left: 0;
            min-width: 200px;
            max-width: 300px;
            will-change: transform;
            transform: translateZ(0);
            scrollbar-width: thin;
            scrollbar-color: #4f545c #2f3136;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .mention-autocomplete::-webkit-scrollbar {
                width: 8px;
            }
            .mention-autocomplete::-webkit-scrollbar-track {
                background: #2f3136;
            }
            .mention-autocomplete::-webkit-scrollbar-thumb {
                background: #4f545c;
                border-radius: 4px;
            }
            .mention-autocomplete::-webkit-scrollbar-thumb:hover {
                background: #5865f2;
            }
            .mention-autocomplete-item {
                transition: background-color 0.1s ease;
            }
        `;
        
        if (!document.querySelector('style[data-mention-styles]')) {
            style.setAttribute('data-mention-styles', 'true');
            document.head.appendChild(style);
        }
        
        if (this.chatSection.messageForm) {
            this.chatSection.messageForm.style.position = 'relative';
            this.chatSection.messageForm.appendChild(this.autocompleteContainer);
        }
    }
    
    async loadAvailableUsers(forceReload = false) {
        let targetId = this.chatSection.targetId;
        const chatType = this.chatSection.chatType;
        
        if (!targetId) {
            if (chatType === 'channel') {
                const urlParams = new URLSearchParams(window.location.search);
                const channelFromUrl = urlParams.get('channel');
                
                if (channelFromUrl) {
                    targetId = channelFromUrl;
                    this.chatSection.targetId = targetId;
                } else {
                    return;
                }
            } else {
                return;
            }
        }
        
        const cacheKey = `${chatType}-${targetId}`;
        
        if (!forceReload && this.userCache.has(cacheKey) && this.lastTargetId === targetId) {
            this.availableUsers = this.userCache.get(cacheKey);
            this.usersLoaded = true;
            return;
        }
        
        if (this.isLoading) {
            return;
        }
        
        this.isLoading = true;
        this.usersLoaded = false;
        
        try {
            if (chatType === 'channel') {
                await this.loadChannelMembers(targetId);
            } else if (chatType === 'dm' || chatType === 'direct') {
                await this.loadDMParticipants();
            }
            
            this.userCache.set(cacheKey, new Map(this.availableUsers));
            this.lastTargetId = targetId;
            this.usersLoaded = true;
            
        } catch (error) {
            console.error('Error loading available users for mentions:', error);
        } finally {
            this.isLoading = false;
        }
    }
    
    async loadChannelMembers(targetId = null) {
        try {
            targetId = targetId || this.chatSection.targetId;
            
            if (!targetId) {
                return;
            }
            
            const response = await fetch(`/api/channels/${targetId}/members`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                
                let members = null;
                if (result.success && result.data) {
                    if (Array.isArray(result.data)) {
                        members = result.data;
                    }
                }
                
                if (members && members.length > 0) {
                    members.forEach(member => {
                        this.availableUsers.set(member.username.toLowerCase(), {
                            id: member.user_id,
                            username: member.username,
                            avatar_url: member.avatar_url || '/public/assets/common/default-profile-picture.png'
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Exception loading channel members:', error);
        }
    }
    
    async loadDMParticipants() {
        try {
            const response = await fetch(`/api/chat/dm/${this.chatSection.targetId}/participants`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && Array.isArray(result.data)) {
                    result.data.forEach(participant => {
                        this.availableUsers.set(participant.username.toLowerCase(), {
                            id: participant.user_id,
                            username: participant.username,
                            avatar_url: participant.avatar_url || '/public/assets/common/default-profile-picture.png'
                        });
                    });
                } else {
                    console.warn('DM participants data is not an array:', result.data);
                }
            }
        } catch (error) {
            console.error('Error loading DM participants:', error);
        }
    }
    
    handleInputChangeDebounced(e) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            this.handleInputChange(e);
        }, 100);
    }
    
    handleInputChange(e) {
        const input = e.target;
        const value = input.value;
        const cursorPosition = input.selectionStart;
        
        const beforeCursor = value.substring(0, cursorPosition);
        
        const mentionMatch = beforeCursor.match(/@(\w*)$/);
        
        if (mentionMatch) {
            const searchTerm = mentionMatch[1].toLowerCase();
            this.showAutocomplete(searchTerm, mentionMatch.index);
        } else {
            this.hideAutocomplete();
        }
    }
    
    handleKeyDown(e) {
        if (this.isAutocompleteVisible) {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateAutocomplete(1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateAutocomplete(-1);
                    break;
                case 'Enter':
                case 'Tab':
                    e.preventDefault();
                    this.selectCurrentMention();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.hideAutocomplete();
                    break;
            }
        } else {
            // Quick mention with Ctrl/Cmd + @
            if ((e.ctrlKey || e.metaKey) && e.key === '2' && e.shiftKey) {
                e.preventDefault();
                this.insertMentionTrigger();
            }
        }
    }
    
    insertMentionTrigger() {
        const input = this.chatSection.messageInput;
        const cursorPosition = input.selectionStart;
        const value = input.value;
        
        const beforeCursor = value.substring(0, cursorPosition);
        const afterCursor = value.substring(cursorPosition);
        
        // Add @ with a space before if needed
        const needsSpace = beforeCursor.length > 0 && !beforeCursor.endsWith(' ');
        const insertText = needsSpace ? ' @' : '@';
        
        const newValue = beforeCursor + insertText + afterCursor;
        input.value = newValue;
        
        const newCursorPosition = cursorPosition + insertText.length;
        input.setSelectionRange(newCursorPosition, newCursorPosition);
        input.focus();
        
        // Trigger autocomplete
        setTimeout(() => {
            this.showAutocomplete('', cursorPosition + insertText.length - 1);
        }, 50);
    }
    
    async showAutocomplete(searchTerm, mentionStartIndex) {
        this.mentionStartIndex = mentionStartIndex;
        
        if (!this.chatSection.targetId) {
            this.hideAutocomplete();
            return;
        }
        
        if (!this.usersLoaded && !this.isLoading) {
            await this.loadAvailableUsers();
        }
        
        if (this.isLoading) {
            this.renderLoadingState();
            this.isAutocompleteVisible = true;
            return;
        }
        
        const matches = this.findMatchingUsers(searchTerm);
        
        if (matches.length === 0) {
            this.hideAutocomplete();
            return;
        }
        
        this.renderAutocomplete(matches);
        this.isAutocompleteVisible = true;
        this.selectedIndex = 0;
        this.updateAutocompleteSelection();
    }
    
    findMatchingUsers(searchTerm) {
        const matches = [];
        const currentUsername = (window.globalSocketManager?.username || '').toLowerCase();
        
        if (searchTerm === '' || 'all'.startsWith(searchTerm)) {
            matches.push({
                id: 'all',
                username: 'all',
                display: '@all - Mention everyone',
                isSpecial: true,
                priority: 0
            });
        }
        
        const userMatches = [];
        for (const [username, user] of this.availableUsers) {
            if (username === currentUsername) continue;
            
            let priority = 2;
            if (username.startsWith(searchTerm)) {
                priority = 1;
            } else if (!username.includes(searchTerm)) {
                continue;
            }
            
            userMatches.push({
                id: user.id,
                username: user.username,
                avatar_url: user.avatar_url,
                display: `@${user.username}`,
                isSpecial: false,
                priority: priority
            });
        }
        
        userMatches.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.username.localeCompare(b.username);
        });
        
        matches.push(...userMatches);
        
        return matches.slice(0, 10);
    }
    
    renderLoadingState() {
        this.autocompleteContainer.innerHTML = `
            <div class="mention-autocomplete-item flex items-center p-2">
                <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-2 animate-pulse">
                    <i class="fas fa-spinner fa-spin text-white text-sm"></i>
                </div>
                <span class="text-gray-400">Loading users...</span>
            </div>
        `;
        this.autocompleteContainer.classList.remove('hidden');
    }
    
    renderAutocomplete(matches) {
        if (matches.length === 0) {
            this.hideAutocomplete();
            return;
        }
        
        const fragment = document.createDocumentFragment();
        
        matches.forEach((match, index) => {
            const item = document.createElement('div');
            item.className = 'mention-autocomplete-item flex items-center p-2 cursor-pointer hover:bg-[#36393f] transition-colors';
            item.dataset.index = index;
            
            if (match.isSpecial) {
                item.innerHTML = `
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                        <i class="fas fa-users text-white text-sm"></i>
                    </div>
                    <span class="text-blue-400 font-medium">${match.display}</span>
                `;
            } else {
                item.innerHTML = `
                    <img src="${match.avatar_url}" alt="${match.username}" class="w-8 h-8 rounded-full mr-2" loading="lazy">
                    <span class="text-white">${match.display}</span>
                `;
            }
            
            item.addEventListener('click', () => {
                this.selectedIndex = index;
                this.selectCurrentMention();
            });
            
            fragment.appendChild(item);
        });
        
        this.autocompleteContainer.innerHTML = '';
        this.autocompleteContainer.appendChild(fragment);
        this.autocompleteContainer.classList.remove('hidden');
    }
    
    navigateAutocomplete(direction) {
        const items = this.autocompleteContainer.querySelectorAll('.mention-autocomplete-item');
        if (items.length === 0) return;
        
        this.selectedIndex += direction;
        
        if (this.selectedIndex < 0) {
            this.selectedIndex = items.length - 1;
        } else if (this.selectedIndex >= items.length) {
            this.selectedIndex = 0;
        }
        
        this.updateAutocompleteSelection();
    }
    
    updateAutocompleteSelection() {
        const items = this.autocompleteContainer.querySelectorAll('.mention-autocomplete-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('bg-[#36393f]');
            } else {
                item.classList.remove('bg-[#36393f]');
            }
        });
    }
    
    selectCurrentMention() {
        const items = this.autocompleteContainer.querySelectorAll('.mention-autocomplete-item');
        if (this.selectedIndex < 0 || this.selectedIndex >= items.length) return;
        
        const selectedItem = items[this.selectedIndex];
        const mentionText = selectedItem.querySelector('span').textContent;
        
        this.insertMention(mentionText);
        this.hideAutocomplete();
    }
    
    insertMention(mentionText) {
        const input = this.chatSection.messageInput;
        const value = input.value;
        const cursorPosition = input.selectionStart;
        
        const beforeMention = value.substring(0, this.mentionStartIndex);
        const afterCursor = value.substring(cursorPosition);
        
        const newValue = beforeMention + mentionText + ' ' + afterCursor;
        input.value = newValue;
        
        const newCursorPosition = this.mentionStartIndex + mentionText.length + 1;
        input.setSelectionRange(newCursorPosition, newCursorPosition);
        input.focus();
    }
    
    hideAutocomplete() {
        this.autocompleteContainer.classList.add('hidden');
        this.isAutocompleteVisible = false;
        this.selectedIndex = -1;
    }
    
    parseMentions(content) {
        if (this.richTextHandler) {
            const baseMentions = this.richTextHandler.parseMentions(content);
            // Fill in user_id for user mentions
            return baseMentions.map(mention => {
                if (mention.type === 'user') {
                    const user = this.availableUsers.get(mention.username.toLowerCase());
                    return {
                        ...mention,
                        user_id: user ? user.id : null
                    };
                }
                return mention;
            });
        }
        
        // Fallback parsing if rich text handler is not available
        const mentions = [];
        
        if (this.allMentionRegex.test(content)) {
            mentions.push({
                type: 'all',
                username: 'all',
                user_id: 'all'
            });
        }
        
        let match;
        this.mentionRegex.lastIndex = 0;
        while ((match = this.mentionRegex.exec(content)) !== null) {
            const username = match[1];
            const user = this.availableUsers.get(username.toLowerCase());
            
            if (user) {
                mentions.push({
                    type: 'user',
                    username: user.username,
                    user_id: user.id
                });
            }
        }
        
        return mentions;
    }
    
    formatMessageWithMentions(content) {
        if (this.richTextHandler) {
            return this.richTextHandler.formatMentions(content, this.availableUsers);
        }
        
        // Fallback formatting if rich text handler is not available
        let formattedContent = content;
        
        formattedContent = formattedContent.replace(this.allMentionRegex, '<span class="mention mention-all text-orange-400 bg-orange-900/30 px-1 rounded font-medium">@all</span>');
        
        formattedContent = formattedContent.replace(this.mentionRegex, (match, username) => {
            const user = this.availableUsers.get(username.toLowerCase());
            if (user) {
                return `<span class="mention mention-user text-blue-400 bg-blue-900/30 px-1 rounded font-medium" data-user-id="${user.id}">@${user.username}</span>`;
            }
            return match;
        });
        
        return formattedContent;
    }
    
    handleMentionNotification(data) {
        const currentUserId = window.globalSocketManager?.userId;
        if (!currentUserId) return;
        
        const mentions = data.mentions || [];
        const isAllMention = mentions.some(m => m.type === 'all');
        const isUserMention = mentions.some(m => m.type === 'user' && m.user_id === currentUserId);
        
        if (isAllMention || isUserMention) {
            this.showMentionNotification(data, isAllMention);
            this.playMentionSound();
        }
    }
    
    showMentionNotification(data, isAllMention) {
        const mentionType = isAllMention ? '@all' : `@${window.globalSocketManager?.username}`;
        const notificationText = `${data.username} mentioned you with ${mentionType}`;
        
        if (window.showToast) {
            window.showToast(notificationText, 'info', 5000);
        }
        
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('New Mention', {
                body: notificationText,
                icon: '/public/assets/common/main-logo.png'
            });
        }
    }
    
    playMentionSound() {
        try {
            const audio = new Audio('/public/assets/sound/discordo_sound.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Could not play mention sound:', e));
        } catch (error) {
            console.log('Could not play mention sound:', error);
        }
    }
    
    getAllParticipants() {
        const participants = [];
        
        for (const [username, user] of this.availableUsers) {
            participants.push(user);
        }
        
        return participants;
    }
    
    onTargetChanged() {
        const newTargetId = this.chatSection.targetId;
        if (this.lastTargetId !== newTargetId) {
            this.usersLoaded = false;
            this.hideAutocomplete();
            if (newTargetId) {
                this.loadAvailableUsers();
            }
        }
    }
    
    refreshUsers() {
        if (this.chatSection.targetId) {
            this.loadAvailableUsers(true);
        }
    }
    
    destroy() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.hideAutocomplete();
        this.userCache.clear();
        this.availableUsers.clear();
    }
}

// Add global test function for debugging
window.testChannelMembers = async function(channelId) {
    console.log('🧪 [TEST] Testing channel members endpoint:', channelId);
    
    try {
        const response = await fetch(`/api/channels/${channelId}/members`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('🧪 [TEST] Response status:', response.status, response.statusText);
        
        if (response.ok) {
            const result = await response.json();
            console.log('🧪 [TEST] Success response:', result);
            
            if (result.success && result.data && Array.isArray(result.data)) {
                console.log('🧪 [TEST] Found', result.data.length, 'members:');
                result.data.forEach((member, index) => {
                    console.log(`🧪 [TEST] Member ${index + 1}:`, member);
                });
            } else {
                console.error('🧪 [TEST] Data format issue:', {
                    success: result.success,
                    data: result.data,
                    isArray: Array.isArray(result.data)
                });
            }
        } else {
            const errorText = await response.text();
            console.error('🧪 [TEST] Error response:', errorText);
        }
    } catch (error) {
        console.error('🧪 [TEST] Exception:', error);
    }
};

// Add global test function for current mention system
window.testMentionSystem = function() {
    const chatSection = window.chatSection;
    
    if (!chatSection) {
        console.error('🧪 [TEST] No chatSection found');
        return;
    }
    
    console.log('🧪 [TEST] Chat section state:', {
        targetId: chatSection.targetId,
        chatType: chatSection.chatType,
        userId: chatSection.userId,
        username: chatSection.username
    });
    
    const mentionHandler = chatSection.mentionHandler;
    
    if (!mentionHandler) {
        console.error('🧪 [TEST] No mention handler found');
        return;
    }
    
    console.log('🧪 [TEST] Mention handler state:', {
        isLoading: mentionHandler.isLoading,
        usersLoaded: mentionHandler.usersLoaded,
        availableUsersCount: mentionHandler.availableUsers.size,
        lastTargetId: mentionHandler.lastTargetId
    });
    
    console.log('🧪 [TEST] Available users:');
    for (const [username, user] of mentionHandler.availableUsers) {
        console.log(`🧪 [TEST] User: ${username}`, user);
    }
    
    // Force reload users
    console.log('🧪 [TEST] Force reloading users...');
    mentionHandler.loadAvailableUsers(true);
};

window.testMentionParsing = function(content) {
    const chatSection = window.chatSection;
    
    if (!chatSection || !chatSection.mentionHandler) {
        console.error('🧪 [TEST] No chat section or mention handler found');
        return;
    }
    
    console.log('🧪 [TEST] Testing mention parsing for content:', content);
    
    const mentions = chatSection.mentionHandler.parseMentions(content);
    
    console.log('🧪 [TEST] Parsed mentions:', {
        content: content,
        mentionCount: mentions.length,
        mentions: mentions
    });
    
    mentions.forEach((mention, index) => {
        console.log(`🧪 [TEST] Mention ${index + 1}:`, {
            type: mention.type,
            username: mention.username,
            user_id: mention.user_id
        });
    });
    
    return mentions;
};

window.testMentionNotificationFlow = function() {
    console.log('🧪 [TEST] Testing global mention notification setup...');
    
    const globalSocket = window.globalSocketManager;
    
    if (!globalSocket) {
        console.error('🧪 [TEST] No global socket manager found');
        return;
    }
    
    console.log('🧪 [TEST] Global socket manager status:', {
        connected: globalSocket.connected,
        authenticated: globalSocket.authenticated,
        userId: globalSocket.userId,
        username: globalSocket.username,
        hasIo: !!globalSocket.io
    });
    
    if (globalSocket.io) {
        console.log('🧪 [TEST] Simulating mention notification...');
        
        globalSocket.handleGlobalMentionNotification({
            type: 'user',
            mentioned_user_id: globalSocket.userId,
            mentioned_username: globalSocket.username,
            message_id: 'test-123',
            content: 'Test mention message',
            user_id: 'sender-123',
            username: 'TestSender',
            channel_id: '1',
            timestamp: Date.now()
        });
    }
    
    return true;
};

export default MentionHandler; 