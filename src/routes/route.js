import { registerUser } from '../services/userService.js';

const app = document.getElementById('app');

/**
 * Build a safe URL for fetching view fragments inside Vite (dev and build).
 * @param {string} name - The name of the view (without extension).
 * @returns {URL} The resolved URL for the view HTML file.
 */
const viewURL = (name) => new URL(`../views/${name}.html`, import.meta.url);

/**
 * Load an HTML fragment by view name and initialize its corresponding logic.
 * @async
 * @param {string} name - The view name to load (e.g., "home", "board").
 * @throws {Error} If the view cannot be fetched.
 */
async function loadView(name) {
  const res = await fetch(viewURL(name));
  if (!res.ok) throw new Error(`Failed to load view: ${name}`);
  const html = await res.text();
  app.innerHTML = html;

  if (name === 'home') initHome();
  if (name === 'board') initBoard();
  if (name === 'sign-up') initSignup();
  if (name === 'sign-in') initSignin();
  if (name === 'dashboard') initDashboard();
}

/**
 * Initialize the hash-based router.
 * Attaches an event listener for URL changes and triggers the first render.
 */
export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute(); // first render
}

/**
 * Handle the current route based on the location hash.
 * Fallback to 'home' if the route is unknown.
 */
function handleRoute() {
  const path = (location.hash.startsWith('#/') ? location.hash.slice(2) : '') || 'home';
  const known = ['home', 'board', 'sign-in', 'sign-up', 'dashboard'];
  const route = known.includes(path) ? path : 'home';

  loadView(route).catch(err => {
    console.error(err);
    app.innerHTML = `<p style="color:#ffb4b4">Error loading the view.</p>`;
  });
}

/* ---- View-specific logic ---- */

/**
 * Initialize the "home" view.
 * Attaches a submit handler to the register form to navigate to the board.
 */
function initHome() {

}

function initSignup() {
  const form = document.getElementById('sign-up-form');
  if (!form) return;
  // Evitar doble inicialización si la vista se renderiza varias veces
  if (form.dataset.tuduInit === 'true') return;
  form.dataset.tuduInit = 'true';

  const nombreInput = document.getElementById('name');
  const apellidoInput = document.getElementById('last-name');
  const emailInput = document.getElementById('sign-up-email');
  const passInput = document.getElementById('sign-up-password');
  const confirmInput = document.getElementById('confirm-password');
  const ageInput = document.getElementById('age');
  const submitBtn = document.getElementById('sign-up-button') || form.querySelector('button[type="submit"]');

  console.log('initSignup ejecutado', { form: !!form, nombre: !!nombreInput, apellido: !!apellidoInput, email: !!emailInput, pass: !!passInput, confirm: !!confirmInput, age: !!ageInput, submitBtn: !!submitBtn });

  if (!emailInput || !passInput || !confirmInput || !ageInput || !submitBtn) {
    console.warn('initSignup: faltan elementos del formulario, revisa los ids.');
    return;
  }

  // Regexs
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // suficiente para validar formato
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

  function validateForm() {
    const email = (emailInput.value || '').trim();
    const password = (passInput.value || '').trim();
    const confirm = (confirmInput.value || '').trim();
    const age = (ageInput.value || '').trim();

    let valid = true;
    const errors = [];

    if (!emailRegex.test(email)) { valid = false; errors.push('email'); }
    if (!passwordRegex.test(password)) { valid = false; errors.push('password'); }
    if (password !== confirm) { valid = false; errors.push('confirm'); }
    if (!/^\d+$/.test(age) || Number(age) < 13) { valid = false; errors.push('age'); }

    submitBtn.disabled = !valid;
    submitBtn.classList.toggle('enabled', valid);
    if (!valid) {
      submitBtn.setAttribute('title', 'Corrige: ' + errors.join(', '));
    } else {
      submitBtn.removeAttribute('title');
    }

    console.log('validateForm ->', { valid, errors });
  }

  // Añadir listeners (idempotente por data attr del form)
  [emailInput, passInput, confirmInput, ageInput].forEach((input) => {
    input.addEventListener('input', validateForm);
  });

  // Inicializa el estado del botón
  validateForm();

  // Submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // opcional: volver a validar antes de enviar
    validateForm();
    if (submitBtn.disabled) return;

    submitBtn.disabled = true;

    const nombre = nombreInput ? nombreInput.value.trim() : '';
    const apellido = apellidoInput ? apellidoInput.value.trim() : '';
    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    const age = ageInput.value.trim();

    try {
      await registerUser({ nombre, apellido, email, password, age });
      alert('✅ Registro exitoso 🎉');
      setTimeout(() => (location.hash = '#/board'), 400);
    } catch (err) {
      alert('❌ No se pudo registrar: ' + (err?.message || err));
      console.error('registerUser error', err);
      // re-evaluar si debe habilitarse (por ejemplo campos aún válidos)
      validateForm();
    } finally {
      // si campos válidos, validateForm dejará el botón habilitado; si no, quedará deshabilitado
      validateForm();
    }
  });
}


