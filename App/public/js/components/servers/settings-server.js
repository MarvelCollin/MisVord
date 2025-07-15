import ImageCutter from '../common/image-cutter.js';
import { showToast } from '../../core/ui/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    if (document.body.classList.contains('settings-page') && document.querySelector('meta[name="server-id"]')) {
        initServerSettingsPage();
    }
});

function initServerSettingsPage() {
    if (!document.body.classList.contains('authenticated')) {
        console.error('User is not authenticated');
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
        return;
    }
    
    const tabs = document.querySelectorAll('.sidebar-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    const urlParams = new URLSearchParams(window.location.search);
    const activeSection = urlParams.get('section') || 'profile';
    
    tabs.forEach(tab => {
        if (tab.dataset.tab === activeSection) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
        
        tab.addEventListener('mouseenter', () => {
            if (!tab.classList.contains('active')) {
                tab.style.transition = 'background-color 0.15s ease';
                tab.style.backgroundColor = 'rgba(79, 84, 92, 0.16)';
            }
        });
        
        tab.addEventListener('mouseleave', () => {
            if (!tab.classList.contains('active')) {
                tab.style.transition = 'background-color 0.15s ease';
                tab.style.backgroundColor = '';
            }
        });
        
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            const url = new URL(window.location);
            url.searchParams.set('section', tabId);
            window.history.pushState({}, '', url);
            
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.backgroundColor = '';
            });
            tab.classList.add('active');
            
            tabContents.forEach(content => {
                if (content.id === `${tabId}-tab`) {
                    content.classList.remove('hidden');
                    content.style.opacity = '0';
                    content.style.transform = 'translateY(5px)';
                    
                    setTimeout(() => {
                        content.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                        content.style.opacity = '1';
                        content.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });
    
    tabContents.forEach(content => {
        if (content.id === `${activeSection}-tab`) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
    
    if (activeSection === 'profile') {
        initServerProfileForm();
    } else if (activeSection === 'roles') {
        initMemberManagementTab();
    } else if (activeSection === 'channels') {
        initChannelManagementTab();
    } else if (activeSection === 'delete') {
        initDeleteServerTab();
    }
    
    initCloseButton();
}

function createImageUploadHandler(containerId, previewId, placeholderId, type, onSuccess) {
    const container = document.getElementById(containerId);
    const preview = document.getElementById(previewId);
    const placeholder = document.getElementById(placeholderId);
    const inputId = type === 'profile' ? 'server-icon-input' : 'server-banner-input';
    const input = document.getElementById(inputId);

    if (!container || !input) {
        console.warn(`Image upload handler for ${type} could not be initialized.`);
        return;
    }
    
    try {
        const cutter = new ImageCutter({
            container: container,
            type: type,
            modalTitle: `Upload Server ${type === 'profile' ? 'Icon' : 'Banner'}`,
            aspectRatio: type === 'profile' ? 1 : 16/9,
            onCrop: async (result) => {
                if (result && result.error) {
                    showToast(result.message || 'An error occurred during cropping.', 'error');
                    return;
                }
                
                if (!result || !result.dataUrl) {
                    showToast('Cropping was cancelled or failed.', 'info');
                    return;
                }

                const serverId = document.querySelector('meta[name="server-id"]').content;
                const blob = dataURLtoBlob(result.dataUrl);

                try {
                    const response = await (type === 'profile' 
                        ? window.serverAPI.updateServerIcon(serverId, blob)
                        : window.serverAPI.updateServerBanner(serverId, blob));

                    if (response.success) {
                        if (preview) {
                            preview.src = result.dataUrl;
                            preview.classList.remove('hidden');
                        }
                        if (placeholder) {
                            placeholder.classList.add('hidden');
                        }

                        if (onSuccess) {
                            onSuccess(result.dataUrl);
                        }

                        showToast(`Server ${type === 'profile' ? 'icon' : 'banner'} updated successfully`, 'success');
                        window.location.reload();
                    } else {
                        throw new Error(response.message || `Failed to update server ${type}`);
                    }
                } catch (error) {
                    console.error(`Error updating server ${type}:`, error);
                    showToast(error.message || 'An error occurred while uploading.', 'error');
                }
            }
        });

        container.addEventListener('click', (e) => {
             e.preventDefault();
             input.click();
         });
 
         input.addEventListener('change', (e) => {
             const file = e.target.files[0];
             if (!file) return;
 
             const reader = new FileReader();
             reader.onload = (event) => {
                 cutter.loadImage(event.target.result);
             };
             reader.readAsDataURL(file);
             
             e.target.value = '';
         });
 
         if (type === 'profile') {
             window.serverIconCutter = cutter;
         } else {
             window.serverBannerCutter = cutter;
         }
    } catch (error) {
        console.error(`Error initializing ${type} cutter:`, error);
        showToast(`Could not initialize image uploader for server ${type}.`, 'error');
    }
}

function initServerIconUpload() {
    createImageUploadHandler(
        'server-icon-container',
        'server-icon-preview',
        'server-icon-placeholder',
        'profile',
        updateServerPreviewIcon
    );
}

function initServerBannerUpload() {
    createImageUploadHandler(
        'server-banner-container',
        'server-banner-preview', 
        'server-banner-placeholder',
        'banner',
        updateServerPreviewBanner
    );
}

function updateServerPreviewIcon(imageUrl) {
    const previewIcon = document.querySelector('.server-icon-preview img');
    const previewPlaceholder = document.querySelector('.server-icon-preview div');
    
    if (previewIcon) {
        previewIcon.src = imageUrl;
        previewIcon.classList.remove('hidden');
        
        if (previewPlaceholder) {
            previewPlaceholder.classList.add('hidden');
        }
    } else if (previewPlaceholder) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = "Server Icon";
        img.className = "w-full h-full object-cover";
        
        previewPlaceholder.parentNode.appendChild(img);
        previewPlaceholder.classList.add('hidden');
    }
}

function resetServerPreviewIcon() {
    const previewIcon = document.querySelector('.server-icon-preview img');
    const previewPlaceholder = document.querySelector('.server-icon-preview div');
    
    if (previewIcon) {
        previewIcon.classList.add('hidden');
    }
    
    if (previewPlaceholder) {
        previewPlaceholder.classList.remove('hidden');
    }
}
                
function initServerProfileForm() {
    const form = document.getElementById('server-profile-form');
    const serverNameInput = document.getElementById('server-name');
    const serverDescriptionInput = document.getElementById('server-description');
    const isPublicInput = document.getElementById('is-public');
    const serverCategorySelect = document.getElementById('server-category');
    const saveButton = document.getElementById('save-changes-btn');
    const serverId = document.querySelector('meta[name="server-id"]')?.content;
    const formCards = document.querySelectorAll('.bg-discord-darker');
    
    if (!form || !serverId) return;
    
    initServerIconUpload();
    initServerBannerUpload();
    
    if (formCards.length) {
        formCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 + (index * 100));
        });
    }
    
    const formInputs = form.querySelectorAll('input, textarea, select');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.closest('.form-group')?.classList.add('is-focused');
        });
        
        input.addEventListener('blur', function() {
            this.closest('.form-group')?.classList.remove('is-focused');
        });
    });
    
    if (serverNameInput) {
        serverNameInput.addEventListener('input', debounce(function() {
            updateServerNamePreview(this.value);
        }, 300));
    }

    if (serverDescriptionInput) {
        serverDescriptionInput.addEventListener('input', debounce(function() {
            updateServerDescriptionPreview(this.value);
        }, 300));
    }
    

    initServerInputApproveButtons(serverId);
}

function initCloseButton() {
    const closeButton = document.querySelector('.close-button');
    if (!closeButton) return;
    
    closeButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        const serverId = document.querySelector('meta[name="server-id"]')?.content;
        if (!serverId) {
            window.location.href = '/home';
            return;
        }
        
        window.location.href = `/server/${serverId}`;
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const serverId = document.querySelector('meta[name="server-id"]')?.content;
            if (!serverId) {
                window.location.href = '/home';
                return;
            }
            
            window.location.href = `/server/${serverId}`;
        }
    });
}


function updateServerNameInUI(newName) {
    const sidebarServerName = document.querySelector('.w-60.bg-discord-light .text-sm.font-semibold');
    if (sidebarServerName) {
        sidebarServerName.textContent = newName;
    }
    
    document.title = `MisVord - ${newName} Settings`;
}


function updateServerNamePreview(newName) {
    const serverNamePreview = document.querySelector('.server-name');
    if (serverNamePreview) {
        serverNamePreview.textContent = newName || 'Server Name';
    }
}


