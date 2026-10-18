    // Show / hide password fields
    document.querySelectorAll(".password-toggle").forEach(button => {
        button.addEventListener("click", () => {
            const input = document.getElementById(
                button.dataset.passwordTarget
            );
            const icon = button.querySelector("i");
            const showPassword = input.type === "password";

            input.type = showPassword ? "text" : "password";
            icon.classList.toggle("fa-eye", !showPassword);
            icon.classList.toggle("fa-eye-slash", showPassword);

            button.setAttribute(
                "aria-label",
                showPassword ? "Hide password" : "Show password"
            );
        });
    });

    // Registration form validation (front-end demonstration only)
    const registerForm = document.getElementById("registerForm");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput =
        document.getElementById("confirmPassword");
    const formMessage = document.getElementById("formMessage");

    function showMessage(message) {
        formMessage.textContent = message;
        formMessage.classList.add("visible");
    }

    confirmPasswordInput.addEventListener("input", () => {
        if (
            confirmPasswordInput.value &&
            passwordInput.value !== confirmPasswordInput.value
        ) {
            confirmPasswordInput.setCustomValidity(
                "Passwords do not match."
            );
        } else {
            confirmPasswordInput.setCustomValidity("");
        }
    });

    passwordInput.addEventListener("input", () => {
        if (
            confirmPasswordInput.value &&
            passwordInput.value !== confirmPasswordInput.value
        ) {
            confirmPasswordInput.setCustomValidity(
                "Passwords do not match."
            );
        } else {
            confirmPasswordInput.setCustomValidity("");
        }
    });

    registerForm.addEventListener("submit", event => {
        event.preventDefault();

        if (!registerForm.reportValidity()) {
            return;
        }

        showMessage(
            "The design is ready, but account creation is not connected yet. " +
            "Connect this form to your website's registration backend."
        );
    });

    document.getElementById("googleRegister").addEventListener("click", () => {
        showMessage(
            "Google sign-up is not connected yet. Configure Google OAuth " +
            "or your authentication provider to enable it."
        );
    });
