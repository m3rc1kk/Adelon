'use strict';

// weight — вклад одной работы в процент готовности предмета. Без него курсовая
// весила бы столько же, сколько одна лабораторная, и проценты врали.
const TASK_TYPES = [
  { type: 'flask', label: 'Лабораторные', weight: 1 },
  { type: 'pen', label: 'Практические', weight: 1 },
  { type: 'folder', label: 'Проект', weight: 3 },
  { type: 'book', label: 'Курсовая', weight: 5 },
  { type: 'custom', label: 'Другое', weight: 1 },
];
const taskWeight = (t) => {
  const found = TASK_TYPES.find(x => x.type === (t && t.type));
  return found ? found.weight : 1;
};

// Состояния сегмента. Храним прямо в task.completed: false — не сделано,
// 'ready' — работа готова, но ещё не сдана, true — выполнено. Старые данные
// (массивы true/false) остаются валидными, поэтому миграция не нужна.
const SEG_READY = 'ready';
const segIsDone = (v) => v === true;
const segIsReady = (v) => v === SEG_READY || v === 'rework';
// Клик гоняет по кругу: не сделано → готово → выполнено → не сделано.
const segNext = (v) => (segIsDone(v) ? false : segIsReady(v) ? true : SEG_READY);

const SUBJECT_SORTS = [
  { id: 'manual', label: 'В порядке добавления' },
  { id: 'progress', label: 'Сначала отстающие' },
  { id: 'lesson', label: 'По ближайшей паре' },
  { id: 'name', label: 'По названию' },
];

const AUTO_TYPES = [
  { value: 'auto', label: 'Автомат', name: 'автомат', Name: 'Автомат' },
  { value: 'admit', label: 'Допуск', name: 'допуск', Name: 'Допуск' },
  { value: 'point', label: '+Балл', name: 'балл', Name: 'Балл' },
];

const DEFAULT_EXAM_GROUPS = [
  { id: '41pg', title: '41ПГ' },
  { id: '41pi', title: '41ПИ' },
  { id: '41it', title: '41ИТ' },
  { id: '41ivt', title: '41ИВТ' },
];

// Свои группы живут рядом со встроенными: у них нет готового расписания сессии,
// зато в них можно вести собственный список экзаменов и делиться им через CSV.
function examGroups() {
  return [...DEFAULT_EXAM_GROUPS, ...(state.userGroups || [])];
}
const isUserGroup = (id) => (state.userGroups || []).some(g => g.id === id);

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
  { id: 'auto-warm', label: 'Как в Windows · тёплая', bg: '#F4F1EB', accent: '#1A1917', auto: true },
  { id: 'auto-neutral', label: 'Как в Windows · нейтральная', bg: '#F2F3F4', accent: '#131415', auto: true },
];

// Автотемы — не самостоятельные палитры, а пара «светлая/тёмная», из которой
// нужная выбирается по системной настройке Windows.
const AUTO_THEMES = {
  'auto-warm': { light: 'warm-light', dark: 'warm-dark' },
  'auto-neutral': { light: 'neutral-light', dark: 'neutral-dark' },
};
const prefersDarkOs = () => !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
function resolveTheme(id) {
  const pair = AUTO_THEMES[id];
  if (!pair) return id;
  return prefersDarkOs() ? pair.dark : pair.light;
}

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
  navTab: 'dashboard',
  view: 'sessions',
  currentSessionId: null,
  showAddModal: false,
  editSubjectId: null,
  examPanelOpen: false,
  examGroup: DEFAULT_EXAM_GROUPS[0] ? DEFAULT_EXAM_GROUPS[0].id : null,
  userGroups: [],
  userExams: {},
  hiddenExams: [],
  activity: {},
  remindersSeen: {},
  examReminders: null,
  undo: null,
  showExamModal: false,
  examDraft: { name: '', kind: 'exam', date: '', dateUnknown: false },
  showGroupsModal: false,
  groupDraft: '',
  subjectSort: 'manual',
  hideClosed: false,
  showSessionModal: false,
  editSessionId: null,
  showLessonModal: false,
  lessonEdit: null,
  lessonDraft: null,
  confirmDialog: null,
  weekOffset: 0,
  showImportModal: false,
  csvPreview: null,
  csvBusy: false,
  notice: null,
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

const PERSIST_KEYS = ['themeId', 'sessions', 'schedule', 'oguGroup', 'oguSync', 'examGroup', 'userGroups', 'userExams', 'hiddenExams', 'activity', 'remindersSeen', 'subjectSort', 'hideClosed'];

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
      // Свои группы читаем до examGroup — иначе сохранённый выбор не пройдёт проверку.
      if (Array.isArray(data.userGroups)) state.userGroups = data.userGroups.filter(g => g && g.id && g.title);
      if (typeof data.examGroup === 'string' && examGroups().some(g => g.id === data.examGroup)) state.examGroup = data.examGroup;
      if (data.userExams && typeof data.userExams === 'object' && !Array.isArray(data.userExams)) state.userExams = data.userExams;
      if (Array.isArray(data.hiddenExams)) state.hiddenExams = data.hiddenExams;
      if (SUBJECT_SORTS.some(s => s.id === data.subjectSort)) state.subjectSort = data.subjectSort;
      if (typeof data.hideClosed === 'boolean') state.hideClosed = data.hideClosed;
      if (data.activity && typeof data.activity === 'object' && !Array.isArray(data.activity)) state.activity = data.activity;
      if (data.remindersSeen && typeof data.remindersSeen === 'object' && !Array.isArray(data.remindersSeen)) state.remindersSeen = data.remindersSeen;
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

const taskDone = (t) => t.completed.filter(segIsDone).length;
const taskReady = (t) => t.completed.filter(segIsReady).length;

