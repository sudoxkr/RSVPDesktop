(() => {
  // renderer.js still reads these legacy controls during startup, while the
  // visible preferences use monitor-specific IDs. Provide hidden defaults
  // so renderer initialization does not abort before alarm handlers are bound.
  if (!document.getElementById('opacity-slider')) {
    const legacyControls = document.createElement('div');
    legacyControls.hidden = true;
    legacyControls.innerHTML = '<input id="opacity-slider" type="range" min="50" max="100" value="100"><output id="opacity-value">100%</output>';
    document.body.append(legacyControls);
  }

  // Load the corrected import handler before users can submit the text import.
  if (document.getElementById('import-reminders') && !window.__reminderImportLoaded) {
    window.__reminderImportLoaded = true;
    const script = document.createElement('script');
    script.src = 'reminder-import.js';
    document.head.append(script);
  }

  const toggle = document.getElementById('always-on-top-toggle');
  if (!toggle || !window.rsvpDesktop) return;

  const storageKey = 'monitorAlwaysOnTop';
  toggle.checked = localStorage.getItem(storageKey) === 'true';
  window.rsvpDesktop.setMonitorAlwaysOnTop(toggle.checked);

  toggle.addEventListener('change', () => {
    localStorage.setItem(storageKey, String(toggle.checked));
    window.rsvpDesktop.setMonitorAlwaysOnTop(toggle.checked);
  });
})();
