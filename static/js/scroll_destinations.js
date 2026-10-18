/*
    scroll.js
    Kept separate because your original HTML already references this file.

    The reference site uses a clean, restrained scroll experience rather than
    a heavy custom-scroll library, so native browser scrolling is intentionally
    preserved here.
*/

window.addEventListener("scroll", function () {
    const header = document.querySelector(".site-header");

    if (!header) return;

    if (window.scrollY > 20) {
        header.classList.add("is-scrolled");
    } else {
        header.classList.remove("is-scrolled");
    }
});
