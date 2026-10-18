
/* ==========================================
   THINGS TO DO - FILTER, DRAG & PROGRESS
========================================== */

document.addEventListener("DOMContentLoaded", function () {
    const categoryRow = document.querySelector(".category-row");
    const carousel = document.querySelector("#thingsCarousel");
    const carouselWrap = document.querySelector(".things-carousel-wrap");

    if (!categoryRow || !carousel || !carouselWrap) return;

    const categories = categoryRow.querySelectorAll(".category");
    const cards = carousel.querySelectorAll(".thing-card");

    const progress = carouselWrap.querySelector(".things-progress");
    const progressFill = carouselWrap.querySelector(
        ".things-progress-fill"
    );

    const progressFillParent = progress;
    const previousButton = carouselWrap.querySelector(".carousel-arrow.prev");
    const nextButton = carouselWrap.querySelector(".carousel-arrow.next");

    /* ------------------------------------------
       1. CATEGORY FILTER
    ------------------------------------------ */

    categories.forEach(function (button) {
        button.addEventListener("click", function () {
            const filter = this.dataset.filter;

            categories.forEach(function (category) {
                category.classList.toggle(
                    "active",
                    category === button
                );
            });

            cards.forEach(function (card) {
                const matches =
                    filter === "all" ||
                    card.dataset.category === filter;

                card.hidden = !matches;
            });

            // Start from the beginning after filtering.
            carousel.scrollLeft = 0;

            updateProgress();
        });
    });

    /* ------------------------------------------
       2. RESPONSIVE PROGRESS BAR
    ------------------------------------------ */

    function updateProgress() {
        if (!progress || !progressFill) return;

        const visibleWidth = carousel.clientWidth;
        const totalWidth = carousel.scrollWidth;
        const maxScroll = totalWidth - visibleWidth;

        if (totalWidth <= 0 || maxScroll <= 1) {
            progressFill.style.width = "100%";
            progressFill.style.marginLeft = "0";
            progress.setAttribute("aria-valuenow", "100");
            progress.style.visibility = "hidden";
            return;
        }

        progress.style.visibility = "visible";

        // Thumb width represents the visible portion of the carousel.
        const thumbWidth = Math.min(
            100,
            (visibleWidth / totalWidth) * 100
        );

        // Position the thumb according to the scroll position.
        const scrollRatio = Math.max(
            0,
            Math.min(1, carousel.scrollLeft / maxScroll)
        );

        const availableTravel = 100 - thumbWidth;

        progressFill.style.width = thumbWidth + "%";
        progressFill.style.marginLeft =
            scrollRatio * availableTravel + "%";

        progress.setAttribute(
            "aria-valuenow",
            String(Math.round(scrollRatio * 100))
        );
    }

    carousel.addEventListener("scroll", updateProgress, {
        passive: true
    });

    window.addEventListener("resize", updateProgress);

    /* ------------------------------------------
       3. PREVIOUS / NEXT ARROWS
    ------------------------------------------ */

    function scrollCarousel(direction) {
        const firstVisibleCard = carousel.querySelector(
            ".thing-card:not([hidden])"
        );

        if (!firstVisibleCard) return;

        const gap = parseFloat(
            getComputedStyle(carousel).gap
        ) || 0;

        // Move approximately one visible card group per click.
        const step = Math.max(
            firstVisibleCard.getBoundingClientRect().width + gap,
            carousel.clientWidth * 0.65
        );

        carousel.scrollBy({
            left: direction * step,
            behavior: "smooth"
        });
    }

    if (previousButton) {
        previousButton.addEventListener("click", function () {
            scrollCarousel(-1);
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", function () {
            scrollCarousel(1);
        });
    }

    /* ------------------------------------------
       4. REUSABLE MOUSE / TOUCH DRAG
    ------------------------------------------ */

    function enableDragging(element, options = {}) {
        let startX = 0;
        let startScrollLeft = 0;
        let isPointerDown = false;
        let hasDragged = false;
        let suppressClick = false;

        const dragThreshold = 6;

        element.addEventListener("pointerdown", function (event) {
            // Mouse: only the primary button.
            if (event.pointerType === "mouse" && event.button !== 0) {
                return;
            }

            // Do not start a drag on interactive controls.
            if (
                event.target.closest(
                    "button, a, input, select, textarea"
                )
            ) {
                return;
            }

            isPointerDown = true;
            hasDragged = false;
            startX = event.clientX;
            startScrollLeft = element.scrollLeft;
        });

        element.addEventListener("pointermove", function (event) {
            if (!isPointerDown) return;

            const deltaX = event.clientX - startX;

            if (Math.abs(deltaX) > dragThreshold) {
                hasDragged = true;
                element.classList.add("is-dragging");
            }

            if (!hasDragged) return;

            // Prevent text/image selection during mouse dragging.
            if (event.pointerType === "mouse") {
                event.preventDefault();
            }

            element.scrollLeft = startScrollLeft - deltaX;
        });

        function stopDragging() {
            if (!isPointerDown) return;

            isPointerDown = false;
            element.classList.remove("is-dragging");

            if (hasDragged) {
                suppressClick = true;

                // Allow the next intentional click.
                setTimeout(function () {
                    suppressClick = false;
                }, 100);

                hasDragged = false;
            }
        }

        element.addEventListener("pointerup", stopDragging);
        element.addEventListener("pointercancel", stopDragging);
        element.addEventListener("lostpointercapture", stopDragging);

        // Avoid accidentally opening/clicking something after a drag.
        element.addEventListener("click", function (event) {
            if (!suppressClick) return;

            event.preventDefault();
            event.stopPropagation();
            suppressClick = false;
        }, true);

        // Optional extra handling can be added here if needed.
        return element;
    }

    enableDragging(carousel);
    enableDragging(categoryRow);

    /* ------------------------------------------
       5. INITIALISE & HANDLE IMAGE LOADING
    ------------------------------------------ */

    updateProgress();

    // Recalculate when image dimensions/layout change.
    if ("ResizeObserver" in window) {
        const resizeObserver = new ResizeObserver(updateProgress);

        resizeObserver.observe(carousel);

        cards.forEach(function (card) {
            resizeObserver.observe(card);
        });
    }

    carousel.querySelectorAll("img").forEach(function (img) {
        if (!img.complete) {
            img.addEventListener("load", updateProgress, {
                once: true
            });
        }
    });
});