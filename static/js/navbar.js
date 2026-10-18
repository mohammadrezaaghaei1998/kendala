   document.addEventListener("DOMContentLoaded", function () {

        const wsiNavbar = document.querySelector(".wsi-navbar");

        if (!wsiNavbar) return;


        const wsiTriggers = wsiNavbar.querySelectorAll(
            ".wsi-navbar-dropdown-trigger"
        );

        const wsiPanels = wsiNavbar.querySelectorAll(
            "[data-wsi-navbar-panel]"
        );

        const wsiMobileButton = wsiNavbar.querySelector(
            ".wsi-navbar-mobile-button"
        );

        const wsiMobileClose = wsiNavbar.querySelector(
            ".wsi-navbar-mobile-close"
        );

        let wsiCloseTimer;


        /* =====================================================
        DESKTOP DROPDOWN
        ===================================================== */

        function wsiNavbarOpen(menuName) {

            clearTimeout(wsiCloseTimer);

            wsiNavbar.classList.add("wsi-navbar-open");


            wsiTriggers.forEach(function (trigger) {

                const triggerButton =
                    trigger.querySelector("[data-wsi-navbar-menu]");

                if (!triggerButton) return;

                if (
                    triggerButton.dataset.wsiNavbarMenu === menuName
                ) {
                    trigger.classList.add("wsi-navbar-active");
                } else {
                    trigger.classList.remove("wsi-navbar-active");
                }

            });


            wsiPanels.forEach(function (panel) {

                if (
                    panel.dataset.wsiNavbarPanel === menuName
                ) {
                    panel.classList.add(
                        "wsi-navbar-panel-active"
                    );
                } else {
                    panel.classList.remove(
                        "wsi-navbar-panel-active"
                    );
                }

            });

        }


        function wsiNavbarClose() {

            wsiCloseTimer = setTimeout(function () {

                wsiNavbar.classList.remove(
                    "wsi-navbar-open"
                );

                wsiTriggers.forEach(function (trigger) {
                    trigger.classList.remove(
                        "wsi-navbar-active"
                    );
                });

            }, 100);

        }


        /* =====================================================
        HOVER — DESKTOP
        ===================================================== */

        wsiTriggers.forEach(function (trigger) {

            trigger.addEventListener(
                "mouseenter",
                function () {

                    if (window.innerWidth <= 1100) return;

                    const button =
                        trigger.querySelector(
                            "[data-wsi-navbar-menu]"
                        );

                    if (!button) return;

                    wsiNavbarOpen(
                        button.dataset.wsiNavbarMenu
                    );

                }
            );


            trigger.addEventListener(
                "mouseleave",
                function () {

                    if (window.innerWidth <= 1100) return;

                    wsiNavbarClose();

                }
            );

        });


        /*
        Keep mega menu open when mouse enters it.
        */

        const wsiMegaWrapper =
            wsiNavbar.querySelector(
                ".wsi-navbar-mega-wrapper"
            );


        if (wsiMegaWrapper) {

            wsiMegaWrapper.addEventListener(
                "mouseenter",
                function () {

                    if (window.innerWidth <= 1100) return;

                    clearTimeout(wsiCloseTimer);

                }
            );


            wsiMegaWrapper.addEventListener(
                "mouseleave",
                function () {

                    if (window.innerWidth <= 1100) return;

                    wsiNavbarClose();

                }
            );

        }


        /* =====================================================
        DESTINATION IMAGE SWITCHING
        ===================================================== */

        const wsiImageLinks =
            wsiNavbar.querySelectorAll(
                "[data-wsi-navbar-image]"
            );


        const wsiImages =
            wsiNavbar.querySelectorAll(
                "[data-wsi-navbar-image-target]"
            );


        wsiImageLinks.forEach(function (link) {

            link.addEventListener(
                "mouseenter",
                function () {

                    if (window.innerWidth <= 1100) return;

                    const imageName =
                        link.dataset.wsiNavbarImage;


                    wsiImages.forEach(function (image) {

                        if (
                            image.dataset
                                .wsiNavbarImageTarget === imageName
                        ) {

                            image.classList.add(
                                "wsi-navbar-image-active"
                            );

                        } else {

                            image.classList.remove(
                                "wsi-navbar-image-active"
                            );

                        }

                    });

                }
            );

        });


        /* =====================================================
        MOBILE MENU
        ===================================================== */

        function wsiNavbarOpenMobile() {

            wsiNavbar.classList.add(
                "wsi-navbar-mobile-open"
            );

            document.body.style.overflow = "hidden";

            if (wsiMobileButton) {

                wsiMobileButton.setAttribute(
                    "aria-expanded",
                    "true"
                );

            }

        }


        // function wsiNavbarCloseMobile() {

        //     wsiNavbar.classList.remove(
        //         "wsi-navbar-mobile-open"
        //     );

        //     document.body.style.overflow = "";

        //     if (wsiMobileButton) {

        //         wsiMobileButton.setAttribute(
        //             "aria-expanded",
        //             "false"
        //         );

        //     }

        // }


        if (wsiMobileButton) {

            wsiMobileButton.addEventListener(
                "click",
                function () {

                    if (
                        wsiNavbar.classList.contains(
                            "wsi-navbar-mobile-open"
                        )
                    ) {

                        wsiNavbarCloseMobile();

                    } else {

                        wsiNavbarOpenMobile();

                    }

                }
            );

        }


        if (wsiMobileClose) {

            wsiMobileClose.addEventListener(
                "click",
                function () {

                    wsiNavbarCloseMobile();

                }
            );

        }


        /* =====================================================
        ESCAPE
        ===================================================== */

        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key !== "Escape") return;

                wsiNavbarCloseMobile();
                wsiNavbar.classList.remove(
                    "wsi-navbar-open"
                );

            }
        );


        /* =====================================================
        CLOSE MOBILE MENU AFTER CLICKING LINK
        ===================================================== */

        const wsiMobileLinks =
            wsiNavbar.querySelectorAll(
                ".wsi-navbar-mobile-link, " +
                ".wsi-navbar-mobile-action, " +
                ".wsi-navbar-mobile-visa, " +
                ".wsi-navbar-mobile-login"
            );


        wsiMobileLinks.forEach(function (link) {

            link.addEventListener(
                "click",
                function () {

                    wsiNavbarCloseMobile();

                }
            );

        });


        /* =====================================================
        RESIZE SAFETY
        ===================================================== */

        window.addEventListener(
            "resize",
            function () {

                if (window.innerWidth > 1100) {

                    wsiNavbarCloseMobile();

                }

            }
        );

    });





    document.addEventListener("DOMContentLoaded", function () {
        const navbar = document.querySelector(".wsi-navbar");
        if (!navbar) return;

        const hamburger = navbar.querySelector(".wsi-navbar-mobile-button");
        const mobileMenu = navbar.querySelector(".wsi-navbar-mobile-menu");
        const mobileClose = navbar.querySelector(".wsi-navbar-mobile-close");
        const mobileBack = navbar.querySelector(".wsi-navbar-mobile-back");
        const mobilePages = navbar.querySelectorAll(".wsi-navbar-mobile-page");
        const mobileTriggers = navbar.querySelectorAll("[data-wsi-mobile-menu]");
        const desktopTriggers = navbar.querySelectorAll("[data-wsi-navbar-menu]");
        const desktopPanels = navbar.querySelectorAll(".wsi-navbar-reference-panel");
        const desktopClose = navbar.querySelector(".wsi-navbar-mega-close");

        function openMobile() {
            navbar.classList.add("wsi-navbar-mobile-open");
            hamburger?.setAttribute("aria-expanded", "true");
            showMobileMain();
            document.body.classList.add("wsi-navbar-no-scroll");
        }

        function closeMobile() {
            navbar.classList.remove("wsi-navbar-mobile-open");
            hamburger?.setAttribute("aria-expanded", "false");
            showMobileMain();
            document.body.classList.remove("wsi-navbar-no-scroll");
        }

        function showMobileMain() {
            mobilePages.forEach(page => page.classList.remove("is-active"));
            navbar.querySelector(".wsi-navbar-mobile-main-page")?.classList.add("is-active");
            mobileBack?.classList.remove("is-visible");
        }

        function showMobileSubmenu(name) {
            mobilePages.forEach(page => page.classList.remove("is-active"));
            navbar.querySelector(`[data-wsi-mobile-page="${name}"]`)?.classList.add("is-active");
            mobileBack?.classList.add("is-visible");
        }

        hamburger?.addEventListener("click", openMobile);
        mobileClose?.addEventListener("click", closeMobile);
        mobileBack?.addEventListener("click", showMobileMain);

        mobileTriggers.forEach(trigger => {
            trigger.addEventListener("click", () => {
                showMobileSubmenu(trigger.dataset.wsiMobileMenu);
            });
        });

        desktopTriggers.forEach(trigger => {
            trigger.addEventListener("click", () => {
                const name = trigger.dataset.wsiNavbarMenu;
                const alreadyOpen = navbar.classList.contains("wsi-navbar-open") &&
                    navbar.dataset.wsiOpenPanel === name;

                navbar.classList.toggle("wsi-navbar-open", !alreadyOpen);
                navbar.dataset.wsiOpenPanel = alreadyOpen ? "" : name;

                desktopPanels.forEach(panel => {
                    panel.classList.toggle(
                        "wsi-navbar-panel-active",
                        !alreadyOpen && panel.dataset.wsiNavbarPanel === name
                    );
                });
            });
        });

        desktopClose?.addEventListener("click", () => {
            navbar.classList.remove("wsi-navbar-open");
            navbar.dataset.wsiOpenPanel = "";
            desktopPanels.forEach(panel => panel.classList.remove("wsi-navbar-panel-active"));
        });

        document.addEventListener("click", event => {
            if (!navbar.contains(event.target)) {
                navbar.classList.remove("wsi-navbar-open");
                navbar.dataset.wsiOpenPanel = "";
                desktopPanels.forEach(panel => panel.classList.remove("wsi-navbar-panel-active"));
            }
        });
    });
