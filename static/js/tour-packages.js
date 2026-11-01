
(() => {
    'use strict';

    // =====================================================
    // 1. ELEMENTS & STATE
    // =====================================================

    const root = document.getElementById('kd-packages');
    if (!root) return;

    const $ = (selector, scope = document) =>
        scope.querySelector(selector);

    const $$ = (selector, scope = document) =>
        [...scope.querySelectorAll(selector)];

    const filters = $('#kd-filters');
    const layout = $('#kd-layout');
    const toggle = $('#kd-toggle-filters');

    const grid = $('#kd-card-grid');
    const gridLoader = $('#kd-grid-loader');

    const count = $('#kd-result-count');
    const foot = $('#kd-results-foot');
    const empty = $('#kd-empty');
    const chips = $('#kd-active-filters');

    const sort = $('#kd-sort');
    const price = $('#kd-max-price');
    const priceLabel = $('#kd-price-label');

    const drawer = $('#kd-drawer');
    const overlay = $('#kd-overlay');

    const cards = $$('.kd-tour-card', grid);

    let selectedCard = null;
    let lastFocus = null;
    let filterTimer = null;

    const FILTER_LOADING_TIME = 2000;

    const money = value =>
        '$' + Number(value || 0).toLocaleString('en-US');

    const selected = name =>
        $$(`input[name="${name}"]:checked`, filters)
            .map(input => input.value);

    const matches = (card, key, choices) => {
        if (!choices.length) return true;

        const values = (card.dataset[key] || '')
            .toLowerCase()
            .split(',')
            .map(value => value.trim());

        return choices.some(choice =>
            values.includes(choice.toLowerCase())
        );
    };


    // =====================================================
    // 2. LOADING ANIMATION
    // =====================================================

    function setGridLoading(loading) {
        if (gridLoader) {
            gridLoader.hidden = !loading;
        }

        grid.classList.toggle('kd-is-loading', loading);
        grid.setAttribute('aria-busy', String(loading));
    }

    function applyWithLoader() {
        if (filterTimer !== null) {
            clearTimeout(filterTimer);
        }

        setGridLoading(true);

        filterTimer = setTimeout(() => {
            apply();
            setGridLoading(false);
            filterTimer = null;
        }, FILTER_LOADING_TIME);
    }


    // =====================================================
    // 3. FILTERING & SORTING
    // =====================================================

    function apply() {
        const destinations = selected('destination');
        const types = selected('experience');
        const durations = selected('duration');
        const availability = selected('availability');

        const maximum = Number(price.value);

        const visible = cards.filter(card => {
            const days = Number(card.dataset.duration);
            const cost = Number(card.dataset.price);

            const durationMatch =
                !durations.length ||
                durations.some(value => {
                    if (value === '1-3') {
                        return days >= 1 && days <= 3;
                    }

                    if (value === '4-7') {
                        return days >= 4 && days <= 7;
                    }

                    return days >= 8;
                });

            const availabilityMatch = availability.every(value =>
                value === 'offer'
                    ? card.dataset.offer === 'true'
                    : card.dataset.available === 'true'
            );

            return (
                matches(card, 'destination', destinations) &&
                matches(card, 'type', types) &&
                durationMatch &&
                cost <= maximum &&
                availabilityMatch
            );
        });

        const sorter = {
            'price-asc': (a, b) =>
                Number(a.dataset.price) - Number(b.dataset.price),

            'price-desc': (a, b) =>
                Number(b.dataset.price) - Number(a.dataset.price),

            'duration': (a, b) =>
                Number(a.dataset.duration) - Number(b.dataset.duration),

            'name': (a, b) =>
                (a.dataset.title || '').localeCompare(
                    b.dataset.title || ''
                ),

            'recommended': () => 0
        }[sort.value] || (() => 0);

        // Sort visible cards.
        [...visible].sort(sorter).forEach(card => {
            grid.appendChild(card);
        });

        const visibleSet = new Set(visible);

        // Show matching cards and hide others.
        cards.forEach(card => {
            const isVisible = visibleSet.has(card);

            card.hidden = !isVisible;
            card.style.display = isVisible ? '' : 'none';
        });

        // Update the result counter.
        count.textContent =
            `${visible.length} tour${visible.length === 1 ? '' : 's'} found`;

        // Hide the additional bottom counter.
        if (foot) {
            foot.textContent = '';
        }

        empty.hidden = visible.length !== 0;

        priceLabel.textContent =
            money(maximum) + (maximum === 5000 ? '+' : '');

        $('#kd-dest-count').textContent =
            destinations.length || '';

        $('#kd-type-count').textContent =
            types.length || '';

        // Update active filter chips.
        chips.replaceChildren();

        $$('input[type=checkbox]:checked', filters).forEach(input => {
            const chip = document.createElement('button');

            chip.type = 'button';
            chip.className = 'kd-chip';

            chip.textContent =
                `${input.closest('label').innerText.trim()} ×`;

            chip.addEventListener('click', () => {
                input.checked = false;
                applyWithLoader();
            });

            chips.appendChild(chip);
        });

        if (maximum < 5000) {
            const chip = document.createElement('button');

            chip.type = 'button';
            chip.className = 'kd-chip';

            chip.textContent = `Under ${money(maximum)} ×`;

            chip.addEventListener('click', () => {
                price.value = 5000;
                applyWithLoader();
            });

            chips.appendChild(chip);
        }

        chips.hidden = chips.childElementCount === 0;
    }


    // =====================================================
    // 4. CLEAR ALL FILTERS
    // =====================================================

    function clearAll() {
        $$('input[type=checkbox]', filters).forEach(input => {
            input.checked = false;
        });

        price.value = 5000;
        sort.value = 'recommended';

        applyWithLoader();
    }


    // =====================================================
    // 5. FILTER EVENT LISTENERS
    // =====================================================

    $$('input[type=checkbox]', filters).forEach(input => {
        input.addEventListener('change', applyWithLoader);
    });

    price.addEventListener('input', applyWithLoader);

    sort.addEventListener('change', applyWithLoader);

    $('#kd-clear-all').addEventListener('click', clearAll);

    $('#kd-empty-clear').addEventListener('click', clearAll);


    // =====================================================
    // 6. FILTER ACCORDIONS
    // =====================================================

    $$('.kd-filter-head', filters).forEach(button => {
        button.addEventListener('click', () => {
            const expanded =
                button.getAttribute('aria-expanded') === 'true';

            button.setAttribute(
                'aria-expanded',
                String(!expanded)
            );

            if (button.nextElementSibling) {
                button.nextElementSibling.hidden = expanded;
            }
        });
    });


    // =====================================================
    // 7. RESPONSIVE FILTER SIDEBAR
    // =====================================================

    function updateToggle() {
        const mobile = matchMedia(
            '(max-width:767px)'
        ).matches;

        const visible = mobile
            ? layout.classList.contains('mobile-filters-open')
            : !layout.classList.contains('filters-hidden');

        const label = toggle.querySelector('span');

        if (label) {
            label.textContent =
                visible ? 'Hide Filters' : 'Show Filters';
        }

        toggle.setAttribute(
            'aria-expanded',
            String(visible)
        );
    }

    toggle.addEventListener('click', () => {
        const mobile = matchMedia(
            '(max-width:767px)'
        ).matches;

        if (mobile) {
            layout.classList.toggle('mobile-filters-open');
        } else {
            layout.classList.toggle('filters-hidden');
        }

        updateToggle();
    });

    $('#kd-mobile-apply').addEventListener('click', () => {
        layout.classList.remove('mobile-filters-open');
        updateToggle();
    });

    window.addEventListener('resize', updateToggle);


    // =====================================================
    // 8. TOUR DETAILS
    // =====================================================

    function goToDetails(card) {
        const url = card.dataset.detailUrl;

        if (url && url !== '#') {
            window.location.assign(url);
        } else {
            console.info(
                'Connect data-detail-url to your Django tour details URL.'
            );
        }
    }

    function openDrawer(card) {
        selectedCard = card;
        lastFocus = document.activeElement;

        $('#kd-drawer-title').textContent =
            card.dataset.title || '';

        $('#kd-drawer-subtitle').textContent =
            card.dataset.title || '';

        $('#kd-drawer-description').textContent =
            card.dataset.description || '';

        $('#kd-drawer-price').textContent =
            money(card.dataset.price) + ' / person';

        $('#kd-drawer-meta').textContent =
            `${card.dataset.destination || ''} · ` +
            `${card.dataset.duration || ''} days · ` +
            `${(card.dataset.type || '').replaceAll(',', ' / ')}`;

        const image = $('#kd-drawer-image');

        image.src = card.dataset.image || '';
        image.alt = card.dataset.title || '';

        overlay.hidden = false;

        drawer.setAttribute('aria-hidden', 'false');

        document.body.classList.add('kd-drawer-open');

        requestAnimationFrame(() => {
            overlay.classList.add('is-visible');
            drawer.classList.add('is-open');

            $('#kd-drawer-close').focus();
        });
    }

    function closeDrawer() {
        drawer.classList.remove('is-open');
        overlay.classList.remove('is-visible');

        drawer.setAttribute('aria-hidden', 'true');

        document.body.classList.remove('kd-drawer-open');

        setTimeout(() => {
            if (!drawer.classList.contains('is-open')) {
                overlay.hidden = true;
            }
        }, 350);

        if (lastFocus && lastFocus.isConnected) {
            lastFocus.focus();
        }
    }


    // =====================================================
    // 9. TOUR CARD ACTIONS
    // =====================================================

    grid.addEventListener('click', event => {
        const button = event.target.closest('.kd-card-action');

        if (!button) return;

        const card = button.closest('.kd-tour-card');

        if (!card) return;

        if (matchMedia('(max-width:991px)').matches) {
            goToDetails(card);
        } else {
            openDrawer(card);
        }
    });

    $('#kd-drawer-close').addEventListener('click', closeDrawer);

    overlay.addEventListener('click', closeDrawer);

    $('#kd-drawer-view').addEventListener('click', () => {
        if (selectedCard) {
            goToDetails(selectedCard);
        }
    });


    // =====================================================
    // 10. DRAWER KEYBOARD ACCESSIBILITY
    // =====================================================

    document.addEventListener('keydown', event => {
        if (!drawer.classList.contains('is-open')) return;

        if (event.key === 'Escape') {
            closeDrawer();
            return;
        }

        if (event.key !== 'Tab') return;

        const focusables = $$(
            'button:not([disabled]), a[href]',
            drawer
        ).filter(element => element.offsetParent !== null);

        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (
            event.shiftKey &&
            document.activeElement === first
        ) {
            event.preventDefault();
            last.focus();
        } else if (
            !event.shiftKey &&
            document.activeElement === last
        ) {
            event.preventDefault();
            first.focus();
        }
    });


    // =====================================================
    // 11. INITIALIZE
    // =====================================================

    apply();
    updateToggle();

})();
