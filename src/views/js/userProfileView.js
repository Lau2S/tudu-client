/**
 * @fileoverview User profile view initialization and management.
 * @author Tudu Development Team
 * @version 1.0.0
 */

import { getCurrentUser, getUserProfile, isAuthenticated, logoutUser, updateUserProfile } from '../../services/userService.js';
import { showSuccessToast, showToast } from '../../utils/notifications.js';

/**
 * Initializes the user profile view with authentication protection.
 * @public
 */
export async function initUserProfile() {
  if (!isAuthenticated()) {
    location.hash = "#/sign-in";
    return;
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    location.hash = "#/sign-in";
    return;
  }

  await loadUserData();
  initUserDropdown();
  initProfileForm();
}

/**
 * Loads user data from backend and populates the form.
 * @private
 */
async function loadUserData() {
  try {
    const currentUser = getCurrentUser();
    const userProfile = await getUserProfile(currentUser.userId);

    // Actualizar información en la cabecera
    const profileAvatar = document.querySelector(".profile-avatar");
    const userNameHeader = document.querySelector(".info-usuario h2");
    const userEmailHeader = document.querySelector(".info-usuario p");

    if (userProfile.firstName && userProfile.lastName) {
      const fullName = `${userProfile.firstName} ${userProfile.lastName}`;
      userNameHeader.textContent = fullName;
      profileAvatar.textContent = userProfile.firstName[0].toUpperCase();
    }

    userEmailHeader.textContent = userProfile.email;

    // Poblar el formulario usando los IDs específicos
    const nameInput = document.getElementById('name');
    const lastNameInput = document.getElementById('last-name');
    const emailInput = document.getElementById('email');
    const ageInput = document.getElementById('age');
    const createAt = document.getElementById('createAt');

    if (nameInput) nameInput.value = userProfile.firstName || '';
    if (lastNameInput) lastNameInput.value = userProfile.lastName || '';
    if (emailInput) emailInput.value = userProfile.email || '';
    if (ageInput) ageInput.value = userProfile.age || '';
    if (createAt) {
      const createdDate = new Date(userProfile.createdAt);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      createAt.textContent = `Miembro desde el ${createdDate.toLocaleDateString('es-ES', options)}`;
    }

  } catch (error) {
    console.error("Error loading user data:", error);
    showToast("Error al cargar datos del usuario", "error");
  }
}

/**
 * Initializes the user dropdown menu.
 * @private
 */
function initUserDropdown() {
  const userProfile = document.querySelector(".user-profile");
  if (!userProfile) return;
  const dropdown = userProfile.querySelector(".user-dropdown");

  userProfile.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("active");
    userProfile.classList.toggle("active");
  });

  document.addEventListener("click", () => {
    dropdown.classList.remove("active");
    userProfile.classList.remove("active");
  });

  const taskOption = document.getElementById("taskOption");
  const logoutOption = document.getElementById("logoutOption");

  if (taskOption) {
    taskOption.addEventListener("click", () => {
      location.hash = "#/dashboard";
    });
  }

  if (logoutOption) {
    logoutOption.addEventListener("click", async () => {
      try {
        await logoutUser();
      } catch (err) {
        console.warn("Error en logout:", err);
      }
      localStorage.clear();
      sessionStorage.clear();
      location.hash = "#/sign-in";
      showToast("Sesión cerrada correctamente", "success");
    });
  }
}

/**
 * Initializes the profile form handlers.
 * @private
 */
