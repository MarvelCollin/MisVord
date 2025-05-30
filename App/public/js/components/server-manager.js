/**
 * Server Management functionality for MiscVord
 * Handles server operations like create, join, leave, etc.
 */

import { MiscVordAjax } from '../core/ajax-handler.js';
import { showToast } from '../core/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    initServerManager();
});

/**
 * Initialize server management functionality
 */
function initServerManager() {
    // Create server form
    initCreateServerForm();
    
    // Join server form
    initJoinServerForm();
    
    // Leave server buttons
    initLeaveServerButtons();
    
    // Server settings form
    initServerSettingsForm();
}

/**
 * Initialize server creation form
 */
function initCreateServerForm() {
    const createServerForm = document.getElementById('create-server-form');
    
    if (createServerForm) {
        createServerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(createServerForm);
            
            MiscVordAjax.submitForm(createServerForm, {
                onSuccess: function(response) {
                    if (response.success) {
                        showToast('Server created successfully', 'success');
                        
                        // Close modal if exists
                        const modal = document.getElementById('create-server-modal');
                        if (modal && typeof closeModal === 'function') {
                            closeModal(modal);
                        }
                        
                        // Reset form
                        createServerForm.reset();
                        
                        // Redirect to new server or refresh server list
                        if (response.data && response.data.server && response.data.server.id) {
                            window.location.href = `/server/${response.data.server.id}`;
                        } else {
                            refreshServerList();
                        }
                    }
                }
            });
        });
    }
    
    // Image preview for server creation
    const serverImageInput = document.getElementById('server-image');
    const imagePreview = document.getElementById('server-image-preview');
    
    if (serverImageInput && imagePreview) {
        serverImageInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.classList.remove('hidden');
                }
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
}

/**
 * Initialize server join form
 */
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
            
            MiscVordAjax.post(`/join/${inviteCode}`, null, {
                onSuccess: function(response) {
                    if (response.success) {
                        showToast('Joined server successfully', 'success');
                        
                        // Close modal if exists
                        const modal = document.getElementById('join-server-modal');
                        if (modal && typeof closeModal === 'function') {
                            closeModal(modal);
                        }
                        
                        // Redirect to server or refresh server list
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

/**
 * Initialize leave server buttons
 */
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

/**
 * Leave a server
 * @param {string} serverId - ID of the server to leave
 */
function leaveServer(serverId) {
    MiscVordAjax.post(`/api/servers/${serverId}/leave`, null, {
        onSuccess: function(response) {
            if (response.success) {
                showToast('Left server successfully', 'success');
                
                // Redirect to app or refresh server list
                window.location.href = '/app';
            }
        }
    });
}

/**
 * Initialize server settings form
 */
function initServerSettingsForm() {
    const serverSettingsForm = document.getElementById('server-settings-form');
    
    if (serverSettingsForm) {
        serverSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(serverSettingsForm);
            const serverId = formData.get('server_id');
            
            MiscVordAjax.submitForm(serverSettingsForm, {
                onSuccess: function(response) {
                    if (response.success) {
                        showToast('Server settings updated successfully', 'success');
                        
                        // Close modal if exists
                        const modal = document.getElementById('server-settings-modal');
                        if (modal && typeof closeModal === 'function') {
                            closeModal(modal);
                        }
                        
                        // Update server name in UI
                        if (response.data && response.data.server) {
                            updateServerUI(response.data.server);
                        }
                    }
                }
            });
        });
    }
}

/**
 * Refresh server list in UI
 */
function refreshServerList() {
    MiscVordAjax.get('/api/servers', {
        onSuccess: function(response) {
            if (response.success && response.data && response.data.servers) {
                updateServerListUI(response.data.servers);
            }
        },
        // Don't show errors for this automatic refresh
        showToast: false
    });
}

/**
 * Update server list in the UI
 * @param {Array} servers - List of server objects
 */
function updateServerListUI(servers) {
    const serverList = document.querySelector('.server-list');
    
    if (serverList) {
        // Implementation depends on your UI structure
        // This is just a placeholder
        console.log('Server list would be updated with:', servers);
        
        // Reload the page as a fallback
        window.location.reload();
    }
}

/**
 * Update server details in the UI
 * @param {Object} server - Server object with updated data
 */
function updateServerUI(server) {
    // Update server name in header
    const serverNameElements = document.querySelectorAll('.server-name');
    serverNameElements.forEach(el => {
        if (el) {
            el.textContent = server.name;
        }
    });
    
    // Update server image if present
    if (server.image_url) {
        const serverImages = document.querySelectorAll('.server-image');
        serverImages.forEach(img => {
            if (img) {
                img.src = server.image_url;
            }
        });
    }
    
    // Update other UI elements as needed
} 