import ImageCutter from '../common/image-cutter.js';

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

/**
 * Update server name in various UI elements
 */
function updateServerNameInUI(newName) {
    const sidebarServerName = document.querySelector('.w-60.bg-discord-light .text-sm.font-semibold');
    if (sidebarServerName) {
        sidebarServerName.textContent = newName;
    }
    
    document.title = `misvord - ${newName} Settings`;
}

/**
 * Update server name in preview
 */
function updateServerNamePreview(newName) {
    const serverNamePreview = document.querySelector('.server-name');
    if (serverNamePreview) {
        serverNamePreview.textContent = newName || 'Server Name';
    }
}

/**
 * Update server description in preview
 */
function updateServerDescriptionPreview(newDescription) {
    const serverDescriptionPreview = document.querySelector('.server-description-preview');
    if (serverDescriptionPreview) {
        serverDescriptionPreview.textContent = newDescription || 'Tell people what your server is about...';
    }
}

/**
 * Convert data URL to Blob
 */
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

/**
 * Debounce function to limit how often a function is called
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    if (window.showToast) {
        window.showToast(message, type);
    } else {
        alert(message);
    }
}

/**
 * Initialize the member management tab functionality
 */
function initMemberManagementTab() {
    const membersList = document.getElementById('members-list');
    const memberSearch = document.getElementById('member-search');
    const memberTemplate = document.getElementById('member-template');
    const memberFilter = document.getElementById('member-filter');
    const filterOptions = document.querySelectorAll('.filter-option');
    const serverId = document.querySelector('meta[name="server-id"]')?.content;
    
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
                        <div class="w-full h-full flex items-center justify-center bg-discord-dark text-white font-bold">
                            ${member.username.charAt(0).toUpperCase()}
                        </div>
                    `;
                }
            }
            
            const usernameElement = memberElement.querySelector('.member-username');
            if (usernameElement) {
                const displayName = member.display_name || member.username;
                usernameElement.textContent = displayName;
                if (isBot) {
                    usernameElement.innerHTML = `${displayName} <span class="ml-1 px-1 py-0.5 text-[10px] bg-blue-500 text-white rounded">BOT</span>`;
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
            
            if (isBot || member.role === 'owner') {
                if (promoteBtn) {
                    promoteBtn.style.display = 'none';
                }
                if (demoteBtn) {
                    demoteBtn.style.display = 'none';
                }
                if (kickBtn) {
                    kickBtn.style.display = 'none';
                }
            } else if (member.role === 'admin') {
                if (promoteBtn) promoteBtn.disabled = true;
            } else if (member.role === 'member') {
                if (demoteBtn) demoteBtn.disabled = true;
            }
            
            if (promoteBtn && !promoteBtn.disabled && promoteBtn.style.display !== 'none') {
                promoteBtn.addEventListener('click', () => showMemberActionModal('promote', member));
            }
            
            if (demoteBtn && !demoteBtn.disabled && demoteBtn.style.display !== 'none') {
                demoteBtn.addEventListener('click', () => showMemberActionModal('demote', member));
            }
            
            if (kickBtn && !kickBtn.disabled && kickBtn.style.display !== 'none') {
                kickBtn.addEventListener('click', () => showMemberActionModal('kick', member));
            }
            
            membersList.appendChild(memberElement);
        });
    }
    
    function showMemberActionModal(action, member) {
        const modal = document.getElementById('member-action-modal');
        const modalIcon = modal.querySelector('.modal-icon i');
        const modalTitle = modal.querySelector('.modal-title');
        const memberName = modal.querySelector('.member-name');
        const memberCurrentRole = modal.querySelector('.member-current-role');
        const actionMessage = modal.querySelector('.action-message');
        const roleChangePreview = modal.querySelector('.role-change-preview');
        const fromRole = modal.querySelector('.from-role');
        const toRole = modal.querySelector('.to-role');
        const confirmBtn = modal.querySelector('#modal-confirm-btn');
        const confirmText = confirmBtn.querySelector('.confirm-text');
        const cancelBtn = modal.querySelector('#modal-cancel-btn');
        
        modalIcon.className = '';
        confirmBtn.className = 'modal-btn modal-btn-confirm';
        roleChangePreview.classList.add('hidden');
        
        const avatarDiv = modal.querySelector('.member-avatar-small');
        if (member.avatar_url) {
            avatarDiv.innerHTML = `<img src="${member.avatar_url}" alt="Avatar" class="w-full h-full object-cover">`;
        } else {
            avatarDiv.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-discord-dark text-white font-bold">
                    ${member.username.charAt(0).toUpperCase()}
                </div>
            `;
        }
        
                    memberName.textContent = member.display_name || member.username;
        memberCurrentRole.textContent = `Current Role: ${member.role.charAt(0).toUpperCase() + member.role.slice(1)}`;
        
        let actionHandler;
        
        switch (action) {
            case 'promote':
                modalIcon.className = 'fas fa-arrow-up';
                modalTitle.textContent = 'Promote Member';
                actionMessage.textContent = `Are you sure you want to promote ${member.display_name || member.username} to Admin? This will give them additional permissions to manage channels and kick members.`;
                
                roleChangePreview.classList.remove('hidden');
                fromRole.textContent = member.role.charAt(0).toUpperCase() + member.role.slice(1);
                fromRole.className = `role-badge ${member.role}`;
                toRole.textContent = 'Admin';
                toRole.className = 'role-badge admin';
                
                confirmBtn.classList.add('warning');
                confirmText.textContent = 'Promote';
                
                actionHandler = () => handlePromote(member);
                break;
                
            case 'demote':
                modalIcon.className = 'fas fa-arrow-down';
                modalTitle.textContent = 'Demote Member';
                actionMessage.textContent = `Are you sure you want to demote ${member.display_name || member.username} to Member? This will remove their administrative permissions.`;
                
                roleChangePreview.classList.remove('hidden');
                fromRole.textContent = member.role.charAt(0).toUpperCase() + member.role.slice(1);
                fromRole.className = `role-badge ${member.role}`;
                toRole.textContent = 'Member';
                toRole.className = 'role-badge member';
                
                confirmBtn.classList.add('warning');
                confirmText.textContent = 'Demote';
                
                actionHandler = () => handleDemote(member);
                break;
                
            case 'kick':
                modalIcon.className = 'fas fa-user-times';
                modalTitle.textContent = 'Kick Member';
                actionMessage.textContent = `Are you sure you want to kick ${member.display_name || member.username} from the server? They will be removed immediately and can only rejoin with a new invite.`;
                
                confirmBtn.classList.add('danger');
                confirmText.textContent = 'Kick';
                
                actionHandler = () => handleKick(member);
                break;
        }
        
        const handleConfirm = () => {
            modal.classList.add('hidden');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleKeydown);
            actionHandler();
        };
        
        const handleCancel = () => {
            modal.classList.add('hidden');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleKeydown);
        };
        
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        document.addEventListener('keydown', handleKeydown);
        
        modal.classList.remove('hidden');
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        });
    }

    async function handlePromote(member) {
        try {
            const response = await window.serverAPI.promoteMember(serverId, member.id);
            if (response && response.success) {
                                    showToast(`${member.display_name || member.username} has been promoted to ${response.new_role}`, 'success');
                loadMembers();
            } else {
                throw new Error(response.message || 'Failed to promote member');
            }
        } catch (error) {
            console.error('Error promoting member:', error);
            showToast(error.message || 'Failed to promote member', 'error');
        }
    }
    
    async function handleDemote(member) {
        try {
            const response = await window.serverAPI.demoteMember(serverId, member.id);
            if (response && response.success) {
                                    showToast(`${member.display_name || member.username} has been demoted to ${response.new_role}`, 'success');
                loadMembers();
            } else {
                throw new Error(response.message || 'Failed to demote member');
            }
        } catch (error) {
            console.error('Error demoting member:', error);
            showToast(error.message || 'Failed to demote member', 'error');
        }
    }
    
    async function handleKick(member) {
        try {
            const response = await window.serverAPI.kickMember(serverId, member.id);
            if (response && response.success) {
                                    showToast(`${member.display_name || member.username} has been kicked from the server`, 'success');
                loadMembers();
            } else {
                throw new Error(response.message || 'Failed to kick member');
            }
        } catch (error) {
            console.error('Error kicking member:', error);
            showToast(error.message || 'Failed to kick member', 'error');
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

/**
 * Initialize the channel management tab functionality
 */
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
        
        window.channelAPI.getChannels(serverId).done(function(response) {
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
        }).fail(function(xhr, status, error) {
            console.error('Error loading server channels:', error);
            
            if (xhr.status === 401) {
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
                return;
            }
            
            channelsList.innerHTML = `
                <div class="channels-empty-state">
                    <i class="fas fa-exclamation-triangle text-red-400"></i>
                    <div class="text-lg">Error loading channels</div>
                    <div class="text-sm">Please try refreshing the page</div>
                </div>
            `;
        });
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
        const modal = document.getElementById('channel-action-modal');
        const modalIcon = modal.querySelector('.channel-modal-icon i');
        const modalTitle = modal.querySelector('.channel-modal-title');
        const channelName = modal.querySelector('.channel-modal-name');
        const actionMessage = modal.querySelector('.action-message');
        const renameInputContainer = modal.querySelector('.rename-input-container');
        const confirmBtn = modal.querySelector('#channel-modal-confirm-btn');
        const confirmText = confirmBtn.querySelector('.confirm-text');
        const cancelBtn = modal.querySelector('#channel-modal-cancel-btn');
        
        modalIcon.className = '';
        confirmBtn.className = 'channel-modal-btn channel-modal-btn-confirm';
        renameInputContainer.classList.add('hidden');
        
        const channelIconDiv = modal.querySelector('.channel-icon-small i');
        if (channelIconDiv) {
            if (channel.type === 'voice') {
                channelIconDiv.className = 'fas fa-volume-up';
            } else {
                channelIconDiv.className = 'fas fa-hashtag';
            }
        }
        
        channelName.textContent = channel.name;
        
        let actionHandler;
        
        switch (action) {
            case 'rename':
                modalIcon.className = 'fas fa-edit';
                modalTitle.textContent = 'Rename Channel';
                actionMessage.textContent = `Enter the new name for "${channel.name}":`;
                
                renameInputContainer.classList.remove('hidden');
                const nameInput = modal.querySelector('#new-channel-name');
                nameInput.value = channel.name;

                // Attach listener once to sanitize input (replace spaces with hyphens and remove invalid chars)
                if (nameInput && !nameInput.dataset.listenerAttached) {
                    nameInput.addEventListener('input', function() {
                        let val = this.value.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9\-_]/g, '');
                        this.value = val;
                    });
                    nameInput.dataset.listenerAttached = 'true';
                }
                
                confirmBtn.classList.add('channel-modal-btn-primary');
                confirmText.textContent = 'Rename';
                
                actionHandler = () => {
                    const newName = nameInput.value.trim();
                    if (newName && newName !== channel.name) {
                        handleRenameChannel(channel, newName);
                    }
                };
                break;
                
            case 'delete':
                modalIcon.className = 'fas fa-trash';
                modalTitle.textContent = 'Delete Channel';
                actionMessage.textContent = `Are you sure you want to delete "${channel.name}"? This will permanently delete all messages in this channel.`;
                
                confirmBtn.classList.add('channel-modal-btn-danger');
                confirmText.textContent = 'Delete';
                
                actionHandler = () => handleDeleteChannel(channel);
                break;
        }
        
        const handleConfirm = () => {
            modal.classList.add('hidden');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleKeydown);
            actionHandler();
        };
        
        const handleCancel = () => {
            modal.classList.add('hidden');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleKeydown);
        };
        
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        document.addEventListener('keydown', handleKeydown);
        
        modal.classList.remove('hidden');
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        });
    }

    function handleRenameChannel(channel, newName) {
        window.channelAPI.updateChannel(channel.id, { name: newName }).done(function(response) {
            if (response && response.success) {
                showToast(`Channel renamed to "${newName}" successfully`, 'success');
                loadChannels();
            } else {
                showToast(response.message || 'Failed to rename channel', 'error');
            }
        }).fail(function(xhr, status, error) {
            console.error('Error renaming channel:', error);
            showToast('Failed to rename channel', 'error');
        });
    }
    
    function handleDeleteChannel(channel) {
        window.channelAPI.deleteChannel(channel.id).done(function(response) {
            if (response && response.success) {
                showToast(`Channel "${channel.name}" deleted successfully`, 'success');
                loadChannels();
            } else {
                showToast(response.message || 'Failed to delete channel', 'error');
            }
        }).fail(function(xhr, status, error) {
            console.error('Error deleting channel:', error);
            showToast('Failed to delete channel', 'error');
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

/**
 * Update the server banner in the preview panel
 */
function updateServerPreviewBanner(imageUrl) {
    const previewBanner = document.querySelector('.server-banner');
    
    if (previewBanner) {
        previewBanner.style.backgroundImage = `url('${imageUrl}')`;
        previewBanner.classList.remove('bg-gradient-to-b', 'from-[#7a8087]', 'to-[#36393f]');
    }
}

/**
 * Reset the server banner in the preview panel
 */
function resetServerPreviewBanner() {
    const previewBanner = document.querySelector('.server-banner');
    
    if (previewBanner) {
        previewBanner.style.backgroundImage = '';
        previewBanner.classList.add('bg-gradient-to-b', 'from-[#7a8087]', 'to-[#36393f]');
    }
}

/**
 * Initialize the delete server tab functionality
 */
function initDeleteServerTab() {
    const openDeleteModalBtn = document.getElementById('open-delete-modal');
    const deleteServerModal = document.getElementById('delete-server-modal');
    const closeDeleteModalBtn = document.getElementById('close-delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-server');
    const confirmDeleteBtn = document.getElementById('confirm-delete-server');
    const confirmServerNameInput = document.getElementById('confirm-server-name');
    const deleteServerNameSpan = document.getElementById('delete-server-name');
    const serverNameToConfirmElements = document.querySelectorAll('.server-name-to-confirm');
    
    const serverId = document.querySelector('meta[name="server-id"]')?.content;
    const serverName = document.querySelector('.w-60.bg-discord-light .text-sm.font-semibold')?.textContent;
    
    if (!serverId || !serverName || !openDeleteModalBtn || !deleteServerModal) return;
    
    if (deleteServerNameSpan) {
        deleteServerNameSpan.textContent = serverName;
    }
    
    serverNameToConfirmElements.forEach(element => {
        element.textContent = serverName;
    });
    
    function openModal() {
        deleteServerModal.classList.remove('hidden');
        setTimeout(() => {
            deleteServerModal.querySelector('.bg-discord-dark').classList.add('scale-100');
            deleteServerModal.querySelector('.bg-discord-dark').classList.remove('scale-95');
            confirmServerNameInput.focus();
        }, 10);
    }
    
    function closeModal() {
        deleteServerModal.querySelector('.bg-discord-dark').classList.add('scale-95');
        deleteServerModal.querySelector('.bg-discord-dark').classList.remove('scale-100');
        setTimeout(() => {
            deleteServerModal.classList.add('hidden');
            confirmServerNameInput.value = '';
            updateDeleteButton();
        }, 200);
    }
    
    function updateDeleteButton() {
        const inputValue = confirmServerNameInput.value;
        const isMatch = inputValue === serverName;
        
        if (isMatch) {
            confirmDeleteBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            confirmDeleteBtn.removeAttribute('disabled');
        } else {
            confirmDeleteBtn.classList.add('opacity-50', 'cursor-not-allowed');
            confirmDeleteBtn.setAttribute('disabled', 'disabled');
        }
    }
    
    if (openDeleteModalBtn) {
        openDeleteModalBtn.addEventListener('click', openModal);
    }
    
    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener('click', closeModal);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeModal);
    }
    
    if (confirmServerNameInput) {
        confirmServerNameInput.addEventListener('input', updateDeleteButton);
    }
    
    deleteServerModal.addEventListener('click', (e) => {
        if (e.target === deleteServerModal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !deleteServerModal.classList.contains('hidden')) {
            closeModal();
        }
    });
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (confirmServerNameInput.value !== serverName) return;
            
            try {
                confirmDeleteBtn.disabled = true;
                confirmDeleteBtn.innerHTML = `
                    <i class="fas fa-spinner fa-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"></i>
                    Deleting...
                `;
                
                const response = await window.serverAPI.deleteUserServer(serverId);
                
                if (response && response.success) {
                    showToast('Server has been deleted successfully', 'success');
                    
                    setTimeout(() => {
                        window.location.href = '/home';
                    }, 1500);
                } else {
                    throw new Error(response.message || 'Failed to delete server');
                }
            } catch (error) {
                console.error('Error deleting server:', error);
                showToast(error.message || 'Failed to delete server', 'error');
                
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = 'Delete Server';
            }
        });
    }
}

