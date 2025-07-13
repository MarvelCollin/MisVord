import { showToast } from '../../core/ui/toast.js';

if (typeof window !== 'undefined' && window.logger) {
    window.logger.info('server', 'server-dropdown.js loaded successfully - FIXED VERSION');
}

window.SERVER_DROPDOWN_VERSION = '3.0';

let currentUserRole = null;
let isInitialized = false;

function waitForServerAPI() {
    return new Promise((resolve) => {
        if (window.serverAPI) {
            resolve();
            return;
        }
        
        const checkAPI = setInterval(() => {
            if (window.serverAPI) {
                clearInterval(checkAPI);
                resolve();
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkAPI);
            console.warn('serverAPI not available after timeout');
            resolve();
        }, 5000);
    });
}

async function getUserRole(serverId) {
    if (!serverId) {
        console.error('No server ID provided for role check');
        return 'member';
    }

    try {
        await waitForServerAPI();
        
        if (!window.serverAPI) {
            console.warn('serverAPI not available, defaulting to member role');
            return 'member';
        }

        const response = await window.serverAPI.getUserServerMembership(serverId);
        
        if (response && response.success && response.data && response.data.is_member) {
            const role = response.data.membership.role || 'member';
            currentUserRole = role;

            return role;
        } else {
            currentUserRole = 'non-member';

            return 'non-member';
        }
    } catch (error) {
        console.error('❌ Error fetching user role:', error);
        currentUserRole = 'member';
        return 'member';
    }
}

function isAdminOrOwner(role) {
    const validRole = role || currentUserRole || 'member';
    return validRole === 'admin' || validRole === 'owner';
}

function applyRoleBasedVisibility(userRole) {

    
    const adminOnlyItems = [
        'Invite People',
        'Server Settings', 
        'Create Channel'
    ];

    const dropdownItems = document.querySelectorAll('.server-dropdown-item');

    
    dropdownItems.forEach(item => {
        const spanElement = item.querySelector('span');
        if (!spanElement) {
            console.warn('Dropdown item missing span element:', item);
            return;
        }
        
        const actionText = spanElement.textContent.trim();

        
        if (adminOnlyItems.includes(actionText)) {
            if (userRole === 'non-member' || !isAdminOrOwner(userRole)) {
                item.style.display = 'none';
                item.setAttribute('data-role-restricted', 'true');

            } else {
                item.style.display = 'flex';
                item.setAttribute('data-role-restricted', 'false');

            }
        } else if (actionText === 'Leave Server') {
            if (userRole === 'non-member') {
                item.style.display = 'none';
                item.setAttribute('data-role-restricted', 'true');

            } else {
                item.style.display = 'flex';
                item.setAttribute('data-role-restricted', 'false');

            }
        } else {
            item.style.display = 'flex';
            item.setAttribute('data-role-restricted', 'false');

        }
    });
    

}

async function initServerDropdown() {

    
    const dropdown = document.getElementById('server-dropdown');
    if (dropdown && dropdown.hasAttribute('data-actions-initialized')) {
        dropdown.removeAttribute('data-actions-initialized');
    }
    
    isInitialized = false;

    const dropdownBtn = document.getElementById('server-dropdown-btn');

    if (!dropdownBtn || !dropdown) {
        console.error('Dropdown elements not found!', {
            dropdownBtn: !!dropdownBtn,
            dropdown: !!dropdown
        });
        return;
    }

    if (!dropdownBtn.hasAttribute('data-initialized')) {
        dropdownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('hidden');

        });
        dropdownBtn.setAttribute('data-initialized', 'true');
    }

    if (!document.documentElement.hasAttribute('data-dropdown-outside-click')) {
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target) && !dropdownBtn.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
        document.documentElement.setAttribute('data-dropdown-outside-click', 'true');
    }

    const serverId = getCurrentServerId();
    if (serverId) {
        try {
            const role = await getUserRole(serverId);
            applyRoleBasedVisibility(role);
        } catch (error) {
            console.error('Error fetching role:', error);
            applyRoleBasedVisibility('member');
        }
    } else {
        applyRoleBasedVisibility('member');
    }

    initServerActions();
    isInitialized = true;

}

