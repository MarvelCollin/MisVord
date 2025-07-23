import ImageCutter from '../common/image-cutter.js';

let settingsInitialized = false;

document.addEventListener('DOMContentLoaded', function() {
    if (settingsInitialized) {
        return;
    }
    settingsInitialized = true;
    
    initUserSettingsPage();
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.removeAttribute('onclick');
        if (!logoutBtn.dataset.listenerAttached) {
            logoutBtn.dataset.listenerAttached = 'true';
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                logoutUser();
            });
        }
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
    } else if (activeSection === 'voice') {
        initVoiceVideoSection();
    }
    
    initCloseButton();
    initPasswordFieldMasking();
    initDeleteAccount();
}


function initSidebarNavigation(activeSection) {
    const sidebarItems = document.querySelectorAll('a.sidebar-item');
    const mobileSelector = document.getElementById('mobile-section-selector');
    
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
    
    if (mobileSelector) {
        mobileSelector.addEventListener('change', function() {
            const selectedSection = this.value;
            if (selectedSection) {
                const url = new URL(window.location);
                url.searchParams.set('section', selectedSection);
                window.location.href = url.toString();
            }
        });
    }
}


function initUserAvatarUpload() {
    const iconContainer = document.getElementById('user-avatar-container');
    const iconInput = document.getElementById('avatar-input');
    const iconPreview = document.getElementById('user-avatar-preview');
    const removeIconBtn = document.getElementById('remove-avatar-btn');
    
    if (!iconContainer || !iconInput) return;
    
    if (iconInput.dataset.listenerAttached) {
        return;
    }
    iconInput.dataset.listenerAttached = 'true';
    
    try {
        const avatarCutter = new ImageCutter({
            container: iconContainer,
            type: 'profile',
            modalTitle: 'Upload Profile Picture',
            aspectRatio: 1,
            fileInputSelector: '#avatar-input',
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
    
    if (removeIconBtn && !removeIconBtn.dataset.listenerAttached) {
        removeIconBtn.dataset.listenerAttached = 'true';
        removeIconBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            showImageRemovalConfirmation('avatar', () => {
                removeUserImage('avatar');
            });
        });
    }
}


function initUserBannerUpload() {
    const bannerContainer = document.getElementById('user-banner-container');
    const bannerInput = document.getElementById('user-banner-input');
    const bannerPreview = document.getElementById('user-banner-preview');
    const removeBannerBtn = document.getElementById('remove-banner-btn');
    
    if (!bannerContainer || !bannerInput) return;
    
    if (bannerInput.dataset.listenerAttached) {
        return;
    }
    bannerInput.dataset.listenerAttached = 'true';
    
    try {
        const bannerCutter = new ImageCutter({
            container: bannerContainer,
            type: 'banner',
            modalTitle: 'Upload Profile Banner',
            aspectRatio: 4/1,
            fileInputSelector: '#user-banner-input',
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
    
    if (removeBannerBtn && !removeBannerBtn.dataset.listenerAttached) {
        removeBannerBtn.dataset.listenerAttached = 'true';
        removeBannerBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            showImageRemovalConfirmation('banner', () => {
                removeUserImage('banner');
            });
        });
    }
}


function uploadAvatar(dataUrl) {
    const blob = dataURLtoBlob(dataUrl);
    
    const formData = new FormData();
    formData.append('avatar', blob, 'avatar.png');
    
    showToast('Uploading profile picture...', 'info');
    
    fetch('/user/avatar/update', {
        method: 'POST',
        body: formData,
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


function uploadBanner(dataUrl) {
    const blob = dataURLtoBlob(dataUrl);
    
    const formData = new FormData();
    formData.append('banner', blob, 'banner.png');
    
    showToast('Uploading profile banner...', 'info');
    
    fetch('/user/banner/update', {
        method: 'POST',
        body: formData,
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


function updateUserStatus(status) {
    fetch('/user/status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
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
    
    modal.classList.add('hidden');
    modal.style.display = 'none';
    
    function openModal() {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        showStep('security-question');
        resetForm();
        loadSecurityQuestion();
    }
    
    function closeModal() {
        modal.classList.add('hidden');
        modal.style.display = 'none';
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
            

            const response = await window.userAPI.getUserSecurityQuestion();
            

            
            if (response && response.success && response.data && response.data.security_question) {
                userSecurityQuestion = response.data.security_question;

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
                    'Content-Type': 'application/json'
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
            

            const response = await window.userAPI.verifySecurityAnswerForPasswordChange(answer);

            
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
            

            const response = await window.userAPI.changePasswordWithSecurity(
                securityAnswerInput.value,
                newPassword,
                confirmPassword
            );

            
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
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}





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


function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
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
    const voiceTabs = document.querySelectorAll('.voice-tab');
    const voiceContent = document.getElementById('voice-content');
    const videoContent = document.getElementById('video-content');
    
    voiceTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            voiceTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            if (targetTab === 'voice') {
                voiceContent.classList.remove('hidden');
                videoContent.classList.add('hidden');
            } else {
                voiceContent.classList.add('hidden');
                videoContent.classList.remove('hidden');
            }
        });
    });
    
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
    
    if (approveUsernameBtn && !approveUsernameBtn.dataset.listenerAttached) {
        approveUsernameBtn.dataset.listenerAttached = 'true';
        approveUsernameBtn.addEventListener('click', function() {
            if (!usernameInput) return;
            
            const username = usernameInput.value.trim();
            updateUsername(username);
        });
    }
    
    if (approveDisplayNameBtn && !approveDisplayNameBtn.dataset.listenerAttached) {
        approveDisplayNameBtn.dataset.listenerAttached = 'true';
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
            'Content-Type': 'application/json'
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
            'Content-Type': 'application/json'
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
            'Content-Type': 'application/json'
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

function initDeleteAccount() {
    let selectedOwners = {};

    const deleteBtn = document.getElementById('delete-account-btn');
    const modal = document.getElementById('delete-account-modal');
    const closeBtn = document.getElementById('close-delete-modal');
    const cancelBtn = document.getElementById('cancel-delete-account');
    const confirmBtn = document.getElementById('confirm-delete-account');
    const usernameInput = document.getElementById('username-confirmation-input');
    const errorDiv = document.getElementById('delete-account-error');
    
    if (!deleteBtn || !modal) return;
    
    const username = document.querySelector('meta[name="username"]')?.getAttribute('content') || '';
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function openModal() {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        usernameInput.value = '';
        confirmBtn.disabled = true;
        confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
        hideError();
        usernameInput.focus();
        

        fetchOwnedServers();
    }
    
    function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        usernameInput.value = '';
    }
    
    function hideError() {
        errorDiv.classList.add('hidden');
        errorDiv.textContent = '';
    }
    
    function showError(message) {
        if (typeof message !== 'string') {
            message = String(message);
        }
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
    
    function validateUsername() {
        const inputValue = usernameInput.value.trim();
        const isValid = inputValue === username;
        
        if (isValid) {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        return isValid;
    }
    

    async function fetchOwnedServers() {
        try {
            const serverSection = document.getElementById('owned-servers-section');
            if (!serverSection) return;
            
            serverSection.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-discord-blurple"></i> Loading your servers...</div>';
            
            
            
            const response = await fetch('/api/users/owned-servers');
            const data = await response.json();
            
            
            
            if (data.success && data.data && data.data.servers) {
                const servers = data.data.servers;
                
                
                if (servers.length === 0) {
                    serverSection.innerHTML = '<div class="text-center py-4 text-discord-lighter">You do not own any servers.</div>';
                    return;
                }

                serverSection.innerHTML = `
                    <div class="mb-3">
                        <h3 class="text-yellow-400 font-semibold text-lg mb-3">Server Ownership Management</h3>
                        <p class="text-discord-lighter mb-5">Review your servers before deleting your account:</p>
                        <div id="owned-servers-list"></div>
                    </div>
                `;
                
                const serversList = document.getElementById('owned-servers-list');
                servers.forEach(server => {
                    const escapedServerName = escapeHtml(server.name);
                    const serverFirstChar = escapeHtml(server.name.charAt(0));
                    
                    const serverElement = document.createElement('div');
                    serverElement.className = 'p-4 bg-discord-bg-secondary rounded-md border border-gray-700 h-full';
                    serverElement.setAttribute('data-server-id', server.id);
                    
                    if (server.can_be_deleted) {
                        
                        serverElement.innerHTML = `
                            <div class="flex items-center mb-3">
                                <div class="w-12 h-12 rounded-full bg-discord-bg-tertiary overflow-hidden flex-shrink-0 mr-3">
                                    ${server.icon_url ? 
                                        `<img src="${escapeHtml(server.icon_url)}" alt="${escapedServerName}" class="w-full h-full object-cover">` : 
                                        `<div class="w-full h-full flex items-center justify-center bg-discord-blurple text-white font-bold text-xl">${serverFirstChar}</div>`
                                    }
                                </div>
                                <div>
                                    <div class="font-medium text-white text-lg">${escapedServerName}</div>
                                    <div class="text-sm text-discord-interactive-normal">${server.member_count || 0} member${server.member_count !== 1 ? 's' : ''}</div>
                                </div>
                            </div>
                            <div class="server-delete-section bg-green-900/20 p-4 rounded-md border border-green-500/30">
                                <div class="flex items-center text-green-400 text-sm">
                                    <i class="fas fa-info-circle mr-2"></i>
                                    <span>This server will be automatically deleted</span>
                                </div>
                            </div>
                        `;
                        serverElement.classList.add('server-can-delete');
                    } else {
                        
                        serverElement.innerHTML = `
                            <div class="flex items-center mb-3">
                                <div class="w-12 h-12 rounded-full bg-discord-bg-tertiary overflow-hidden flex-shrink-0 mr-3">
                                    ${server.icon_url ? 
                                        `<img src="${escapeHtml(server.icon_url)}" alt="${escapedServerName}" class="w-full h-full object-cover">` : 
                                        `<div class="w-full h-full flex items-center justify-center bg-discord-blurple text-white font-bold text-xl">${serverFirstChar}</div>`
                                    }
                                </div>
                                <div>
                                    <div class="font-medium text-white text-lg">${escapedServerName}</div>
                                    <div class="text-sm text-discord-interactive-normal">${server.member_count || 0} member${server.member_count !== 1 ? 's' : ''}</div>
                                </div>
                            </div>
                            <div class="server-transfer-section bg-discord-bg-tertiary p-4 rounded-md">
                                <div class="text-sm text-white font-medium mb-3">Transfer ownership to ${server.member_count === 2 ? 'the only other member' : 'a member'}:</div>
                                ${server.member_count === 2 ? '<div class="text-xs text-yellow-400 mb-2"><i class="fas fa-info-circle mr-1"></i>This server has only 1 other member - they will be automatically selected</div>' : ''}
                                <div class="relative">
                                    <div class="flex items-center space-x-2 mb-2">
                                        <input type="text" class="member-search-input w-full bg-discord-bg-secondary border border-gray-600 rounded-md px-3 py-2 text-sm text-white" placeholder="${server.member_count === 2 ? 'Click search to auto-select the only member' : 'Search by name or role...'}">>
                                        <button class="fetch-members-btn bg-discord-blurple hover:bg-discord-blurple-dark text-white text-xs px-3 py-2 rounded">
                                            <i class="fas fa-search"></i>
                                        </button>
                                    </div>
                                    <div class="members-dropdown hidden absolute w-full mt-1 z-10 rounded-md overflow-hidden bg-discord-bg-secondary border border-gray-600 max-h-60 overflow-y-auto"></div>
                                </div>
                                <div class="selected-member mt-3 hidden">
                                    <div class="flex items-center justify-between p-3 rounded-md bg-discord-bg-secondary border border-gray-600">
                                        <div class="flex items-center">
                                            <div class="w-8 h-8 rounded-full bg-discord-bg-tertiary overflow-hidden flex-shrink-0 mr-3 selected-member-avatar"></div>
                                            <div class="selected-member-name"></div>
                                        </div>
                                    </div>
                                    <div class="transfer-error text-red-400 text-xs mt-2 hidden"></div>
                                </div>
                                <div class="transfer-success hidden mt-3 text-green-400 text-sm bg-green-900/20 p-2 rounded-md border border-green-500/30">
                                    <i class="fas fa-check-circle mr-1"></i> Ownership transferred successfully
                                </div>
                            </div>
                        `;
                        initServerTransferControls(serverElement, server.id);
                    }
                    
                    serversList.appendChild(serverElement);
                });
            } else {
                serverSection.innerHTML = '<div class="text-center py-4 text-red-400">Failed to load your servers.</div>';
            }
        } catch (error) {
            console.error('Error fetching owned servers:', error);
            const serverSection = document.getElementById('owned-servers-section');
            if (serverSection) {
                serverSection.innerHTML = '<div class="text-center py-4 text-red-400">Error loading servers. Please try again.</div>';
            }
        }
    }
    

    function initServerTransferControls(serverElement, serverId) {
        const searchInput = serverElement.querySelector('.member-search-input');
        const fetchBtn = serverElement.querySelector('.fetch-members-btn');
        const dropdown = serverElement.querySelector('.members-dropdown');
        const selectedMember = serverElement.querySelector('.selected-member');
        const transferError = serverElement.querySelector('.transfer-error');
        const transferSuccess = serverElement.querySelector('.transfer-success');
        

        serverElement.dataset.members = JSON.stringify([]);
        serverElement.dataset.selectedMemberId = '';
        

        fetchBtn.addEventListener('click', () => {
            loadServerMembers(serverId, serverElement);
        });
        

        searchInput.addEventListener('input', debounce(() => {
            const members = JSON.parse(serverElement.dataset.members || '[]');
            if (members.length === 0) {
                loadServerMembers(serverId, serverElement);
                return;
            }
            
            filterMembers(serverElement);
        }, 300));
        

        searchInput.addEventListener('focus', () => {
            const members = JSON.parse(serverElement.dataset.members || '[]');
            if (members.length === 0) {
                loadServerMembers(serverId, serverElement);
            } else {
                filterMembers(serverElement);
                dropdown.classList.remove('hidden');
            }
        });
        

        document.addEventListener('click', (e) => {
            if (!serverElement.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }
    

    function loadServerMembers(serverId, serverElement) {
        const dropdown = serverElement.querySelector('.members-dropdown');
        const fetchBtn = serverElement.querySelector('.fetch-members-btn');
        const transferError = serverElement.querySelector('.transfer-error');
        
        transferError.classList.add('hidden');
        fetchBtn.disabled = true;
        fetchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        dropdown.innerHTML = '<div class="text-center py-3 bg-discord-bg-secondary text-sm text-discord-interactive-normal"><i class="fas fa-spinner fa-spin mr-2"></i>Loading members...</div>';
        dropdown.classList.remove('hidden');
        

        window.serverAPI.getEligibleNewOwners(serverId)
            .then(response => {
                fetchBtn.disabled = false;
                fetchBtn.innerHTML = '<i class="fas fa-search"></i>';
                
                if (!response.success || !response.data || !response.data.users) {
                    dropdown.innerHTML = '<div class="text-center py-3 bg-discord-bg-secondary text-sm text-red-400">Failed to load members</div>';
                    return;
                }
                
                const members = response.data.users;
                
                if (members.length === 0) {
                    dropdown.innerHTML = '<div class="text-center py-3 bg-discord-bg-secondary text-sm text-discord-interactive-normal">No eligible members found</div>';
                    return;
                }
                
                serverElement.dataset.members = JSON.stringify(members);
                
                if (members.length === 1) {
                    
                    selectMember(serverElement, members[0]);
                    dropdown.innerHTML = '<div class="text-center py-3 bg-discord-bg-secondary text-sm text-green-400">Only one eligible member - automatically selected</div>';
                } else {
                    renderMembersList(serverElement, members);
                }
            })
            .catch(error => {
                console.error('Error loading members:', error);
                fetchBtn.disabled = false;
                fetchBtn.innerHTML = '<i class="fas fa-search"></i>';
                dropdown.innerHTML = '<div class="text-center py-3 bg-discord-bg-secondary text-sm text-red-400">Error loading members</div>';
            });
    }
    

    function renderMembersList(serverElement, members) {
        const dropdown = serverElement.querySelector('.members-dropdown');
        dropdown.innerHTML = '';
        
        if (members.length === 0) {
            dropdown.innerHTML = '<div class="text-center py-3 text-sm text-discord-interactive-normal">No matching members found</div>';
            return;
        }
        
        const sortedMembers = members.sort((a, b) => {
            const priorityA = getRolePriority(a.role);
            const priorityB = getRolePriority(b.role);
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            return (a.display_name || a.username).localeCompare(b.display_name || b.username);
        });
        
        sortedMembers.forEach(member => {
            const memberElement = document.createElement('div');
            memberElement.className = 'flex items-center justify-between hover:bg-discord-bg-modifier-hover cursor-pointer p-2';
            
            const roleColor = getRoleColor(member.role);
            const roleDisplayName = getRoleDisplayName(member.role);
            const escapedUsername = escapeHtml(member.username);
            const escapedDisplayName = escapeHtml(member.display_name || member.username);
            const usernameFirstChar = escapeHtml(member.username.charAt(0));
            
            memberElement.innerHTML = `
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full bg-discord-bg-tertiary overflow-hidden flex-shrink-0 mr-3">
                        ${member.avatar_url ? 
                            `<img src="${escapeHtml(member.avatar_url)}" alt="${escapedUsername}" class="w-full h-full object-cover">` : 
                            `<div class="w-full h-full flex items-center justify-center bg-discord-interactive-muted text-white text-xs font-bold">${usernameFirstChar}</div>`
                        }
                    </div>
                    <div>
                        <div class="text-sm font-medium text-white">${escapedDisplayName}</div>
                        <div class="text-xs text-discord-interactive-normal">${escapedUsername}</div>
                    </div>
                </div>
                <div class="flex items-center">
                    <span class="text-xs px-2 py-1 rounded ${roleColor}">${escapeHtml(roleDisplayName)}</span>
                </div>
            `;
            
            memberElement.addEventListener('click', () => {
                selectMember(serverElement, member);
            });
            
            dropdown.appendChild(memberElement);
        });
    }
    

    function filterMembers(serverElement) {
        const searchInput = serverElement.querySelector('.member-search-input');
        const dropdown = serverElement.querySelector('.members-dropdown');
        const searchTerm = searchInput.value.toLowerCase();
        const members = JSON.parse(serverElement.dataset.members || '[]');
        
        const filteredMembers = members.filter(member => {
            const username = member.username.toLowerCase();
            const displayName = (member.display_name || '').toLowerCase();
            const role = (member.role || '').toLowerCase();
            const roleDisplayName = getRoleDisplayName(member.role).toLowerCase();
            return username.includes(searchTerm) || displayName.includes(searchTerm) || role.includes(searchTerm) || roleDisplayName.includes(searchTerm);
        });
        
        renderMembersList(serverElement, filteredMembers);
        
        dropdown.classList.remove('hidden');
        
        const rect = searchInput.getBoundingClientRect();
        const isMobile = window.innerWidth <= 640;
        
        if (isMobile) {
            dropdown.style.width = '100%';
        } else {
            dropdown.style.width = `${searchInput.offsetWidth}px`;
        }
    }
    

    function selectMember(serverElement, member) {
        const dropdown = serverElement.querySelector('.members-dropdown');
        const searchInput = serverElement.querySelector('.member-search-input');
        const selectedMember = serverElement.querySelector('.selected-member');
        const selectedMemberAvatar = serverElement.querySelector('.selected-member-avatar');
        const selectedMemberName = serverElement.querySelector('.selected-member-name');
        const transferError = serverElement.querySelector('.transfer-error');
        const transferSuccess = serverElement.querySelector('.transfer-success');
        
        const roleColor = getRoleColor(member.role);
        const roleDisplayName = getRoleDisplayName(member.role);
        const escapedUsername = escapeHtml(member.username);
        const escapedDisplayName = escapeHtml(member.display_name || member.username);
        const usernameFirstChar = escapeHtml(member.username.charAt(0));
        
        selectedMemberName.innerHTML = `
            <div class="text-sm font-medium text-white">${escapedDisplayName}</div>
            <div class="text-xs text-discord-interactive-normal flex items-center gap-2">
                <span>${escapedUsername}</span>
                <span class="text-xs px-2 py-0.5 rounded ${roleColor}">${escapeHtml(roleDisplayName)}</span>
            </div>
        `;
        
        if (member.avatar_url) {
            selectedMemberAvatar.innerHTML = `<img src="${escapeHtml(member.avatar_url)}" alt="${escapedUsername}" class="w-full h-full object-cover">`;
        } else {
            selectedMemberAvatar.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-discord-interactive-muted text-white text-xs font-bold">${usernameFirstChar}</div>`;
        }
        
        const serverId = serverElement.getAttribute('data-server-id');
        selectedOwners[serverId] = member.id.toString();
        
        dropdown.classList.add('hidden');
        searchInput.value = member.display_name || member.username;
        selectedMember.classList.remove('hidden');
        transferSuccess.classList.remove('hidden');
        transferError.classList.add('hidden');
        
        serverElement.classList.add('server-owner-selected');
        serverElement.querySelector('.server-transfer-section').classList.add('completed');
        checkAllServersReady();
    }
    
    function checkAllServersReady() {
        const serverElements = document.querySelectorAll('#owned-servers-list > div');
        let allReady = true;
        
        serverElements.forEach(server => {
            const serverId = server.getAttribute('data-server-id');
            const canDelete = server.classList.contains('server-can-delete');
            const hasSelectedOwner = selectedOwners[serverId];
            
            if (!canDelete && !hasSelectedOwner) {
                allReady = false;
            }
        });
        
        const confirmBtn = document.getElementById('confirm-delete-account');
        const usernameInput = document.getElementById('username-confirmation-input');
        if (confirmBtn && allReady && usernameInput.value.trim() === document.querySelector('meta[name="username"]').getAttribute('content')) {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
    
    deleteBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    async function deleteAccount() {
        const inputValue = usernameInput.value.trim();
        if (!validateUsername()) {
            showError('Username does not match');
            return;
        }
        
        const ownedServersSection = document.getElementById('owned-servers-section');
        if (!ownedServersSection || ownedServersSection.innerHTML.includes('Loading your servers...')) {
            
            showError('Server data is still loading. Please wait and try again.');
            return;
        }
        
        const serverElements = document.querySelectorAll('#owned-servers-list > div');
        const serversRequiringTransfer = [];
        
        serverElements.forEach(serverElement => {
            const serverId = serverElement.getAttribute('data-server-id');
            const canDelete = serverElement.classList.contains('server-can-delete');
            const hasSelectedOwner = selectedOwners[serverId];
            
            if (!canDelete && !hasSelectedOwner) {
                serversRequiringTransfer.push(serverElement);
            }
        });
        
        if (serversRequiringTransfer.length > 0) {
            showError('Please select new owners for all servers that require transfer');
            return;
        }
        
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Deleting...';
        
        try {
            console.log('Sending delete account request with:', {
                username: inputValue,
                ownershipTransfers: selectedOwners
            });
            
            const result = await window.userAPI.deleteAccount(inputValue, selectedOwners);
            
            if (result.success) {
                showToast('Account deleted successfully. Redirecting...', 'success');
                window.location.href = '/';
            } else {
                console.error('Delete account failed:', result);
                
                showError(result.error || 'Failed to delete account');
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-trash-alt mr-2"></i>Delete Account';
            }
        } catch (error) {
            showError('An error occurred while deleting account');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-trash-alt mr-2"></i>Delete Account';
        }
    }
    confirmBtn.addEventListener('click', deleteAccount);
    
    usernameInput.addEventListener('input', () => {
        hideError();
        validateUsername();
    });
    
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !confirmBtn.disabled) {
            deleteAccount();
        }
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

function getRoleColor(role) {
    switch(role) {
        case 'owner':
            return 'bg-yellow-600 text-yellow-100';
        case 'admin':
            return 'bg-red-600 text-red-100';
        case 'moderator':
            return 'bg-blue-600 text-blue-100';
        case 'member':
        default:
            return 'bg-gray-600 text-gray-100';
    }
}

function getRoleDisplayName(role) {
    switch(role) {
        case 'owner':
            return 'Owner';
        case 'admin':
            return 'Admin';
        case 'moderator':
            return 'Moderator';
        case 'member':
        default:
            return 'Member';
    }
}

function getRolePriority(role) {
    switch(role) {
        case 'owner':
            return 1;
        case 'admin':
            return 2;
        case 'moderator':
            return 3;
        case 'member':
        default:
            return 4;
    }
}