// Проценты считаем по весам, а счётчики работ («5/8») — по штукам:
// «сколько сделано» и «насколько предмет готов» — разные вопросы.
function subjectPct(sub) {
  const done = sub.tasks.reduce((a, t) => a + taskDone(t) * taskWeight(t), 0);
  const total = sub.tasks.reduce((a, t) => a + t.total * taskWeight(t), 0) || 1;
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

// Отмечает активность за сегодня для тепловой карты (delta +1 при отметке, −1 при снятии).
function bumpActivity(delta) {
  const key = dateKey(new Date());
  const a = state.activity || (state.activity = {});
  const v = (a[key] || 0) + delta;
  if (v > 0) a[key] = v; else delete a[key];
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
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 1.5 6.5 2 7H4c.5-.5 2-2 2-7z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3 3 0 0 1 0 5.6"/><path d="M17.5 19a5.5 5.5 0 0 0-3-4.9"/>',
    flame: '<path d="M12 3c2.4 3 4.2 4.9 4.2 8.2a4.2 4.2 0 0 1-8.4 0c0-1.4.6-2.6 1.5-3.6.1 1.2.8 1.9 1.5 2.3C10.6 7.8 10 5.9 12 3z"/>',
    grid: '<rect x="4" y="4" width="6.2" height="6.2" rx="1.6"/><rect x="13.8" y="4" width="6.2" height="6.2" rx="1.6"/><rect x="4" y="13.8" width="6.2" height="6.2" rx="1.6"/><rect x="13.8" y="13.8" width="6.2" height="6.2" rx="1.6"/>',
    alert: '<path d="M12 4.5l8 14.5H4L12 4.5z"/><path d="M12 10.5v4"/><path d="M12 17.5h.01"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/>',
    upload: '<path d="M12 15.5V5"/><path d="M8 9l4-4 4 4"/><path d="M5 19.5h14"/>',
    clock: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.4V12l3 1.8"/>',
    grip: '<circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/>',
    sheet: '<rect x="4" y="4" width="16" height="16" rx="2.2"/><path d="M4 9.5h16"/><path d="M9.5 9.5V20"/><path d="M4 15h16"/>',
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

function groupExamList(groupId) {
  if (!groupId) return [];
  const hidden = state.hiddenExams || [];
  const base = (EXAM_SCHEDULES[groupId] || []).filter(e => !hidden.includes(e.id));
  const user = ((state.userExams && state.userExams[groupId]) || []).filter(e => !hidden.includes(e.id));
  return [...base, ...user.map(e => ({ ...e, _user: true }))];
}
function currentExamList() {
  return groupExamList(state.examGroup);
}
function examById(id) {
  if (!id) return null;
  for (const g of examGroups()) {
    const found = groupExamList(g.id).find(e => e.id === id);
    if (found) return found;
  }
  return null;
}
function examGroupTitle(id) {
  const g = examGroups().find(x => x.id === id);
  return g ? g.title : '';
}
function fmtExamDate(dateStr) {
  if (!dateStr) return 'дата уточняется';
  const d = keyToDate(dateStr);
  return d.getDate() + ' ' + RU_MONTHS[d.getMonth()] + ' ' + d.getFullYear();
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

const REMINDER_MILESTONES = [7, 3, 1, 0];
// Наименьший рубеж, в который «попал» экзамен: n=5 → 7, n=2 → 3, n=0 → 0, n>7 → null.
function currentMilestone(n) {
  if (n === null || n < 0) return null;
  const sorted = [...REMINDER_MILESTONES].sort((a, b) => a - b);
  for (const m of sorted) if (n <= m) return m;
  return null;
}
// Экзамены выбранной группы с известной датой, у которых наступил новый рубеж напоминания.
function computeExamReminders() {
  const g = state.examGroup;
  if (!g) return [];
  const seen = state.remindersSeen || {};
  const due = [];
  for (const e of groupExamList(g)) {
    if (!e.date) continue;
    const n = daysUntil(e.date);
    const m = currentMilestone(n);
    if (m === null) continue;
    const key = e.id + ':' + m;
    if (seen[key]) continue;
    due.push({ id: e.id, name: e.name, kind: e.kind, n, date: e.date, key });
  }
  due.sort((a, b) => a.n - b.n);
  return due;
}

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
  const modalKey = state.showAddModal ? 'add' : state.showSessionModal ? 'session' : state.showExamModal ? 'exam' : state.showGroupsModal ? 'groups' : state.showImportModal ? 'import' : state.csvPreview ? 'csv' : state.confirmDialog ? 'confirm' : (state.update && state.update.status === 'available') ? 'update' : null;
  animMainEnter = mainKey !== lastMainKey;
  animModalEnter = modalKey !== null && modalKey !== lastModalKey;
  animExamEnter = state.examPanelOpen && !lastExamPanelOpen;
  animExamExit = !state.examPanelOpen && lastExamPanelOpen;

  document.documentElement.setAttribute('data-theme', resolveTheme(state.themeId));
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

// ─── Глобальная отмена ──────────────────────────────────────────────────────
// Снимок делаем со всех сохраняемых данных перед каждым действием и кладём в
// стек, только если действие их реально изменило. Так отмена работает для
// любого действия сама, без правок в каждом обработчике.
const HISTORY_LIMIT = 50;
const undoHistory = [];
const redoHistory = [];

const dataSnapshot = () => JSON.stringify(collectPersist());

function restoreSnapshot(snap) {
  const data = JSON.parse(snap);
  for (const k of PERSIST_KEYS) if (k in data) state[k] = data[k];
  rememberTheme(state.themeId);
}

function recordHistory(before) {
  if (dataSnapshot() === before) return;
  undoHistory.push(before);
  if (undoHistory.length > HISTORY_LIMIT) undoHistory.shift();
  redoHistory.length = 0;
}

function undoLast() {
  if (!undoHistory.length) { showNotice('Отменять нечего.', 'warn'); return; }
  redoHistory.push(dataSnapshot());
  restoreSnapshot(undoHistory.pop());
  closeAllModals();
  setState({});
  showNotice('Действие отменено. Вернуть — Ctrl+Shift+Z.');
}

function redoLast() {
  if (!redoHistory.length) { showNotice('Возвращать нечего.', 'warn'); return; }
  undoHistory.push(dataSnapshot());
  restoreSnapshot(redoHistory.pop());
  closeAllModals();
  setState({});
  showNotice('Действие возвращено.');
}

// Отмена может убрать сущность, которую сейчас редактируют, — окна закрываем.
function closeAllModals() {
  state.showAddModal = false;
  state.editSubjectId = null;
  state.showSessionModal = false;
  state.editSessionId = null;
  state.showExamModal = false;
  state.showGroupsModal = false;
  state.showLessonModal = false;
  state.csvPreview = null;
  state.confirmDialog = null;
  if (state.currentSessionId && !state.sessions.some(s => s.id === state.currentSessionId)) {
    state.view = 'sessions';
    state.currentSessionId = null;
  }
}

let undoRestore = null;
let undoTimer = null;
const UNDO_MS = 6000;
// Удаляет сразу и показывает плашку «Отменить» на несколько секунд.
function offerUndo(message, restoreFn) {
  undoRestore = restoreFn;
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    undoRestore = null;
    if (state.undo) setUI({ undo: null });
  }, UNDO_MS);
  setUI({ undo: { message } });
}

function template() {
  const density = 'comfortable';
  const overrideStyle = `--card-pad:22px;--card-gap:18px;`;
  const isMain = state.navTab === 'main';

  return `
  <div style="min-height:100vh;background:var(--bg);color:var(--text);font-family:'Golos Text',system-ui,sans-serif;-webkit-font-smoothing:antialiased;" data-theme="${resolveTheme(state.themeId)}">
  <div style="${overrideStyle}">
    ${headerHtml(isMain)}
    ${state.navTab === 'dashboard' ? dashboardViewHtml() : ''}
    ${isMain && state.view === 'sessions' ? sessionsViewHtml() : ''}
    ${isMain && state.view === 'subjects' ? subjectsViewHtml() : ''}
    ${state.navTab === 'schedule' ? scheduleViewHtml() : ''}
    ${state.showAddModal ? addModalHtml() : ''}
    ${state.showSessionModal ? sessionModalHtml() : ''}
    ${state.showExamModal ? examModalHtml() : ''}
    ${state.showGroupsModal ? groupsModalHtml() : ''}
    ${state.showImportModal ? importModalHtml() : ''}
    ${state.csvPreview ? csvModalHtml() : ''}
    ${state.confirmDialog ? confirmModalHtml() : ''}
    ${state.update && state.update.status === 'available' ? updateModalHtml() : ''}
    ${toastStackHtml()}
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
        <button class="primary-btn" data-action="downloadUpdate" style="display:flex;align-items:center;gap:7px;">${icon('download', 16)}Скачать</button>
      </div>
    </div>
  </div>`;
}

// Единый стек тостов в правом нижнем углу — элементы идут столбиком и не наезжают друг на друга.
function toastStackHtml() {
  const parts = [
    state.examReminders && state.examReminders.length ? examReminderToastHtml() : '',
    state.update ? updateToastHtml() : '',
    state.notice ? noticeToastHtml() : '',
    state.undo ? undoToastHtml() : '',
  ].filter(Boolean);
  if (!parts.length) return '';
  return `
  <div style="position:fixed;right:24px;bottom:24px;z-index:210;display:flex;flex-direction:column;gap:12px;align-items:flex-end;width:360px;max-width:calc(100vw - 48px);pointer-events:none;">
    ${parts.join('')}
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
    ? `<button class="primary-btn" style="width:100%;padding:9px 16px;font-size:13px;" data-action="installUpdate">Перезапустить</button>`
    : '';

  return `
  <div class="update-toast" style="width:100%;pointer-events:auto;">
    <div class="card" style="border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:14px;box-shadow:0 14px 40px rgba(20,16,12,.22);">
      <div style="display:flex;align-items:${ready ? 'center' : 'flex-start'};gap:12px;">
        ${iconWrap}
        ${bodyHtml}
      </div>
      ${footer}
    </div>
  </div>`;
}

function undoToastHtml() {
  const u = state.undo;
  if (!u) return '';
  return `
  <div class="app-toast" style="width:100%;pointer-events:auto;">
    <div class="card" style="border-radius:14px;padding:10px 12px 10px 16px;display:flex;align-items:center;gap:10px;overflow:hidden;box-shadow:0 14px 40px rgba(20,16,12,.22);">
      <span style="font-size:13.5px;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(u.message)}</span>
      <button class="ghost-btn" style="padding:7px 14px;font-size:13px;flex-shrink:0;" data-action="undoDelete">Отменить</button>
      <button class="mini-icon-btn" style="width:28px;height:28px;flex-shrink:0;" data-action="dismissUndo" title="Закрыть">${icon('x', 14)}</button>
    </div>
  </div>`;
}

function examReminderToastHtml() {
  const list = state.examReminders || [];
  if (!list.length) return '';
  const rows = list.map((r) => `
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="width:30px;height:30px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--accent-soft);color:var(--accent-2);">${icon(r.kind === 'exam' ? 'cap' : 'clipboard', 15)}</span>
      <div style="display:flex;flex-direction:column;gap:1px;min-width:0;flex:1;">
        <span style="font-size:13.5px;font-weight:500;color:var(--text);overflow-wrap:anywhere;">${esc(r.name)}</span>
        <span style="font-size:12px;color:var(--text-3);">${examKindLabel(r.kind)} · ${fmtExamDate(r.date)}</span>
      </div>
      <span style="font-size:12.5px;font-weight:600;color:${r.n <= 1 ? 'var(--accent-2)' : 'var(--text-2)'};white-space:nowrap;flex-shrink:0;">${daysUntilText(r.date)}</span>
    </div>`).join('<div style="height:1px;background:var(--border);margin:2px 0;"></div>');
  const title = list.length === 1 ? 'Скоро экзамен' : 'Скоро экзамены';
  return `
  <div class="app-toast" style="width:100%;pointer-events:auto;">
    <div class="card" style="border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:14px;overflow:hidden;box-shadow:0 14px 40px rgba(20,16,12,.22);">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="display:flex;color:var(--accent-2);flex-shrink:0;">${icon('bell', 18)}</span>
        <span style="font-family:'Onest';font-weight:600;font-size:14.5px;color:var(--text);letter-spacing:-.01em;flex:1;">${title}</span>
        <button class="mini-icon-btn" style="width:28px;height:28px;" data-action="dismissReminders" title="Закрыть">${icon('x', 14)}</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;">${rows}</div>
      <button class="primary-btn" style="padding:9px 16px;font-size:13px;align-self:flex-end;" data-action="dismissReminders">Понятно</button>
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
// ─── Связь предмета с парой в расписании ────────────────────────────────────
// Привязываемся к названию пары, а не к конкретному занятию: applyOguEvents при
// каждой синхронизации сносит все пары с source:'ogu' и создаёт заново, так что
// ссылка на объект занятия жила бы до первого обновления расписания.
const lessonKey = (s) => String(s == null ? '' : s).trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');

// Уникальные названия пар для выпадающего списка. Считаем только пары, которые
// ещё будут: расписание хранит и прошедшие недели, а привязка к предмету,
// который в этом семестре больше не читается, — заведомо бесполезный выбор.
function scheduleLessonNames() {
  const todayKey = dateKey(new Date());
  const seen = new Map();
  for (const key of Object.keys(state.schedule || {})) {
    if (key < todayKey) continue;
    for (const l of state.schedule[key] || []) {
      const name = (l.name || '').trim();
      if (!name) continue;
      const k = lessonKey(name);
      if (!seen.has(k)) seen.set(k, { name, count: 0 });
      seen.get(k).count++;
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

// Предмет и пара обычно называются одинаково — предлагаем совпадение само,
// но только пока пользователь не тронул выпадающий список руками.
function autoMatchLesson(subjectName) {
  const want = lessonKey(subjectName);
  if (!want) return '';
  const hit = scheduleLessonNames().find(n => lessonKey(n.name) === want);
  return hit ? hit.name : '';
}
function resolveLessonLink(d) {
  if (d.lessonTouched) return d.lessonLink || '';
  return d.lessonLink || autoMatchLesson(d.name);
}

const NEXT_LESSON_HORIZON = 28;

// Ближайшая пара по названию: сегодняшние уже начавшиеся пропускаем.
function nextLessonByName(name) {
  if (!name) return null;
  const want = lessonKey(name);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i <= NEXT_LESSON_HORIZON; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const lessons = (state.schedule || {})[dateKey(d)] || [];
    const matched = lessons.filter(l => lessonKey(l.name) === want);
    if (!matched.length) continue;
    const groups = groupDayLessons(matched);
    for (const g of groups) {
      if (i === 0 && g._start <= nowMin) continue;
      const entry = (g.entries || [])[0] || {};
      return {
        date: d,
        daysAhead: i,
        time: g.time || PAIR_TIMES[g.pair] || '',
        kind: g.kind || '',
        room: entry.room || '',
        teacher: entry.teacher || '',
      };
    }
  }
  return null;
}

function nextLessonText(nl) {
  if (!nl) return '';
  const wd = (nl.date.getDay() + 6) % 7;
  const day = nl.date.getDate() + ' ' + RU_MONTHS[nl.date.getMonth()];
  // WEEKDAYS содержит только Пн–Сб: для воскресенья остаётся одна дата,
  // иначе строка начиналась бы с висящей запятой.
  const weekday = WEEKDAYS[wd] ? WEEKDAYS[wd].toLowerCase() + ', ' : '';
  const when = nl.daysAhead === 0 ? 'сегодня'
    : nl.daysAhead === 1 ? 'завтра'
    : weekday + day;
  return when + (nl.time ? ', ' + nl.time : '');
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
  // У автотемы в кнопке показываем ту палитру, что сейчас реально применена.
  const resolvedId = resolveTheme(state.themeId);
  const currentSwatch = THEME_OPTIONS.find(o => o.id === resolvedId) || THEME_OPTIONS[0];
  const swatchGrad = `linear-gradient(135deg, ${currentSwatch.bg} 50%, ${currentSwatch.accent} 50%)`;

  const themeMenu = state.showThemeMenu ? `
    <div style="position:fixed;inset:0;z-index:40;" data-action="closeThemeMenu"></div>
    <div class="dropdown-in" style="position:absolute;top:44px;right:0;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:6px;display:flex;flex-direction:column;gap:2px;min-width:244px;box-shadow:0 10px 28px rgba(20,16,12,.12);z-index:50;">
      ${THEME_OPTIONS.map((o, i) => {
        const grad = `linear-gradient(135deg, ${o.bg} 50%, ${o.accent} 50%)`;
        const selected = o.id === state.themeId;
        const divider = o.auto && !THEME_OPTIONS[i - 1].auto
          ? `<div style="height:1px;background:var(--border);margin:5px 8px;"></div>` : '';
        return divider + `<button class="theme-row" style="background:${selected ? 'var(--surface-2)' : 'transparent'};" data-action="selectTheme" data-theme-id="${o.id}">
          <span style="width:20px;height:20px;border-radius:50%;flex-shrink:0;border:1px solid var(--border-strong);background:${grad};"></span>
          <span style="flex:1;font-size:13.5px;color:var(--text);font-family:'Golos Text';white-space:nowrap;">${o.label}</span>
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
        <button class="tab-btn ${state.navTab === 'dashboard' ? 'active' : 'idle'}" data-action="goDashboard">Обзор</button>
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

// Сплошная conic-заливка кольца прогресса.
function ringFill(pct, done) {
  const deg = Math.max(0, Math.min(360, pct * 3.6));
  const base = done ? 'var(--good)' : 'var(--accent)';
  return `conic-gradient(${base} ${deg}deg, var(--surface-2) ${deg}deg)`;
}

// «Обзор» — карточный дашборд: прогресс, серия/итоги, тепловая карта активности,
// требуют внимания, ближайшие экзамены, по типам заданий, семестры.
function dashboardViewHtml() {
  const sessions = state.sessions;
  const subjects = sessions.flatMap(s => s.subjects);
  const total = subjects.length;

  const headerBlock = (subtitle) => `
    <div style="max-width:1240px;margin:0 auto;width:100%;padding:34px 32px 20px;">
      <h1 style="font-family:'Onest';font-weight:600;font-size:29px;letter-spacing:-.025em;color:var(--text);margin:0;">Обзор</h1>
      <p style="margin:9px 0 0;font-size:14px;color:var(--text-2);">${subtitle}</p>
    </div>`;

  if (!total) {
    return `
    <div class="${animMainEnter ? 'view-enter' : ''}">
      ${headerBlock('Здесь появится статистика, как только добавишь семестры и предметы.')}
      <div style="max-width:1240px;margin:0 auto;width:100%;padding:8px 32px 56px;">
        <button class="dashed-add" style="padding:44px 22px;min-height:200px;width:100%;" data-action="goSessionsTab">
          <span style="display:flex;" aria-hidden="true">${icon('plus', 26)}</span>
          <span style="font-family:'Onest';font-weight:600;font-size:16px;">Перейти к семестрам</span>
          <span style="font-size:13px;color:var(--text-3);max-width:380px;text-align:center;">Создай семестр и добавь предметы — тут появятся прогресс, тепловая карта активности и ближайшие экзамены.</span>
        </button>
      </div>
    </div>`;
  }

  // Готовность по заданиям + разбивка по типам (закрытый экзамен = всё сдано).
  let doneU = 0, totalU = 0, closedCount = 0;
  const typeAgg = {};
  for (const su of subjects) {
    if (subjectClosed(su)) closedCount++;
    for (const t of su.tasks) {
      const dn = su.examPassed ? t.total : taskDone(t);
      doneU += dn; totalU += t.total;
      const key = t.type || 'custom';
      (typeAgg[key] = typeAgg[key] || { done: 0, total: 0 });
      typeAgg[key].done += dn; typeAgg[key].total += t.total;
    }
  }
  const overallPct = totalU ? Math.round(doneU / totalU * 100) : 0;
  const allClosed = closedCount === total;

  const streak = activityStreak();
  const best = activityBestStreak();
  const week = activitySince(7);
  const month = activitySince(30);

  const upcoming = currentExamList()
    .filter(e => e.date && daysUntil(e.date) !== null && daysUntil(e.date) >= 0)
    .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

  const collator = new Intl.Collator('ru');
  const attn = sessions.flatMap(s => s.subjects.map(su => ({
    name: su.name, sessName: s.name, sessId: s.id, pct: subjectPct(su), closed: subjectClosed(su),
  }))).filter(r => !r.closed).sort((a, b) => a.pct - b.pct || collator.compare(a.name, b.name));

  // ── Плитка-герой: общая готовность ──
  // Всё выровнено по одной сетке: показатель и полоса во всю ширину, ниже
  // четыре равные ячейки. Ничего пропорционального, поэтому блок выглядит
  // одинаково ровно при любом количестве семестров.
  const leftWorks = Math.max(0, totalU - doneU);
  let startedCount = 0, idleCount = 0;
  for (const su of subjects) {
    if (subjectClosed(su)) continue;
    if (subjectPct(su) > 0) startedCount++; else idleCount++;
  }
  const heroCell = (value, label) => `
    <div class="hero-cell">
      <b>${value}</b>
      <span>${label}</span>
    </div>`;

  const progressCard = `
    <div class="card ov-card b-prog">
      <div class="ov-card-head">
        <span class="ov-card-ic" aria-hidden="true">${icon('target', 16)}</span>
        <span class="ov-card-title">Готовность</span>
      </div>
      <div class="hero-main">
        <div class="hero-big">${overallPct}<i>%</i></div>
        <div class="hero-bar"><div class="hero-bar-fill" style="width:${overallPct}%;"></div></div>
        <div class="hero-caption">Сдано ${doneU} из ${totalU} ${plural(totalU, ['работы', 'работ', 'работ'])}</div>
      </div>
      <div class="hero-grid">
        ${heroCell(leftWorks, plural(leftWorks, ['работа осталась', 'работы осталось', 'работ осталось']))}
        ${heroCell(`${closedCount}/${total}`, 'предметов закрыто')}
        ${heroCell(startedCount, 'в работе')}
        ${heroCell(idleCount, 'ещё не начаты')}
      </div>
    </div>`;

  // ── Мини-плитки: серия + итоги ──
  const streakLabel = streak > 0
    ? `${plural(streak, ['день', 'дня', 'дней'])} подряд${best > streak ? ` · рекорд ${best}` : ''}`
    : 'пока нет серии';
  const streakTile = `
    <div class="card ov-mini b-streak">
      <span class="cap"><span class="ic" aria-hidden="true">${icon('flame', 15)}</span>Серия активности</span>
      <span class="n">${streak}</span>
      <span class="l">${streakLabel}</span>
    </div>`;
  const doneTile = `
    <div class="card ov-mini b-done">
      <span class="cap"><span class="ic" aria-hidden="true">${icon('check', 15)}</span>Сделано</span>
      <span class="n">${week}</span>
      <span class="l">за неделю · ${month} за месяц</span>
    </div>`;

  // ── Тепловая карта активности ──
  const heatmap = activityHeatmapHtml('b-heat');

  // ── Требуют внимания ──
  const attnRows = attn.slice(0, 5).map(r => `
    <button class="ov-row" data-action="openSession" data-session-id="${esc(r.sessId)}" aria-label="Открыть ${esc(r.name)}, ${r.pct}%">
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;align-items:baseline;gap:8px;">
          <span style="font-size:13.5px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;">${esc(r.name)}</span>
          <span style="font-size:11px;color:var(--text-3);white-space:nowrap;flex-shrink:0;">${esc(r.sessName)}</span>
          <span style="font-size:12.5px;font-weight:700;color:var(--text-2);font-variant-numeric:tabular-nums;flex-shrink:0;">${r.pct}%</span>
        </div>
        <div style="height:6px;background:var(--surface-2);border-radius:99px;overflow:hidden;">
          <div style="height:100%;border-radius:99px;background:var(--accent);width:${r.pct}%;"></div>
        </div>
      </div>
    </button>`).join('');
  const attnCard = `
    <div class="card ov-card b-attn">
      <div class="ov-card-head"><span class="ov-card-ic" aria-hidden="true">${icon('alert', 16)}</span><span class="ov-card-title">Требуют внимания</span>${attn.length ? `<span class="ov-card-count">${attn.length}</span>` : ''}</div>
      ${attn.length
        ? `<div style="display:flex;flex-direction:column;gap:2px;">${attnRows}</div>`
        : `<div style="display:flex;align-items:center;gap:9px;color:var(--good);font-size:13.5px;font-weight:600;"><span style="display:flex;" aria-hidden="true">${icon('check', 17)}</span>Все предметы закрыты</div>`}
    </div>`;

  // ── Ближайшие экзамены ──
  const examRows = upcoming.slice(0, 5).map((e, i) => {
    const n = daysUntil(e.date);
    const soon = n <= 3;
    return `
    <div style="display:flex;align-items:center;gap:11px;padding:9px 0;${i ? 'border-top:1px solid var(--border);' : ''}">
      <span style="width:30px;height:30px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--accent-soft);color:var(--accent-2);" aria-hidden="true">${icon(e.kind === 'exam' ? 'cap' : 'clipboard', 15)}</span>
      <div style="display:flex;flex-direction:column;gap:1px;min-width:0;flex:1;">
        <span style="font-size:13.5px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(e.name)}</span>
        <span style="font-size:11.5px;color:var(--text-3);">${fmtExamDate(e.date)}</span>
      </div>
      <span style="font-size:12px;font-weight:600;color:${soon ? 'var(--accent-2)' : 'var(--text-2)'};white-space:nowrap;flex-shrink:0;">${daysUntilText(e.date)}</span>
    </div>`;
  }).join('');
  const examCard = `
    <div class="card ov-card b-exams">
      <div class="ov-card-head"><span class="ov-card-ic" aria-hidden="true">${icon('cap', 16)}</span><span class="ov-card-title">Ближайшие экзамены</span>${upcoming.length ? `<span class="ov-card-count">${upcoming.length}</span>` : ''}</div>
      ${upcoming.length
        ? `<div style="display:flex;flex-direction:column;margin:-4px 0 0;">${examRows}</div>`
        : `<span style="font-size:13px;color:var(--text-3);line-height:1.5;">Нет предстоящих с датой${state.examGroup ? ` для группы ${esc(examGroupTitle(state.examGroup))}` : ''}.</span>`}
    </div>`;

  // ── По типам заданий ──
  const activeTypes = TASK_TYPES.filter(tt => typeAgg[tt.type] && typeAgg[tt.type].total > 0);
  const typeRows = activeTypes.map(tt => {
    const { done, total: tot } = typeAgg[tt.type];
    const p = tot ? Math.round(done / tot * 100) : 0;
    const full = p >= 100;
    return `
    <div style="display:flex;flex-direction:column;gap:7px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="display:flex;color:var(--text-3);flex-shrink:0;" aria-hidden="true">${icon(tt.type, 15)}</span>
        <span style="font-size:13.5px;color:var(--text);flex:1;min-width:0;">${tt.label}</span>
        <span style="font-size:12.5px;font-weight:600;color:var(--text-2);font-variant-numeric:tabular-nums;flex-shrink:0;">${done}<span style="color:var(--text-3);font-weight:500;">/${tot}</span></span>
      </div>
      <div style="height:6px;background:var(--surface-2);border-radius:99px;overflow:hidden;">
        <div style="height:100%;border-radius:99px;background:${full ? 'var(--good)' : 'var(--accent)'};width:${p}%;"></div>
      </div>
    </div>`;
  }).join('');
  const typeCard = `
    <div class="card ov-card b-types">
      <div class="ov-card-head"><span class="ov-card-ic" aria-hidden="true">${icon('custom', 16)}</span><span class="ov-card-title">По типам заданий</span><span class="ov-card-count">${activeTypes.length} ${plural(activeTypes.length, ['тип', 'типа', 'типов'])}</span></div>
      <div style="display:flex;flex-direction:column;gap:15px;">${typeRows}</div>
    </div>`;

  // ── Семестры ──
  const sessRows = sessions.map(s => {
    const d = s.subjects.reduce((a, su) => a + subjectUnits(su).done, 0);
    const t = s.subjects.reduce((a, su) => a + su.tasks.reduce((x, tt) => x + tt.total, 0), 0) || 1;
    const p = s.subjects.length ? Math.round(d / t * 100) : 0;
    const done = s.subjects.length > 0 && s.subjects.every(su => subjectClosed(su));
    return `
    <button class="ov-row" data-action="openSession" data-session-id="${esc(s.id)}" aria-label="Открыть семестр ${esc(s.name)}, ${p}%">
      <div style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
        <span style="font-size:13.5px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(s.name)}</span>
        <span style="font-size:11.5px;color:var(--text-3);">${s.subjects.length} ${plural(s.subjects.length, ['предмет', 'предмета', 'предметов'])}</span>
      </div>
      <div style="width:84px;height:6px;background:var(--surface-2);border-radius:99px;overflow:hidden;flex-shrink:0;">
        <div style="height:100%;border-radius:99px;background:${done ? 'var(--good)' : 'var(--accent)'};width:${p}%;"></div>
      </div>
      <span style="font-size:12.5px;font-weight:600;color:var(--text-2);font-variant-numeric:tabular-nums;width:36px;text-align:right;flex-shrink:0;">${p}%</span>
    </button>`;
  }).join('');
  const sessCard = `
    <div class="card ov-card b-sems">
      <div class="ov-card-head"><span class="ov-card-ic" aria-hidden="true">${icon('book', 16)}</span><span class="ov-card-title">Семестры</span><span class="ov-card-count">${sessions.length}</span></div>
      <div style="display:flex;flex-direction:column;gap:2px;">${sessRows}</div>
    </div>`;

  const subtitle = allClosed
    ? 'Все предметы закрыты — семестр можно закрывать.'
    : `${total - closedCount} ${plural(total - closedCount, ['предмет', 'предмета', 'предметов'])} ещё в работе.`;

  return `
  <div class="${animMainEnter ? 'view-enter' : ''}">
    ${headerBlock(subtitle)}
    <div style="max-width:1240px;margin:0 auto;width:100%;padding:0 32px 56px;">
      <div class="bento">
        ${progressCard}
        ${heatmap}
        ${streakTile}
        ${doneTile}
        ${attnCard}
        ${examCard}
        ${typeCard}
        ${sessCard}
      </div>
    </div>
  </div>`;
}

// Серия подряд идущих дней с активностью, считая назад от сегодня.
function activityStreak() {
  const activity = state.activity || {};
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if ((activity[dateKey(d)] || 0) > 0) streak++; else break;
  }
  return streak;
}

// Самая длинная серия подряд идущих активных дней за всё время.
function activityBestStreak() {
  const activity = state.activity || {};
  const days = Object.keys(activity).filter(k => activity[k] > 0).sort();
  if (!days.length) return 0;
  let best = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = Math.round((new Date(days[i]) - new Date(days[i - 1])) / 86400000);
    if (diff === 1) { cur++; best = Math.max(best, cur); }
    else if (diff > 1) cur = 1;
  }
  return best;
}

// Сумма отметок активности за последние N дней (включая сегодня).
function activitySince(days) {
  const activity = state.activity || {};
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let sum = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    sum += activity[dateKey(d)] || 0;
  }
  return sum;
}

// Тепловая карта активности на всю ширину блока: ячейки-квадраты тянутся по ширине,
// подсвечиваются при наведении, тултип с датой и числом отметок.
function activityHeatmapHtml(extraClass) {
  const WEEKS = 18;
  const SHORT_MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const activity = state.activity || {};
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = mondayOf(today);
  start.setDate(start.getDate() - (WEEKS - 1) * 7);

  const level = (c) => {
    if (c <= 0) return 'var(--surface-2)';
    if (c === 1) return 'color-mix(in srgb, var(--accent) 32%, var(--surface-2))';
    if (c <= 3) return 'color-mix(in srgb, var(--accent) 55%, var(--surface-2))';
    if (c <= 5) return 'color-mix(in srgb, var(--accent) 78%, var(--surface-2))';
    return 'var(--accent)';
  };

  let total = 0;
  const streak = activityStreak();

  // Подписи месяцев — по одной колонке-неделе, когда начинается новый месяц.
  let months = '', prevMonth = -1;
  for (let w = 0; w < WEEKS; w++) {
    const wm = new Date(start); wm.setDate(start.getDate() + w * 7);
    const m = wm.getMonth();
    months += `<span>${m !== prevMonth ? SHORT_MONTHS[m] : ''}</span>`;
    prevMonth = m;
  }

  // Ячейки построчно: 7 строк (дни недели) × WEEKS колонок (недели).
  let cells = '';
  for (let d = 0; d < 7; d++) {
    for (let w = 0; w < WEEKS; w++) {
      const cur = new Date(start); cur.setDate(start.getDate() + w * 7 + d);
      if (cur > today) { cells += `<div class="heat-cell" style="background:transparent;"></div>`; continue; }
      const c = activity[dateKey(cur)] || 0;
      total += c;
      const label = `${cur.getDate()} ${SHORT_MONTHS[cur.getMonth()]} — ${c} ${plural(c, ['отметка', 'отметки', 'отметок'])}`;
      cells += `<div class="heat-cell filled" title="${label}" style="background:${level(c)};box-shadow:inset 0 0 0 1px rgba(0,0,0,.04);"></div>`;
    }
  }

  const legend = `
    <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-3);">
      <span>Меньше</span>
      ${[0, 1, 2, 4, 6].map(c => `<div class="heat-legend-cell" style="background:${level(c)};"></div>`).join('')}
      <span>Больше</span>
    </div>`;

  return `
  <div class="card ov-card ov-heat ${extraClass || ''}">
    <div class="ov-card-head" style="flex-wrap:wrap;">
      <span class="ov-card-ic" aria-hidden="true">${icon('grid', 16)}</span>
      <span class="ov-card-title">Активность</span>
      <span style="font-size:12.5px;color:var(--text-3);">${total} ${plural(total, ['отметка', 'отметки', 'отметок'])} за ~4 месяца</span>
      ${streak > 0 ? `<span style="margin-left:auto;font-size:12px;font-weight:600;color:var(--accent-2);background:var(--accent-soft);padding:3px 10px;border-radius:99px;white-space:nowrap;">${streak} ${plural(streak, ['день', 'дня', 'дней'])} подряд</span>` : ''}
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px;">
      <div class="heat-months" style="grid-template-columns:repeat(${WEEKS},1fr);">${months}</div>
      <div class="heat-grid" style="grid-template-columns:repeat(${WEEKS},1fr);">${cells}</div>
    </div>
    ${legend}
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

    const MAX_DOTS = 16;
    const dotColor = (su) => subjectClosed(su) ? 'var(--good)' : (subjectPct(su) > 0 ? 'var(--accent)' : 'var(--border-strong)');
    const dotsHtml = count
      ? `<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;min-height:8px;">
          ${sess.subjects.slice(0, MAX_DOTS).map(su => `<span style="width:8px;height:8px;border-radius:50%;background:${dotColor(su)};" title="${esc(su.name)}"></span>`).join('')}
          ${count > MAX_DOTS ? `<span style="font-size:10.5px;color:var(--text-3);font-weight:600;margin-left:2px;">+${count - MAX_DOTS}</span>` : ''}
        </div>`
      : `<div style="min-height:8px;font-size:12px;color:var(--text-3);">Пока нет предметов</div>`;

    const ring = `
      <div style="width:66px;height:66px;border-radius:50%;flex-shrink:0;background:${ringFill(pct, isDone)};display:flex;align-items:center;justify-content:center;">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--surface);display:flex;align-items:center;justify-content:center;">
          <span style="display:flex;align-items:baseline;gap:1px;">
            <span style="font-family:'Golos Text';font-weight:700;font-size:16px;color:var(--text);font-variant-numeric:tabular-nums;line-height:1;">${pct}</span>
            <span style="font-size:9px;font-weight:600;color:var(--text-3);">%</span>
          </span>
        </div>
      </div>`;

    return `
    <div class="card session-card" data-action="openSession" data-session-id="${esc(sess.id)}" role="button" tabindex="0">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        ${badge}
        <div style="display:flex;align-items:center;gap:2px;flex-shrink:0;">
          <button class="mini-icon-btn" style="width:28px;height:28px;" data-action="openEditSessionModal" data-session-id="${esc(sess.id)}" title="Редактировать семестр">${icon('edit', 14)}</button>
          <button class="mini-icon-btn" style="width:28px;height:28px;" data-action="deleteSession" data-session-id="${esc(sess.id)}" title="Удалить семестр">${icon('trash', 14)}</button>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;">
        <div style="display:flex;flex-direction:column;gap:5px;min-width:0;">
          <span style="font-family:'Onest';font-weight:600;font-size:20px;letter-spacing:-.02em;color:var(--text);line-height:1.15;overflow-wrap:anywhere;">${esc(sess.name)}</span>
          <span style="font-size:12.5px;color:var(--text-3);">${esc(sess.period)}</span>
        </div>
        ${ring}
      </div>
      ${dotsHtml}
      <div style="display:flex;flex-direction:column;gap:11px;margin-top:auto;">
        <div style="height:1px;background:var(--border);"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <span style="font-size:12.5px;color:var(--text-2);">${statsText}</span>
          <span class="session-open" style="display:flex;align-items:center;gap:3px;font-size:12.5px;font-weight:600;color:var(--text-3);white-space:nowrap;transition:color .15s;">Открыть${icon('chevron-right', 15)}</span>
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
    <div style="max-width:1240px;margin:0 auto;width:100%;padding:34px 32px 22px;display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap;">
      <div style="min-width:0;">
        <h1 style="font-family:'Onest';font-weight:600;font-size:29px;letter-spacing:-.025em;color:var(--text);margin:0;">Сессии</h1>
        <p style="margin:9px 0 0;font-size:14px;color:var(--text-2);">${subtitle}</p>
      </div>
      <div style="display:flex;gap:9px;flex-shrink:0;">
        <button class="ghost-btn" data-action="importCsv" title="Загрузить предметы и экзамены из файла CSV" style="height:36px;padding:0 14px;font-family:'Onest';display:flex;align-items:center;gap:7px;">${icon('upload', 15)}Импорт CSV</button>
        <button class="ghost-btn" data-action="exportCsv" title="Выгрузить предметы и экзамены в файл CSV" style="height:36px;padding:0 14px;font-family:'Onest';display:flex;align-items:center;gap:7px;">${icon('download', 15)}Экспорт CSV</button>
      </div>
    </div>
    ${body}
  </div>`;
}

function examPanelHtml() {
  if (!examGroups().length) return '';
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
        <span style="font-size:12px;color:var(--text-3);">${examKindLabel(e.kind)}${e._user ? ' · добавлено вами' : ''}</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0;">
        ${dateBlock}
      </div>
      <button class="mini-icon-btn exam-del" data-action="deleteExam" data-exam-id="${esc(e.id)}" title="Удалить из моего списка" style="width:28px;height:28px;flex-shrink:0;">${icon('trash', 13)}</button>
    </div>`;
  }).join('');

  const own = state.userGroups || [];
  const groupOption = (g) => `<option value="${esc(g.id)}" ${g.id === state.examGroup ? 'selected' : ''}>${esc(g.title)}</option>`;
  const groupSelect = `
    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
      <div style="position:relative;display:flex;">
        <select class="select-input" data-input="examGroupSelect" style="padding:7px 32px 7px 12px;font-size:13px;min-width:112px;">
          ${DEFAULT_EXAM_GROUPS.map(groupOption).join('')}
          ${own.length ? `<optgroup label="Свои группы">${own.map(groupOption).join('')}</optgroup>` : ''}
        </select>
        <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text-3);display:flex;">${icon('chevron-down', 14)}</span>
      </div>
      <button class="mini-icon-btn" data-action="openGroupsModal" title="Свои группы" style="width:30px;height:30px;flex-shrink:0;">${icon('users', 15)}</button>
    </div>`;

  const hiddenCount = (EXAM_SCHEDULES[state.examGroup] || []).filter(e => (state.hiddenExams || []).includes(e.id)).length;
  const restoreBtn = hiddenCount
    ? `<button class="link-btn" data-action="restoreExams" title="Вернуть удалённые пункты из общего списка" style="flex-shrink:0;">${icon('refresh', 14)}Вернуть скрытые · ${hiddenCount}</button>`
    : '';
  const footer = `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:${items.length ? 12 : 8}px;">
    <button class="dashed-inline" data-action="openExamModal">${icon('plus', 15)}Добавить экзамен или зачёт</button>
    ${restoreBtn}
  </div>`;
  const bodyContent = (items.length
    ? rows
    : `<div style="padding:4px 2px 2px;font-size:13px;color:var(--text-3);">Для группы ${esc(examGroupTitle(state.examGroup))} список пока пуст.</div>`) + footer;

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
      ${open ? `<div class="${animExamEnter ? 'exam-body-anim' : ''}" style="padding:0 22px 14px;">${bodyContent}</div>` : ''}
    </div>
  </div>`;
}

// Порядок и фильтр — только для показа, исходный массив не трогаем: «Как
// добавлял» должен возвращать ровно ту последовательность, что была.
function arrangeSubjects(all) {
  let list = all.slice();
  if (state.hideClosed) list = list.filter(s => !subjectClosed(s));
  const sort = state.subjectSort;
  if (sort === 'progress') {
    list.sort((a, b) => subjectPct(a) - subjectPct(b) || a.name.localeCompare(b.name, 'ru'));
  } else if (sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  } else if (sort === 'lesson') {
    // Предметы без привязки и без будущих пар уходят в конец.
    const rank = (s) => {
      const nl = s.lessonLink ? nextLessonByName(s.lessonLink) : null;
      return nl ? nl.daysAhead : Infinity;
    };
    list.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'ru'));
  }
  return list;
}

function subjectsViewHtml() {
  const current = state.sessions.find(s => s.id === state.currentSessionId);
  const allSubjects = (current ? current.subjects : []);
  const subjects = arrangeSubjects(allSubjects);
  const hiddenByFilter = allSubjects.length - subjects.length;
  // Ручной порядок можно менять только когда он и показывается: при сортировке
  // по прогрессу или названию перетаскивание ничего бы не изменило на экране.
  const canReorder = state.subjectSort === 'manual' && allSubjects.length > 1;

  const subjectCards = subjects.map(s => {
    const L = AUTO_TYPES.find(a => a.value === (s.autoType || 'auto')) || AUTO_TYPES[0];
    const linkedExam = examById(s.examLink);
    const examChip = linkedExam
      ? `<div style="display:inline-flex;align-items:center;gap:5px;margin-top:3px;padding:3px 9px 3px 7px;border-radius:99px;background:var(--accent-soft);color:var(--accent-2);font-size:11px;font-weight:600;align-self:flex-start;white-space:nowrap;max-width:100%;">${icon(linkedExam.kind === 'exam' ? 'cap' : 'clipboard', 12)}${examKindLabel(linkedExam.kind)}${linkedExam.date ? ' · ' + fmtExamDate(linkedExam.date) : ''}</div>`
      : '';
    const nextLesson = s.lessonLink ? nextLessonByName(s.lessonLink) : null;
    const soonLesson = nextLesson && nextLesson.daysAhead <= 1;
    const lessonChip = nextLesson
      ? `<div title="${esc(s.lessonLink)}${nextLesson.room ? ' · ' + esc(nextLesson.room) : ''}" style="display:inline-flex;align-items:center;gap:5px;margin-top:3px;padding:3px 9px 3px 7px;border-radius:99px;background:${soonLesson ? 'var(--good-soft)' : 'var(--surface-2)'};color:${soonLesson ? 'var(--good)' : 'var(--text-2)'};font-size:11px;font-weight:600;align-self:flex-start;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis;">${icon('clock', 12)}${esc(nextLessonText(nextLesson))}${nextLesson.room ? ' · ' + esc(nextLesson.room) : ''}</div>`
      : '';
    const examPassed = !!s.examPassed;
    const done = s.tasks.reduce((a, t) => a + taskDone(t), 0);
    const total = s.tasks.reduce((a, t) => a + t.total, 0) || 1;
    const readyCount = s.tasks.reduce((a, t) => a + taskReady(t), 0);
    const pct = subjectPct(s);
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
        : (isClose ? 'До ' + L.name + 'а: ' : 'Осталось сдать: ') + remaining + ' ' + plural(remaining, ['работа', 'работы', 'работ'])
          + (readyCount ? ', из них готово ' + readyCount : '');

    const badge = examPassed
      ? `<div style="display:flex;align-items:center;gap:5px;padding:5px 10px 5px 8px;border-radius:99px;background:var(--good-soft);color:var(--good);font-size:11.5px;font-weight:600;white-space:nowrap;flex-shrink:0;">${icon('cap', 13)}Экзамен сдан</div>`
      : isAuto
      ? `<div style="display:flex;align-items:center;gap:5px;padding:5px 10px 5px 8px;border-radius:99px;background:var(--good-soft);color:var(--good);font-size:11.5px;font-weight:600;white-space:nowrap;flex-shrink:0;">${icon('check', 13)}${L.Name}</div>`
      : isClose
        ? `<div style="display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:99px;background:var(--accent-soft);color:var(--accent-2);font-size:11.5px;font-weight:600;white-space:nowrap;flex-shrink:0;"><span style="width:6px;height:6px;border-radius:50%;background:var(--accent);"></span>Почти ${L.name}</div>`
        : `<div style="display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:99px;background:var(--surface-2);color:var(--text-2);font-size:11.5px;font-weight:600;white-space:nowrap;flex-shrink:0;"><span style="width:6px;height:6px;border-radius:50%;background:var(--text-3);"></span>Нужно доделать</div>`;

    const tasksHtml = s.tasks.map(t => {
      const segs = t.completed.map((v, i) => {
        const justToggled = lastToggledSegKey === (s.id + '|' + t.id + '|' + i);
        const bg = segIsDone(v) ? segOn : segIsReady(v) ? 'var(--warn)' : 'var(--seg-empty)';
        const hint = segIsDone(v) ? 'Выполнено → снять отметку' : segIsReady(v) ? 'Готово → выполнено' : 'Не сделано → готово';
        return `<button class="seg${justToggled ? ' seg-pop' : ''}" style="background:${bg};" data-action="toggleSegment" data-subject-id="${esc(s.id)}" data-task-id="${esc(t.id)}" data-index="${i}" title="${hint}"></button>`;
      }).join('');
      return `
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="display:flex;color:var(--text-3);flex-shrink:0;">${icon(t.type, 15)}</span>
            <span style="font-size:13.5px;color:var(--text-2);flex:1;min-width:0;">${esc(t.label)}</span>
            ${taskReady(t) ? `<span title="Готово, осталось сдать" style="display:flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;color:var(--warn);flex-shrink:0;">${icon('check', 12)}${taskReady(t)}</span>` : ''}
            <span style="font-family:'Golos Text';font-variant-numeric:tabular-nums;font-size:13px;color:var(--text);font-weight:600;flex-shrink:0;">${taskDone(t)}/${t.total}</span>
          </div>
          <div style="display:flex;gap:4px;">${segs}</div>
        </div>`;
    }).join('');

    return `
    <div class="card subject-card" data-subject-id="${esc(s.id)}" style="padding:var(--card-pad);display:flex;flex-direction:column;gap:var(--card-gap);position:relative;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
        <div style="display:flex;flex-direction:column;gap:4px;min-width:0;flex:1;">
          <div style="font-family:'Onest';font-weight:600;font-size:18px;letter-spacing:-.015em;color:var(--text);line-height:1.2;overflow-wrap:anywhere;">${esc(s.name)}</div>
          <div style="font-size:12.5px;color:var(--text-3);overflow-wrap:anywhere;">${esc(s.meta)}</div>
          ${examChip}
          ${lessonChip}
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
            ${canReorder ? `<button class="mini-icon-btn subj-grip" draggable="true" data-subject-id="${esc(s.id)}" title="Перетащить, чтобы изменить порядок" style="width:30px;height:30px;cursor:grab;">${icon('grip', 15)}</button>` : ''}
            <button class="mini-icon-btn" style="width:30px;height:30px;" data-action="openEditModal" data-subject-id="${esc(s.id)}" title="Редактировать предмет">${icon('edit', 15)}</button>
            <button class="mini-icon-btn" style="width:30px;height:30px;${examPassed ? 'background:var(--good-soft);color:var(--good);' : ''}" data-action="toggleExam" data-subject-id="${esc(s.id)}" title="${examPassed ? 'Отменить: экзамен не сдан' : 'Закрыть предмет: экзамен сдан'}">${icon('cap', 16)}</button>
            <button class="mini-icon-btn" style="width:30px;height:30px;" data-action="deleteSubject" data-subject-id="${esc(s.id)}" title="Удалить предмет">${icon('trash', 15)}</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  const autos = allSubjects.filter(s => subjectClosed(s)).length;
  const summaryText = allSubjects.length
    ? allSubjects.length + ' ' + plural(allSubjects.length, ['предмет', 'предмета', 'предметов']) + ' · ' + autos + ' ' + plural(autos, ['закрыт', 'закрыто', 'закрыто'])
      + (hiddenByFilter ? ' · скрыто ' + hiddenByFilter : '')
    : 'Пока нет предметов';

  const sortControls = allSubjects.length ? `
    <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;justify-content:flex-end;">
      <div style="position:relative;display:flex;">
        <select class="select-input" data-input="subjectSort" style="padding:7px 32px 7px 12px;font-size:13px;">
          ${SUBJECT_SORTS.map(o => `<option value="${o.id}" ${o.id === state.subjectSort ? 'selected' : ''}>${o.label}</option>`).join('')}
        </select>
        <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text-3);display:flex;">${icon('chevron-down', 14)}</span>
      </div>
      <button class="ghost-btn" data-action="toggleHideClosed" title="Скрыть закрытые предметы" style="height:34px;padding:0 12px;font-size:13px;display:flex;align-items:center;gap:6px;${state.hideClosed ? 'background:var(--accent-soft);color:var(--accent-2);border-color:transparent;' : ''}">${icon(state.hideClosed ? 'check' : 'target', 14)}Только незакрытые</button>
    </div>` : '';

  return `
  <div class="${animMainEnter ? 'view-enter' : ''}">
    <div style="max-width:1240px;margin:0 auto;width:100%;padding:26px 32px 22px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;">
      <div>
        <button class="link-btn" style="margin-bottom:10px;" data-action="goToSessions">${icon('arrow-left', 16)}Сессии</button>
        <h1 style="font-family:'Onest';font-weight:600;font-size:29px;letter-spacing:-.025em;color:var(--text);margin:0;">${esc(current ? current.name : '')}</h1>
        <p style="margin:9px 0 0;font-size:14px;color:var(--text-2);">${esc(current ? current.period : '')} — ${summaryText}</p>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:12px;">
        ${sortControls}
        <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">
          <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--text-2);"><span style="width:8px;height:8px;border-radius:50%;background:var(--good);"></span>Выполнено</div>
          <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--text-2);"><span style="width:8px;height:8px;border-radius:50%;background:var(--warn);"></span>Готово, не сдано</div>
          <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--text-2);"><span style="width:8px;height:8px;border-radius:50%;background:var(--accent);"></span>Почти готово</div>
          <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--text-2);"><span style="width:8px;height:8px;border-radius:50%;background:var(--text-3);"></span>Нужно доделать</div>
        </div>
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
        ${examGroups().length && state.examGroup ? `
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
        ${(() => {
          const names = scheduleLessonNames();
          if (!names.length) {
            return `
            <div style="display:flex;flex-direction:column;gap:6px;">
              <span style="font-size:12.5px;color:var(--text-2);font-weight:500;">Пара в расписании</span>
              <span style="font-size:12.5px;line-height:1.5;color:var(--text-3);">Расписание пустое — привязывать не к чему. Загрузи его на вкладке «Расписание».</span>
            </div>`;
          }
          const linked = resolveLessonLink(d);
          const known = names.some(n => lessonKey(n.name) === lessonKey(linked));
          const nl = linked ? nextLessonByName(linked) : null;
          return `
          <div style="display:flex;flex-direction:column;gap:6px;">
            <span style="font-size:12.5px;color:var(--text-2);font-weight:500;">Пара в расписании</span>
            <div style="position:relative;display:flex;">
              <select class="select-input" data-input="lessonLink">
                <option value="" ${!linked ? 'selected' : ''}>— Не привязано —</option>
                ${names.map(n => `<option value="${esc(n.name)}" ${lessonKey(n.name) === lessonKey(linked) ? 'selected' : ''}>${esc(n.name)} · впереди ${n.count} ${plural(n.count, ['пара', 'пары', 'пар'])}</option>`).join('')}
                ${linked && !known ? `<option value="${esc(linked)}" selected>${esc(linked)} · нет в расписании</option>` : ''}
              </select>
              <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text-3);display:flex;">${icon('chevron-down', 15)}</span>
            </div>
            ${linked ? `<span style="font-size:12px;color:var(--text-3);">${nl ? 'Ближайшая пара — ' + esc(nextLessonText(nl)) : 'В ближайшие 4 недели пар нет'}</span>` : ''}
          </div>`;
        })()}
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
  const isEdit = !!state.editSessionId;
  return `
  <div class="modal-overlay ${animModalEnter ? 'anim-in' : ''}">
    <div class="card" style="border-radius:18px;padding:26px;width:420px;max-width:100%;display:flex;flex-direction:column;gap:22px;" data-stop="1">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h2 style="margin:0;font-family:'Onest';font-weight:600;font-size:19px;color:var(--text);letter-spacing:-.01em;">${isEdit ? 'Редактировать семестр' : 'Новая сессия'}</h2>
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
        <button class="primary-btn" data-action="submitSession" ${submitDisabled ? 'disabled' : ''} style="opacity:${submitDisabled ? 0.5 : 1};">${isEdit ? 'Сохранить' : 'Создать сессию'}</button>
      </div>
    </div>
  </div>`;
}

