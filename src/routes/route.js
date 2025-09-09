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
function initDashboard() {
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
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

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

// ===========================
// EDITAR / ELIMINAR TAREAS
// ===========================
function initTaskActions() {
  document.addEventListener('click', async e => {
    const card = e.target.closest('.task-card');
    if (!card) return;

    const taskId = card.dataset.taskId;
    if (!taskId) {
      console.error('ID de tarea no encontrado');
      return;
    }

    if (e.target.classList.contains('delete-btn')) {
      if (!confirm('¿Seguro que quieres eliminar esta tarea?')) return;

      try {
        await deleteTask(taskId);
        showToast('🗑️ Tarea eliminada', 'success');
        await loadTasksFromBackend();
      } catch (err) {
        console.error('Error eliminando tarea:', err);
        showToast('❌ Error eliminando: ' + (err.message || err), 'error');
      }
    }

    if (e.target.classList.contains('edit-btn')) {
      const titleEl = card.querySelector('.task-title');
      const descEl = card.querySelector('.task-description');

      const currentTitle = titleEl?.textContent || '';
      const currentDesc = descEl?.textContent || '';

      const newTitle = prompt('Nuevo título:', currentTitle);
      if (newTitle === null || newTitle.trim() === '') return;

      const newDesc = prompt('Nueva descripción:', currentDesc);
      if (newDesc === null) return;

      try {
        await updateTask(taskId, {
          title: newTitle.trim(),
          detail: newDesc.trim()
        });
        showToast('✏️ Tarea actualizada', 'success');
        await loadTasksFromBackend();
      } catch (err) {
        console.error('Error actualizando tarea:', err);
        showToast('❌ Error actualizando: ' + (err.message || err), 'error');
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
    const title = form.taskTitle.value.trim();
    const desc = form.taskDesc.value.trim();
    const date = form.taskDate.value;
    const time = form.taskTime.value;
    const status = form.taskStatus.value;

  let datetime = '';
  if (date && time) datetime = `Fecha: ${date}, ${time}`;
  else if (date) datetime =  `Fecha: ${date}`;
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

  // Aquí puedes agregar el resto de la lógica del dashboard
  // Por ejemplo, cargar las tareas del usuario, mostrar su perfil, etc.
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