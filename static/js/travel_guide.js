(() => {
  const buttons = document.querySelectorAll('.tl-tabs button');
  const destinations = document.querySelectorAll('.tl-destination');
  const count = document.getElementById('countryCount');
  buttons.forEach(button => button.addEventListener('click', () => {
    const country = button.dataset.country;
    buttons.forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
    let visible = 0;
    destinations.forEach(item => { const show = country === 'all' || item.dataset.country === country; item.hidden = !show; if (show) visible++; });
    count.textContent = `${String(visible).padStart(2, '0')} DESTINATION${visible === 1 ? '' : 'S'}`;
  }));
})();
