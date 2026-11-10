const form = document.getElementById('reminder-form');
const timeInput = document.getElementById('reminder-time');
const leadInput = document.getElementById('lead-minutes');
const setButton = document.getElementById('set-button');
const cancelButton = document.getElementById('cancel-button');
const statusLabel = document.getElementById('status');

let scheduledFor = null;
let reminderAt = null;
let timer = null;

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const [hours, minutes] = timeInput.value.split(':').map(Number);
  const now = new Date();
  scheduledFor = new Date(now);
  scheduledFor.setHours(hours, minutes, 0, 0);
  if (scheduledFor <= now) scheduledFor.setDate(scheduledFor.getDate() + 1);

  const leadMinutes = Number(leadInput.value);
  if (!Number.isInteger(leadMinutes) || leadMinutes < 1 || leadMinutes > 60) {
    statusLabel.textContent = 'Choose a lead time between 1 and 60 minutes.';
    return;
  }

  reminderAt = new Date(scheduledFor.getTime() - leadMinutes * 60_000);
  setButton.disabled = true;
  timeInput.disabled = true;
  leadInput.disabled = true;
  cancelButton.disabled = false;
  timer = window.setInterval(updateCountdown, 1000);
  updateCountdown();
});

cancelButton.addEventListener('click', cancelReminder);

function updateCountdown() {
  const remainingMs = reminderAt.getTime() - Date.now();
  if (remainingMs <= 0) {
    window.clearInterval(timer);
    timer = null;
    playGentleChime();
    statusLabel.textContent = `It's almost time — your reminder is for ${formatTime(scheduledFor)}.`;
    statusLabel.classList.add('success');
    restoreControls();
    return;
  }

  const seconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const days = scheduledFor.toDateString() === new Date().toDateString() ? 'today' : 'tomorrow';
  const remaining = hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  statusLabel.textContent = `Reminder ${days} at ${formatTime(reminderAt)} · ${remaining} remaining`;
  statusLabel.classList.remove('success');
}

function cancelReminder() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  scheduledFor = null;
  reminderAt = null;
  statusLabel.textContent = 'Reminder cancelled.';
  statusLabel.classList.remove('success');
  restoreControls();
}

function restoreControls() {
  setButton.disabled = false;
  timeInput.disabled = false;
  leadInput.disabled = false;
  cancelButton.disabled = true;
}

function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

function playGentleChime() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    statusLabel.textContent = 'Your reminder is due, but audio playback is unavailable.';
    return;
  }

  const audio = new AudioContext();
  const notes = [{ frequency: 659.25, start: 0 }, { frequency: 523.25, start: 0.58 }];
  for (const note of notes) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = note.frequency;
    gain.gain.setValueAtTime(0, audio.currentTime + note.start);
    gain.gain.linearRampToValueAtTime(0.13, audio.currentTime + note.start + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + note.start + 0.55);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(audio.currentTime + note.start);
    oscillator.stop(audio.currentTime + note.start + 0.56);
  }
  window.setTimeout(() => audio.close(), 1400);
}
