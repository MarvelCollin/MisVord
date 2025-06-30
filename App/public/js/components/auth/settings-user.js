/**
 * User Settings Page Javascript
 */
import ImageCutter from '../common/image-cutter.js';

document.addEventListener('DOMContentLoaded', function() {
    initUserSettingsPage();
    
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
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.removeAttribute('onclick');
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            logoutUser();
        });
    }
});

function initUserSettingsPage() {
    if (!document.querySelector('.settings-page, .flex.min-h-screen')) {
        return;
    }

    if (typeof window.logger !== 'undefined') {
        window.logger.debug('settings', 'Initializing user settings page');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const activeSection = urlParams.get('section') || 'my-account';
    
    initSidebarNavigation(activeSection);
    initLogoutButton();
    initGlobalClickHandlers();
    
    if (activeSection === 'my-account') {
        initUserAvatarUpload();
        initUserBannerUpload();
        initStatusSelector();
        initEmailReveal();
        initPasswordChangeForms();
        initBioHandling();
        initProfileFormSubmit();
    } else if (activeSection === 'connections') {
        initConnectionToggles();
    } else if (activeSection === 'voice') {
        initVoiceVideoSection();
    }
    
    initCloseButton();
    initPasswordFieldMasking();
}

/**
 * Initialize sidebar navigation
 */
function initSidebarNavigation(activeSection) {
    const sidebarItems = document.querySelectorAll('a.sidebar-item');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href && href.includes('section=')) {
                return;
            }
            
            if (href && href.startsWith('/') && !href.includes('?section=')) {
                return;
            }
            
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (!section) return;
            
            const url = new URL(window.location);
            url.searchParams.set('section', section);
            window.history.replaceState({}, '', url);
            
            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            window.location.href = href;
        });
    });
}

/**
 * Initialize user avatar upload with image cropper
 */
function initUserAvatarUpload() {
    const iconContainer = document.getElementById('user-avatar-container');
    const iconInput = document.getElementById('avatar-input');
    const iconPreview = document.getElementById('user-avatar-preview');
    const removeIconBtn = document.getElementById('remove-avatar-btn');
    
    if (!iconContainer || !iconInput) return;
    
    try {
        const avatarCutter = new ImageCutter({
            container: iconContainer,
            type: 'profile',
            modalTitle: 'Upload Profile Picture',
            aspectRatio: 1,
            onCrop: (result) => {
                if (result && result.error) {
                    showToast(result.message || 'Error cropping avatar', 'error');
                    return;
                }
                
                if (iconPreview) {
                    iconPreview.src = result.dataUrl;
                    iconPreview.classList.remove('hidden');
                    
                    const placeholder = document.getElementById('user-avatar-placeholder');
                    if (placeholder) placeholder.classList.add('hidden');
                }
                
                iconContainer.dataset.croppedImage = result.dataUrl;
                
                if (removeIconBtn && removeIconBtn.classList.contains('hidden')) {
                    removeIconBtn.classList.remove('hidden');
                }
                
                uploadAvatar(result.dataUrl);
            }
        });
        
        window.userAvatarCutter = avatarCutter;
    } catch (error) {
        console.error('Error initializing image cutter:', error);
    }
    
    if (iconContainer) {
        iconContainer.addEventListener('click', function() {
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
                    if (window.userAvatarCutter) {
                        window.userAvatarCutter.loadImage(e.target.result);
                    } else {
                        if (iconPreview) {
                            iconPreview.src = e.target.result;
                            iconPreview.classList.remove('hidden');
                            
                            const placeholder = document.getElementById('user-avatar-placeholder');
                            if (placeholder) placeholder.classList.add('hidden');
                        }
                        
                        iconContainer.dataset.croppedImage = e.target.result;
                        
                        uploadAvatar(e.target.result);
                    }
                } catch (error) {
                    showToast('Error processing avatar', 'error');
                }
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    if (removeIconBtn) {
        removeIconBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            showImageRemovalConfirmation('avatar', () => {
                removeUserImage('avatar');
            });
        });
    }
}

/**
 * Initialize banner upload with image cropper
 */
function initUserBannerUpload() {
    const bannerContainer = document.getElementById('user-banner-container');
    const bannerInput = document.getElementById('user-banner-input');
    const bannerPreview = document.getElementById('user-banner-preview');
    const removeBannerBtn = document.getElementById('remove-banner-btn');
    
    if (!bannerContainer || !bannerInput) return;
    
    try {
        const bannerCutter = new ImageCutter({
            container: bannerContainer,
            type: 'banner',
            modalTitle: 'Upload Profile Banner',
            aspectRatio: 4/1,
            onCrop: (result) => {
                if (result && result.error) {
                    showToast(result.message || 'Error cropping banner', 'error');
                    return;
                }
                
                if (bannerPreview) {
                    bannerPreview.src = result.dataUrl;
                    bannerPreview.classList.remove('hidden');
                    
                    const placeholder = document.getElementById('user-banner-placeholder');
                    if (placeholder) placeholder.classList.add('hidden');
                }
                
                bannerContainer.dataset.croppedImage = result.dataUrl;
                
                if (removeBannerBtn && removeBannerBtn.classList.contains('hidden')) {
                    removeBannerBtn.classList.remove('hidden');
                }
                
                uploadBanner(result.dataUrl);
            }
        });
        
        window.userBannerCutter = bannerCutter;
    } catch (error) {
        console.error('Error initializing banner cutter:', error);
    }
    
    if (bannerContainer) {
        bannerContainer.addEventListener('click', function() {
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
                    if (window.userBannerCutter) {
                        window.userBannerCutter.loadImage(e.target.result);
                    } else {
                        if (bannerPreview) {
                            bannerPreview.src = e.target.result;
                            bannerPreview.classList.remove('hidden');
                            
                            const placeholder = document.getElementById('user-banner-placeholder');
                            if (placeholder) placeholder.classList.add('hidden');
                        }
                        
                        bannerContainer.dataset.croppedImage = e.target.result;
                        
                        uploadBanner(e.target.result);
                    }
                } catch (error) {
                    showToast('Error processing banner', 'error');
                }
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    if (removeBannerBtn) {
        removeBannerBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            showImageRemovalConfirmation('banner', () => {
                removeUserImage('banner');
            });
        });
    }
}

