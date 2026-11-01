(() => {
  const hero = document.querySelector('[data-hero]');
  if (hero) {
    const slides = [...hero.querySelectorAll('[data-slide]')];
    const dots = hero.querySelector('[data-hero-dots]');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let index = 0, timer;
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button'; dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => show(i)); dots.append(dot);
    });
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        const video = slide.querySelector('video');
        if (video) { if (active && !reduceMotion) video.play().catch(() => {}); else video.pause(); }
      });
      [...dots.children].forEach((dot, i) => dot.classList.toggle('is-active', i === index));
      clearTimeout(timer);
      if (!reduceMotion && slides.length > 1 && !document.hidden) timer = setTimeout(() => show(index + 1), 7500);
    }
    hero.querySelector('[data-hero-prev]').addEventListener('click', () => show(index - 1));
    hero.querySelector('[data-hero-next]').addEventListener('click', () => show(index + 1));
    document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(timer); slides.forEach(s => s.querySelector('video')?.pause()); } else show(index); });
    show(0);
  }
  document.querySelectorAll('[data-scroll-next], [data-scroll-prev]').forEach(button => {
    button.addEventListener('click', () => {
      const track = document.getElementById(button.dataset.scrollNext || button.dataset.scrollPrev);
      if (!track) return;
      const card = track.querySelector('.kd-event-card');
      const step = card ? card.getBoundingClientRect().width + 17 : track.clientWidth * .8;
      track.scrollBy({left: step * (button.hasAttribute('data-scroll-next') ? 1 : -1), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    });
  });



  const countryFilter = document.getElementById("kd-country-filter");
  const cityFilter = document.getElementById("kd-city-filter");

  if (countryFilter && cityFilter) {
      const cityOptions = [...cityFilter.options];

      function updateCities() {
          const selectedCountry = countryFilter.value;

          cityOptions.forEach((option) => {
              if (!option.value) return;

              option.hidden = Boolean(
                  selectedCountry &&
                  option.dataset.country !== selectedCountry
              );
          });

          const selectedOption = cityFilter.selectedOptions[0];

          if (selectedOption && selectedOption.hidden) {
              cityFilter.value = "";
          }
      }

      countryFilter.addEventListener("change", updateCities);
      updateCities();
  }
})();
