// THIS FILE IS DEPRECATED - DO NOT USE
// Use server-dropdown.js instead
console.error('server-menu.js is deprecated and should not be loaded');
    
    // Get server ID from URL
    const getServerId = () => {
        const urlPath = window.location.pathname;
        const matches = urlPath.match(/\/server\/(\d+)/);
        return matches ? matches[1] : null;
    };
    
    if (serverDropdownBtn && serverDropdown) {
        // Toggle dropdown when clicking the button
        serverDropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            serverDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            if (!serverDropdown.classList.contains('hidden')) {
                serverDropdown.classList.add('hidden');
            }
        });
        
        // Prevent clicks inside dropdown from closing it
        serverDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // Handle dropdown item clicks
        setupDropdownActions();
    }
    
    function setupDropdownActions() {
        // Get all dropdown items
        const dropdownItems = serverDropdown.querySelectorAll('.server-dropdown-item');
        
        dropdownItems.forEach(item => {
            const itemText = item.querySelector('span').textContent.trim();
            
            item.addEventListener('click', function() {
                const serverId = getServerId();
                
                if (!serverId) {
                    console.error('Server ID not found in URL');
                    return;
                }
                
                // Handle different dropdown actions
                switch (itemText) {
                    case 'Invite People':
                        handleInvitePeople(serverId);
                        break;
                    case 'Server Settings':
                        handleServerSettings(serverId);
                        break;
                    case 'Create Channel':
                        handleCreateChannel(serverId);
                        break;
                    case 'Create Category':
                        handleCreateCategory(serverId);
                        break;
                    case 'Notification Settings':
                        handleNotificationSettings(serverId);
                        break;
                    case 'Edit Per-server Profile':
                        handlePerServerProfile(serverId);
                        break;
                    case 'Leave Server':
                        handleLeaveServer(serverId);
                        break;
                }
                
                // Close dropdown after action
                serverDropdown.classList.add('hidden');
            });
        });
    }
    
    function handleInvitePeople(serverId) {
        // Create invite link modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-[#36393f] rounded-md p-6 max-w-md w-full shadow-xl">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold text-white">Invite People</h2>
                    <button id="close-invite-modal" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="mb-6">
                    <p class="text-gray-300 text-sm mb-2">Send this link to friends</p>
                    <div class="flex">
                        <input type="text" id="invite-link" class="bg-[#202225] text-white p-2.5 rounded-l flex-1 border-0 focus:ring-0 focus:outline-none text-sm" readonly>
                        <button id="copy-invite-link" class="bg-[#5865f2] text-white px-4 py-2.5 rounded-r hover:bg-[#4752c4] transition-colors text-sm">Copy</button>
                    </div>
                </div>
                <div class="flex justify-end border-t border-[#26282c] pt-4">
                    <button id="generate-new-link" class="bg-[#4f545c] text-white px-4 py-2 mr-2 rounded hover:bg-[#646970] transition-colors text-sm">Generate New Link</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Get existing invite link or generate new one
        generateInviteLink(serverId);
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Close modal with close button
        document.getElementById('close-invite-modal').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Copy invite link
        document.getElementById('copy-invite-link').addEventListener('click', function() {
            const inviteLink = document.getElementById('invite-link');
            inviteLink.select();
            document.execCommand('copy');
            this.textContent = 'Copied!';
            setTimeout(() => {
                this.textContent = 'Copy';
            }, 2000);
        });
        
        // Generate new invite link
        document.getElementById('generate-new-link').addEventListener('click', function() {
            generateInviteLink(serverId);
        });
    }
    
    function generateInviteLink(serverId) {
        fetch(`/api/servers/${serverId}/invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            // Check if the response is valid JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json().then(data => ({ ok: response.ok, data }));
            } else {
                // Handle non-JSON responses (likely HTML error pages)
                return response.text().then(text => {
                    throw new Error('Server returned non-JSON response. Likely a server error.');
                });
            }
        })
        .then(({ ok, data }) => {
            if (ok && data.success) {
                document.getElementById('invite-link').value = data.invite_url;
                showToast('New invite link generated!', 'success');
            } else {
                console.error('Error from server:', data);
                showToast(data.message || 'Error generating invite link', 'error');
            }
        })
        .catch(err => {
            console.error('Error generating invite link:', err);
            showToast('Network error or server issue. Please try again.', 'error');
        });
    }
    
    function handleServerSettings(serverId) {
        // Create server settings modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-[#36393f] rounded-md p-6 max-w-md w-full shadow-xl">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold text-white">Server Settings</h2>
                    <button id="close-settings-modal" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="server-settings-form" class="space-y-5">
                    <div>
                        <label class="block text-gray-300 text-xs font-medium uppercase tracking-wide mb-2">Server Name</label>
                        <input type="text" id="server-name" class="w-full bg-[#202225] text-white p-2.5 rounded border-0 focus:ring-1 focus:ring-[#5865f2] focus:outline-none text-sm" maxlength="100">
                    </div>
                    <div>
                        <label class="block text-gray-300 text-xs font-medium uppercase tracking-wide mb-2">Description <span class="text-gray-400 normal-case font-normal">(optional)</span></label>
                        <textarea id="server-description" class="w-full bg-[#202225] text-white p-2.5 rounded border-0 focus:ring-1 focus:ring-[#5865f2] focus:outline-none text-sm" rows="3" maxlength="1024"></textarea>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="server-is-public" class="w-4 h-4 bg-[#202225] border-0 focus:ring-0 focus:ring-offset-0 rounded mr-2">
                        <label class="text-gray-300 text-sm">Make server public</label>
                    </div>
                    <div class="flex justify-end border-t border-[#26282c] pt-4">
                        <button type="submit" class="bg-[#5865f2] text-white px-4 py-2 rounded hover:bg-[#4752c4] transition-colors text-sm">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fetch current server settings
        fetch(`/api/servers/${serverId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const { name, description, is_public } = data.server;
                    document.getElementById('server-name').value = name;
                    document.getElementById('server-description').value = description || '';
                    document.getElementById('server-is-public').checked = is_public;
                }
            })
            .catch(err => {
                console.error('Error fetching server settings:', err);
                showToast('Error fetching server settings', 'error');
            });
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Close modal with close button
        document.getElementById('close-settings-modal').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Handle form submission
        document.getElementById('server-settings-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('server-name').value;
            const description = document.getElementById('server-description').value;
            const isPublic = document.getElementById('server-is-public').checked;
            
            // Validate name
            if (!name.trim()) {
                showToast('Server name is required', 'error');
                return;
            }
            
            // Send update request
            fetch(`/api/servers/${serverId}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    server_id: serverId,
                    name,
                    description,
                    is_public: isPublic
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.body.removeChild(modal);
                    showToast('Server settings updated successfully');
                    
                    // Update server name in UI without reload
                    const serverNameEl = document.querySelector('.h-12.border-b h2');
                    if (serverNameEl) {
                        serverNameEl.textContent = name;
                    }
                } else {
                    showToast(data.message, 'error');
                }
            })
            .catch(err => {
                console.error('Error updating server settings:', err);
                showToast('Network error', 'error');
            });
        });
    }
    
    function handleCreateChannel(serverId) {
        // Create channel modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-discord-dark rounded-lg p-6 max-w-md w-full">
                <h2 class="text-xl font-bold text-white mb-4">Create Channel</h2>
                <form id="create-channel-form" class="space-y-4">
                    <div>
                        <label class="block text-discord-lighter mb-1">Channel Name</label>
                        <input type="text" id="channel-name" class="w-full bg-discord-darker text-white p-2 rounded" 
                               placeholder="lowercase-with-dashes">
                        <p class="text-xs text-discord-lighter mt-1">Only lowercase letters, numbers, hyphens, and underscores</p>
                    </div>
                    <div>
                        <label class="block text-discord-lighter mb-1">Channel Type</label>
                        <div class="flex space-x-4">
                            <label class="flex items-center">
                                <input type="radio" name="channel-type" value="text" checked class="mr-2">
                                <span class="text-discord-lighter">Text</span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" name="channel-type" value="voice" class="mr-2">
                                <span class="text-discord-lighter">Voice</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label class="block text-discord-lighter mb-1">Category</label>
                        <select id="channel-category" class="w-full bg-discord-darker text-white p-2 rounded">
                            <option value="">No Category</option>
                        </select>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="channel-is-private" class="mr-2">
                        <label class="text-discord-lighter">Private Channel</label>
                    </div>
                    <div class="flex justify-end mt-4">
                        <button type="button" id="close-channel-modal" class="bg-discord-darker text-white px-4 py-2 mr-2 rounded">Cancel</button>
                        <button type="submit" class="bg-discord-primary text-white px-4 py-2 rounded">Create Channel</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fetch categories for the select dropdown
        fetchCategories(serverId);
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Close modal with cancel button
        document.getElementById('close-channel-modal').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Handle form submission
        document.getElementById('create-channel-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('channel-name').value;
            const type = document.querySelector('input[name="channel-type"]:checked').value;
            const categoryId = document.getElementById('channel-category').value;
            const isPrivate = document.getElementById('channel-is-private').checked;
            
            // Validate name
            if (!name.trim()) {
                showToast('Channel name is required', 'error');
                return;
            }
            
            // Validate name format
            if (!/^[a-z0-9\-_]+$/.test(name)) {
                showToast('Channel name can only contain lowercase letters, numbers, hyphens, and underscores', 'error');
                return;
            }
            
            // Send create request
            const formData = new FormData();
            formData.append('server_id', serverId);
            formData.append('name', name);
            formData.append('type', type);
            if (categoryId) formData.append('category_id', categoryId);
            if (isPrivate) formData.append('is_private', '1');
            
            fetch('/api/channels', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.body.removeChild(modal);
                    showToast('Channel created successfully');
                    // Reload page to show new channel
                    window.location.reload();
                } else {
                    showToast(data.message, 'error');
                }
            })
            .catch(err => {
                console.error('Error creating channel:', err);
                showToast('Network error', 'error');
            });
        });
    }
    
    function fetchCategories(serverId) {
        const categorySelect = document.getElementById('channel-category');
        
        fetch(`/server/${serverId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.categories) {
                    data.categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        categorySelect.appendChild(option);
                    });
                }
            })
            .catch(err => {
                console.error('Error fetching categories:', err);
            });
    }
    
    function handleCreateCategory(serverId) {
        // Create category modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-discord-dark rounded-lg p-6 max-w-md w-full">
                <h2 class="text-xl font-bold text-white mb-4">Create Category</h2>
                <form id="create-category-form" class="space-y-4">
                    <div>
                        <label class="block text-discord-lighter mb-1">Category Name</label>
                        <input type="text" id="category-name" class="w-full bg-discord-darker text-white p-2 rounded" placeholder="GENERAL">
                        <p class="text-xs text-discord-lighter mt-1">Will be automatically converted to uppercase</p>
                    </div>
                    <div class="flex justify-end mt-4">
                        <button type="button" id="close-category-modal" class="bg-discord-darker text-white px-4 py-2 mr-2 rounded">Cancel</button>
                        <button type="submit" class="bg-discord-primary text-white px-4 py-2 rounded">Create Category</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Close modal with cancel button
        document.getElementById('close-category-modal').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Handle form submission
        document.getElementById('create-category-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('category-name').value;
            
            // Validate name
            if (!name.trim()) {
                showToast('Category name is required', 'error');
                return;
            }
            
            // Send create request
            const formData = new FormData();
            formData.append('server_id', serverId);
            formData.append('name', name.toUpperCase());
            
            fetch('/api/categories', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.body.removeChild(modal);
                    showToast('Category created successfully');
                    // Reload page to show new category
                    window.location.reload();
                } else {
                    showToast(data.message, 'error');
                }
            })
            .catch(err => {
                console.error('Error creating category:', err);
                showToast('Network error', 'error');
            });
        });
    }
    
    function handleNotificationSettings(serverId) {
        // Create notification settings modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-discord-dark rounded-lg p-6 max-w-md w-full">
                <h2 class="text-xl font-bold text-white mb-4">Notification Settings</h2>
                <form id="notification-settings-form" class="space-y-4">
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="radio" name="notification-type" value="all" class="mr-2">
                            <span class="text-white">All Messages</span>
                        </label>
                        <p class="text-xs text-discord-lighter ml-6">Receive notifications for all messages in this server</p>
                        
                        <label class="flex items-center">
                            <input type="radio" name="notification-type" value="mentions" class="mr-2">
                            <span class="text-white">Only @mentions</span>
                        </label>
                        <p class="text-xs text-discord-lighter ml-6">Receive notifications only when you are @mentioned</p>
                        
                        <label class="flex items-center">
                            <input type="radio" name="notification-type" value="muted" class="mr-2">
                            <span class="text-white">Nothing</span>
                        </label>
                        <p class="text-xs text-discord-lighter ml-6">Never receive notifications from this server</p>
                    </div>
                    
                    <div class="border-t border-discord-lighter/20 pt-4">
                        <h3 class="text-white font-medium mb-2">SUPPRESS</h3>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="checkbox" id="suppress-everyone" class="mr-2">
                                <span class="text-discord-lighter">@everyone and @here</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" id="suppress-roles" class="mr-2">
                                <span class="text-discord-lighter">Role @mentions</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="flex justify-end mt-4">
                        <button type="button" id="close-notification-modal" class="bg-discord-darker text-white px-4 py-2 mr-2 rounded">Cancel</button>
                        <button type="submit" class="bg-discord-primary text-white px-4 py-2 rounded">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fetch current notification settings
        fetch(`/api/servers/${serverId}/notifications`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const settings = data.notification_settings;
                    
                    if (settings.all_messages) {
                        document.querySelector('input[value="all"]').checked = true;
                    } else if (settings.muted) {
                        document.querySelector('input[value="muted"]').checked = true;
                    } else {
                        document.querySelector('input[value="mentions"]').checked = true;
                    }
                    
                    document.getElementById('suppress-everyone').checked = settings.suppress_everyone;
                    document.getElementById('suppress-roles').checked = settings.suppress_roles;
                }
            })
            .catch(err => {
                console.error('Error fetching notification settings:', err);
            });
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Close modal with cancel button
        document.getElementById('close-notification-modal').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Handle form submission
        document.getElementById('notification-settings-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const notificationType = document.querySelector('input[name="notification-type"]:checked').value;
            const suppressEveryone = document.getElementById('suppress-everyone').checked;
            const suppressRoles = document.getElementById('suppress-roles').checked;
            
            const settings = {
                server_id: serverId,
                all_messages: notificationType === 'all',
                mentions_only: notificationType === 'mentions',
                muted: notificationType === 'muted',
                suppress_everyone: suppressEveryone,
                suppress_roles: suppressRoles
            };
            
            // Send update request
            fetch(`/api/servers/${serverId}/notifications`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.body.removeChild(modal);
                    showToast('Notification settings updated successfully');
                } else {
                    showToast(data.message, 'error');
                }
            })
            .catch(err => {
                console.error('Error updating notification settings:', err);
                showToast('Network error', 'error');
            });
        });
    }
    
    function handlePerServerProfile(serverId) {
        // Create per-server profile modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-discord-dark rounded-lg p-6 max-w-md w-full">
                <h2 class="text-xl font-bold text-white mb-4">Server Profile</h2>
                <form id="server-profile-form" class="space-y-4">
                    <div>
                        <label class="block text-discord-lighter mb-1">Nickname</label>
                        <input type="text" id="server-nickname" class="w-full bg-discord-darker text-white p-2 rounded" placeholder="Leave blank to use your global username">
                    </div>
                    <div class="flex justify-end mt-4">
                        <button type="button" id="reset-nickname" class="bg-discord-darker text-white px-4 py-2 mr-2 rounded">Reset</button>
                        <button type="button" id="close-profile-modal" class="bg-discord-darker text-white px-4 py-2 mr-2 rounded">Cancel</button>
                        <button type="submit" class="bg-discord-primary text-white px-4 py-2 rounded">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fetch current server profile
        fetch(`/api/servers/${serverId}/profile`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('server-nickname').value = data.profile.nickname || '';
                }
            })
            .catch(err => {
                console.error('Error fetching server profile:', err);
            });
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Close modal with cancel button
        document.getElementById('close-profile-modal').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Reset nickname
        document.getElementById('reset-nickname').addEventListener('click', function() {
            document.getElementById('server-nickname').value = '';
        });
        
        // Handle form submission
        document.getElementById('server-profile-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nickname = document.getElementById('server-nickname').value;
            
            // Send update request
            fetch(`/api/servers/${serverId}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    server_id: serverId,
                    nickname: nickname
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.body.removeChild(modal);
                    showToast('Server profile updated successfully');
                    // You might want to update the UI to show the new nickname
                } else {
                    showToast(data.message, 'error');
                }
            })
            .catch(err => {
                console.error('Error updating server profile:', err);
                showToast('Network error', 'error');
            });
        });
    }
    
    function handleLeaveServer(serverId) {
        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-discord-dark rounded-lg p-6 max-w-md w-full">
                <h2 class="text-xl font-bold text-white mb-4">Leave Server</h2>
                <p class="text-discord-lighter mb-6">Are you sure you want to leave this server? You won't be able to rejoin unless you are invited again.</p>
                <div class="flex justify-end">
                    <button id="cancel-leave" class="bg-discord-darker text-white px-4 py-2 mr-2 rounded">Cancel</button>
                    <button id="confirm-leave" class="bg-red-500 text-white px-4 py-2 rounded">Leave Server</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Cancel leave
        document.getElementById('cancel-leave').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Confirm leave
        document.getElementById('confirm-leave').addEventListener('click', function() {
            fetch(`/api/servers/${serverId}/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Redirect to home
                    window.location.href = '/app';
                } else {
                    document.body.removeChild(modal);
                    showToast(data.message, 'error');
                }
            })
            .catch(err => {
                console.error('Error leaving server:', err);
                document.body.removeChild(modal);
                showToast('Network error', 'error');
            });
        });
    }
    
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        
        toast.className = `fixed bottom-4 right-4 p-3 rounded-md text-white z-50 flex items-center shadow-lg ${
            type === 'success' ? 'bg-[#43b581]' : 'bg-[#f04747]'
        }`;
        
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} mr-2"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        // Fade in animation
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);
        
        // Fade out and remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 200);
        }, 3000);
    }
}); 