class NitroCrownManager {
    constructor() {
        this.nitroCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000;
        this.pendingRequests = new Map();
        this.initialized = false;
        this.init();
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        console.log('🎯 [NITRO-CROWN] Manager initialized');
    }

    createCrownElement() {
        const wrapper = document.createElement('span');
        wrapper.className = 'nitro-crown-wrapper';
        
        const crown = document.createElement('img');
        crown.src = '/public/assets/common/nitro.webp';
        crown.className = 'nitro-crown';
        crown.setAttribute('aria-label', 'Nitro Member');
        crown.setAttribute('alt', 'Nitro');
        
        const tooltip = document.createElement('div');
        tooltip.className = 'nitro-crown-tooltip';
        tooltip.textContent = 'Nitro Member';
        
        wrapper.appendChild(crown);
        wrapper.appendChild(tooltip);
        
        return wrapper;
    }

    addCrownToElement(element, position = 'after') {
        if (!element) return;
        
        const existingCrown = element.querySelector('.nitro-crown-wrapper');
        if (existingCrown) return;
        
        const parent = element.parentElement;
        if (parent && parent.querySelector('.nitro-crown-wrapper')) return;
        
        if (element.dataset.nitroCrownProcessed === 'true') return;
        
        const crown = this.createCrownElement();
        
        if (position === 'after') {
            element.appendChild(crown);
        } else if (position === 'before') {
            element.insertBefore(crown, element.firstChild);
        } else if (position === 'inline') {
            if (element.tagName === 'SPAN' || element.classList.contains('username')) {
                element.appendChild(crown);
            } else {
                const textNode = this.findTextNode(element);
                if (textNode && textNode.parentNode) {
                    textNode.parentNode.insertBefore(crown, textNode.nextSibling);
                }
            }
        }
        
        element.dataset.nitroCrownProcessed = 'true';
    }

    removeCrownFromElement(element) {
        if (!element) return;
        
        const crown = element.querySelector('.nitro-crown-wrapper');
        if (crown) {
            crown.remove();
        }
        
        delete element.dataset.nitroCrownProcessed;
    }

