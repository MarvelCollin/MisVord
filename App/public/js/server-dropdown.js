// Server Dropdown Functionality - UPDATED VERSION
console.log('server-dropdown.js loaded successfully - UPDATED VERSION');
window.SERVER_DROPDOWN_VERSION = '2.0';
document.addEventListener('DOMContentLoaded', function() {
    console.log('server-dropdown.js DOMContentLoaded triggered - UPDATED VERSION');
    
    // Check if elements exist
    const dropdownBtn = document.getElementById('server-dropdown-btn');
    const dropdown = document.getElementById('server-dropdown');
    console.log('Dropdown elements found:', { dropdownBtn: !!dropdownBtn, dropdown: !!dropdown });
      initServerDropdown();
    initServerActions();
});

// Global test function for debugging
window.testDropdown = function() {
    console.log('Testing dropdown...');
    const btn = document.getElementById('server-dropdown-btn');
    const dropdown = document.getElementById('server-dropdown');
    
    console.log('Test results:', {
        button: !!btn,
        dropdown: !!dropdown,
        buttonVisible: btn ? !btn.style.display || btn.style.display !== 'none' : false,
        dropdownHidden: dropdown ? dropdown.classList.contains('hidden') : false
    });
    
    if (btn && dropdown) {
        dropdown.classList.toggle('hidden');
        console.log('Toggled dropdown, now hidden:', dropdown.classList.contains('hidden'));
    }
    
    return { btn, dropdown };
};

function initServerDropdown() {
    console.log('initServerDropdown called');
    
    // Wait a bit to ensure DOM is fully loaded
    setTimeout(() => {
        const dropdownBtn = document.getElementById('server-dropdown-btn');
        const dropdown = document.getElementById('server-dropdown');
        
        console.log('Elements after timeout:', { 
            dropdownBtn: !!dropdownBtn, 
            dropdown: !!dropdown,
            dropdownBtnElement: dropdownBtn,
            dropdownElement: dropdown
        });
        
        if (dropdownBtn && dropdown) {
            console.log('Setting up dropdown functionality');
            
            // Clear any existing listeners
            const newBtn = dropdownBtn.cloneNode(true);
            dropdownBtn.parentNode.replaceChild(newBtn, dropdownBtn);
            
            // Add click handler
            newBtn.addEventListener('click', function(e) {
                console.log('Dropdown button clicked!');
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
                console.log('Dropdown visible:', !dropdown.classList.contains('hidden'));
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!dropdown.contains(e.target) && !newBtn.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            });
            
            console.log('Dropdown setup complete');
            
        } else {
            console.error('Dropdown elements not found!');
            console.log('All buttons:', document.querySelectorAll('button'));
            console.log('All elements with server in id:', document.querySelectorAll('[id*="server"]'));
        }
    }, 100);
}

function initServerActions() {
    const dropdownItems = document.querySelectorAll('.server-dropdown-item');
    
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const actionText = this.querySelector('span').textContent.trim();
            
            // Close dropdown
            const dropdown = document.getElementById('server-dropdown');
            if (dropdown) dropdown.classList.add('hidden');
            
            switch(actionText) {
                case 'Invite People':
                    showInvitePeopleModal();
                    break;
                case 'Server Settings':
                    showServerSettingsModal();
                    break;
                case 'Create Channel':
                    showCreateChannelModal();
                    break;
                case 'Create Category':
                    showCreateCategoryModal();
                    break;
                case 'Notification Settings':
                    showNotificationSettingsModal();
                    break;
                case 'Edit Per-server Profile':
                    showEditProfileModal();
                    break;
                case 'Leave Server':
                    showLeaveServerConfirmation();
                    break;
            }
        });
    });
}

