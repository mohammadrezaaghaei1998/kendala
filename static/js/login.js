        // Show / hide password

        const passwordInput = document.getElementById("password");
        const togglePassword = document.getElementById("togglePassword");
        const passwordIcon = document.getElementById("passwordIcon");

        togglePassword.addEventListener("click", function () {
            const isHidden = passwordInput.type === "password";

            passwordInput.type = isHidden ? "text" : "password";
            passwordIcon.className = isHidden
                ? "fa-regular fa-eye-slash"
                : "fa-regular fa-eye";

            togglePassword.setAttribute("aria-pressed", String(isHidden));
            togglePassword.setAttribute(
                "aria-label",
                isHidden ? "Hide password" : "Show password"
            );
        });

        // Login form UI placeholder.
        // Connect this form to your backend before using it for authentication.

        document.getElementById("loginForm").addEventListener(
            "submit",
            function (event) {
                event.preventDefault();

                const message = document.getElementById("formMessage");

                message.textContent =
                    "Authentication is not connected yet. Please connect your login backend.";

                message.classList.add("visible");
            }
        );

        // Google OAuth placeholder.
        // Replace this handler with your configured Google sign-in flow.

        document.getElementById("googleLogin").addEventListener(
            "click",
            function () {
                alert(
                    "Google sign-in needs to be connected to your authentication provider."
                );
            }
        );
