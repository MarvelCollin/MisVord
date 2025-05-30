/**
 * Authentication handlers for MiscVord
 * Manages login, registration, and other auth-related features
 */

// Import dependencies
import { MiscVordAjax } from '../core/ajax-handler.js';
import { showToast } from '../core/toast.js';

// Export main class
export class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('Auth manager initialized');
        document.addEventListener('DOMContentLoaded', () => {
            this.initAuthForms();
        });
    }

    /**
     * Initialize all auth forms 
     */
    initAuthForms() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        
        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }
        
        // Forgot password form
        const forgotPasswordForm = document.getElementById('forgot-password-form');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', this.handleForgotPassword.bind(this));
        }
        
        // Switch form links (login/register/forgot password)
        this.initFormSwitchLinks();
    }

    /**
     * Initialize form switch links
     */
    initFormSwitchLinks() {
        const switchLinks = document.querySelectorAll('[data-form-switch]');
        
        switchLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetForm = this.getAttribute('data-form-switch');
                AuthManager.switchActiveForm(targetForm);
            });
        });
    }

    /**
     * Switch active form (login/register/forgot password)
     * @static
     */
    static switchActiveForm(formType) {
        // Hide all forms
        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => form.classList.add('hidden'));
        
        // Show the selected form
        const targetForm = document.getElementById(`${formType}-form-container`);
        if (targetForm) {
            targetForm.classList.remove('hidden');
            
            // Update URL without page reload
            const newUrl = `/${formType}`;
            history.pushState({}, '', newUrl);
            
            // Focus first input
            const firstInput = targetForm.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        }
    }

    /**
     * Handle login form submission
     */
    handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        this.clearFormErrors(form);
        
        // Submit via AJAX
        MiscVordAjax.submitForm(form, {
            onSuccess: (response) => {
                if (response.success) {
                    showToast('Login successful. Redirecting...', 'success');
                    
                    // If there's a redirect in response, it will be handled automatically
                    // Otherwise redirect to default page
                    if (!response.redirect) {
                        window.location.href = '/app';
                    }
                }
            },
            onError: (error) => {
                const errors = error.data?.errors || {};
                this.displayFormErrors(form, errors);
                
                // If there's a specific auth error message
                if (error.data?.message) {
                    showToast(error.data.message, 'error');
                }
            }
        });
    }

    /**
     * Handle register form submission
     */
    handleRegister(e) {
        e.preventDefault();
        
        const form = e.target;
        this.clearFormErrors(form);
        
        // Check if passwords match
        const password = form.querySelector('[name="password"]').value;
        const confirmPassword = form.querySelector('[name="password_confirm"]').value;
        
        if (password !== confirmPassword) {
            this.displayFormErrors(form, {
                password_confirm: 'Passwords do not match'
            });
            return;
        }
        
        // Submit via AJAX
        MiscVordAjax.submitForm(form, {
            onSuccess: (response) => {
                if (response.success) {
                    showToast('Registration successful. Redirecting...', 'success');
                    
                    // If there's a redirect in response, it will be handled automatically
                    // Otherwise redirect to default page
                    if (!response.redirect) {
                        window.location.href = '/app';
                    }
                }
            },
            onError: (error) => {
                const errors = error.data?.errors || {};
                this.displayFormErrors(form, errors);
                
                // If there's a specific auth error message
                if (error.data?.message) {
                    showToast(error.data.message, 'error');
                }
            }
        });
    }

    /**
     * Handle forgot password form submission
     */
    handleForgotPassword(e) {
        e.preventDefault();
        
        const form = e.target;
        this.clearFormErrors(form);
        
        // Submit via AJAX
        MiscVordAjax.submitForm(form, {
            onSuccess: (response) => {
                if (response.success) {
                    showToast(response.message || 'Password reset instructions have been sent.', 'success');
                    
                    // Clear the form
                    form.reset();
                    
                    // Switch back to login form after a delay
                    setTimeout(() => {
                        AuthManager.switchActiveForm('login');
                    }, 2000);
                }
            },
            onError: (error) => {
                const errors = error.data?.errors || {};
                this.displayFormErrors(form, errors);
                
                // If there's a specific auth error message
                if (error.data?.message) {
                    showToast(error.data.message, 'error');
                }
            }
        });
    }

    /**
     * Clear form errors
     */
    clearFormErrors(form) {
        // Remove error messages
        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(el => el.remove());
        
        // Remove error styling
        const invalidInputs = form.querySelectorAll('.is-invalid');
        invalidInputs.forEach(input => {
            input.classList.remove('is-invalid', 'border-red-500');
        });
    }

    /**
     * Display form errors
     */
    displayFormErrors(form, errors) {
        for (const field in errors) {
            const input = form.querySelector(`[name="${field}"]`);
            const message = errors[field];
            
            if (input) {
                // Add error class to input
                input.classList.add('is-invalid', 'border-red-500');
                
                // Create error message element
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message text-red-500 text-xs mt-1';
                errorDiv.textContent = message;
                
                // Insert after input
                input.parentNode.insertBefore(errorDiv, input.nextSibling);
            } else if (field === 'auth' || field === 'general') {
                // Show global form error
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message text-red-500 text-sm mb-4 text-center';
                errorDiv.textContent = message;
                
                // Insert at the top of the form
                form.insertBefore(errorDiv, form.firstChild);
            }
        }
    }
}

// Initialize auth when imported
export const authManager = new AuthManager(); 