/**
 * Upload avatar to server
 */
function uploadAvatar(dataUrl) {
    const blob = dataURLtoBlob(dataUrl);
    
    const formData = new FormData();
    formData.append('avatar', blob, 'avatar.png');
    
    showToast('Uploading profile picture...', 'info');
    
    fetch('/user/avatar/update', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
    })
    .then(async response => {
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error?.message || errorMessage;
            } catch (parseError) {
                console.warn('Could not parse error response as JSON:', parseError);
            }
            throw new Error(errorMessage);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }
        
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast('Profile picture updated successfully', 'success');
            
            const avatarUrl = data.data?.avatar_url || data.avatar_url;
            updateAllAvatars(avatarUrl || dataUrl);
            
            const removeAvatarBtn = document.getElementById('remove-avatar-btn');
            if (removeAvatarBtn && removeAvatarBtn.classList.contains('hidden')) {
                removeAvatarBtn.classList.remove('hidden');
            }
            
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            throw new Error(data.message || data.error?.message || 'Failed to update profile picture');
        }
    })
    .catch(error => {
        console.error('Error uploading avatar:', error);
        showToast(error.message || 'Error uploading profile picture', 'error');
    });
}

/**
 * Upload banner to server
 */
function uploadBanner(dataUrl) {
    const blob = dataURLtoBlob(dataUrl);
    
    const formData = new FormData();
    formData.append('banner', blob, 'banner.png');
    
    showToast('Uploading profile banner...', 'info');
    
    fetch('/user/banner/update', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
    })
    .then(async response => {
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error?.message || errorMessage;
            } catch (parseError) {
                console.warn('Could not parse error response as JSON:', parseError);
            }
            throw new Error(errorMessage);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }
        
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast('Profile banner updated successfully', 'success');
            
            const bannerUrl = data.data?.banner_url || data.banner_url;
            updateAllBanners(bannerUrl || dataUrl);
            
            const removeBannerBtn = document.getElementById('remove-banner-btn');
            if (removeBannerBtn && removeBannerBtn.classList.contains('hidden')) {
                removeBannerBtn.classList.remove('hidden');
            }
            
            // Reload page after successful upload to ensure all UI is updated
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            throw new Error(data.message || data.error?.message || 'Failed to update profile banner');
        }
    })
    .catch(error => {
        console.error('Error uploading banner:', error);
        showToast(error.message || 'Error uploading profile banner', 'error');
    });
}

/**
 * Update all avatar instances in the UI
 */
function updateAllAvatars(url) {
    const avatarElements = document.querySelectorAll('.user-avatar img, #user-avatar-preview');
    
    avatarElements.forEach(avatar => {
        avatar.src = url;
    });
    
    const avatarMeta = document.querySelector('meta[name="user-avatar"]');
    if (avatarMeta) {
        avatarMeta.content = url;
    }
}

/**
 * Update all banner instances in the UI
 */
function updateAllBanners(url) {
    const bannerElements = document.querySelectorAll('.user-banner img, #user-banner-preview');
    
    bannerElements.forEach(banner => {
        if (url) {
            banner.src = url;
            banner.style.display = 'block';
        } else {
            banner.style.display = 'none';
        }
    });
    
    const bannerMeta = document.querySelector('meta[name="user-banner"]');
    if (bannerMeta) {
        bannerMeta.content = url || '';
    }
    
    const bannerContainers = document.querySelectorAll('.user-banner-container');
    bannerContainers.forEach(container => {
        if (url) {
            container.style.backgroundImage = `url(${url})`;
        } else {
            container.style.backgroundImage = 'none';
        }
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
    
    const goBack = () => {
        window.location.href = '/home';
    };

    closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        goBack();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('settings-page')) {
            e.preventDefault();
            goBack();
        }
    });
}

/**
 * Initialize logout button
 */
function initLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.className = logoutBtn.className;
        logoutLink.id = 'logout-btn';
        logoutLink.innerHTML = logoutBtn.innerHTML;
        
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            logoutUser();
        });
        
        if (logoutBtn.parentNode) {
            logoutBtn.parentNode.replaceChild(logoutLink, logoutBtn);
        }
    } else {
        setTimeout(() => {
            const logoutBtnRetry = document.getElementById('logout-btn');
            if (logoutBtnRetry) {
                const logoutLink = document.createElement('a');
                logoutLink.href = '#';
                logoutLink.className = logoutBtnRetry.className;
                logoutLink.id = 'logout-btn';
                logoutLink.innerHTML = logoutBtnRetry.innerHTML;
                
                logoutLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    logoutUser();
                });
                
                if (logoutBtnRetry.parentNode) {
                    logoutBtnRetry.parentNode.replaceChild(logoutLink, logoutBtnRetry);
                }
            } else {
                const possibleLogoutButtons = document.querySelectorAll('button.sidebar-item, .sidebar-item');
                possibleLogoutButtons.forEach(btn => {
                    if (btn.textContent.toLowerCase().includes('log out') || 
                        btn.textContent.toLowerCase().includes('logout') ||
                        btn.innerHTML.toLowerCase().includes('log out') ||
                        btn.innerHTML.toLowerCase().includes('logout')) {
                        
                        const logoutLink = document.createElement('a');
                        logoutLink.href = '#';
                        logoutLink.className = btn.className;
                        logoutLink.id = 'logout-btn';
                        logoutLink.innerHTML = btn.innerHTML;
                        
                        logoutLink.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            logoutUser();
                        });
                        
                        if (btn.parentNode) {
                            btn.parentNode.replaceChild(logoutLink, btn);
                        }
                    }
                });
            }
        }, 1000);
    }
}