function updateServerDescriptionPreview(newDescription) {
    const serverDescriptionPreview = document.querySelector('.server-description-preview');
    if (serverDescriptionPreview) {
        serverDescriptionPreview.textContent = newDescription || 'Tell people what your server is about...';
    }
}


function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
}


function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}




function initMemberManagementTab() {
    const membersList = document.getElementById('members-list');
    const memberSearch = document.getElementById('member-search');
    const memberTemplate = document.getElementById('member-template');
    const memberFilter = document.getElementById('member-filter');
    const filterOptions = document.querySelectorAll('#filter-dropdown .filter-option');
    const serverId = document.querySelector('meta[name="server-id"]')?.content;
    const userRole = document.querySelector('meta[name="user-role"]')?.content || 'member';
    

    document.body.dataset.userRole = userRole;
    
    function getMemberPermissions(currentUserRole, currentUserId, member, isBot) {
        const isCurrentUser = String(member.id) === String(currentUserId);
        
        return {
            canPromote: currentUserRole === 'owner' && member.role === 'member' && !isCurrentUser && !isBot,
            canDemote: currentUserRole === 'owner' && member.role === 'admin' && !isCurrentUser,
            canKick: !isCurrentUser && member.role !== 'owner' && !isBot && 
                    ((currentUserRole === 'owner') || 
                     (currentUserRole === 'admin' && member.role === 'member')),
            canTransferOwnership: currentUserRole === 'owner' && member.role === 'admin' && !isCurrentUser
        };
    }
    
    if (!membersList || !memberTemplate || !serverId) return;
    
    let allMembers = [];
    let currentFilter = 'all';
    
    async function loadMembers() {
        try {
            const response = await window.serverAPI.getServerMembers(serverId);
            
            if (response && response.success) {
                if (response.data && response.data.members) {
                    allMembers = response.data.members;
                } else if (response.members) {
                    allMembers = response.members;
                } else {
                    allMembers = [];
                }
                
                filterMembers(currentFilter);
            } else if (response && response.error && response.error.code === 401) {
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
                return;
            } else {
                throw new Error(response.message || 'Failed to load server members');
            }
        } catch (error) {
            console.error('Error loading server members:', error);
            
            if (error.message && error.message.toLowerCase().includes('unauthorized')) {
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
                return;
            }
            
            membersList.innerHTML = `
                <div class="flex items-center justify-center p-8 text-discord-lighter">
                    <i class="fas fa-exclamation-triangle mr-2 text-red-400"></i>
                    <span>Error loading members. Please try again.</span>
                </div>
            `;
        }
    }
    
    function filterMembers(filterType) {
        let filteredMembers = [...allMembers];
        
        if (filterType !== 'all') {
            if (filterType === 'bot') {
                filteredMembers = filteredMembers.filter(member => member.username.toLowerCase() === 'titibot');
            } else {
                filteredMembers = filteredMembers.filter(member => member.role === filterType && member.username.toLowerCase() !== 'titibot');
            }
        }
        
        filteredMembers.sort((a, b) => {
            const isABot = a.username.toLowerCase() === 'titibot';
            const isBBot = b.username.toLowerCase() === 'titibot';
            

            if (isABot && !isBBot) return 1;
            if (!isABot && isBBot) return -1;
            

            const roleOrder = { 'owner': 0, 'admin': 1, 'members': 2, 'member': 2, 'moderator': 3 };
            const roleA = roleOrder[a.role] !== undefined ? roleOrder[a.role] : 4;
            const roleB = roleOrder[b.role] !== undefined ? roleOrder[b.role] : 4;
            
            if (roleA !== roleB) {
                return roleA - roleB;
            }
            
            return a.username.localeCompare(b.username);
        });
        
        renderMembers(filteredMembers);
    }
    
    if (filterOptions) {
        filterOptions.forEach(option => {
            option.addEventListener('click', function() {
                filterOptions.forEach(opt => {
                    opt.querySelector('input[type="radio"]').checked = false;
                });
                this.querySelector('input[type="radio"]').checked = true;
                
                if (memberFilter) {
                    memberFilter.querySelector('.filter-selected-text').textContent = this.textContent.trim();
                    
                    const filterDropdown = document.getElementById('filter-dropdown');
                    if (filterDropdown) {
                        filterDropdown.classList.add('hidden');
                    }
                }
                
                currentFilter = this.dataset.filter;
                filterMembers(currentFilter);
            });
        });
    }
    
    if (memberFilter) {
        memberFilter.addEventListener('click', function(e) {
            const filterDropdown = document.getElementById('filter-dropdown');
            if (filterDropdown) {
                filterDropdown.classList.toggle('hidden');
            }
        });
        
        document.addEventListener('click', function(e) {
            if (!memberFilter.contains(e.target)) {
                const filterDropdown = document.getElementById('filter-dropdown');
                if (filterDropdown && !filterDropdown.classList.contains('hidden')) {
                    filterDropdown.classList.add('hidden');
                }
            }
        });
    }
    
    function renderMembers(members) {
        if (!members.length) {
            membersList.innerHTML = `
                <div class="flex items-center justify-center p-8 text-discord-lighter">
                    <i class="fas fa-users mr-2 opacity-50"></i>
                    <span>No members found</span>
                </div>
            `;
            return;
        }
        
        membersList.innerHTML = '';
        
        members.forEach(member => {
            const memberElement = document.importNode(memberTemplate.content, true).firstElementChild;
            
            const isBot = member.username.toLowerCase() === 'titibot';
            
            const avatarImg = memberElement.querySelector('.member-avatar img');
            if (avatarImg && member.avatar_url) {
                avatarImg.src = member.avatar_url;
            } else {
                const avatarDiv = memberElement.querySelector('.member-avatar');
                if (avatarDiv) {
                    avatarDiv.innerHTML = `
                        <img src="/public/assets/common/default-profile-picture.png" alt="Default Avatar" class="w-full h-full object-cover">
                    `;
                }
            }
            
            const usernameElement = memberElement.querySelector('.member-username');
            if (usernameElement) {
                const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
                const isCurrentUser = String(member.id) === String(currentUserId);
                const displayName = member.display_name || member.username;
                
                console.log('Debug - Member:', displayName, 'ID:', member.id, 'Type:', typeof member.id);
                console.log('Debug - Current User ID:', currentUserId, 'Type:', typeof currentUserId);
                console.log('Debug - Is Current User:', isCurrentUser);
                
                let usernameText = displayName;
                if (isCurrentUser) {
                    usernameText += ' (you)';
                }
                
                usernameElement.textContent = usernameText;
                if (isBot) {
                    usernameElement.innerHTML = `${usernameText} <span class="ml-1 px-1 py-0.5 text-[10px] bg-blue-500 text-white rounded">BOT</span>`;
                }
            }
            
            const discriminatorElement = memberElement.querySelector('.member-discriminator');
            if (discriminatorElement) {
                discriminatorElement.textContent = `#${member.discriminator || '0000'}`;
            }
            
            const roleElement = memberElement.querySelector('.member-role-badge');
            if (roleElement) {
                if (isBot) {
                    roleElement.textContent = 'Bot';
                    roleElement.className = 'member-role-badge bot';
                } else {
                    roleElement.textContent = member.role.charAt(0).toUpperCase() + member.role.slice(1);
                    roleElement.className = `member-role-badge ${member.role}`;
                }
            }
            
            const joinedElement = memberElement.querySelector('.member-joined');
            if (joinedElement && member.joined_at) {
                const joinedDate = new Date(member.joined_at);
                joinedElement.textContent = joinedDate.toLocaleDateString();
            }
            
            memberElement.dataset.memberId = member.id;
            
            const promoteBtn = memberElement.querySelector('.promote-btn');
            const demoteBtn = memberElement.querySelector('.demote-btn');
            const kickBtn = memberElement.querySelector('.kick-btn');
            
            const currentUserRole = document.body.dataset.userRole;
            const currentUserId = document.querySelector('meta[name="user-id"]')?.content;
            const permissions = getMemberPermissions(currentUserRole, currentUserId, member, isBot);
            
            if (promoteBtn) {
                promoteBtn.style.display = permissions.canPromote ? 'inline-flex' : 'none';
            }
            if (demoteBtn) {
                demoteBtn.style.display = permissions.canDemote ? 'inline-flex' : 'none';
            }
            if (kickBtn) {
                kickBtn.style.display = permissions.canKick ? 'inline-flex' : 'none';
            }
            
            if (promoteBtn && promoteBtn.style.display !== 'none') {
                promoteBtn.replaceWith(promoteBtn.cloneNode(true));
                const newPromoteBtn = memberElement.querySelector('.promote-btn');
                
                newPromoteBtn.addEventListener('click', () => {
                    if (permissions.canTransferOwnership) {
                        showMemberActionModal('transfer-ownership', member);
                    } else {
                        showMemberActionModal('promote', member);
                    }
                });
            }
            
            if (demoteBtn && demoteBtn.style.display !== 'none') {
                demoteBtn.replaceWith(demoteBtn.cloneNode(true));
                const newDemoteBtn = memberElement.querySelector('.demote-btn');
                
                newDemoteBtn.addEventListener('click', () => {
                    showMemberActionModal('demote', member);
                });
            }
            
            if (kickBtn && kickBtn.style.display !== 'none') {
                kickBtn.replaceWith(kickBtn.cloneNode(true));
                const newKickBtn = memberElement.querySelector('.kick-btn');
                
                newKickBtn.addEventListener('click', () => showMemberActionModal('kick', member));
            }
            
            membersList.appendChild(memberElement);
        });
    }
    
    function showMemberActionModal(action, member) {
        try {
            
            
            if (!member) {
                console.error('No member provided to action modal');
                showToast('Error: Member data is missing', 'error');
                return;
            }
            
            const modal = document.getElementById('member-action-modal');
            if (!modal) {
                console.error('Member action modal not found in the DOM');
                showToast('Error: Modal not found', 'error');
                return;
            }


            const modalContainer = modal.querySelector('.modal-container');
            if (!modalContainer) {
                console.error('Modal container not found');
                showToast('Error: Modal structure is incomplete', 'error');
                return;
            }
            

            const safeSetContent = (selector, content, defaultContent = '') => {
                const element = modal.querySelector(selector);
                if (element) {
                    if (typeof content === 'string') {
                        element.textContent = content;
                    } else if (typeof content === 'function') {
                        content(element);
                    }
                    return element;
                }
                console.warn(`Element not found: ${selector}`);
                return null;
            };
            

            const safeToggleClass = (selector, className, add = true) => {
                const element = modal.querySelector(selector);
                if (element) {
                    if (add) {
                        element.classList.add(className);
                    } else {
                        element.classList.remove(className);
                    }
                    return element;
                }
                console.warn(`Element not found for class toggle: ${selector}`);
                return null;
            };
            


            safeSetContent('.modal-icon i', icon => {
                if (icon) icon.className = '';
            });
            

            safeSetContent('.modal-title', 'Confirm Action');
            safeSetContent('.member-name', member.display_name || member.username);
            safeSetContent('.member-current-role', `Current Role: ${member.role.charAt(0).toUpperCase() + member.role.slice(1)}`);
            safeSetContent('.action-message', '');
            

            safeSetContent('.from-role', '');
            safeSetContent('.to-role', '');
            if (modal.querySelector('.from-role')) {
                modal.querySelector('.from-role').className = 'role-badge from-role';
            }
            if (modal.querySelector('.to-role')) {
                modal.querySelector('.to-role').className = 'role-badge to-role';
            }
            

            safeToggleClass('.role-change-preview', 'hidden', true);
            

            const avatarContainer = modal.querySelector('.member-avatar-small');
            if (avatarContainer) {
                if (member.avatar_url) {
                    avatarContainer.innerHTML = `<img src="${member.avatar_url}" alt="Avatar" class="w-full h-full object-cover">`;
                } else {
                    avatarContainer.innerHTML = `<img src="/public/assets/common/default-profile-picture.png" alt="Default Avatar" class="w-full h-full object-cover">`;
                }
            }
            

            const confirmBtn = modal.querySelector('#modal-confirm-btn');
            if (confirmBtn) {
                confirmBtn.className = 'modal-btn modal-btn-confirm';
                

                let confirmText = confirmBtn.querySelector('.confirm-text');
                if (!confirmText) {

                    const checkIcon = confirmBtn.querySelector('i');
                    if (checkIcon) {
                        confirmBtn.innerHTML = ''; 
                        const iconEl = document.createElement('i');
                        iconEl.className = 'fas fa-check mr-2';
                        confirmBtn.appendChild(iconEl);
                    } else {
                        confirmBtn.innerHTML = '';
                    }
                    
                    confirmText = document.createElement('span');
                    confirmText.className = 'confirm-text';
                    confirmBtn.appendChild(confirmText);
                }
                
                confirmText.textContent = 'Confirm';
            }
            

            const modalIcon = modal.querySelector('.modal-icon i');
            const modalTitle = modal.querySelector('.modal-title');
            const actionMessage = modal.querySelector('.action-message');
            const roleChangePreview = modal.querySelector('.role-change-preview');
            const fromRole = modal.querySelector('.from-role');
            const toRole = modal.querySelector('.to-role');
            const cancelBtn = modal.querySelector('#modal-cancel-btn');
            

            let actionHandler;
            

            switch (action) {
                case 'transfer-ownership':
                    if (modalIcon) modalIcon.className = 'fas fa-crown';
                    if (modalTitle) modalTitle.textContent = 'Transfer Ownership';
                    if (actionMessage) actionMessage.textContent = `Are you sure you want to transfer server ownership to ${member.display_name || member.username}? This will make them the server owner and demote you to admin. This action cannot be undone.`;
                    
                    if (roleChangePreview) roleChangePreview.classList.remove('hidden');
                    if (fromRole) {
                        fromRole.textContent = member.role.charAt(0).toUpperCase() + member.role.slice(1);
                        fromRole.className = `role-badge ${member.role}`;
                    }
                    if (toRole) {
                        toRole.textContent = 'Owner';
                        toRole.className = 'role-badge owner';
                    }
                    
                    if (confirmBtn) {
                        confirmBtn.classList.add('danger');
                        const confirmText = confirmBtn.querySelector('.confirm-text');
                        if (confirmText) confirmText.textContent = 'Transfer Ownership';
                    }
                    
                    actionHandler = () => handleTransferOwnership(member);
                    break;
                    
                case 'promote':
                    if (modalIcon) modalIcon.className = 'fas fa-arrow-up';
                    if (modalTitle) modalTitle.textContent = 'Promote Member';
                    if (actionMessage) actionMessage.textContent = `Are you sure you want to promote ${member.display_name || member.username} to Admin? This will give them additional permissions to manage channels and kick members.`;
                    
                    if (roleChangePreview) roleChangePreview.classList.remove('hidden');
                    if (fromRole) {
                        fromRole.textContent = member.role.charAt(0).toUpperCase() + member.role.slice(1);
                        fromRole.className = `role-badge ${member.role}`;
                    }
                    if (toRole) {
                        toRole.textContent = 'Admin';
                        toRole.className = 'role-badge admin';
                    }
                    
                    if (confirmBtn) {
                        confirmBtn.classList.add('warning');
                        const confirmText = confirmBtn.querySelector('.confirm-text');
                        if (confirmText) confirmText.textContent = 'Promote';
                    }
                    
                    actionHandler = () => handlePromote(member);
                    break;
                    
                case 'demote':
                    if (modalIcon) modalIcon.className = 'fas fa-arrow-down';
                    if (modalTitle) modalTitle.textContent = 'Demote Member';
                    if (actionMessage) actionMessage.textContent = `Are you sure you want to demote ${member.display_name || member.username} to Member? This will remove their administrative permissions.`;
                    

                    if (roleChangePreview) {
                        roleChangePreview.classList.remove('hidden');
                    }
                    

                    if (fromRole) {
                        fromRole.textContent = member.role.charAt(0).toUpperCase() + member.role.slice(1);
                        fromRole.className = `role-badge ${member.role}`;
                    }
                    

                    if (toRole) {

                        toRole.innerHTML = 'Member';
                        toRole.className = 'role-badge member';
                    }
                    

                    if (confirmBtn) {
                        confirmBtn.classList.add('warning');
                        const confirmText = confirmBtn.querySelector('.confirm-text');
                        if (confirmText) confirmText.textContent = 'Demote';
                    }
                    

                    actionHandler = () => handleDemote(member);
                    break;
                    
                case 'kick':
                    const isBot = member.username.toLowerCase() === 'titibot';
                    if (modalIcon) modalIcon.className = 'fas fa-user-times';
                    if (modalTitle) modalTitle.textContent = isBot ? 'Remove Bot' : 'Kick Member';
                    
                    if (actionMessage) {
                        if (isBot) {
                            actionMessage.textContent = `Are you sure you want to remove ${member.display_name || member.username} from the server? The bot will be removed immediately but can be added again later.`;
                        } else {
                            actionMessage.textContent = `Are you sure you want to kick ${member.display_name || member.username} from the server? They will be removed immediately and can only rejoin with a new invite.`;
                        }
                    }
                    
                    if (confirmBtn) {
                        confirmBtn.classList.add('danger');
                        const confirmText = confirmBtn.querySelector('.confirm-text');
                        if (confirmText) confirmText.textContent = isBot ? 'Remove Bot' : 'Kick';
                    }
                    
                    actionHandler = () => handleKick(member);
                    break;
                    
                default:
                    console.error('Unknown action type:', action);
                    return;
            }
            

            if (confirmBtn) confirmBtn.replaceWith(confirmBtn.cloneNode(true));
            if (cancelBtn) cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            

            const newConfirmBtn = modal.querySelector('#modal-confirm-btn');
            const newCancelBtn = modal.querySelector('#modal-cancel-btn');
            

            if (newConfirmBtn) {
                newConfirmBtn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                    if (actionHandler) actionHandler();
                });
            }
            
            if (newCancelBtn) {
                newCancelBtn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            }
            

            const handleKeydown = (e) => {
                if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                    modal.classList.add('hidden');
                    document.removeEventListener('keydown', handleKeydown);
                }
            };
            document.addEventListener('keydown', handleKeydown);
            

            const handleBackgroundClick = (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                    modal.removeEventListener('click', handleBackgroundClick);
                }
            };
            modal.addEventListener('click', handleBackgroundClick);
            

            
            

            modal.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error showing member action modal:', error);
            showToast('Error displaying the action modal. Please try again.', 'error');
        }
    }
    
    async function handlePromote(member) {
        try {
            const serverId = document.querySelector('meta[name="server-id"]')?.content;
            if (!serverId) throw new Error("Server ID not found");
            

            showToast(`Promoting ${member.display_name || member.username}...`, 'info', 2000);
            
            const response = await window.serverAPI.promoteMember(serverId, member.id);
            if (response && response.success) {

                const newRole = response.new_role ? 
                    response.new_role.charAt(0).toUpperCase() + response.new_role.slice(1) : 
                    'Admin'; 
                
                showToast(`${member.display_name || member.username} has been promoted to ${newRole}`, 'success', 5000, 'Member Promoted');
                loadMembers();
            } else {
                throw new Error(response.message || 'Failed to promote member');
            }
        } catch (error) {
            console.error('Error promoting member:', error);
            showToast(error.message || 'Failed to promote member', 'error', 5000, 'Promotion Failed');
        }
    }
    
    async function handleDemote(member) {
        try {
            const serverId = document.querySelector('meta[name="server-id"]')?.content;
            if (!serverId) throw new Error("Server ID not found");
            

            showToast(`Demoting ${member.display_name || member.username}...`, 'info', 2000);
            
            const response = await window.serverAPI.demoteMember(serverId, member.id);
            if (response && response.success) {

                const newRole = response.new_role ? 
                    response.new_role.charAt(0).toUpperCase() + response.new_role.slice(1) : 
                    'Member'; 
                
                showToast(`${member.display_name || member.username} has been demoted to ${newRole}`, 'success', 5000, 'Member Demoted');
                loadMembers();
            } else {
                throw new Error(response.message || 'Failed to demote member');
            }
        } catch (error) {
            console.error('Error demoting member:', error);
            showToast(error.message || 'Failed to demote member', 'error', 5000, 'Demotion Failed');
        }
    }
    
    async function handleKick(member) {
        try {
            const serverId = document.querySelector('meta[name="server-id"]')?.content;
            if (!serverId) throw new Error("Server ID not found");
            
            const isBot = member.username.toLowerCase() === 'titibot';
            

            showToast(isBot ? `Removing ${member.display_name || member.username}...` : `Kicking ${member.display_name || member.username}...`, 'info', 2000);
            
            const response = await window.serverAPI.kickMember(serverId, member.id);
            if (response && response.success) {
                const actionText = isBot ? 'removed from' : 'kicked from';
                const toastTitle = isBot ? 'Bot Removed' : 'Member Kicked';
                
                showToast(`${member.display_name || member.username} has been ${actionText} the server`, 'success', 5000, toastTitle);
                loadMembers();
            } else {
                throw new Error(response.message || `Failed to ${isBot ? 'remove bot' : 'kick member'}`);
            }
        } catch (error) {
            console.error('Error kicking member:', error);
            const isBot = member.username.toLowerCase() === 'titibot';
            const errorTitle = isBot ? 'Bot Removal Failed' : 'Kick Failed';
            showToast(error.message || `Failed to ${isBot ? 'remove bot' : 'kick member'}`, 'error', 5000, errorTitle);
        }
    }

    async function handleTransferOwnership(member) {
        try {
            const serverId = document.querySelector('meta[name="server-id"]')?.content;
            if (!serverId) throw new Error("Server ID not found");
            

            showToast(`Transferring ownership to ${member.display_name || member.username}...`, 'info', 2000);
            
            const response = await window.serverAPI.transferOwnership(serverId, member.id);
            if (response && response.success) {
                document.querySelector('meta[name="user-role"]')?.setAttribute('content', 'admin');
                document.body.dataset.userRole = 'admin';
                
                showToast(`You have transferred server ownership to ${member.display_name || member.username}. You are now an admin.`, 'success', 5000, 'Ownership Transferred');
                loadMembers();
            } else {
                throw new Error(response.message || 'Failed to transfer server ownership');
            }
        } catch (error) {
            console.error('Error transferring server ownership:', error);
            showToast(error.message || 'Failed to transfer server ownership', 'error', 5000, 'Transfer Failed');
        }
    }
    
    if (memberSearch) {
        memberSearch.addEventListener('input', debounce(function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            if (!searchTerm) {
                filterMembers(currentFilter);
                return;
            }
            
            const filteredMembers = allMembers.filter(member => {
                const isBot = member.username.toLowerCase() === 'titibot';
                const roleToSearch = isBot ? 'bot' : member.role;
                
                return (
                    member.username.toLowerCase().includes(searchTerm) ||
                    roleToSearch.toLowerCase().includes(searchTerm)
                );
            });
            
            renderMembers(filteredMembers);
        }, 300));
    }
    
    loadMembers();
}


