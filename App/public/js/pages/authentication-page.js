import FormValidator from '../components/common/validation.js';
import { TextCaptcha } from '../components/common/captcha.js';

function initAuth() {
    if (window.authPageInitialized) {
        return;
    }
    window.authPageInitialized = true;

    const hasServerError = document.querySelector('#form-error-message') || 
                          document.querySelector('.bg-red-500') ||
                          document.querySelector('.text-red-500');
    
    if (!hasServerError) {
        clearStoredAuthData();
    }

    const elements = {
        logo: document.getElementById('logo'),
        logoUnderline: document.getElementById('logoUnderline'),
        authContainer: document.getElementById('authContainer'),
        formsContainer: document.getElementById('formsContainer'),
        authTitle: document.getElementById('authTitle'),
        loginForm: document.getElementById('loginForm'),
        registerForm: document.getElementById('registerForm'),
        forgotForm: document.getElementById('forgotForm'),
        securityQuestionForm: document.getElementById('securityQuestionForm'),
        resetPasswordForm: document.getElementById('resetPasswordForm'),
        passwordFields: document.querySelectorAll('.password-toggle'),
        regPassword: document.getElementById('reg_password'),
        confirmPassword: document.getElementById('password_confirm'),
        strengthBar: document.getElementById('passwordStrength'),
        strengthFill: document.getElementById('passwordStrength') ? document.getElementById('passwordStrength').querySelector('div') : null,
        matchIndicator: document.getElementById('passwordsMatch'),
        formToggles: document.querySelectorAll('.form-toggle')
    };

    let currentForm = getCurrentVisibleForm();
    
    const timing = {
        formTransition: 300,
        logoAnimation: 500,
        titleTransition: 300,
        formScaleEffect: 150
    };

    function getCurrentVisibleForm() {
        if (elements.loginForm && !elements.loginForm.classList.contains('hidden')) {
            return 'login';
        } else if (elements.registerForm && !elements.registerForm.classList.contains('hidden')) {
            return 'register';
        } else if (elements.forgotForm && !elements.forgotForm.classList.contains('hidden')) {
            return 'forgot';
        } else if (elements.securityQuestionForm && !elements.securityQuestionForm.classList.contains('hidden')) {
            return 'security';
        } else if (elements.resetPasswordForm && !elements.resetPasswordForm.classList.contains('hidden')) {
            return 'reset-password';
        }
        return 'login';
    }

    function hideAllForms() {
        if (elements.loginForm) elements.loginForm.classList.add('hidden');
        if (elements.registerForm) elements.registerForm.classList.add('hidden');
        if (elements.forgotForm) elements.forgotForm.classList.add('hidden');
        if (elements.securityQuestionForm) elements.securityQuestionForm.classList.add('hidden');
        if (elements.resetPasswordForm) elements.resetPasswordForm.classList.add('hidden');
    }
    
    function showForm(formName) {
        if (formName === 'login' && elements.loginForm) {
            elements.loginForm.classList.remove('hidden');
        } else if (formName === 'register' && elements.registerForm) {
            elements.registerForm.classList.remove('hidden');
        } else if (formName === 'forgot' && elements.forgotForm) {
            elements.forgotForm.classList.remove('hidden');
        } else if (formName === 'security' && elements.securityQuestionForm) {
            elements.securityQuestionForm.classList.remove('hidden');
        } else if (formName === 'reset-password' && elements.resetPasswordForm) {
            elements.resetPasswordForm.classList.remove('hidden');
        }
    }

    function initAnimations() {
        setTimeout(() => {
            if (elements.logo) elements.logo.classList.add('visible');

            setTimeout(() => {
                if (elements.logoUnderline) elements.logoUnderline.classList.add('visible');
            }, 200);
        }, timing.logoAnimation / 2);

        updateFormHeight();
        addButtonRippleEffect();
        enhanceInputFocus();
        createMinimalistBackground();

        if (elements.authContainer) {
        elements.authContainer.classList.remove('gradient-border');
        }
    }

    function createMinimalistBackground() {
        const existingBg = document.querySelector('.animated-bg');
        if (existingBg) existingBg.remove();

        const minimalistBg = document.createElement('div');
        minimalistBg.className = 'minimalist-bg';

        const shapes = [
            { class: 'shape shape-1' },
            { class: 'shape shape-2' },
            { class: 'shape shape-3' },
            { class: 'shape shape-4' },
            { class: 'shape-line shape-line-1' },
            { class: 'shape-line shape-line-2' },
            { class: 'shape-line shape-line-3' }
        ];

        shapes.forEach(shape => {
            const element = document.createElement('div');
            element.className = shape.class;
            minimalistBg.appendChild(element);
        });

        for (let i = 0; i < 40; i++) {
            createBlinkDot(minimalistBg);
        }

        document.querySelector('.authentication-page').prepend(minimalistBg);
    }

    function createBlinkDot(container) {
        const dot = document.createElement('div');
        dot.className = 'blink-dot';

        dot.style.left = Math.random() * 100 + 'vw';
        dot.style.top = Math.random() * 100 + 'vh';

        const size = 1 + Math.random() * 2;
        dot.style.width = size + 'px';
        dot.style.height = size + 'px';

        dot.style.animationDelay = (Math.random() * 5) + 's';

        container.appendChild(dot);
    }
    
    function addButtonRippleEffect() {
        document.querySelectorAll('button[type="submit"], .btn-google').forEach(button => {
            if (!button.classList.contains('btn-ripple')) {
                button.classList.add('btn-ripple');
            }
            
            if (!button.hasAttribute('data-ripple-attached')) {
                button.setAttribute('data-ripple-attached', 'true');
                button.addEventListener('click', function(e) {
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const ripple = document.createElement('span');
                    ripple.className = 'ripple';
                    ripple.style.left = x + 'px';
                    ripple.style.top = y + 'px';
                    
                    this.appendChild(ripple);
                    
                    setTimeout(() => {
                        ripple.remove();
                    }, 600);
                });
            }
        });
    }
    
    function enhanceInputFocus() {
        document.querySelectorAll('input').forEach(input => {
            const wrapper = input.parentElement;
            
            if (wrapper && !wrapper.querySelector('.input-focus-effect')) {
                const focusEffect = document.createElement('div');
                focusEffect.className = 'input-focus-effect';
                wrapper.appendChild(focusEffect);
            }
            
            if (!input.hasAttribute('data-focus-attached')) {
                input.setAttribute('data-focus-attached', 'true');
                
                input.addEventListener('focus', function() {
                    this.parentElement.classList.add('focused');
                    const label = this.parentElement.querySelector('label');
                    if (label) label.classList.add('active');
                });
                
                input.addEventListener('blur', function() {
                    if (!this.value) {
                        this.parentElement.classList.remove('focused');
                        const label = this.parentElement.querySelector('label');
                        if (label) label.classList.remove('active');
                    }
                });
                
                if (input.value) {
                    input.parentElement.classList.add('focused');
                    const label = input.parentElement.querySelector('label');
                    if (label) label.classList.add('active');
                }
            }
        });
    }

    function setupFormToggles() {
        document.addEventListener('click', function(e) {
            const toggle = e.target.closest('.form-toggle');
            if (!toggle) return;
            
            e.preventDefault();
            e.stopPropagation();

            const targetForm = toggle.getAttribute('data-form');
            
            if (targetForm === currentForm) return;

            if (elements.authContainer) {
            elements.authContainer.classList.add('scale-in');
            setTimeout(() => {
                elements.authContainer.classList.remove('scale-in');
            }, timing.formScaleEffect);
            }

            animateTitle(getFormTitle(targetForm));
            
            hideAllForms();
            showForm(targetForm);
            
            currentForm = targetForm;

            setTimeout(() => {
                updateFormHeight();
                const activeForm = document.querySelector('form:not(.hidden)');
                const firstInput = activeForm?.querySelector('input:first-of-type');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 50);

            setTimeout(() => {
                updateFormHeight();
            }, timing.formTransition);

            document.title = `${getFormTitle(targetForm)} - misvord`;
            
            try {
                const newUrl = targetForm === 'login' ? '/login' : 
                               targetForm === 'register' ? '/register' : 
                               targetForm === 'forgot' ? '/forgot-password' :
                               targetForm === 'reset-password' ? '/reset-password' :
                               '/login';
                               
                history.pushState({}, '', newUrl);
            } catch (e) {
                console.error('Error updating URL:', e);
            }
        });
    }

    function animateTitle(newText) {
        if (!elements.authTitle) return;

        elements.authTitle.style.opacity = '0';
        elements.authTitle.style.transform = 'translateY(-10px)';

        setTimeout(() => {
            elements.authTitle.textContent = newText;
            elements.authTitle.offsetHeight;
            elements.authTitle.style.opacity = '1';
            elements.authTitle.style.transform = 'translateY(0)';
        }, timing.titleTransition);
    }

    function getFormTitle(form) {
        switch(form) {
            case 'login': return 'Welcome back!';
            case 'register': return 'Create an account';
            case 'forgot': return 'Account Recovery';
            case 'security': return 'Set Security Question';
            case 'reset-password': return 'Create New Password';
            default: return 'misvord';
        }
    }

    function updateFormHeight() {
        const activeForm = document.querySelector('form:not(.hidden)');
        if (activeForm && elements.formsContainer) {
            const formHeight = activeForm.scrollHeight;
            const minHeight = window.innerWidth <= 360 ? 300 : 
                              window.innerWidth <= 480 ? 320 :
                              window.innerWidth <= 640 ? 350 : 400;
            const finalHeight = Math.max(formHeight + 40, minHeight);
            elements.formsContainer.style.height = `${finalHeight}px`;
        }
    }

    function setupPasswordToggles() {
        elements.passwordFields.forEach(toggle => {
            if (toggle.hasAttribute('data-toggle-attached')) return;
            toggle.setAttribute('data-toggle-attached', 'true');
            
            toggle.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                if (!input) return;
                
                const currentType = input.type;
                input.type = currentType === 'password' ? 'text' : 'password';

                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = currentType === 'password' ? 
                        'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
                }

                this.classList.add('scale-effect', 'scale-in');
                setTimeout(() => {
                    this.classList.remove('scale-effect', 'scale-in');
                }, 300);
            });
        });
    }

    function setupPasswordStrength() {
        if (!elements.regPassword || !elements.strengthBar || !elements.strengthFill) return;

        elements.regPassword.addEventListener('input', function() {
            elements.strengthBar.classList.remove('hidden');

            const strength = FormValidator.calculatePasswordStrength(this.value);

            requestAnimationFrame(() => {
                elements.strengthFill.style.width = `${strength}%`;

                let color;
                if (strength < 33) color = 'rgb(239, 68, 68)';
                else if (strength < 66) color = 'rgb(234, 179, 8)';
                else color = 'rgb(34, 197, 94)';

                elements.strengthFill.style.backgroundColor = color;
            });

            if (elements.confirmPassword && elements.confirmPassword.value) {
                checkPasswordsMatch();
            }
        });
    }

    function setupPasswordMatching() {
        if (!elements.confirmPassword || !elements.regPassword || !elements.matchIndicator) return;
        elements.confirmPassword.addEventListener('input', checkPasswordsMatch);
    }

    function checkPasswordsMatch() {
        if (!elements.regPassword.value || !elements.confirmPassword.value) {
            elements.matchIndicator.classList.add('hidden');
            return;
        }

        elements.matchIndicator.classList.remove('hidden');
        const matching = elements.regPassword.value === elements.confirmPassword.value;

        if (matching) {
            elements.matchIndicator.innerHTML = 'Passwords match <i class="fa-solid fa-check"></i>';
            elements.matchIndicator.className = 'text-green-500 text-xs mt-1';

            elements.matchIndicator.classList.add('scale-effect', 'scale-in');
            setTimeout(() => {
                elements.matchIndicator.classList.remove('scale-effect', 'scale-in');
            }, 300);
        } else {
            elements.matchIndicator.innerHTML = 'Passwords do not match <i class="fa-solid fa-xmark"></i>';
            elements.matchIndicator.className = 'text-red-500 text-xs mt-1';
        }
    }

    function setupFormSubmission() {
        document.querySelectorAll('form:not(#registerForm)').forEach(form => {
            if (form.hasAttribute('data-validation-attached')) return;
            form.setAttribute('data-validation-attached', 'true');
            
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                let isValid = true;
                
                FormValidator.clearErrors(this);
                
                if (this.id === 'loginForm') {
                    isValid = FormValidator.validateLoginForm(this);
                    
                    const email = this.querySelector('#email');
                    const password = this.querySelector('#password');
                    
                    if (!email.value.trim()) {
                        FormValidator.showFieldError(email, 'Email is required');
                        isValid = false;
                        email.classList.add('error-shake');
                        setTimeout(() => email.classList.remove('error-shake'), 500);
                    }
                    
                    if (!password.value.trim()) {
                        FormValidator.showFieldError(password, 'Password is required');
                        isValid = false;
                        password.classList.add('error-shake');
                        setTimeout(() => password.classList.remove('error-shake'), 500);
                    }
                    
                    const captcha = this.querySelector('#login_captcha');
                    if (captcha) {
                        if (!captcha.value.trim()) {
                        FormValidator.showFieldError(captcha, 'Verification code is required');
                        isValid = false;
                        } else if (window.loginCaptchaInstance && !window.loginCaptchaInstance.isValid(captcha.value)) {
                            FormValidator.showFieldError(captcha, 'Invalid verification code');
                            isValid = false;
                            refreshCaptcha();
                        }
                    }
                    
                } else if (this.id === 'forgotForm') {
                    isValid = FormValidator.validateForgotForm(this);
                } else if (this.id === 'securityQuestionForm') {
                    isValid = FormValidator.validateSecurityQuestionForm(this);
                } else if (this.id === 'resetPasswordForm') {
                    isValid = FormValidator.validateResetPasswordForm(this);
                }
                
                if (!isValid) {
                    const formErrorContainer = document.createElement('div');
                    formErrorContainer.className = 'bg-red-500 text-white p-3 rounded-md mb-4 text-center animate-pulse form-error-container';
                    formErrorContainer.textContent = 'Please correct the errors below.';
                    
                    const existingError = form.querySelector('.form-error-container');
                    if (existingError) {
                        existingError.remove();
                    }
                    
                    form.prepend(formErrorContainer);
                    
                    refreshCaptcha();
                    
                    setTimeout(() => {
                        formErrorContainer.remove();
                    }, 5000);
                    
                    const firstInvalidField = document.querySelector('.border-red-500');
                    if (firstInvalidField) {
                        if (firstInvalidField.id !== 'password_confirm') {
                            firstInvalidField.classList.add('error-shake');
                            setTimeout(() => firstInvalidField.classList.remove('error-shake'), 500);
                        }
                        firstInvalidField.focus();
                    }
                    
                    setTimeout(() => {
                        checkForErrors();
                    }, 100);
                    
                    return false;
                }

                const timestampInput = document.createElement('input');
                timestampInput.type = 'hidden';
                timestampInput.name = '_t';
                timestampInput.value = Date.now();
                this.appendChild(timestampInput);
                
                const submitBtn = this.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    const originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';

                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    }, 5000);
                }
                
                this.submit();
                return true;
            });
                    
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.setAttribute('data-original-text', submitBtn.innerHTML);
            }
        });
    }

    window.loginCaptchaInstance = null;
    window.registerCaptchaInstance = null;

    function setupCaptcha() {
        try {
            if (typeof TextCaptcha === 'undefined') {
                console.error('TextCaptcha class is not defined');
                return;
            }
            
            const loginCaptchaContainer = document.getElementById('login-captcha-container');
            const registerCaptchaContainer = document.getElementById('register-captcha-container');
            
            if (loginCaptchaContainer && !window.loginCaptchaInstance) {
                window.loginCaptchaInstance = new TextCaptcha('login-captcha-container', {
                    length: 6,
                    inputId: 'login_captcha'
                });
            }
            
            if (registerCaptchaContainer && !window.registerCaptchaInstance) {
                window.registerCaptchaInstance = new TextCaptcha('register-captcha-container', {
                    length: 6,
                    inputId: 'register_captcha'
                });
            }
        } catch (e) {
            console.error('Error initializing captcha:', e);
        }
    }

    function refreshCaptcha() {
        if (window.loginCaptchaInstance) {
            window.loginCaptchaInstance.refresh();
            const loginInput = document.getElementById('login_captcha');
            if (loginInput) {
                loginInput.classList.remove('border-red-500');
                const errorElement = loginInput.parentElement.querySelector('.text-red-500');
                if (errorElement) {
                    errorElement.remove();
                }
            }
        }
        if (window.registerCaptchaInstance) {
            window.registerCaptchaInstance.refresh();
            const registerInput = document.getElementById('register_captcha');
            if (registerInput) {
                registerInput.classList.remove('border-red-500');
                const errorElement = registerInput.parentElement.querySelector('.text-red-500');
                if (errorElement) {
                    errorElement.remove();
                }
            }
        }
    }

    function setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                updateFormHeight();
            }, 100);
        });
        
        const observer = new MutationObserver(function() {
            setTimeout(updateFormHeight, 50);
        });
        
        if (elements.formsContainer) {
            observer.observe(elements.formsContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        }
    }
    
    function checkForErrors() {
        const bannedAccountMessage = document.getElementById('banned-account-message');
        if (bannedAccountMessage) {
            bannedAccountMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            bannedAccountMessage.classList.add('animate-pulse');
            bannedAccountMessage.style.animation = 'pulse 2s infinite, glow 3s ease-in-out infinite alternate';
            
            const icon = bannedAccountMessage.querySelector('.fas.fa-ban');
            if (icon) {
                icon.style.animation = 'shake 0.5s ease-in-out infinite alternate';
            }
            
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                const inputs = loginForm.querySelectorAll('input');
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                
                inputs.forEach(input => {
                    input.disabled = true;
                    input.style.opacity = '0.5';
                    input.style.cursor = 'not-allowed';
                    input.style.backgroundColor = '#1a1a1a';
                });
                
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.style.opacity = '0.5';
                    submitBtn.style.cursor = 'not-allowed';
                    submitBtn.innerHTML = '<i class="fas fa-ban mr-2"></i>Account Banned';
                    submitBtn.style.backgroundColor = '#7f1d1d';
                }
                
                const toggleBtns = loginForm.querySelectorAll('.password-toggle');
                toggleBtns.forEach(btn => {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                });
            }
            
            setTimeout(() => {
                if (bannedAccountMessage.parentNode) {
                    bannedAccountMessage.style.animation = 'pulse 2s infinite';
                }
            }, 3000);
        }
        
        const authError = document.getElementById('auth-error');
        if (authError) {
            authError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        const formErrorMessage = document.getElementById('form-error-message');
        if (formErrorMessage) {
            refreshCaptcha();
        }
        
        const captchaErrors = document.querySelectorAll('.text-red-500');
        captchaErrors.forEach(error => {
            if (error.textContent.includes('verification') || error.textContent.includes('captcha')) {
                refreshCaptcha();
            }
        });
        
        const allErrorElements = document.querySelectorAll('[class*="text-red-500"], [class*="bg-red-500"]');
        let foundCaptchaError = false;
        allErrorElements.forEach(error => {
            if (error.textContent && (error.textContent.includes('verification') || 
                error.textContent.includes('captcha') || 
                error.textContent.includes('Invalid verification'))) {
                foundCaptchaError = true;
            }
        });
        
        if (foundCaptchaError) {
            setTimeout(() => {
                refreshCaptcha();
            }, 500);
        }
    }

    function clearStoredAuthData() {
        try {
            const authKeys = [
                'authToken', 'rememberMe', 'userAuth', 'lastEmail', 
                'user_id', 'username', 'discriminator', 'avatar_url', 
                'banner_url', 'auth_data', 'session_id', 'login_state',
                'user_data', 'admin_access', 'login_history', 'user_settings',
                'user_status', 'fresh_login', 'csrf_token'
            ];
            
            authKeys.forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
            
            document.cookie.split(';').forEach(cookie => {
                const [name] = cookie.trim().split('=');
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            });
            
        } catch (e) {
            console.error('Error clearing stored auth data:', e);
        }
    }

    function initPasswordFieldMasking() {
        const passwordFields = document.querySelectorAll('input[type="password"]');
        passwordFields.forEach(setupPasswordField);
    }

    function setupPasswordField(field) {
        if (field.hasAttribute('data-masked-initialized')) return;
        field.setAttribute('data-masked-initialized', 'true');

        const wrapper = field.parentElement;
        const toggleButton = wrapper.querySelector('.password-toggle');
        
        if (!toggleButton) return;
        
        field.addEventListener('focus', function() {
            wrapper.classList.add('focused');
        });
        
        field.addEventListener('blur', function() {
            if (!this.value) {
                wrapper.classList.remove('focused');
            }
        });
        
        toggleButton.addEventListener('mousedown', function(e) {
            e.preventDefault();
            unmaskPassword(field, toggleButton);
        });
        
        toggleButton.addEventListener('mouseup', function() {
            maskPassword(field, toggleButton);
        });
        
        toggleButton.addEventListener('mouseleave', function() {
            maskPassword(field, toggleButton);
        });
    }

    function maskPassword(field, toggleButton) {
        field.type = 'password';
        const icon = toggleButton.querySelector('i');
        if (icon) {
            icon.className = 'fa-solid fa-eye';
        }
    }

    function unmaskPassword(field, toggleButton) {
        field.type = 'text';
        const icon = toggleButton.querySelector('i');
        if (icon) {
            icon.className = 'fa-solid fa-eye-slash';
        }
    }

    function setupRegistrationSteps() {
        const nextStepBtn = document.getElementById('next-step-btn');
        const prevStepBtn = document.getElementById('prev-step-btn');
        const step1 = document.getElementById('register-step-1');
        const step2 = document.getElementById('register-step-2');
        const stepLine = document.getElementById('step-line');
        const step1Indicator = document.getElementById('step-1-indicator');
        const step2Indicator = document.getElementById('step-2-indicator');
        const registerForm = document.getElementById('registerForm');
        
        if (!nextStepBtn || !prevStepBtn || !step1 || !step2 || !registerForm) return;
        
        let currentStep = 1;
        
        if (window.initialRegisterStep === 2) {
            step1.style.display = 'none';
            step2.style.display = 'block';
            step1.classList.remove('active');
            step2.classList.add('active');
            stepLine.classList.add('active');
            step1Indicator.classList.add('active');
            step2Indicator.classList.add('active');
            currentStep = 2;
            setupCaptcha();
            setTimeout(() => {
                updateFormHeight();
            }, 100);
        }
        
        nextStepBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const isValid = validateRegistrationStep1();
            
            if (!isValid) {
                nextStepBtn.classList.add('animate-shake');
                setTimeout(() => nextStepBtn.classList.remove('animate-shake'), 500);
                return;
            }
            
            step1.classList.remove('active');
            step1.classList.add('previous');
            
            setTimeout(() => {
                step1.classList.remove('previous');
                step1.style.display = 'none';
                
                step2.style.display = 'block';
                void step2.offsetWidth;
                step2.classList.add('active');
                
                stepLine.classList.add('active');
                step1Indicator.classList.add('active');
                step2Indicator.classList.add('active');
                
                currentStep = 2;
                
                const firstField = step2.querySelector('select, input');
                if (firstField) {
                    firstField.focus();
                }
                
                setupCaptcha();
                
                setTimeout(() => {
                    updateFormHeight();
                }, 100);
            }, 300);
        });
        
        prevStepBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            step2.classList.remove('active');
            step2.classList.add('next');
            
            setTimeout(() => {
                step2.classList.remove('next');
                step2.style.display = 'none';
                
                step1.style.display = 'block';
                void step1.offsetWidth;
                step1.classList.add('active');
                
                stepLine.classList.remove('active');
                step2Indicator.classList.remove('active');
                
                currentStep = 1;
                
                const lastField = step1.querySelector('input:last-of-type');
                if (lastField) {
                    lastField.focus();
                }
                
                setTimeout(() => {
                    updateFormHeight();
                }, 100);
            }, 300);
        });
        
        function validateRegistrationStep1() {
            const username = document.getElementById('username');
            const email = document.getElementById('reg_email');
            const password = document.getElementById('reg_password');
            const confirmPassword = document.getElementById('password_confirm');
            
            FormValidator.clearErrors(registerForm);
            
            let isValid = true;
            
            if (!username.value.trim()) {
                FormValidator.showFieldError(username, 'Username is required');
                isValid = false;
            } else if (username.value.length < 3 || username.value.length > 32) {
                FormValidator.showFieldError(username, 'Username must be between 3 and 32 characters');
                isValid = false;
            } else if (!/^[a-zA-Z0-9_]+$/.test(username.value)) {
                FormValidator.showFieldError(username, 'Username can only contain letters, numbers, and underscores');
                isValid = false;
            }
            
            if (!email.value.trim()) {
                FormValidator.showFieldError(email, 'Email is required');
                isValid = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
                FormValidator.showFieldError(email, 'Please enter a valid email address');
                isValid = false;
            }
            
            if (!password.value) {
                FormValidator.showFieldError(password, 'Password is required');
                isValid = false;
            } else if (password.value.length < 8) {
                FormValidator.showFieldError(password, 'Password must be at least 8 characters');
                isValid = false;
            } else if (!/[A-Z]/.test(password.value)) {
                FormValidator.showFieldError(password, 'Password must contain at least one uppercase letter');
                isValid = false;
            } else if (!/[0-9]/.test(password.value)) {
                FormValidator.showFieldError(password, 'Password must contain at least one number');
                isValid = false;
            }
            
            if (!confirmPassword.value) {
                FormValidator.showFieldError(confirmPassword, 'Please confirm your password');
                isValid = false;
            } else if (password.value !== confirmPassword.value) {
                FormValidator.showFieldError(confirmPassword, 'Passwords do not match');
                isValid = false;
                
                confirmPassword.classList.remove('error-shake');
            }
            
            if (!isValid) {
                const firstInvalidField = document.querySelector('.border-red-500');
                if (firstInvalidField) {
                    if (firstInvalidField.id !== 'password_confirm') {
                        firstInvalidField.classList.add('error-shake');
                        setTimeout(() => firstInvalidField.classList.remove('error-shake'), 500);
                    }
                    firstInvalidField.focus();
                }
            }
            
            return isValid;
        }
        
        registerForm.addEventListener('submit', async function(e) {
            if (currentStep === 1) {
                e.preventDefault();
                nextStepBtn.click();
                return false;
            }
            
            e.preventDefault();
            
            const securityQuestion = document.getElementById('security_question');
            const securityAnswer = document.getElementById('security_answer');
            
            let isValid = true;
            
            FormValidator.clearErrors(registerForm);
            
            if (!securityQuestion.value) {
                FormValidator.showFieldError(securityQuestion, 'Please select a security question');
                isValid = false;
            }
            
            if (!securityAnswer.value.trim()) {
                FormValidator.showFieldError(securityAnswer, 'Security answer is required');
                isValid = false;
            } else if (securityAnswer.value.length < 3) {
                FormValidator.showFieldError(securityAnswer, 'Security answer must be at least 3 characters');
                isValid = false;
            }
            
            const captcha = document.getElementById('register_captcha');
            if (captcha) {
                if (!captcha.value.trim()) {
                FormValidator.showFieldError(captcha, 'Verification code is required');
                isValid = false;
                } else if (window.registerCaptchaInstance && !window.registerCaptchaInstance.isValid(captcha.value)) {
                    FormValidator.showFieldError(captcha, 'Invalid verification code');
                    isValid = false;
                    refreshCaptcha();
                }
            }
            
            if (!isValid) {
                const formErrorContainer = document.createElement('div');
                formErrorContainer.className = 'bg-red-500 text-white p-3 rounded-md mb-4 text-center animate-pulse form-error-container';
                formErrorContainer.textContent = 'Please correct the errors below.';
                
                const existingError = registerForm.querySelector('.form-error-container');
                if (existingError) {
                    existingError.remove();
                }
                
                registerForm.prepend(formErrorContainer);
                
                setTimeout(() => {
                    if (formErrorContainer.parentNode) {
                        formErrorContainer.remove();
                    }
                }, 5000);
                
                refreshCaptcha();
                
                const firstInvalidField = document.querySelector('.border-red-500');
                if (firstInvalidField) {
                    firstInvalidField.classList.add('error-shake');
                    setTimeout(() => firstInvalidField.classList.remove('error-shake'), 500);
                    firstInvalidField.focus();
                }
                
                return false;
            }
            
            const timestampInput = document.createElement('input');
            timestampInput.type = 'hidden';
            timestampInput.name = '_t';
            timestampInput.value = Date.now();
            registerForm.appendChild(timestampInput);
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Creating Account...';

                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }, 5000);
            }
            
            registerForm.submit();
            return true;
        });
    }

    function init() {
        initAnimations();
        setupFormToggles();
        setupPasswordToggles();
        setupPasswordStrength();
        setupPasswordMatching();
        setupFormSubmission();
        setupResizeHandler();
        setupCaptcha();
        checkForErrors();
        
        setTimeout(function() {
            refreshCaptcha();
            checkForErrors();
        }, 500);
        initPasswordFieldMasking();
        setupRegistrationSteps();

        setTimeout(() => {
            updateFormHeight();
            const firstInput = document.querySelector('form:not(.hidden) input:first-of-type');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }

    init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}