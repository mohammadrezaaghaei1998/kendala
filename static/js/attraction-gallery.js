
(() => {
  const source = document.getElementById('kd-gallery-photos');
  const box = document.getElementById('kdLightbox');

  if (!source || !box) return;

  const photos = JSON.parse(source.textContent);
  if (!photos.length) return;

  const image = document.getElementById('kdLightboxImage');
  const counter = document.getElementById('kdPhotoCounter');

  let index = 0;
  let previousFocus = null;

  function render() {
    image.src = photos[index];
    counter.textContent = `${index + 1} / ${photos.length}`;
  }

  function open(i) {
    previousFocus = document.activeElement;

    index = ((i % photos.length) + photos.length) % photos.length;

    render();
    box.hidden = false;

    document.body.classList.add('kd-gallery-open');
    document.getElementById('kdClose').focus();
  }

  function close() {
    box.hidden = true;
    document.body.classList.remove('kd-gallery-open');

    if (previousFocus) previousFocus.focus();
  }

  function move(n) {
    index = (index + n + photos.length) % photos.length;
    render();
  }

  document.querySelectorAll('[data-kd-gallery]').forEach(el => {
    const i = Number(el.dataset.kdGallery);

    el.addEventListener('click', () => open(i));

    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(i);
      }
    });
  });

  document.getElementById('kdClose').addEventListener('click', close);

  document.getElementById('kdPrev').addEventListener('click', () => move(-1));

  document.getElementById('kdNext').addEventListener('click', () => move(1));

  box.addEventListener('click', e => {
    if (e.target === box) close();
  });

  document.addEventListener('keydown', e => {
    if (box.hidden) return;

    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') move(-1);
    if (e.key === 'ArrowRight') move(1);
  });
})();
