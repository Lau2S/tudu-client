/**
 * @fileoverview User service module for authentication and user management.
 * Provides functions for user registration, login, profile management, and password recovery.
 * @author Tudu Development Team
 * @version 1.0.0
 */

import { http } from '../api/http.js';

/**
 * Registers a new user in the system.
 * Maps frontend form fields to backend expected format.
 * @async
 * @param {Object} params - User registration data
 * @param {string} params.nombre - User's first name
 * @param {string} params.apellido - User's last name
 * @param {string} params.email - User's email address
 * @param {string} params.password - User's password
 * @param {string} params.age - User's age
 * @returns {Promise<Object>} The created user object from the API
 * @throws {Error} If the API responds with an error
 * @example
 * try {
 *   const user = await registerUser({ 
 *     nombre: "Juan", 
 *     apellido: "Pérez", 
 *     email: "juan@example.com", 
 *     password: "SecurePass123!", 
 *     age: "25" 
 *   });
 *   console.log("User created:", user);
 * } catch (err) {
 *   console.error("Registration failed:", err.message);
 * }
 */
export async function registerUser({ nombre, apellido, email, password, age }) {
  const response = await http.post('/users', {
    username: email,
    email: email,
    password: password,
    firstName: nombre,
    lastName: apellido,
    age: parseInt(age)
  });

  // Almacenar el nombre después del registro exitoso
  const fullName = `${nombre} ${apellido}`;
  localStorage.setItem("userName", fullName);
  localStorage.setItem("userFirstName", nombre);

  return response;
}

/**
 * Authenticates a user with email and password credentials.
 * @async
 * @param {Object} params - Login credentials
 * @param {string} params.email - User's email address
 * @param {string} params.password - User's password
 * @returns {Promise<Object>} Login response containing user data and JWT token
 * @throws {Error} If authentication fails
 * @example
 * try {
 *   const response = await loginUser({ 
 *     email: "user@example.com", 
 *     password: "password123" 
 *   });
 *   localStorage.setItem('token', response.token);
 * } catch (err) {
 *   console.error("Login failed:", err.message);
 * }
 */
export async function loginUser({ email, password }) {
  return http.post('/users/auth/login', { email, password });
}

/**
 * Retrieves user profile information by user ID.
 * Requires authentication token in localStorage.
 * @async
 * @param {string} userId - The user ID to fetch profile for
 * @returns {Promise<Object>} User profile data
 * @throws {Error} If the request fails or user is unauthorized
 * @example
 * try {
 *   const profile = await getUserProfile('user123');
 *   console.log("User profile:", profile);
 * } catch (err) {
 *   console.error("Failed to get profile:", err.message);
 * }
 */
export async function getUserProfile(userId) {
  const token = localStorage.getItem('token');
  return http.get(`/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

/**
 * Updates user profile information.
 * Requires authentication token in localStorage.
 * @async
 * @param {string} userId - The user ID to update
 * @param {Object} updates - Profile updates object
 * @returns {Promise<Object>} Updated user data
 * @throws {Error} If the update fails or user is unauthorized
 * @example
 * try {
 *   const updated = await updateUserProfile('user123', { 
 *     firstName: 'NewName',
 *     age: 26 
 *   });
 *   console.log("Profile updated:", updated);
 * } catch (err) {
 *   console.error("Update failed:", err.message);
 * }
 */
export async function updateUserProfile(userId, updates) {
  const token = localStorage.getItem('token');
  return http.put(`/users/${userId}`, updates, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

/**
 * Deletes a user account permanently.
 * Requires authentication token in sessionStorage.
 * @async
 * @param {string} userId - The user ID to delete
 * @returns {Promise<void>}
 * @throws {Error} If the deletion fails or user is unauthorized
 * @example
 * try {
 *   await deleteUser('user123');
 *   console.log("Account deleted successfully");
 * } catch (err) {
 *   console.error("Deletion failed:", err.message);
 * }
 */
export async function deleteUser(userId) {
  const token = sessionStorage.getItem('token');
  return http.del(`/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

/**
 * Logs out the current user by calling backend logout endpoint and clearing local storage.
 * Handles both successful logout and error cases gracefully.
 * @async
 * @returns {Promise<void>}
 * @example
 * try {
 *   await logoutUser();
 *   console.log("Logged out successfully");
 * } catch (err) {
 *   console.error("Logout error:", err.message);
 * }
 */
export async function logoutUser() {
  const token = sessionStorage.getItem('token');
  if (token) {
    try {
      await http.post('/users/auth/logout', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.warn('Error during logout on server:', error);
    }
  }

  // Limpiar también los datos del nombre del usuario
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userId');
  sessionStorage.removeItem('userEmail');
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userFirstName');
  location.hash = '#/sign-in';
}

/**
 * Checks if the current user is authenticated by validating the JWT token.
 * Verifies token existence and expiration status.
 * @returns {boolean} True if user is authenticated with valid token, false otherwise
 * @example
 * if (isAuthenticated()) {
 *   console.log("User is logged in");
 * } else {
 *   console.log("User needs to log in");
 * }
 */
export function isAuthenticated() {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return tokenPayload.exp > now;
  } catch (error) {
    console.error('Error verifying token:', error);
    sessionStorage.removeItem('token');
    return false;
  }
}

/**
 * Extracts current user information from the stored JWT token.
 * @returns {Object|null} User object with userId and email, or null if no valid token
 * @example
 * const user = getCurrentUser();
 * if (user) {
 *   console.log(`Welcome ${user.email}`);
 * }
 */
export function getCurrentUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: tokenPayload.userId,
      email: tokenPayload.email
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Initiates password recovery process by sending recovery email to user.
 * @async
 * @param {string} email - User's email address for password recovery
 * @returns {Promise<Object>} Server response confirming email sent
 * @throws {Error} If the request fails or email is invalid
 * @example
 * try {
 *   const response = await forgotPassword('user@example.com');
 *   console.log(response.message); // "Revisa tu correo para continuar"
 * } catch (err) {
 *   console.error("Password recovery failed:", err.message);
 * }
 */
export async function forgotPassword(email) {
  return http.post('/users/auth/forgot-password', { email });
}

/**
 * Resets user password using a recovery token.
 * @async
 * @param {string} token - Password reset token from email link
 * @param {Object} passwords - New password data
 * @param {string} passwords.password - New password
 * @param {string} passwords.confirmPassword - Password confirmation
 * @returns {Promise<Object>} Server response confirming password reset
 * @throws {Error} If token is invalid, expired, or passwords don't match
 * @example
 * try {
 *   const response = await resetPassword('reset-token-123', {
 *     password: 'NewSecurePass123!',
 *     confirmPassword: 'NewSecurePass123!'
 *   });
 *   console.log(response.message); // "Contraseña actualizada"
 * } catch (err) {
 *   console.error("Password reset failed:", err.message);
 * }
 */
export async function resetPassword(token, { password, confirmPassword }) {
  return http.post(`/users/auth/reset-password/${token}`, {
    password,
    confirmPassword
  });
}

