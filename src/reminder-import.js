(() => {
  const importButton = document.getElementById('import-reminders');
  const reminderText = document.getElementById('reminder-text');
  const importStatus = document.getElementById('import-status');
  const soundInput = document.getElementById('alarm-sound');

  if (!importButton || !reminderText || !importStatus) return;

  function parseReminder(line, importedAt, sound) {
    const match = line.match(/^(.+?)\s*:\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\s+in\s+(a|an|\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?|days?)\s*$/i);
    if (!match) return { error: "couldn't parse it." };

    const name = match[1].replace(/\s*\(\d+\)\s*$/, '').trim();
    let hour = Number(match[2]);
    const minute = Number(match[3]);
    const second = Number(match[4] || 0);
    const period = match[5].toUpperCase();
    if (!name || hour < 1 || hour > 12 || minute > 59 || second > 59) {
      return { error: 'invalid name or time.' };
    }

    hour = hour % 12 + (period === 'PM' ? 12 : 0);
    const amount = ['a', 'an'].includes(match[6].toLowerCase()) ? 1 : Number(match[6]);
    const unit = match[7].toLowerCase();
    const durationMs = unit.startsWith('d')
      ? amount * 86_400_000
      : amount * (unit.startsWith('h') ? 3_600_000 : 60_000);
    if (!Number.isFinite(durationMs) || durationMs <= 0 || (unit.startsWith('d') && !Number.isInteger(amount))) {
      return { error: 'invalid remaining duration.' };
    }

    // The relative duration selects the calendar day only. The explicit clock
    // text (e.g. 8:44:35 PM) remains the reminder's actual local time.
    const target = new Date(importedAt.getTime() + durationMs);
    target.setHours(hour, minute, second, 0);
    if (!Number.isFinite(target.getTime()) || target <= importedAt) {
      return { error: 'the stated time and remaining duration do not describe a future reminder.' };
    }

    return {
      alarm: {
        id: crypto.randomUUID(),
        name: name.slice(0, 80),
        time: `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`,
        leadMinutes: 5,
        sound,
        enabled: true,
        lastFiredDate: null,
        fireAt: target.getTime(),
        completed: false
      }
    };
  }

  // Capture before renderer.js's legacy importer so this corrected parser is
  // used without allowing the old duration-based timestamp calculation to run.
  document.addEventListener('click', (event) => {
    if (event.target !== importButton) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const lines = reminderText.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const importedAt = new Date();
    const parsed = [];
    const errors = [];
    for (const [index, line] of lines.entries()) {
      const result = parseReminder(line, importedAt, soundInput?.value || 'soft-chime');
      if (result.alarm) parsed.push(result.alarm);
      else errors.push(`Line ${index + 1}: ${result.error}`);
    }

    if (parsed.length) {
      let existing = [];
      try {
        const stored = JSON.parse(localStorage.getItem('alarms') || '[]');
        if (Array.isArray(stored)) existing = stored;
      } catch {
        // Replace invalid stored data with the successfully imported alarms.
      }
      localStorage.setItem('alarms', JSON.stringify([...existing, ...parsed]));
      window.dispatchEvent(new Event('alarms:imported'));
    }
    importStatus.textContent = `${parsed.length} reminder${parsed.length === 1 ? '' : 's'} imported.${errors.length ? ` ${errors.join(' ')}` : ''}`;
  }, true);
})();
