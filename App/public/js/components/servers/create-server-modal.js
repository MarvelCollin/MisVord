import { ServerAPI } from '../../api/server-api.js';
import ImageCutter from '../common/image-cutter.js';
import { pageUtils } from '../../utils/index.js';

document.addEventListener('DOMContentLoaded', function() {
    initServerIconUpload();
    initServerBannerUpload();
    initServerFormSubmission();
    initToggleAnimation();
    initTooltips();
});

function initServerIconUpload() {
    try {
        const iconContainer = document.getElementById('server-icon-container');
        const iconInput = document.getElementById('server-icon-input');
        const iconPreview = document.getElementById('server-icon-preview');
        const iconPlaceholder = document.getElementById('server-icon-placeholder');
        
        // Ensure all required elements exist
        if (!iconContainer || !iconInput || !iconPreview || !iconPlaceholder) {
            console.error('Missing required elements for server icon upload');
            return;
        }
        
        // Create image cutter for profile/icon (1:1 aspect ratio)
        const iconCutter = new ImageCutter({
            container: iconContainer,
            type: 'profile',
            modalTitle: 'Crop Server Icon',
            onCrop: (result) => {
                if (result && result.error) {
                    console.error('Error cropping server icon:', result.message);
                    return;
                }
                
                // Update preview with cropped image
                iconPreview.src = result.dataUrl;
                iconPreview.classList.remove('hidden');
                iconPlaceholder.classList.add('hidden');
                console.log('Icon crop completed');
                
                // Store the cropped image data to use during form submission
                iconContainer.dataset.croppedImage = result.dataUrl;
            }
        });
        
        // Store the cutter instance for later use
        window.serverIconCutter = iconCutter;
        
        // Listen for file input changes
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
                        iconPreview.src = e.target.result;
                        iconPreview.classList.remove('hidden');
                        iconPlaceholder.classList.add('hidden');
                        iconContainer.dataset.croppedImage = e.target.result;
                    }
                } catch (error) {
                    console.error('Error processing server icon:', error);
                    // Fallback to simple preview
                    iconPreview.src = e.target.result;
                    iconPreview.classList.remove('hidden');
                    iconPlaceholder.classList.add('hidden');
                    iconContainer.dataset.croppedImage = e.target.result;
                }
            };
            
            reader.onerror = function(error) {
                console.error('Error reading file:', error);
            };
            
            reader.readAsDataURL(file);
        });
    } catch (error) {
        console.error('Error initializing server icon upload:', error);
    }
}

function initServerBannerUpload() {
    try {
        const bannerContainer = document.getElementById('server-banner-container');
        const bannerInput = document.getElementById('server-banner-input');
        const bannerPreview = document.getElementById('server-banner-preview');
        const bannerPlaceholder = document.getElementById('server-banner-placeholder');
        
        // Ensure all required elements exist
        if (!bannerContainer || !bannerInput || !bannerPreview || !bannerPlaceholder) {
            console.error('Missing required elements for server banner upload');
            return;
        }
        
        // Create image cutter for banner (2:1 aspect ratio)
        const bannerCutter = new ImageCutter({
            container: bannerContainer,
            type: 'banner',
            modalTitle: 'Crop Server Banner',
            onCrop: (result) => {
                if (result && result.error) {
                    console.error('Error cropping server banner:', result.message);
                    return;
                }
                
                // Update preview with cropped image
                bannerPreview.src = result.dataUrl;
                bannerPreview.classList.remove('hidden');
                bannerPlaceholder.classList.add('hidden');
                console.log('Banner crop completed');
                
                // Store the cropped image data to use during form submission
                bannerContainer.dataset.croppedImage = result.dataUrl;
            }
        });
        
        // Store the cutter instance for later use
        window.serverBannerCutter = bannerCutter;
        
        // Listen for file input changes
        bannerInput.addEventListener('change', function() {
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
                    if (window.serverBannerCutter) {
                        window.serverBannerCutter.loadImage(e.target.result);
                    } else {
                        // Fallback to simple preview
                        bannerPreview.src = e.target.result;
                        bannerPreview.classList.remove('hidden');
                        bannerPlaceholder.classList.add('hidden');
                        bannerContainer.dataset.croppedImage = e.target.result;
                    }
                } catch (error) {
                    console.error('Error processing server banner:', error);
                    // Fallback to simple preview
                    bannerPreview.src = e.target.result;
                    bannerPreview.classList.remove('hidden');
                    bannerPlaceholder.classList.add('hidden');
                    bannerContainer.dataset.croppedImage = e.target.result;
                }
            };
            
            reader.onerror = function(error) {
                console.error('Error reading file:', error);
            };
            
            reader.readAsDataURL(file);
        });
    } catch (error) {
        console.error('Error initializing server banner upload:', error);
    }
}

