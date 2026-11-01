document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('kd-filter-toggle');
  const panel = document.getElementById('kd-search-filters');
  const clear = document.getElementById('kd-clear-search');
  const input = document.getElementById('kd-search-query');
  if (toggle && panel) toggle.addEventListener('click', () => {
    const opening = panel.hidden;
    panel.hidden = !opening;
    toggle.setAttribute('aria-expanded', String(opening));
  });
  if (clear && input) clear.addEventListener('click', () => {input.value = '';input.focus();});
});
