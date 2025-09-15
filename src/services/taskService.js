/**
 * @fileoverview Task service module for task management operations.
 * Provides functions for CRUD operations on tasks with authentication.
 * @author Tudu Development Team
 * @version 1.0.0
 */

import { http } from "../api/http.js";

/**
 * Retrieves all tasks for the authenticated user.
 * Maps backend task format to frontend format.
 * @async
 * @returns {Promise<Object[]>} Array of user tasks
 * @throws {Error} If the request fails or user is not authenticated
 * @example
 * try {
 *   const tasks = await getTasks();
 *   console.log(`Found ${tasks.length} tasks`);
 * } catch (err) {
 *   console.error("Failed to load tasks:", err.message);
 * }
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
 * Creates a new task for the authenticated user.
 * @async
 * @param {Object} taskData - Task creation data
 * @param {string} taskData.title - Task title
 * @param {string} taskData.detail - Task description/details
 * @param {string} [taskData.dueDate] - Due date in ISO format (optional)
 * @param {string} [taskData.status='pending'] - Task status
 * @returns {Promise<Object>} Created task object
 * @throws {Error} If the creation fails or user is not authenticated
 * @example
 * try {
 *   const task = await createTask({
 *     title: "Complete project",
 *     detail: "Finish the final implementation",
 *     dueDate: "2024-12-31",
 *     status: "pending"
 *   });
 *   console.log("Task created:", task);
 * } catch (err) {
 *   console.error("Failed to create task:", err.message);
 * }
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
 * Updates an existing task with new information.
 * @async
 * @param {string} taskId - The ID of the task to update
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<Object>} Updated task object
 * @throws {Error} If the update fails or user is not authenticated
 * @example
 * try {
 *   const updated = await updateTask('task123', { 
 *     title: 'Updated title',
 *     state: 'Hecho' 
 *   });
 *   console.log("Task updated:", updated);
 * } catch (err) {
 *   console.error("Failed to update task:", err.message);
 * }
 */
export async function updateTask(taskId, updates) {
  const token = localStorage.getItem("token");

  // Ensure we're sending the correct structure to the backend
  const payload = {
    title: updates.title,
    detail: updates.detail,
    date: updates.date,
    state: updates.state
  };

  return http.put(`/tasks/${taskId}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Deletes a task permanently.
 * @async
 * @param {string} taskId - The ID of the task to delete
 * @returns {Promise<void>}
 * @throws {Error} If the deletion fails or user is not authenticated
 * @example
 * try {
 *   await deleteTask('task123');
 *   console.log("Task deleted successfully");
 * } catch (err) {
 *   console.error("Failed to delete task:", err.message);
 * }
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
 * Updates task status for drag & drop operations or status changes.
 * @async
 * @param {string} taskId - The ID of the task to update
 * @param {string} newStatus - New status ('pending', 'progress', 'completed')
 * @returns {Promise<Object>} Updated task object
 * @throws {Error} If the status update fails
 * @example
 * try {
 *   const updated = await updateTaskStatus('task123', 'completed');
 *   console.log("Task status updated:", updated);
 * } catch (err) {
 *   console.error("Failed to update status:", err.message);
 * }
 */
export async function updateTaskStatus(taskId, newStatus) {
  return updateTask(taskId, { status: newStatus });
}

/**
 * Retrieves task statistics for dashboard display.
 * @async
 * @returns {Promise<Object>} Object containing task counts by status
 * @example
 * try {
 *   const stats = await getTaskStats();
 *   console.log(`${stats.total} tasks: ${stats.completed} completed`);
 * } catch (err) {
 *   console.error("Failed to get stats:", err.message);
 * }
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

/* ===================================
 * UTILITY FUNCTIONS
 * =================================== */

/**
 * Maps frontend status values to backend expected values.
 * @private
 * @param {string} status - Frontend status value
 * @returns {string} Backend status value
 */
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

/**
 * Maps backend state values to frontend status values.
 * @private
 * @param {string} state - Backend state value
 * @returns {string} Frontend status value
 */
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
