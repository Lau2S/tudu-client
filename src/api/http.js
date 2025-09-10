/**
 * @fileoverview HTTP client module for API communication.
 * Provides a wrapper around the Fetch API with automatic JSON handling and error management.
 * @author Tudu Development Team
 * @version 1.0.0
 */

/**
 * Base URL for all API requests.
 * Loaded from Vite environment variables (VITE_API_URL).
 * @type {string}
 */
const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Generic HTTP request function using the Fetch API.
 * Automatically handles JSON serialization/deserialization and error responses.
 * @async
 * @param {string} path - API endpoint path (relative to BASE_URL)
 * @param {Object} [options={}] - Request configuration options
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Object} [options.headers={}] - Additional HTTP headers
 * @param {Object} [options.body] - Request payload (will be JSON stringified)
 * @returns {Promise<any>} Parsed JSON response or null for non-JSON responses
 * @throws {Error} Throws error with server message for HTTP error responses
 * @example
 * try {
 *   const data = await request('/users', { 
 *     method: 'POST', 
 *     body: { name: 'John' } 
 *   });
 *   console.log(data);
 * } catch (err) {
 *   console.error('Request failed:', err.message);
 * }
 */
async function request(path, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJSON = res.headers.get('content-type')?.includes('application/json');
  const payload = isJSON ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const msg = payload?.message || payload?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return payload;
}

/**
 * HTTP client object providing convenient methods for common HTTP operations.
 * All methods use the generic request function with appropriate HTTP verbs.
 * @namespace
 */
export const http = {
  /**
   * Performs a GET request to fetch data.
   * @param {string} path - API endpoint path
   * @param {Object} [opts] - Additional fetch options (headers, etc.)
   * @returns {Promise<any>} Response data
   * @example
   * const users = await http.get('/users');
   * const user = await http.get('/users/123', { 
   *   headers: { Authorization: 'Bearer token' } 
   * });
   */
  get: (path, opts) => request(path, { method: 'GET', ...opts }),

  /**
   * Performs a POST request to create or submit data.
   * @param {string} path - API endpoint path
   * @param {Object} body - Request payload
   * @param {Object} [opts] - Additional fetch options
   * @returns {Promise<any>} Response data
   * @example
   * const newUser = await http.post('/users', { 
   *   name: 'John', 
   *   email: 'john@example.com' 
   * });
   */
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),

  /**
   * Performs a PUT request to update existing data.
   * @param {string} path - API endpoint path
   * @param {Object} body - Request payload with updates
   * @param {Object} [opts] - Additional fetch options
   * @returns {Promise<any>} Response data
   * @example
   * const updated = await http.put('/users/123', { name: 'Jane' });
   */
  put: (path, body, opts) => request(path, { method: 'PUT', body, ...opts }),

  /**
   * Performs a DELETE request to remove data.
   * @param {string} path - API endpoint path
   * @param {Object} [opts] - Additional fetch options
   * @returns {Promise<any>} Response data
   * @example
   * await http.del('/users/123');
   */
  del: (path, opts) => request(path, { method: 'DELETE', ...opts }),
};