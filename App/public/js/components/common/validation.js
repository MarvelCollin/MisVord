const FormValidator = {
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    validatePassword(password, minLength = 8) {
        if (!password || password.length < minLength) {
            return {
                valid: false,
                message: `Password must be at least ${minLength} characters`
            };
        }

        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);

        if (!hasUppercase) {
            return {
                valid: false,
                message: 'Password must contain at least one uppercase letter'
            };
        }

        if (!hasNumber) {
            return {
                valid: false,
                message: 'Password must contain at least one number'
            };
        }

        return { valid: true };
    },

    validatePasswordMatch(password, confirmPassword) {
        return {
            valid: password === confirmPassword,
            message: 'Passwords do not match'
        };
    },

    validateUsername(username) {
        if (!username || username.length < 3) {
            return {
                valid: false,
                message: 'Username must be at least 3 characters'
            };
        }

        if (username.length > 32) {
            return {
                valid: false,
                message: 'Username cannot exceed 32 characters'
            };
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return {
                valid: false,
                message: 'Username can only contain letters, numbers, and underscores'
            };
        }

        return { valid: true };
    },

    validateSecurityQuestion(question) {
        return {
            valid: !!question && question.length > 0,
            message: 'Please select a security question'
        };
    },

    validateSecurityAnswer(answer) {
        if (!answer || answer.length < 3) {
            return {
                valid: false,
                message: 'Security answer must be at least 3 characters'
            };
        }
        return { valid: true };
    },

    calculatePasswordStrength(password) {
        if (!password) return 0;

        let score = 0;
        
        score += Math.min(password.length * 4, 40);
        if (/[A-Z]/.test(password)) score += 15;
        if (/[a-z]/.test(password)) score += 10;
        if (/[0-9]/.test(password)) score += 15;
        if (/[^A-Za-z0-9]/.test(password)) score += 20;

        return Math.min(score, 100);
    },

    showFieldError(field, message) {
        field.classList.add('border-red-500');

        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 text-sm mt-1 validation-error';
        errorDiv.textContent = message;

        const parent = field.parentNode;
        if (parent.classList.contains('relative')) {
            parent.parentNode.appendChild(errorDiv);
        } else {
            parent.appendChild(errorDiv);
        }

        field.classList.add('animate-shake');
        setTimeout(() => {
            field.classList.remove('animate-shake');
        }, 500);
    },

    clearErrors(form) {
        const errors = form.querySelectorAll('.validation-error');
        errors.forEach(error => error.remove());

        const errorFields = form.querySelectorAll('.border-red-500');
        errorFields.forEach(field => field.classList.remove('border-red-500'));
    },

    validateLoginForm(form) {
        this.clearErrors(form);
        let isValid = true;

        const email = form.querySelector('#email');
        const password = form.querySelector('#password');
        const captcha = form.querySelector('#login_captcha');

        if (!email.value) {
            this.showFieldError(email, 'Email is required');
            isValid = false;
        } else if (!this.validateEmail(email.value)) {
            this.showFieldError(email, 'Please enter a valid email address');
            isValid = false;
        }

        if (!password.value) {
            this.showFieldError(password, 'Password is required');
            isValid = false;
        }

        if (captcha && !captcha.value) {
            this.showFieldError(captcha, 'Please complete the captcha');
            isValid = false;
        }

        return isValid;
    },

    validateRegisterForm(form) {
        this.clearErrors(form);
        let isValid = true;

        const username = form.querySelector('#username');
        const email = form.querySelector('#reg_email');
        const password = form.querySelector('#reg_password');
        const confirmPassword = form.querySelector('#password_confirm');
        const securityQuestion = form.querySelector('#security_question');
        const securityAnswer = form.querySelector('#security_answer');
        const captcha = form.querySelector('#register_captcha');

        const usernameValidation = this.validateUsername(username.value);
        if (!usernameValidation.valid) {
            this.showFieldError(username, usernameValidation.message);
            isValid = false;
        }

        if (!email.value) {
            this.showFieldError(email, 'Email is required');
            isValid = false;
        } else if (!this.validateEmail(email.value)) {
            this.showFieldError(email, 'Please enter a valid email address');
            isValid = false;
        }

        const passwordValidation = this.validatePassword(password.value);
        if (!passwordValidation.valid) {
            this.showFieldError(password, passwordValidation.message);
            isValid = false;
        }

        const passwordMatchValidation = this.validatePasswordMatch(
            password.value, confirmPassword.value
        );
        if (!passwordMatchValidation.valid) {
            this.showFieldError(confirmPassword, passwordMatchValidation.message);
            isValid = false;
        }

        const questionValidation = this.validateSecurityQuestion(securityQuestion.value);
        if (!questionValidation.valid) {
            this.showFieldError(securityQuestion, questionValidation.message);
            isValid = false;
        }

        const answerValidation = this.validateSecurityAnswer(securityAnswer.value);
        if (!answerValidation.valid) {
            this.showFieldError(securityAnswer, answerValidation.message);
            isValid = false;
        }

        if (captcha && !captcha.value) {
            this.showFieldError(captcha, 'Please complete the captcha');
            isValid = false;
        }

        return isValid;
    },

    validateForgotForm(form) {
        this.clearErrors(form);
        let isValid = true;

        const email = form.querySelector('#forgot_email');
        const securityAnswer = form.querySelector('#security_answer');
        
        if (email && !email.value) {
            this.showFieldError(email, 'Email is required');
            isValid = false;
        } else if (email && !this.validateEmail(email.value)) {
            this.showFieldError(email, 'Please enter a valid email address');
            isValid = false;
        }
        
        if (securityAnswer && !securityAnswer.value) {
            this.showFieldError(securityAnswer, 'Security answer is required');
            isValid = false;
        }

        return isValid;
    },

    validateResetPasswordForm(form) {
        this.clearErrors(form);
        let isValid = true;

        const password = form.querySelector('#new_password');
        const confirmPassword = form.querySelector('#confirm_new_password');

        const passwordValidation = this.validatePassword(password.value);
        if (!passwordValidation.valid) {
            this.showFieldError(password, passwordValidation.message);
            isValid = false;
        }

        const passwordMatchValidation = this.validatePasswordMatch(
            password.value, confirmPassword.value
        );
        if (!passwordMatchValidation.valid) {
            this.showFieldError(confirmPassword, passwordMatchValidation.message);
            isValid = false;
        }

        return isValid;
    },

    validateSecurityQuestionForm(form) {
        this.clearErrors(form);
        let isValid = true;

        const question = form.querySelector('#google_security_question');
        const answer = form.querySelector('#google_security_answer');

        const questionValidation = this.validateSecurityQuestion(question.value);
        if (!questionValidation.valid) {
            this.showFieldError(question, questionValidation.message);
            isValid = false;
        }

        const answerValidation = this.validateSecurityAnswer(answer.value);
        if (!answerValidation.valid) {
            this.showFieldError(answer, answerValidation.message);
            isValid = false;
        }

        return isValid;
    }
};

export default FormValidator;