function initChannelManagementTab() {
    const channelsList = document.getElementById('channels-list');
    const channelSearch = document.getElementById('channel-search');
    const channelTemplate = document.getElementById('channel-template');
    const channelFilter = document.getElementById('channel-filter');
    const filterOptions = document.querySelectorAll('#channel-filter-dropdown .filter-option');
    const serverId = document.querySelector('meta[name="server-id"]')?.content;
    
    if (!channelsList || !channelTemplate || !serverId) return;
    
    let allChannels = [];
    let currentFilter = 'all';
    
    function loadChannels() {
        channelsList.innerHTML = `
            <div class="channels-loading-state">
                <i class="fas fa-spinner fa-spin mr-2"></i>
                <span>Loading channels...</span>
            </div>
        `;
        
        try {

            fetch(`/api/servers/${serverId}/channels`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(async response => {
                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
                        return;
                    }
                    try {
                        const errorData = await response.json();
                        throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${response.status}`);
                    } catch (jsonError) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                }
                return response.json();
            })
            .then(response => {
                if (response && response.success) {
                    if (response.data && response.data.channels) {
                        allChannels = response.data.channels;
                    } else if (response.channels) {
                        allChannels = response.channels;
                    } else {
                        allChannels = [];
                    }
                    
                    filterChannels(currentFilter);
                } else {
                    throw new Error(response.message || 'Failed to load server channels');
                }
            })
            .catch(error => {
                console.error('Error loading server channels:', error);
                
                channelsList.innerHTML = `
                    <div class="channels-empty-state">
                        <i class="fas fa-exclamation-triangle text-red-400"></i>
                        <div class="text-lg">Error loading channels</div>
                        <div class="text-sm">Please try refreshing the page</div>
                    </div>
                `;
            });
        } catch (error) {
            console.error('Error initiating channel loading:', error);
            
            channelsList.innerHTML = `
                <div class="channels-empty-state">
                    <i class="fas fa-exclamation-triangle text-red-400"></i>
                    <div class="text-lg">Error loading channels</div>
                    <div class="text-sm">Please try refreshing the page</div>
                </div>
            `;
        }
    }
    
    function filterChannels(filterType) {
        let filteredChannels = [...allChannels];
        
        if (filterType !== 'all') {
            filteredChannels = filteredChannels.filter(channel => channel.type === filterType);
        }
        
        filteredChannels.sort((a, b) => {
            return (a.position || 0) - (b.position || 0);
        });
        
        renderChannels(filteredChannels);
    }
    
    if (filterOptions) {
        filterOptions.forEach(option => {
            option.addEventListener('click', function() {
                filterOptions.forEach(opt => {
                    opt.querySelector('input[type="radio"]').checked = false;
                });
                this.querySelector('input[type="radio"]').checked = true;
                
                if (channelFilter) {
                    channelFilter.querySelector('.filter-selected-text').textContent = this.textContent.trim();
                    
                    const filterDropdown = document.getElementById('channel-filter-dropdown');
                    if (filterDropdown) {
                        filterDropdown.classList.add('hidden');
                    }
                }
                
                currentFilter = this.dataset.filter;
                filterChannels(currentFilter);
            });
        });
    }
    
    if (channelFilter) {
        channelFilter.addEventListener('click', function(e) {
            const filterDropdown = document.getElementById('channel-filter-dropdown');
            if (filterDropdown) {
                filterDropdown.classList.toggle('hidden');
            }
        });
        
        document.addEventListener('click', function(e) {
            if (!channelFilter.contains(e.target)) {
                const filterDropdown = document.getElementById('channel-filter-dropdown');
                if (filterDropdown && !filterDropdown.classList.contains('hidden')) {
                    filterDropdown.classList.add('hidden');
                }
            }
        });
    }
    
    function renderChannels(channels) {
        if (!channels.length) {
            channelsList.innerHTML = `
                <div class="flex items-center justify-center p-8 text-discord-lighter">
                    <i class="fas fa-hashtag mr-2 opacity-50"></i>
                    <span>No channels found</span>
                </div>
            `;
            return;
        }
        
        channelsList.innerHTML = '';
        
        channels.forEach(channel => {
            const channelElement = document.importNode(channelTemplate.content, true).firstElementChild;
            
            const channelIcon = channelElement.querySelector('.channel-icon i');
            if (channelIcon) {
                if (channel.type === 'voice') {
                    channelIcon.className = 'fas fa-volume-up text-gray-400';
                } else {
                    channelIcon.className = 'fas fa-hashtag text-gray-400';
                }
            }
            
            const channelNameElement = channelElement.querySelector('.channel-name');
            if (channelNameElement) {
                channelNameElement.textContent = channel.name;
            }
            
            const channelTypeElement = channelElement.querySelector('.channel-type-badge');
            if (channelTypeElement) {
                channelTypeElement.textContent = channel.type.charAt(0).toUpperCase() + channel.type.slice(1);
                channelTypeElement.className = `channel-type-badge ${channel.type}`;
            }
            
            channelElement.dataset.channelId = channel.id;
            
            const renameBtn = channelElement.querySelector('.rename-btn');
            const deleteBtn = channelElement.querySelector('.delete-btn');
            
            if (renameBtn) {
                renameBtn.addEventListener('click', () => showChannelActionModal('rename', channel));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => showChannelActionModal('delete', channel));
            }
            
            channelsList.appendChild(channelElement);
        });
    }
    
    function showChannelActionModal(action, channel) {
        try {
            
            
            if (!channel) {
                console.error('No channel provided to action modal');
                showToast('Error: Channel data is missing', 'error');
                return;
            }
            
            const modal = document.getElementById('channel-action-modal');
            if (!modal) {
                console.error('Channel action modal not found');
                showToast('Error: Modal not found', 'error');
                return;
            }
            

            const modalContainer = modal.querySelector('.channel-modal-container');
            if (!modalContainer) {
                console.error('Modal container not found');
                showToast('Error: Modal structure is incomplete', 'error');
                return;
            }
            

            const safeSetContent = (selector, content, defaultContent = '') => {
                const element = modal.querySelector(selector);
                if (element) {
                    if (typeof content === 'string') {
                        element.textContent = content;
                    } else if (typeof content === 'function') {
                        content(element);
                    }
                    return element;
                }
                console.warn(`Element not found: ${selector}`);
                return null;
            };
            

            const safeToggleClass = (selector, className, add = true) => {
                const element = modal.querySelector(selector);
                if (element) {
                    if (add) {
                        element.classList.add(className);
                    } else {
                        element.classList.remove(className);
                    }
                    return element;
                }
                console.warn(`Element not found for class toggle: ${selector}`);
                return null;
            };
            

            safeSetContent('.channel-modal-icon i', icon => {
                if (icon) icon.className = '';
            });
            
            safeToggleClass('.rename-input-container', 'hidden', true);
            

            const channelIconDiv = modal.querySelector('.channel-icon-small i');
            if (channelIconDiv) {
                if (channel.type === 'voice') {
                    channelIconDiv.className = 'fas fa-volume-up';
                } else {
                    channelIconDiv.className = 'fas fa-hashtag';
                }
            }
            

            safeSetContent('.channel-modal-name', channel.name);
            

            const confirmBtn = modal.querySelector('#channel-modal-confirm-btn');
            if (confirmBtn) {
                confirmBtn.className = 'channel-modal-btn channel-modal-btn-confirm';
                

                let confirmText = confirmBtn.querySelector('.confirm-text');
                if (!confirmText) {
                    confirmBtn.innerHTML = '';
                    confirmText = document.createElement('span');
                    confirmText.className = 'confirm-text';
                    confirmBtn.appendChild(confirmText);
                }
                
                confirmText.textContent = 'Confirm';
            }
            

            const modalTitle = modal.querySelector('.channel-modal-title');
            const actionMessage = modal.querySelector('.action-message');
            const renameInputContainer = modal.querySelector('.rename-input-container');
            const cancelBtn = modal.querySelector('#channel-modal-cancel-btn');
            

            let actionHandler;
            
            switch (action) {
                case 'rename':
                    if (modalTitle) modalTitle.textContent = 'Rename Channel';
                    if (actionMessage) actionMessage.textContent = `Enter the new name for "${channel.name}":`;
                    
                    if (renameInputContainer) renameInputContainer.classList.remove('hidden');
                    
                    const nameInput = modal.querySelector('#new-channel-name');
                    if (nameInput) {
                        nameInput.value = channel.name;
                        

                        if (!nameInput.dataset.listenerAttached) {
                            nameInput.addEventListener('input', function() {
                                let val = this.value.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9\-_]/g, '');
                                this.value = val;
                            });
                            nameInput.dataset.listenerAttached = 'true';
                        }
                        

                        setTimeout(() => {
                            nameInput.focus();
                        }, 50);
                    }
                    
                    if (confirmBtn) {
                        confirmBtn.classList.add('channel-modal-btn-primary');
                        const confirmText = confirmBtn.querySelector('.confirm-text');
                        if (confirmText) confirmText.textContent = 'Rename';
                    }
                    
                    actionHandler = () => {
                        if (nameInput) {
                            const newName = nameInput.value.trim();
                            if (newName && newName !== channel.name) {
                                handleRenameChannel(channel, newName);
                            } else {
                                showToast('Please enter a different name for the channel', 'info');
                                return false; 
                            }
                        }
                        return true; 
                    };
                    break;
                    
                case 'delete':
                    safeSetContent('.channel-modal-icon i', icon => {
                        if (icon) icon.className = 'fas fa-trash';
                    });
                    if (modalTitle) modalTitle.textContent = 'Delete Channel';
                    if (actionMessage) actionMessage.textContent = `Are you sure you want to delete "${channel.name}"? This will permanently delete all messages in this channel.`;
                    
                    if (confirmBtn) {
                        confirmBtn.classList.add('channel-modal-btn-danger');
                        const confirmText = confirmBtn.querySelector('.confirm-text');
                        if (confirmText) confirmText.textContent = 'Delete';
                    }
                    
                    actionHandler = () => handleDeleteChannel(channel);
                    break;
                    
                default:
                    console.error('Unknown channel action:', action);
                    return;
            }
            

            if (confirmBtn) confirmBtn.replaceWith(confirmBtn.cloneNode(true));
            if (cancelBtn) cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            

            const newConfirmBtn = modal.querySelector('#channel-modal-confirm-btn');
            const newCancelBtn = modal.querySelector('#channel-modal-cancel-btn');
            

            if (newConfirmBtn) {
                newConfirmBtn.addEventListener('click', () => {
                    if (actionHandler) {
                        const shouldClose = actionHandler();
                        if (shouldClose !== false) {
                            modal.classList.add('hidden');
                        }
                    } else {
                        modal.classList.add('hidden');
                    }
                });
            }
            
            if (newCancelBtn) {
                newCancelBtn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            }
            

            const handleKeydown = (e) => {
                if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                    modal.classList.add('hidden');
                    document.removeEventListener('keydown', handleKeydown);
                }
            };
            document.addEventListener('keydown', handleKeydown);
            

            const handleBackgroundClick = (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                    modal.removeEventListener('click', handleBackgroundClick);
                }
            };
            modal.addEventListener('click', handleBackgroundClick);
            

            modal.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error showing channel action modal:', error);
            showToast('Error displaying the action modal. Please try again.', 'error');
        }
    }

    function handleRenameChannel(channel, newName) {
        const serverId = document.querySelector('meta[name="server-id"]')?.content;
        if (!serverId) {
            showToast('Server ID not found', 'error', 5000, 'Error');
            return;
        }
        

        showToast(`Renaming channel to "${newName}"...`, 'info', 2000);
        
        fetch(`/api/channels/${channel.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ name: newName })
        })
        .then(async response => {
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
                    throw new Error('Unauthorized');
                }
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${response.status}`);
                } catch (jsonError) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
            }
            return response.json();
        })
        .then(response => {
            if (response && response.success) {
                showToast(`Channel renamed to "${newName}" successfully`, 'success', 5000, 'Channel Renamed');
                loadChannels();
            } else {
                showToast(response.message || 'Failed to rename channel', 'error', 5000, 'Rename Failed');
            }
        })
        .catch(error => {
            console.error('Error renaming channel:', error);
            showToast('Failed to rename channel', 'error', 5000, 'Rename Failed');
        });
    }
    
    function handleDeleteChannel(channel) {
        const serverId = document.querySelector('meta[name="server-id"]')?.content;
        if (!serverId) {
            showToast('Server ID not found', 'error', 5000, 'Error');
            return;
        }
        

        showToast(`Deleting channel "${channel.name}"...`, 'warning', 2000);
        
        fetch(`/api/channels/${channel.id}`, {
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(async response => {
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
                    throw new Error('Unauthorized');
                }
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${response.status}`);
                } catch (jsonError) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
            }
            return response.json();
        })
        .then(response => {
            if (response && response.success) {
                showToast(`Channel "${channel.name}" deleted successfully`, 'success', 5000, 'Channel Deleted');
                loadChannels();
            } else {
                showToast(response.message || 'Failed to delete channel', 'error', 5000, 'Deletion Failed');
            }
        })
        .catch(error => {
            console.error('Error deleting channel:', error);
            showToast('Failed to delete channel', 'error', 5000, 'Deletion Failed');
        });
    }
    
    if (channelSearch) {
        channelSearch.addEventListener('input', debounce(function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            if (!searchTerm) {
                filterChannels(currentFilter);
                return;
            }
            
            const filteredChannels = allChannels.filter(channel => {
                return (
                    channel.name.toLowerCase().includes(searchTerm) ||
                    channel.type.toLowerCase().includes(searchTerm)
                );
            });
            
            renderChannels(filteredChannels);
        }, 300));
    }
    
    loadChannels();
}