function initServerActions() {
    const dropdown = document.getElementById('server-dropdown');
    if (!dropdown) {
        return;
    }
    
    if (dropdown.hasAttribute('data-actions-initialized')) {
        dropdown.removeAttribute('data-actions-initialized');
    }

    dropdown.addEventListener('click', function(e) {
        const item = e.target.closest('.server-dropdown-item');
        if (!item) return;
        
        e.preventDefault();
        
        const spanElement = item.querySelector('span');
        if (!spanElement) return;
        
        const actionText = spanElement.textContent.trim();


        dropdown.classList.add('hidden');

        executeDropdownAction(actionText);
    });
    
    dropdown.setAttribute('data-actions-initialized', 'true');

}

function executeDropdownAction(actionText) {


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
                case 'Leave Server':
                    showLeaveServerConfirmation();
                    break;
        default:
            console.warn('Unknown dropdown action:', actionText);
    }
}

function getCurrentServerId() {
    const path = window.location.pathname;
    const match = path.match(/\/server\/(\d+)/);
    const serverId = match ? match[1] : null;

    
    if (!serverId) {
        console.warn('Server ID not found in URL path. Expected format: /server/{id}');
    }
    
    return serverId;
}

function getCurrentUserId() {
    try {
        if (window.currentUser && window.currentUser.id) {
            return window.currentUser.id;
        }
        const userElement = document.querySelector('[data-user-id]');
        if (userElement && userElement.dataset.userId) {
            return userElement.dataset.userId;
        }
        return null;
    } catch (e) {
        console.error('Error getting current user ID:', e);
        return null;
    }
}

