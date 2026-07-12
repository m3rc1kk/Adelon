'use strict';

const TASK_TYPES = [
  { type: 'flask', label: 'Лабораторные' },
  { type: 'pen', label: 'Практические' },
  { type: 'folder', label: 'Проект' },
  { type: 'book', label: 'Курсовая' },
  { type: 'custom', label: 'Другое' },
];

const AUTO_TYPES = [
  { value: 'auto', label: 'Автомат', name: 'автомат', Name: 'Автомат' },
  { value: 'admit', label: 'Допуск', name: 'допуск', Name: 'Допуск' },
  { value: 'point', label: '+Балл', name: 'балл', Name: 'Балл' },
];

const EXAM_GROUPS = [
  { id: '41pg', title: '41ПГ' },
  { id: '41pi', title: '41ПИ' },
  { id: '41it', title: '41ИТ' },
  { id: '41ivt', title: '41ИВТ' },
];

const EXAM_SCHEDULES = {
  '41pg': [
    { id: '41pg-hist', name: 'История России', kind: 'zachet', date: '2027-01-09' },
    { id: '41pg-eng', name: 'Иностранный язык', kind: 'zachet', date: '2027-01-13' },
    { id: '41pg-matan', name: 'Математический анализ', kind: 'exam', date: '2027-01-16' },
    { id: '41pg-prog', name: 'Программирование', kind: 'exam', date: '2027-01-21' },
    { id: '41pg-db', name: 'Базы данных', kind: 'exam', date: null },
  ],
  '41pi': [
    { id: '41pi-eng', name: 'Иностранный язык', kind: 'zachet', date: '2027-01-10' },
    { id: '41pi-phys', name: 'Физика', kind: 'exam', date: '2027-01-15' },
    { id: '41pi-prog', name: 'Программирование', kind: 'exam', date: '2027-01-19' },
    { id: '41pi-oop', name: 'ООП', kind: 'exam', date: '2027-01-24' },
  ],
  '41it': [
    { id: '41it-phil', name: 'Философия', kind: 'zachet', date: '2027-01-11' },
    { id: '41it-net', name: 'Компьютерные сети', kind: 'exam', date: '2027-01-17' },
    { id: '41it-db', name: 'Базы данных', kind: 'exam', date: '2027-01-22' },
    { id: '41it-web', name: 'Веб-технологии', kind: 'zachet', date: null },
  ],
  '41ivt': [
    { id: '41ivt-eng', name: 'Иностранный язык', kind: 'zachet', date: '2027-01-12' },
    { id: '41ivt-arch', name: 'Архитектура ЭВМ', kind: 'exam', date: '2027-01-18' },
    { id: '41ivt-os', name: 'Операционные системы', kind: 'exam', date: '2027-01-23' },
    { id: '41ivt-math', name: 'Дискретная математика', kind: 'exam', date: '2027-01-27' },
  ],
};

const THEME_OPTIONS = [
  { id: 'warm-light', label: 'Тёплая светлая', bg: '#F4F1EB', accent: '#4E8158' },
  { id: 'warm-dark', label: 'Тёплая тёмная', bg: '#1A1917', accent: '#7FB183' },
  { id: 'neutral-light', label: 'Светлая', bg: '#F2F3F4', accent: '#3F8058' },
  { id: 'neutral-dark', label: 'Тёмная', bg: '#131415', accent: '#78AE84' },
];

const RU_MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const PAIR_TIMES = { 1: '8:30–10:00', 2: '10:10–11:40', 3: '11:50–13:20', 4: '13:50–15:20', 5: '15:20–16:50', 6: '17:00–18:30' };
const KINDS = {
  'лекция': { bg: 'var(--accent-soft)', color: 'var(--accent-2)' },
  'практика': { bg: 'var(--good-soft)', color: 'var(--good)' },
  'лаб': { bg: 'var(--surface-2)', color: 'var(--text-2)' },
  'дистанционно': { bg: 'var(--surface-2)', color: 'var(--text-2)' },
};
const KIND_OPTIONS = ['лекция', 'практика', 'лаб', 'дистанционно'];

const mk = (total, doneCount) => Array.from({ length: total }, (_, i) => i < doneCount);

function defaultSessions() {
  return [];
}

function defaultSchedule() {
  return {};
}

const DEFAULT_THEME = 'warm-dark';

const state = {
  themeId: DEFAULT_THEME,
  showThemeMenu: false,
  navTab: 'main',
  view: 'sessions',
  currentSessionId: null,
  showAddModal: false,
  editSubjectId: null,
  examPanelOpen: false,
  examGroup: EXAM_GROUPS[0] ? EXAM_GROUPS[0].id : null,
  showSessionModal: false,
  showLessonModal: false,
  lessonEdit: null,
  lessonDraft: null,
  confirmDialog: null,
  weekOffset: 0,
  showImportModal: false,
  oguUI: null,
  oguBusy: false,
  draft: { name: '', teacher: '', autoType: 'auto', tasks: [{ id: 'd1', type: 'flask', total: 4 }] },
  sessionDraft: { name: '', period: '' },
  sessions: defaultSessions(),
  schedule: defaultSchedule(),
  oguGroup: null,
  oguSync: null,
  update: null,
};

const PERSIST_KEYS = ['themeId', 'sessions', 'schedule', 'oguGroup', 'oguSync', 'examGroup'];

function collectPersist() {
  const out = {};
  for (const k of PERSIST_KEYS) out[k] = state[k];
  return out;
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (window.adelon && window.adelon.save) window.adelon.save(collectPersist());
  }, 150);
}

async function loadPersisted() {
  if (!(window.adelon && window.adelon.load)) return;
  try {
    const data = await window.adelon.load();
    if (data && typeof data === 'object') {
      if (typeof data.themeId === 'string') state.themeId = data.themeId;
      if (Array.isArray(data.sessions)) state.sessions = data.sessions;
      if (data.schedule && typeof data.schedule === 'object' && !Array.isArray(data.schedule)) state.schedule = data.schedule;
      if (data.oguGroup && typeof data.oguGroup === 'object') state.oguGroup = data.oguGroup;
      if (data.oguSync && typeof data.oguSync === 'object') state.oguSync = data.oguSync;
      if (typeof data.examGroup === 'string' && EXAM_SCHEDULES[data.examGroup]) state.examGroup = data.examGroup;
    }
    rememberTheme(state.themeId);
  } catch (e) {
    console.error('load failed', e);
  }
}

const uid = (p) => p + Math.random().toString(36).slice(2, 9);