// Modal Functions
function showInvitePeopleModal() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('invite-people-modal');
    
    if (modal) {
        modal.classList.remove('hidden');
        loadInviteLink(serverId);
        
        // Add event listeners if not already added
        const copyBtn = document.getElementById('copy-invite-link');
        const generateBtn = document.getElementById('generate-new-invite');
        const closeBtn = document.getElementById('close-invite-modal');
        
        if (copyBtn && !copyBtn.hasAttribute('data-listener')) {
            copyBtn.addEventListener('click', copyInviteLink);
            copyBtn.setAttribute('data-listener', 'true');
        }
        
        if (generateBtn && !generateBtn.hasAttribute('data-listener')) {
            generateBtn.addEventListener('click', () => generateNewInvite(serverId));
            generateBtn.setAttribute('data-listener', 'true');
        }
        
        if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
            closeBtn.addEventListener('click', () => closeModal('invite-people-modal'));
            closeBtn.setAttribute('data-listener', 'true');
        }
    }
}

function showServerSettingsModal() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('server-settings-modal');
    
    if (modal) {
        modal.classList.remove('hidden');
        loadServerSettings(serverId);
        
        // Add event listeners if not already added
        const form = document.getElementById('server-settings-form');
        const closeBtn = document.getElementById('close-server-settings-modal');
        const cancelBtn = document.getElementById('cancel-server-settings');
        
        if (form && !form.hasAttribute('data-listener')) {
            form.addEventListener('submit', (e) => updateServerSettings(e, serverId));
            form.setAttribute('data-listener', 'true');
        }
        
        if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
            closeBtn.addEventListener('click', () => closeModal('server-settings-modal'));
            closeBtn.setAttribute('data-listener', 'true');
        }
        
        if (cancelBtn && !cancelBtn.hasAttribute('data-listener')) {
            cancelBtn.addEventListener('click', () => closeModal('server-settings-modal'));
            cancelBtn.setAttribute('data-listener', 'true');
        }
    }
}

function showCreateChannelModal() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('create-channel-modal');
    
    if (modal) {
        modal.classList.remove('hidden');
        
        // Add event listeners if not already added
        const form = document.getElementById('create-channel-form');
        const closeBtn = document.getElementById('close-create-channel-modal');
        const cancelBtn = document.getElementById('cancel-create-channel');
        const nameInput = document.getElementById('channel-name');
        
        if (form && !form.hasAttribute('data-listener')) {
            form.addEventListener('submit', (e) => createChannel(e, serverId));
            form.setAttribute('data-listener', 'true');
        }
        
        if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
            closeBtn.addEventListener('click', () => closeModal('create-channel-modal'));
            closeBtn.setAttribute('data-listener', 'true');
        }
        
        if (cancelBtn && !cancelBtn.hasAttribute('data-listener')) {
            cancelBtn.addEventListener('click', () => closeModal('create-channel-modal'));
            cancelBtn.setAttribute('data-listener', 'true');
        }
        
        // Add name validation
        if (nameInput && !nameInput.hasAttribute('data-listener')) {
            nameInput.addEventListener('input', function() {
                this.value = this.value.toLowerCase().replace(/[^a-z0-9\-_]/g, '');
            });
            nameInput.setAttribute('data-listener', 'true');
        }
    }
}

function showCreateCategoryModal() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('create-category-modal');
    
    if (modal) {
        modal.classList.remove('hidden');
        
        // Add event listeners if not already added
        const form = document.getElementById('create-category-form');
        const closeBtn = document.getElementById('close-create-category-modal');
        const cancelBtn = document.getElementById('cancel-create-category');
        
        if (form && !form.hasAttribute('data-listener')) {
            form.addEventListener('submit', (e) => createCategory(e, serverId));
            form.setAttribute('data-listener', 'true');
        }
        
        if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
            closeBtn.addEventListener('click', () => closeModal('create-category-modal'));
            closeBtn.setAttribute('data-listener', 'true');
        }
        
        if (cancelBtn && !cancelBtn.hasAttribute('data-listener')) {
            cancelBtn.addEventListener('click', () => closeModal('create-category-modal'));
            cancelBtn.setAttribute('data-listener', 'true');
        }
    }
}

