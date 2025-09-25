/**
 * @fileoverview User profile view initialization and management.
 * @author Tudu Development Team
 * @version 1.0.0
 */

import { getCurrentUser, getUserProfile, isAuthenticated, logoutUser, updateUserProfile, validateUserPassword, deleteUserAccount } from '../../services/userService.js';
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
  initDeleteAccountButton();
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
 * Initializes the delete account button functionality.
 * @private
 */
function initDeleteAccountButton() {
  const deleteLink = document.querySelector('.delete-count-link');

  if (!deleteLink) {
    console.warn("Delete account link not found");
    return;
  }

  deleteLink.addEventListener('click', (e) => {
    e.preventDefault();
    showDeleteConfirmationModal();
  });
}

/**
 * Shows secure confirmation modal for account deletion with password validation.
 * @private
 */
function showDeleteConfirmationModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.id = 'deleteAccountModal';

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <span class="close-modal">&times;</span>
      <h2 style="color: var(--text-color); margin-bottom: 1rem; text-align: center;">Eliminar Cuenta</h2>
      <p style="margin-bottom: 1.5rem; line-height: 1.5; text-align: center; opacity: 0.50">
        Esta acción <strong>eliminará permanentemente</strong> tu cuenta y todos tus datos
      </p>

      <!-- Validación de contraseña -->
      <div class="form-group" style="margin-bottom: 1rem;">
        <label for="deletePassword" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
          Para confirmar, ingresa tu contraseña actual:
        </label>
        <input 
          type="password" 
          id="deletePassword" 
          placeholder="Ingresa tu contraseña actual" 
          style="width: 100%; padding: 12px; border: 1px solid #e9ecef; border-radius: 8px; box-sizing: border-box;"
          required 
        />
        <div id="passwordError" style="color: #dc3545; font-size: 0.85rem; margin-top: 0.5rem; display: none;">
          ❌ Contraseña incorrecta
        </div>
      </div>

      <!-- Confirmación por escrito -->
      <div class="form-group" style="margin-bottom: 2rem;">
        <label for="deleteConfirmText" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
          Escribe "ELIMINAR" para confirmar:
        </label>
        <input 
          type="text" 
          id="deleteConfirmText" 
          placeholder="Escribe ELIMINAR en mayúsculas" 
          style="width: 100%; padding: 12px; border: 1px solid #e9ecef; border-radius: 8px; box-sizing: border-box;"
          required 
        />
        <div id="textError" style="color: #dc3545; font-size: 0.85rem; margin-top: 0.5rem; display: none;">
          ❌ Debes escribir exactamente "ELIMINAR"
        </div>
      </div>

      <div class="buttons-modal">
        <button 
          type="button" 
          id="confirmDelete" 
          style="background-color: #dc3545; color: white; flex: 1; margin-left: 0.5rem; opacity: 0.5; cursor: not-allowed;" 
          disabled
        >
          Eliminar Cuenta
        </button>
        <button type="button" id="cancelDelete">
          Cancelar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Referencias a elementos
  const closeBtn = modal.querySelector('.close-modal');
  const cancelBtn = modal.querySelector('#cancelDelete');
  const confirmBtn = modal.querySelector('#confirmDelete');
  const passwordInput = modal.querySelector('#deletePassword');
  const confirmTextInput = modal.querySelector('#deleteConfirmText');
  const passwordError = modal.querySelector('#passwordError');
  const textError = modal.querySelector('#textError');

  // Función para validar y habilitar/deshabilitar el botón
  function validateForm() {
    const hasPassword = passwordInput.value.trim().length > 0;
    const hasCorrectText = confirmTextInput.value === 'ELIMINAR';

    if (hasPassword && hasCorrectText) {
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = '1';
      confirmBtn.style.cursor = 'pointer';
    } else {
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = '0.5';
      confirmBtn.style.cursor = 'not-allowed';
    }

    // Validar texto de confirmación
    if (confirmTextInput.value.length > 0 && confirmTextInput.value !== 'ELIMINAR') {
      textError.style.display = 'block';
    } else {
      textError.style.display = 'none';
    }
  }

  // Event listeners para validación en tiempo real
  passwordInput.addEventListener('input', validateForm);
  confirmTextInput.addEventListener('input', validateForm);

  // Función para cerrar modal
  const closeModal = () => {
    if (document.body.contains(modal)) {
      document.body.removeChild(modal);
    }
  };

  // Event listeners para cerrar
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // Click fuera del modal para cerrarlo
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Confirmar eliminación
  confirmBtn.addEventListener('click', async () => {
    const password = passwordInput.value.trim();
    const confirmText = confirmTextInput.value.trim();

    // Validar que el texto sea exactamente "ELIMINAR"
    if (confirmText !== 'ELIMINAR') {
      textError.style.display = 'block';
      return;
    }

    // Validar que se haya ingresado contraseña
    if (!password) {
      passwordError.textContent = '❌ Debes ingresar tu contraseña';
      passwordError.style.display = 'block';
      return;
    }

    try {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Verificando...';
      confirmBtn.style.opacity = '0.5';

      // Primero validar la contraseña
      const currentUser = getCurrentUser();
      const isValidPassword = await validateUserPassword(currentUser.email, password);

      if (!isValidPassword) {
        passwordError.textContent = '❌ Contraseña incorrecta';
        passwordError.style.display = 'block';
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Eliminar Cuenta';
        confirmBtn.style.opacity = '1';
        return;
      }

      // Si la contraseña es válida, proceder con la eliminación
      confirmBtn.textContent = 'Eliminando...';
      await deleteUserAccount(password);

      closeModal();
      showSuccessToast('✅ Cuenta eliminada correctamente');

      // Redirigir a home después de un breve delay
      setTimeout(() => {
        location.hash = '#/home';
      }, 2000);

    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('Error al eliminar la cuenta: ' + (error.message || error), 'error');

      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Eliminar Cuenta';
      confirmBtn.style.opacity = '1';
    }
  });

  // Focus en el primer input
  setTimeout(() => passwordInput.focus(), 100);
}