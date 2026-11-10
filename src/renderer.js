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

const SOUND_OPTIONS = {
  'soft-chime': [
    { frequency: 659.25, start: 0, duration: 0.62, type: 'sine' },
    { frequency: 523.25, start: 0.62, duration: 0.78, type: 'sine' }
  ],
  'mellow-bells': [
    { frequency: 523.25, start: 0, duration: 0.72, type: 'sine' },
    { frequency: 659.25, start: 0.28, duration: 0.82, type: 'sine' },
    { frequency: 783.99, start: 0.58, duration: 1.05, type: 'sine' }
  ],
  'singing-bowl': [
    { frequency: 293.66, start: 0, duration: 1.45, type: 'sine' },
    { frequency: 440, start: 0.04, duration: 1.25, type: 'sine', volume: 0.045 }
  ]
};

let alarms = loadAlarms();
let alarmTimer = null;
let clockMode = 'hour';
let draggingClock = false;

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

flashToggle.addEventListener('change', () => {
  localStorage.setItem('flashOnReminder', String(flashToggle.checked));
});

hourModeButton.addEventListener('click', () => setClockMode('hour'));
minuteModeButton.addEventListener('click', () => setClockMode('minute'));
amButton.addEventListener('click', () => setPeriod('AM'));
pmButton.addEventListener('click', () => setPeriod('PM'));

timeInput.addEventListener('input', renderClock);

clock.addEventListener('pointerdown', (event) => {
  draggingClock = true;
  clock.setPointerCapture(event.pointerId);
  selectClockValue(event);
});
clock.addEventListener('pointermove', (event) => {
  if (draggingClock) selectClockValue(event);
});
clock.addEventListener('pointerup', () => { draggingClock = false; });
clock.addEventListener('pointercancel', () => { draggingClock = false; });
clock.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
    event.preventDefault();
    stepClockValue(1);
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
    event.preventDefault();
    stepClockValue(-1);
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    setClockMode(clockMode === 'hour' ? 'minute' : 'hour');
  }
});

previewButton.addEventListener('click', () => playSound(soundInput.value));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const leadMinutes = Number(leadInput.value);
  if (!Number.isInteger(leadMinutes) || leadMinutes < 1 || leadMinutes > 60) {
    statusLabel.textContent = 'Choose a lead time between 1 and 60 minutes.';
    return;
  }

  const alarm = {
    id: crypto.randomUUID(),
    name: nameInput.value.trim(),
    time: timeInput.value,
    leadMinutes,
    sound: soundInput.value,
    enabled: true,
    lastFiredDate: null
  };
  if (!alarm.name || !alarm.time) return;

  alarms.push(alarm);
  saveAlarms();
  renderAlarms();
  updateAlarmTimer();
  checkAlarms();
  statusLabel.textContent = `"${alarm.name}" added. It will repeat daily.`;
  nameInput.value = '';
  nameInput.focus();
});

function loadAlarms() {
  try {
    const stored = JSON.parse(localStorage.getItem('alarms') || '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter((alarm) => alarm && typeof alarm.id === 'string' && typeof alarm.name === 'string' &&
      /^\d{2}:\d{2}$/.test(alarm.time) && Number.isInteger(alarm.leadMinutes) &&
      alarm.leadMinutes >= 1 && alarm.leadMinutes <= 60 && SOUND_OPTIONS[alarm.sound])
      .map((alarm) => ({
        id: alarm.id,
        name: alarm.name.slice(0, 50),
        time: alarm.time,
        leadMinutes: alarm.leadMinutes,
        sound: alarm.sound,
        enabled: alarm.enabled !== false,
        lastFiredDate: typeof alarm.lastFiredDate === 'string' ? alarm.lastFiredDate : null
      }));
  } catch {
    return [];
  }
}

function saveAlarms() {
  localStorage.setItem('alarms', JSON.stringify(alarms));
}

function renderAlarms() {
  alarmList.replaceChildren();
  emptyState.hidden = alarms.length > 0;

  for (const alarm of alarms) {
    const item = document.createElement('li');
    item.className = `alarm-item${alarm.enabled ? '' : ' disabled'}`;

    const details = document.createElement('div');
    details.className = 'alarm-details';
    const title = document.createElement('strong');
    title.textContent = alarm.name;
    const summary = document.createElement('span');
    summary.textContent = `${formatTimeString(alarm.time)} · ${alarm.leadMinutes} min before · ${soundName(alarm.sound)}`;
    details.append(title, summary);

    const actions = document.createElement('div');
    actions.className = 'alarm-actions';
    const enabledLabel = document.createElement('label');
    enabledLabel.className = 'alarm-enable';
    enabledLabel.title = alarm.enabled ? 'Disable alarm' : 'Enable alarm';
    const enabledToggle = document.createElement('input');
    enabledToggle.type = 'checkbox';
    enabledToggle.checked = alarm.enabled;
    enabledToggle.setAttribute('aria-label', `${alarm.enabled ? 'Disable' : 'Enable'} ${alarm.name}`);
    enabledToggle.addEventListener('change', () => {
      alarm.enabled = enabledToggle.checked;
      saveAlarms();
      renderAlarms();
      updateAlarmTimer();
      checkAlarms();
    });
    enabledLabel.append(enabledToggle);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Remove';
    deleteButton.setAttribute('aria-label', `Remove ${alarm.name}`);
    deleteButton.addEventListener('click', () => {
      alarms = alarms.filter((entry) => entry.id !== alarm.id);
      saveAlarms();
      renderAlarms();
      updateAlarmTimer();
    });

    actions.append(enabledLabel, deleteButton);
    item.append(details, actions);
    alarmList.append(item);
  }
}

