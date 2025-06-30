import { showToast } from '../../core/ui/toast.js';
if (typeof window !== 'undefined' && window.logger) {
    window.logger.info('server', 'server-dropdown.js loaded successfully - UPDATED VERSION');
}
window.SERVER_DROPDOWN_VERSION = '2.0';
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window !== 'undefined' && window.logger) {
        window.logger.debug('server', 'server-dropdown.js DOMContentLoaded triggered - UPDATED VERSION');
    }
    
    const isServerPage = document.getElementById('server-dropdown-btn') !== null;
    
    if (isServerPage) {
        const dropdownBtn = document.getElementById('server-dropdown-btn');
        const dropdown = document.getElementById('server-dropdown');
        console.log('Dropdown elements found:', { dropdownBtn: !!dropdownBtn, dropdown: !!dropdown });
        initServerDropdown();
        initServerActions();
    } else {
        console.log('Not on a server page, skipping server dropdown initialization');
    }
});

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

            const newBtn = dropdownBtn.cloneNode(true);
            dropdownBtn.parentNode.replaceChild(newBtn, dropdownBtn);

            newBtn.addEventListener('click', function(e) {
                console.log('Dropdown button clicked!');
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
                console.log('Dropdown visible:', !dropdown.classList.contains('hidden'));
            });

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

            const dropdown = document.getElementById('server-dropdown');
            if (dropdown) dropdown.classList.add('hidden');

            switch(actionText) {
                case 'Invite People':
                    showInvitePeopleModal();
                    break;
                case 'Server Settings':
                    redirectToServerSettings();
                    break;
                case 'Create Channel':
                    showCreateChannelModal();
                    break;
                case 'Create Category':
                    showCreateCategoryModal();
                    break;
                case 'Leave Server':
                    showLeaveServerConfirmation();
                    break;
            }
        });
    });
}

function showInvitePeopleModal() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('invite-people-modal');

    if (modal) {
        modal.classList.remove('hidden');
        modal.className = 'modal-overlay';
        
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.className = 'modal-container';
            
            const modalHeading = modal.querySelector('h2');
            if (modalHeading) {
                modalHeading.className = 'modal-header';
            }
            
            const closeBtn = document.getElementById('close-invite-modal');
            if (closeBtn) {
                closeBtn.className = 'close-modal-btn';
                
                if (!closeBtn.hasAttribute('data-listener')) {
                    closeBtn.addEventListener('click', () => closeModal('invite-people-modal'));
                    closeBtn.setAttribute('data-listener', 'true');
                }
            }
        }
        
        loadInviteLink(serverId);

        const copyBtn = document.getElementById('copy-invite-link');
        const generateBtn = document.getElementById('generate-new-invite');
        const expirationSelect = document.getElementById('invite-expiration');
        
        if (copyBtn && !copyBtn.hasAttribute('data-listener')) {
            copyBtn.className = 'btn btn-primary';
            copyBtn.addEventListener('click', copyInviteLink);
            copyBtn.setAttribute('data-listener', 'true');
        }

        if (generateBtn && !generateBtn.hasAttribute('data-listener')) {
            generateBtn.className = 'btn btn-primary';
            generateBtn.addEventListener('click', () => {
                const expirationValue = expirationSelect ? expirationSelect.value : null;
                generateNewInvite(serverId, expirationValue);
            });
            generateBtn.setAttribute('data-listener', 'true');
        }
        
        if (expirationSelect) {
            expirationSelect.className = 'form-select';
        }

        const inviteLinkInput = document.getElementById('invite-link');
        if (inviteLinkInput) {
            inviteLinkInput.className = 'form-input';
        }
    }
}



function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

