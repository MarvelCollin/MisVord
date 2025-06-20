class ServerAPI {
    constructor() {
        this.baseURL = '/api/servers';
    }    async makeRequest(url, options = {}) {
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
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: errorText || 'Unknown error occurred' };
                }
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const text = await response.text();
                if (!text) {
                    return {};
                }

                try {
                    return JSON.parse(text);
                } catch (parseError) {
                    console.error('Failed to parse JSON response:', text);
                    throw new Error('Invalid JSON response received');
                }
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('Server API request failed:', error);
            throw error;
        }
    }async createServer(serverData) {
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
    }    async leaveServer(serverId) {
        return await this.makeRequest(`/api/servers/${serverId}/leave`, {
            method: 'POST'
        });
    }

    async generateInvite(serverId) {
        return await this.makeRequest(`/api/servers/${serverId}/invite`, {
            method: 'POST'
        });
    }

    async updateServerSettings(serverId, settingsData) {
        return await this.makeRequest(`/api/servers/${serverId}/settings`, {
            method: 'PUT',
            body: JSON.stringify(settingsData)
        });
    }

    async getNotificationSettings(serverId) {
        return await this.makeRequest(`/api/servers/${serverId}/notifications`);
    }

    async updateNotificationSettings(serverId, notificationData) {
        return await this.makeRequest(`/api/servers/${serverId}/notifications`, {
            method: 'PUT',
            body: JSON.stringify(notificationData)
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
        return await this.makeRequest('/api/servers/sidebar', {
            method: 'GET'
        });
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
    }    async redirectToServer(serverId) {
        return await this.makeRequest(`/server/${serverId}`, {
            method: 'GET'
        });
    }
}

window.ServerAPI = new ServerAPI();
