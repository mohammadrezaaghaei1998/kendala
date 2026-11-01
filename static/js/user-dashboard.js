const notificationNode = document.getElementById("kd-notification-data");
let notifications = [];
try {
  const parsed = JSON.parse(notificationNode?.textContent || "[]");
  notifications = Array.isArray(parsed) ? parsed : [];
} catch (error) { console.error("Invalid notification data", error); }
const notifEscape = value => { const el = document.createElement("span"); el.textContent = String(value ?? ""); return el.innerHTML; };
const notifIcon = type => ({offers:"fa-tag", bookings:"fa-calendar-check", travel:"fa-suitcase-rolling", system:"fa-bell"}[type] || "fa-bell");
const notifTime = value => { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(); };
function notificationCsrf() {
  return document.cookie.split(";").map(s => s.trim()).find(s => s.startsWith("csrftoken="))?.slice(10) || document.querySelector('input[name="csrfmiddlewaretoken"]')?.value || "";
}
async function notificationRequest(action, id) {
  const endpoint = id == null ? `/dashboard/notifications/${action}/` : `/dashboard/notifications/${action}/${encodeURIComponent(id)}/`;
  const response = await fetch(endpoint, {method:"POST",credentials:"same-origin",headers:{"X-CSRFToken":decodeURIComponent(notificationCsrf()),"X-Requested-With":"XMLHttpRequest"}});
  if (!response.ok) throw new Error("Unable to update notification");
  return response.json();
}
let activeNotificationFilter="all";

let activeBookingFilter="all";
const $=id=>document.getElementById(id);
// function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove("show"),2800)}

function toast(message, type = "info", title = "") {
    window.showToast(message, type, title);
}