/**
 * Initialize global click handlers as fallback
 */
function initGlobalClickHandlers() {
    document.addEventListener('click', function(e) {
        if (e.target && (e.target.id === 'logout-btn' || e.target.closest('#logout-btn'))) {
            e.preventDefault();
            e.stopPropagation();
            logoutUser();
            return;
        }
        
        if (e.target && (
            (e.target.textContent && e.target.textContent.toLowerCase().includes('log out')) ||
            (e.target.innerHTML && e.target.innerHTML.toLowerCase().includes('log out')) ||
            (e.target.textContent && e.target.textContent.toLowerCase().includes('logout')) ||
            (e.target.innerHTML && e.target.innerHTML.toLowerCase().includes('logout'))
        )) {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.classList.contains('sidebar-item')) {
                e.preventDefault();
                e.stopPropagation();
                logoutUser();
                return;
            }
        }
        
        let parent = e.target.parentElement;
        for (let i = 0; i < 3 && parent; i++) {
            if (parent && (
                (parent.textContent && parent.textContent.toLowerCase().includes('log out')) ||
                (parent.innerHTML && parent.innerHTML.toLowerCase().includes('log out'))
            ) && (parent.tagName === 'BUTTON' || parent.tagName === 'A' || parent.classList.contains('sidebar-item'))) {
                e.preventDefault();
                e.stopPropagation();
                logoutUser();
                return;
            }
            parent = parent.parentElement;
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
            
            statusOptions.forEach(opt => {
                opt.classList.remove('bg-discord-background-modifier-selected');
            });
            this.classList.add('bg-discord-background-modifier-selected');
            
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
    .then(async response => {
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error?.message || errorMessage;
            } catch (parseError) {
                console.warn('Could not parse error response as JSON:', parseError);
            }
            throw new Error(errorMessage);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }
        
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateStatusIndicators(status);
            showToast(`Status updated to ${getStatusDisplayName(status)}`, 'success');
        } else {
            throw new Error(data.message || data.error?.message || 'Failed to update status');
        }
    })
    .catch(error => {
        console.error('Error updating status:', error);
        showToast(error.message || 'Error updating status', 'error');
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
    
    const statusIndicators = document.querySelectorAll('.status-indicator');
    statusIndicators.forEach(indicator => {
        Object.values(statusMap).forEach(cls => {
            indicator.classList.remove(cls);
        });
        
        indicator.classList.add(newStatusClass);
    });
    
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
        
        if (!email) return;
        
        if (emailDisplay.textContent !== email) {
            emailDisplay.textContent = email;
            revealButton.textContent = 'Hide';
        } else {
            const parts = email.split('@');
            if (parts.length > 1) {
                const username = parts[0];
                const domain = parts[1];
                const maskedUsername = username.substring(0, 2) + '*'.repeat(Math.max(0, username.length - 2));
                emailDisplay.textContent = maskedUsername + '@' + domain;
            } else {
                emailDisplay.textContent = email.substring(0, 2) + '*'.repeat(Math.max(0, email.length - 5)) + email.substring(email.length - 3);
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
    const modal = document.getElementById('change-password-modal');
    const closeModalBtn = document.getElementById('close-password-modal');
    const cancelBtn = document.getElementById('cancel-password-change');
    
    const securityQuestionStep = document.getElementById('security-question-step');
    const newPasswordStep = document.getElementById('new-password-step');
    const setSecurityStep = document.getElementById('set-security-step');
    
    const securityQuestionText = document.getElementById('security-question-text');
    const securityAnswerInput = document.getElementById('security-answer-input');
    const securityAnswerError = document.getElementById('security-answer-error');
    const verifyBtn = document.getElementById('verify-security-answer');
    
    const newPasswordInput = document.getElementById('new-password-input');
    const confirmPasswordInput = document.getElementById('confirm-password-input');
    const passwordError = document.getElementById('password-error');
    const backBtn = document.getElementById('back-to-security');
    const confirmBtn = document.getElementById('confirm-password-change');
    
    const setQuestionSelect = document.getElementById('set-question-select');
    const setAnswerInput = document.getElementById('set-answer-input');
    const setSecurityError = document.getElementById('set-security-error');
    const setSecurityBtn = document.getElementById('set-security-question-btn');
    
    let userSecurityQuestion = '';
    let needsSecurityQuestion = false;
    
    if (!changePasswordBtn) return;
    
    modal.classList.remove('show');
    modal.classList.add('hidden');
    
    function openModal() {
        console.log('PASSWORD MODAL OPENING - Starting debug process...');
        modal.classList.add('show');
        modal.classList.remove('hidden');
        showStep('security-question');
        resetForm();
        loadSecurityQuestion();
    }
    
    function closeModal() {
        modal.classList.remove('show');
        modal.classList.add('hidden');
        resetForm();
    }
    
    function showStep(step) {
        securityQuestionStep.classList.add('hidden');
        newPasswordStep.classList.add('hidden');
        if (setSecurityStep) setSecurityStep.classList.add('hidden');
        
        if (step === 'security-question') {
            securityQuestionStep.classList.remove('hidden');
        } else if (step === 'new-password') {
            newPasswordStep.classList.remove('hidden');
        } else if (step === 'set-security' && setSecurityStep) {
            setSecurityStep.classList.remove('hidden');
            if (securityQuestionText.textContent === 'Loading...') {
                securityQuestionText.textContent = '';
            }
        }
    }
    
    function resetForm() {
        securityAnswerInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        if (setQuestionSelect) setQuestionSelect.value = '';
        if (setAnswerInput) setAnswerInput.value = '';
        hideErrors();
        needsSecurityQuestion = false;
    }
    
    function hideErrors() {
        securityAnswerError.classList.add('hidden');
        passwordError.classList.add('hidden');
        if (setSecurityError) setSecurityError.classList.add('hidden');
    }
    
    function showSecurityError(message) {
        securityAnswerError.textContent = message;
        securityAnswerError.classList.remove('hidden');
        securityAnswerError.classList.remove('text-green-400');
        securityAnswerError.classList.add('text-red-400');
    }
    
    function showSecuritySuccess(message) {
        securityAnswerError.textContent = message;
        securityAnswerError.classList.remove('hidden');
        securityAnswerError.classList.remove('text-red-400');
        securityAnswerError.classList.add('text-green-400');
    }
    
    function showPasswordError(message) {
        passwordError.textContent = message;
        passwordError.classList.remove('hidden');
    }
    
    function showSetSecurityError(message) {
        if (setSecurityError) {
            setSecurityError.textContent = message;
            setSecurityError.classList.remove('hidden');
        }
    }
    
    async function loadSecurityQuestion() {
        try {
            console.log('🔐 Loading security question...');
            
            if (!window.userAPI) {
                console.error('❌ User API not loaded');
                needsSecurityQuestion = true;
                if (setSecurityStep) {
                    showStep('set-security');
                    showSetSecurityError('User API not loaded. Please refresh the page.');
                } else {
                    showSecurityError('User API not loaded. Please refresh the page.');
                }
                return;
            }
            
            console.log('Making API request to get security question...');
            const response = await window.userAPI.getUserSecurityQuestion();
            
            console.log('📥 API Response:', response);
            
            if (response && response.success && response.data && response.data.security_question) {
                userSecurityQuestion = response.data.security_question;
                console.log('Security question loaded:', userSecurityQuestion);
                securityQuestionText.textContent = userSecurityQuestion;
                needsSecurityQuestion = false;
            } else if (response && !response.success) {
                console.error('❌ API returned error:', response.error);
                needsSecurityQuestion = true;
                
                if (response.error && response.error.includes('No security question set')) {
                    if (setSecurityStep) {
                        showStep('set-security');
                        showSetSecurityError('You need to set a security question before changing your password.');
                    } else {
                        showSecurityError('You need to set a security question first. Please contact support.');
                    }
                } else {
                    if (setSecurityStep) {
                        showStep('set-security');
                        showSetSecurityError('Unable to load security question. Please set one now.');
                    } else {
                        showSecurityError('Failed to load security question: ' + (response.error || 'Unknown error'));
                    }
                }
            } else {
                console.error('❌ Unexpected response format:', response);
                needsSecurityQuestion = true;
                if (setSecurityStep) {
                    showStep('set-security');
                    showSetSecurityError('Unable to load security question. Please set one now.');
                } else {
                    showSecurityError('Unexpected response from server.');
                }
            }
        } catch (error) {
            console.error('💥 Error loading security question:', error);
            needsSecurityQuestion = true;
            
            if (setSecurityStep) {
                showStep('set-security');
                showSetSecurityError('Unable to load security question. Please set one now.');
            } else {
                showSecurityError('Failed to load security question: ' + error.message);
            }
        }
    }
    
    async function setSecurityQuestion() {
        if (!setQuestionSelect || !setAnswerInput) return;
        
        hideErrors();
        
        const question = setQuestionSelect.value.trim();
        const answer = setAnswerInput.value.trim();
        
        if (!question) {
            showSetSecurityError('Please select a security question');
            return;
        }
        
        if (!answer) {
            showSetSecurityError('Please enter your security answer');
            return;
        }
        
        if (answer.length < 3) {
            showSetSecurityError('Security answer must be at least 3 characters long');
            return;
        }
        
        try {
            setSecurityBtn.disabled = true;
            setSecurityBtn.classList.add('loading');
            setSecurityBtn.textContent = 'Setting...';
            
            const response = await fetch('/api/user/set-security-question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    security_question: question,
                    security_answer: answer
                }),
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                userSecurityQuestion = question;
                securityQuestionText.textContent = question;
                needsSecurityQuestion = false;
                showStep('security-question');
                showToast('Security question set successfully', 'success');
            } else {
                throw new Error(data.message || data.error || 'Failed to set security question');
            }
        } catch (error) {
            console.error('Error setting security question:', error);
            showSetSecurityError(error.message || 'Failed to set security question');
        } finally {
            setTimeout(() => {
                setSecurityBtn.disabled = false;
                setSecurityBtn.classList.remove('loading');
                setSecurityBtn.textContent = 'Set Security Question';
            }, 300);
        }
    }
    
    async function verifySecurityAnswer() {
        hideErrors();
        
        const answer = securityAnswerInput.value.trim();
        if (!answer) {
            showSecurityError('Please enter your security answer');
            return;
        }
        
        if (!window.userAPI) {
            showSecurityError('User API not loaded. Please refresh the page.');
            return;
        }
        
        try {
            verifyBtn.disabled = true;
            verifyBtn.classList.add('loading');
            verifyBtn.textContent = 'Verifying...';
            
            console.log('🔐 Verifying security answer...');
            const response = await window.userAPI.verifySecurityAnswerForPasswordChange(answer);
            console.log('🔐 Security verification response:', response);
            
            if (response && (response.success === true || (response.data !== undefined && response.message))) {
                showSecuritySuccess('✓ Security answer verified successfully');
                
                setTimeout(() => {
                    hideErrors();
                    showStep('new-password');
                }, 800);
            } else {
                const errorMsg = response?.error || response?.message || 'Incorrect security answer';
                console.error('Security verification failed:', errorMsg);
                showSecurityError(errorMsg);
            }
        } catch (error) {
            console.error('Error verifying security answer:', error);
            showSecurityError(error.message || 'An error occurred during verification');
        } finally {
            if (!securityAnswerError.classList.contains('text-green-400')) {
                setTimeout(() => {
                    verifyBtn.disabled = false;
                    verifyBtn.classList.remove('loading');
                    verifyBtn.textContent = 'Verify';
                }, 300);
            } else {
                setTimeout(() => {
                    verifyBtn.disabled = false;
                    verifyBtn.classList.remove('loading');
                    verifyBtn.textContent = 'Verify';
                }, 800);
            }
        }
    }
    
    function validatePassword(password) {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number';
        }
        return null;
    }
    
    async function changePassword() {
        hideErrors();
        
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        const passwordValidation = validatePassword(newPassword);
        if (passwordValidation) {
            showPasswordError(passwordValidation);
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showPasswordError('Passwords do not match');
            return;
        }
        
        if (!window.userAPI) {
            showPasswordError('User API not loaded. Please refresh the page.');
            return;
        }
        
        try {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('loading');
            confirmBtn.textContent = 'Changing...';
            
            console.log('🔑 Changing password...');
            const response = await window.userAPI.changePasswordWithSecurity(
                securityAnswerInput.value,
                newPassword,
                confirmPassword
            );
            console.log('🔑 Password change response:', response);
            
            if (response && (response.success === true || (response.data !== undefined && response.message))) {
                showToast('Password changed successfully', 'success');
                setTimeout(() => {
                    closeModal();
                }, 1000);
            } else {
                const errorMsg = response?.error?.message || response?.error || response?.message || 'Failed to change password';
                console.error('Password change failed:', errorMsg);
                
                if (errorMsg.includes('cannot be the same as your current password')) {
                    showPasswordError('❌ New password must be different from your current password');
                } else {
                    showPasswordError(errorMsg);
                }
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showPasswordError(error.message || 'An error occurred while changing password');
        } finally {
            setTimeout(() => {
                confirmBtn.disabled = false;
                confirmBtn.classList.remove('loading');
                confirmBtn.textContent = 'Change Password';
            }, 500);
        }
    }
    
    changePasswordBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    verifyBtn.addEventListener('click', verifySecurityAnswer);
    
    if (setSecurityBtn) {
        setSecurityBtn.addEventListener('click', setSecurityQuestion);
    }
    
    backBtn.addEventListener('click', () => {
        hideErrors();
        setTimeout(() => {
            if (needsSecurityQuestion && setSecurityStep) {
                showStep('set-security');
            } else {
                showStep('security-question');
            }
        }, 100);
    });
    
    confirmBtn.addEventListener('click', changePassword);
    
    securityAnswerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifySecurityAnswer();
        }
    });
    
    confirmPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            changePassword();
        }
    });
    
    if (setAnswerInput) {
        setAnswerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                setSecurityQuestion();
            }
        });
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
}

