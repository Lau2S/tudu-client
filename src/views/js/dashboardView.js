/**
 * @fileoverview Dashboard view initialization and task management.
 * @author Tudu Development Team
 * @version 1.0.0
 */

import { createTask, deleteTask, getTasks, updateTask } from '../../services/taskService.js';
import { getCurrentUser, getUserProfile, isAuthenticated, logoutUser } from '../../services/userService.js';
import { showToast } from '../../utils/notifications.js';

/**
 * Initializes the dashboard view with authentication protection.
 * @public
 */
export async function initDashboard() {
  if (!isAuthenticated()) {
    location.hash = "#/sign-in";
    return;
  }

  const currentUser = getCurrentUser();
  const userNameEl = document.querySelector(".user-name");
  const userAvatar = document.querySelector(".user-avatar");

  if (userNameEl && userAvatar && currentUser?.email) {
    // Intentar obtener el perfil completo del usuario
    try {
      const userProfile = await getUserProfile(currentUser.userId);
      if (userProfile.firstName && userProfile.lastName) {
        const fullName = `${userProfile.firstName} ${userProfile.lastName}`;
        userNameEl.textContent = fullName;
        userAvatar.textContent = userProfile.firstName[0].toUpperCase();

        // Actualizar localStorage para uso posterior
        localStorage.setItem("userName", fullName);
        localStorage.setItem("userFirstName", userProfile.firstName);
      } else {
        // Fallback: usar email
        userNameEl.textContent = currentUser.email.split("@")[0];
        userAvatar.textContent = currentUser.email[0].toUpperCase();
      }
    } catch (error) {
      console.warn("No se pudo cargar el perfil:", error);
      // Fallback: usar datos almacenados o email
      const storedUserName = localStorage.getItem("userName");
      const storedFirstName = localStorage.getItem("userFirstName");

      if (storedUserName) {
        userNameEl.textContent = storedUserName;
        userAvatar.textContent = storedFirstName ? storedFirstName[0].toUpperCase() : storedUserName[0].toUpperCase();
      } else {
        userNameEl.textContent = currentUser.email.split("@")[0];
        userAvatar.textContent = currentUser.email[0].toUpperCase();
      }
    }
  }

  await loadTasksFromBackend();
  initUserDropdown();
  initCreateTaskModal();
  initEditTaskModal();
  initTaskActions();
  initDeleteTaskModal();
  initLogoutModal();
}

