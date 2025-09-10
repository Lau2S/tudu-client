/**
 * @fileoverview Client-side router for the Tudu application.
 * Handles hash-based navigation and view initialization with authentication.
 * @author Tudu Development Team
 * @version 1.0.0
 */

import {
  registerUser,
  loginUser,
  logoutUser,
  isAuthenticated,
  getCurrentUser,
  forgotPassword,
} from "../services/userService.js";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
} from "../services/taskService.js";

/** @type {HTMLElement} Main application container */
const app = document.getElementById("app");

/**
 * Builds a safe URL for fetching view fragments in Vite environment.
 * @param {string} name - The view name without extension
 * @returns {URL} The resolved URL for the view HTML file
 * @example
 * const url = viewURL('home'); // Returns URL for home.html
 */
const viewURL = (name) => new URL(`../views/${name}.html`, import.meta.url);

/**
 * Loads an HTML fragment by view name and initializes its corresponding logic.
 * @async
 * @param {string} name - The view name to load (e.g., "home", "sign-in")
 * @throws {Error} If the view cannot be fetched
 * @example
 * await loadView('dashboard'); // Loads and initializes dashboard view
 */
async function loadView(name) {
  const res = await fetch(viewURL(name));
  if (!res.ok) throw new Error(`Failed to load view: ${name}`);
  const html = await res.text();
  app.innerHTML = html;

  if (name === "home") initHome();
  if (name === "board") initBoard();
  if (name === "sign-up") initSignup();
  if (name === "sign-in") initSignin();
  if (name === "dashboard") initDashboard();
}

/**
 * Initializes the hash-based router system.
 * Sets up navigation event listeners and triggers initial route handling.
 * @public
 */
export function initRouter() {
  window.addEventListener("hashchange", handleRoute);
  handleRoute();
}

/**
 * Handles the current route based on the location hash.
 * Provides fallback to 'home' for unknown routes and error handling.
 * @private
 */
function handleRoute() {
  const path =
    (location.hash.startsWith("#/") ? location.hash.slice(2) : "") || "home";
  const known = ["home", "board", "sign-in", "sign-up", "dashboard"];
  const route = known.includes(path) ? path : "home";

  loadView(route).catch((err) => {
    console.error(err);
    app.innerHTML = `<p style="color:#ffb4b4">Error loading the view.</p>`;
  });
}

/* ===================================
 * VIEW INITIALIZATION FUNCTIONS
 * =================================== */

/**
 * Initializes the home view.
 * Currently a placeholder for future home page functionality.
 * @private
 */
function initHome() {}

/**
 * Initializes the sign-up view with form validation and submission handling.
 * Implements real-time validation for email, password strength, confirmation, and age.
 * @private
 */
function initSignup() {
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
   * Checks email format, password strength, confirmation match, and age requirements.
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

/**
 * Initializes the sign-in view with authentication and password recovery.
 * Handles user login, form validation, and forgot password functionality.
 * Redirects authenticated users to dashboard automatically.
 * @private
 */
function initSignin() {
  const form = document.getElementById("sign-in-form");
  const emailInput = document.getElementById("sign-in-email");
  const passInput = document.getElementById("sign-in-password");
  const submitBtn = form?.querySelector('button[type="submit"]');
  const forgotLink = document.querySelector('.forgot-password-link');
  const modal = document.getElementById('recoveryPassword');
  const cancelBtn = document.getElementById('cancelTaskBtn');
  const closeBtn = modal?.querySelector('.close-modal');
  const sendEmailBtn = document.getElementById('sendEmail');

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
   * Checks email format and password presence.
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

  /**
   * Displays an error toast notification.
   * @param {string} message - The error message to display
   * @private
   */
  function showToast(message) {
    let toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.top = "20px";
    toast.style.right = "20px";
    toast.style.backgroundColor = "#dc3545";
    toast.style.color = "#fff";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    toast.style.zIndex = "1000";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";

    document.body.appendChild(toast);

    // Mostrar con animación
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
    });

    // Desaparece después de 3 segundos
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.addEventListener("transitionend", () => toast.remove());
    }, 3000);
  }

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

  



  // ===========================
  // LÓGICA PARA RECUPERACIÓN DE CONTRASEÑA
  // ===========================
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
        
        // Mostrar mensaje de éxito
        showSuccessToast("✅ Revisa tu correo para continuar");
        
        // Cerrar modal y limpiar formulario
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

  /**
   * Displays a success toast notification.
   * @param {string} message - The success message to display
   * @private
   */
  function showSuccessToast(message) {
    let toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.top = "20px";
    toast.style.right = "20px";
    toast.style.backgroundColor = "#28a745";
    toast.style.color = "#fff";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    toast.style.zIndex = "1000";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.addEventListener("transitionend", () => toast.remove());
    }, 4000);
  }
}

