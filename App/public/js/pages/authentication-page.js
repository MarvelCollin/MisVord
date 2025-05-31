/**
 * Authentication Page Scripts
 * Handles all UI interactions for the authentication page
 */

// Import required modules
import { showToast } from '../core/toast.js';
import { MiscVordAjax } from '../core/ajax-handler.js';

document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        logo: document.getElementById('logo'),
        logoUnderline: document.getElementById('logoUnderline'),
        authContainer: document.getElementById('authContainer'),
        formsContainer: document.getElementById('formsContainer'),
        authTitle: document.getElementById('authTitle'),
        loginForm: document.getElementById('loginForm'),
        registerForm: document.getElementById('registerForm'),
        forgotForm: document.getElementById('forgotForm'),
        passwordFields: document.querySelectorAll('.password-toggle'),
        regPassword: document.getElementById('reg_password'),
        confirmPassword: document.getElementById('password_confirm'),
        strengthBar: document.getElementById('passwordStrength'),
        strengthFill: document.getElementById('passwordStrength') ? document.getElementById('passwordStrength').querySelector('div') : null,
        matchIndicator: document.getElementById('passwordsMatch'),
        formToggles: document.querySelectorAll('.form-toggle')
    };

    let currentForm = document.querySelector('form:not(.hidden)').id.replace('Form', '');

    const timing = {
        formTransition: 300,
        logoAnimation: 500,
        titleTransition: 300,
        formScaleEffect: 150
    };

    const formDirections = {
        'login_to_register': 'forward',
        'login_to_forgot': 'forward',
        'register_to_login': 'backward',
        'register_to_forgot': 'forward',
        'forgot_to_login': 'backward',
        'forgot_to_register': 'backward'
    };

    const transitions = {
        login: {
            enter: 'fade-enter',
            enterActive: 'fade-enter-active',
            exit: 'fade-exit',
            exitActive: 'fade-exit-active'
        },
        register: {
            enter: 'slide-left-enter',
            enterActive: 'slide-left-enter-active',
            exit: 'slide-right-exit',
            exitActive: 'slide-right-exit-active'
        },
        forgot: {
            enter: 'slide-right-enter',
            enterActive: 'slide-right-enter-active',
            exit: 'slide-left-exit',
            exitActive: 'slide-left-exit-active'
        }
    };

    function initAnimations() {
        setTimeout(() => {
            elements.logo.classList.add('visible');

            setTimeout(() => {
                elements.logoUnderline.classList.add('visible');
            }, 200);
        }, timing.logoAnimation / 2);

        updateFormHeight();

        document.querySelectorAll('button[type="submit"], .btn-google').forEach(button => {
            button.classList.add('btn-ripple');
        });

        document.querySelectorAll('input').forEach(input => {
            const wrapper = input.parentElement;

            if (!wrapper.querySelector('.input-focus-effect')) {
                const focusEffect = document.createElement('div');
                focusEffect.className = 'input-focus-effect';
                wrapper.appendChild(focusEffect);
            }
        });

        const existingBg = document.querySelector('.animated-bg');
        if (existingBg) existingBg.remove();

        createMinimalistBackground();

        elements.authContainer.classList.remove('gradient-border');
    }

    function createMinimalistBackground() {
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

        document.querySelector('.min-h-screen').prepend(minimalistBg);
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

    function setupFormToggles() {
        elements.formToggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();

                const targetForm = this.getAttribute('data-form');

                if (targetForm === currentForm) return;

                elements.authContainer.classList.add('scale-in');
                setTimeout(() => {
                    elements.authContainer.classList.remove('scale-in');
                }, timing.formScaleEffect);

                const direction = formDirections[`${currentForm}_to_${targetForm}`] || 'forward';

                if (window.formTransitionTimeout) {
                    clearTimeout(window.formTransitionTimeout);
                }

                animateTitle(getFormTitle(targetForm));

                transitionForms(currentForm, targetForm, direction);

                currentForm = targetForm;

                document.title = `${getFormTitle(targetForm)} - misvord`;
            });
        });
    }

    function transitionForms(fromForm, toForm, direction) {
        const currentFormEl = document.getElementById(fromForm + 'Form');
        const targetFormEl = document.getElementById(toForm + 'Form');

        const currentHeight = currentFormEl.offsetHeight;
        elements.formsContainer.style.height = `${currentHeight}px`;

        currentFormEl.classList.add('auth-form');
        targetFormEl.classList.add('auth-form');

        currentFormEl.classList.add(transitions[fromForm].exit);

        requestAnimationFrame(() => {
            currentFormEl.classList.add(transitions[fromForm].exitActive);

            window.formTransitionTimeout = setTimeout(() => {
                currentFormEl.classList.add('hidden');
                currentFormEl.classList.remove(
                    transitions[fromForm].exit,
                    transitions[fromForm].exitActive,
                    'auth-form'
                );

                targetFormEl.classList.remove('hidden');
                targetFormEl.classList.add(transitions[toForm].enter);

                targetFormEl.offsetWidth;

                requestAnimationFrame(() => {
                    targetFormEl.classList.add(transitions[toForm].enterActive);

                    elements.formsContainer.style.height = `${targetFormEl.offsetHeight}px`;

                    setTimeout(() => {
                        targetFormEl.classList.remove(
                            transitions[toForm].enter,
                            transitions[toForm].enterActive,
                            'auth-form'
                        );

                        const firstInput = targetFormEl.querySelector('input');
                        if (firstInput) firstInput.focus();
                    }, timing.formTransition);
                });
            }, timing.formTransition / 2);
        });
    }

    function animateTitle(newText) {
        const title = elements.authTitle;

        title.style.opacity = '0';
        title.style.transform = 'translateY(-10px)';

        setTimeout(() => {
            title.textContent = newText;

            title.offsetHeight;

            title.style.opacity = '1';
            title.style.transform = 'translateY(0)';
        }, timing.titleTransition);
    }

    function getFormTitle(form) {
        switch(form) {
            case 'login': return 'Welcome back!';
            case 'register': return 'Create an account';
            case 'forgot': return 'Reset Password';
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
            toggle.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const currentType = input.type;

                input.type = currentType === 'password' ? 'text' : 'password';

                // Update Font Awesome icon
                const icon = this.querySelector('i');
                if (icon) {
                    if (currentType === 'password') {
                        icon.className = 'fa-solid fa-eye-slash';
                    } else {
                        icon.className = 'fa-solid fa-eye';
                    }
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

            const strength = calculatePasswordStrength(this.value);

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

    function calculatePasswordStrength(password) {
        if (!password) return 0;

        let score = 0;
        score += Math.min(password.length * 4, 40);

        if (/[A-Z]/.test(password)) score += 15;
        if (/[a-z]/.test(password)) score += 10;
        if (/[0-9]/.test(password)) score += 15;
        if (/[^A-Za-z0-9]/.test(password)) score += 20;

        return Math.min(score, 100);
    }    function setupFormSubmission() {
        // Allow normal form submission - no AJAX interference
        console.log('🔄 Forms will use traditional submission for reliable redirects');
        
        // Only add validation, but allow normal submission
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function(e) {
                const isValid = validateForm(this);
                
                if (!isValid) {
                    e.preventDefault(); // Only prevent if validation fails
                    return false;
                }
                
                // If validation passes, allow normal form submission
                console.log('✅ Form validation passed, allowing normal submission');
                return true;
            });
        });
    }    function validateForm(form) {
        let isValid = true;
        const formId = form.id;

        form.querySelectorAll('.validation-error').forEach(el => el.remove());

        if (formId === 'registerForm') {
            const username = form.querySelector('#username');
            if (username.value.length < 3) {
                showFieldError(username, 'Username must be at least 3 characters');
                isValid = false;
            }

            const password = form.querySelector('#reg_password');
            const passwordConfirm = form.querySelector('#password_confirm');

            if (password.value.length < 6) {
                showFieldError(password, 'Password must be at least 6 characters');
                isValid = false;
            }

            if (password.value !== passwordConfirm.value) {
                showFieldError(passwordConfirm, 'Passwords do not match');
                isValid = false;
            }
        }

        return isValid;
    }

    function showFieldError(field, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 text-sm mt-1 validation-error';
        errorDiv.textContent = message;

        field.classList.add('border-red-500');

        field.parentElement.appendChild(errorDiv);

        field.classList.add('animate-shake');
        setTimeout(() => {
            field.classList.remove('animate-shake');
        }, 500);
    }

    function restoreFormData() {
        const formIds = ['registerForm', 'loginForm'];

        formIds.forEach(formId => {
            const storedData = localStorage.getItem(`${formId}_data`);
            if (storedData) {
                try {
                    const formData = JSON.parse(storedData);
                    const form = document.getElementById(formId);

                    if (form) {
                        Object.keys(formData).forEach(key => {
                            const field = form.querySelector(`[name="${key}"]`);
                            if (field && !field.value) {
                                field.value = formData[key];
                            }
                        });
                    }
                } catch (e) {
                    console.error('Error restoring form data', e);
                    localStorage.removeItem(`${formId}_data`);
                }
            }
        });
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

    function init() {
        initAnimations();
        setupFormToggles();
        setupPasswordToggles();
        setupPasswordStrength();
        setupPasswordMatching();
        setupFormSubmission();
        setupResizeHandler();
        restoreFormData();

        const firstInput = document.querySelector('form:not(.hidden) input:first-of-type');
        if (firstInput) {
            setTimeout(() => {
                firstInput.focus();
            }, timing.formTransition);
        }
    }

    init();
});