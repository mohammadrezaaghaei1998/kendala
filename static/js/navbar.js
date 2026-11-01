
document.addEventListener("DOMContentLoaded", () => {

    const navbar = document.getElementById("kd-nav");
    if (!navbar) return;

    const menuToggle = navbar.querySelector(".kd-nav-toggle");
    const menuPanel = navbar.querySelector(".kd-nav-panel");

    const searchTrigger = navbar.querySelector(".kd-nav-search-trigger");
    const searchPanel = navbar.querySelector(".kd-nav-search-panel");
    const searchClose = navbar.querySelector(".kd-nav-search-close");
    const searchInput = navbar.querySelector("#kd-nav-search-input");
    const searchForm = navbar.querySelector(".kd-nav-search-form");

    const backdrop = document.getElementById("kd-nav-backdrop");

    let lastFocusedElement = null;

    function syncBackdrop() {
        const isActive =
            navbar.classList.contains("is-open") ||
            navbar.classList.contains("is-search-open");

        document.body.classList.toggle("kd-nav-active", isActive);
    }

    function closeMenu() {
        navbar.classList.remove("is-open");

        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");

        menuPanel.setAttribute("aria-hidden", "true");
        menuPanel.inert = true;

        syncBackdrop();
    }

    function openMenu() {
        closeSearch();

        lastFocusedElement = document.activeElement;

        navbar.classList.add("is-open");

        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.setAttribute("aria-label", "Close navigation");

        menuPanel.setAttribute("aria-hidden", "false");
        menuPanel.inert = false;

        syncBackdrop();
    }

    function closeSearch() {
        navbar.classList.remove("is-search-open");

        searchTrigger.setAttribute("aria-expanded", "false");
        searchPanel.setAttribute("aria-hidden", "true");
        searchPanel.inert = true;

        syncBackdrop();
    }

    function openSearch() {
        closeMenu();

        lastFocusedElement = document.activeElement;

        navbar.classList.add("is-search-open");

        searchTrigger.setAttribute("aria-expanded", "true");
        searchPanel.setAttribute("aria-hidden", "false");
        searchPanel.inert = false;

        syncBackdrop();

        window.setTimeout(() => {
            searchInput.focus();
        }, 500);
    }

    function closeAll() {
        closeMenu();
        closeSearch();

        if (
            lastFocusedElement &&
            document.contains(lastFocusedElement)
        ) {
            lastFocusedElement.focus();
        }
    }

    menuToggle.addEventListener("click", () => {
        if (navbar.classList.contains("is-open")) {
            closeAll();
        } else {
            openMenu();
        }
    });

    searchTrigger.addEventListener("click", () => {
        if (navbar.classList.contains("is-search-open")) {
            closeAll();
        } else {
            openSearch();
        }
    });

    searchClose.addEventListener("click", closeAll);
    backdrop.addEventListener("click", closeAll);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeAll();
        }
    });


/* =========================================
   SEARCH SUGGESTIONS
========================================= */

navbar.querySelectorAll("[data-search]").forEach((button) => {
    button.addEventListener("click", () => {

        const query = button.dataset.search.trim();

        if (!query) return;

        // Fill the search input without submitting
        searchInput.value = query;

        // Keep the panel open and focus the input
        searchInput.focus();
    });
});


/* =========================================
   SEARCH SUBMISSION
========================================= */

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const query = searchInput.value.trim();

    if (!query) {
        searchInput.focus();
        return;
    }

    const url = new URL(searchForm.action, window.location.origin);
    url.searchParams.set("q", query);

    window.location.assign(url.toString());
});
    /* =========================================
       CLOSE ON NAVIGATION
    ========================================= */

    menuPanel.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            closeMenu();
        });
    });

});












const kdNavbar = document.getElementById('kd-nav');

function updateNavbarScroll() {
    if (!kdNavbar) return;

    kdNavbar.classList.toggle(
        'is-scrolled',
        window.scrollY > 60
    );
}

window.addEventListener('scroll', updateNavbarScroll, {
    passive: true
});

updateNavbarScroll();
