import FormValidator from '../components/common/validation.js';

function initAuth() {
    if (window.authPageInitialized) {
        return;
    }
    window.authPageInitialized = true;

    if (window.logger) {
        window.logger.info('auth', 'Authentication page initialized');
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

    if (window.logger) {
        window.logger.debug('auth', 'Auth elements loaded:', {
            authContainer: !!elements.authContainer,
            formsContainer: !!elements.formsContainer,
            loginForm: !!elements.loginForm,
            registerForm: !!elements.registerForm,
            forgotForm: !!elements.forgotForm,
            formToggles: elements.formToggles.length
        });
    }
    
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

            updateFormHeight();
            
            currentForm = targetForm;

            setTimeout(() => {
                const activeForm = document.querySelector('form:not(.hidden)');
                const firstInput = activeForm?.querySelector('input:first-of-type');
                if (firstInput) {
                    firstInput.focus();
                }
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
            elements.formsContainer.style.height = `${activeForm.offsetHeight}px`;
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

            elements.matchIndicator.classList.add('error-text-glitch');
            setTimeout(() => {
                elements.matchIndicator.classList.remove('error-text-glitch');
            }, 1000);
        }
    }

    function setupFormSubmission() {
        document.querySelectorAll('form').forEach(form => {
            if (form.hasAttribute('data-validation-attached')) return;
            form.setAttribute('data-validation-attached', 'true');
            
            form.addEventListener('submit', function(e) {
                let isValid = true;
                
                if (this.id === 'loginForm') {
                    isValid = FormValidator.validateLoginForm(this);
                } else if (this.id === 'registerForm') {
                    isValid = FormValidator.validateRegisterForm(this);
                } else if (this.id === 'forgotForm') {
                    isValid = FormValidator.validateForgotForm(this);
                } else if (this.id === 'securityQuestionForm') {
                    isValid = FormValidator.validateSecurityQuestionForm(this);
                } else if (this.id === 'resetPasswordForm') {
                    isValid = FormValidator.validateResetPasswordForm(this);
                }

                if (!isValid) {
                    e.preventDefault(); 
                    return false;
                }
                
                const timestampInput = document.createElement('input');
                timestampInput.type = 'hidden';
                timestampInput.name = '_t';
                timestampInput.value = Date.now();
                this.appendChild(timestampInput);
                
                return true;
            });
        });
    }

    function setupCaptcha() {
        try {
            if (typeof window.initCaptcha === 'function') {
                window.initCaptcha();
            }
        } catch (e) {
            console.error('Error initializing captcha:', e);
        }
    }

    function setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                updateFormHeight();
            }, 250);
        });
    }
    
    function checkForErrors() {
        const authError = document.getElementById('auth-error');
        if (authError) {
            authError.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        initPasswordFieldMasking();

        const firstInput = document.querySelector('form:not(.hidden) input:first-of-type');
        if (firstInput) {
            setTimeout(() => {
                firstInput.focus();
            }, timing.formTransition);
        }
    }

    init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}