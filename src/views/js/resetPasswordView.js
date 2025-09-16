/**
 * @fileoverview Password reset view initialization and handling.
 * @author Tudu Development Team
 * @version 1.0.0
 */

import { resetPassword } from '../../services/userService.js';
import { showToast } from '../../utils/notifications.js';

/**
 * Initializes the password reset view with token validation.
 * @param {string} token - JWT token for password reset
 * @public
 */
export function initResetPassword(token) {
  console.log('Initializing reset password with token:', token);

  if (!token) {
    showToast('Token de recuperación inválido', 'error');
    window.location.hash = '#/sign-in';
    return;
  }

  const form = document.getElementById('reset-password-form');
  const passwordInput = document.getElementById('reset-pass');
  const confirmPasswordInput = document.getElementById('confirm-reset-password');
  const submitButton = document.getElementById('reset-password-btn');

  if (!form || !passwordInput || !confirmPasswordInput || !submitButton) {
    console.error('Reset password form elements not found');
    return;
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  function validatePasswords() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    const isPasswordValid = passwordRegex.test(password);
    const doPasswordsMatch = password === confirmPassword;
    const isValid = isPasswordValid && doPasswordsMatch && password.trim() !== '';

    submitButton.disabled = !isValid;

    if (confirmPassword && password !== confirmPassword) {
      confirmPasswordInput.style.borderColor = '#ff4757';
    } else {
      confirmPasswordInput.style.borderColor = '';
    }

    if (password && !passwordRegex.test(password)) {
      passwordInput.style.borderColor = '#ff4757';
    } else {
      passwordInput.style.borderColor = '';
    }
  }

  passwordInput.addEventListener('input', validatePasswords);
  confirmPasswordInput.addEventListener('input', validatePasswords);

  async function handleSubmit(e) {
    e.preventDefault();

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!passwordRegex.test(password)) {
      showToast('La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y carácter especial', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.textContent = 'Actualizando...';

      await resetPassword(token, {
        password: password,
        confirmPassword: confirmPassword
      });

      showToast('✅ Contraseña actualizada correctamente', 'success');

      setTimeout(() => {
        window.location.hash = '#/sign-in';
      }, 2000);

    } catch (error) {
      console.error('Reset password error:', error);
      showToast('Error: ' + (error.message || 'No se pudo actualizar la contraseña'), 'error');

      submitButton.disabled = false;
      submitButton.textContent = 'Actualizar';
    }
  }

  form.addEventListener('submit', handleSubmit);
}