/**
 * Initialize approve buttons for server input fields
 */
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
        
        approveServerNameBtn.addEventListener('click', function() {
            updateServerName(serverId, serverNameInput.value.trim());
        });
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
        
        approveServerDescriptionBtn.addEventListener('click', function() {
            updateServerDescription(serverId, serverDescriptionInput.value.trim());
        });
    }
    

    const isPublicInput = document.getElementById('is-public');
    const approveIsPublicBtn = document.getElementById('approve-is-public');
    
    if (isPublicInput && approveIsPublicBtn) {
        isPublicInput.dataset.originalValue = isPublicInput.checked ? '1' : '0';
        checkForChangesCheckbox(isPublicInput, approveIsPublicBtn);
        
        isPublicInput.addEventListener('change', function() {
            // Auto-approve the change immediately when checkbox is clicked
            updateServerPublic(serverId, this.checked);
        });
        
        approveIsPublicBtn.addEventListener('click', function() {
            updateServerPublic(serverId, isPublicInput.checked);
        });
    }
    

    const serverCategoryInput = document.getElementById('server-category');
    const approveServerCategoryBtn = document.getElementById('approve-server-category');
    
    if (serverCategoryInput && approveServerCategoryBtn) {
        serverCategoryInput.dataset.originalValue = serverCategoryInput.value;
        checkForChanges(serverCategoryInput, approveServerCategoryBtn);
        
        serverCategoryInput.addEventListener('change', function() {
            checkForChanges(this, approveServerCategoryBtn);
        });
        
        approveServerCategoryBtn.addEventListener('click', function() {
            updateServerCategory(serverId, serverCategoryInput.value);
        });
    }
}

/**
 * Check for changes and show/hide approve button
 */
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

/**
 * Check for checkbox changes
 */
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

/**
 * Update server name
 */
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

/**
 * Update server description
 */
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

/**
 * Update server public status
 */
async function updateServerPublic(serverId, isPublic) {
    const approveBtn = document.getElementById('approve-is-public');
    const publicInput = document.getElementById('is-public');
    
    if (!publicInput) {
        console.error('Public input element not found');
        return;
    }
    
    const checkboxWrapper = publicInput.nextElementSibling;
    
    // Disable the checkbox during the update
    publicInput.disabled = true;
    
    // Store the original checkbox content and show loading indicator
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
            
            // Only manipulate approveBtn if it exists
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
            // Revert the checkbox state if update failed
            publicInput.checked = !isPublic;
            throw new Error(data.message || 'Failed to update server visibility');
        }
    } catch (error) {
        console.error('Error updating server visibility:', error);
        showToast(error.message || 'Error updating server visibility', 'error');
    } finally {
        publicInput.disabled = false;
        
        // Restore the original checkbox content
        if (checkboxWrapper) {
            checkboxWrapper.innerHTML = originalCheckboxContent;
            
            // Update the checkbox appearance based on its current state
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

/**
 * Update server category
 */
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
