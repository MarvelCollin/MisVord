import { ServerAPI } from '../../api/server-api.js';
import ImageCutter from '../common/image-cutter.js';

document.addEventListener('DOMContentLoaded', function() {
    initServerSettingsPage();
});

function initServerSettingsPage() {
    initServerIconUpload();
    initBannerSelection();
    initTraitSelection();
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
 * Initialize banner selection
 */
function initBannerSelection() {
    const bannerOptions = document.querySelectorAll('.form-group[class*="banner"] .grid > div');
    const serverBannerPreview = document.querySelector('.server-preview-card .server-banner, .server-banner');
    
    if (!bannerOptions.length || !serverBannerPreview) return;
    
    bannerOptions.forEach((option) => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            bannerOptions.forEach(opt => opt.classList.remove('border-white'));
            
            // Add selected class to clicked option
            this.classList.add('border-white');
            
            // Get the background style from the clicked option
            const bgStyle = window.getComputedStyle(this).backgroundImage;
            
            // Apply the background to the server banner preview
            serverBannerPreview.style.backgroundImage = bgStyle;
            
            // Store the selected banner in a data attribute for form submission
            serverBannerPreview.dataset.selectedBanner = bgStyle;
        });
    });
}

/**
 * Initialize trait selection
 */
function initTraitSelection() {
    const traitCards = document.querySelectorAll('.form-group[class*="trait"] .grid > div');
    
    if (!traitCards.length) return;
    
    traitCards.forEach((card) => {
        card.addEventListener('click', function() {
            // Toggle selected class
            this.classList.toggle('border-[#5865f2]');
            this.classList.toggle('bg-[#5865f2]/10');
        });
    });
}

/**
 * Initialize server profile form submission
 */
function initServerProfileForm() {
    const form = document.getElementById('server-profile-form');
    const serverNameInput = document.getElementById('server-name');
    
    if (!form) return;
    
    // Auto-save when server name changes
    if (serverNameInput) {
        serverNameInput.addEventListener('input', debounce(function() {
            // Update the server name in the preview
            updateServerNamePreview(this.value);
            
            // Auto-save after a short delay
            const formData = new FormData(form);
            const serverId = formData.get('server_id');
            
            if (!serverId) return;
            
            // Only send name update
            const nameFormData = new FormData();
            nameFormData.append('server_id', serverId);
            nameFormData.append('name', this.value);
            
            const serverApi = new ServerAPI();
            serverApi.updateServerSettings(serverId, nameFormData)
                .then(response => {
                    if (response.success) {
                        // Update the server name in the sidebar
                        updateServerNameInUI(this.value);
                    }
                })
                .catch(error => {
                    console.error('Error updating server name:', error);
                });
        }, 1000));
    }
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const serverId = formData.get('server_id');
        
        if (!serverId) {
            console.error('Server ID is missing');
            return;
        }
        
        // Add cropped server icon if available
        const iconContainer = document.getElementById('server-icon-container');
        if (iconContainer && iconContainer.dataset.croppedImage) {
            const iconBlob = dataURLtoBlob(iconContainer.dataset.croppedImage);
            formData.set('server_icon', iconBlob, 'server_icon.png');
        }
        
        // Add selected banner if available
        const serverBannerPreview = document.querySelector('.server-preview-card .server-banner');
        if (serverBannerPreview && serverBannerPreview.dataset.selectedBanner) {
            formData.set('banner_style', serverBannerPreview.dataset.selectedBanner);
        }
        
        // Submit the form
        const serverApi = new ServerAPI();
        serverApi.updateServerSettings(serverId, formData)
            .then(response => {
                if (response.success) {
                    showToast('Server settings updated successfully', 'success');
                    
                    // Update the server name in the sidebar if it was changed
                    const newName = formData.get('name');
                    if (newName) {
                        updateServerNameInUI(newName);
                    }
                } else {
                    showToast(response.message || 'Failed to update server settings', 'error');
                }
            })
            .catch(error => {
                console.error('Error updating server settings:', error);
                showToast('An error occurred while updating server settings', 'error');
            });
    });
}

/**
 * Initialize close button
 */
function initCloseButton() {
    const closeButton = document.querySelector('a[href^="/server/"]');
    
    if (closeButton) {
        closeButton.addEventListener('click', function(e) {
            // Check if there are unsaved changes
            const serverNameInput = document.getElementById('server-name');
            const iconContainer = document.getElementById('server-icon-container');
            const serverBannerPreview = document.querySelector('.server-banner');
            
            let hasChanges = false;
            
            // Check for icon changes
            if (iconContainer && iconContainer.dataset.croppedImage) {
                hasChanges = true;
            }
            
            // Check for banner changes
            if (serverBannerPreview && serverBannerPreview.dataset.selectedBanner) {
                hasChanges = true;
            }
            
            // If there are unsaved changes, confirm before leaving
            if (hasChanges) {
                if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    e.preventDefault();
                }
            }
        });
    }
}

/**
 * Update server name in UI elements
 */
function updateServerNameInUI(newName) {
    // Update server name in sidebar
    const serverNameElement = document.querySelector('.p-4 .text-sm');
    if (serverNameElement) {
        serverNameElement.textContent = newName;
    }
    
    // Update server name in preview
    updateServerNamePreview(newName);
}

/**
 * Update server name in preview panel
 */
function updateServerNamePreview(newName) {
    const serverNamePreview = document.querySelector('.server-info h3, .pt-10 h3');
    if (serverNamePreview) {
        serverNamePreview.textContent = newName;
    }
}

/**
 * Convert data URL to Blob
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
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    if (window.Toast) {
        window.Toast.show(message, type);
    } else {
        console.log(`Toast (${type}):`, message);
    }
}
