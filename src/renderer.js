const form = document.getElementById('reminder-form');
const nameInput = document.getElementById('alarm-name');
const timeInput = document.getElementById('reminder-time');
const leadInput = document.getElementById('lead-minutes');
const soundInput = document.getElementById('alarm-sound');
const previewButton = document.getElementById('preview-sound');
const alarmList = document.getElementById('alarm-list');
const emptyState = document.getElementById('empty-state');
const statusLabel = document.getElementById('status');
const opacitySlider = document.getElementById('opacity-slider');
const opacityValue = document.getElementById('opacity-value');
const flashToggle = document.getElementById('flash-toggle');
const clock = document.getElementById('analog-clock');
const clockMarks = document.getElementById('clock-marks');
const clockHand = document.getElementById('clock-hand');
const hourModeButton = document.getElementById('hour-mode');
const minuteModeButton = document.getElementById('minute-mode');
const amButton = document.getElementById('am-button');
const pmButton = document.getElementById('pm-button');
const cancelEditButton = document.getElementById('cancel-edit');
const formHeading = document.getElementById('form-heading');
const reminderText = document.getElementById('reminder-text');
const importButton = document.getElementById('import-reminders');
const importStatus = document.getElementById('import-status');

const SOUND_OPTIONS = {
  'soft-chime': [{ frequency: 659.25, start: 0, duration: 0.62, type: 'sine' }, { frequency: 523.25, start: 0.62, duration: 0.78, type: 'sine' }],
  'mellow-bells': [{ frequency: 523.25, start: 0, duration: 0.72, type: 'sine' }, { frequency: 659.25, start: 0.28, duration: 0.82, type: 'sine' }, { frequency: 783.99, start: 0.58, duration: 1.05, type: 'sine' }],
  'singing-bowl': [{ frequency: 293.66, start: 0, duration: 1.45, type: 'sine' }, { frequency: 440, start: 0.04, duration: 1.25, type: 'sine', volume: 0.045 }]
};
let alarms = loadAlarms();
let alarmTimer = null;
let clockMode = 'hour';
let draggingClock = false;
let editingId = null;

const savedOpacity = Number(localStorage.getItem('windowOpacity'));
const initialOpacity = Number.isFinite(savedOpacity) && savedOpacity >= 50 && savedOpacity <= 100 ? savedOpacity : 100;
opacitySlider.value = String(initialOpacity);
flashToggle.checked = localStorage.getItem('flashOnReminder') !== 'false';
applyOpacity(initialOpacity);
renderClock();
renderAlarms();
updateAlarmTimer();
checkAlarms();

opacitySlider.addEventListener('input', () => {
  const opacity = Number(opacitySlider.value);
  applyOpacity(opacity);
  localStorage.setItem('windowOpacity', String(opacity));
});
flashToggle.addEventListener('change', () => localStorage.setItem('flashOnReminder', String(flashToggle.checked)));
hourModeButton.addEventListener('click', () => setClockMode('hour'));
minuteModeButton.addEventListener('click', () => setClockMode('minute'));
amButton.addEventListener('click', () => setPeriod('AM'));
pmButton.addEventListener('click', () => setPeriod('PM'));
timeInput.addEventListener('input', renderClock);
clock.addEventListener('pointerdown', (event) => { draggingClock = true; clock.setPointerCapture(event.pointerId); selectClockValue(event); });
clock.addEventListener('pointermove', (event) => { if (draggingClock) selectClockValue(event); });
clock.addEventListener('pointerup', () => { draggingClock = false; });
clock.addEventListener('pointercancel', () => { draggingClock = false; });
clock.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(event.key)) {
    event.preventDefault(); stepClockValue(event.key === 'ArrowUp' || event.key === 'ArrowRight' ? 1 : -1);
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault(); setClockMode(clockMode === 'hour' ? 'minute' : 'hour');
  }
});
previewButton.addEventListener('click', () => playSound(soundInput.value));
cancelEditButton.addEventListener('click', resetForm);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const leadMinutes = Number(leadInput.value);
  if (!Number.isInteger(leadMinutes) || leadMinutes < 1 || leadMinutes > 60) {
    statusLabel.textContent = 'Choose a lead time between 1 and 60 minutes.';
    return;
  }
  const alarmName = nameInput.value.trim();
  if (!alarmName || !timeInput.value) return;

  if (editingId) {
    const alarm = alarms.find((entry) => entry.id === editingId);
    if (!alarm) return resetForm();
    Object.assign(alarm, { name: alarmName, time: timeInput.value, leadMinutes, sound: soundInput.value, fireAt: null, completed: false, lastFiredDate: null });
    statusLabel.textContent = `"${alarm.name}" updated.`;
  } else {
    alarms.push({ id: crypto.randomUUID(), name: alarmName, time: timeInput.value, leadMinutes, sound: soundInput.value, enabled: true, lastFiredDate: null, fireAt: null, completed: false });
    statusLabel.textContent = `"${alarmName}" added.`;
  }
  saveAlarms(); renderAlarms(); updateAlarmTimer(); resetForm(false);
});

