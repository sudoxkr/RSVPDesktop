(() => {
  const topToggle = document.getElementById('always-on-top-toggle');
  const clickThroughToggle = document.getElementById('click-through-toggle');
  const opacitySlider = document.getElementById('opacity-slider');
  const opacityOutput = document.getElementById('opacity-value');
  const backgroundPicker = document.getElementById('monitor-background-color');
  const fontPicker = document.getElementById('monitor-font-color');
  const resetButton = document.getElementById('reset-monitor-theme');
  const api = window.rsvpDesktop;

  function loadColor(key, fallback) {
    const value = localStorage.getItem(key);
    return /^#[\da-f]{6}$/i.test(value || '') ? value : fallback;
  }

  function applyColor(key, picker) {
    if (!picker) return;
    localStorage.setItem(key, picker.value);
  }

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

  if (backgroundPicker) {
    backgroundPicker.value = loadColor('monitorBackgroundColor', '#f6f7fb');
    backgroundPicker.addEventListener('input', () => applyColor('monitorBackgroundColor', backgroundPicker));
    applyColor('monitorBackgroundColor', backgroundPicker);
  }

  if (fontPicker) {
    fontPicker.value = loadColor('monitorFontColor', '#233047');
    fontPicker.addEventListener('input', () => applyColor('monitorFontColor', fontPicker));
    applyColor('monitorFontColor', fontPicker);
  }

  if (opacitySlider) {
    const stored = Number(localStorage.getItem('windowOpacity'));
    opacitySlider.value = String(Number.isFinite(stored) && stored >= 50 && stored <= 100 ? stored : 100);
    if (opacityOutput) {
      opacityOutput.value = `${opacitySlider.value}%`;
      opacityOutput.textContent = `${opacitySlider.value}%`;
    }
    opacitySlider.addEventListener('input', () => {
      if (opacityOutput) {
        opacityOutput.value = `${opacitySlider.value}%`;
        opacityOutput.textContent = `${opacitySlider.value}%`;
      }
      localStorage.setItem('windowOpacity', opacitySlider.value);
      if (api) api.setOpacity(Number(opacitySlider.value) / 100);
    });
  }

  resetButton?.addEventListener('click', () => {
    localStorage.removeItem('monitorBackgroundColor');
    localStorage.removeItem('monitorFontColor');
    if (backgroundPicker) backgroundPicker.value = '#f6f7fb';
    if (fontPicker) fontPicker.value = '#233047';
    applyColor('monitorBackgroundColor', backgroundPicker);
    applyColor('monitorFontColor', fontPicker);
  });
})();