function showNotificationSettingsModal() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('notification-settings-modal');
    
    if (modal) {
        modal.classList.remove('hidden');
        loadNotificationSettings(serverId);
        
        // Add event listeners if not already added
        const form = document.getElementById('notification-settings-form');
        const closeBtn = document.getElementById('close-notification-settings-modal');
        const cancelBtn = document.getElementById('cancel-notification-settings');
        
        if (form && !form.hasAttribute('data-listener')) {
            form.addEventListener('submit', (e) => updateNotificationSettings(e, serverId));
            form.setAttribute('data-listener', 'true');
        }
        
        if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
            closeBtn.addEventListener('click', () => closeModal('notification-settings-modal'));
            closeBtn.setAttribute('data-listener', 'true');
        }
        
        if (cancelBtn && !cancelBtn.hasAttribute('data-listener')) {
            cancelBtn.addEventListener('click', () => closeModal('notification-settings-modal'));
            cancelBtn.setAttribute('data-listener', 'true');
        }
    }
}

function showEditProfileModal() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('edit-profile-modal');
      if (modal) {
        modal.classList.remove('hidden');
        loadPerServerProfile(serverId);
        
        // Add event listeners if not already added
        const form = document.getElementById('edit-profile-form');
        const closeBtn = document.getElementById('close-edit-profile-modal');
        const cancelBtn = document.getElementById('cancel-edit-profile');
          if (form && !form.hasAttribute('data-listener')) {
            form.addEventListener('submit', (e) => updatePerServerProfile(e, serverId));
            form.setAttribute('data-listener', 'true');
        }
        
        if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
            closeBtn.addEventListener('click', () => closeModal('edit-profile-modal'));
            closeBtn.setAttribute('data-listener', 'true');
        }
          if (cancelBtn && !cancelBtn.hasAttribute('data-listener')) {
            cancelBtn.addEventListener('click', () => closeModal('edit-profile-modal'));
            cancelBtn.setAttribute('data-listener', 'true');
        }
    }
}

function showLeaveServerConfirmation() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('leave-server-modal');
    
    if (modal) {
        modal.classList.remove('hidden');
        
        // Add event listeners if not already added
        const confirmBtn = document.getElementById('confirm-leave-server');
        const closeBtn = document.getElementById('close-leave-server-modal');
        const cancelBtn = document.getElementById('cancel-leave-server');
        
        if (confirmBtn && !confirmBtn.hasAttribute('data-listener')) {
            confirmBtn.addEventListener('click', () => leaveServer(serverId));
            confirmBtn.setAttribute('data-listener', 'true');
        }
        
        if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
            closeBtn.addEventListener('click', () => closeModal('leave-server-modal'));
            closeBtn.setAttribute('data-listener', 'true');
        }
        
        if (cancelBtn && !cancelBtn.hasAttribute('data-listener')) {
            cancelBtn.addEventListener('click', () => closeModal('leave-server-modal'));
            cancelBtn.setAttribute('data-listener', 'true');
        }
    }
}

// API Functions
function loadInviteLink(serverId) {
    // Load existing invite link
    fetch(`/api/servers/${serverId}`)
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                return response.text().then(text => {
                    console.error('Server returned HTML instead of JSON:', text);
                    throw new Error('Server error - received HTML response instead of JSON');
                });
            }
        })
        .then(data => {
            if (data.success && data.server.invite_link) {
                const fullInviteLink = `${window.location.origin}/join/${data.server.invite_link}`;
                document.getElementById('invite-link').value = fullInviteLink;
            }
        })
        .catch(error => {
            console.error('Error loading invite link:', error);
            showToast('Failed to load invite link', 'error');
        });
}

function copyInviteLink() {
    const input = document.getElementById('invite-link');
    input.select();
    document.execCommand('copy');
    showToast('Invite link copied to clipboard!', 'success');
}

function generateNewInvite(serverId) {
    console.log('generateNewInvite called from server-dropdown.js with serverId:', serverId);
    fetch(`/api/servers/${serverId}/invite`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            return response.text().then(text => {
                console.error('Server returned HTML instead of JSON:', text);
                throw new Error('Server error - received HTML response instead of JSON');
            });
        }
    })
    .then(data => {
        if (data.success) {
            const fullInviteLink = `${window.location.origin}/join/${data.invite_code}`;
            document.getElementById('invite-link').value = fullInviteLink;
            showToast('New invite link generated!', 'success');
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error('Error generating invite:', error);
        showToast('Failed to generate new invite link', 'error');
    });
}