function rememberTheme(id) {
  try { localStorage.setItem('adelon-theme', id); } catch (_) {}
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function plural(n, forms) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

const taskDone = (t) => t.completed.filter(Boolean).length;

function subjectPct(sub) {
  const done = sub.tasks.reduce((a, t) => a + taskDone(t), 0);
  const total = sub.tasks.reduce((a, t) => a + t.total, 0) || 1;
  return Math.round((done / total) * 100);
}

function subjectClosed(sub) {
  return !!sub.examPassed || subjectPct(sub) >= 100;
}
function subjectUnits(sub) {
  const total = sub.tasks.reduce((a, t) => a + t.total, 0);
  const done = sub.examPassed ? total : sub.tasks.reduce((a, t) => a + taskDone(t), 0);
  return { done, total: total || 1 };
}

function icon(name, size) {
  size = size || 16;
  const open = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">`;
  const P = {
    flask: '<path d="M9 3h6"/><path d="M10 3v6l-5.2 8.4A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-3.6L14 9V3"/><path d="M8.2 14.5h7.6"/>',
    pen: '<path d="M4 20l4.5-1L19 8.5 15.5 5 5 15.5 4 20z"/><path d="M13.5 7L17 10.5"/>',
    folder: '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-10z"/>',
    book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v14H6.5A1.5 1.5 0 0 0 5 18.5V4.5z"/><path d="M5 18.5A1.5 1.5 0 0 0 6.5 20H19v-3"/><path d="M8.5 7.5h6.5"/><path d="M8.5 10.5h4.5"/>',
    custom: '<path d="M4 7h11"/><path d="M4 12h11"/><path d="M4 17h7"/><path d="M18.5 15.5l2 2-4.5 4.5H14v-2z"/>',
    clipboard: '<path d="M9 4.5H7A1.5 1.5 0 0 0 5.5 6v13A1.5 1.5 0 0 0 7 20.5h10A1.5 1.5 0 0 0 18.5 19V6A1.5 1.5 0 0 0 17 4.5h-2"/><rect x="9" y="3" width="6" height="3.4" rx="1"/><path d="M8.5 11.5h7"/><path d="M8.5 15h4.5"/>',
    edit: '<path d="M4 20l4.5-1L19 8.5 15.5 5 5 15.5 4 20z"/><path d="M13.5 7L17 10.5"/>',
    check: '<path d="M4.5 12.5l4.5 4.5L19.5 6.5"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    x: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/><path d="M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12"/>',
    'chevron-down': '<path d="M5.5 9l6.5 6.5L18.5 9"/>',
    'chevron-right': '<path d="M9 5l7 7-7 7"/>',
    'arrow-left': '<path d="M11 5l-7 7 7 7"/><path d="M4 12h16"/>',
    'chevron-left': '<path d="M15 5l-7 7 7 7"/>',
    user: '<circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
    pin: '<path d="M12 21.5s6.5-5.7 6.5-10.7A6.5 6.5 0 0 0 5.5 10.8C5.5 15.8 12 21.5 12 21.5z"/><circle cx="12" cy="10.8" r="2.3"/>',
    cap: '<path d="M12 5L2.5 9 12 13l9.5-4L12 5z"/><path d="M6.5 11v4.2c0 1.2 2.5 2.3 5.5 2.3s5.5-1.1 5.5-2.3V11"/><path d="M21.5 9v4.5"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-13.7 5.7L4 16"/><path d="M4 20v-4h4"/>',
    download: '<path d="M12 4v10"/><path d="M8 10.5l4 4 4-4"/><path d="M5 19.5h14"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3 3 0 0 1 0 5.6"/><path d="M17.5 19a5.5 5.5 0 0 0-3-4.9"/>',
  };
  return open + (P[name] || P.plus) + '</svg>';
}

function mondayOf(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function dateKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function keyToDate(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function currentExamList() {
  return (state.examGroup && EXAM_SCHEDULES[state.examGroup]) || [];
}
function examById(id) {
  if (!id) return null;
  for (const g in EXAM_SCHEDULES) {
    const found = EXAM_SCHEDULES[g].find(e => e.id === id);
    if (found) return found;
  }
  return null;
}
function examGroupTitle(id) {
  const g = EXAM_GROUPS.find(x => x.id === id);
  return g ? g.title : '';
}
function fmtExamDate(dateStr) {
  if (!dateStr) return 'дата уточняется';
  const d = keyToDate(dateStr);
  return d.getDate() + ' ' + RU_MONTHS[d.getMonth()];
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = keyToDate(dateStr); d.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}
function daysUntilText(dateStr) {
  const n = daysUntil(dateStr);
  if (n === null) return '';
  if (n < 0) return 'прошёл';
  if (n === 0) return 'сегодня';
  if (n === 1) return 'завтра';
  return 'через ' + n + ' ' + plural(n, ['день', 'дня', 'дней']);
}
const examKindLabel = (kind) => kind === 'exam' ? 'Экзамен' : 'Зачёт';

const root = document.getElementById('root');

const CONFETTI_COLORS = ['#4E8158', '#7FB183', '#93C097', '#5A7A5A', '#E4EDE1', '#3E6B48', '#B7D3B0'];
function fireConfetti(x, y) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  const N = 90;
  for (let i = 0; i < N; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-piece';
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.15;
    const power = 90 + Math.random() * 180;
    const dx = Math.cos(angle) * power;
    const dy = Math.sin(angle) * power + 60 + Math.random() * 220;
    const size = 6 + Math.random() * 6;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.width = size + 'px';
    p.style.height = (size * (0.4 + Math.random() * 0.6)) + 'px';
    p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    p.style.setProperty('--dx', dx.toFixed(1) + 'px');
    p.style.setProperty('--dy', dy.toFixed(1) + 'px');
    p.style.setProperty('--rot', Math.round(Math.random() * 900 - 450) + 'deg');
    p.style.animationDelay = (Math.random() * 0.05).toFixed(3) + 's';
    if (Math.random() < 0.5) p.style.borderRadius = '50%';
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1500);
}

let lastMainKey = null;
let lastModalKey = null;
let animMainEnter = false;
let animModalEnter = false;
let lastToggledSegKey = null;
let lastExamPanelOpen = false;
let animExamEnter = false;
let animExamExit = false;

function render() {
  const active = document.activeElement;
  const activeId = active && active.id ? active.id : null;
  let selStart = null, selEnd = null;
  if (active && typeof active.selectionStart === 'number') {
    selStart = active.selectionStart; selEnd = active.selectionEnd;
  }

  const mainKey = state.navTab + '|' + state.view + '|' + state.currentSessionId + '|' + state.weekOffset;
  const modalKey = state.showAddModal ? 'add' : state.showSessionModal ? 'session' : state.showImportModal ? 'import' : state.confirmDialog ? 'confirm' : (state.update && state.update.status === 'available') ? 'update' : null;
  animMainEnter = mainKey !== lastMainKey;
  animModalEnter = modalKey !== null && modalKey !== lastModalKey;
  animExamEnter = state.examPanelOpen && !lastExamPanelOpen;
  animExamExit = !state.examPanelOpen && lastExamPanelOpen;

  document.documentElement.setAttribute('data-theme', state.themeId);
  document.body.style.background = 'var(--bg)';
  root.innerHTML = template();

  lastMainKey = mainKey;
  lastModalKey = modalKey;
  lastToggledSegKey = null;
  lastExamPanelOpen = state.examPanelOpen;

  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) {
      el.focus();
      if (selStart != null) { try { el.setSelectionRange(selStart, selEnd); } catch (_) {} }
    }
  }
}

function setState(patch) {
  Object.assign(state, patch);
  save();
  render();
}
function setUI(patch) {
  Object.assign(state, patch);
  render();
}

let confirmCb = null;
function askConfirm(opts, cb) {
  confirmCb = cb;
  setUI({ confirmDialog: opts });
}

function template() {
  const density = 'comfortable';
  const overrideStyle = `--card-pad:22px;--card-gap:18px;`;
  const isMain = state.navTab === 'main';

  return `
  <div style="min-height:100vh;background:var(--bg);color:var(--text);font-family:'Golos Text',system-ui,sans-serif;-webkit-font-smoothing:antialiased;" data-theme="${state.themeId}">
  <div style="${overrideStyle}">
    ${headerHtml(isMain)}
    ${isMain && state.view === 'sessions' ? sessionsViewHtml() : ''}
    ${isMain && state.view === 'subjects' ? subjectsViewHtml() : ''}
    ${state.navTab === 'schedule' ? scheduleViewHtml() : ''}
    ${state.showAddModal ? addModalHtml() : ''}
    ${state.showSessionModal ? sessionModalHtml() : ''}
    ${state.showImportModal ? importModalHtml() : ''}
    ${state.confirmDialog ? confirmModalHtml() : ''}
    ${state.update && state.update.status === 'available' ? updateModalHtml() : ''}
    ${state.update ? updateToastHtml() : ''}
    ${versionBadgeHtml()}
  </div>
  </div>`;
}

function versionBadgeHtml() {
  const v = window.adelon && window.adelon.version;
  if (!v) return '';
  return `<div style="position:fixed;left:14px;bottom:10px;z-index:5;font-size:10.5px;color:var(--text-3);opacity:.55;pointer-events:none;font-family:'Golos Text',system-ui,sans-serif;">v${esc(v)}</div>`;
}

const RELEASE_NOTES_ALLOWED_TAGS = new Set(['P', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'B', 'I', 'CODE', 'PRE', 'BR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'BLOCKQUOTE', 'HR']);

function sanitizeReleaseHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 8) { node.removeChild(child); return; }
      if (child.nodeType !== 1) return;
      if (!RELEASE_NOTES_ALLOWED_TAGS.has(child.tagName)) {
        node.replaceChild(document.createTextNode(child.textContent), child);
        return;
      }
      [...child.attributes].forEach((attr) => {
        if (child.tagName === 'A' && attr.name === 'href' && /^https?:\/\//i.test(attr.value.trim())) return;
        child.removeAttribute(attr.name);
      });
      if (child.tagName === 'A') {
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noopener noreferrer');
      }
      walk(child);
    });
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

function formatNotes(raw) {
  const text = String(raw || '').trim();
  if (!text) return `<p style="margin:0;font-size:13px;color:var(--text-3);">Описание изменений не указано.</p>`;
  return `<div class="release-notes">${sanitizeReleaseHtml(text)}</div>`;
}

