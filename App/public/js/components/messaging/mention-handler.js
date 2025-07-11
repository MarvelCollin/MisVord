class MentionHandler {
    constructor(chatSection) {
        this.chatSection = chatSection;
        this.mentionRegex = /@(\w+)/g;
        this.allMentionRegex = /@all/g;
        this.roleMentionRegex = /@(admin|members|owner)/g;
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
        this.mentionOverlay = null;
        this.overlayUpdateTimer = null;
        
        this.richTextHandler = window.richTextHandler || null;
        if (!this.richTextHandler && window.RichTextHandler) {
            this.richTextHandler = new window.RichTextHandler();
        }
        
        this.init();
    }
    
    init() {
        this.setupMessageInputListeners();
        this.createAutocompleteContainer();
        this.createMentionOverlay();
        
        if (this.autocompleteContainer) {
            this.autocompleteContainer.classList.add('misvord-hidden');
        }
    }
    
    createMentionOverlay() {
        if (!this.chatSection.messageInput || this.mentionOverlay) return;
        
        const inputContainer = this.chatSection.messageInput.parentElement;
        if (!inputContainer) return;
        
        this.mentionOverlay = document.createElement('div');
        this.mentionOverlay.className = 'mention-overlay';
        
        this.mentionOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            padding: 11px 0;
            margin: 0;
            border: none;
            background: transparent;
            color: #dcddde;
            font-size: 16px;
            line-height: 22px;
            font-family: inherit;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
            overflow-y: auto;
            overflow-x: hidden;
            pointer-events: none;
            z-index: 1;
            min-height: 22px;
            max-height: 50vh;
            scrollbar-width: none;
            -ms-overflow-style: none;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .input-container-wrapper {
                position: relative !important;
            }
            .mention-overlay::-webkit-scrollbar {
                display: none;
            }
            .mention-overlay .mention {
                color: #5865f2 !important;
                background-color: rgba(88, 101, 242, 0.15) !important;
                border-radius: 3px !important;
                padding: 1px 2px !important;
                font-weight: 500 !important;
            }
            .mention-overlay .mention-all {
                color: #faa61a !important;
                background-color: rgba(250, 166, 26, 0.15) !important;
            }
            #message-input {
                position: relative;
                z-index: 2;
                background: transparent !important;
                color: transparent !important;
                caret-color: #dcddde !important;
            }
            #message-input::selection {
                background: rgba(88, 101, 242, 0.3) !important;
            }
            #message-input::-moz-selection {
                background: rgba(88, 101, 242, 0.3) !important;
            }
        `;
        
        if (!document.querySelector('style[data-mention-overlay-styles]')) {
            style.setAttribute('data-mention-overlay-styles', 'true');
            document.head.appendChild(style);
        }
        
        inputContainer.style.position = 'relative';
        inputContainer.classList.add('input-container-wrapper');
        inputContainer.appendChild(this.mentionOverlay);
        
        this.updateOverlayContent();
        this.syncOverlayScroll();
    }
    
    updateOverlayContent() {
        if (!this.mentionOverlay || !this.chatSection.messageInput) return;
        
        if (this.overlayUpdateTimer) {
            clearTimeout(this.overlayUpdateTimer);
        }
        
        this.overlayUpdateTimer = setTimeout(() => {
            const content = this.chatSection.messageInput.value;
            const formattedContent = this.formatMentionsForOverlay(content);
            this.mentionOverlay.innerHTML = formattedContent;
            this.syncOverlayScroll();
        }, 10);
    }
    
    formatMentionsForOverlay(content) {
        if (!content) return '&nbsp;';
        
        content = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        content = content.replace(this.allMentionRegex, '<span class="mention mention-all">@all</span>');
        
        content = content.replace(this.roleMentionRegex, '<span class="mention mention-role">@$1</span>');
        
        content = content.replace(this.mentionRegex, (match, username) => {
            if (['all', 'admin', 'members', 'owner'].includes(username.toLowerCase())) {
                return match;
            }
            const user = this.availableUsers.get(username.toLowerCase());
            if (user) {
                return `<span class="mention mention-user" data-username="${user.username}">@${user.username}</span>`;
            }
            return match;
        });
        
        content = content.replace(/\n/g, '<br>');
        
        if (content.endsWith('<br>')) {
            content += '&nbsp;';
        }
        
        return content || '&nbsp;';
    }
    
    syncOverlayScroll() {
        if (!this.mentionOverlay || !this.chatSection.messageInput) return;
        
        this.mentionOverlay.scrollTop = this.chatSection.messageInput.scrollTop;
        this.mentionOverlay.scrollLeft = this.chatSection.messageInput.scrollLeft;
    }
    
    setupMessageInputListeners() {
        if (!this.chatSection.messageInput) return;
        
        this.chatSection.messageInput.addEventListener('input', (e) => {
            this.handleInputChangeDebounced(e);
            this.updateOverlayContent();
        });
        
        this.chatSection.messageInput.addEventListener('scroll', () => {
            this.syncOverlayScroll();
        });
        
        this.chatSection.messageInput.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        this.chatSection.messageInput.addEventListener('blur', (e) => {
            setTimeout(() => {
                if (!this.autocompleteContainer.matches(':hover')) {
                    this.hideAutocomplete();
                }
            }, 200);
        });
        
        this.chatSection.messageInput.addEventListener('focus', () => {
            this.updateOverlayContent();
        });
        
        window.addEventListener('resize', () => {
            this.syncOverlayScroll();
        });
    }
    
    createAutocompleteContainer() {
        this.autocompleteContainer = document.createElement('div');
        this.autocompleteContainer.className = 'misvord-mention-menu absolute z-50 bg-[#2f3136] border border-[#40444b] rounded-md shadow-lg max-h-60 overflow-y-auto';
        this.autocompleteContainer.style.cssText = `
            bottom: 100%;
            left: 0;
            min-width: 200px;
            max-width: 300px;
            transition: opacity 0.2s ease;
            opacity: 0;
            visibility: hidden;
            scrollbar-width: thin;
            scrollbar-color: #4f545c #2f3136;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .misvord-mention-menu::-webkit-scrollbar {
                width: 8px;
            }
            .misvord-mention-menu::-webkit-scrollbar-track {
                background: #2f3136;
            }
            .misvord-mention-menu::-webkit-scrollbar-thumb {
                background: #4f545c;
                border-radius: 4px;
            }
            .misvord-mention-menu::-webkit-scrollbar-thumb:hover {
                background: #5865f2;
            }
            .misvord-mention-item {
                transition: background-color 0.15s ease;
            }
            .misvord-mention-menu.misvord-hidden {
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }
            .misvord-mention-menu.misvord-visible {
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
            }
        `;
        
        if (!document.querySelector('style[data-misvord-mention-styles]')) {
            style.setAttribute('data-misvord-mention-styles', 'true');
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
            this.updateOverlayContent();
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
            this.updateOverlayContent();
            
        } catch (error) {
            this.usersLoaded = false;
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
                    } else if (result.data.data && Array.isArray(result.data.data)) {
                        members = result.data.data;
                    }
                }
                
                if (members && members.length > 0) {
                    members.forEach(member => {
                        if (member.username && member.user_id) {
                            this.availableUsers.set(member.username.toLowerCase(), {
                                id: member.user_id,
                                username: member.username,
                                display_name: member.display_name || member.username,
                                avatar_url: member.avatar_url || '/public/assets/common/default-profile-picture.png'
                            });
                        }
                    });
                }
            }
        } catch (error) {
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
                if (result.success) {
                    let participantsData = null;
                    
                    if (result.participants && Array.isArray(result.participants)) {
                        participantsData = result.participants;
                    } else if (result.data && Array.isArray(result.data)) {
                        participantsData = result.data;
                    } else if (result.data && result.data.participants && Array.isArray(result.data.participants)) {
                        participantsData = result.data.participants;
                    } else {
                        return;
                    }
                    
                    participantsData.forEach(participant => {
                        this.availableUsers.set(participant.username.toLowerCase(), {
                            id: participant.user_id,
                            username: participant.username,
                            display_name: participant.display_name || participant.username,
                            avatar_url: participant.avatar_url || '/public/assets/common/default-profile-picture.png'
                        });
                    });
                }
            }
        } catch (error) {
        }
    }
    
    handleInputChangeDebounced(e) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            this.handleInputChange(e);
        }, 30);
    }
    
    handleInputChange(e) {
        const input = e.target;
        const value = input.value;
        const cursorPosition = input.selectionStart;
        
        const beforeCursor = value.substring(0, cursorPosition);
        
        const mentionMatch = beforeCursor.match(/@(\w*)$/);
        
        if (mentionMatch) {
            const searchTerm = mentionMatch[1].toLowerCase();
            const mentionStartIndex = beforeCursor.lastIndexOf('@');
            
            this.showAutocomplete(searchTerm, mentionStartIndex);
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
                case 'Tab':
                    e.preventDefault();
                    this.selectCurrentMention();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.hideAutocomplete();
                    break;
                case 'Enter':
                    this.hideAutocomplete();
                    break;
            }
        } else {
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
        
        const needsSpace = beforeCursor.length > 0 && !beforeCursor.endsWith(' ');
        const insertText = needsSpace ? ' @' : '@';
        
        const newValue = beforeCursor + insertText + afterCursor;
        input.value = newValue;
        
        const newCursorPosition = cursorPosition + insertText.length;
        input.setSelectionRange(newCursorPosition, newCursorPosition);
        input.focus();
        
        this.updateOverlayContent();
        
        setTimeout(() => {
            this.showAutocomplete('', cursorPosition + insertText.length - 1);
        }, 50);
    }
    
    async showAutocomplete(searchTerm, mentionStartIndex) {
        if (typeof mentionStartIndex === 'number') {
            this.mentionStartIndex = mentionStartIndex;
        } else {
            this.hideAutocomplete();
            return;
        }
        
        if (!this.chatSection.targetId) {
            this.hideAutocomplete();
            return;
        }
        
        if (!this.usersLoaded && !this.isLoading) {
            this.renderLoadingState();
            await this.loadAvailableUsers();
        }
        
        if (this.isLoading) {
            this.renderLoadingState();
            return;
        }
        
        const matches = this.findMatchingUsers(searchTerm);
        
        if (matches.length === 0) {
            this.hideAutocomplete();
            return;
        }
        
        this.renderAutocomplete(matches);
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
        
        const roles = [
            { id: 'admin', name: 'admin', display: '@admin - Mention all administrators', priority: 0 },
            { id: 'members', name: 'members', display: '@members - Mention all members', priority: 0 },
            { id: 'owner', name: 'owner', display: '@owner - Mention server owner', priority: 0 }
        ];
        
        roles.forEach(role => {
            if (searchTerm === '' || role.name.startsWith(searchTerm)) {
                matches.push({
                    id: role.id,
                    username: role.name,
                    display: role.display,
                    isSpecial: true,
                    priority: role.priority
                });
            }
        });
        
        const userMatches = [];
        
        for (const [username, user] of this.availableUsers) {
            if (username === currentUsername) {
                continue;
            }
            
            let priority = 2;
            if (searchTerm === '' || username.startsWith(searchTerm)) {
                priority = 1;
            } else if (!username.includes(searchTerm)) {
                continue;
            }
            
            userMatches.push({
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                avatar_url: user.avatar_url,
                display: `@${user.display_name || user.username}`,
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
        if (matches.length === 0) {
            this.hideAutocomplete();
            return;
        }
        
        const fragment = document.createDocumentFragment();
        
        matches.forEach((match, index) => {
            const item = document.createElement('div');
            item.className = 'misvord-mention-item flex items-center p-2 cursor-pointer hover:bg-[#36393f] transition-colors';
            item.dataset.index = index;
            item.dataset.mentionType = match.isSpecial ? 'special' : 'user';
            item.dataset.mentionValue = match.isSpecial ? match.username : match.username;
            item.dataset.mentionId = match.id;
            
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
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.selectedIndex = index;
                this.selectCurrentMention();
            });
            
            fragment.appendChild(item);
        });
        
        this.autocompleteContainer.innerHTML = '';
        this.autocompleteContainer.appendChild(fragment);
        
        this.isAutocompleteVisible = true;
        this.autocompleteContainer.classList.remove('misvord-hidden');
        this.autocompleteContainer.classList.add('misvord-visible');
    }
    
    renderLoadingState() {
        this.autocompleteContainer.innerHTML = `
            <div class="misvord-mention-item flex items-center p-2">
                <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-2 animate-pulse">
                    <i class="fas fa-spinner fa-spin text-white text-sm"></i>
                </div>
                <span class="text-gray-400">Loading users...</span>
            </div>
        `;
        
        this.isAutocompleteVisible = true;
        this.autocompleteContainer.classList.remove('misvord-hidden');
        this.autocompleteContainer.classList.add('misvord-visible');
    }
    
    navigateAutocomplete(direction) {
        const items = this.autocompleteContainer.querySelectorAll('.misvord-mention-item');
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
        const items = this.autocompleteContainer.querySelectorAll('.misvord-mention-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('bg-[#36393f]');
            } else {
                item.classList.remove('bg-[#36393f]');
            }
        });
    }
    
    selectCurrentMention() {
        const items = this.autocompleteContainer.querySelectorAll('.misvord-mention-item');
        if (this.selectedIndex < 0 || this.selectedIndex >= items.length) return;
        
        const selectedItem = items[this.selectedIndex];
        const mentionType = selectedItem.dataset.mentionType;
        const mentionValue = selectedItem.dataset.mentionValue;
        const mentionId = selectedItem.dataset.mentionId;
        
        let mentionText;
        if (mentionType === 'special') {
            mentionText = '@' + mentionValue;
        } else {
            mentionText = '@' + mentionValue;
        }
        
        this.hideAutocomplete();
        this.insertMention(mentionText);
    }
    
    insertMention(mentionText) {
        const input = this.chatSection.messageInput;
        if (!input) return;
        
        const value = input.value;
        const cursorPosition = input.selectionStart;
        
        if (typeof this.mentionStartIndex !== 'number' || this.mentionStartIndex < 0) {
            return;
        }
        
        const beforeMention = value.substring(0, this.mentionStartIndex);
        const afterCursor = value.substring(cursorPosition);
        
        const newValue = beforeMention + mentionText + ' ' + afterCursor;
        input.value = newValue;
        
        const newCursorPosition = this.mentionStartIndex + mentionText.length + 1;
        input.setSelectionRange(newCursorPosition, newCursorPosition);
        input.focus();
        
        this.updateOverlayContent();
        
        if (this.chatSection.updateSendButton) {
            this.chatSection.updateSendButton();
        }
    }
    
    hideAutocomplete() {
        if (!this.isAutocompleteVisible) return;
        
        this.isAutocompleteVisible = false;
        this.selectedIndex = -1;
        
        this.autocompleteContainer.classList.remove('misvord-visible');
        this.autocompleteContainer.classList.add('misvord-hidden');
    }
    
    parseMentions(content) {
        if (this.richTextHandler) {
            const baseMentions = this.richTextHandler.parseMentions(content);
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
        
        const mentions = [];
        
        if (this.allMentionRegex.test(content)) {
            mentions.push({
                type: 'all',
                username: 'all',
                user_id: 'all'
            });
        }
        
        let roleMatch;
        this.roleMentionRegex.lastIndex = 0;
        while ((roleMatch = this.roleMentionRegex.exec(content)) !== null) {
            const role = roleMatch[1];
            mentions.push({
                type: 'role',
                username: role,
                user_id: role
            });
        }
          let match;
        this.mentionRegex.lastIndex = 0;
        while ((match = this.mentionRegex.exec(content)) !== null) {
            const username = match[1];
            if (['admin', 'members', 'owner'].includes(username.toLowerCase())) {
                continue;
            }
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
        
        let formattedContent = content;
        
        formattedContent = formattedContent.replace(this.allMentionRegex, '<span class="mention mention-all bubble-mention bubble-mention-all user-profile-trigger text-orange-400 bg-orange-900/30 px-1 rounded font-medium" data-mention-type="all" title="Mention everyone">@all</span>');
        
        formattedContent = formattedContent.replace(this.roleMentionRegex, '<span class="mention mention-role bubble-mention bubble-mention-role text-purple-400 bg-purple-900/30 px-1 rounded font-medium" data-mention-type="role" title="Mention role">@$1</span>');
        
        formattedContent = formattedContent.replace(this.mentionRegex, (match, username) => {
            if (['all', 'admin', 'members', 'owner'].includes(username.toLowerCase())) {
                return match;
            }
            const user = this.availableUsers.get(username.toLowerCase());
            if (user) {
                return `<span class="mention mention-user bubble-mention bubble-mention-user user-profile-trigger text-blue-400 bg-blue-900/30 px-1 rounded font-medium" data-mention-type="user" data-user-id="${user.id}" data-username="${user.username}" title="@${user.username}">@${user.username}</span>`;
            }
            return match;
        });
        
        return formattedContent;
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
        
        if (this.overlayUpdateTimer) {
            clearTimeout(this.overlayUpdateTimer);
        }
        
        if (this.mentionOverlay && this.mentionOverlay.parentNode) {
            this.mentionOverlay.parentNode.removeChild(this.mentionOverlay);
        }
        
        this.hideAutocomplete();
        this.userCache.clear();
        this.availableUsers.clear();
    }
}

export default MentionHandler; 