/**
 * Initializes the dashboard view with authentication protection.
 * Loads user tasks, sets up user interface, and initializes task management features.
 * Redirects unauthenticated users to sign-in page.
 * @private
 */
/**
 * Mostrar notificación toast
 */

async function initDashboard() {
  if (!isAuthenticated()) {
    location.hash = "#/sign-in";
    return;
  }

  const currentUser = getCurrentUser();
  const userNameEl = document.querySelector(".user-name");
  const userAvatar = document.querySelector(".user-avatar");

  if (userNameEl && userAvatar && currentUser?.email) {
    userNameEl.textContent = currentUser.email.split("@")[0];
    userAvatar.textContent = currentUser.email[0].toUpperCase();
  }

  await loadTasksFromBackend();
  initUserDropdown();
  initCreateTaskModal();
  initTaskActions();
}

/* ===================================
 * TASK MANAGEMENT FUNCTIONS
 * =================================== */

/**
 * Loads tasks from the backend API and renders them in the appropriate columns.
 * Handles task status normalization and error cases.
 * @async
 * @private
 */
async function loadTasksFromBackend() {
  try {
    const tasks = await getTasks();

    if (!Array.isArray(tasks)) {
      console.error("Invalid tasks format:", tasks);
      showToast("Error: formato de datos incorrecto", "error");
      return;
    }

    const columns = {
      pending: document.querySelector(".pending-column .task-list"),
      progress: document.querySelector(".progress-column .task-list"),
      completed: document.querySelector(".completed-column .task-list"),
    };

    Object.entries(columns).forEach(([key, col]) => {
      if (!col) {
        console.error(`Column not found: .${key}-column .task-list`);
      }
    });

    Object.values(columns).forEach((col) => {
      if (col) col.innerHTML = "";
    });

    /**
     * Normalizes task status values to standard format.
     * @param {string} status - The task status to normalize
     * @returns {string} Normalized status: 'pending', 'progress', or 'completed'
     * @private
     */
    const normalizeStatus = (status) => {
      const statusMap = {
        pending: "pending",
        pendiente: "pending",
        en_progreso: "progress",
        progress: "progress",
        in_progress: "progress",
        completed: "completed",
        completada: "completed",
        done: "completed",
      };
      return statusMap[status?.toLowerCase()] || "pending";
    };

    const tasksByStatus = {
      pending: [],
      progress: [],
      completed: [],
    };

    tasks.forEach((task) => {
      const normalizedStatus = normalizeStatus(task.status);
      if (tasksByStatus[normalizedStatus]) {
        tasksByStatus[normalizedStatus].push(task);
      }
    });

    Object.entries(tasksByStatus).forEach(([status, taskList]) => {
      const col = columns[status];
      if (!col) {
        console.warn(`Columna no encontrada para estado: ${status}`);
        return;
      }

      if (taskList.length === 0) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "empty-state";
        emptyDiv.style.cssText = `
          text-align: center;
          color: #888;
          padding: 20px;
          font-style: italic;
        `;
        emptyDiv.textContent = "No hay tareas aún";
        col.appendChild(emptyDiv);
      } else {
        taskList.forEach((task) => {
          const taskCard = createTaskCard(task);
          if (taskCard) {
            col.appendChild(taskCard);
          }
        });
      }
    });

    // Actualizar contadores
    updateColumnCounts(tasksByStatus);

    console.log("Tareas renderizadas correctamente");
  } catch (err) {
    console.error("Error cargando tareas:", err);
    showToast("Error cargando tareas: " + (err.message || err), "error");
  }
}

