import { ServerAPI } from '../../api/server-api.js';
import ImageCutter from '../common/image-cutter.js';

document.addEventListener('DOMContentLoaded', function() {
    initServerSettingsPage();
});

function initServerSettingsPage() {
    // Check if user is authenticated
    if (!document.body.classList.contains('authenticated')) {
        console.error('User is not authenticated');
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
        return;
    }
    
    // Initialize tabs
    const tabs = document.querySelectorAll('.settings-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Get active tab from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const activeSection = urlParams.get('section') || 'profile';
    
    // Initialize the active tab
    tabs.forEach(tab => {
        if (tab.dataset.tab === activeSection) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
        
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            // Update URL without reloading the page
            const url = new URL(window.location);
            url.searchParams.set('section', tabId);
            window.history.pushState({}, '', url);
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show active content
            tabContents.forEach(content => {
                if (content.id === `${tabId}-tab`) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });
    
    // Show active content
    tabContents.forEach(content => {
        if (content.id === `${activeSection}-tab`) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
    
    // Initialize specific tab functionality
    if (activeSection === 'profile') {
        initServerProfileForm();
    } else if (activeSection === 'members') {
        initMembersTab();
    } else if (activeSection === 'roles') {
        initRolesTab();
    }
    
    // Initialize close button
    initCloseButton();
}

/**
 * Initialize server icon upload with image cropper
 */
function initServerIconUpload() {
    const iconContainer = document.getElementById('server-icon-container');
    const iconInput = document.getElementById('server-icon-input');
    const iconPreview = document.getElementById('server-icon-preview');
    
    if (!iconContainer || !iconInput) return;
    
    // Create image cutter for server icon (1:1 aspect ratio)
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
                
                // Update preview with cropped image
                if (iconPreview) {
                    iconPreview.src = result.dataUrl;
                    iconPreview.classList.remove('hidden');
                    
                    const placeholder = document.getElementById('server-icon-placeholder');
                    if (placeholder) placeholder.classList.add('hidden');
                }
                
                // Store the cropped image data to use during form submission
                iconContainer.dataset.croppedImage = result.dataUrl;
                
                // Also update the server preview icon
                updateServerPreviewIcon(result.dataUrl);
                
                showToast('Server icon updated. Save changes to apply.', 'info');
            }
        });
        
        // Store the cutter instance for later use
        window.serverIconCutter = iconCutter;
    } catch (error) {
        console.error('Error initializing image cutter:', error);
    }
    
    // Icon container click handler
    if (iconContainer) {
        iconContainer.addEventListener('click', function(e) {
            e.preventDefault();
            iconInput.click();
        });
    }
    
    // File input change handler
    if (iconInput) {
        iconInput.addEventListener('change', function() {
            if (!this.files || !this.files[0]) return;
            
            const file = this.files[0];
            
            // Validate file type
            if (!file.type.match('image.*')) {
                showToast('Please select a valid image file', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    // If we have the image cutter, use it
                    if (window.serverIconCutter) {
                        window.serverIconCutter.loadImage(e.target.result);
                    } else {
                        // Fallback to simple preview
                        if (iconPreview) {
                            iconPreview.src = e.target.result;
                            iconPreview.classList.remove('hidden');
                            
                            const placeholder = document.getElementById('server-icon-placeholder');
                            if (placeholder) placeholder.classList.add('hidden');
                        }
                        
                        iconContainer.dataset.croppedImage = e.target.result;
                        
                        // Update server preview icon
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

/**
 * Initialize the members tab functionality
 */
function initMembersTab() {
    const membersList = document.getElementById('members-list');
    const memberSearch = document.getElementById('member-search');
    const memberTemplate = document.getElementById('member-template');
    const serverId = document.querySelector('meta[name="server-id"]')?.content;
    const memberFilter = document.getElementById('member-filter');
    const memberFilterOptions = document.querySelectorAll('.filter-option');
    
    if (!membersList || !memberTemplate || !serverId) return;
    
    let allMembers = [];
    let currentFilter = 'member-newest';
    
    // Load server members
    async function loadMembers() {
        try {
            const response = await ServerAPI.getServerMembers(serverId);
            
            if (response && response.success) {
                // Handle both response formats (with data wrapper and without)
                if (response.data && response.data.members) {
                    allMembers = response.data.members;
                } else if (response.members) {
                    allMembers = response.members;
                } else {
                    allMembers = [];
                }
                
                // Apply sorting immediately after loading
                sortMembers(currentFilter);
            } else if (response && response.error && response.error.code === 401) {
                // User is not authenticated, redirect to login
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
                return;
            } else {
                throw new Error(response.message || 'Failed to load server members');
            }
        } catch (error) {
            console.error('Error loading server members:', error);
            
            // Check if it's an authentication error
            if (error.message && error.message.toLowerCase().includes('unauthorized')) {
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
                return;
            }
            
            membersList.innerHTML = `
                <div class="flex items-center justify-center p-8 text-discord-lighter">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-[#ed4245]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Error loading members. Please try again.</span>
                </div>
            `;
        }
    }
    
    // Sort members based on selected filter
    function sortMembers(filterType) {
        let sortedMembers = [...allMembers];
        
        switch (filterType) {
            case 'member-newest': 
                sortedMembers.sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at));
                break;
            case 'member-oldest':
                sortedMembers.sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at));
                break;
            case 'discord-newest':
                sortedMembers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'discord-oldest':
                sortedMembers.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            default:
                sortedMembers.sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at));
        }
        
        renderMembers(sortedMembers);
    }
    
    // Filter option selection
    if (memberFilterOptions) {
        memberFilterOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Update UI
                memberFilterOptions.forEach(opt => {
                    opt.querySelector('input[type="radio"]').checked = false;
                });
                this.querySelector('input[type="radio"]').checked = true;
                
                // Update filter dropdown text
                if (memberFilter) {
                    memberFilter.querySelector('.filter-selected-text').textContent = this.textContent.trim();
                    
                    // Toggle dropdown visibility
                    const filterDropdown = document.getElementById('filter-dropdown');
                    if (filterDropdown) {
                        filterDropdown.classList.add('hidden');
                    }
                }
                
                // Apply filter
                currentFilter = this.dataset.filter;
                sortMembers(currentFilter);
            });
        });
    }
    
    // Toggle filter dropdown
    if (memberFilter) {
        memberFilter.addEventListener('click', function(e) {
            const filterDropdown = document.getElementById('filter-dropdown');
            if (filterDropdown) {
                filterDropdown.classList.toggle('hidden');
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!memberFilter.contains(e.target)) {
                const filterDropdown = document.getElementById('filter-dropdown');
                if (filterDropdown && !filterDropdown.classList.contains('hidden')) {
                    filterDropdown.classList.add('hidden');
                }
            }
        });
    }
    
    // Render members to the list
    function renderMembers(members) {
        if (!members.length) {
            membersList.innerHTML = `
                <div class="flex items-center justify-center p-8 text-discord-lighter">
                    <span>No members found</span>
                </div>
            `;
            return;
        }
        
        membersList.innerHTML = '';
        
        members.forEach(member => {
            const memberElement = document.importNode(memberTemplate.content, true).firstElementChild;
            
            // Set member avatar
            const avatarImg = memberElement.querySelector('.member-avatar img');
            if (avatarImg) {
                if (member.avatar_url) {
                    avatarImg.src = member.avatar_url;
                } else {
                    // Use first letter of username as avatar placeholder
                    avatarImg.parentNode.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-discord-dark text-white">
                            ${member.username.charAt(0).toUpperCase()}
                        </div>
                    `;
                }
            }
            
            // Set username and discriminator
            const usernameElement = memberElement.querySelector('.member-username');
            const discriminatorElement = memberElement.querySelector('.member-discriminator');
            
            if (usernameElement) {
                usernameElement.textContent = member.display_name || member.username;
            }
            
            if (discriminatorElement) {
                discriminatorElement.textContent = `#${member.discriminator}`;
            }
            
            // Set status indicator
            const statusIndicator = memberElement.querySelector('.status-indicator');
            if (statusIndicator) {
                const statusColors = {
                    'online': 'bg-green-500',
                    'idle': 'bg-yellow-500',
                    'dnd': 'bg-red-500',
                    'offline': 'bg-gray-500'
                };
                
                statusIndicator.classList.add(statusColors[member.status] || 'bg-gray-500');
            }
            
            // Set role
            const roleElement = memberElement.querySelector('.member-role');
            if (roleElement) {
                roleElement.textContent = member.role.charAt(0).toUpperCase() + member.role.slice(1);
                
                // Add role-specific styling
                const roleColors = {
                    'owner': 'bg-[#f1c40f] text-black',
                    'admin': 'bg-[#e74c3c] text-white',
                    'moderator': 'bg-[#3498db] text-white',
                    'member': 'bg-[#95a5a6] text-white'
                };
                
                roleElement.classList.add(...(roleColors[member.role] || 'bg-[#95a5a6] text-white').split(' '));
            }
            
            // Set joined date
            const joinedElement = memberElement.querySelector('.member-joined');
            if (joinedElement && member.joined_at) {
                const joinedDate = new Date(member.joined_at);
                joinedElement.textContent = joinedDate.toLocaleDateString();
            }
            
            // Set member ID as data attribute
            memberElement.dataset.memberId = member.id;
            
            // Handle action buttons visibility based on permissions
            const editRoleBtn = memberElement.querySelector('.edit-role-btn');
            const kickMemberBtn = memberElement.querySelector('.kick-member-btn');
            
            // Disable actions for owner (can't edit owner's role or kick them)
            if (member.is_owner) {
                if (editRoleBtn) editRoleBtn.disabled = true;
                if (kickMemberBtn) kickMemberBtn.disabled = true;
                
                // Add disabled styling
                if (editRoleBtn) editRoleBtn.classList.add('opacity-50', 'cursor-not-allowed');
                if (kickMemberBtn) kickMemberBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            
            // Add event listeners for action buttons
            if (editRoleBtn) {
                editRoleBtn.addEventListener('click', () => {
                    // Role editing functionality would go here
                    alert(`Edit role for ${member.username} (ID: ${member.id})`);
                });
            }
            
            if (kickMemberBtn) {
                kickMemberBtn.addEventListener('click', () => {
                    // Kick member functionality would go here
                    if (confirm(`Are you sure you want to kick ${member.username} from the server?`)) {
                        alert(`Kicked ${member.username} (ID: ${member.id})`);
                    }
                });
            }
            
            membersList.appendChild(memberElement);
        });
    }
    
    // Handle member search
    if (memberSearch) {
        memberSearch.addEventListener('input', debounce(function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            if (!searchTerm) {
                sortMembers(currentFilter);
                return;
            }
            
            const filteredMembers = allMembers.filter(member => {
                return (
                    member.username.toLowerCase().includes(searchTerm) ||
                    (member.display_name && member.display_name.toLowerCase().includes(searchTerm)) ||
                    member.role.toLowerCase().includes(searchTerm)
                );
            });
            
            renderMembers(filteredMembers);
        }, 300));
    }
    
    // Initial load
    loadMembers();
}