function initSignin() {
  const form = document.getElementById('sign-in-form');
  const emailInput = document.getElementById('sign-in-email');
  const passInput = document.getElementById('sign-in-password');
  const msg = document.getElementById('loginMsg');
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form || !emailInput || !passInput || !submitBtn) return;

  // Deshabilitar botón de entrada inicialmente
  submitBtn.disabled = true;

  // Validación en tiempo real
  function validateForm() {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    // Validar email formato RFC 5322
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);

    // Sólo habilitar si el correo y la contraseña están correctos
    submitBtn.disabled = !(isValidEmail && password.length > 0);
  }

  emailInput.addEventListener('input', validateForm);
  passInput.addEventListener('input', validateForm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';

    try {
      // Mandar credenciales al backend
      const data = await loginUser({
        email: emailInput.value.trim(),
        password: passInput.value.trim()
      });

      msg.textContent = 'Inicio de sesión exitoso';
      localStorage.setItem('token', data.token); // guardar JWT
      setTimeout(() => (location.hash = '#/dashboard'), 400);
    } catch (err) {
      msg.textContent = `Error: ${err.message}`;
    }
  });
}



function initDashboard() {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passInput = document.getElementById('password');
  const msg = document.getElementById('loginMsg');
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form || !emailInput || !passInput || !submitBtn) return;

  // Deshabilitar botón de entrada inicialmente
  submitBtn.disabled = true;

  // Validación en tiempo real
  function validateForm() {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    // Validar email formato RFC 5322
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);

    // Sólo habilitar si el correo y la contraseña están correctos
    submitBtn.disabled = !(isValidEmail && password.length > 0);
  }

  emailInput.addEventListener('input', validateForm);
  passInput.addEventListener('input', validateForm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';

    try {
      // Mandar credenciales al backend
      const data = await loginUser({
        email: emailInput.value.trim(),
        password: passInput.value.trim()
      });

      msg.textContent = 'Inicio de sesión exitoso';
      localStorage.setItem('token', data.token); // guardar JWT
      setTimeout(() => (location.hash = '#/dashboard'), 400);
    } catch (err) {
      msg.textContent = `Error: ${err.message}`;
    }
  });
}

/**
 * Initialize the "board" view.
 * Sets up the todo form, input, and list with create/remove/toggle logic.
 */
function initBoard() {
  const form = document.getElementById('todoForm');
  const input = document.getElementById('newTodo');
  const list = document.getElementById('todoList');
  if (!form || !input || !list) return;

  // Add new todo item
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return;

    const li = document.createElement('li');
    li.className = 'todo';
    li.innerHTML = `
      <label>
        <input type="checkbox" class="check">
        <span>${title}</span>
      </label>
      <button class="link remove" type="button">Eliminar</button>
    `;
    list.prepend(li);
    input.value = '';
  });

  // Handle remove and toggle completion
  list.addEventListener('click', (e) => {
    const li = e.target.closest('.todo');
    if (!li) return;
    if (e.target.matches('.remove')) li.remove();
    if (e.target.matches('.check')) li.classList.toggle('completed', e.target.checked);
  });
}