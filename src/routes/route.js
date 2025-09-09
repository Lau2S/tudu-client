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

function initHome() {
}

//  * Initialize the "home" view.
//  * Attaches a submit handler to the register form to navigate to the board.
   

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


  // Mostrar modal de "Olvidaste tu contraseña"
  const forgotLink = document.querySelector('.forgot-password-link');
  const modal = document.getElementById('recoveryPassword');
  const cancelBtn = document.getElementById('cancelTaskBtn');
  const closeBtn = modal?.querySelector('.close-modal');

  if (forgotLink && modal) {
    forgotLink.addEventListener('click', function(e) {
      e.preventDefault();
      modal.style.display = 'block';
    });
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

  }

  closeBtn?.addEventListener('click', () => modal.style.display = 'none');
  cancelBtn?.addEventListener('click', () => modal.style.display = 'none');

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
    console.log('Iniciando carga de tareas...');
    const tasks = await getTasks(); // Función que obtiene tareas del backend
    console.log('Tareas recibidas:', tasks);

    // Verificar que tasks sea un array
    if (!Array.isArray(tasks)) {
      console.error('Las tareas no son un array:', tasks);
      showToast('Error: formato de datos incorrecto', 'error');
      return;
    }

    const columns = {
      pending: document.querySelector('.pending-column .task-list'),
      progress: document.querySelector('.progress-column .task-list'),
      completed: document.querySelector('.completed-column .task-list')
    };

    // Verificar que las columnas existan
    Object.entries(columns).forEach(([key, col]) => {
      if (!col) {
        console.error(`Columna no encontrada: .${key}-column .task-list`);
      }
    });

    // Limpiar columnas existentes
    Object.values(columns).forEach(col => {
      if (col) col.innerHTML = '';
    });

    // Normalizar estados de tareas (en caso de inconsistencias)
    const normalizeStatus = (status) => {
      const statusMap = {
        'pending': 'pending',
        'pendiente': 'pending',
        'en_progreso': 'progress',
        'progress': 'progress',
        'in_progress': 'progress',
        'completed': 'completed',
        'completada': 'completed',
        'done': 'completed'
      };
      return statusMap[status?.toLowerCase()] || 'pending';
    };

    // Agrupar tareas por estado normalizado
    const tasksByStatus = {
      pending: [],
      progress: [],
      completed: []
    };

    tasks.forEach(task => {
      const normalizedStatus = normalizeStatus(task.status);
      if (tasksByStatus[normalizedStatus]) {
        tasksByStatus[normalizedStatus].push(task);
      }
    });

    console.log('Tareas agrupadas:', tasksByStatus);

    // Renderizar tareas en cada columna
    Object.entries(tasksByStatus).forEach(([status, taskList]) => {
      const col = columns[status];
      if (!col) {
        console.warn(`Columna no encontrada para estado: ${status}`);
        return;
      }

      if (taskList.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.style.cssText = `
          text-align: center;
          color: #888;
          padding: 20px;
          font-style: italic;
        `;
        emptyDiv.textContent = 'No hay tareas aún';
        col.appendChild(emptyDiv);
      } else {
        taskList.forEach(task => {
          const taskCard = createTaskCard(task);
          if (taskCard) {
            col.appendChild(taskCard);
          }
        });
      }
    });

    // Actualizar contadores
    updateColumnCounts(tasksByStatus);

    console.log('Tareas renderizadas correctamente');

  } catch (err) {
    console.error('Error cargando tareas:', err);
    showToast('Error cargando tareas: ' + (err.message || err), 'error');
  }
}

// ===========================
// ACTUALIZAR CONTADORES
// ===========================
function updateColumnCounts(tasksByStatus) {
  const counters = {
    pending: document.querySelector('.pending-column .column-count'),
    progress: document.querySelector('.progress-column .column-count'),
    completed: document.querySelector('.completed-column .column-count')
  };

  Object.entries(counters).forEach(([status, counter]) => {
    if (counter && tasksByStatus[status]) {
      counter.textContent = tasksByStatus[status].length;
    }
  });
}

// ===========================
// CREAR TARJETA DE TAREA
// ===========================
function createTaskCard(task) {
  if (!task) {
    console.error('Task es null o undefined');
    return null;
  }

  const card = document.createElement('div');
  card.className = 'task-card';
  card.dataset.taskId = task.id || task._id || '';
  const date = task.date
  const time = task.time

  // Validar datos de la tarea
  const title = task.title || 'Sin título';
  const detail = task.detail || task.description || '';
  

  let datetime = '';
  if (task.dueDate) {
    const [date, time] = task.dueDate.split('T');
    datetime = `Fecha: ${date}${time && time !== '00:00:00' ? ', ' + time.slice(0,5) : ''}`;
  }

  card.innerHTML = `
    <div class="task-options">
      <button class="task-option-btn edit-btn" title="Editar">✏️</button>
      <button class="task-option-btn delete-btn" title="Eliminar">🗑️</button>
    </div>
    <div class="task-title">${escapeHtml(title)}</div>
    <div class="task-description">${escapeHtml(detail)}</div>
    <div class="task-datetime">${datetime}</div>

  `;

  // Hacer las tarjetas arrastrables (opcional)
  card.draggable = true;

  return card;
}

