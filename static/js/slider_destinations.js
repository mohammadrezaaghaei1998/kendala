document.addEventListener("DOMContentLoaded", function () {

    if (typeof AOS !== "undefined") {
        AOS.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 70
        });
    }

    if (typeof Splitting !== "undefined") {
        Splitting();
    }

    if (typeof Swiper !== "undefined") {

        new Swiper(".eventsSwiper", {
            slidesPerView: "auto",
            spaceBetween: 18,
            speed: 800,
            grabCursor: true,
            scrollbar: {
                el: ".eventsSwiper .swiper-scrollbar",
                draggable: true
            },
            navigation: {
                nextEl: ".event-next",
                prevEl: ".event-prev"
            }
        });

        new Swiper(".toursSwiper", {
            slidesPerView: "auto",
            spaceBetween: 18,
            speed: 800,
            grabCursor: true,
            scrollbar: {
                el: ".toursSwiper .swiper-scrollbar",
                draggable: true
            },
            navigation: {
                nextEl: ".tour-next",
                prevEl: ".tour-prev"
            }
        });
    }

    /* FAQ accordion */
    document.querySelectorAll(".faq-question").forEach(function (button) {
        button.addEventListener("click", function () {
            const item = this.closest(".faq-item");

            document.querySelectorAll(".faq-item").forEach(function (other) {
                if (other !== item) other.classList.remove("open");
            });

            item.classList.toggle("open");
        });
    });

    /* Mobile navigation */
    const menuButton = document.querySelector(".menu-toggle");
    const mobileNav = document.querySelector(".mobile-nav");

    if (menuButton && mobileNav) {
        menuButton.addEventListener("click", function () {
            mobileNav.classList.toggle("open");
        });

        mobileNav.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                mobileNav.classList.remove("open");
            });
        });
    }

    /* Destination tab active state while scrolling */
    const sections = document.querySelectorAll("main section[id]");
    const tabs = document.querySelectorAll(".destination-tabs a");

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                tabs.forEach(function(tab) {
                    tab.classList.toggle(
                        "active",
                        tab.getAttribute("href") === "#" + entry.target.id
                    );
                });
            }
        });
    }, {
        rootMargin: "-35% 0px -55% 0px",
        threshold: 0
    });

    sections.forEach(function(section) {
        observer.observe(section);
    });
});

/* Visit Saudi-style About information tabs */
document.querySelectorAll('.about-info-tab').forEach(function(tab){
    tab.addEventListener('click', function(){
        const name = this.dataset.tab;
        document.querySelectorAll('.about-info-tab').forEach(function(t){ t.classList.toggle('active', t === tab); });
        document.querySelectorAll('.about-panel').forEach(function(panel){ panel.classList.toggle('active', panel.dataset.panel === name); });
    });
});
