/**
 * User Settings Page Javascript
 */
document.addEventListener('DOMContentLoaded', function() {
    initUserSettingsPage();
});

function initUserSettingsPage() {
    if (!document.querySelector('.settings-page, .flex.min-h-screen')) {
        return;
    }

    if (typeof window.logger !== 'undefined') {
        window.logger.debug('settings', 'Initializing user settings page');
    }

    initUserAvatarUpload();
    initTabNavigation();
    initCloseButton();
    initSettingsNavigation();
    initEmailReveal();
    initStatusSelector();
    initEditButtons();
}

/**
 * Initialize user avatar upload functionality
 */
function initUserAvatarUpload() {
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (!editProfileBtn) return;

    editProfileBtn.addEventListener('click', function() {
        // In a real implementation, this would open a modal dialog
        // for uploading/cropping profile picture and banner
        console.log('Edit profile button clicked');
        
        if (typeof ImageCutter !== 'undefined') {
            try {
                const avatarCutter = new ImageCutter({
                    type: 'profile',
                    modalTitle: 'Upload Profile Picture',
                    aspectRatio: 1,
                    onCrop: (result) => {
                        if (result && result.error) {
                            console.error('Error cropping profile picture:', result.message);
                            return;
                        }
                        
                        // Update avatar in various places
                        updateUserAvatarInUI(result.dataUrl);
                    }
                });
                
                // Store the cutter instance for later use
                window.userAvatarCutter = avatarCutter;
                
                // Open file selector
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = function() {
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
                            if (window.userAvatarCutter) {
                                window.userAvatarCutter.loadImage(e.target.result);
                            }
                        } catch (error) {
                            console.error('Error processing profile picture:', error);
                        }
                    };
                    
                    reader.readAsDataURL(file);
                };
                input.click();
                
            } catch (error) {
                console.error('Error initializing image cutter:', error);
                // Fallback for no ImageCutter class
                alert('Image upload functionality not available');
            }
        } else {
            // Fallback for no ImageCutter class
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = function() {
                if (!this.files || !this.files[0]) return;
                
                const file = this.files[0];
                
                // Validate file type
                if (!file.type.match('image.*')) {
                    alert('Please select a valid image file');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    updateUserAvatarInUI(e.target.result);
                };
                
                reader.readAsDataURL(file);
            };
            input.click();
        }
    });
}

/**
 * Update user avatar in all UI elements
 */
function updateUserAvatarInUI(imageUrl) {
    // Update avatar in the main card
    const avatarImg = document.querySelector('.w-16.h-16 img');
    if (avatarImg) {
        avatarImg.src = imageUrl;
    }
    
    // Update avatar in preview panel
    const previewAvatar = document.querySelector('.user-avatar-preview img');
    if (previewAvatar) {
        previewAvatar.src = imageUrl;
    }
    
    // Update in other components (e.g. user profile sidebar if visible)
    const sidebarAvatar = document.querySelector('.p-2.bg-discord-darker img');
    if (sidebarAvatar) {
        sidebarAvatar.src = imageUrl;
    }
}

/**
 * Initialize tab navigation
 */
function initTabNavigation() {
    const tabs = document.querySelectorAll('.border-b button');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => {
                t.classList.remove('border-discord-blue', 'text-discord-blue');
                t.classList.add('text-discord-lighter', 'hover:text-white');
                t.style.borderBottom = 'none';
            });
            
            // Add active class to clicked tab
            this.classList.remove('text-discord-lighter', 'hover:text-white');
            this.classList.add('text-discord-blue', 'border-b-2', 'border-discord-blue');
            
            // Here you would also handle showing the correct tab content
        });
    });
}

/**
 * Initialize close button
 */
function initCloseButton() {
    const closeButton = document.querySelector('button[onclick="window.history.back()"]');
    if (!closeButton) return;
    
    closeButton.addEventListener('click', function(e) {
        e.preventDefault();
        window.history.back();
    });
    
    // Add escape key listener
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.history.back();
        }
    });
}

/**
 * Initialize settings navigation
 */
function initSettingsNavigation() {
    const settingsItems = document.querySelectorAll('.sidebar-item');
    
    settingsItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // If it's just a tab change within the same page, prevent default
            if (href && href.startsWith('#')) {
                e.preventDefault();
                
                // Remove selected class from all items
                settingsItems.forEach(i => i.classList.remove('bg-discord-selected', 'active'));
                
                // Add selected class to clicked item
                this.classList.add('bg-discord-selected', 'active');
            }
        });
    });
}

/**
 * Initialize email reveal functionality
 */
function initEmailReveal() {
    const revealButton = document.querySelector('.text-blue-500.hover\\:underline');
    if (!revealButton) return;
    
    revealButton.addEventListener('click', function() {
        const emailElement = this.previousElementSibling;
        if (!emailElement) return;
        
        // In a real app, this would make an API call to get the real email
        // For demo purposes we'll simulate it
        emailElement.textContent = 'user@gmail.com';
        
        // Hide the reveal button
        this.style.display = 'none';
    });
}

