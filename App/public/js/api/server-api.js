async function handleApiResponse(response) {
    if (!response.ok) {
        try {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${response.status}`);
        } catch (jsonError) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    }
    return response.json();
}

async function handleApiTextResponse(response) {
    if (!response.ok) {
        try {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${response.status}`);
        } catch (jsonError) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    }
    return response.text();
}

const serverAPI = {
    createServer: function(formData) {
        return fetch('/api/servers/create', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        }).then(handleApiResponse);
    },

    getServerPageHTML: function(serverId) {
        return fetch(`/server/${serverId}?render_html=1`, {
            method: 'GET',
            credentials: 'include'
        }).then(handleApiTextResponse);
    },
    
    getServer: function(serverId) {
        return fetch(`/api/servers/${serverId}/details`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(handleApiResponse)
        .then(data => {
            if (data.success && data.data && data.data.server) {
                return { server: data.data.server };
            }
            throw new Error(data.message || 'Failed to get server details');
        });
    },
    
    getStats: function() {
        return fetch('/api/admin/servers/stats', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        }).then(handleApiResponse);
    },
    
    listServers: function(page = 1, limit = 10, search = '') {
        const params = new URLSearchParams({
            page,
            limit,
            q: search
        });
        
        return fetch(`/api/admin/servers?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        }).then(handleApiResponse);
    },
    
    getServerDetails: function(serverId) {
        return fetch(`/api/admin/servers/${serverId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        }).then(handleApiResponse);
    },

    deleteServer: function(serverId) {
        return fetch(`/api/admin/servers/${serverId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },
    
    deleteUserServer: function(serverId) {
        return fetch(`/api/servers`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                server_id: serverId
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    updateServerSettings: function(serverId, formData) {
        return fetch(`/api/servers/${serverId}/settings`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    getServerMembers: function(serverId) {
        return fetch(`/api/servers/${serverId}/members`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    getServerRoles: function(serverId) {
        return fetch(`/api/servers/${serverId}/roles`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    promoteMember: function(serverId, userId) {
        return fetch(`/api/servers/${serverId}/members/${userId}/promote`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${response.status}`);
                }).catch(() => {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        });
    },

    demoteMember: function(serverId, userId) {
        return fetch(`/api/servers/${serverId}/members/${userId}/demote`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(handleApiResponse);
    },

    kickMember: function(serverId, userId) {
        return fetch(`/api/servers/${serverId}/members/${userId}/kick`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(handleApiResponse);
    },

    updateServerName: function(serverId, name) {
        return fetch(`/api/servers/${serverId}/update/name`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name })
        }).then(handleApiResponse);
    },

    updateServerDescription: function(serverId, description) {
        return fetch(`/api/servers/${serverId}/update/description`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ description: description })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    updateServerPublic: function(serverId, isPublic) {
        return fetch(`/api/servers/${serverId}/update/public`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_public: isPublic })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    updateServerCategory: function(serverId, category) {
        return fetch(`/api/servers/${serverId}/update/category`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ category: category })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    getServerChannels: function(serverId) {
        return fetch(`/api/servers/${serverId}/channels`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },

    getServerBundle: function(serverId) {
        return fetch(`/api/servers/${serverId}/details`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    generateInvite: function(serverId, options = {}) {
        return fetch(`/api/servers/${serverId}/invite`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(options)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    getExistingInvite: function(serverId) {
        return fetch(`/api/servers/${serverId}/invite`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    getUserServerMembership: function(serverId) {
        return fetch(`/api/servers/${serverId}/membership`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    joinServer: function(data) {
        const formData = new FormData();
        if (typeof data === 'object' && data.server_id) {
            formData.append('server_id', data.server_id);
        } else {
            formData.append('server_id', data);
        }

        return fetch('/api/servers/join', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        }).then(result => {
            if (result.success && result.redirect) {
                setTimeout(() => {
                    window.location.href = result.redirect;
                }, 100);
            }
            return result;
        });
    },

    leaveServer: function(serverId) {
        return fetch(`/api/servers/leave`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                server_id: serverId
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },
    
    getEligibleNewOwners: function(serverId) {
        return fetch(`/api/servers/${serverId}/eligible-new-owners`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },
    
    transferOwnershipAndLeave: function(serverId, newOwnerId = null) {
        const body = { server_id: serverId };
        if (newOwnerId) {
            body.new_owner_id = newOwnerId;
        }
        
        return fetch(`/api/servers/transfer-ownership`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },
    
    transferOwnership: function(serverId, newOwnerId) {
        if (!serverId || !newOwnerId) {
            return Promise.reject(new Error('Server ID and new owner ID are required'));
        }
        
        
        
        return fetch(`/api/servers/${serverId}/transfer-ownership`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                new_owner_id: newOwnerId
            })
        })
        .then(async response => {
            
            
            if (!response.ok) {
                let errorMessage = `HTTP error! Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError);
                    try {
                        const textResponse = await response.text();
                        console.error('Error response text:', textResponse);
                        if (textResponse.includes('Fatal error') || textResponse.includes('Parse error')) {
                            errorMessage = 'Server configuration error. Please contact support.';
                        }
                    } catch (textError) {
                        console.error('Failed to get error text:', textError);
                    }
                }
                throw new Error(errorMessage);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Transfer ownership request failed:', error);
            throw error;
        });
    },

    createChannel: function(serverId, channelData) {
        return fetch(`/api/servers/${serverId}/channels`, {
            method: 'POST',
            body: JSON.stringify(channelData),
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },

    updateChannel: function(serverId, channelId, channelData) {
        return fetch(`/api/servers/${serverId}/channels/${channelId}`, {
            method: 'PUT',
            body: JSON.stringify(channelData),
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },

    deleteChannel: function(serverId, channelId) {
        return fetch(`/api/servers/${serverId}/channels/${channelId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },

    createCategory: function(serverId, categoryData) {
        return fetch(`/api/servers/${serverId}/categories`, {
            method: 'POST',
            body: JSON.stringify(categoryData),
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },

    updateCategory: function(serverId, categoryId, categoryData) {
        return fetch(`/api/servers/${serverId}/categories/${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData),
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },

    deleteCategory: function(serverId, categoryId) {
        return fetch(`/api/servers/${serverId}/categories/${categoryId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },

    getInviteDetails: function(inviteCode) {
        return fetch(`/api/invites/${inviteCode}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        });
    },

    updateServerIcon: function(serverId, iconData) {
        const formData = new FormData();
        
        if (iconData instanceof Blob) {
            formData.append('icon', iconData, 'server_icon.png');
        } else {
            try {
                const blob = this.dataURLtoBlob(iconData);
                formData.append('icon', blob, 'server_icon.png');
            } catch (error) {
                console.error('Error converting data URL to blob:', error);
                return Promise.reject(new Error('Failed to process image data'));
            }
        }
        
        return fetch(`/api/servers/${serverId}/update/icon`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    updateServerBanner: function(serverId, bannerData) {
        const formData = new FormData();
        
        if (bannerData instanceof Blob) {
            formData.append('banner', bannerData, 'server_banner.png');
        } else {
            try {
                const blob = this.dataURLtoBlob(bannerData);
                formData.append('banner', blob, 'server_banner.png');
            } catch (error) {
                console.error('Error converting data URL to blob:', error);
                return Promise.reject(new Error('Failed to process image data'));
            }
        }
        
        return fetch(`/api/servers/${serverId}/update/banner`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },


    getExploreServers: function(page = 1, perPage = 6, sort = 'alphabetical', category = '', search = '') {
        return fetch('/api/servers/explore', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page: page,
                per_page: perPage,
                sort: sort,
                category: category,
                search: search
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        });
    },

    dataURLtoBlob: function(dataURL) {
        const arr = dataURL.split(',');
        if (arr.length < 2 || !arr[0].match(/:(.*?);/)) {
            throw new Error('Invalid Data URL');
        }
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], { type: mime });
    }
};

export default serverAPI;
window.serverAPI = serverAPI;