/**
 * Loads tasks from the backend API and renders them.
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

    const sortTasksByDate = (taskList) => {
      return taskList.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);

        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;

        return dateA.getTime() - dateB.getTime();
      });
    };

    Object.keys(tasksByStatus).forEach(status => {
      tasksByStatus[status] = sortTasksByDate(tasksByStatus[status]);
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

    updateColumnCounts(tasksByStatus);

  } catch (err) {
    console.error("Error cargando tareas:", err);
    showToast("Error cargando tareas: " + (err.message || err), "error");
  }
}

/**
 * Updates the task count display for each column.
 * @private
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
 * Creates a task card element.
 * @private
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
      const taskDate = new Date(task.dueDate);
      
     if (!isNaN(taskDate.getTime())) {
        // Obtener fecha y hora en zona horaria local
        const day = String(taskDate.getDate()).padStart(2, '0');
        const month = String(taskDate.getMonth() + 1).padStart(2, '0');
        const year = taskDate.getFullYear();
        const dateStr = `${day}/${month}/${year}`;
        
        // Obtener horas y minutos en zona horaria local
        const hours = String(taskDate.getHours()).padStart(2, '0');
        const minutes = String(taskDate.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        console.log('Fecha formateada:', { dateStr, timeStr, originalDate: taskDate.toString() });
        dateHtml = `<div class="task-datetime">📅 ${dateStr} ⏰ ${timeStr}</div>`;
      } else {
        console.warn("Fecha inválida:", task.dueDate);
      }
    } catch (err) {
      console.warn("Error processing task date:", err);
    }
  }
  card.innerHTML = `
    <div class="task-options">
      <button class="task-menu-btn" title="Opciones">⋮</button>
      <div class="task-dropdown-menu">
        <div class="task-dropdown-item edit-option">
          <span class="dropdown-icon">✏️</span>
          <span>Editar</span>
        </div>
        <div class="task-dropdown-item delete-option">
          <span class="dropdown-icon">🗑️</span>
          <span>Eliminar</span>
        </div>
      </div>
    </div>
    <div class="task-title">${escapeHtml(title)}</div>
    <div class="task-description">${escapeHtml(detail)}</div>
    ${dateHtml}
  `;

  card.draggable = true;
  return card;
}

/**
 * Escapes HTML special characters.
 * @private
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
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

  const profileOption = document.getElementById("profileOption");
  const logoutOption = document.getElementById("logoutOption");

  if (profileOption) {
    profileOption.addEventListener("click", () => {
      location.hash = "#/user-profile";
    });
  }

  if (logoutOption) {
    logoutOption.addEventListener("click", () => {
      const modal = document.getElementById("logoutModal");
      if (modal) {
        modal.style.display = "block";
      } else {
        // Fallback al logout directo si no existe el modal
        executeLogout();
      }
    });
  }
}

/**
 * Initializes the create task modal.
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
    
    // Establecer fecha mínima como hoy
    const dateInput = document.getElementById("taskDate");
    const timeInput = document.getElementById("taskTime");
    
    if (dateInput) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      dateInput.min = todayStr;
      
      // Si no hay fecha seleccionada, usar hoy
      if (!dateInput.value) {
        dateInput.value = todayStr;
      }
    }
    
    // Establecer hora por defecto si no hay ninguna
    if (timeInput && !timeInput.value) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      timeInput.value = `${hours}:${minutes}`;
    }
  });

  closeBtn?.addEventListener("click", () => (modal.style.display = "none"));
  cancelBtn?.addEventListener("click", () => (modal.style.display = "none"));

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (submitBtn.disabled) return;

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando...";
    
    if (cancelBtn) cancelBtn.disabled = true;

    try {
      const data = new FormData(form);
      const currentUser = getCurrentUser();

      if (!currentUser?.email) {
        throw new Error("Usuario no autenticado");
      }

      const taskDate = data.get("taskDate");
      const taskTime = data.get("taskTime");
      
      let dueDate = null;
      if (taskDate) {
        // Crear fecha en zona horaria local
        const dateTimeStr = `${taskDate}T${taskTime || "12:00"}:00`;
        dueDate = dateTimeStr;
        
        console.log('Creando tarea con fecha:', { taskDate, taskTime, dueDate });
      }

      const taskData = {
        title: data.get("taskTitle")?.trim() || "",
        detail: data.get("taskDesc")?.trim() || "",
        status: data.get("taskStatus") || "pending",
        dueDate: dueDate,
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
      if (cancelBtn) cancelBtn.disabled = false;
    }
  });
}

/**
 * Initializes the edit task modal.
 * @private
 */
function initEditTaskModal() {
  const modal = document.getElementById("editTask");
  const closeBtn = modal?.querySelector(".close-modal");
  const form = document.getElementById("editTaskForm");
  const cancelBtn = document.getElementById("cancelEditTaskBtn");

  if (!modal || !form) {
    console.warn("Edit task modal elements not found");
    return;
  }

  closeBtn?.addEventListener("click", () => (modal.style.display = "none"));
  cancelBtn?.addEventListener("click", () => (modal.style.display = "none"));

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');

    // Verificar si ya se está procesando
    if (submitBtn.disabled) {
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando...";

    // Deshabilitar también el botón de cancelar para evitar interferencias
    if (cancelBtn) {
      cancelBtn.disabled = true;
    }

    try {
      const data = new FormData(form);
      const taskId = form.dataset.taskId;

      if (!taskId) {
        throw new Error("ID de tarea no encontrado");
      }

      const taskData = {
        title: data.get("taskTitle")?.trim() || "",
        detail: data.get("taskDesc")?.trim() || "",
        state: mapStatusToBackend(data.get("taskStatus")),
        date: data.get("taskDate")
          ? `${data.get("taskDate")}T${data.get("taskTime") || "00:00"}:00`
          : null,
      };

      if (!taskData.title) {
        throw new Error("El título de la tarea es obligatorio");
      }

      console.log("Actualizando tarea:", taskData);
      await updateTask(taskId, taskData);
      await loadTasksFromBackend();
      modal.style.display = "none";
      showToast("✏️ Tarea actualizada exitosamente", "success");
    } catch (err) {
      console.error("Error actualizando tarea:", err);
      showToast("❌ Error al actualizar tarea: " + (err.message || err), "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      if (cancelBtn) {
        cancelBtn.disabled = false;
      }
    }
  });
}

