import { http } from '../api/http.js';

/**
 * Get all tasks for the authenticated user
 * @returns {Promise<Object[]>} Array of tasks
 */
export async function getTasks() {
  const token = localStorage.getItem('token');
  return http.get('/tasks', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
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
export async function createTask(taskData) {
  const token = localStorage.getItem('token');
  return http.post('/tasks', taskData, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

/**
 * Update an existing task
 * @param {string} taskId - Task ID
 * @param {Object} updates - Task updates
 * @returns {Promise<Object>} Updated task
 */
export async function updateTask(taskId, updates) {
  const token = localStorage.getItem('token');
  return http.put(`/tasks/${taskId}`, updates, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

/**
 * Delete a task
 * @param {string} taskId - Task ID
 * @returns {Promise<void>}
 */
export async function deleteTask(taskId) {
  const token = localStorage.getItem('token');
  return http.del(`/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
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
      pending: tasks.filter(t => t.status === 'pending').length,
      progress: tasks.filter(t => t.status === 'progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      total: tasks.length
    };
    return stats;
  } catch (error) {
    console.error('Error getting task stats:', error);
    return { pending: 0, progress: 0, completed: 0, total: 0 };
  }
}