function examModalHtml() {
  const d = state.examDraft;
  const submitDisabled = d.name.trim().length === 0;
  const kindOpts = [
    { value: 'exam', label: 'Экзамен' },
    { value: 'zachet', label: 'Зачёт' },
  ].map(o => `<button class="tab-btn ${d.kind === o.value ? 'active' : 'idle'}" style="flex:1;" data-action="setExamKind" data-kind="${o.value}">${o.label}</button>`).join('');
  return `
  <div class="modal-overlay ${animModalEnter ? 'anim-in' : ''}">
    <div class="card" style="border-radius:18px;padding:26px;width:420px;max-width:100%;display:flex;flex-direction:column;gap:20px;" data-stop="1">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h2 style="margin:0;font-family:'Onest';font-weight:600;font-size:19px;color:var(--text);letter-spacing:-.01em;">Экзамен или зачёт</h2>
        <button class="close-btn" data-action="closeExamModal">${icon('x', 16)}</button>
      </div>
      <p style="margin:-6px 0 0;font-size:12.5px;color:var(--text-3);line-height:1.5;">Добавится только в твой список группы ${esc(examGroupTitle(state.examGroup))}. Другие пользователи это не увидят.</p>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12.5px;color:var(--text-2);font-weight:500;">Название</span>
          <input type="text" id="exam-name" class="text-input" placeholder="Например, Базы данных" value="${esc(d.name)}" data-input="examDraftName" />
        </label>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12.5px;color:var(--text-2);font-weight:500;">Тип</span>
          <div style="display:flex;gap:3px;background:var(--surface-2);padding:3px;border-radius:11px;">${kindOpts}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <span style="font-size:12.5px;color:var(--text-2);font-weight:500;">Дата</span>
          <input type="date" id="exam-date" class="text-input" value="${esc(d.date)}" data-input="examDraftDate" ${d.dateUnknown ? 'disabled' : ''} style="${d.dateUnknown ? 'opacity:.45;' : ''}" />
          <button data-action="toggleExamDateUnknown" style="display:inline-flex;align-items:center;gap:8px;background:transparent;border:none;cursor:pointer;padding:2px 0;font-family:inherit;font-size:12.5px;color:var(--text-2);align-self:flex-start;">
            <span style="width:18px;height:18px;border-radius:5px;border:1.5px solid ${d.dateUnknown ? 'var(--accent)' : 'var(--border)'};background:${d.dateUnknown ? 'var(--accent)' : 'transparent'};display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;">${d.dateUnknown ? icon('check', 12) : ''}</span>
            Дата пока неизвестна
          </button>
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px;">
        <button class="ghost-btn" data-action="closeExamModal">Отмена</button>
        <button class="primary-btn" data-action="submitExam" ${submitDisabled ? 'disabled' : ''} style="opacity:${submitDisabled ? 0.5 : 1};">Добавить</button>
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

function groupsModalHtml() {
  const own = state.userGroups || [];
  const draft = state.groupDraft || '';
  const taken = examGroups().some(g => csvNorm(g.title) === csvNorm(draft));
  const canAdd = draft.trim().length > 0 && !taken;

  const rows = own.length ? own.map((g, i) => {
    const count = groupExamList(g.id).length;
    return `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 2px;${i ? 'border-top:1px solid var(--border);' : ''}">
      <span style="width:32px;height:32px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--accent-soft);color:var(--accent-2);">${icon('users', 15)}</span>
      <div style="display:flex;flex-direction:column;gap:1px;min-width:0;flex:1;">
        <span style="font-size:14px;font-weight:500;color:var(--text);overflow-wrap:anywhere;">${esc(g.title)}</span>
        <span style="font-size:12px;color:var(--text-3);">${count} ${plural(count, ['запись', 'записи', 'записей'])}</span>
      </div>
      <button class="mini-icon-btn" data-action="deleteGroup" data-group-id="${esc(g.id)}" title="Удалить группу" style="width:28px;height:28px;flex-shrink:0;">${icon('trash', 13)}</button>
    </div>`;
  }).join('') : `<p style="margin:0;font-size:13px;line-height:1.5;color:var(--text-3);">Своих групп пока нет. Встроенные — ${DEFAULT_EXAM_GROUPS.map(g => g.title).join(', ')} — остаются на месте.</p>`;

  return `
  <div class="modal-overlay ${animModalEnter ? 'anim-in' : ''}" data-action="closeGroupsModal">
    <div class="card scroll-y" style="border-radius:18px;padding:26px;width:420px;max-width:100%;max-height:86vh;display:flex;flex-direction:column;gap:20px;" data-stop="1">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <h2 style="margin:0;font-family:'Onest';font-weight:600;font-size:19px;color:var(--text);letter-spacing:-.01em;">Свои группы</h2>
        <button class="close-btn" data-action="closeGroupsModal">${icon('x', 16)}</button>
      </div>
      <div style="display:flex;flex-direction:column;">${rows}</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <label for="group-title" style="font-size:12px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:var(--text-3);">Новая группа</label>
        <div style="display:flex;gap:9px;">
          <input type="text" id="group-title" class="text-input" placeholder="Например, 41АБ" value="${esc(draft)}" data-input="groupDraft" style="flex:1;" />
          <button class="primary-btn" data-action="submitGroup" ${canAdd ? '' : 'disabled'} style="flex-shrink:0;opacity:${canAdd ? 1 : 0.5};">Добавить</button>
        </div>
        ${taken ? `<span style="font-size:12px;color:var(--text-3);">Группа «${esc(draft.trim())}» уже есть в списке.</span>` : ''}
      </div>
      <p style="margin:0;font-size:12.5px;line-height:1.5;color:var(--text-3);">У своих групп нет готового расписания сессии — экзамены в них добавляешь сам или получаешь через импорт CSV.</p>
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

// ─── Обмен предметами и экзаменами через CSV ────────────────────────────────
// Один файл на всё: первая колонка задаёт тип строки, поэтому готовый список
// можно просто переслать однокурснику, а не набивать его руками.
const CSV_SEP = ';';
const CSV_TASK_COLUMNS = [
  { type: 'flask', header: 'Лабораторные' },
  { type: 'pen', header: 'Практические' },
  { type: 'folder', header: 'Проект' },
  { type: 'book', header: 'Курсовая' },
  { type: 'custom', header: 'Другое' },
];
const CSV_HEADERS = ['Тип', 'Семестр/Группа', 'Название', 'Преподаватель', 'Закрытие', ...CSV_TASK_COLUMNS.map(c => c.header), 'Дата'];

// «Зачёт» и «зачет» должны совпадать, поэтому ё сводим к е.
const csvNorm = (s) => String(s == null ? '' : s).trim().toLowerCase().replace(/ё/g, 'е');

function csvCell(v) {
  const s = String(v == null ? '' : v);
  return /["\n\r;,]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const csvRow = (cells) => cells.map(csvCell).join(CSV_SEP);

function csvTaskCell(tasks, type) {
  const list = (tasks || []).filter(t => t.type === type);
  if (!list.length) return '';
  if (type === 'custom') return list.map(t => `${t.label || 'Задание'} ${taskDone(t)}/${t.total}`).join(' | ');
  const done = list.reduce((a, t) => a + taskDone(t), 0);
  const total = list.reduce((a, t) => a + t.total, 0);
  return `${done}/${total}`;
}

function buildCsv() {
  const lines = [csvRow(CSV_HEADERS)];
  for (const sess of state.sessions) {
    for (const sub of sess.subjects || []) {
      const auto = AUTO_TYPES.find(a => a.value === (sub.autoType || 'auto')) || AUTO_TYPES[0];
      lines.push(csvRow([
        'предмет', sess.name, sub.name,
        sub.meta && sub.meta !== 'Преподаватель' ? sub.meta : '',
        auto.Name,
        ...CSV_TASK_COLUMNS.map(c => csvTaskCell(sub.tasks, c.type)),
        '',
      ]));
    }
  }
  for (const g of examGroups()) {
    for (const e of groupExamList(g.id)) {
      lines.push(csvRow([
        e.kind === 'zachet' ? 'зачёт' : 'экзамен', g.title, e.name, '', '',
        '', '', '', '', '', e.date || '',
      ]));
    }
  }
  // BOM — иначе Excel открывает кириллицу кракозябрами.
  return '﻿' + lines.join('\r\n') + '\r\n';
}

// Разделитель зависит от того, в какой локали файл сохраняли, — смотрим шапку.
function csvDetectSep(src) {
  const head = src.split(/\r?\n/)[0] || '';
  let semi = 0, comma = 0, quoted = false;
  for (const ch of head) {
    if (ch === '"') quoted = !quoted;
    else if (quoted) continue;
    else if (ch === ';') semi++;
    else if (ch === ',') comma++;
  }
  return comma > semi ? ',' : ';';
}

function parseCsvText(text) {
  const src = String(text || '').replace(/^﻿/, '');
  const sep = csvDetectSep(src);
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch !== '"') { cell += ch; continue; }
      if (src[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === sep) { row.push(cell); cell = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

// Принимаем и «3/8», и просто «8» — во втором случае это всего заданий.
function parseCsvCount(cell) {
  const pair = String(cell).match(/(\d+)\s*\/\s*(\d+)/);
  if (pair) return { done: Number(pair[1]), total: Number(pair[2]) };
  const one = String(cell).match(/(\d+)/);
  return one ? { done: 0, total: Number(one[1]) } : null;
}

function parseCsvDate(cell) {
  const s = String(cell || '').trim();
  if (!s) return null;
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const ru = s.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/);
  if (ru) return `${ru[3]}-${ru[2].padStart(2, '0')}-${ru[1].padStart(2, '0')}`;
  return null;
}

function parseCsvAuto(cell) {
  const v = csvNorm(cell);
  if (!v) return 'auto';
  const found = AUTO_TYPES.find(a => csvNorm(a.Name) === v || csvNorm(a.value) === v || csvNorm(a.label) === v);
  return found ? found.value : 'auto';
}

// Разбирает файл и сразу считает, что реально добавится, — итог показываем
// в окне подтверждения, чтобы импорт не был прыжком в неизвестность.
function analyzeCsv(text, fileName) {
  const empty = { fileName, sessions: [], exams: [], errors: [], stats: null };
  const rows = parseCsvText(text);
  if (!rows.length) return { ...empty, errors: ['Файл пустой.'] };

  const header = rows[0].map(csvNorm);
  const idx = {};
  CSV_HEADERS.forEach(h => { idx[h] = header.indexOf(csvNorm(h)); });
  if (idx['Тип'] === -1 || idx['Название'] === -1) {
    return { ...empty, errors: ['Не найдена строка заголовков: нужны колонки «Тип» и «Название». Проще всего взять за образец файл из «Экспорт CSV».'] };
  }
  const at = (row, h) => (idx[h] === -1 ? '' : String(row[idx[h]] || '').trim());

  const errors = [];
  const sessionsMap = new Map();
  const examsMap = new Map();
  const newGroups = [];
  const stats = { newSessions: 0, newSubjects: 0, skippedSubjects: 0, newGroups: 0, newExams: 0, skippedExams: 0 };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 1;
    const kind = csvNorm(at(row, 'Тип'));
    const name = at(row, 'Название');
    const owner = at(row, 'Семестр/Группа');
    if (!name) { errors.push(`Строка ${line}: пустое название — пропущена.`); continue; }

    if (kind === 'предмет') {
      if (!owner) { errors.push(`Строка ${line}: у предмета «${name}» не указан семестр — пропущен.`); continue; }
      const tasks = [];
      for (const c of CSV_TASK_COLUMNS) {
        const raw = at(row, c.header);
        if (!raw) continue;
        const parts = c.type === 'custom' ? raw.split('|') : [raw];
        for (const part of parts) {
          const cnt = parseCsvCount(part);
          if (!cnt || !cnt.total) continue;
          const label = c.type === 'custom'
            ? (part.replace(/\d+\s*\/\s*\d+/g, '').replace(/\d+/g, '').trim() || 'Задание')
            : ((TASK_TYPES.find(x => x.type === c.type) || {}).label || c.header);
          tasks.push({ type: c.type, label, total: cnt.total });
        }
      }
      if (!tasks.length) { errors.push(`Строка ${line}: у предмета «${name}» не указано ни одного задания — пропущен.`); continue; }

      const key = csvNorm(owner);
      if (!sessionsMap.has(key)) {
        const existing = state.sessions.find(s => csvNorm(s.name) === key);
        sessionsMap.set(key, { name: existing ? existing.name : owner, isNew: !existing, subjects: [] });
        if (!existing) stats.newSessions++;
      }
      const bucket = sessionsMap.get(key);
      const inApp = state.sessions.find(s => csvNorm(s.name) === key);
      const dup = (inApp && (inApp.subjects || []).some(s => csvNorm(s.name) === csvNorm(name)))
        || bucket.subjects.some(s => csvNorm(s.name) === csvNorm(name));
      if (dup) { stats.skippedSubjects++; continue; }
      bucket.subjects.push({ name, teacher: at(row, 'Преподаватель'), autoType: parseCsvAuto(at(row, 'Закрытие')), tasks });
      stats.newSubjects++;
      continue;
    }

    if (kind === 'экзамен' || kind === 'зачет') {
      if (!owner) { errors.push(`Строка ${line}: у «${name}» не указана группа — пропущена.`); continue; }
      // Незнакомую группу не отвергаем, а заводим свою: иначе файлом нельзя
      // поделиться ни с кем за пределами встроенного списка.
      let g = examGroups().find(x => csvNorm(x.title) === csvNorm(owner) || csvNorm(x.id) === csvNorm(owner));
      if (!g) {
        const pending = newGroups.find(x => csvNorm(x.title) === csvNorm(owner));
        if (pending) { g = pending; }
        else { g = { id: uid('ug'), title: owner, _new: true }; newGroups.push(g); stats.newGroups++; }
      }
      const ek = kind === 'зачет' ? 'zachet' : 'exam';
      const rawDate = at(row, 'Дата');
      const date = parseCsvDate(rawDate);
      if (rawDate && !date) errors.push(`Строка ${line}: дата «${rawDate}» не распознана — «${name}» добавится без даты.`);
      if (!examsMap.has(g.id)) examsMap.set(g.id, { groupId: g.id, title: g.title, items: [] });
      const bucket = examsMap.get(g.id);
      const dup = groupExamList(g.id).some(e => csvNorm(e.name) === csvNorm(name) && e.kind === ek)
        || bucket.items.some(e => csvNorm(e.name) === csvNorm(name) && e.kind === ek);
      if (dup) { stats.skippedExams++; continue; }
      bucket.items.push({ name, kind: ek, date });
      stats.newExams++;
      continue;
    }

    errors.push(`Строка ${line}: неизвестный тип «${at(row, 'Тип') || '—'}» — ожидается «предмет», «экзамен» или «зачёт».`);
  }

  return { fileName, sessions: [...sessionsMap.values()], exams: [...examsMap.values()], newGroups, errors, stats };
}

function applyCsvPreview(p) {
  for (const s of p.sessions) {
    if (!s.subjects.length) continue;
    let sess = state.sessions.find(x => csvNorm(x.name) === csvNorm(s.name));
    if (!sess) {
      sess = { id: uid('sess'), name: s.name, period: 'Без периода', subjects: [] };
      state.sessions.push(sess);
    }
    for (const sub of s.subjects) {
      sess.subjects.push({
        id: uid('subj'),
        name: sub.name,
        meta: sub.teacher || 'Преподаватель',
        autoType: sub.autoType,
        examLink: null,
        // Привязку к паре в файле не передаём — она зависит от расписания
        // получателя, поэтому подбираем по названию уже на этой стороне.
        lessonLink: autoMatchLesson(sub.name) || null,
        tasks: sub.tasks.map(t => ({ id: uid('t'), type: t.type, label: t.label, total: t.total, completed: mk(t.total, 0) })),
      });
    }
  }
  for (const ng of p.newGroups || []) {
    if (!(state.userGroups || []).some(x => csvNorm(x.title) === csvNorm(ng.title))) {
      state.userGroups = [...(state.userGroups || []), { id: ng.id, title: ng.title }];
    }
  }
  for (const g of p.exams) {
    if (!g.items.length) continue;
    if (!state.userExams[g.groupId]) state.userExams[g.groupId] = [];
    state.userExams[g.groupId] = [
      ...state.userExams[g.groupId],
      ...g.items.map(e => ({ id: uid('uex'), name: e.name, kind: e.kind, date: e.date })),
    ];
  }
}

let noticeTimer = null;
function showNotice(message, tone) {
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { if (state.notice) setUI({ notice: null }); }, 5000);
  setUI({ notice: { message, tone: tone || 'ok' } });
}

function csvModalHtml() {
  const p = state.csvPreview;
  const s = p.stats;
  const nothing = !s || (!s.newSubjects && !s.newExams);

  const line = (label, value, muted) => `
    <div style="display:flex;align-items:center;gap:12px;padding:9px 10px;margin:0 -10px;border-radius:10px;">
      <span style="font-size:13.5px;color:${muted ? 'var(--text-3)' : 'var(--text)'};flex:1;min-width:0;">${label}</span>
      <span style="font-family:'Golos Text';font-variant-numeric:tabular-nums;font-size:13.5px;font-weight:600;color:${muted ? 'var(--text-3)' : 'var(--text)'};flex-shrink:0;">${value}</span>
    </div>`;

  const rows = s ? [
    s.newSubjects ? line('Новых предметов', s.newSubjects) : '',
    s.newSessions ? line('Будет создано семестров', s.newSessions) : '',
    s.newGroups ? line('Будет создано групп', s.newGroups) : '',
    s.newExams ? line('Новых экзаменов и зачётов', s.newExams) : '',
    s.skippedSubjects ? line('Уже есть — предметы пропущены', s.skippedSubjects, true) : '',
    s.skippedExams ? line('Уже есть — экзамены пропущены', s.skippedExams, true) : '',
  ].filter(Boolean).join('<div style="height:1px;background:var(--border);"></div>') : '';

  const errorsBlock = p.errors.length ? `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <span style="font-size:12px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:var(--text-3);">Замечания · ${p.errors.length}</span>
      <div class="scroll-y" style="max-height:150px;overflow-y:auto;border:1px solid var(--border);border-radius:12px;padding:12px 14px;background:var(--bg);display:flex;flex-direction:column;gap:7px;">
        ${p.errors.map(e => `<span style="font-size:12.5px;line-height:1.45;color:var(--text-2);">${esc(e)}</span>`).join('')}
      </div>
    </div>` : '';

  const bodyBlock = nothing
    ? `<p style="margin:0;font-size:13.5px;line-height:1.55;color:var(--text-2);">Добавлять нечего: всё из файла уже есть в приложении либо строки не удалось разобрать.</p>`
    : `<div style="display:flex;flex-direction:column;">${rows}</div>
       <p style="margin:0;font-size:12.5px;line-height:1.5;color:var(--text-3);">Отметки о выполнении не переносятся — задания добавятся невыполненными. Существующие предметы и прогресс не тронутся.</p>`;

  return `
  <div class="modal-overlay ${animModalEnter ? 'anim-in' : ''}" data-action="closeCsvModal">
    <div class="card scroll-y" style="border-radius:18px;padding:26px;width:460px;max-width:100%;max-height:86vh;display:flex;flex-direction:column;gap:20px;" data-stop="1">
      <div style="display:flex;align-items:center;gap:13px;">
        <span style="width:44px;height:44px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--accent-soft);color:var(--accent-2);">${icon('sheet', 22)}</span>
        <div style="display:flex;flex-direction:column;gap:3px;min-width:0;flex:1;">
          <h2 style="margin:0;font-family:'Onest';font-weight:600;font-size:19px;color:var(--text);letter-spacing:-.01em;">Импорт из CSV</h2>
          <span style="font-size:12.5px;color:var(--text-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.fileName || 'файл')}</span>
        </div>
        <button class="close-btn" data-action="closeCsvModal">${icon('x', 16)}</button>
      </div>
      ${bodyBlock}
      ${errorsBlock}
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:2px;">
        <button class="ghost-btn" data-action="closeCsvModal">${nothing ? 'Закрыть' : 'Отмена'}</button>
        ${nothing ? '' : `<button class="primary-btn" data-action="applyCsvImport">Добавить</button>`}
      </div>
    </div>
  </div>`;
}

function noticeToastHtml() {
  const n = state.notice;
  if (!n) return '';
  const warn = n.tone === 'warn';
  return `
  <div class="app-toast" style="width:100%;pointer-events:auto;">
    <div class="card" style="border-radius:14px;padding:12px 12px 12px 14px;display:flex;align-items:center;gap:10px;overflow:hidden;box-shadow:0 14px 40px rgba(20,16,12,.22);">
      <span style="width:30px;height:30px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${warn ? 'var(--surface-2)' : 'var(--good-soft)'};color:${warn ? 'var(--text-2)' : 'var(--good)'};">${icon(warn ? 'alert' : 'check', 15)}</span>
      <span style="font-size:13.5px;line-height:1.4;color:var(--text);flex:1;min-width:0;overflow-wrap:anywhere;">${esc(n.message)}</span>
      <button class="mini-icon-btn" style="width:28px;height:28px;flex-shrink:0;" data-action="dismissNotice" title="Закрыть">${icon('x', 14)}</button>
    </div>
  </div>`;
}

const actions = {
  goDashboard: () => setUI({ navTab: 'dashboard', showThemeMenu: false }),
  goSessionsTab: () => setUI({ navTab: 'main', view: 'sessions', showThemeMenu: false }),
  goSchedule: () => setUI({ navTab: 'schedule', showThemeMenu: false }),
  goToSessions: () => setUI({ view: 'sessions' }),
  toggleThemeMenu: () => setUI({ showThemeMenu: !state.showThemeMenu }),
  closeThemeMenu: () => setUI({ showThemeMenu: false }),
  selectTheme: (el) => { rememberTheme(el.dataset.themeId); setState({ themeId: el.dataset.themeId, showThemeMenu: false }); },

  openSession: (el) => setUI({ navTab: 'main', view: 'subjects', currentSessionId: el.dataset.sessionId }),
  toggleExamPanel: () => setUI({ examPanelOpen: !state.examPanelOpen }),
  toggleHideClosed: () => setState({ hideClosed: !state.hideClosed }),

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
    const was = task.completed[index];
    const now = segNext(was);
    task.completed[index] = now;
    // Активность считаем только по переходам в «сдано» и обратно:
    // «готово» — это ещё не сданная работа.
    if (segIsDone(now) && !segIsDone(was)) bumpActivity(1);
    else if (!segIsDone(now) && segIsDone(was)) bumpActivity(-1);
    lastToggledSegKey = segIsDone(now) ? (subjectId + '|' + taskId + '|' + index) : null;
    const rect = (!wasClosed && subjectClosed(sub)) ? el.getBoundingClientRect() : null;
    setState({});
    if (rect) fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
  },

  deleteSubject: (el) => {
    const sess = state.sessions.find(s => s.id === state.currentSessionId);
    if (!sess) return;
    const idx = sess.subjects.findIndex(s => s.id === el.dataset.subjectId);
    if (idx === -1) return;
    const sub = sess.subjects[idx];
    const sid = sess.id;
    askConfirm({ title: 'Удалить предмет?', message: `«${sub.name}» и весь прогресс по нему будут удалены.`, confirmLabel: 'Удалить' }, () => {
      const [removed] = sess.subjects.splice(idx, 1);
      setState({});
      offerUndo(`Предмет «${removed.name}» удалён`, () => {
        const s = state.sessions.find(x => x.id === sid);
        if (s) s.subjects.splice(Math.min(idx, s.subjects.length), 0, removed);
      });
    });
  },

  toggleExam: (el) => {
    const sess = state.sessions.find(s => s.id === state.currentSessionId);
    if (!sess) return;
    const sub = sess.subjects.find(s => s.id === el.dataset.subjectId);
    if (!sub) return;
    const wasClosed = subjectClosed(sub);
    sub.examPassed = !sub.examPassed;
    bumpActivity(sub.examPassed ? 1 : -1);
    const rect = (!wasClosed && subjectClosed(sub)) ? el.getBoundingClientRect() : null;
    setState({});
    if (rect) fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
  },

  deleteSession: (el) => {
    const id = el.dataset.sessionId;
    const idx = state.sessions.findIndex(s => s.id === id);
    if (idx === -1) return;
    const sess = state.sessions[idx];
    askConfirm({ title: 'Удалить семестр?', message: `«${sess.name}» и все его предметы будут удалены.`, confirmLabel: 'Удалить' }, () => {
      const [removed] = state.sessions.splice(idx, 1);
      if (state.currentSessionId === id) { state.view = 'sessions'; state.currentSessionId = null; }
      setState({});
      offerUndo(`Семестр «${removed.name}» удалён`, () => {
        state.sessions.splice(Math.min(idx, state.sessions.length), 0, removed);
      });
    });
  },

  undoDelete: () => {
    const fn = undoRestore;
    undoRestore = null;
    clearTimeout(undoTimer);
    if (fn) fn();
    setState({ undo: null });
  },
  dismissUndo: () => { undoRestore = null; clearTimeout(undoTimer); setUI({ undo: null }); },
  dismissReminders: () => setUI({ examReminders: null }),

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

  exportCsv: async () => {
    if (state.csvBusy) return;
    const file = window.adelon && window.adelon.file;
    if (!file) { showNotice('Экспорт доступен только в приложении.', 'warn'); return; }
    const subjects = state.sessions.reduce((a, s) => a + (s.subjects || []).length, 0);
    const exams = examGroups().reduce((a, g) => a + groupExamList(g.id).length, 0);
    if (!subjects && !exams) { showNotice('Нечего выгружать — нет ни предметов, ни экзаменов.', 'warn'); return; }
    setUI({ csvBusy: true });
    try {
      const res = await file.save(`adelon-${dateKey(new Date())}.csv`, buildCsv());
      if (res && res.ok) {
        showNotice(`Выгружено: ${subjects} ${plural(subjects, ['предмет', 'предмета', 'предметов'])}, ${exams} ${plural(exams, ['экзамен', 'экзамена', 'экзаменов'])}.`);
      } else if (res && res.error) {
        showNotice('Не удалось сохранить файл: ' + res.error, 'warn');
      }
    } finally {
      setUI({ csvBusy: false });
    }
  },
  importCsv: async () => {
    if (state.csvBusy) return;
    const file = window.adelon && window.adelon.file;
    if (!file) { showNotice('Импорт доступен только в приложении.', 'warn'); return; }
    setUI({ csvBusy: true });
    try {
      const res = await file.open();
      if (!res || !res.ok) {
        if (res && res.error) showNotice('Не удалось прочитать файл: ' + res.error, 'warn');
        return;
      }
      setUI({ csvPreview: analyzeCsv(res.text, res.name) });
    } finally {
      setUI({ csvBusy: false });
    }
  },
  closeCsvModal: () => setUI({ csvPreview: null }),
  applyCsvImport: () => {
    const p = state.csvPreview;
    if (!p || !p.stats) return;
    const { newSubjects, newExams } = p.stats;
    if (!newSubjects && !newExams) { setUI({ csvPreview: null }); return; }
    applyCsvPreview(p);
    setState({ csvPreview: null });
    const parts = [];
    if (newSubjects) parts.push(`${newSubjects} ${plural(newSubjects, ['предмет', 'предмета', 'предметов'])}`);
    if (newExams) parts.push(`${newExams} ${plural(newExams, ['экзамен', 'экзамена', 'экзаменов'])}`);
    showNotice('Добавлено: ' + parts.join(', ') + '.');
  },
  dismissNotice: () => setUI({ notice: null }),

  openAddModal: () => setUI({
    showAddModal: true,
    editSubjectId: null,
    draft: { name: '', teacher: '', autoType: 'auto', examLink: '', lessonLink: '', tasks: [{ id: uid('d'), type: 'flask', total: 4 }] },
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
        lessonLink: sub.lessonLink || '',
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
      const label = t.type === 'custom'
        ? ((t.customLabel || '').trim() || 'Задание')
        : ((TASK_TYPES.find(x => x.type === t.type) || {}).label || t.type);
      // Сохраняем сами отметки, а не их количество: иначе правка названия
      // предмета сбрасывала бы пометки «готово» и порядок сданных работ.
      const prev = Array.isArray(t.origCompleted) ? t.origCompleted : [];
      const completed = Array.from({ length: total }, (_, i) => {
        const v = prev[i];
        return segIsDone(v) ? true : segIsReady(v) ? SEG_READY : false;
      });
      return { id: uid('t'), type: t.type, label, total, completed };
    });
    const tasks = built.length ? built : [{ id: uid('t'), type: 'flask', label: 'Лабораторные', total: 4, completed: mk(4, 0) }];
    const sess = state.sessions.find(s => s.id === sid);
    if (!sess) return setState({ showAddModal: false, editSubjectId: null });
    const examLink = d.examLink || null;
    const lessonLink = resolveLessonLink(d).trim() || null;
    if (state.editSubjectId) {
      const sub = sess.subjects.find(s => s.id === state.editSubjectId);
      if (sub) {
        sub.name = d.name.trim();
        sub.meta = d.teacher.trim() || 'Преподаватель';
        sub.autoType = d.autoType || 'auto';
        sub.examLink = examLink;
        sub.lessonLink = lessonLink;
        sub.tasks = tasks;
      }
    } else {
      sess.subjects.push({
        id: uid('subj'), name: d.name.trim(), meta: d.teacher.trim() || 'Преподаватель',
        autoType: d.autoType || 'auto', examLink, lessonLink, tasks,
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

  openSessionModal: () => setUI({ showSessionModal: true, editSessionId: null, sessionDraft: { name: '', period: '' } }),
  openEditSessionModal: (el) => {
    const sess = state.sessions.find(s => s.id === el.dataset.sessionId);
    if (!sess) return;
    setUI({
      showSessionModal: true,
      editSessionId: sess.id,
      sessionDraft: { name: sess.name, period: sess.period && sess.period !== 'Без периода' ? sess.period : '' },
    });
  },
  closeSessionModal: () => setUI({ showSessionModal: false, editSessionId: null }),
  submitSession: () => {
    const d = state.sessionDraft;
    if (!d.name.trim()) return;
    if (state.editSessionId) {
      const sess = state.sessions.find(s => s.id === state.editSessionId);
      if (sess) { sess.name = d.name.trim(); sess.period = d.period.trim() || 'Без периода'; }
    } else {
      state.sessions.unshift({ id: uid('sess'), name: d.name.trim(), period: d.period.trim() || 'Без периода', subjects: [] });
    }
    setState({ showSessionModal: false, editSessionId: null });
  },

  openExamModal: () => {
    if (!state.examGroup) return;
    setUI({ showExamModal: true, examDraft: { name: '', kind: 'exam', date: '', dateUnknown: false } });
  },
  closeExamModal: () => setUI({ showExamModal: false }),
  setExamKind: (el) => setUI({ examDraft: { ...state.examDraft, kind: el.dataset.kind } }),
  toggleExamDateUnknown: () => setUI({ examDraft: { ...state.examDraft, dateUnknown: !state.examDraft.dateUnknown } }),
  submitExam: () => {
    const d = state.examDraft;
    const g = state.examGroup;
    if (!d.name.trim() || !g) return;
    const item = {
      id: uid('uex'),
      name: d.name.trim(),
      kind: d.kind === 'zachet' ? 'zachet' : 'exam',
      date: d.dateUnknown ? null : (d.date || null),
    };
    if (!state.userExams[g]) state.userExams[g] = [];
    state.userExams[g] = [...state.userExams[g], item];
    setState({ showExamModal: false });
  },
  openGroupsModal: () => setUI({ showGroupsModal: true, groupDraft: '' }),
  closeGroupsModal: () => setUI({ showGroupsModal: false, groupDraft: '' }),
  submitGroup: () => {
    const title = (state.groupDraft || '').trim();
    if (!title) return;
    if (examGroups().some(g => csvNorm(g.title) === csvNorm(title))) return;
    const item = { id: uid('ug'), title };
    state.userGroups = [...(state.userGroups || []), item];
    setState({ groupDraft: '', examGroup: item.id });
  },
  deleteGroup: (el) => {
    const id = el.dataset.groupId;
    const g = (state.userGroups || []).find(x => x.id === id);
    if (!g) return;
    const count = groupExamList(id).length;
    askConfirm({
      title: 'Удалить группу?',
      message: count
        ? `Вместе с «${g.title}» удалится ${count} ${plural(count, ['запись', 'записи', 'записей'])} об экзаменах.`
        : `Группа «${g.title}» будет удалена.`,
      confirmLabel: 'Удалить',
    }, () => {
      state.userGroups = (state.userGroups || []).filter(x => x.id !== id);
      if (state.userExams) delete state.userExams[id];
      if (state.examGroup === id) state.examGroup = DEFAULT_EXAM_GROUPS[0] ? DEFAULT_EXAM_GROUPS[0].id : null;
      setState({});
    });
  },

  restoreExams: () => {
    const g = state.examGroup;
    if (!g) return;
    const baseIds = (EXAM_SCHEDULES[g] || []).map(e => e.id);
    state.hiddenExams = (state.hiddenExams || []).filter(id => !baseIds.includes(id));
    setState({});
  },
  deleteExam: (el) => {
    const id = el.dataset.examId;
    const g = state.examGroup;
    if (!id || !g) return;
    const userArr = (state.userExams && state.userExams[g]) || [];
    const userIdx = userArr.findIndex(e => e.id === id);
    const item = currentExamList().find(e => e.id === id);
    const label = item ? item.name : 'запись';
    if (userIdx !== -1) {
      const [removed] = userArr.splice(userIdx, 1);
      state.userExams[g] = userArr;
      setState({});
      offerUndo(`«${label}» удалён`, () => {
        if (!state.userExams[g]) state.userExams[g] = [];
        state.userExams[g].splice(Math.min(userIdx, state.userExams[g].length), 0, removed);
      });
    } else {
      if (!state.hiddenExams.includes(id)) state.hiddenExams = [...state.hiddenExams, id];
      setState({});
      offerUndo(`«${label}» скрыт`, () => {
        state.hiddenExams = (state.hiddenExams || []).filter(x => x !== id);
      });
    }
  },

};

const inputHandlers = {
  draftName: (v) => { state.draft.name = v; updateSubmitState('draft-name'); },
  draftTeacher: (v) => { state.draft.teacher = v; },
  taskType: (v, el) => { const t = state.draft.tasks.find(t => t.id === el.dataset.taskId); if (t) { t.type = v; render(); } },
  taskTotal: (v, el) => { const t = state.draft.tasks.find(t => t.id === el.dataset.taskId); if (t) t.total = v.replace(/[^0-9]/g, ''); },
  taskCustom: (v, el) => { const t = state.draft.tasks.find(t => t.id === el.dataset.taskId); if (t) t.customLabel = v; },
  examLink: (v) => { state.draft.examLink = v; },
  lessonLink: (v) => { state.draft.lessonLink = v; state.draft.lessonTouched = true; render(); },
  subjectSort: (v) => { setState({ subjectSort: v }); },
  examGroupSelect: (v) => { setState({ examGroup: v || null }); },
  sessionName: (v) => { state.sessionDraft.name = v; updateSubmitState('sess-name'); },
  sessionPeriod: (v) => { state.sessionDraft.period = v; },
  groupDraft: (v) => { state.groupDraft = v; render(); },
  examDraftName: (v) => { state.examDraft.name = v; updateSubmitState('exam-name'); },
  examDraftDate: (v) => { state.examDraft.date = v; },
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
  else if (state.showExamModal) disabled = state.examDraft.name.trim().length === 0;
  else if (state.showLessonModal) disabled = !state.lessonDraft || state.lessonDraft.name.trim().length === 0;
  btn.disabled = disabled;
  btn.style.opacity = disabled ? 0.5 : 1;
}

root.addEventListener('click', (e) => {
  if (segSuppressClick) { segSuppressClick = false; return; }
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;
  if (actionEl.classList.contains('modal-overlay') && e.target !== actionEl) return;
  const a = actionEl.dataset.action;
  if (actions[a]) {
    e.preventDefault();
    const before = dataSnapshot();
    actions[a](actionEl);
    recordHistory(before);
  }
});

root.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest('[role="button"][data-action]');
  if (!el) return;
  e.preventDefault();
  const a = el.dataset.action;
  if (actions[a]) {
    const before = dataSnapshot();
    actions[a](el);
    recordHistory(before);
  }
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
  if (['taskType', 'oguDivision', 'oguCourse', 'oguGroup', 'examLink', 'lessonLink', 'subjectSort', 'examGroupSelect', 'examDraftDate'].includes(name)) {
    const h = inputHandlers[name];
    if (h) h(el.value, el);
  }
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'y' || e.key === 'Y' ||
      e.key === 'я' || e.key === 'Я' || e.key === 'н' || e.key === 'Н')) {
    // В полях ввода Ctrl+Z должен отменять текст, а не действие в приложении.
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
    const redo = e.key === 'y' || e.key === 'Y' || e.key === 'н' || e.key === 'Н' || e.shiftKey;
    if (redo) redoLast(); else undoLast();
    return;
  }
  if (e.key === 'Escape') {
    if (state.examReminders && state.examReminders.length) actions.dismissReminders();
    else if (state.undo) actions.dismissUndo();
    else if (state.confirmDialog) actions.confirmNo();
    else if (state.showAddModal) actions.closeAddModal();
    else if (state.showSessionModal) actions.closeSessionModal();
    else if (state.showExamModal) actions.closeExamModal();
    else if (state.showGroupsModal) actions.closeGroupsModal();
    else if (state.showImportModal) actions.closeImportModal();
    else if (state.csvPreview) actions.closeCsvModal();
    else if (state.update && state.update.status === 'available') actions.dismissUpdate();
    else if (state.showThemeMenu) actions.closeThemeMenu();
  }
});

