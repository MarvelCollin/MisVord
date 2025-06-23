import { MisVordAjax } from "../../core/ajax/ajax-handler.js";
import { showToast } from "../../core/ui/toast.js";

export class AuthManager {
  constructor() {
    const isAuthPage =
      document.body && document.body.getAttribute("data-page") === "auth";

    if (!isAuthPage) {
      this.init();
    }
  }

  init() {
    if (typeof window !== "undefined" && window.logger) {
      window.logger.info("auth", "Auth manager initialized");
    }

    document.addEventListener("DOMContentLoaded", () => {
      if (document.body.getAttribute("data-page") === "auth") {
        if (window.logger) {
          window.logger.debug(
            "auth",
            "Auth page detected, skipping auth component initialization"
          );
        }
        return;
      }
      this.initAuthForms();
    });
  }

  initAuthForms() {
    if (window.logger) {
      window.logger.debug(
        "auth",
        "Auth forms will use traditional submission (no AJAX)"
      );
    }

    this.initFormSwitchLinks();
  }

  initFormSwitchLinks() {
    const switchLinks = document.querySelectorAll("[data-form-switch]");

    switchLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const targetForm = this.getAttribute("data-form-switch");
        AuthManager.switchActiveForm(targetForm);
      });
    });
  }

  static switchActiveForm(formType) {
    const forms = document.querySelectorAll(".auth-form");
    forms.forEach((form) => form.classList.add("hidden"));

    const targetForm = document.getElementById(`${formType}-form-container`);
    if (targetForm) {
      targetForm.classList.remove("hidden");

      const newUrl = `/${formType}`;
      history.pushState({}, "", newUrl);

      const firstInput = targetForm.querySelector("input");
      if (firstInput) {
        firstInput.focus();
      }
    }
  }

  handleLogin(e) {
    e.preventDefault();

    const form = e.target;
    this.clearFormErrors(form);

    MisVordAjax.submitForm(form, {
      onSuccess: (response) => {
        if (window.logger) {
          window.logger.info("auth", "Login response received:", response);
        }

        if (response.success) {
          showToast("Login successful. Redirecting...", "success");

          const redirectUrl = response.redirect || "/home";
          if (window.logger) {
            window.logger.debug("auth", "Redirecting to:", redirectUrl);
          }

          setTimeout(() => {
            if (window.logger) {
              window.logger.debug("auth", "Executing redirect...");
            }
            window.location.replace(redirectUrl);
          }, 500);
        } else {
          if (window.logger) {
            window.logger.warn("auth", "Login response success was false");
          }
        }
      },
      onError: (error) => {
        const errors = error.data?.errors || {};
        this.displayFormErrors(form, errors);

        if (error.data?.message) {
          showToast(error.data.message, "error");
        }
      },
    });
  }

  handleRegister(e) {
    e.preventDefault();

    const form = e.target;
    this.clearFormErrors(form);

    const password = form.querySelector('[name="password"]').value;
    const confirmPassword = form.querySelector(
      '[name="password_confirm"]'
    ).value;

    if (password !== confirmPassword) {
      this.displayFormErrors(form, {
        password_confirm: "Passwords do not match",
      });
      return;
    }

    MisVordAjax.submitForm(form, {
      onSuccess: (response) => {
        if (window.logger) {
          window.logger.info("auth", "Register response received:", response);
        }

        if (response.success) {
          showToast("Registration successful. Redirecting...", "success");

          const redirectUrl = response.redirect || "/home";
          if (window.logger) {
            window.logger.debug("auth", "Redirecting to:", redirectUrl);
          }

          setTimeout(() => {
            if (window.logger) {
              window.logger.debug("auth", "Executing redirect...");
            }
            window.location.replace(redirectUrl);
          }, 500);
        } else {
          if (window.logger) {
            window.logger.warn("auth", "Register response success was false");
          }
        }
      },
      onError: (error) => {
        const errors = error.data?.errors || {};
        this.displayFormErrors(form, errors);

        if (error.data?.message) {
          showToast(error.data.message, "error");
        }
      },
    });
  }

  handleForgotPassword(e) {
    e.preventDefault();

    const form = e.target;
    this.clearFormErrors(form);

    MisVordAjax.submitForm(form, {
      onSuccess: (response) => {
        if (response.success) {
          showToast(
            response.message || "Password reset instructions have been sent.",
            "success"
          );

          form.reset();

          setTimeout(() => {
            AuthManager.switchActiveForm("login");
          }, 2000);
        }
      },
      onError: (error) => {
        const errors = error.data?.errors || {};
        this.displayFormErrors(form, errors);

        if (error.data?.message) {
          showToast(error.data.message, "error");
        }
      },
    });
  }

  clearFormErrors(form) {
    const errorMessages = form.querySelectorAll(".error-message");
    errorMessages.forEach((el) => el.remove());

    const invalidInputs = form.querySelectorAll(".is-invalid");
    invalidInputs.forEach((input) => {
      input.classList.remove("is-invalid", "border-red-500");
    });
  }

  displayFormErrors(form, errors) {
    for (const field in errors) {
      const input = form.querySelector(`[name="${field}"]`);
      const message = errors[field];

      if (input) {
        input.classList.add("is-invalid", "border-red-500");

        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message text-red-500 text-xs mt-1";
        errorDiv.textContent = message;

        input.parentNode.insertBefore(errorDiv, input.nextSibling);
      } else if (field === "auth" || field === "general") {
        const errorDiv = document.createElement("div");
        errorDiv.className =
          "error-message text-red-500 text-sm mb-4 text-center";
        errorDiv.textContent = message;

        form.insertBefore(errorDiv, form.firstChild);
      }
    }
  }
}