/**
 * Initializes task action handlers.
 * @private
 */
function initTaskActions() {
  // Variable para controlar la última acción ejecutada
  let lastActionTime = 0;
  const ACTION_DEBOUNCE_TIME = 500; // 500ms de espera entre acciones

  document.addEventListener("click", async (e) => {
    // Debounce para evitar clicks múltiples rápidos
    const currentTime = Date.now();
    if (currentTime - lastActionTime < ACTION_DEBOUNCE_TIME) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Handle menu button click - verificar tanto el botón como sus elementos hijos
    if (e.target.classList.contains("task-menu-btn") || e.target.closest(".task-menu-btn")) {
      e.stopPropagation();
      e.preventDefault();

      const menuBtn = e.target.classList.contains("task-menu-btn") ? e.target : e.target.closest(".task-menu-btn");
      const dropdown = menuBtn.nextElementSibling;
      const isVisible = dropdown.classList.contains("active");

      // Close all other dropdowns
      document.querySelectorAll(".task-dropdown-menu.active").forEach(menu => {
        menu.classList.remove("active");
      });

      // Toggle current dropdown
      if (!isVisible) {
        dropdown.classList.add("active");
      }
      return;
    }

    // Handle dropdown options
    if (e.target.closest(".edit-option")) {
      e.stopPropagation();
      e.preventDefault();

      const card = e.target.closest(".task-card");
      const dropdown = e.target.closest(".task-dropdown-menu");

      // Verificar si la tarea ya se está editando
      if (card.dataset.editing === 'true') {
        return;
      }

      dropdown.classList.remove("active");
      lastActionTime = currentTime;

      handleEditTask(card);
      return;
    }

    if (e.target.closest(".delete-option")) {
      e.stopPropagation();
      e.preventDefault();

      const card = e.target.closest(".task-card");
      const dropdown = e.target.closest(".task-dropdown-menu");

      // Verificar si la tarea ya se está eliminando
      if (card.dataset.deleting === 'true') {
        return;
      }

      dropdown.classList.remove("active");
      lastActionTime = currentTime;

      handleDeleteTask(card);
      return;
    }

    // Close dropdowns when clicking outside
    if (!e.target.closest(".task-options")) {
      document.querySelectorAll(".task-dropdown-menu.active").forEach(menu => {
        menu.classList.remove("active");
      });
    }
  });

  // Agregar eventos de mouseover para mejorar la interactividad
  document.addEventListener("mouseover", (e) => {
    if (e.target.classList.contains("task-menu-btn") || e.target.closest(".task-menu-btn")) {
      const btn = e.target.classList.contains("task-menu-btn") ? e.target : e.target.closest(".task-menu-btn");
      btn.style.cursor = "pointer";
    }
  });
}

/**
 * Handles task editing
 * @private
 */
