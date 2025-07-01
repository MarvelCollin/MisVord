import { showToast } from '../../core/ui/toast.js';

if (typeof window !== 'undefined' && window.logger) {
    window.logger.info('server', 'server-dropdown.js loaded successfully - FIXED VERSION');
}

window.SERVER_DROPDOWN_VERSION = '3.0';

let currentUserRole = null;
let isInitialized = false;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof window !== 'undefined' && window.logger) {
        window.logger.debug('server', 'server-dropdown.js DOMContentLoaded triggered');
    }
    
    setTimeout(() => {
        const isServerPage = document.getElementById('server-dropdown-btn') !== null;
        
        if (isServerPage && !isInitialized) {
            initServerDropdown();
            isInitialized = true;
        }
    }, 100);
});

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
            console.log('✅ User role:', role);
            return role;
        } else {
            currentUserRole = 'non-member';
            console.log('❌ User is not a member');
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
    console.log('Applying role-based visibility for role:', userRole);
    
    const adminOnlyItems = [
        'Invite People',
        'Server Settings', 
        'Create Channel',
        'Create Category'
    ];

    const dropdownItems = document.querySelectorAll('.server-dropdown-item');
    console.log('Found dropdown items:', dropdownItems.length);
    
    dropdownItems.forEach(item => {
        const spanElement = item.querySelector('span');
        if (!spanElement) {
            console.warn('Dropdown item missing span element:', item);
            return;
        }
        
        const actionText = spanElement.textContent.trim();
        console.log('Processing dropdown item:', actionText);
        
        if (adminOnlyItems.includes(actionText)) {
            if (userRole === 'non-member' || !isAdminOrOwner(userRole)) {
                item.style.display = 'none';
                item.setAttribute('data-role-restricted', 'true');
                console.log('Hiding admin-only item:', actionText);
            } else {
                item.style.display = 'flex';
                item.setAttribute('data-role-restricted', 'false');
                console.log('Showing admin-only item:', actionText);
            }
        } else if (actionText === 'Leave Server') {
            if (userRole === 'non-member') {
                item.style.display = 'none';
                item.setAttribute('data-role-restricted', 'true');
                console.log('Hiding leave server for non-member');
            } else {
                item.style.display = 'flex';
                item.setAttribute('data-role-restricted', 'false');
                console.log('Showing leave server for member');
            }
        } else {
            item.style.display = 'flex';
            item.setAttribute('data-role-restricted', 'false');
            console.log('Showing general item:', actionText);
        }
    });
    
    console.log('Role-based visibility applied successfully');
}

async function initServerDropdown() {
    if (isInitialized) {
        console.log('Server dropdown already initialized');
        return;
    }
    
    console.log('Initializing server dropdown...');

    const dropdownBtn = document.getElementById('server-dropdown-btn');
    const dropdown = document.getElementById('server-dropdown');

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
            console.log('Dropdown toggled, hidden:', dropdown.classList.contains('hidden'));
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
    console.log('Server dropdown initialization complete');
}

function initServerActions() {
    const dropdown = document.getElementById('server-dropdown');
    if (!dropdown || dropdown.hasAttribute('data-actions-initialized')) {
        return;
    }

    dropdown.addEventListener('click', function(e) {
        const item = e.target.closest('.server-dropdown-item');
        if (!item) return;
        
        e.preventDefault();
        
        const spanElement = item.querySelector('span');
        if (!spanElement) return;
        
        const actionText = spanElement.textContent.trim();
        console.log('Dropdown action clicked:', actionText);

        dropdown.classList.add('hidden');

        if (currentUserRole === 'non-member') {
            showToast('You are not a member of this server', 'error');
            return;
        }

        const adminOnlyActions = ['Invite People', 'Server Settings', 'Create Channel', 'Create Category'];
        
        if (adminOnlyActions.includes(actionText)) {
            if (!isAdminOrOwner(currentUserRole)) {
                showToast('You do not have permission to perform this action', 'error');
                return;
            }
            
            if (item.getAttribute('data-role-restricted') === 'true') {
                showToast('Access denied: Insufficient permissions', 'error');
                return;
            }
        }

        executeDropdownAction(actionText);
    });
    
    dropdown.setAttribute('data-actions-initialized', 'true');
    console.log('Server dropdown actions initialized');
}

function executeDropdownAction(actionText) {
    console.log('Executing dropdown action:', actionText);

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
        default:
            console.warn('Unknown dropdown action:', actionText);
    }
}

