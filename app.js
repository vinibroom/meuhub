/* =========================================================
   MeuHub — Personal Dashboard Application Logic
   ========================================================= */

const STORAGE_KEYS = {
  TASKS: 'meuhub_tasks_v1',
  WATER: 'meuhub_water_v1',
  POMO: 'meuhub_pomo_v1',
  NOTES: 'meuhub_notes_v1'
};

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  if (navigator.vibrate) {
    navigator.vibrate(25);
  }
  setTimeout(() => {
    toast.remove();
  }, 2400);
}

/* ---------------------------------------------------------
   1. INITIAL DATA & STATE
   --------------------------------------------------------- */
let tasks = [];
let taskFilter = 'all';

let waterData = {
  date: getTodayKey(),
  currentMl: 0,
  goalMl: 2500,
  logs: []
};

let pomoData = {
  date: getTodayKey(),
  cycles: 0,
  focusedMinutes: 0
};

let notes = [];

function loadAllState() {
  try {
    const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (rawTasks) {
      tasks = JSON.parse(rawTasks);
    } else {
      tasks = [
        { id: 't1', text: 'Testar o MeuHub no celular 📱', priority: 'alta', done: false },
        { id: 't2', text: 'Beber 2 copos de água 💧', priority: 'normal', done: false },
        { id: 't3', text: 'Fazer 1 sessão de foco Pomodoro ⏱️', priority: 'baixa', done: false }
      ];
      saveTasks();
    }

    const rawWater = localStorage.getItem(STORAGE_KEYS.WATER);
    if (rawWater) {
      const parsed = JSON.parse(rawWater);
      if (parsed.date === getTodayKey()) {
        waterData = parsed;
      } else {
        waterData = {
          date: getTodayKey(),
          currentMl: 0,
          goalMl: parsed.goalMl || 2500,
          logs: []
        };
      }
    }

    const rawPomo = localStorage.getItem(STORAGE_KEYS.POMO);
    if (rawPomo) {
      const parsed = JSON.parse(rawPomo);
      if (parsed.date === getTodayKey()) {
        pomoData = parsed;
      }
    }

    const rawNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (rawNotes) {
      notes = JSON.parse(rawNotes);
    } else {
      notes = [
        {
          id: 'n1',
          title: 'Bem-vindo ao MeuHub! 🚀',
          body: 'Este aplicativo funciona 100% offline no seu celular. Tudo que você anotar fica salvo diretamente no aparelho.',
          color: 'indigo',
          date: new Date().toLocaleDateString('pt-BR')
        }
      ];
      saveNotes();
    }
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
  }
}

function saveTasks() {
  try { localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks)); } catch (e) {}
}

function saveWater() {
  try { localStorage.setItem(STORAGE_KEYS.WATER, JSON.stringify(waterData)); } catch (e) {}
}

function savePomo() {
  try { localStorage.setItem(STORAGE_KEYS.POMO, JSON.stringify(pomoData)); } catch (e) {}
}

function saveNotes() {
  try { localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes)); } catch (e) {}
}

/* ---------------------------------------------------------
   2. HEADER & DARK MODE TOGGLE (Modern Web Guidance compliant)
   --------------------------------------------------------- */