function updateServerPreviewBanner(imageUrl) {
    const previewBanner = document.querySelector('.server-banner');
    
    if (previewBanner) {
        previewBanner.style.backgroundImage = `url('${imageUrl}')`;
        previewBanner.classList.remove('bg-gradient-to-b', 'from-[#7a8087]', 'to-[#36393f]');
    }
}


function resetServerPreviewBanner() {
    const previewBanner = document.querySelector('.server-banner');
    
    if (previewBanner) {
        previewBanner.style.backgroundImage = '';
        previewBanner.classList.add('bg-gradient-to-b', 'from-[#7a8087]', 'to-[#36393f]');
    }
}


function initDeleteServerTab() {
    const openDeleteModalBtn = document.getElementById('open-delete-modal');
    const deleteServerModal = document.getElementById('delete-server-modal');
    const closeDeleteModalBtn = document.getElementById('close-delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-server');
    const confirmDeleteBtn = document.getElementById('confirm-delete-server');
    const serverNameToConfirmElements = document.querySelectorAll('.server-name-to-confirm');
    

    const userSearchInput = document.getElementById('user-search');
    const usersContainer = document.getElementById('users-container');
    const selectedUserContainer = document.getElementById('selected-user-container');
    const selectedUserAvatar = document.getElementById('selected-user-avatar');
    const selectedUserName = document.getElementById('selected-user-name');

    const confirmTransferBtn = document.getElementById('confirm-transfer');
    
    const serverId = document.querySelector('meta[name="server-id"]')?.content;
    const serverName = document.querySelector('.w-60.bg-discord-light .text-sm.font-semibold')?.textContent;
    
    if (!serverId || !serverName || !openDeleteModalBtn || !deleteServerModal) return;
    
    serverNameToConfirmElements.forEach(element => {
        element.textContent = serverName;
    });
    

    let escKeyHandler;
    let backgroundClickHandler;
    let allMembers = [];
    let selectedUserId = null;
    
    function openModal() {

        if (escKeyHandler) {
            document.removeEventListener('keydown', escKeyHandler);
        }
        
        if (backgroundClickHandler) {
            deleteServerModal.removeEventListener('click', backgroundClickHandler);
        }
        

        escKeyHandler = (e) => {
            if (e.key === 'Escape' && !deleteServerModal.classList.contains('hidden')) {
                closeModal();
            }
        };
        
        backgroundClickHandler = (e) => {
            if (e.target === deleteServerModal) {
                closeModal();
            }
        };
        

        document.addEventListener('keydown', escKeyHandler);
        deleteServerModal.addEventListener('click', backgroundClickHandler);
        

        deleteServerModal.classList.remove('hidden');
        setTimeout(() => {
            deleteServerModal.querySelector('.bg-discord-dark').classList.add('scale-100');
            deleteServerModal.querySelector('.bg-discord-dark').classList.remove('scale-95');
        }, 10);
        

        loadMembersForTransfer();
    }
    
    function closeModal() {

        if (escKeyHandler) {
            document.removeEventListener('keydown', escKeyHandler);
            escKeyHandler = null;
        }
        
        if (backgroundClickHandler) {
            deleteServerModal.removeEventListener('click', backgroundClickHandler);
            backgroundClickHandler = null;
        }
        

        deleteServerModal.querySelector('.bg-discord-dark').classList.add('scale-95');
        deleteServerModal.querySelector('.bg-discord-dark').classList.remove('scale-100');
        setTimeout(() => {
            deleteServerModal.classList.add('hidden');
            resetTransferSection();
        }, 200);
    }
    

    
    function resetTransferSection() {
        if (userSearchInput) userSearchInput.value = '';
        if (usersContainer) usersContainer.classList.add('hidden');
        if (selectedUserContainer) selectedUserContainer.classList.add('hidden');
        if (confirmTransferBtn) {
            confirmTransferBtn.disabled = true;
            confirmTransferBtn.classList.add('opacity-50', 'cursor-not-allowed');
            confirmTransferBtn.textContent = 'Transfer Ownership';
        }
        selectedUserId = null;
    }
    
    async function loadMembersForTransfer() {
        try {
            const response = await window.serverAPI.getServerMembers(serverId);
            
            if (response && response.success && response.data && response.data.members) {

                allMembers = response.data.members.filter(member => {

                    if (member.role === 'owner') return false;
                    

                    if (member.username.toLowerCase() === 'titibot') return false;
                    if (member.status === 'bot') return false;
                    
                    return true;
                });
            } else if (response && response.members) {

                allMembers = response.members.filter(member => {
                    if (member.role === 'owner') return false;
                    if (member.username.toLowerCase() === 'titibot') return false;
                    if (member.status === 'bot') return false;
                    return true;
                });
            } else {
                allMembers = [];
            }
        } catch (error) {
            console.error('Error loading members for transfer:', error);
            showToast('Failed to load server members', 'error');
            allMembers = [];
        }
    }
    
    function renderSearchResults(members) {
        if (!usersContainer) return;
        
        if (!members || members.length === 0) {
            usersContainer.innerHTML = `
                <div class="p-2 text-discord-lighter text-center">
                    No members found
                </div>
            `;
            return;
        }
        
        usersContainer.innerHTML = '';
        
        members.forEach(member => {
            const memberElement = document.createElement('div');
            memberElement.className = 'p-2 hover:bg-discord-dark-input cursor-pointer flex items-center result-item';
            memberElement.dataset.userId = member.id;
            
            let avatarContent;
            if (member.avatar_url) {
                avatarContent = `<img src="${member.avatar_url}" alt="Avatar" class="w-full h-full object-cover">`;
            } else {
                avatarContent = `<img src="/public/assets/common/default-profile-picture.png" alt="Default Avatar" class="w-full h-full object-cover">`;
            }
            

            const roleName = member.role.charAt(0).toUpperCase() + member.role.slice(1);
            

            let roleBadgeClass = '';
            if (member.role === 'admin') {
                roleBadgeClass = 'bg-red-500';
            } else if (member.role === 'moderator') {
                roleBadgeClass = 'bg-blue-500';
            } else {
                roleBadgeClass = 'bg-discord-dark-input';
            }
            
            memberElement.innerHTML = `
                <div class="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                    ${avatarContent}
                </div>
                <div class="flex-grow">
                    <div class="flex items-center">
                        <div class="text-white mr-2">${member.display_name || member.username}</div>
                        <span class="px-1.5 py-0.5 text-xs rounded ${roleBadgeClass} text-white">${roleName}</span>
                    </div>
                    <div class="text-discord-lighter text-xs">
                        ${member.status ? member.status : 'offline'}
                    </div>
                </div>
            `;
            
            memberElement.addEventListener('click', () => selectUser(member));
            
            usersContainer.appendChild(memberElement);
        });
    }
    
    function selectUser(member) {
        const selectedUserRoleBadge = document.getElementById('selected-user-role-badge');
        const selectedUserStatus = document.getElementById('selected-user-status');
        const selectedUserStatusIndicator = document.getElementById('selected-user-status-indicator');
        
        if (!selectedUserContainer || !selectedUserAvatar || !selectedUserName || 
            !selectedUserRoleBadge || !confirmTransferBtn || !usersContainer) return;
        
        selectedUserId = member.id;
        

        if (member.avatar_url) {
            selectedUserAvatar.innerHTML = `<img src="${member.avatar_url}" alt="Avatar" class="w-full h-full object-cover">`;
        } else {
            selectedUserAvatar.innerHTML = `<img src="/public/assets/common/default-profile-picture.png" alt="Default Avatar" class="w-full h-full object-cover">`;
        }
        
        selectedUserName.textContent = member.display_name || member.username;
        

        const roleName = member.role.charAt(0).toUpperCase() + member.role.slice(1);
        

        if (member.role === 'admin') {
            selectedUserRoleBadge.className = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white';
        } else {

            selectedUserRoleBadge.className = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-500 text-white';
        }
        selectedUserRoleBadge.textContent = roleName;
        

        if (selectedUserStatus && selectedUserStatusIndicator) {
            const status = member.status || 'offline';
            selectedUserStatus.textContent = status;
            

            switch (status) {
                case 'online':
                    selectedUserStatusIndicator.className = 'w-2 h-2 rounded-full mr-1.5 bg-green-500';
                    break;
                case 'idle':
                case 'afk':
                    selectedUserStatusIndicator.className = 'w-2 h-2 rounded-full mr-1.5 bg-yellow-500';
                    break;
                case 'do_not_disturb':
                    selectedUserStatusIndicator.className = 'w-2 h-2 rounded-full mr-1.5 bg-red-500';
                    break;
                default:
                    selectedUserStatusIndicator.className = 'w-2 h-2 rounded-full mr-1.5 bg-gray-500';
            }
        }
        

        selectedUserContainer.classList.remove('hidden');
        selectedUserContainer.style.opacity = '0';
        selectedUserContainer.style.transform = 'translateY(10px)';
        setTimeout(() => {
            selectedUserContainer.style.transition = 'all 0.3s ease';
            selectedUserContainer.style.opacity = '1';
            selectedUserContainer.style.transform = 'translateY(0)';
        }, 10);
        

        usersContainer.classList.add('hidden');
        

        if (userSearchInput) {
            userSearchInput.value = '';
        }
        

        confirmTransferBtn.disabled = false;
        confirmTransferBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        confirmTransferBtn.classList.add('animate-pulse-once');
        setTimeout(() => {
            confirmTransferBtn.classList.remove('animate-pulse-once');
        }, 1000);
    }
    

    

    if (openDeleteModalBtn) {
        openDeleteModalBtn.removeEventListener('click', openModal);
        openDeleteModalBtn.addEventListener('click', openModal);
    }
    
    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.removeEventListener('click', closeModal);
        closeDeleteModalBtn.addEventListener('click', closeModal);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.removeEventListener('click', closeModal);
        cancelDeleteBtn.addEventListener('click', closeModal);
    }

    

    

    if (userSearchInput) {
        const usersLoading = document.getElementById('users-loading');
        
        userSearchInput.addEventListener('input', debounce(function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            if (!searchTerm) {
                usersContainer.classList.add('hidden');
                usersLoading.classList.add('hidden');
                return;
            }
            

            usersLoading.classList.remove('hidden');
            usersContainer.classList.add('hidden');
            

            setTimeout(() => {
                const filteredMembers = allMembers.filter(member => {
                    return (
                        member.username.toLowerCase().includes(searchTerm) ||
                        (member.display_name && member.display_name.toLowerCase().includes(searchTerm))
                    );
                });
                

                usersLoading.classList.add('hidden');
                renderSearchResults(filteredMembers);
                usersContainer.classList.remove('hidden');
                

                const resultItems = usersContainer.querySelectorAll('.result-item');
                resultItems.forEach((item, index) => {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        item.style.transition = 'all 0.2s ease';
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, index * 50); 
                });
            }, 300);
        }, 300));
        
        userSearchInput.addEventListener('focus', function() {
            if (this.value.trim() !== '') {
                usersContainer.classList.remove('hidden');
            }
        });
    }
    

    
    if (confirmTransferBtn) {
        confirmTransferBtn.addEventListener('click', async function() {
            if (!selectedUserId) return;
            
            try {
                confirmTransferBtn.disabled = true;
                confirmTransferBtn.innerHTML = `
                    <i class="fas fa-spinner fa-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"></i>
                    Transferring...
                `;
                

                showToast('Transferring server ownership...', 'info', 2000);
                
                const response = await window.serverAPI.transferOwnership(serverId, selectedUserId);
                
                if (response && response.success) {
                    showToast('Server ownership transferred successfully', 'success', 5000, 'Ownership Transferred');
                    
                    setTimeout(() => {
                        window.location.href = '/home';
                    }, 1500);
                } else {
                    throw new Error(response.message || 'Failed to transfer server ownership');
                }
            } catch (error) {
                console.error('Error transferring server ownership:', error);
                showToast(error.message || 'Failed to transfer server ownership', 'error', 5000, 'Transfer Failed');
                
                confirmTransferBtn.disabled = false;
                confirmTransferBtn.textContent = 'Transfer Ownership';
            }
        });
    }
    

    if (confirmDeleteBtn) {

        const oldListener = confirmDeleteBtn.onclick;
        if (oldListener) {
            confirmDeleteBtn.removeEventListener('click', oldListener);
        }
        
        confirmDeleteBtn.addEventListener('click', async function() {
            try {
                confirmDeleteBtn.disabled = true;
                confirmDeleteBtn.innerHTML = `
                    <i class="fas fa-spinner fa-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"></i>
                    Deleting...
                `;
                

                showToast('Deleting server...', 'warning', 2000);
                
                const response = await window.serverAPI.deleteUserServer(serverId);
                
                if (response && response.success) {
                    showToast('Server has been deleted successfully', 'success', 5000, 'Server Deleted');
                    
                    setTimeout(() => {
                        window.location.href = '/home';
                    }, 1500);
                } else {
                    throw new Error(response.message || 'Failed to delete server');
                }
            } catch (error) {
                console.error('Error deleting server:', error);
                showToast(error.message || 'Failed to delete server', 'error', 5000, 'Deletion Failed');
                
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = 'Delete Server';
            }
        });
    }
}


