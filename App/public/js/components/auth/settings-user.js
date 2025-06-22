/**
 * User Settings Page Javascript
 */
document.addEventListener('DOMContentLoaded', function() {
    initUserSettingsPage();
    
    // Prevent chat-section.js from attempting to initialize on the settings page
    // by creating empty elements that it looks for
    if (!document.getElementById('chat-messages') && 
        document.body.classList.contains('settings-user')) {
        const hiddenElements = document.createElement('div');
        hiddenElements.style.display = 'none';
        hiddenElements.innerHTML = `
            <div id="chat-messages"></div>
            <form id="message-form"></form>
            <textarea id="message-input"></textarea>
        `;
        document.body.appendChild(hiddenElements);
    }
});

function initUserSettingsPage() {
    if (!document.querySelector('.settings-page, .flex.min-h-screen')) {
        return;
    }

    if (typeof window.logger !== 'undefined') {
        window.logger.debug('settings', 'Initializing user settings page');
    }

    // Get active section from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const activeSection = urlParams.get('section') || 'my-account';
    
    // Initialize the sidebar navigation 
    initSidebarNavigation(activeSection);
    
    // Initialize specific section functionality
    if (activeSection === 'my-account') {
        initUserAvatarUpload();
        initStatusSelector();
        initEmailReveal();
        initPasswordChangeForms();
        initTwoFactorAuth();
    }
    
    // Initialize close button
    initCloseButton();
    initPasswordFieldMasking();
}

/**
 * Initialize sidebar navigation
 */
function initSidebarNavigation(activeSection) {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.getAttribute('href').includes('section=')) {
                // Let the link handle the navigation
                return;
            }
            
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (!section) return;
            
            // Update URL without reloading the page
            const url = new URL(window.location);
            url.searchParams.set('section', section);
            window.history.pushState({}, '', url);
            
            // Update active item
            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // You would typically load the content dynamically here
            // For now, we'll just reload the page
            window.location.href = this.getAttribute('href');
        });
    });
}

/**
 * Initialize user avatar upload with image cropper
 */
function initUserAvatarUpload() {
    const iconContainer = document.getElementById('server-icon-container');
    const iconInput = document.getElementById('avatar-input');
    const iconPreview = document.getElementById('server-icon-preview');
    const changeIconBtn = document.getElementById('edit-profile-btn');
    const removeIconBtn = document.getElementById('remove-avatar-btn');
    
    if (!iconContainer || !iconInput || !changeIconBtn) return;
    
    // Initialize ImageCutter if available
    if (typeof ImageCutter !== 'undefined') {
        try {
            // Import the ImageCutter module dynamically
            import('/js/components/common/image-cutter.js')
                .then(module => {
                    const ImageCutter = module.default;
                    // Create image cutter instance
                    const avatarCutter = new ImageCutter({
                        container: iconContainer,
                        type: 'profile',
                        modalTitle: 'Upload Profile Picture',
                        aspectRatio: 1,
                        onCrop: (result) => {
                            if (result && result.error) {
                                console.error('Error cropping avatar:', result.message);
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
                            
                            // Show remove button if it exists
                            if (removeIconBtn && removeIconBtn.classList.contains('hidden')) {
                                removeIconBtn.classList.remove('hidden');
                            }
                            
                            // Upload the avatar immediately
                            uploadAvatar(result.dataUrl);
                        }
                    });
                    
                    // Store the cutter instance for later use
                    window.userAvatarCutter = avatarCutter;
                })
                .catch(error => {
                    console.error('Error loading ImageCutter module:', error);
                });
        } catch (error) {
            console.error('Error initializing image cutter:', error);
        }
    }
    
    // Change avatar button click handler
    if (changeIconBtn) {
        changeIconBtn.addEventListener('click', function() {
            iconInput.click();
        });
    }
    
    // Icon container click handler (alternative way to upload)
    if (iconContainer) {
        iconContainer.addEventListener('click', function() {
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
                alert('Please select a valid image file');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    // If we have the image cutter, use it
                    if (window.userAvatarCutter) {
                        window.userAvatarCutter.loadImage(e.target.result);
                    } else {
                        // Fallback to simple preview
                        if (iconPreview) {
                            iconPreview.src = e.target.result;
                            iconPreview.classList.remove('hidden');
                            
                            const placeholder = document.getElementById('server-icon-placeholder');
                            if (placeholder) placeholder.classList.add('hidden');
                        }
                        
                        iconContainer.dataset.croppedImage = e.target.result;
                        
                        // Upload the avatar immediately
                        uploadAvatar(e.target.result);
                    }
                } catch (error) {
                    console.error('Error processing avatar:', error);
                }
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // Remove avatar button click handler
    if (removeIconBtn) {
        removeIconBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering the container click
            
            // Confirm before removing
            if (!confirm('Are you sure you want to remove your profile picture?')) {
                return;
            }
            
            // Call API to remove avatar
            fetch('/user/avatar/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Clear the preview and show default avatar
                    if (iconPreview) {
                        iconPreview.src = '/public/assets/common/main-logo.png';
                    }
                    
                    // Clear the stored image data
                    if (iconContainer) {
                        delete iconContainer.dataset.croppedImage;
                    }
                    
                    // Hide the remove button
                    removeIconBtn.classList.add('hidden');
                    
                    // Clear the file input
                    if (iconInput) {
                        iconInput.value = '';
                    }
                    
                    // Update avatar in preview panel
                    const previewAvatar = document.querySelector('.server-icon-preview img');
                    if (previewAvatar) {
                        previewAvatar.src = '/public/assets/common/main-logo.png';
                    }
                    
                    showToast('Profile picture removed successfully', 'success');
                } else {
                    showToast(data.message || 'Failed to remove profile picture', 'error');
                }
            })
            .catch(error => {
                console.error('Error removing profile picture:', error);
                showToast('Error removing profile picture', 'error');
            });
        });
    }
}

