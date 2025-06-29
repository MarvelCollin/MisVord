import { showToast } from '../../core/ui/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    initServerManager();
});

function initServerManager() {
    ensureServerDataLoaded();
    initCreateServerForm();
    initJoinServerForm();
    initLeaveServerButtons();
    initServerSettingsForm();
}

function ensureServerDataLoaded() {
    const isServerPage = window.location.pathname.includes('/server/');
    if (isServerPage) {
        const serverId = window.location.pathname.split('/server/')[1].split('/')[0];
        
        if (serverId) {
            const serverContainer = document.querySelector('.server-list-container');
            
            if (serverContainer && serverContainer.children.length === 0) {
                window.serverAPI.getServer(serverId)
                    .then(response => {
                        if (response.data) {
                            console.log('Server data loaded successfully');
                            
                            return window.serverAPI.getServerChannels(serverId);
                        }
                    })
                    .then(channelResponse => {
                        if (channelResponse && channelResponse.data) {
                            console.log('Channels loaded successfully');
                            if (typeof window.channelManager !== 'undefined' && 
                                typeof window.channelManager.renderChannelList === 'function') {
                                window.channelManager.renderChannelList(channelResponse.data);
                            }
                        }
                    })
                    .catch(error => {
                        console.error('Error loading server/channel data:', error);
                    });
            }
        }
    }
}

function initCreateServerForm() {
    const serverImageInput = document.getElementById('server-image');
    const imagePreview = document.getElementById('server-image-preview');

    if (serverImageInput && imagePreview) {
        if (!serverImageInput.hasAttribute('data-listener-added')) {
            serverImageInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    const reader = new FileReader();

                    reader.onload = function(e) {
                        imagePreview.innerHTML = `<img src="${e.target.result}" alt="Server Image" class="w-full h-full object-cover">`;
                    }

                    reader.readAsDataURL(this.files[0]);
                }
            });
            serverImageInput.setAttribute('data-listener-added', 'true');
        }
    }
}

async function initJoinServerForm() {
    const joinServerForm = document.getElementById('join-server-form');

    if (joinServerForm) {
        joinServerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const inviteCode = document.getElementById('invite-code').value.trim();

            if (!inviteCode) {
                showToast('Please enter an invite code', 'error');
                return;
            }

            try {
                const response = await fetch(`/join/${inviteCode}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.data) {
                    showToast('Joined server successfully', 'success');

                    const modal = document.getElementById('join-server-modal');
                    if (modal && typeof closeModal === 'function') {
                        closeModal(modal);
                    }

                    if (data.data && data.data.redirect) {
                        window.location.href = data.data.redirect;
                    } else if (data.data && data.data.server && data.data.server.id) {
                        window.location.href = `/server/${data.data.server.id}`;
                    } else {
                        refreshServerList();
                    }
                } else {
                    showToast(data.message || 'Failed to join server', 'error');
                }
            } catch (error) {
                console.error('Error joining server:', error);
                showToast('Error joining server', 'error');
            }
        });
    }
}

function initLeaveServerButtons() {
    const leaveServerButtons = document.querySelectorAll('[data-leave-server]');

    leaveServerButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            const serverId = this.getAttribute('data-leave-server');
            const serverName = this.getAttribute('data-server-name') || 'this server';

            if (confirm(`Are you sure you want to leave ${serverName}?`)) {
                leaveServer(serverId);
            }
        });
    });
}

async function leaveServer(serverId) {
    try {
        const response = await fetch(`/api/servers/${serverId}/leave`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.data) {
            showToast('Left server successfully', 'success');
            window.location.href = '/home';
        } else {
            showToast(data.message || 'Failed to leave server', 'error');
        }
    } catch (error) {
        console.error('Error leaving server:', error);
        showToast('Error leaving server', 'error');
    }
}

async function initServerSettingsForm() {
    const serverSettingsForm = document.getElementById('server-settings-form');

    if (serverSettingsForm) {
        serverSettingsForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(serverSettingsForm);
            const serverId = formData.get('server_id');

            try {
                const response = await fetch(serverSettingsForm.action || window.location.href, {
                    method: serverSettingsForm.method || 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.data) {
                    showToast('Server settings updated successfully', 'success');

                    const modal = document.getElementById('server-settings-modal');
                    if (modal && typeof closeModal === 'function') {
                        closeModal(modal);
                    }

                    if (data.data && data.data.server) {
                        updateServerUI(data.data.server);
                    }
                } else {
                    showToast(data.message || 'Failed to update server settings', 'error');
                }
            } catch (error) {
                console.error('Error updating server settings:', error);
                showToast('Error updating server settings', 'error');
            }
        });
    }
}

function refreshServerList() {
    if (window.serverAPI) {
        window.serverAPI.getServers()
            .then(response => {
                if (response.data && response.data.servers) {
                    updateServerListUI(response.data.servers);
                }
            })
            .catch(error => {
                console.error('Error refreshing server list:', error);
            });
    } else {
        window.location.reload();
    }
}

function updateServerListUI(servers) {
    const serverList = document.querySelector('.server-list');

    if (serverList) {
        console.log('Server list would be updated with:', servers);
        window.location.reload();
    }
}

function updateServerUI(server) {
    const serverNameElements = document.querySelectorAll('.server-name');
    serverNameElements.forEach(el => {
        if (el) {
            el.textContent = server.name;
        }
    });

    if (server.image_url) {
        const serverImages = document.querySelectorAll('.server-image');
        serverImages.forEach(img => {
            if (img) {
                img.src = server.image_url;
            }
        });
    }
}