    findTextNode(element) {
        for (let node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                return node;
            }
        }
        return null;
    }

    getCachedNitroStatus(userId) {
        const cached = this.nitroCache.get(userId);
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > this.cacheExpiry) {
            this.nitroCache.delete(userId);
            return null;
        }
        
        return cached.hasNitro;
    }

    setCachedNitroStatus(userId, hasNitro) {
        this.nitroCache.set(userId, {
            hasNitro,
            timestamp: Date.now()
        });
    }

    async checkSingleUserNitro(userId) {
        if (!userId) return false;
        
        const cached = this.getCachedNitroStatus(userId);
        if (cached !== null) {
            return cached;
        }
        
        if (this.pendingRequests.has(userId)) {
            return this.pendingRequests.get(userId);
        }
        
        const promise = this.fetchSingleNitroStatus(userId);
        this.pendingRequests.set(userId, promise);
        
        try {
            const hasNitro = await promise;
            this.setCachedNitroStatus(userId, hasNitro);
            return hasNitro;
        } finally {
            this.pendingRequests.delete(userId);
        }
    }

    async fetchSingleNitroStatus(userId) {
        try {
            const response = await fetch(`/api/users/${userId}/profile`, {
                credentials: 'same-origin'
            });
            
            if (!response.ok) return false;
            
            const data = await response.json();
            return data?.data?.user?.has_nitro || false;
        } catch (error) {
            console.error('🎯 [NITRO-CROWN] Error fetching single nitro status:', error);
            return false;
        }
    }

    async checkBulkNitroStatus(userIds) {
        if (!Array.isArray(userIds) || userIds.length === 0) return {};
        
        const uncachedUserIds = [];
        const results = {};
        
        for (const userId of userIds) {
            const cached = this.getCachedNitroStatus(userId);
            if (cached !== null) {
                results[userId] = cached;
            } else {
                uncachedUserIds.push(userId);
            }
        }
        
        if (uncachedUserIds.length === 0) {
            return results;
        }
        
        try {
            const response = await fetch('/api/users/bulk-nitro-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({ user_ids: uncachedUserIds })
            });
            
            if (!response.ok) {
                console.warn('🎯 [NITRO-CROWN] Bulk nitro status request failed');
                return results;
            }
            
            const data = await response.json();
            const nitroStatuses = data?.data?.nitro_statuses || {};
            
            for (const userId of uncachedUserIds) {
                const hasNitro = nitroStatuses[userId] || false;
                this.setCachedNitroStatus(userId, hasNitro);
                results[userId] = hasNitro;
            }
            
            console.log(`🎯 [NITRO-CROWN] Fetched nitro status for ${uncachedUserIds.length} users`);
            return results;
            
        } catch (error) {
            console.error('🎯 [NITRO-CROWN] Error fetching bulk nitro status:', error);
            return results;
        }
    }

    async updateUserElement(element, userId) {
        if (!element || !userId) return;
        
        try {
            const hasNitro = await this.checkSingleUserNitro(userId);
            
            if (hasNitro) {
                this.addCrownToElement(element, 'inline');
            } else {
                this.removeCrownFromElement(element);
            }
        } catch (error) {
            console.error('🎯 [NITRO-CROWN] Error updating user element:', error);
        }
    }

    async updateBulkUserElements(elements) {
        if (!Array.isArray(elements) || elements.length === 0) return;
        
        const userIds = elements
            .map(el => el.element?.dataset?.userId || el.userId)
            .filter(id => id && id !== 'null');
        
        if (userIds.length === 0) return;
        
        try {
            const nitroStatuses = await this.checkBulkNitroStatus(userIds);
            
            elements.forEach(({ element, userId }) => {
                const actualUserId = userId || element?.dataset?.userId;
                if (!actualUserId || actualUserId === 'null') return;
                
                const hasNitro = nitroStatuses[actualUserId];
                if (hasNitro) {
                    this.addCrownToElement(element, 'inline');
                } else {
                    this.removeCrownFromElement(element);
                }
            });
            
            console.log(`🎯 [NITRO-CROWN] Updated ${elements.length} user elements`);
        } catch (error) {
            console.error('🎯 [NITRO-CROWN] Error updating bulk user elements:', error);
        }
    }

    observeUserElements(containerSelector = 'body') {
        const container = document.querySelector(containerSelector);
        if (!container) return;
        
        const observer = new MutationObserver((mutations) => {
            const newUserElements = [];
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const userElements = node.querySelectorAll('[data-user-id]');
                        userElements.forEach(el => {
                            const userId = el.dataset.userId;
                            if (userId && userId !== 'null' && !this.shouldExcludeElement(el)) {
                                newUserElements.push({ element: el, userId });
                            }
                        });
                        
                        if (node.dataset?.userId && node.dataset.userId !== 'null' && !this.shouldExcludeElement(node)) {
                            newUserElements.push({ element: node, userId: node.dataset.userId });
                        }
                    }
                });
            });
            
            if (newUserElements.length > 0) {
                console.log(`🎯 [NITRO-CROWN] Detected ${newUserElements.length} new user elements`);
                this.updateBulkUserElements(newUserElements);
            }
        });
        
        observer.observe(container, {
            childList: true,
            subtree: true
        });
        
        console.log('🎯 [NITRO-CROWN] Started observing user elements');
        return observer;
    }

    shouldExcludeElement(element) {
        return element.classList.contains('dm-username') ||
               element.closest('.dm-friend-item') ||
               element.closest('#dm-list-container');
    }

    scanAndUpdateExistingElements(containerSelector = 'body') {
        const container = document.querySelector(containerSelector);
        if (!container) return;
        
        const userElements = container.querySelectorAll('[data-user-id]');
        const elementsToUpdate = [];
        
        userElements.forEach(el => {
            const userId = el.dataset.userId;
            if (userId && userId !== 'null' && !this.shouldExcludeElement(el)) {
                elementsToUpdate.push({ element: el, userId });
            }
        });
        
        if (elementsToUpdate.length > 0) {
            console.log(`🎯 [NITRO-CROWN] Found ${elementsToUpdate.length} existing user elements to update`);
            this.updateBulkUserElements(elementsToUpdate);
        }
    }

    clearCache() {
        this.nitroCache.clear();
        console.log('🎯 [NITRO-CROWN] Cache cleared');
    }

    removeExistingCrownsFromDirectMessages() {
        const dmUsernames = document.querySelectorAll('.dm-username[data-user-id]');
        dmUsernames.forEach(element => {
            this.removeCrownFromElement(element);
        });
        console.log(`🎯 [NITRO-CROWN] Removed crowns from ${dmUsernames.length} DM usernames`);
    }

    getCacheStats() {
        return {
            size: this.nitroCache.size,
            entries: Array.from(this.nitroCache.entries()).map(([userId, data]) => ({
                userId,
                hasNitro: data.hasNitro,
                age: Date.now() - data.timestamp
            }))
        };
    }
}

if (typeof window !== 'undefined') {
    window.NitroCrownManager = NitroCrownManager;
}

export default NitroCrownManager; 