/**
 * Initialize two-factor authentication
 */


/**
 * Initialize password field masking for text fields with password-field class
 */
function initPasswordFieldMasking() {
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('password-field')) {
            setupPasswordField(e.target);
        }
    });
    
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
    
    document.querySelectorAll('.password-field').forEach(setupPasswordField);
}

/**
 * Setup individual password field masking
 */
function setupPasswordField(field) {
    if (field.dataset.maskingInitialized) return;
    field.dataset.maskingInitialized = 'true';
    
    const parent = field.parentElement;
    if (!parent.querySelector('.password-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle absolute right-2 top-1/2 transform -translate-y-1/2';
        toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>';
        
        if (getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
        
        parent.appendChild(toggleBtn);
        
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
        toast.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${getToastClass(type)} transition-all duration-300 transform translate-y-0 opacity-100`;
        toast.innerHTML = `
            <div class="flex items-center">
                ${getToastIcon(type)}
                <span class="ml-2 font-medium">${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.classList.add('animate-in');
        });
        
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

/**
 * Get toast notification background class based on type
 */
function getToastClass(type) {
    switch (type) {
        case 'success':
            return 'bg-green-600 text-white border-l-4 border-green-400';
        case 'error':
            return 'bg-red-600 text-white border-l-4 border-red-400';
        case 'warning':
            return 'bg-yellow-600 text-white border-l-4 border-yellow-400';
        default:
            return 'bg-blue-600 text-white border-l-4 border-blue-400';
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
            return '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 2a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>';
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function logoutUser() {
    const modalHtml = `
        <div id="logout-confirmation-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div class="bg-discord-darker rounded-lg p-6 w-full max-w-md transform transition-all">
                <div class="text-lg font-medium text-white mb-4">Log Out</div>
                <div class="text-discord-lighter mb-6">Are you sure you want to log out?</div>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-logout-btn" class="px-4 py-2 rounded-md bg-[#4e5058] hover:bg-[#6d6f78] text-white font-medium">Cancel</button>
                    <button id="confirm-logout-btn" class="px-4 py-2 rounded-md bg-[#ed4245] hover:bg-red-600 text-white font-medium">Log Out</button>
                </div>
            </div>
        </div>
    `;

    if (document.getElementById('logout-confirmation-modal')) {
        document.getElementById('logout-confirmation-modal').remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('logout-confirmation-modal');
    const cancelBtn = document.getElementById('cancel-logout-btn');
    const confirmBtn = document.getElementById('confirm-logout-btn');

    function closeModal() {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }

    function handleLogout() {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        const authKeys = [
            'authToken', 'rememberMe', 'userAuth', 'lastEmail', 
            'user_id', 'username', 'discriminator', 'avatar_url', 
            'banner_url', 'auth_data', 'session_id', 'login_state',
            'user_data', 'admin_access', 'login_history', 'user_settings',
            'user_status', 'fresh_login', 'csrf_token',
            'user_token', 'connect_socket_on_login', 'active_channel',
            'active_dm', 'active_server'
        ];

        authKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        if (window.globalSocketManager && typeof window.globalSocketManager.disconnect === 'function') {
            window.globalSocketManager.disconnect();
        }

        window.location.href = '/logout';
    }

    const handleModalClick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };

    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    };

    modal.addEventListener('click', handleModalClick);
    cancelBtn.addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', handleLogout);
    document.addEventListener('keydown', handleKeydown);

    requestAnimationFrame(() => {
        modal.classList.add('opacity-100');
    });
}

window.logoutUser = logoutUser;

function getStatusDisplayName(status) {
    const statusMap = {
        'appear': 'Online',
        'invisible': 'Invisible',
        'do_not_disturb': 'Do Not Disturb',
        'offline': 'Invisible'
    };
    return statusMap[status] || 'Online';
}

function initVoiceVideoSection() {
    import('/public/js/components/settings/mic-video-check.js')
        .then(module => {
            module.initVoiceVideoSettings();
            
            window.addEventListener('beforeunload', () => {
                module.destroyVoiceVideoSettings();
            });
        })
        .catch(err => {
            console.error('Error loading voice video settings:', err);
        });
}

function initBioHandling() {
    const bioTextarea = document.getElementById('bio');
    const bioCounter = document.getElementById('bio-counter');
    const approveBioBtn = document.getElementById('approve-bio');
    
    if (!bioTextarea || !bioCounter || !approveBioBtn) return;
    
    bioTextarea.dataset.originalValue = bioTextarea.value.trim();
    updateBioCounter();
    checkForBioChanges();
    
    setTimeout(() => {
        updateBioCounter();
    }, 100);
    
    bioTextarea.addEventListener('input', function() {
        updateBioCounter();
        checkForBioChanges();
    });
    
    bioTextarea.addEventListener('keyup', function() {
        checkForBioChanges();
    });
    
    bioTextarea.addEventListener('paste', function() {
        setTimeout(() => {
            updateBioCounter();
            checkForBioChanges();
        }, 10);
    });
    
    approveBioBtn.addEventListener('click', function() {
        const bio = bioTextarea.value.trim();
        updateBio(bio);
    });
    
    function updateBioCounter() {
        const currentLength = bioTextarea.value.length;
        bioCounter.textContent = `${currentLength}/1000`;
        
        if (currentLength > 900) {
            bioCounter.classList.add('text-red-400');
            bioCounter.classList.remove('text-discord-lighter');
        } else if (currentLength > 800) {
            bioCounter.classList.add('text-yellow-400');
            bioCounter.classList.remove('text-discord-lighter', 'text-red-400');
        } else {
            bioCounter.classList.add('text-discord-lighter');
            bioCounter.classList.remove('text-yellow-400', 'text-red-400');
        }
    }
    
    function checkForBioChanges() {
        const currentValue = bioTextarea.value.trim();
        const originalValue = (bioTextarea.dataset.originalValue || '').trim();
        
        if (currentValue !== originalValue) {
            approveBioBtn.style.display = 'flex';
            approveBioBtn.classList.remove('hidden');
            setTimeout(() => {
                approveBioBtn.classList.add('show');
            }, 10);
        } else {
            approveBioBtn.classList.remove('show');
            setTimeout(() => {
                approveBioBtn.style.display = 'none';
                approveBioBtn.classList.add('hidden');
            }, 300);
        }
    }
}

function updateBio(bio) {
    const approveBioBtn = document.getElementById('approve-bio');
    const bioTextarea = document.getElementById('bio');
    
    if (bio.length > 1000) {
        showToast('Bio must be no more than 1000 characters', 'error');
        return;
    }
    
    approveBioBtn.disabled = true;
    const originalIcon = approveBioBtn.innerHTML;
    approveBioBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    if (!window.userAPI) {
        showToast('User API not loaded. Please refresh the page.', 'error');
        approveBioBtn.disabled = false;
        approveBioBtn.innerHTML = originalIcon;
        return;
    }
    
    window.userAPI.updateBio(bio)
        .then(response => {
            if (response.success) {
                showToast('Bio updated successfully', 'success');
                
                if (bioTextarea) {
                    bioTextarea.dataset.originalValue = bio;
                    bioTextarea.value = bio;
                }
                
                const bioMeta = document.querySelector('meta[name="user-bio"]');
                if (bioMeta) {
                    bioMeta.content = bio;
                }
                
                const bioElements = document.querySelectorAll('.current-user-bio');
                bioElements.forEach(el => {
                    el.textContent = bio;
                });
                
                approveBioBtn.classList.remove('show');
                setTimeout(() => {
                    approveBioBtn.style.display = 'none';
                    approveBioBtn.classList.add('hidden');
                }, 300);
            } else {
                throw new Error(response.error || 'Failed to update bio');
            }
        })
        .catch(error => {
            console.error('Error updating bio:', error);
            showToast(error.message || 'Error updating bio', 'error');
        })
        .finally(() => {
            approveBioBtn.disabled = false;
            approveBioBtn.innerHTML = originalIcon;
        });
}

function initConnectionToggles() {
    // Import and use LocalStorageManager
    import('/public/js/utils/local-storage-manager.js')
        .then(module => {
            const LocalStorageManager = module.LocalStorageManager;
            const localStorageManager = module.default;
            
            // Get user preferences or set defaults
            const userPrefs = localStorageManager.getUserPreferences();
            const displayActivity = userPrefs.displayActivity !== undefined ? userPrefs.displayActivity : true;
            
            // Initialize toggle state from localStorage
            const activityToggle = document.getElementById('toggle-activity');
            
            if (activityToggle) {
                activityToggle.checked = displayActivity;
                activityToggle.addEventListener('change', function() {
                    const userPrefs = localStorageManager.getUserPreferences();
                    userPrefs.displayActivity = this.checked;
                    localStorageManager.setUserPreferences(userPrefs);
                    
                    showToast('Activity display preference saved', 'success');
                });
            }
            

        })
        .catch(err => {
            console.error('Error loading LocalStorageManager:', err);
        });
}

/**
 * Initialize profile form submission
 */
function initProfileFormSubmit() {
    const profileForm = document.getElementById('user-profile-form');
    const approveUsernameBtn = document.getElementById('approve-username');
    const approveDisplayNameBtn = document.getElementById('approve-display-name');
    const usernameInput = document.getElementById('username');
    const displayNameInput = document.getElementById('display_name');
    
    if (approveUsernameBtn) {
        approveUsernameBtn.style.display = 'flex';
        approveUsernameBtn.classList.remove('show');
        approveUsernameBtn.classList.add('hidden');
    }
    
    if (approveDisplayNameBtn) {
        approveDisplayNameBtn.style.display = 'flex';
        approveDisplayNameBtn.classList.remove('show');
        approveDisplayNameBtn.classList.add('hidden');
    }
    
    setTimeout(() => {
        if (usernameInput && approveUsernameBtn) {
            usernameInput.dataset.originalValue = usernameInput.value.trim();
            checkForChanges(usernameInput, approveUsernameBtn);
            
            usernameInput.addEventListener('input', function() {
                checkForChanges(this, approveUsernameBtn);
            });
            
            usernameInput.addEventListener('keyup', function() {
                checkForChanges(this, approveUsernameBtn);
            });
            
            usernameInput.addEventListener('paste', function() {
                setTimeout(() => checkForChanges(this, approveUsernameBtn), 10);
            });
        }
        
        if (displayNameInput && approveDisplayNameBtn) {
            displayNameInput.dataset.originalValue = displayNameInput.value.trim();
            checkForChanges(displayNameInput, approveDisplayNameBtn);
            
            displayNameInput.addEventListener('input', function() {
                checkForChanges(this, approveDisplayNameBtn);
            });
            
            displayNameInput.addEventListener('keyup', function() {
                checkForChanges(this, approveDisplayNameBtn);
            });
            
            displayNameInput.addEventListener('paste', function() {
                setTimeout(() => checkForChanges(this, approveDisplayNameBtn), 10);
            });
        }
    }, 100);
    
    if (approveUsernameBtn) {
        approveUsernameBtn.addEventListener('click', function() {
            if (!usernameInput) return;
            
            const username = usernameInput.value.trim();
            updateUsername(username);
        });
    }
    
    if (approveDisplayNameBtn) {
        approveDisplayNameBtn.addEventListener('click', function() {
            if (!displayNameInput) return;
            
            const displayName = displayNameInput.value.trim();
            updateDisplayName(displayName);
        });
    }
    
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
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
    
    if (currentValue !== originalValue && currentValue !== '') {
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
 * Update username
 */
function updateUsername(username) {
    const approveBtn = document.getElementById('approve-username');
    const usernameInput = document.getElementById('username');
    
    if (!username) {
        showToast('Username cannot be empty', 'error');
        return;
    }
    
    if (username.length < 3 || username.length > 32) {
        showToast('Username must be between 3 and 32 characters', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showToast('Username can only contain letters, numbers, and underscores', 'error');
        return;
    }
    
    approveBtn.disabled = true;
    const originalIcon = approveBtn.innerHTML;
    approveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    const profileData = {
        username: username
    };
    
    fetch('/api/users/profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(profileData),
        credentials: 'same-origin'
    })
    .then(async response => {
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error?.message || errorMessage;
            } catch (parseError) {
                console.warn('Could not parse error response as JSON:', parseError);
            }
            throw new Error(errorMessage);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }
        
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast('Username updated successfully', 'success');
            
            if (usernameInput) {
                usernameInput.dataset.originalValue = username;
                usernameInput.value = username;
            }
            
            const usernameMeta = document.querySelector('meta[name="username"]');
            if (usernameMeta) {
                usernameMeta.content = username;
            }
            
            const usernameElements = document.querySelectorAll('.current-user-username');
            usernameElements.forEach(el => {
                el.textContent = username;
            });
            
            approveBtn.classList.remove('show');
            setTimeout(() => {
                approveBtn.style.display = 'none';
                approveBtn.classList.add('hidden');
            }, 300);
        } else {
            throw new Error(data.message || data.error?.message || 'Failed to update username');
        }
    })
    .catch(error => {
        console.error('Error updating username:', error);
        showToast(error.message || 'Error updating username', 'error');
    })
    .finally(() => {
        approveBtn.disabled = false;
        approveBtn.innerHTML = originalIcon;
    });
}

/**
 * Update display name
 */
function updateDisplayName(displayName) {
    const approveBtn = document.getElementById('approve-display-name');
    const displayNameInput = document.getElementById('display_name');
    
    if (!displayName) {
        showToast('Display name cannot be empty', 'error');
        return;
    }
    
    approveBtn.disabled = true;
    const originalIcon = approveBtn.innerHTML;
    approveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    const profileData = {
        display_name: displayName
    };
    
    fetch('/api/users/profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(profileData),
        credentials: 'same-origin'
    })
    .then(async response => {
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error?.message || errorMessage;
            } catch (parseError) {
                console.warn('Could not parse error response as JSON:', parseError);
            }
            throw new Error(errorMessage);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }
        
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast('Display name updated successfully', 'success');
            
            if (displayNameInput) {
                displayNameInput.dataset.originalValue = displayName;
                displayNameInput.value = displayName;
            }
            
            const displayNameMeta = document.querySelector('meta[name="display-name"]');
            if (displayNameMeta) {
                displayNameMeta.content = displayName;
            }
            
            const displayNameElements = document.querySelectorAll('.current-user-display-name');
            displayNameElements.forEach(el => {
                el.textContent = displayName;
            });
            
            approveBtn.classList.remove('show');
            setTimeout(() => {
                approveBtn.style.display = 'none';
                approveBtn.classList.add('hidden');
            }, 300);
        } else {
            throw new Error(data.message || data.error?.message || 'Failed to update display name');
        }
    })
    .catch(error => {
        console.error('Error updating display name:', error);
        showToast(error.message || 'Error updating display name', 'error');
    })
    .finally(() => {
        approveBtn.disabled = false;
        approveBtn.innerHTML = originalIcon;
    });
}

