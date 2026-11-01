
document.addEventListener("DOMContentLoaded", function () {

    // Show / hide password
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const passwordIcon = document.getElementById("passwordIcon");

    if (passwordInput && togglePassword && passwordIcon) {
        togglePassword.addEventListener("click", function () {
            const isHidden = passwordInput.type === "password";

            passwordInput.type = isHidden ? "text" : "password";

            passwordIcon.className = isHidden
                ? "fa-regular fa-eye-slash"
                : "fa-regular fa-eye";

            togglePassword.setAttribute(
                "aria-pressed",
                String(isHidden)
            );

            togglePassword.setAttribute(
                "aria-label",
                isHidden ? "Hide password" : "Show password"
            );
        });
    }


    // Login error message
    const formMessage = document.getElementById("formMessage");

    if (formMessage && formMessage.dataset.loginError === "true") {
        showToast(
            formMessage.textContent.trim(),
            "error",
            "Unable to sign in"
        );

        formMessage.classList.remove("visible");
        formMessage.hidden = true;
    }


    // Google login is not connected yet
    const googleLogin = document.getElementById("googleLogin");

    if (googleLogin) {
        googleLogin.addEventListener("click", function () {

            if (!formMessage) return;

            formMessage.textContent =
                "Google sign-in is not available yet.";

            formMessage.classList.remove("hide");
            formMessage.classList.add("visible");

        });
    }

});
