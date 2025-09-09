import { registerUser, loginUser, logoutUser, isAuthenticated, getCurrentUser } from '../services/userService.js';
import { getTasks, createTask, updateTask, deleteTask, updateTaskStatus } from '../services/taskService.js';

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
/**
 * Mostrar notificación toast
 */


// ===========================
// INICIALIZAR DASHBOARD
// ===========================
async function initDashboard() {
  if (!isAuthenticated()) {
    location.hash = '#/sign-in';
    return;
  }

  const currentUser = getCurrentUser();
  const userNameEl = document.querySelector('.user-name');
  const userAvatar = document.querySelector('.user-avatar');

  if (userNameEl && userAvatar && currentUser?.email) {
    userNameEl.textContent = currentUser.email.split('@')[0];
    userAvatar.textContent = currentUser.email[0].toUpperCase();
  }

  await loadTasksFromBackend();
  initUserDropdown();
  initCreateTaskModal();
  initTaskActions();
}

// ===========================
// CARGAR TAREAS DESDE BACKEND
// ===========================
async function loadTasksFromBackend() {
  try {
    const tasks = await getTasks(); // Función que obtiene tareas del backend
    console.log('Tareas recibidas:', tasks);

    const columns = {
      pending: document.querySelector('.pending-column .task-list'),
      progress: document.querySelector('.progress-column .task-list'),
      completed: document.querySelector('.completed-column .task-list')
    };

    // Limpiar columnas
    Object.values(columns).forEach(col => col.innerHTML = '');

    // Agrupar tareas por estado
    const tasksByStatus = {
      pending: tasks.filter(t => t.status === 'pending'),
      progress: tasks.filter(t => t.status === 'progress'),
      completed: tasks.filter(t => t.status === 'completed')
    };

    // Renderizar tareas
    Object.entries(tasksByStatus).forEach(([status, list]) => {
      const col = columns[status];
      if (!col) return;

      if (list.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.textContent = 'No hay tareas aún';
        col.appendChild(emptyDiv);
      } else {
        list.forEach(task => col.appendChild(createTaskCard(task)));
      }
    });

    // Actualizar contadores
    document.querySelector('.pending-column .column-count').textContent = tasksByStatus.pending.length;
    document.querySelector('.progress-column .column-count').textContent = tasksByStatus.progress.length;
    document.querySelector('.completed-column .column-count').textContent = tasksByStatus.completed.length;

  } catch (err) {
    console.error(err);
    showToast('Error cargando tareas', 'error');
  }
}

// ===========================
// CREAR TARJETA DE TAREA
// ===========================
function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.dataset.taskId = task.id;

  let dateHtml = '';
  if (task.dueDate) {
    const d = new Date(task.dueDate);
    dateHtml = `<div class="task-datetime">📅 ${d.toLocaleDateString()} ⏰ ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>`;
  }

  card.innerHTML = `
        <div class="task-options">
            <button class="task-option-btn edit-btn" title="Editar">✏️</button>
            <button class="task-option-btn delete-btn" title="Eliminar">🗑️</button>
        </div>
        <div class="task-title">${task.title}</div>
        <div class="task-description">${task.detail || ''}</div>
        ${dateHtml}
    `;
  return card;
}

// ===========================
// MENU USUARIO Y LOGOUT
// ===========================
function initUserDropdown() {
  const userProfile = document.querySelector('.user-profile');
  if (!userProfile) return;
  const dropdown = userProfile.querySelector('.user-dropdown');

  userProfile.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('active');
    userProfile.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('active');
    userProfile.classList.remove('active');
  });

  const logoutOption = document.getElementById('logoutOption');
  if (logoutOption) {
    logoutOption.addEventListener('click', async () => {
      try { await logoutUser(); } catch (err) { console.warn(err); }
      localStorage.clear();
      sessionStorage.clear();
      location.hash = '#/sign-in';
      showToast('Sesión cerrada correctamente', 'success');
    });
  }
}

// ===========================
// MODAL CREAR TAREA
// ===========================
function initCreateTaskModal() {
  const openBtn = document.querySelector('.create-task-btn');
  const modal = document.getElementById('createTask');
  const closeBtn = modal?.querySelector('.close-modal');
  const form = document.getElementById('createTaskForm');
  const cancelBtn = document.getElementById('cancelTaskBtn');
  if (!openBtn || !modal || !form) return;

  openBtn.addEventListener('click', () => { modal.style.display = 'block'; form.reset(); });
  closeBtn?.addEventListener('click', () => modal.style.display = 'none');
  cancelBtn?.addEventListener('click', () => modal.style.display = 'none');
  modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    try {
      const data = new FormData(form);
      const currentUser = getCurrentUser();
      const taskData = {
        title: data.get('taskTitle').trim(),
        detail: data.get('taskDesc').trim(),
        status: data.get('taskStatus'),
        dueDate: data.get('taskDate') ? `${data.get('taskDate')}T${data.get('taskTime') || '00:00'}:00` : null,
        user_email: currentUser.email
      };

      await createTask(taskData);
      await loadTasksFromBackend();
      modal.style.display = 'none';
      form.reset();
      showToast('✅ Tarea creada', 'success');
    } catch (err) {
      console.error(err);
      showToast('❌ Error al crear tarea', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// ===========================
// EDITAR / ELIMINAR TAREAS
// ===========================
function initTaskActions() {
  document.addEventListener('click', async e => {
    const card = e.target.closest('.task-card');
    if (!card) return;
    const taskId = card.dataset.taskId;

    if (e.target.classList.contains('delete-btn')) {
      if (!confirm('¿Seguro que quieres eliminar esta tarea?')) return;
      try {
        await deleteTask(taskId);
        showToast('🗑️ Tarea eliminada', 'success');
        await loadTasksFromBackend();
      } catch (err) {
        console.error(err);
        showToast('❌ Error eliminando', 'error');
      }
    }

    if (e.target.classList.contains('edit-btn')) {
      const title = card.querySelector('.task-title').textContent;
      const desc = card.querySelector('.task-description').textContent;
      const newTitle = prompt('Nuevo título:', title);
      if (newTitle === null) return;
      const newDesc = prompt('Nueva descripción:', desc);
      if (newDesc === null) return;
      try {
        await updateTask(taskId, { title: newTitle.trim(), detail: newDesc.trim() });
        showToast('✏️ Tarea actualizada', 'success');
        await loadTasksFromBackend();
      } catch (err) {
        console.error(err);
        showToast('❌ Error actualizando', 'error');
      }
    }
  });
}

// ===========================
// NOTIFICACIONES TOAST
// ===========================
function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
        color: white; padding: 12px 20px; border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 1000; opacity: 0;
        transition: opacity 0.3s ease;
    `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.style.opacity = '1');
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}
