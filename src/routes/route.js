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
  const form = document.getElementById('registerForm');
  const userInput = document.getElementById('username');
  const passInput = document.getElementById('password');
  const msg = document.getElementById('registerMsg');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';

    const username = userInput?.value.trim();
    const password = passInput?.value.trim();

    if (!username || !password) {
      msg.textContent = 'Por favor completa usuario y contraseña.';
      return;
    }

    form.querySelector('button[type="submit"]').disabled = true;

    try {
      const data = await registerUser({ username, password });
      msg.textContent = 'Registro exitoso';

      setTimeout(() => (location.hash = '#/board'), 400);
    } catch (err) {
      msg.textContent = `No se pudo registrar: ${err.message}`;
    } finally {
      form.querySelector('button[type="submit"]').disabled = false;
    }
  });
}

function initSignin() {

}

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