function navigate(page){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$("page-"+page).classList.add("active");document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});if(page==="bookings")renderBookings();if(page==="favorites")renderFavorites();if(page==="notifications")renderNotifications()}
document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
$("mobileMenu").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
function statusPill(status){const labels={confirmed:"Confirmed",pending:"Payment pending",completed:"Completed",cancelled:"Cancelled"};return `<span class="status ${status}"><i class="fa-solid ${status==="confirmed"?"fa-check-circle":status==="pending"?"fa-clock":status==="completed"?"fa-check-double":"fa-ban"}"></i>${labels[status]||status}</span>`}
function renderOverview(){
    const cards = [...document.querySelectorAll("#bookingList .kd-booking-card")];
    const upcoming = cards.filter(card => {
        const date = card.dataset.departure;
        return date && date >= new Date().toLocaleDateString("en-CA") && !["CANCELLED", "COMPLETED"].includes((card.dataset.status || "").toUpperCase());
    });
    const count = $("bookingCount");
    if (count) count.textContent = cards.length;
    if ($("statBookings")) $("statBookings").textContent = String(cards.length).padStart(2,"0");
    if ($("statUpcoming")) $("statUpcoming").textContent = String(upcoming.length).padStart(2,"0");
    if ($("upcomingPreview")) {
        $("upcomingPreview").innerHTML = upcoming.length
          ? upcoming.slice(0,2).map(card => `<div class="booking-row"><div class="booking-info"><h3>${card.querySelector("h3")?.textContent || "Booking"}</h3><div class="meta">${card.querySelector(".kd-booking-location")?.textContent || ""}</div><div>${card.querySelector(".kd-booking-reference")?.textContent || ""}</div></div></div>`).join("")
          : '<div class="empty">No upcoming adventures yet.</div>';
    }
    if ($("notificationPreview")) $("notificationPreview").innerHTML = notifications.slice(0,3).map(n=>`<div class="notification-mini"><div class="notif-icon"><i class="fa-solid ${notifIcon(n.type)}"></i></div><div><strong>${notifEscape(n.title)}</strong><p>${notifEscape(n.text)}</p><time>${notifTime(n.time)}</time></div></div>`).join("") || `<div class="empty">No updates yet.</div>`;
    const savedCards = [...document.querySelectorAll("#favoritesGrid [data-favorite-card]")];
    const preview = $("favoritePreview");
    if (preview) {
        preview.replaceChildren();
        if (!savedCards.length) {
            const empty = document.createElement("div");
            empty.className = "empty";
            empty.textContent = "No saved experiences yet.";
            preview.append(empty);
        } else {
            savedCards.slice(0, 2).forEach(card => {
                const row = document.createElement("div");
                row.className = "booking-row";
                const originalImage = card.querySelector(".tour-image-wrap img");
                if (originalImage) {
                    const img = originalImage.cloneNode(true);
                    img.className = "booking-thumb";
                    row.append(img);
                }
                const info = document.createElement("div");
                info.className = "booking-info";
                const title = document.createElement("h3");
                title.textContent = card.querySelector("h3")?.textContent.trim() || "Tour";
                const meta = document.createElement("div");
                meta.className = "meta";
                meta.textContent = card.querySelector(".tour-location")?.textContent.trim() || "";
                info.append(title, meta);
                row.append(info);
                preview.append(row);
            });
        }
    }
    renderFavorites();
    updateUnread();
}
function renderBookings() {
    const search = (
        document.getElementById("bookingSearch")?.value || ""
    ).trim().toLowerCase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    document.querySelectorAll("#bookingList .kd-booking-card")
        .forEach(card => {

            const status = (card.dataset.status || "").toUpperCase();

            const cancellation = (
                card.dataset.cancellationStatus || ""
            ).toUpperCase();

            const departure = card.dataset.departure
                ? new Date(card.dataset.departure + "T00:00:00")
                : null;

            const searchText = (
                card.dataset.search || card.textContent
            ).toLowerCase();

            const isCancelled =
                ["CANCELLED", "REFUNDED"].includes(status) ||
                ["APPROVED", "REFUND_PENDING", "REFUNDED"].includes(cancellation);

            const isUpcoming =
                !isCancelled &&
                departure &&
                departure >= today;

            const isCompleted =
                !isCancelled &&
                departure &&
                departure < today &&
                status === "PAID";

            let matchesFilter = false;

            switch (activeBookingFilter) {
                case "all":
                    matchesFilter = true;
                    break;

                case "upcoming":
                    matchesFilter = Boolean(isUpcoming);
                    break;

                case "completed":
                    matchesFilter = Boolean(isCompleted);
                    break;

                case "cancelled":
                    matchesFilter = isCancelled;
                    break;
            }

            card.hidden = !(
                matchesFilter &&
                searchText.includes(search)
            );
        });


        // Show empty state when the selected tab has no visible bookings
            const cards = document.querySelectorAll(
                "#bookingList .kd-booking-card"
            );

            const visibleBookings = [...cards].filter(card => !card.hidden);

            const emptyState = document.getElementById("bookingEmptyState");
            const emptyDescription = document.getElementById("bookingEmptyDescription");

            if (emptyState) {
                emptyState.hidden = visibleBookings.length > 0;

                if (emptyDescription) {
                    const messages = {
                        all: "Your next adventure is waiting to be discovered.",
                        upcoming: "You don't have any upcoming trips.",
                        completed: "You haven't completed any trips yet.",
                        cancelled: "You don't have any cancelled bookings."
                    };

                    emptyDescription.textContent = search
                        ? "No bookings match your search."
                        : messages[activeBookingFilter] || messages.all;
                }
            }



}
document.querySelectorAll("#bookingTabs .tab").forEach(button => {
    button.addEventListener("click", () => {

        document.querySelectorAll("#bookingTabs .tab")
            .forEach(tab => tab.classList.remove("active"));

        button.classList.add("active");

        activeBookingFilter = button.dataset.filter;

        renderBookings();
    });
});

document.getElementById("bookingSearch")
    ?.addEventListener("input", renderBookings);