// Windows переключили между светлой и тёмной — перерисовываемся, но только
// если выбрана автотема, иначе явный выбор пользователя менять нельзя.
if (window.matchMedia) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onOsThemeChange = () => { if (AUTO_THEMES[state.themeId]) render(); };
  if (mq.addEventListener) mq.addEventListener('change', onOsThemeChange);
  else if (mq.addListener) mq.addListener(onOsThemeChange);
}

// ─── Протяжка по сегментам ──────────────────────────────────────────────────
// Зажал на сегменте и провёл — отмечаются все, через которые прошёл курсор.
// Во время протяжки не перерисовываем приложение: render() пересобирает весь
// DOM, и элементы под курсором исчезали бы прямо посреди жеста. Поэтому
// правим state и подкрашиваем сегменты напрямую, а перерисовка — один раз в
// конце. Обычный клик сюда не попадает: жест начинается со второго сегмента.
let segDrag = null;
let segSuppressClick = false;

function segTargetFrom(el) {
  const sess = state.sessions.find(s => s.id === state.currentSessionId);
  if (!sess) return null;
  const sub = sess.subjects.find(s => s.id === el.dataset.subjectId);
  if (!sub) return null;
  const task = sub.tasks.find(t => t.id === el.dataset.taskId);
  if (!task) return null;
  return { sub, task, index: Number(el.dataset.index) };
}

