/* Ken Dala Partnership — front-end interactions only */
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('kp-partner-form');
    const status = document.getElementById('kp-form-status');

    if (form && status) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            status.textContent = '';

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Deliberately do not claim submission or collect applications
            // until a secure Django POST endpoint has been implemented.
            status.textContent = 'The form is ready for backend integration. No application has been sent yet.';
        });
    }
});
