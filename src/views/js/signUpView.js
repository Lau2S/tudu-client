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
}
