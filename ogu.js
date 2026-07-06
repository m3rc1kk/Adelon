'use strict';

const https = require('https');

const HOST = 'oreluniver.ru';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
  'Referer': 'https://oreluniver.ru/schedule',
  'X-Requested-With': 'XMLHttpRequest',
};

function httpGet(pathname) {
  return new Promise((resolve, reject) => {
    const req = https.get({ host: HOST, path: pathname, headers: HEADERS, timeout: 20000 }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Превышено время ожидания ответа сайта ОГУ')));
  });
}

async function getJson(pathname) {
  const r = await httpGet(pathname);
  if (r.status !== 200) throw new Error('Сайт ОГУ ответил HTTP ' + r.status);
  return JSON.parse(r.body.toString('utf8'));
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
  const m = /^(.*?)\s*\(([^)]*)\)\s*(.*)$/.exec(s || '');
  if (m) return { name: m[1].trim(), type: m[2].trim(), teacher: m[3].trim() };
  return { name: (s || '').trim(), type: '', teacher: '' };
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
  const r = await httpGet(`/schedule//${encodeURIComponent(group)}////printschedule/ics?current`);
  if (r.status !== 200) throw new Error('Сайт ОГУ ответил HTTP ' + r.status);
  return parseIcs(r.body.toString('utf8'));
}

module.exports = { divisions, courses, groups, schedule, parseIcs };
