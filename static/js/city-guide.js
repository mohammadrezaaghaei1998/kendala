document.addEventListener('DOMContentLoaded', () => {
    const sort = document.getElementById('cg-tour-sort');
    const grid = document.getElementById('cg-city-tour-grid');

    if (sort && grid) {
        sort.addEventListener('change', () => {
            const cards = Array.from(grid.querySelectorAll('.cg-tour-card'));
            const number = (card, key) => Number(card.dataset[key] || 0);
            cards.sort((a, b) => {
                if (sort.value === 'price-low') return number(a, 'price') - number(b, 'price');
                if (sort.value === 'price-high') return number(b, 'price') - number(a, 'price');
                if (sort.value === 'duration') return number(a, 'days') - number(b, 'days');
                return number(a, 'order') - number(b, 'order');
            });
            cards.forEach(card => grid.appendChild(card));
        });
    }

    const links = Array.from(document.querySelectorAll('.cg-nav-inner a'));
    const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window && sections.length) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    links.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id));
                }
            });
        }, { rootMargin: '-20% 0px -65% 0px' });
        sections.forEach(section => observer.observe(section));
    }
});



document.querySelectorAll('.cg-sticky-nav a, .cg-hero-link').forEach(link => {

    link.addEventListener('click', function (event) {

        const targetId = this.getAttribute('href');

        if (!targetId || !targetId.startsWith('#')) {
            return;
        }

        const target = document.querySelector(targetId);

        if (!target) {
            return;
        }

        event.preventDefault();

        const header = document.querySelector('.kd-nav');
        const stickyNav = document.querySelector('.cg-sticky-nav');

        const headerHeight = header ? header.offsetHeight : 0;
        const stickyHeight = stickyNav ? stickyNav.offsetHeight : 0;

        const offset = headerHeight + stickyHeight + 15;

        const targetPosition =
            target.getBoundingClientRect().top +
            window.scrollY -
            offset;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });

    });

});