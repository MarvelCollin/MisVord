class UserAPI {
    constructor() {
        this.baseURL = '/api/users';
    }

    async parseResponse(response) {
        const text = await response.text();

        if (text.trim().startsWith('<') || text.includes('<br />') || text.includes('</html>') || text.includes('<!DOCTYPE')) {
            console.error('Server returned HTML instead of JSON:', text.substring(0, 200));
            throw new Error('Server error occurred. Please try again.');
        }

        if (text.includes('Fatal error') || text.includes('Parse error') || text.includes('Warning:') || text.includes('Notice:')) {
            console.error('Server returned PHP error:', text.substring(0, 200));
            throw new Error('Server configuration error. Please contact support.');
        }

        if (!text) {
            return {};
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
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
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
                console.error(`API endpoint not found or resource does not exist: ${url}`);
                return {
                    success: false,
                    error: data.message || data.error || `API endpoint not found: ${url}`,
                    status: 404
                };
            }

            if (response.status === 500) {
                console.error('Server error occurred:', url);
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

            if (data.data) {
                return data;
            } else {
                return {
                    success: false,
                    error: data.message || data.error || 'Request failed',
                    status: response.status,
                    data: data
                };
            }
        } catch (error) {
            let errorMessage = error.message;
            if (error.message === '[object Object]') {
                errorMessage = 'Unknown server error occurred';
            }

            console.error(`User API request to ${url} failed:`, errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    async getUserProfile(userId, serverId = null) {
        if (!userId) {
            console.error('UserAPI: getUserProfile called without userId');
            return {
                success: false,
                error: 'User ID is required'
            };
        }

        let url = `/api/users/${userId}/profile`;

        if (serverId) {
            url += `?server_id=${serverId}`;
        }

        console.log(`🔗 UserAPI: Fetching profile for user ${userId}`);
        const result = await this.makeRequest(url);
        
        if (!result.success) {
            console.error(`UserAPI: Failed to fetch user profile for ${userId}:`, result.error);
        } else {
            console.log(`🔗 UserAPI: Successfully fetched profile for user ${userId}`);
        }
        
        return result;
    }

    async getMutualRelations(userId) {
        if (!userId) {
            console.error('UserAPI: getMutualRelations called without userId');
            return {
                success: false,
                error: 'User ID is required'
            };
        }

        console.log(`🔗 UserAPI: Fetching mutual relations for user ${userId}`);
        const result = await this.makeRequest(`/api/users/${userId}/mutual`);
        
        if (!result.success) {
            console.error(`UserAPI: Failed to fetch mutual relations for ${userId}:`, result.error);
        } else {
            console.log(`🔗 UserAPI: Successfully fetched mutual relations for user ${userId}`, {
                friends: result.data.mutual_friend_count,
                servers: result.data.mutual_server_count
            });
        }
        
        return result;
    }

    async getUserSecurityQuestion() {
        console.log('🔗 UserAPI: Making request to /api/user/security-question');
        const result = await this.makeRequest('/api/user/security-question');
        console.log('🔗 UserAPI: Security question response:', result);
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

    async updateBio(bio) {
        console.log('🔗 UserAPI: Updating bio');
        const result = await this.makeRequest('/api/users/profile', {
            method: 'POST',
            body: JSON.stringify({
                bio: bio
            })
        });
        
        if (!result.success) {
            console.error('UserAPI: Failed to update bio:', result.error);
        } else {
            console.log('🔗 UserAPI: Successfully updated bio');
        }
        
        return result;
    }
}

const userAPI = new UserAPI();
window.userAPI = userAPI;
