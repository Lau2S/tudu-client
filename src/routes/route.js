import { registerUser, loginUser, logoutUser, isAuthenticated, getCurrentUser } from '../services/userService.js';

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
      setTimeout(() => (location.hash = '#/sign-in'), 400);
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

/**
 * Initialize the "sign-in" view.
 * ACTUALIZADA para conectar correctamente con el backend
 */
function initSignin() {
  const form = document.getElementById('sign-in-form');
  const emailInput = document.getElementById('sign-in-email');
  const passInput = document.getElementById('sign-in-password');
  const msg = document.getElementById('loginMsg');
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form || !emailInput || !passInput || !submitBtn) {
    console.warn('initSignin: faltan elementos del formulario, revisa los ids.');
    return;
  }

  // Evitar doble inicialización
  if (form.dataset.tuduInit === 'true') return;
  form.dataset.tuduInit = 'true';

  // Verificar si ya está autenticado al cargar la vista
  if (isAuthenticated()) {
    location.hash = '#/dashboard';
    return;
  }

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
    const isValid = isValidEmail && password.length > 0;
    submitBtn.disabled = !isValid;
    submitBtn.classList.toggle('enabled', isValid);

    // Limpiar mensaje anterior
    if (msg) msg.textContent = '';
  }

  emailInput.addEventListener('input', validateForm);
  passInput.addEventListener('input', validateForm);

  // Validar al cargar
  validateForm();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Limpiar mensaje anterior
    if (msg) msg.textContent = '';

    // Validar una vez más
    validateForm();
    if (submitBtn.disabled) return;

    // Deshabilitar botón y cambiar texto
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Iniciando sesión...';

    try {
      // Mandar credenciales al backend (usando la ruta correcta)
      const data = await loginUser({
        email: emailInput.value.trim(),
        password: passInput.value.trim()
      });

      if (msg) {
        msg.textContent = 'Inicio de sesión exitoso';
        msg.style.color = '#28a745';
      }

      // Guardar JWT token (tu backend devuelve { message: "Login successful", token: "..." })
      localStorage.setItem('token', data.token);

      // Decodificar token para guardar info del usuario
      try {
        const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
        localStorage.setItem('userId', tokenPayload.userId);
        localStorage.setItem('userEmail', tokenPayload.email);
        console.log('Usuario logueado:', { userId: tokenPayload.userId, email: tokenPayload.email });
      } catch (tokenError) {
        console.warn('No se pudo decodificar el token:', tokenError);
      }

      // Redirigir al dashboard después de un breve delay
      setTimeout(() => (location.hash = '#/dashboard'), 1000);
    } catch (err) {
      if (msg) {
        msg.textContent = `Error: ${err.message}`;
        msg.style.color = '#dc3545';
      }
      console.error('Login error:', err);
    } finally {
      // Restaurar el botón
      submitBtn.textContent = originalText;
      validateForm(); // Esto habilitará el botón si los datos siguen siendo válidos
    }
  });
}

/**
 * Initialize the "dashboard" view.
 * ACTUALIZADA para proteger con autenticación
 */
function initDashboard() {
  // Verificar autenticación antes de mostrar dashboard
  if (!isAuthenticated()) {
    console.log('Usuario no autenticado, redirigiendo a sign-in');
    location.hash = '#/sign-in';
    return;
  }

  console.log('Dashboard inicializado para usuario:', getCurrentUser());

  // Buscar botón de logout si existe
  const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('[data-action="logout"]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await logoutUser();
        console.log('Logout exitoso');
      } catch (error) {
        console.error('Error durante logout:', error);
        // Aún así limpiar y redirigir
        localStorage.clear();
        location.hash = '#/sign-in';
      }
    });
  }
  const openBtn = document.querySelector('.create-task-btn');
  const modal = document.getElementById('createTask');
  const closeBtn = modal.querySelector('.close-modal');
  const form = document.getElementById('createTaskForm');
  const cancelBtn = document.getElementById('cancelTaskBtn');

  // Mostrar modal
  openBtn.addEventListener('click', () => {
    modal.style.display = 'block';
  });

  // Cerrar modal con la X
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });


  cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Manejar envío del formulario
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = form.taskTitle.value.trim();
    const desc = form.taskDesc.value.trim();
    const date = form.taskDate.value;
    const time = form.taskTime.value;
    const status = form.taskStatus.value;

    let datetime = '';
    if (date && time) datetime = `Fecha: ${date}, ${time}`;
    else if (date) datetime = `Fecha: ${date}`;
    else if (time) datetime = `Hora: ${time}`;

    // Buscar el contenedor de columna según el estado
    let columnClass = '';
    if (status === 'pending') columnClass = '.pending-column .task-list';
    else if (status === 'progress') columnClass = '.progress-column .task-list';
    else if (status === 'completed') columnClass = '.completed-column .task-list';
    const column = document.querySelector(columnClass);

    const emptyMsg = column.querySelector('.empty-state');
    if (emptyMsg) emptyMsg.style.display = 'none';


    // Crear la tarjeta de tarea
    if (column) {
      const card = document.createElement('div');
      card.className = 'task-card';
      card.innerHTML = `
        <div class="task-options">
          <button class="task-option-btn">✏️</button>
          <button class="task-option-btn">🗑️</button>
        </div>
        <div class="task-title">${title}</div>
        <div class="task-description">${desc}</div>
        <div class="task-datetime">${datetime}</div>
      `;
      column.prepend(card);
    }

    modal.style.display = 'none';
    form.reset();

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