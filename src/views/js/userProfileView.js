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
  initDeleteAccountModal();
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

  // Inicializar validación de edad
  initAgeValidation();

  // Inicializar modal de confirmación
  initEditProfileModal();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstNameInput = document.getElementById('name');
    const lastNameInput = document.getElementById('last-name');
    const emailInput = document.getElementById('email');
    const ageInput = document.getElementById('age');

    const firstName = firstNameInput ? firstNameInput.value.trim() : '';
    const lastName = lastNameInput ? lastNameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const age = ageInput ? ageInput.value : '';

    if (!firstName || !lastName || !email || !age) {
      showToast("Nombre, apellido, edad y correo son obligatorios", "error");
      return;
    }

    if (age < 13) {
      showToast("La edad debe ser mayor o igual a 13 años", "error");
      return;
    }

    // Mostrar modal de confirmación en lugar de guardar directamente
    const modal = document.getElementById("editProfileModal");
    if (modal) {
      modal.style.display = "block";
    }
  });
}

/**
 * Initializes the edit profile confirmation modal.
 * @private
 */
function initEditProfileModal() {
  const modal = document.getElementById("editProfileModal");
  const closeButtons = modal?.querySelectorAll(".close-modal");
  const confirmBtn = document.getElementById("confirmEditProfile");
  const cancelBtn = document.getElementById("cancelEditProfileBtn");

  if (!modal) {
    console.warn("Edit profile modal not found");
    return;
  }

  // Cerrar modal con botones de cerrar (X y cancelar)
  closeButtons?.forEach(btn => {
    btn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  });

  // Cerrar con botón cancelar específico
  cancelBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Cerrar al hacer click fuera del modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Confirmar cambios
  confirmBtn?.addEventListener("click", async () => {
    modal.style.display = "none";
    await executeProfileUpdate();
  });
}

/**
 * Executes the profile update process
 * @private
 */
async function executeProfileUpdate() {
  const saveBtn = document.querySelector("button");
  const firstNameInput = document.getElementById('name');
  const lastNameInput = document.getElementById('last-name');
  const emailInput = document.getElementById('email');
  const ageInput = document.getElementById('age');

  const firstName = firstNameInput ? firstNameInput.value.trim() : '';
  const lastName = lastNameInput ? lastNameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const age = ageInput ? ageInput.value : '';

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Guardando...";
    }

    const currentUser = getCurrentUser();

    const updateData = {
      firstName,
      lastName,
      email,
      age: parseInt(age),
    };

    await updateUserProfile(currentUser.userId, updateData);

    showSuccessToast("✅ Perfil actualizado correctamente");

    setTimeout(() => {
      location.hash = "#/dashboard";
    }, 1500);

  } catch (error) {
    console.error("Error updating profile:", error);
    showToast("Error al actualizar el perfil: " + (error.message || error), "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar Cambios";
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

/**
 * Initializes the delete account modal and its functionality
 * @private
 */
function initDeleteAccountModal() {
  const deleteLink = document.querySelector(".delete-count-link");
  const modal = document.getElementById("deleteUser");
  const closeBtn = modal?.querySelector(".close-modal");
  const cancelBtn = document.getElementById("cancelTaskBtn");
  const form = modal?.querySelector("form");
  const deleteInput = document.getElementById("deleteLink");

  if (!deleteLink || !modal || !form) {
    console.warn("Delete account modal elements not found");
    return;
  }

  // Abrir modal al hacer click en el link
  deleteLink.addEventListener("click", () => {
    modal.style.display = "block";
    if (deleteInput) deleteInput.value = ""; // Limpiar el input
  });

  // Cerrar modal con el botón X
  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Cerrar modal con el botón cancelar
  cancelBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Cerrar al hacer click fuera del modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Manejar el envío del formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const confirmText = deleteInput?.value.trim();

    if (confirmText !== "ELIMINAR") {
      showToast("Por favor, escribe 'ELIMINAR' para confirmar", "error");
      return;
    }

    const submitBtn = document.getElementById("sendEmail");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Eliminando...";
    }

    try {
      // Aquí irá la lógica para eliminar la cuenta
      // await deleteUserAccount();
      showSuccessToast("Cuenta eliminada correctamente");
      setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        location.hash = "#/sign-in";
      }, 1500);
    } catch (error) {
      console.error("Error eliminando cuenta:", error);
      showToast("Error al eliminar la cuenta: " + (error.message || error), "error");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Eliminar Cuenta";
      }
    }
  });
}
