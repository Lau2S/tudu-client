/**
 * @fileoverview Notification utility functions for toast messages.
 * @author Tudu Development Team
 * @version 1.0.0
 */

/**
 * Displays a toast notification with customizable styling.
 * @param {string} msg - The message to display
 * @param {string} [type='info'] - The toast type: 'info', 'success', or 'error'
 * @public
 */
export function showToast(msg, type = "info") {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: ${type === "error" ? "#dc3545" : type === "success" ? "#28a745" : "#007bff"
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

/**
 * Displays a success toast notification.
 * @param {string} message - The success message to display
 * @public
 */
export function showSuccessToast(message) {
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