function initServerInputApproveButtons(serverId) {

    const serverNameInput = document.getElementById('server-name');
    const approveServerNameBtn = document.getElementById('approve-server-name');
    
    if (serverNameInput && approveServerNameBtn) {
        serverNameInput.dataset.originalValue = serverNameInput.value.trim();
        checkForChanges(serverNameInput, approveServerNameBtn);
        
        serverNameInput.addEventListener('input', function() {
            checkForChanges(this, approveServerNameBtn);
        });
        
        serverNameInput.addEventListener('keyup', function() {
            checkForChanges(this, approveServerNameBtn);
        });
        
        serverNameInput.addEventListener('paste', function() {
            setTimeout(() => checkForChanges(this, approveServerNameBtn), 10);
        });
        
        if (!approveServerNameBtn.dataset.listenerAttached) {
            approveServerNameBtn.dataset.listenerAttached = 'true';
            approveServerNameBtn.addEventListener('click', () => {
                updateServerName(serverId, serverNameInput.value.trim());
            });
        }
    }
    

    const serverDescriptionInput = document.getElementById('server-description');
    const approveServerDescriptionBtn = document.getElementById('approve-server-description');
    
    if (serverDescriptionInput && approveServerDescriptionBtn) {
        serverDescriptionInput.dataset.originalValue = serverDescriptionInput.value.trim();
        checkForChanges(serverDescriptionInput, approveServerDescriptionBtn);
        
        serverDescriptionInput.addEventListener('input', function() {
            checkForChanges(this, approveServerDescriptionBtn);
        });
        
        serverDescriptionInput.addEventListener('keyup', function() {
            checkForChanges(this, approveServerDescriptionBtn);
        });
        
        serverDescriptionInput.addEventListener('paste', function() {
            setTimeout(() => checkForChanges(this, approveServerDescriptionBtn), 10);
        });
        
        if (!approveServerDescriptionBtn.dataset.listenerAttached) {
            approveServerDescriptionBtn.dataset.listenerAttached = 'true';
            approveServerDescriptionBtn.addEventListener('click', () => {
                updateServerDescription(serverId, serverDescriptionInput.value.trim());
            });
        }
    }
    

    const isPublicInput = document.getElementById('is-public');
    const approveIsPublicBtn = document.getElementById('approve-is-public');
    
    if (isPublicInput && approveIsPublicBtn) {
        isPublicInput.dataset.originalValue = isPublicInput.checked ? '1' : '0';
        checkForChangesCheckbox(isPublicInput, approveIsPublicBtn);
        
        isPublicInput.addEventListener('change', function() {
            updateServerPublic(serverId, this.checked);
        });
        
        if (!approveIsPublicBtn.dataset.listenerAttached) {
            approveIsPublicBtn.dataset.listenerAttached = 'true';
            approveIsPublicBtn.addEventListener('click', () => {
                updateServerPublic(serverId, isPublicInput.checked);
            });
        }
    }
    

    const serverCategoryInput = document.getElementById('server-category');
    const approveServerCategoryBtn = document.getElementById('approve-server-category');
    
    if (serverCategoryInput && approveServerCategoryBtn) {
        serverCategoryInput.dataset.originalValue = serverCategoryInput.value;
        checkForChanges(serverCategoryInput, approveServerCategoryBtn);
        
        serverCategoryInput.addEventListener('change', function() {
            checkForChanges(this, approveServerCategoryBtn);
        });
        
        if (!approveServerCategoryBtn.dataset.listenerAttached) {
            approveServerCategoryBtn.dataset.listenerAttached = 'true';
            approveServerCategoryBtn.addEventListener('click', () => {
                updateServerCategory(serverId, serverCategoryInput.value);
            });
        }
    }
}