function initServerFormSubmission() {
    const serverForm = document.getElementById('create-server-form');
    if (serverForm) {
        serverForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            showLoading(submitBtn);
            
            // Get cropped images from data attributes if available
            const iconContainer = document.getElementById('server-icon-container');
            const bannerContainer = document.getElementById('server-banner-container');
            let iconDataUrl = iconContainer ? iconContainer.dataset.croppedImage : null;
            let bannerDataUrl = bannerContainer ? bannerContainer.dataset.croppedImage : null;
            
            // If we have cropped images, use them
            if (iconDataUrl || bannerDataUrl) {
                try {
                    const promises = [];
                    
                    if (iconDataUrl) {
                        promises.push(
                            fetch(iconDataUrl)
                                .then(res => res.blob())
                                .then(blob => {
                                    try {
                                        const iconFile = new File([blob], 'icon.png', { type: 'image/png' });
                                        updateFormDataWithFile(this, 'server_icon', iconFile);
                                    } catch (fileError) {
                                        console.error('Error creating icon file:', fileError);
                                    }
                                })
                                .catch(error => {
                                    console.error('Error processing icon image:', error);
                                })
                        );
                    }
                    
                    if (bannerDataUrl) {
                        promises.push(
                            fetch(bannerDataUrl)
                                .then(res => res.blob())
                                .then(blob => {
                                    try {
                                        const bannerFile = new File([blob], 'banner.png', { type: 'image/png' });
                                        updateFormDataWithFile(this, 'server_banner', bannerFile);
                                    } catch (fileError) {
                                        console.error('Error creating banner file:', fileError);
                                    }
                                })
                                .catch(error => {
                                    console.error('Error processing banner image:', error);
                                })
                        );
                    }
                    
                    // Wait for all promises to resolve then submit the form
                    Promise.all(promises)
                        .then(() => {
                            handleServerCreation(this);
                        })
                        .catch(err => {
                            console.error('Error processing cropped images:', err);
                            hideLoading(submitBtn);
                            showError('Error processing images. Please try again.');
                        });
                } catch (error) {
                    console.error('Error in image processing:', error);
                    hideLoading(submitBtn);
                    showError('Error processing images. Please try again.');
                }
            } else {
                handleServerCreation(this);
            }
        });
    }
}

function updateFormDataWithFile(form, fieldName, file) {
    // Remove existing file input if it exists
    const existingInput = form.querySelector(`input[name="${fieldName}"]`);
    if (existingInput) {
        existingInput.remove();
    }
    
    // Create new file input with the cropped image
    const input = document.createElement('input');
    input.type = 'file';
    input.name = fieldName;
    input.style.display = 'none';
    
    // Use DataTransfer to set the file
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    
    form.appendChild(input);
}

function handleServerCreation(form) {
    try {
        const formData = new FormData(form);
        const modal = document.getElementById('create-server-modal');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (!submitBtn.classList.contains('loading')) {
            showLoading(submitBtn);
        }
        
        const serverName = formData.get('name');
        if (!serverName || serverName.trim() === '') {
            hideLoading(submitBtn);
            showError('Server name is required');
            return;
        }
        
        const serverApi = new ServerAPI();
        serverApi.createServer(formData)
        .then(data => {
            hideLoading(submitBtn);
            if (data.success) {
                const server = data.data.server;
                
                try {
                    addServerToSidebar(server);
                } catch (error) {
                    console.error('Failed to add server to sidebar dynamically:', error);
                    refreshSidebar();
                }
                
                closeModal(modal);
                resetForm(form);
                navigateToNewServer(server.id);
            } else {
                showError(data.message || 'Failed to create server');
            }
        })
        .catch(error => {
            hideLoading(submitBtn);
            showError('Network error occurred. Please try again.');
            console.error('Server creation error:', error);
        });
    } catch (error) {
        const submitBtn = form.querySelector('button[type="submit"]');
        hideLoading(submitBtn);
        showError('An unexpected error occurred. Please try again.');
        console.error('Error in server creation:', error);
    }
}

