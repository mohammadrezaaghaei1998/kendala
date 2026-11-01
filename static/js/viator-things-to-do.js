
(() => {
    'use strict';

    // =========================================================
    // 1. ELEMENTS & STATE
    // =========================================================

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

    let cards = $$('.kd-tour-card', grid);

    let selectedCard = null;
    let lastFocus = null;

    let destinationController = null;
    let destinationRequestId = 0;

    const money = value =>
        '$' + Number(value || 0).toLocaleString('en-US');

    const selected = name =>
        $$(`input[name="${name}"]:checked`, filters)
            .map(input => input.value);


    // =========================================================
    // 2. FILTERING & SORTING
    // =========================================================

    function apply() {
        const types = selected('experience');
        const maximum = Number(price.value);

        const visible = cards.filter(card => {
            const category = (card.dataset.type || '').toLowerCase();

            const cost = card.dataset.price === ''
                ? null
                : Number(card.dataset.price);

            const matchesType =
                !types.length ||
                types.some(type => type.toLowerCase() === category);

            const matchesPrice =
                cost === null ||
                maximum === 5000 ||
                cost <= maximum;

            return matchesType && matchesPrice;
        });

        const sorter = {
            'price-asc': (a, b) => {
                const aPrice = a.dataset.price
                    ? Number(a.dataset.price)
                    : Infinity;

                const bPrice = b.dataset.price
                    ? Number(b.dataset.price)
                    : Infinity;

                return aPrice - bPrice;
            },

            'price-desc': (a, b) => {
                const aPrice = a.dataset.price
                    ? Number(a.dataset.price)
                    : -1;

                const bPrice = b.dataset.price
                    ? Number(b.dataset.price)
                    : -1;

                return bPrice - aPrice;
            },

            'name': (a, b) =>
                (a.dataset.title || '').localeCompare(
                    b.dataset.title || ''
                ),

            'recommended': () => 0
        }[sort.value] || (() => 0);

        // Sort the existing cards without rebuilding them.
        [...visible].sort(sorter).forEach(card => {
            grid.appendChild(card);
        });

        const visibleSet = new Set(visible);

        cards.forEach(card => {
            const isVisible = visibleSet.has(card);

            card.hidden = !isVisible;
            card.style.display = isVisible ? '' : 'none';
        });

        // Update the result counter.
        const totalText = count.dataset.total || '';
        const hasTotal = totalText !== '';
        const total = Number(totalText);

        const filtersActive =
            types.length > 0 || maximum < 5000;

        if (filtersActive) {
            count.textContent =
                `${visible.length} matching experience${visible.length === 1 ? '' : 's'} displayed`;
        } else if (hasTotal) {
            count.textContent =
                `${total} experience${total === 1 ? '' : 's'} found`;
        } else {
            count.textContent =
                `${visible.length} experience${visible.length === 1 ? '' : 's'} displayed`;
        }

        foot.textContent = '';

        empty.hidden =
            visible.length !== 0 || cards.length === 0;

        priceLabel.textContent =
            money(maximum) + (maximum === 5000 ? '+' : '');

        $('#kd-type-count').textContent = types.length || '';

        // Active filter chips.
        chips.replaceChildren();

        $$('input[type=checkbox]:checked', filters).forEach(input => {
            const chip = document.createElement('button');

            chip.type = 'button';
            chip.className = 'kd-chip';

            chip.textContent =
                `${input.closest('label').innerText.trim()} ×`;

            chip.addEventListener('click', () => {
                input.checked = false;
                apply();
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
                apply();
            });

            chips.appendChild(chip);
        }

        chips.hidden = chips.childElementCount === 0;
    }


    // =========================================================
    // 3. GRID LOADING ANIMATION
    // =========================================================

    function setGridLoading(loading) {
        if (gridLoader) {
            gridLoader.hidden = !loading;
        }

        grid.classList.toggle('kd-is-loading', loading);
        grid.setAttribute('aria-busy', String(loading));
    }


    // =========================================================
    // 4. AJAX DESTINATION SWITCHING
    // =========================================================

    async function loadDestination(url, pushHistory = true) {
        const requestId = ++destinationRequestId;

        if (destinationController) {
            destinationController.abort();
        }

        const controller = new AbortController();
        destinationController = controller;

        setGridLoading(true);

        const loadingStartedAt = performance.now();
        const minimumLoadingTime = 2000

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }





            const html = await response.text();

            // Keep the loader visible for at least 2 seconds.
            const elapsed = performance.now() - loadingStartedAt;
            const remaining = Math.max(0, minimumLoadingTime - elapsed);

            if (remaining > 0) {
                await new Promise(resolve => setTimeout(resolve, remaining));
            }

            // Ignore responses from outdated requests.
            if (requestId !== destinationRequestId) return;














            const doc = new DOMParser().parseFromString(
                html,
                'text/html'
            );

            const newGrid = doc.querySelector('#kd-card-grid');
            const newCount = doc.querySelector('#kd-result-count');
            const newCities = doc.querySelector('.kd-city-list');
            const newIntro = doc.querySelector('.kd-intro');

            if (!newGrid || !newCount || !newCities) {
                throw new Error('Invalid destination response');
            }

            // Replace only the experience cards.
            grid.replaceChildren(
                ...Array.from(newGrid.childNodes)
            );

            cards = $$('.kd-tour-card', grid);

            // Update the selected destination's count.
            count.dataset.total = newCount.dataset.total || '';

            // Update destination sidebar and active city.
            const currentCities = $('.kd-city-list');

            if (currentCities) {
                currentCities.replaceChildren(
                    ...Array.from(newCities.childNodes)
                );
            }

            // Update the page introduction.
            const currentIntro = $('.kd-intro');

            if (currentIntro && newIntro) {
                currentIntro.replaceChildren(
                    ...Array.from(newIntro.childNodes)
                );
            }

            // Update server-side error messages.
            const results = $('.kd-results');
            const oldError = results.querySelector('.kd-no-tours');
            const newError = doc.querySelector('.kd-no-tours');

            if (oldError) {
                oldError.remove();
            }

            if (newError) {
                results.insertBefore(
                    newError.cloneNode(true),
                    gridLoader || grid
                );
            }

            // Reset filters when switching destinations.
            $$('input[type=checkbox]', filters).forEach(input => {
                input.checked = false;
            });

            price.value = 5000;
            sort.value = 'recommended';

            // Update browser history without a page refresh.
            if (pushHistory) {
                history.pushState({}, '', url);
            }

            // Apply filters and update the counter.
            apply();

        } catch (error) {
            if (error.name === 'AbortError') return;
            if (requestId !== destinationRequestId) return;

            console.error(
                'Ken Dala destination loading failed:',
                error
            );

            alert(
                'Unable to load experiences. Please try again.'
            );

        } finally {
            if (requestId === destinationRequestId) {
                setGridLoading(false);
                destinationController = null;
            }
        }
    }


    // =========================================================
    // 5. DESTINATION CLICK HANDLING
    // =========================================================

    filters.addEventListener('click', event => {
        const link = event.target.closest(
            '.kd-city-option[href]'
        );

        if (!link) return;

        // Allow normal browser shortcuts.
        if (
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        event.preventDefault();

        // Ignore repeated clicks on the current destination.
        const requested = new URL(link.href);
        const current = new URL(window.location.href);

        if (
            requested.pathname === current.pathname &&
            requested.search === current.search &&
            !destinationController
        ) {
            return;
        }

        loadDestination(link.href);
    });


    // Browser Back / Forward support.
    window.addEventListener('popstate', () => {
        loadDestination(window.location.href, false);
    });


    // =========================================================
    // 6. CLEAR ALL FILTERS
    // =========================================================

    function clearAll() {
        const hasCity = new URLSearchParams(
            window.location.search
        ).has('city');

        if (hasCity) {
            loadDestination(window.location.pathname);
            return;
        }

        $$('input[type=checkbox]', filters).forEach(input => {
            input.checked = false;
        });

        price.value = 5000;
        sort.value = 'recommended';

        apply();
    }


    // =========================================================
    // 7. FILTER EVENT LISTENERS
    // =========================================================

    $$('input', filters).forEach(input => {
        input.addEventListener('input', apply);
    });

    sort.addEventListener('change', apply);

    $('#kd-clear-all').addEventListener(
        'click',
        clearAll
    );

    $('#kd-empty-clear').addEventListener(
        'click',
        clearAll
    );


    // Filter accordion controls.
    $$('.kd-filter-head', filters).forEach(button => {
        if (button.tagName !== 'BUTTON') return;

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


    // =========================================================
    // 8. RESPONSIVE FILTER SIDEBAR
    // =========================================================

    function updateToggle() {
        const mobile = matchMedia(
            '(max-width:767px)'
        ).matches;

        const visible = mobile
            ? layout.classList.contains('mobile-filters-open')
            : !layout.classList.contains('filters-hidden');

        toggle.querySelector('span').textContent =
            visible ? 'Hide Filters' : 'Show Filters';

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


    // =========================================================
    // 9. EXPERIENCE DETAILS
    // =========================================================

    function goToDetails(card) {
        if (card.dataset.detailUrl) {
            window.location.assign(card.dataset.detailUrl);
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
            card.dataset.price
                ? money(card.dataset.price) + ' / person'
                : 'Check current price';

        $('#kd-drawer-meta').textContent =
            card.dataset.type || '';

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


    // Event delegation ensures newly loaded cards work.
    grid.addEventListener('click', event => {
        const button = event.target.closest(
            '.kd-card-action'
        );

        if (!button) return;

        const card = button.closest('.kd-tour-card');

        if (!card) return;

        if (matchMedia('(max-width:991px)').matches) {
            goToDetails(card);
        } else {
            openDrawer(card);
        }
    });


    $('#kd-drawer-close').addEventListener(
        'click',
        closeDrawer
    );

    overlay.addEventListener(
        'click',
        closeDrawer
    );

    $('#kd-drawer-view').addEventListener('click', () => {
        if (selectedCard) {
            goToDetails(selectedCard);
        }
    });


    // =========================================================
    // 10. DRAWER KEYBOARD ACCESSIBILITY
    // =========================================================

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


    // =========================================================
    // 11. INITIALIZE
    // =========================================================

    apply();
    updateToggle();

})();
