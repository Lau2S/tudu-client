/**
 * @fileoverview Sign-up view initialization and form handling.
 * @author Tudu Development Team
 * @version 1.0.0
 */

import { registerUser } from '../../services/userService.js';

/**
 * Initializes the sign-up view with form validation and submission handling.
 * Implements real-time validation for email, password strength, confirmation, and age.
 * @public
 */
export function initSignup() {
  const form = document.getElementById("sign-up-form");
  if (!form) return;
  if (form.dataset.tuduInit === "true") return;
  form.dataset.tuduInit = "true";

  const nombreInput = document.getElementById("name");
  const apellidoInput = document.getElementById("last-name");
  const emailInput = document.getElementById("sign-up-email");
  const passInput = document.getElementById("sign-up-password");
  const confirmInput = document.getElementById("confirm-password");
  const ageInput = document.getElementById("age");
  const submitBtn =
    document.getElementById("sign-up-button") ||
    form.querySelector('button[type="submit"]');

  if (!emailInput || !passInput || !confirmInput || !ageInput || !submitBtn)
    return;

  let confirmError = document.createElement("div");
  confirmError.style.color = "red";
  confirmError.style.fontSize = "0.85rem";
  confirmError.style.marginTop = "-0.5rem";
  confirmError.style.marginBottom = "0.8rem";
  confirmError.style.display = "none";
  confirmInput.parentNode.insertBefore(confirmError, confirmInput.nextSibling);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  /**
   * Validates the sign-up form inputs in real-time.
   * @private
   */
  function validateForm() {
    const email = (emailInput.value || "").trim();
    const password = (passInput.value || "").trim();
    const confirm = (confirmInput.value || "").trim();
    const age = (ageInput.value || "").trim();

    let valid = true;
    const errors = [];

    if (!emailRegex.test(email)) {
      valid = false;
      errors.push("email");
    }
    if (!passwordRegex.test(password)) {
      valid = false;
      errors.push("password");
    }
    if (password !== confirm) {
      valid = false;
      errors.push("confirm");
      confirmError.textContent = "❌ Las contraseñas no coinciden";
      confirmError.style.display = "block";
    } else {
      confirmError.textContent = "";
      confirmError.style.display = "none";
    }

    if (!/^\d+$/.test(age) || Number(age) < 13) {
      valid = false;
      errors.push("age");
    }

    submitBtn.disabled = !valid;
    submitBtn.classList.toggle("enabled", valid);
    if (!valid) {
      submitBtn.setAttribute("title", "Corrige: " + errors.join(", "));
    } else {
      submitBtn.removeAttribute("title");
    }
  }

  [emailInput, passInput, confirmInput, ageInput].forEach((input) => {
    input.addEventListener("input", validateForm);
  });

  validateForm();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    validateForm();
    if (submitBtn.disabled) return;

    submitBtn.disabled = true;

    const nombre = nombreInput ? nombreInput.value.trim() : "";
    const apellido = apellidoInput ? apellidoInput.value.trim() : "";
    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    const age = ageInput.value.trim();

    try {
      await registerUser({ nombre, apellido, email, password, age });
      alert("✅ Registro exitoso 🎉");
      setTimeout(() => (location.hash = "#/sign-in"), 400);
    } catch (err) {
      alert("❌ No se pudo registrar: " + (err?.message || err));
      console.error("registerUser error", err);
      validateForm();
    } finally {
      validateForm();
    }
  });

  /**
   * Initializes dynamic password validation
   * @private
   */
  function initPasswordValidation() {
    const passwordInput = document.getElementById("sign-up-password");

    if (!passwordInput) {
      console.warn("Password input not found");
      return;
    }

    // Add event listeners for real-time validation
    passwordInput.addEventListener("input", validatePasswordRequirements);
    passwordInput.addEventListener("focus", showPasswordRequirements);
    passwordInput.addEventListener("blur", hidePasswordRequirementsIfEmpty);
  }

  /**
   * Validates password requirements in real-time
   * @private
   */
  function validatePasswordRequirements() {
    const passwordInput = document.getElementById("sign-up-password");
    const password = passwordInput.value;
    const requirementsDiv = document.querySelector(".password-requirements");

    // Get requirement elements
    const requirements = {
      length: document.getElementById("req-length"),
      uppercase: document.getElementById("req-uppercase"),
      lowercase: document.getElementById("req-lowercase"),
      number: document.getElementById("req-number"),
      special: document.getElementById("req-special")
    };

    // Validation rules
    const validations = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Check if any requirement is failing
    const hasFailingRequirements = Object.values(validations).some(valid => !valid);
    const hasPassword = password.length > 0;

    // Show requirements only if there's a password and some requirements are failing
    if (requirementsDiv) {
      if (hasPassword && hasFailingRequirements) {
        requirementsDiv.classList.add("show");
      } else {
        requirementsDiv.classList.remove("show");
      }
    }

    // Update each requirement's visual state
    Object.keys(requirements).forEach(key => {
      const element = requirements[key];
      const isValid = validations[key];

      if (element) {
        if (isValid) {
          element.classList.remove("invalid");
          element.classList.add("valid");
        } else {
          element.classList.remove("valid");
          element.classList.add("invalid");
        }
      }
    });

    // Update button state based on all validations
    updateSignUpButtonState();
  }

  /**
   * Shows password requirements when focusing on password field
   * @private
   */
  function showPasswordRequirements() {
    const passwordInput = document.getElementById("sign-up-password");
    const requirementsDiv = document.querySelector(".password-requirements");

    // Only show if there's a password and it has failing requirements
    if (requirementsDiv && passwordInput) {
      const password = passwordInput.value;
      const hasPassword = password.length > 0;
      const passwordValid = password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (hasPassword && !passwordValid) {
        requirementsDiv.classList.add("show");
      }
    }
  }

  /**
   * Hides password requirements if password field is empty or all requirements are met
   * @private
   */
  function hidePasswordRequirementsIfEmpty() {
    const passwordInput = document.getElementById("sign-up-password");
    const requirementsDiv = document.querySelector(".password-requirements");

    if (requirementsDiv && passwordInput) {
      const password = passwordInput.value.trim();

      // Hide if password is empty
      if (password === "") {
        requirementsDiv.classList.remove("show");
      }
    }
  }

  /**
     * Updates sign up button state based on form validation
     * @private
     */
  function updateSignUpButtonState() {
    const button = document.getElementById("sign-up-button");
    const passwordInput = document.getElementById("sign-up-password");
    const emailInput = document.getElementById("sign-up-email");
    const firstNameInput = document.getElementById("sign-up-first-name");
    const lastNameInput = document.getElementById("sign-up-last-name");
    const ageInput = document.getElementById("sign-up-age");

    if (!button || !passwordInput || !emailInput || !firstNameInput || !lastNameInput || !ageInput) {
      return;
    }

    const password = passwordInput.value;
    const email = emailInput.value.trim();
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const age = parseInt(ageInput.value);

    // Check if all password requirements are met
    const passwordValid = password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // Check if all other fields are filled
    const fieldsValid = email && firstName && lastName && age >= 13;

    // Enable/disable button
    button.disabled = !(passwordValid && fieldsValid);
  }

  initPasswordValidation();
}