function checkForChanges(input, approveBtn) {
    if (!input || !approveBtn) return;
    
    const currentValue = input.value.trim();
    const originalValue = (input.dataset.originalValue || '').trim();
    
    if (currentValue !== originalValue) {
        approveBtn.style.display = 'flex';
        approveBtn.classList.remove('hidden');
        setTimeout(() => {
            approveBtn.classList.add('show');
        }, 10);
    } else {
        approveBtn.classList.remove('show');
        setTimeout(() => {
            approveBtn.style.display = 'none';
            approveBtn.classList.add('hidden');
        }, 300);
    }
}


function checkForChangesCheckbox(input, approveBtn) {
    if (!input || !approveBtn) return;
    
    const currentValue = input.checked ? '1' : '0';
    const originalValue = input.dataset.originalValue || '0';
    
    if (currentValue !== originalValue) {
        approveBtn.style.display = 'flex';
        approveBtn.classList.remove('hidden');
        setTimeout(() => {
            approveBtn.classList.add('show');
        }, 10);
    } else {
        approveBtn.classList.remove('show');
        setTimeout(() => {
            approveBtn.style.display = 'none';
            approveBtn.classList.add('hidden');
        }, 300);
    }
}


async function updateServerName(serverId, name) {
    const approveBtn = document.getElementById('approve-server-name');
    const nameInput = document.getElementById('server-name');
    
    if (!name) {
        showToast('Server name cannot be empty', 'error');
        return;
    }
    
    if (name.length < 2 || name.length > 50) {
        showToast('Server name must be between 2 and 50 characters', 'error');
        return;
    }
    
    approveBtn.disabled = true;
    const originalIcon = approveBtn.innerHTML;
    approveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        const data = await window.serverAPI.updateServerName(serverId, name);
        
        if (data.success) {
            showToast('Server name updated successfully', 'success');
            
            nameInput.dataset.originalValue = name;
            nameInput.value = name;
            

            const titleElement = document.querySelector('title');
            if (titleElement) {
                titleElement.textContent = `${name} - Server Settings`;
            }
            

            updateServerNameInUI(name);
            
            approveBtn.classList.remove('show');
            setTimeout(() => {
                approveBtn.style.display = 'none';
                approveBtn.classList.add('hidden');
            }, 300);
        } else {
            throw new Error(data.message || 'Failed to update server name');
        }
    } catch (error) {
        console.error('Error updating server name:', error);
        showToast(error.message || 'Error updating server name', 'error');
    } finally {
        approveBtn.disabled = false;
        approveBtn.innerHTML = originalIcon;
    }
}