/**
 * Update profile
 */

function showImageRemovalConfirmation(type, onConfirm) {
    const typeText = type === 'avatar' ? 'profile picture' : 'profile banner';
    const modalHtml = `
        <div id="image-removal-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div class="bg-discord-darker rounded-lg p-6 w-full max-w-md transform transition-all">
                <div class="text-lg font-medium text-white mb-4">Remove ${typeText}</div>
                <div class="text-discord-lighter mb-6">Are you sure you want to remove your ${typeText}?</div>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-removal-btn" class="px-4 py-2 rounded-md bg-[#4e5058] hover:bg-[#6d6f78] text-white font-medium">Cancel</button>
                    <button id="confirm-removal-btn" class="px-4 py-2 rounded-md bg-[#ed4245] hover:bg-red-600 text-white font-medium">Remove</button>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('image-removal-modal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('image-removal-modal');
    const cancelBtn = document.getElementById('cancel-removal-btn');
    const confirmBtn = document.getElementById('confirm-removal-btn');

    function closeModal() {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }

    function handleConfirm() {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        onConfirm();
        closeModal();
    }

    const handleModalClick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };

    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    };

    modal.addEventListener('click', handleModalClick);
    cancelBtn.addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', handleConfirm);
    document.addEventListener('keydown', handleKeydown);

    requestAnimationFrame(() => {
        modal.classList.add('opacity-100');
    });
}

function removeUserImage(type) {
    const endpoint = type === 'avatar' ? '/user/avatar/remove' : '/user/banner/remove';
    const successMessage = type === 'avatar' ? 'Profile picture removed successfully' : 'Profile banner removed successfully';
    
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
    })
    .then(async response => {
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error?.message || errorMessage;
            } catch (parseError) {
                console.warn('Could not parse error response as JSON:', parseError);
            }
            throw new Error(errorMessage);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }
        
        return response.json();
    })
    .then(data => {
        if (data.success) {
            if (type === 'avatar') {
                const iconPreview = document.getElementById('user-avatar-preview');
                const iconContainer = document.getElementById('user-avatar-container');
                const removeIconBtn = document.getElementById('remove-avatar-btn');
                const iconInput = document.getElementById('avatar-input');
                
                if (iconPreview) {
                    iconPreview.src = '/public/assets/common/default-profile-picture.png';
                }
                
                if (iconContainer) {
                    delete iconContainer.dataset.croppedImage;
                }
                
                if (removeIconBtn) {
                    removeIconBtn.classList.add('hidden');
                }
                
                if (iconInput) {
                    iconInput.value = '';
                }
                
                updateAllAvatars('/public/assets/common/default-profile-picture.png');
            } else {
                const bannerPreview = document.getElementById('user-banner-preview');
                const bannerContainer = document.getElementById('user-banner-container');
                const removeBannerBtn = document.getElementById('remove-banner-btn');
                const bannerInput = document.getElementById('user-banner-input');
                
                if (bannerPreview) {
                    bannerPreview.classList.add('hidden');
                }
                
                const placeholder = document.getElementById('user-banner-placeholder');
                if (placeholder) placeholder.classList.remove('hidden');
                
                if (bannerContainer) {
                    delete bannerContainer.dataset.croppedImage;
                }
                
                if (removeBannerBtn) {
                    removeBannerBtn.classList.add('hidden');
                }
                
                if (bannerInput) {
                    bannerInput.value = '';
                }
                
                updateAllBanners(null);
            }
            
            showToast(successMessage, 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            throw new Error(data.message || data.error?.message || `Failed to remove ${type}`);
        }
    })
    .catch(error => {
        console.error(`Error removing ${type}:`, error);
        showToast(error.message || `Error removing ${type}`, 'error');
    });
}


