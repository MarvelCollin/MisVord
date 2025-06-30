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
        
        this.init();
    }
    
    init() {
        this.setupMessageInputListeners();
        this.createAutocompleteContainer();
        this.loadAvailableUsers();
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
        this.autocompleteContainer.style.bottom = '100%';
        this.autocompleteContainer.style.left = '0';
        this.autocompleteContainer.style.minWidth = '200px';
        
        if (this.chatSection.messageForm) {
            this.chatSection.messageForm.style.position = 'relative';
            this.chatSection.messageForm.appendChild(this.autocompleteContainer);
        }
    }
    
    async loadAvailableUsers(forceReload = false) {
        const targetId = this.chatSection.targetId;
        const chatType = this.chatSection.chatType;
        
        if (!targetId) {
            console.warn('No target ID available for loading users');
            return;
        }
        
        const cacheKey = `${chatType}-${targetId}`;
        
        if (!forceReload && this.userCache.has(cacheKey) && this.lastTargetId === targetId) {
            this.availableUsers = this.userCache.get(cacheKey);
            this.usersLoaded = true;
            console.log(`📝 [MENTION] Using cached users for ${cacheKey}:`, this.availableUsers.size, 'users');
            return;
        }
        
        if (this.isLoading) {
            console.log('📝 [MENTION] Already loading users, skipping...');
            return;
        }
        
        this.isLoading = true;
        this.usersLoaded = false;
        
        try {
            console.log(`📝 [MENTION] Loading users for ${cacheKey}...`);
            
            if (chatType === 'channel') {
                await this.loadChannelMembers();
            } else if (chatType === 'dm' || chatType === 'direct') {
                await this.loadDMParticipants();
            }
            
            this.userCache.set(cacheKey, new Map(this.availableUsers));
            this.lastTargetId = targetId;
            this.usersLoaded = true;
            
            console.log(`✅ [MENTION] Loaded ${this.availableUsers.size} users for ${cacheKey}`);
        } catch (error) {
            console.error('Error loading available users for mentions:', error);
        } finally {
            this.isLoading = false;
        }
    }
    
    async loadChannelMembers() {
        try {
            const response = await fetch(`/api/channels/${this.chatSection.targetId}/members`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    result.data.forEach(member => {
                        this.availableUsers.set(member.username.toLowerCase(), {
                            id: member.user_id,
                            username: member.username,
                            avatar_url: member.avatar_url || '/public/assets/common/default-profile-picture.png'
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Error loading channel members:', error);
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
                if (result.success && result.data) {
                    result.data.forEach(participant => {
                        this.availableUsers.set(participant.username.toLowerCase(), {
                            id: participant.user_id,
                            username: participant.username,
                            avatar_url: participant.avatar_url || '/public/assets/common/default-profile-picture.png'
                        });
                    });
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
        }
    }
    
    async showAutocomplete(searchTerm, mentionStartIndex) {
        this.mentionStartIndex = mentionStartIndex;
        
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
    
    renderAutocomplete(matches) {
        this.autocompleteContainer.innerHTML = '';
        
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
                    <img src="${match.avatar_url}" alt="${match.username}" class="w-8 h-8 rounded-full mr-2">
                    <span class="text-white">${match.display}</span>
                `;
            }
            
            item.addEventListener('click', () => {
                this.selectedIndex = index;
                this.selectCurrentMention();
            });
            
            this.autocompleteContainer.appendChild(item);
        });
        
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
        let formattedContent = content;
        
        formattedContent = formattedContent.replace(this.allMentionRegex, '<span class="mention mention-all text-blue-400 bg-blue-900/30 px-1 rounded">@all</span>');
        
        formattedContent = formattedContent.replace(this.mentionRegex, (match, username) => {
            const user = this.availableUsers.get(username.toLowerCase());
            if (user) {
                return `<span class="mention mention-user text-blue-400 bg-blue-900/30 px-1 rounded" data-user-id="${user.id}">@${user.username}</span>`;
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
}

export default MentionHandler; 