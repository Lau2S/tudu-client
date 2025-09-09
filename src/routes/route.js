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
  if (form.dataset.tuduInit === 'true') return;
  form.dataset.tuduInit = 'true';

  const nombreInput = document.getElementById('name');
  const apellidoInput = document.getElementById('last-name');
  const emailInput = document.getElementById('sign-up-email');
  const passInput = document.getElementById('sign-up-password');
  const confirmInput = document.getElementById('confirm-password');
  const ageInput = document.getElementById('age');
  const submitBtn = document.getElementById('sign-up-button') || form.querySelector('button[type="submit"]');

  if (!emailInput || !passInput || !confirmInput || !ageInput || !submitBtn) return;

  // Crear contenedor para error de confirmación si no existe
  let confirmError = document.createElement('div');
  confirmError.style.color = 'red';
  confirmError.style.fontSize = '0.85rem';
  confirmError.style.marginTop = '-0.5rem';
  confirmError.style.marginBottom = '0.8rem';
  confirmError.style.display = 'none';
  confirmInput.parentNode.insertBefore(confirmError, confirmInput.nextSibling);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    if (password !== confirm) {
      valid = false;
      errors.push('confirm');

      // Mostrar mensaje debajo del confirm password
      confirmError.textContent = '❌ Las contraseñas no coinciden';
      confirmError.style.display = 'block';
    } else {
      confirmError.textContent = '';
      confirmError.style.display = 'none';
    }

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

  [emailInput, passInput, confirmInput, ageInput].forEach(input => {
    input.addEventListener('input', validateForm);
  });

  validateForm();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
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
      validateForm();
    } finally {
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
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form || !emailInput || !passInput || !submitBtn) {
    console.warn('initSignin: faltan elementos del formulario, revisa los ids.');
    return;
  }

  if (form.dataset.tuduInit === 'true') return;
  form.dataset.tuduInit = 'true';

  if (isAuthenticated()) {
    location.hash = '#/dashboard';
    return;
  }

  submitBtn.disabled = true;

  function validateForm() {
    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);
    const isValid = isValidEmail && password.length > 0;

    submitBtn.disabled = !isValid;
    submitBtn.classList.toggle('enabled', isValid);
  }

  emailInput.addEventListener('input', validateForm);
  passInput.addEventListener('input', validateForm);
  validateForm();

  // Función para mostrar ventana emergente tipo toast
  function showToast(message) {
    let toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = '#dc3545';
    toast.style.color = '#fff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    toast.style.zIndex = '1000';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';

    document.body.appendChild(toast);

    // Mostrar con animación
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });

    // Desaparece después de 3 segundos
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    validateForm();
    if (submitBtn.disabled) return;

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Iniciando sesión...';

    try {
      const data = await loginUser({
        email: emailInput.value.trim(),
        password: passInput.value.trim()
      });

      localStorage.setItem('token', data.token);

      try {
        const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
        localStorage.setItem('userId', tokenPayload.userId);
        localStorage.setItem('userEmail', tokenPayload.email);
        console.log('Usuario logueado:', { userId: tokenPayload.userId, email: tokenPayload.email });
      } catch (tokenError) {
        console.warn('No se pudo decodificar el token:', tokenError);
      }

      setTimeout(() => (location.hash = '#/dashboard'), 1000);
    } catch (err) {
      showToast('⚠️ Credenciales incorrectas');
      console.error('Login error:', err);
    } finally {
      submitBtn.textContent = originalText;
      validateForm();
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

  // ---------------------------
  // MENÚ DESPLEGABLE DE USUARIO CON LOGOUT
  // ---------------------------
  const userProfile = document.querySelector('.user-profile');
  if (userProfile) {
    const dropdownMenu = userProfile.querySelector('.user-dropdown');

    // Mostrar/ocultar menú al hacer clic
    userProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('active');
      userProfile.classList.toggle('active'); // Flecha gira
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', () => {
      dropdownMenu.classList.remove('active');
      userProfile.classList.remove('active');
    });

    // Opciones del menú
    const profileOption = document.getElementById('profileOption');
    const logoutOption = document.getElementById('logoutOption');

    if (profileOption) {
      profileOption.addEventListener('click', () => {
        alert('Ir a perfil'); // Aquí puedes redirigir a tu página de perfil
        dropdownMenu.classList.remove('active');
        userProfile.classList.remove('active');
      });
    }

    if (logoutOption) {
      logoutOption.addEventListener('click', async () => {
        try {
          // Llamada a tu servicio real de logout
          await logoutUser(); // Debe limpiar token y sesión en backend
          console.log('Logout exitoso');

          // Limpiar almacenamiento local y sesión
          localStorage.clear();
          sessionStorage.clear();

          // Redirigir al login
          location.hash = '#/sign-in';
        } catch (error) {
          console.error('Error durante logout:', error);
          localStorage.clear();
          sessionStorage.clear();
          location.hash = '#/sign-in';
        }
      });
    }
  }

  // ---------------------------
  // MODAL DE CREAR TAREA
  // ---------------------------
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