function getCurrentServerId() {
    const path = window.location.pathname;
    const match = path.match(/\/server\/(\d+)/);
    const serverId = match ? match[1] : null;
    console.log('getCurrentServerId - path:', path, 'serverId:', serverId);
    return serverId;
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
    
    setupInviteModalListeners();
}

function showCreateChannelModal() {
    console.log('🔍 showCreateChannelModal called');
    
    const modal = document.getElementById('create-channel-modal');
    console.log('📦 Modal element found:', !!modal);
    
    if (!modal) {
        console.error('❌ Create channel modal not found');
        console.log('🔍 Available modal elements:', 
            Array.from(document.querySelectorAll('[id*="modal"]')).map(el => el.id)
        );
        return;
    }

    console.log('📋 Modal state before changes:');
    console.log('  - classList:', modal.classList.toString());
    console.log('  - display:', modal.style.display);
    console.log('  - computed display:', getComputedStyle(modal).display);

    modal.classList.remove('hidden', 'opacity-0');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    
    console.log('📋 Modal state after changes:');
    console.log('  - classList:', modal.classList.toString());
    console.log('  - display:', modal.style.display);
    console.log('  - computed display:', getComputedStyle(modal).display);
    
    setTimeout(() => {
        const modalContent = modal.querySelector('.bg-\\[\\#36393f\\]');
        if (modalContent) {
            modalContent.classList.remove('scale-95');
            modalContent.style.transform = 'scale(1)';
            console.log('✅ Modal content animations triggered');
        } else {
            console.warn('⚠️ Modal content element not found');
        }
    }, 50);
    
    setupCreateChannelModalListeners();
    console.log('✅ showCreateChannelModal completed');
}

function showCreateCategoryModal() {
    console.log('🔍 showCreateCategoryModal called');
    
    const modal = document.getElementById('create-category-modal');
    console.log('📦 Modal element found:', !!modal);
    
    if (!modal) {
        console.error('❌ Create category modal not found');
        return;
    }

    modal.classList.remove('hidden', 'opacity-0');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    
    setTimeout(() => {
        const modalContent = modal.querySelector('.bg-\\[\\#36393f\\]');
        if (modalContent) {
            modalContent.classList.remove('scale-95');
            modalContent.style.transform = 'scale(1)';
        }
    }, 50);
    
    setupCreateCategoryModalListeners();
    console.log('✅ showCreateCategoryModal completed');
}

function showLeaveServerConfirmation() {
    const modal = document.getElementById('leave-server-modal');
    if (!modal) {
        console.error('Leave server modal not found');
        return;
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    
    setupLeaveServerModalListeners();
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
        const copyBtn = document.getElementById('copy-invite-link');
        const generateBtn = document.getElementById('generate-new-invite');
        
        if (copyBtn && !copyBtn.hasAttribute('data-listener')) {
            copyBtn.addEventListener('click', copyInviteLink);
            copyBtn.setAttribute('data-listener', 'true');
        }

        if (generateBtn && !generateBtn.hasAttribute('data-listener')) {
            generateBtn.addEventListener('click', () => {
            const serverId = getCurrentServerId();
            const expirationSelect = document.getElementById('invite-expiration');
                const expirationValue = expirationSelect ? expirationSelect.value : null;
                generateNewInvite(serverId, expirationValue);
            });
            generateBtn.setAttribute('data-listener', 'true');
        }
}

function setupCreateChannelModalListeners() {
    const form = document.getElementById('create-channel-form');
    if (form && !form.hasAttribute('data-listener')) {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
            const serverId = getCurrentServerId();
                        createChannel(e, serverId);
                    });
        form.setAttribute('data-listener', 'true');
    }
}

function setupCreateCategoryModalListeners() {
    const form = document.getElementById('create-category-form');
    if (form && !form.hasAttribute('data-listener')) {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
            const serverId = getCurrentServerId();
                        createCategory(e, serverId);
                    });
        form.setAttribute('data-listener', 'true');
    }
}