function segApply(el) {
  const t = segTargetFrom(el);
  if (!t) return;
  const key = el.dataset.subjectId + '|' + el.dataset.taskId + '|' + el.dataset.index;
  if (segDrag.touched.has(key)) return;
  segDrag.touched.add(key);
  // Протяжка работает только между «сдано» и «не сдано»: тянуть третье
  // состояние жестом неудобно, для него есть клик.
  if (segIsDone(t.task.completed[t.index]) === segDrag.value) return;
  t.task.completed[t.index] = segDrag.value;
  bumpActivity(segDrag.value ? 1 : -1);
  segDrag.changed = true;
  el.style.background = segDrag.value
    ? (subjectClosed(t.sub) ? 'var(--good)' : 'var(--accent)')
    : 'var(--seg-empty)';
}

root.addEventListener('pointerdown', (e) => {
  segSuppressClick = false; // если прошлый жест не породил click, флаг не должен зависнуть
  if (e.button !== 0) return;
  const el = e.target.closest('.seg');
  if (!el) return;
  const t = segTargetFrom(el);
  if (!t) return;
  segDrag = { value: !segIsDone(t.task.completed[t.index]), origin: el, touched: new Set(), changed: false, moved: false, before: dataSnapshot() };
});

document.addEventListener('pointermove', (e) => {
  if (!segDrag) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const seg = el && el.closest ? el.closest('.seg') : null;
  if (!seg || seg === segDrag.origin) return;
  if (!segDrag.moved) {
    segDrag.moved = true;
    segApply(segDrag.origin); // стартовый сегмент отмечаем, только когда жест состоялся
  }
  segApply(seg);
});