function initHeaderAndTheme() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia! ☀️' : hour < 18 ? 'Boa tarde! 🌤️' : 'Boa noite! 🌙';
  document.getElementById('greetingText').textContent = greeting;

  const dateFmt = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  }).format(now);
  document.getElementById('currentDateText').textContent = dateFmt;

  const metaScheme = document.querySelector('meta[name="color-scheme"]');
  const themeBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const darkMql = window.matchMedia('(prefers-color-scheme: dark)');

  function getRenderedScheme() {
    let stored = null;
    try { stored = localStorage.getItem('color-scheme'); } catch (e) {}
    if (stored === 'light' || stored === 'dark') return stored;
    return darkMql.matches ? 'dark' : 'light';
  }

  function updateThemeIcon() {
    const current = getRenderedScheme();
    themeIcon.textContent = current === 'dark' ? '🌙' : '☀️';
  }

  function applySchemeAttributes(val) {
    metaScheme.content = val;
    if (val === 'light' || val === 'dark') {
      document.documentElement.setAttribute('data-theme', val);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  // Sync initial attribute if stored
  try {
    const initialStored = localStorage.getItem('color-scheme');
    if (initialStored === 'light' || initialStored === 'dark') {
      document.documentElement.setAttribute('data-theme', initialStored);
    }
  } catch (e) {}

  // Two-state toggle logic per `dark-mode-toggle` guidance:
  // Target = opposite of currently rendered scheme.
  // If target matches system preference, remove stored value and restore 'light dark'.
  themeBtn.addEventListener('click', () => {
    const rendered = getRenderedScheme();
    const target = rendered === 'dark' ? 'light' : 'dark';
    const systemPref = darkMql.matches ? 'dark' : 'light';

    if (target === systemPref) {
      try { localStorage.removeItem('color-scheme'); } catch (e) {}
      applySchemeAttributes('light dark');
      showToast(`Tema ${target === 'dark' ? 'Escuro 🌙' : 'Claro ☀️'} ativado`);
    } else {
      try { localStorage.setItem('color-scheme', target); } catch (e) {}
      applySchemeAttributes(target);
      showToast(`Tema ${target === 'dark' ? 'Escuro 🌙' : 'Claro ☀️'} ativado`);
    }
    updateThemeIcon();
  });

  darkMql.addEventListener('change', updateThemeIcon);
  window.addEventListener('storage', (e) => {
    if (e.key === 'color-scheme') {
      metaScheme.content = e.newValue ?? 'light dark';
      updateThemeIcon();
    }
  });

  updateThemeIcon();
}

/* ---------------------------------------------------------
   3. TAB NAVIGATION
   --------------------------------------------------------- */
function switchTab(tabName) {
  document.querySelectorAll('.tab-view').forEach((sec) => {
    if (sec.id === `view-${tabName}`) {
      sec.hidden = false;
      sec.classList.add('active');
    } else {
      sec.hidden = true;
      sec.classList.remove('active');
    }
  });

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('[data-goto]').forEach((el) => {
    el.addEventListener('click', () => switchTab(el.dataset.goto));
  });

  document.getElementById('quickAddWaterBtn').addEventListener('click', () => {
    addWater(250);
  });

  document.getElementById('quickStartPomoBtn').addEventListener('click', () => {
    switchTab('pomodoro');
    if (!pomoTimerId) togglePomodoro();
  });

  document.getElementById('quickNewNoteBtn').addEventListener('click', () => {
    switchTab('notes');
    document.getElementById('noteTitleInput').focus();
  });
}

/* ---------------------------------------------------------
   4. TASKS MODULE
   --------------------------------------------------------- */
function addTask(text, priority = 'normal') {
  const clean = text.trim();
  if (!clean) return;
  tasks.unshift({
    id: 'task_' + Date.now(),
    text: clean,
    priority,
    done: false
  });
  saveTasks();
  renderTasks();
  updateHomeDashboard();
  showToast('Tarefa adicionada ✅');
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveTasks();
  renderTasks();
  updateHomeDashboard();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
  updateHomeDashboard();
  showToast('Tarefa removida');
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item ${task.done ? 'done' : ''}`;

  const label = document.createElement('label');
  label.className = 'task-label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'visually-hidden';
  checkbox.checked = task.done;
  checkbox.addEventListener('change', () => toggleTask(task.id));

  const spanText = document.createElement('span');
  spanText.className = 'task-text';
  spanText.textContent = task.text;

  label.appendChild(checkbox);
  label.appendChild(spanText);
  li.appendChild(label);

  if (task.priority && task.priority !== 'normal') {
    const badge = document.createElement('span');
    badge.className = `priority-tag priority-${task.priority}`;
    badge.textContent = task.priority;
    li.appendChild(badge);
  }

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'task-delete-btn';
  delBtn.setAttribute('aria-label', 'Excluir tarefa');
  delBtn.textContent = '✕';
  delBtn.addEventListener('click', () => deleteTask(task.id));
  li.appendChild(delBtn);

  return li;
}

function renderTasks() {
  const fullList = document.getElementById('fullTaskList');
  const homeList = document.getElementById('homeTaskList');
  fullList.innerHTML = '';
  homeList.innerHTML = '';

  const filtered = tasks.filter((t) => {
    if (taskFilter === 'pending') return !t.done;
    if (taskFilter === 'done') return t.done;
    return true;
  });

  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhuma tarefa encontrada por aqui 🎉';
    fullList.appendChild(empty);
  } else {
    filtered.forEach((task) => fullList.appendChild(createTaskElement(task)));
  }

  const pendingForHome = tasks.filter((t) => !t.done).slice(0, 4);
  if (pendingForHome.length === 0) {
    const emptyHome = document.createElement('li');
    emptyHome.className = 'empty-state';
    emptyHome.textContent = 'Tudo em dia! Adicione uma tarefa acima.';
    homeList.appendChild(emptyHome);
  } else {
    pendingForHome.forEach((task) => homeList.appendChild(createTaskElement(task)));
  }
}

function initTasksModule() {
  document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('taskInput');
    const prio = document.getElementById('taskPriority');
    addTask(input.value, prio.value);
    input.value = '';
  });

  document.getElementById('homeQuickTaskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('homeQuickTaskInput');
    addTask(input.value, 'normal');
    input.value = '';
  });

  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      taskFilter = btn.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('active', b === btn));
      renderTasks();
    });
  });

  document.getElementById('clearDoneTasksBtn').addEventListener('click', () => {
    const before = tasks.length;
    tasks = tasks.filter((t) => !t.done);
    if (tasks.length < before) {
      saveTasks();
      renderTasks();
      updateHomeDashboard();
      showToast('Tarefas concluídas limpas');
    }
  });
}

/* ---------------------------------------------------------
   5. POMODORO TIMER MODULE
   --------------------------------------------------------- */
const RING_CIRCUMFERENCE = 2 * Math.PI * 96; // r=96 -> 603.18
let pomoTotalSeconds = 25 * 60;
let pomoRemainingSeconds = 25 * 60;
let pomoCurrentMode = 'focus';
let pomoTimerId = null;

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  } catch (e) {}
  if (navigator.vibrate) {
    navigator.vibrate([150, 80, 150]);
  }
}

function renderPomodoro() {
  const mins = Math.floor(pomoRemainingSeconds / 60);
  const secs = pomoRemainingSeconds % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  document.getElementById('pomoTimeDisplay').textContent = formatted;

  const progressFraction = 1 - pomoRemainingSeconds / pomoTotalSeconds;
  const offset = RING_CIRCUMFERENCE * progressFraction;
  const ringEl = document.getElementById('pomoRingProgress');
  ringEl.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
  ringEl.style.strokeDashoffset = `${offset}`;

  const startBtn = document.getElementById('pomoStartPauseBtn');
  const statusEl = document.getElementById('pomoStatusText');
  if (pomoTimerId) {
    startBtn.textContent = '⏸️ Pausar';
    statusEl.textContent = pomoCurrentMode === 'focus' ? 'Focando agora... 🔥' : 'Descansando... ☕';
  } else {
    startBtn.textContent = pomoRemainingSeconds < pomoTotalSeconds ? '▶️ Continuar' : '▶️ Iniciar';
    statusEl.textContent = 'Pronto para iniciar';
  }

  document.getElementById('pomoCyclesCount').textContent = pomoData.cycles;
  document.getElementById('pomoMinutesCount').textContent = `${pomoData.focusedMinutes} min`;
  updateHomeDashboard();
}

function togglePomodoro() {
  if (pomoTimerId) {
    clearInterval(pomoTimerId);
    pomoTimerId = null;
    renderPomodoro();
    return;
  }

  pomoTimerId = setInterval(() => {
    if (pomoRemainingSeconds > 0) {
      pomoRemainingSeconds--;
      renderPomodoro();
    } else {
      clearInterval(pomoTimerId);
      pomoTimerId = null;
      playBeep();
      if (pomoCurrentMode === 'focus') {
        pomoData.cycles += 1;
        pomoData.focusedMinutes += Math.round(pomoTotalSeconds / 60);
        savePomo();
        showToast('🎉 Ciclo Pomodoro concluído!');
      } else {
        showToast('⏰ Pausa encerrada! Hora de voltar.');
      }
      pomoRemainingSeconds = pomoTotalSeconds;
      renderPomodoro();
    }
  }, 1000);

  renderPomodoro();
}

function resetPomodoro() {
  if (pomoTimerId) {
    clearInterval(pomoTimerId);
    pomoTimerId = null;
  }
  pomoRemainingSeconds = pomoTotalSeconds;
  renderPomodoro();
}

function initPomodoroModule() {
  document.getElementById('pomoStartPauseBtn').addEventListener('click', togglePomodoro);
  document.getElementById('pomoResetBtn').addEventListener('click', resetPomodoro);

  document.querySelectorAll('[data-pomo-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (pomoTimerId) {
        clearInterval(pomoTimerId);
        pomoTimerId = null;
      }
      document.querySelectorAll('[data-pomo-mode]').forEach((b) => b.classList.toggle('active', b === btn));
      pomoCurrentMode = btn.dataset.pomoMode;
      const mins = parseInt(btn.dataset.minutes, 10) || 25;
      pomoTotalSeconds = mins * 60;
      pomoRemainingSeconds = pomoTotalSeconds;
      renderPomodoro();
    });
  });
}

/* ---------------------------------------------------------
   6. WATER / HYDRATION MODULE
   --------------------------------------------------------- */
function addWater(amountMl) {
  const nextVal = Math.max(0, waterData.currentMl + amountMl);
  const diff = nextVal - waterData.currentMl;
  waterData.currentMl = nextVal;

  if (diff !== 0) {
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    waterData.logs.unshift({
      time: timeStr,
      amount: diff
    });
    if (waterData.logs.length > 15) waterData.logs.pop();
  }

  saveWater();
  renderWater();
  updateHomeDashboard();
  showToast(amountMl > 0 ? `💧 +${amountMl} ml registrados!` : `↩️ ${amountMl} ml ajustados`);
}

function renderWater() {
  const pct = Math.min(100, Math.round((waterData.currentMl / waterData.goalMl) * 100));
  document.getElementById('waterFillLevel').style.height = `${pct}%`;
  document.getElementById('waterCurrentText').textContent = `${waterData.currentMl} ml`;
  document.getElementById('waterPercentText').textContent = `${pct}% da meta (${waterData.goalMl} ml)`;
  document.getElementById('waterGoalLabel').textContent = `${waterData.goalMl} ml`;

  const slider = document.getElementById('waterGoalRange');
  slider.value = waterData.goalMl;

  const logList = document.getElementById('waterLogList');
  logList.innerHTML = '';
  if (waterData.logs.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhum registro de água hoje ainda.';
    logList.appendChild(empty);
  } else {
    waterData.logs.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'water-log-item';
      const left = document.createElement('span');
      left.textContent = item.amount > 0 ? `💧 +${item.amount} ml` : `↩️ ${item.amount} ml`;
      const right = document.createElement('span');
      right.textContent = item.time;
      li.append(left, right);
      logList.appendChild(li);
    });
  }
}

function initWaterModule() {
  document.querySelectorAll('[data-water-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const amt = parseInt(btn.dataset.waterAdd, 10);
      addWater(amt);
    });
  });

  const slider = document.getElementById('waterGoalRange');
  slider.addEventListener('input', (e) => {
    waterData.goalMl = parseInt(e.target.value, 10) || 2500;
    const min = parseInt(slider.min, 10);
    const max = parseInt(slider.max, 10);
    const pct = ((waterData.goalMl - min) / (max - min)) * 100;
    slider.style.setProperty('--progress', `${pct}%`);
    saveWater();
    renderWater();
    updateHomeDashboard();
  });

  document.getElementById('resetWaterBtn').addEventListener('click', () => {
    waterData.currentMl = 0;
    waterData.logs = [];
    saveWater();
    renderWater();
    updateHomeDashboard();
    showToast('Contador de água zerado');
  });
}

/* ---------------------------------------------------------
   7. QUICK NOTES MODULE
   --------------------------------------------------------- */
function renderNotes(query = '') {
  const grid = document.getElementById('notesGrid');
  grid.innerHTML = '';
  const q = query.trim().toLowerCase();

  const filtered = notes.filter(
    (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhuma nota encontrada 📝';
    grid.appendChild(empty);
    return;
  }

  filtered.forEach((note) => {
    const card = document.createElement('article');
    card.className = `note-card note-color-${note.color || 'indigo'}`;

    const header = document.createElement('div');
    header.className = 'note-card-header';

    const title = document.createElement('h3');
    title.className = 'note-card-title';
    title.textContent = note.title;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'task-delete-btn';
    delBtn.setAttribute('aria-label', 'Excluir nota');
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => {
      notes = notes.filter((n) => n.id !== note.id);
      saveNotes();
      renderNotes(document.getElementById('noteSearchInput').value);
      updateHomeDashboard();
      showToast('Nota excluída');
    });

    header.append(title, delBtn);

    const body = document.createElement('p');
    body.className = 'note-card-body';
    body.textContent = note.body;

    const date = document.createElement('span');
    date.className = 'note-card-date';
    date.textContent = note.date;

    card.append(header, body, date);
    grid.appendChild(card);
  });
}

function initNotesModule() {
  document.getElementById('noteForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const titleEl = document.getElementById('noteTitleInput');
    const bodyEl = document.getElementById('noteBodyInput');
    const colorEl = document.querySelector('input[name="noteColor"]:checked');

    notes.unshift({
      id: 'note_' + Date.now(),
      title: titleEl.value.trim(),
      body: bodyEl.value.trim(),
      color: colorEl ? colorEl.value : 'indigo',
      date: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    });

    titleEl.value = '';
    bodyEl.value = '';
    saveNotes();
    renderNotes(document.getElementById('noteSearchInput').value);
    updateHomeDashboard();
    showToast('Nota salva 📝');
  });

  document.getElementById('noteSearchInput').addEventListener('input', (e) => {
    renderNotes(e.target.value);
  });
}

/* ---------------------------------------------------------
   8. HOME SUMMARY DASHBOARD UPDATER
   --------------------------------------------------------- */
function updateHomeDashboard() {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.done).length;
  const pendingTasks = totalTasks - doneTasks;
  const taskPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  document.getElementById('homeTaskBadge').textContent =
    pendingTasks === 0 ? 'Tudo feito!' : `${pendingTasks} pendente${pendingTasks > 1 ? 's' : ''}`;
  document.getElementById('homeTaskProgress').textContent = `${doneTasks}/${totalTasks}`;
  document.getElementById('homeTaskBar').value = taskPct;

  const waterPct = Math.min(100, Math.round((waterData.currentMl / waterData.goalMl) * 100));
  document.getElementById('homeWaterBadge').textContent = `Meta ${(waterData.goalMl / 1000).toFixed(1)}L`;
  document.getElementById('homeWaterValue').textContent = `${waterData.currentMl} ml`;
  document.getElementById('homeWaterBar').value = waterPct;

  document.getElementById('homePomoState').textContent = pomoTimerId ? '🔥 Ativo' : 'Pronto';
  document.getElementById('homePomoSessions').textContent = `${pomoData.cycles} ciclo${pomoData.cycles === 1 ? '' : 's'}`;

  document.getElementById('homeNotesCount').textContent = `${notes.length} nota${notes.length === 1 ? '' : 's'}`;
}

/* ---------------------------------------------------------
   9. PWA SERVICE WORKER & INSTALL PROMPT
   --------------------------------------------------------- */
let deferredInstallPrompt = null;

function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  const installBtn = document.getElementById('installBtn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installBtn.hidden = false;
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    installBtn.hidden = true;
    showToast('🎉 MeuHub instalado no seu celular!');
  });
}

/* ---------------------------------------------------------
   BOOTSTRAP
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadAllState();
  initHeaderAndTheme();
  initNavigation();
  initTasksModule();
  initPomodoroModule();
  initWaterModule();
  initNotesModule();

  renderTasks();
  renderPomodoro();
  renderWater();
  renderNotes();
  updateHomeDashboard();
  initPWA();
});
