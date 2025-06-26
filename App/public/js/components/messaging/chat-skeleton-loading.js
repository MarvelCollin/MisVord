class ChatSkeletonLoader {
    constructor(container) {
        this.container = container;
        this.skeletonCount = 6;
    }

    show() {
        if (!this.container) return;
        
        this.hideEmptyState();
        this.clear();
        
        for (let i = 0; i < this.skeletonCount; i++) {
            const skeleton = this.createSkeleton(i % 3 === 0);
            this.container.appendChild(skeleton);
        }
    }

    clear() {
        if (!this.container) return;
        
        const skeletons = this.container.querySelectorAll('.message-group-item');
        skeletons.forEach(skeleton => skeleton.remove());
    }

    hideEmptyState() {
        if (!this.container) return;
        
        const emptyState = this.container.querySelector('#chat-empty-state');
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
}

if (typeof window !== 'undefined') {
    window.ChatSkeletonLoader = ChatSkeletonLoader;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatSkeletonLoader;
}