importButton.addEventListener('click', importTextReminders);

function loadAlarms() {
  try {
    const stored = JSON.parse(localStorage.getItem('alarms') || '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter((alarm) => alarm && typeof alarm.id === 'string' && typeof alarm.name === 'string' &&
      /^\d{2}:\d{2}$/.test(alarm.time) && Number.isInteger(alarm.leadMinutes) && alarm.leadMinutes >= 1 && alarm.leadMinutes <= 60 && SOUND_OPTIONS[alarm.sound])
      .map((alarm) => ({ id: alarm.id, name: alarm.name.slice(0, 80), time: alarm.time, leadMinutes: alarm.leadMinutes, sound: alarm.sound, enabled: alarm.enabled !== false,
        lastFiredDate: typeof alarm.lastFiredDate === 'string' ? alarm.lastFiredDate : null, fireAt: Number.isFinite(alarm.fireAt) ? alarm.fireAt : null, completed: alarm.completed === true }));
  } catch { return []; }
}
function saveAlarms() { localStorage.setItem('alarms', JSON.stringify(alarms)); }

function renderAlarms() {
  alarmList.replaceChildren(); emptyState.hidden = alarms.length > 0;
  for (const alarm of alarms) {
    const item = document.createElement('li'); item.className = `alarm-item${alarm.enabled ? '' : ' disabled'}`;
    const details = document.createElement('div'); details.className = 'alarm-details';
    const title = document.createElement('strong'); title.textContent = alarm.name;
    const summary = document.createElement('span'); summary.textContent = `${formatTimeString(alarm.time)} · ${alarm.leadMinutes} min before · ${soundLabel(alarm.sound)}${alarm.fireAt ? ' · one-time' : ' · daily'}`;
    details.append(title, summary);
    const actions = document.createElement('div'); actions.className = 'alarm-actions';
    const enabled = document.createElement('input'); enabled.type = 'checkbox'; enabled.checked = alarm.enabled; enabled.setAttribute('aria-label', `${alarm.enabled ? 'Disable' : 'Enable'} ${alarm.name}`);
    enabled.addEventListener('change', () => { alarm.enabled = enabled.checked; saveAlarms(); renderAlarms(); updateAlarmTimer(); });
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'small-button'; edit.textContent = 'Edit'; edit.addEventListener('click', () => editAlarm(alarm.id));
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'small-button'; remove.textContent = 'Remove'; remove.addEventListener('click', () => {
      alarms = alarms.filter((entry) => entry.id !== alarm.id); if (editingId === alarm.id) resetForm(); saveAlarms(); renderAlarms(); updateAlarmTimer();
    });
    actions.append(enabled, edit, remove); item.append(details, actions); alarmList.append(item);
  }
}