function showInvitePeopleModal() {
    const modal = document.getElementById('invite-people-modal');
    if (!modal) {
        console.error('Invite people modal not found');
        return;
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    
    const serverId = getCurrentServerId();
    if (serverId && window.serverAPI) {
        loadInviteLink(serverId);
    }
    

    if (!document.getElementById('invite-bot-btn')) {
        const invitePeopleModal = document.getElementById('invite-people-modal');
        const modalContent = invitePeopleModal.querySelector('.bg-discord-background > div');
        const generateLinkButton = modalContent.querySelector('#generate-new-invite').parentElement;

        const separator = document.createElement('div');
        separator.className = 'mt-4 pt-4 border-t border-gray-700';
        
        const botButtonContainer = document.createElement('div');
        botButtonContainer.className = 'flex justify-center';
        
        const inviteBotBtn = document.createElement('button');
        inviteBotBtn.id = 'invite-bot-btn';
        inviteBotBtn.className = 'w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-300';
        inviteBotBtn.innerHTML = '<i class="fas fa-robot mr-2"></i> Invite TitiBot';
        
        botButtonContainer.appendChild(inviteBotBtn);
        separator.appendChild(botButtonContainer);
        generateLinkButton.parentElement.appendChild(separator);

        inviteBotBtn.addEventListener('click', showInviteBotModal);
    }
    
    setupInviteModalListeners();
}

function showInviteBotModal() {

    fetchAndInviteTitiBot();
}

async function fetchAndInviteTitiBot() {
    try {
        showToast('Searching for TitiBot...', 'info');
        

        const response = await fetch('/api/bots/public-check/titibot');
        const result = await response.json();

        if (result.success && result.exists && result.is_bot) {

            showToast('Found TitiBot, adding to server...', 'info');
            const botId = result.bot.id;
            await inviteBotToServer(botId);
        } else {

            showToast('TitiBot not found in the database. Please contact an administrator.', 'error');
        }
    } catch (error) {
        console.error('Error searching for TitiBot:', error);
        showToast('Failed to search for TitiBot. Please try again later.', 'error');
    }
}

function showCreateChannelModal() {
    if (typeof window.openCreateChannelModal === 'function') {
        window.openCreateChannelModal();
    } else {
        console.error('openCreateChannelModal function not available');
    }
}

async function showLeaveServerConfirmation() {
    const modal = document.getElementById('leave-server-modal');
    if (!modal) {
        console.error('Leave server modal not found');
        return;
    }

    const serverId = getCurrentServerId();
    if (!serverId) {
        showToast('Could not identify the server.', 'error');
        return;
    }
    
    const serverName = document.querySelector('.server-name')?.textContent || 'this server';
    modal.querySelectorAll('.server-name-to-confirm').forEach(el => el.textContent = serverName);

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    
    const userRole = await getUserRole(serverId);
    const memberView = document.getElementById('leave-server-member-view');
    const ownerView = document.getElementById('leave-server-owner-view');

    if (userRole === 'owner') {
        memberView.classList.add('hidden');
        ownerView.classList.remove('hidden');
        setupOwnerLeaveFlow(serverId);
    } else {
        ownerView.classList.add('hidden');
        memberView.classList.remove('hidden');
        setupMemberLeaveFlow(serverId);
    }
}

function setupMemberLeaveFlow(serverId) {
    const confirmBtn = document.getElementById('confirm-leave-server');
    const cancelBtn = document.getElementById('cancel-leave-server');
    const closeBtn = document.getElementById('close-leave-server-modal');

    const handleLeave = () => leaveServer(serverId, false);

    confirmBtn.onclick = handleLeave;
    cancelBtn.onclick = () => closeModal('leave-server-modal');
    closeBtn.onclick = () => closeModal('leave-server-modal');
}

async function setupOwnerLeaveFlow(serverId) {
    const transferView = document.getElementById('leave-server-transfer-view');
    const deleteView = document.getElementById('leave-server-delete-view');
    const searchInput = document.getElementById('owner-transfer-user-search');
    const usersContainer = document.getElementById('owner-transfer-users-container');
    const selectedUserContainer = document.getElementById('owner-transfer-selected-user-container');
    const confirmTransferBtn = document.getElementById('confirm-owner-transfer');
    let selectedUserId = null;


    const closeButtons = [
        document.getElementById('close-leave-server-modal'),
        document.getElementById('cancel-owner-leave'),
        document.getElementById('cancel-delete-leave'),
    ];
    closeButtons.forEach(btn => btn.onclick = () => closeModal('leave-server-modal'));


    try {
        await waitForServerAPI();
        if (!window.serverAPI) throw new Error('serverAPI not available');

        const response = await window.serverAPI.getServerMembers(serverId);
        const members = response?.members || (response?.data?.members) || [];
        const memberships = response?.memberships || (response?.data?.memberships) || {};
        const currentUserId = getCurrentUserId();
        const otherMembers = members.filter(m => m.id !== currentUserId);

        if (otherMembers.length > 0) {
            transferView.classList.remove('hidden');
            deleteView.classList.add('hidden');
        } else {
            transferView.classList.add('hidden');
            deleteView.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error checking members:', error);

        transferView.classList.remove('hidden');
        deleteView.classList.add('hidden');
        showToast('Could not verify member count. Please try again.', 'error');
    }


    const searchUsers = debounce(async (query) => {
        if (query.length < 2) {
            usersContainer.classList.add('hidden');
            return;
        }

        try {

            const response = await window.serverAPI.getServerMembers(serverId);
            const members = response?.members || (response?.data?.members) || [];
            const memberships = response?.memberships || (response?.data?.memberships) || {};
            const currentUserId = getCurrentUserId();


            const filteredMembers = members.filter(member => 
                member.id !== currentUserId && 
                (member.username.toLowerCase().includes(query.toLowerCase()) || 
                 (member.display_name || '').toLowerCase().includes(query.toLowerCase()))
            );

            if (filteredMembers.length > 0) {
                usersContainer.innerHTML = filteredMembers.map(user => {

                    let role = 'Member';
                    

                    if (memberships && memberships[user.id]) {
                        role = memberships[user.id].role || role;
                    } else if (user.membership && user.membership.role) {
                        role = user.membership.role;
                    } else if (user.role) {
                        role = user.role;
                    }
                    

                    role = role.charAt(0).toUpperCase() + role.slice(1);
                    
                    return `
                    <div class="user-item" 
                         data-user-id="${user.id}" 
                         data-user-name="${user.username}" 
                         data-user-role="${role}"
                         data-user-avatar="${user.avatar_url || '/public/assets/common/default-profile-picture.png'}">
                        <img src="${user.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                             alt="${user.username}">
                        <div class="user-info">
                            <span class="user-name">${user.username}</span>
                            <span class="user-role">${role}</span>
                        </div>
                    </div>
                `}).join('');
            } else {
                usersContainer.innerHTML = '<div class="p-2 text-discord-lighter">No users found</div>';
            }
            usersContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error searching users:', error);
            usersContainer.innerHTML = '<div class="p-2 text-discord-red">Error searching for users</div>';
            usersContainer.classList.remove('hidden');
        }
    }, 300);


    searchInput.addEventListener('input', (e) => searchUsers(e.target.value));


    usersContainer.addEventListener('click', (e) => {
        const userDiv = e.target.closest('[data-user-id]');
        if (userDiv) {
            selectedUserId = userDiv.dataset.userId;
            const userName = userDiv.dataset.userName;
            const userRole = userDiv.dataset.userRole || 'Member';
            const userAvatar = userDiv.dataset.userAvatar || '/public/assets/common/default-profile-picture.png';
            
            document.getElementById('owner-transfer-selected-user-name').textContent = userName;
            document.getElementById('owner-transfer-selected-user-avatar').src = userAvatar;
            

            const roleElement = document.getElementById('owner-transfer-selected-user-role');
            if (roleElement) {
                roleElement.innerHTML = `<span class="text-discord-lighter">Current role: ${userRole}</span> • <span class="text-discord-green">Will become owner</span>`;
            }
            
            selectedUserContainer.classList.remove('hidden');
            usersContainer.classList.add('hidden');
            searchInput.value = '';
            confirmTransferBtn.disabled = false;
            confirmTransferBtn.classList.remove('cursor-not-allowed', 'opacity-50');
        }
    });


    confirmTransferBtn.onclick = async () => {
        if (!selectedUserId) {
            showToast('Please select a member to transfer ownership to.', 'error');
            return;
        }
        await transferOwnershipAndLeave(serverId, selectedUserId);
    };

    document.getElementById('confirm-delete-leave').onclick = () => leaveServer(serverId, true);
}

async function transferOwnershipAndLeave(serverId, newOwnerId) {
    try {
        if (!serverId || !newOwnerId) {
            showToast('Missing required information for ownership transfer.', 'error');
            return;
        }


        const confirmBtn = document.getElementById('confirm-owner-transfer');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Transferring...';
            confirmBtn.classList.add('opacity-50');
        }

        const response = await window.serverAPI.transferOwnership(serverId, newOwnerId);
        
        
        if (response && response.success) {
            showToast('Ownership transferred successfully. You can now leave the server.', 'success');
            
            try {
                await leaveServer(serverId, false);
            } catch (leaveError) {
                console.error('Error leaving server after transfer:', leaveError);
                showToast('Ownership transferred, but could not leave server automatically. Please try leaving manually.', 'warning');
                

                closeModal('leave-server-modal');
                

                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        } else {

            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Transfer Ownership & Leave';
                confirmBtn.classList.remove('opacity-50');
            }
            
            showToast(response?.message || 'Failed to transfer ownership.', 'error');
        }
    } catch (error) {
        console.error('Transfer ownership error:', error);
        

        const confirmBtn = document.getElementById('confirm-owner-transfer');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Transfer Ownership & Leave';
            confirmBtn.classList.remove('opacity-50');
        }
        
        showToast(error.message || 'An error occurred during ownership transfer.', 'error');
    }
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

function setupInviteModalListeners() {
    const closeBtn = document.getElementById('close-invite-modal');
    if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
        closeBtn.addEventListener('click', () => {
            const modal = document.getElementById('invite-people-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        });
        closeBtn.setAttribute('data-listener', 'true');
    }

    const copyBtn = document.getElementById('copy-invite-link');
    if (copyBtn && !copyBtn.hasAttribute('data-listener')) {
        copyBtn.addEventListener('click', copyInviteLink);
        copyBtn.setAttribute('data-listener', 'true');
    }

    const generateBtn = document.getElementById('generate-new-invite');
    if (generateBtn && !generateBtn.hasAttribute('data-listener')) {
        generateBtn.addEventListener('click', handleGenerateNewInvite);
        generateBtn.setAttribute('data-listener', 'true');
    }


    const inviteBotBtn = document.getElementById('invite-bot-btn');
    if (inviteBotBtn && !inviteBotBtn.hasAttribute('data-listener')) {
        inviteBotBtn.addEventListener('click', showInviteBotModal);
        inviteBotBtn.setAttribute('data-listener', 'true');
    }

    setupExpirationOptions();
}

function setupLeaveServerModalListeners() {

}

async function loadInviteLink(serverId) {
    const inviteLinkInput = document.getElementById('invite-link');
    if (!inviteLinkInput) return;
    
        inviteLinkInput.value = "Loading...";
        inviteLinkInput.disabled = true;

    try {
        await waitForServerAPI();

    if (!window.serverAPI) {
            throw new Error('serverAPI not available');
        }

        const data = await window.serverAPI.getExistingInvite(serverId);
            
            if (data.success && data.data && data.data.invite_code) {
                const inviteUrl = data.data.invite_url || `${window.location.origin}/join/${data.data.invite_code}`;
                    inviteLinkInput.value = inviteUrl;
                    inviteLinkInput.disabled = false;
                    } else {
                generateNewInvite(serverId);
            }
    } catch (error) {
            console.error('Error loading invite link:', error);
            generateNewInvite(serverId);
    }
}

function copyInviteLink() {
    const input = document.getElementById('invite-link');
    if (!input) return;
    
    input.select();
    document.execCommand('copy');
    showToast('Invite link copied to clipboard!', 'success');
}

async function generateNewInvite(serverId, expirationValue = null) {
    const generateBtn = document.getElementById('generate-new-invite');
    const inviteLinkInput = document.getElementById('invite-link');
    
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
    }

    if (inviteLinkInput) {
        inviteLinkInput.value = 'Generating...';
        inviteLinkInput.disabled = true;
    }

    try {
        await waitForServerAPI();
        
        if (!window.serverAPI) {
            throw new Error('serverAPI not available');
        }

        const options = { force_new: true };
        if (expirationValue && expirationValue !== 'never') {
            const hoursMap = { hour: 1, day: 24, week: 168, month: 720 };
            options.expires_in = hoursMap[expirationValue] || null;
        }

        const data = await window.serverAPI.generateInvite(serverId, options);
        
        if (data && (data.data || data.invite_code)) {
            const inviteCode = data.invite_code || (data.data && data.data.invite_code);
            const inviteUrl = data.invite_url || (data.data && data.data.invite_url) || `${window.location.origin}/join/${inviteCode}`;
            
                    if (inviteLinkInput) {
                        inviteLinkInput.value = inviteUrl;
                        inviteLinkInput.disabled = false;
                    }

                    showToast('New invite link generated!', 'success');
                } else {
            throw new Error('Invalid response from server');
        }
    } catch (error) {
            console.error('Error generating invite:', error);
        showToast('Failed to generate invite link', 'error');
            
            if (inviteLinkInput) {
                inviteLinkInput.value = 'Error generating invite link';
                inviteLinkInput.disabled = false;
            }
    } finally {
            if (generateBtn) {
                generateBtn.disabled = false;
            generateBtn.textContent = 'Generate a new link';
        }
    }
}

async function leaveServer(serverId, isDeleting = false) {
    try {
        if (!serverId) throw new Error('Server ID is required');
        

        const confirmBtn = isDeleting 
            ? document.getElementById('confirm-delete-leave')
            : document.getElementById('confirm-leave-server');
            
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = isDeleting ? 'Deleting...' : 'Leaving...';
            confirmBtn.classList.add('opacity-50');
        }
        
        await waitForServerAPI();
        if (!window.serverAPI) throw new Error('serverAPI not available');
        
        
        const data = await window.serverAPI.leaveServer(serverId);
        
        
        if (data && data.success) {
            let message = 'Successfully left server';
            if (isDeleting || (data.data && data.data.server_deleted)) {
                message = 'Server deleted successfully';
            }
            showToast(data.message || message, 'success');
            closeModal('leave-server-modal');
            

            setTimeout(() => {
                const redirectUrl = data.redirect || (data.data && data.data.redirect) || '/home';
                
                window.location.href = redirectUrl;
            }, 1000);
        } else {

            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = isDeleting ? 'Delete Server & Leave' : 'Leave Server';
                confirmBtn.classList.remove('opacity-50');
            }
            
            throw new Error(data && data.message ? data.message : 'Failed to leave server');
        }
    } catch (error) {
        console.error('Error leaving server:', error);
        

        const confirmBtn = isDeleting 
            ? document.getElementById('confirm-delete-leave')
            : document.getElementById('confirm-leave-server');
            
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = isDeleting ? 'Delete Server & Leave' : 'Leave Server';
            confirmBtn.classList.remove('opacity-50');
        }
        
        showToast(`Failed to leave server: ${error.message || 'Unknown error'}`, 'error');
    }
}

