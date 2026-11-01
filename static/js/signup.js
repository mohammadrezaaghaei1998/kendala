
document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       SHOW / HIDE PASSWORD FIELDS
    ========================================= */

    document.querySelectorAll(".password-toggle").forEach(button => {

        button.addEventListener("click", () => {

            const input = document.getElementById(
                button.dataset.passwordTarget
            );

            if (!input) return;

            const icon = button.querySelector("i");
            const showPassword = input.type === "password";

            input.type = showPassword ? "text" : "password";

            if (icon) {
                icon.classList.toggle("fa-eye", !showPassword);
                icon.classList.toggle("fa-eye-slash", showPassword);
            }

            button.setAttribute(
                "aria-label",
                showPassword ? "Hide password" : "Show password"
            );

        });

    });


    /* =========================================
       DJANGO SIGNUP ERRORS — TOAST
    ========================================= */

    const signupErrors = document.getElementById("signupErrors");

    if (signupErrors) {

        const messages = Array.from(
            signupErrors.querySelectorAll("p")
        )
        .map(el => el.textContent.trim())
        .filter(Boolean);

        // Hide the old inline error box
        signupErrors.hidden = true;

        if (messages.length > 0) {

            showToast(
                messages.map(message => "• " + message).join("\n"),
                "error",
                "Account creation failed"
            );

        }

    }


    /* =========================================
       REGISTRATION FORM
    ========================================= */

    const registerForm = document.getElementById("registerForm");

    const passwordInput = document.getElementById("password");

    const confirmPasswordInput = document.getElementById("confirmPassword");


    /* =========================================
       PASSWORD VALIDATION
    ========================================= */

    function validatePasswords() {

        if (!passwordInput || !confirmPasswordInput) return true;

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (confirmPassword && password !== confirmPassword) {

            confirmPasswordInput.setCustomValidity(
                "Passwords do not match."
            );

            return false;

        }

        confirmPasswordInput.setCustomValidity("");

        return true;
    }


    passwordInput?.addEventListener("input", validatePasswords);

    confirmPasswordInput?.addEventListener("input", validatePasswords);


    /* =========================================
       FORM SUBMISSION
    ========================================= */

    if (registerForm) {

        registerForm.addEventListener("submit", (event) => {

            const passwordsMatch = validatePasswords();

            if (!passwordsMatch) {

                event.preventDefault();

                showToast(
                    "Please make sure both passwords match.",
                    "error",
                    "Password mismatch"
                );

                confirmPasswordInput.focus();

                return;
            }

            // Django handles account creation.
            // Do not prevent submission when valid.

        });

    }


    /* =========================================
       GOOGLE SIGNUP — NOT AVAILABLE
    ========================================= */

    const googleRegister = document.getElementById("googleRegister");

    if (googleRegister) {

        googleRegister.addEventListener("click", () => {

            showToast(
                "Google sign-up is not available yet.",
                "info",
                "Coming soon"
            );

        });

    }

});