function closeModal(){if($("modalBackdrop")) $("modalBackdrop").classList.remove("show")}
if($("modalBackdrop")) $("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
function getWishlistCookie(name) {
    const item = document.cookie.split("; ").find(row => row.startsWith(name + "="));
    return item ? decodeURIComponent(item.split("=").slice(1).join("=")) : "";
}

function renderFavorites() {
    const search = ($("favoriteSearch")?.value || "").trim().toLowerCase();
    const cards = [...document.querySelectorAll("#favoritesGrid [data-favorite-card]")];
    let visible = 0;
    cards.forEach(card => {
        const text = (card.dataset.search || card.textContent || "").toLowerCase();
        const matches = text.includes(search);
        card.hidden = !matches;
        if (matches) visible++;
    });
    if ($("favoritesIntro")) $("favoritesIntro").textContent = `${cards.length} experience${cards.length === 1 ? "" : "s"} saved`;
    if ($("favoriteCount")) $("favoriteCount").textContent = cards.length;
    if ($("statFavorites")) $("statFavorites").textContent = String(cards.length).padStart(2, "0");
    const empty = $("favoritesEmpty");
    if (empty) {
        empty.hidden = visible > 0;
        const description = empty.querySelector("p");
        if (description) description.textContent = search ? "No favorites match your search." : "When you save a tour, it will appear here.";
    }
}

async function removeFavorite(button) {
    const card = button.closest("[data-favorite-card]");
    const url = button.dataset.url;
    if (!card || !url) return;
    const buttons = card.querySelectorAll("[data-remove-wishlist]");
    buttons.forEach(b => b.disabled = true);
    try {
        const response = await fetch(url, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRFToken": getWishlistCookie("csrftoken"),
                "X-Requested-With": "XMLHttpRequest"
            }
        });
        if (!response.ok) throw new Error("Unable to remove tour.");
        const data = await response.json();
        if (!data.success) throw new Error("Unable to remove tour.");
        card.remove();
        renderOverview();


        window.showToast(
            "Tour removed from your wishlist.",
            "success",
            "Removed from Wishlist"
        );



    } catch (error) {
        buttons.forEach(b => b.disabled = false);
        toast(error.message, "error");
    }
}

$("favoritesGrid")?.addEventListener("click", event => {
    const button = event.target.closest("[data-remove-wishlist]");
    if (button) removeFavorite(button);
});
$("favoriteSearch")?.addEventListener("input", renderFavorites);

function renderNotifications() {
  const list = notifications.filter(n => activeNotificationFilter === "all" || (activeNotificationFilter === "unread" && n.unread) || n.type === activeNotificationFilter);
  $("notificationList").innerHTML = list.length ? list.map(n => `<article class="notification-card ${n.unread ? "unread" : ""}"><div class="notif-icon"><i class="fa-solid ${notifIcon(n.type)}"></i></div><div class="notification-body"><h3>${notifEscape(n.title)} ${n.unread ? '<span style="display:inline-block;width:6px;height:6px;background:var(--purple);border-radius:50%;vertical-align:middle;margin-left:5px"></span>' : ""}</h3><p>${notifEscape(n.text)}</p><time>${notifTime(n.time)}</time>${n.url && n.url.startsWith("/") && !n.url.startsWith("//") ? `<div><a class="text-btn" href="${notifEscape(n.url)}" onclick="return openNotificationAction(event, ${Number(n.id)})">${notifEscape(n.action_label || "View details")}</a></div>` : ""}</div><div class="notif-actions">${n.unread ? `<button class="small-icon" title="Mark as read" onclick="markRead(${Number(n.id)})"><i class="fa-solid fa-check"></i></button>` : ""}<button class="small-icon" title="Remove notification" onclick="removeNotification(${Number(n.id)})"><i class="fa-regular fa-trash-can"></i></button></div></article>`).join("") : `<div class="empty"><i class="fa-regular fa-bell-slash"></i><h3>You're all caught up</h3><p>There are no notifications in this view.</p></div>`;
  updateUnread();
}
document.querySelectorAll("#notificationTabs .tab").forEach(b => b.addEventListener("click", () => { document.querySelectorAll("#notificationTabs .tab").forEach(x => x.classList.remove("active")); b.classList.add("active"); activeNotificationFilter = b.dataset.filter; renderNotifications(); }));
function updateUnread() { const count = notifications.filter(n => n.unread).length; $("unreadCount").textContent = count; $("topDot").style.display = count ? "block" : "none"; }
async function markRead(id) { try { await notificationRequest("read",id); const n=notifications.find(n=>n.id===id); if(n)n.unread=false; renderNotifications(); renderOverview(); } catch(e) { toast(e.message,"error"); } }
async function markAllRead() { try { await notificationRequest("read-all"); notifications.forEach(n=>n.unread=false); renderNotifications(); renderOverview(); toast("All notifications marked as read."); } catch(e) { toast(e.message,"error"); } }
async function removeNotification(id) { try { await notificationRequest("dismiss",id); notifications=notifications.filter(n=>n.id!==id); renderNotifications(); renderOverview(); toast("Notification removed."); } catch(e) { toast(e.message,"error"); } }
async function clearRead() { try { await notificationRequest("clear-read"); notifications=notifications.filter(n=>n.unread); renderNotifications(); renderOverview(); toast("Read notifications cleared."); } catch(e) { toast(e.message,"error"); } }
function copyCode(){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText("EXPLORE15").then(()=>toast("Offer code copied: EXPLORE15")).catch(()=>toast("Use offer code EXPLORE15 at checkout."))}else toast("Use offer code EXPLORE15 at checkout.")}
// $("profileForm").addEventListener("submit",e=>{e.preventDefault();const first=$("firstName").value.trim(),last=$("lastName").value.trim();if(!first||!last)return;const full=first+" "+last;$("topName").textContent=full;$("profileDisplayName").textContent=full;$("welcomeName").textContent=first;toast("Profile updated in this demo.");});
// $("profileForm").addEventListener("reset",()=>setTimeout(()=>toast("Form reset to the last saved demo values."),0));
// $("avatarUpload").addEventListener("change",e=>{const file=e.target.files&&e.target.files[0];if(!file)return;if(!file.type.startsWith("image/")){toast("Please choose an image file.");return}if(file.size>5*1024*1024){toast("Please choose an image smaller than 5 MB.");return}const url=URL.createObjectURL(file);$("profileAvatar").src=url;$("topAvatar").src=url;toast("Profile picture preview updated. Save it to your account through your backend.");});