function loadServerSettings(serverId) {
    fetch(`/api/servers/${serverId}`)
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                return response.text().then(text => {
                    console.error('Server returned HTML instead of JSON:', text);
                    throw new Error('Server error - received HTML response instead of JSON');
                });
            }
        })
        .then(data => {
            if (data.success) {
                const server = data.server;
                document.getElementById('settings-server-name').value = server.name || '';
                document.getElementById('settings-server-description').value = server.description || '';
                document.getElementById('settings-server-public').checked = server.is_public || false;
            }
        })
        .catch(error => {
            console.error('Error loading server settings:', error);
            showToast('Failed to load server settings', 'error');
        });
}

function updateServerSettings(e, serverId) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        server_id: serverId,
        name: formData.get('name'),
        description: formData.get('description'),
        is_public: formData.has('is_public')
    };
    
    fetch(`/api/servers/${serverId}/settings`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            return response.text().then(text => {
                console.error('Server returned HTML instead of JSON:', text);
                throw new Error('Server error - received HTML response instead of JSON');
            });
        }
    })
    .then(data => {
        if (data.success) {
            showToast('Server settings updated successfully!', 'success');
            closeModal('server-settings-modal');
            // Refresh page to show updated server name
            setTimeout(() => window.location.reload(), 1000);
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error('Error updating server settings:', error);
        showToast('Failed to update server settings', 'error');
    });
}

function loadCategories(serverId) {
    fetch(`/api/servers/${serverId}/channels`)
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                return response.text().then(text => {
                    console.error('Server returned HTML instead of JSON:', text);
                    throw new Error('Server error - received HTML response instead of JSON');
                });
            }
        })
        .then(data => {
            const categorySelect = document.getElementById('channel-category');
            categorySelect.innerHTML = '<option value="">No Category</option>';
            
            if (data.categories) {
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading categories:', error);
        });
}

function createChannel(e, serverId) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    formData.append('server_id', serverId);
    
    fetch('/api/channels', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            return response.text().then(text => {
                console.error('Server returned HTML instead of JSON:', text);
                throw new Error('Server error - received HTML response instead of JSON');
            });
        }
    })
    .then(data => {
        if (data.success) {
            showToast('Channel created successfully!', 'success');
            closeModal('create-channel-modal');
            resetForm('create-channel-form');
            
            // Refresh channels list using AJAX
            refreshChannelList(serverId);
        } else {
            showToast('Error: ' + (data.message || 'Something went wrong!'), 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error creating channel. Please try again.', 'error');
    });
}

function createCategory(e, serverId) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    formData.append('server_id', serverId);
      fetch('/api/categories', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            return response.text().then(text => {
                console.error('Server returned HTML instead of JSON:', text);
                throw new Error('Server error - received HTML response instead of JSON');
            });
        }
    })
    .then(data => {
        if (data.success) {
            showToast('Category created successfully!', 'success');
            closeModal('create-category-modal');
            // Refresh page to show new category
            setTimeout(() => window.location.reload(), 1000);
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error('Error creating category:', error);
        showToast('Failed to create category', 'error');
    });
}

function loadNotificationSettings(serverId) {
    fetch(`/api/servers/${serverId}/notifications`)
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                return response.text().then(text => {
                    console.error('Server returned HTML instead of JSON:', text);
                    throw new Error('Server error - received HTML response instead of JSON');
                });
            }
        })
        .then(data => {
            if (data.success && data.settings) {
                const settings = data.settings;
                
                // Set notification type
                if (settings.all_messages) {
                    document.querySelector('input[value="all_messages"]').checked = true;
                } else if (settings.muted) {
                    document.querySelector('input[value="muted"]').checked = true;
                } else {
                    document.querySelector('input[value="mentions_only"]').checked = true;
                }
                
                // Set checkboxes
                document.getElementById('suppress-everyone').checked = settings.suppress_everyone || false;
                document.getElementById('suppress-roles').checked = settings.suppress_roles || false;
            }
        })
        .catch(error => {
            console.error('Error loading notification settings:', error);
        });
}

