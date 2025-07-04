import ImageCutter from '../common/image-cutter.js';
import { pageUtils } from '../../utils/page-utils.js';
import { showToast } from '../../core/ui/toast.js';
import FormValidator from '../common/validation.js';
import serverAPI from '../../api/server-api.js';




let isFormSubmitting = false;
let modalInitialized = false;
let formListenerAttached = false;

document.addEventListener('DOMContentLoaded', function () {

    
    if (modalInitialized) {
        console.warn("Modal already initialized, skipping");
        return;
    }
    modalInitialized = true;
    
    initServerIconUpload();
    initServerBannerUpload();
    initServerFormSubmission();
    initToggleAnimation();
    initTooltips();
    initCategorySelection();
    initCreateServerButton();
    initStepNavigation();
    initCreateServerModal();
});

function initStepNavigation() {
    const nextStepBtn = document.getElementById('next-step-btn');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const stepDots = document.querySelectorAll('.step-dot');

    if (!nextStepBtn || !prevStepBtn || !step1 || !step2) {
        console.error('Missing step navigation elements');
        return;
    }

    nextStepBtn.addEventListener('click', function () {
        const form = document.getElementById('create-server-form');
        
        if (!validateServerBasicInfo(form)) {
            return;
        }
        
        step1.classList.add('slide-left-exit');
        
        setTimeout(() => {
            step1.classList.remove('active');
            step1.classList.remove('slide-left-exit');
            
            step2.classList.add('active');
            step2.classList.add('slide-right-enter');
            
            stepDots[0].classList.remove('active');
            stepDots[1].classList.add('active');
            
            setTimeout(() => {
                step2.classList.remove('slide-right-enter');
            }, 300);
        }, 280);
    });

    prevStepBtn.addEventListener('click', function () {
        const form = document.getElementById('create-server-form');
        if (form) {
            FormValidator.clearErrors(form);
        }
        
        step2.classList.add('slide-right-exit');
        
        setTimeout(() => {
            step2.classList.remove('active');
            step2.classList.remove('slide-right-exit');
            
            step1.classList.add('active');
            step1.classList.add('slide-left-enter');
            
            stepDots[1].classList.remove('active');
            stepDots[0].classList.add('active');
            
            setTimeout(() => {
                step1.classList.remove('slide-left-enter');
            }, 300);
        }, 280);
    });
}

function validateServerBasicInfo(form) {
    FormValidator.clearErrors(form);
    
    const serverName = form.querySelector('#server-name');
    const serverDescription = form.querySelector('#server-description');
    const serverCategory = form.querySelector('#server-category');
    
    let isValid = true;
    
    if (!serverName.value.trim()) {
        FormValidator.showFieldError(serverName, 'Server name is required');
        isValid = false;
    }
    
    if (!serverDescription.value.trim()) {
        FormValidator.showFieldError(serverDescription, 'Server description is required');
        isValid = false;
    }
    
    if (!serverCategory.value) {
        FormValidator.showFieldError(serverCategory, 'Server category is required');
        isValid = false;
    }
    
    return isValid;
}

function validateServerForm(form) {
    const isBasicValid = validateServerBasicInfo(form);
    
    if (!isBasicValid) {
        const step1 = document.getElementById('step-1');
        const step2 = document.getElementById('step-2');
        const stepDots = document.querySelectorAll('.step-dot');
        
        if (!step1.classList.contains('active')) {
            step2.classList.remove('active');
            step1.classList.add('active');
            
            stepDots[1].classList.remove('active');
            stepDots[0].classList.add('active');
        }
        
        return false;
    }
    
    return true;
}