/**
 * Update the server icon in the preview panel
 */
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
        // If there's no img element yet, create one
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = "Server Icon";
        img.className = "w-full h-full object-cover";
        
        previewPlaceholder.parentNode.appendChild(img);
        previewPlaceholder.classList.add('hidden');
    }
}

/**
 * Reset the server icon in the preview panel
 */
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

/**
 * Initialize server profile form submission
 */
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
    
    // Initialize server icon and banner upload
    initServerIconUpload();
    initServerBannerUpload();
    
    // Add subtle animations to form cards
    if (formCards.length) {
        formCards.forEach((card, index) => {
            // Add staggered fade-in animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 + (index * 100));
        });
    }
    
    // Add focus/blur effects to form inputs
    const formInputs = form.querySelectorAll('input, textarea, select');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.closest('.form-group')?.classList.add('is-focused');
        });
        
        input.addEventListener('blur', function() {
            this.closest('.form-group')?.classList.remove('is-focused');
        });
    });
    
    // Update server name preview as user types
    if (serverNameInput) {
        serverNameInput.addEventListener('input', debounce(function() {
            updateServerNamePreview(this.value);
        }, 300));
    }

    // Update server description preview as user types
    if (serverDescriptionInput) {
        serverDescriptionInput.addEventListener('input', debounce(function() {
            updateServerDescriptionPreview(this.value);
        }, 300));
    }
    
    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!serverId) {
            showToast('Server ID not found', 'error');
            return;
        }
        
        try {
            // Validate server name
            if (!serverNameInput || !serverNameInput.value.trim()) {
                showToast('Server name is required', 'error');
                serverNameInput.focus();
                return;
            }
            
            // Update button state
            saveButton.disabled = true;
            saveButton.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
            `;
            
            const formData = new FormData();
            
            // Add server name
            formData.append('name', serverNameInput.value.trim());
            
            // Add server description
            if (serverDescriptionInput) {
                formData.append('description', serverDescriptionInput.value.trim());
            }
            
            // Add public status
            if (isPublicCheckbox) {
                formData.append('is_public', isPublicCheckbox.checked ? '1' : '0');
            }
            
            // Add category
            if (serverCategorySelect && serverCategorySelect.value) {
                formData.append('category', serverCategorySelect.value);
            }
            
            // Add server icon if changed
            const iconContainer = document.getElementById('server-icon-container');
            if (iconContainer && iconContainer.dataset.croppedImage) {
                const iconBlob = dataURLtoBlob(iconContainer.dataset.croppedImage);
                formData.append('server_icon', iconBlob, 'server_icon.png');
            }
            
            // Add server banner if changed
            const bannerContainer = document.getElementById('server-banner-container');
            if (bannerContainer && bannerContainer.dataset.croppedImage) {
                const bannerBlob = dataURLtoBlob(bannerContainer.dataset.croppedImage);
                formData.append('server_banner', bannerBlob, 'server_banner.png');
            }
            
            // Call the API to update the server
            const response = await ServerAPI.updateServerSettings(serverId, formData);
            
            if (response && response.success) {
                showToast('Server settings updated', 'success');
                
                // Update server name in UI if needed
                if (serverNameInput && serverNameInput.value.trim()) {
                    updateServerNameInUI(serverNameInput.value.trim());
                }
                
                // Refresh the page after 1.5 seconds to show updated images
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                throw new Error(response.message || 'Failed to update server settings');
            }
        } catch (error) {
            console.error('Error updating server settings:', error);
            showToast(error.message || 'Failed to update server settings', 'error');
        } finally {
            // Reset button state
            saveButton.disabled = false;
            saveButton.textContent = 'Save Changes';
        }
    });
}

/**
 * Initialize close button
 */
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
    
    // Also handle ESC key press
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
    // Update in sidebar
    const sidebarServerName = document.querySelector('.w-60.bg-discord-light .text-sm.font-semibold');
    if (sidebarServerName) {
        sidebarServerName.textContent = newName;
    }
    
    // Update page title
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
            // Create description element if it doesn't exist
            serverDescriptionPreview = document.createElement('div');
            serverDescriptionPreview.className = 'server-description text-xs text-discord-lighter mt-3';
            document.querySelector('.server-info').appendChild(serverDescriptionPreview);
        }
        serverDescriptionPreview.textContent = newDescription;
    } else if (serverDescriptionPreview) {
        // Remove description element if empty
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
 * Initialize the roles tab functionality
 */
function initRolesTab() {
    const rolesList = document.getElementById('roles-list');
    const roleSearch = document.getElementById('role-search');
    const roleTemplate = document.getElementById('role-template');
    const roleFilter = document.getElementById('role-filter');
    const filterOptions = document.querySelectorAll('.filter-option');
    const createRoleBtn = document.getElementById('create-role-btn');
    const serverId = document.querySelector('meta[name="server-id"]')?.content;
    
    if (!rolesList || !roleTemplate || !serverId) return;
    
    let allRoles = [];
    let currentFilter = 'role-name-asc';
    
    // Handle create role button
    if (createRoleBtn) {
        createRoleBtn.addEventListener('click', () => {
            showToast('Create new role functionality coming soon', 'info');
        });
    }
    
    // Load server roles
    async function loadRoles() {
        try {
            const response = await ServerAPI.getServerRoles(serverId);
            
            if (response && response.success) {
                // Handle both response formats (with data wrapper and without)
                if (response.data && response.data.roles) {
                    allRoles = response.data.roles;
                } else if (response.roles) {
                    allRoles = response.roles;
                } else {
                    allRoles = [];
                }
                
                // Apply sorting immediately after loading
                sortRoles(currentFilter);
            } else if (response && response.error && response.error.code === 401) {
                // User is not authenticated, redirect to login
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
                return;
            } else {
                throw new Error(response.message || 'Failed to load server roles');
            }
        } catch (error) {
            console.error('Error loading server roles:', error);
            
            // Check if it's an authentication error
            if (error.message && error.message.toLowerCase().includes('unauthorized')) {
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
                return;
            }
            
            rolesList.innerHTML = `
                <div class="flex items-center justify-center p-8 text-discord-lighter">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-[#ed4245]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Error loading roles. Please try again.</span>
                </div>
            `;
        }
    }
    
    // Sort roles based on selected filter
    function sortRoles(filterType) {
        let sortedRoles = [...allRoles];
        
        switch (filterType) {
            case 'role-name-asc': 
                sortedRoles.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'role-name-desc':
                sortedRoles.sort((a, b) => b.name.localeCompare(a.name));
                break;
            default:
                sortedRoles.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        renderRoles(sortedRoles);
    }
    
    // Filter option selection
    if (filterOptions) {
        filterOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Update UI
                filterOptions.forEach(opt => {
                    opt.querySelector('input[type="radio"]').checked = false;
                });
                this.querySelector('input[type="radio"]').checked = true;
                
                // Update filter dropdown text
                if (roleFilter) {
                    roleFilter.querySelector('.filter-selected-text').textContent = this.textContent.trim();
                    
                    // Toggle dropdown visibility
                    const filterDropdown = document.getElementById('filter-dropdown');
                    if (filterDropdown) {
                        filterDropdown.classList.add('hidden');
                    }
                }
                
                // Apply filter
                currentFilter = this.dataset.filter;
                sortRoles(currentFilter);
            });
        });
    }
    
    // Toggle filter dropdown
    if (roleFilter) {
        roleFilter.addEventListener('click', function(e) {
            const filterDropdown = document.getElementById('filter-dropdown');
            if (filterDropdown) {
                filterDropdown.classList.toggle('hidden');
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!roleFilter.contains(e.target)) {
                const filterDropdown = document.getElementById('filter-dropdown');
                if (filterDropdown && !filterDropdown.classList.contains('hidden')) {
                    filterDropdown.classList.add('hidden');
                }
            }
        });
    }
    
    // Render roles to the list
    function renderRoles(roles) {
        if (!roles.length) {
            rolesList.innerHTML = `
                <div class="flex items-center justify-center p-8 text-discord-lighter">
                    <span>No roles found</span>
                </div>
            `;
            return;
        }
        
        rolesList.innerHTML = '';
        
        // Add default role (everyone)
        const everyoneRole = document.createElement('div');
        everyoneRole.className = 'role-item p-4 border-b border-discord-dark flex items-center hover:bg-discord-dark';
        everyoneRole.innerHTML = `
            <div class="w-10 flex items-center justify-center">
                <div class="role-color w-3 h-3 rounded-full bg-gray-500"></div>
            </div>
            <div class="flex-1">
                <div class="role-name font-medium">@everyone</div>
                <div class="text-xs text-discord-lighter flex items-center mt-1">
                    <span>Default role for all members</span>
                </div>
            </div>
            <div class="w-32 text-xs text-discord-lighter">
                All Members
            </div>
            <div class="w-40">
                <div class="role-actions flex space-x-2">
                    <button class="edit-role-btn p-2 rounded hover:bg-discord-light" title="Edit Role">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listener for the default role edit button
        const defaultRoleEditBtn = everyoneRole.querySelector('.edit-role-btn');
        if (defaultRoleEditBtn) {
            defaultRoleEditBtn.addEventListener('click', () => {
                alert('Edit @everyone role permissions');
            });
        }
        
        rolesList.appendChild(everyoneRole);
        
        roles.forEach(role => {
            const roleElement = document.importNode(roleTemplate.content, true).firstElementChild;
            
            // Set role color
            const roleColor = roleElement.querySelector('.role-color');
            if (roleColor) {
                roleColor.style.backgroundColor = role.color || '#95a5a6';
            }
            
            // Set role name
            const nameElement = roleElement.querySelector('.role-name');
            if (nameElement) {
                nameElement.textContent = role.name;
                // Set the name color to match the role color for better visualization
                nameElement.style.color = role.color || '#ffffff';
            }
            
            // Set member count
            const memberCountElement = roleElement.querySelector('.role-member-count');
            if (memberCountElement) {
                memberCountElement.textContent = `${role.member_count || 0} members`;
            }
            
            // Set permissions info
            const permissionsElement = roleElement.querySelector('.role-permissions');
            if (permissionsElement) {
                // Get a list of key permissions to display
                const permissions = [];
                if (role.permissions) {
                    if (role.permissions.administrator) permissions.push('Administrator');
                    else {
                        if (role.permissions.manage_server) permissions.push('Manage Server');
                        if (role.permissions.manage_channels) permissions.push('Manage Channels');
                        if (role.permissions.manage_roles) permissions.push('Manage Roles');
                        if (role.permissions.kick_members) permissions.push('Kick Members');
                        if (role.permissions.ban_members) permissions.push('Ban Members');
                    }
                }
                
                permissionsElement.textContent = permissions.length ? permissions.join(', ') : 'No special permissions';
            }
            
            // Set role ID as data attribute
            roleElement.dataset.roleId = role.id;
            
            // Add event listeners for action buttons
            const editRoleBtn = roleElement.querySelector('.edit-role-btn');
            const deleteRoleBtn = roleElement.querySelector('.delete-role-btn');
            
            if (editRoleBtn) {
                editRoleBtn.addEventListener('click', () => {
                    // Role editing functionality would go here
                    alert(`Edit role: ${role.name} (ID: ${role.id})`);
                });
            }
            
            if (deleteRoleBtn) {
                deleteRoleBtn.addEventListener('click', () => {
                    // Delete role functionality would go here
                    if (confirm(`Are you sure you want to delete the role ${role.name}?`)) {
                        alert(`Deleted role: ${role.name} (ID: ${role.id})`);
                    }
                });
            }
            
            rolesList.appendChild(roleElement);
        });
    }
    
    // Handle role search
    if (roleSearch) {
        roleSearch.addEventListener('input', debounce(function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            if (!searchTerm) {
                sortRoles(currentFilter);
                return;
            }
            
            const filteredRoles = allRoles.filter(role => {
                return role.name.toLowerCase().includes(searchTerm);
            });
            
            renderRoles(filteredRoles);
        }, 300));
    }
    
    // Initial load
    loadRoles();
}

