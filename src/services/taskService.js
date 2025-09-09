import { http } from "../api/http.js";

/**
 * Get all tasks for the authenticated user
 * @returns {Promise<Object[]>} Array of tasks
 */
export async function getTasks() {
  const token = localStorage.getItem("token");
  const tasks = await http.get("/tasks", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tasks.map((t) => ({
    ...t,
    dueDate: t.date,
    status: mapState(t.state),
  }));
}

/**
 * Create a new task
 * @param {Object} taskData - Task data
 * @param {string} taskData.title - Task title
 * @param {string} taskData.description - Task description
 * @param {string} taskData.status - Task status (pending, progress, completed)
 * @param {string} [taskData.dueDate] - Due date (optional)
 * @param {string} [taskData.priority] - Task priority (optional)
 * @returns {Promise<Object>} Created task
 */
export async function createTask({ title, detail, dueDate, status }) {
  const token = localStorage.getItem("token");
  const taskPayload = {
    title,
    detail,
    date: dueDate,
    state: mapStatus(status),
  };
  return http.post("/tasks", taskPayload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Update an existing task
 * @param {string} taskId - Task ID
 * @param {Object} updates - Task updates
 * @returns {Promise<Object>} Updated task
 */
export async function updateTask(taskId, updates) {
  const token = localStorage.getItem("token");
  return http.put(`/tasks/${taskId}`, updates, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Delete a task
 * @param {string} taskId - Task ID
 * @returns {Promise<void>}
 */
export async function deleteTask(taskId) {
  const token = localStorage.getItem("token");
  return http.del(`/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Update task status (for drag & drop or status change)
 * @param {string} taskId - Task ID
 * @param {string} newStatus - New status (pending, progress, completed)
 * @returns {Promise<Object>} Updated task
 */
export async function updateTaskStatus(taskId, newStatus) {
  return updateTask(taskId, { status: newStatus });
}

/**
 * Get task statistics for dashboard
 * @returns {Promise<Object>} Task statistics
 */
export async function getTaskStats() {
  try {
    const tasks = await getTasks();
    const stats = {
      pending: tasks.filter((t) => t.status === "todo").length,
      progress: tasks.filter((t) => t.status === "progress").length,
      completed: tasks.filter((t) => t.status === "done").length,
      total: tasks.length,
    };
    return stats;
  } catch (error) {
    console.error("Error getting task stats:", error);
    return { pending: 0, progress: 0, completed: 0, total: 0 };
  }
}

function mapStatus(status) {
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

function mapState(state) {
  switch (state) {
    case "Por hacer":
      return "todo";
    case "Haciendo":
      return "progress";
    case "Hecho":
      return "done";
    default:
      return "todo";
  }
}