function editAlarm(id) {
  const alarm = alarms.find((entry) => entry.id === id); if (!alarm) return;
  editingId = id; nameInput.value = alarm.name; timeInput.value = alarm.time; leadInput.value = String(alarm.leadMinutes); soundInput.value = alarm.sound;
  formHeading.textContent = `Edit: ${alarm.name}`; document.getElementById('set-button').textContent = 'Save changes'; cancelEditButton.hidden = false;
  document.querySelector('.add-alarm').open = true; renderClock(); nameInput.focus();
}
function resetForm(clearName = true) {
  editingId = null; if (clearName) nameInput.value = '';
  formHeading.textContent = 'Add an alarm'; document.getElementById('set-button').textContent = 'Add alarm'; cancelEditButton.hidden = true;
}

function updateAlarmTimer() {
  if (alarmTimer !== null) window.clearInterval(alarmTimer);
  alarmTimer = alarms.some((alarm) => alarm.enabled) ? window.setInterval(checkAlarms, 1000) : null;
}
function checkAlarms() {
  const now = new Date(); const today = dateKey(now); let changed = false;
  for (const alarm of alarms) {
    if (!alarm.enabled || alarm.completed) continue;
    let target;
    if (Number.isFinite(alarm.fireAt)) target = new Date(alarm.fireAt);
    else {
      if (alarm.lastFiredDate === today) continue;
      const [hours, minutes] = alarm.time.split(':').map(Number); target = new Date(now); target.setHours(hours, minutes, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
    }
    const dueAt = new Date(target.getTime() - alarm.leadMinutes * 60_000);
    if (now >= dueAt && now < target) {
      if (Number.isFinite(alarm.fireAt)) alarm.completed = true; else alarm.lastFiredDate = today;
      changed = true; playSound(alarm.sound); if (flashToggle.checked) window.rsvpDesktop.flashWindow();
      statusLabel.textContent = `Reminder: "${alarm.name}" — ${formatDateTime(target)}.`; statusLabel.classList.add('success');
    } else if (Number.isFinite(alarm.fireAt) && now >= target) {
      alarm.completed = true; changed = true;
    }
  }
  if (changed) { saveAlarms(); renderAlarms(); }
}

function importTextReminders() {
  const lines = reminderText.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const parsed = []; const errors = [];
  lines.forEach((line, index) => {
    const match = line.match(/^(.+?)\s*:\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\s+in\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?)\s*$/i);
    if (!match) { errors.push(`Line ${index + 1}: couldn't parse it.`); return; }
    const name = match[1].replace(/\s*\(\d+\)\s*$/, '').trim();
    let hour = Number(match[2]); const minute = Number(match[3]); const second = Number(match[4] || 0); const period = match[5].toUpperCase();
    if (hour < 1 || hour > 12 || minute > 59 || second > 59 || !name) { errors.push(`Line ${index + 1}: invalid name or time.`); return; }
    hour = hour % 12 + (period === 'PM' ? 12 : 0);
    const amount = Number(match[6]); const unit = match[7].toLowerCase();
    const durationMs = amount * (unit.startsWith('h') ? 3600000 : 60000);
    if (!Number.isFinite(durationMs) || durationMs <= 0) { errors.push(`Line ${index + 1}: invalid remaining duration.`); return; }
    const fireAt = Date.now() + durationMs;
    parsed.push({ id: crypto.randomUUID(), name: name.slice(0, 80), time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, leadMinutes: 5, sound: soundInput.value,
      enabled: true, lastFiredDate: null, fireAt, completed: false, displaySecond: second });
  });
  if (parsed.length) { alarms.push(...parsed); saveAlarms(); renderAlarms(); updateAlarmTimer(); checkAlarms(); }
  importStatus.textContent = `${parsed.length} reminder${parsed.length === 1 ? '' : 's'} imported.${errors.length ? ` ${errors.join(' ')}` : ''}`;
}
function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function setClockMode(mode) { clockMode = mode; hourModeButton.classList.toggle('active', mode === 'hour'); minuteModeButton.classList.toggle('active', mode === 'minute'); renderClock(); }
function setPeriod(period) {
  const [hours, minutes] = timeInput.value.split(':').map(Number); const h12 = hours % 12 || 12;
  const next = period === 'PM' ? h12 % 12 + 12 : h12 % 12;
  timeInput.value = `${String(next).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`; renderClock();
}
function selectClockValue(event) {
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(clock.getScreenCTM().inverse());
  let angle = Math.atan2(point.x - 120, -(point.y - 120)) * 180 / Math.PI; if (angle < 0) angle += 360;
  const [hours, minutes] = timeInput.value.split(':').map(Number);
  if (clockMode === 'hour') { const h12 = Math.round(angle / 30) % 12 || 12; const next = hours >= 12 ? h12 % 12 + 12 : h12 % 12; timeInput.value = `${String(next).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`; setClockMode('minute'); }
  else { const next = Math.round(angle / 6) % 60; timeInput.value = `${String(hours).padStart(2, '0')}:${String(next).padStart(2, '0')}`; renderClock(); }
}
function stepClockValue(delta) {
  const [hours, minutes] = timeInput.value.split(':').map(Number); const date = new Date(); date.setHours(hours, minutes, 0, 0);
  if (clockMode === 'hour') date.setHours(date.getHours() + delta); else date.setMinutes(date.getMinutes() + delta);
  timeInput.value = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; renderClock();
}
function renderClock() {
  const [hours, minutes] = timeInput.value.split(':').map(Number); const hour12 = hours % 12 || 12;
  amButton.classList.toggle('active', hours < 12); pmButton.classList.toggle('active', hours >= 12); clockMarks.replaceChildren();
  for (let value = 0; value < 12; value++) {
    const angle = value * Math.PI / 6; const label = clockMode === 'hour' ? String(value || 12) : String(value * 5).padStart(2, '0');
    const selected = clockMode === 'hour' ? (value || 12) === hour12 : value === Math.round(minutes / 5) % 12;
    const x = 120 + Math.sin(angle) * 78; const y = 120 - Math.cos(angle) * 78;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); circle.setAttribute('cx', x); circle.setAttribute('cy', y); circle.setAttribute('r', selected ? '17' : '15'); circle.setAttribute('class', `clock-number-bg${selected ? ' selected' : ''}`);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text'); text.setAttribute('x', x); text.setAttribute('y', y + 5); text.setAttribute('text-anchor', 'middle'); text.setAttribute('class', `clock-number${selected ? ' selected' : ''}`); text.textContent = label; clockMarks.append(circle, text);
  }
  const angle = (clockMode === 'hour' ? hour12 * 30 : minutes * 6) * Math.PI / 180; clockHand.setAttribute('x2', 120 + Math.sin(angle) * 75); clockHand.setAttribute('y2', 120 - Math.cos(angle) * 75);
}
function applyOpacity(value) { opacityValue.value = `${value}%`; opacityValue.textContent = `${value}%`; window.rsvpDesktop.setOpacity(value / 100); }
function formatTimeString(value) { const [h, m] = value.split(':').map(Number); const date = new Date(); date.setHours(h, m, 0, 0); return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date); }
function formatDateTime(date) { return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(date); }
function soundLabel(sound) { return ({ 'soft-chime': 'Soft chime', 'mellow-bells': 'Mellow bells', 'singing-bowl': 'Singing bowl' })[sound] || 'Soft chime'; }
function playSound(sound) {
  const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return;
  const context = new AudioContext(); const notes = SOUND_OPTIONS[sound] || SOUND_OPTIONS['soft-chime'];
  for (const note of notes) { const oscillator = context.createOscillator(); const gain = context.createGain(); const start = context.currentTime + note.start; oscillator.type = note.type; oscillator.frequency.value = note.frequency; gain.gain.setValueAtTime(0.0001, start); gain.gain.linearRampToValueAtTime(note.volume || 0.12, start + 0.08); gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration); oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start + note.duration + 0.02); }
  window.setTimeout(() => context.close(), 2200);
}