function addServerToSidebar(server) {
    const sidebar = document.querySelector('.w-\\[72px\\]') || 
                   document.querySelector('.server-sidebar') ||
                   document.querySelector('[class*="server"]');
    
    if (sidebar) {
        const addButton = sidebar.querySelector('[data-action="create-server"]');
        const addButtonContainer = addButton ? addButton.closest('.tooltip-wrapper') || addButton.parentElement : null;
        
        if (addButtonContainer) {
            const serverItem = createServerItem(server);
            addButtonContainer.parentNode.insertBefore(serverItem, addButtonContainer);
            setActiveServer(serverItem);
            
            if (!sidebar.querySelector('.w-8.h-0\\.5')) {
                const separator = document.createElement('div');
                separator.className = 'w-8 h-0.5 bg-discord-dark rounded my-1';
                const homeButton = sidebar.querySelector('[href="/"]') || sidebar.querySelector('[href="/home"]');
                const homeContainer = homeButton ? homeButton.closest('.tooltip-wrapper') || homeButton.parentElement : null;
                if (homeContainer && homeContainer.nextSibling) {
                    homeContainer.parentNode.insertBefore(separator, homeContainer.nextSibling);
                }
            }
        }
    }
}

function createServerItem(server) {
    const serverItem = document.createElement('div');
    serverItem.className = 'tooltip-wrapper mb-2';
    
    const serverContent = `
        <div class="relative server-icon" data-server-id="${server.id}">
            <a href="/server/${server.id}" class="block group">
                <div class="w-12 h-12 overflow-hidden rounded-full hover:rounded-2xl bg-discord-dark transition-all duration-200 flex items-center justify-center">
                    ${server.image_url ? 
                        `<img src="${server.image_url}" alt="${server.name}" class="w-full h-full object-cover">` :
                        `<span class="text-white font-bold text-xl">${server.name.substring(0, 1).toUpperCase()}</span>`
                    }
                </div>
            </a>
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white rounded-r-md group-hover:h-5 transition-all duration-150"></div>
        </div>
    `;
    
    serverItem.innerHTML = serverContent;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip tooltip-right opacity-0 invisible absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-black text-white px-2 py-1 rounded text-sm whitespace-nowrap z-10 transition-all duration-200';
    tooltip.textContent = server.name;
    serverItem.appendChild(tooltip);
    
    serverItem.addEventListener('mouseenter', () => {
        tooltip.classList.remove('opacity-0', 'invisible');
    });
    
    serverItem.addEventListener('mouseleave', () => {
        tooltip.classList.add('opacity-0', 'invisible');
    });
    
    return serverItem;
}

function setActiveServer(serverItem) {
    document.querySelectorAll('.server-icon').forEach(item => {
        item.classList.remove('active');
        const serverDiv = item.querySelector('.w-12.h-12');
        const indicator = item.querySelector('.w-1');
        
        if (serverDiv) {
            serverDiv.classList.remove('rounded-2xl', 'bg-discord-primary');
            serverDiv.classList.add('rounded-full', 'bg-discord-dark');
        }
        if (indicator) {
            indicator.classList.remove('h-10');
            indicator.classList.add('h-0');
        }
    });
    
    const newServerIcon = serverItem.querySelector('.server-icon');
    if (newServerIcon) {
        newServerIcon.classList.add('active');
        const serverDiv = newServerIcon.querySelector('.w-12.h-12');
        const indicator = newServerIcon.querySelector('.w-1');
        
        if (serverDiv) {
            serverDiv.classList.remove('rounded-full', 'bg-discord-dark');
            serverDiv.classList.add('rounded-2xl', 'bg-discord-primary');
        }
        if (indicator) {
            indicator.classList.remove('h-0');
            indicator.classList.add('h-10');
        }
    }
}

