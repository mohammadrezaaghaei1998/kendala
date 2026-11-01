document.addEventListener('DOMContentLoaded', function () {
    const topic = document.getElementById('kc-topic');
    const bookingField = document.getElementById('kc-booking-ref');
    function syncBookingField() {
        if (topic && bookingField) {
            bookingField.classList.toggle('is-visible', topic.value === 'existing-booking');
        }
    }
    if (topic) {
        topic.addEventListener('change', syncBookingField);
        syncBookingField();
    }
    document.querySelectorAll('[data-topic]').forEach(function (link) {
        link.addEventListener('click', function () {
            if (topic) {
                topic.value = link.dataset.topic;
                syncBookingField();
            }
        });
    });
    document.querySelectorAll('[data-whatsapp-link]').forEach(function (link) {
        if (link.getAttribute('href') === '#') {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                alert('WhatsApp support is not configured yet. Add whatsapp_url to your Django view.');
            });
        }
    });
});
