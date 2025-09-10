import { http } from '../api/http.js';

/**
 * Register a new user in the system.
 *
 * Sends a POST request to the backend API (`/users`)
 * with the provided user registration data matching the frontend form.
 *
 * @async
 * @function registerUser
 * @param {Object} params - User registration data.
 * @param {string} params.nombre - The first name of the user.
 * @param {string} params.apellido - The last name of the user.
 * @param {string} params.email - The email of the user.
 * @param {string} params.password - The password of the user.
 * @param {string} params.age - The age of the user.
 * @returns {Promise<Object>} The created user object returned by the API.
 * @throws {Error} If the API responds with an error status or message.
 *
 * @example
 * try {
 *   const user = await registerUser({ 
 *     nombre: "Juan", 
 *     apellido: "Pérez", 
 *     email: "juan@example.com", 
 *     password: "MiPassword123", 
 *     age: "25" 
 *   });
 *   console.log("User created:", user);
 * } catch (err) {
 *   console.error("Registration failed:", err.message);
 * }
 */
export async function registerUser({ nombre, apellido, email, password, age }) {
  // Mapear los campos del frontend a lo que espera el backend
  return http.post('/users', {
    username: email,      // Usar email como username para mantener compatibilidad
    email: email,         // Email del usuario
    password: password,   // Contraseña del usuario
    firstName: nombre,    // Nombre del usuario
    lastName: apellido,   // Apellido del usuario
    age: parseInt(age)    // Edad convertida a número
  });
}

/**
 * Login user with credentials.
 * ACTUALIZADA para usar la ruta correcta del backend
 *
 * @async
 * @function loginUser
 * @param {Object} params - Login credentials.
 * @param {string} params.email - The user email.
 * @param {string} params.password - The password.
 * @returns {Promise<Object>} The login response with user data and token.
 * @throws {Error} If login fails.
 */
export async function loginUser({ email, password }) {
  return http.post('/users/auth/login', { email, password });
}

/**
 * Get user profile information.
 * ACTUALIZADA para incluir autenticación
 *
 * @async
 * @function getUserProfile
 * @param {string} userId - The user ID.
 * @returns {Promise<Object>} The user profile data.
 * @throws {Error} If the request fails.
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
 * Update user profile.
 * ACTUALIZADA para incluir autenticación
 *
 * @async
 * @function updateUserProfile
 * @param {string} userId - The user ID.
 * @param {Object} updates - The profile updates.
 * @returns {Promise<Object>} The updated user data.
 * @throws {Error} If the update fails.
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
 * Delete user account.
 * ACTUALIZADA para incluir autenticación
 *
 * @async
 * @function deleteUser
 * @param {string} userId - The user ID.
 * @returns {Promise<void>}
 * @throws {Error} If the deletion fails.
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
 * Logout user - NUEVA FUNCIÓN
 * Llama al endpoint de logout del backend y limpia el localStorage
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
      console.warn('Error durante logout en el servidor:', error);
    }
  }
  // Limpiar localStorage
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userId');
  sessionStorage.removeItem('userEmail');

  // Redirigir al sign-in
  location.hash = '#/sign-in';
}

/**
 * Check if user is authenticated
 * Verifica si el token existe y no ha expirado
 */
export function isAuthenticated() {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return tokenPayload.exp > now;
  } catch (error) {
    console.error('Error verificando token:', error);
    sessionStorage.removeItem('token');
    return false;
  }
}

/**
 * Get current user info from token
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
    console.error('Error decodificando token:', error);
    return null;
  }
}

/**
 * Request password reset for a user.
 *
 * Sends a POST request to the backend API (`/auth/forgot-password`)
 * with the provided email address.
 *
 * @async
 * @function forgotPassword
 * @param {Object} params - Password reset request data.
 * @param {string} params.email - The email address of the user.
 * @returns {Promise<Object>} The response object returned by the API.
 * @throws {Error} If the API responds with an error status or message.
 *
 * @example
 * try {
 *   const result = await forgotPassword({ email: "user@example.com" });
 *   console.log("Reset email sent:", result.message);
 * } catch (err) {
 *   console.error("Password reset request failed:", err.message);
 * }
 */
export async function forgotPassword({ email }) {
  return http.post('/auth/forgot-password', { email });
}

/**
 * Reset user password using a token.
 *
 * Sends a POST request to the backend API (`/auth/reset-password/:token`)
 * with the new password and confirmation.
 *
 * @async
 * @function resetPassword
 * @param {Object} params - Password reset data.
 * @param {string} params.token - The reset token received via email.
 * @param {string} params.password - The new password.
 * @param {string} params.confirmPassword - Password confirmation.
 * @returns {Promise<Object>} The response object returned by the API.
 * @throws {Error} If the API responds with an error status or message.
 *
 * @example
 * try {
 *   const result = await resetPassword({ 
 *     token: "abc123", 
 *     password: "newpass123", 
 *     confirmPassword: "newpass123" 
 *   });
 *   console.log("Password reset successful:", result.message);
 * } catch (err) {
 *   console.error("Password reset failed:", err.message);
 * }
 */
export async function resetPassword({ token, password, confirmPassword }) {
  return http.post(`/auth/reset-password/${token}`, { password, confirmPassword });
}
