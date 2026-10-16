'use strict';

// Транспорт внедряет main.js: прямой https не проходит антибот-защиту ОГУ,
// поэтому запросы идут через скрытое окно, где отработал JS-гейт. Здесь —
// только построение адресов и разбор ответов.
let transport = null;
function setTransport(fn) { transport = fn; }

async function getText(pathname) {
  if (!transport) throw new Error('ОГУ: транспорт не настроен');
  return transport(pathname);
}

async function getJson(pathname) {
  const body = await getText(pathname);
  try { return JSON.parse(body); }
  catch (_) { throw new Error('Сайт ОГУ вернул неожиданный ответ'); }
}

function unescapeIcs(s) {
  return s.replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

function parseDt(v) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/.exec(v || '');
  if (!m) return {};
  return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}` };
}

function parseSummary(s) {
  const str = (s || '').trim();
  const closeIdx = str.lastIndexOf(')');
  if (closeIdx === -1) return { name: str, type: '', teacher: '' };
  const name = str.slice(0, closeIdx + 1).trim();
  const teacher = str.slice(closeIdx + 1).trim();
  const parens = [...name.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
  const type = parens.find((p) => /лек|практ|сем|лаб|дист/i.test(p)) || parens[0] || '';
  return { name, type: type.trim(), teacher };
}

function parseIcs(text) {
  const rawLines = text.split(/\r?\n/);
  const lines = [];
  for (const l of rawLines) {
    if (/^[ \t]/.test(l) && lines.length) lines[lines.length - 1] += l.slice(1);
    else lines.push(l);
  }
  const out = [];
  let cur = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (line === 'END:VEVENT') { if (cur) out.push(cur); cur = null; continue; }
    if (!cur) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).split(';')[0].toUpperCase();
    const val = unescapeIcs(line.slice(idx + 1));
    if (key === 'DTSTART') cur._s = val;
    else if (key === 'DTEND') cur._e = val;
    else if (key === 'SUMMARY') cur._sum = val;
    else if (key === 'LOCATION') cur.room = val;
  }
  return out
    .map((e) => {
      const s = parseDt(e._s), en = parseDt(e._e);
      const { name, type, teacher } = parseSummary(e._sum);
      return { date: s.date || '', start: s.time || '', end: en.time || '', name, type, teacher, room: e.room || '' };
    })
    .filter((e) => e.date && e.name);
}

const divisions = () => getJson('/schedule/divisionlistforstuds');
const courses = (div) => getJson(`/schedule/${encodeURIComponent(div)}/kurslist`);
const groups = (div, kurs) => getJson(`/schedule/${encodeURIComponent(div)}/${encodeURIComponent(kurs)}/grouplist`);

async function schedule(group) {
  const body = await getText(`/schedule//${encodeURIComponent(group)}////printschedule/ics?current`);
  return parseIcs(body);
}

module.exports = { divisions, courses, groups, schedule, parseIcs, setTransport };
