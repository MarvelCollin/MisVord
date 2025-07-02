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
        
        this.chatSection.messageInput.addEventListener('blur', (e) => {
            setTimeout(() => {
                if (!this.autocompleteContainer.matches(':hover')) {
                    this.hideAutocomplete();
                }
            }, 200);
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
            will-change: transform, opacity;
            transform: translateY(8px) scale(0.95);
            opacity: 0;
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
                transition: background-color 0.15s ease;
                transform: translateX(0);
            }
            .mention-autocomplete-item:hover {
                transform: translateX(2px);
            }
            .mention-autocomplete.hidden {
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                transform: translateY(8px) scale(0.95);
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
            }
            .mention-autocomplete.show {
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                transform: translateY(0) scale(1);
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
            }
            .mention-autocomplete-enter {
                animation: mentionSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            @keyframes mentionSlideIn {
                from {
                    transform: translateY(8px) scale(0.95);
                    opacity: 0;
                }
                to {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
            }
            .mention-input-overlay {
                font-weight: 500;
                text-shadow: 0 0 3px rgba(88, 101, 242, 0.5);
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
        
        console.log('🔍 [MENTION-HANDLER] loadAvailableUsers called:', {
            targetId,
            chatType,
            forceReload,
            isLoading: this.isLoading,
            usersLoaded: this.usersLoaded
        });
        
        if (!targetId) {
            if (chatType === 'channel') {
                const urlParams = new URLSearchParams(window.location.search);
                const channelFromUrl = urlParams.get('channel');
                
                if (channelFromUrl) {
                    targetId = channelFromUrl;
                    this.chatSection.targetId = targetId;
                    console.log('✅ [MENTION-HANDLER] Using channel ID from URL:', targetId);
                } else {
                    console.warn('⚠️ [MENTION-HANDLER] No target ID available');
                    return;
                }
            } else {
                console.warn('⚠️ [MENTION-HANDLER] No target ID for non-channel chat');
                return;
            }
        }
        
        const cacheKey = `${chatType}-${targetId}`;
        
        if (!forceReload && this.userCache.has(cacheKey) && this.lastTargetId === targetId) {
            console.log('✅ [MENTION-HANDLER] Using cached users:', this.userCache.get(cacheKey).size, 'users');
            this.availableUsers = this.userCache.get(cacheKey);
            this.usersLoaded = true;
            return;
        }
        
        if (this.isLoading) {
            console.log('⏳ [MENTION-HANDLER] Already loading, skipping...');
            return;
        }
        
        this.isLoading = true;
        this.usersLoaded = false;
        
        console.log('🔄 [MENTION-HANDLER] Starting to load users...');
        
        try {
            if (chatType === 'channel') {
                await this.loadChannelMembers(targetId);
            } else if (chatType === 'dm' || chatType === 'direct') {
                await this.loadDMParticipants();
            }
            
            this.userCache.set(cacheKey, new Map(this.availableUsers));
            this.lastTargetId = targetId;
            this.usersLoaded = true;
            
            console.log('✅ [MENTION-HANDLER] Successfully loaded users:', this.availableUsers.size);
            
        } catch (error) {
            console.error('❌ [MENTION-HANDLER] Error loading available users for mentions:', error);
            this.usersLoaded = false;
        } finally {
            this.isLoading = false;
        }
    }
    
    async loadChannelMembers(targetId = null) {
        try {
            targetId = targetId || this.chatSection.targetId;
            
            if (!targetId) {
                console.warn('⚠️ [MENTION-HANDLER] No target ID provided for loading channel members');
                return;
            }
            
            console.log(`🔍 [MENTION-HANDLER] Loading channel members for channel ${targetId}`);
            
            const response = await fetch(`/api/channels/${targetId}/members`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`📡 [MENTION-HANDLER] API response status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log('📋 [MENTION-HANDLER] API response data:', result);
                
                let members = null;
                if (result.success && result.data) {
                    if (Array.isArray(result.data)) {
                        members = result.data;
                        console.log(`✅ [MENTION-HANDLER] Found ${members.length} members in response.data (direct array)`);
                    } else if (result.data.data && Array.isArray(result.data.data)) {
                        members = result.data.data;
                        console.log(`✅ [MENTION-HANDLER] Found ${members.length} members in response.data.data (nested array)`);
                    } else {
                        console.warn('⚠️ [MENTION-HANDLER] result.data is not an array and has no nested data array:', typeof result.data, result.data);
                    }
                } else {
                    console.warn('⚠️ [MENTION-HANDLER] Invalid response format:', {
                        success: result.success,
                        hasData: !!result.data,
                        dataType: typeof result.data
                    });
                }
                
                if (members && members.length > 0) {
                    console.log('👥 [MENTION-HANDLER] Processing members:', members);
                    let addedCount = 0;
                    members.forEach(member => {
                        if (member.username && member.user_id) {
                            this.availableUsers.set(member.username.toLowerCase(), {
                                id: member.user_id,
                                username: member.username,
                                display_name: member.display_name || member.username,
                                avatar_url: member.avatar_url || '/public/assets/common/default-profile-picture.png'
                            });
                            addedCount++;
                        } else {
                            console.warn('⚠️ [MENTION-HANDLER] Invalid member data:', member);
                        }
                    });
                    console.log(`✅ [MENTION-HANDLER] Successfully added ${addedCount} users to availableUsers map`);
                    console.log('📊 [MENTION-HANDLER] Total available users:', this.availableUsers.size);
                } else {
                    console.warn('❌ [MENTION-HANDLER] No valid members found in response');
                }
            } else {
                const errorText = await response.text();
                console.error(`❌ [MENTION-HANDLER] API error ${response.status}:`, errorText);
            }
        } catch (error) {
            console.error('❌ [MENTION-HANDLER] Exception loading channel members:', error);
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
                    
                    // Handle different response structures
                    if (result.participants && Array.isArray(result.participants)) {
                        participantsData = result.participants;
                        console.log('✅ [MENTION-HANDLER] Using result.participants array:', participantsData.length, 'participants');
                    } else if (result.data && Array.isArray(result.data)) {
                        participantsData = result.data;
                        console.log('✅ [MENTION-HANDLER] Using result.data array:', participantsData.length, 'participants');
                    } else if (result.data && result.data.participants && Array.isArray(result.data.participants)) {
                        participantsData = result.data.participants;
                        console.log('✅ [MENTION-HANDLER] Using result.data.participants array:', participantsData.length, 'participants');
                    } else {
                        console.warn('⚠️ [MENTION-HANDLER] DM participants data structure not recognized:', result);
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
                    
                    console.log('✅ [MENTION-HANDLER] DM participants loaded:', participantsData.length, 'total users now:', this.availableUsers.size);
                } else {
                    console.warn('⚠️ [MENTION-HANDLER] DM participants request unsuccessful:', result);
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
        }, 50);
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
            
            console.log('🎯 [MENTION] Input change detected:', {
                searchTerm: `"${searchTerm}"`,
                mentionStartIndex: mentionStartIndex,
                beforeCursor: beforeCursor,
                cursorPosition: cursorPosition
            });
            
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
        console.log('🎯 [MENTION-HANDLER] Show autocomplete triggered:', {
            searchTerm: `"${searchTerm}"`,
            mentionStartIndex,
            targetId: this.chatSection.targetId,
            usersLoaded: this.usersLoaded,
            isLoading: this.isLoading,
            availableUsersCount: this.availableUsers.size
        });
        
        if (typeof mentionStartIndex === 'number') {
            this.mentionStartIndex = mentionStartIndex;
        } else {
            console.warn('⚠️ [MENTION-HANDLER] Invalid mentionStartIndex provided:', mentionStartIndex);
            this.hideAutocomplete();
            return;
        }
        
        if (!this.chatSection.targetId) {
            console.warn('⚠️ [MENTION-HANDLER] No target ID, hiding autocomplete');
            this.hideAutocomplete();
            return;
        }
        
        if (!this.usersLoaded && !this.isLoading) {
            console.log('🔄 [MENTION-HANDLER] Users not loaded, loading now...');
            await this.loadAvailableUsers();
        }
        
        if (this.isLoading) {
            console.log('⏳ [MENTION-HANDLER] Still loading, showing loading state');
            this.renderLoadingState();
            return;
        }
        
        const matches = this.findMatchingUsers(searchTerm);
        
        if (matches.length === 0) {
            console.warn('❌ [MENTION-HANDLER] No matches found, hiding autocomplete');
            this.hideAutocomplete();
            return;
        }
        
        console.log('✅ [MENTION-HANDLER] Showing autocomplete with', matches.length, 'matches');
        this.renderAutocomplete(matches);
        this.selectedIndex = 0;
        this.updateAutocompleteSelection();
    }
    
    findMatchingUsers(searchTerm) {
        console.log(`🔍 [MENTION-HANDLER] Finding matching users for search term: "${searchTerm}"`);
        console.log(`📊 [MENTION-HANDLER] Available users count: ${this.availableUsers.size}`);
        
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
            console.log('✅ [MENTION-HANDLER] Added @all option');
        }
        
        const userMatches = [];
        let skippedCount = 0;
        let matchedCount = 0;
        
        for (const [username, user] of this.availableUsers) {
            if (username === currentUsername) {
                skippedCount++;
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
            matchedCount++;
        }
        
        console.log(`👥 [MENTION-HANDLER] User matching results:`, {
            totalAvailable: this.availableUsers.size,
            skippedSelf: skippedCount,
            matched: matchedCount,
            currentUsername: currentUsername
        });
        
        userMatches.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.username.localeCompare(b.username);
        });
        
        matches.push(...userMatches);
        
        console.log(`📋 [MENTION-HANDLER] Final matches:`, matches.length, matches);
        
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
        
        this.isAutocompleteVisible = true;
        this.autocompleteContainer.classList.remove('hidden');
        
        requestAnimationFrame(() => {
            this.autocompleteContainer.classList.add('show', 'mention-autocomplete-enter');
            
            setTimeout(() => {
                this.autocompleteContainer.classList.remove('mention-autocomplete-enter');
            }, 200);
        });
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
        this.autocompleteContainer.classList.remove('hidden');
        
        requestAnimationFrame(() => {
            this.autocompleteContainer.classList.add('show', 'mention-autocomplete-enter');
            
            setTimeout(() => {
                this.autocompleteContainer.classList.remove('mention-autocomplete-enter');
            }, 200);
        });
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
        const mentionType = selectedItem.dataset.mentionType;
        const mentionValue = selectedItem.dataset.mentionValue;
        const mentionId = selectedItem.dataset.mentionId;
        
        let mentionText;
        if (mentionType === 'special') {
            mentionText = '@' + mentionValue;
        } else {
            mentionText = '@' + mentionValue;
        }
        
        console.log('📝 [MENTION] Selecting mention:', {
            type: mentionType,
            value: mentionValue,
            id: mentionId,
            text: mentionText,
            selectedIndex: this.selectedIndex
        });
        
        this.hideAutocomplete();
        this.insertMention(mentionText);
    }
    
    insertMention(mentionText) {
        const input = this.chatSection.messageInput;
        if (!input) return;
        
        const value = input.value;
        const cursorPosition = input.selectionStart;
        
        console.log('📝 [MENTION] Insert mention:', {
            mentionText: mentionText,
            currentValue: value,
            cursorPosition: cursorPosition,
            mentionStartIndex: this.mentionStartIndex
        });
        
        if (typeof this.mentionStartIndex !== 'number' || this.mentionStartIndex < 0) {
            console.error('❌ [MENTION] Invalid mentionStartIndex:', this.mentionStartIndex);
            return;
        }
        
        const beforeMention = value.substring(0, this.mentionStartIndex);
        const afterCursor = value.substring(cursorPosition);
        
        const newValue = beforeMention + mentionText + ' ' + afterCursor;
        input.value = newValue;
        
        const newCursorPosition = this.mentionStartIndex + mentionText.length + 1;
        input.setSelectionRange(newCursorPosition, newCursorPosition);
        input.focus();
        
        console.log('✅ [MENTION] Mention inserted:', {
            newValue: newValue,
            newCursorPosition: newCursorPosition
        });
        
        this.applyInstantMentionStyling(input, this.mentionStartIndex, mentionText.length);
        
        if (this.chatSection.updateSendButton) {
            this.chatSection.updateSendButton();
        }
    }
    
    applyInstantMentionStyling(input, startIndex, length) {
        const inputRect = input.getBoundingClientRect();
        const inputStyle = window.getComputedStyle(input);
        
        // Calculate text position
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `${inputStyle.fontSize} ${inputStyle.fontFamily}`;
        
        const beforeText = input.value.substring(0, startIndex);
        const beforeWidth = ctx.measureText(beforeText).width;
        const mentionWidth = ctx.measureText(input.value.substring(startIndex, startIndex + length)).width;
        
        // Create styling overlay
        const overlay = document.createElement('div');
        overlay.className = 'mention-input-overlay';
        overlay.style.cssText = `
            position: absolute;
            left: ${inputRect.left + beforeWidth + 8}px;
            top: ${inputRect.top + 8}px;
            width: ${mentionWidth}px;
            height: ${inputRect.height - 16}px;
            background: rgba(88, 101, 242, 0.2);
            color: #5865f2;
            border-radius: 3px;
            pointer-events: none;
            z-index: 1000;
            font-family: ${inputStyle.fontFamily};
            font-size: ${inputStyle.fontSize};
            line-height: ${inputRect.height - 16}px;
            text-align: center;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        
        overlay.textContent = input.value.substring(startIndex, startIndex + length);
        document.body.appendChild(overlay);
        
        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
        
        // Remove after animation
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 200);
            }
        }, 1500);
        
        // Apply visual feedback to input
        input.style.transition = 'box-shadow 0.2s ease';
        input.style.boxShadow = '0 0 0 2px rgba(88, 101, 242, 0.3)';
        
        setTimeout(() => {
            input.style.boxShadow = '';
        }, 800);
    }
    
    hideAutocomplete() {
        if (!this.isAutocompleteVisible) return;
        
        this.isAutocompleteVisible = false;
        this.selectedIndex = -1;
        
        this.autocompleteContainer.classList.remove('show', 'mention-autocomplete-enter');
        this.autocompleteContainer.classList.add('hidden');
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
        
        formattedContent = formattedContent.replace(this.allMentionRegex, '<span class="mention mention-all bubble-mention bubble-mention-all user-profile-trigger text-orange-400 bg-orange-900/30 px-1 rounded font-medium" data-mention-type="all" title="Mention everyone">@all</span>');
        
        formattedContent = formattedContent.replace(this.mentionRegex, (match, username) => {
            const user = this.availableUsers.get(username.toLowerCase());
            if (user) {
                return `<span class="mention mention-user bubble-mention bubble-mention-user user-profile-trigger text-blue-400 bg-blue-900/30 px-1 rounded font-medium" data-mention-type="user" data-user-id="${user.id}" data-username="${user.username}" title="@${user.username}">@${user.username}</span>`;
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
                icon: '/public/assets/common/default-profile-picture.png'
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

window.debugMentionAutocomplete = function() {
    console.log('🧪 [DEBUG-MENTION] Testing mention autocomplete system...');
    
    const chatSection = window.chatSection;
    if (!chatSection || !chatSection.mentionHandler) {
        console.error('❌ [DEBUG-MENTION] Chat section or mention handler not available');
        return false;
    }
    
    const messageInput = document.getElementById('message-input');
    if (!messageInput) {
        console.error('❌ [DEBUG-MENTION] Message input not found');
        return false;
    }
    
    const mentionHandler = chatSection.mentionHandler;
    
    console.log('📊 [DEBUG-MENTION] Current state:', {
        targetId: chatSection.targetId,
        chatType: chatSection.chatType,
        usersLoaded: mentionHandler.usersLoaded,
        availableUsers: mentionHandler.availableUsers.size,
        isAutocompleteVisible: mentionHandler.isAutocompleteVisible
    });
    
    console.log('🧪 [DEBUG-MENTION] Testing @ trigger...');
    
    messageInput.value = '@';
    messageInput.focus();
    messageInput.setSelectionRange(1, 1);
    
    const inputEvent = new Event('input', { bubbles: true });
    messageInput.dispatchEvent(inputEvent);
    
    setTimeout(() => {
        console.log('📊 [DEBUG-MENTION] After @ trigger:', {
            inputValue: messageInput.value,
            isVisible: mentionHandler.isAutocompleteVisible,
            mentionStartIndex: mentionHandler.mentionStartIndex,
            containerClasses: Array.from(mentionHandler.autocompleteContainer.classList)
        });
        
        if (mentionHandler.isAutocompleteVisible) {
            console.log('✅ [DEBUG-MENTION] Autocomplete is visible! Test clicking on first item...');
            
            const firstItem = mentionHandler.autocompleteContainer.querySelector('.mention-autocomplete-item');
            if (firstItem) {
                console.log('🧪 [DEBUG-MENTION] Clicking first item...');
                firstItem.click();
                
                setTimeout(() => {
                    console.log('📊 [DEBUG-MENTION] After click:', {
                        inputValue: messageInput.value,
                        isVisible: mentionHandler.isAutocompleteVisible,
                        cursorPosition: messageInput.selectionStart
                    });
                }, 100);
            }
        } else {
            console.error('❌ [DEBUG-MENTION] Autocomplete not visible after @ trigger');
            
            if (mentionHandler.availableUsers.size === 0) {
                console.log('🔄 [DEBUG-MENTION] No users loaded, trying to load...');
                mentionHandler.loadAvailableUsers(true);
            }
        }
    }, 500);
    
    return true;
};

window.testMentionMenuAnimation = function() {
    console.log('🧪 [TEST-ANIMATION] Testing mention menu animation...');
    
    const chatSection = window.chatSection;
    if (!chatSection?.mentionHandler) {
        console.error('❌ No mention handler available');
        return false;
    }
    
    const messageInput = document.getElementById('message-input');
    if (!messageInput) {
        console.error('❌ No message input found');
        return false;
    }
    
    console.log('✅ Starting animation test...');
    
    messageInput.value = '@';
    messageInput.focus();
    messageInput.setSelectionRange(1, 1);
    
    const inputEvent = new Event('input', { bubbles: true });
    messageInput.dispatchEvent(inputEvent);
    
    setTimeout(() => {
        const isVisible = chatSection.mentionHandler.isAutocompleteVisible;
        const hasShowClass = chatSection.mentionHandler.autocompleteContainer.classList.contains('show');
        
        console.log('📊 Animation test results:', {
            isVisible: isVisible,
            hasShowClass: hasShowClass,
            containerClasses: Array.from(chatSection.mentionHandler.autocompleteContainer.classList),
            availableUsers: chatSection.mentionHandler.availableUsers.size
        });
        
        if (isVisible && hasShowClass) {
            console.log('🎉 SUCCESS! Menu is visible with animation');
        } else {
            console.log('❌ FAILED! Menu not properly displayed');
        }
    }, 1000);
    
    return true;
};

export default MentionHandler; 