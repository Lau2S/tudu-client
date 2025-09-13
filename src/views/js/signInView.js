/**
 * @fileoverview Sign-in view initialization and authentication handling.
 * @author Tudu Development Team
 * @version 1.0.0
 */

import { forgotPassword, isAuthenticated, loginUser } from '../../services/userService.js';
import { showSuccessToast, showToast } from '../../utils/notifications.js';

/**
 * Initializes the sign-in view with authentication and password recovery.
 * @public
 */
export function initSignin() {
  const form = document.getElementById("sign-in-form");
  const emailInput = document.getElementById("sign-in-email");
  const passInput = document.getElementById("sign-in-password");
  const submitBtn = form?.querySelector('button[type="submit"]');

  const forgotLink = document.querySelector('.forgot-password-link');
  const modal = document.getElementById('recoveryPassword');
  const modalForm = document.getElementById('createTaskForm');
  const modalEmailInput = document.getElementById('forgotLink');
  const cancelBtn = document.getElementById('cancelTaskBtn');
  const closeBtn = modal?.querySelector('.close-modal');

  if (!form || !emailInput || !passInput || !submitBtn) {
    console.warn("initSignin: Missing required form elements");
    return;
  }

  if (form.dataset.tuduInit === "true") return;
  form.dataset.tuduInit = "true";

  if (isAuthenticated()) {
    location.hash = "#/dashboard";
    return;
  }

  if (forgotLink && modal) {
    forgotLink.addEventListener('click', () => {
      modal.style.display = 'block';
    });
  }
  closeBtn?.addEventListener('click', () => modal.style.display = 'none');
  cancelBtn?.addEventListener('click', () => modal.style.display = 'none');

  submitBtn.disabled = true;

  /**
   * Validates the sign-in form inputs.
   * @private
   */
  function validateForm() {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);
    const isValid = isValidEmail && password.length > 0;

    submitBtn.disabled = !isValid;
    submitBtn.classList.toggle("enabled", isValid);
  }

  emailInput.addEventListener("input", validateForm);
  passInput.addEventListener("input", validateForm);
  validateForm();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    validateForm();
    if (submitBtn.disabled) return;

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Iniciando sesión...";

    try {
      const data = await loginUser({
        email: emailInput.value.trim(),
        password: passInput.value.trim(),
      });

      localStorage.setItem("token", data.token);

      try {
        const tokenPayload = JSON.parse(atob(data.token.split(".")[1]));
        localStorage.setItem("userId", tokenPayload.userId);
        localStorage.setItem("userEmail", tokenPayload.email);
        console.log("Usuario logueado:", {
          userId: tokenPayload.userId,
          email: tokenPayload.email,
        });
      } catch (tokenError) {
        console.warn("No se pudo decodificar el token:", tokenError);
      }

      setTimeout(() => (location.hash = "#/dashboard"), 1000);
    } catch (err) {
      showToast("⚠️ Credenciales incorrectas");
      console.error("Login error:", err);
    } finally {
      submitBtn.textContent = originalText;
      validateForm();
    }
  });

  /**
   * Handles password recovery functionality.
   * @private
   */
  const recoveryForm = modal?.querySelector('form');
  const emailRecoveryInput = document.getElementById('forgotLink');

  if (recoveryForm && emailRecoveryInput) {
    recoveryForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailRecoveryInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        showToast("⚠️ Por favor ingresa un email válido");
        return;
      }

      const submitRecoveryBtn = recoveryForm.querySelector('button[type="submit"]');
      const originalRecoveryText = submitRecoveryBtn.textContent;

      try {
        submitRecoveryBtn.disabled = true;
        submitRecoveryBtn.textContent = "Enviando...";

        await forgotPassword(email);

        showSuccessToast("✅ Revisa tu correo para continuar");

        modal.style.display = 'none';
        emailRecoveryInput.value = '';

      } catch (err) {
        showToast("❌ " + (err?.message || "Error al enviar correo de recuperación"));
        console.error("Forgot password error:", err);
      } finally {
        submitRecoveryBtn.disabled = false;
        submitRecoveryBtn.textContent = originalRecoveryText;
      }
    });
  }
}
