import { MisVordAjax } from '../../core/ajax/ajax-handler.js';
import { showToast } from '../../core/ui/toast.js';

export class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('Auth manager initialized');
        document.addEventListener('DOMContentLoaded', () => {
            this.initAuthForms();
        });
    }    initAuthForms() {

        console.log('🔄 Auth forms will use traditional submission (no AJAX)');

        this.initFormSwitchLinks();

    }

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

    static switchActiveForm(formType) {

        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => form.classList.add('hidden'));

        const targetForm = document.getElementById(`${formType}-form-container`);
        if (targetForm) {
            targetForm.classList.remove('hidden');

            const newUrl = `/${formType}`;
            history.pushState({}, '', newUrl);

            const firstInput = targetForm.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        }
    }    handleLogin(e) {
        e.preventDefault();

        const form = e.target;
        this.clearFormErrors(form);        MisVordAjax.submitForm(form, {
            onSuccess: (response) => {
                console.log('🎉 Login response received:', response);
                  if (response.success) {
                    showToast('Login successful. Redirecting...', 'success');

                    const redirectUrl = response.redirect || '/app';
                    console.log('🔄 Redirecting to:', redirectUrl);

                    setTimeout(() => {
                        console.log('🚀 Executing redirect...');
                        window.location.replace(redirectUrl);
                    }, 500);
                } else {
                    console.log('❌ Login response success was false');
                }
            },
            onError: (error) => {
                const errors = error.data?.errors || {};
                this.displayFormErrors(form, errors);

                if (error.data?.message) {
                    showToast(error.data.message, 'error');
                }
            }
        });
    }    handleRegister(e) {
        e.preventDefault();

        const form = e.target;
        this.clearFormErrors(form);

        const password = form.querySelector('[name="password"]').value;
        const confirmPassword = form.querySelector('[name="password_confirm"]').value;

        if (password !== confirmPassword) {
            this.displayFormErrors(form, {
                password_confirm: 'Passwords do not match'
            });
            return;
        }        MisVordAjax.submitForm(form, {
            onSuccess: (response) => {
                console.log('🎉 Register response received:', response);
                  if (response.success) {
                    showToast('Registration successful. Redirecting...', 'success');

                    const redirectUrl = response.redirect || '/app';
                    console.log('🔄 Redirecting to:', redirectUrl);

                    setTimeout(() => {
                        console.log('🚀 Executing redirect...');
                        window.location.replace(redirectUrl);
                    }, 500);
                } else {
                    console.log('❌ Register response success was false');
                }
            },
            onError: (error) => {
                const errors = error.data?.errors || {};
                this.displayFormErrors(form, errors);

                if (error.data?.message) {
                    showToast(error.data.message, 'error');
                }
            }
        });    }

    handleForgotPassword(e) {
        e.preventDefault();

        const form = e.target;
        this.clearFormErrors(form);

        MisVordAjax.submitForm(form, {
            onSuccess: (response) => {
                if (response.success) {
                    showToast(response.message || 'Password reset instructions have been sent.', 'success');

                    form.reset();

                    setTimeout(() => {
                        AuthManager.switchActiveForm('login');
                    }, 2000);
                }
            },
            onError: (error) => {
                const errors = error.data?.errors || {};
                this.displayFormErrors(form, errors);

                if (error.data?.message) {
                    showToast(error.data.message, 'error');
                }
            }
        });
    }

    clearFormErrors(form) {

        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(el => el.remove());

        const invalidInputs = form.querySelectorAll('.is-invalid');
        invalidInputs.forEach(input => {
            input.classList.remove('is-invalid', 'border-red-500');
        });
    }

    displayFormErrors(form, errors) {
        for (const field in errors) {
            const input = form.querySelector(`[name="${field}"]`);
            const message = errors[field];

            if (input) {

                input.classList.add('is-invalid', 'border-red-500');

                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message text-red-500 text-xs mt-1';
                errorDiv.textContent = message;

                input.parentNode.insertBefore(errorDiv, input.nextSibling);
            } else if (field === 'auth' || field === 'general') {

                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message text-red-500 text-sm mb-4 text-center';
                errorDiv.textContent = message;

                form.insertBefore(errorDiv, form.firstChild);
            }
        }
    }
}

export const authManager = new AuthManager();