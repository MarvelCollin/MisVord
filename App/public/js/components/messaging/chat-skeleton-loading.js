if (typeof window === 'undefined' || !window.ChatSkeletonLoader) {
class ChatSkeletonLoader {
    constructor(container) {
        this.container = container;
        this.skeletonCount = 6;
        this.loadMoreSkeletonCount = 3;
    }

    show(isPagination = false) {
        if (!this.container) return;
        
        if (isPagination) {
            this.showLoadMoreSkeleton();
        } else {
            this.showInitialSkeleton();
        }
    }

    showInitialSkeleton() {
        this.hideEmptyState();
        
        const isChannelSwitching = this.container.getAttribute('data-channel-skeleton') === 'active';
        const existingMessages = this.container.querySelectorAll('.message-group');
        
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

    showLoadMoreSkeleton() {
        this.hideLoadMoreButton();
        
        if (!this.loadMoreSkeletonContainer) {
            this.loadMoreSkeletonContainer = document.createElement('div');
            this.loadMoreSkeletonContainer.className = 'load-more-skeleton-container';
            this.loadMoreSkeletonContainer.id = 'load-more-skeleton';
        }
        
        this.loadMoreSkeletonContainer.innerHTML = '';
        
        for (let i = 0; i < this.loadMoreSkeletonCount; i++) {
            const skeleton = this.createSkeleton(i % 2 === 0);
            this.loadMoreSkeletonContainer.appendChild(skeleton);
        }
        
        if (this.container.firstChild) {
            this.container.insertBefore(this.loadMoreSkeletonContainer, this.container.firstChild);
        } else {
            this.container.appendChild(this.loadMoreSkeletonContainer);
        }
        
        console.log(`🎨 [ChatSkeletonLoader] Displayed ${this.loadMoreSkeletonCount} load more skeleton messages`);
    }

    hideLoadMoreSkeleton() {
        if (this.loadMoreSkeletonContainer) {
            this.loadMoreSkeletonContainer.remove();
            this.loadMoreSkeletonContainer = null;
        }
        this.showLoadMoreButton();
    }

    hideLoadMoreButton() {
        const loadMoreButtons = document.querySelectorAll('#load-more-messages, .load-more-messages');
        loadMoreButtons.forEach(button => {
            button.style.display = 'none';
        });
    }

    showLoadMoreButton() {
        const loadMoreButtons = document.querySelectorAll('#load-more-messages, .load-more-messages');
        loadMoreButtons.forEach(button => {
            button.style.display = 'block';
        });
    }

    clear() {
        if (!this.container) return;
        
        const skeletons = this.container.querySelectorAll('.message-group-item');
        skeletons.forEach(skeleton => skeleton.remove());
        
        if (skeletons.length > 0) {
            console.log(`🧹 [ChatSkeletonLoader] Cleared ${skeletons.length} skeleton messages`);
        }
    }

    clearAll() {
        this.clear();
        this.hideLoadMoreSkeleton();
    }

    hideEmptyState() {
        if (!this.container) return;
        
        const emptyState = this.container.querySelector('#chat-empty-state, #empty-state-container');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }

    createSkeleton(isAlternate = false) {
        const skeletonGroup = document.createElement('div');
        skeletonGroup.className = 'message-group-item animate-pulse';
        skeletonGroup.style.position = 'relative';
        skeletonGroup.style.zIndex = '20';
        
        const groupWrapper = document.createElement('div');
        groupWrapper.className = 'message-group-wrapper';
        
        const avatarWrapper = document.createElement('div');
        avatarWrapper.className = 'message-avatar-wrapper';
        
        const avatar = document.createElement('div');
        avatar.className = 'w-full h-full rounded-full bg-[#3c3f45]';
        
        avatarWrapper.appendChild(avatar);
        
        const contentArea = document.createElement('div');
        contentArea.className = 'message-content-area';
        
        const headerInfo = document.createElement('div');
        headerInfo.className = 'message-header-info';
        
        const usernameBar = document.createElement('div');
        usernameBar.className = 'h-4 bg-[#3c3f45] rounded w-24 inline-block';
        
        const timeBar = document.createElement('div');
        timeBar.className = 'h-3 bg-[#3c3f45] rounded w-12 inline-block ml-2';
        
        headerInfo.appendChild(usernameBar);
        headerInfo.appendChild(timeBar);
        
        const messageText = document.createElement('div');
        messageText.className = 'message-body-text';
        
        const contentBar1 = document.createElement('div');
        contentBar1.className = 'h-4 bg-[#3c3f45] rounded w-full max-w-lg mb-1';
        
        const contentBar2 = document.createElement('div');
        contentBar2.className = isAlternate ? 'h-4 bg-[#3c3f45] rounded w-1/2 max-w-md' : 'h-4 bg-[#3c3f45] rounded w-3/4 max-w-md';
        
        messageText.appendChild(contentBar1);
        messageText.appendChild(contentBar2);
        
        contentArea.appendChild(headerInfo);
        contentArea.appendChild(messageText);
        
        groupWrapper.appendChild(avatarWrapper);
        groupWrapper.appendChild(contentArea);
        
        skeletonGroup.appendChild(groupWrapper);
        
        return skeletonGroup;
    }

    setSkeletonCount(count) {
        this.skeletonCount = count;
    }

    setLoadMoreSkeletonCount(count) {
        this.loadMoreSkeletonCount = count;
    }
}

if (typeof window !== 'undefined') {
    window.ChatSkeletonLoader = ChatSkeletonLoader;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatSkeletonLoader;
    }
}
