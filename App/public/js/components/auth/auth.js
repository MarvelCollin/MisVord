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

  validatePassword(password, confirmPassword) {
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    
    return null;
  }
}

const isAuthPage =
  document.body && document.body.getAttribute("data-page") === "auth";
export const authManager = !isAuthPage ? new AuthManager() : null;

function addTimestampToUrl(url) {
  const timestamp = Date.now();
  return url.includes('?') 
    ? `${url}&_t=${timestamp}` 
    : `${url}?_t=${timestamp}`;
  }

document.addEventListener('DOMContentLoaded', function() {
  const authForms = document.querySelectorAll('form');
  authForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const timestampInput = document.createElement('input');
      timestampInput.type = 'hidden';
      timestampInput.name = '_t';
      timestampInput.value = Date.now();
      this.appendChild(timestampInput);
    });
  });
});
    
function showFormError(form, fieldName, message) {
  const field = form.querySelector(`#${fieldName}`) || form.querySelector(`[name="${fieldName}"]`);
  if (field) {
    field.classList.add('border-red-500');

    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-red-500 text-sm mt-1 error-message';
    errorDiv.textContent = message;

    if (field.parentNode.classList.contains('relative')) {
      field.parentNode.parentNode.appendChild(errorDiv);
    } else {
      field.parentNode.appendChild(errorDiv);
    }
  } else {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-500 text-white p-3 rounded-md mb-4 text-center animate-pulse';
    errorDiv.textContent = message;

    const firstFormGroup = form.querySelector('.form-group');
    if (firstFormGroup) {
      form.insertBefore(errorDiv, firstFormGroup);
    } else {
      form.prepend(errorDiv);
    }
  }
}