document.addEventListener('pointerup', () => {
  if (!segDrag) return;
  const { changed, before } = segDrag;
  segDrag = null;
  if (!changed) return; // жеста не было — сработает обычный клик
  // Отпускание над тем же сегментом, с которого начали, породит click и
  // перевернёт его обратно — гасим этот клик.
  segSuppressClick = true;
  lastToggledSegKey = null;
  setState({});
  recordHistory(before);
});

// ─── Перетаскивание предметов ───────────────────────────────────────────────
// Тянем за ручку, а не за карточку целиком: внутри карточки живут сегменты со
// своим жестом протяжки, и они бы конфликтовали. Порядок меняем в исходном
// массиве, переставляя предмет вплотную к тому, на который бросили, — поэтому
// скрытые фильтром предметы остаются на своих местах.
let subjDragId = null;

function clearDropMarks() {
  for (const el of document.querySelectorAll('.subj-drop-before,.subj-drop-after')) {
    el.classList.remove('subj-drop-before', 'subj-drop-after');
  }
}

function reorderSubjects(draggedId, targetId, after) {
  const sess = state.sessions.find(s => s.id === state.currentSessionId);
  if (!sess || draggedId === targetId) return false;
  const from = sess.subjects.findIndex(s => s.id === draggedId);
  if (from === -1) return false;
  const [moved] = sess.subjects.splice(from, 1);
  const to = sess.subjects.findIndex(s => s.id === targetId);
  if (to === -1) { sess.subjects.splice(from, 0, moved); return false; }
  sess.subjects.splice(after ? to + 1 : to, 0, moved);
  return true;
}

