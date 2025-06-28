class FriendAPI {
    constructor() {
        this.baseURL = '/api/friends';
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        if (typeof socket !== 'undefined') {
            socket.on('friend-request-received', (data) => {
                showToast(`Friend request received from ${data.sender_username}`, 'info');
            });

            socket.on('friend-request-accepted', (data) => {
                showToast(`${data.recipient_username} accepted your friend request`, 'success');
            });

            socket.on('friend-request-declined', (data) => {
                showToast(`Your friend request was declined`, 'info');
            });
        }
    }

    async parseResponse(response) {
        const text = await response.text();
        
        if (text.trim().startsWith('<') || text.includes('<br />') || text.includes('</html>') || text.includes('<!DOCTYPE')) {
            console.error('Server returned HTML instead of JSON:', text.substring(0, 200));
            
            if (text.includes('Fatal error') || text.includes('Parse error')) {
                throw new Error('Server configuration error. Please contact support.');
            } else if (text.includes('Warning:') || text.includes('Notice:')) {
                throw new Error('Server warning occurred. Please try again.');
            } else {
                throw new Error('Server error occurred. Please try again.');
            }
        }
        
        if (text.includes('Fatal error') || text.includes('Parse error') || text.includes('Warning:') || text.includes('Notice:')) {
            console.error('Server returned PHP error:', text.substring(0, 200));
            throw new Error('Server configuration error. Please contact support.');
        }
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON response:', text);
            throw new Error('Invalid response from server');
        }
    }

    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: this.headers,
                ...options
            });
            
            const data = await this.parseResponse(response);
            
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

    async sendFriendRequest(username) {
        const data = await this.makeRequest(this.baseURL, {
            method: 'POST',
            body: JSON.stringify({ username })
        });
        
        if (!data.data) {
            throw new Error(data.message || 'Failed to send friend request');
        }
        
        return data;
    }

    async getFriends() {
        const data = await this.makeRequest(this.baseURL);
        return data.data || [];
    }

    async getOnlineFriends() {
        const data = await this.makeRequest(`${this.baseURL}/online`);
        return data.data || [];
    }

    async getPendingRequests() {
        const data = await this.makeRequest(`${this.baseURL}/pending`);
        return data.data || { incoming: [], outgoing: [] };
    }

    async getPendingCount() {
        const data = await this.makeRequest(`${this.baseURL}/pending/count`);
        return data.count || 0;
    }

    async acceptFriendRequest(friendshipId) {
        const data = await this.makeRequest(`${this.baseURL}/accept?id=${friendshipId}`, {
            method: 'POST'
        });
        
        if (!data.data) {
            throw new Error(data.message || 'Failed to accept friend request');
        }
        
        return data;
    }

    async declineFriendRequest(friendshipId) {
        const data = await this.makeRequest(`${this.baseURL}/decline?id=${friendshipId}`, {
            method: 'POST'
        });
        
        if (!data.data) {
            throw new Error(data.message || 'Failed to decline friend request');
        }
        
        return data;
    }

    async removeFriend(userId) {
        const data = await this.makeRequest(this.baseURL, {
            method: 'DELETE',
            body: JSON.stringify({ user_id: userId })
        });
        
        if (!data.data) {
            throw new Error(data.message || 'Failed to remove friend');
        }
        
        return data;
    }

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

const friendAPI = new FriendAPI();
window.FriendAPI = friendAPI;