/**
 * Initialize status selector
 */
function initStatusSelector() {
    const statusOptions = document.querySelectorAll('.status-option');
    if (!statusOptions.length) return;
    
    let currentStatus = 'online';
    
    statusOptions.forEach(option => {
        option.addEventListener('click', function() {
            const statusIndicator = this.querySelector('span:first-child');
            const statusText = this.querySelector('span:last-child').textContent.toLowerCase();
            
            // Update status in user interface
            currentStatus = statusText;
            
            // Add visual indicator that this option is selected
            statusOptions.forEach(opt => {
                opt.style.backgroundColor = '';
                opt.style.fontWeight = '';
            });
            
            this.style.backgroundColor = 'rgba(79, 84, 92, 0.32)';
            this.style.fontWeight = 'bold';
            
            // Update status indicator in user profile if exists
            const profileStatusIndicator = document.querySelector('.absolute.bottom-0.right-0\\.5.rounded-full.border-2');
            if (profileStatusIndicator) {
                profileStatusIndicator.className = 'absolute bottom-0 right-0.5 w-3 h-3 rounded-full border-2 border-discord-darker';
                
                if (statusText === 'online') {
                    profileStatusIndicator.classList.add('bg-discord-green');
                } else if (statusText === 'idle') {
                    profileStatusIndicator.classList.add('bg-yellow-500');
                } else if (statusText.includes('disturb')) {
                    profileStatusIndicator.classList.add('bg-discord-red');
                } else {
                    profileStatusIndicator.classList.add('bg-gray-500');
                }
            }
            
            // In a real app, this would make an API call to update the status
            console.log('Status updated to:', statusText);
        });
    });
}

/**
 * Initialize edit buttons
 */