const avatarUpload = document.getElementById("avatarUpload");

if (avatarUpload) {
    avatarUpload.addEventListener("change", function (event) {

        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast("Please select a valid image.");
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast("Image must be smaller than 5 MB.");
            event.target.value = "";
            return;
        }

        const imageURL = URL.createObjectURL(file);

        const profileAvatar = document.getElementById("profileAvatar");
        const topAvatar = document.getElementById("topAvatar");

        if (profileAvatar) profileAvatar.src = imageURL;
        if (topAvatar) topAvatar.src = imageURL;

        toast("Photo selected. Click Save changes to upload it.");
    });
}
function savePreferences(){toast("Preferences saved in this demo only. Connect settings to your user profile API.")}
renderOverview();renderBookings();renderFavorites();renderNotifications();


// Open a dashboard tab from a notification link
(function openDashboardTabFromURL() {

    const params = new URLSearchParams(window.location.search);

    const tab = params.get("tab");
    const commentId = params.get("comment");

    if (tab !== "reviews") return;

    const reviewsPage = document.getElementById("page-reviews");

    if (!reviewsPage) return;

    navigate("reviews");

    if (commentId && /^\d+$/.test(commentId)) {

        const review = document.getElementById(
            `review-${commentId}`
        );

        if (review) {
            requestAnimationFrame(() => {
                review.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            });
        }
    }

})();












/* =========================================
   KEN DALA — CHANGE PASSWORD
========================================= */

// Show / hide password
document.querySelectorAll(".kd-password-toggle")
    .forEach(button => {

        button.addEventListener("click", function () {

            const input = this.parentElement.querySelector("input");

            if (!input) return;

            const visible = input.type === "password";

            input.type = visible ? "text" : "password";

            this.setAttribute(
                "aria-pressed",
                String(visible)
            );

            this.setAttribute(
                "aria-label",
                visible ? "Hide password" : "Show password"
            );

            this.querySelector("i").className = visible
                ? "fa-regular fa-eye-slash"
                : "fa-regular fa-eye";

        });

    });


// Validate confirmation before submitting
// const changePasswordForm =
//     document.getElementById("changePasswordForm");

//     if (changePasswordForm) {

