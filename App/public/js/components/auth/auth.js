export class AuthManager {
  constructor() {
    this.init();
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

export const authManager = new AuthManager();