function updateModalHtml() {
  const u = state.update;
  const ver = u.version ? esc(u.version) : '';
  return `
  <div class="modal-overlay ${animModalEnter ? 'anim-in' : ''}">
    <div class="card scroll-y" style="border-radius:18px;padding:26px;width:480px;max-width:100%;max-height:86vh;display:flex;flex-direction:column;gap:20px;" data-stop="1">
      <div style="display:flex;align-items:center;gap:13px;">
        <span style="width:46px;height:46px;border-radius:13px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--accent-soft);color:var(--accent-2);">${icon('download', 23)}</span>
        <div style="display:flex;flex-direction:column;gap:3px;min-width:0;flex:1;">
          <h2 style="margin:0;font-family:'Onest';font-weight:600;font-size:19px;color:var(--text);letter-spacing:-.01em;">Доступно обновление</h2>
          <span style="font-size:12.5px;color:var(--text-2);">${ver ? 'Версия ' + ver + ' готова к установке' : 'Новая версия готова к установке'}</span>
        </div>
        ${ver ? `<span style="align-self:flex-start;font-family:'Golos Text';font-size:11.5px;font-weight:600;padding:4px 10px;border-radius:99px;background:var(--surface-2);color:var(--text-2);white-space:nowrap;flex-shrink:0;">v${ver}</span>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <span style="font-size:12px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:var(--text-3);">Что нового</span>
        <div class="scroll-y" style="max-height:38vh;overflow-y:auto;border:1px solid var(--border);border-radius:12px;padding:14px 16px;background:var(--bg);">
          ${formatNotes(u.notes)}
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:2px;">
        <button class="ghost-btn" data-action="dismissUpdate">Позже</button>
        <button class="primary-btn" data-action="downloadUpdate" style="display:flex;align-items:center;gap:7px;">${icon('download', 16)}Скачать и установить</button>
      </div>
    </div>
  </div>`;
}

function updateToastHtml() {
  const u = state.update;
  if (!u || (u.status !== 'downloading' && u.status !== 'ready')) return '';
  const ready = u.status === 'ready';
  const pct = Math.max(0, Math.min(100, u.percent || 0));
  const ver = u.version ? 'Версия ' + esc(u.version) : 'Новая версия';

  const iconWrap = `<span style="width:40px;height:40px;border-radius:11px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${ready ? 'var(--good-soft)' : 'var(--accent-soft)'};color:${ready ? 'var(--good)' : 'var(--accent-2)'};">${icon(ready ? 'check' : 'download', 20)}</span>`;

  const bodyHtml = ready
    ? `<div style="display:flex;flex-direction:column;gap:3px;min-width:0;flex:1;">
         <span style="font-family:'Onest';font-weight:600;font-size:14.5px;color:var(--text);letter-spacing:-.01em;">Обновление готово</span>
         <span style="font-size:12.5px;color:var(--text-2);">${ver} · установится после перезапуска</span>
       </div>`
    : `<div style="display:flex;flex-direction:column;gap:8px;min-width:0;flex:1;">
         <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
           <span style="font-family:'Onest';font-weight:600;font-size:14.5px;color:var(--text);letter-spacing:-.01em;">Загрузка обновления</span>
           <span id="update-bar-pct" style="font-family:'Golos Text';font-variant-numeric:tabular-nums;font-size:12.5px;font-weight:600;color:var(--text-2);flex-shrink:0;">${pct}%</span>
         </div>
         <div style="height:5px;background:var(--surface-2);border-radius:99px;overflow:hidden;">
           <div id="update-bar-fill" style="height:100%;border-radius:99px;background:var(--accent);width:${pct}%;transition:width .4s ease-out;"></div>
         </div>
         <span style="font-size:12px;color:var(--text-3);">${ver}</span>
       </div>`;

  const footer = ready
    ? `<div style="display:flex;gap:8px;justify-content:flex-end;">
         <button class="ghost-btn" style="padding:8px 14px;font-size:13px;" data-action="dismissUpdate">Позже</button>
         <button class="primary-btn" style="padding:8px 16px;font-size:13px;" data-action="installUpdate">Перезапустить</button>
       </div>`
    : '';

  return `
  <div class="update-toast" style="position:fixed;right:24px;bottom:24px;z-index:200;width:340px;max-width:calc(100vw - 48px);">
    <div class="card" style="border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:14px;box-shadow:0 14px 40px rgba(20,16,12,.22);">
      <div style="display:flex;align-items:${ready ? 'center' : 'flex-start'};gap:12px;">
        ${iconWrap}
        ${bodyHtml}
      </div>
      ${footer}
    </div>
  </div>`;
}

const PAIR_STARTS = { 1: 510, 2: 610, 3: 710, 4: 830, 5: 920, 6: 1020 };
const oguAvailable = () => !!(window.adelon && window.adelon.ogu);

function timeToMin(hhmm) {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
function pairFromTime(hhmm) {
  const t = timeToMin(hhmm);
  if (t == null) return null;
  for (const p in PAIR_STARTS) if (Math.abs(PAIR_STARTS[p] - t) <= 10) return Number(p);
  return null;
}
function lessonStartMin(l) {
  if (l.time) { const m = timeToMin(l.time.split(/[–-]/)[0]); if (m != null) return m; }
  return PAIR_STARTS[l.pair] || 9999;
}
function groupDayLessons(lessons) {
  const bySlot = new Map();
  for (const l of lessons) {
    const tk = l.time || PAIR_TIMES[l.pair] || '—';
    if (!bySlot.has(tk)) bySlot.set(tk, []);
    bySlot.get(tk).push(l);
  }
  const groups = [...bySlot.values()].map((ls) => {
    const names = [...new Set(ls.map((x) => x.name).filter(Boolean))];
    const seen = new Set();
    const entries = [];
    for (const l of ls) {
      const k = (l.teacher || '') + '|' + (l.room || '');
      if (!seen.has(k)) { seen.add(k); entries.push({ teacher: l.teacher || '', room: l.room || '' }); }
    }
    return { time: ls[0].time || PAIR_TIMES[ls[0].pair] || '', pair: ls[0].pair, kind: ls[0].kind, name: names.join(' / '), entries, _start: lessonStartMin(ls[0]) };
  });
  groups.sort((a, b) => a._start - b._start);
  return groups;
}
function normalizeKind(t) {
  const s = (t || '').toLowerCase();
  if (s.startsWith('лек')) return 'лекция';
  if (s.startsWith('пр') || s.includes('практ') || s.includes('сем')) return 'практика';
  if (s.startsWith('лаб')) return 'лаб';
  if (s.includes('дист')) return 'дистанционно';
  return t || 'занятие';
}

function applyOguEvents(events) {
  for (const k of Object.keys(state.schedule)) {
    const kept = state.schedule[k].filter(l => l.source !== 'ogu');
    if (kept.length) state.schedule[k] = kept; else delete state.schedule[k];
  }
  for (const ev of events) {
    const arr = state.schedule[ev.date] || (state.schedule[ev.date] = []);
    arr.push({
      source: 'ogu',
      name: ev.name,
      kind: normalizeKind(ev.type),
      teacher: ev.teacher || '',
      room: ev.room || '',
      time: ev.start && ev.end ? `${ev.start}–${ev.end}` : (ev.start || ''),
      pair: pairFromTime(ev.start),
    });
  }
}

function patchOgu(patch) {
  state.oguUI = Object.assign({}, state.oguUI || {}, patch);
  render();
}

async function oguLoadCourses(divId, preferKurs) {
  patchOgu({ loading: true, error: null, courses: [], groups: [], divId, kurs: null, groupId: null });
  const res = await window.adelon.ogu.courses(divId);
  if (!res.ok) return patchOgu({ loading: false, error: res.error });
  const has = (k) => res.data.some(c => Number(c.kurs) === Number(k));
  const kurs = has(preferKurs) ? Number(preferKurs) : (res.data[0] && res.data[0].kurs);
  patchOgu({ loading: false, courses: res.data, kurs });
  if (kurs != null) await oguLoadGroups(divId, kurs, state.oguGroup && state.oguGroup.groupId);
}

async function oguLoadGroups(divId, kurs, preferGroup) {
  patchOgu({ loading: true, error: null, groups: [], groupId: null });
  const res = await window.adelon.ogu.groups(divId, kurs);
  if (!res.ok) return patchOgu({ loading: false, error: res.error });
  const has = res.data.some(g => Number(g.idgruop) === Number(preferGroup));
  const groupId = has ? Number(preferGroup) : (res.data[0] && res.data[0].idgruop);
  patchOgu({ loading: false, groups: res.data, groupId });
}

async function refreshOguData() {
  if (!oguAvailable() || !state.oguGroup || state.oguBusy) return;
  state.oguBusy = true; render();
  const res = await window.adelon.ogu.schedule(state.oguGroup.groupId);
  state.oguBusy = false;
  if (!res.ok) {
    state.oguSync = Object.assign({}, state.oguSync, { at: Date.now(), error: res.error });
    return setState({});
  }
  applyOguEvents(res.data);
  state.oguSync = { at: Date.now(), count: res.data.length, error: null };
  setState({});
}

function oguSyncText() {
  if (!state.oguSync || !state.oguSync.at) return '';
  const d = new Date(state.oguSync.at);
  const today = new Date();
  const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  return sameDay(d, today) ? 'сегодня в ' + hm : d.getDate() + ' ' + RU_MONTHS[d.getMonth()] + ' в ' + hm;
}

function headerHtml(isMain) {
  const currentSwatch = THEME_OPTIONS.find(o => o.id === state.themeId) || THEME_OPTIONS[0];
  const swatchGrad = `linear-gradient(135deg, ${currentSwatch.bg} 50%, ${currentSwatch.accent} 50%)`;

  const themeMenu = state.showThemeMenu ? `
    <div style="position:fixed;inset:0;z-index:40;" data-action="closeThemeMenu"></div>
    <div class="dropdown-in" style="position:absolute;top:44px;right:0;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:6px;display:flex;flex-direction:column;gap:2px;min-width:200px;box-shadow:0 10px 28px rgba(20,16,12,.12);z-index:50;">
      ${THEME_OPTIONS.map(o => {
        const grad = `linear-gradient(135deg, ${o.bg} 50%, ${o.accent} 50%)`;
        const selected = o.id === state.themeId;
        return `<button class="theme-row" style="background:${selected ? 'var(--surface-2)' : 'transparent'};" data-action="selectTheme" data-theme-id="${o.id}">
          <span style="width:20px;height:20px;border-radius:50%;flex-shrink:0;border:1px solid var(--border-strong);background:${grad};"></span>
          <span style="flex:1;font-size:13.5px;color:var(--text);font-family:'Golos Text';">${o.label}</span>
          ${selected ? `<span style="color:var(--accent);display:flex;">${icon('check', 14)}</span>` : ''}
        </button>`;
      }).join('')}
    </div>` : '';

  return `
  <div style="display:flex;align-items:center;height:64px;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg);z-index:20;">
    <div style="display:flex;align-items:center;gap:24px;max-width:1240px;margin:0 auto;width:100%;padding:0 32px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-family:'Onest';font-weight:600;font-size:19px;letter-spacing:-.02em;color:var(--text);">Adelon</span>
      </div>
      <div style="display:flex;gap:3px;background:var(--surface-2);padding:3px;border-radius:11px;margin-left:8px;">
        <button class="tab-btn ${isMain ? 'active' : 'idle'}" data-action="goSessionsTab">Сессии</button>
        <button class="tab-btn ${state.navTab === 'schedule' ? 'active' : 'idle'}" data-action="goSchedule">Расписание</button>
      </div>
      <div style="flex:1;"></div>
      <div style="position:relative;">
        <button class="icon-btn" data-action="toggleThemeMenu">
          <span style="width:18px;height:18px;border-radius:50%;border:1px solid var(--border-strong);background:${swatchGrad};"></span>
        </button>
        ${themeMenu}
      </div>
    </div>
  </div>`;
}

function sessionsViewHtml() {
  const cards = state.sessions.map(sess => {
    const done = sess.subjects.reduce((a, su) => a + subjectUnits(su).done, 0);
    const total = sess.subjects.reduce((a, su) => a + su.tasks.reduce((x, t) => x + t.total, 0), 0) || 1;
    const pct = sess.subjects.length ? Math.round((done / total) * 100) : 0;
    const autos = sess.subjects.filter(su => subjectClosed(su)).length;
    const count = sess.subjects.length;
    const statsText = count
      ? count + ' ' + plural(count, ['предмет', 'предмета', 'предметов']) + ' · ' + autos + ' ' + plural(autos, ['закрыт', 'закрыто', 'закрыто'])
      : 'Нет предметов';
    const isDone = sess.subjects.length > 0 && sess.subjects.every(su => subjectClosed(su));
    const badge = isDone
      ? `<div style="display:flex;align-items:center;gap:5px;padding:5px 10px 5px 8px;border-radius:99px;background:var(--good-soft);color:var(--good);font-size:11.5px;font-weight:600;white-space:nowrap;flex-shrink:0;">${icon('check', 13)}Завершена</div>`
      : `<div style="display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:99px;background:var(--accent-soft);color:var(--accent-2);font-size:11.5px;font-weight:600;white-space:nowrap;flex-shrink:0;"><span style="width:6px;height:6px;border-radius:50%;background:var(--accent);"></span>Текущая</div>`;

    return `
    <div class="card session-card" data-action="openSession" data-session-id="${esc(sess.id)}" role="button" tabindex="0">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div style="display:flex;flex-direction:column;gap:4px;min-width:0;">
          <span style="font-family:'Onest';font-weight:600;font-size:19px;letter-spacing:-.015em;color:var(--text);">${esc(sess.name)}</span>
          <span style="font-size:12.5px;color:var(--text-3);">${esc(sess.period)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
          ${badge}
          <button class="mini-icon-btn" style="width:28px;height:28px;" data-action="deleteSession" data-session-id="${esc(sess.id)}" title="Удалить семестр">${icon('trash', 14)}</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:11px;margin-top:auto;">
        <div style="height:1px;background:var(--border);"></div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="flex:1;height:7px;background:var(--surface-2);border-radius:99px;overflow:hidden;">
            <div style="height:100%;border-radius:99px;transition:width .4s cubic-bezier(.2,.7,.3,1);background:${isDone ? 'var(--good)' : 'var(--accent)'};width:${pct}%;"></div>
          </div>
          <span style="font-family:'Golos Text';font-size:12.5px;font-weight:600;color:var(--text-2);font-variant-numeric:tabular-nums;min-width:34px;text-align:right;">${pct}%</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12.5px;color:var(--text-2);">${statsText}</span>
          <span style="display:flex;color:var(--text-3);">${icon('chevron-right', 16)}</span>
        </div>
      </div>
    </div>`;
  }).join('');

  const isEmpty = state.sessions.length === 0;
  const subtitle = isEmpty
    ? 'Создайте первый семестр, чтобы начать отслеживать лабы, практики и проекты.'
    : 'Выберите семестр, чтобы открыть предметы и следить за прогрессом.';

  const body = isEmpty
    ? `<div style="max-width:1240px;margin:0 auto;width:100%;padding:8px 32px 56px;">
         <button class="dashed-add" style="padding:44px 22px;min-height:220px;width:100%;" data-action="openSessionModal">
           <span style="display:flex;">${icon('plus', 26)}</span>
           <span style="font-family:'Onest';font-weight:600;font-size:16px;">Создать первый семестр</span>
           <span style="font-size:13px;color:var(--text-3);max-width:360px;text-align:center;">Например, «Семестр 4 · Осень 2025». Внутри добавишь предметы и задания.</span>
         </button>
       </div>`
    : `<div style="max-width:1240px;margin:0 auto;width:100%;padding:0 32px 56px;display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px;align-items:stretch;">
         ${cards}
         <button class="dashed-add" style="padding:22px;min-height:170px;" data-action="openSessionModal">
           <span style="display:flex;">${icon('plus', 22)}</span>
           <span style="font-family:'Onest';font-weight:500;font-size:14.5px;">Создать сессию</span>
         </button>
       </div>`;

  return `
  <div class="${animMainEnter ? 'view-enter' : ''}">
    <div style="max-width:1240px;margin:0 auto;width:100%;padding:34px 32px 22px;">
      <h1 style="font-family:'Onest';font-weight:600;font-size:29px;letter-spacing:-.025em;color:var(--text);margin:0;">Сессии</h1>
      <p style="margin:9px 0 0;font-size:14px;color:var(--text-2);">${subtitle}</p>
    </div>
    ${body}
  </div>`;
}

function examPanelHtml() {
  if (!EXAM_GROUPS.length) return '';
  const open = state.examPanelOpen;
  const list = currentExamList();
  const items = [...list].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  });
  const rows = items.map((e, idx) => {
    const isExam = e.kind === 'exam';
    const n = daysUntil(e.date);
    const soon = n !== null && n >= 0 && n <= 7;
    const accentBg = 'var(--accent-soft)';
    const accentCol = 'var(--accent-2)';
    const dateBlock = e.date
      ? `<span style="font-family:'Golos Text';font-variant-numeric:tabular-nums;font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;">${fmtExamDate(e.date)}</span>
         <span style="font-size:11.5px;color:${soon ? 'var(--accent-2)' : 'var(--text-3)'};white-space:nowrap;">${daysUntilText(e.date)}</span>`
      : `<span style="font-size:12px;color:var(--text-3);white-space:nowrap;font-style:italic;">Дата уточняется</span>`;
    return `
    <div style="display:flex;align-items:center;gap:12px;padding:11px 2px;${idx ? 'border-top:1px solid var(--border);' : ''}">
      <span style="width:34px;height:34px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${accentBg};color:${accentCol};">${icon(isExam ? 'cap' : 'clipboard', 17)}</span>
      <div style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
        <span style="font-size:14px;font-weight:500;color:var(--text);overflow-wrap:anywhere;">${esc(e.name)}</span>
        <span style="font-size:12px;color:var(--text-3);">${examKindLabel(e.kind)}</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0;">
        ${dateBlock}
      </div>
    </div>`;
  }).join('');

  const groupSelect = `
    <div style="position:relative;display:flex;flex-shrink:0;">
      <select class="select-input" data-input="examGroupSelect" style="padding:7px 32px 7px 12px;font-size:13px;min-width:112px;">
        ${EXAM_GROUPS.map(g => `<option value="${esc(g.id)}" ${g.id === state.examGroup ? 'selected' : ''}>${esc(g.title)}</option>`).join('')}
      </select>
      <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text-3);display:flex;">${icon('chevron-down', 14)}</span>
    </div>`;

  const bodyContent = items.length
    ? rows
    : `<div style="padding:4px 2px 2px;font-size:13px;color:var(--text-3);">Для группы ${esc(examGroupTitle(state.examGroup))} список пока пуст.</div>`;

  return `
  <div style="max-width:1240px;margin:0 auto;width:100%;padding:0 32px 20px;">
    <div class="card" style="padding:0;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:10px;padding:11px 14px 11px 22px;">
        <span style="display:flex;color:var(--text-2);flex-shrink:0;">${icon('cap', 17)}</span>
        <button class="exam-toggle" data-action="toggleExamPanel" style="flex:1;display:flex;align-items:center;gap:8px;background:transparent;border:none;cursor:pointer;padding:8px 6px;margin:-8px -6px;border-radius:8px;text-align:left;min-width:0;">
          <span style="font-family:'Onest';font-weight:600;font-size:15px;color:var(--text);white-space:nowrap;">Экзамены и зачёты</span>
          ${state.examGroup ? `<span style="font-size:12.5px;color:var(--text-3);white-space:nowrap;">· ${esc(examGroupTitle(state.examGroup))}</span>` : ''}
        </button>
        ${groupSelect}
        <button class="exam-chevron${animExamEnter ? ' rotate-in' : animExamExit ? ' rotate-out' : ''}" data-action="toggleExamPanel" style="display:flex;flex-shrink:0;color:var(--text-3);background:transparent;border:none;cursor:pointer;padding:4px;border-radius:6px;transform:rotate(${open ? 180 : 0}deg);">${icon('chevron-down', 18)}</button>
      </div>
      ${open ? `<div class="exam-body-anim" style="padding:0 22px 14px;">${bodyContent}</div>` : ''}
    </div>
  </div>`;
}

function subjectsViewHtml() {
  const current = state.sessions.find(s => s.id === state.currentSessionId);
  const subjects = (current ? current.subjects : []);

  const subjectCards = subjects.map(s => {
    const L = AUTO_TYPES.find(a => a.value === (s.autoType || 'auto')) || AUTO_TYPES[0];
    const linkedExam = examById(s.examLink);
    const examChip = linkedExam
      ? `<div style="display:inline-flex;align-items:center;gap:5px;margin-top:3px;padding:3px 9px 3px 7px;border-radius:99px;background:var(--accent-soft);color:var(--accent-2);font-size:11px;font-weight:600;align-self:flex-start;white-space:nowrap;max-width:100%;">${icon(linkedExam.kind === 'exam' ? 'cap' : 'clipboard', 12)}${examKindLabel(linkedExam.kind)}${linkedExam.date ? ' · ' + fmtExamDate(linkedExam.date) : ''}</div>`
      : '';
    const examPassed = !!s.examPassed;
    const done = s.tasks.reduce((a, t) => a + taskDone(t), 0);
    const total = s.tasks.reduce((a, t) => a + t.total, 0) || 1;
    const pct = Math.round((done / total) * 100);
    const status = pct >= 100 ? 'auto' : pct >= 70 ? 'close' : 'todo';
    const isAuto = status === 'auto', isClose = status === 'close';
    const closed = examPassed || isAuto;
    const displayPct = examPassed ? 100 : pct;
    const segOn = closed ? 'var(--good)' : 'var(--accent)';
    const remaining = total - done;
    const footerText = examPassed
      ? 'Предмет закрыт — экзамен сдан'
      : isAuto
        ? 'Все задания сданы — ' + L.name + ' получен'
        : (isClose ? 'До ' + L.name + 'а: ' : 'Осталось сдать: ') + remaining + ' ' + plural(remaining, ['работа', 'работы', 'работ']);

    const badge = examPassed
      ? `<div style="display:flex;align-items:center;gap:5px;padding:5px 10px 5px 8px;border-radius:99px;background:var(--good-soft);color:var(--good);font-size:11.5px;font-weight:600;white-space:nowrap;flex-shrink:0;">${icon('cap', 13)}Экзамен сдан</div>`
      : isAuto
      ? `<div style="display:flex;align-items:center;gap:5px;padding:5px 10px 5px 8px;border-radius:99px;background:var(--good-soft);color:var(--good);font-size:11.5px;font-weight:600;white-space:nowrap;flex-shrink:0;">${icon('check', 13)}${L.Name}</div>`
      : isClose
        ? `<div style="display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:99px;background:var(--accent-soft);color:var(--accent-2);font-size:11.5px;font-weight:600;white-space:nowrap;flex-shrink:0;"><span style="width:6px;height:6px;border-radius:50%;background:var(--accent);"></span>Почти ${L.name}</div>`
        : `<div style="display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:99px;background:var(--surface-2);color:var(--text-2);font-size:11.5px;font-weight:600;white-space:nowrap;flex-shrink:0;"><span style="width:6px;height:6px;border-radius:50%;background:var(--text-3);"></span>Нужно доделать</div>`;

    const tasksHtml = s.tasks.map(t => {
      const segs = t.completed.map((doneSeg, i) => {
        const justToggled = lastToggledSegKey === (s.id + '|' + t.id + '|' + i);
        return `<button class="seg${justToggled ? ' seg-pop' : ''}" style="background:${doneSeg ? segOn : 'var(--seg-empty)'};" data-action="toggleSegment" data-subject-id="${esc(s.id)}" data-task-id="${esc(t.id)}" data-index="${i}" title="${doneSeg ? 'Отменить' : 'Отметить сделанным'}"></button>`;
      }).join('');
      return `
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="display:flex;color:var(--text-3);flex-shrink:0;">${icon(t.type, 15)}</span>
            <span style="font-size:13.5px;color:var(--text-2);flex:1;min-width:0;">${esc(t.label)}</span>
            <span style="font-family:'Golos Text';font-variant-numeric:tabular-nums;font-size:13px;color:var(--text);font-weight:600;flex-shrink:0;">${taskDone(t)}/${t.total}</span>
          </div>
          <div style="display:flex;gap:4px;">${segs}</div>
        </div>`;
    }).join('');

    return `
    <div class="card" style="padding:var(--card-pad);display:flex;flex-direction:column;gap:var(--card-gap);position:relative;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
        <div style="display:flex;flex-direction:column;gap:4px;min-width:0;flex:1;">
          <div style="font-family:'Onest';font-weight:600;font-size:18px;letter-spacing:-.015em;color:var(--text);line-height:1.2;overflow-wrap:anywhere;">${esc(s.name)}</div>
          <div style="font-size:12.5px;color:var(--text-3);overflow-wrap:anywhere;">${esc(s.meta)}</div>
          ${examChip}
        </div>
        <div style="flex-shrink:0;max-width:45%;display:flex;justify-content:flex-end;">${badge}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">${tasksHtml}</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:auto;padding-top:2px;">
        <div style="height:1px;background:var(--border);"></div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="flex:1;height:7px;background:var(--surface-2);border-radius:99px;overflow:hidden;">
            <div style="height:100%;border-radius:99px;transition:width .3s;background:${closed ? 'var(--good)' : 'var(--accent)'};width:${displayPct}%;"></div>
          </div>
          <span style="font-family:'Golos Text';font-size:12.5px;font-weight:600;color:var(--text-2);font-variant-numeric:tabular-nums;min-width:34px;text-align:right;">${displayPct}%</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <span style="font-size:12px;color:var(--text-3);min-width:0;overflow-wrap:anywhere;">${footerText}</span>
          <div style="display:flex;gap:4px;flex-shrink:0;">
            <button class="mini-icon-btn" style="width:30px;height:30px;" data-action="openEditModal" data-subject-id="${esc(s.id)}" title="Редактировать предмет">${icon('edit', 15)}</button>
            <button class="mini-icon-btn" style="width:30px;height:30px;${examPassed ? 'background:var(--good-soft);color:var(--good);' : ''}" data-action="toggleExam" data-subject-id="${esc(s.id)}" title="${examPassed ? 'Отменить: экзамен не сдан' : 'Закрыть предмет: экзамен сдан'}">${icon('cap', 16)}</button>
            <button class="mini-icon-btn" style="width:30px;height:30px;" data-action="deleteSubject" data-subject-id="${esc(s.id)}" title="Удалить предмет">${icon('trash', 15)}</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  const autos = subjects.filter(s => subjectClosed(s)).length;
  const summaryText = subjects.length
    ? subjects.length + ' ' + plural(subjects.length, ['предмет', 'предмета', 'предметов']) + ' · ' + autos + ' ' + plural(autos, ['закрыт', 'закрыто', 'закрыто'])
    : 'Пока нет предметов';

  return `
  <div class="${animMainEnter ? 'view-enter' : ''}">
    <div style="max-width:1240px;margin:0 auto;width:100%;padding:26px 32px 22px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;">
      <div>
        <button class="link-btn" style="margin-bottom:10px;" data-action="goToSessions">${icon('arrow-left', 16)}Сессии</button>
        <h1 style="font-family:'Onest';font-weight:600;font-size:29px;letter-spacing:-.025em;color:var(--text);margin:0;">${esc(current ? current.name : '')}</h1>
        <p style="margin:9px 0 0;font-size:14px;color:var(--text-2);">${esc(current ? current.period : '')} — ${summaryText}</p>
      </div>
      <div style="display:flex;gap:18px;align-items:center;">
        <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--text-2);"><span style="width:8px;height:8px;border-radius:50%;background:var(--good);"></span>Выполнено</div>
        <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--text-2);"><span style="width:8px;height:8px;border-radius:50%;background:var(--accent);"></span>Почти готово</div>
        <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--text-2);"><span style="width:8px;height:8px;border-radius:50%;background:var(--text-3);"></span>Нужно доделать</div>
      </div>
    </div>
    ${examPanelHtml()}
    <div style="max-width:1240px;margin:0 auto;width:100%;padding:0 32px 56px;display:grid;grid-template-columns:repeat(auto-fill,minmax(346px,1fr));gap:20px;align-items:stretch;">
      ${subjectCards}
      <button class="dashed-add" style="padding:var(--card-pad);min-height:200px;" data-action="openAddModal">
        <span style="display:flex;">${icon('plus', 22)}</span>
        <span style="font-family:'Onest';font-weight:500;font-size:14.5px;">Добавить предмет</span>
      </button>
    </div>
  </div>`;
}

