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
    } else if (activeSection === 'delete') {
        initDeleteServerTab();
    } else if (activeSection === 'my-profile') {
        initMyProfileTab();
    }
    
    initCloseButton();
}

function initServerIconUpload() {
    const iconContainer = document.getElementById('server-icon-container');
    const iconInput = document.getElementById('server-icon-input');
    const iconPreview = document.getElementById('server-icon-preview');
    
    if (!iconContainer || !iconInput) return;
    
    try {
        const iconCutter = new ImageCutter({
            container: iconContainer,
            type: 'profile',
            modalTitle: 'Upload Server Icon',
            aspectRatio: 1,
            onCrop: (result) => {
                if (result && result.error) {
                    showToast(result.message || 'Error cropping server icon', 'error');
                    return;
                }
                
                if (iconPreview) {
                    iconPreview.src = result.dataUrl;
                    iconPreview.classList.remove('hidden');
                    
                    const placeholder = document.getElementById('server-icon-placeholder');
                    if (placeholder) placeholder.classList.add('hidden');
                }
                
                iconContainer.dataset.croppedImage = result.dataUrl;
                
                updateServerPreviewIcon(result.dataUrl);
                
                showToast('Server icon updated. Save changes to apply.', 'info');
            }
        });
        
        window.serverIconCutter = iconCutter;
    } catch (error) {
        console.error('Error initializing image cutter:', error);
    }
    
    if (iconContainer) {
        iconContainer.addEventListener('click', function(e) {
            e.preventDefault();
            iconInput.click();
        });
    }
    
    if (iconInput) {
        iconInput.addEventListener('change', function() {
            if (!this.files || !this.files[0]) return;
            
            const file = this.files[0];
            
            if (!file.type.match('image.*')) {
                showToast('Please select a valid image file', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    if (window.serverIconCutter) {
                        window.serverIconCutter.loadImage(e.target.result);
                    } else {
                        if (iconPreview) {
                            iconPreview.src = e.target.result;
                            iconPreview.classList.remove('hidden');
                            
                            const placeholder = document.getElementById('server-icon-placeholder');
                            if (placeholder) placeholder.classList.add('hidden');
                        }
                        
                        iconContainer.dataset.croppedImage = e.target.result;
                        
                        updateServerPreviewIcon(e.target.result);
                    }
                } catch (error) {
                    showToast('Error processing server icon', 'error');
                }
            };
            
            reader.readAsDataURL(file);
        });
    }
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
    const isPublicCheckbox = document.getElementById('is-public');
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
    
    // Initialize approve buttons for all inputs
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
    let serverDescriptionPreview = document.querySelector('.server-description');
    
    if (newDescription) {
        if (!serverDescriptionPreview) {
            serverDescriptionPreview = document.createElement('div');
            serverDescriptionPreview.className = 'server-description text-xs text-discord-lighter mt-3';
            document.querySelector('.server-info').appendChild(serverDescriptionPreview);
        }
        serverDescriptionPreview.textContent = newDescription;
    } else if (serverDescriptionPreview) {
        serverDescriptionPreview.remove();
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
            filteredMembers = filteredMembers.filter(member => member.role === filterType);
        }
        
        filteredMembers.sort((a, b) => {
            const roleOrder = { 'owner': 0, 'admin': 1, 'member': 2 };
            const roleA = roleOrder[a.role] || 3;
            const roleB = roleOrder[b.role] || 3;
            
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
                usernameElement.textContent = member.username;
            }
            
            const discriminatorElement = memberElement.querySelector('.member-discriminator');
            if (discriminatorElement) {
                discriminatorElement.textContent = `#${member.discriminator || '0000'}`;
            }
            
            const roleElement = memberElement.querySelector('.member-role-badge');
            if (roleElement) {
                roleElement.textContent = member.role.charAt(0).toUpperCase() + member.role.slice(1);
                roleElement.className = `member-role-badge ${member.role}`;
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
            
            if (member.role === 'owner') {
                if (promoteBtn) promoteBtn.disabled = true;
                if (demoteBtn) demoteBtn.disabled = true;
                if (kickBtn) kickBtn.disabled = true;
            } else if (member.role === 'admin') {
                if (promoteBtn) promoteBtn.disabled = true;
            } else if (member.role === 'member') {
                if (demoteBtn) demoteBtn.disabled = true;
            }
            
            if (promoteBtn && !promoteBtn.disabled) {
                promoteBtn.addEventListener('click', () => showMemberActionModal('promote', member));
            }
            
            if (demoteBtn && !demoteBtn.disabled) {
                demoteBtn.addEventListener('click', () => showMemberActionModal('demote', member));
            }
            
            if (kickBtn && !kickBtn.disabled) {
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
        
        memberName.textContent = member.username;
        memberCurrentRole.textContent = `Current Role: ${member.role.charAt(0).toUpperCase() + member.role.slice(1)}`;
        
        let actionHandler;
        
        switch (action) {
            case 'promote':
                modalIcon.className = 'fas fa-arrow-up';
                modalTitle.textContent = 'Promote Member';
                actionMessage.textContent = `Are you sure you want to promote ${member.username} to Admin? This will give them additional permissions to manage channels and kick members.`;
                
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
                actionMessage.textContent = `Are you sure you want to demote ${member.username} to Member? This will remove their administrative permissions.`;
                
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
                actionMessage.textContent = `Are you sure you want to kick ${member.username} from the server? They will be removed immediately and can only rejoin with a new invite.`;
                
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
                showToast(`${member.username} has been promoted to ${response.new_role}`, 'success');
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
                showToast(`${member.username} has been demoted to ${response.new_role}`, 'success');
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
                showToast(`${member.username} has been kicked from the server`, 'success');
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
                return (
                    member.username.toLowerCase().includes(searchTerm) ||
                    member.role.toLowerCase().includes(searchTerm)
                );
            });
            
            renderMembers(filteredMembers);
        }, 300));
    }
    
    loadMembers();
}

