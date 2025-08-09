class UserAPI {
    constructor() {
        this.baseURL = '/api/users';
    }

    async parseResponse(response) {
        const text = await response.text();

        if (text.trim().startsWith('<') || text.includes('<br />') || text.includes('</html>') || text.includes('<!DOCTYPE')) {
            throw new Error('Server error occurred. Please try again.');
        }

        if (text.includes('Fatal error') || text.includes('Parse error') || text.includes('Warning:') || text.includes('Notice:')) {
            throw new Error('Server configuration error. Please contact support.');
        }

        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error('Invalid response from server');
        }
    }

    async makeRequest(url, options = {}) {
        try {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            const mergedOptions = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            };

            const response = await fetch(url, mergedOptions);
            const data = await this.parseResponse(response);

            if (response.status === 404) {
                return {
                    success: false,
                    error: data.message || data.error || `API endpoint not found: ${url}`,
                    status: 404
                };
            }

            if (response.status === 500) {
                return {
                    success: false,
                    error: data.message || data.error || 'Internal server error occurred. Please try again later.',
                    status: 500
                };
            }

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || data.error || `HTTP error! status: ${response.status}`,
                    status: response.status,
                    data: data
                };
            }

            if (data && typeof data === 'object') {
                if (data.success === true || data.success === false) {
                    return data;
                } else if (data.data !== undefined) {
                    return data;
                } else {
                    return {
                        success: true,
                        data: data,
                        message: data.message || 'Request completed successfully'
                    };
                }
            } else {
                return {
                    success: false,
                    error: 'Invalid response format from server',
                    status: response.status
                };
            }
        } catch (error) {
            let errorMessage = error.message;
            if (error.message === '[object Object]') {
                errorMessage = 'Unknown server error occurred';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    async getUserProfile(userId, serverId = null) {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required'
            };
        }

        let url = `/api/users/${userId}/profile`;

        if (serverId) {
            url += `?server_id=${serverId}`;
        }

        const result = await this.makeRequest(url);
        
        return result;
    }

    async getMutualRelations(userId) {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required'
            };
        }

        const result = await this.makeRequest(`/api/users/${userId}/mutual`);
        
        return result;
    }

    async getUserSecurityQuestion() {
        const result = await this.makeRequest('/api/user/security-question');
        return result;
    }

    async verifySecurityAnswerForPasswordChange(securityAnswer) {
        return await this.makeRequest('/api/user/verify-security-answer', {
            method: 'POST',
            body: JSON.stringify({
                security_answer: securityAnswer
            })
        });
    }

    async changePasswordWithSecurity(securityAnswer, newPassword, confirmPassword) {
        return await this.makeRequest('/api/user/change-password-security', {
            method: 'POST',
            body: JSON.stringify({
                security_answer: securityAnswer,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });
    }

    async sendFriendRequest(username) {
        const result = await this.makeRequest('/api/friends', {
            method: 'POST',
            body: JSON.stringify({
                username: username
            })
        });
        
        return result;
    }

    async acceptFriendRequest(friendshipId) {
        const result = await this.makeRequest(`/api/friends/accept?id=${friendshipId}`, {
            method: 'POST'
        });
        
        return result;
    }

    async declineFriendRequest(friendshipId) {
        const result = await this.makeRequest(`/api/friends/decline?id=${friendshipId}`, {
            method: 'POST'
        });
        
        return result;
    }

    async getPendingRequests() {
        const result = await this.makeRequest('/api/friends/pending');
        
        return result;
    }

    async updateBio(bio) {
        const result = await this.makeRequest('/api/users/profile', {
            method: 'POST',
            body: JSON.stringify({
                bio: bio
            })
        });
        
        return result;
    }

    async getAllUsers(search = '', limit = 50) {
        let url = `/api/users/all?limit=${limit}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        
        const result = await this.makeRequest(url);
        
        return result;
    }

    async getFriends() {
        const result = await this.makeRequest('/api/friends');
        return result;
    }

    async deleteAccount(usernameConfirmation, ownershipTransfers = {}) {
        if (!usernameConfirmation) {
            return {
                success: false,
                error: 'Username confirmation is required'
            };
        }

        const result = await this.makeRequest('/api/user/account', {
            method: 'DELETE',
            body: JSON.stringify({
                username_confirmation: usernameConfirmation,
                ownership_transfers: ownershipTransfers
            })
        });
        
        return result;
    }
}

const userAPI = new UserAPI();
window.userAPI = userAPI;