function scheduleViewHtml() {
  const baseMonday = mondayOf(new Date());
  const off = state.weekOffset;
  const today = new Date();
  const dayDate = (i) => { const d = new Date(baseMonday); d.setDate(d.getDate() + i + off * 7); return d; };

  const daysHtml = [0, 1, 2, 3, 4, 5].map((i) => {
    const date = dayDate(i);
    const key = dateKey(date);
    const lessons = state.schedule[key] || [];
    const isToday = sameDay(date, today);
    const groups = groupDayLessons(lessons);

    const lessonsHtml = groups.length ? `
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${groups.map((gr) => {
          const k = KINDS[gr.kind] || KINDS['лаб'];
          const entriesHtml = gr.entries.map((en) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
              ${en.teacher ? `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-2);"><span style="display:flex;color:var(--text-3);flex-shrink:0;">${icon('user', 13)}</span>${esc(en.teacher)}</div>` : ''}
              ${en.room ? `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-2);"><span style="display:flex;color:var(--text-3);flex-shrink:0;">${icon('pin', 13)}</span><span style="font-weight:600;color:var(--text);">${esc(en.room)}</span></div>` : ''}
            </div>`).join('<div style="height:1px;background:var(--border);margin:1px 0;"></div>');
          return `
          <div class="card" style="padding:12px 13px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
              <span style="font-family:'Golos Text';font-variant-numeric:tabular-nums;font-size:12.5px;font-weight:600;color:var(--accent);white-space:nowrap;">${esc(gr.time)}</span>
              ${gr.pair ? `<span style="font-size:11px;color:var(--text-3);white-space:nowrap;">${gr.pair} пара</span>` : ''}
            </div>
            <span style="align-self:flex-start;font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:6px;background:${k.bg};color:${k.color};">${esc(gr.kind)}</span>
            <span style="font-family:'Onest';font-weight:600;font-size:14px;letter-spacing:-.01em;color:var(--text);line-height:1.3;">${esc(gr.name)}</span>
            <div style="display:flex;flex-direction:column;gap:5px;margin-top:1px;">${entriesHtml}</div>
          </div>`;
        }).join('')}
      </div>` : `<div style="border:1px dashed var(--border);border-radius:12px;padding:20px 10px;text-align:center;font-size:12px;color:var(--text-3);">Нет пар</div>`;

    return `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 13px;border-radius:12px;background:${isToday ? 'var(--accent-soft)' : 'var(--surface-2)'};">
        <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
          <span style="font-family:'Onest';font-weight:600;font-size:13.5px;letter-spacing:-.01em;color:${isToday ? 'var(--accent-2)' : 'var(--text)'};">${WEEKDAYS[i]}</span>
          <span style="font-size:12px;color:${isToday ? 'var(--accent-2)' : 'var(--text-3)'};font-variant-numeric:tabular-nums;">${date.getDate()} ${RU_MONTHS[date.getMonth()]}</span>
        </div>
      </div>
      ${lessonsHtml}
    </div>`;
  }).join('');

  const d0 = dayDate(0), d5 = dayDate(5);
  const weekRangeText = d0.getMonth() === d5.getMonth()
    ? d0.getDate() + '–' + d5.getDate() + ' ' + RU_MONTHS[d0.getMonth()] + ' ' + d0.getFullYear()
    : d0.getDate() + ' ' + RU_MONTHS[d0.getMonth()] + ' – ' + d5.getDate() + ' ' + RU_MONTHS[d5.getMonth()] + ' ' + d5.getFullYear();
  const weekTotal = [0, 1, 2, 3, 4, 5].reduce((a, i) => a + groupDayLessons(state.schedule[dateKey(dayDate(i))] || []).length, 0);
  const weekLessonsText = weekTotal + ' ' + plural(weekTotal, ['пара', 'пары', 'пар']);

  const g = state.oguGroup;
  const syncLine = g
    ? `<p style="margin:6px 0 0;font-size:12.5px;color:${state.oguSync && state.oguSync.error ? 'var(--accent-2)' : 'var(--text-3)'};">Группа ${esc(g.groupTitle)}${state.oguBusy ? ' · обновление…' : (state.oguSync && state.oguSync.error ? ' · не удалось обновить' : (oguSyncText() ? ' · обновлено ' + oguSyncText() : ''))}</p>`
    : '';
  const refreshBtn = g
    ? `<button class="icon-btn" data-action="refreshOgu" title="Обновить расписание" ${state.oguBusy ? 'disabled' : ''}><span style="display:flex;${state.oguBusy ? 'opacity:.5;' : ''}">${icon('refresh', 16)}</span></button>`
    : '';

  return `
  <div class="${animMainEnter ? 'view-enter' : ''}">
    <div style="max-width:1240px;margin:0 auto;width:100%;padding:26px 32px 22px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;">
      <div>
        <h1 style="font-family:'Onest';font-weight:600;font-size:29px;letter-spacing:-.025em;color:var(--text);margin:0;">Расписание</h1>
        <p style="margin:9px 0 0;font-size:14px;color:var(--text-2);">${weekRangeText} · ${weekLessonsText}</p>
        ${syncLine}
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button class="ghost-btn" style="height:36px;padding:0 14px;font-family:'Onest';display:flex;align-items:center;gap:7px;" data-action="openImportModal">${icon('users', 15)}${g ? 'Сменить группу' : 'Выбрать группу'}</button>
        ${refreshBtn}
        <div style="width:1px;height:22px;background:var(--border);margin:0 2px;"></div>
        <button class="icon-btn" data-action="prevWeek">${icon('chevron-left', 16)}</button>
        <button class="ghost-btn" style="height:36px;padding:0 16px;font-family:'Onest';" data-action="thisWeek">Сегодня</button>
        <button class="icon-btn" data-action="nextWeek">${icon('chevron-right', 16)}</button>
      </div>
    </div>
    <div style="max-width:1240px;margin:0 auto;width:100%;padding:0 32px 56px;">
      <div class="schedule-grid">
        ${daysHtml}
      </div>
    </div>
  </div>`;
}

