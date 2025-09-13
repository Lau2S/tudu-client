/**
 * @fileoverview Dashboard view initialization and task management.
 * @author Tudu Development Team
 * @version 1.0.0
 */

import { createTask, deleteTask, getTasks, updateTask } from '../../services/taskService.js';
import { getCurrentUser, isAuthenticated, logoutUser } from '../../services/userService.js';
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
    userNameEl.textContent = currentUser.email.split("@")[0];
    userAvatar.textContent = currentUser.email[0].toUpperCase();
  }

  await loadTasksFromBackend();
  initUserDropdown();
  initCreateTaskModal();
  initTaskActions();
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
      console.warn("Error processing task date:", err);
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
 * Initializes task action handlers.
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
