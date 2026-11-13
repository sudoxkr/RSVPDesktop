(() => {
  const topToggle = document.getElementById('always-on-top-toggle');
  const clickThroughToggle = document.getElementById('click-through-toggle');
  const api = window.rsvpDesktop;

  if (topToggle && api) {
    topToggle.checked = localStorage.getItem('monitorAlwaysOnTop') === 'true';
    api.setMonitorAlwaysOnTop(topToggle.checked);
    topToggle.addEventListener('change', () => {
      localStorage.setItem('monitorAlwaysOnTop', String(topToggle.checked));
      api.setMonitorAlwaysOnTop(topToggle.checked);
    });
  }

  if (clickThroughToggle && api) {
    clickThroughToggle.checked = localStorage.getItem('monitorClickThrough') === 'true';
    api.setMonitorClickThrough(clickThroughToggle.checked);
    clickThroughToggle.addEventListener('change', () => {
      localStorage.setItem('monitorClickThrough', String(clickThroughToggle.checked));
      api.setMonitorClickThrough(clickThroughToggle.checked);
    });
  }
})();