function addModalHtml() {
  const d = state.draft;
  const canRemove = d.tasks.length > 1;
  const autoOpts = AUTO_TYPES.map(o =>
    `<button class="tab-btn ${d.autoType === o.value ? 'active' : 'idle'}" style="flex:1;" data-action="setDraftAuto" data-auto="${o.value}">${o.label}</button>`
  ).join('');

  const isEdit = !!state.editSubjectId;

  const tasksHtml = d.tasks.map(t => `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;gap:8px;align-items:center;">
        <span style="display:flex;color:var(--text-3);flex-shrink:0;">${icon(t.type, 15)}</span>
        <div style="position:relative;flex:1;display:flex;">
          <select class="select-input" id="draft-type-${esc(t.id)}" data-input="taskType" data-task-id="${esc(t.id)}">
            ${TASK_TYPES.map(o => `<option value="${o.type}" ${o.type === t.type ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
          <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text-3);display:flex;">${icon('chevron-down', 15)}</span>
        </div>
        <input type="text" inputmode="numeric" id="draft-total-${esc(t.id)}" value="${esc(t.total)}" data-input="taskTotal" data-task-id="${esc(t.id)}" style="width:56px;text-align:center;padding:9px 8px;" class="text-input" />
        ${canRemove ? `<button class="mini-icon-btn" data-action="removeDraftTask" data-task-id="${esc(t.id)}">${icon('trash', 15)}</button>` : ''}
      </div>
      ${t.type === 'custom' ? `<input type="text" id="draft-custom-${esc(t.id)}" class="text-input" placeholder="Название задания, напр. Коллоквиумы" value="${esc(t.customLabel || '')}" data-input="taskCustom" data-task-id="${esc(t.id)}" style="margin-left:23px;" />` : ''}
    </div>`).join('');

  const submitDisabled = d.name.trim().length === 0;

  return `
  <div class="modal-overlay ${animModalEnter ? 'anim-in' : ''}">
    <div class="card scroll-y" style="border-radius:18px;padding:26px;width:460px;max-width:100%;max-height:86vh;display:flex;flex-direction:column;gap:22px;" data-stop="1">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h2 style="margin:0;font-family:'Onest';font-weight:600;font-size:19px;color:var(--text);letter-spacing:-.01em;">${isEdit ? 'Редактировать предмет' : 'Новый предмет'}</h2>
        <button class="close-btn" data-action="closeAddModal">${icon('x', 16)}</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12.5px;color:var(--text-2);font-weight:500;">Название предмета</span>
          <input type="text" id="draft-name" class="text-input" placeholder="Например, Теория вероятностей" value="${esc(d.name)}" data-input="draftName" />
        </label>
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12.5px;color:var(--text-2);font-weight:500;">Преподаватель</span>
          <input type="text" id="draft-teacher" class="text-input" placeholder="Фамилия И. О." value="${esc(d.teacher)}" data-input="draftTeacher" />
        </label>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12.5px;color:var(--text-2);font-weight:500;">Что даёт полное выполнение</span>
          <div style="display:flex;gap:3px;background:var(--surface-2);padding:3px;border-radius:11px;">${autoOpts}</div>
        </div>
        ${EXAM_GROUPS.length && state.examGroup ? `
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12.5px;color:var(--text-2);font-weight:500;">Экзамен или зачёт · ${esc(examGroupTitle(state.examGroup))}</span>
          <div style="position:relative;display:flex;">
            <select class="select-input" data-input="examLink">
              <option value="" ${!d.examLink ? 'selected' : ''}>— Не связано —</option>
              ${currentExamList().map(e => `<option value="${esc(e.id)}" ${e.id === d.examLink ? 'selected' : ''}>${esc(e.name)} · ${examKindLabel(e.kind)}${e.date ? ' · ' + fmtExamDate(e.date) : ' · дата уточняется'}</option>`).join('')}
            </select>
            <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text-3);display:flex;">${icon('chevron-down', 15)}</span>
          </div>
        </div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <span style="font-size:12.5px;color:var(--text-2);font-weight:500;">Задания</span>
        ${tasksHtml}
        <button class="dashed-inline" data-action="addDraftTask">${icon('plus', 15)}Добавить задание</button>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px;">
        <button class="ghost-btn" data-action="closeAddModal">Отмена</button>
        <button class="primary-btn" data-action="submitDraft" ${submitDisabled ? 'disabled' : ''} style="opacity:${submitDisabled ? 0.5 : 1};">${isEdit ? 'Сохранить' : 'Добавить предмет'}</button>
      </div>
    </div>
  </div>`;
}

function sessionModalHtml() {
  const d = state.sessionDraft;
  const submitDisabled = d.name.trim().length === 0;
  return `
  <div class="modal-overlay ${animModalEnter ? 'anim-in' : ''}">
    <div class="card" style="border-radius:18px;padding:26px;width:420px;max-width:100%;display:flex;flex-direction:column;gap:22px;" data-stop="1">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h2 style="margin:0;font-family:'Onest';font-weight:600;font-size:19px;color:var(--text);letter-spacing:-.01em;">Новая сессия</h2>
        <button class="close-btn" data-action="closeSessionModal">${icon('x', 16)}</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12.5px;color:var(--text-2);font-weight:500;">Название</span>
          <input type="text" id="sess-name" class="text-input" placeholder="Например, Семестр 4" value="${esc(d.name)}" data-input="sessionName" />
        </label>
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12.5px;color:var(--text-2);font-weight:500;">Период</span>
          <input type="text" id="sess-period" class="text-input" placeholder="Например, Осень 2025" value="${esc(d.period)}" data-input="sessionPeriod" />
        </label>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px;">
        <button class="ghost-btn" data-action="closeSessionModal">Отмена</button>
        <button class="primary-btn" data-action="submitSession" ${submitDisabled ? 'disabled' : ''} style="opacity:${submitDisabled ? 0.5 : 1};">Создать сессию</button>
      </div>
    </div>
  </div>`;
}

function importModalHtml() {
  const u = state.oguUI || {};
  const notAvailable = !oguAvailable();

  const sel = (label, name, items, valueKey, labelFn, current, disabled) => {
    const opts = (items && items.length)
      ? items.map(it => `<option value="${esc(it[valueKey])}" ${Number(it[valueKey]) === Number(current) ? 'selected' : ''}>${esc(labelFn(it))}</option>`).join('')
      : '<option>—</option>';
    return `
    <div style="display:flex;flex-direction:column;gap:6px;">
      <span style="font-size:12.5px;color:var(--text-2);font-weight:500;">${label}</span>
      <div style="position:relative;display:flex;">
        <select class="select-input" data-input="${name}" ${disabled ? 'disabled' : ''} style="${disabled ? 'opacity:.6;cursor:default;' : ''}">${opts}</select>
        <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text-3);display:flex;">${icon('chevron-down', 15)}</span>
      </div>
    </div>`;
  };

  let body;
  if (notAvailable) {
    body = `<p style="margin:0;font-size:13.5px;line-height:1.5;color:var(--text-2);">Выбор группы доступен только в приложении Adelon.</p>`;
  } else {
    const disabled = !!u.loading;
    body = `
      ${sel('Институт / факультет', 'oguDivision', u.divisions, 'idDivision', (d) => d.titleDivision, u.divId, disabled)}
      <div style="display:flex;gap:12px;">
        <div style="width:130px;flex-shrink:0;">${sel('Курс', 'oguCourse', u.courses, 'kurs', (c) => c.kurs + ' курс', u.kurs, disabled)}</div>
        <div style="flex:1;min-width:0;">${sel('Группа', 'oguGroup', u.groups, 'idgruop', (g) => g.title + (g.Codedirection ? ' · ' + g.Codedirection : ''), u.groupId, disabled)}</div>
      </div>
      ${u.loading ? `<div style="font-size:12.5px;color:var(--text-3);display:flex;align-items:center;gap:8px;">${icon('refresh', 14)}Загрузка…</div>` : ''}
      ${u.error ? `<div style="font-size:12.5px;color:var(--accent-2);background:var(--accent-soft);border-radius:9px;padding:9px 11px;">Не удалось загрузить. Проверьте подключение к интернету и попробуйте ещё раз.</div>` : ''}`;
  }

  const canImport = !notAvailable && !u.loading && !!u.groupId;

  return `
  <div class="modal-overlay ${animModalEnter ? 'anim-in' : ''}">
    <div class="card scroll-y" style="border-radius:18px;padding:26px;width:480px;max-width:100%;max-height:88vh;display:flex;flex-direction:column;gap:20px;" data-stop="1">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h2 style="margin:0;font-family:'Onest';font-weight:600;font-size:19px;color:var(--text);letter-spacing:-.01em;">Выбор группы</h2>
        <button class="close-btn" data-action="closeImportModal">${icon('x', 16)}</button>
      </div>
      <p style="margin:-6px 0 0;font-size:12.5px;color:var(--text-3);line-height:1.5;">Выберите свою группу — расписание заполнится автоматически.</p>
      ${body}
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:2px;">
        <button class="ghost-btn" data-action="closeImportModal">Отмена</button>
        <button class="primary-btn" data-action="importOgu" ${canImport ? '' : 'disabled'} style="opacity:${canImport ? 1 : 0.5};">${state.oguGroup ? 'Сохранить' : 'Готово'}</button>
      </div>
    </div>
  </div>`;
}

function confirmModalHtml() {
  const d = state.confirmDialog;
  return `
  <div class="modal-overlay ${animModalEnter ? 'anim-in' : ''}" data-action="confirmNo">
    <div class="card" style="border-radius:18px;padding:24px 26px;width:400px;max-width:100%;display:flex;flex-direction:column;gap:18px;" data-stop="1">
      <div style="display:flex;align-items:flex-start;gap:13px;">
        <span style="width:40px;height:40px;border-radius:11px;background:var(--surface-2);color:var(--text-2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${icon('trash', 19)}</span>
        <div style="display:flex;flex-direction:column;gap:6px;min-width:0;">
          <h2 style="margin:0;font-family:'Onest';font-weight:600;font-size:18px;color:var(--text);letter-spacing:-.01em;">${esc(d.title)}</h2>
          <p style="margin:0;font-size:13.5px;line-height:1.5;color:var(--text-2);">${esc(d.message)}</p>
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button class="ghost-btn" data-action="confirmNo">Отмена</button>
        <button class="primary-btn" data-action="confirmYes">${esc(d.confirmLabel || 'Удалить')}</button>
      </div>
    </div>
  </div>`;
}

const actions = {
  goSessionsTab: () => setUI({ navTab: 'main', view: 'sessions', showThemeMenu: false }),
  goSchedule: () => setUI({ navTab: 'schedule', showThemeMenu: false }),
  goToSessions: () => setUI({ view: 'sessions' }),
  toggleThemeMenu: () => setUI({ showThemeMenu: !state.showThemeMenu }),
  closeThemeMenu: () => setUI({ showThemeMenu: false }),
  selectTheme: (el) => { rememberTheme(el.dataset.themeId); setState({ themeId: el.dataset.themeId, showThemeMenu: false }); },

  openSession: (el) => setUI({ navTab: 'main', view: 'subjects', currentSessionId: el.dataset.sessionId }),
  toggleExamPanel: () => setUI({ examPanelOpen: !state.examPanelOpen }),

  prevWeek: () => setUI({ weekOffset: state.weekOffset - 1 }),
  nextWeek: () => setUI({ weekOffset: state.weekOffset + 1 }),
  thisWeek: () => setUI({ weekOffset: 0 }),

  toggleSegment: (el) => {
    const { subjectId, taskId } = el.dataset;
    const index = Number(el.dataset.index);
    const sess = state.sessions.find(s => s.id === state.currentSessionId);
    if (!sess) return;
    const sub = sess.subjects.find(s => s.id === subjectId);
    if (!sub) return;
    const task = sub.tasks.find(t => t.id === taskId);
    if (!task) return;
    const wasClosed = subjectClosed(sub);
    task.completed[index] = !task.completed[index];
    lastToggledSegKey = task.completed[index] ? (subjectId + '|' + taskId + '|' + index) : null;
    const rect = (!wasClosed && subjectClosed(sub)) ? el.getBoundingClientRect() : null;
    setState({});
    if (rect) fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
  },

  deleteSubject: (el) => {
    const sess = state.sessions.find(s => s.id === state.currentSessionId);
    if (!sess) return;
    const sub = sess.subjects.find(s => s.id === el.dataset.subjectId);
    if (!sub) return;
    askConfirm({ title: 'Удалить предмет?', message: `«${sub.name}» и весь прогресс по нему будут удалены.`, confirmLabel: 'Удалить' }, () => {
      sess.subjects = sess.subjects.filter(s => s.id !== el.dataset.subjectId);
      setState({});
    });
  },

  toggleExam: (el) => {
    const sess = state.sessions.find(s => s.id === state.currentSessionId);
    if (!sess) return;
    const sub = sess.subjects.find(s => s.id === el.dataset.subjectId);
    if (!sub) return;
    const wasClosed = subjectClosed(sub);
    sub.examPassed = !sub.examPassed;
    const rect = (!wasClosed && subjectClosed(sub)) ? el.getBoundingClientRect() : null;
    setState({});
    if (rect) fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
  },

  deleteSession: (el) => {
    const id = el.dataset.sessionId;
    const sess = state.sessions.find(s => s.id === id);
    if (!sess) return;
    askConfirm({ title: 'Удалить семестр?', message: `«${sess.name}» и все его предметы будут удалены безвозвратно.`, confirmLabel: 'Удалить' }, () => {
      state.sessions = state.sessions.filter(s => s.id !== id);
      if (state.currentSessionId === id) { state.view = 'sessions'; state.currentSessionId = null; }
      setState({});
    });
  },

  confirmYes: () => {
    const cb = confirmCb;
    confirmCb = null;
    state.confirmDialog = null;
    if (cb) cb(); else render();
  },
  confirmNo: () => {
    confirmCb = null;
    setUI({ confirmDialog: null });
  },

  openImportModal: () => {
    setUI({ showImportModal: true, showThemeMenu: false, oguUI: { loading: !!oguAvailable(), error: null, divisions: [], courses: [], groups: [] } });
    if (!oguAvailable()) return;
    (async () => {
      const res = await window.adelon.ogu.divisions();
      if (!res.ok) return patchOgu({ loading: false, error: res.error });
      const saved = state.oguGroup;
      let divId = saved ? saved.divId : null;
      if (!divId || !res.data.some(d => Number(d.idDivision) === Number(divId))) {
        const ip = res.data.find(d => /приборостроени/i.test(d.titleDivision));
        divId = ip ? ip.idDivision : (res.data[0] && res.data[0].idDivision);
      }
      patchOgu({ loading: false, divisions: res.data, divId });
      if (divId != null) await oguLoadCourses(divId, saved ? saved.kurs : 2);
    })();
  },
  closeImportModal: () => setUI({ showImportModal: false, oguUI: null }),
  importOgu: () => {
    const u = state.oguUI;
    if (!u || !u.groupId || !oguAvailable()) return;
    const div = (u.divisions || []).find(d => Number(d.idDivision) === Number(u.divId));
    const grp = (u.groups || []).find(g => Number(g.idgruop) === Number(u.groupId));
    patchOgu({ loading: true, error: null });
    (async () => {
      const res = await window.adelon.ogu.schedule(u.groupId);
      if (!res.ok) return patchOgu({ loading: false, error: res.error });
      applyOguEvents(res.data);
      state.oguGroup = { divId: u.divId, divTitle: div ? div.titleDivision : '', kurs: u.kurs, groupId: u.groupId, groupTitle: grp ? grp.title : ('#' + u.groupId) };
      state.oguSync = { at: Date.now(), count: res.data.length, error: null };
      state.showImportModal = false;
      state.oguUI = null;
      state.navTab = 'schedule';
      state.weekOffset = 0;
      setState({});
    })();
  },
  refreshOgu: () => { refreshOguData(); },

  openAddModal: () => setUI({
    showAddModal: true,
    editSubjectId: null,
    draft: { name: '', teacher: '', autoType: 'auto', examLink: '', tasks: [{ id: uid('d'), type: 'flask', total: 4 }] },
  }),
  openEditModal: (el) => {
    const sess = state.sessions.find(s => s.id === state.currentSessionId);
    if (!sess) return;
    const sub = sess.subjects.find(s => s.id === el.dataset.subjectId);
    if (!sub) return;
    setUI({
      showAddModal: true,
      editSubjectId: sub.id,
      draft: {
        name: sub.name,
        teacher: sub.meta && sub.meta !== 'Преподаватель' ? sub.meta : '',
        autoType: sub.autoType || 'auto',
        examLink: sub.examLink || '',
        tasks: sub.tasks.map(t => ({
          id: uid('d'), type: t.type, total: String(t.total),
          customLabel: t.type === 'custom' ? (t.label || '') : '',
          origCompleted: Array.isArray(t.completed) ? t.completed.slice() : null,
        })),
      },
    });
  },
  closeAddModal: () => setUI({ showAddModal: false, editSubjectId: null }),
  setDraftAuto: (el) => setUI({ draft: { ...state.draft, autoType: el.dataset.auto } }),
  addDraftTask: () => setUI({ draft: { ...state.draft, tasks: [...state.draft.tasks, { id: uid('d'), type: 'flask', total: 4 }] } }),
  removeDraftTask: (el) => setUI({ draft: { ...state.draft, tasks: state.draft.tasks.filter(t => t.id !== el.dataset.taskId) } }),
  submitDraft: () => {
    const d = state.draft;
    if (!d.name.trim()) return;
    const sid = state.currentSessionId;
    const built = d.tasks.filter(t => Number(t.total) > 0).map(t => {
      const total = Number(t.total);
      const done = t.origCompleted ? Math.min(t.origCompleted.filter(Boolean).length, total) : 0;
      const label = t.type === 'custom'
        ? ((t.customLabel || '').trim() || 'Задание')
        : ((TASK_TYPES.find(x => x.type === t.type) || {}).label || t.type);
      return { id: uid('t'), type: t.type, label, total, completed: mk(total, done) };
    });
    const tasks = built.length ? built : [{ id: uid('t'), type: 'flask', label: 'Лабораторные', total: 4, completed: mk(4, 0) }];
    const sess = state.sessions.find(s => s.id === sid);
    if (!sess) return setState({ showAddModal: false, editSubjectId: null });
    const examLink = d.examLink || null;
    if (state.editSubjectId) {
      const sub = sess.subjects.find(s => s.id === state.editSubjectId);
      if (sub) {
        sub.name = d.name.trim();
        sub.meta = d.teacher.trim() || 'Преподаватель';
        sub.autoType = d.autoType || 'auto';
        sub.examLink = examLink;
        sub.tasks = tasks;
      }
    } else {
      sess.subjects.push({
        id: uid('subj'), name: d.name.trim(), meta: d.teacher.trim() || 'Преподаватель',
        autoType: d.autoType || 'auto', examLink, tasks,
      });
    }
    setState({ showAddModal: false, editSubjectId: null });
  },

  downloadUpdate: () => {
    if (window.adelon && window.adelon.update) window.adelon.update.download();
    const v = state.update ? state.update.version : null;
    setUI({ update: { status: 'downloading', version: v, percent: 0 } });
  },
  installUpdate: () => { if (window.adelon && window.adelon.update) window.adelon.update.install(); },
  dismissUpdate: () => setUI({ update: null }),

  openSessionModal: () => setUI({ showSessionModal: true, sessionDraft: { name: '', period: '' } }),
  closeSessionModal: () => setUI({ showSessionModal: false }),
  submitSession: () => {
    const d = state.sessionDraft;
    if (!d.name.trim()) return;
    state.sessions.unshift({ id: uid('sess'), name: d.name.trim(), period: d.period.trim() || 'Без периода', subjects: [] });
    setState({ showSessionModal: false });
  },

};

const inputHandlers = {
  draftName: (v) => { state.draft.name = v; updateSubmitState('draft-name'); },
  draftTeacher: (v) => { state.draft.teacher = v; },
  taskType: (v, el) => { const t = state.draft.tasks.find(t => t.id === el.dataset.taskId); if (t) { t.type = v; render(); } },
  taskTotal: (v, el) => { const t = state.draft.tasks.find(t => t.id === el.dataset.taskId); if (t) t.total = v.replace(/[^0-9]/g, ''); },
  taskCustom: (v, el) => { const t = state.draft.tasks.find(t => t.id === el.dataset.taskId); if (t) t.customLabel = v; },
  examLink: (v) => { state.draft.examLink = v; },
  examGroupSelect: (v) => { setState({ examGroup: v || null }); },
  sessionName: (v) => { state.sessionDraft.name = v; updateSubmitState('sess-name'); },
  sessionPeriod: (v) => { state.sessionDraft.period = v; },
  oguDivision: (v) => { oguLoadCourses(Number(v), 2); },
  oguCourse: (v) => { oguLoadGroups(state.oguUI.divId, Number(v), state.oguGroup && state.oguGroup.groupId); },
  oguGroup: (v) => { patchOgu({ groupId: Number(v) }); },
};

function updateSubmitState(_srcId) {
  const modal = document.querySelector('.modal-overlay .card');
  if (!modal) return;
  const btn = modal.querySelector('.primary-btn');
  if (!btn) return;
  let disabled = false;
  if (state.showAddModal) disabled = state.draft.name.trim().length === 0;
  else if (state.showSessionModal) disabled = state.sessionDraft.name.trim().length === 0;
  else if (state.showLessonModal) disabled = !state.lessonDraft || state.lessonDraft.name.trim().length === 0;
  btn.disabled = disabled;
  btn.style.opacity = disabled ? 0.5 : 1;
}

root.addEventListener('click', (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;
  if (actionEl.classList.contains('modal-overlay') && e.target !== actionEl) return;
  const a = actionEl.dataset.action;
  if (actions[a]) { e.preventDefault(); actions[a](actionEl); }
});

root.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest('[role="button"][data-action]');
  if (!el) return;
  e.preventDefault();
  const a = el.dataset.action;
  if (actions[a]) actions[a](el);
});

