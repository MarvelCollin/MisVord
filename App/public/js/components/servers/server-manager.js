import { MisVordAjax } from '../../core/ajax/ajax-handler.js';
import { showToast } from '../../core/ui/toast.js';
import { ServerAPI } from '../../api/server-api.js';

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
            
            // Check if we need to load server data            if (serverContainer && serverContainer.children.length === 0) {
                ServerAPI.getServer(serverId)
                    .then(response => {
                        if (response.success) {
                            console.log('Server data loaded successfully');
                            
                            return ServerAPI.getServerChannels(serverId);
                        }
                    })
                    .then(channelResponse => {
                        if (channelResponse && channelResponse.success) {
                            console.log('Channels loaded successfully');
                            if (typeof window.channelLoader !== 'undefined' && 
                                typeof window.channelLoader.renderChannels === 'function') {
                                const container = document.querySelector('.channel-list-container');
                                if (container) {
                                    window.channelLoader.renderChannels(container, channelResponse.data);
                                }
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

function initJoinServerForm() {
    const joinServerForm = document.getElementById('join-server-form');

    if (joinServerForm) {
        joinServerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const inviteCode = document.getElementById('invite-code').value.trim();

            if (!inviteCode) {
                showToast('Please enter an invite code', 'error');
                return;
            }

            MisVordAjax.post(`/join/${inviteCode}`, null, {
                onSuccess: function(response) {
                    if (response.success) {
                        showToast('Joined server successfully', 'success');

                        const modal = document.getElementById('join-server-modal');
                        if (modal && typeof closeModal === 'function') {
                            closeModal(modal);
                        }

                        if (response.data && response.data.redirect) {
                            window.location.href = response.data.redirect;
                        } else if (response.data && response.data.server && response.data.server.id) {
                            window.location.href = `/server/${response.data.server.id}`;
                        } else {
                            refreshServerList();
                        }
                    }
                }
            });
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

function leaveServer(serverId) {
    MisVordAjax.post(`/api/servers/${serverId}/leave`, null, {
        onSuccess: function(response) {
            if (response.success) {
                showToast('Left server successfully', 'success');

                window.location.href = '/app';
            }
        }
    });
}

function initServerSettingsForm() {
    const serverSettingsForm = document.getElementById('server-settings-form');

    if (serverSettingsForm) {
        serverSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(serverSettingsForm);
            const serverId = formData.get('server_id');

            MisVordAjax.submitForm(serverSettingsForm, {
                onSuccess: function(response) {
                    if (response.success) {
                        showToast('Server settings updated successfully', 'success');

                        const modal = document.getElementById('server-settings-modal');
                        if (modal && typeof closeModal === 'function') {
                            closeModal(modal);
                        }

                        if (response.data && response.data.server) {
                            updateServerUI(response.data.server);
                        }
                    }
                }
            });
        });
    }
}

function refreshServerList() {
    ServerAPI.getServers()
        .then(response => {
            if (response.success && response.data && response.data.servers) {
                updateServerListUI(response.data.servers);
            }
        })
        .catch(error => {
            console.error('Error refreshing server list:', error);
        });
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