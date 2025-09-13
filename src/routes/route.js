/**
 * @fileoverview Client-side router for the Tudu application.
 * Handles hash-based navigation and view initialization with authentication.
 * @author Tudu Development Team
 * @version 1.0.0
 */

import { initDashboard } from '../views/js/dashboardView.js';
import { initHome } from '../views/js/homeView.js';
import { initResetPassword } from '../views/js/resetPasswordView.js';
import { initSignin } from '../views/js/signInView.js';
import { initSignup } from '../views/js/signUpView.js';

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
 * @param {string} [token] - Optional token parameter for reset-password view
 * @throws {Error} If the view cannot be fetched
 * @example
 * await loadView('dashboard'); // Loads and initializes dashboard view
 */
async function loadView(name, token = null) {
  const res = await fetch(viewURL(name));
  if (!res.ok) throw new Error(`Failed to load view: ${name}`);
  const html = await res.text();
  app.innerHTML = html;

  // Initialize view-specific logic using imported functions
  switch (name) {
    case "home":
      initHome();
      break;
    case "sign-up":
      initSignup();
      break;
    case "sign-in":
      initSignin();
      break;
    case "dashboard":
      await initDashboard();
      break;
    case "recovery-password":
      initResetPassword(token);
      break;
    default:
      console.warn(`No initializer found for view: ${name}`);
  }
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
 * Supports parameterized routes like /reset-password/:token
 * @private
 */
function handleRoute() {
  const path =
    (location.hash.startsWith("#/") ? location.hash.slice(2) : "") || "home";

  // Handle parameterized routes for password reset
  if (path.startsWith("reset-password/") || path.startsWith("recovery-password/")) {
    const token = path.split("/")[1];
    if (token) {
      loadView("recovery-password", token).catch((err) => {
        console.error(err);
        app.innerHTML = `<p style="color:#ffb4b4">Error loading the view.</p>`;
      });
      return;
    }
  }

  const known = ["home", "board", "sign-in", "sign-up", "dashboard"];
  const route = known.includes(path) ? path : "home";

  loadView(route).catch((err) => {
    console.error(err);
    app.innerHTML = `<p style="color:#ffb4b4">Error loading the view.</p>`;
  });
}