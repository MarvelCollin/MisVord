if (typeof window.logger !== 'undefined') {
    window.logger.debug('auth', 'Loading simple authentication page handler...');
}

(function() {
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
        
        function getCurrentForm() {
            if (!loginForm.classList.contains('hidden')) return 'login';
            if (!registerForm.classList.contains('hidden')) return 'register';
            if (!forgotForm.classList.contains('hidden')) return 'forgot';
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
            return null;
        }
        
        function getFormElement(formType) {
            switch (formType) {
                case 'login': return loginForm;
                case 'register': return registerForm;
                case 'forgot': return forgotForm;
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
        
        document.addEventListener('click', function(e) {
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
            
            toggle.addEventListener('click', function(e) {
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
        }console.log('✅ Authentication page setup complete');
        
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
            
            button.addEventListener('click', function(e) {
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
            
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('input-focused');
            });
            
            input.addEventListener('blur', function() {
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
});

function initAuthForms() {
    const formToggles = document.querySelectorAll('.form-toggle');
    const formsContainer = document.getElementById('formsContainer');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotForm = document.getElementById('forgotForm');
    const authTitle = document.getElementById('authTitle');
    
    formToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const formType = e.target.getAttribute('data-form');
            
            if (formType === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
                forgotForm.classList.add('hidden');
                authTitle.innerHTML = '<span>Welcome back!</span>';
                history.pushState({}, '', '/login');
            } else if (formType === 'register') {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
                forgotForm.classList.add('hidden');
                authTitle.innerHTML = '<span>Create an account</span>';
                history.pushState({}, '', '/register');
            } else if (formType === 'forgot') {
                loginForm.classList.add('hidden');
                registerForm.classList.add('hidden');
                forgotForm.classList.remove('hidden');
                authTitle.innerHTML = '<span>Reset Password</span>';
                history.pushState({}, '', '/forgot-password');
            }
        });
    });
}

function initPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.password-toggle');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.parentElement.querySelector('input');
            const icon = button.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
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

function checkPasswordsMatch(password, confirm) {
    const matchText = document.getElementById('passwordsMatch');
    
    if (password && confirm && password === confirm) {
        matchText.classList.remove('hidden');
    } else {
        matchText.classList.add('hidden');
    }
}

function initCaptcha() {
    if (typeof window.TextCaptcha !== 'function') {
        console.error('TextCaptcha is not loaded');
        return;
    }
    
    // Initialize login form captcha
    const loginCaptchaContainer = document.getElementById('login-captcha-container');
    if (loginCaptchaContainer) {
        window.loginCaptcha = new TextCaptcha('login-captcha-container', {
            length: 6
        });
    }
    
    // Initialize register form captcha
    const registerCaptchaContainer = document.getElementById('register-captcha-container');
    if (registerCaptchaContainer) {
        window.registerCaptcha = new TextCaptcha('register-captcha-container', {
            length: 6
        });
    }
    
    // Add captcha validation to the forms
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        const originalSubmit = loginForm.onsubmit;
        loginForm.onsubmit = function(e) {
            const captchaInput = document.getElementById('login_captcha');
            if (!window.loginCaptcha || !window.loginCaptcha.verify(captchaInput.value)) {
                e.preventDefault();
                
                // Show validation error
                const existingError = loginForm.querySelector('.captcha-error');
                if (existingError) existingError.remove();
                
                const errorMsg = document.createElement('p');
                errorMsg.className = 'text-red-500 text-sm mt-1 captcha-error';
                errorMsg.innerHTML = 'Invalid captcha code <i class="fa-solid fa-xmark"></i>';
                captchaInput.parentElement.appendChild(errorMsg);
                
                // Refresh captcha
                window.loginCaptcha.refresh();
                captchaInput.value = '';
                captchaInput.focus();
                
                return false;
            }
            
            if (originalSubmit) {
                return originalSubmit.call(this, e);
            }
        };
    }
    
    if (registerForm) {
        const originalSubmit = registerForm.onsubmit;
        registerForm.onsubmit = function(e) {
            const captchaInput = document.getElementById('register_captcha');
            if (!window.registerCaptcha || !window.registerCaptcha.verify(captchaInput.value)) {
                e.preventDefault();
                
                // Show validation error
                const existingError = registerForm.querySelector('.captcha-error');
                if (existingError) existingError.remove();
                
                const errorMsg = document.createElement('p');
                errorMsg.className = 'text-red-500 text-sm mt-1 captcha-error';
                errorMsg.innerHTML = 'Invalid captcha code <i class="fa-solid fa-xmark"></i>';
                captchaInput.parentElement.appendChild(errorMsg);
                
                // Refresh captcha
                window.registerCaptcha.refresh();
                captchaInput.value = '';
                captchaInput.focus();
                
                return false;
            }
            
            if (originalSubmit) {
                return originalSubmit.call(this, e);
            }
        };
    }
}

function setupSocketInitialization() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            localStorage.setItem('connect_socket_on_login', 'true');
        });
    }
}
