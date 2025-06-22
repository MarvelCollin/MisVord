import { ServerAPI } from '../../api/server-api.js';
import ImageCutter from '../common/image-cutter.js';

document.addEventListener('DOMContentLoaded', function() {
    initServerSettingsPage();
});

function initServerSettingsPage() {
    initServerIconUpload();
    initServerProfileForm();
    initCloseButton();
}

/**
 * Initialize server icon upload with image cropper
 */
function initServerIconUpload() {
    const iconContainer = document.getElementById('server-icon-container');
    const iconInput = document.getElementById('server-icon-input');
    const iconPreview = document.getElementById('server-icon-preview');
    const changeIconBtn = document.getElementById('change-server-icon-btn');
    const removeIconBtn = document.getElementById('remove-server-icon-btn');
    
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
                    console.error('Error cropping server icon:', result.message);
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
                
                // Also update the server preview icon
                updateServerPreviewIcon(result.dataUrl);
            }
        });
        
        // Store the cutter instance for later use
        window.serverIconCutter = iconCutter;
    } catch (error) {
        console.error('Error initializing image cutter:', error);
    }
    
    // Change icon button click handler
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
                    console.error('Error processing server icon:', error);
                }
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // Remove icon button click handler
    if (removeIconBtn) {
        removeIconBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering the container click
            
            // Clear the preview and show placeholder
            if (iconPreview) {
                iconPreview.src = '';
                iconPreview.classList.add('hidden');
                
                const placeholder = document.getElementById('server-icon-placeholder');
                if (placeholder) placeholder.classList.remove('hidden');
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
            
            // Reset server preview icon
            resetServerPreviewIcon();
        });
    }
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
    
    if (!form || !serverId) return;
    
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
            saveButton.disabled = true;
            saveButton.textContent = 'Saving...';
            
            const formData = new FormData();
            
            // Add server name
            if (serverNameInput && serverNameInput.value.trim()) {
                formData.append('name', serverNameInput.value.trim());
            } else {
                showToast('Server name is required', 'error');
                saveButton.disabled = false;
                saveButton.textContent = 'Save Changes';
                return;
            }
            
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
            
            // Call the API to update the server
            const response = await ServerAPI.updateServerSettings(serverId, formData);
            
            if (response && response.success) {
                showToast('Server settings updated successfully', 'success');
                
                // Update server name in UI if needed
                if (serverNameInput && serverNameInput.value.trim()) {
                    updateServerNameInUI(serverNameInput.value.trim());
                }
            } else {
                throw new Error(response.message || 'Failed to update server settings');
            }
        } catch (error) {
            console.error('Error updating server settings:', error);
            showToast(error.message || 'Failed to update server settings', 'error');
        } finally {
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
