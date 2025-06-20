// Friend API Module
// Handles all friend-related API calls with robust error handling

class FriendAPI {
    constructor() {
        this.baseURL = '/api/friends';
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // Helper method to safely parse response
    async parseResponse(response) {
        const text = await response.text();
        
        // Check if response is HTML (indicates PHP error)
        if (text.trim().startsWith('<') || text.includes('<br />') || text.includes('</html>')) {
            console.error('Server returned HTML instead of JSON:', text.substring(0, 200));
            throw new Error('Server error occurred. Please try again.');
        }
        
        // Try to parse as JSON
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON response:', text);
            throw new Error('Invalid response from server');
        }
    }

    // Helper method to handle API calls with consistent error handling
    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: this.headers,
                ...options
            });
            
            const data = await this.parseResponse(response);
            
            // Handle HTTP error status codes
            if (!response.ok) {
                const errorMessage = data.error?.message || data.message || `Server error: ${response.status}`;
                throw new Error(errorMessage);
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Send friend request
    async sendFriendRequest(username) {
        const data = await this.makeRequest(this.baseURL, {
            method: 'POST',
            body: JSON.stringify({ username })
        });
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to send friend request');
        }
        
        return data;
    }

    // Get all friends
    async getFriends() {
        const data = await this.makeRequest(this.baseURL);
        return data.success ? data.data : [];
    }

    // Get online friends
    async getOnlineFriends() {
        const data = await this.makeRequest(`${this.baseURL}/online`);
        return data.success ? data.data : [];
    }

    // Get pending friend requests
    async getPendingRequests() {
        const data = await this.makeRequest(`${this.baseURL}/pending`);
        return data.success ? data.data : { incoming: [], outgoing: [] };
    }

    // Get pending requests count
    async getPendingCount() {
        const data = await this.makeRequest(`${this.baseURL}/pending/count`);
        return data.count || 0;
    }

    // Accept friend request
    async acceptFriendRequest(friendshipId) {
        const data = await this.makeRequest(`${this.baseURL}/${friendshipId}/accept`, {
            method: 'POST'
        });
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to accept friend request');
        }
        
        return data;
    }

    // Decline friend request
    async declineFriendRequest(friendshipId) {
        const data = await this.makeRequest(`${this.baseURL}/${friendshipId}/decline`, {
            method: 'POST'
        });
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to decline friend request');
        }
        
        return data;
    }

    // Remove friend
    async removeFriend(userId) {
        const data = await this.makeRequest(this.baseURL, {
            method: 'DELETE',
            body: JSON.stringify({ user_id: userId })
        });
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to remove friend');
        }
        
        return data;
    }

    // Block user
    async blockUser(userId) {
        const data = await this.makeRequest('/api/users/block', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId })
        });
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to block user');
        }
        
        return data;
    }

    // Unblock user
    async unblockUser(userId) {
        const data = await this.makeRequest('/api/users/unblock', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId })
        });
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to unblock user');
        }
        
        return data;
    }

    // Get blocked users
    async getBlockedUsers() {
        const data = await this.makeRequest('/api/users/blocked');
        return data.success ? data.data : [];
    }

    // Validate username format (supports both username and username#discriminator)
    validateUsername(username) {
        if (!username || username.length < 2) {
            return { valid: false, message: 'Username must be at least 2 characters long' };
        }

        if (username.includes('#')) {
            const parts = username.split('#');
            if (parts.length !== 2) {
                return { valid: false, message: 'Invalid format. Use username#1234' };
            }
            
            const [user, discriminator] = parts;
            if (user.length < 2) {
                return { valid: false, message: 'Username part must be at least 2 characters long' };
            }
            
            if (!/^\d{4}$/.test(discriminator)) {
                return { valid: false, message: 'Discriminator must be exactly 4 digits' };
            }
        } else if (username.length < 3) {
            return { valid: false, message: 'Username must be at least 3 characters long' };
        }

        return { valid: true };
    }
}

// Create global instance
window.friendAPI = new FriendAPI();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FriendAPI;
}
