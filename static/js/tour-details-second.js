(() => {
  const gallery = document.getElementById('kdLightbox');
  if (!gallery) return;
  const photos = [...document.querySelectorAll('.kd-photo img')];
  const viewer = document.getElementById('kdLightboxImage');
  const counter = document.getElementById('kdGalleryCounter');
  let current = 0;
  let previousFocus = null;
  function render() { viewer.src = photos[current].src; viewer.alt = photos[current].alt; counter.textContent = `${current + 1} / ${photos.length}`; }
  function open(index) { previousFocus = document.activeElement; current = index; render(); gallery.hidden = false; document.body.style.overflow = 'hidden'; document.getElementById('kdCloseGallery').focus(); }
  function close() { gallery.hidden = true; document.body.style.overflow = ''; previousFocus?.focus(); }
  function move(delta) { current = (current + delta + photos.length) % photos.length; render(); }
  document.querySelectorAll('.kd-photo').forEach((button, index) => button.addEventListener('click', () => open(index)));
  document.getElementById('kdOpenGallery').addEventListener('click', () => open(0));
  document.getElementById('kdCloseGallery').addEventListener('click', close);
  document.getElementById('kdPrev').addEventListener('click', () => move(-1));
  document.getElementById('kdNext').addEventListener('click', () => move(1));
  gallery.addEventListener('click', event => { if (event.target === gallery) close(); });
  document.addEventListener('keydown', event => { if (gallery.hidden) return; if (event.key === 'Escape') close(); if (event.key === 'ArrowRight') move(1); if (event.key === 'ArrowLeft') move(-1); });
  const navLinks = [...document.querySelectorAll('.kd-anchor-inner a[href^="#"]')];
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (!entry.isIntersecting) return; navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id)); }); }, { rootMargin: '-25% 0px -65% 0px' });
    sections.forEach(section => observer.observe(section));
  }
})();


// Supplemental tour interactions. Replace the brochure URL and enquiry address with your own.
(() => {
  const feedback = document.getElementById('kdActionFeedback');
  const say = msg => { if (feedback) feedback.textContent = msg; };
  const wishlistButtons = [document.getElementById('kdWishlist'), document.getElementById('kdSidebarWishlist')].filter(Boolean);
  let saved = false;
  try { saved = localStorage.getItem(tourKey) === 'true'; } catch (_) {}
  const refresh = () => wishlistButtons.forEach(btn => { btn.setAttribute('aria-pressed', String(saved)); const icon = btn.querySelector('i'); if(icon) icon.className = saved ? 'fa-solid fa-heart' : 'fa-regular fa-heart'; const label = btn.querySelector('span'); if(label) label.textContent = saved ? 'Saved to wishlist' : 'Add to wishlist'; });
  refresh();
  wishlistButtons.forEach(btn => btn.addEventListener('click', () => { saved = !saved; try { localStorage.setItem(tourKey, String(saved)); } catch (_) {} refresh(); say(saved ? 'Saved to this browser’s wishlist.' : 'Removed from this browser’s wishlist.'); }));
  const dialog = document.getElementById('kdQuestionDialog');
  document.querySelectorAll('[data-open-question]').forEach(btn => btn.addEventListener('click', () => { if(dialog?.showModal) dialog.showModal(); }));
  document.getElementById('kdCloseQuestion')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', e => { if(e.target === dialog) dialog.close(); });
  document.getElementById('kdQuestionForm')?.addEventListener('submit', e => {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    const subject = encodeURIComponent('Ken Dala | Amalfi Coast Walking | Tour question');
    const body = encodeURIComponent(`Name: ${data.get('name')}\nEmail: ${data.get('email')}\nTour: Amalfi Coast Walking\n\nQuestion:\n${data.get('question')}`);
    // Configure a real destination email address before enabling this form in production.
    const recipient = document.body.dataset.kenDalaContactEmail;
    if (!recipient) { alert('Enquiry email is not configured yet. Set data-ken-dala-contact-email on the body element.'); return; }
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  });
  document.querySelectorAll('[data-brochure]').forEach(btn => btn.addEventListener('click', () => {
    const url = document.body.dataset.kenDalaBrochureUrl;
    if (!url) { say('The brochure has not been linked yet. Add its URL to data-ken-dala-brochure-url on the body element.'); alert('Brochure not available yet. Please contact Ken Dala for details.'); return; }
    window.open(url, '_blank', 'noopener,noreferrer');
  }));
})();








document.addEventListener("DOMContentLoaded", function () {

    const config = window.kenDalaWishlist;
    if (!config) return;

    const buttons = [
        document.getElementById("kdWishlist"),
        document.getElementById("kdSidebarWishlist")
    ].filter(Boolean);

    let saved = config.saved;
    let busy = false;

    function getCookie(name) {
        const item = document.cookie
            .split("; ")
            .find(row => row.startsWith(name + "="));

        return item
            ? decodeURIComponent(item.split("=").slice(1).join("="))
            : "";
    }

    function updateButtons() {
        buttons.forEach(button => {
            button.classList.toggle("is-saved", saved);
            button.setAttribute("aria-pressed", String(saved));

            const icon = button.querySelector("i");
            if (icon) {
                icon.classList.toggle("fa-solid", saved);
                icon.classList.toggle("fa-regular", !saved);
            }

            const label = button.querySelector("span");

            if (label) {
                label.textContent = saved
                    ? "Saved to wishlist"
                    : "Add to wishlist";
            }
        });
    }

    async function toggleWishlist() {
        if (!config.authenticated) {
            window.location.href = config.loginUrl;
            return;
        }

        if (busy) return;
        busy = true;
        buttons.forEach(button => button.disabled = true);

        try {
            const response = await fetch(config.url, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-CSRFToken": getCookie("csrftoken"),
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            if (!response.ok) {
                throw new Error("Unable to update wishlist.");
            }

            const data = await response.json();

            saved = data.saved;
            updateButtons();

           window.showToast(
                data.saved
                    ? "Tour added to your wishlist."
                    : "Tour removed from your wishlist.",
                "success",
                data.saved ? "Added to Wishlist" : "Removed from Wishlist"
            );

        } catch (error) {
            window.showToast(
                error.message,
                "error",
                "Wishlist Error"
            );
        } finally {
            busy = false;
            buttons.forEach(button => button.disabled = false);
        }
    }

    buttons.forEach(button => {
        button.addEventListener("click", toggleWishlist);
    });

    updateButtons();
});