/**
 * Updates the task count display for each column in the dashboard.
 * Finds the counter elements for each status column and updates their text content
 * with the number of tasks in each respective status.
 * @param {Object} tasksByStatus - Object containing arrays of tasks grouped by status
 * @param {Array} tasksByStatus.pending - Array of pending tasks
 * @param {Array} tasksByStatus.progress - Array of tasks in progress
 * @param {Array} tasksByStatus.completed - Array of completed tasks
 * @private
 * @example
 * updateColumnCounts({
 *   pending: [task1, task2],
 *   progress: [task3],
 *   completed: [task4, task5, task6]
 * });
 */
function updateColumnCounts(tasksByStatus) {
  const counters = {
    pending: document.querySelector(".pending-column .column-count"),
    progress: document.querySelector(".progress-column .column-count"),
    completed: document.querySelector(".completed-column .column-count"),
  };

  Object.entries(counters).forEach(([status, counter]) => {
    if (counter && tasksByStatus[status]) {
      counter.textContent = tasksByStatus[status].length;
    }
  });
}

/**
 * Creates a DOM element representing a task card with all necessary interactive elements.
 * Builds a complete task card with title, description, due date, and action buttons.
 * Handles date formatting and provides fallback values for missing task properties.
 * @param {Object} task - The task object containing task information
 * @param {string} [task.id] - Unique identifier for the task (MongoDB _id or custom id)
 * @param {string} [task._id] - MongoDB document identifier
 * @param {string} [task.title] - Task title/name
 * @param {string} [task.detail] - Task description/details
 * @param {string} [task.description] - Alternative field for task description
 * @param {string|Date} [task.dueDate] - Due date for the task (ISO string or Date object)
 * @returns {HTMLElement|null} The created task card element, or null if task is invalid
 * @private
 * @example
 * const task = {
 *   _id: "64a123...",
 *   title: "Complete project",
 *   detail: "Finish the final implementation",
 *   dueDate: "2024-01-15T10:30:00Z"
 * };
 * const cardElement = createTaskCard(task);
 */
function createTaskCard(task) {
  if (!task) {
    console.error("Task es null o undefined");
    return null;
  }

  const card = document.createElement("div");
  card.className = "task-card";
  card.dataset.taskId = task.id || task._id || "";

  const title = task.title || "Sin título";
  const detail = task.detail || task.description || "";

  let dateHtml = "";
  if (task.dueDate) {
    try {
      const d = new Date(task.dueDate);
      if (!isNaN(d.getTime())) {
        const dateStr = d.toLocaleDateString("es-ES");
        const timeStr = d.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        });
        dateHtml = `<div class="task-datetime">📅 ${dateStr} ⏰ ${timeStr}</div>`;
      }
    } catch (err) {
      console.warn("Error procesando fecha de tarea:", err);
    }
  }

  card.innerHTML = `
    <div class="task-options">
      <button class="task-option-btn edit-btn" title="Editar">✏️</button>
      <button class="task-option-btn delete-btn" title="Eliminar">🗑️</button>
    </div>
    <div class="task-title">${escapeHtml(title)}</div>
    <div class="task-description">${escapeHtml(detail)}</div>
    ${dateHtml}
  `;

  card.draggable = true;

  return card;
}

/**
 * Escapes HTML special characters in text to prevent XSS attacks.
 * Uses the browser's built-in text content processing to safely escape
 * HTML entities like <, >, &, quotes, etc.
 * @param {string} text - The text to escape
 * @returns {string} HTML-safe escaped text
 * @private
 * @example
 * const safeText = escapeHtml('<script>alert("xss")</script>');
 * // Returns: '&lt;script&gt;alert("xss")&lt;/script&gt;'
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* ===================================
 * USER INTERFACE FUNCTIONS
 * =================================== */

/**
 * Initializes the user dropdown menu functionality.
 * Handles dropdown toggle and click-outside-to-close behavior.
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

  const logoutOption = document.getElementById("logoutOption");
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
 * Initializes the create task modal functionality.
 * Handles modal open/close events and form submission for task creation.
 * @private
 */