// ===========================
// ESCAPAR HTML PARA SEGURIDAD
// ===========================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
      try {
        await logoutUser();
      } catch (err) {
        console.warn('Error en logout:', err);
      }
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

  

  if (!openBtn || !modal || !form) {
    console.warn('Elementos del modal no encontrados');
    return;
  }

  openBtn.addEventListener('click', () => {
    modal.style.display = 'block';
    form.reset();
  });

  closeBtn?.addEventListener('click', () => modal.style.display = 'none');
  cancelBtn?.addEventListener('click', () => modal.style.display = 'none');

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
    const date = form.taskDate.value;
    const time = form.taskTime.value;

    try {
      const data = new FormData(form);
      const currentUser = getCurrentUser();

      if (!currentUser?.email) {
        throw new Error('Usuario no autenticado');
      }

      const taskData = {
        title: data.get('taskTitle')?.trim() || '',
        detail: data.get('taskDesc')?.trim() || '',
        status: data.get('taskStatus') || 'pending',
        dueDate: data.get('taskDate') ?
          `${data.get('taskDate')}T${data.get('taskTime') || '00:00'}:00` : null,
        user_email: currentUser.email
      };

      if (!taskData.title) {
        throw new Error('El título de la tarea es obligatorio');
      }

      console.log('Creando tarea:', taskData);
      await createTask(taskData);
      await loadTasksFromBackend();
      modal.style.display = 'none';
      form.reset();
      showToast('✅ Tarea creada exitosamente', 'success');

    } catch (err) {
      console.error('Error creando tarea:', err);
      showToast('❌ Error al crear tarea: ' + (err.message || err), 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// // ===========================
// // EDITAR / ELIMINAR TAREAS
// // ===========================
// function initTaskActions() {
//   document.addEventListener('click', async e => {
//     const card = e.target.closest('.task-card');
//     if (!card) return;

//     const taskId = card.dataset.taskId;
//     if (!taskId) {
//       console.error('ID de tarea no encontrado');
//       return;
//     }

//     if (e.target.classList.contains('delete-btn')) {
//       if (!confirm('¿Seguro que quieres eliminar esta tarea?')) return;

//       try {
//         await deleteTask(taskId);
//         showToast('🗑️ Tarea eliminada', 'success');
//         await loadTasksFromBackend();
//       } catch (err) {
//         console.error('Error eliminando tarea:', err);
//         showToast('❌ Error eliminando: ' + (err.message || err), 'error');
//       }
//     }

//     if (e.target.classList.contains('edit-btn')) {
//       const titleEl = card.querySelector('.task-title');
//       const descEl = card.querySelector('.task-description');

//       const currentTitle = titleEl?.textContent || '';
//       const currentDesc = descEl?.textContent || '';

//       const newTitle = prompt('Nuevo título:', currentTitle);
//       if (newTitle === null || newTitle.trim() === '') return;

//       const newDesc = prompt('Nueva descripción:', currentDesc);
//       if (newDesc === null) return;

//       try {
//         await updateTask(taskId, {
//           title: newTitle.trim(),
//           detail: newDesc.trim()
//         });
//         showToast('✏️ Tarea actualizada', 'success');
//         await loadTasksFromBackend();
//       } catch (err) {
//         console.error('Error actualizando tarea:', err);
//         showToast('❌ Error actualizando: ' + (err.message || err), 'error');
//       }
//     }
//   });
// }

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
    transition: opacity 0.3s ease; max-width: 300px;
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.style.opacity = '1');

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}

// ===========================
// FUNCIÓN DE DEBUG (OPCIONAL)
// ===========================
function debugDashboard() {
  console.log('=== DEBUG DASHBOARD ===');
  console.log('Columnas encontradas:');
  console.log('- Pending:', document.querySelector('.pending-column .task-list'));
  console.log('- Progress:', document.querySelector('.progress-column .task-list'));
  console.log('- Completed:', document.querySelector('.completed-column .task-list'));
  console.log('Modal elementos:');
  console.log('- Create btn:', document.querySelector('.create-task-btn'));
  console.log('- Modal:', document.getElementById('createTask'));
  console.log('- Form:', document.getElementById('createTaskForm'));
}