function navigateToNewServer(serverId) {
    const currentPath = window.location.pathname;
    const newPath = `/server/${serverId}`;
    
    if (currentPath !== newPath) {
        history.pushState({serverId: serverId}, `Server ${serverId}`, newPath);
        loadServerPage(serverId);
    }
}

function loadServerPage(serverId) {
    const mainContent = document.querySelector('.flex-1') || 
                       document.querySelector('[class*="server-content"]') ||
                       document.querySelector('main');
    
    if (mainContent) {
        showPageLoading(mainContent);
        
        // Use the better HTML-specific method
        new ServerAPI().getServerPageHTML(serverId)
        .then(html => {
            if (typeof html === 'string') {
                pageUtils.updatePageContent(mainContent, html);
            } else {
                // Fallback direct navigation
                console.log('Received non-HTML response, redirecting...');
                window.location.href = `/server/${serverId}`;
            }
        })
        .catch(error => {
            console.error('Error loading server page:', error);
            window.location.href = `/server/${serverId}`;
        });
    } else {
        window.location.href = `/server/${serverId}`;
    }
}

function showLoading(button) {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...';
}

function hideLoading(button) {
    button.disabled = false;
    button.innerHTML = 'Create Server';
}

function showPageLoading(container) {
    container.innerHTML = `
        <div class="flex items-center justify-center h-full">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-blue mx-auto mb-4"></div>
                <p class="text-gray-400">Loading server...</p>
            </div>
        </div>
    `;
}

function closeModal(modal) {
    if (modal) {
        modal.classList.add('opacity-0', 'scale-95');
        modal.querySelector('.bg-discord-background').classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

function resetForm(form) {
    form.reset();
    const iconPreview = document.getElementById('server-icon-preview');
    const iconPlaceholder = document.getElementById('server-icon-placeholder');
    const bannerPreview = document.getElementById('server-banner-preview');
    const bannerPlaceholder = document.getElementById('server-banner-placeholder');
    
    if (iconPreview) iconPreview.classList.add('hidden');
    if (iconPlaceholder) iconPlaceholder.classList.remove('hidden');
    if (bannerPreview) bannerPreview.classList.add('hidden');
    if (bannerPlaceholder) bannerPlaceholder.classList.remove('hidden');
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

window.navigateToServer = function(serverId) {
    navigateToNewServer(serverId);
};

window.openCreateServerModal = function() {
    const modal = document.getElementById('create-server-modal');
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0', 'scale-95');
            modal.querySelector('.bg-discord-background').classList.remove('scale-95');
        }, 10);
        const nameInput = document.getElementById('server-name');
        if (nameInput) {
            nameInput.focus();
        }
    }
};

document.addEventListener('click', function(e) {
    const modal = document.getElementById('create-server-modal');
    const closeBtn = document.getElementById('close-server-modal');
    
    if (e.target === closeBtn || (e.target === modal)) {
        closeModal(modal);
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('create-server-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeModal(modal);
        }
    }
});

function initToggleAnimation() {
    const toggleCheckbox = document.getElementById('is-public');
    const toggleSwitch = toggleCheckbox?.nextElementSibling;
    
    if (toggleCheckbox && toggleSwitch) {
        toggleCheckbox.addEventListener('change', function() {
            if (this.checked) {
                toggleSwitch.classList.add('scale-105');
                setTimeout(() => toggleSwitch.classList.remove('scale-105'), 200);
            } else {
                toggleSwitch.classList.add('scale-95');
                setTimeout(() => toggleSwitch.classList.remove('scale-95'), 200);
            }
        });
    }
}

function initTooltips() {
    const iconContainer = document.getElementById('server-icon-container');
    const bannerContainer = document.getElementById('server-banner-container');
    
    if (iconContainer) {
        iconContainer.setAttribute('title', 'Upload server icon (1:1 ratio)');
        iconContainer.setAttribute('data-tooltip', 'click here');
    }
    
    if (bannerContainer) {
        bannerContainer.setAttribute('title', 'Upload server banner (2:1 ratio)');
        bannerContainer.setAttribute('data-tooltip', 'Click or drop image here');
    }
}