//         changePasswordForm.addEventListener("submit", function (event) {

//             const current = document.getElementById("currentPassword");
//             const password = document.getElementById("newPassword");
//             const confirmation = document.getElementById("confirmPassword");

//             if (!current || !password || !confirmation) return;

//             if (password.value !== confirmation.value) {

//                 event.preventDefault();

//                 window.showToast(
//                     "Your new passwords do not match.",
//                     "error",
//                     "Password Mismatch"
//                 );

//                 confirmation.focus();
//                 return;
//             }

//             if (current.value === password.value) {

//                 event.preventDefault();

//                 window.showToast(
//                     "Your new password must be different from your current password.",
//                     "warning",
//                     "Choose Another Password"
//                 );

//                 password.focus();
//             }

//         });

// }


// Restore Preferences after the redirect
document.addEventListener("DOMContentLoaded", function () {

    const params = new URLSearchParams(window.location.search);

    if (params.get("page") === "profile") {

        navigate("profile");

        // Remove the temporary query parameter.
        const url = new URL(window.location.href);
        url.searchParams.delete("page");

        window.history.replaceState(
            {},
            "",
            url.pathname + url.search + url.hash
        );

    }

});


// Separate read-only notification details modal. Does not touch the booking-management modal.
function findNotificationBooking(notification) {
  let bookingId = null;
  try { bookingId = new URL(notification.url || '/', window.location.origin).searchParams.get('booking_id'); } catch (_) {}
  const cards = [...document.querySelectorAll('.kd-booking-card[data-booking-id]')];
  if (bookingId && /^\d+$/.test(bookingId)) {
    const card = cards.find(el => el.dataset.bookingId === bookingId);
    if (card) return card;
  }
  return cards.find(card => {
    const ref = card.querySelector('.kd-booking-reference')?.textContent.trim();
    return ref && (notification.text || '').includes(ref);
  }) || null;
}

