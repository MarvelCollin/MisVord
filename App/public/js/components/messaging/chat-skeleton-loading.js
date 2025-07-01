if (typeof window === 'undefined' || !window.ChatSkeletonLoader) {
class ChatSkeletonLoader {
    constructor(container) {
        this.container = container;
        this.skeletonCount = 6;
    }
    
    static isAnySkeletonActive() {
        const containers = document.querySelectorAll('.messages-container');
        for (const container of containers) {
            const hasSkeletonAttr = container.getAttribute('data-channel-skeleton') === 'active';
            const hasSkeletonElements = container.querySelectorAll('.bubble-message-group.animate-pulse').length > 0;
            const hasSkeletonClass = container.classList.contains('skeleton-loading');
            
            if (hasSkeletonAttr || hasSkeletonElements || hasSkeletonClass) {
                return true;
            }
        }
        return false;
    }

    show() {
        if (!this.container) return;
        
        this.hideEmptyState();
        
        const isChannelSwitching = this.container.getAttribute('data-channel-skeleton') === 'active';
        const existingMessages = this.container.querySelectorAll('.bubble-message-group:not(.animate-pulse)');
        
        if (existingMessages.length > 0 && !isChannelSwitching) {
            console.log('⚠️ Real messages exist, skipping skeleton loading');
            return;
        }
        
        this.clear();
        
        for (let i = 0; i < this.skeletonCount; i++) {
            const skeleton = this.createSkeleton(i % 3 === 0);
            this.container.appendChild(skeleton);
        }
        
        console.log(`🎨 [ChatSkeletonLoader] Displayed ${this.skeletonCount} skeleton messages`);
    }

    clear() {
        if (!this.container) return;
        
        const skeletons = this.container.querySelectorAll('.bubble-message-group.animate-pulse');
        skeletons.forEach(skeleton => skeleton.remove());
        
        if (skeletons.length > 0) {
            console.log(`🧹 [ChatSkeletonLoader] Cleared ${skeletons.length} skeleton messages`);
        }
    }

    hideEmptyState() {
        if (!this.container) return;
        
        const emptyState = this.container.querySelector('#chat-empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        const legacyEmptyState = this.container.querySelector('.flex.flex-col.items-center.justify-center');
        if (legacyEmptyState && legacyEmptyState.textContent.includes('No messages yet')) {
            legacyEmptyState.style.display = 'none';
        }
    }

    isSkeletonVisible() {
        if (!this.container) return false;
        const skeletons = this.container.querySelectorAll('.bubble-message-group.animate-pulse');
        return skeletons.length > 0;
    }

    showForChannelSwitch() {
        if (!this.container) return;
        
        this.container.setAttribute('data-channel-skeleton', 'active');
        this.container.classList.add('skeleton-loading');
        this.show();
        console.log('🎨 [ChatSkeletonLoader] Skeleton shown for channel switch');
    }

    clearAfterLoad() {
        if (!this.container) return;
        
        this.clear();
        this.container.removeAttribute('data-channel-skeleton');
        this.container.classList.remove('skeleton-loading');
        console.log('🧹 [ChatSkeletonLoader] Skeleton cleared after message load');
    }

    createSkeleton(isAlternate = false) {
        const skeletonGroup = document.createElement('div');
        skeletonGroup.className = 'bubble-message-group animate-pulse';
        skeletonGroup.style.position = 'relative';
        skeletonGroup.style.zIndex = '20';
        
        const avatar = document.createElement('div');
        avatar.className = 'bubble-avatar';
        
        const avatarImg = document.createElement('div');
        avatarImg.className = 'w-full h-full rounded-full bg-[#3c3f45]';
        avatar.appendChild(avatarImg);
        
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'bubble-content-wrapper';
        
        const header = document.createElement('div');
        header.className = 'bubble-header';
        
        const usernameBar = document.createElement('div');
        usernameBar.className = 'h-4 bg-[#3c3f45] rounded w-24 bubble-username';
        
        const timeBar = document.createElement('div');
        timeBar.className = 'h-3 bg-[#3c3f45] rounded w-12 bubble-timestamp';
        
        header.appendChild(usernameBar);
        header.appendChild(timeBar);
        
        const contents = document.createElement('div');
        contents.className = 'bubble-contents';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'bubble-message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'bubble-message-text';
        
        const contentBar1 = document.createElement('div');
        contentBar1.className = 'h-4 bg-[#3c3f45] rounded w-full max-w-lg mb-1';
        
        const contentBar2 = document.createElement('div');
        contentBar2.className = isAlternate ? 'h-4 bg-[#3c3f45] rounded w-1/2 max-w-md' : 'h-4 bg-[#3c3f45] rounded w-3/4 max-w-md';
        
        messageText.appendChild(contentBar1);
        messageText.appendChild(contentBar2);
        messageContent.appendChild(messageText);
        contents.appendChild(messageContent);
        contentWrapper.appendChild(header);
        contentWrapper.appendChild(contents);
        
        skeletonGroup.appendChild(avatar);
        skeletonGroup.appendChild(contentWrapper);
        
        return skeletonGroup;
    }

    setSkeletonCount(count) {
        this.skeletonCount = count;
    }
}

if (typeof window !== 'undefined') {
    window.ChatSkeletonLoader = ChatSkeletonLoader;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatSkeletonLoader;
    }
}