function showCreateChannelModal() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('create-channel-modal');

    if (modal) {
        if (typeof window.openCreateChannelModal === 'function') {
            window.openCreateChannelModal();
        } else {
            modal.classList.remove('hidden');
            modal.className = 'modal-overlay animate-fade-in';
            
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.className = 'modal-container animate-scale-in';
                
                modalContent.innerHTML = `
                    <h2 class="modal-header">Create Channel</h2>
                    <button id="close-create-channel-modal" class="close-modal-btn">&times;</button>
                    
                    <form id="create-channel-form" class="channel-form">
                        <div class="form-group">
                            <label class="form-label">Channel Type</label>
                            <div class="select-wrapper">
                                <select id="channel-type" class="form-select">
                                    <option value="text">Text</option>
                                    <option value="voice">Voice</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Channel Name</label>
                            <div class="channel-input-prefix">
                                <span>#</span>
                                <input type="text" id="channel-name" placeholder="new-channel">
                            </div>
                            <div class="form-help-text">Use lowercase letters, numbers, hyphens, and underscores</div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <div class="select-wrapper">
                                <select id="channel-category" class="form-select">
                                    <option value="">No Category</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="checkbox-container">
                            <input type="checkbox" id="private-channel" class="form-checkbox">
                            <label for="private-channel" class="checkbox-label">Private Channel</label>
                            <span class="info-icon" title="Only specific members will be able to see this channel"><i class="fas fa-info-circle"></i></span>
                        </div>
                        
                        <div class="button-container">
                            <button type="button" id="cancel-create-channel" class="btn btn-cancel">Cancel</button>
                            <button type="submit" id="create-channel-btn" class="btn btn-primary">Create Channel</button>
                        </div>
                    </form>
                `;
                
                const closeBtn = modalContent.querySelector('#close-create-channel-modal');
                const cancelBtn = modalContent.querySelector('#cancel-create-channel');
                const nameInput = modalContent.querySelector('#channel-name');
                const form = modalContent.querySelector('#create-channel-form');
                
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => closeModal('create-channel-modal'));
                }
                
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => closeModal('create-channel-modal'));
                }
                
                if (nameInput) {
                    nameInput.addEventListener('input', function() {
                        this.value = this.value.toLowerCase().replace(/[^a-z0-9\-_]/g, '');
                    });
                }
                
                if (form) {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        createChannel(e, serverId);
                    });
                }
                
                loadCategories(serverId);
            }
        }
    } else {
        console.error('Create channel modal not found');
    }
}

function showCreateCategoryModal() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('create-category-modal');

    if (modal) {
        if (typeof window.openCreateCategoryModal === 'function') {
            window.openCreateCategoryModal();
        } else {
            modal.classList.remove('hidden');
            modal.className = 'modal-overlay animate-fade-in';
            
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.className = 'modal-container animate-scale-in';
                
                modalContent.innerHTML = `
                    <h2 class="modal-header">Create Category</h2>
                    <button id="close-create-category-modal" class="close-modal-btn">&times;</button>
                    
                    <form id="create-category-form">
                        <div class="form-group">
                            <label for="category-name" class="form-label">Category Name</label>
                            <input type="text" id="category-name" class="form-input" placeholder="NEW CATEGORY">
                            <div class="form-help-text">Category names are typically displayed in uppercase</div>
                        </div>
                        
                        <div class="button-container">
                            <button type="button" id="cancel-create-category" class="btn btn-cancel">Cancel</button>
                            <button type="submit" id="create-category-btn" class="btn btn-primary">Create Category</button>
                        </div>
                    </form>
                `;
                
                const closeBtn = modalContent.querySelector('#close-create-category-modal');
                const cancelBtn = modalContent.querySelector('#cancel-create-category');
                const form = modalContent.querySelector('#create-category-form');
                
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => closeModal('create-category-modal'));
                }
                
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => closeModal('create-category-modal'));
                }
                
                if (form) {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        createCategory(e, serverId);
                    });
                }
            }
        }
    } else {
        console.error('Create category modal not found');
    }
}