function setupLeaveServerModalListeners() {
        const confirmBtn = document.getElementById('confirm-leave-server');
        if (confirmBtn && !confirmBtn.hasAttribute('data-listener')) {
        confirmBtn.addEventListener('click', () => {
            const serverId = getCurrentServerId();
            leaveServer(serverId);
        });
            confirmBtn.setAttribute('data-listener', 'true');
        }
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

    try {
        await waitForServerAPI();
        
        if (!window.serverAPI) {
            throw new Error('serverAPI not available');
        }

        const options = {};
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

async function createChannel(e, serverId) {
    e.preventDefault();
    
    try {
        await waitForServerAPI();
        
        if (!window.channelAPI) {
            throw new Error('channelAPI not available');
        }

    const formData = new FormData(e.target);
    formData.append('server_id', serverId);

        const data = await window.channelAPI.createChannel(formData);
        
        if (data.success || data.data) {
            showToast('Channel created successfully!', 'success');
            closeModal('create-channel-modal');
            setTimeout(() => window.location.reload(), 1000);
            } else {
            throw new Error(data.message || 'Failed to create channel');
        }
    } catch (error) {
        console.error('Error creating channel:', error);
        showToast('Error creating channel: ' + error.message, 'error');
    }
}

async function createCategory(e, serverId) {
    e.preventDefault();
    
    try {
        await waitForServerAPI();
        
        if (!window.channelAPI) {
            throw new Error('channelAPI not available');
        }

    const formData = new FormData(e.target);
    formData.append('server_id', serverId);
    
        const data = await window.channelAPI.createCategory(formData);
        
        if (data.success || data.data) {
            showToast('Category created successfully!', 'success');
            closeModal('create-category-modal');
                setTimeout(() => window.location.reload(), 1000);
            } else {
            throw new Error(data.message || 'Failed to create category');
            }
    } catch (error) {
            console.error('Error creating category:', error);
        showToast('Error creating category: ' + error.message, 'error');
    }
}

async function leaveServer(serverId) {
    try {
        await waitForServerAPI();
        
    if (!window.serverAPI) {
            throw new Error('serverAPI not available');
    }
    
        const data = await window.serverAPI.leaveServer(serverId);
        
            if (data.success) {
            showToast(data.message || 'Successfully left server', 'success');
                closeModal('leave-server-modal');
                setTimeout(() => {
                window.location.href = data.redirect || '/home';
                }, 1000);
            } else {
                throw new Error(data.message || 'Failed to leave server');
            }
    } catch (error) {
            console.error('Error leaving server:', error);
            
            if (error.message && error.message.includes('ownership')) {
                showTransferOwnershipModal(serverId);
                closeModal('leave-server-modal');
            } else {
                showToast('Failed to leave server: ' + error.message, 'error');
            }
    }
}

function showTransferOwnershipModal(serverId) {
    const modal = document.getElementById('transfer-ownership-modal');
    if (!modal) {
        console.error('Transfer ownership modal not found');
        return;
    }
    
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    
    loadEligibleOwners(serverId);
}

async function loadEligibleOwners(serverId) {
    try {
        await waitForServerAPI();
        
        if (!window.serverAPI) {
            throw new Error('serverAPI not available');
        }
        
        const data = await window.serverAPI.getEligibleNewOwners(serverId);
        
                if (data.success) {
                    if (data.should_delete_server) {
                showDeleteServerMode();
                    } else if (data.members && data.members.length > 0) {
                        showTransferOwnershipMode();
                        populateMembersList(data.members);
                    } else {
                showDeleteServerMode();
                    }
                } else {
            throw new Error(data.message || 'Failed to load eligible members');
        }
    } catch (error) {
        console.error('Error loading eligible owners:', error);
        showToast('Failed to load eligible members', 'error');
    }
}

function showTransferOwnershipMode() {
    document.getElementById('transfer-content').classList.remove('hidden');
    document.getElementById('delete-content').classList.add('hidden');
    document.getElementById('member-selection').classList.remove('hidden');
    document.getElementById('confirm-transfer-ownership').classList.remove('hidden');
    document.getElementById('confirm-delete-server').classList.add('hidden');
}

function showDeleteServerMode() {
    document.getElementById('transfer-content').classList.add('hidden');
    document.getElementById('delete-content').classList.remove('hidden');
    document.getElementById('member-selection').classList.add('hidden');
    document.getElementById('confirm-transfer-ownership').classList.add('hidden');
    document.getElementById('confirm-delete-server').classList.remove('hidden');
}

function populateMembersList(members) {
    const newOwnerSelect = document.getElementById('new-owner-select');
    if (!newOwnerSelect) return;
    
    newOwnerSelect.innerHTML = '<option value="">Select new owner...</option>';
    
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = `${member.display_name || member.username} (${member.role})`;
        newOwnerSelect.appendChild(option);
    });
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

window.debugServerDropdown = async function() {
    console.clear();
    console.log('🔍 SERVER DROPDOWN DEBUG');
    console.log('=======================');
    
    const serverId = getCurrentServerId();
    console.log('Server ID:', serverId);
    console.log('Current Role:', currentUserRole);
    console.log('Initialized:', isInitialized);
    
    const dropdownBtn = document.getElementById('server-dropdown-btn');
    const dropdown = document.getElementById('server-dropdown');
    console.log('Dropdown Button:', !!dropdownBtn);
    console.log('Dropdown Menu:', !!dropdown);
    
    if (serverId && window.serverAPI) {
        console.log('Testing API...');
        const response = await window.serverAPI.getUserServerMembership(serverId);
        console.log('API Response:', response);
        console.log('Is Member:', response?.data?.is_member);
        console.log('Role:', response?.data?.membership?.role);
    }
    
    console.log('Dropdown Items:');
    document.querySelectorAll('.server-dropdown-item').forEach((item, index) => {
        const text = item.querySelector('span')?.textContent;
        const visible = !item.style.display || item.style.display !== 'none';
        console.log(`${index + 1}. ${text}: ${visible ? 'VISIBLE' : 'HIDDEN'}`);
    });
};

window.testDropdownClick = function() {
    console.log('🎯 TESTING DROPDOWN CLICK...');
    
    const dropdownBtn = document.getElementById('server-dropdown-btn');
    const dropdown = document.getElementById('server-dropdown');
    
    if (!dropdownBtn || !dropdown) {
        console.error('❌ Elements not found', { dropdownBtn: !!dropdownBtn, dropdown: !!dropdown });
        return;
    }
    
    console.log('Before click - dropdown hidden:', dropdown.classList.contains('hidden'));
    console.log('Before click - dropdown display:', getComputedStyle(dropdown).display);
    
    dropdownBtn.click();
        
        setTimeout(() => {
        console.log('After click - dropdown hidden:', dropdown.classList.contains('hidden'));
        console.log('After click - dropdown display:', getComputedStyle(dropdown).display);
        
        const items = document.querySelectorAll('.server-dropdown-item');
        console.log('Dropdown items visible:', Array.from(items).map(item => ({
            text: item.querySelector('span')?.textContent?.trim(),
            display: getComputedStyle(item).display,
            visible: item.offsetParent !== null
        })));
    }, 100);
};

window.forceShowDropdown = function() {
    console.log('🔧 FORCING DROPDOWN TO SHOW...');
    
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
    
    console.log('✅ Dropdown forced to show. Items:', items.length);
};

console.log('🔧 Server Dropdown Debug Functions Loaded!');
console.log('Run these in console:');
console.log('- debugServerDropdown() - Full diagnostic report');
console.log('- testDropdownClick() - Test button click');
console.log('- forceShowDropdown() - Force dropdown to show');

window.initServerDropdown = initServerDropdown;
window.initializeServerDropdown = initServerDropdown;
window.showInvitePeopleModal = showInvitePeopleModal;
window.redirectToServerSettings = redirectToServerSettings;
window.showCreateChannelModal = showCreateChannelModal;
window.showCreateCategoryModal = showCreateCategoryModal;
window.showLeaveServerConfirmation = showLeaveServerConfirmation;
window.getCurrentUserRole = () => currentUserRole;
window.isAdminOrOwner = isAdminOrOwner;
window.getUserRole = getUserRole;

window.testMembershipAPI = async function() {
    console.clear();
    console.log('🧪 TESTING MEMBERSHIP API DIRECTLY...');
    
    const serverId = getCurrentServerId();
    if (!serverId) {
        console.error('❌ No server ID found');
        return;
    }
    
    console.log('🎯 Server ID:', serverId);
    
    try {
        console.log('📡 Calling API...');
        const response = await window.serverAPI.getUserServerMembership(serverId);
        
        console.log('📦 RAW RESPONSE:');
        console.log(JSON.stringify(response, null, 2));
        
        console.log('🔍 RESPONSE ANALYSIS:');
        console.log('- success:', response?.success);
        console.log('- is_member:', response?.data?.is_member);
        console.log('- role:', response?.data?.membership?.role);
        console.log('- is_owner:', response?.data?.membership?.is_owner);
        
        if (response?.success && response?.data?.is_member) {
            console.log('✅ USER IS MEMBER');
            console.log('👤 Role:', response.data.membership.role);
            console.log('👑 Is Owner:', response.data.membership.is_owner);
        } else {
            console.log('❌ USER IS NOT MEMBER');
        }
        
        return response;
        
    } catch (error) {
        console.error('❌ API ERROR:', error);
        return null;
    }
};

console.log('🔧 Added testMembershipAPI() function');