async function updateServerDescription(serverId, description) {
    const approveBtn = document.getElementById('approve-server-description');
    const descriptionInput = document.getElementById('server-description');
    
    if (description.length > 500) {
        showToast('Server description cannot exceed 500 characters', 'error');
        return;
    }
    
    approveBtn.disabled = true;
    const originalIcon = approveBtn.innerHTML;
    approveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        const data = await window.serverAPI.updateServerDescription(serverId, description);
        
        if (data.success) {
            showToast('Server description updated successfully', 'success');
            
            descriptionInput.dataset.originalValue = description;
            descriptionInput.value = description;
            
            approveBtn.classList.remove('show');
            setTimeout(() => {
                approveBtn.style.display = 'none';
                approveBtn.classList.add('hidden');
            }, 300);
        } else {
            throw new Error(data.message || 'Failed to update server description');
        }
    } catch (error) {
        console.error('Error updating server description:', error);
        showToast(error.message || 'Error updating server description', 'error');
    } finally {
        approveBtn.disabled = false;
        approveBtn.innerHTML = originalIcon;
    }
}


async function updateServerPublic(serverId, isPublic) {
    const approveBtn = document.getElementById('approve-is-public');
    const publicInput = document.getElementById('is-public');
    
    if (!publicInput) {
        console.error('Public input element not found');
        return;
    }
    
    const checkboxWrapper = publicInput.nextElementSibling;
    

    publicInput.disabled = true;
    

    let originalCheckboxContent = '';
    if (checkboxWrapper) {
        originalCheckboxContent = checkboxWrapper.innerHTML;
        checkboxWrapper.innerHTML = '<i class="fas fa-spinner fa-spin text-white"></i>';
    }
    
    try {
        const data = await window.serverAPI.updateServerPublic(serverId, isPublic);
        
        if (data.success) {
            showToast(`Server ${isPublic ? 'made public' : 'made private'}`, 'success');
            
            publicInput.dataset.originalValue = isPublic ? '1' : '0';
            

            if (approveBtn) {
                approveBtn.classList.remove('show');
                setTimeout(() => {
                    if (approveBtn) {
                        approveBtn.style.display = 'none';
                        approveBtn.classList.add('hidden');
                    }
                }, 300);
            }
        } else {

            publicInput.checked = !isPublic;
            throw new Error(data.message || 'Failed to update server visibility');
        }
    } catch (error) {
        console.error('Error updating server visibility:', error);
        showToast(error.message || 'Error updating server visibility', 'error');
    } finally {
        publicInput.disabled = false;
        

        if (checkboxWrapper) {
            checkboxWrapper.innerHTML = originalCheckboxContent;
            

            if (publicInput.checked) {
                checkboxWrapper.classList.add('bg-discord-blurple');
                checkboxWrapper.classList.add('border-discord-blurple');
                const checkElement = checkboxWrapper.querySelector('.checkbox-check');
                if (checkElement) {
                    checkElement.style.opacity = '1';
                    checkElement.style.transform = 'scale(1)';
                }
            } else {
                checkboxWrapper.classList.remove('bg-discord-blurple');
                checkboxWrapper.classList.remove('border-discord-blurple');
                const checkElement = checkboxWrapper.querySelector('.checkbox-check');
                if (checkElement) {
                    checkElement.style.opacity = '0';
                    checkElement.style.transform = 'scale(0.5)';
                }
            }
        }
    }
}


async function updateServerCategory(serverId, category) {
    const approveBtn = document.getElementById('approve-server-category');
    const categoryInput = document.getElementById('server-category');
    
    approveBtn.disabled = true;
    const originalIcon = approveBtn.innerHTML;
    approveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        const data = await window.serverAPI.updateServerCategory(serverId, category);
        
        if (data.success) {
            showToast('Server category updated successfully', 'success');
            
            categoryInput.dataset.originalValue = category;
            categoryInput.value = category;
            
            approveBtn.classList.remove('show');
            setTimeout(() => {
                approveBtn.style.display = 'none';
                approveBtn.classList.add('hidden');
            }, 300);
        } else {
            throw new Error(data.message || 'Failed to update server category');
        }
    } catch (error) {
        console.error('Error updating server category:', error);
        showToast(error.message || 'Error updating server category', 'error');
    } finally {
        approveBtn.disabled = false;
        approveBtn.innerHTML = originalIcon;
    }
}