/**
 * Upload avatar to server
 */
function uploadAvatar(dataUrl) {
    // Convert data URL to Blob
    const blob = dataURLtoBlob(dataUrl);
    
    // Create FormData
    const formData = new FormData();
    formData.append('avatar', blob, 'avatar.png');
    
    // Show loading state
    showToast('Uploading profile picture...', 'info');
    
    // Upload to server
    fetch('/user/avatar/update', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Profile picture updated successfully', 'success');
            
            // Update avatar in all places
            const avatars = document.querySelectorAll('.user-avatar img, .user-avatar-preview img, .server-icon-preview img');
            avatars.forEach(avatar => {
                avatar.src = data.avatar_url || dataUrl;
            });
            
            // Show remove button if it exists
            const removeAvatarBtn = document.getElementById('remove-avatar-btn');
            if (removeAvatarBtn && removeAvatarBtn.classList.contains('hidden')) {
                removeAvatarBtn.classList.remove('hidden');
            }
        } else {
            showToast(data.message || 'Failed to update profile picture', 'error');
        }
    })
    .catch(error => {
        console.error('Error uploading avatar:', error);
        showToast('Error uploading profile picture', 'error');
    });
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
 * Initialize close button
 */
function initCloseButton() {
    const closeButton = document.querySelector('.close-button');
    if (!closeButton) return;
    
    closeButton.addEventListener('click', function(e) {
        e.preventDefault();
        window.history.back();
    });
    
    // Also handle ESC key press
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.history.back();
        }
    });
}

/**
 * Initialize status selector for user status
 */
function initStatusSelector() {
    const statusOptions = document.querySelectorAll('.status-option');
    const userMetaStatus = document.querySelector('meta[name="user-status"]');
    const currentStatus = userMetaStatus ? userMetaStatus.content : 'offline';
    
    statusOptions.forEach(option => {
        if (option.dataset.status === currentStatus) {
            option.classList.add('bg-discord-background-modifier-selected');
        }
        
        option.addEventListener('click', function() {
            const status = this.dataset.status;
            
            // Update UI
            statusOptions.forEach(opt => {
                opt.classList.remove('bg-discord-background-modifier-selected');
            });
            this.classList.add('bg-discord-background-modifier-selected');
            
            // Update status on server
            updateUserStatus(status);
        });
    });
}

/**
 * Update user status via API
 */
function updateUserStatus(status) {
    fetch('/user/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
                },
        body: JSON.stringify({ status }),
        credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
        if (data.success) {
            // Update status indicators
            updateStatusIndicators(status);
            showToast(`Status updated to ${status}`, 'success');
        } else {
            showToast(data.message || 'Failed to update status', 'error');
        }
            })
            .catch(error => {
                console.error('Error updating status:', error);
        showToast('Error updating status', 'error');
    });
}

/**
 * Update status indicators in UI
 */