/**
 * Initialize server banner upload
 */
function initServerBannerUpload() {
    const bannerContainer = document.getElementById('server-banner-container');
    const bannerInput = document.getElementById('server-banner-input');
    const bannerPreview = document.getElementById('server-banner-preview');
    
    if (!bannerContainer || !bannerInput) return;
    
    // Create image cutter for banner (16:9 aspect ratio)
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
                
                // Update preview with cropped image
                if (bannerPreview) {
                    bannerPreview.src = result.dataUrl;
                    bannerPreview.classList.remove('hidden');
                    
                    const placeholder = document.getElementById('server-banner-placeholder');
                    if (placeholder) placeholder.classList.add('hidden');
                }
                
                // Store the cropped image data to use during form submission
                bannerContainer.dataset.croppedImage = result.dataUrl;
                
                // Also update the server preview banner
                updateServerPreviewBanner(result.dataUrl);
                
                showToast('Server banner updated. Save changes to apply.', 'info');
            }
        });
        
        // Store the cutter instance for later use
        window.serverBannerCutter = bannerCutter;
    } catch (error) {
        console.error('Error initializing banner cutter:', error);
    }
    
    // Banner container click handler
    if (bannerContainer) {
        bannerContainer.addEventListener('click', function(e) {
            e.preventDefault();
            bannerInput.click();
        });
    }
    
    // File input change handler
    if (bannerInput) {
        bannerInput.addEventListener('change', function() {
            if (!this.files || !this.files[0]) return;
            
            const file = this.files[0];
            
            // Validate file type
            if (!file.type.match('image.*')) {
                showToast('Please select a valid image file', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    // If we have the banner cutter, use it
                    if (window.serverBannerCutter) {
                        window.serverBannerCutter.loadImage(e.target.result);
                    } else {
                        // Fallback to simple preview
                        if (bannerPreview) {
                            bannerPreview.src = e.target.result;
                            bannerPreview.classList.remove('hidden');
                            
                            const placeholder = document.getElementById('server-banner-placeholder');
                            if (placeholder) placeholder.classList.add('hidden');
                        }
                        
                        bannerContainer.dataset.croppedImage = e.target.result;
                        
                        // Update server preview banner
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
