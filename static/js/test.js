(() => {
  const gallery = document.getElementById('kdLightbox');
  if (!gallery) return;
  const photos = [...document.querySelectorAll('.kd-photo img')];
  const viewer = document.getElementById('kdLightboxImage');
  const counter = document.getElementById('kdGalleryCounter');
  let current = 0;
  let previousFocus = null;
  function render() { viewer.src = photos[current].src; viewer.alt = photos[current].alt; counter.textContent = `${current + 1} / ${photos.length}`; }
  function open(index) { previousFocus = document.activeElement; current = index; render(); gallery.hidden = false; document.body.style.overflow = 'hidden'; document.getElementById('kdCloseGallery').focus(); }
  function close() { gallery.hidden = true; document.body.style.overflow = ''; previousFocus?.focus(); }
  function move(delta) { current = (current + delta + photos.length) % photos.length; render(); }
  document.querySelectorAll('.kd-photo').forEach((button, index) => button.addEventListener('click', () => open(index)));
  document.getElementById('kdOpenGallery').addEventListener('click', () => open(0));
  document.getElementById('kdCloseGallery').addEventListener('click', close);
  document.getElementById('kdPrev').addEventListener('click', () => move(-1));
  document.getElementById('kdNext').addEventListener('click', () => move(1));
  gallery.addEventListener('click', event => { if (event.target === gallery) close(); });
  document.addEventListener('keydown', event => { if (gallery.hidden) return; if (event.key === 'Escape') close(); if (event.key === 'ArrowRight') move(1); if (event.key === 'ArrowLeft') move(-1); });
  const navLinks = [...document.querySelectorAll('.kd-anchor-inner a[href^="#"]')];
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (!entry.isIntersecting) return; navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id)); }); }, { rootMargin: '-25% 0px -65% 0px' });
    sections.forEach(section => observer.observe(section));
  }
})();