function ensureNotificationDetailsModal() {
  let backdrop = document.getElementById('kdNotificationDetailsBackdrop');
  if (backdrop) return backdrop;
  const style = document.createElement('style');
  style.textContent = `
    #kdNotificationDetailsBackdrop{position:fixed;inset:0;z-index:100000;background:rgba(13,12,20,.65);display:none;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(5px)}
    #kdNotificationDetailsBackdrop.kd-open{display:flex}
    #kdNotificationDetailsBackdrop .kd-notif-dialog{width:min(100%,540px);max-height:90vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 24px 90px rgba(0,0,0,.24);color:#24212a}
    #kdNotificationDetailsBackdrop .kd-notif-head{display:flex;justify-content:space-between;align-items:center;padding:22px 26px;border-bottom:1px solid #eee}
    #kdNotificationDetailsBackdrop .kd-notif-head h2{font-size:19px;margin:0}
    #kdNotificationDetailsBackdrop .kd-notif-close{border:0;background:transparent;font-size:22px;cursor:pointer;color:#555}
    #kdNotificationDetailsBackdrop .kd-notif-content{padding:24px 26px}
    #kdNotificationDetailsBackdrop .kd-notif-content h3{font-size:19px;margin:0 0 12px}
    #kdNotificationDetailsBackdrop .kd-notif-message{line-height:1.7;color:#666;margin:0 0 20px}
    #kdNotificationDetailsBackdrop .kd-notif-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    #kdNotificationDetailsBackdrop .kd-notif-field{border:1px solid #eee;border-radius:10px;padding:13px;min-width:0}
    #kdNotificationDetailsBackdrop .kd-notif-field span{display:block;color:#777;font-size:11px;margin-bottom:6px}
    #kdNotificationDetailsBackdrop .kd-notif-field strong{font-size:13px;overflow-wrap:anywhere}
    #kdNotificationDetailsBackdrop .kd-notif-footer{padding:0 26px 24px;display:flex;justify-content:flex-end}
    #kdNotificationDetailsBackdrop .kd-notif-done{border:0;border-radius:9px;background:#850078;color:white;padding:11px 23px;cursor:pointer;font-weight:600}
    @media(max-width:480px){#kdNotificationDetailsBackdrop .kd-notif-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
  backdrop = document.createElement('div');
  backdrop.id = 'kdNotificationDetailsBackdrop';
  backdrop.setAttribute('role','dialog');
  backdrop.setAttribute('aria-modal','true');
  backdrop.setAttribute('aria-labelledby','kdNotificationDetailsTitle');
  backdrop.innerHTML = `<div class="kd-notif-dialog"><div class="kd-notif-head"><h2 id="kdNotificationDetailsTitle">Booking notification</h2><button type="button" class="kd-notif-close" aria-label="Close notification details">&times;</button></div><div class="kd-notif-content" id="kdNotificationDetailsContent"></div><div class="kd-notif-footer"><button type="button" class="kd-notif-done">Close</button></div></div>`;
  document.body.appendChild(backdrop);
  backdrop.querySelectorAll('.kd-notif-close,.kd-notif-done').forEach(btn=>btn.addEventListener('click',closeNotificationDetails));
  backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeNotificationDetails();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && backdrop.classList.contains('kd-open'))closeNotificationDetails();});
  return backdrop;
}
function closeNotificationDetails(){document.getElementById('kdNotificationDetailsBackdrop')?.classList.remove('kd-open');}
function openNotificationDetails(notification) {
  const backdrop = ensureNotificationDetailsModal();
  const card = findNotificationBooking(notification);
  const fields = [];
  if (card) {
    const read = selector => card.querySelector(selector)?.textContent.trim() || '';
    fields.push(['Booking reference',read('.kd-booking-reference')]);
    fields.push(['Booking status',read('.kd-booking-status')]);
    fields.push(['Destination',read('.kd-booking-location')]);
    fields.push(['Departure date',card.dataset.departure || 'Not specified']);
    fields.push(['Total amount',read('.kd-booking-bottom strong')]);
    const image = card.querySelector('.kd-booking-image img')?.getAttribute('src');
    const tour = read('h3');
    document.getElementById('kdNotificationDetailsContent').innerHTML = `${image ? `<img src="${notifEscape(image)}" alt="" style="width:100%;height:170px;object-fit:cover;border-radius:10px;margin-bottom:17px">` : ''}<h3>${notifEscape(tour || notification.title)}</h3><p class="kd-notif-message">${notifEscape(notification.text)}</p><div class="kd-notif-grid">${fields.filter(([,value])=>value).map(([label,value])=>`<div class="kd-notif-field"><span>${notifEscape(label)}</span><strong>${notifEscape(value)}</strong></div>`).join('')}</div>`;
  } else {
    document.getElementById('kdNotificationDetailsContent').innerHTML = `<h3>${notifEscape(notification.title)}</h3><p class="kd-notif-message">${notifEscape(notification.text)}</p><p class="kd-notif-message">Detailed booking information is not available for this notification.</p>`;
  }
  backdrop.classList.add('kd-open');
  backdrop.querySelector('.kd-notif-close')?.focus();
}
function openNotificationAction(event, id) {
  const notification = notifications.find(n => Number(n.id) === Number(id));
  if (!notification) return true;
  // Coupon notifications belong to 'offers', but their View booking action
  // must open the independent read-only notification details modal.
  const isCouponBooking = notification.type === 'offers' &&
    (notification.title === 'A discount coupon is ready for you' ||
     (notification.url || '').includes('booking_id='));
  if (notification.type !== 'bookings' && !isCouponBooking) {
    markRead(id);
    return true;
  }
  event.preventDefault();
  markRead(id);
  openNotificationDetails(notification);
  return false;
}
// Direct booking links may be opened from bookmarks; show a read-only notification-style modal.
function openBookingFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('booking_id');
  if (!id || !/^\d+$/.test(id)) return;
  const card = [...document.querySelectorAll('.kd-booking-card[data-booking-id]')].find(el=>el.dataset.bookingId===id);
  if (!card) return;
  const reference = card.querySelector('.kd-booking-reference')?.textContent.trim() || '';
  openNotificationDetails({title:'Booking details',text:`Booking reference: ${reference}`,url:window.location.pathname+window.location.search});
}
window.addEventListener('load', openBookingFromQuery);
