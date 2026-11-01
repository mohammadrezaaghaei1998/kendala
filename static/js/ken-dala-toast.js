
(function () {
    "use strict";

    window.showToast = function (message, type = "error", title = "") {
        const icons = {
            success: "✓",
            error: "✕",
            warning: "!",
            info: "i"
        };

        const titles = {
            success: "Success",
            error: "Please check",
            warning: "Attention required",
            info: "Ken Dala"
        };

        if (!Object.prototype.hasOwnProperty.call(icons, type)) {
            type = "info";
        }

        const duration = 7000;

        let container = document.getElementById("kd-toast-container");

        if (!container) {
            container = document.createElement("div");
            container.id = "kd-toast-container";
            document.body.appendChild(container);
        }

        // Display the newest notification
        container.querySelectorAll(".kd-toast").forEach(el => el.remove());

        const toast = document.createElement("div");
        toast.className = `kd-toast kd-toast-${type}`;
        toast.style.setProperty("--duration", `${duration}ms`);
        toast.setAttribute("role", type === "error" ? "alert" : "status");

        const icon = document.createElement("div");
        icon.className = "kd-toast-icon";
        icon.textContent = icons[type];

        const body = document.createElement("div");
        body.className = "kd-toast-body";

        const heading = document.createElement("div");
        heading.className = "kd-toast-title";
        heading.textContent = title || titles[type];

        const description = document.createElement("div");
        description.className = "kd-toast-message";
        description.textContent = String(message);

        const close = document.createElement("button");
        close.type = "button";
        close.className = "kd-toast-close";
        close.textContent = "×";
        close.setAttribute("aria-label", "Close notification");

        const progress = document.createElement("div");
        progress.className = "kd-toast-progress";

        body.append(heading, description);
        toast.append(icon, body, close, progress);
        container.appendChild(toast);

        let remaining = duration;
        let started = Date.now();
        let timer;
        let dismissed = false;

        function dismiss() {
            if (dismissed) return;
            dismissed = true;
            clearTimeout(timer);
            toast.classList.add("removing");
            setTimeout(() => toast.remove(), 300);
        }

        function pause() {
            if (dismissed) return;
            clearTimeout(timer);
            remaining = Math.max(0, remaining - (Date.now() - started));
            progress.style.animationPlayState = "paused";
        }

        function resume() {
            if (dismissed) return;
            started = Date.now();
            progress.style.animationPlayState = "running";
            timer = setTimeout(dismiss, remaining);
        }

        close.addEventListener("click", dismiss);
        toast.addEventListener("mouseenter", pause);
        toast.addEventListener("mouseleave", resume);

        resume();
    };
})();