function showTransferOwnershipModal(serverId) {


    console.warn('showTransferOwnershipModal is deprecated.');
    showLeaveServerConfirmation();
}

async function loadEligibleOwners(serverId) {

     console.warn('loadEligibleOwners is deprecated.');
}

function showTransferOwnershipMode() {

}

function showDeleteServerMode() {

}

function populateMembersList(members) {

}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

window.debugServerDropdown = async function() {
    console.clear();


    
    const serverId = getCurrentServerId();



    
    const dropdownBtn = document.getElementById('server-dropdown-btn');
    const dropdown = document.getElementById('server-dropdown');


    
    if (serverId && window.serverAPI) {

        const response = await window.serverAPI.getUserServerMembership(serverId);



    }
    

    document.querySelectorAll('.server-dropdown-item').forEach((item, index) => {
        const text = item.querySelector('span')?.textContent;
        const visible = !item.style.display || item.style.display !== 'none';

    });
};

window.testDropdownClick = function() {

    
    const dropdownBtn = document.getElementById('server-dropdown-btn');
    const dropdown = document.getElementById('server-dropdown');
    
    if (!dropdownBtn || !dropdown) {
        console.error('❌ Elements not found', { dropdownBtn: !!dropdownBtn, dropdown: !!dropdown });
        return;
    }
    


    
    dropdownBtn.click();
        
        setTimeout(() => {
        const items = document.querySelectorAll('.server-dropdown-item');
        .map(item => ({
            text: item.querySelector('span')?.textContent?.trim(),
            display: getComputedStyle(item).display,
            visible: item.offsetParent !== null
        })));
    }, 100);
};

