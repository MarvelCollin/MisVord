/**
 * Lazy Loading Utility for MiscVord App Components
 * Manages skeleton loading states and content transitions
 */

const LazyLoader = {
    /**
     * Initialize lazy loading for all components
     */
    init() {
        // Set up mutation observer to handle dynamically added elements
        this.setupObserver();
        
        // Initialize loading states for all lazyload elements
        document.querySelectorAll('[data-lazyload]').forEach(element => {
            this.showLoadingState(element);
        });
        
        // Add global loading indicator
        this.addGlobalLoadingIndicator();
        
        // Listen for data load events
        this.listenForDataEvents();
        
        console.log('🔄 Lazy Loader initialized');
    },
    
    /**
     * Set up mutation observer to catch dynamically added elements
     */
    setupObserver() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const lazyElements = node.querySelectorAll ? 
                                node.querySelectorAll('[data-lazyload]') : [];
                            
                            lazyElements.forEach(element => {
                                this.showLoadingState(element);
                            });
                            
                            if (node.hasAttribute && node.hasAttribute('data-lazyload')) {
                                this.showLoadingState(node);
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },
    
    /**
     * Show loading state for a specific element based on its type
     * @param {HTMLElement} element - The element to show loading state for
     */
    showLoadingState(element) {
        if (element.classList.contains('lazy-loaded')) return;
        
        const type = element.getAttribute('data-lazyload');
        let skeleton;
        
        switch (type) {
            case 'server-list':
                skeleton = this.createServerListSkeleton();
                break;
            case 'channel-list':
                skeleton = this.createChannelListSkeleton();
                break;
            case 'chat':
                skeleton = this.createChatSkeleton();
                break;
            case 'participant-list':
                skeleton = this.createParticipantListSkeleton();
                break;
            case 'friend-list':
                skeleton = this.createFriendListSkeleton();
                break;
            case 'active-now':
                skeleton = this.createActiveNowSkeleton();
                break;
            default:
                skeleton = this.createDefaultSkeleton();
        }
        
        element.setAttribute('aria-busy', 'true');
        element.classList.add('content-loading');
        
        // Save original content
        const originalContent = document.createElement('div');
        originalContent.classList.add('original-content', 'hidden');
        while (element.firstChild) {
            originalContent.appendChild(element.firstChild);
        }
        
        element.appendChild(skeleton);
        element.appendChild(originalContent);
    },
    
    /**
     * Show content once data is loaded
     * @param {HTMLElement} element - The element to show content for
     * @param {boolean} isEmpty - Whether the data is empty
     */
    showContent(element, isEmpty = false) {
        if (!element || element.classList.contains('lazy-loaded')) return;
        
        // Special handling for channel list to prevent disappearing content
        const isChannelList = element.getAttribute('data-lazyload') === 'channel-list' || 
                              element.classList.contains('channel-list-container');
                              
        if (isChannelList) {
            console.log('LazyLoader: Special handling for channel list');
            // For channel list, just mark as loaded but don't manipulate DOM
            element.classList.add('lazy-loaded');
            element.setAttribute('aria-busy', 'false');
            element.classList.add('channels-loaded');
            
            // Ensure channel items stay visible
            setTimeout(() => {
                const channelItems = document.querySelectorAll('.channel-item');
                channelItems.forEach(item => {
                    item.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;';
                });
            }, 50);
            
            // Dispatch event to notify that content is loaded
            element.dispatchEvent(new CustomEvent('content-loaded'));
            return;
        }
        
        // Regular handling for other elements
        const originalContent = element.querySelector('.original-content');
        const skeletonEl = element.querySelector('.skeleton-loader');
        
        if (skeletonEl) {
            // Add fade-out animation
            skeletonEl.classList.add('fade-out');
            
            setTimeout(() => {
                skeletonEl.remove();
                
                // If we have original content, restore it
                if (originalContent && originalContent.childNodes.length > 0) {
                    while (originalContent.firstChild) {
                        element.appendChild(originalContent.firstChild);
                    }
                    originalContent.remove();
                }
                
                element.setAttribute('aria-busy', 'false');
                element.classList.remove('content-loading');
                element.classList.add('lazy-loaded');
                
                // Dispatch event to notify that content is loaded
                element.dispatchEvent(new CustomEvent('content-loaded'));
            }, 300);
        }
    },
    
    /**
     * Create a server list skeleton loading state
     * @returns {HTMLElement}
     */
    createServerListSkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-loader server-list-skeleton flex flex-col items-center space-y-3 py-3';
        
        for (let i = 0; i < 6; i++) {
            const server = document.createElement('div');
            server.className = 'w-12 h-12 rounded-full bg-discord-darker animate-pulse';
            skeleton.appendChild(server);
        }
        
        return skeleton;
    },
    
    /**
     * Create a channel list skeleton loading state
     * @returns {HTMLElement}
     */
    createChannelListSkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-loader channel-list-skeleton flex flex-col space-y-4 px-2 py-3';
        
        // Server header section
        const serverHeader = document.createElement('div');
        serverHeader.className = 'flex items-center px-2 py-2';
        
        const serverIcon = document.createElement('div');
        serverIcon.className = 'w-5 h-5 rounded-sm bg-gray-600 animate-pulse mr-2';
        
        const serverName = document.createElement('div');
        serverName.className = 'h-4 w-32 bg-gray-600 rounded animate-pulse';
        
        serverHeader.appendChild(serverIcon);
        serverHeader.appendChild(serverName);
        skeleton.appendChild(serverHeader);
        
        // Category header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'flex items-center justify-between mt-4 px-2 py-1';
        
        const categoryLeftSection = document.createElement('div');
        categoryLeftSection.className = 'flex items-center';
        
        const categoryIcon = document.createElement('div');
        categoryIcon.className = 'w-3 h-3 bg-gray-600 rounded-sm animate-pulse mr-2';
        
        const categoryText = document.createElement('div');
        categoryText.className = 'h-3 w-24 bg-gray-600 rounded animate-pulse';
        
        categoryLeftSection.appendChild(categoryIcon);
        categoryLeftSection.appendChild(categoryText);
        
        const categoryAction = document.createElement('div');
        categoryAction.className = 'w-4 h-4 bg-gray-600 rounded animate-pulse';
        
        categoryHeader.appendChild(categoryLeftSection);
        categoryHeader.appendChild(categoryAction);
        skeleton.appendChild(categoryHeader);
        
        // Text Channels
        for (let i = 0; i < 4; i++) {
            const channel = document.createElement('div');
            channel.className = 'flex items-center px-2 py-1.5 ml-2';
            
            const channelIcon = document.createElement('div');
            channelIcon.className = 'w-4 h-4 bg-gray-600 rounded-sm animate-pulse mr-2';
            
            const channelText = document.createElement('div');
            channelText.className = 'h-4 flex-grow bg-gray-600 rounded animate-pulse';
            channelText.style.width = (Math.floor(Math.random() * 20) + 60) + '%';
            
            channel.appendChild(channelIcon);
            channel.appendChild(channelText);
            skeleton.appendChild(channel);
        }
        
        // Voice category header
        const voiceCategoryHeader = document.createElement('div');
        voiceCategoryHeader.className = 'flex items-center justify-between mt-4 px-2 py-1';
        
        const voiceCategoryLeftSection = document.createElement('div');
        voiceCategoryLeftSection.className = 'flex items-center';
        
        const voiceCategoryIcon = document.createElement('div');
        voiceCategoryIcon.className = 'w-3 h-3 bg-gray-600 rounded-sm animate-pulse mr-2';
        
        const voiceCategoryText = document.createElement('div');
        voiceCategoryText.className = 'h-3 w-28 bg-gray-600 rounded animate-pulse';
        
        voiceCategoryLeftSection.appendChild(voiceCategoryIcon);
        voiceCategoryLeftSection.appendChild(voiceCategoryText);
        
        voiceCategoryHeader.appendChild(voiceCategoryLeftSection);
        skeleton.appendChild(voiceCategoryHeader);
        
        // Voice Channels
        for (let i = 0; i < 2; i++) {
            const voiceChannel = document.createElement('div');
            voiceChannel.className = 'flex items-center px-2 py-1.5 ml-2';
            
            const voiceChannelIcon = document.createElement('div');
            voiceChannelIcon.className = 'w-4 h-4 bg-gray-600 rounded-sm animate-pulse mr-2';
            
            const voiceChannelText = document.createElement('div');
            voiceChannelText.className = 'h-4 bg-gray-600 rounded animate-pulse';
            voiceChannelText.style.width = (Math.floor(Math.random() * 20) + 40) + '%';
            
            voiceChannel.appendChild(voiceChannelIcon);
            voiceChannel.appendChild(voiceChannelText);
            skeleton.appendChild(voiceChannel);
        }
        
        return skeleton;
    },
    
    /**
     * Create a chat skeleton loading state
     * @returns {HTMLElement}
     */
    createChatSkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-loader chat-skeleton flex flex-col h-full p-4 space-y-4';
        
        // Messages
        for (let i = 0; i < 5; i++) {
            const message = document.createElement('div');
            message.className = 'flex ' + (i % 2 === 0 ? 'items-start' : 'items-start pl-12');
            
            if (i % 2 === 0) {
                const avatar = document.createElement('div');
                avatar.className = 'w-10 h-10 rounded-full bg-gray-600 animate-pulse mr-3 flex-shrink-0';
                message.appendChild(avatar);
            }
            
            const content = document.createElement('div');
            content.className = 'flex-1';
            
            if (i % 2 === 0) {
                const header = document.createElement('div');
                header.className = 'flex items-center mb-1';
                
                const name = document.createElement('div');
                name.className = 'h-4 w-24 bg-gray-600 rounded animate-pulse mr-2';
                
                const time = document.createElement('div');
                time.className = 'h-3 w-12 bg-gray-700 rounded animate-pulse';
                
                header.appendChild(name);
                header.appendChild(time);
                content.appendChild(header);
            }
            
            const text1 = document.createElement('div');
            text1.className = 'h-4 bg-gray-700 rounded animate-pulse mb-1 w-' + (Math.floor(Math.random() * 30) + 70) + '%';
            
            const text2 = Math.random() > 0.5 ? document.createElement('div') : null;
            if (text2) {
                text2.className = 'h-4 bg-gray-700 rounded animate-pulse w-' + (Math.floor(Math.random() * 50) + 20) + '%';
            }
            
            content.appendChild(text1);
            if (text2) content.appendChild(text2);
            
            message.appendChild(content);
            skeleton.appendChild(message);
        }
        
        return skeleton;
    },
    
    /**
     * Create a participant list skeleton loading state
     * @returns {HTMLElement}
     */
    createParticipantListSkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-loader participant-list-skeleton p-2 space-y-4';
        
        // Role header
        const roleHeader = document.createElement('div');
        roleHeader.className = 'px-2 py-1';
        
        const roleText = document.createElement('div');
        roleText.className = 'h-4 w-24 bg-gray-600 rounded animate-pulse';
        
        roleHeader.appendChild(roleText);
        skeleton.appendChild(roleHeader);
        
        // Participants
        for (let i = 0; i < 8; i++) {
            const participant = document.createElement('div');
            participant.className = 'flex items-center px-2 py-1';
            
            const avatar = document.createElement('div');
            avatar.className = 'relative mr-2';
            
            const avatarImg = document.createElement('div');
            avatarImg.className = 'w-8 h-8 rounded-full bg-gray-600 animate-pulse';
            
            const statusDot = document.createElement('div');
            statusDot.className = 'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark bg-gray-600 animate-pulse';
            
            avatar.appendChild(avatarImg);
            avatar.appendChild(statusDot);
            
            const name = document.createElement('div');
            name.className = 'h-4 w-24 bg-gray-600 rounded animate-pulse';
            
            participant.appendChild(avatar);
            participant.appendChild(name);
            skeleton.appendChild(participant);
        }
        
        return skeleton;
    },
    
    /**
     * Create a friend list skeleton loading state
     * @returns {HTMLElement}
     */
    createFriendListSkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-loader friend-list-skeleton space-y-2 p-4';
        
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between mb-4';
        
        const title = document.createElement('div');
        title.className = 'h-4 w-24 bg-gray-600 rounded animate-pulse';
        
        const search = document.createElement('div');
        search.className = 'h-8 w-60 bg-gray-600 rounded animate-pulse';
        
        header.appendChild(title);
        header.appendChild(search);
        skeleton.appendChild(header);
        
        // Friends
        for (let i = 0; i < 6; i++) {
            const friend = document.createElement('div');
            friend.className = 'flex justify-between items-center p-2 rounded';
            
            const leftSection = document.createElement('div');
            leftSection.className = 'flex items-center';
            
            const avatar = document.createElement('div');
            avatar.className = 'relative mr-3';
            
            const avatarImg = document.createElement('div');
            avatarImg.className = 'w-8 h-8 rounded-full bg-gray-600 animate-pulse';
            
            const statusDot = document.createElement('div');
            statusDot.className = 'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background bg-gray-600 animate-pulse';
            
            avatar.appendChild(avatarImg);
            avatar.appendChild(statusDot);
            
            const infoDiv = document.createElement('div');
            
            const name = document.createElement('div');
            name.className = 'h-4 w-24 bg-gray-600 rounded animate-pulse mb-1';
            
            const status = document.createElement('div');
            status.className = 'h-3 w-16 bg-gray-700 rounded animate-pulse';
            
            infoDiv.appendChild(name);
            infoDiv.appendChild(status);
            
            leftSection.appendChild(avatar);
            leftSection.appendChild(infoDiv);
            
            const actions = document.createElement('div');
            actions.className = 'flex space-x-2';
            
            const action1 = document.createElement('div');
            action1.className = 'h-8 w-8 bg-gray-700 rounded-full animate-pulse';
            
            const action2 = document.createElement('div');
            action2.className = 'h-8 w-8 bg-gray-700 rounded-full animate-pulse';
            
            actions.appendChild(action1);
            actions.appendChild(action2);
            
            friend.appendChild(leftSection);
            friend.appendChild(actions);
            
            skeleton.appendChild(friend);
        }
        
        return skeleton;
    },
    
    /**
     * Create an "Active Now" section skeleton
     * @returns {HTMLElement}
     */
    createActiveNowSkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-loader active-now-skeleton p-4 space-y-4';
        
        const header = document.createElement('div');
        header.className = 'h-4 w-28 bg-gray-600 rounded animate-pulse mb-4';
        skeleton.appendChild(header);
        
        for (let i = 0; i < 2; i++) {
            const activityCard = document.createElement('div');
            activityCard.className = 'mb-3 rounded bg-discord-background p-3';
            
            const userInfo = document.createElement('div');
            userInfo.className = 'flex items-center mb-2';
            
            const avatar = document.createElement('div');
            avatar.className = 'relative mr-2';
            
            const avatarImg = document.createElement('div');
            avatarImg.className = 'w-8 h-8 rounded-full bg-gray-600 animate-pulse';
            
            const statusDot = document.createElement('div');
            statusDot.className = 'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-background bg-gray-600 animate-pulse';
            
            avatar.appendChild(avatarImg);
            avatar.appendChild(statusDot);
            
            const name = document.createElement('div');
            name.className = 'h-4 w-24 bg-gray-600 rounded animate-pulse';
            
            userInfo.appendChild(avatar);
            userInfo.appendChild(name);
            
            const activityInfo = document.createElement('div');
            activityInfo.className = 'flex items-center bg-discord-darker p-2 rounded';
            
            const gameIcon = document.createElement('div');
            gameIcon.className = 'w-8 h-8 rounded bg-gray-600 animate-pulse mr-2';
            
            const gameInfo = document.createElement('div');
            gameInfo.className = 'flex-1';
            
            const gameType = document.createElement('div');
            gameType.className = 'h-3 w-16 bg-gray-600 rounded animate-pulse mb-1';
            
            const gameName = document.createElement('div');
            gameName.className = 'h-4 w-28 bg-gray-600 rounded animate-pulse mb-1';
            
            const gameTime = document.createElement('div');
            gameTime.className = 'h-3 w-20 bg-gray-700 rounded animate-pulse';
            
            gameInfo.appendChild(gameType);
            gameInfo.appendChild(gameName);
            gameInfo.appendChild(gameTime);
            
            activityInfo.appendChild(gameIcon);
            activityInfo.appendChild(gameInfo);
            
            const joinBtn = document.createElement('div');
            joinBtn.className = 'bg-discord-darker py-2 px-3 flex mt-2';
            
            const btnContent = document.createElement('div');
            btnContent.className = 'flex-1 h-6 bg-discord-background animate-pulse rounded';
            
            joinBtn.appendChild(btnContent);
            
            activityCard.appendChild(userInfo);
            activityCard.appendChild(activityInfo);
            activityCard.appendChild(joinBtn);
            
            skeleton.appendChild(activityCard);
        }
        
        return skeleton;
    },
    
    /**
     * Create a default skeleton loading state
     * @returns {HTMLElement}
     */
    createDefaultSkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-loader default-skeleton animate-pulse';
        
        for (let i = 0; i < 3; i++) {
            const line = document.createElement('div');
            line.className = 'h-4 bg-gray-600 rounded my-2 w-' + (Math.floor(Math.random() * 50) + 50) + '%';
            skeleton.appendChild(line);
        }
        
        return skeleton;
    },
    
    /**
     * Add a global loading indicator
     */
    addGlobalLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'global-lazy-loader';
        indicator.className = 'fixed top-4 right-4 bg-discord-primary text-white px-3 py-1 rounded text-xs shadow-lg flex items-center z-50 transition-opacity duration-300 opacity-0 pointer-events-none';
        
        const spinnerIcon = document.createElement('div');
        spinnerIcon.className = 'mr-2 w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin';
        
        const text = document.createElement('span');
        text.textContent = 'Loading...';
        
        indicator.appendChild(spinnerIcon);
        indicator.appendChild(text);
        document.body.appendChild(indicator);
    },
    
    /**
     * Show the global loading indicator
     */
    showGlobalLoadingIndicator() {
        const indicator = document.getElementById('global-lazy-loader');
        if (indicator) {
            indicator.classList.remove('opacity-0');
            indicator.classList.add('opacity-100');
        }
    },
    
    /**
     * Hide the global loading indicator
     */
    hideGlobalLoadingIndicator() {
        const indicator = document.getElementById('global-lazy-loader');
        if (indicator) {
            indicator.classList.remove('opacity-100');
            indicator.classList.add('opacity-0');
        }
    },
    
    /**
     * Listen for data load events
     */
    listenForDataEvents() {
        document.addEventListener('data-loaded', event => {
            const { target, isEmpty } = event.detail || {};
            if (target) {
                const elements = document.querySelectorAll(`[data-lazyload="${target}"]`);
                elements.forEach(element => {
                    this.showContent(element, isEmpty);
                });
            }
            
            // Check if we need to hide the global indicator
            if (document.querySelectorAll('.content-loading').length === 0) {
                this.hideGlobalLoadingIndicator();
            }
        });
        
        // Listen for AJAX requests to show/hide global indicator
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        const self = this;
        
        XMLHttpRequest.prototype.open = function() {
            this.addEventListener('loadstart', () => self.showGlobalLoadingIndicator());
            this.addEventListener('loadend', () => {
                // Small delay to ensure any resulting DOM updates have occurred
                setTimeout(() => {
                    if (document.querySelectorAll('.content-loading').length === 0) {
                        self.hideGlobalLoadingIndicator();
                    }
                }, 300);
            });
            
            originalXhrOpen.apply(this, arguments);
        };
    },
    
    /**
     * Trigger data loaded event manually
     * @param {string} target - Target component type
     * @param {boolean} isEmpty - Whether the data is empty
     */
    triggerDataLoaded(target, isEmpty = false) {
        console.log(`LazyLoader: Triggering data loaded for ${target}`);
        
        // Handle channel list specially
        if (target === 'channel-list') {
            const channelElements = document.querySelectorAll('[data-lazyload="channel-list"], .channel-list-container');
            channelElements.forEach(element => {
                // Mark as loaded
                element.classList.add('lazy-loaded');
                element.setAttribute('aria-busy', 'false');
                element.classList.add('channels-loaded');
                
                // Ensure visibility of channel items
                const channelItems = document.querySelectorAll('.channel-item');
                channelItems.forEach(item => {
                    item.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;';
                });
                
                // Dispatch event
                element.dispatchEvent(new CustomEvent('content-loaded', {
                    detail: { isEmpty: isEmpty }
                }));
            });
        }
        
        // Still dispatch global event
        document.dispatchEvent(new CustomEvent('data-loaded', {
            detail: { target, isEmpty }
        }));
    }
};

// Auto-initialize when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof LazyLoader !== 'undefined') {
        console.log('🔄 Auto-initializing LazyLoader');
        LazyLoader.init();
    } else {
        console.error('❌ LazyLoader not defined - skeleton loading will not work');
    }
});

// Make LazyLoader available globally
window.LazyLoader = LazyLoader;

// Also export as a module
export default LazyLoader; 