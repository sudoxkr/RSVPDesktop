const list = document.getElementById('monitor-list');
const empty = document.getElementById('monitor-empty');
const updated = document.getElementById('monitor-updated');

function readAlarms() {
  try {
    const value = JSON.parse(localStorage.getItem('alarms') || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getNext(alarm, now) {
  if (!alarm.enabled || alarm.completed) return null;
  if (Number.isFinite(alarm.fireAt)) return new Date(alarm.fireAt);
  const [hours, minutes] = String(alarm.time).split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next <= now || alarm.lastFiredDate === dateKey(now)) next.setDate(next.getDate() + 1);
  return next;
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function render() {
  const now = new Date();
  const alarms = readAlarms().map((alarm) => ({ alarm, next: getNext(alarm, now) }))
    .sort((a, b) => (a.next?.getTime() ?? Infinity) - (b.next?.getTime() ?? Infinity));
  list.replaceChildren();
  empty.hidden = alarms.length > 0;

  for (const { alarm, next } of alarms) {
    const item = document.createElement('li');
    item.className = `monitor-item${alarm.enabled ? '' : ' disabled'}`;
    const top = document.createElement('div');
    top.className = 'monitor-item-top';
    const name = document.createElement('strong');
    name.textContent = alarm.name || 'Reminder';
    const time = document.createElement('time');
    time.textContent = next ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(next) : alarm.time || '—';
    top.append(name, time);
    const bottom = document.createElement('div');
    bottom.className = 'monitor-item-bottom';
    const countdown = document.createElement('span');
    countdown.className = 'countdown';
    if (!alarm.enabled) countdown.textContent = 'Disabled';
    else if (!next) countdown.textContent = 'Completed';
    else countdown.textContent = `In ${formatRemaining(next.getTime() - now.getTime())}`;
    const kind = document.createElement('span');
    kind.textContent = Number.isFinite(alarm.fireAt) ? 'Imported · one time' : 'Daily';
    bottom.append(countdown, kind);
    item.append(top, bottom);
    list.append(item);
  }
  updated.textContent = `Updated ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(now)}`;
}

function formatRemaining(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.slice(0, 3).join(' ');
}

render();
window.setInterval(render, 1000);
window.addEventListener('storage', render);