root.addEventListener('dragstart', (e) => {
  const grip = e.target.closest('.subj-grip');
  if (!grip) { e.preventDefault(); return; }
  subjDragId = grip.dataset.subjectId;
  const card = grip.closest('.subject-card');
  if (card) card.classList.add('subj-dragging');
  if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', subjDragId); }
});

root.addEventListener('dragover', (e) => {
  if (!subjDragId) return;
  const card = e.target.closest('.subject-card');
  if (!card || card.dataset.subjectId === subjDragId) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  const r = card.getBoundingClientRect();
  const after = e.clientX > r.left + r.width / 2;
  clearDropMarks();
  card.classList.add(after ? 'subj-drop-after' : 'subj-drop-before');
});

root.addEventListener('drop', (e) => {
  if (!subjDragId) return;
  const card = e.target.closest('.subject-card');
  if (!card) return;
  e.preventDefault();
  const r = card.getBoundingClientRect();
  const after = e.clientX > r.left + r.width / 2;
  const before = dataSnapshot();
  const changed = reorderSubjects(subjDragId, card.dataset.subjectId, after);
  subjDragId = null;
  clearDropMarks();
  if (!changed) return;
  setState({});
  recordHistory(before);
});

root.addEventListener('dragend', () => {
  subjDragId = null;
  clearDropMarks();
  for (const el of document.querySelectorAll('.subj-dragging')) el.classList.remove('subj-dragging');
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

  const dueReminders = computeExamReminders();
  if (dueReminders.length) {
    const seen = { ...(state.remindersSeen || {}) };
    dueReminders.forEach(d => { seen[d.key] = true; });
    state.remindersSeen = seen;
    state.examReminders = dueReminders;
    save();
  }

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