async function handleEditTask(card) {
  const taskId = card.dataset.taskId;
  if (!taskId) {
    console.error("Task ID not found");
    return;
  }

  // Verificar si ya se está editando esta tarea
  if (card.dataset.editing === 'true') {
    console.log("Edit already in progress for this task");
    return;
  }

  // Marcar la tarea como en proceso de edición
  card.dataset.editing = 'true';

  // Get current task data from the card
  const titleEl = card.querySelector(".task-title");
  const descEl = card.querySelector(".task-description");
  const datetimeEl = card.querySelector(".task-datetime");

  const taskData = {
    title: titleEl?.textContent?.trim() || "",
    detail: descEl?.textContent?.trim() || "",
    dueDate: null,
    status: getTaskStatusFromColumn(card)
  };

  // Extract date from datetime element if present
  if (datetimeEl && datetimeEl.textContent) {
    const dateMatch = datetimeEl.textContent.match(/📅\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
    const timeMatch = datetimeEl.textContent.match(/⏰\s*(\d{1,2}:\d{2})/);

    if (dateMatch && timeMatch) {
      try {
        const [day, month, year] = dateMatch[1].split('/');
        const time = timeMatch[1];
        taskData.dueDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}:00`);
      } catch (err) {
        console.warn("Error parsing date from card:", err);
      }
    }
  }

  try {
    openEditModal(taskId, taskData);
  } finally {
    // Limpiar el flag después de abrir el modal
    setTimeout(() => {
      card.dataset.editing = 'false';
    }, 1000);
  }
}

/**
 * Handles task deletion
 * @private
 */
async function handleDeleteTask(card) {
  const taskId = card.dataset.taskId;
  if (!taskId) {
    console.error("Task ID not found");
    return;
  }

  // Verificar si ya se está procesando una eliminación para esta tarea
  if (card.dataset.deleting === 'true') {
    console.log("Delete already in progress for this task");
    return;
  }

  // Mostrar modal de confirmación
  const modal = document.getElementById("deleteTaskModal");
  if (modal) {
    modal.dataset.taskCard = taskId;
    modal.style.display = "block";
  } else {
    // Fallback al confirm nativo si no existe el modal
    if (!confirm("¿Seguro que quieres eliminar esta tarea?")) return;
    await executeDeleteTask(taskId);
  }
}

/**
 * Opens the edit modal with current task data.
 * @private
 */
function openEditModal(taskId, taskData) {
  const modal = document.getElementById("editTask");
  const form = document.getElementById("editTaskForm");

  if (!modal || !form) {
    console.error("Edit modal elements not found");
    showToast("❌ Error: Modal de edición no encontrado", "error");
    return;
  }

  console.log("Setting up edit modal for task:", taskId, taskData);

  // Store task ID in form dataset
  form.dataset.taskId = taskId;

  // Clear and populate form fields
  const titleInput = document.getElementById("editTaskTitle");
  const descInput = document.getElementById("editTaskDesc");
  const dateInput = document.getElementById("editTaskDate");
  const timeInput = document.getElementById("editTaskTime");
  const statusSelect = document.getElementById("editTaskStatus");

  if (titleInput) titleInput.value = taskData.title || "";
  if (descInput) descInput.value = taskData.detail || "";

  // Handle date and time
  if (taskData.dueDate && dateInput && timeInput) {
    try {
      const date = new Date(taskData.dueDate);
      if (!isNaN(date.getTime())) {
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().slice(0, 5);
        dateInput.value = dateStr;
        timeInput.value = timeStr;
      }
    } catch (err) {
      console.warn("Error parsing task date:", err);
      if (dateInput) dateInput.value = "";
      if (timeInput) timeInput.value = "";
    }
  } else {
    if (dateInput) dateInput.value = "";
    if (timeInput) timeInput.value = "";
  }

  // Set status
  if (statusSelect) {
    statusSelect.value = taskData.status || "pending";
  }

  // Show modal
  modal.style.display = "block";
  console.log("Edit modal should now be visible");
}

/**
 * Maps frontend status to backend state.
 * @private
 */
function mapStatusToBackend(status) {
  switch (status) {
    case "pending":
      return "Por Hacer";
    case "progress":
      return "Haciendo";
    case "completed":
      return "Hecho";
    default:
      return "Por Hacer";
  }
}

/**
 * Determines task status based on which column the card is in.
 * @private
 */
function getTaskStatusFromColumn(card) {
  const column = card.closest('.kanban-column');
  if (column?.classList.contains('pending-column')) return 'pending';
  if (column?.classList.contains('progress-column')) return 'progress';
  if (column?.classList.contains('completed-column')) return 'completed';
  return 'pending';
}

/**
 * Initializes the delete task confirmation modal.
 * @private
 */
function initDeleteTaskModal() {
  const modal = document.getElementById("deleteTaskModal");
  const closeBtn = modal?.querySelector(".close-modal");
  const cancelBtn = document.getElementById("cancelDeleteTaskBtn");
  const confirmBtn = document.getElementById("confirmDeleteTaskBtn");

  if (!modal) {
    console.warn("Delete task modal not found");
    return;
  }

  // Cerrar modal
  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
    clearPendingDelete();
  });

  cancelBtn?.addEventListener("click", () => {
    modal.style.display = "none";
    clearPendingDelete();
  });

  // Cerrar al hacer click fuera del modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      clearPendingDelete();
    }
  });

  // Confirmar eliminación
  confirmBtn?.addEventListener("click", async () => {
    const taskCard = modal.dataset.taskCard;
    if (taskCard) {
      modal.style.display = "none";
      await executeDeleteTask(taskCard);
    }
  });
}

/**
 * Initializes the logout confirmation modal.
 * @private
 */
function initLogoutModal() {
  const modal = document.getElementById("logoutModal");
  const closeBtn = modal?.querySelector(".close-modal");
  const cancelBtn = document.getElementById("cancelLogoutBtn");
  const confirmBtn = document.getElementById("confirmLogoutBtn");

  if (!modal) {
    console.warn("Logout modal not found");
    return;
  }

  // Cerrar modal
  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  cancelBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Cerrar al hacer click fuera del modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Confirmar logout
  confirmBtn?.addEventListener("click", async () => {
    modal.style.display = "none";
    await executeLogout();
  });
}

/**
 * Clears pending delete state
 * @private
 */
function clearPendingDelete() {
  const modal = document.getElementById("deleteTaskModal");
  if (modal.dataset.taskCard) {
    const cardId = modal.dataset.taskCard;
    const card = document.querySelector(`[data-task-id="${cardId}"]`);
    if (card) {
      card.dataset.deleting = 'false';
      card.style.opacity = '1';
      card.style.pointerEvents = 'auto';

      const deleteBtn = card.querySelector('.delete-option');
      if (deleteBtn) {
        deleteBtn.style.pointerEvents = 'auto';
        deleteBtn.style.opacity = '1';
      }
    }
    delete modal.dataset.taskCard;
  }
}

/**
 * Executes the actual task deletion
 * @private
 */
async function executeDeleteTask(taskId) {
  const card = document.querySelector(`[data-task-id="${taskId}"]`);
  if (!card) {
    console.error("Task card not found");
    return;
  }

  // Marcar la tarea como en proceso de eliminación
  card.dataset.deleting = 'true';
  card.style.opacity = '0.5';
  card.style.pointerEvents = 'none';

  try {
    await deleteTask(taskId);
    showToast("🗑️ Tarea eliminada", "success");
    await loadTasksFromBackend();
  } catch (err) {
    console.error("Error eliminando tarea:", err);
    showToast("❌ Error eliminando: " + (err.message || err), "error");

    // Restaurar el estado si hay error
    card.dataset.deleting = 'false';
    card.style.opacity = '1';
    card.style.pointerEvents = 'auto';
  }
}

/**
 * Executes the logout process
 * @private
 */
async function executeLogout() {
  try {
    await logoutUser();
  } catch (err) {
    console.warn("Error en logout:", err);
  }
  localStorage.clear();
  sessionStorage.clear();
  location.hash = "#/sign-in";
  showToast("Sesión cerrada correctamente", "success");
}
