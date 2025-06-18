console.log('🔧 Loading simple authentication page handler...');

(function() {
    'use strict';
    
    if (window.authPageInitialized) {
        return;
    }
    window.authPageInitialized = true;
    
    function initAuthPage() {
        console.log('🚀 Simple auth page initialized');
        
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const forgotForm = document.getElementById('forgotForm');
        const authTitle = document.getElementById('authTitle');
        
        if (!loginForm || !registerForm || !forgotForm) {
            console.error('❌ Could not find required form elements');
            return;
        }
        
        let currentForm = getCurrentForm();
        console.log('📋 Current form:', currentForm);
        
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