function showLeaveServerConfirmation() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('leave-server-modal');

    if (modal) {
        modal.classList.remove('hidden');

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

function loadInviteLink(serverId) {
    const inviteLinkInput = document.getElementById('invite-link');
    const expirationInfo = document.getElementById('invite-expiration-info');
    
    if (inviteLinkInput) {
        inviteLinkInput.value = "Loading...";
        inviteLinkInput.disabled = true;
    }

    if (!window.serverAPI) {
        console.error('serverAPI not available');
        if (inviteLinkInput) {
            inviteLinkInput.value = 'Error: API not available';
            inviteLinkInput.disabled = false;
        }
        return;
    }

    window.serverAPI.getExistingInvite(serverId)
        .then(data => {
            console.log('Existing invite response:', data);
            
            if (data.success && data.data && data.data.invite_code) {
                const inviteUrl = data.data.invite_url || `${window.location.origin}/join/${data.data.invite_code}`;
                
                if (inviteLinkInput) {
                    inviteLinkInput.value = inviteUrl;
                    inviteLinkInput.disabled = false;
                }
                
                if (expirationInfo) {
                    if (data.data.expires_at) {
                        const expiryDate = new Date(data.data.expires_at);
                        expirationInfo.textContent = `Expires: ${expiryDate.toLocaleString()}`;
                        expirationInfo.classList.remove('hidden');
                    } else {
                        expirationInfo.textContent = 'Never expires';
                        expirationInfo.classList.remove('hidden');
                    }
                }
                
                console.log('Loaded existing invite:', inviteUrl);
            } else if (data.success && data.data && data.data.invite_code === null) {
                generateNewInvite(serverId);
            } else {
                throw new Error(data.message || 'Failed to load invite link');
            }
        })
        .catch(error => {
            console.error('Error loading invite link:', error);
            generateNewInvite(serverId);
        });
}

function copyInviteLink() {
    const input = document.getElementById('invite-link');
    input.select();
    document.execCommand('copy');
    showToast('Invite link copied to clipboard!', 'success');
}

function generateNewInvite(serverId, expirationValue = null) {
    console.log('generateNewInvite called with serverId:', serverId);

    const generateBtn = document.getElementById('generate-new-invite');
    const originalText = generateBtn.textContent;
    generateBtn.textContent = 'Generating...';
    generateBtn.disabled = true;

    const options = {};
    if (expirationValue) {
        if (expirationValue === 'never') {
            
        } else if (expirationValue === 'hour') {
            options.expires_in = 1;
        } else if (expirationValue === 'day') {
            options.expires_in = 24;
        } else if (expirationValue === 'week') {
            options.expires_in = 168; 
        } else if (expirationValue === 'month') {
            options.expires_in = 720; 
        }
    }

    window.serverAPI.generateInvite(serverId, options)
        .then(data => {
            console.log('Invite generation response:', data);
            
            
            if (data && (data.data || data.invite_code || (data.data && data.data.invite_code))) {
                let inviteCode = data.invite_code;
                let inviteUrl = data.invite_url;
                let expiresAt = data.expires_at;
                
                
                if (!inviteCode && data.data && data.data.invite_code) {
                    inviteCode = data.data.invite_code;
                }

                if (!inviteUrl && data.data && data.data.invite_url) {
                    inviteUrl = data.data.invite_url;
                }
                
                if (!expiresAt && data.data && data.data.expires_at) {
                    expiresAt = data.data.expires_at;
                }
                
                
                if (!inviteUrl && inviteCode) {
                    inviteUrl = `${window.location.origin}/join/${inviteCode}`;
                }

                if (inviteUrl) {
                    const inviteLinkInput = document.getElementById('invite-link');
                    if (inviteLinkInput) {
                        inviteLinkInput.value = inviteUrl;
                        inviteLinkInput.disabled = false;
                        inviteLinkInput.select(); 
                    }
                    
                    const expirationInfo = document.getElementById('invite-expiration-info');
                    if (expirationInfo) {
                        if (expiresAt) {
                            const expiryDate = new Date(expiresAt);
                            expirationInfo.textContent = `Expires: ${expiryDate.toLocaleString()}`;
                            expirationInfo.classList.remove('hidden');
                        } else {
                            expirationInfo.textContent = 'Never expires';
                            expirationInfo.classList.remove('hidden');
                        }
                    }

                    showToast('New invite link generated!', 'success');
                } else {
                    throw new Error('Invalid response: invite URL not found');
                }
            } else {
                throw new Error(data.message || 'Failed to generate invite link');
            }
        })
        .catch(error => {
            console.error('Error generating invite:', error);
            showToast(`Failed to generate new invite link: ${error.message}`, 'error');
            
            const inviteLinkInput = document.getElementById('invite-link');
            if (inviteLinkInput) {
                inviteLinkInput.value = 'Error generating invite link';
                inviteLinkInput.disabled = false;
            }
        })
        .finally(() => {
            if (generateBtn) {
                generateBtn.textContent = originalText;
                generateBtn.disabled = false;
            }
        });
}

function loadCategories(serverId) {
    serverAPI.getServerChannels(serverId)
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

    channelAPI.createChannel(formData)
        .then(data => {
            if (data.data) {
                showToast('Channel created at the bottom of the list!', 'success');
                closeModal('create-channel-modal');
                resetForm('create-channel-form');

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

function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

function createCategory(e, serverId) {
    e.preventDefault();

    const formData = new FormData(e.target);
    formData.append('server_id', serverId);
    
    channelAPI.createCategory(formData)
        .then(data => {
            if (data.data) {
                showToast('Category created at the bottom of the list!', 'success');
                closeModal('create-category-modal');

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





function leaveServer(serverId) {
    if (!window.serverAPI) {
        showToast('Server API not available', 'error');
        return;
    }
    
    window.serverAPI.leaveServer(serverId)
        .then(data => {
            if (data.success) {
                showToast(data.message || 'You have left the server', 'success');
                closeModal('leave-server-modal');

                setTimeout(() => {
                    if (data.redirect) {
                        window.location.href = data.redirect;
                    } else {
                        window.location.href = '/home';
                    }
                }, 1000);
            } else {
                throw new Error(data.message || 'Failed to leave server');
            }
        })
        .catch(error => {
            console.error('Error leaving server:', error);
            
            if (error.message && error.message.includes('ownership')) {
                showTransferOwnershipModal(serverId);
                closeModal('leave-server-modal');
            } else {
                showToast('Failed to leave server: ' + error.message, 'error');
            }
        });
}

function showTransferOwnershipModal(serverId) {
    const modal = document.getElementById('transfer-ownership-modal');
    if (!modal) {
        console.error('Transfer ownership modal not found');
        return;
    }
    
    modal.classList.remove('hidden');
    
    const newOwnerSelect = document.getElementById('new-owner-select');
    const confirmTransferBtn = document.getElementById('confirm-transfer-ownership');
    const confirmDeleteBtn = document.getElementById('confirm-delete-server');
    
    if (confirmTransferBtn) {
        confirmTransferBtn.disabled = true;
    }
    
    if (newOwnerSelect) {
        newOwnerSelect.innerHTML = '<option value="">Loading members...</option>';
        
        window.serverAPI.getEligibleNewOwners(serverId)
            .then(data => {
                if (data.success) {
                    if (data.should_delete_server) {
                        showDeleteServerMode(data.server_name);
                    } else if (data.members && data.members.length > 0) {
                        showTransferOwnershipMode();
                        populateMembersList(data.members);
                    } else {
                        showDeleteServerMode(data.server_name);
                    }
                } else {
                    newOwnerSelect.innerHTML = '<option value="">Error loading members</option>';
                    console.error('Failed to load eligible members:', data.message);
                }
            })
            .catch(error => {
                console.error('Error loading eligible members:', error);
                newOwnerSelect.innerHTML = '<option value="">Error loading members</option>';
            });
    }
    
    setupTransferOwnershipListeners(serverId);
    setupDeleteServerListeners(serverId);
}

function showTransferOwnershipMode() {
    document.getElementById('transfer-content').classList.remove('hidden');
    document.getElementById('delete-content').classList.add('hidden');
    document.getElementById('member-selection').classList.remove('hidden');
    document.getElementById('confirm-transfer-ownership').classList.remove('hidden');
    document.getElementById('confirm-delete-server').classList.add('hidden');
}

function showDeleteServerMode(serverName) {
    document.getElementById('transfer-content').classList.add('hidden');
    document.getElementById('delete-content').classList.remove('hidden');
    document.getElementById('member-selection').classList.add('hidden');
    document.getElementById('confirm-transfer-ownership').classList.add('hidden');
    document.getElementById('confirm-delete-server').classList.remove('hidden');
    
    const confirmDeleteBtn = document.getElementById('confirm-delete-server');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.disabled = false;
    }
}

function populateMembersList(members) {
    const newOwnerSelect = document.getElementById('new-owner-select');
    
    newOwnerSelect.innerHTML = '<option value="">Select new owner...</option>';
    
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = `${member.display_name || member.username} (${member.role})`;
        newOwnerSelect.appendChild(option);
    });
}

function setupTransferOwnershipListeners(serverId) {
    const confirmTransferBtn = document.getElementById('confirm-transfer-ownership');
    
    if (confirmTransferBtn && !confirmTransferBtn.hasAttribute('data-transfer-listener')) {
        confirmTransferBtn.addEventListener('click', function() {
            const newOwnerId = document.getElementById('new-owner-select').value;
            
            if (!newOwnerId) {
                showToast('Please select a new owner', 'error');
                return;
            }
            
            transferOwnershipAndLeave(serverId, newOwnerId);
        });
        confirmTransferBtn.setAttribute('data-transfer-listener', 'true');
    }
}

function setupDeleteServerListeners(serverId) {
    const confirmDeleteBtn = document.getElementById('confirm-delete-server');
    
    if (confirmDeleteBtn && !confirmDeleteBtn.hasAttribute('data-delete-listener')) {
        confirmDeleteBtn.addEventListener('click', function() {
            deleteServerAndLeave(serverId);
        });
        confirmDeleteBtn.setAttribute('data-delete-listener', 'true');
    }
}

function deleteServerAndLeave(serverId) {
    const deleteBtn = document.getElementById('confirm-delete-server');
    
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Deleting Server...';
    }
    
    if (!window.serverAPI) {
        showToast('Server API not available', 'error');
        return;
    }
    
    window.serverAPI.transferOwnershipAndLeave(serverId, null)
        .then(response => {
            if (response.success) {
                if (response.server_deleted) {
                    showToast('Server deleted successfully', 'success');
                } else {
                    showToast(response.message || 'Server deleted successfully', 'success');
                }
                
                closeModal('transfer-ownership-modal');
                
                setTimeout(() => {
                    if (response.redirect) {
                        window.location.href = response.redirect;
                    } else {
                        window.location.href = '/home';
                    }
                }, 1000);
            } else {
                showToast(response.message || 'Failed to delete server', 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting server:', error);
            showToast('Failed to delete server: ' + error.message, 'error');
        })
        .finally(() => {
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.textContent = 'Delete Server & Leave';
            }
        });
}

function transferOwnershipAndLeave(serverId, newOwnerId) {
    const transferBtn = document.getElementById('confirm-transfer-ownership');
    
    if (transferBtn) {
        transferBtn.disabled = true;
        transferBtn.textContent = 'Transferring...';
    }
    
    if (!window.serverAPI) {
        showToast('Server API not available', 'error');
        return;
    }
    
    window.serverAPI.transferOwnershipAndLeave(serverId, newOwnerId)
        .then(response => {
            if (response.success) {
                showToast(response.message || 'Ownership transferred successfully', 'success');
                
                closeModal('transfer-ownership-modal');
                
                setTimeout(() => {
                    if (response.redirect) {
                        window.location.href = response.redirect;
                    } else {
                        window.location.href = '/home';
                    }
                }, 1000);
            } else {
                showToast(response.message || 'Failed to transfer ownership', 'error');
            }
        })
        .catch(error => {
            console.error('Error transferring ownership:', error);
            showToast('Failed to transfer ownership: ' + error.message, 'error');
        })
        .finally(() => {
            if (transferBtn) {
                transferBtn.disabled = false;
                transferBtn.textContent = 'Transfer & Leave';
            }
        });
}

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
        modal.classList.add('animate-fade-out');
        modal.classList.remove('animate-fade-in');
        
        const modalContent = modal.querySelector('.modal-container');
        if (modalContent) {
            modalContent.classList.add('animate-scale-out');
            modalContent.classList.remove('animate-scale-in');
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            
            if (modalContent) {
                modalContent.classList.remove('animate-scale-out');
            }
            
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }, 300);
    }
}

function showToastMessage(message, type = 'success') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        } text-white`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

function refreshChannelList(serverId) {
    if (typeof window.loadChannels === 'function') {
        window.loadChannels(serverId);
        return;
    }

    const channelContainer = document.getElementById('channel-container');
    if (!channelContainer) return;

    serverAPI.getServerChannels(serverId)
        .then(data => {
            if (data.data) {
                console.log('Channels loaded successfully');
                window.location.reload();
            } else {
                console.error('Error loading channels:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching channels:', error);
        });
}

function redirectToServerSettings() {
    const serverId = getCurrentServerId();
    if (serverId) {
        window.location.href = `/settings-server?server_id=${serverId}&section=profile`;
    } else {
        console.error('Cannot redirect to server settings: Server ID not found');
        showToast('Error: Could not determine server ID', 'error');
    }
}