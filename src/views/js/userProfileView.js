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

    // Poblar el formulario - usando los inputs existentes en orden
    const inputs = document.querySelectorAll('input');
    inputs[0].value = userProfile.firstName || ''; // Primer input (nombre)
    inputs[1].value = userProfile.lastName || '';  // Segundo input (apellido)
    inputs[2].value = userProfile.age || '';       // Tercer input (edad)

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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inputs = document.querySelectorAll('input');
    const firstName = inputs[0].value.trim();
    const lastName = inputs[1].value.trim();
    const age = inputs[2].value;
    const currentPassword = inputs[3].value.trim();
    const newPassword = inputs[4].value.trim();
    const confirmPassword = inputs[5].value.trim();

    if (!firstName || !lastName || !age) {
      showToast("Nombre, apellido y edad son obligatorios", "error");
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
        age: parseInt(age)
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

      showSuccessToast("✅ Perfil actualizado correctamente");

      // Limpiar campos de contraseña
      inputs[3].value = '';
      inputs[4].value = '';
      inputs[5].value = '';

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