root.addEventListener('input', (e) => {
  const el = e.target.closest('[data-input]');
  if (!el) return;
  const h = inputHandlers[el.dataset.input];
  if (h) h(el.value, el);
});

root.addEventListener('change', (e) => {
  const el = e.target.closest('[data-input]');
  if (!el) return;
  const name = el.dataset.input;
  if (['taskType', 'oguDivision', 'oguCourse', 'oguGroup', 'examLink', 'examGroupSelect'].includes(name)) {
    const h = inputHandlers[name];
    if (h) h(el.value, el);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (state.confirmDialog) actions.confirmNo();
    else if (state.showAddModal) actions.closeAddModal();
    else if (state.showSessionModal) actions.closeSessionModal();
    else if (state.showImportModal) actions.closeImportModal();
    else if (state.update && state.update.status === 'available') actions.dismissUpdate();
    else if (state.showThemeMenu) actions.closeThemeMenu();
  }
});

function hideSplash() {
  const el = document.getElementById('splash');
  if (!el) return;
  el.classList.add('hidden');
  setTimeout(() => el.remove(), 600);
}

(async function boot() {
  const startedAt = Date.now();
  await loadPersisted();
  render();

  if (window.adelon && window.adelon.update) {
    window.adelon.update.onStatus((payload) => {
      if (!payload) return;
      if (payload.status === 'error') { state.update = null; render(); return; }
      if (payload.status === 'downloading' && state.update && state.update.status === 'downloading' && payload.percent != null) {
        state.update.percent = payload.percent;
        const pct = Math.max(0, Math.min(100, payload.percent));
        const bar = document.getElementById('update-bar-fill');
        const label = document.getElementById('update-bar-pct');
        if (bar) bar.style.width = pct + '%';
        if (label) label.textContent = pct + '%';
        return;
      }
      state.update = payload;
      render();
    });
  }
  const MIN_SPLASH = 1100;
  const wait = Math.max(0, MIN_SPLASH - (Date.now() - startedAt));
  setTimeout(hideSplash, wait);

  const DAY = 24 * 60 * 60 * 1000;
  const last = state.oguSync && state.oguSync.at ? state.oguSync.at : 0;
  if (oguAvailable() && state.oguGroup && Date.now() - last > DAY) {
    setTimeout(refreshOguData, 1500);
  }
})();