function initEditButtons() {
    const editButtons = document.querySelectorAll('button:not([onclick="window.history.back()"])');
    
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            
            if (buttonText === 'Edit') {
                const parentSection = this.closest('div');
                if (!parentSection) return;
                
                const label = parentSection.querySelector('h3')?.textContent || '';
                const valueElement = parentSection.querySelector('p');
                if (!valueElement) return;
                
                const currentValue = valueElement.textContent.trim();
                
                // Create an input field
                const input = document.createElement('input');
                input.type = label.toLowerCase().includes('email') ? 'email' : 'text';
                input.value = currentValue;
                input.className = 'w-full bg-discord-dark text-white border-none rounded p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-discord-blue';
                
                // Replace the paragraph with the input
                valueElement.replaceWith(input);
                
                // Focus the input
                input.focus();
                
                // Change button text
                this.textContent = 'Save';
                
                // Add a cancel button
                const cancelButton = document.createElement('button');
                cancelButton.textContent = 'Cancel';
                cancelButton.className = 'bg-transparent hover:underline text-discord-lighter rounded px-4 py-1.5 text-sm font-medium ml-2';
                cancelButton.addEventListener('click', function() {
                    // Restore original value
                    const p = document.createElement('p');
                    p.textContent = currentValue;
                    p.className = 'text-discord-lighter';
                    input.replaceWith(p);
                    
                    // Remove cancel button and restore edit button
                    this.remove();
                    button.textContent = 'Edit';
                });
                
                // Add cancel button after edit button
                this.parentNode.appendChild(cancelButton);
            }
            else if (buttonText === 'Save') {
                const parentSection = this.closest('div');
                if (!parentSection) return;
                
                const input = parentSection.querySelector('input');
                if (!input) return;
                
                const newValue = input.value.trim();
                
                // Create paragraph with new value
                const p = document.createElement('p');
                p.textContent = newValue;
                p.className = 'text-discord-lighter';
                input.replaceWith(p);
                
                // Remove cancel button if it exists
                const cancelButton = this.nextElementSibling;
                if (cancelButton && cancelButton.textContent === 'Cancel') {
                    cancelButton.remove();
                }
                
                // Change button text back to Edit
                this.textContent = 'Edit';
                
                // In a real app, this would make an API call to update the user data
                console.log('Updated value:', newValue);
                
                // Show a toast notification
                showToast('Settings updated successfully', 'success');
            }
            else if (buttonText === 'Add') {
                // Handle adding a phone number
                const parentSection = this.closest('div');
                if (!parentSection) return;
                
                const label = parentSection.querySelector('h3')?.textContent || '';
                const valueElement = parentSection.querySelector('p');
                if (!valueElement) return;
                
                // Create an input field
                const input = document.createElement('input');
                input.type = 'tel';
                input.placeholder = 'Enter your phone number';
                input.className = 'w-full bg-discord-dark text-white border-none rounded p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-discord-blue';
                
                // Replace the paragraph with the input
                valueElement.replaceWith(input);
                
                // Focus the input
                input.focus();
                
                // Change button text
                this.textContent = 'Save';
                
                // Add a cancel button
                const cancelButton = document.createElement('button');
                cancelButton.textContent = 'Cancel';
                cancelButton.className = 'bg-transparent hover:underline text-discord-lighter rounded px-4 py-1.5 text-sm font-medium ml-2';
                cancelButton.addEventListener('click', function() {
                    // Restore original message
                    const p = document.createElement('p');
                    p.textContent = 'You haven\'t added a phone number yet.';
                    p.className = 'text-discord-lighter';
                    input.replaceWith(p);
                    
                    // Remove cancel button and restore add button
                    this.remove();
                    button.textContent = 'Add';
                });
                
                // Add cancel button after add/save button
                this.parentNode.appendChild(cancelButton);
            }
            else if (buttonText === 'Change Password') {
                // Show password change form
                const changePasswordSection = this.parentElement;
                if (!changePasswordSection) return;
                
                // Create form elements
                const formContainer = document.createElement('div');
                formContainer.className = 'space-y-4 mt-4';
                
                // Current password
                const currentPasswordGroup = document.createElement('div');
                currentPasswordGroup.innerHTML = `
                    <label class="block text-sm font-medium text-white mb-1">Current Password</label>
                    <input type="password" class="w-full bg-discord-dark text-white border-none rounded p-2 focus:outline-none focus:ring-2 focus:ring-discord-blue" placeholder="Enter current password">
                `;
                
                // New password
                const newPasswordGroup = document.createElement('div');
                newPasswordGroup.innerHTML = `
                    <label class="block text-sm font-medium text-white mb-1">New Password</label>
                    <input type="password" class="w-full bg-discord-dark text-white border-none rounded p-2 focus:outline-none focus:ring-2 focus:ring-discord-blue" placeholder="Enter new password">
                `;
                
                // Confirm password
                const confirmPasswordGroup = document.createElement('div');
                confirmPasswordGroup.innerHTML = `
                    <label class="block text-sm font-medium text-white mb-1">Confirm New Password</label>
                    <input type="password" class="w-full bg-discord-dark text-white border-none rounded p-2 focus:outline-none focus:ring-2 focus:ring-discord-blue" placeholder="Confirm new password">
                `;
                
                // Button group
                const buttonGroup = document.createElement('div');
                buttonGroup.className = 'flex space-x-2 mt-4';
                buttonGroup.innerHTML = `
                    <button class="bg-discord-blue hover:bg-discord-blue-dark text-white rounded px-4 py-2 text-sm font-medium">Save</button>
                    <button class="bg-transparent hover:underline text-discord-lighter rounded px-4 py-2 text-sm font-medium">Cancel</button>
                `;
                
                // Add elements to the form container
                formContainer.appendChild(currentPasswordGroup);
                formContainer.appendChild(newPasswordGroup);
                formContainer.appendChild(confirmPasswordGroup);
                formContainer.appendChild(buttonGroup);
                
                // Hide the original button and append the form
                this.style.display = 'none';
                changePasswordSection.appendChild(formContainer);
                
                // Add event listeners to new buttons
                const saveButton = buttonGroup.querySelector('button:first-child');
                const cancelButton = buttonGroup.querySelector('button:last-child');
                
                saveButton.addEventListener('click', function() {
                    // Implement password change logic here
                    // In a real app, this would verify the current password,
                    // check that new passwords match, and make an API call
                    
                    // For this demo, just show a success message
                    showToast('Password changed successfully', 'success');
                    
                    // Remove the form and show the original button
                    formContainer.remove();
                    button.style.display = 'inline-flex';
                });
                
                cancelButton.addEventListener('click', function() {
                    // Remove the form and show the original button
                    formContainer.remove();
                    button.style.display = 'inline-flex';
                });
            }
            else if (buttonText === 'Enable Authenticator App') {
                // In a real app, this would start the 2FA setup process
                alert('This would launch the 2FA setup flow in a real app.');
            }
        });
    });
}

/**
 * Show toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, info)
 */
function showToast(message, type = 'info') {
    if (window.Toast && window.Toast.show) {
        window.Toast.show(message, type);
    } else {
        // Create a simple toast if the Toast module isn't available
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 py-2 px-4 rounded shadow-lg';
        
        if (type === 'success') {
            toast.className += ' bg-green-500 text-white';
        } else if (type === 'error') {
            toast.className += ' bg-red-500 text-white';
        } else {
            toast.className += ' bg-blue-500 text-white';
        }
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 3000);
    }
}

/**
 * Convert data URL to Blob
 * @param {string} dataURL - The data URL to convert
 * @returns {Blob} - The resulting blob
 */
function dataURLtoBlob(dataURL) {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
}

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in ms
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}
