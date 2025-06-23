class ServerAPI {
    constructor() {
        this.baseURL = '/api/servers';
    }

    async parseResponse(response) {
        const text = await response.text();
        
        if (text.trim().startsWith('<') || text.includes('<br />') || text.includes('</html>') || text.includes('<!DOCTYPE')) {
            console.error('Server returned HTML instead of JSON:', text.substring(0, 200));
            
            let errorMessage = 'Server error occurred. Please try again.';
            
            if (text.includes('Warning') || text.includes('Error') || text.includes('Fatal error')) {
                const errorMatch = text.match(/<b>(Warning|Error|Fatal error)<\/b>:\s*(.*?)(<br|<\/)/);
                if (errorMatch && errorMatch[2]) {
                    errorMessage = `Server error: ${errorMatch[2].trim()}`;
                }
            }
            
            throw new Error(errorMessage);
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
            console.error('Failed to parse JSON response:', text.substring(0, 200));
            throw new Error('Invalid response from server');
        }
    }

    async makeRequest(url, options = {}) {
        try {
            const defaultOptions = {
                headers: {
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
            
            if (!response.ok) {
                try {
                    const errorData = await this.parseResponse(response);
                    const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
                    throw new Error(errorMessage);
                } catch (parseError) {
                    if (parseError.message && parseError.message !== 'Invalid response from server') {
                        throw parseError;
                    } else {
                        throw new Error(`Server error (${response.status}). Please try again later.`);
                    }
                }
            }
            
            const data = await this.parseResponse(response);
            return data;
        } catch (error) {
            console.error('Server API request failed:', error);
            throw error;
        }
    }

    async createServer(serverData) {
        const options = {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        if (serverData instanceof FormData) {
            options.body = serverData;
        } else {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(serverData);
        }

        return await this.makeRequest('/api/servers/create', options);
    }

    async getServer(serverId) {
        return await this.makeRequest(`/api/servers/${serverId}`);
    }

    async updateServerSettings(serverId, settings) {
        return await this.makeRequest(`/api/servers/${serverId}/settings`, {
            method: 'POST',
            body: JSON.stringify(settings)
        });
    }

    async createInvite(serverId) {
        return await this.makeRequest(`/api/servers/${serverId}/invite`, {
            method: 'POST'
        });
    }

    async getServerChannels(serverId) {
        return await this.makeRequest(`/api/servers/${serverId}/channels`);
    }

    async getNotificationSettings(serverId) {
        return await this.makeRequest(`/api/servers/${serverId}/notifications`);
    }

    async updateNotificationSettings(serverId, settings) {
        return await this.makeRequest(`/api/servers/${serverId}/notifications`, {
            method: 'POST',
            body: JSON.stringify(settings)
        });
    }

    async getServerProfile(serverId) {
        return await this.makeRequest(`/api/servers/${serverId}/profile`);
    }

    async updateServerProfile(serverId, profileData) {
        return await this.makeRequest(`/api/servers/${serverId}/profile`, {
            method: 'POST',
            body: JSON.stringify(profileData)
        });
    }

    async leaveServer(serverId) {
        return await this.makeRequest(`/api/servers/${serverId}/leave`, {
            method: 'POST'
        });
    }

    async generateInvite(serverId, options = {}) {
        return await this.makeRequest(`/api/servers/${serverId}/invite`, {
            method: 'POST',
            body: options && Object.keys(options).length > 0 ? JSON.stringify(options) : undefined
        });
    }

    async getPerServerProfile(serverId) {
        return await this.makeRequest(`/api/servers/${serverId}/profile`);
    }

    async updatePerServerProfile(serverId, profileData) {
        return await this.makeRequest(`/api/servers/${serverId}/profile`, {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async getSidebar() {
        try {
            const response = await fetch('/api/servers/sidebar', {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'text/html'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Server error (${response.status}). Please try again later.`);
            }
            
            return await response.text();
        } catch (error) {
            console.error('Error fetching server sidebar:', error);
            throw error;
        }
    }

    async joinServer(serverData) {
        return await this.makeRequest('/api/servers/join', {
            method: 'POST',
            body: JSON.stringify(serverData)
        });
    }

    async joinByInvite(inviteCode) {
        return await this.makeRequest(`/api/servers/join/${inviteCode}`, {
            method: 'POST'
        });
    }

    async getServers() {
        return await this.makeRequest('/api/servers');
    }

    async redirectToServer(serverId) {
        try {
            const response = await fetch(`/server/${serverId}`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'text/html'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Server error (${response.status}). Please try again later.`);
            }
            
            const text = await response.text();
            return text;
        } catch (error) {
            console.error('Error redirecting to server:', error);
            throw error;
        }
    }

    async getServerPageHTML(serverId, activeChannelId = null) {
        let url = `/server/${serverId}?render_html=1`;
        if (activeChannelId) {
            url += `&channel=${activeChannelId}`;
        }
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'text/html, application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Server error (${response.status}). Please try again later.`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('Error fetching server page HTML:', error);
            throw error;
        }
    }

    async getServerMembers(serverId) {
        return await this.makeRequest(`/api/servers/${serverId}/members`);
    }

    async getServerRoles(serverId) {
        return await this.makeRequest(`/api/servers/${serverId}/roles`);
    }
}

const serverAPI = new ServerAPI();
export default serverAPI;