function initCreateTaskModal() {
  const openBtn = document.querySelector(".create-task-btn");
  const modal = document.getElementById("createTask");
  const closeBtn = modal?.querySelector(".close-modal");
  const form = document.getElementById("createTaskForm");
  const cancelBtn = document.getElementById("cancelTaskBtn");

  if (!openBtn || !modal || !form) {
    console.warn("Create task modal elements not found");
    return;
  }

  openBtn.addEventListener("click", () => {
    modal.style.display = "block";
    form.reset();
  });

  closeBtn?.addEventListener("click", () => (modal.style.display = "none"));
  cancelBtn?.addEventListener("click", () => (modal.style.display = "none"));

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando...";

    try {
      const data = new FormData(form);
      const currentUser = getCurrentUser();

      if (!currentUser?.email) {
        throw new Error("Usuario no autenticado");
      }

      const taskData = {
        title: data.get("taskTitle")?.trim() || "",
        detail: data.get("taskDesc")?.trim() || "",
        status: data.get("taskStatus") || "pending",
        dueDate: data.get("taskDate")
          ? `${data.get("taskDate")}T${data.get("taskTime") || "00:00"}:00`
          : null,
        user_email: currentUser.email,
      };

      if (!taskData.title) {
        throw new Error("El título de la tarea es obligatorio");
      }

      console.log("Creando tarea:", taskData);
      await createTask(taskData);
      await loadTasksFromBackend();
      modal.style.display = "none";
      form.reset();
      showToast("✅ Tarea creada exitosamente", "success");
    } catch (err) {
      console.error("Error creando tarea:", err);
      showToast("❌ Error al crear tarea: " + (err.message || err), "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

/**
 * Initializes task action event handlers for edit and delete operations.
 * Uses event delegation to handle dynamically created task elements.
 * @private
 */
function initTaskActions() {
  document.addEventListener("click", async (e) => {
    const card = e.target.closest(".task-card");
    if (!card) return;

    const taskId = card.dataset.taskId;
    if (!taskId) {
      console.error("Task ID not found");
      return;
    }

    if (e.target.classList.contains("delete-btn")) {
      if (!confirm("¿Seguro que quieres eliminar esta tarea?")) return;

      try {
        await deleteTask(taskId);
        showToast("🗑️ Tarea eliminada", "success");
        await loadTasksFromBackend();
      } catch (err) {
        console.error("Error eliminando tarea:", err);
        showToast("❌ Error eliminando: " + (err.message || err), "error");
      }
    }

    if (e.target.classList.contains("edit-btn")) {
      const titleEl = card.querySelector(".task-title");
      const descEl = card.querySelector(".task-description");

      const currentTitle = titleEl?.textContent || "";
      const currentDesc = descEl?.textContent || "";

      const newTitle = prompt("Nuevo título:", currentTitle);
      if (newTitle === null || newTitle.trim() === "") return;

      const newDesc = prompt("Nueva descripción:", currentDesc);
      if (newDesc === null) return;

      try {
        await updateTask(taskId, {
          title: newTitle.trim(),
          detail: newDesc.trim(),
        });
        showToast("✏️ Tarea actualizada", "success");
        await loadTasksFromBackend();
      } catch (err) {
        console.error("Error actualizando tarea:", err);
        showToast("❌ Error actualizando: " + (err.message || err), "error");
      }
    }
  });
}

/* ===================================
 * UTILITY FUNCTIONS
 * =================================== */

/**
 * Displays a toast notification with customizable styling.
 * @param {string} msg - The message to display
 * @param {string} [type='info'] - The toast type: 'info', 'success', or 'error'
 * @private
 */
function showToast(msg, type = "info") {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: ${
      type === "error" ? "#dc3545" : type === "success" ? "#28a745" : "#007bff"
    };
    color: white; padding: 12px 20px; border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 1000; opacity: 0;
    transition: opacity 0.3s ease; max-width: 300px;
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => (toast.style.opacity = "1"));

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.addEventListener("transitionend", () => toast.remove());
  }, 3000);
}

// ===========================
// FUNCIÓN DE DEBUG (OPCIONAL)
// ===========================
function debugDashboard() {
  console.log("=== DEBUG DASHBOARD ===");
  console.log("Columnas encontradas:");
  console.log(
    "- Pending:",
    document.querySelector(".pending-column .task-list")
  );
  console.log(
    "- Progress:",
    document.querySelector(".progress-column .task-list")
  );
  console.log(
    "- Completed:",
    document.querySelector(".completed-column .task-list")
  );
  console.log("Modal elementos:");
  console.log("- Create btn:", document.querySelector(".create-task-btn"));
  console.log("- Modal:", document.getElementById("createTask"));
  console.log("- Form:", document.getElementById("createTaskForm"));
}
