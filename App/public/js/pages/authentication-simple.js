if (typeof window.logger !== 'undefined') {
    window.logger.debug('auth', 'Loading simple authentication page handler...');
}

(function () {
    'use strict';

    if (window.authPageInitialized) {
        return;
    }
    window.authPageInitialized = true;
    function initAuthPage() {
        if (typeof window.logger !== 'undefined') {
            window.logger.info('auth', 'Simple auth page initialized');
        }

        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const forgotForm = document.getElementById('forgotForm');
        const authTitle = document.getElementById('authTitle');

        if (!loginForm || !registerForm || !forgotForm) {
            if (typeof window.logger !== 'undefined') {
                window.logger.error('auth', 'Could not find required form elements');
            }
            return;
        }

        let currentForm = getCurrentForm();
        if (typeof window.logger !== 'undefined') {
            window.logger.debug('auth', 'Current form:', currentForm);
        }

        const authError = document.getElementById('auth-error');
        if (authError) {
            authError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        try {
            initCaptcha();
        } catch (e) {
            console.error('Error initializing captcha:', e);
        }

        function getCurrentForm() {
            if (!loginForm.classList.contains('hidden')) return 'login';
            if (!registerForm.classList.contains('hidden')) return 'register';
            if (!forgotForm.classList.contains('hidden')) return 'forgot';
            if (!document.getElementById('securityVerifyForm') || document.getElementById('securityVerifyForm').classList.contains('hidden')) return 'login';
            if (!document.getElementById('resetPasswordForm') || document.getElementById('resetPasswordForm').classList.contains('hidden')) return 'login';
            if (document.getElementById('securityVerifyForm') && !document.getElementById('securityVerifyForm').classList.contains('hidden')) return 'security-verify';
            if (document.getElementById('resetPasswordForm') && !document.getElementById('resetPasswordForm').classList.contains('hidden')) return 'reset-password';
            return 'login';
        }
        function showForm(targetForm) {
            console.log(`🔄 Switching from ${currentForm} to ${targetForm}`);

            const formsContainer = document.getElementById('formsContainer');
            const authContainer = document.getElementById('authContainer');
            const currentFormElement = getCurrentFormElement();
            const targetFormElement = getFormElement(targetForm);

            if (!targetFormElement || targetForm === currentForm) return;

            formsContainer.style.overflow = 'hidden';
            authContainer.classList.add('form-switching');
            if (currentFormElement) {
                currentFormElement.classList.add('form-exit');

                setTimeout(() => {
                    currentFormElement.classList.add('hidden');
                    currentFormElement.classList.remove('form-exit');

                    targetFormElement.classList.remove('hidden');
                    targetFormElement.classList.add('form-enter');

                    targetFormElement.querySelectorAll('.form-group').forEach(group => {
                        group.style.opacity = '';
                        group.style.transform = '';
                    });

                    updateAuthTitle(targetForm);
                    updateFormHeight(targetFormElement);

                    setTimeout(() => {
                        targetFormElement.classList.remove('form-enter');
                        authContainer.classList.remove('form-switching');
                        formsContainer.style.overflow = '';

                        const firstInput = targetFormElement.querySelector('input:first-of-type');
                        if (firstInput) {
                            firstInput.focus();
                        }
                    }, 400);
                }, 200);
            } else {
                targetFormElement.classList.remove('hidden');
                updateAuthTitle(targetForm);
                updateFormHeight(targetFormElement);
            }

            currentForm = targetForm;

            const newUrl = targetForm === 'login' ? '/login' :
                targetForm === 'register' ? '/register' :
                targetForm === 'forgot' ? '/forgot-password' :
                targetForm === 'security-verify' ? '/security-verify' :
                targetForm === 'reset-password' ? '/reset-password' :
                    '/forgot-password';

            try {
                history.pushState({}, '', newUrl);
            } catch (e) {
                console.warn('Could not update URL:', e);
            }
        }

        function getCurrentFormElement() {
            if (!loginForm.classList.contains('hidden')) return loginForm;
            if (!registerForm.classList.contains('hidden')) return registerForm;
            if (!forgotForm.classList.contains('hidden')) return forgotForm;
            if (document.getElementById('securityVerifyForm') && !document.getElementById('securityVerifyForm').classList.contains('hidden')) 
                return document.getElementById('securityVerifyForm');
            if (document.getElementById('resetPasswordForm') && !document.getElementById('resetPasswordForm').classList.contains('hidden')) 
                return document.getElementById('resetPasswordForm');
            return null;
        }

        function getFormElement(formType) {
            switch (formType) {
                case 'login': return loginForm;
                case 'register': return registerForm;
                case 'forgot': return forgotForm;
                case 'security-verify': return document.getElementById('securityVerifyForm');
                case 'reset-password': return document.getElementById('resetPasswordForm');
                default: return null;
            }
        }

        function updateAuthTitle(targetForm) {
            const title = authTitle;
            title.style.opacity = '0';
            title.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                if (targetForm === 'register') {
                    title.textContent = 'Create an account';
                } else if (targetForm === 'login') {
                    title.textContent = 'Welcome back!';
                } else if (targetForm === 'forgot') {
                    title.textContent = 'Reset Password';
                } else if (targetForm === 'security-verify') {
                    title.textContent = 'Account Recovery';
                } else if (targetForm === 'reset-password') {
                    title.textContent = 'Create New Password';
                }

                title.style.opacity = '1';
                title.style.transform = 'translateY(0)';
            }, 150);
        }

        function updateFormHeight(activeForm) {
            const formsContainer = document.getElementById('formsContainer');
            if (activeForm && formsContainer) {
                const newHeight = activeForm.offsetHeight;
                formsContainer.style.height = `${newHeight}px`;
            }
        }

        document.addEventListener('click', function (e) {
            const toggle = e.target.closest('.form-toggle');
            if (!toggle) return;

            console.log('🖱️ Form toggle clicked!');
            e.preventDefault();
            e.stopPropagation();

            const targetForm = toggle.getAttribute('data-form');
            console.log(`📝 Target form: ${targetForm}`);

            if (targetForm && targetForm !== currentForm) {
                showForm(targetForm);
            }
        });
        const passwordToggles = document.querySelectorAll('.password-toggle');
        passwordToggles.forEach(toggle => {
            if (toggle.hasAttribute('data-toggle-attached')) return;
            toggle.setAttribute('data-toggle-attached', 'true');

            toggle.addEventListener('click', function (e) {
                e.preventDefault();
                const input = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fa-solid fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fa-solid fa-eye';
                }
            });
        });
        const regPassword = document.getElementById('reg_password');
        const confirmPassword = document.getElementById('password_confirm');
        const matchIndicator = document.getElementById('passwordsMatch');

        if (regPassword && confirmPassword && matchIndicator) {
            if (!regPassword.hasAttribute('data-match-attached')) {
                regPassword.setAttribute('data-match-attached', 'true');
                confirmPassword.setAttribute('data-match-attached', 'true');

                function checkPasswordsMatch() {
                    if (!regPassword.value || !confirmPassword.value) {
                        matchIndicator.classList.add('hidden');
                        return;
                    }

                    const matching = regPassword.value === confirmPassword.value;
                    matchIndicator.classList.remove('hidden');

                    if (matching) {
                        matchIndicator.innerHTML = 'Passwords match <i class="fa-solid fa-check"></i>';
                        matchIndicator.className = 'text-green-500 text-xs mt-1';
                    } else {
                        matchIndicator.innerHTML = 'Passwords do not match <i class="fa-solid fa-xmark"></i>';
                        matchIndicator.className = 'text-red-500 text-xs mt-1';
                    }
                }

                confirmPassword.addEventListener('input', checkPasswordsMatch);
                regPassword.addEventListener('input', checkPasswordsMatch);
            }
        } console.log('✅ Authentication page setup complete');

        createMinimalistBackground();
        addButtonRippleEffect();
        enhanceInputFocus();
        addButtonRippleEffect();
        enhanceInputFocus();
    }

    function createMinimalistBackground() {
        console.log('🎨 Creating animated background...');

        const existingBg = document.querySelector('.minimalist-bg');
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

        const authPage = document.querySelector('.authentication-page');
        if (authPage) {
            authPage.prepend(minimalistBg);
            console.log('🌟 Background animation created successfully');
        }
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
            if (button.hasAttribute('data-ripple-attached')) return;
            button.setAttribute('data-ripple-attached', 'true');

            button.addEventListener('click', function (e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple-effect');

                this.appendChild(ripple);

                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    function enhanceInputFocus() {
        document.querySelectorAll('input').forEach(input => {
            if (input.hasAttribute('data-focus-attached')) return;
            input.setAttribute('data-focus-attached', 'true');

            input.addEventListener('focus', function () {
                this.parentElement.classList.add('input-focused');
            });

            input.addEventListener('blur', function () {
                this.parentElement.classList.remove('input-focused');
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthPage);
    } else {
        initAuthPage();
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    initAuthForms();
    initPasswordToggle();
    initPasswordStrength();
    initCaptcha();
    setupSocketInitialization();
    initPasswordFieldMasking();
    initSecurityQuestionForm();
});

function initAuthForms() {
    const formToggles = document.querySelectorAll('.form-toggle');
    const formsContainer = document.getElementById('formsContainer');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotForm = document.getElementById('forgotForm');
    const securityVerifyForm = document.getElementById('securityVerifyForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const securityQuestionForm = document.getElementById('securityQuestionForm');
    const authTitle = document.getElementById('authTitle');

    if (loginForm) {
        loginForm.addEventListener('submit', validateLoginForm);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', validateRegisterForm);
    }

    if (forgotForm) {
        forgotForm.addEventListener('submit', validateForgotForm);
    }

    if (securityQuestionForm) {
        securityQuestionForm.addEventListener('submit', validateSecurityQuestionForm);
    }
    
    if (securityVerifyForm) {
        securityVerifyForm.addEventListener('submit', validateSecurityVerifyForm);
    }
    
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', validateResetPasswordForm);
    }

    formToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const formType = e.target.getAttribute('data-form');

            if (formType === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
                forgotForm.classList.add('hidden');
                if (securityVerifyForm) securityVerifyForm.classList.add('hidden');
                if (resetPasswordForm) resetPasswordForm.classList.add('hidden');
                authTitle.innerHTML = '<span>Welcome back!</span>';
                history.pushState({}, '', '/login');
            } else if (formType === 'register') {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
                forgotForm.classList.add('hidden');
                if (securityVerifyForm) securityVerifyForm.classList.add('hidden');
                if (resetPasswordForm) resetPasswordForm.classList.add('hidden');
                authTitle.innerHTML = '<span>Create an account</span>';
                history.pushState({}, '', '/register');
            } else if (formType === 'forgot') {
                loginForm.classList.add('hidden');
                registerForm.classList.add('hidden');
                forgotForm.classList.remove('hidden');
                if (securityVerifyForm) securityVerifyForm.classList.add('hidden');
                if (resetPasswordForm) resetPasswordForm.classList.add('hidden');
                authTitle.innerHTML = '<span>Reset Password</span>';
                history.pushState({}, '', '/forgot-password');
            } else if (formType === 'security-verify') {
                loginForm.classList.add('hidden');
                registerForm.classList.add('hidden');
                forgotForm.classList.add('hidden');
                if (securityVerifyForm) securityVerifyForm.classList.remove('hidden');
                if (resetPasswordForm) resetPasswordForm.classList.add('hidden');
                authTitle.innerHTML = '<span>Account Recovery</span>';
                history.pushState({}, '', '/security-verify');
            } else if (formType === 'reset-password') {
                loginForm.classList.add('hidden');
                registerForm.classList.add('hidden');
                forgotForm.classList.add('hidden');
                if (securityVerifyForm) securityVerifyForm.classList.add('hidden');
                if (resetPasswordForm) resetPasswordForm.classList.remove('hidden');
                authTitle.innerHTML = '<span>Create New Password</span>';
                history.pushState({}, '', '/reset-password');
            } else if (formType === 'security') {
                loginForm.classList.add('hidden');
                registerForm.classList.add('hidden');
                forgotForm.classList.add('hidden');
                if (securityVerifyForm) securityVerifyForm.classList.add('hidden');
                if (resetPasswordForm) resetPasswordForm.classList.add('hidden');
                securityQuestionForm.classList.remove('hidden');
                authTitle.innerHTML = '<span>Set Security Question</span>';
                history.pushState({}, '', '/set-security-question');
            }
        });
    });
}

function validateLoginForm(e) {
    const form = e.target;
    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const captchaInput = form.querySelector('#login_captcha');
    let isValid = true;

    clearErrors(form);

    if (!email) {
        showError(form.querySelector('#email'), 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError(form.querySelector('#email'), 'Please enter a valid email address');
        isValid = false;
    }

    if (!password) {
        showError(form.querySelector('#password').parentNode, 'Password is required');
        isValid = false;
    }

    // Only validate captcha if it exists
    if (captchaInput) {
        const captchaValue = captchaInput.value.trim();

        if (!captchaValue) {
            showError(captchaInput, 'Please complete the captcha');
            isValid = false;
        } else {
            try {
                if (window.loginCaptcha && !window.loginCaptcha.verify(captchaValue)) {
                    showError(captchaInput, 'Invalid captcha code');
                    try {
                        window.loginCaptcha.refresh();
                        captchaInput.value = '';
                    } catch (err) {
                        console.error('Failed to refresh captcha:', err);
                    }
                    isValid = false;
                }
            } catch (err) {
                console.error('Error validating captcha:', err);
                // Continue with form submission
            }
        }
    }

    if (!isValid) {
        e.preventDefault();
    }
}

function validateRegisterForm(e) {
    const form = e.target;
    const username = form.querySelector('#username').value.trim();
    const email = form.querySelector('#reg_email').value.trim();
    const password = form.querySelector('#reg_password').value;
    const confirmPassword = form.querySelector('#password_confirm').value;
    const securityQuestion = form.querySelector('#security_question').value.trim();
    const securityAnswer = form.querySelector('#security_answer').value.trim();
    const captcha = form.querySelector('#register_captcha').value.trim();
    let isValid = true;

    clearErrors(form);

    if (!username) {
        showError(form.querySelector('#username'), 'Username is required');
        isValid = false;
    } else if (username.length < 3 || username.length > 32) {
        showError(form.querySelector('#username'), 'Username must be between 3 and 32 characters');
        isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showError(form.querySelector('#username'), 'Username can only contain letters, numbers, and underscores');
        isValid = false;
    }

    if (!email) {
        showError(form.querySelector('#reg_email'), 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError(form.querySelector('#reg_email'), 'Please enter a valid email address');
        isValid = false;
    }

    if (!password) {
        showError(form.querySelector('#reg_password').parentNode, 'Password is required');
        isValid = false;
    } else if (password.length < 8) {
        showError(form.querySelector('#reg_password').parentNode, 'Password must be at least 8 characters');
        isValid = false;
    } else if (!/[A-Z]/.test(password)) {
        showError(form.querySelector('#reg_password').parentNode, 'Password must contain at least one uppercase letter');
        isValid = false;
    } else if (!/[0-9]/.test(password)) {
        showError(form.querySelector('#reg_password').parentNode, 'Password must contain at least one number');
        isValid = false;
    }

    if (password !== confirmPassword) {
        showError(form.querySelector('#password_confirm').parentNode, 'Passwords do not match');
        isValid = false;
    }

    if (!securityQuestion) {
        showError(form.querySelector('#security_question'), 'Please select a security question');
        isValid = false;
        form.querySelector('#security_question').classList.add('border-red-500');
    } else {
        form.querySelector('#security_question').classList.remove('border-red-500');
        form.querySelector('#security_question').classList.add('border-green-500');
    }

    if (!securityAnswer) {
        showError(form.querySelector('#security_answer'), 'Security answer is required');
        isValid = false;
    } else if (securityAnswer.length < 3) {
        showError(form.querySelector('#security_answer'), 'Security answer must be at least 3 characters');
        isValid = false;
    }

    if (!captcha) {
        showError(form.querySelector('#register_captcha'), 'Please complete the captcha');
        isValid = false;
    } else if (!window.registerCaptcha || !window.registerCaptcha.verify(captcha)) {
        showError(form.querySelector('#register_captcha'), 'Invalid captcha code');
        window.registerCaptcha.refresh();
        form.querySelector('#register_captcha').value = '';
        isValid = false;
    }

    if (!isValid) {
        e.preventDefault();
    }
}

function validateForgotForm(e) {
    const form = e.target;
    const email = form.querySelector('#forgot_email').value.trim();
    let isValid = true;

    clearErrors(form);

    if (!email) {
        showError(form.querySelector('#forgot_email'), 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError(form.querySelector('#forgot_email'), 'Please enter a valid email address');
        isValid = false;
    }

    if (!isValid) {
        e.preventDefault();
    }
}

function validateSecurityQuestionForm(e) {
    const form = e.target;
    const answer = form.querySelector('#security_answer').value.trim();
    let isValid = true;

    clearErrors(form);

    if (!answer) {
        showError(form.querySelector('#security_answer'), 'Security answer is required');
        isValid = false;
    } else if (answer.length < 3) {
        showError(form.querySelector('#security_answer'), 'Security answer must be at least 3 characters');
        isValid = false;
    }

    if (!isValid) {
        e.preventDefault();
    }
}

function validateSecurityVerifyForm(e) {
    const form = e.target;
    const email = form.querySelector('#security_verify_email').value.trim();
    const securityAnswer = form.querySelector('#security_answer_verify')?.value;
    let isValid = true;

    clearErrors(form);

    if (!email) {
        showError(form.querySelector('#security_verify_email'), 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError(form.querySelector('#security_verify_email'), 'Please enter a valid email address');
        isValid = false;
    }

    if (securityAnswer !== undefined) {
        if (!securityAnswer || securityAnswer.trim() === '') {
            showError(form.querySelector('#security_answer_verify'), 'Security answer is required');
            isValid = false;
        }
    }

    if (!isValid) {
        e.preventDefault();
    }
}

function validateResetPasswordForm(e) {
    const form = e.target;
    const password = form.querySelector('#new_password').value;
    const confirmPassword = form.querySelector('#confirm_new_password').value;
    let isValid = true;

    clearErrors(form);

    if (!password) {
        showError(form.querySelector('#new_password').parentNode, 'Password is required');
        isValid = false;
    } else if (password.length < 8) {
        showError(form.querySelector('#new_password').parentNode, 'Password must be at least 8 characters');
        isValid = false;
    } else if (!/[A-Z]/.test(password)) {
        showError(form.querySelector('#new_password').parentNode, 'Password must contain at least one uppercase letter');
        isValid = false;
    } else if (!/[0-9]/.test(password)) {
        showError(form.querySelector('#new_password').parentNode, 'Password must contain at least one number');
        isValid = false;
    }

    if (password !== confirmPassword) {
        showError(form.querySelector('#confirm_new_password').parentNode, 'Passwords do not match');
        isValid = false;
    }

    if (!isValid) {
        e.preventDefault();
    }
}

function showError(element, message) {
    const errorMsg = document.createElement('p');
    errorMsg.className = 'text-red-500 text-sm mt-1 validation-error';
    errorMsg.innerHTML = message + ' <i class="fa-solid fa-xmark"></i>';

    const parent = element.parentNode;
    if (parent.classList.contains('relative')) {
        parent.parentNode.appendChild(errorMsg);
    } else {
        element.parentNode.appendChild(errorMsg);
    }
}

function clearErrors(form) {
    const errors = form.querySelectorAll('.validation-error');
    errors.forEach(error => error.remove());
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function initPasswordToggle() {
}

function initPasswordStrength() {
    const passwordInput = document.getElementById('reg_password');
    const confirmInput = document.getElementById('password_confirm');
    const strengthBar = document.getElementById('passwordStrength');
    const matchText = document.getElementById('passwordsMatch');

    if (passwordInput && strengthBar) {
        passwordInput.addEventListener('input', () => {
            const strength = calculatePasswordStrength(passwordInput.value);
            strengthBar.classList.remove('hidden');
            strengthBar.querySelector('div').style.width = `${strength}%`;

            if (strength < 30) {
                strengthBar.querySelector('div').classList.remove('bg-yellow-500', 'bg-discord-green');
                strengthBar.querySelector('div').classList.add('bg-red-500');
            } else if (strength < 70) {
                strengthBar.querySelector('div').classList.remove('bg-red-500', 'bg-discord-green');
                strengthBar.querySelector('div').classList.add('bg-yellow-500');
            } else {
                strengthBar.querySelector('div').classList.remove('bg-red-500', 'bg-yellow-500');
                strengthBar.querySelector('div').classList.add('bg-discord-green');
            }

            if (confirmInput && confirmInput.value) {
                checkPasswordsMatch(passwordInput.value, confirmInput.value);
            }
        });
    }

    if (confirmInput && passwordInput && matchText) {
        confirmInput.addEventListener('input', () => {
            checkPasswordsMatch(passwordInput.value, confirmInput.value);
        });
    }
    
    // Reset password form
    const resetPasswordInput = document.getElementById('new_password');
    const resetConfirmInput = document.getElementById('confirm_new_password');
    const resetStrengthBar = document.getElementById('resetPasswordStrength');
    const resetMatchText = document.getElementById('resetPasswordsMatch');
    
    if (resetPasswordInput && resetStrengthBar) {
        resetPasswordInput.addEventListener('input', () => {
            const strength = calculatePasswordStrength(resetPasswordInput.value);
            resetStrengthBar.classList.remove('hidden');
            resetStrengthBar.querySelector('div').style.width = `${strength}%`;
            
            if (strength < 30) {
                resetStrengthBar.querySelector('div').classList.remove('bg-yellow-500', 'bg-discord-green');
                resetStrengthBar.querySelector('div').classList.add('bg-red-500');
            } else if (strength < 70) {
                resetStrengthBar.querySelector('div').classList.remove('bg-red-500', 'bg-discord-green');
                resetStrengthBar.querySelector('div').classList.add('bg-yellow-500');
            } else {
                resetStrengthBar.querySelector('div').classList.remove('bg-red-500', 'bg-yellow-500');
                resetStrengthBar.querySelector('div').classList.add('bg-discord-green');
            }
            
            if (resetConfirmInput && resetConfirmInput.value) {
                checkPasswordsMatch(resetPasswordInput.value, resetConfirmInput.value, 'reset');
            }
        });
    }
    
    if (resetConfirmInput && resetPasswordInput && resetMatchText) {
        resetConfirmInput.addEventListener('input', () => {
            checkPasswordsMatch(resetPasswordInput.value, resetConfirmInput.value, 'reset');
        });
    }

    // Add security question visual validation
    const securityQuestion = document.getElementById('security_question');
    if (securityQuestion) {
        securityQuestion.addEventListener('change', function () {
            if (this.value) {
                this.classList.remove('border-red-500');
                this.classList.add('border-green-500', 'text-white');
                this.classList.remove('text-gray-500');
            } else {
                this.classList.remove('border-green-500', 'text-white');
                this.classList.add('border-red-500', 'text-gray-500');
            }
        });
    }

    const securityAnswer = document.getElementById('security_answer');
    if (securityAnswer) {
        securityAnswer.addEventListener('input', function () {
            if (this.value.length >= 3) {
                this.classList.remove('border-red-500');
                this.classList.add('border-green-500');
            } else {
                this.classList.remove('border-green-500');
                if (this.value.length > 0) {
                    this.classList.add('border-red-500');
                } else {
                    this.classList.remove('border-red-500');
                }
            }
        });
    }
}

function calculatePasswordStrength(password) {
    if (!password) return 0;

    let strength = 0;

    if (password.length >= 8) {
        strength += 25;
    }

    if (password.match(/[a-z]/)) {
        strength += 10;
    }

    if (password.match(/[A-Z]/)) {
        strength += 20;
    }

    if (password.match(/[0-9]/)) {
        strength += 20;
    }

    if (password.match(/[^a-zA-Z0-9]/)) {
        strength += 25;
    }

    return Math.min(strength, 100);
}

function checkPasswordsMatch(password, confirm, type = 'register') {
    const matchText = type === 'reset' ? 
        document.getElementById('resetPasswordsMatch') : 
        document.getElementById('passwordsMatch');

    if (!matchText) return;

    if (password && confirm && password === confirm) {
        matchText.classList.remove('hidden');
        matchText.innerHTML = 'Passwords match <i class="fa-solid fa-check"></i>';
        matchText.className = 'text-green-500 text-xs mt-1';
    } else {
        matchText.classList.add('hidden');
    }
}

function validateSecurityQuestionField(field) {
    const value = field.value.trim();

    if (!value) {
        return {
            valid: false,
            message: 'Please select a security question'
        };
    }

    return { valid: true };
}

function validateSecurityAnswerField(field) {
    const value = field.value.trim();

    if (!value) {
        return {
            valid: false,
            message: 'Security answer is required'
        };
    }

    if (value.length < 3) {
        return {
            valid: false,
            message: 'Security answer must be at least 3 characters'
        };
    }

    return { valid: true };
}

function initCaptcha() {
    if (typeof window.TextCaptcha !== 'function') {
        console.error('TextCaptcha is not loaded');
        return;
    }

    try {
        const loginCaptchaContainer = document.getElementById('login-captcha-container');
        if (loginCaptchaContainer) {
            window.loginCaptcha = new TextCaptcha('login-captcha-container', {
                length: 6
            });
        }

        const registerCaptchaContainer = document.getElementById('register-captcha-container');
        if (registerCaptchaContainer) {
            window.registerCaptcha = new TextCaptcha('register-captcha-container', {
                length: 6
            });
        }
    } catch (e) {
        console.error('Error creating captcha:', e);
    }

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        const originalSubmit = loginForm.onsubmit;
        loginForm.onsubmit = function (e) {
            try {
                const captchaInput = document.getElementById('login_captcha');
                if (!captchaInput) return true; // Allow form to submit if captcha input doesn't exist

                if (!window.loginCaptcha) {
                    console.warn('Login captcha not initialized, allowing form submission');
                    return true; // Allow form to submit if captcha wasn't initialized
                }

                if (!window.loginCaptcha.verify(captchaInput.value)) {
                    e.preventDefault();

                    const existingError = loginForm.querySelector('.captcha-error');
                    if (existingError) existingError.remove();

                    const errorMsg = document.createElement('p');
                    errorMsg.className = 'text-red-500 text-sm mt-1 captcha-error';
                    errorMsg.innerHTML = 'Invalid captcha code <i class="fa-solid fa-xmark"></i>';
                    captchaInput.parentElement.appendChild(errorMsg);

                    try {
                        window.loginCaptcha.refresh();
                    } catch (err) {
                        console.error('Failed to refresh captcha:', err);
                    }

                    captchaInput.value = '';
                    captchaInput.focus();

                    return false;
                }
            } catch (error) {
                console.error('Error in login form validation:', error);
                // Allow form submission on error to prevent blocking user
                return true;
            }

            if (originalSubmit) {
                return originalSubmit.call(this, e);
            }

            return true;
        };
    }

    if (registerForm) {
        const originalSubmit = registerForm.onsubmit;
        registerForm.onsubmit = function (e) {
            try {
                const captchaInput = document.getElementById('register_captcha');
                if (!captchaInput) return true;

                if (!window.registerCaptcha) {
                    console.warn('Register captcha not initialized, allowing form submission');
                    return true;
                }

                if (!window.registerCaptcha.verify(captchaInput.value)) {
                    e.preventDefault();

                    const existingError = registerForm.querySelector('.captcha-error');
                    if (existingError) existingError.remove();

                    const errorMsg = document.createElement('p');
                    errorMsg.className = 'text-red-500 text-sm mt-1 captcha-error';
                    errorMsg.innerHTML = 'Invalid captcha code <i class="fa-solid fa-xmark"></i>';
                    captchaInput.parentElement.appendChild(errorMsg);

                    try {
                        window.registerCaptcha.refresh();
                    } catch (err) {
                        console.error('Failed to refresh captcha:', err);
                    }

                    captchaInput.value = '';
                    captchaInput.focus();

                    return false;
                }
            } catch (error) {
                console.error('Error in register form validation:', error);
                // Allow form submission on error to prevent blocking user
                return true;
            }

            if (originalSubmit) {
                return originalSubmit.call(this, e);
            }

            return true;
        };
    }
}

function setupSocketInitialization() {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            localStorage.setItem('connect_socket_on_login', 'true');
        });
    }
}

function initPasswordFieldMasking() {
    const passwordFields = document.querySelectorAll('.password-field');
    passwordFields.forEach(field => {
        setupPasswordField(field);
    });

    function setupPasswordField(field) {
        if (field.dataset.passwordFieldSetup) return;
        field.dataset.passwordFieldSetup = 'true';

        let container = field.parentNode;
        if (!container.classList.contains('relative')) {
            container = document.createElement('div');
            container.className = 'relative';
            field.parentNode.insertBefore(container, field);
            container.appendChild(field);
        }

        const existingToggle = container.querySelector('button.password-toggle');
        if (existingToggle) {
            existingToggle.addEventListener('click', function () {
                if (field.dataset.masked === 'true') {
                    unmaskPassword(field, existingToggle);
                } else {
                    maskPassword(field, existingToggle);
                }
            });
        } else {
            const toggleButton = document.createElement('button');
            toggleButton.type = 'button';
            toggleButton.className = 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors password-toggle';
            toggleButton.innerHTML = '<i class="fa-solid fa-eye"></i>';
            container.appendChild(toggleButton);

            toggleButton.addEventListener('click', function () {
                if (field.dataset.masked === 'true') {
                    unmaskPassword(field, toggleButton);
                } else {
                    maskPassword(field, toggleButton);
                }
            });
        }

        maskPassword(field);
    }

    function maskPassword(field, toggleButton) {
        field.dataset.masked = 'true';
        field.style.fontFamily = 'password';
        field.style.webkitTextSecurity = 'disc';
        field.style.textSecurity = 'disc';

        if (toggleButton) {
            toggleButton.innerHTML = '<i class="fa-solid fa-eye"></i>';
        }
    }

    function unmaskPassword(field, toggleButton) {
        field.dataset.masked = 'false';
        field.style.fontFamily = '';
        field.style.webkitTextSecurity = '';
        field.style.textSecurity = '';

        if (toggleButton) {
            toggleButton.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        }
    }

    if (!document.getElementById('password-font-style')) {
        const style = document.createElement('style');
        style.id = 'password-font-style';
        style.textContent = `
            @font-face {
                font-family: 'password';
                font-style: normal;
                font-weight: 400;
                src: url(data:font/woff;base64,d09GRgABAAAAAAfsABAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABGRlRNAAAHwAAAABwAAAAcaFMWO0dERUYAAAfAAAAAHAAAAB4AJwAcT1MvMgAAAZgAAABHAAAAVi+vS9xjbWFwAAAB+AAAAEcAAAFS6CL7lGdhc3AAAAe4AAAACAAAAAj//wADZ2x5ZgAAAlgAAAEzAAABeLy/JLZoZWFkAAABMAAAAC0AAAA2/Jf3M2hoZWEAAAFgAAAAHAAAACQHMgOlaG10eAAAAeAAAAAPAAAAFAwAAABsb2NhAAACRAAAAA4AAAAOAKYAIG1heHAAAAF8AAAAHgAAACAATABubmFtZQAAA4wAAADkAAAB1H7x7HFwb3N0AAAEcAAAAC0AAABMM4xvuXjaY2BkYGAA4gVmC5Tj+W2+MnAzMYDApdl/rzDj+f+//+8xMTAeAHI5GMDSAACiegvPAHjaY2BkYGA88P8Agx4TAwPD/z8MDEwMQBEUwAcAW+IEDAAAAQAAAAEAAAAAAAAAAKYAIAAAAAEAAAAKAAYACAABAAAAAAAA7QCkAAEAAAAAAAEABgAAAAEAAAAAAAIABwAGAAEAAAAAAAMAIwANAAEAAAAAAAQABgAwAAEAAAAAAAUACwA2AAEAAAAAAAYABgBBAAMAAQQJAAEADAAHAAMAAQQJAAIADgATAAMAAQQJAAMARgAhAAMAAQQJAAQADAAHAAMAAQQJAAUAFgBBAAMAAQQJAAYADABXcGFzc3dvcmQAcABhAHMAcwB3AG8AcgBkVmVyc2lvbiAxLjAAVgBlAHIAcwBpAG8AbgAgADEALgAwcGFzc3dvcmQAcABhAHMAcwB3AG8AcgBkcGFzc3dvcmQAcABhAHMAcwB3AG8AcgBkUmVndWxhcgBSAGUAZwB1AGwAYQBycGFzc3dvcmQAcABhAHMAcwB3AG8AcgBkRm9udCBnZW5lcmF0ZWQgYnkgSWNvTW9vbi4ARgBvAG4AdAAgAGcAZQBuAGUAcgBhAHQAZQBkACAAYgB5ACAASQBjAG8ATQBvAG8AbgAuAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==) format('woff');
            }
        `;
        document.head.appendChild(style);
    }
}

function initSecurityQuestionForm() {
    const securityQuestionForm = document.getElementById('securityQuestionForm');

    if (!securityQuestionForm) return;

    const questionSelect = document.getElementById('google_security_question');
    const answerInput = document.getElementById('google_security_answer');

    if (questionSelect && answerInput) {
        questionSelect.addEventListener('change', function () {
            if (this.value) {
                this.classList.add('text-white');
                this.classList.remove('text-gray-500');
            } else {
                this.classList.remove('text-white');
                this.classList.add('text-gray-500');
            }
        });

        answerInput.addEventListener('input', function () {
            if (this.value.length < 3 && this.value.length > 0) {
                this.classList.add('border-red-500');
            } else {
                this.classList.remove('border-red-500');
            }
        });
    }

    securityQuestionForm.addEventListener('submit', function (e) {
        const question = questionSelect.value;
        const answer = answerInput.value;
        let isValid = true;

        document.querySelectorAll('.validation-error').forEach(el => el.remove());

        if (!question) {
            const errorMsg = document.createElement('p');
            errorMsg.className = 'text-red-500 text-sm mt-1 validation-error';
            errorMsg.innerHTML = 'Please select a security question <i class="fa-solid fa-xmark"></i>';
            questionSelect.parentNode.appendChild(errorMsg);
            isValid = false;
        }

        if (!answer) {
            const errorMsg = document.createElement('p');
            errorMsg.className = 'text-red-500 text-sm mt-1 validation-error';
            errorMsg.innerHTML = 'Security answer is required <i class="fa-solid fa-xmark"></i>';
            answerInput.parentNode.appendChild(errorMsg);
            isValid = false;
        } else if (answer.length < 3) {
            const errorMsg = document.createElement('p');
            errorMsg.className = 'text-red-500 text-sm mt-1 validation-error';
            errorMsg.innerHTML = 'Security answer must be at least 3 characters <i class="fa-solid fa-xmark"></i>';
            answerInput.parentNode.appendChild(errorMsg);
            isValid = false;
        }

        if (!isValid) {
            e.preventDefault();
        }
    });
}