function updateAlarmTimer() {
  if (alarmTimer !== null) window.clearInterval(alarmTimer);
  alarmTimer = alarms.some((alarm) => alarm.enabled)
    ? window.setInterval(checkAlarms, 1000)
    : null;
}

function checkAlarms() {
  const now = new Date();
  const todayKey = dateKey(now);
  for (const alarm of alarms) {
    if (!alarm.enabled || alarm.lastFiredDate === todayKey) continue;
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);
    const dueAt = new Date(target.getTime() - alarm.leadMinutes * 60_000);
    if (now >= dueAt && now < target) {
      alarm.lastFiredDate = todayKey;
      saveAlarms();
      playSound(alarm.sound);
      if (flashToggle.checked) window.rsvpDesktop.flashWindow();
      statusLabel.textContent = `Reminder: "${alarm.name}" — ${formatTimeString(alarm.time)}.`;
      statusLabel.classList.add('success');
    }
  }
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function setClockMode(mode) {
  clockMode = mode;
  hourModeButton.classList.toggle('active', mode === 'hour');
  minuteModeButton.classList.toggle('active', mode === 'minute');
  renderClock();
}

function setPeriod(period) {
  const [hours, minutes] = timeInput.value.split(':').map(Number);
  const hour12 = hours % 12 || 12;
  const nextHours = period === 'PM' ? hour12 % 12 + 12 : hour12 % 12;
  timeInput.value = `${String(nextHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  renderClock();
}

function selectClockValue(event) {
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(clock.getScreenCTM().inverse());
  const dx = point.x - 120;
  const dy = point.y - 120;
  let angle = Math.atan2(dx, -dy) * 180 / Math.PI;
  if (angle < 0) angle += 360;
  const [hours, minutes] = timeInput.value.split(':').map(Number);

  if (clockMode === 'hour') {
    const hour12 = Math.round(angle / 30) % 12 || 12;
    const nextHours = hours >= 12 ? hour12 % 12 + 12 : hour12 % 12;
    timeInput.value = `${String(nextHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    setClockMode('minute');
  } else {
    const nextMinutes = (Math.round(angle / 6) % 60);
    timeInput.value = `${String(hours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
    renderClock();
  }
}

function stepClockValue(direction) {
  const [hours, minutes] = timeInput.value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  if (clockMode === 'hour') date.setHours(date.getHours() + direction);
  else date.setMinutes(date.getMinutes() + direction);
  timeInput.value = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  renderClock();
}

function renderClock() {
  const [hours, minutes] = timeInput.value.split(':').map(Number);
  const hour12 = hours % 12 || 12;
  amButton.classList.toggle('active', hours < 12);
  pmButton.classList.toggle('active', hours >= 12);
  clockMarks.replaceChildren();

  for (let value = 0; value < 12; value++) {
    const angle = value * Math.PI / 6;
    const label = clockMode === 'hour' ? String(value || 12) : String(value * 5).padStart(2, '0');
    const selected = clockMode === 'hour' ? (value || 12) === hour12 : value === Math.round(minutes / 5) % 12;
    const cx = 120 + Math.sin(angle) * 78;
    const cy = 120 - Math.cos(angle) * 78;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', selected ? '17' : '15');
    circle.setAttribute('class', `clock-number-bg${selected ? ' selected' : ''}`);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', cx);
    text.setAttribute('y', cy + 5);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', `clock-number${selected ? ' selected' : ''}`);
    text.textContent = label;
    clockMarks.append(circle, text);
  }

  const selectedAngle = clockMode === 'hour' ? (hour12 % 12) * 30 : minutes * 6;
  const radians = selectedAngle * Math.PI / 180;
  clockHand.setAttribute('x2', 120 + Math.sin(radians) * 75);
  clockHand.setAttribute('y2', 120 - Math.cos(radians) * 75);
  clock.setAttribute('aria-label', `${clockMode} selection: ${formatTimeString(timeInput.value)}`);
}

function applyOpacity(opacity) {
  opacityValue.value = `${opacity}%`;
  opacityValue.textContent = `${opacity}%`;
  window.rsvpDesktop.setOpacity(opacity / 100);
}

function formatTimeString(value) {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

function soundName(sound) {
  return ({ 'soft-chime': 'Soft chime', 'mellow-bells': 'Mellow bells', 'singing-bowl': 'Singing bowl' })[sound] || 'Soft chime';
}

function playSound(soundNameValue) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    statusLabel.textContent = 'Audio playback is unavailable on this system.';
    return;
  }

  const context = new AudioContext();
  const notes = SOUND_OPTIONS[soundNameValue] || SOUND_OPTIONS['soft-chime'];
  for (const note of notes) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + note.start;
    const duration = note.duration;
    oscillator.type = note.type;
    oscillator.frequency.value = note.frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(note.volume || 0.12, start + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
  window.setTimeout(() => context.close(), 2200);
}