window.forceShowDropdown = function() {

    
    const dropdown = document.getElementById('server-dropdown');
    if (!dropdown) {
        console.error('❌ Dropdown not found');
        return;
    }

    dropdown.classList.remove('hidden');
    dropdown.style.display = 'block';
    dropdown.style.opacity = '1';
    dropdown.style.visibility = 'visible';
    
    const items = document.querySelectorAll('.server-dropdown-item');
    items.forEach(item => {
        item.style.display = 'flex';
        item.style.visibility = 'visible';
    });
    

};







window.initServerDropdown = initServerDropdown;
window.initializeServerDropdown = initServerDropdown;
window.showInvitePeopleModal = showInvitePeopleModal;
window.redirectToServerSettings = redirectToServerSettings;
window.showLeaveServerConfirmation = showLeaveServerConfirmation;
window.getCurrentUserRole = () => currentUserRole;
window.isAdminOrOwner = isAdminOrOwner;
window.getUserRole = getUserRole;

window.testMembershipAPI = async function() {
    console.clear();

    
    const serverId = getCurrentServerId();
    if (!serverId) {
        console.error('❌ No server ID found');
        return;
    }
    

    
    try {

        const response = await window.serverAPI.getUserServerMembership(serverId);
        


        





        
        if (response?.success && response?.data?.is_member) {



        } else {

        }
        
        return response;
        
    } catch (error) {
        console.error('❌ API ERROR:', error);
        return null;
    }
};