/**
 * Initialize server banner upload
 */
function initServerBannerUpload() {
    const bannerContainer = document.getElementById('server-banner-container');
    const bannerInput = document.getElementById('server-banner-input');
    const bannerPreview = document.getElementById('server-banner-preview');
    
    if (!bannerContainer || !bannerInput) return;
    
    try {
        const bannerCutter = new ImageCutter({
            container: bannerContainer,
            type: 'banner',
            modalTitle: 'Upload Server Banner',
            aspectRatio: 16/9,
            onCrop: (result) => {
                if (result && result.error) {
                    showToast(result.message || 'Error cropping server banner', 'error');
                    return;
                }
                
                if (bannerPreview) {
                    bannerPreview.src = result.dataUrl;
                    bannerPreview.classList.remove('hidden');
                    
                    const placeholder = document.getElementById('server-banner-placeholder');
                    if (placeholder) placeholder.classList.add('hidden');
                }
                
                bannerContainer.dataset.croppedImage = result.dataUrl;
                
                updateServerPreviewBanner(result.dataUrl);
                
                showToast('Server banner updated. Save changes to apply.', 'info');
            }
        });
        
        window.serverBannerCutter = bannerCutter;
    } catch (error) {
        console.error('Error initializing banner cutter:', error);
    }
    
    if (bannerContainer) {
        bannerContainer.addEventListener('click', function(e) {
            e.preventDefault();
            bannerInput.click();
        });
    }
    
    if (bannerInput) {
        bannerInput.addEventListener('change', function() {
            if (!this.files || !this.files[0]) return;
            
            const file = this.files[0];
            
            if (!file.type.match('image.*')) {
                showToast('Please select a valid image file', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    if (window.serverBannerCutter) {
                        window.serverBannerCutter.loadImage(e.target.result);
                    } else {
                        if (bannerPreview) {
                            bannerPreview.src = e.target.result;
                            bannerPreview.classList.remove('hidden');
                            
                            const placeholder = document.getElementById('server-banner-placeholder');
                            if (placeholder) placeholder.classList.add('hidden');
                        }
                        
                        bannerContainer.dataset.croppedImage = e.target.result;
                        
                        updateServerPreviewBanner(e.target.result);
                    }
                } catch (error) {
                    showToast('Error processing server banner', 'error');
                }
            };
            
            reader.readAsDataURL(file);
        });
    }
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
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
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
    // Server Name
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
    
    // Server Description
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
    
    // Public checkbox
    const isPublicInput = document.getElementById('is-public');
    const approveIsPublicBtn = document.getElementById('approve-is-public');
    
    if (isPublicInput && approveIsPublicBtn) {
        isPublicInput.dataset.originalValue = isPublicInput.checked ? '1' : '0';
        checkForChangesCheckbox(isPublicInput, approveIsPublicBtn);
        
        isPublicInput.addEventListener('change', function() {
            checkForChangesCheckbox(this, approveIsPublicBtn);
        });
        
        approveIsPublicBtn.addEventListener('click', function() {
            updateServerPublic(serverId, isPublicInput.checked);
        });
    }
    
    // Server Category
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
            
            // Update page title if exists
            const titleElement = document.querySelector('title');
            if (titleElement) {
                titleElement.textContent = `${name} - Server Settings`;
            }
            
            // Update server name in UI
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
    
    approveBtn.disabled = true;
    const originalIcon = approveBtn.innerHTML;
    approveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        const data = await window.serverAPI.updateServerPublic(serverId, isPublic);
        
        if (data.success) {
            showToast(`Server ${isPublic ? 'made public' : 'made private'}`, 'success');
            
            publicInput.dataset.originalValue = isPublic ? '1' : '0';
            
            approveBtn.classList.remove('show');
            setTimeout(() => {
                approveBtn.style.display = 'none';
                approveBtn.classList.add('hidden');
            }, 300);
        } else {
            throw new Error(data.message || 'Failed to update server visibility');
        }
    } catch (error) {
        console.error('Error updating server visibility:', error);
        showToast(error.message || 'Error updating server visibility', 'error');
    } finally {
        approveBtn.disabled = false;
        approveBtn.innerHTML = originalIcon;
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

function initMyProfileTab() {
    const serverId = document.querySelector('meta[name="server-id"]')?.content;
    if (!serverId) return;
}