function initServerIconUpload() {
    try {
        const iconContainer = document.getElementById('server-icon-container');
        const iconInput = document.getElementById('server-icon-input');
        const iconPreview = document.getElementById('server-icon-preview');
        const iconPlaceholder = document.getElementById('server-icon-placeholder');

        if (!iconContainer || !iconInput || !iconPreview || !iconPlaceholder) {
            console.error('Missing required elements for server icon upload');
            return;
        }

        const iconCutter = new ImageCutter({
            container: iconContainer,
            type: 'profile',
            modalTitle: 'Crop Server Icon',
            onCrop: (result) => {
                if (result && result.error) {
                    console.error('Error cropping server icon:', result.message);
                    return;
                }

                iconPreview.src = result.dataUrl;
                iconPreview.classList.remove('hidden');
                iconPlaceholder.classList.add('hidden');


                iconContainer.dataset.croppedImage = result.dataUrl;
            }
        });

        window.serverIconCutter = iconCutter;

        iconInput.addEventListener('change', function () {
            if (!this.files || !this.files[0]) return;

            const file = this.files[0];

            if (!file.type.match('image.*')) {
                alert('Please select a valid image file');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    if (window.serverIconCutter) {
                        window.serverIconCutter.loadImage(e.target.result);
                    } else {
                        iconPreview.src = e.target.result;
                        iconPreview.classList.remove('hidden');
                        iconPlaceholder.classList.add('hidden');
                        iconContainer.dataset.croppedImage = e.target.result;
                    }
                } catch (error) {
                    console.error('Error processing server icon:', error);
                    iconPreview.src = e.target.result;
                    iconPreview.classList.remove('hidden');
                    iconPlaceholder.classList.add('hidden');
                    iconContainer.dataset.croppedImage = e.target.result;
                }
            };

            reader.onerror = function (error) {
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

        if (!bannerContainer || !bannerInput || !bannerPreview || !bannerPlaceholder) {
            console.error('Missing required elements for server banner upload');
            return;
        }

        const bannerCutter = new ImageCutter({
            container: bannerContainer,
            type: 'banner',
            modalTitle: 'Crop Server Banner',
            onCrop: (result) => {
                if (result && result.error) {
                    console.error('Error cropping server banner:', result.message);
                    return;
                }

                bannerPreview.src = result.dataUrl;
                bannerPreview.classList.remove('hidden');
                bannerPlaceholder.classList.add('hidden');


                bannerContainer.dataset.croppedImage = result.dataUrl;
            }
        });

        window.serverBannerCutter = bannerCutter;

        bannerInput.addEventListener('change', function () {
            if (!this.files || !this.files[0]) return;

            const file = this.files[0];

            if (!file.type.match('image.*')) {
                alert('Please select a valid image file');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    if (window.serverBannerCutter) {
                        window.serverBannerCutter.loadImage(e.target.result);
                    } else {
                        bannerPreview.src = e.target.result;
                        bannerPreview.classList.remove('hidden');
                        bannerPlaceholder.classList.add('hidden');
                        bannerContainer.dataset.croppedImage = e.target.result;
                    }
                } catch (error) {
                    console.error('Error processing server banner:', error);
                    bannerPreview.src = e.target.result;
                    bannerPreview.classList.remove('hidden');
                    bannerPlaceholder.classList.add('hidden');
                    bannerContainer.dataset.croppedImage = e.target.result;
                }
            };

            reader.onerror = function (error) {
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
    if (!serverForm) {
        console.error('Server form not found');
        return;
    }
    
    if (formListenerAttached) {

        return;
    }
    
    formListenerAttached = true;

    
    serverForm.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();



        if (isFormSubmitting) {

            return false;
        }

        if (!validateServerForm(this)) {

            return false;
        }
        

        isFormSubmitting = true;
        const submitBtn = this.querySelector('button[type="submit"]');
        showLoading(submitBtn);
        
        const iconContainer = document.getElementById('server-icon-container');
        const bannerContainer = document.getElementById('server-banner-container');
        let iconDataUrl = iconContainer ? iconContainer.dataset.croppedImage : null;
        let bannerDataUrl = bannerContainer ? bannerContainer.dataset.croppedImage : null;
        
        const formData = new FormData(this);
        
        const promises = [];
        
        if (iconDataUrl && iconDataUrl.startsWith('data:')) {
            try {
                promises.push(
                    fetch(iconDataUrl)
                        .then(res => res.blob())
                        .then(blob => {
                            const iconFile = new File([blob], 'icon.png', { type: 'image/png' });
                            formData.set('server_icon', iconFile);
                        })
                        .catch(err => {
                            console.warn('Failed to process icon image:', err);
                        })
                );
            } catch (err) {
                console.warn('Failed to create icon fetch promise:', err);
            }
        }

        if (bannerDataUrl && bannerDataUrl.startsWith('data:')) {
            try {
                promises.push(
                    fetch(bannerDataUrl)
                        .then(res => res.blob())
                        .then(blob => {
                            const bannerFile = new File([blob], 'banner.png', { type: 'image/png' });
                            formData.set('server_banner', bannerFile);
                        })
                        .catch(err => {
                            console.warn('Failed to process banner image:', err);
                        })
                );
            } catch (err) {
                console.warn('Failed to create banner fetch promise:', err);
            }
        }
        
        if (promises.length > 0) {
            Promise.all(promises)
                .then(() => {
                    handleServerCreation(this, formData);
                })
                .catch(err => {
                    console.warn('Error processing images, proceeding without them:', err);
                    handleServerCreation(this, formData);
                });
        } else {
            handleServerCreation(this, formData);
        }
        
        return false;
    });
}

function handleServerCreation(form, formData = null) {
    try {
        if (!formData) {
            formData = new FormData(form);
        }
        const modal = document.getElementById('create-server-modal');
        const submitBtn = form.querySelector('button[type="submit"]');
        

        
        serverAPI.createServer(formData)
            .then(data => {

                hideLoading(submitBtn);
                isFormSubmitting = false;
                
                if (data.data) {
                    const server = data.data.server;
                    
                    try {
                        addServerToSidebar(server);
                        
                        setTimeout(() => {
                            if (window.updateActiveServer) {
                        window.updateActiveServer();
                    }
                        }, 100);
                    } catch (error) {
                        console.error('Failed to add server to sidebar dynamically:', error);
                        pageUtils.refreshSidebar();
                    }
                    
                    closeModal(modal);
                    resetForm(form);
                    showToast(`Server "${server.name}" created successfully!`, 'success');
                    
                    setTimeout(() => {
                        window.location.href = `/server/${server.id}`;
                    }, 800);
                } else {
                    showToast(data.message || 'Failed to create server', 'error');
                }
            })
            .catch(error => {
                console.error('Server creation error:', error);
                hideLoading(submitBtn);
                isFormSubmitting = false;
                showToast('Network error occurred. Please try again.', 'error');
            });
    } catch (error) {
        console.error('Error in server creation:', error);
        const submitBtn = form.querySelector('button[type="submit"]');
        hideLoading(submitBtn);
        isFormSubmitting = false;
        showToast('An unexpected error occurred. Please try again.', 'error');
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
                            <div class="relative server-sidebar-icon" data-server-id="${server.id}">
            <a href="/server/${server.id}" class="block group">
                <div class="w-12 h-12 overflow-hidden rounded-2xl bg-discord-primary transition-all duration-200 flex items-center justify-center">
                    ${server.image_url ?
            `<img src="${server.image_url}" alt="${server.name}" class="w-full h-full object-cover">` :
            `<span class="text-white font-bold text-xl">${server.name.substring(0, 1).toUpperCase()}</span>`
        }
                </div>
            </a>
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-md"></div>
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
    document.querySelectorAll('.server-sidebar-icon').forEach(item => {
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
    
    const newServerIcon = serverItem.querySelector('.server-sidebar-icon');
    if (newServerIcon) {
        newServerIcon.classList.add('active');
        
        const serverDiv = newServerIcon.querySelector('.w-12.h-12');
        if (serverDiv) {
            serverDiv.classList.remove('rounded-full', 'bg-discord-dark');
            serverDiv.classList.add('rounded-2xl', 'bg-discord-primary');
        }
        
        const indicator = newServerIcon.querySelector('.w-1');
        if (indicator) {
            indicator.classList.remove('h-0');
            indicator.classList.add('h-10');
        } else {
            const indicatorDiv = document.createElement('div');
            indicatorDiv.className = 'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-md';
            newServerIcon.appendChild(indicatorDiv);
        }
    }
}

async function getDefaultChannelForServer(serverId) {
    try {
        const response = await fetch(`/api/servers/${serverId}/channels`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.channels && data.data.channels.length > 0) {
            const textChannel = data.data.channels.find(channel => 
                channel.type === 'text' || channel.type === 0 || channel.type_name === 'text'
            );
            return textChannel ? textChannel.id : data.data.channels[0].id;
        }
        return null;
    } catch (error) {
        console.error('[Create Server] Error getting default channel:', error);
        return null;
    }
}

async function navigateToNewServer(serverId) {
    const currentPath = window.location.pathname;
    
    try {
        const defaultChannelId = await getDefaultChannelForServer(serverId);

        
        const newPath = defaultChannelId ? `/server/${serverId}?channel=${defaultChannelId}` : `/server/${serverId}`;

        if (currentPath !== newPath) {
            history.pushState({ serverId: serverId, channelId: defaultChannelId }, `Server ${serverId}`, newPath);
            window.location.href = newPath;
        }
    } catch (error) {
        console.error('[Create Server] Error navigating to new server:', error);
        window.location.href = `/server/${serverId}`;
    }
}

function showLoading(button) {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...';
    button.classList.add('loading');
}

function hideLoading(button) {
    button.disabled = false;
    button.innerHTML = 'Create Server';
    button.classList.remove('loading');
}

function closeModal(modal) {
    if (modal) {
        const form = document.getElementById('create-server-form');
        if (form) {
            FormValidator.clearErrors(form);
        }
        
        modal.classList.add('animate-fade-out');
        modal.classList.remove('animate-fade-in');
        const modalContent = modal.querySelector('.bg-discord-background');
        if (modalContent) {
            modalContent.classList.add('animate-scale-out');
            modalContent.classList.remove('animate-scale-in');
            modalContent.classList.add('scale-95');
        }
        
        setTimeout(() => {
            modal.classList.add('hidden', 'opacity-0');
            modal.classList.remove('animate-fade-out');
            modal.style.display = 'none';
            if (modalContent) {
                modalContent.classList.remove('animate-scale-out');
            }
            resetForm(form);
            isFormSubmitting = false;
        }, 300);
    }
}

function resetForm(form) {
    if (!form) return;
    
    form.reset();
    FormValidator.clearErrors(form);
    
    const iconPreview = document.getElementById('server-icon-preview');
    const iconPlaceholder = document.getElementById('server-icon-placeholder');
    const bannerPreview = document.getElementById('server-banner-preview');
    const bannerPlaceholder = document.getElementById('server-banner-placeholder');
    const categorySelect = document.getElementById('server-category');

    if (iconPreview) iconPreview.classList.add('hidden');
    if (iconPlaceholder) iconPlaceholder.classList.remove('hidden');
    if (bannerPreview) bannerPreview.classList.add('hidden');
    if (bannerPlaceholder) bannerPlaceholder.classList.remove('hidden');

    if (categorySelect) {
        categorySelect.classList.remove('text-white');
        categorySelect.classList.remove('border-discord-blue');
    }

    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const stepDots = document.querySelectorAll('.step-dot');

    if (step1 && step2 && stepDots.length >= 2) {
        step2.classList.remove('active');
        step1.classList.add('active');
        stepDots[1].classList.remove('active');
        stepDots[0].classList.add('active');
    }
    
    isFormSubmitting = false;
}

window.navigateToServer = function (serverId) {
    navigateToNewServer(serverId);
};

export function openCreateServerModal() {

    const modal = document.getElementById('create-server-modal');
    if (modal) {

        const form = document.getElementById('create-server-form');
        if (form) {
            FormValidator.clearErrors(form);
        }
        
        modal.classList.remove('hidden', 'opacity-0');
        modal.style.display = 'flex';
        
        requestAnimationFrame(() => {
            modal.classList.add('animate-fade-in');
            const modalContent = modal.querySelector('.bg-discord-background');
            if (modalContent) {
                modalContent.classList.remove('scale-95');
                modalContent.classList.add('animate-scale-in');
            }
        });
        
        const nameInput = document.getElementById('server-name');
        if (nameInput) {
            setTimeout(() => nameInput.focus(), 300);
        }
    } else {
        console.error('Create server modal not found in the DOM');
    }
}

window.openCreateServerModal = openCreateServerModal;

document.addEventListener('click', function (e) {
    const modal = document.getElementById('create-server-modal');
    const closeBtn = document.getElementById('close-create-server-modal');

    if ((closeBtn && (e.target === closeBtn || closeBtn.contains(e.target))) || (e.target === modal)) {
        const form = document.getElementById('create-server-form');
        if (form) {
            FormValidator.clearErrors(form);
        }
        closeModal(modal);
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('create-server-modal');
        if (modal && !modal.classList.contains('hidden')) {
            const form = document.getElementById('create-server-form');
            if (form) {
                FormValidator.clearErrors(form);
            }
            closeModal(modal);
        }
    }
});

function initToggleAnimation() {
    const toggleCheckbox = document.getElementById('is-public');
    const toggleSwitch = toggleCheckbox?.nextElementSibling;

    if (toggleCheckbox && toggleSwitch) {
        toggleCheckbox.addEventListener('change', function () {
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

function initCategorySelection() {
    const categorySelect = document.getElementById('server-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', function () {
            const selectedOption = this.options[this.selectedIndex];

            if (this.value) {
                this.classList.add('text-white');
                this.classList.add('border-discord-blue');
            } else {
                this.classList.remove('text-white');
                this.classList.remove('border-discord-blue');
            }
        });
    }
}

function initCreateServerButton() {
    const createServerButtons = document.querySelectorAll('[data-action="create-server"]');

    
    createServerButtons.forEach(button => {
        if (button.hasAttribute('data-listener-attached')) {
            return;
        }
        button.setAttribute('data-listener-attached', 'true');
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            openCreateServerModal();
        });
    });
}

function initCreateServerModal() {
    setupJoinServerForm();
    setupModalNavigation();
    setupInviteForm();
}

function setupJoinServerForm() {
    const joinServerForm = document.getElementById('join-server-form');
    const joinInviteInput = document.getElementById('join-invite-code');
    const joinSubmitBtn = document.querySelector('#join-server-modal .bg-blue-600');
    
    if (joinServerForm) {
        joinServerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const inviteCode = joinInviteInput.value.trim();
            if (!inviteCode) {
                showToast('Please enter an invite code', 'error');
                return;
            }
            
            try {
                joinSubmitBtn.disabled = true;
                joinSubmitBtn.textContent = 'Joining...';
                
                const response = await fetch('/api/servers/join', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ invite_code: inviteCode }),
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('Successfully joined server!', 'success');
                    closeAllModals();
                    window.location.href = `/server/${data.data.server_id}`;
                } else {
                    showToast(data.message || 'Failed to join server', 'error');
                }
            } catch (error) {
                console.error('Error joining server:', error);
                showToast('An error occurred while joining the server', 'error');
            } finally {
                joinSubmitBtn.disabled = false;
                joinSubmitBtn.textContent = 'Join Server';
            }
        });
    }
}



function setupModalNavigation() {
    const createServerModal = document.getElementById('create-server-modal');
    const joinServerModal = document.getElementById('join-server-modal');
    
    const showJoinModalBtn = document.getElementById('show-join-modal');
    const showCreateModalBtn = document.getElementById('show-create-modal');
    
    if (showJoinModalBtn) {
        showJoinModalBtn.addEventListener('click', function() {
            closeModal(createServerModal);
            openModal(joinServerModal);
        });
    }
    
    if (showCreateModalBtn) {
        showCreateModalBtn.addEventListener('click', function() {
            closeModal(joinServerModal);
            openModal(createServerModal);
        });
    }
}

function setupInviteForm() {
    const form = document.getElementById('join-invite-form');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const inviteCode = formData.get('invite_code');
        
        if (!inviteCode) {
            showToast('Please enter an invite code', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/invites/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ invite_code: inviteCode }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Successfully joined server!', 'success');
                window.location.href = `/server/${data.data.server_id}`;
            } else {
                showToast(data.message || 'Invalid invite code', 'error');
            }
        } catch (error) {
            console.error('Error joining via invite:', error);
            showToast('An error occurred', 'error');
        }
    });
}

function openModal(modal) {
    if (modal) {
        modal.classList.remove('hidden', 'opacity-0');
        modal.style.display = 'flex';
        
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            firstInput.focus();
        }
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('[id$="-modal"]');
    modals.forEach(closeModal);
}

window.closeCreateServerModal = closeModal;