function setupExpirationOptions() {
    const expirationSelect = document.getElementById('invite-expiration');
    if (expirationSelect && !expirationSelect.hasAttribute('data-listener')) {
        expirationSelect.addEventListener('change', () => {
            const label = document.getElementById('expiration-label');
            if (label) {
                const selectedOption = expirationSelect.options[expirationSelect.selectedIndex];
                label.textContent = selectedOption.text;
            }
        });
        expirationSelect.setAttribute('data-listener', 'true');
    }
}

async function inviteBotToServer(botId) {
    const serverId = getCurrentServerId();
    if (!serverId) {
        showToast('Server ID not found', 'error');
        return;
    }

    try {
        const response = await fetch('/api/bots/add-to-server', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bot_id: botId,
                server_id: serverId,
                role: 'bot'  // 
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showToast('TitiBot has been added to the server!', 'success');

            const modal = document.getElementById('invite-bot-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        } else if (result.message && result.message.includes('already a member')) {
            showToast('TitiBot is already a member of this server', 'info');
        } else {
            showToast(result.message || 'Failed to add TitiBot to server', 'error');
        }
    } catch (error) {
        console.error('Error adding TitiBot to server:', error);
        showToast('Failed to add TitiBot to server. Please try again later.', 'error');
    }
}

function handleGenerateNewInvite() {
    const serverId = getCurrentServerId();
    const expirationSelect = document.getElementById('invite-expiration');
    const expirationValue = expirationSelect ? expirationSelect.value : null;
    generateNewInvite(serverId, expirationValue);
}