function updateStatusIndicators(status) {
    const statusMap = {
        'appear': 'bg-green-500',
        'invisible': 'bg-gray-500',
        'do_not_disturb': 'bg-red-500',
        'offline': 'bg-[#747f8d]'
    };
    
    const newStatusClass = statusMap[status] || 'bg-green-500';
    
    // Update status indicators
    const statusIndicators = document.querySelectorAll('.status-indicator');
    statusIndicators.forEach(indicator => {
        // Remove all status classes
        Object.values(statusMap).forEach(cls => {
            indicator.classList.remove(cls);
        });
        
        // Add new status class
        indicator.classList.add(newStatusClass);
    });
    
    // Update meta tag
    const userMetaStatus = document.querySelector('meta[name="user-status"]');
    if (userMetaStatus) {
        userMetaStatus.content = status;
    }
}

/**
 * Initialize email reveal functionality
 */
function initEmailReveal() {
    const revealButton = document.getElementById('reveal-email-btn');
    const emailDisplay = document.getElementById('user-email-display');
    
    if (!revealButton || !emailDisplay) return;
    
    revealButton.addEventListener('click', function() {
        const email = this.dataset.email;
        
        // If no email is set, do nothing
        if (!email) return;
        
        // Toggle between hidden and revealed email
        if (emailDisplay.textContent !== email) {
            emailDisplay.textContent = email;
            revealButton.textContent = 'Hide';
        } else {
            const parts = email.split('@');
            if (parts.length > 1) {
                const username = parts[0];
                const domain = parts[1];
                const maskedUsername = username.substring(0, 2) + '*'.repeat(username.length - 2);
                emailDisplay.textContent = maskedUsername + '@' + domain;
            } else {
                emailDisplay.textContent = email.substring(0, 2) + '*'.repeat(email.length - 5) + email.substring(email.length - 3);
            }
            revealButton.textContent = 'Reveal';
        }
    });
}

/**
 * Initialize password change forms
 */
function initPasswordChangeForms() {
    const changePasswordBtn = document.getElementById('change-password-btn');
    
    if (!changePasswordBtn) return;
    
    changePasswordBtn.addEventListener('click', function() {
        // You can create a modal for password change or redirect to a separate page
        alert('Password change functionality will be implemented soon.');
    });
}

/**
 * Initialize two-factor authentication
 */
function initTwoFactorAuth() {
    const enable2faBtn = document.getElementById('enable-2fa-btn');
    
    if (!enable2faBtn) return;
    
    enable2faBtn.addEventListener('click', function() {
        // You can create a modal for 2FA setup or redirect to a separate page
        alert('Two-factor authentication setup will be implemented soon.');
    });
}

/**
 * Initialize password field masking for text fields with password-field class
 */
function initPasswordFieldMasking() {
    // Add event listener for dynamically created password fields
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('password-field')) {
            setupPasswordField(e.target);
        }
    });
    
    // Use MutationObserver instead of deprecated DOMNodeInserted
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.querySelectorAll) {
                        const passwordFields = node.querySelectorAll('.password-field');
                        passwordFields.forEach(setupPasswordField);
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Set up any existing password fields on initial load
    document.querySelectorAll('.password-field').forEach(setupPasswordField);
}

/**
 * Setup individual password field masking
 */
function setupPasswordField(field) {
    // Skip if already processed
    if (field.dataset.maskingInitialized) return;
    field.dataset.maskingInitialized = 'true';
    
    // Create toggle button if it doesn't exist
    const parent = field.parentElement;
    if (!parent.querySelector('.password-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle absolute right-2 top-1/2 transform -translate-y-1/2';
        toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>';
        
        // Make parent relative positioned if it's not already
        if (getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
        
        parent.appendChild(toggleBtn);
        
        // Add event listener to toggle button
        toggleBtn.addEventListener('click', function() {
            if (field.type === 'password') {
                field.type = 'text';
                this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>';
            } else {
                field.type = 'password';
                this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>';
            }
        });
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    if (window.showToast) {
        window.showToast(message, type);
    } else {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 p-4 rounded shadow-lg z-50 ${getToastClass(type)}`;
        toast.innerHTML = `
            <div class="flex items-center">
                ${getToastIcon(type)}
                <span class="ml-2">${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 3000);
    }
}

/**
 * Get toast notification background class based on type
 */
function getToastClass(type) {
    switch (type) {
        case 'success':
            return 'bg-green-500 text-white';
        case 'error':
            return 'bg-red-500 text-white';
        case 'warning':
            return 'bg-yellow-500 text-white';
        default:
            return 'bg-blue-500 text-white';
    }
}

/**
 * Get toast notification icon based on type
 */
function getToastIcon(type) {
    switch (type) {
        case 'success':
            return '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>';
        case 'error':
            return '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>';
        case 'warning':
            return '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>';
        default:
            return '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>';
    }
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
