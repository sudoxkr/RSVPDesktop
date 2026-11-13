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

  const api = window.rsvpDesktop;

  const topToggle = document.getElementById('always-on-top-toggle');
  if (topToggle && api) {
    topToggle.checked = localStorage.getItem('monitorAlwaysOnTop') === 'true';
    api.setMonitorAlwaysOnTop(topToggle.checked);

    topToggle.addEventListener('change', () => {
      localStorage.setItem('monitorAlwaysOnTop', String(topToggle.checked));
      api.setMonitorAlwaysOnTop(topToggle.checked);
    });
  }

  // Keep the click-through preference connected to Electron's native
  // setIgnoreMouseEvents API. CSS pointer-events alone cannot pass input to
  // applications behind a native window.
  const clickThroughToggle = document.getElementById('click-through-toggle');
  if (clickThroughToggle) {
    clickThroughToggle.checked = localStorage.getItem('monitorClickThrough') === 'true';
    if (api) api.setMonitorClickThrough(clickThroughToggle.checked);

    clickThroughToggle.addEventListener('change', () => {
      localStorage.setItem('monitorClickThrough', String(clickThroughToggle.checked));
      if (api) api.setMonitorClickThrough(clickThroughToggle.checked);
    });
  }
})();
