(() => {
  const card = document.querySelector('.monitor-card');
  const list = document.getElementById('monitor-list');
  if (!card || !list) return;

  function fitRows() {
    const count = list.children.length;
    list.style.setProperty('--alarm-count', String(Math.max(1, count)));

    const bounds = list.getBoundingClientRect();
    const rowHeight = bounds.height / Math.max(1, count);
    // Each row needs roughly 36px at scale 1 for the name/time and countdown.
    // Scale text and spacing down for dense lists or small window sizes so all
    // equal-height grid tracks remain visible without introducing scrolling.
    const scale = Math.max(0.45, Math.min(1, rowHeight / 36, bounds.width / 220));
    card.style.setProperty('--monitor-scale', String(scale));
  }

  const observer = new ResizeObserver(fitRows);
  observer.observe(card);
  observer.observe(list);
  new MutationObserver(fitRows).observe(list, { childList: true });
  window.addEventListener('resize', fitRows);
  fitRows();
})();
