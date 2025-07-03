/**
 * User Data Helper
 * Centralized utility for fetching and managing user profile data
 * Used by voice components to get avatars and display names
 */

// Prevent duplicate declarations
if (typeof window.UserDataHelper === 'undefined') {
    
class UserDataHelper {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
    }

    /**
     * Extract user ID from various participant data formats
     */
    extractUserId(participantId, participantName = null) {
        if (!participantId) return null;

        // Convert to string for processing
        const idStr = String(participantId);
        
        console.log('[UserDataHelper] Extracting user ID from:', { participantId: idStr, participantName });

        // Method 1: Direct numeric ID
        if (/^\d+$/.test(idStr)) {
            console.log('[UserDataHelper] Found direct numeric ID:', idStr);
            return idStr;
        }

        // Method 2: Extract from participant name format "username_userid"
        if (idStr.includes('_')) {
            const parts = idStr.split('_');
            const lastPart = parts[parts.length - 1];
            if (/^\d+$/.test(lastPart)) {
                console.log('[UserDataHelper] Extracted ID from participantId format:', lastPart);
                return lastPart;
            }
        }

        // Method 3: Extract from participant name if provided
        if (participantName && typeof participantName === 'string' && participantName.includes('_')) {
            const nameParts = participantName.split('_');
            const lastPart = nameParts[nameParts.length - 1];
            if (/^\d+$/.test(lastPart)) {
                console.log('[UserDataHelper] Extracted ID from participantName format:', lastPart);
                return lastPart;
            }
        }

        // Method 4: Check if it's already a valid user ID format
        if (idStr.length > 0 && /^\d+$/.test(idStr)) {
            console.log('[UserDataHelper] Confirmed as valid user ID:', idStr);
            return idStr;
        }

        console.log('[UserDataHelper] Could not extract user ID from:', { participantId, participantName });
        return null;
    }

    /**
     * Get clean display name (remove user ID suffix if present)
     */
    getCleanDisplayName(name) {
        if (!name) return 'Unknown';
        
        const nameStr = String(name);
        
        // Remove user ID suffix if present (format: "username_123456")
        if (nameStr.includes('_') && !isNaN(nameStr.split('_').pop())) {
            return nameStr.substring(0, nameStr.lastIndexOf('_'));
        }
        
        return nameStr;
    }

    /**
     * Wait for user API to be available
     */
    async waitForUserAPI(maxWait = 5000) {
        if (window.userAPI) return window.userAPI;
        
        const startTime = Date.now();
        while (!window.userAPI && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return window.userAPI || null;
    }

    /**
     * Fetch user profile data with caching
     */
    async getUserData(participantId, participantName = null) {
        console.log('[UserDataHelper] getUserData called with:', { participantId, participantName });
        
        const userId = this.extractUserId(participantId, participantName);
        
        if (!userId) {
            console.log('[UserDataHelper] No valid user ID found, trying username search for VideoSDK participant');
            
            const searchName = participantName || participantId;
            if (searchName && typeof searchName === 'string' && searchName !== 'Unknown') {
                const cacheKey = `username_${searchName.toLowerCase()}`;
                
                // Check cache for username search
                if (this.cache.has(cacheKey)) {
                    console.log('[UserDataHelper] Returning cached username search for:', searchName);
                    return this.cache.get(cacheKey);
                }
                
                // Check if username search is already pending
                if (this.pendingRequests.has(cacheKey)) {
                    console.log('[UserDataHelper] Username search already pending for:', searchName);
                    return this.pendingRequests.get(cacheKey);
                }
                
                try {
                    console.log('[UserDataHelper] Starting username search for:', searchName);
                    const searchPromise = this.searchUserByUsername(searchName);
                    this.pendingRequests.set(cacheKey, searchPromise);
                    
                    const userData = await searchPromise;
                    console.log('[UserDataHelper] Found user by username search:', userData);
                    
                    this.cache.set(cacheKey, userData);
                    this.pendingRequests.delete(cacheKey);
                    return userData;
                } catch (error) {
                    console.log('[UserDataHelper] Username search failed, using fallback:', error);
                    this.pendingRequests.delete(cacheKey);
                }
            }
            
            return {
                id: participantId,
                display_name: this.getCleanDisplayName(participantName || participantId),
                avatar_url: '/public/assets/common/default-profile-picture.png'
            };
        }

        console.log('[UserDataHelper] Using user ID:', userId);

        // Check cache first
        if (this.cache.has(userId)) {
            console.log('[UserDataHelper] Returning cached data for user:', userId);
            return this.cache.get(userId);
        }

        // Check if request is already pending
        if (this.pendingRequests.has(userId)) {
            console.log('[UserDataHelper] Request already pending for user:', userId);
            return this.pendingRequests.get(userId);
        }

        // Create new request
        console.log('[UserDataHelper] Fetching new data for user:', userId);
        const requestPromise = this.fetchUserProfile(userId, participantName);
        this.pendingRequests.set(userId, requestPromise);

        try {
            const userData = await requestPromise;
            console.log('[UserDataHelper] Successfully fetched user data:', userData);
            this.cache.set(userId, userData);
            this.pendingRequests.delete(userId);
            return userData;
        } catch (error) {
            console.log('[UserDataHelper] Failed to fetch user data, using fallback:', error);
            this.pendingRequests.delete(userId);
            // Return fallback data
            const fallbackData = {
                id: userId,
                display_name: this.getCleanDisplayName(participantName || participantId),
                avatar_url: '/public/assets/common/default-profile-picture.png'
            };
            this.cache.set(userId, fallbackData);
            return fallbackData;
        }
    }

    /**
     * Fetch user profile from API
     */
    async fetchUserProfile(userId, fallbackName = null) {
        const userAPI = await this.waitForUserAPI();
        
        if (!userAPI) {
            throw new Error('User API not available');
        }

        try {
            const response = await userAPI.getUserProfile(userId);
            
            if (response.success && response.data && response.data.user) {
                const user = response.data.user;
                return {
                    id: user.id,
                    username: user.username,
                    display_name: user.display_name || user.username,
                    avatar_url: user.avatar_url || '/public/assets/common/default-profile-picture.png'
                };
            } else {
                throw new Error('Invalid API response');
            }
        } catch (error) {
            console.warn(`Failed to fetch user profile for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Search for user by username (for VideoSDK participants)
     */
    async searchUserByUsername(username) {
        const userAPI = await this.waitForUserAPI();
        
        if (!userAPI) {
            throw new Error('User API not available');
        }

        try {
            const response = await userAPI.getAllUsers(username, 10);
            
            if (response.success && response.data && response.data.users) {
                const exactMatch = response.data.users.find(user => 
                    user.username.toLowerCase() === username.toLowerCase() ||
                    user.display_name?.toLowerCase() === username.toLowerCase()
                );
                
                if (exactMatch) {
                    return {
                        id: exactMatch.id,
                        username: exactMatch.username,
                        display_name: exactMatch.display_name || exactMatch.username,
                        avatar_url: exactMatch.avatar_url || '/public/assets/common/default-profile-picture.png'
                    };
                }
            }
            
            throw new Error('User not found');
        } catch (error) {
            console.warn(`Failed to search user by username ${username}:`, error);
            throw error;
        }
    }

    /**
     * Get current user data from meta tags
     */
    getCurrentUserData() {
        const userId = document.querySelector('meta[name="user-id"]')?.content;
        const username = document.querySelector('meta[name="username"]')?.content;
        const avatar = document.querySelector('meta[name="user-avatar"]')?.content;

        return {
            id: userId,
            username: username || 'You',
            display_name: username || 'You',
            avatar_url: avatar || '/public/assets/common/default-profile-picture.png'
        };
    }

    /**
     * Update avatar image element with user data
     */
    updateAvatarElement(imgElement, initialsElement, userData) {
        if (!imgElement || !userData) {
            console.warn('[UserDataHelper] updateAvatarElement called with missing parameters:', { imgElement: !!imgElement, userData: !!userData });
            return;
        }

        const avatarUrl = userData.avatar_url;
        const displayName = userData.display_name || userData.username || 'Unknown';

        console.log('[UserDataHelper] updateAvatarElement called with:', { avatarUrl, displayName, userData });
        console.log('[UserDataHelper] Current image src:', imgElement.src);
        console.log('[UserDataHelper] Current image classes:', imgElement.className);

        // Check if the image already has a valid non-default avatar
        const currentSrc = imgElement.src;
        const isCurrentValid = currentSrc && 
                              !currentSrc.includes('/public/assets/common/default-profile-picture.png') &&
                              !currentSrc.includes('data:') &&
                              currentSrc !== '';

        if (isCurrentValid && (!avatarUrl || avatarUrl === '/public/assets/common/default-profile-picture.png')) {
            console.log('[UserDataHelper] Current image is valid, keeping it instead of default avatar');
            imgElement.classList.remove('hidden');
            if (initialsElement) initialsElement.classList.add('hidden');
            return;
        }

        if (avatarUrl && avatarUrl !== '/public/assets/common/default-profile-picture.png') {
            console.log('[UserDataHelper] Setting new avatar image:', avatarUrl);
            imgElement.src = avatarUrl;
            imgElement.onload = () => {
                console.log('[UserDataHelper] Avatar image loaded successfully, showing image');
                imgElement.classList.remove('hidden');
                if (initialsElement) initialsElement.classList.add('hidden');
            };
            imgElement.onerror = () => {
                console.warn('[UserDataHelper] Avatar image failed to load, showing initials');
                imgElement.classList.add('hidden');
                if (initialsElement) {
                    initialsElement.classList.remove('hidden');
                    initialsElement.textContent = this.getInitials(displayName);
                }
            };
        } else {
            // Use initials only if no valid image is already present
            if (!isCurrentValid) {
                console.log('[UserDataHelper] Using initials instead of avatar (default or no URL)');
                imgElement.classList.add('hidden');
                if (initialsElement) {
                    initialsElement.classList.remove('hidden');
                    initialsElement.textContent = this.getInitials(displayName);
                }
            } else {
                console.log('[UserDataHelper] Keeping existing valid image');
                imgElement.classList.remove('hidden');
                if (initialsElement) initialsElement.classList.add('hidden');
            }
        }
    }

    /**
     * Get initials from display name
     */
    getInitials(name) {
        if (!name) return '?';
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }

    /**
     * Clear cache (useful for testing or when user data changes)
     */
    clearCache() {
        this.cache.clear();
        this.pendingRequests.clear();
    }

    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!window._userDataHelper) {
            window._userDataHelper = new UserDataHelper();
        }
        return window._userDataHelper;
    }
}

// Create global instance only if not already created
window.UserDataHelper = UserDataHelper;
window.userDataHelper = UserDataHelper.getInstance();

console.log('✅ UserDataHelper loaded successfully');

// Add test function for VideoSDK participant data
window.testVideoSDKParticipant = function(participantId, participantName) {
    if (!window.userDataHelper) {
        console.error('❌ UserDataHelper not available');
        return;
    }
    
    console.log('🧪 Testing VideoSDK participant data extraction...');
    console.log('Input:', { participantId, participantName });
    
    // Test user ID extraction
    const userId = window.userDataHelper.extractUserId(participantId, participantName);
    console.log('Extracted user ID:', userId);
    
    // Test display name cleaning
    const cleanName = window.userDataHelper.getCleanDisplayName(participantName);
    console.log('Clean display name:', cleanName);
    
    // Test full user data fetch
    window.userDataHelper.getUserData(participantId, participantName)
        .then(userData => {
            console.log('✅ Full user data:', userData);
        })
        .catch(error => {
            console.error('❌ Failed to get user data:', error);
        });
};
} // End of duplicate declaration prevention