const isAuthPage =
  document.body && document.body.getAttribute("data-page") === "auth";
export const authManager = !isAuthPage ? new AuthManager() : null;

// Update all redirects from /app to /home
function updateRedirectUrls(response) {
    if (response && response.redirect && response.redirect === '/app') {
        response.redirect = '/home';
    }
    return response;
}

function handleResponse(response) {
    response = updateRedirectUrls(response);
    const redirectUrl = response.redirect || "/home";
    
    if (redirectUrl) {
        // Clear any cached data before redirecting
        sessionStorage.removeItem('auth_in_progress');
        
        // Add a timestamp parameter to bust cache
        const timestampedUrl = redirectUrl.includes('?') 
            ? `${redirectUrl}&_t=${Date.now()}` 
            : `${redirectUrl}?_t=${Date.now()}`;
            
        console.log("Redirecting to:", timestampedUrl);
        window.location.href = timestampedUrl;
    }
}

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Set a flag to indicate authentication is in progress
            sessionStorage.setItem('auth_in_progress', 'true');
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const captcha = document.getElementById('login_captcha').value;
            
            // Disable the submit button to prevent double submissions
            const submitButton = loginForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = 'Logging in...';
            }
            
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    captcha: captcha
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    // If login was successful
                    localStorage.setItem('user_token', 'authenticated');
                    
                    // Set a flag to connect socket after login
                    localStorage.setItem('connect_socket_on_login', 'true');
                    
                    handleResponse(data);
                } else {
                    // Re-enable submit button
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.innerHTML = 'Log In';
                    }
                    
                    // Show error
                    sessionStorage.removeItem('auth_in_progress');
                    
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'bg-red-500 text-white p-3 rounded-md mb-4 text-center animate-pulse';
                    errorDiv.textContent = data.message || 'Login failed. Please try again.';
                    
                    // Find where to insert error
                    const firstFormGroup = loginForm.querySelector('.form-group');
                    if (firstFormGroup) {
                        loginForm.insertBefore(errorDiv, firstFormGroup);
                    } else {
                        loginForm.prepend(errorDiv);
                    }
                }
            })
            .catch(error => {
                console.error('Error during login:', error);
                
                // Re-enable submit button
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Log In';
                }
                
                // Clear auth in progress flag
                sessionStorage.removeItem('auth_in_progress');
                
                // Show error
                const errorDiv = document.createElement('div');
                errorDiv.className = 'bg-red-500 text-white p-3 rounded-md mb-4 text-center animate-pulse';
                errorDiv.textContent = 'Connection error. Please try again.';
                
                // Find where to insert error
                const firstFormGroup = loginForm.querySelector('.form-group');
                if (firstFormGroup) {
                    loginForm.insertBefore(errorDiv, firstFormGroup);
                } else {
                    loginForm.prepend(errorDiv);
                }
            });
        });
    }
});
