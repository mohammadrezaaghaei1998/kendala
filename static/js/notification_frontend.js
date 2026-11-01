/* Replace the existing demo notification array AND notification functions in user-dashboard.js
   with this module. Requires Django json_script with id='kd-notification-data', and
   <body data-notification-url="{% url 'notification-action' action='read-all' %}"> isn't necessary.
   API base is supplied via #kd-notification-data data-api-prefix. */
let notifications = JSON.parse(document.getElementById('kd-notification-data')?.textContent || '[]');
let activeNotificationFilter = 'all';
const notificationAPI = document.getElementById('kd-notification-data')?.dataset.apiPrefix || '/dashboard/notifications/';
const notificationIcons = {offers:'fa-tag',bookings:'fa-calendar-check',travel:'fa-suitcase-rolling',system:'fa-circle-info'};
function notificationEscape(value) { const div = document.createElement('div'); div.textContent = String(value ?? ''); return div.innerHTML; }
function notificationTime(value) { return new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}); }
function notificationURL(url) { return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && !url.includes('\\') ? url : ''; }
function updateUnread() {
    const count = notifications.filter(n=>n.unread).length;
    const badge = document.getElementById('unreadCount');
    const dot = document.getElementById('topDot');
    if(badge) badge.textContent = count;
    if(dot) dot.style.display = count ? 'block' : 'none';
}
function renderNotifications() {
    const filtered = notifications.filter(n=>activeNotificationFilter==='all' ||
        (activeNotificationFilter==='unread' && n.unread) || n.type===activeNotificationFilter);
    const container = document.getElementById('notificationList');
    if(container) container.innerHTML = filtered.length ? filtered.map(n=>{
        const url = notificationURL(n.url);
        return `<article class="notification-card ${n.unread?'unread':''}">
          <div class="notif-icon"><i class="fa-solid ${notificationIcons[n.type]||notificationIcons.system}"></i></div>
          <div class="notification-body"><h3>${notificationEscape(n.title)}</h3><p>${notificationEscape(n.text)}</p>
          <time>${notificationEscape(notificationTime(n.time))}</time>
          ${url ? `<a class="kd-notification-action" href="${notificationEscape(url)}" data-notification-open="${n.id}">${notificationEscape(n.action_label||'View details')} ↗</a>`:''}
          </div><div class="notif-actions">
          ${n.unread?`<button class="small-icon" aria-label="Mark as read" data-notification-read="${n.id}"><i class="fa-solid fa-check"></i></button>`:''}
          <button class="small-icon" aria-label="Dismiss" data-notification-dismiss="${n.id}"><i class="fa-regular fa-trash-can"></i></button>
          </div></article>`;
    }).join('') : '<div class="empty"><h3>All caught up</h3><p>No notifications in this view.</p></div>';
    const preview = document.getElementById('notificationPreview');
    if(preview) preview.innerHTML = notifications.slice(0,3).map(n=>`<div class="notification-mini"><div class="notif-icon"><i class="fa-solid ${notificationIcons[n.type]||notificationIcons.system}"></i></div><div><strong>${notificationEscape(n.title)}</strong><p>${notificationEscape(n.text)}</p><time>${notificationEscape(notificationTime(n.time))}</time></div></div>`).join('') || '<div class="empty">No updates yet.</div>';
    updateUnread();
}
async function notificationRequest(action,id) {
    const path = `${notificationAPI}${action}/${id ? id+'/' : ''}`;
    const response = await fetch(path,{method:'POST',credentials:'same-origin',headers:{'X-CSRFToken':getWishlistCookie('csrftoken')}});
    if(!response.ok) throw new Error('Could not update notification. Please try again.');
}
async function markRead(id) {try {await notificationRequest('read',id);const n=notifications.find(n=>n.id===id);if(n)n.unread=false;renderNotifications();}catch(e){toast(e.message,'error');}}
async function markAllRead() {try {await notificationRequest('read-all');notifications.forEach(n=>n.unread=false);renderNotifications();}catch(e){toast(e.message,'error');}}
async function removeNotification(id) {try {await notificationRequest('dismiss',id);notifications=notifications.filter(n=>n.id!==id);renderNotifications();}catch(e){toast(e.message,'error');}}
async function clearRead() {try {await notificationRequest('clear-read');notifications=notifications.filter(n=>n.unread);renderNotifications();}catch(e){toast(e.message,'error');}}
document.querySelectorAll('#notificationTabs .tab').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('#notificationTabs .tab').forEach(tab=>tab.classList.remove('active'));
    button.classList.add('active');activeNotificationFilter=button.dataset.filter;renderNotifications();
}));
document.getElementById('notificationList')?.addEventListener('click',e=>{
    const read=e.target.closest('[data-notification-read]');
    const dismiss=e.target.closest('[data-notification-dismiss]');
    const open=e.target.closest('[data-notification-open]');
    if(read)markRead(Number(read.dataset.notificationRead));
    if(dismiss)removeNotification(Number(dismiss.dataset.notificationDismiss));
    if(open)markRead(Number(open.dataset.notificationOpen));
});
