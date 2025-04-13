document.addEventListener('DOMContentLoaded', function() {
    // Performance optimization - cache DOM elements
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
    
    // Current form tracking for better performance
    let currentForm = document.querySelector('form:not(.hidden)').id.replace('Form', '');
    
    // Advanced animation configurations
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
    
    // Form transition directions
    const formDirections = {
        'login_to_register': 'forward',
        'login_to_forgot': 'forward',
        'register_to_login': 'backward',
        'register_to_forgot': 'forward',
        'forgot_to_login': 'backward',
        'forgot_to_register': 'backward'
    };
    
    // Animation timings (ms)
    const timing = {
        formTransition: 300,
        logoAnimation: 500,
        titleTransition: 300,
        formScaleEffect: 150
    };
    
    // Initialize modern animations
    function initAnimations() {
        // Smooth logo entrance
        setTimeout(() => {
            elements.logo.classList.add('visible');
            
            // Delayed underline expansion
            setTimeout(() => {
                elements.logoUnderline.classList.add('visible');
            }, 200);
        }, timing.logoAnimation / 2);
        
        // Initialize form container height
        updateFormHeight();
        
        // Add ripple effect to buttons
        document.querySelectorAll('button[type="submit"], .btn-google').forEach(button => {
            button.classList.add('btn-ripple');
        });
        
        // Add focus effects to inputs
        document.querySelectorAll('input').forEach(input => {
            const wrapper = input.parentElement;
            
            // Add focus effect element if not already present
            if (!wrapper.querySelector('.input-focus-effect')) {
                const focusEffect = document.createElement('div');
                focusEffect.className = 'input-focus-effect';
                wrapper.appendChild(focusEffect);
            }
        });
        
        // Remove existing animated background if any
        const existingBg = document.querySelector('.animated-bg');
        if (existingBg) existingBg.remove();
        
        // Create minimalist background instead
        createMinimalistBackground();
        
        // Remove gradient border, we don't want it anymore
        elements.authContainer.classList.remove('gradient-border');
    }
    
    // Create minimalist background elements
    function createMinimalistBackground() {
        // Create container for all shapes
        const minimalistBg = document.createElement('div');
        minimalistBg.className = 'minimalist-bg';
        
        // Create floating shapes
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
        
        // Create subtle blinking dots - about 40 of them randomly positioned
        for (let i = 0; i < 40; i++) {
            createBlinkDot(minimalistBg);
        }
        
        // Add to DOM
        document.querySelector('.min-h-screen').prepend(minimalistBg);
    }
    
    // Create a single blinking dot with random positioning and animation delay
    function createBlinkDot(container) {
        const dot = document.createElement('div');
        dot.className = 'blink-dot';
        
        // Random positioning
        dot.style.left = Math.random() * 100 + 'vw';
        dot.style.top = Math.random() * 100 + 'vh';
        
        // Random size (1-3px)
        const size = 1 + Math.random() * 2;
        dot.style.width = size + 'px';
        dot.style.height = size + 'px';
        
        // Random animation delay
        dot.style.animationDelay = (Math.random() * 5) + 's';
        
        container.appendChild(dot);
    }
    
    // Efficient form toggle with modern transitions
    function setupFormToggles() {
        elements.formToggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get target form
                const targetForm = this.getAttribute('data-form');
                
                // Don't do anything if clicking the current form
                if (targetForm === currentForm) return;
                
                // Apply scale effect to container for feedback
                elements.authContainer.classList.add('scale-in');
                setTimeout(() => {
                    elements.authContainer.classList.remove('scale-in');
                }, timing.formScaleEffect);
                
                // Get direction for proper animation
                const direction = formDirections[`${currentForm}_to_${targetForm}`] || 'forward';
                
                // Clear any queued transitions for performance
                if (window.formTransitionTimeout) {
                    clearTimeout(window.formTransitionTimeout);
                }
                
                // Animate title change with modern effect
                animateTitle(getFormTitle(targetForm));
                
                // Perform optimized form transition
                transitionForms(currentForm, targetForm, direction);
                
                // Update current form tracking
                currentForm = targetForm;
                
                // Update page title
                document.title = `${getFormTitle(targetForm)} - MiscVord`;
            });
        });
    }
    
    // Optimized form transition function
    function transitionForms(fromForm, toForm, direction) {
        const currentFormEl = document.getElementById(fromForm + 'Form');
        const targetFormEl = document.getElementById(toForm + 'Form');
        
        // Save current height for smooth transition
        const currentHeight = currentFormEl.offsetHeight;
        elements.formsContainer.style.height = `${currentHeight}px`;
        
        // Apply transition classes
        currentFormEl.classList.add('auth-form');
        targetFormEl.classList.add('auth-form');
        
        // Hide current form with animation
        currentFormEl.classList.add(transitions[fromForm].exit);
        
        // Use RAF for better animation performance
        requestAnimationFrame(() => {
            currentFormEl.classList.add(transitions[fromForm].exitActive);
            
            // After exit animation starts, prepare target form
            window.formTransitionTimeout = setTimeout(() => {
                // Hide old form and remove transition classes
                currentFormEl.classList.add('hidden');
                currentFormEl.classList.remove(
                    transitions[fromForm].exit,
                    transitions[fromForm].exitActive,
                    'auth-form'
                );
                
                // Show new form and prepare for entrance
                targetFormEl.classList.remove('hidden');
                targetFormEl.classList.add(transitions[toForm].enter);
                
                // Force reflow for animation to work
                targetFormEl.offsetWidth;
                
                // Start entrance animation
                requestAnimationFrame(() => {
                    targetFormEl.classList.add(transitions[toForm].enterActive);
                    
                    // Update container height for smooth transition
                    elements.formsContainer.style.height = `${targetFormEl.offsetHeight}px`;
                    
                    // Clean up classes after animation
                    setTimeout(() => {
                        targetFormEl.classList.remove(
                            transitions[toForm].enter,
                            transitions[toForm].enterActive,
                            'auth-form'
                        );
                        
                        // Focus first input for better UX
                        const firstInput = targetFormEl.querySelector('input');
                        if (firstInput) firstInput.focus();
                    }, timing.formTransition);
                });
            }, timing.formTransition / 2);
        });
    }
    
    // Modern title animation
    function animateTitle(newText) {
        const title = elements.authTitle;
        
        // Animate out
        title.style.opacity = '0';
        title.style.transform = 'translateY(-10px)';
        
        // After animation out, change text and animate in
        setTimeout(() => {
            title.textContent = newText;
            
            // Force reflow
            title.offsetHeight;
            
            title.style.opacity = '1';
            title.style.transform = 'translateY(0)';
        }, timing.titleTransition);
    }
    
    // Get title text based on form
    function getFormTitle(form) {
        switch(form) {
            case 'login': return 'Welcome back!';
            case 'register': return 'Create an account';
            case 'forgot': return 'Reset Password';
            default: return 'MiscVord';
        }
    }
    
    // Update form container height
    function updateFormHeight() {
        const activeForm = document.querySelector('form:not(.hidden)');
        if (activeForm && elements.formsContainer) {
            elements.formsContainer.style.height = `${activeForm.offsetHeight}px`;
        }
    }
    
    // Modern password visibility toggle
    function setupPasswordToggles() {
        elements.passwordFields.forEach(toggle => {
            toggle.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const currentType = input.type;
                
                // Toggle input type
                input.type = currentType === 'password' ? 'text' : 'password';
                
                // Update toggle icon with animation
                this.textContent = currentType === 'password' ? '🔒' : '👁️';
                
                // Add animation class
                this.classList.add('scale-effect', 'scale-in');
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    this.classList.remove('scale-effect', 'scale-in');
                }, 300);
            });
        });
    }
    
    // Optimized password strength meter
    function setupPasswordStrength() {
        if (!elements.regPassword || !elements.strengthBar || !elements.strengthFill) return;
        
        elements.regPassword.addEventListener('input', function() {
            // Show strength bar with animation
            elements.strengthBar.classList.remove('hidden');
            
            // Calculate password strength efficiently
            const strength = calculatePasswordStrength(this.value);
            
            // Use transform for better performance
            requestAnimationFrame(() => {
                elements.strengthFill.style.width = `${strength}%`;
                
                // Update color based on strength
                let color;
                if (strength < 33) color = 'rgb(239, 68, 68)'; // red-500
                else if (strength < 66) color = 'rgb(234, 179, 8)'; // yellow-500
                else color = 'rgb(34, 197, 94)'; // green-500
                
                elements.strengthFill.style.backgroundColor = color;
            });
            
            // Check passwords match if confirm has value
            if (elements.confirmPassword && elements.confirmPassword.value) {
                checkPasswordsMatch();
            }
        });
    }
    
    // Password matching indicator
    function setupPasswordMatching() {
        if (!elements.confirmPassword || !elements.regPassword || !elements.matchIndicator) return;
        
        elements.confirmPassword.addEventListener('input', checkPasswordsMatch);
    }
    
    // Check if passwords match
    function checkPasswordsMatch() {
        if (!elements.regPassword.value || !elements.confirmPassword.value) {
            elements.matchIndicator.classList.add('hidden');
            return;
        }
        
        elements.matchIndicator.classList.remove('hidden');
        const matching = elements.regPassword.value === elements.confirmPassword.value;
        
        if (matching) {
            elements.matchIndicator.textContent = 'Passwords match ✓';
            elements.matchIndicator.className = 'text-green-500 text-xs mt-1';
            
            // Add subtle animation for positive feedback
            elements.matchIndicator.classList.add('scale-effect', 'scale-in');
            setTimeout(() => {
                elements.matchIndicator.classList.remove('scale-effect', 'scale-in');
            }, 300);
        } else {
            elements.matchIndicator.textContent = 'Passwords do not match ✗';
            elements.matchIndicator.className = 'text-red-500 text-xs mt-1';
            
            // Add subtle "error" animation
            elements.matchIndicator.classList.add('error-text-glitch');
            setTimeout(() => {
                elements.matchIndicator.classList.remove('error-text-glitch');
            }, 1000);
        }
    }
    
    // Efficient password strength calculation
    function calculatePasswordStrength(password) {
        if (!password) return 0;
        
        // Simple point system for quick calculation
        let score = 0;
        score += Math.min(password.length * 4, 40); // Length (max 40 points)
        
        // Use simple regex tests instead of complex pattern matching
        if (/[A-Z]/.test(password)) score += 15; // uppercase
        if (/[a-z]/.test(password)) score += 10; // lowercase
        if (/[0-9]/.test(password)) score += 15; // numbers
        if (/[^A-Za-z0-9]/.test(password)) score += 20; // special chars
        
        return Math.min(score, 100);
    }
    
    // Modern loading indicators for form submission with enhanced error handling
    function setupFormSubmission() {
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function(e) {
                // Basic form validation before submission
                const isValid = validateForm(this);
                
                if (!isValid) {
                    e.preventDefault();
                    return;
                }
                
                const button = this.querySelector('button[type="submit"]');
                if (!button) return;
                
                // Store original content
                if (!button.dataset.originalText) {
                    button.dataset.originalText = button.innerHTML;
                }
                
                // Disable button
                button.disabled = true;
                
                // Modern dot loader
                button.innerHTML = `
                    <div class="flex items-center justify-center">
                        <div class="dot-loader mr-3"><div></div></div>
                        <span>Processing</span>
                    </div>
                `;
                
                // Add subtle pulsing effect
                button.classList.add('animate-pulse');
                
                // Store form data in localStorage as backup
                if (this.id === 'registerForm' || this.id === 'loginForm') {
                    const formData = {};
                    new FormData(this).forEach((value, key) => {
                        if (!key.includes('password')) { // Don't store passwords
                            formData[key] = value;
                        }
                    });
                    localStorage.setItem(`${this.id}_data`, JSON.stringify(formData));
                }
                
                // Let form submit normally
            });
        });
    }
    
    // Form validation before submission
    function validateForm(form) {
        let isValid = true;
        const formId = form.id;
        
        // Clear previous error messages
        form.querySelectorAll('.validation-error').forEach(el => el.remove());
        
        // Validate based on form type
        if (formId === 'registerForm') {
            // Username validation
            const username = form.querySelector('#username');
            if (username.value.length < 3) {
                showFieldError(username, 'Username must be at least 3 characters');
                isValid = false;
            }
            
            // Password validation
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
    
    // Show error message under a field
    function showFieldError(field, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 text-sm mt-1 validation-error';
        errorDiv.textContent = message;
        
        // Add error class to the field
        field.classList.add('border-red-500');
        
        // Add error message after the field's parent div
        field.parentElement.appendChild(errorDiv);
        
        // Add shake animation to field
        field.classList.add('animate-shake');
        setTimeout(() => {
            field.classList.remove('animate-shake');
        }, 500);
    }
    
    // Restore form data from localStorage if available
    function restoreFormData() {
        const formIds = ['registerForm', 'loginForm'];
        
        formIds.forEach(formId => {
            const storedData = localStorage.getItem(`${formId}_data`);
            if (storedData) {
                try {
                    const formData = JSON.parse(storedData);
                    const form = document.getElementById(formId);
                    
                    if (form) {
                        // Fill form fields from stored data
                        Object.keys(formData).forEach(key => {
                            const field = form.querySelector(`[name="${key}"]`);
                            if (field && !field.value) {
                                field.value = formData[key];
                            }
                        });
                    }
                } catch (e) {
                    // Silently fail if data is invalid
                    console.error('Error restoring form data', e);
                    localStorage.removeItem(`${formId}_data`);
                }
            }
        });
    }
    
    // Add the missing setupResizeHandler function
    function setupResizeHandler() {
        // Handle window resize events for responsive form containers
        let resizeTimeout;
        window.addEventListener('resize', function() {
            // Debounce resize events for better performance
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                updateFormHeight();
            }, 250); // Wait until resizing stops
        });
    }
    
    // Initialize all functionality
    function init() {
        initAnimations();
        setupFormToggles();
        setupPasswordToggles();
        setupPasswordStrength();
        setupPasswordMatching();
        setupFormSubmission();
        setupResizeHandler(); // Now this function is defined
        restoreFormData();
        
        // Set initial focus
        const firstInput = document.querySelector('form:not(.hidden) input:first-of-type');
        if (firstInput) {
            setTimeout(() => {
                firstInput.focus();
            }, timing.formTransition);
        }
    }
    
    // Start initialization
    init();
});