function updateNotificationSettings(e, serverId) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const notificationType = formData.get('notification_type');
    
    const data = {
        server_id: serverId,
        all_messages: notificationType === 'all_messages',
        mentions_only: notificationType === 'mentions_only',
        muted: notificationType === 'muted',
        suppress_everyone: formData.has('suppress_everyone'),
        suppress_roles: formData.has('suppress_roles')
    };
      fetch(`/api/servers/${serverId}/notifications`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            return response.text().then(text => {
                console.error('Server returned HTML instead of JSON:', text);
                throw new Error('Server error - received HTML response instead of JSON');
            });
        }
    })
    .then(data => {
        if (data.success) {
            showToast('Notification settings updated!', 'success');
            closeModal('notification-settings-modal');
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error('Error updating notification settings:', error);
        showToast('Failed to update notification settings', 'error');
    });
}

function loadPerServerProfile(serverId) {
    fetch(`/api/servers/${serverId}/profile`)
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                return response.text().then(text => {
                    console.error('Server returned HTML instead of JSON:', text);
                    throw new Error('Server error - received HTML response instead of JSON');
                });
            }
        })
        .then(data => {
            if (data.success && data.profile) {
                document.getElementById('profile-nickname').value = data.profile.nickname || '';
            }
        })
        .catch(error => {
            console.error('Error loading server profile:', error);
        });
}

function updatePerServerProfile(e, serverId) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        server_id: serverId,
        nickname: formData.get('nickname')
    };
    
    fetch(`/api/servers/${serverId}/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            return response.text().then(text => {
                console.error('Server returned HTML instead of JSON:', text);
                throw new Error('Server error - received HTML response instead of JSON');
            });
        }
    })
    .then(data => {
        if (data.success) {
            showToast('Server profile updated!', 'success');
            closeModal('edit-profile-modal');
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error('Error updating server profile:', error);
        showToast('Failed to update server profile', 'error');
    });
}

function leaveServer(serverId) {
    fetch(`/api/servers/${serverId}/leave`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            return response.text().then(text => {
                console.error('Server returned HTML instead of JSON:', text);
                throw new Error('Server error - received HTML response instead of JSON');
            });
        }
    })
    .then(data => {
        if (data.success) {
            showToast('You have left the server', 'success');
            closeModal('leave-server-modal');
            // Redirect to home page
            setTimeout(() => window.location.href = '/home', 1000);
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error('Error leaving server:', error);
        showToast('Failed to leave server', 'error');
    });
}

// Utility Functions
function getCurrentServerId() {
    const path = window.location.pathname;
    const match = path.match(/\/server\/(\d+)/);
    const serverId = match ? match[1] : null;
    console.log('getCurrentServerId - path:', path, 'serverId:', serverId);
    return serverId;
}

function getCurrentServerName() {
    const serverNameElement = document.querySelector('h2.font-bold.text-white');
    return serverNameElement ? serverNameElement.textContent : 'Server';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

function showToast(message, type = 'info') {
    // Get or create toast container
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `px-6 py-3 rounded-lg text-white transform transition-all duration-300 translate-x-full opacity-0 ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 
        'bg-blue-600'
    }`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// Helper function to load channels via AJAX
// This function is used after creating a channel to refresh the list
function refreshChannelList(serverId) {
    // Check if the channel-loader.js has already defined a global loadChannels function
    if (typeof window.loadChannels === 'function') {
        window.loadChannels(serverId);
        return;
    }
    
    // Fallback implementation if the function isn't available
    const channelContainer = document.getElementById('channel-container');
    if (!channelContainer) return;
    
    fetch(`/api/servers/${serverId}/channels`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Channels loaded successfully');
                // If we got here without the channel-loader.js, just reload the page
                window.location.reload();
            } else {
                console.error('Error loading channels:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching channels:', error);
        });
}