function initProfileForm() {
  const form = document.querySelector(".profile-card");
  const saveBtn = document.querySelector("button");

  if (!form) return;

  // Inicializar validación de contraseña
  initPasswordValidation();

  // Inicializar validación de edad
  initAgeValidation();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstNameInput = document.getElementById('name');
    const lastNameInput = document.getElementById('last-name');
    const emailInput = document.getElementById('email');
    const ageInput = document.getElementById('age');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-new-password');

    const firstName = firstNameInput ? firstNameInput.value.trim() : '';
    const lastName = lastNameInput ? lastNameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const age = ageInput ? ageInput.value : '';
    const currentPassword = currentPasswordInput ? currentPasswordInput.value.trim() : '';
    const newPassword = newPasswordInput ? newPasswordInput.value.trim() : '';
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';

    if (!firstName || !lastName || !email || !age) {
      showToast("Nombre, apellido, edad y correo son obligatorios", "error");
      return;
    }

    if (age < 13) {
      showToast("La edad debe ser mayor o igual a 13 años", "error");
      return;
    }

    // Validar contraseña si se quiere cambiar
    if (newPassword) {
      if (!currentPassword) {
        showToast("Debes ingresar tu contraseña actual para cambiarla", "error");
        return;
      }

      if (newPassword !== confirmPassword) {
        showToast("Las nuevas contraseñas no coinciden", "error");
        return;
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        showToast("La nueva contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y carácter especial", "error");
        return;
      }
    }

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "Guardando...";

      const currentUser = getCurrentUser();

      const updateData = {
        firstName,
        lastName,
        email,
        age: parseInt(age),
      };

      // Agregar contraseña si se quiere cambiar
      if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.password = newPassword;
      }

      await updateUserProfile(currentUser.userId, updateData);

      // Actualizar localStorage con los nuevos datos
      const fullName = `${firstName} ${lastName}`;
      localStorage.setItem("userName", fullName);
      localStorage.setItem("userFirstName", firstName);
      localStorage.setItem("userEmail", email);

      showSuccessToast("✅ Perfil actualizado correctamente");

      // Limpiar campos de contraseña
      if (currentPasswordInput) currentPasswordInput.value = '';
      if (newPasswordInput) newPasswordInput.value = '';
      if (confirmPasswordInput) confirmPasswordInput.value = '';

      setTimeout(() => {
        location.hash = "#/dashboard";
      }, 1500);

    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Error al actualizar el perfil: " + (error.message || error), "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar Cambios";
    }
  });
}

/**
 * Initializes password validation for profile form
 * @private
 */
function initPasswordValidation() {
  const newPasswordInput = document.getElementById("new-password");
  const confirmPasswordInput = document.getElementById("confirm-new-password");

  if (!newPasswordInput || !confirmPasswordInput) {
    console.warn("Password inputs not found in profile form");
    return;
  }

  // Add event listeners for real-time validation
  newPasswordInput.addEventListener("input", validatePasswordRequirements);
  newPasswordInput.addEventListener("focus", showPasswordRequirements);
  newPasswordInput.addEventListener("blur", hidePasswordRequirementsIfEmpty);
  confirmPasswordInput.addEventListener("input", validatePasswordMatch);
}

/**
 * Validates password requirements in real-time
 * @private
 */
function validatePasswordRequirements() {
  const passwordInput = document.getElementById("new-password");
  const password = passwordInput ? passwordInput.value : '';
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

  // Also validate password match when new password changes
  validatePasswordMatch();
}

/**
 * Validates password confirmation match
 * @private
 */
function validatePasswordMatch() {
  const newPasswordInput = document.getElementById("new-password");
  const confirmPasswordInput = document.getElementById("confirm-new-password");
  const matchError = document.getElementById("password-match-error");

  if (!newPasswordInput || !confirmPasswordInput) return;

  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (confirmPassword && newPassword !== confirmPassword) {
    confirmPasswordInput.style.borderColor = '#ff4757';
    if (matchError) {
      matchError.style.display = 'block';
    }
  } else {
    confirmPasswordInput.style.borderColor = '';
    if (matchError) {
      matchError.style.display = 'none';
    }
  }
}

/**
 * Shows password requirements when focusing on password field
 * @private
 */
function showPasswordRequirements() {
  const passwordInput = document.getElementById("new-password");
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
  const passwordInput = document.getElementById("new-password");
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
 * Initializes age validation for profile form
 * @private
 */
function initAgeValidation() {
  const ageInput = document.getElementById("age");

  if (!ageInput) {
    console.warn("Age input not found in profile form");
    return;
  }

  // Add event listener for real-time validation
  ageInput.addEventListener("input", validateAge);
}

/**
 * Validates age requirement in real-time
 * @private
 */
function validateAge() {
  const ageInput = document.getElementById("age");
  const ageError = document.getElementById("age-error");

  if (!ageInput || !ageError) return;

  const age = parseInt(ageInput.value);

  if (ageInput.value && age < 13) {
    ageInput.style.borderColor = '#ff4757';
    ageError.style.display = 'block';
  } else {
    ageInput.style.borderColor = '';
    ageError.style.display = 'none';
  }
}
