(() => {
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
